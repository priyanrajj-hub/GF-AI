# Helm Deployment & Multi-Environment Packaging Guide

This guide describes how to package, configure, and deploy the **GF-AI Platform** across Development, Staging, and Production environments using Helm 3.

---

## 1. Chart Structure

```
infra/helm/gf-ai/
├── Chart.yaml                  # Chart metadata and versioning
├── values.yaml                 # Base configuration and defaults
├── values.development.yaml     # Local/Minikube environment overrides
├── values.staging.yaml         # Staging/Pre-production cluster overrides
├── values.production.yaml      # High-availability production overrides
└── templates/
    ├── _helpers.tpl            # Template name/label generator macros
    ├── configmap.yaml          # Environment ConfigMap template
    ├── secrets.yaml            # Environment Secret template
    ├── deployment-api.yaml     # API Microservice Deployment
    ├── service-api.yaml        # API Microservice Service
    ├── hpa-api.yaml            # API HPA policy
    ├── pdb-api.yaml            # API PodDisruptionBudget
    ├── deployment-worker.yaml  # Background Worker Deployment
    ├── deployment-web.yaml     # Frontend Web Deployment
    ├── service-web.yaml        # Frontend Web Service
    ├── hpa-web.yaml            # Frontend Web HPA policy
    ├── ingress.yaml            # Ingress TLS & Routing
    ├── networkpolicy.yaml      # Zero-trust Network Policy
    └── serviceaccount.yaml     # ServiceAccount definition
```

---

## 2. Environment Value Profiles

### Development (`values.development.yaml`)
- Replicas: 1 API, 1 Worker, 1 Web.
- Autoscaling disabled.
- Ingress disabled (uses port-forwarding or NodePort).
- `ENABLE_TEST_AUTH: "true"`.

### Staging (`values.staging.yaml`)
- Replicas: 2 API, 1 Worker, 2 Web.
- Autoscaling enabled (min 2, max 4).
- Ingress enabled with host `staging.gf-ai.example.com`.
- Strict authentication enforced.

### Production (`values.production.yaml`)
- Replicas: 3 API, 2 Worker, 3 Web.
- Dynamic autoscaling enabled (min 3, max 15) triggered at 70% CPU or 80% Memory.
- PodDisruptionBudget enforced (`minAvailable: 2`).
- Strict NetworkPolicy and Let's Encrypt TLS termination.

---

## 3. Helm Deployment Workflow

### Syntax Linting & Verification
```bash
helm lint infra/helm/gf-ai
```

### Dry-Run & Manifest Rendering
```bash
helm template gf-ai infra/helm/gf-ai \
  -f infra/helm/gf-ai/values.production.yaml \
  --set secrets.jwtSecret="my-production-jwt-secret-min-32-chars-xyz" \
  --set secrets.refreshSecret="my-production-refresh-secret-min-32-chars-abc" \
  --set secrets.databaseUrl="postgresql://user:pass@db.internal:5432/gf_ai"
```

### Release Installation / Upgrade
```bash
# Production Release
helm upgrade --install gf-ai infra/helm/gf-ai \
  --namespace gf-ai \
  --create-namespace \
  -f infra/helm/gf-ai/values.production.yaml \
  --set secrets.jwtSecret="$JWT_SECRET" \
  --set secrets.refreshSecret="$REFRESH_SECRET" \
  --set secrets.databaseUrl="$DATABASE_URL" \
  --set secrets.geminiApiKey="$GEMINI_API_KEY" \
  --wait \
  --timeout 10m
```

### Rollback Management
If a deployment fails health checks during rollout:
```bash
# View release history
helm history gf-ai -n gf-ai

# Instantly rollback to previous release
helm rollback gf-ai 1 -n gf-ai
```
