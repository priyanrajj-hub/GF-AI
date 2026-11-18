/**
 * High-Performance Redis Client & Token Revocation Cache for GF-AI
 * ─────────────────────────────────────────────────────────────────
 * Handles:
 * - Revoked JWT jti blacklisting with automated TTL
 * - Refresh token family tracking and reuse detection
 * - Market quote caching (< 15-min SLA)
 * - Distributed rate limiting
 * - Resilient fallback to memory-store if Redis connection fails
 */

import { Redis } from 'ioredis'

export class RedisService {
  private static instance: RedisService | null = null
  private client: Redis | null = null
  private memoryStore = new Map<string, { value: string; expiresAt: number }>()
  private isConnected = false

  private constructor() {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl && process.env.NODE_ENV !== 'test') {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2000,
          lazyConnect: true,
        })

        this.client.connect().then(() => {
          this.isConnected = true
          console.log('[RedisService] Connected to Redis cluster at:', redisUrl.replace(/\/\/[^@]*@/, '//***@'))
        }).catch((err: any) => {
          console.warn('[RedisService] Redis connection failed, activating in-memory fallback:', err?.message)
          this.isConnected = false
        })

        this.client.on('error', (_err: any) => {
          this.isConnected = false
        })
      } catch (err: any) {
        console.warn('[RedisService] Redis initialization bypassed:', err?.message)
      }
    }
  }

  static getInstance(): RedisService {
    if (!this.instance) {
      this.instance = new RedisService()
    }
    return this.instance
  }

  async healthCheck(): Promise<boolean> {
    if (this.client && this.isConnected) {
      try {
        const ping = await this.client.ping()
        return ping === 'PONG'
      } catch {
        return false
      }
    }
    return true // In-memory fallback is always healthy
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.set(key, value, 'EX', ttlSeconds)
        return
      } catch {}
    }
    this.memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.get(key)
      } catch {}
    }
    const item = this.memoryStore.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.memoryStore.delete(key)
      return null
    }
    return item.value
  }

  async del(key: string): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.del(key)
        return
      } catch {}
    }
    this.memoryStore.delete(key)
  }

  // JTI Revocation
  async revokeJti(jti: string, ttlSeconds = 86400): Promise<void> {
    await this.set(`revoked_jti:${jti}`, '1', ttlSeconds)
  }

  async isJtiRevoked(jti: string): Promise<boolean> {
    const val = await this.get(`revoked_jti:${jti}`)
    return val === '1'
  }

  // Refresh Token Family Management & Reuse Defense
  async storeRefreshTokenFamily(tokenHash: string, familyId: string, ttlSeconds = 604800): Promise<void> {
    await this.set(`rt_family:${tokenHash}`, familyId, ttlSeconds)
  }

  async getRefreshTokenFamily(tokenHash: string): Promise<string | null> {
    return this.get(`rt_family:${tokenHash}`)
  }

  async revokeFamily(familyId: string, ttlSeconds = 604800): Promise<void> {
    await this.set(`revoked_family:${familyId}`, '1', ttlSeconds)
  }

  async isFamilyRevoked(familyId: string): Promise<boolean> {
    const val = await this.get(`revoked_family:${familyId}`)
    return val === '1'
  }

  // Quote Cache (< 15 min TTL)
  async cacheQuote(symbol: string, data: any, ttlSeconds = 300): Promise<void> {
    await this.set(`quote:${symbol.toUpperCase()}`, JSON.stringify(data), ttlSeconds)
  }

  async getCachedQuote<T>(symbol: string): Promise<T | null> {
    const raw = await this.get(`quote:${symbol.toUpperCase()}`)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  // Rate Limiting Token Bucket
  async checkRateLimit(key: string, limit: number, windowSeconds = 60): Promise<{ allowed: boolean; remaining: number }> {
    const redisKey = `ratelimit:${key}`
    if (this.client && this.isConnected) {
      try {
        const count = await this.client.incr(redisKey)
        if (count === 1) {
          await this.client.expire(redisKey, windowSeconds)
        }
        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
        }
      } catch {}
    }

    // Memory Fallback
    const now = Date.now()
    const item = this.memoryStore.get(redisKey)
    if (!item || now > item.expiresAt) {
      this.memoryStore.set(redisKey, { value: '1', expiresAt: now + windowSeconds * 1000 })
      return { allowed: true, remaining: limit - 1 }
    }
    const current = parseInt(item.value, 10) + 1
    item.value = current.toString()
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    }
  }
}

export const redis = RedisService.getInstance()
