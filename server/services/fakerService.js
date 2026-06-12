import { faker } from '@faker-js/faker'

/**
 * Type-based default faker generators.
 * Used when user hasn't defined a specific faker key on a field.
 */
const DEFAULTS = {
  string: () => faker.lorem.word(),
  number: () => Math.floor(Math.random() * 1000) + 1,
  boolean: () => Math.random() > 0.5,
  email: () => faker.internet.email(),
  uuid: () => faker.string.uuid(),
  date: () => faker.date.recent().toISOString(),
  avatar: () => faker.image.avatar(),
  enum: (field) => {
    if (field.values && field.values.length > 0) {
      return field.values[Math.floor(Math.random() * field.values.length)]
    }
    return faker.lorem.word()
  },
}

/**
 * Generate `count` fake records based on resource schema fields.
 * Blueprint: auto-call on resource create with count = 10.
 *
 * @param {Array} fields - resource.schema array
 * @param {number} count - number of records to generate
 */
export function generateFakeData(fields, count = 10) {
  return Array.from({ length: count }, () => {
    const obj = {}

    for (const field of fields) {
      try {
        if (field.faker) {
          // e.g. "person.fullName" → faker.person.fullName()
          const parts = field.faker.split('.')
          if (parts.length >= 2) {
            const [ns, method] = parts
            if (faker[ns] && typeof faker[ns][method] === 'function') {
              obj[field.fieldName] = faker[ns][method]()
            } else {
              obj[field.fieldName] = DEFAULTS[field.type]?.(field) ?? null
            }
          } else {
            obj[field.fieldName] = DEFAULTS[field.type]?.(field) ?? null
          }
        } else {
          obj[field.fieldName] =
            field.type === 'enum'
              ? DEFAULTS.enum(field)
              : (DEFAULTS[field.type]?.() ?? null)
        }
      } catch {
        obj[field.fieldName] = DEFAULTS[field.type]?.(field) ?? null
      }
    }

    return obj
  })
}