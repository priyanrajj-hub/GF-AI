# GF-AI / Ada — Senior Full-Stack Engineering & Application Security Audit

**Audit Date:** 2026-11-17  
**Auditor:** Principal Software Architect & Application Security Engineer  
**Target Repository:** `priyanrajj-hub/GF-AI`  
**Scope:** Full-Stack Monorepo (`apps/server`, `apps/web`, `apps/worker`, `packages/shared`, `api/*`, `vercel.json`, CI/CD)  
**Overall Readiness Verdict:** **NEEDS HARDENING BEFORE COMMERCIAL PRODUCTION**

---

## Executive Summary

The GF-AI platform possesses an impressive feature set spanning a 3D Three.js holographic interface (featuring Hatsune Miku, Tony Stark RDJ, and Ada Wong), real-time WebGL stage rendering, neural TTS speech synthesis, market telemetry, multi-provider LLM orchestration, and companion state machines.

However, a line-by-line inspection of the backend architecture, external integrations, financial calculation pipelines, and middleware reveals several high-impact security and data integrity vulnerabilities. Deploying the current version directly to a commercial production environment presents severe security and compliance liabilities, particularly around arbitrary origin acceptance in CORS, client-side identity spoofing, Server-Side Request Forgery (SSRF) in the web scraper, and synthetic financial market data fabrication.

This document classifies every verified finding with file paths, concrete code evidence, impact assessments, and detailed engineering remediation plans.

---

## Summary of Findings by Severity

| ID | Severity | Category | File Path | Finding Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **CRITICAL** | Security / CORS | `apps/server/src/index.ts` | CORS callback unconditionally permits any origin in production |
| **SEC-02** | **CRITICAL** | Auth / Identity | `apps/server/src/middleware/auth.ts` | Blind trust of `x-user-id` and unverified bearer tokens (IDOR & Impersonation) |
| **SEC-03** | **HIGH** | Security / SSRF | `apps/server/src/services/webScraperService.ts` | Arbitrary URL fetch without DNS resolution or private IP blocklists |
| **SEC-04** | **HIGH** | Input Integrity | `apps/server/src/middleware/security.ts` | Regex keyword stripping corrupts valid user input while failing as SQL defense |
| **SEC-05** | **HIGH** | Denial of Service | `apps/server/src/index.ts` | Unbounded global 10 MB JSON body parser limit on all routes |
| **SEC-06** | **HIGH** | Data Integrity | `apps/server/src/market/marketDataService.ts` | Synthetic prices generated when Yahoo Finance fails without clear designation |
| **SEC-07** | **HIGH** | Financial Integrity | `apps/server/src/market/marketDataService.ts` | `generateAlgoSignal` invents 30-day random sine walk for technical indicators |
| **SEC-08** | **HIGH** | Tenant Isolation | `apps/server/src/rag/vectorStore.ts` | Global shared vector store with zero per-user isolation or injection guards |
| **SEC-09** | **HIGH** | Data Persistence | `apps/server/src/db/index.ts` | JSON file-based storage in ephemeral serverless `/tmp` with no concurrency lock |
| **SEC-10** | **HIGH** | Cloud Deployment | `vercel.json` | Wildcard `"Access-Control-Allow-Origin": "*"` header on all `/api/*` endpoints |
| **ARCH-01**| **MEDIUM** | Architecture | `apps/server/src/index.ts` | 2,149-line monolithic server file combining routing, business logic & handlers |
| **ARCH-02**| **MEDIUM** | Redundancy | `api/*.ts` | Duplicate serverless entrypoints (`chat.ts`, `health.ts`, `[...path].ts`) |
| **OPS-01** | **MEDIUM** | CI / CD | `.github/workflows/ci.yml` | CI pipeline lacks automated security regression, SSRF and auth test gates |
| **PERF-01**| **LOW** | Performance | `apps/web/src/avatar/skins/ada-red.ts` | Redundant scene traversals and unindexed accessory lookups |

---

## Detailed Findings & Remediation Plans

### Finding SEC-01 [CRITICAL]: Permissive Production CORS Origin Bypass

