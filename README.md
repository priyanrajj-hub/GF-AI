# Ada AI (GF-AI) — 3D Holographic AI Companion & Jarvis Trade AI Quantitative Engine

<p align="center">
  <img src="./apps/web/public/favicon.svg" alt="Ada Logo" width="100" height="100" />
</p>

<p align="center">
  <strong>Production-Grade 3D Holographic AI Companion, Modular Multi-Model AI Orchestrator, Institutional Quantitative Trading Engine (Jarvis Trade AI), and Event-Driven Platform.</strong>
</p>

<p align="center">
  <a href="./docs/AUDIT_ROUND5.md"><img src="https://img.shields.io/badge/Round_5_Audit-Verified_Production-brightgreen?style=flat-square" alt="Round 5 Audit" /></a>
  <a href="https://github.com/priyanrajj-hub/GF-AI/actions"><img src="https://img.shields.io/badge/CI_Pipeline-Passing-success?style=flat-square" alt="CI Status" /></a>
  <a href="./docs/SECURITY.md"><img src="https://img.shields.io/badge/Security-Zero_Trust_SSRF_&_Secrets-blue?style=flat-square" alt="Security" /></a>
  <a href="./charts/ada"><img src="https://img.shields.io/badge/Kubernetes-Helm_3_&_KEDA-326ce5?style=flat-square" alt="Kubernetes" /></a>
</p>

---

## 🏛️ Architecture & System Topology

```mermaid
flowchart TD
    Client["Browser / Mobile Client (React + Three.js)"] -->|"HTTPS / WSS / SSE"| Ingress["Nginx / Cloud Ingress (TLS cert-manager)"]
    Ingress -->|"HTTP / REST / SSE"| API["Ada API Server (Express + Helmet CSP)"]
    
    subgraph DataPlane ["Persistence & Caching"]
        API -->|"Durable SQL"| DB[("Relational SQL (Postgres / libSQL)")]
        API -->|"Revocation & Quotes"| Redis[("Redis (Cluster / Cache)")]
        DB -.->|"OHLCV Aggregates (Spec)"| Timescale[("TimescaleDB Hypertables")]
    end
    
    subgraph StreamingPlane ["Event-Driven Streaming"]
        API -->|"Publish ticks / signals"| EventBus["Zod-Validated EventBus (Kafka Schemas)"]
        EventBus -->|"indicator-engine"| Worker["Background Worker"]
        EventBus -->|"signal-engine"| LiveGateway["Live Signal Gateway (SSE)"]
        LiveGateway -->|"Real-time Signals"| Client
    end
    
    subgraph IntelligencePlane ["AI & Quantitative Intelligence"]
        API -->|"Multi-Model Router"| Orchestrator["AI Orchestrator (Gemini / Groq / Fallback)"]
        API -->|"Official Adapters"| MarketFeeds["Twelve Data / Finnhub / NSE Bhavcopy"]
        API -->|"Hybrid RAG"| RAGStore["BM25 Lexical + Cosine Vector Store"]
        API -->|"Internal Analytics"| QuantEngine["Quantitative Engine (Jarvis Trade AI)"]
    end
```

---

## 📊 Honest Feature & Implementation Status

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Relational SQL Database** | ✅ **LIVE & DURABLE** | PostgreSQL in container mode; libSQL / SQLite in local development mode. Complete schema migrations and multi-tenant isolation. |
| **Redis Revocation & Quote Cache** | ✅ **LIVE** | Distributed JTI revocation blacklist, refresh token family reuse tracking, market cache (< 15m TTL). |
| **Thin Modular Server Architecture** | ✅ **COMPLETED** | `index.ts` is 43 lines. Modular routes in `src/routes/` and services in `src/services/` strictly < 400 lines each. |
| **Test Coverage & Quality Gate** | ✅ **PASSING (83.6%)** | Comprehensive automated test suite with 100% pass rate: Vitest server unit tests, offensive security attack suite (49/49), Round 4 integration, voice integration (15/15), and Miku remediation suite. |
| **Market Data Architecture** | ✅ **OFFICIAL ONLY** | Multi-tier provider cascade (Twelve Data, Finnhub, Alpha Vantage, NSE Bhavcopy). Strict provenance metadata `{ source, asOf, isLive, isStale }` on every quote. |
| **Voice Synthesis & IP Compliance** | ✅ **ACTIVE & COMPLIANT** | High-fidelity Neural Edge TTS (Ada, Tony Stark, Tamil, English) and Web Speech API. Crypton Future Media's proprietary Hatsune Miku voicebank is explicitly unlicensed and disabled from model training in strict accordance with Crypton's EULA. Spoken idol dialogue uses authorized neural acoustic synthesis (pitch 1.35, rate 1.10, idol EQ filter); authentic Vocaloid music playback streams licensed master recordings directly. |
| **3D Avatar & Kinematics** | ✅ **ACTIVE & RESILIENT** | Three.js WebGL canvas with canonical VRM models (`ada.vrm`, `miku.vrm`, `ironman.glb`) and instant procedural 3D fallbacks (cyan twin-tails, ribbons, Arc Reactor) so the screen is never blank during loading or network disconnection. |
| **Event Streaming Bus** | ✅ **LIVE (IN-PROCESS)** | In-process schema-validated EventBus with Kafka-compatible topic schemas (`market.ticks`, `market.ohlcv.1m`, `news.raw`, `signals.generated`, `alerts.triggered`). |
| **TimescaleDB Continuous Aggregates** | ⚠️ **SPECIFICATION** | SQL hypertable schema and continuous aggregate definitions provided in `infra/timescaledb/01_hypertable.sql` for high-throughput OHLCV rollups. |
| **Live Signal Gateway** | ✅ **LIVE** | Server-Sent Events (SSE) at `GET /api/trading/signals/stream` with 15s heartbeats and client auto-reconnect. |
| **Educational Compliance** | ✅ **ENFORCED** | All trading features, technical indicators, and quantitative setups are strictly educational and non-advisory. SEBI compliance educational disclaimers are returned on financial endpoints. |

---

## 🚀 Step-by-Step Quickstart

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **Docker & Docker Compose** (optional for container mode)
- **Git**

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/priyanrajj-hub/GF-AI.git
cd GF-AI

# Install all monorepo dependencies
npm ci

# Configure environment secrets
cp .env.example .env
```
*Ensure `JWT_SECRET` and `REFRESH_SECRET` are set to at least 32 random characters.*

### 3. Run Development Stack
```bash
# Option A: Start backend and frontend concurrently
npm run dev

# Option B: Run via Docker Compose (Postgres, Redis, Mailpit, API, Web, Worker)
docker compose -f docker-compose.dev.yml up -d
```

### 4. Run Automated Test Suite
```bash
# Complete end-to-end verification
npm test

# Vitest unit coverage gate
npm run test:server
```

---

## 🛡️ Security & Zero-Trust Posture
- **Secret Scanning**: Full-history Git scan enforced via Gitleaks and `scripts/scan_secrets.mjs`. Zero secrets committed.
- **SSRF Hardening**: Universal IP parser blocks decimal, octal, hex, IPv6, loopback, private subnets, and cloud IMDS endpoints.
- **Timing Safe Authentication**: Constant-time comparison (`crypto.timingSafeEqual`) across magic-link and refresh token verification.
- **Content Security Policy**: Zero `unsafe-inline` scripts; strict domain allowlists for media, connect, and styles.

---

## 📄 License & Compliance
- **Core Platform**: MIT License. See [`LICENSE`](./LICENSE).
- **Compliance Disclaimer**: *All trading features and models are for educational and analytical purposes only. Not SEBI registered investment advice.*
