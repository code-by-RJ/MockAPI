import { jest } from '@jest/globals'

let lastOtp = null

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendVerifyOTP: jest.fn(async (_email, _name, otp) => { lastOtp = otp }),
  sendResetOTP:  jest.fn(async (_email, _name, otp) => { lastOtp = otp }),
}))

const { default: app }               = await import('../app.js')
const { connectTestDB, closeTestDB } = await import('./setupDb.js')
const { default: request }           = await import('supertest')

beforeAll(async () => { await connectTestDB() })
afterAll(async () => { await closeTestDB() })

describe('Login lockout after repeated wrong passwords', () => {
  const email    = 'lockouttest@example.com'
  const password = 'CorrectPass1'

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send({ name: 'Lockout Test', email, password })
    if (registerRes.status !== 201) throw new Error(`Setup register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`)

    const verifyRes = await request(app).post('/api/auth/verify-otp').send({ email, otp: lastOtp })
    if (verifyRes.status !== 200) throw new Error(`Setup verify-otp failed: ${verifyRes.status} ${JSON.stringify(verifyRes.body)}`)
  })

  // authController.js locks the account once loginAttempts >= 3 — i.e. on the
  // 3rd consecutive wrong attempt, not the 4th. This test matches that actual
  // code behavior. Kept to exactly 3 login attempts (+ 1 register) to stay
  // well under authLimiter's 5-req/15min cap, which register and login share.
  test('1st and 2nd wrong attempts are rejected but do not lock the account', async () => {
    for (let i = 0; i < 2; i++) {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' })
      expect(res.status).toBe(401)
      expect(res.body.isLocked).toBeUndefined()
    }
  })

  test('3rd consecutive wrong attempt locks the account', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' })

    expect(res.status).toBe(423)
    expect(res.body.success).toBe(false)
    expect(res.body.isLocked).toBe(true)
    expect(res.body.lockUntil).toBeDefined()
  })
})