- **File:** `apps/server/src/index.ts` (Lines 63–73)
- **Code Evidence:**
  ```typescript
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || isDev || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, true) // Permissive fallback defeats origin validation!
        }
      },
      credentials: true,
    })
  )
  ```
- **Root Cause:** The `else` branch in the CORS origin callback returns `callback(null, true)`, meaning *any* cross-origin request from an attacker domain (e.g. `https://evil-attacker.com`) is granted access with `credentials: true`.
- **Impact:** An attacker site visited by an authenticated user can make credentialed API requests to read private chat history, extract memories, or execute unauthorized operations.
- **Remediation Plan:**
  1. Define a strict production allowlist supporting `ALLOWED_ORIGINS` (comma-separated env), `process.env.APP_URL`, verified production domains (`https://gf-ai-ochre.vercel.app`), and local development hosts (`localhost`, `127.0.0.1`).
  2. In production, if `origin` is present and not on the allowlist, immediately call `callback(new Error('CORS origin unauthorized'))`.
  3. Never use wildcard origins when `credentials: true` is configured.

---

### Finding SEC-02 [CRITICAL]: Unverified Client-Supplied Identity & Authentication Bypass

- **File:** `apps/server/src/middleware/auth.ts` (Lines 8–27)
- **Code Evidence:**
  ```typescript
  export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization
    const userHeader = req.headers['x-user-id'] as string
    let userId = 'default-user-1'

    if (userHeader && userHeader.trim()) {
      userId = userHeader.trim()
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim()
      if (token && token !== 'undefined' && token !== 'null') {
        userId = token.startsWith('user_') ? token : `user_${token.slice(0, 12)}`
      }
    }
    ;(req as AuthenticatedRequest).userId = userId
    next()
  }
  ```
- **Root Cause:** The server blindly trusts unauthenticated `x-user-id` headers and raw bearer substrings without any cryptographic signature verification, expiration check, or token issuer check.
- **Impact:** Complete Broken Object Level Authorization (BOLA / IDOR). Any user can impersonate any other account simply by passing `x-user-id: victim-account-id` or an arbitrary bearer string, leaking private memories, notes, and profile settings.
- **Remediation Plan:**
  1. Implement a cryptographically verified JWT authentication engine using `node:crypto` HMAC-SHA256 with strong secrets (`JWT_SECRET`).
  2. Verify token signature, expiration (`exp`), and audience/issuer.
  3. Disallow raw `x-user-id` header overrides in production. If guest access is required, issue a signed ephemeral guest token with constrained scopes.
  4. Scope all user data queries (`messages`, `memories`, `notes`) strictly to `req.user.id`.

---

### Finding SEC-03 [HIGH]: Server-Side Request Forgery (SSRF) in Web Scraper

- **File:** `apps/server/src/services/webScraperService.ts` (Lines 39–55)
- **Code Evidence:**
  ```typescript
  static async extractPage(targetUrl: string): Promise<ScrapedWebPage | null> {
    if (!targetUrl || !targetUrl.startsWith('http')) return null
    // Direct fetch to targetUrl without DNS resolution or IP validation!
    const res = await fetch(targetUrl, { ... })
  }
  ```
- **Root Cause:** The scraper accepts user-supplied URLs and issues HTTP requests directly without resolving DNS or checking whether the destination resolves to private, loopback, link-local, or cloud metadata IP ranges.
- **Impact:** Attackers can trick the backend server into sending requests to internal infrastructure:
  - `http://169.254.169.254/latest/meta-data/` (AWS/GCP instance metadata & cloud IAM credentials)
  - `http://127.0.0.1:8080` (Local internal services or administration endpoints)
  - `http://10.0.0.0/8`, `http://192.168.0.0/16`, `http://172.16.0.0/12` (Internal private subnet exploration)
