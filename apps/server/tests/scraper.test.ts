import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

describe('Scraper & Search Routes (/api/web/scrape, /api/news, /api/search)', () => {
  const app = createApp()
  let authToken: string

  beforeAll(async () => {
    process.env.ENABLE_TEST_AUTH = 'true'
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
    await db.init()
    authToken = JwtService.createGuestToken()
  })

  it('POST /api/web/scrape should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/web/scrape')
      .send({ url: 'https://example.com' })
    expect(res.status).toBe(401)
  })

  it('POST /api/web/scrape should reject requests without URL', async () => {
    const res = await request(app)
      .post('/api/web/scrape')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Valid URL is required')
  })

  it('POST /api/web/scrape should block SSRF attempts to private IP / localhost', async () => {
    const res = await request(app)
      .post('/api/web/scrape')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'http://127.0.0.1:8080/admin' })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('security policies')
  })

  it('GET /api/news should return curated news by category', async () => {
    const res = await request(app)
      .get('/api/news?category=finance')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.news).toBeDefined()
    expect(Array.isArray(res.body.news)).toBe(true)
    expect(res.body.category).toBe('finance')
  })

  it('GET /api/news should return all news when category is not specified', async () => {
    const res = await request(app)
      .get('/api/news')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.news)).toBe(true)
    expect(res.body.count).toBeGreaterThan(0)
  })

  it('GET /api/search should reject missing query param', async () => {
    const res = await request(app)
      .get('/api/search')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Search query q is required')
  })

  it('GET /api/search should return search results for valid query', async () => {
    const res = await request(app)
      .get('/api/search?q=artificial+intelligence')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.results).toBeDefined()
    expect(Array.isArray(res.body.results)).toBe(true)
  })
})
