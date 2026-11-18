import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

describe('Auth Routes (/api/auth)', () => {
  const app = createApp()

  beforeAll(async () => {
    process.env.ENABLE_TEST_AUTH = 'true'
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
    await db.init()
  })

  it('POST /api/auth/guest should generate a 24h anonymous guest token', async () => {
    const res = await request(app).post('/api/auth/guest')
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user).toBeDefined()
    expect(res.body.user.role).toBe('guest')
    expect(res.body.expiresIn).toBe('24h')
  })

  it('POST /api/auth/magic-link/request should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_EMAIL')
  })

  it('POST /api/auth/magic-link/request should return generic message and testToken in test mode', async () => {
    const res = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'investor@example.test' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.testToken).toBeDefined()
  })

  it('POST /api/auth/magic-link/verify should reject missing or invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/magic-link/verify')
      .send({ email: 'investor@example.test', token: 'invalid-hex-token' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('AUTH_FAILED')
  })

  it('POST /api/auth/magic-link/verify should issue access and refresh tokens on valid token', async () => {
    const reqRes = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'verify_user@example.test' })
    const testToken = reqRes.body.testToken

    const verifyRes = await request(app)
      .post('/api/auth/magic-link/verify')
      .send({ email: 'verify_user@example.test', token: testToken })

    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body.token).toBeDefined()
    expect(verifyRes.body.refreshToken).toBeDefined()
    expect(verifyRes.body.user.email).toBe('verify_user@example.test')
  })

  it('POST /api/auth/refresh should rotate valid refresh token', async () => {
    const reqRes = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: 'refresh_test@example.test' })
    const testToken = reqRes.body.testToken

    const verifyRes = await request(app)
      .post('/api/auth/magic-link/verify')
      .send({ email: 'refresh_test@example.test', token: testToken })

    const originalRefresh = verifyRes.body.refreshToken

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: originalRefresh })

    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body.token).toBeDefined()
    expect(refreshRes.body.refreshToken).toBeDefined()
    expect(refreshRes.body.refreshToken).not.toBe(originalRefresh)
  })

  it('POST /api/auth/logout should revoke active tokens', async () => {
    const guestRes = await request(app).post('/api/auth/guest')
    const token = guestRes.body.token

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({})

    expect(logoutRes.status).toBe(200)
    expect(logoutRes.body.success).toBe(true)
  })

  it('GET /api/auth/me should return identity status', async () => {
    const guestRes = await request(app).post('/api/auth/guest')
    const token = guestRes.body.token

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(meRes.status).toBe(200)
    expect(meRes.body.authenticated).toBe(true)
    expect(meRes.body.role).toBe('guest')
  })
})
