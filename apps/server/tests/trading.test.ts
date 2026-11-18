import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

describe('Trading & Jarvis Trade AI Routes (/api/trading/*, /api/market/*)', () => {
  const app = createApp()
  let authToken: string

  beforeAll(async () => {
    process.env.ENABLE_TEST_AUTH = 'true'
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test_verification_jwt_secret_key_min_32_bytes'
    await db.init()
    authToken = JwtService.createGuestToken()
  })

  it('GET /api/trading/quote should return valid quote with provenance', async () => {
    const res = await request(app)
      .get('/api/trading/quote?symbol=RELIANCE')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.quote).toBeDefined()
    expect(res.body.quote.symbol).toContain('RELIANCE')
    expect(res.body.quote.price).toBeGreaterThan(0)
  })

  it('GET /api/trading/recommendations should return structured setups', async () => {
    const res = await request(app)
      .get('/api/trading/recommendations')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.recommendations).toBeDefined()
    expect(res.body.count).toBeGreaterThan(0)
  }, 35000)

  it('GET /api/trading/market-hours should return global radar timings', async () => {
    const res = await request(app)
      .get('/api/trading/market-hours')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.radar).toBeDefined()
    expect(res.body.radar.markets).toBeDefined()
    expect(res.body.radar.userTimezone).toBeDefined()
  })

  it('GET /api/trading/screener/52week should return filtered momentum & rebound stocks', async () => {
    const res = await request(app)
      .get('/api/trading/screener/52week?type=all')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.screener).toBeDefined()
    expect(res.body.screener.length).toBeGreaterThan(0)
  })

  it('GET /api/trading/swing/:symbol should return technical swing setup', async () => {
    const res = await request(app)
      .get('/api/trading/swing/RELIANCE')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.setup).toBeDefined()
    expect(res.body.setup.symbol).toBe('RELIANCE')
    expect(res.body.setup.entryZone).toBeDefined()
    expect(res.body.setup.stopLoss).toBeDefined()
  })

  it('GET /api/trading/longterm/:symbol should return fundamental factor score', async () => {
    const res = await request(app)
      .get('/api/trading/longterm/TCS')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.factors).toBeDefined()
    expect(res.body.factors.overallScore).toBeGreaterThanOrEqual(0)
  })

  it('GET /api/trading/intraday/:symbol should return execution plan for both LONG and SHORT', async () => {
    const longRes = await request(app)
      .get('/api/trading/intraday/NIFTY?direction=LONG')
      .set('Authorization', `Bearer ${authToken}`)
    expect(longRes.status).toBe(200)
    expect(longRes.body.intraday.direction).toBe('LONG')

    const shortRes = await request(app)
      .get('/api/trading/intraday/NIFTY?direction=SHORT')
      .set('Authorization', `Bearer ${authToken}`)
    expect(shortRes.status).toBe(200)
    expect(shortRes.body.intraday.direction).toBe('SHORT')
  })

  it('GET /api/trading/ipo should return IPO listings and GMP disclaimer', async () => {
    const res = await request(app)
      .get('/api/trading/ipo')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.ipos).toBeDefined()
    expect(res.body.disclaimer).toContain('EDUCATIONAL')
  })

  it('GET /api/trading/macro should return macro indicators', async () => {
    const res = await request(app)
      .get('/api/trading/macro')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.indicators).toBeDefined()
    expect(res.body.source).toBeDefined()
  })

  it('GET /api/trading/verdict/:symbol should return multi-agent consensus', async () => {
    const res = await request(app)
      .get('/api/trading/verdict/RELIANCE')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.verdict).toBeDefined()
    expect(res.body.verdict.verdict).toBeDefined()
    expect(res.body.verdict.compositeScore).toBeGreaterThanOrEqual(0)
  })

  it('POST /api/trading/portfolio/analyze should calculate risk & XIRR', async () => {
    const res = await request(app)
      .post('/api/trading/portfolio/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        holdings: [
          { symbol: 'RELIANCE', quantity: 10, buyPrice: 2400 },
          { symbol: 'TCS', quantity: 5, buyPrice: 3500 },
        ],
      })
    expect(res.status).toBe(200)
    expect(res.body.report).toBeDefined()
  })

  it('GET /api/market/quote/:symbol, /crypto/:coinId, /radar should return live market data', async () => {
    const stockRes = await request(app)
      .get('/api/market/quote/AAPL')
      .set('Authorization', `Bearer ${authToken}`)
    expect(stockRes.status).toBe(200)
    expect(stockRes.body.quote).toBeDefined()

    const cryptoRes = await request(app)
      .get('/api/market/crypto/bitcoin')
      .set('Authorization', `Bearer ${authToken}`)
    expect(cryptoRes.status).toBe(200)
    expect(cryptoRes.body.quote).toBeDefined()

    const radarRes = await request(app)
      .get('/api/market/radar')
      .set('Authorization', `Bearer ${authToken}`)
    expect(radarRes.status).toBe(200)
    expect(radarRes.body.radar).toBeDefined()
  })
})
