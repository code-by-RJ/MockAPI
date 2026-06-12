/**
 * Blueprint: queryService.js
 * Parses query params: page, limit, sort, filter
 *
 * ?page=1
 * ?limit=10
 * ?sort=price,-createdAt   (minus prefix = descending)
 * ?filter=name:john
 */

export function parseQuery(query) {
  // --- Pagination ---
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10))
  const skip = (page - 1) * limit

  // --- Sort ---
  // "price,-createdAt" → { price: 1, createdAt: -1 }
  let sort = { createdAt: -1 } // default: newest first
  if (query.sort) {
    sort = {}
    const parts = query.sort.split(',')
    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.startsWith('-')) {
        sort[trimmed.slice(1)] = -1
      } else {
        sort[trimmed] = 1
      }
    }
  }

  // --- Filter ---
  // "name:john" → match { "data.name": /john/i }
  // Supports a single field:value for MVP
  const filter = {}
  if (query.filter) {
    const colonIdx = query.filter.indexOf(':')
    if (colonIdx !== -1) {
      const field = query.filter.slice(0, colonIdx).trim()
      const value = query.filter.slice(colonIdx + 1).trim()

      // Try numeric match, else regex string match
      const numeric = Number(value)
      if (!isNaN(numeric) && value !== '') {
        filter[`data.${field}`] = numeric
      } else if (value === 'true' || value === 'false') {
        filter[`data.${field}`] = value === 'true'
      } else {
        filter[`data.${field}`] = { $regex: value, $options: 'i' }
      }
    }
  }

  return { page, limit, skip, sort, filter }
}

/**
 * Converts raw sort keys (on data fields) to MongoDB dot-notation.
 * e.g. sort key "price" → "data.price" for DynamicData docs.
 * But "createdAt" stays as-is (top-level field).
 */
export function toMongoSort(sort) {
  const topLevel = new Set(['createdAt', 'updatedAt', '_id'])
  const mongoSort = {}
  for (const [key, dir] of Object.entries(sort)) {
    mongoSort[topLevel.has(key) ? key : `data.${key}`] = dir
  }
  return mongoSort
}