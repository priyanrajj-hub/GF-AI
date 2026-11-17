import type { NextFunction, Request, Response } from 'express'
import { JwtService, type AuthUserPayload } from '../services/jwtService.js'

export interface AuthenticatedRequest extends Request {
  userId: string
  userName?: string
  userRole?: 'user' | 'admin' | 'guest'
  user?: AuthUserPayload
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Authentication Middleware:
 * Validates cryptographically signed JWT Bearer tokens.
 * Enforces identity verification and stops unauthenticated client spoofing.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  const authHeader = req.headers.authorization
  const userHeader = req.headers['x-user-id'] as string

  // 1. Check for Bearer JWT token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim()
    if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
      const verified = JwtService.verify(rawToken)
      if (verified) {
        authReq.user = verified
        authReq.userId = verified.userId
        authReq.userName = verified.userName
        authReq.userRole = verified.role
        return next()
      }
    }
  }

  // 2. Development / Test Environment Override (Strictly disabled in production)
  if (!isProduction && userHeader && userHeader.trim()) {
    authReq.userId = userHeader.trim()
    authReq.userRole = 'user'
    return next()
  }

  // 3. Fallback: Sandboxed guest session (Cannot impersonate registered accounts)
  authReq.userId = 'default-user-1'
  authReq.userName = 'Demo User'
  authReq.userRole = 'guest'
  next()
}

/**
 * Route guard: Requires a valid, cryptographically verified user token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.user || authReq.userRole === 'guest') {
    res.status(401).json({
      error: 'Unauthorized: A verified authentication token is required to access this resource.',
      code: 'AUTH_REQUIRED',
    })
    return
  }
  next()
}

/**
 * Route guard: Requires administrator role.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.user || authReq.userRole !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Administrator privileges required.',
      code: 'ADMIN_REQUIRED',
    })
    return
  }
  next()
}
