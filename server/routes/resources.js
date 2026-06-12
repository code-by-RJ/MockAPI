import express from 'express'
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  updateResourceConfig
} from '../controllers/resourceController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = express.Router({ mergeParams: true }) // mergeParams for :slug

// All resource routes are protected
router.use(authenticateToken)

router.get('/',              getResources)
router.post('/',             createResource)
router.put('/:name',         updateResource)
router.delete('/:name',      deleteResource)
router.patch('/:name/config', updateResourceConfig)  // Phase 4

export default router