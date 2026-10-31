import type { NextFunction, Request, Response } from 'express'

export interface AuthenticatedRequest extends Request {
  userId: string
  userName?: string
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Check for custom header or bearer token
  const authHeader = req.headers.authorization
  const userHeader = req.headers['x-user-id'] as string

  let userId = 'default-user-1'

  if (userHeader && userHeader.trim()) {
    userId = userHeader.trim()
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    // Support guest token or extracted token
    if (token && token !== 'undefined' && token !== 'null') {
      userId = token.startsWith('user_') ? token : `user_${token.slice(0, 12)}`
    }
  }

  ;(req as AuthenticatedRequest).userId = userId
  next()
}
