# GF-AI — Master Environment Configuration Reference

**Version**: 2.0.0-PROD  
**Author**: Principal Software Architect & DevOps Platform Staff  
**Security Level**: Critical System Governance (Zero Credentials in Git)  

---

## 1. Architecture Overview

GF-AI utilizes a strictly validated, layered environment configuration model powered by **Zod** (`apps/server/src/config/env.ts`).

### Strict Governance Rules:
1. **Never Commit Secrets**: Real keys, passwords, or production secrets must **never** be committed to version control.
2. **RFC 2606 Compliance**: All example email addresses in documentation and configuration templates MUST use reserved domains (`example.com`, `example.org`, `test.com`).
3. **No Insecure Fallbacks**: In `NODE_ENV=production`, placeholder secrets (e.g. `secret`, `changeme`) immediately halt the boot process with a fatal exit code.
4. **Vite Frontend Isolation**: Client-facing variables MUST begin with `VITE_`. Backend secrets (e.g. database credentials, JWT secrets, AI master keys) are never exposed to the frontend bundle.

---

## 2. Environment Matrix by Workspace

```
                  ┌─────────────────────────────┐
                  │      env/.env.example       │ (Master Reference)
                  └──────────────┬──────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   apps/server    │    │     apps/web     │    │   apps/worker    │
│  (.env.example)  │    │  (.env.example)  │    │  (.env.example)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 3. Comprehensive Variable Inventory

### 3.1 Core System & Execution Environment

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | All | `enum` | No | `development` | Target mode: `development`, `test`, or `production`. Enables strict runtime guards in production. |
| `PORT` | `apps/server` | `number` | No | `3001` | TCP port on which the Express API server listens. |
| `APP_URL` | `apps/server` | `url` | Prod | `http://localhost:5173` | Canonical public URL used for CORS verification and secure magic-link generation. Rejects spoofed request headers. |
| `VERCEL` | `apps/server` | `boolean`| Auto | `undefined` | Automatically set by Vercel serverless runtime. Enforces `os.tmpdir()` pathing for temporary SQLite stores. |

---

### 3.2 Cryptographic Identity & Authentication

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `apps/server`, `worker` | `string` | **Yes (Prod)** | None | Minimum 32-character high-entropy secret for HMAC-SHA256 token signing. Must be unique per deployment. |
| `JWT_EXPIRY` | `apps/server` | `string` | No | `24h` | Access token lifespan (e.g. `15m`, `1h`, `24h`). |
| `REFRESH_TOKEN_EXPIRY_DAYS` | `apps/server` | `number` | No | `30` | Refresh token duration in days. Managed via generational family rotation. |
| `ADMIN_EMAILS` | `apps/server` | `string` | No | `""` | Comma-separated list of pre-authorized administrator email addresses (e.g. `admin@example.com`). Role derived strictly from this allowlist. |
| `ENABLE_TEST_AUTH` | `apps/server` | `boolean`| No | `false` | Enables test token generation in CI. Hard-disabled when `NODE_ENV=production` or `VERCEL=1`. |

---

### 3.3 Relational Database & Persistence

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `apps/server`, `worker` | `url` | Prod | `""` | Primary PostgreSQL / Neon connection string (`postgresql://user:pass@host/db?sslmode=require`). |
| `TURSO_DATABASE_URL` | `apps/server`, `worker` | `url` | No | `""` | LibSQL / Turso cloud database URL (`libsql://db-name.turso.io`). |
| `TURSO_AUTH_TOKEN` | `apps/server`, `worker` | `string` | If Turso | `""` | LibSQL authentication token. |
| `REDIS_URL` | `apps/server`, `worker` | `url` | No | `""` | Distributed Redis instance URL (`redis://user:pass@host:6379`) for shared rate limits and quotas. Single-node fallback active when omitted. |

---

### 3.4 Multi-Model AI Providers

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | `apps/server` | `string` | No | `""` | Google Gemini API key. Rotated through active key pool. |
| `GEMINI_API_KEYS` | `apps/server` | `string` | No | `""` | Comma-separated list of Gemini API keys for automated failover rotation. |
| `GEMINI_MODEL` | `apps/server` | `string` | No | `gemini-2.0-flash` | Default Gemini model identifier. |
| `GROQ_API_KEY` | `apps/server` | `string` | No | `""` | Groq high-speed cloud inference API key. |
| `GROQ_MODEL` | `apps/server` | `string` | No | `llama-3.3-70b-versatile`| Groq default model identifier. |
| `OPENROUTER_API_KEY` | `apps/server` | `string` | No | `""` | OpenRouter multi-provider API gateway key. |
| `HUGGINGFACE_API_KEY`| `apps/server` | `string` | No | `""` | Hugging Face inference key. |
| `OLLAMA_BASE_URL` | `apps/server` | `url` | No | `http://localhost:11434`| Local Ollama inference gateway URL for on-premise AI execution. |
| `MOCK_PROVIDERS` | `apps/server` | `boolean`| No | `false` | When `true`, substitutes external AI calls with deterministic local mocks (CI / testing). |

---

### 3.5 Voice & Audio Synthesis

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ELEVENLABS_API_KEY` | `apps/server` | `string` | No | `""` | ElevenLabs API key for high-fidelity voice cloning. |
| `ELEVENLABS_VOICE_ID`| `apps/server` | `string` | No | `EXAVITQu4vr4xnSDxMaL` | Default ElevenLabs voice identifier. |
| `MIKU_VOICE_PROVIDER`| `apps/server` | `string` | No | `""` | Authorized official Hatsune Miku voice gateway provider (Crypton / Yamaha licensed). |
| `MIKU_VOICE_API_KEY` | `apps/server` | `string` | No | `""` | Licensed API key for authentic Hatsune Miku synthesis. |

---

### 3.6 Email & Notifications

| Variable Name | Workspace | Type | Required | Default | Description & Security Mandate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EMAIL_PROVIDER` | `apps/server`, `worker` | `enum` | No | `console` | Dispatch engine: `resend`, `postmark`, `ses`, or `console`. |
| `RESEND_API_KEY` | `apps/server`, `worker` | `string` | If Resend | `""` | Resend email delivery service API key. |
| `EMAIL_FROM` | `apps/server`, `worker` | `email` | No | `auth@example.com` | Verified outbound sender address for magic links and alerts. |

---

### 3.7 Client-Facing Frontend Variables (`apps/web`)

| Variable Name | Workspace | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `apps/web` | `string` | No | `""` | Base URL of backend API (empty string defaults to same-origin proxy). |
| `VITE_WS_URL` | `apps/web` | `string` | No | `""` | WebSocket gateway URL for real-time audio and status streaming. |

---

## 4. Verification & Validation Commands

Test configuration and scan for accidental secret leakage:

```bash
# Validate environment parsing and fail-safe defaults
npm run test:e2e

# Scan 100% of tracked files for uncommitted credentials
npm run scan:secrets

# Scan 100% of tracked files for non-RFC 2606 PII data
npm run scan:pii
```
