# Security Policy & Key Rotation Mandate — GF-AI & Jarvis Trade AI

## 🚨 IMMEDIATE ACTION REQUIRED: Rotate ElevenLabs API Key

> [!CAUTION]
> **ROTATE YOUR ELEVENLABS KEY FIRST BEFORE RE-ENABLING ELEVENLABS IN PRODUCTION.**
> A historical test key (`REDACTED_API_KEY`) was present in early commits (`27561c0`, `2ef6926`, `664feaf`).
> Although it has been permanently purged from the git tree using `git filter-repo`, **any key that was once public must be treated as compromised**.
>
> **Steps to Rotate:**
> 1. Log in to [ElevenLabs Dashboard](https://elevenlabs.io/app/voice-library).
> 2. Navigate to **Profile → API Keys**.
> 3. Click **Delete / Revoke** on the old key.
> 4. Generate a new secret key.
> 5. Update `ELEVENLABS_API_KEY` in your [Vercel Project Settings](https://vercel.com/priyanrajj-hub/gf-ai/settings/environment-variables) and server `.env`.

---

## 1. Zero-Trust Security Architecture

Security is enforced across every layer of the GF-AI monorepo:

### 1.1. Secret Scrubbing & Full-History Gitleaks CI Check
- **Full History Scan:** The CI pipeline (`.github/workflows/ci.yml`) executes `gitleaks/gitleaks-action` with `fetch-depth: 0`, scanning every commit, tag, and branch for leaked patterns.
- **Pre-Commit Verification:** Run `npm run scan:secrets` locally to verify 0 exposed secrets before staging changes.
- **Gitignore Enforcement:** All `.env*` variants across all packages are strictly ignored in `.gitignore`, while `.env.example` provides safe, documentation-only configuration.

### 1.2. Cryptographic JWT Authentication & Durable Revocation
- **Separate Access & Refresh Tokens:** Explicit `type: "access"` and `type: "refresh"` claims. Verification functions reject mismatched token types.
- **Production Secret Guard:** Startup fails immediately in production if `JWT_SECRET` is missing, `< 32` characters, or uses known template placeholders.
- **Shared Revocation Store:** Revoked `jti`s and refresh token families are stored with TTL in persistent storage with reuse detection.
- **Admin Role Security:** `role: "admin"` is derived strictly from the server's `ADMIN_EMAILS` environment allowlist upon verified login. Client-supplied roles and identities are strictly rejected.

### 1.3. SSRF & Ingress Protection
- **DNS Pinning:** Resolves target hostname and pins the connection to the validated public IP, preventing DNS rebinding races.
- **Private Subnet Trapping:** Blocks RFC 1918 subnets, cloud metadata (`169.254.169.254`), decimal/hex IP representations, IPv6 loopbacks, and IPv4-mapped IPv6.
- **Redirect Validation:** Re-resolves and validates target IPs across every HTTP redirect hop (maximum 3 hops).

### 1.4. Data Integrity & Financial Provenance
- **Zero Fabrication Guarantee:** All financial outputs from Jarvis Trade AI contain `{ source, asOf, isLive, currency }`. Hardcoded rates, synthetic price generators, and fake indicators are forbidden. When live providers fail, the system returns an explicit unavailable state.
- **Statutory Disclaimer:** Every financial analysis includes:
  > *"⚠️ Educational & Informational Analysis Only. Not SEBI-registered investment advice. No guaranteed returns. Trading in securities involves substantial financial risk. Consult a SEBI-registered financial advisor before executing trades."*

### 1.5. Privacy & User Data Lifecycle (GDPR/CCPA)
- **Data Export:** `GET /api/user/data/export` exports all user-associated records across accounts, messages, memories, notes, journals, relationships, RAG embeddings, and background jobs.
- **Complete Deletion:** `DELETE /api/user/data` atomically purges all records, invalidates outstanding tokens, and wipes token family state.

---

## 2. Vulnerability Reporting

To report a vulnerability:
- **Email:** `security@gf-ai.app`
- **Response SLA:** Within 24 hours.
- **Patch Deployment:** Critical patches deployed within 48 hours.
- Do not file public GitHub issues for unpatched vulnerabilities.
