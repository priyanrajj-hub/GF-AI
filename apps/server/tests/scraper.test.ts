import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

const mockNewsData = {
  hits: [
    { title: 'Tech Innovation in AI 2026', url: 'https://example.com/tech-news', points: 180, num_comments: 50, objectID: 'hn-001' },
    { title: 'Market Trends and Global Finance', url: 'https://example.com/finance-news', points: 220, num_comments: 65, objectID: 'hn-002' },
  ],
}

const mockWikiData = {
  query: {
    pages: {
      '1': {
        title: 'Artificial Intelligence',
        extract: 'Artificial intelligence (AI) is intelligence demonstrated by machines.',
      },
    },
  },
}

const mockFetch = vi.fn().mockImplementation(async (input: any) => {
  const url = typeof input === 'string' ? input : input?.url || input?.toString() || ''

  if (url.includes('hn.algolia.com')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockNewsData,
      text: async () => JSON.stringify(mockNewsData),
    }
  }

  if (url.includes('wikipedia.org')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockWikiData,
      text: async () => JSON.stringify(mockWikiData),
    }
  }

  if (url.includes('duckduckgo.com') || url.includes('goodreturns.in') || url.includes('wttr.in')) {
    return {
      ok: true,
      status: 200,
      text: async () => '<html><body><a class="result__url" href="https://example.com/result">Result</a><h2 class="result__title">AI Overview</h2><div class="result__snippet">AI overview snippet</div></body></html>',
      json: async () => ({}),
    }
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '{}',
  }
})

describe('Scraper & Search Routes (/api/web/scrape, /api/news, /api/search)', () => {
  const app = createApp()
  let authToken: string

  beforeAll(async () => {
    vi.stubGlobal('fetch', mockFetch)
    process.env.ENABLE_TEST_AUTH = 'true'
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test_verification_jwt_secret_key_min_32_bytes'
    await db.init()
    authToken = JwtService.createGuestToken()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
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
