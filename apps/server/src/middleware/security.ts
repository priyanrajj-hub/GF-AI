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

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Chat endpoint limiter: 20 requests per 2 minutes per IP
 */
export const rateLimitChat = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'Too many chat requests. Please wait a moment before sending another message.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * Voice / TTS endpoint limiter: 10 requests per minute per IP
 */
export const rateLimitVoice = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'Voice synthesis rate limit exceeded. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * General API limiter: 120 requests per minute per IP
 * (replaces the inline limiter in index.ts for /api/)
 */
export const rateLimitGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  message: {
    error: 'Too many requests, please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

// ─── Input Sanitisation ───────────────────────────────────────────────────────

/** Characters / patterns that indicate injection attempts */
const SQL_PATTERNS =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|UNION|CREATE|ALTER|EXEC|EXECUTE|CAST|CONVERT|DECLARE|WAITFOR|XP_)\b)|('|--|;{2,}|\/\*|\*\/)/gi

const XSS_PATTERNS =
  /<\s*(script|iframe|object|embed|form|input|button|img|svg|math|link|meta|base|style|applet|frame|frameset|layer|ilayer|bgsound|title|marquee)\b[^>]*>/gi

const PATH_TRAVERSAL_PATTERNS = /(\.\.(\/|\\)|%2e%2e(\/|%2f|%5c)|%252e%252e)/gi

/**
 * Strip dangerous content from a single string value.
 */
function sanitizeString(value: string): string {
  return value
    .replace(SQL_PATTERNS, '')
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
 * Express middleware: sanitizes `req.query` and `req.body` in-place.
 * Logs a warning whenever suspicious content is stripped.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Sanitise query params
  for (const [key, val] of Object.entries(req.query)) {
    if (typeof val === 'string') {
      const clean = sanitizeString(val)
      if (clean !== val) {
        console.warn(`[Security] Suspicious query param "${key}" sanitized from "${req.ip}"`)
      }
      ;(req.query as Record<string, unknown>)[key] = clean
    }
  }

  // Sanitise JSON body
  if (req.body && typeof req.body === 'object') {
    const originalStr = JSON.stringify(req.body)
    req.body = sanitizeValue(req.body)
    if (JSON.stringify(req.body) !== originalStr) {
      console.warn(`[Security] Suspicious body content sanitized from "${req.ip}" on ${req.path}`)
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
