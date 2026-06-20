import User from '../models/User.js'
import jwt  from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { sendVerifyOTP, sendResetOTP } from '../services/emailService.js'

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString()

const OTP_TTL          = 10 * 60 * 1000  // 10 minutes in ms
const RESEND_COOLDOWN   = 60 * 1000      // 60 seconds — doc: "OTP Resend Cooldown"

// Returns ms remaining before resend allowed, or 0 if cooldown has passed / no OTP sent yet
function cooldownRemaining(user) {
  if (!user.otpExpiry) return 0
  const sentAt = user.otpExpiry.getTime() - OTP_TTL
  const elapsed = Date.now() - sentAt
  return elapsed < RESEND_COOLDOWN ? RESEND_COOLDOWN - elapsed : 0
}

export const authController = {

  // ── Register — creates unverified user + sends OTP ──────────────
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body

      if (!name || !email || !password)
        return res.status(400).json({ success: false, error: 'All fields are required' })

      if (password.length < 6)
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })

      const existing = await User.findOne({ email })

      // If user exists but is unverified — allow resend (overwrite OTP)
      if (existing && existing.isVerified)
        return res.status(400).json({ success: false, error: 'Email already in use' })

      const otp       = generateOTP()
      const otpExpiry = new Date(Date.now() + OTP_TTL)
      const hashed    = await bcrypt.hash(password, 10)

      if (existing && !existing.isVerified) {
        // Update existing unverified user
        existing.name      = name
        existing.password  = hashed
        existing.otp       = otp
        existing.otpExpiry = otpExpiry
        existing.otpType   = 'verify'
        await existing.save()
      } else {
        await User.create({
          name, email,
          password:   hashed,
          isVerified: false,
          otp,
          otpExpiry,
          otpType: 'verify',
        })
      }

      await sendVerifyOTP(email, name, otp)

      res.status(201).json({
        success: true,
        message: 'OTP sent to your email. Verify to activate your account.',
        email,
      })
    } catch (err) { next(err) }
  },

  // ── Verify OTP (registration) ────────────────────────────────────
  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body
      if (!email || !otp)
        return res.status(400).json({ success: false, error: 'Email and OTP are required' })

      const user = await User.findOne({ email })
      if (!user)
        return res.status(404).json({ success: false, error: 'No account found with this email' })

      if (user.isVerified)
        return res.status(400).json({ success: false, error: 'Account is already verified. Please sign in.' })

      if (user.otpType !== 'verify')
        return res.status(400).json({ success: false, error: 'Invalid OTP type' })

      if (!user.otp || !user.otpExpiry)
        return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' })

      if (new Date() > user.otpExpiry) {
        user.otp = null; user.otpExpiry = null; user.otpType = null
        await user.save()
        return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' })
      }

      if (user.otp !== otp)
        return res.status(400).json({ success: false, error: 'Incorrect OTP. Try again.' })

      // Clear OTP + mark verified
      user.isVerified = true
      user.otp        = null
      user.otpExpiry  = null
      user.otpType    = null
      await user.save()

      const token = signToken(user)
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
      })
    } catch (err) { next(err) }
  },

  // ── Resend OTP ───────────────────────────────────────────────────
  async resendOtp(req, res, next) {
    try {
      const { email, type } = req.body  // type: 'verify' | 'reset'
      if (!email || !type)
        return res.status(400).json({ success: false, error: 'Email and type are required' })

      const user = await User.findOne({ email })
      if (!user)
        return res.status(404).json({ success: false, error: 'No account found with this email' })

      if (type === 'verify' && user.isVerified)
        return res.status(400).json({ success: false, error: 'Account is already verified.' })

      if (type === 'reset' && !user.isVerified)
        return res.status(400).json({ success: false, error: 'Account is not verified.' })

      const wait = cooldownRemaining(user)
      if (wait > 0) {
        return res.status(429).json({
          success: false,
          error:   `Please wait ${Math.ceil(wait / 1000)}s before requesting a new OTP.`,
          retryAfterMs: wait,
        })
      }

      const otp = generateOTP()
      user.otp       = otp
      user.otpExpiry = new Date(Date.now() + OTP_TTL)
      user.otpType   = type
      await user.save()

      if (type === 'verify') await sendVerifyOTP(email, user.name, otp)
      else                   await sendResetOTP(email, user.name, otp)

      res.json({ success: true, message: 'New OTP sent to your email.' })
    } catch (err) { next(err) }
  },

  // ── Forgot Password — sends reset OTP ───────────────────────────
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body
      if (!email)
        return res.status(400).json({ success: false, error: 'Email is required' })

      const user = await User.findOne({ email })

      // Always return success — don't reveal if email exists (security)
      if (!user || !user.isVerified) {
        return res.json({
          success: true,
          message: 'If an account exists for this email, an OTP has been sent.',
        })
      }

      // Respect resend cooldown silently — don't leak timing info, just skip the send
      if (cooldownRemaining(user) > 0) {
        return res.json({
          success: true,
          message: 'If an account exists for this email, an OTP has been sent.',
        })
      }

      const otp = generateOTP()
      user.otp       = otp
      user.otpExpiry = new Date(Date.now() + OTP_TTL)
      user.otpType   = 'reset'
      await user.save()

      await sendResetOTP(email, user.name, otp)

      res.json({
        success: true,
        message: 'If an account exists for this email, an OTP has been sent.',
      })
    } catch (err) { next(err) }
  },

  // ── Reset Password ───────────────────────────────────────────────
  async resetPassword(req, res, next) {
    try {
      const { email, otp, password } = req.body
      if (!email || !otp || !password)
        return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' })

      if (password.length < 6)
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })

      const user = await User.findOne({ email })
      if (!user || !user.isVerified)
        return res.status(404).json({ success: false, error: 'No verified account found with this email' })

      if (user.otpType !== 'reset')
        return res.status(400).json({ success: false, error: 'No password reset was requested for this account' })

      if (!user.otp || !user.otpExpiry)
        return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' })

      if (new Date() > user.otpExpiry) {
        user.otp = null; user.otpExpiry = null; user.otpType = null
        await user.save()
        return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' })
      }

      if (user.otp !== otp)
        return res.status(400).json({ success: false, error: 'Incorrect OTP. Try again.' })

      // Update password + clear OTP
      user.password  = await bcrypt.hash(password, 10)
      user.otp       = null
      user.otpExpiry = null
      user.otpType   = null
      await user.save()

      res.json({ success: true, message: 'Password reset successfully. You can now sign in.' })
    } catch (err) { next(err) }
  },

  // ── Login ────────────────────────────────────────────────────────
  async login(req, res, next) {
    try {
      const { email, password } = req.body

      if (!email || !password)
        return res.status(400).json({ success: false, error: 'Email and password required' })

      const user = await User.findOne({ email })
      if (!user)
        return res.status(401).json({ success: false, error: 'No account found with this email.' })

      // Check lockout
      if (user.lockUntil && user.lockUntil > new Date()) {
        const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000)
        return res.status(423).json({
          success:   false,
          error:     `Account locked. Try again in ${remaining} min${remaining > 1 ? 's' : ''}.`,
          isLocked:  true,
          lockUntil: user.lockUntil,
        })
      }

      // If lockUntil has passed — reset and persist immediately
      if (user.lockUntil && user.lockUntil <= new Date()) {
        user.lockUntil     = null
        user.loginAttempts = 0
        await user.save()
      }

      const valid = await bcrypt.compare(password, user.password)

      if (!valid) {
        user.loginAttempts = (user.loginAttempts || 0) + 1

        if (user.loginAttempts >= 3) {
          user.lockUntil     = new Date(Date.now() + 15 * 60 * 1000)
          user.loginAttempts = 0
          await user.save()
          return res.status(423).json({
            success:  false,
            error:    'Too many wrong attempts. Account locked for 15 minutes.',
            isLocked: true,
            lockUntil: user.lockUntil,
          })
        }

        await user.save()
        const left = 3 - user.loginAttempts
        return res.status(401).json({
          success:      false,
          error:        `Incorrect password. ${left} attempt${left === 1 ? '' : 's'} remaining.`,
          attemptsLeft: left,
        })
      }

      // Correct password — reset attempt counter
      if (user.loginAttempts > 0 || user.lockUntil) {
        user.loginAttempts = 0
        user.lockUntil     = null
        await user.save()
      }

      const token = signToken(user)
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
      })
    } catch (err) { next(err) }
  },

  // ── Me ───────────────────────────────────────────────────────────
  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.userId).select('-password -otp -otpExpiry -otpType -loginAttempts -lockUntil')
      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      res.json({ success: true, user })
    } catch (err) { next(err) }
  },
}