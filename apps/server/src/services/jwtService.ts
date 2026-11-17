/**
 * Cryptographic JWT & Identity Service for GF-AI
 * ──────────────────────────────────────────────
 * Zero-dependency implementation using Node.js native `node:crypto`.
 * Implements HMAC-SHA256 signature verification, constant-time comparison,
 * expiration checks, strict audience/issuer checks, token revocation,
 * type-separation (access vs refresh), and refresh-token rotation with family reuse detection.
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { db } from '../db/index.js'

export interface AuthUserPayload {
  userId: string
  userName?: string
  role?: 'user' | 'admin' | 'guest'
  type?: 'access' | 'refresh'
  familyId?: string
  generation?: number
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  jti?: string
}

export const JWT_ISSUER = 'gf-ai-security'
export const JWT_AUDIENCE = 'gf-ai-client'
export const DEFAULT_ACCESS_TOKEN_EXPIRY = 15 * 60 // 15 minutes for access tokens
export const DEFAULT_REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days for refresh tokens

// Insecure placeholder list rejected immediately in production
const DISALLOWED_PRODUCTION_SECRETS = [
  'super_secret_ada_jwt_key',
  'super_secret_jwt_key',
  'change_me_in_production',
  '<change_me_in_production>',
  'your_jwt_secret_here',
  'default_secret_key',
]

// Secure server-side secret with fail-fast enforcement in production
function resolveJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)

  if (isProd) {
    if (!envSecret || envSecret.trim().length < 32) {
      throw new Error(
        'FATAL [Security]: JWT_SECRET environment variable is missing or shorter than 32 characters in production. Aborting boot.'
      )
    }
    const cleanLower = envSecret.trim().toLowerCase()
    if (DISALLOWED_PRODUCTION_SECRETS.some((p) => cleanLower.includes(p.toLowerCase()))) {
      throw new Error(
        'FATAL [Security]: JWT_SECRET is set to a known insecure placeholder. Aborting boot.'
      )
    }
    return envSecret.trim()
  }

  if (envSecret && envSecret.trim().length >= 32) {
    return envSecret.trim()
  }
  return 'gf-ai-local-dev-jwt-hmac-sha256-secret-key-32chars-minimum-valid'
}

let JWT_SECRET: string = resolveJwtSecret()

export function setJwtSecretForTesting(secret: string): void {
  JWT_SECRET = secret
}

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
   * Revokes a token by its unique JWT ID (jti)
   */
  static revokeToken(jti: string, userId?: string, expiresAt?: number): void {
    if (jti) {
      db.revokeToken(jti, userId, expiresAt)
    }
  }

  /**
   * Checks if a token ID has been revoked
   */
  static isRevoked(jti: string): boolean {
    return db.isTokenRevoked(jti)
  }

  /**
   * Signs and generates an access JWT token (Strict type: 'access').
   */
  static sign(payload: AuthUserPayload, expiresInSeconds = DEFAULT_ACCESS_TOKEN_EXPIRY): string {
    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }

    const jti = payload.jti || randomBytes(16).toString('hex')

    const fullPayload: AuthUserPayload = {
      ...payload,
      type: 'access', // Strict type pinning prevents token-type confusion
      role: payload.role || 'user',
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      jti,
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
   * Cryptographically verifies and decodes an ACCESS JWT token.
   * Strictly enforces payload.type === 'access'.
   * Rejects refresh tokens, expired tokens, revoked tokens, or invalid signatures.
   */
  static verify(token: string): AuthUserPayload | null {
    if (!token || typeof token !== 'string') return null

    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts
    const unsignedToken = `${encodedHeader}.${encodedPayload}`

    try {
      // 0. Enforce pinned algorithm (HS256) and type
      const header = JSON.parse(base64UrlDecode(encodedHeader))
      if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        return null
      }

      // 1. Verify Signature using constant-time comparison
      const expectedSignature = signHmac(unsignedToken, JWT_SECRET)
      const sigBuf = Buffer.from(signature)
      const expectedBuf = Buffer.from(expectedSignature)

      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        return null
      }

      // 2. Decode & Parse Payload
      const payload: AuthUserPayload = JSON.parse(base64UrlDecode(encodedPayload))

      // 3. Strict Token Type Assertion: REJECT REFRESH TOKENS
      if (payload.type !== 'access') {
        return null
      }

      // 4. Check Expiration
      const now = Math.floor(Date.now() / 1000)
      if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < now) {
        return null
      }

      // 5. Verify Issuer and Audience
      if (!payload.iss || payload.iss !== JWT_ISSUER) {
        return null
      }
      if (!payload.aud || payload.aud !== JWT_AUDIENCE) {
        return null
      }

      // 6. Verify Durable Token Revocation
      if (payload.jti && this.isRevoked(payload.jti)) {
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
   * Issues a cryptographically signed refresh token with family tracking.
   */
  static createRefreshToken(userId: string, familyId?: string, generation = 1): string {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'HS256', typ: 'JWT' }
    const famId = familyId || `fam_${randomBytes(12).toString('hex')}`
    const jti = randomBytes(16).toString('hex')
    const exp = now + DEFAULT_REFRESH_TOKEN_EXPIRY

    const payload: AuthUserPayload = {
      userId,
      type: 'refresh', // Strict refresh type
      familyId: famId,
      generation,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      jti,
      iat: now,
      exp,
    }

    const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`
    const sig = signHmac(unsigned, JWT_SECRET)
    const token = `${unsigned}.${sig}`

    // Store in durable refresh token families store
    db.storeRefreshTokenFamily(token, userId, famId, generation, exp * 1000)

    return token
  }

  /**
   * Verifies a refresh token with family tracking and reuse detection.
   */
  static verifyRefreshToken(token: string): {
    userId: string
    jti: string
    familyId: string
    generation: number
    reused: boolean
  } | null {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [h, p, s] = parts

    try {
      const header = JSON.parse(base64UrlDecode(h))
      if (header.alg !== 'HS256' || header.typ !== 'JWT') return null

      const expectedSig = signHmac(`${h}.${p}`, JWT_SECRET)
      const sigBuf = Buffer.from(s)
      const expBuf = Buffer.from(expectedSig)
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

      const payload: AuthUserPayload = JSON.parse(base64UrlDecode(p))
      if (payload.type !== 'refresh' || payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) return null

      const now = Math.floor(Date.now() / 1000)
      if (!payload.exp || payload.exp < now) return null

      if (payload.jti && this.isRevoked(payload.jti)) return null

      // Check Refresh Token Record & Reuse Detection
      const record = db.getRefreshTokenRecord(token)
      if (record && record.isRevoked) {
        // REUSE ATTACK DETECTED: Immediately revoke whole family
        console.warn(`[Security Alert] Refresh token reuse detected for user ${payload.userId}, family ${record.familyId}! Revoking entire token family.`)
        db.revokeRefreshTokenFamily(record.familyId)
        return {
          userId: payload.userId,
          jti: payload.jti || '',
          familyId: record.familyId,
          generation: record.generation,
          reused: true,
        }
      }

      return {
        userId: payload.userId,
        jti: payload.jti || '',
        familyId: payload.familyId || `fam_${payload.userId}`,
        generation: payload.generation || 1,
        reused: false,
      }
    } catch {
      return null
    }
  }

  /**
   * Creates an ephemeral guest token with limited privileges.
   * Generates a completely random ID and forces role 'guest'.
   */
  static createGuestToken(): string {
    const id = `guest_${randomBytes(8).toString('hex')}`
    return this.sign(
      {
        userId: id,
        userName: 'Guest User',
        role: 'guest',
      },
      24 * 60 * 60 // 24 hours
    )
  }
}
