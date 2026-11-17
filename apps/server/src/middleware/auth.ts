import type { NextFunction, Request, Response } from 'express'
import { JwtService, type AuthUserPayload } from '../services/jwtService.js'

export interface AuthenticatedRequest extends Request {
  userId: string
  userName?: string
  userRole?: 'user' | 'admin' | 'guest'
  user?: AuthUserPayload
}

/**
 * Authentication Middleware:
 * Validates cryptographically signed JWT Bearer tokens.
 * Enforces verified identity and completely rejects client-side identity spoofing (x-user-id).
 * Does NOT assign a shared default identity (default-user-1) to unauthenticated requests.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  const authHeader = req.headers.authorization

  // 1. Inspect Authorization Bearer header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim()
    if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
      const verified = JwtService.verify(rawToken)
      if (verified && verified.userId) {
        authReq.user = verified
        authReq.userId = verified.userId
        authReq.userName = verified.userName || 'User'
        authReq.userRole = verified.role || 'user'
        return next()
      }
    }
  }

  // 2. Unauthenticated: Leave identity unset (never spoofable from x-user-id or shared default)
  authReq.userId = ''
  authReq.userName = undefined
  authReq.userRole = undefined
  authReq.user = undefined
  next()
}

/**
 * Route guard: Requires a valid, cryptographically verified user or guest token.
 * Prevents unauthenticated access to private resources.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.user || !authReq.userId || authReq.userId.trim() === '') {
    res.status(401).json({
      error: 'Unauthorized: A cryptographically verified authentication token is required to access this resource.',
      code: 'AUTH_REQUIRED',
    })
    return
  }
  next()
}

/**
 * Route guard: Requires registered user account (rejects anonymous guest tokens).
 */
export function requireRegisteredUser(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.user || !authReq.userId || authReq.userRole === 'guest') {
    res.status(403).json({
      error: 'Forbidden: Full registered account required for this operation.',
      code: 'REGISTERED_ACCOUNT_REQUIRED',
    })
    return
  }
  next()
}

/**
 * Route guard: Requires administrator role.
 * Derived strictly from ADMIN_EMAILS environment allowlist; logs all administrative operations.
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

  // Audit logging of all administrative operations (non-repudiation)
  console.log(
    `[SECURITY AUDIT] Admin operation executed: user=${authReq.userId} role=admin ip=${req.ip || req.socket?.remoteAddress || '127.0.0.1'} method=${req.method} path=${req.originalUrl || req.path} timestamp=${new Date().toISOString()}`
  )
  next()
}
