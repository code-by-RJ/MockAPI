import express from 'express'
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  updateResourceConfig,
  seedResource,
  renameResource
} from '../controllers/resourceController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = express.Router({ mergeParams: true }) // mergeParams for :slug

// All resource routes are protected
router.use(authenticateToken)

router.get('/',               getResources)
router.post('/',              createResource)
router.put('/:name',          updateResource)
router.patch('/:name',         renameResource)         // rename
router.delete('/:name',       deleteResource)
router.patch('/:name/config', updateResourceConfig)  // Phase 4
router.post('/:name/seed',    seedResource)          // Priority 4 — re-seed

export default router