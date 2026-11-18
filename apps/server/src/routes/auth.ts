import { Router, type Request, type Response } from 'express'
import { randomBytes } from 'node:crypto'
import { db } from '../db/index.js'
import { EmailService } from '../services/emailService.js'
import { JwtService } from '../services/jwtService.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { rateLimitAuth } from '../middleware/security.js'

export const authRouter = Router()

// Anonymous guest token: issues random, isolated guest identity (24h validity)
authRouter.post('/api/auth/guest', rateLimitAuth, (_req: Request, res: Response) => {
  const token = JwtService.createGuestToken()
  const payload = JwtService.verify(token)
  res.json({
    token,
    user: payload,
    expiresIn: '24h',
  })
})

// Request Magic Link / Email Login
authRouter.post('/api/auth/magic-link/request', rateLimitAuth, async (req: Request, res: Response) => {
  const { email } = req.body || {}
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email address is required', code: 'INVALID_EMAIL' })
  }
  const cleanEmail = email.trim().toLowerCase()

  if (db.isEmailLocked(cleanEmail)) {
    return res.status(429).json({
      error: 'Too many failed verification attempts. Please wait 15 minutes before requesting a new login link.',
      code: 'AUTH_LOCKED',
    })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes
  db.saveMagicToken(cleanEmail, token, expiresAt)

  // Dispatch email using trusted canonical APP_URL
  try {
    await EmailService.sendMagicLink(cleanEmail, token)
  } catch (err: any) {
    console.error('[Auth] Failed to dispatch magic link email:', err.message)
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_AUTH !== 'true') {
      return res.status(503).json({ error: 'Email delivery service temporarily unavailable', code: 'EMAIL_SERVICE_ERROR' })
    }
  }

  const allowTestToken =
    process.env.ENABLE_TEST_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    !process.env.VERCEL

  res.json({
    success: true,
    message: 'If this email address is registered, a magic login link has been dispatched.',
    ...(allowTestToken ? { testToken: token, testEmail: cleanEmail } : {}),
  })
})

// Verify Magic Link and exchange for verified session JWT + Refresh Token
authRouter.post('/api/auth/magic-link/verify', rateLimitAuth, (req: Request, res: Response) => {
  const { email, token } = req.body || {}
  if (!email || !token || typeof email !== 'string' || typeof token !== 'string') {
    return res.status(400).json({ error: 'Email and verification token are required', code: 'INVALID_PAYLOAD' })
  }
  const cleanEmail = email.trim().toLowerCase()
  const account = db.verifyMagicToken(cleanEmail, token.trim())
  if (!account) {
    return res.status(401).json({ error: 'Invalid or expired magic link verification token', code: 'AUTH_FAILED' })
  }

  // Issue verified session token (Strict type: 'access', 15-minute validity)
  const accessToken = JwtService.sign(
    {
      userId: account.id,
      userName: account.email.split('@')[0],
      role: account.role || 'user',
    },
    15 * 60
  )

  // Issue family-tracked refresh token
  const refreshToken = JwtService.createRefreshToken(account.id)
  db.setRefreshToken(account.id, refreshToken)

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      userId: account.id,
      email: account.email,
      userName: account.email.split('@')[0],
      role: account.role || 'user',
    },
    expiresIn: '15m',
  })
})

// Refresh Token Rotation
authRouter.post('/api/auth/refresh', rateLimitAuth, (req: Request, res: Response) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'Refresh token is required', code: 'REFRESH_TOKEN_REQUIRED' })
  }

  const verified = JwtService.verifyRefreshToken(refreshToken)
  if (!verified || verified.reused) {
    return res.status(401).json({ error: 'Invalid, expired, or revoked refresh token', code: 'TOKEN_REVOKED' })
  }

  const account = db.getAccountById(verified.userId)
  if (!account) {
    return res.status(401).json({ error: 'User account not found', code: 'USER_NOT_FOUND' })
  }

  // Revoke presented refresh token
  JwtService.revokeToken(verified.jti)
  db.revokeRefreshToken(refreshToken)

  // Rotate tokens with incremented generation within the same family
  const newAccessToken = JwtService.sign(
    {
      userId: account.id,
      userName: account.email.split('@')[0],
      role: account.role || 'user',
    },
    15 * 60
  )

  const newRefreshToken = JwtService.createRefreshToken(account.id, verified.familyId, verified.generation + 1)
  db.setRefreshToken(account.id, newRefreshToken)

  res.json({
    token: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: '15m',
  })
})

// Logout: Invalidate current access token and presented refresh token
authRouter.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { refreshToken } = req.body || {}

  if (authReq.user?.jti) {
    JwtService.revokeToken(authReq.user.jti, authReq.userId)
  }

  if (refreshToken && typeof refreshToken === 'string') {
    const verified = JwtService.verifyRefreshToken(refreshToken)
    db.revokeRefreshToken(refreshToken)
    if (verified?.familyId) {
      db.revokeRefreshTokenFamily(verified.familyId)
    }
  }

  if (authReq.userId) {
    db.revokeUserRefreshTokens(authReq.userId)
    db.setRefreshToken(authReq.userId, null)
  }

  res.json({ success: true, message: 'Logged out successfully' })
})

// Verify authenticated identity
authRouter.get('/api/auth/me', (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  res.json({
    authenticated: Boolean(authReq.user && authReq.userId),
    userId: authReq.userId || null,
    userName: authReq.userName || null,
    role: authReq.userRole || 'unauthenticated',
  })
})
