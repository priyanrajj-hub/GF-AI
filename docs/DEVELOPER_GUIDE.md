# Developer Onboarding & Contribution Guide

This guide contains everything required to configure a local development environment, run the monorepo, add new characters or AI capabilities, and maintain coding standards for **GF-AI**.

---

## 1. Prerequisites

- **Node.js**: `20.x` or `22.x` (LTS recommended).
- **npm**: `>= 10.0.0`.
- **Git**: `>= 2.40.0`.
- Optional: Docker & Docker Compose for containerized development.

---

## 2. Quickstart Local Setup

```bash
# 1. Clone repository
git clone https://github.com/priyanrajj-hub/GF-AI.git
cd GF-AI

# 2. Checkout develop branch
git checkout develop

# 3. Install monorepo dependencies
npm ci

# 4. Create development environment file
cp .env.example .env

# 5. Build shared packages
npm run build -w packages/shared

# 6. Start full-stack development mode
# Terminal 1: Backend API
npm run dev -w apps/server

# Terminal 2: Frontend Web App
npm run dev -w apps/web
```

The frontend will be available at `http://localhost:5173`, and the API at `http://localhost:3001`.

---

## 3. Monorepo Structure

```
GF-AI/
├── packages/
│   └── shared/          # Shared TypeScript interfaces, types, constants, schemas
├── apps/
│   ├── server/          # Express REST API, AI orchestrator, auth, database adapters
│   ├── worker/          # Background scheduler, relationship decay daemon
│   └── web/             # React 19 SPA, Three.js 3D VRM canvas, voice engine, HUD
├── infra/
│   ├── docker/          # NGINX configuration and container manifests
│   ├── kubernetes/      # Raw Kubernetes manifests (Deployments, HPAs, PDBs, Ingress)
│   ├── helm/            # Helm 3 multi-environment charts
│   ├── terraform/       # Cloud-neutral modular Infrastructure as Code
│   └── observability/   # Prometheus, Grafana, Loki configurations
├── scripts/             # Verification, security attack suite, tests, evaluators
└── docs/                # Comprehensive engineering and operational architecture guides
```

---

## 4. How to Add a New 3D Character Archetype

1. **Place Avatar Asset**:
   - Place the optimized `.vrm` 3D model into `apps/web/public/models/`.
2. **Register Archetype Definition**:
   - Open `packages/shared/src/types.ts` and add the archetype configuration:
     ```typescript
     export interface CharacterArchetype {
       id: string;
       name: string;
       tagline: string;
       voiceId: string;
       vrmPath: string;
       defaultSliders: PersonalitySliders;
     }
     ```
3. **Register in Frontend Selector**:
   - Update `apps/web/src/components/character/CharacterPicker.tsx` with the new archetype card.
4. **Configure System Prompt**:
   - Add specialized system prompt instructions for the character in `apps/server/src/services/aiOrchestrator.ts`.

---

## 5. Coding Standards & Linter

- **Formatting & Linting**: GF-AI enforces high-speed linting using `oxlint`. Run `npm run lint`.
- **Typing**: Strict TypeScript (`noImplicitAny: true`, strict null checks). Run `npm run typecheck`.
- **Security**: Never commit secrets or hardcoded passwords. Run `npm run scan:secrets` and `npm run scan:pii`.
