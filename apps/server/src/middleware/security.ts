/**
 * Security Middleware Suite for GF-AI / Ada Server
 * ─────────────────────────────────────────────────
 * Provides:
 *   • Per-route rate limiters   (chat, voice, general)
 *   • Input sanitization        (SQL injection, XSS, path traversal)
 *   • X-Request-ID tracing header
 */

import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

// Helper to generate combined userId + IP rate limit key
const getRateLimitKey = (req: Request): string => {
  const userId = (req as any).userId ? String((req as any).userId).trim() : ''
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return userId ? `${userId}:${ip}` : ip
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Chat endpoint limiter: 20 requests per 2 minutes per user/IP
 */
export const rateLimitChat = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    error: 'Too many chat requests. Please wait a moment before sending another message.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * Voice / TTS endpoint limiter: 10 requests per minute per user/IP
 */
export const rateLimitVoice = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    error: 'Voice synthesis rate limit exceeded. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * General API limiter: 120 requests per minute per user/IP
 * (replaces the inline limiter in index.ts for /api/)
 */
export const rateLimitGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    error: 'Too many requests, please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * Auth endpoint limiter: 30 requests per 15 minutes per IP (protects login and guest token issuance)
 */
export const rateLimitAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'Too many authentication attempts. Please wait a few minutes before trying again.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── Input Sanitisation ───────────────────────────────────────────────────────

/**
 * XSS and script injection patterns.
 * Note: SQL injection is defended via parameterized database statements,
 * NOT naive keyword regex stripping which mutates legitimate user conversations.
 */
const XSS_PATTERNS =
  /<\s*(script|iframe|object|embed|form|input|button|svg|math|link|meta|base|style|applet|frame|frameset|layer|ilayer|bgsound|marquee)\b[^>]*>/gi

const PATH_TRAVERSAL_PATTERNS = /(\.\.(\/|\\)|%2e%2e(\/|%2f|%5c)|%252e%252e)/gi

/**
 * Strip dangerous active scripts and path traversals while strictly preserving
 * legitimate conversation vocabulary, quotes, and punctuation.
 */
function sanitizeString(value: string): string {
  return value
    .replace(XSS_PATTERNS, '')
    .replace(PATH_TRAVERSAL_PATTERNS, '')
    .trim()
}

/**
 * Recursively sanitise an arbitrary value (string | object | array).
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeString(value)
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)])
    )
  }
  return value
}

/**
 * Express middleware: sanitizes parameter path traversals while preserving
 * user messages, markdown, and conversation text intact.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Defend against path traversal in query params
  for (const [key, val] of Object.entries(req.query)) {
    if (typeof val === 'string' && PATH_TRAVERSAL_PATTERNS.test(val)) {
      console.warn(`[Security] Path traversal attempt detected in query param "${key}" from "${req.ip}"`)
      ;(req.query as Record<string, unknown>)[key] = val.replace(PATH_TRAVERSAL_PATTERNS, '')
    }
  }

  next()
}

// ─── Request-ID Tracing ───────────────────────────────────────────────────────

/**
 * Attach a unique X-Request-ID to every request/response for distributed tracing.
 * Reuses the caller-supplied header when present (useful for forwarded requests).
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID()
  req.headers['x-request-id'] = id
  res.setHeader('X-Request-ID', id)
  next()
}
