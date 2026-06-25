import express      from 'express'
import cors         from 'cors'
import compression  from 'compression'
import dotenv       from 'dotenv'
import rateLimit    from 'express-rate-limit'
import jwt          from 'jsonwebtoken'
import helmet       from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { errorHandler } from './middlewares/errorHandler.js'

import authRoutes     from './routes/auth.js'
import projectRoutes  from './routes/projects.js'
import resourceRoutes from './routes/resources.js'
import engineRoutes   from './routes/engine.js'

// Pure app factory — no app.listen(), no real mongoose.connect() call, no top-level
// process.exit(). Split out of index.js so tests can import a configured app without
// side effects (binding the real PORT, connecting to the real MONGODB_URI).
//
// dotenv.config() runs HERE (not just in index.js) because ESM hoists imports —
// `import app from './app.js'` in index.js fully evaluates this file BEFORE
// index.js's own dotenv.config() line runs. Without this, corsOrigin below would
// read undefined env vars. Calling dotenv.config() twice (once here, once in
// index.js) is harmless — it's idempotent.
dotenv.config()
const app = express()

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
// Authenticated users: 1000 req/day  |  Unauthenticated (IP): 300 req/day
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

  handler: (req, res, _next, options) => {
    const limit = typeof options.max === 'function' ? options.max(req) : options.max
    res.status(429).json({
      success: false,
      error:   'Daily request limit reached. Try again tomorrow.',
      code:    429,
      limit,
      resetAt: new Date(Date.now() + options.windowMs).toISOString(),
    })
  },
})

// ── Middleware ──────────────────────────────────────────────────────
const corsOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL                               // prod: CLIENT_URL must be set (no fallback)
  : (process.env.CLIENT_URL || 'http://localhost:5173')  // dev: localhost fallback ok

app.use(helmet())
app.use(cors({
  origin:      corsOrigin,
  credentials: true,
}))
app.use(compression())
app.use(express.json({ limit: '50kb' }))
app.use(express.urlencoded({ extended: true, limit: '50kb' }))
// NoSQL injection guard — strips $ and . keys from body/query/params.
// Runs after body parsing so req.body is actually populated by the time it sanitizes.
app.use(mongoSanitize())

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

export default app