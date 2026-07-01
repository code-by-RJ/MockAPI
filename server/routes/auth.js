import express    from 'express'
import rateLimit  from 'express-rate-limit'
import { authController }    from '../controllers/authController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = express.Router()

// ── Rate Limiters ────────────────────────────────────────────────────
// Strict — register/login: 5 req/15min
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
})

// OTP verify (registration): 5 req/15min
// Doc: "OTP Verification — 5 requests/15min"
const otpLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many OTP attempts. Try again in 15 minutes.' },
})

// OTP submission on reset-password — SEPARATE instance from otpLimiter.
// Sharing one instance across both routes would let registration-OTP typos
// from one IP eat into an unrelated user's password-reset attempts on the
// same network (office/NAT/college wifi). Same config, independent bucket.
const otpResetLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many OTP attempts. Try again in 15 minutes.' },
})

// Daily OTP cap (registration OTP only): 15 attempts per day per IP
const otpDailyLimiter = rateLimit({
  windowMs:        24 * 60 * 60 * 1000,
  max:             15,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Daily OTP attempt limit reached. Try again tomorrow.' },
})

// Password reset completion: 3 requests/day — keyed PER USER (email), not IP
// Prevents brute-force abuse of the reset flow while still giving genuine users enough attempts.
const passwordResetDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max:      3,
  keyGenerator: (req) => req.body?.email ? `pwreset:${req.body.email.toLowerCase().trim()}` : `ip:${req.ip}`,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Daily password reset limit reached (3/day). Try again tomorrow.' },
})

// Resend + forgot password: 5 req/hour (prevent email spam)
const emailLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many email requests. Try again in 1 hour.' },
})


// Delete account: 3 req/day — nuclear action, very strict
const deleteAccountLimiter = rateLimit({
  windowMs:        24 * 60 * 60 * 1000,
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many delete attempts. Try again tomorrow.' },
})

// ── Routes ───────────────────────────────────────────────────────────
router.post('/register',         authLimiter,  authController.register)
router.post('/login',            authLimiter,  authController.login)
router.post('/logout',           authController.logout)   // clears the auth cookie — safe to call regardless of auth state
router.get('/me',                authenticateToken, authController.me)

// OTP flows
router.post('/verify-otp',       otpDailyLimiter, otpLimiter,             authController.verifyOtp)
router.post('/verify-reset-otp', otpResetLimiter,                         authController.verifyResetOtp)
router.post('/resend-otp',       emailLimiter,                            authController.resendOtp)
router.post('/forgot-password',  emailLimiter,                            authController.forgotPassword)
router.post('/reset-password',   passwordResetDailyLimiter, otpResetLimiter, authController.resetPassword)

// Protected — profile/settings
router.put('/profile',               authenticateToken, authController.updateProfile)
router.put('/change-password',       authenticateToken, authController.changePassword)
router.post('/request-email-change', authenticateToken, authController.requestEmailChange)
router.post('/confirm-email-change', authenticateToken, authController.confirmEmailChange)
router.delete('/account',            authenticateToken, deleteAccountLimiter, authController.deleteAccount)

export default router