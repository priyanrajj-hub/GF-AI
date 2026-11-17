/**
 * Cryptographic JWT & Identity Service for GF-AI
 * ──────────────────────────────────────────────
 * Zero-dependency implementation using Node.js native `node:crypto`.
 * Implements HMAC-SHA256 signature verification, constant-time comparison,
 * expiration checks, and role-based payload claims.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export interface AuthUserPayload {
  userId: string
  userName?: string
  role?: 'user' | 'admin' | 'guest'
  iat?: number
  exp?: number
  iss?: string
}

const JWT_ISSUER = 'gf-ai-security'
const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

// Secure server-side secret
const JWT_SECRET: string = (() => {
  const envSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim()
  }
  if (process.env.NODE_ENV === 'production') {
    // Generate an ephemeral strong random key if not configured in production
    console.warn('[Security] WARN: JWT_SECRET not configured in production. Generating secure ephemeral key.')
    return randomBytes(32).toString('hex')
  }
  return 'gf-ai-local-dev-jwt-hmac-sha256-secret-key-32b'
})()

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str, 'utf8') : str
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

function signHmac(data: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(data)
  return base64UrlEncode(hmac.digest())
}

export class JwtService {
  /**
   * Signs and generates a tamper-proof JWT token.
   */
  static sign(payload: AuthUserPayload, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): string {
    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }

    const fullPayload: AuthUserPayload = {
      ...payload,
      role: payload.role || 'user',
      iss: JWT_ISSUER,
      iat: now,
      exp: now + expiresInSeconds,
    }

    const encodedHeader = base64UrlEncode(JSON.stringify(header))
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
    const unsignedToken = `${encodedHeader}.${encodedPayload}`
    const signature = signHmac(unsignedToken, JWT_SECRET)

    return `${unsignedToken}.${signature}`
  }

  /**
   * Cryptographically verifies and decodes a JWT token.
   * Returns null if signature is invalid, expired, or malformed.
   */
  static verify(token: string): AuthUserPayload | null {
    if (!token || typeof token !== 'string') return null

    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    try {
      // 1. Verify Signature using constant-time comparison
      const expectedSignature = signHmac(unsignedToken, JWT_SECRET)
      const sigBuf = Buffer.from(signature)
      const expectedBuf = Buffer.from(expectedSignature)

      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        return null
      }

      // 2. Decode & Parse Payload
      const payload: AuthUserPayload = JSON.parse(base64UrlDecode(encodedPayload))

      // 3. Check Expiration
      const now = Math.floor(Date.now() / 1000)
      if (typeof payload.exp === 'number' && payload.exp < now) {
        return null
      }

      // 4. Verify Issuer
      if (payload.iss && payload.iss !== JWT_ISSUER) {
        return null
      }

      if (!payload.userId) {
        return null
      }

      return payload
    } catch {
      return null
    }
  }

  /**
   * Creates an ephemeral guest token with limited privileges.
   */
  static createGuestToken(guestId?: string): string {
    const id = guestId || `guest_${randomBytes(8).toString('hex')}`
    return this.sign({
      userId: id,
      userName: 'Guest User',
      role: 'guest',
    }, 24 * 60 * 60) // 24 hours
  }
}
