import express      from 'express'
import cors         from 'cors'
import compression  from 'compression'
import dotenv       from 'dotenv'
import mongoose     from 'mongoose'
import rateLimit    from 'express-rate-limit'
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
const engineLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,  // 15 minutes
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { success: false, error: 'Too many requests. Try again in 15 minutes.' },
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
app.use('/api',                          engineLimiter, engineRoutes)  // LAST — wildcard :slug/:resource

// ── Error Handling ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use(errorHandler)

app.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`))

export default app