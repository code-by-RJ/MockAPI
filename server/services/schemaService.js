import { z } from 'zod'

/**
 * Dynamically builds a Zod schema from resource.schema field definitions.
 * Blueprint: schemaService.js — exact spec from Phase 3.
 */
export function buildZodSchema(fields) {
  const shape = {}

  for (const field of fields) {
    let rule

    switch (field.type) {
      case 'string':
        rule = z.string().min(field.min || 0)
        if (field.max) rule = rule.max(field.max)
        break
      case 'number':
        rule = z.number().min(field.min ?? 0)
        if (field.max !== undefined) rule = rule.max(field.max)
        break
      case 'boolean':
        rule = z.boolean()
        break
      case 'email':
        rule = z.string().email()
        break
      case 'uuid':
        rule = z.string().uuid()
        break
      case 'date':
        // Accept ISO string or any string that looks like a date
        rule = z.string()
        break
      case 'enum':
        if (!field.values || field.values.length === 0) {
          rule = z.string()
        } else {
          rule = z.enum(field.values)
        }
        break
      case 'avatar':
        rule = z.string().url()
        break
      default:
        rule = z.string()
    }

    shape[field.fieldName] = field.required ? rule : rule.optional()
  }

  return z.object(shape)
}