- **Remediation Plan:**
  1. Restrict protocols strictly to `http:` and `https:`.
  2. Resolve the hostname via DNS pre-lookup (`dns.promises.lookup`).
  3. Validate resolved IP addresses against IPv4/IPv6 private and reserved CIDR ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`).
  4. Block redirect chaining (`redirect: 'error'` or manual re-validation per hop).
  5. Enforce strict response size limits (max 2 MB) and connection timeouts (5 seconds).

---

### Finding SEC-04 [HIGH]: Naive Regex Keyword Stripping Modifying Valid User Input

- **File:** `apps/server/src/middleware/security.ts` (Lines 65–82)
- **Code Evidence:**
  ```typescript
  const SQL_PATTERNS =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|UNION|CREATE|ALTER|EXEC|EXECUTE|CAST|CONVERT|DECLARE|WAITFOR|XP_)\b)|('|--|;{2,}|\/\*|\*\/)/gi

  function sanitizeString(value: string): string {
    return value.replace(SQL_PATTERNS, '').replace(XSS_PATTERNS, '').trim()
  }
  ```
- **Root Cause:** Regex-based blacklisting attempts to prevent SQL injection by stripping standard English keywords (`SELECT`, `UPDATE`, `CREATE`, `'`) from all request queries and bodies.
- **Impact:**
  - Corrupts valid user conversations: *"Please select a song"* becomes *"Please a song"*; *"Update my focus goal"* becomes *"my focus goal"*; *"Don't worry"* becomes *"Dont worry"*.
  - Provides zero real defense against SQL injection because modern SQL injection relies on syntax context. SQL injection must be prevented with **parameterized queries**, not keyword mutilation.
- **Remediation Plan:**
  1. Remove keyword stripping from `sanitizeInput`.
  2. Implement strict input validation using **Zod schemas** at all API route boundaries.
  3. Guarantee that all database interactions use parameterized SQL statements (`db.prepare('... WHERE id = ?').run(param)`).

---

### Finding SEC-05 [HIGH]: Unbounded Global 10 MB JSON Body Parser

- **File:** `apps/server/src/index.ts` (Lines 86–91)
- **Code Evidence:**
  ```typescript
  express.json({ limit: '10mb' })(req, res, next)
  ```
- **Root Cause:** A blanket 10 MB body size limit is applied to every standard API endpoint (e.g. `/api/chat`, `/api/auth`, `/api/memories`).
- **Impact:** Denies service by memory exhaustion. Multiple concurrent requests sending 9 MB junk payloads will consume server heap space, causing Node.js event loop starvation or Out-Of-Memory (OOM) crashes.
- **Remediation Plan:**
  1. Reduce default JSON body parsing to a safe limit (`1mb`).
  2. Use route-specific limits only where large payloads are genuinely required (such as image analysis uploads handled via Multer with streaming size limits).

---

### Finding SEC-06 [HIGH]: Synthetic Simulated Prices Masquerading as Live Market Data

- **File:** `apps/server/src/market/marketDataService.ts` (Lines 202–232)
- **Code Evidence:**
  ```typescript
  // Fallback realistic simulation for offline/test environments
  const defaultPrices: Record<string, number> = { AAPL: 228.45, NVDA: 138.25, ... }
  const basePrice = defaultPrices[cleanSym] || 150.0
  const randomDrift = (Math.sin(Date.now() / 60000) * 0.8 + (Math.random() - 0.5) * 0.4)
  const price = Math.round((basePrice * (1 + randomDrift / 100)) * 100) / 100
  return {
    symbol,
    price,
    source: 'fallback', // Rendered on live charts!
  }
  ```
- **Root Cause:** When upstream financial providers (Yahoo Finance) encounter rate limits, network timeouts, or unknown tickers, the service manufactures fake randomized prices.
- **Impact:** Financial and legal hazard. Presenting fabricated prices as live market quotes deceives users and violates basic financial software integrity standards.
- **Remediation Plan:**
  1. Completely cease generating random price math on provider failure.
  2. If live data is unavailable, return an explicit error payload: `{ status: 'unavailable', symbol, error: 'Upstream market provider unavailable', isLive: false, cachedAt?: number }`.
  3. Include data freshness indicators (`timestamp`, `provider: 'yahoo' | 'binance'`, `delayed: true/false`).

---

### Finding SEC-07 [HIGH]: Algorithmic Signals Calculated on Fabricated Sine Waves

- **File:** `apps/server/src/market/marketDataService.ts` (Lines 344–355)
- **Code Evidence:**
  ```typescript
  // Generate synthetic 30-day price series based on current price and drift for indicators
  const currentPrice = quote.price
  const prices: number[] = []
  let walk = currentPrice * 0.92

  for (let i = 0; i < 30; i++) {
    const seed = Math.sin(i * 0.45) * 0.02 + ((i % 5) - 2) * 0.005
    walk = walk * (1 + seed)
    prices.push(walk)
  }
  prices.push(currentPrice)

  const rsi = calculateRSI(prices, 14)
  const macd = calculateMACD(prices)
  ```
- **Root Cause:** Rather than extracting the actual historical daily candles provided by Yahoo Finance's `chart` endpoint or Binance's `klines` API, the service invented a 30-day trigonometric sine walk and computed technical indicators (RSI, MACD, Bollinger Bands) on this fiction.
- **Impact:** Trading recommendations (BUY/SELL, RSI oversold/overbought) shown to users are fundamentally false and ungrounded in real market price action.
- **Remediation Plan:**
  1. Extract real historical daily closing candles from Yahoo Finance (`chart.result[0].indicators.quote[0].close`) or Binance (`klines`).
  2. Compute RSI, EMA, MACD, and Bollinger Bands exclusively on real historical candles (minimum 20–30 periods).
  3. If historical candles cannot be fetched, return a clear error stating that technical indicators cannot be calculated due to insufficient candle history.

---

### Finding SEC-08 [HIGH]: Global Vector Store Lacking Per-User Isolation & Injection Boundaries

- **File:** `apps/server/src/rag/vectorStore.ts` (Lines 58–95)
- **Code Evidence:**
  ```typescript
  class VectorStore {
    private documents: Document[] = []
    query(text: string, topK = 5): ScoredDoc[] { ... }
  }
  export const ragStore = new VectorStore()
  ```
- **Root Cause:** The singleton vector store does not partition documents by `userId`. Any query against `ragStore` searches across all stored documents regardless of who created them.
- **Impact:** Cross-user data leakage: User A's private memories or uploaded text documents can be retrieved and shown in User B's LLM context window.
- **Remediation Plan:**
  1. Add a mandatory `userId` filter to all vector store insertions and queries: `query(text: string, userId: string, topK = 5)`.
  2. Enforce strict isolation: users can only retrieve documents where `doc.metadata.userId === userId` or `isGlobal === true`.
  3. Wrap retrieved context in structural delimiters (`<retrieved_context>` ... `</retrieved_context>`) with prompt injection defense tags instructing the model to treat retrieved content as reference data, never as system instructions.

---

### Finding SEC-09 [HIGH]: Ephemeral Serverless File Persistence & Concurrency Hazard

- **File:** `apps/server/src/db/index.ts` (Lines 76–90)
- **Code Evidence:**
  ```typescript
  constructor(storageDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? path.join(os.tmpdir(), 'ada_data') : './data')
  ```
- **Root Cause:** In serverless environments (Vercel/AWS Lambda), the database writes to `/tmp/ada_data/ada_persistence.json`. The `/tmp` directory in serverless is frozen or destroyed across invocations and cannot be shared across lambdas.
- **Impact:** Data loss on container recycle. Simultaneous serverless requests will overwrite each other's state or lose newly added memories/notes.
- **Remediation Plan:**
  1. Implement a unified database adapter architecture supporting both SQLite/JSON (for local development/Docker) and robust persistent storage (PostgreSQL/Supabase/Prisma) for distributed production.
  2. Ensure file writes use atomic write patterns (`temp file + rename`) to prevent partial write corruption.
  3. Document production persistence requirements in `docs/DATABASE.md`.

---

### Finding SEC-10 [HIGH]: Wildcard Permissive CORS Headers in `vercel.json`

- **File:** `vercel.json` (Lines 15–22)
- **Code Evidence:**
  ```json
  {
    "source": "/api/(.*)",
    "headers": [
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
      { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization,x-user-id" }
    ]
  }
  ```
- **Root Cause:** The static Vercel configuration injects wildcard `Access-Control-Allow-Origin: *` at the edge for all API routes, overriding backend security filters.
- **Impact:** Subverts CORS origin policies, allowing malicious third-party web origins to issue unmonitored requests.
- **Remediation Plan:**
  1. Remove the static wildcard CORS header block from `vercel.json`.
  2. Centralize all CORS negotiation exclusively in the Express middleware where origin allowlisting is enforced.

---

### Finding ARCH-01 [MEDIUM]: Monolithic Server Structure (`index.ts`)

- **File:** `apps/server/src/index.ts` (2,149 lines)
- **Root Cause:** All health endpoints, internet checks, meme catalogs, chat handlers, voice synthesis, wardrobe state, vector store updates, and LLM calls are concatenated into one massive file.
- **Impact:** High cognitive load, difficulty writing isolated unit tests, risk of merge conflicts and unintended side effects.
- **Remediation Plan:**
  1. Modularize routes and controllers into dedicated domain files:
     - `src/routes/auth.routes.ts`
     - `src/routes/market.routes.ts`
     - `src/routes/chat.routes.ts`
     - `src/routes/memory.routes.ts`
     - `src/routes/voice.routes.ts`
     - `src/routes/system.routes.ts`
  2. Keep `index.ts` strictly as the application bootstrapper.

---

### Finding ARCH-02 [MEDIUM]: Duplicated Serverless Entrypoints

- **Files:** `api/chat.ts`, `api/health.ts`, `api/[...path].ts`, `api/index.ts`
- **Root Cause:** Identical boilerplate re-implementing `getApp()` across 4 separate files in `api/`.
- **Remediation Plan:**
  1. Consolidate into `api/index.ts` and `api/[...path].ts`. Remove orphaned redundant files.

---

### Finding OPS-01 [MEDIUM]: Incomplete CI/CD Automated Verification Gates

- **File:** `.github/workflows/ci.yml`
- **Root Cause:** CI currently checks PII scanning, shared build, and basic persona evals, but lacks:
  - Security unit tests (CORS verification, SSRF blocking, JWT validation).
  - Financial indicator calculation tests.
  - End-to-end build verification for all workspaces.
- **Remediation Plan:**
  1. Add automated security test suites to CI.
  2. Add unit test step covering financial calculations and SSRF validations.

---

## Remediation Roadmap

- [x] **Phase 1:** Complete In-Depth Codebase Audit & Generate `docs/PRODUCTION_AUDIT.md`.
- [ ] **Phase 2:** Execute Core Security Hardening:
  - Fix CORS allowlist in `apps/server/src/index.ts` and remove wildcard in `vercel.json`.
  - Implement cryptographic JWT authentication and secure user isolation in `apps/server/src/middleware/auth.ts`.
  - Implement full SSRF protection (DNS resolution, private IP filtering, redirect validation) in `webScraperService.ts`.
  - Replace naive regex keyword sanitization with context-aware validation & parameterized queries.
  - Eliminate synthetic fake prices and fake algo indicators in `marketDataService.ts`; compute indicators on real candle series.
  - Partition `vectorStore.ts` with per-user tenant isolation and prompt injection boundaries.
  - Consolidate serverless API entrypoints.
- [ ] **Phase 3:** Create Comprehensive Automated Test Suite:
  - Security tests (CORS, SSRF, JWT, IDOR).
  - Financial indicator accuracy tests.
  - Playwright browser E2E tests verifying Hatsune Miku 3D figure, cyber concert stage, voice engine, and chat drawer.
- [ ] **Phase 4:** Production Verification & Documentation:
  - Verify build (`npm run build`).
  - Generate `docs/FUNCTIONAL_QA_REPORT.md` and `docs/PRODUCTION_READINESS_REPORT.md`.
  - Push to GitHub and deploy to Vercel production.
