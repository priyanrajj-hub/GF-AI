import type { NextFunction, Request, Response } from 'express'
import type { AuthenticatedRequest } from './auth.js'

export type QuotaType = 'tts' | '3d' | 'scrape' | 'chat'

export const DAILY_LIMITS: Record<QuotaType, number> = {
  tts: 100,
  '3d': 10,
  scrape: 30,
  chat: 200,
}

// In-memory daily counter store: Map<key, { count: number, dateStr: string }>
const dailyStore = new Map<string, { count: number; dateStr: string }>()

function getUtcDateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getSecondsUntilMidnightUtc(): number {
  const now = new Date()
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0))
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000))
}

/**
 * Clean up entries from previous days periodically
 */
function cleanupOldEntries(): void {
  const today = getUtcDateStr()
  for (const [key, value] of dailyStore.entries()) {
    if (value.dateStr !== today) {
      dailyStore.delete(key)
    }
  }
}

// Periodically run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 60 * 60 * 1000).unref()
}

/**
 * Middleware factory enforcing per-user daily quotas.
 * Emits HTTP 429 with Retry-After header when daily quota is exceeded.
 */
export function checkUserQuota(type: QuotaType) {
  const limit = DAILY_LIMITS[type]

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing unless specifically testing quota
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-quota'] !== 'true') {
      return next()
    }

    const authReq = req as AuthenticatedRequest
    const identifier = authReq.userId && authReq.userId.trim() !== ''
      ? authReq.userId.trim()
      : (req.ip || 'anonymous')

    const today = getUtcDateStr()
    const storeKey = `${type}:${identifier}:${today}`
    const current = dailyStore.get(storeKey)

    const count = current && current.dateStr === today ? current.count : 0

    if (count >= limit) {
      const retryAfter = getSecondsUntilMidnightUtc()
      res.setHeader('Retry-After', String(retryAfter))
      res.setHeader('X-RateLimit-Limit', String(limit))
      res.setHeader('X-RateLimit-Remaining', '0')
      res.setHeader('X-RateLimit-Reset', String(retryAfter))
      res.status(429).json({
        error: `Daily quota exceeded for ${type}. Limit is ${limit} requests per day.`,
        code: 'DAILY_QUOTA_EXCEEDED',
        quotaType: type,
        limit,
        remaining: 0,
        retryAfter,
      })
      return
    }

    // Increment
    dailyStore.set(storeKey, { count: count + 1, dateStr: today })
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - (count + 1))))
    next()
  }
}

/**
 * Reset quota for a specific user and type (useful for tests and admin overrides)
 */
export function resetUserQuota(type: QuotaType, identifier: string): void {
  const today = getUtcDateStr()
  dailyStore.delete(`${type}:${identifier}:${today}`)
}
