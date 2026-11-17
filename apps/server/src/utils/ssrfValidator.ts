/**
 * SSRF (Server-Side Request Forgery) Defense Validator
 * ───────────────────────────────────────────────────
 * Validates external URLs against DNS rebinding, internal subnets,
 * loopback interfaces, cloud metadata endpoints, and private IP blocks.
 */

import dns from 'node:dns/promises'
import { isIP } from 'node:net'

export interface SsrfValidationResult {
  safe: boolean
  error?: string
  resolvedIps?: string[]
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '::1',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
])

/**
 * Checks if an IPv4 address falls within private, loopback, or metadata CIDR ranges.
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10))
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true // Malformed IP treated as unsafe
  }

  const [a, b] = parts

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true

  // 10.0.0.0/8 (Private)
  if (a === 10) return true

  // 172.16.0.0/12 (Private: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true

  // 169.254.0.0/16 (Link-Local & Cloud Metadata: AWS/GCP/Azure)
  if (a === 169 && b === 254) return true

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true

  // 240.0.0.0/4 (Reserved)
  if (a >= 240) return true

  return false
}

/**
 * Checks if an IPv6 address falls within private, loopback, or unique-local ranges.
 */
function isPrivateIpv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim()

  // ::1 / :: (Loopback & unspecified)
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1') return true

  // fc00::/7 (Unique Local Addresses)
  if (clean.startsWith('fc') || clean.startsWith('fd')) return true

  // fe80::/10 (Link-Local unicast)
  if (clean.startsWith('fe80:')) return true

  // IPv4-mapped IPv6 (::ffff:192.168.1.1)
  if (clean.includes('::ffff:')) {
    const v4Part = clean.split('::ffff:')[1]
    if (v4Part && isIP(v4Part) === 4) {
      return isPrivateIpv4(v4Part)
    }
  }

  return false
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 * Performs protocol checks, hostname inspection, and DNS pre-resolution.
 */
export async function validateUrlForSsrf(targetUrl: string): Promise<SsrfValidationResult> {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { safe: false, error: 'Empty or non-string URL provided' }
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return { safe: false, error: 'Malformed URL' }
  }

  // 1. Enforce strict HTTP/HTTPS protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: `Unauthorized protocol "${parsed.protocol}". Only http: and https: are allowed.` }
  }

  const hostname = parsed.hostname.toLowerCase()

  // 2. Reject explicit prohibited hostnames
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { safe: false, error: `Blocked access to internal hostname "${hostname}"` }
  }

  // 3. If hostname is already a raw IP literal, check it directly
  const ipType = isIP(hostname)
  if (ipType === 4 && isPrivateIpv4(hostname)) {
    return { safe: false, error: `Blocked access to private IPv4 address "${hostname}"` }
  }
  if (ipType === 6 && isPrivateIpv6(hostname)) {
    return { safe: false, error: `Blocked access to private IPv6 address "${hostname}"` }
  }

  // 4. Perform DNS pre-lookup to prevent DNS rebinding to internal addresses
  try {
    const lookupResults = await dns.lookup(hostname, { all: true })
    if (!lookupResults || lookupResults.length === 0) {
      return { safe: false, error: `Could not resolve hostname "${hostname}" via DNS` }
    }

    const resolvedIps = lookupResults.map((r) => r.address)

    for (const res of lookupResults) {
      if (res.family === 4 && isPrivateIpv4(res.address)) {
        return {
          safe: false,
          error: `DNS resolution for "${hostname}" points to private IPv4 ${res.address}`,
          resolvedIps,
        }
      }
      if (res.family === 6 && isPrivateIpv6(res.address)) {
        return {
          safe: false,
          error: `DNS resolution for "${hostname}" points to private IPv6 ${res.address}`,
          resolvedIps,
        }
      }
    }

    return { safe: true, resolvedIps }
  } catch (err: any) {
    return { safe: false, error: `DNS lookup failed for "${hostname}": ${err.message}` }
  }
}
