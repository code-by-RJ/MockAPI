import express    from 'express'
import rateLimit  from 'express-rate-limit'
import { authController }    from '../controllers/authController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = express.Router()

// ── Auth Rate Limiter (register + login only) ───────────────────────
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many attempts. Try again in 15 minutes.' },
})

router.post('/register', authLimiter, authController.register)
router.post('/login',    authLimiter, authController.login)
router.get('/me',        authenticateToken, authController.me)   // no limiter — authenticated route

export default router