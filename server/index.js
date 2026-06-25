import dotenv   from 'dotenv'
import mongoose from 'mongoose'
import app      from './app.js'

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

const PORT = parseInt(process.env.PORT) || 8000

// ── DB ──────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mockapi')
  .then(() => console.log('[DB] MongoDB connected'))
  .catch((err) => console.error('[DB] Connection error:', err))

app.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`))