/**
 * Cryptographic JWT & Identity Service for GF-AI
 * ──────────────────────────────────────────────
 * Zero-dependency implementation using Node.js native `node:crypto`.
 * Implements HMAC-SHA256 signature verification, constant-time comparison,
 * expiration checks, strict audience/issuer checks, token revocation,
 * and refresh-token rotation.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export interface AuthUserPayload {
  userId: string
  userName?: string
  role?: 'user' | 'admin' | 'guest'
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  jti?: string
}

export const JWT_ISSUER = 'gf-ai-security'
export const JWT_AUDIENCE = 'gf-ai-client'
const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

// Secure server-side secret with fail-fast enforcement in production
function resolveJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    if (!envSecret || envSecret.trim().length < 32) {
      throw new Error(
        'FATAL [Security]: JWT_SECRET environment variable is missing or shorter than 32 characters in production. Aborting boot.'
      )
    }
    if (envSecret.trim() === 'super_secret_ada_jwt_key') {
      throw new Error(
        'FATAL [Security]: JWT_SECRET is set to the insecure default placeholder ("super_secret_ada_jwt_key"). Aborting boot.'
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
  private static revokedJtis: Set<string> = new Set()

  /**
   * Revokes a token by its unique JWT ID (jti)
   */
  static revokeToken(jti: string): void {
    if (jti) {
      this.revokedJtis.add(jti)
    }
  }

  /**
   * Checks if a token ID has been revoked
   */
  static isRevoked(jti: string): boolean {
    return this.revokedJtis.has(jti)
  }

  /**
   * Signs and generates a tamper-proof JWT token.
   */
  static sign(payload: AuthUserPayload, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): string {
    const now = Math.floor(Date.now() / 1000)
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }

    const jti = payload.jti || randomBytes(16).toString('hex')

    const fullPayload: AuthUserPayload = {
      ...payload,
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
   * Cryptographically verifies and decodes a JWT token.
   * Returns null if signature is invalid, expired, revoked, or malformed.
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

      // 3. Check Expiration
      const now = Math.floor(Date.now() / 1000)
      if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < now) {
        return null
      }

      // 4. Verify Issuer and Audience
      if (!payload.iss || payload.iss !== JWT_ISSUER) {
        return null
      }
      if (!payload.aud || payload.aud !== JWT_AUDIENCE) {
        return null
      }

      // 5. Verify Token Revocation
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
   * Issues a cryptographically signed refresh token (30-day validity).
   */
  static createRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      userId,
      type: 'refresh',
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      jti: randomBytes(16).toString('hex'),
      iat: now,
      exp: now + 30 * 24 * 60 * 60,
    }
    const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`
    const sig = signHmac(unsigned, JWT_SECRET)
    return `${unsigned}.${sig}`
  }

  /**
   * Verifies a refresh token.
   */
  static verifyRefreshToken(token: string): { userId: string; jti: string } | null {
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
      const payload = JSON.parse(base64UrlDecode(p))
      if (payload.type !== 'refresh' || payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) return null
      const now = Math.floor(Date.now() / 1000)
      if (!payload.exp || payload.exp < now) return null
      if (payload.jti && this.isRevoked(payload.jti)) return null
      return { userId: payload.userId, jti: payload.jti }
    } catch {
      return null
    }
  }

  /**
   * Creates an ephemeral guest token with limited privileges.
   * Generates a completely random ID and forces role 'guest'.
   * Never accepts role or userId overrides from callers.
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
