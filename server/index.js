import express      from 'express'
import cors         from 'cors'
import compression  from 'compression'
import dotenv       from 'dotenv'
import mongoose     from 'mongoose'
import rateLimit    from 'express-rate-limit'
import jwt          from 'jsonwebtoken'
import { errorHandler } from './middlewares/errorHandler.js'

import authRoutes     from './routes/auth.js'
import projectRoutes  from './routes/projects.js'
import resourceRoutes from './routes/resources.js'
import engineRoutes   from './routes/engine.js'

dotenv.config()

// ── Env Validation (fail fast) ──────────────────────────────────────
const REQUIRED_ALWAYS   = ['JWT_SECRET']
const REQUIRED_IN_PROD  = ['MONGODB_URI', 'CLIENT_URL']

const missing = [
  ...REQUIRED_ALWAYS.filter(k => !process.env[k]),
  ...(process.env.NODE_ENV === 'production' ? REQUIRED_IN_PROD.filter(k => !process.env[k]) : []),
]

if (missing.length > 0) {
  console.error('[ENV] Missing required environment variables:')
  missing.forEach(k => console.error(`  - ${k}`))
  console.error('  Add these to your .env file and restart the server.')
  process.exit(1)
}

const app  = express()
const PORT = parseInt(process.env.PORT) || 8000

// Trust proxy — required for correct req.ip behind Render / reverse proxies
// Without this, rate limiter sees proxy IP instead of real client IP
app.set('trust proxy', 1)

// ── Rate Limiters ───────────────────────────────────────────────────

// 15-min burst limiter — already in place
const engineLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: 'Too many requests. Try again in 15 minutes.' },
})

// Daily limiter — keyed by userId (JWT) or IP fallback
// Authenticated users: 500 req/day  |  Unauthenticated (IP): 300 req/day
const engineDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours

  // Soft-decode JWT — no blocking, just for key + limit determination
  keyGenerator: (req) => {
    try {
      const auth = req.headers.authorization
      if (auth?.startsWith('Bearer ')) {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
        return `user:${decoded.userId}`
      }
    } catch {}
    return `ip:${req.ip}`
  },

  max: (req) => {
    try {
      const auth = req.headers.authorization
      if (auth?.startsWith('Bearer ')) {
        jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET)
        return 1000  // authenticated user
      }
    } catch {}
    return 300      // unauthenticated / IP fallback
  },

  standardHeaders: true,   // sends RateLimit-* headers to client
  legacyHeaders:   false,

  handler: (_req, res, _next, options) => {
    res.status(429).json({
      success:    false,
      error:      'Daily request limit reached. Try again tomorrow.',
      code:       429,
      limit:      options.max,
      resetAt:    new Date(Date.now() + options.windowMs).toISOString(),
    })
  },
})

// ── Middleware ──────────────────────────────────────────────────────
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL                               // prod: CLIENT_URL must be set (no fallback)
  : (process.env.CLIENT_URL || 'http://localhost:5173')  // dev: localhost fallback ok

app.use(cors({
  origin:      corsOrigin,
  credentials: true,
}))
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── DB ──────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mockapi')
  .then(() => console.log('[DB] MongoDB connected'))
  .catch((err) => console.error('[DB] Connection error:', err))

// ── Health (BEFORE engine wildcard) ─────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }))

// ── Routes (order is CRITICAL) ──────────────────────────────────────
app.use('/api/auth',                     authRoutes)
app.use('/api/projects',                 projectRoutes)
app.use('/api/projects/:slug/resources', resourceRoutes)
app.use('/api',                          engineDailyLimiter, engineLimiter, engineRoutes)  // LAST — wildcard :slug/:resource

// ── Error Handling ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use(errorHandler)

app.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`))

export default app