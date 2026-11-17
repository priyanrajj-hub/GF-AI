/**
 * Central API Client for GF-AI Frontend
 * ──────────────────────────────────────
 * Handles:
 * - Centralized API URL resolution
 * - Cryptographic JWT Bearer token injection
 * - Automatic guest session bootstrapping
 * - Standard request timeouts and error handling
 * - Request cancellation and token refresh
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_STORAGE_KEY = 'gf_auth_jwt_token'

let inMemoryToken: string | null = null

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
 * Robust fetch wrapper with automatic JWT authorization, timeout, and JSON handling.
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

  // Auto-refresh guest token on 401 and retry once
  if (response.status === 401) {
    setAuthToken(null)
    const freshToken = await ensureAuthToken()
    if (freshToken) {
      headers.set('Authorization', `Bearer ${freshToken}`)
      response = await fetch(url, { ...init, headers, signal })
    }
  }

  return response
}
