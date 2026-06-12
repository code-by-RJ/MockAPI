import express   from 'express'
import cors      from 'cors'
import dotenv    from 'dotenv'
import mongoose  from 'mongoose'
import { errorHandler } from './middlewares/errorHandler.js'

import authRoutes     from './routes/auth.js'
import projectRoutes  from './routes/projects.js'
import resourceRoutes from './routes/resources.js'
import engineRoutes   from './routes/engine.js'

dotenv.config()

const app  = express()
const PORT = parseInt(process.env.PORT) || 8000

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── DB ──────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mockapi')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err))

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/auth',                     authRoutes)
app.use('/api/projects',                 projectRoutes)
app.use('/api/projects/:slug/resources', resourceRoutes)
app.use('/api',                          engineRoutes)   // LAST — wildcard :slug/:resource

// ── Health ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }))

// Bug 10 fix: correct order — 404 handler BEFORE errorHandler
// Previously errorHandler was first, making 404 unreachable
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
app.use(errorHandler)

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

export default app