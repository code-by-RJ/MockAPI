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
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const resources = await Resource.find({ projectId: project._id }).sort({ createdAt: -1 })
    res.json({ data: resources })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// POST /api/projects/:slug/resources
export const createResource = async (req, res) => {
  try {
    const { name, schema = [] } = req.body
    if (!name) return res.status(400).json({ message: 'Resource name is required' })

    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const resource = await Resource.create({
      name:      name.toLowerCase().trim(),
      projectId: project._id,
      schema,
      errorRate: 0,
      delay:     0
    })

    // Auto-seed 10 fake records if schema has fields
    if (schema.length > 0) {
      const fakeRecords = generateFakeData(schema, 10)
      await DynamicData.insertMany(
        fakeRecords.map(d => ({
          projectId:    project._id,
          resourceName: resource.name,
          data:         d
        }))
      )
    }

    res.status(201).json({ message: 'Resource created', resource })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Resource name already exists in this project' })
    }
    res.status(500).json({ message: err.message })
  }
}

// PUT /api/projects/:slug/resources/:name
export const updateResource = async (req, res) => {
  try {
    const { schema } = req.body
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const resource = await Resource.findOneAndUpdate(
      { projectId: project._id, name: req.params.name },
      { schema },
      { new: true }
    )
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    res.json({ message: 'Resource updated', resource })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// DELETE /api/projects/:slug/resources/:name
export const deleteResource = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const resource = await Resource.findOneAndDelete({ projectId: project._id, name: req.params.name })
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    // Cascade delete data + logs for this resource
    await Promise.all([
      DynamicData.deleteMany({ projectId: project._id, resourceName: req.params.name }),
      RequestLog.deleteMany({ projectId: project._id, resourceName: req.params.name })
    ])

    invalidate(req.params.slug)
    res.json({ message: 'Resource deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ── Phase 4 ─────────────────────────────────────────────────────────────────

// PATCH /api/projects/:slug/resources/:name/config
export const updateResourceConfig = async (req, res) => {
  try {
    const { slug, name } = req.params
    const { errorRate, delay } = req.body

    const project = await Project.findOne({ slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const update = {}
    if (errorRate !== undefined) update.errorRate = Math.min(1, Math.max(0, Number(errorRate)))
    if (delay !== undefined)     update.delay     = Math.min(5000, Math.max(0, Number(delay)))

    const resource = await Resource.findOneAndUpdate(
      { projectId: project._id, name },
      update,
      { new: true }
    )
    if (!resource) return res.status(404).json({ message: 'Resource not found' })

    res.json({ message: 'Config updated', resource })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// GET /api/projects/:slug/logs
export const getProjectLogs = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, owner: req.user.userId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const logs = await RequestLog
      .find({ projectId: project._id })
      .sort({ timestamp: -1 })
      .limit(100)

    res.json({ data: logs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}