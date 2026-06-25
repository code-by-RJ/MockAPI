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

// OTP stored hashed — DB leak should not expose active OTPs.
// Low rounds since OTP is short-lived (10 min) and 6-digit numeric (low entropy anyway).
const hashOtp    = (otp) => bcrypt.hash(otp, 6)
const compareOtp = (otp, hash) => hash ? bcrypt.compare(otp, hash) : Promise.resolve(false)

// Email is the lookup key — normalize everywhere so "User@Gmail.com" and
// "user@gmail.com" always resolve to the same account.
const normalizeEmail = (email) => String(email || '').toLowerCase().trim()

// Letters + numbers, 8+ chars. Frontend mirrors this exact pattern.
const STRONG_PASSWORD = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/

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

      if (!STRONG_PASSWORD.test(password))
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters and include both letters and numbers',
        })

      const normalizedEmail = normalizeEmail(email)
      const existing = await User.findOne({ email: normalizedEmail })

      // If user exists but is unverified — allow resend (overwrite OTP)
      if (existing && existing.isVerified)
        return res.status(400).json({ success: false, error: 'Email already in use' })

      const otp       = generateOTP()
      const otpExpiry = new Date(Date.now() + OTP_TTL)
      const hashed     = await bcrypt.hash(password, 10)
      const hashedOtp  = await hashOtp(otp)

      if (existing && !existing.isVerified) {
        // Update existing unverified user
        existing.name      = name
        existing.password  = hashed
        existing.otp       = hashedOtp
        existing.otpExpiry = otpExpiry
        existing.otpType   = 'verify'
        await existing.save()
      } else {
        await User.create({
          name, email: normalizedEmail,
          password:   hashed,
          isVerified: false,
          otp:        hashedOtp,
          otpExpiry,
          otpType: 'verify',
        })
      }

      await sendVerifyOTP(normalizedEmail, name, otp)

      res.status(201).json({
        success: true,
        message: 'OTP sent to your email. Verify to activate your account.',
        email: normalizedEmail,
      })
    } catch (err) { next(err) }
  },

  // ── Verify OTP (registration) ────────────────────────────────────
  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body
      if (!email || !otp)
        return res.status(400).json({ success: false, error: 'Email and OTP are required' })

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })
      if (!user)
        return res.status(404).json({ success: false, error: 'If an account exists, an OTP has been sent.' })

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

      const isValid = await compareOtp(otp, user.otp)
      if (!isValid)
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

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })
      if (!user)
        return res.status(404).json({ success: false, error: 'If an account exists, an OTP has been sent.' })

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
      user.otp       = await hashOtp(otp)
      user.otpExpiry = new Date(Date.now() + OTP_TTL)
      user.otpType   = type
      await user.save()

      if (type === 'verify') await sendVerifyOTP(normalizedEmail, user.name, otp)
      else                   await sendResetOTP(normalizedEmail, user.name, otp)

      res.json({ success: true, message: 'New OTP sent to your email.' })
    } catch (err) { next(err) }
  },

  // ── Forgot Password — sends reset OTP ───────────────────────────
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body
      if (!email)
        return res.status(400).json({ success: false, error: 'Email is required' })

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })

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
      user.otp       = await hashOtp(otp)
      user.otpExpiry = new Date(Date.now() + OTP_TTL)
      user.otpType   = 'reset'
      await user.save()

      await sendResetOTP(normalizedEmail, user.name, otp)

      res.json({
        success: true,
        message: 'If an account exists for this email, an OTP has been sent.',
      })
    } catch (err) { next(err) }
  },

  // ── Verify Reset OTP — check-only, does NOT clear the OTP ───────
  // Lets VerifyOTP.jsx show "Incorrect OTP" inline instead of silently
  // navigating to ResetPassword and only failing at final submit.
  // resetPassword() re-verifies + actually consumes the OTP on submit.
  async verifyResetOtp(req, res, next) {
    try {
      const { email, otp } = req.body
      if (!email || !otp)
        return res.status(400).json({ success: false, error: 'Email and OTP are required' })

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })
      if (!user || !user.isVerified)
        return res.status(404).json({ success: false, error: 'If an account exists, an OTP has been sent.' })

      if (user.otpType !== 'reset')
        return res.status(400).json({ success: false, error: 'No password reset was requested for this account' })

      if (!user.otp || !user.otpExpiry)
        return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' })

      if (new Date() > user.otpExpiry)
        return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' })

      const isValid = await compareOtp(otp, user.otp)
      if (!isValid)
        return res.status(400).json({ success: false, error: 'Incorrect OTP. Try again.' })

      res.json({ success: true })
    } catch (err) { next(err) }
  },

  // ── Reset Password ───────────────────────────────────────────────
  async resetPassword(req, res, next) {
    try {
      const { email, otp, password } = req.body
      if (!email || !otp || !password)
        return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' })

      if (!STRONG_PASSWORD.test(password))
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters and include both letters and numbers',
        })

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })
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

      const isValid = await compareOtp(otp, user.otp)
      if (!isValid)
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

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })
      if (!user)
        return res.status(401).json({ success: false, error: 'Invalid email or password' })

      if (!user.isVerified)
        return res.status(403).json({ success: false, error: 'Please verify your email first.' })

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

  // ── Update Profile (name only) ───────────────────────────────────
  async updateProfile(req, res, next) {
    try {
      const { name } = req.body
      if (!name || !name.trim())
        return res.status(400).json({ success: false, error: 'Name is required' })
      if (name.trim().length < 2)
        return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' })

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { name: name.trim() },
        { new: true }
      ).select('-password -otp -otpExpiry -otpType -loginAttempts -lockUntil -pendingEmail')

      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      res.json({ success: true, user })
    } catch (err) { next(err) }
  },

  // ── Change Password ───────────────────────────────────────────────
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword)
        return res.status(400).json({ success: false, error: 'Both current and new password are required' })

      if (!STRONG_PASSWORD.test(newPassword))
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters and include both letters and numbers',
        })

      const user = await User.findById(req.user.userId)
      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid)
        return res.status(401).json({ success: false, error: 'Current password is incorrect' })

      const sameAsOld = await bcrypt.compare(newPassword, user.password)
      if (sameAsOld)
        return res.status(400).json({ success: false, error: 'New password must be different from current password' })

      user.password = await bcrypt.hash(newPassword, 10)
      await user.save()

      res.json({ success: true, message: 'Password updated successfully' })
    } catch (err) { next(err) }
  },

  // ── Request Email Change — verify pw, send OTP to new email ──────
  async requestEmailChange(req, res, next) {
    try {
      const { currentPassword, newEmail } = req.body
      if (!currentPassword || !newEmail)
        return res.status(400).json({ success: false, error: 'Current password and new email are required' })

      const normalizedNew = normalizeEmail(newEmail)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNew))
        return res.status(400).json({ success: false, error: 'Enter a valid email address' })

      const user = await User.findById(req.user.userId)
      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid)
        return res.status(401).json({ success: false, error: 'Current password is incorrect' })

      if (normalizedNew === normalizeEmail(user.email))
        return res.status(400).json({ success: false, error: 'New email must be different from current email' })

      const taken = await User.findOne({ email: normalizedNew })
      if (taken)
        return res.status(400).json({ success: false, error: 'This email is already in use' })

      const wait = cooldownRemaining(user)
      if (wait > 0)
        return res.status(429).json({
          success: false,
          error: `Please wait ${Math.ceil(wait / 1000)}s before requesting a new OTP.`,
          retryAfterMs: wait,
        })

      const otp = generateOTP()
      user.otp          = await hashOtp(otp)
      user.otpExpiry    = new Date(Date.now() + OTP_TTL)
      user.otpType      = 'email-change'
      user.pendingEmail = normalizedNew
      await user.save()

      await sendVerifyOTP(normalizedNew, user.name, otp)

      res.json({ success: true, message: `OTP sent to ${normalizedNew}. Enter it to confirm the change.` })
    } catch (err) { next(err) }
  },

  // ── Confirm Email Change — verify OTP, swap email ────────────────
  async confirmEmailChange(req, res, next) {
    try {
      const { otp } = req.body
      if (!otp)
        return res.status(400).json({ success: false, error: 'OTP is required' })

      const user = await User.findById(req.user.userId)
      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      if (user.otpType !== 'email-change' || !user.pendingEmail)
        return res.status(400).json({ success: false, error: 'No email change was requested' })

      if (!user.otp || !user.otpExpiry)
        return res.status(400).json({ success: false, error: 'No OTP found. Request a new one.' })

      if (new Date() > user.otpExpiry) {
        user.otp = null; user.otpExpiry = null; user.otpType = null; user.pendingEmail = null
        await user.save()
        return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' })
      }

      const isValid = await compareOtp(otp, user.otp)
      if (!isValid)
        return res.status(400).json({ success: false, error: 'Incorrect OTP. Try again.' })

      // Race condition guard — re-check email not taken in the meantime
      const taken = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } })
      if (taken) {
        user.otp = null; user.otpExpiry = null; user.otpType = null; user.pendingEmail = null
        await user.save()
        return res.status(400).json({ success: false, error: 'This email was just taken by another account. Try a different one.' })
      }

      user.email        = user.pendingEmail
      user.pendingEmail = null
      user.otp          = null
      user.otpExpiry    = null
      user.otpType      = null
      await user.save()

      res.json({
        success: true,
        message: 'Email updated successfully',
        user: { id: user._id, name: user.name, email: user.email },
      })
    } catch (err) { next(err) }
  },
}