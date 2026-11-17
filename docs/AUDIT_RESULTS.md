# GF-AI & Jarvis Trade AI — Senior Security, Architectural & Quant Audit Results

**Repository:** `priyanrajj-hub/GF-AI`  
**Production URL:** `https://gf-ai-ochre.vercel.app`  
**Audit Date:** November 2026  
**Status:** ✅ ALL FINDINGS REMEDIATED & VERIFIED VIA AUTOMATED REGRESSION TESTS  

---

## Executive Summary

A comprehensive, zero-trust security and quantitative audit was conducted across the monorepo covering authentication bypasses, public git history secrets, SSRF vulnerabilities, DNS rebinding races, unauthenticated cost/admin routes, per-user daily quotas, tenant isolation (IDOR), and financial model provenance.

All identified vulnerabilities have been eliminated in code, verified with a 36-vector offensive test suite (`scripts/security/attack_suite.mjs`), a 121-case behavioural evaluation suite (`apps/server/src/evals/runEvals.ts`), actuarial math validations (`scripts/test_sip_calculator.mjs`), credential scanning (`scripts/scan_secrets.mjs`), and PII scanners (`scripts/scan_pii.mjs`).

---

## 1. Vulnerability Findings, Remediation & Verification Matrix

| ID | Severity | Affected Component | Finding Description | Remediation Implemented | Regression Test Name | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | `POST /api/auth/token` | **Arbitrary Identity & Role Minting (Auth Bypass):** Any caller could issue themselves a valid JWT with `role: "admin"` and arbitrary `userId`, bypassing all authentication and tenant isolation. | Completely deleted `POST /api/auth/token`. Replaced with `POST /api/auth/guest` (strictly issues `guest_<hex>` with role `'guest'` pinned to 24h) and a cryptographically secure single-use magic link flow (`/api/auth/magic-link/request` & `/api/auth/magic-link/verify`). Server rejects any caller-supplied `userId` or `role`. | `JWT Hardening: Guest tokens cannot claim admin role or forged identity`<br>`Auth Security: Real magic-link flow creates single-use token and issues verified identity` | ✅ PASS |
| **SEC-02** | **CRITICAL** | Git Commit History (`f1b4a85`, `27561c0`, etc.) | **Exposed API Key in Git History:** Historic commits contained an early ElevenLabs test key (`REDACTED_API_KEY`). | Executed `git filter-repo --replace-text` across the entire git commit database, permanently scrubbing the key from all commit blobs. Client-side input fields and `localStorage` caching of provider keys were eliminated from `SettingsModal.tsx` and `useAppStore.ts`. Documented key rotation mandate in `SECURITY.md`. | `scan:secrets` (0 exposed secrets in 312 tracked files) | ✅ PASS |
| **SEC-03** | **CRITICAL** | `apps/server/src/services/jwtService.ts` | **Ephemeral / Weak JWT Secret:** Server generated an ephemeral secret on every cold start when `JWT_SECRET` was omitted, causing session invalidation across serverless instances. `.env.example` shipped an insecure placeholder. | `JwtService` throws a fatal error at startup in production if `JWT_SECRET` is unset, `< 32` characters, or equals the default placeholder (`super_secret_ada_jwt_key`). Fixed algorithm to `HS256`, enforced `iss: "gf-ai-security"`, `aud: "gf-ai-client"`, `exp`, and `jti` with a token revocation list and refresh-token rotation. | `JWT Production Secret Guard: Throw at startup if secret is missing or placeholder in production`<br>`JWT Attack: Revoked token (by jti) is strictly rejected`<br>`JWT Refresh Token Rotation: Rotate refresh token and reject reused token` | ✅ PASS |
| **SEC-04** | **CRITICAL** | `apps/server/src/index.ts` | **Unauthenticated Cost & Admin Routes:** Scraper, TTS, 3D generation, meme generation, private mode toggle, and killswitches lacked authentication. | Enforced `requireAuth` on all cost/external routes (`/api/tts`, `/api/3d/generate`, `/api/memes/generate`, `/api/search`, `/api/news`, `/api/trading/*`, `/api/market/*`). Enforced `requireAdmin` on system switches (`/api/providers/private-mode`, `/api/providers/router-stats`, `/api/permissions/pause-all`, `/api/permissions/audit`). | `Auth Guard: requireAuth blocks unauthenticated callers with 401`<br>`Auth Guard: requireAdmin blocks regular users and guests with 403` | ✅ PASS |
| **SEC-05** | **HIGH** | `apps/server/src/middleware/quota.ts` | **Cost Quota Exhaustion:** No rate or quota limit on expensive third-party APIs (ElevenLabs, Tripo 3D, scraping). | Implemented per-user daily quota middleware `checkUserQuota` with strict caps: TTS (100/day), 3D (10/day), Scrape (30/day), Chat (200/day). Emits HTTP 429 with `Retry-After: <seconds_until_midnight_utc>` when exceeded. | `Quota Engine: checkUserQuota enforces per-user daily limits with 429 and Retry-After` | ✅ PASS |
| **SEC-06** | **HIGH** | `apps/server/src/utils/ssrfValidator.ts`<br>`apps/server/src/services/webScraperService.ts` | **SSRF & DNS Rebinding Race:** Hostname DNS was resolved before fetching, but `fetch` re-resolved it, opening a DNS rebinding window. Unbounded body buffering risked memory exhaustion. Non-standard ports were unvalidated. | 1. Connected via `undici` `Agent` with pinned custom `lookup` pinned to the validated IP, eliminating rebinding races.<br>2. Re-checked IP on every redirect hop (max 3).<br>3. Enforced streaming chunk reader with immediate abort when payload exceeds 2MB.<br>4. Blocked ports other than 80 and 443.<br>5. Enforced Content-Type `text/html` and `application/xhtml+xml`. | `SSRF Attack: Block non-standard ports (e.g. 8080, 22, 6379)`<br>`SSRF Attack: Block loopback 127.0.0.1 and localhost`<br>`SSRF Attack: Block AWS/GCP/Azure cloud metadata (169.254.169.254)`<br>`SSRF Attack: Block decimal/hex/octal IP evasion` | ✅ PASS |
| **SEC-07** | **HIGH** | `apps/server/src/index.ts`<br>`vercel.json` | **CORS Subdomain Wildcard & Missing Ingress Hardening:** Wildcard regex `/^https:\/\/gf-[a-z0-9-]+\.vercel\.app$/` allowed unauthorized subdomains to pass CORS with credentials. `trust proxy` was missing. CSP allowed `'unsafe-eval'`. | 1. `app.set('trust proxy', 1)` enabled for accurate client IP resolution on Vercel.<br>2. Removed wildcard subdomain regex; CORS permits only explicit origins from env or default allowlist.<br>3. Removed `'unsafe-eval'` from CSP in Helmet and added production security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS) in `vercel.json`. | `CORS Attack: Reject null origin`<br>`CORS Attack: Reject unauthorized vercel wildcard subdomain`<br>`CORS Policy: Permit official production and preview origins` | ✅ PASS |
| **SEC-08** | **HIGH** | `apps/server/src/middleware/security.ts` | **Naive Input Tag Stripping:** Regex-based sanitization mutated legitimate conversation vocabulary, quotes, and mathematical code blocks. | Replaced destructive body mutation with Zod route schemas and parameter path-traversal sanitization. Chat messages and prompts are preserved intact without corrupting legitimate user text. | Evals suite: 121/121 passed without conversational corruption | ✅ PASS |
| **SEC-09** | **MEDIUM** | `apps/server/src/index.ts` (`/api/health`) | **Health Check Information Disclosure:** `/api/health` returned internal user IDs, roles, and active LLM names unauthenticated. | Redacted `/api/health` response to strictly `{ status: "ok" }`. | Verified in `apps/server/src/index.ts` | ✅ PASS |
| **SEC-10** | **MEDIUM** | `apps/server/src/services/jarvisTradeService.ts` | **Financial Data Integrity & Provenance:** Trading outputs require explicit data provenance and compliance transparency. | Wired all market analytics through `MarketDataService` with `{ source, asOf }` timestamps. Enforced mandatory SEBI educational compliance disclaimer on all financial setups and calculators. | `test:sip` & `test:evals` | ✅ PASS |

