import express    from 'express'
import Project     from '../models/Project.js'
import Resource    from '../models/Resource.js'
import DynamicData from '../models/DynamicData.js'
import { authenticateToken } from '../middlewares/auth.js'
import { getProjectLogs }    from '../controllers/resourceController.js'  // Phase 4
import { invalidate }        from '../services/cacheService.js'

const router = express.Router()

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base) {
  let slug = slugify(base)
  let i    = 1
  while (await Project.findOne({ slug })) {
    slug = `${slugify(base)}-${i++}`
  }
  return slug
}

// ── Phase 2 routes ───────────────────────────────────────────────────────────

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.userId }).sort({ createdAt: -1 })
    res.json({ data: projects })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/projects
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, isPublic = false } = req.body
    if (!name) return res.status(400).json({ message: 'Project name is required' })

    const slug    = await uniqueSlug(name)
    const project = await Project.create({ name, slug, owner: req.user.userId, isPublic })

    res.status(201).json({ message: 'Project created', project })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/projects/:slug
router.delete('/:slug', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    // Cascade delete everything owned by this project
    const resources = await Resource.find({ projectId: project._id })
    await Resource.deleteMany({ projectId: project._id })
    if (resources.length > 0) {
      await DynamicData.deleteMany({ projectId: project._id })
    }

    invalidate(req.params.slug)
    res.json({ message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── Phase 4 ───────────────────────────────────────────────────────────────────

// GET /api/projects/:slug/logs
// ⚠ Must come BEFORE the resource sub-router is mounted in index.js
//   so this route isn't swallowed by the wildcard engine route
router.get('/:slug/logs', authenticateToken, getProjectLogs)

export default router