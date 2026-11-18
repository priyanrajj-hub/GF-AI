/**
 * GF-AI Opt-In Live Market Data Integration Tests
 * ────────────────────────────────────────────────
 * Excluded from automated CI workflows to maintain 100% test hermeticity.
 * To execute live provider verification manually:
 *   npm run test:live
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

describe.skipIf(!process.env.LIVE_MARKET_TEST)('Live Market Data Endpoints (Opt-in)', () => {
  const app = createApp()
  let authToken: string

  beforeAll(async () => {
    process.env.ENABLE_TEST_AUTH = 'true'
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test_verification_jwt_secret_key_min_32_bytes'
    await db.init()
    authToken = JwtService.createGuestToken()
  })

  it('GET /api/trading/quote should fetch genuine live quote when enabled', async () => {
    const res = await request(app)
      .get('/api/trading/quote?symbol=RELIANCE')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.quote).toBeDefined()
  }, 15000)

  it('GET /api/market/quote/AAPL should fetch genuine live quote from provider cascade', async () => {
    const res = await request(app)
      .get('/api/market/quote/AAPL')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.quote).toBeDefined()
  }, 15000)
})
