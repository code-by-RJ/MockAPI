import { jest } from '@jest/globals'

// Capture OTPs as they're "sent" so tests don't need a real email provider (Resend).
// jest.unstable_mockModule must run BEFORE app.js (or anything that imports
// emailService.js) is itself imported — that's why app.js is imported dynamically
// below via await import(), not a static import (static imports are hoisted by
// ESM and would run before this mock is registered, hitting the real Resend API).
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

describe('Auth flow: register -> verify OTP -> login', () => {
  const email    = 'flowtest@example.com'
  const password = 'TestPass123'   // 8+ chars, letter + number — passes STRONG_PASSWORD

  test('full flow succeeds end-to-end', async () => {
    // 1. Register — creates an unverified user, sends OTP
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Flow Test', email, password })

    expect(registerRes.status).toBe(201)
    expect(registerRes.body.success).toBe(true)
    expect(lastOtp).toMatch(/^\d{6}$/)

    // 2. Login before verifying — must be rejected (item 1: isVerified check)
    const earlyLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })

    expect(earlyLoginRes.status).toBe(403)
    expect(earlyLoginRes.body.success).toBe(false)

    // 3. Verify OTP — marks the account verified, returns a token
    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email, otp: lastOtp })

    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body.success).toBe(true)
    expect(verifyRes.body.token).toBeDefined()

    // 4. Login after verifying — should now succeed
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.success).toBe(true)
    expect(loginRes.body.token).toBeDefined()
    expect(loginRes.body.user.email).toBe(email)
  })

  test('wrong OTP is rejected (and never collides with the real one)', async () => {
    const email2 = 'wrongotp@example.com'
    const setupRes = await request(app).post('/api/auth/register').send({ name: 'X', email: email2, password })
    expect(setupRes.status).toBe(201)

    // generateOTP() produces 100000-999999 — '000000' can never be the real value
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: email2, otp: '000000' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})