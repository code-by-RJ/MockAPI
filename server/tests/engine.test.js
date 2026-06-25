import app from '../app.js'
import { connectTestDB, closeTestDB } from './setupDb.js'
import request  from 'supertest'
import User     from '../models/User.js'
import Project  from '../models/Project.js'
import Resource from '../models/Resource.js'

// No emailService mocking needed here — these tests create Project/Resource
// directly via mongoose models, bypassing the auth controllers entirely.

beforeAll(async () => { await connectTestDB() })
afterAll(async () => { await closeTestDB() })

describe('Engine: GET list + POST validation', () => {
  const slug         = 'engine-test-project'
  const resourceName = 'items'

  beforeAll(async () => {
    const owner = await User.create({
      name:       'Engine Owner',
      email:      'engineowner@example.com',
      password:   'irrelevant-hash',  // engine routes don't touch this field
      isVerified: true,
    })

    const project = await Project.create({
      name:     'Engine Test Project',
      slug,
      owner:    owner._id,
      isPublic: true,   // public — engine routes don't need a JWT for this test
    })

    await Resource.create({
      name:      resourceName,
      projectId: project._id,
      schema: [
        { fieldName: 'title', type: 'string', required: true },
        { fieldName: 'qty',   type: 'number', required: true },
      ],
    })
  })

  test('GET list returns 200 with no records initially', async () => {
    const res = await request(app).get(`/api/${slug}/${resourceName}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.total).toBe(0)
  })

  test('POST with a valid body creates a record', async () => {
    const res = await request(app)
      .post(`/api/${slug}/${resourceName}`)
      .send({ title: 'Widget', qty: 5 })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('Widget')
    expect(res.body.data.qty).toBe(5)
  })

  test('POST with an invalid body is rejected by Zod', async () => {
    // missing required 'title', wrong type for 'qty' (string instead of number)
    const res = await request(app)
      .post(`/api/${slug}/${resourceName}`)
      .send({ qty: 'not-a-number' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(Array.isArray(res.body.error)).toBe(true)  // Zod's error.errors array
  })

  test('GET list now shows only the one valid record', async () => {
    const res = await request(app).get(`/api/${slug}/${resourceName}`)

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(1)
    expect(res.body.data).toHaveLength(1)
  })
})