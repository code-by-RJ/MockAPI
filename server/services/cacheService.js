import Project from '../models/Project.js'

/**
 * Blueprint: Map<slug, projectData> in-memory cache.
 * No Redis for MVP — in-memory is enough.
 */
const cache = new Map()

/**
 * Get project by slug — from cache or DB.
 */
export const getProject = async (slug) => {
  if (cache.has(slug)) return cache.get(slug)

  const project = await Project.findOne({ slug })
  if (project) cache.set(slug, project)

  return project
}

/**
 * Invalidate cache for a slug.
 * Call whenever project is updated or deleted.
 */
export const invalidate = (slug) => {
  cache.delete(slug)
}

/**
 * Clear all cache (e.g. on server restart testing).
 */
export const clearAll = () => {
  cache.clear()
}