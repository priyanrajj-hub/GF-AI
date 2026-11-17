# 🚀 GF-AI & Jarvis Trade AI — Production Deployment Guide

## 1. Quick Start (Vercel Production Deployment)

### 1.1. Push to GitHub
Repository: **[https://github.com/priyanrajj-hub/GF-AI](https://github.com/priyanrajj-hub/GF-AI)**

```bash
git add .
git commit -m "feat(quant): wire Jarvis Trade AI engine, actuarial SIP calculator, and attack regression suite"
git push origin main
```

### 1.2. Vercel Configuration
1. In your **[Vercel Dashboard](https://vercel.com)**, link `priyanrajj-hub/GF-AI`.
2. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (Root of repository)
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `npm install`

---

## 2. Environment Variables Configuration

Set these variables in **Vercel Settings → Environment Variables**:

| Variable | Description | Required? | Example / Source |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`production` or `development`) | **Required** | `production` |
| `JWT_SECRET` | 32+ character cryptographic secret for HMAC-SHA256 | **Required** | `<SET_SECURE_32_CHAR_RANDOM_KEY>` |
| `GEMINI_API_KEY` | Google Gemini 2.0 API key | Recommended | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GROQ_API_KEY` | Ultra-fast Llama 3.3 70B inference | Optional | [console.groq.com](https://console.groq.com/keys) |
| `OPENROUTER_API_KEY` | Multi-model fallback router | Optional | [openrouter.ai](https://openrouter.ai/keys) |
| `HF_TOKEN` | Hugging Face Inference API token | Optional | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains | Optional | `https://gf-ai-ochre.vercel.app` |
| `ELEVENLABS_API_KEY` | High-definition neural voice synthesis | Optional | [elevenlabs.io](https://elevenlabs.io) |
| `DATABASE_URL` | Production Postgres / Turso connection string | Optional | `libsql://...` or `postgres://...` |

---

## 3. Background Worker & Periodic Tasks (`apps/worker`)

On serverless hosts like Vercel, server processes are ephemeral. To run recurring tasks (morning briefing, news gathering, long-term memory consolidation):

### Option A: Vercel Cron Jobs (Recommended for Serverless)
Add a cron trigger in `vercel.json` pointing to an authenticated worker route:
```json
{
  "crons": [
    {
      "path": "/api/worker/cron/morning-briefing",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/worker/cron/market-sync",
      "schedule": "*/15 3-10 * * 1-5"
    }
  ]
}
```

### Option B: Persistent Background Worker (Railway / Render / Fly.io / Docker)
If running in a Docker container or persistent VM:
```bash
cd apps/worker
npm run build
node dist/index.js
```
The worker will run as an autonomous daemon polling market hours and scheduling proactive user check-ins.

---

## 4. Production Database Strategy (SQLite vs Turso / Postgres)

- **Local Development:** SQLite operates with zero configuration via `better-sqlite3` storing in local workspace files.
- **Production Serverless:** SQLite files in serverless lambdas are ephemeral across cold starts. For persistent multi-user production data, configure:
  - **Turso (LibSQL):** Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your environment.
  - **Postgres (Neon / Supabase):** Set `DATABASE_URL="postgres://..."`.

---

## 5. Security & Verification Checklist Prior to Release

Before pushing changes to production, run the verification suite:
```bash
# 1. Typecheck Monorepo
npm run typecheck

# 2. Run Offensive Security & Attack Regression Suite
npx tsx scripts/security/attack_suite.mjs

# 3. Run Actuarial SIP & Financial Units Tests
npx tsx scripts/test_sip_calculator.mjs

# 4. Run Secrets and PII Scans
npm run scan:secrets
npm run scan:pii

# 5. Full Monorepo Build
npm run build
```

Once all checks pass, commit and deploy with zero downtime.