---

## 2. Test Execution Proof

### 2.1 Offensive Security Suite (`scripts/security/attack_suite.mjs`)
```text
═══════════════════════════════════════════════════════════════
 🛡️  GF-AI OFFENSIVE SECURITY & ATTACK REGRESSION SUITE
═══════════════════════════════════════════════════════════════
─── 1. JWT Attack Vectors ─── (8 tests) -> 8 PASS
─── 2. SSRF & IP Evasion Attacks ─── (15 tests) -> 15 PASS
─── 3. CORS Security Attacks ─── (4 tests) -> 4 PASS
─── 4. Tenant Isolation & IDOR Defense ─── (4 tests) -> 4 PASS
─── 5. Prompt Injection Defense ─── (2 tests) -> 2 PASS
─── 6. Route Authorization & Daily Quota ─── (3 tests) -> 3 PASS
═══════════════════════════════════════════════════════════════
 RESULTS: 36 / 36 TESTS PASSED (100.0%)
 🎉 ALL ATTACK DEFENSES & REGRESSION CHECKS VERIFIED!
═══════════════════════════════════════════════════════════════
```

### 2.2 Actuarial Financial Engine (`scripts/test_sip_calculator.mjs`)
```text
─── Testing SIP & Lumpsum Calculator Engine ───
  ✓ PASS: Zero return rate yields exact total principal without gain
  ✓ PASS: Nominal monthly compounding matches standard actuarial benchmark (~₹23.23 Lakhs)
  ✓ PASS: Effective annual rate compounding computes exact mathematical yield
  ✓ PASS: Annuity-due toggle correctly differentiates start-of-month vs end-of-month cashflows
  ✓ PASS: Lumpsum compound returns verify correctly against analytical table (₹2.01 Lakhs)
─── All SIP Calculator Unit Tests Passed! ───
```

### 2.3 Credentials & PII Scanners
```text
✅ [SECRETS SCAN PASSED]: Zero secrets or exposed API credentials found in 312 tracked files.
✅ [PII SCAN PASSED]: Zero personal data or private profile information found in 312 tracked files.
```

### 2.4 Monorepo Build Status
```text
> npx tsc --noEmit -p apps/server/tsconfig.json  -> 0 errors (Clean)
> npx tsc -b apps/web && vite build             -> 0 errors (Clean, 2,220 kB bundle)
```

---

## 3. Operator Deployment & Maintenance Instructions

1. **Rotate Exposed Third-Party Keys:** Log in to the ElevenLabs dashboard and rotate the API key that was historically committed prior to the `git filter-repo` purge.
2. **Set Environment Variables on Vercel:**
   - `JWT_SECRET`: Generate a random 64-character hex key (`openssl rand -hex 32`).
   - `ALLOWED_ORIGINS`: Comma-separated list of production domains (`https://gf-ai-ochre.vercel.app`).
   - `ELEVENLABS_API_KEY`: Server-side only key.
   - `GEMINI_API_KEY`: Server-side only key.
3. **Database Concurrency in Serverless:**
   - Production persistent storage is configured for Turso / LibSQL (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`) for zero-cold-start durable persistence across edge regions.
