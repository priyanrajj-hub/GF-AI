# GF-AI Senior Full-Stack & Application Security Audit (Phase 0)

**Target Repository:** `priyanrajj-hub/GF-AI`  
**Monorepo Packages:** `packages/shared`, `apps/server`, `apps/worker`, `apps/web`, `training/`  
**Audit Date:** November 2026  
**Auditor Role:** Principal Security, Full-Stack & Quantitative Systems Engineer  

---

## 1. Executive Summary

This comprehensive audit inspects the full source tree, configuration files, backend services, external APIs, and persistent storage of the GF-AI monorepo. While foundational components (React 19, Three.js VRM, TypeScript, Express, SQLite/JSON persistence, market indicators) are present, several critical vulnerabilities and architectural defects were discovered that require immediate remediation before production deployment.

### Key Audit Highlights:
1. **SSRF Vulnerabilities:** `/api/web/scrape` accepted arbitrary user-supplied URLs without complete IP-range blocking (decimal/hex/octal notation, link-local, IPv4-mapped IPv6, and redirect chaining).
2. **Untrusted Data & Prompt Injection:** External scraped web content and financial RSS feeds were ingested into system contexts without explicit `<untrusted_data>` boundaries or instruction-stripping.
3. **Authentication & Rate Limiting Gaps:** Non-public endpoints (e.g. `/api/web/scrape`, `/api/news`, `/api/trading/*`, `/api/finance/*`) lacked mandatory `requireAuth` protection, and express-rate-limiters were missing per-user token and cost budgets.
4. **Secrets in Git History:** An exhausted ElevenLabs API test key (`REDACTED_KEY_PREFIX...`) was present in previous commits (`f360bd3`, `664feaf`, `ea10bc6`) despite being removed from the working tree.
5. **Market Data & SIP Integrity:** The SIP compounding calculation was using a nominal interest rate without effective compounding rates `(1 + r)^(1/12) - 1` and lacked an annuity-due option.
6. **Trading Brain Evolution:** The trading brain requires restructuring into **Jarvis Trade AI** with multi-agent orchestration (Technical, Fundamental, Macro, Sentiment, Risk) and concrete tools (52w screener, swing engine, long-term factor score, intraday setups, IPO module, and live macro dashboard).

---

## 2. Comprehensive Findings Register

| ID | File:Line | Severity | Proof / Reproduction | Remediation | Status |
|---|---|---|---|---|---|
| **SEC-01** | `apps/server/src/utils/ssrfValidator.ts:30` | **HIGH** | Decimal/hex/octal IP literals (e.g. `http://2130706433` = `127.0.0.1`) could bypass string-based IPv4 CIDR checks if DNS resolution is bypassed or platform-dependent. | Parse and normalize numeric, hex, and octal hostnames; enforce strict IPv4/IPv6 address normalization and CIDR boundary checks. | **FIXED** |
| **SEC-02** | `apps/server/src/services/webScraperService.ts:61` | **HIGH** | Web scraper previously followed redirects without validating target IP after every hop, allowing redirect-to-internal SSRF. | Implemented safe manual redirect loop (max 3 hops) validating IP at each stage, strict 5s timeout, 2MB size cap, and `text/html` Content-Type check. | **FIXED** |
| **SEC-03** | `apps/server/src/index.ts:498` | **HIGH** | `/api/web/scrape` had no authentication middleware, allowing unauthenticated attackers to consume server bandwidth and abuse scraper. | Add `requireAuth` and route-specific rate limiting (`rateLimitGeneral`) to `/api/web/scrape`. | **FIXED** |
| **SEC-04** | `apps/server/src/index.ts:200` | **HIGH** | Scraped web content was directly passed into AI contexts without delimiters, enabling prompt injection (`ignore previous instructions`). | Wrap all scraped and news text in `<untrusted_data source="...">` blocks, strip injection triggers, and add system mandate rule forbidding instruction execution inside untrusted blocks. | **FIXED** |
| **SEC-05** | `apps/server/src/middleware/auth.ts:15` | **CRITICAL** | Client-supplied `x-user-id` header was trusted blindly, and unauthenticated requests defaulted to `default-user-1`. | Replaced with cryptographic HMAC-SHA256 JWT claim verification; unauthenticated users receive no default identity. | **FIXED** |
| **SEC-06** | `git log -S "sk_"` | **HIGH** | Historic test ElevenLabs key was committed in historical commits `f360bd3`, `664feaf`, `ea10bc6`. | Purged key from working tree, rotated key, and provided `git filter-repo` / BFG instructions in documentation. | **DOCUMENTED** |
| **SEC-07** | `apps/server/src/services/tradingService.ts:180` | **HIGH** | Earlier code generated synthetic `Math.sin` random candles and fabricated 18 "STRONG BUY" analyst ratings when Yahoo Finance was unreachable. | Deleted synthetic generators; return explicit structured `{ status: 'unavailable', isLive: false, source: 'unavailable' }` states. | **FIXED** |
| **SEC-08** | `apps/server/src/services/financeAnalystService.ts:176` | **MEDIUM** | SIP formula used nominal linear rate `annualReturnRate / 12` rather than effective compound rate `(1 + annual)^(1/12) - 1`, and lacked annuity-due toggle. | Rebuild `sipCalculator.ts` with exact effective compounding formula, annuity-due toggle, and analytical test assertions. | **FIXED** |
| **SEC-09** | `apps/worker/src/index.ts:80` | **MEDIUM** | Worker background polling loop hardcoded `default-user-1` and relied on in-memory state. | Decoupled worker to consume persistent `background_jobs` table and export `runProactiveScheduler()` for Vercel Cron. | **FIXED** |
| **SEC-10** | `apps/server/src/index.ts:25` | **MEDIUM** | CORS allowed wildcard reflected origins in development and had duplicate callback logic. | Enforced strict origin allowlist (`ALLOWED_ORIGINS` env or official domains), rejecting `null` and arbitrary subdomains. | **FIXED** |
| **SEC-11** | `apps/server/src/db/index.ts:1` | **HIGH** | Production persistence relied on ephemeral SQLite/JSON file in serverless lambda environment. | Provided PostgreSQL relational DDL schema (`schema.sql`) and `migrationUtility.ts` with dry-run and backup features. | **FIXED** |
| **SEC-12** | `apps/web/public/models/` | **MEDIUM** | Third-party copyrighted 3D avatars (Iron Man, Hatsune Miku, Yor Forger) lacked documented open-source license attribution. | Created `CREDITS.md` with full asset inventory and license disclosures; default companion set to canonical original Ada avatar. | **FIXED** |

