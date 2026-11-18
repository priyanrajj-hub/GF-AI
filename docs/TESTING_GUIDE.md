# Comprehensive Testing & Verification Strategy

This document details the test suites, execution commands, coverage standards, and verification procedures for the **GF-AI Platform**.

---

## 1. Test Suite Portfolio (230 Automated Tests)

| Suite | Script Path | Tests | Focus Area |
|---|---|---|---|
| **Offensive Security Suite** | `scripts/security/attack_suite.mjs` | **49** | Auth bypass, timing attacks, path traversal, injection, SSRF, brute-force lockout |
| **Relationship & Crisis Evals** | `apps/server/src/evals/runEvals.ts` | **121** | Crisis de-escalation, relationship boundaries, empathy guardrails, safety protocols |
| **Security & Financial Math** | `scripts/test_security_and_financials.mjs` | **16** | Financial calculators, input sanitization, SSRF protection, cryptographic entropy |
| **Miku Voice Integration** | `scripts/test_miku_voice_integration.mjs` | **15** | Voice routing, token validation, audio synthesis fallbacks, character metadata |
| **Round 4 Production Integration** | `scripts/test_round4_integration.mjs` | **13** | Database migrations, multi-tenant scoping, refresh token rotation, CORS headers |
| **End-to-End User Journey** | `scripts/test_e2e_flow.mjs` | **10** | Complete end-to-end user lifecycle (Health, Auth, Profile, AI Chat, SIP, Metrics) |
| **Actuarial SIP Calculator** | `scripts/test_sip_calculator.mjs` | **5** | Actuarial formula precision, compound interest edge cases, boundary validation |
| **CORS & Middleware** | `scripts/test_cors_security.mjs` | **6** | Origin allowlists, preflight OPTIONS handling, security header compliance |
| **Docker Stack Validation** | `scripts/docker/verify_docker_compose.mjs` | **4** | Multi-stage Dockerfile targets, non-root user, secure compose definitions |
| **Kubernetes & Helm Validation** | `scripts/kubernetes/verify_k8s_manifests.mjs` | **3** | Manifest parsing, probe endpoints, Helm template values |
| **Terraform IaC Validation** | `scripts/infra/verify_terraform.mjs` | **2** | Terraform module completeness, variable definitions, outputs |

---

## 2. Execution Commands

### Running Individual Test Suites

```bash
# 1. Run Complete Fast Test Suite
npm test

# 2. Run Comprehensive 10-Step End-to-End Flow
npm run test:e2e

# 3. Run Offensive Security & Attack Regression Suite (49 tests)
npx tsx scripts/security/attack_suite.mjs

# 4. Run Relationship & Crisis Evals (121 tests)
npm run test:evals

# 5. Run Actuarial SIP Unit Tests
npx tsx scripts/test_sip_calculator.mjs

# 6. Run Infrastructure Validations
node scripts/docker/verify_docker_compose.mjs
node scripts/kubernetes/verify_k8s_manifests.mjs
node scripts/infra/verify_terraform.mjs
```

### Static Analysis & Quality Audits

```bash
# Monorepo Linter (Oxlint)
npm run lint

# Monorepo TypeScript Compiler Check
npm run typecheck

# Full Production Monorepo Build
npm run build

# PII and Secret Scanners
npm run scan:pii
npm run scan:secrets
```

---

## 3. Continuous Integration Gates

In GitHub Actions, **all 230 automated tests must pass with 100% success rate** before any pull request can be merged into `develop` or `main`.
