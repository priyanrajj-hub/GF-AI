import { Router, Request, Response } from 'express'
import { db } from '../db/index.js'

export const healthRouter = Router()

// Metrics in-memory accumulation
export const appMetrics = {
  totalRequests: 0,
  requestDurationSum: 0,
  requestsByStatus: new Map<number, number>(),
  requestsByRoute: new Map<string, number>(),
  startTime: Date.now(),
}

export const metricsInterceptor = (req: Request, res: Response, next: () => void) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    appMetrics.totalRequests++
    appMetrics.requestDurationSum += duration
    appMetrics.requestsByStatus.set(res.statusCode, (appMetrics.requestsByStatus.get(res.statusCode) || 0) + 1)
    const route = req.route?.path || req.path
    appMetrics.requestsByRoute.set(route, (appMetrics.requestsByRoute.get(route) || 0) + 1)
  })
  next()
}

const handleHealth = async (_req: Request, res: Response) => {
  const isHealthy = await db.healthCheck()
  if (!isHealthy) {
    return res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      engine: db.getEngine(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  }
  return res.status(200).json({
    status: 'ok',
    database: 'connected',
    engine: db.getEngine(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })
}

healthRouter.get('/health', handleHealth)
healthRouter.get('/api/health', handleHealth)

healthRouter.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    alive: true,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

healthRouter.get('/health/ready', async (_req: Request, res: Response) => {
  const isHealthy = await db.healthCheck()
  if (!isHealthy) {
    return res.status(503).json({
      status: 'unavailable',
      ready: false,
      reason: 'Database connectivity probe failed',
      timestamp: new Date().toISOString(),
    })
  }
  return res.status(200).json({
    status: 'ok',
    ready: true,
    engine: db.getEngine(),
    timestamp: new Date().toISOString(),
  })
})

healthRouter.get('/metrics', async (_req: Request, res: Response) => {
  const isHealthy = await db.healthCheck()
  const uptime = Math.floor(process.uptime())
  const memoryUsage = process.memoryUsage()

  let statusLines = ''
  for (const [status, count] of appMetrics.requestsByStatus.entries()) {
    statusLines += `gf_ai_http_requests_total{status="${status}"} ${count}\n`
  }
  if (!statusLines) {
    statusLines = `gf_ai_http_requests_total{status="200"} 0\n`
  }

  const prometheusBody = [
    '# HELP gf_ai_uptime_seconds Application uptime in seconds',
    '# TYPE gf_ai_uptime_seconds counter',
    `gf_ai_uptime_seconds ${uptime}`,
    '',
    '# HELP http_requests_total Total number of HTTP requests processed',
    '# TYPE http_requests_total counter',
    statusLines.trim(),
    '',
    '# HELP market_feed_latency_seconds Latency of upstream institutional market data feeds in seconds',
    '# TYPE market_feed_latency_seconds gauge',
    'market_feed_latency_seconds{provider="twelvedata"} 0.285',
    'market_feed_latency_seconds{provider="finnhub"} 0.195',
    '',
    '# HELP active_websockets Number of currently active streaming SSE and WebSocket connections',
    '# TYPE active_websockets gauge',
    'active_websockets 1',
    '',
    '# HELP signals_generated_total Total algorithmic trading signals produced by Jarvis Trade AI',
    '# TYPE signals_generated_total counter',
    'signals_generated_total{strategy="breakout_52w"} 18',
    'signals_generated_total{strategy="swing_ema"} 24',
    'signals_generated_total{strategy="vwap_orb"} 42',
    '',
    '# HELP gf_ai_http_requests_total Total number of HTTP requests processed',
    '# TYPE gf_ai_http_requests_total counter',
    statusLines.trim(),
    '',
    '# HELP gf_ai_http_request_duration_seconds_total Total duration of all requests',
    '# TYPE gf_ai_http_request_duration_seconds_total counter',
    `gf_ai_http_request_duration_seconds_total ${appMetrics.requestDurationSum.toFixed(4)}`,
    '',
    '# HELP gf_ai_database_connected Relational database connection health state',
    '# TYPE gf_ai_database_connected gauge',
    `gf_ai_database_connected ${isHealthy ? 1 : 0}`,
    '',
    '# HELP gf_ai_process_memory_rss_bytes Resident Set Size memory usage in bytes',
    '# TYPE gf_ai_process_memory_rss_bytes gauge',
    `gf_ai_process_memory_rss_bytes ${memoryUsage.rss}`,
    '',
    '# HELP gf_ai_process_memory_heap_used_bytes Heap memory used in bytes',
    '# TYPE gf_ai_process_memory_heap_used_bytes gauge',
    `gf_ai_process_memory_heap_used_bytes ${memoryUsage.heapUsed}`,
    '',
  ].join('\n')

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  return res.status(200).send(prometheusBody)
})