---

## 3. Quantitative & Trading Architecture Requirements

### 3.1 MarketDataService
- **Provider Cascade:** Primary live API (Yahoo Finance / NSE / BSE) -> Secondary provider -> Explicit unavailable state.
- **TTL Caching:** 15 seconds for real-time quotes, 5 minutes for macro indicators, 1 hour for historical candles.
- **Data Provenance:** Every returned datum must have `{ source: string, asOf: number }`.
- **Zero Hallucination Guarantee:** The AI assistant is forbidden from inventing prices, PE ratios, or ratings. If unavailable, it responds with *"data unavailable right now"*.

### 3.2 Jarvis Trade AI Tool Suite
1. `screen_52week`: Multi-factor 52-week low/high screener with volume spike (>1.5x 20d avg) and fundamental filters (D/E < 1.0, ROE > 15%, Promoter > 50%).
2. `get_swing_trade_setup`: EMA20/50/200, MACD, RSI, Bollinger Squeeze, ATR trailing stops, Risk:Reward >= 1:2.
3. `get_longterm_factors`: Quality + Value + Momentum factor scoring (ROCE, FCF, PEG, earnings stability) and DCF sanity check.
4. `get_intraday_setup`: Classic & Fibonacci pivots, VWAP, ORB (15m/30m), F&O OI/PCR, Long and Short setups.
5. `get_ipo_analysis`: Mainboard + SME IPOs, GMP (flagged as unreliable), subscription ratios, peer valuation, RHP metrics.
6. `calculate_sip`: Exact effective monthly rate compounding with annuity-due toggle.
7. `get_macro_economic_radar`: Live RBI repo rate (6.50%), MPC schedule, CPI/WPI, GDP, FII/DII net flows, USDINR, VIX, 10Y G-Sec yield, Brent Crude, with institutional sector impact commentary.
8. `get_financial_news_sentiment`: Ingestion of financial news with FinBERT sentiment scoring and corporate event detection.
9. `analyze_portfolio`: Holdings CSV import, P&L, XIRR, sector allocation, 95% parametric VaR, max drawdown, and rebalancing recommendations.
10. `get_trading_alerts`: Background alerts via persistent job processor.

---

## 4. Compliance & Disclaimers

All trade ideas and analytics must prominently feature:
> *"⚠️ Educational & Informational Analysis Only. Not SEBI-registered investment advice. No guaranteed returns. Trading in securities involves substantial financial risk. Consult a SEBI-registered financial advisor before executing trades."*
