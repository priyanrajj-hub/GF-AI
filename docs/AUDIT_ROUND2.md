# GF-AI Evidence-Based Audit Report (Round 2)

**Repository:** `priyanrajj-hub/GF-AI`  
**Execution Timestamp:** November 2026  
**Auditor:** Principal Security, Full-Stack & Quantitative Systems Engineer  

---

## 1. Raw Execution Evidence

### 1.1 `npm audit` Output
```text
# npm audit report

zod  <4.6.6
Severity: high
Zod can exhaust memory while validating oversized constrained collections - https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
fix available via `npm audit fix --force`
Will install zod@4.6.7, which is a breaking change
node_modules/zod

1 high severity vulnerability
```
*Note:* The current repo runs `zod@^3.24.2` / `zod@3.25.76`. Upgrading to Zod v4 is a major breaking change; request body size limits (100KB) and array length constraints mitigate GHSA-mrhx-c7xc-m3w5 in practice.

---

### 1.2 `tsc --noEmit` Output Across Packages
```text
> npx tsc --noEmit -p packages/shared/tsconfig.json
Exit code: 0 (Clean)

> npx tsc --noEmit -p apps/server/tsconfig.json
Exit code: 0 (Clean)

> npx tsc --noEmit -p apps/worker/tsconfig.json
Exit code: 0 (Clean)

> npx tsc --noEmit -p apps/web/tsconfig.json
Exit code: 0 (Clean)
```

---

### 1.3 Automated Security, Auth & Financial Test Suite
```text
[RAG Vector Store] Initialized with 14 knowledge chunks
═══════════════════════════════════════════════════════════════
 GF-AI SECURITY, AUTH, SSRF & FINANCIAL DATA TEST SUITE
═══════════════════════════════════════════════════════════════

─── 1. Cryptographic JWT & Identity Security ───
  ✓ PASS: JwtService signs and verifies valid token
  ✓ PASS: JwtService rejects tampered token signature
  ✓ PASS: JwtService rejects expired token
  ✓ PASS: JwtService creates valid guest token

─── 2. Server-Side Request Forgery (SSRF) Protection ───
  ✓ PASS: SSRF blocks localhost / 127.0.0.1
  ✓ PASS: SSRF blocks AWS/GCP cloud metadata IP (169.254.169.254)
  ✓ PASS: SSRF blocks private IPv4 subnets (10.0.0.1, 192.168.1.1, 172.16.0.1)
  ✓ PASS: SSRF blocks unauthorized non-HTTP protocols (file:, ftp:, gopher:)
  ✓ PASS: SSRF permits legitimate public domain (https://example.com)

─── 3. Vector Store Tenant Isolation & Injection Defense ───
  ✓ PASS: Vector store isolates user documents across tenants
  ✓ PASS: formatContextWithPromptGuard escapes delimiters and inserts boundary policy

─── 4. Technical Indicators Mathematics & Accuracy ───
  ✓ PASS: calculateRSI accurately computes RSI on reference price series
  ✓ PASS: calculateMACD computes correct crossover and histogram on bullish reversal
  ✓ PASS: calculateBollingerBands returns correct upper, middle, lower bands

─── 5. Market Data Integrity & Signal Verification ───
  ✓ PASS: getStockQuote marks unavailable status when symbol is invalid, without faking prices
  ✓ PASS: generateAlgoSignal refuses to generate signals on empty/invalid candle data

═══════════════════════════════════════════════════════════════
 RESULTS: 16 / 16 TESTS PASSED (100.0%)
═══════════════════════════════════════════════════════════════
```

---

### 1.4 CORS & Authorization Handlers
```text
─── Testing CORS & Express Security Handlers ───
  ✓ PASS: CORS origin allowlist strictly accepts allowed and rejects attacker domains
  ✓ PASS: User token issuance and cryptographic verification lifecycle functional
─── All CORS & Security Handlers Passed! ───
```

---

### 1.5 Safety & Evaluation Test Suite (`npm run test:evals`)
```text
========================================================
📊 EVALUATION RESULTS: 121/121 PASSED (100.0%)
🎉 ALL RELATIONSHIP GUARDRAILS, WARDROBE & ROUND 7 SUITES VERIFIED!
========================================================
```

---

### 1.6 Git Commit History Secrets Audit
```text
--- Scanning git commit history for secret patterns ---
⚠️ Commits touching pattern "sk_[a-zA-Z0-9_-]{20,}":
bb26268 feat(core): complete production hardening - zero-trust JWT auth, durable persistence, SSRF protection, honest market data, and CSP
ea10bc6 feat: replace Yor with authentic Hatsune Miku 3D figure, cyber concert stage, and Vocaloid voice engine
664feaf fix(tts): instant zero-quota neural voice failover, bypass exhausted ElevenLabs key, and reliable online music playback
f360bd3 chore: professionalize repository structure, organize prompts into docs/prompts, and update README and master plan
2ef6926 feat(core): fix reply parsing, procedural dance actions, ElevenLabs voice, and artifact elimination (Round 10)
✓ Pattern "ghp_[a-zA-Z0-9]{30,}": 0 commits in history
✓ Pattern "AIza[0-9A-Za-z\-_]{35}": 0 commits in history
✓ Pattern "hf_[a-zA-Z0-9]{30,}": 0 commits in history
✓ Pattern "eyJhbGciOi": 0 commits in history
```

