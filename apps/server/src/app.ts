import express, { type Application, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { authMiddleware } from './middleware/auth.js'
import { rateLimitGeneral, sanitizeInput, requestId } from './middleware/security.js'
import { ProviderRegistry } from './providers/index.js'
import { healthRouter, metricsInterceptor } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { tradingRouter } from './routes/trading.js'
import { financeRouter } from './routes/finance.js'
import { scraperRouter } from './routes/scraper.js'
import { voiceRouter } from './routes/voice.js'
import { userRouter } from './routes/user.js'
import { chatRouter } from './routes/chat.js'
import { miscRouter } from './routes/misc.js'

dotenv.config()
ProviderRegistry.init()

export function createApp(): Application {
  const app = express()
  app.set('trust proxy', 1)
  const isDev = process.env.NODE_ENV !== 'production'

  // Security headers with production Content Security Policy
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'wasm-unsafe-eval'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'blob:', 'data:', 'https:', 'wss:', 'ws:'],
          workerSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://gf-ai-ochre.vercel.app',
  ]

  const envAllowed = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowed]))

  function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return false
    if (allowedOrigins.includes(origin)) return true
    if (isDev && (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))) return true
    return false
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          return callback(null, true)
        }
        callback(new Error(`CORS origin "${origin}" rejected by security policy`))
      },
      credentials: true,
    })
  )

  // Global metrics interceptor
  app.use(metricsInterceptor)

  // General API Rate Limiting (120 req/min)
  app.use('/api/', rateLimitGeneral)

  // Safe JSON body parser with 1 MB limit (mitigates memory exhaustion DoS)
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      return next()
    }
    express.json({ limit: '1mb' })(req, res, next)
  })

  app.use(requestId)
  app.use(sanitizeInput)
  app.use(authMiddleware)

  // Mount Route modules
  app.use(healthRouter)
  app.use(authRouter)
  app.use(tradingRouter)
  app.use(financeRouter)
  app.use(scraperRouter)
  app.use(voiceRouter)
  app.use(userRouter)
  app.use('/api', chatRouter)
  app.use('/api', miscRouter)

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
  })

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err)
    const status = err.status || 500
    res.status(status).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    })
  })

  return app
}
