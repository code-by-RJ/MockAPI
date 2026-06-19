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

// OTP verify + reset: 10 req/15min (lenient — user may mistype)
const otpLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many OTP attempts. Try again in 15 minutes.' },
})

// Resend + forgot password: 3 req/hour (prevent email spam)
const emailLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,  // 1 hour
  max:             3,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many email requests. Try again in 1 hour.' },
})

// ── Routes ───────────────────────────────────────────────────────────
router.post('/register',         authLimiter,  authController.register)
router.post('/login',            authLimiter,  authController.login)
router.get('/me',                authenticateToken, authController.me)

// OTP flows
router.post('/verify-otp',       otpLimiter,   authController.verifyOtp)
router.post('/resend-otp',       emailLimiter, authController.resendOtp)
router.post('/forgot-password',  emailLimiter, authController.forgotPassword)
router.post('/reset-password',   otpLimiter,   authController.resetPassword)

export default router