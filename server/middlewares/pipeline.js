import jwt          from 'jsonwebtoken'
import Resource    from '../models/Resource.js'
import DynamicData from '../models/DynamicData.js'
import RequestLog  from '../models/RequestLog.js'
import { getProject }             from '../services/cacheService.js'
import { buildZodSchema }         from '../services/schemaService.js'
import { parseQuery, toMongoSort } from '../services/queryService.js'

// Bug 2 fix: use toMongoSort(sort) — parseQuery already returns sort as object
// Bug 3 fix: spread filter directly — parseQuery already returns filter as mongo query object

export async function engineHandler(req, res) {
  const startTime = Date.now()
  let _project  = null
  let _resource = null

  // Logging — fires after response sent, never blocks
  res.on('finish', async () => {
    if (!_project || !_resource) return
    try {
      await RequestLog.create({
        projectId:    _project._id,
        resourceName: _resource.name,
        method:       req.method,
        path:         req.originalUrl,
        statusCode:   res.statusCode,
        duration:     Date.now() - startTime
      })
      // Keep only last 100 logs per project
      const excess = await RequestLog
        .find({ projectId: _project._id })
        .sort({ timestamp: -1 })
        .skip(100)
        .select('_id')
      if (excess.length > 0) {
        await RequestLog.deleteMany({ _id: { $in: excess.map(l => l._id) } })
      }
    } catch (_) { /* fail silently */ }
  })

  try {
    // ── Step 1 — Project ─────────────────────────────────────────────
    const project = await getProject(req.params.slug)
    if (!project) return res.status(404).json({ success: false, error: 'Project not found', code: 404 })
    _project = project

    // ── Step 1b — Visibility guard ────────────────────────────────────
    // Private project → only the owner (valid JWT) can hit this engine route
    if (!project.isPublic) {
      const authHeader = req.headers.authorization
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
      let ownerId = null

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET)
          ownerId = decoded.userId
        } catch { /* invalid/expired token — treated as unauthenticated below */ }
      }

      if (!ownerId || ownerId !== project.owner.toString()) {
        return res.status(403).json({ success: false, error: 'This project is private', code: 403 })
      }
    }

    // ── Step 2 — Resource ────────────────────────────────────────────
    const resource = await Resource.findOne({ projectId: project._id, name: req.params.resource })
    if (!resource) return res.status(404).json({ success: false, error: 'Resource not found', code: 404 })
    _resource = resource

    // ── Error Simulation ─────────────────────────────────────────────
    if (resource.errorRate > 0 && Math.random() < resource.errorRate) {
      return res.status(500).json({ success: false, error: 'Simulated server error', code: 500 })
    }
    if (resource.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, resource.delay))
    }

    // ── Step 3 — Schema ──────────────────────────────────────────────
    const zodSchema = buildZodSchema(resource.schema)

    // ── Step 4 — Query parse ─────────────────────────────────────────
    // parseQuery returns:
    //   sort   → already parsed object e.g. { price: 1, createdAt: -1 }
    //   filter → already mongo query e.g. { "data.name": { $regex: "john", $options: "i" } }
    const { page, limit, sort, filter } = parseQuery(req.query)

    // Bug 2 fix: toMongoSort converts { price: 1 } → { "data.price": 1 } properly
    const mongoSort = toMongoSort(sort)

    const { id }      = req.params
    const baseFilter  = { projectId: project._id, resourceName: resource.name }

    // ── GET list ─────────────────────────────────────────────────────
    if (req.method === 'GET' && !id) {
      // Bug 3 fix: filter is already a mongo query object — spread directly
      const query = { ...baseFilter, ...filter }

      const [total, records] = await Promise.all([
        DynamicData.countDocuments(query),
        DynamicData.find(query)
          .sort(mongoSort)
          .skip((page - 1) * limit)
          .limit(limit)
      ])

      return res.json({
        success: true,
        count:   records.length,
        total,
        page,
        data:    records.map(r => ({ _id: r._id, ...r.data }))
      })
    }

    // ── GET single ───────────────────────────────────────────────────
    if (req.method === 'GET' && id) {
      const record = await DynamicData.findOne({ _id: id, ...baseFilter })
      if (!record) return res.status(404).json({ success: false, error: 'Record not found', code: 404 })
      return res.json({ success: true, data: { _id: record._id, ...record.data } })
    }

    // ── POST ─────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const result = zodSchema.safeParse(req.body)
      if (!result.success) return res.status(400).json({ success: false, error: result.error.errors, code: 400 })
      const record = await DynamicData.create({ ...baseFilter, data: result.data })
      return res.status(201).json({ success: true, data: { _id: record._id, ...record.data } })
    }

    // ── PUT ──────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const result = zodSchema.safeParse(req.body)
      if (!result.success) return res.status(400).json({ success: false, error: result.error.errors, code: 400 })
      const record = await DynamicData.findOneAndUpdate(
        { _id: id, ...baseFilter },
        { $set: { data: result.data } },
        { new: true }
      )
      if (!record) return res.status(404).json({ success: false, error: 'Record not found', code: 404 })
      return res.json({ success: true, data: { _id: record._id, ...record.data } })
    }

    // ── DELETE ───────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const record = await DynamicData.findOneAndDelete({ _id: id, ...baseFilter })
      if (!record) return res.status(404).json({ success: false, error: 'Record not found', code: 404 })
      return res.json({ success: true, data: { _id: record._id, ...record.data } })
    }

    return res.status(405).json({ success: false, error: 'Method not allowed', code: 405 })

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid record ID format', code: 400 })
    }
    console.error('[Engine Error]', err.message)
    return res.status(500).json({ success: false, error: 'Internal server error', code: 500 })
  }
}