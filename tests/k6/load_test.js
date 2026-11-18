import http from 'k6/http'
import { check, sleep, group } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 50 },   // Steady load
    { duration: '15s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1% (zero 5xx)
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

export default function () {
  let authToken = ''

  group('1. Authentication Flow', () => {
    const res = http.post(`${BASE_URL}/api/auth/guest`, null, {
      headers: { 'Content-Type': 'application/json' },
    })

    check(res, {
      'auth status is 200': (r) => r.status === 200,
      'has token': (r) => JSON.parse(r.body).token !== undefined,
    })

    if (res.status === 200) {
      authToken = JSON.parse(res.body).token
    }
  })

  sleep(0.5)

  if (!authToken) return

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  }

  group('2. Market Quotes & Radar', () => {
    const res = http.get(`${BASE_URL}/api/trading/quote?symbol=RELIANCE`, { headers })
    check(res, {
      'quote status is 200': (r) => r.status === 200,
      'has price': (r) => JSON.parse(r.body).quote.price > 0,
    })
  })

  sleep(0.5)

  group('3. Conversational AI Chat', () => {
    const payload = JSON.stringify({
      message: 'Analyze institutional swing levels for Reliance.',
      character: 'atlas',
      stream: false,
    })

    const res = http.post(`${BASE_URL}/api/chat`, payload, { headers })
    check(res, {
      'chat status is 200': (r) => r.status === 200,
      'has structured reply': (r) => JSON.parse(r.body).reply !== undefined,
    })
  })

  sleep(0.5)

  group('4. Safe Web Scraper', () => {
    const payload = JSON.stringify({
      url: 'https://example.com',
    })

    const res = http.post(`${BASE_URL}/api/web/scrape`, payload, { headers })
    check(res, {
      'scrape status is 200 or 400 (if blocked)': (r) => r.status === 200 || r.status === 400,
      'no 5xx server errors': (r) => r.status < 500,
    })
  })

  sleep(1)
}
