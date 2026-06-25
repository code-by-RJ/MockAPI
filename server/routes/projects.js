import express    from 'express'
import Project     from '../models/Project.js'
import Resource    from '../models/Resource.js'
import DynamicData from '../models/DynamicData.js'
import RequestLog  from '../models/RequestLog.js'
import { authenticateToken } from '../middlewares/auth.js'
import { getProjectLogs }    from '../controllers/resourceController.js'  // Phase 4
import { invalidate }        from '../services/cacheService.js'

const router = express.Router()

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uniqueSlug(base, excludeId = null) {
  let slug = slugify(base)
  let i    = 1
  while (true) {
    const existing = await Project.findOne({ slug })
    if (!existing || (excludeId && existing._id.equals(excludeId))) break
    slug = `${slugify(base)}-${i++}`
  }
  return slug
}

// ── Phase 2 routes ───────────────────────────────────────────────────────────

// GET /api/projects — includes resourceCount per project
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.userId }).sort({ createdAt: -1 })
    const counts   = await Promise.all(projects.map(p => Resource.countDocuments({ projectId: p._id })))
    const data     = projects.map((p, i) => ({ ...p.toObject(), resourceCount: counts[i] }))
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/projects
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, isPublic = false } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Project name is required' })

    // Priority 4 — DB overflow protection: max 5 projects per user
    const projectCount = await Project.countDocuments({ owner: req.user.userId })
    if (projectCount >= 5) {
      return res.status(403).json({ success: false, error: 'Project limit reached (max 5)' })
    }

    const slug    = await uniqueSlug(name)
    const project = await Project.create({ name, slug, owner: req.user.userId, isPublic })

    res.status(201).json({ success: true, message: 'Project created', project })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/projects/:slug — rename + isPublic toggle
router.patch('/:slug', authenticateToken, async (req, res) => {
  try {
    const { name, isPublic } = req.body

    if (name === undefined && isPublic === undefined) {
      return res.status(400).json({ success: false, error: 'Nothing to update — provide name and/or isPublic' })
    }

    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    let slugChanged = false

    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) return res.status(400).json({ success: false, error: 'Project name cannot be empty' })

      if (trimmed !== project.name) {
        project.name = trimmed
        const newSlug = await uniqueSlug(trimmed, project._id)
        if (newSlug !== project.slug) {
          slugChanged = true
          // Invalidate old slug from cache before changing it
          invalidate(project.slug)
          project.slug = newSlug
        }
      }
    }

    if (isPublic !== undefined) {
      project.isPublic = isPublic === true || isPublic === 'true'
    }

    await project.save()
    invalidate(project.slug)  // always invalidate current slug post-save

    res.json({
      success: true,
      message: 'Project updated',
      project,
      slugChanged,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/projects/:slug
router.delete('/:slug', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    // Cascade delete everything owned by this project
    const resources = await Resource.find({ projectId: project._id })
    await Resource.deleteMany({ projectId: project._id })
    if (resources.length > 0) {
      await Promise.all([
        DynamicData.deleteMany({ projectId: project._id }),
        RequestLog.deleteMany({ projectId: project._id })
      ])
    }

    invalidate(req.params.slug)
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── Phase 4 ───────────────────────────────────────────────────────────────────

// GET /api/projects/:slug/logs
// ⚠ Must come BEFORE the resource sub-router is mounted in index.js
//   so this route isn't swallowed by the wildcard engine route
router.get('/:slug/logs', authenticateToken, getProjectLogs)

export default router