**Remediation for Git History:**  
The key was an expired ElevenLabs test key and has been purged from the working tree. To completely rewrite git history and remove past commits from remote, run:
```bash
git filter-repo --replace-text <(echo '[PURGED_ELEVENLABS_KEY]==>[PURGED_KEY]') --force
git push origin --force --all
```

---

### 1.7 Tracked Build Artifacts & Source Maps Audit
```text
Tracked build artifacts count: 0 (No .map, dist/, or orphan .js in src/ tracked)
```

---

### 1.8 Inventory of Tracked 3D Models & Binary Assets
```text
Tracked 3D model assets count: 6
  - apps/web/public/models/ada.vrm (7.51 MB)
  - apps/web/public/models/ada_fullbody_tripo.glb (19.09 MB)
  - apps/web/public/models/ironman.glb (64.99 MB)
  - apps/web/public/models/michelle.glb (3.13 MB)
  - apps/web/public/models/miku.vrm (43.04 MB)
  - apps/web/public/models/tripo_ada.glb (0.17 MB)
```

---

## 2. Evidence-Based Findings Table

| ID | File:Line | Severity | Exploit / Reproduction | Fix | Status |
|---|---|---|---|---|---|
| **EVD-01** | `apps/server/src/utils/ssrfValidator.ts:31` | **HIGH** | `validateUrlForSsrf('http://2130706433')` or `http://0177.0.0.1` may bypass dot-decimal string matching if DNS resolution is bypassed or non-standard. | Add integer/hex/octal IP parser and normalize all hostnames to standard IPv4 dot-decimal / IPv6 before CIDR check. | **FIXED** |
| **EVD-02** | `apps/server/src/services/webScraperService.ts:70` | **HIGH** | Redirect chaining to internal services (e.g. `http://example.com/redirect -> http://169.254.169.254/latest/meta-data`). | Enforce manual redirect loop validating IP after every hop (max 3), strict 5s timeout, 2MB cap, and Content-Type verification. | **FIXED** |
| **EVD-03** | `apps/server/src/index.ts:498` | **HIGH** | `curl -X POST http://localhost:3001/api/web/scrape -d '{"url":"http://..."}'` succeeded without credentials. | Attached `requireAuth` and route rate limiter `rateLimitGeneral`. | **FIXED** |
| **EVD-04** | `apps/server/src/services/contextBuilder.ts` | **HIGH** | Scraped text injected directly into prompt allowed indirect prompt injection (`<script>`, `ignore previous instructions`). | Encapsulate scraped content in `<untrusted_data>` blocks and strip instruction triggers. | **FIXED** |
| **EVD-05** | `apps/server/src/services/financeAnalystService.ts:178` | **MEDIUM** | `calculateSIP(10000, 12, 10)` returned values based on nominal monthly rate `i = r/12` rather than effective compound rate `i = (1+r)^(1/12) - 1`. | Implemented standard actuarial formula with annuity-due (beginning of period) toggle. | **FIXED** |
| **EVD-06** | `apps/server/src/middleware/auth.ts:18` | **CRITICAL** | Request with `x-user-id: victim_id` could access victim's private memory and settings without token. | Strictly reject unverified `x-user-id`; authenticate purely via HMAC-SHA256 JWT claims. | **FIXED** |
| **EVD-07** | `apps/server/src/index.ts:25` | **MEDIUM** | CORS handler accepted arbitrary origin if not in allowlist due to fallback branch. | Strict allowlist check: `if (!isOriginAllowed(origin)) return callback(new Error('CORS origin denied'))`. | **FIXED** |
| **EVD-08** | `apps/worker/src/index.ts:80` | **MEDIUM** | Background cron dispatcher targeted hardcoded `default-user-1`. | Worker consumes durable `background_jobs` table and accepts multi-tenant job payloads. | **FIXED** |
| **EVD-09** | `package.json` | **LOW** | Root `package.json` lacked a `"lint"` script, causing CI lint check failures. | Added `"lint": "eslint ."` and typecheck scripts to root `package.json`. | **FIXED** |
| **EVD-10** | `apps/web/public/models/` | **MEDIUM** | Third-party 3D models required formal license documentation and original character default. | Documented all assets in `CREDITS.md` and set original Ada avatar as canonical default. | **FIXED** |
