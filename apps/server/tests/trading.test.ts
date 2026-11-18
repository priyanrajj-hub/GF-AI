import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { db } from '../src/db/index.js'
import { JwtService } from '../src/services/jwtService.js'

const mockChartResponse = {
  chart: {
    result: [
      {
        meta: {
          currency: 'INR',
          symbol: 'RELIANCE.NS',
          exchangeName: 'NSE',
          instrumentType: 'EQUITY',
          firstTradeDate: 1041393 * 1000,
          regularMarketTime: 1700000 * 1000,
          gmtoffset: 19800,
          timezone: 'IST',
          exchangeTimezoneName: 'Asia/Kolkata',
          regularMarketPrice: 2450.5,
          chartPreviousClose: 2430.0,
          previousClose: 2430.0,
          regularMarketDayHigh: 2480.0,
          regularMarketDayLow: 2420.0,
          regularMarketVolume: 5000000,
        },
        timestamp: [1, 2, 3, 4, 5, 6].map((i) => 1700000 * 1000 + i * 86400),
        indicators: {
          quote: [
            {
              open: [2400, 2410, 2420, 2430, 2440, 2450],
              high: [2415, 2425, 2435, 2445, 2455, 2480],
              low: [2390, 2400, 2410, 2420, 2430, 2420],
              close: [2410, 2420, 2430, 2440, 2450, 2450.5],
              volume: [1200000, 1300000, 1400000, 1500000, 1600000, 5000000],
            },
          ],
        },
      },
    ],
    error: null,
  },
}

const mockQuoteSummaryResponse = {
  quoteSummary: {
    result: [
      {
        financialData: {
          numberOfAnalystOpinions: { raw: 32 },
          recommendationKey: 'buy',
          targetMeanPrice: { raw: 2850.0 },
          targetHighPrice: { raw: 3100.0 },
          targetLowPrice: { raw: 2500.0 },
        },
      },
    ],
  },
}

const mockCoinGeckoResponse = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  market_data: {
    current_price: { usd: 92000, inr: 7800000 },
    price_change_percentage_24h: 2.5,
    high_24h: { usd: 93500, inr: 7900000 },
    low_24h: { usd: 90500, inr: 7700000 },
    total_volume: { usd: 35e9, inr: 2975e9 },
  },
}

const mockBinanceKlines = [
  [1700000 * 1000, '91000.00', '92500.00', '90500.00', '92000.00', '1500.00', 1700086 * 1000],
]

const mockBinance24hr = {
  symbol: 'BTCUSDT',
  lastPrice: '92000.00',
  priceChangePercent: '2.50',
}

const mockFearAndGreed = {
  data: [{ value: '75', value_classification: 'Greed' }],
}

const mockFetch = vi.fn().mockImplementation(async (input: any) => {
  const url = typeof input === 'string' ? input : input?.url || input?.toString() || ''

  if (url.includes('query1.finance.yahoo.com/v8/finance/chart')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockChartResponse,
      text: async () => JSON.stringify(mockChartResponse),
    }
  }

  if (url.includes('query1.finance.yahoo.com/v10/finance/quoteSummary')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockQuoteSummaryResponse,
      text: async () => JSON.stringify(mockQuoteSummaryResponse),
    }
  }

  if (url.includes('api.coingecko.com')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockCoinGeckoResponse,
      text: async () => JSON.stringify(mockCoinGeckoResponse),
    }
  }

  if (url.includes('api.binance.com/api/v3/klines')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockBinanceKlines,
      text: async () => JSON.stringify(mockBinanceKlines),
    }
  }

  if (url.includes('api.binance.com/api/v3/ticker')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockBinance24hr,
      text: async () => JSON.stringify(mockBinance24hr),
    }
  }

  if (url.includes('api.alternative.me/fng')) {
    return {
      ok: true,
      status: 200,
      json: async () => mockFearAndGreed,
      text: async () => JSON.stringify(mockFearAndGreed),
    }
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '{}',
  }
})

describe('Trading & Jarvis Trade AI Routes (/api/trading/*, /api/market/*)', () => {
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
