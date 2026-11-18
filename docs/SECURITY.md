# Security Policy, Key Rotation & Vulnerability Management

This document defines the strict secret rotation procedures, zero-trust cryptographic requirements, and vulnerability management policy for **GF-AI & Jarvis Trade AI**.

---

## 🚨 MANDATORY ACTION: Rotate ElevenLabs & Third-Party API Keys

> [!CAUTION]
> **ROTATE YOUR ELEVENLABS KEY IN THE ELEVENLABS CONSOLE FIRST BEFORE RE-ENABLING ELEVENLABS IN PRODUCTION.**
> Any key that has ever appeared in any commit history or document must be treated as compromised.
> 
> **Step-by-step key rotation instructions:**
> 1. Sign in to your [ElevenLabs Console](https://elevenlabs.io/app/voice-library).
> 2. Go to **Profile → API Keys**.
> 3. Click **Revoke / Delete** on the existing key immediately.
> 4. Generate a new high-entropy secret key.
> 5. Update the secret in cloud environment variables (e.g. Vercel Project Settings, Kubernetes Secrets, or Docker `.env`).
> 6. **NEVER** write or print secret values into documentation, source files, terminal logs, or test output.

---

## 1. Secret Scrubbing & Full-History Gitleaks Policy

- **Full-History Scanning**: Automated CI pipelines execute Gitleaks with `--fetch-depth: 0` on every push and pull request.
- **Pre-Commit Local Verification**: Developers must execute `npm run scan:secrets` and `npm run scan:pii` prior to staging any file. The scanner recursively examines `docs/`, `scripts/`, `apps/`, and `packages/` with redaction filters to ensure zero raw credential strings appear in console output.
- **Gitignore Enforcement**: All `.env*` files are strictly excluded via `.gitignore`. Only `.env.example` is committed with sanitized dummy placeholders.

---

## 2. Cryptographic JWT Authentication & Token Families

- **Token Type Segregation**: Access tokens (`type: "access"`, 15-minute TTL) and refresh tokens (`type: "refresh"`, 7-day TTL) are strictly segregated. Verification endpoints reject mismatched claims.
- **Timing-Safe Comparison**: All token, signature, and magic link comparisons use `crypto.timingSafeEqual` to prevent side-channel timing attacks.
- **Refresh Token Families & Reuse Detection**: Refresh tokens are stored SHA-256 hashed with associated `family_id`. Duplicate presentation of a spent refresh token triggers automated revocation of the entire family and terminates the session.
- **Admin Role Verification**: The `admin` role is **never** granted by request parameters or database defaults; it is derived exclusively from the server-side `ADMIN_EMAILS` environment allowlist.

---

## 3. Network & SSRF Defense Architecture

- **Private Network Blocking**: Requests to RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local metadata (`169.254.169.254`), and loopback addresses are blocked at the socket layer.
- **IP Representation Normalization**: The SSRF shield normalizes and blocks integer (`2130706433`), hex (`0x7f000001`), dotted octal (`0177.0.0.1`), IPv6 loopback (`[::1]`), and IPv4-mapped IPv6 formats.

---

## 4. Vulnerability Disclosure & SLA

To report security vulnerabilities:
- **Email**: `security@gf-ai.app`
- **Initial Response SLA**: Within 24 hours.
- **Critical Remediation SLA**: Patch deployed within 48 hours.
