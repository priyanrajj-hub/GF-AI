# GF-AI Environment Variables & Configuration Architecture

This document provides the authoritative inventory and security guidelines for all environment variables in the GF-AI platform.

## Security Principles

1. **Least Privilege & Zero Public Leakage**: Backend secrets (JWT secrets, database credentials, AI provider keys) are private and must **never** be prefixed with `VITE_` or bundled into client code.
2. **Server-Side API Gateway**: All external API interactions (Google Gemini, ElevenLabs, Groq, OpenRouter, Tripo3D) execute strictly on the backend.
3. **Fail-Fast in Production**: Production deployments fail boot immediately if critical secrets (`JWT_SECRET`, database connections) are missing or set to known insecure placeholders.
4. **Resilient Development Defaults**: In development and test environments, the server starts gracefully with local SQLite and mock fallbacks when optional third-party API keys are omitted.

---

## Complete Environment Variable Inventory

### 1. Server & Core Runtime

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `PORT` | Private (Server) | No | `3001` | Express backend listening port. |
| `NODE_ENV` | Private (All) | Yes | `development` | Runtime mode: `development`, `production`, or `test`. |
| `APP_URL` | Private (Server) | Yes | `https://gf-ai-ochre.vercel.app` | Canonical public URL of the application. |
| `CLIENT_URL` | Private (Server) | No | `http://localhost:5173` | Allowed frontend origin for CORS. |
| `CORS_ORIGIN` | Private (Server) | No | `http://localhost:5173` | Comma-separated or single allowed origin. |
| `ALLOWED_ORIGINS` | Private (Server) | No | `*` (dev only) | Explicit CORS allowlist domains. |
| `STRICT_ENV_VALIDATION`| Private (Server) | No | `false` (dev) / `true` (prod)| When `true`, enforces fatal exit if non-critical env issues are detected. |

### 2. Authentication, Authorization & Security

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `JWT_SECRET` | Private (Server) | **Yes (P0)** | Min 32 chars high-entropy hex | Used to sign & verify HMAC-SHA256 user JWTs. Must NOT contain placeholder text. |
| `AUTH_SECRET` | Private (Server) | No | Fallback to `JWT_SECRET` | Alias for session / auth signing. |
| `ADMIN_EMAILS` | Private (Server) | Yes | Comma-separated emails | Strict allowlist of emails granted `role: admin`. Request body roles are rejected. |
| `ENABLE_TEST_AUTH` | Private (Server) | No | `false` | Hard-disabled in production. Allows returning test tokens in automated test suites. |

### 3. Database & Relational Persistence

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Private (Server/Worker)| Recommended | `postgres://user:pass@host/db` | Primary PostgreSQL / Neon connection pool string. Required for high-concurrency production. |
| `TURSO_DATABASE_URL` | Private (Server/Worker)| Optional | `libsql://your-db.turso.io` | Turso / LibSQL cloud database endpoint. |
| `TURSO_AUTH_TOKEN` | Private (Server/Worker)| Optional | Bearer token | Authentication token for Turso cloud DB. |
| `LIBSQL_URL` | Private (Server/Worker)| Optional | `file:./data/ada_relational.db`| Local libSQL file path. Uses `os.tmpdir()` in serverless environments. |

### 4. Primary LLM & Multi-Model Orchestration

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Private (Server) | Recommended | `AIzaSy...` | Primary Google Gemini API Key from Google AI Studio. |
| `GEMINI_API_KEYS` | Private (Server) | Optional | Comma-separated keys | Multi-key rotation pool for rate-limit failover. |
| `GEMINI_MODEL` | Private (Server) | No | `gemini-2.5-flash` | Default Gemini model identifier. |
| `GROQ_API_KEY` | Private (Server) | Optional | `gsk_...` | Ultra-fast LPU inference from console.groq.com. |
| `GROQ_MODEL` | Private (Server) | No | `llama-3.3-70b-versatile` | Model for Groq agent fallback. |
| `OPENROUTER_API_KEY` | Private (Server) | Optional | `sk-or-v1-...` | OpenRouter gateway key for multi-provider routing. |
| `OPENROUTER_MODEL` | Private (Server) | No | `meta-llama/llama-3.2-3b-instruct:free` | Model for OpenRouter routing. |
| `HF_TOKEN` | Private (Server) | Optional | `hf_...` | Hugging Face user access token for serverless inference. |
| `OLLAMA_HOST` | Private (Server) | Optional | `http://localhost:11434` | Local offline private Ollama host URL. |
| `OLLAMA_MODEL` | Private (Server) | No | `llama3.2:3b` | Local Ollama model tag. |

### 5. Voice Synthesis & Speech Architecture

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `ELEVENLABS_API_KEY`| Private (Server) | Optional | `sk_...` | ElevenLabs text-to-speech API key. |
| `ELEVENLABS_VOICE_ID`| Private (Server) | Optional | `EXAVITQu4vr4xnSDxMaL` | Voice persona ID (e.g. Sarah / Rachel). |
| `MIKU_VOICE_ENABLED`| Private (Server) | No | `false` | Set `true` when authorized Crypton / Yamaha gateway is configured. |
| `MIKU_VOICE_API_URL`| Private (Server) | Optional | `https://...` | Authorized Crypton / Yamaha VOCALOID gateway endpoint. |
| `MIKU_VOICE_API_KEY`| Private (Server) | Optional | Enterprise Bearer Token | Secret token for authorized singing voice synthesis. |
| `MIKU_VOICE_LICENSE_STATUS`| Private (Server)| No | `unlicensed` / `licensed` | Licensing compliance flag. |

### 6. Email & Magic Link Dispatch

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `RESEND_API_KEY` | Private (Server) | Optional | `re_...` | Resend email API key for passwordless magic links. |
| `POSTMARK_SERVER_TOKEN`| Private (Server)| Optional | UUID | Postmark server token for transactional emails. |
| `EMAIL_FROM` | Private (Server) | No | `auth@example.com` | Verified sender address for magic links. |

### 7. Market Data & 3D Generative AI

| Variable | Scope | Required (Prod) | Default / Format | Description & Source |
| :--- | :--- | :---: | :--- | :--- |
| `ALPHA_VANTAGE_API_KEY`| Private (Server)| Optional | Key string | Historical stock series & FX rates. |
| `FINNHUB_API_KEY` | Private (Server) | Optional | Key string | Real-time equity quote feed. |
| `TRIPO_API_KEY` | Private (Server) | Optional | Key string | Tripo3D API for procedural mesh rigging. |
