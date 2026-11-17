/**
 * Central API Client for GF-AI Frontend
 * ──────────────────────────────────────
 * Handles:
 * - Centralized API URL resolution
 * - Cryptographic JWT Bearer token injection
 * - Refresh-token rotation and session recovery on 401
 * - Automatic guest session bootstrapping
 * - Standard request timeouts and error handling
 * - Contract response unwrapping ({ quote })
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_STORAGE_KEY = 'gf_auth_jwt_token'
const REFRESH_TOKEN_STORAGE_KEY = 'gf_auth_refresh_token'

let inMemoryToken: string | null = null
let inMemoryRefreshToken: string | null = null

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY)
      if (stored && stored.split('.').length === 3) {
        inMemoryToken = stored
        return stored
      }
    } catch {
      // sessionStorage unavailable
    }
  }
  return null
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    } catch {
      // sessionStorage unavailable
    }
  }
}

export function getRefreshToken(): string | null {
  if (inMemoryRefreshToken) return inMemoryRefreshToken
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
      if (stored && stored.split('.').length === 3) {
        inMemoryRefreshToken = stored
        return stored
      }
    } catch {
      // sessionStorage unavailable
    }
  }
  return null
}

export function setRefreshToken(refreshToken: string | null): void {
  inMemoryRefreshToken = refreshToken
  if (typeof window !== 'undefined') {
    try {
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
      }
    } catch {
      // sessionStorage unavailable
    }
  }
}

export function apiUrl(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE}${clean}`
}

/**
 * Ensures a valid authentication token exists.
 * If none exists, bootstraps an anonymous guest session token.
 */
export async function ensureAuthToken(): Promise<string | null> {
  let token = getAuthToken()
  if (token) return token

  try {
    const res = await fetch(apiUrl('/api/auth/guest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.token) {
        setAuthToken(data.token)
        return data.token
      }
    }
  } catch (err) {
    console.warn('[API Client] Could not bootstrap guest token:', err)
  }
  return null
}

/**
 * Robust fetch wrapper with automatic JWT authorization, timeout, and token refresh.
 */
export async function apiFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const token = await ensureAuthToken()
  const headers = new Headers(init.headers || {})

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Default timeout 15s if not already provided
  let signal = init.signal
  if (!signal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    signal = AbortSignal.timeout(15000)
  }

  const url = apiUrl(endpoint)
  let response = await fetch(url, { ...init, headers, signal })

  // Token refresh logic on 401
  if (response.status === 401) {
    const rToken = getRefreshToken()
    let refreshed = false

    if (rToken) {
      try {
        const refreshRes = await fetch(apiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rToken }),
          signal: AbortSignal.timeout(6000),
        })

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          if (refreshData?.token) {
            setAuthToken(refreshData.token)
            if (refreshData.refreshToken) {
              setRefreshToken(refreshData.refreshToken)
            }
            headers.set('Authorization', `Bearer ${refreshData.token}`)
            response = await fetch(url, { ...init, headers, signal })
            refreshed = true
          }
        }
      } catch {
        // Refresh token attempt failed
      }
    }

    if (!refreshed) {
      setAuthToken(null)
      setRefreshToken(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: 'session_expired' } }))
      }
      // Strictly fail closed: do NOT silently bootstrap anonymous guest token for registered user
    }
  }

  return response
}

/**
 * Standardized response helper: extracts { quote } or top-level item safely.
 */
export function extractQuote(data: any): any {
  if (!data) return null
  return data.quote || data
}
