import express from 'express'
import { engineHandler } from '../middlewares/pipeline.js'

const router = express.Router()

/**
 * Blueprint: EXACT ROUTE CONTRACT
 *
 * GET    /api/:slug/:resource        → list all (pagination + filter + sort)
 * GET    /api/:slug/:resource/:id    → get one by id
 * POST   /api/:slug/:resource        → create one
 * PUT    /api/:slug/:resource/:id    → update one
 * DELETE /api/:slug/:resource/:id    → delete one
 *
 * Note: These are PUBLIC routes — no JWT required.
 * The "isPublic" check can be added in Phase 4 per-project toggle.
 */

router.get('/:slug/:resource', engineHandler)
router.get('/:slug/:resource/:id', engineHandler)
router.post('/:slug/:resource', engineHandler)
router.put('/:slug/:resource/:id', engineHandler)
router.delete('/:slug/:resource/:id', engineHandler)

export default router