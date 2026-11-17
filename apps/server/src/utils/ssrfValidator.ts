/**
 * SSRF (Server-Side Request Forgery) Defense Validator
 * ───────────────────────────────────────────────────
 * Validates external URLs against DNS rebinding, internal subnets,
 * loopback interfaces, cloud metadata endpoints, decimal/hex/octal IP evasion,
 * and unauthorized protocols.
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
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
])

/**
 * Checks if an IPv4 address falls within private, loopback, or metadata CIDR ranges.
 */
export function isPrivateIpv4(ip: string): boolean {
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

  // 0.0.0.0/8 (Current network / unassigned)
  if (a === 0) return true

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true

  // 255.255.255.255 (Broadcast)
  if (parts.every((p) => p === 255)) return true

  return false
}

/**
 * Checks if an IPv6 address falls within private, loopback, or unique-local ranges.
 */
export function isPrivateIpv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim()

  // ::1 / :: (Loopback & unspecified)
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1') return true

  // fc00::/7 (Unique Local Addresses)
  if (clean.startsWith('fc') || clean.startsWith('fd')) return true

  // fe80::/10 (Link-Local unicast)
  if (clean.startsWith('fe80:') || clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:127.0.0.1)
  if (clean.includes('::ffff:')) {
    const v4Part = clean.split('::ffff:')[1]
    if (v4Part) {
      if (isIP(v4Part) === 4) return isPrivateIpv4(v4Part)
      const parsed = tryParseIntegerIp(v4Part)
      if (parsed) return isPrivateIpv4(parsed)
    }
  }

  return false
}

/**
 * Parses integer, hex, or octal IP evasion techniques into standard dot-decimal IPv4.
 * E.g., "2130706433" -> "127.0.0.1", "0x7f000001" -> "127.0.0.1", "0177.0.0.1" -> "127.0.0.1".
 */
export function tryParseIntegerIp(hostname: string): string | null {
  const clean = hostname.replace(/[\[\]]/g, '').trim()

  // 1. Decimal integer: e.g. 2130706433
  if (/^\d+$/.test(clean)) {
    const num = Number(clean)
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join('.')
    }
  }

  // 2. Hexadecimal integer: e.g. 0x7f000001
  if (/^0x[0-9a-fA-F]+$/i.test(clean)) {
    const num = Number(clean)
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255,
      ].join('.')
    }
  }

  // 3. Dotted octal or mixed hex notation: e.g. 0177.0.0.1 or 0x7f.0.0.1
  if (clean.includes('.')) {
    const segments = clean.split('.')
    if (segments.length === 4) {
      const parsed: number[] = []
      for (const seg of segments) {
        let n: number
        if (/^0x[0-9a-fA-F]+$/i.test(seg)) {
          n = parseInt(seg, 16)
        } else if (/^0[0-7]+$/.test(seg)) {
          n = parseInt(seg, 8)
        } else if (/^\d+$/.test(seg)) {
          n = parseInt(seg, 10)
        } else {
          return null
        }
        if (isNaN(n) || n < 0 || n > 255) return null
        parsed.push(n)
      }
      return parsed.join('.')
    }
  }

  return null
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 * Performs protocol checks, hostname inspection, IP normalization, and DNS pre-resolution.
 */
export async function validateUrlForSsrf(
  targetUrl: string,
  domainAllowlist?: string[]
): Promise<SsrfValidationResult> {
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
    return {
      safe: false,
      error: `Unauthorized protocol "${parsed.protocol}". Only http: and https: are allowed.`,
    }
  }

  // 1.5. Disallow non-standard ports (strictly permit 80 and 443)
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80)
  if (port !== 80 && port !== 443) {
    return {
      safe: false,
      error: `Unauthorized port "${port}". Only standard web ports (80, 443) are permitted.`,
    }
  }

  const hostname = parsed.hostname.toLowerCase()

  // 2. Reject explicit prohibited hostnames
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { safe: false, error: `Blocked access to internal hostname "${hostname}"` }
  }

  // 3. Check for integer / hex / octal IP representations
  const normalizedIp = tryParseIntegerIp(hostname)
  if (normalizedIp) {
    if (isPrivateIpv4(normalizedIp)) {
      return {
        safe: false,
        error: `Blocked access to private IP "${normalizedIp}" represented as "${hostname}"`,
      }
    }
  }

  // 4. If hostname is already a raw standard IP literal, check it directly
  const ipType = isIP(hostname)
  if (ipType === 4 && isPrivateIpv4(hostname)) {
    return { safe: false, error: `Blocked access to private IPv4 address "${hostname}"` }
  }
  if (ipType === 6 && isPrivateIpv6(hostname)) {
    return { safe: false, error: `Blocked access to private IPv6 address "${hostname}"` }
  }

  // 5. Optional domain allowlist check if specified
  if (domainAllowlist && domainAllowlist.length > 0) {
    const isDomainAllowed = domainAllowlist.some(
      (d) => hostname === d.toLowerCase() || hostname.endsWith(`.${d.toLowerCase()}`)
    )
    if (!isDomainAllowed) {
      return { safe: false, error: `Domain "${hostname}" is not in the allowed domain list` }
    }
  }

  // 6. Perform DNS pre-lookup to prevent DNS rebinding to internal addresses
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
