# Multi-Target Production Deployment Guide

This guide describes how to deploy **GF-AI** across three supported production hosting topologies: Vercel Serverless, Docker Compose, and Kubernetes / Helm.

---

## 1. Target 1: Vercel Serverless (Frontend & Edge API)

Live URL: `https://gf-ai-ochre.vercel.app`

### Architecture
- Frontend is statically compiled with Vite and served via Vercel Global Edge CDN.
- Backend API routes run as Vercel Serverless Functions (`api/` directory mapping to `@vercel/node`).
- SQLite storage operates in ephemeral `/tmp` mode with cloud Turso/LibSQL sync.

### Deployment Commands
```bash
# Preview Deployment
npx vercel

# Production Deployment
npx vercel --prod
```

### Environment Configuration in Vercel
Set the following environment variables in the Vercel Project Dashboard:
- `JWT_SECRET` (min 32 characters)
- `REFRESH_SECRET` (min 32 characters)
- `ADMIN_EMAILS` (comma-separated allowlist)
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`

---

## 2. Target 2: Docker Compose (Single-Host Self-Hosted)

### Architecture
- All microservices run in isolated Docker containers communicating over an internal bridge network:
  - `postgres`: Persistent relational storage.
  - `redis`: Fast cache and token revocation store.
  - `api`: Node.js 22 REST/SSE API microservice.
  - `worker`: Autonomous background task scheduler.
  - `web`: High-performance NGINX edge reverse proxy and SPA server.

### Deployment Commands
```bash
# 1. Populate environment variables
cp .env.example .env
# Edit .env with your production secrets (JWT_SECRET, POSTGRES_PASSWORD, etc.)

# 2. Build and launch the container stack
docker compose up -d --build

# 3. Verify health
docker compose ps
docker compose logs -f api
```

---

## 3. Target 3: Kubernetes & Helm (Enterprise Cloud)

### Architecture
- Scalable, highly available microservices running across multi-zone Kubernetes nodes.
- Horizontal Pod Autoscalers (HPA) scale API pods (2-10 replicas) and Web pods (2-8 replicas) based on CPU/Memory load.
- Pod Disruption Budgets (PDB) guarantee zero-downtime during rolling updates.
- Ingress controller terminates TLS with Let's Encrypt certificates.

### Deployment Commands
```bash
# Install / Upgrade using Helm
helm upgrade --install gf-ai infra/helm/gf-ai \
  --namespace gf-ai \
  --create-namespace \
  -f infra/helm/gf-ai/values.production.yaml \
  --set secrets.jwtSecret="$PROD_JWT_SECRET" \
  --set secrets.refreshSecret="$PROD_REFRESH_SECRET" \
  --set secrets.databaseUrl="$PROD_DATABASE_URL" \
  --set secrets.geminiApiKey="$PROD_GEMINI_KEY" \
  --wait
```
