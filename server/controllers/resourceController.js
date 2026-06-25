import Project     from '../models/Project.js'
import Resource    from '../models/Resource.js'
import DynamicData from '../models/DynamicData.js'
import RequestLog  from '../models/RequestLog.js'
import { generateFakeData } from '../services/fakerService.js'
import { invalidate }       from '../services/cacheService.js'

// ── Phase 3 ─────────────────────────────────────────────────────────────────

// GET /api/projects/:slug/resources
export const getResources = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const resources = await Resource.find({ projectId: project._id }).sort({ createdAt: -1 })
    res.json({ success: true, data: resources })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/projects/:slug/resources
export const createResource = async (req, res) => {
  try {
    const { name, schema = [] } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Resource name is required' })

    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    // Priority 4 — DB overflow protection: max 10 resources per project
    const resourceCount = await Resource.countDocuments({ projectId: project._id })
    if (resourceCount >= 10) {
      return res.status(403).json({ success: false, error: 'Resource limit reached (max 10 per project)' })
    }

    const resource = await Resource.create({
      name:      name.toLowerCase().trim(),
      projectId: project._id,
      schema,
      errorRate: 0,
      delay:     0
    })

    // Auto-seed 10 fake records if schema has fields
    // Priority 4 — cap at 500 records per resource
    if (schema.length > 0) {
      const existingCount = await DynamicData.countDocuments({
        projectId: project._id,
        resourceName: resource.name
      })
      if (existingCount < 500) {
        const seedCount = Math.min(10, 500 - existingCount)
        const fakeRecords = generateFakeData(schema, seedCount)
        await DynamicData.insertMany(
          fakeRecords.map(d => ({
            projectId:    project._id,
            resourceName: resource.name,
            data:         d
          }))
        )
      }
    }

    res.status(201).json({ success: true, message: 'Resource created', resource })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Resource name already exists in this project' })
    }
    res.status(500).json({ success: false, error: err.message })
  }
}

// PUT /api/projects/:slug/resources/:name
export const updateResource = async (req, res) => {
  try {
    const { schema } = req.body
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const resource = await Resource.findOneAndUpdate(
      { projectId: project._id, name: req.params.name },
      { schema },
      { new: true }
    )
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' })

    res.json({ success: true, message: 'Resource updated', resource })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// DELETE /api/projects/:slug/resources/:name
export const deleteResource = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const resource = await Resource.findOneAndDelete({ projectId: project._id, name: req.params.name })
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' })

    // Cascade delete data + logs for this resource
    await Promise.all([
      DynamicData.deleteMany({ projectId: project._id, resourceName: req.params.name }),
      RequestLog.deleteMany({ projectId: project._id, resourceName: req.params.name })
    ])

    invalidate(req.params.slug)
    res.json({ success: true, message: 'Resource deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ── Phase 4 ─────────────────────────────────────────────────────────────────

// PATCH /api/projects/:slug/resources/:name/config
export const updateResourceConfig = async (req, res) => {
  try {
    const { slug, name } = req.params
    const { errorRate, delay } = req.body

    const project = await Project.findOne({ slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const update = {}
    if (errorRate !== undefined) update.errorRate = Math.min(1, Math.max(0, Number(errorRate)))
    if (delay !== undefined)     update.delay     = Math.min(5000, Math.max(0, Number(delay)))

    const resource = await Resource.findOneAndUpdate(
      { projectId: project._id, name },
      update,
      { new: true }
    )
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' })

    res.json({ success: true, message: 'Config updated', resource })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/projects/:slug/logs
export const getProjectLogs = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const logs = await RequestLog
      .find({ projectId: project._id })
      .sort({ timestamp: -1 })
      .limit(100)

    res.json({ success: true, data: logs })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ── Priority 4 ────────────────────────────────────────────────────────────────

// POST /api/projects/:slug/resources/:name/seed
// Re-seeds: deletes existing records, generates 10 fresh faker records
// Only works if resource has schema fields defined
export const seedResource = async (req, res) => {
  try {
    const { slug, name } = req.params

    const project = await Project.findOne({ slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' })

    const resource = await Resource.findOne({ projectId: project._id, name })
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found' })

    if (!resource.schema || resource.schema.length === 0) {
      return res.status(400).json({ success: false, error: 'Resource has no schema fields — add fields before seeding' })
    }

    // Replace all existing records for this resource
    await DynamicData.deleteMany({ projectId: project._id, resourceName: name })

    const fakeRecords = generateFakeData(resource.schema, 10)
    await DynamicData.insertMany(
      fakeRecords.map(d => ({
        projectId:    project._id,
        resourceName: name,
        data:         d
      }))
    )

    res.json({ success: true, message: `Re-seeded "${name}" with 10 fresh records`, count: 10 })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}