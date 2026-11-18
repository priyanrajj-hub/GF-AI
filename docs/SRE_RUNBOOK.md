# Site Reliability Engineering (SRE) Incident Response Runbook

This runbook documents incident severity classification, on-call response workflows, emergency procedures, and rollback playbooks for **GF-AI**.

---

## 1. Incident Severity Definitions

| Tier | Name | Impact | Target Initial Response | Target Resolution |
|---|---|---|---|---|
| **SEV-1** | Critical Outage | Complete service disruption, database outage, auth bypass, data loss | < 15 minutes | < 2 hours |
| **SEV-2** | Major Degradation | Core LLM provider failure without failover, voice synthesis disabled, financial calculations failing | < 30 minutes | < 4 hours |
| **SEV-3** | Minor Degradation | Non-critical feature latency, 3D avatar animation glitch, memory recency sync delayed | < 2 hours | Next business day |
| **SEV-4** | Low / Cosmetic | Minor UI alignment fault, documentation discrepancy | Next business day | Scheduled release |

---

## 2. On-Call Emergency Workflows

### Playbook 1: Downstream LLM Provider Outage (Gemini / Groq / ElevenLabs)

**Symptoms:** `/api/chat` or `/api/voice` returns 502/504 errors; spikes in `gf_ai_http_requests_total{status="500"}`.

**Triage Steps:**
1. Check `/metrics` and application logs for provider timeout errors.
2. Verify provider status dashboards (Google Cloud, Groq, ElevenLabs).
3. If primary provider (e.g. Gemini) is down, verify that `AiOrchestrator` failover automatically switches to secondary (Groq -> OpenRouter -> Hugging Face).
4. If automated failover is stuck, force secondary provider via environment variable:
   ```bash
   kubectl set env deployment/gf-api -n gf-ai PREFERRED_LLM_PROVIDER=groq
   ```
5. If all external LLMs are down, activate mock mode to preserve non-crashing service:
   ```bash
   kubectl set env deployment/gf-api -n gf-ai MOCK_PROVIDERS=true
   ```

---

### Playbook 2: Database Connection Pool Exhaustion

**Symptoms:** `/health/ready` returns 503; `gf_ai_database_connected` drops to 0.

**Triage Steps:**
1. Check active database connections:
   ```sql
   SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   ```
2. Kill idle connections in transaction:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - interval '5 minutes';
   ```
3. Restart API pods to reset connection pools:
   ```bash
   kubectl rollout restart deployment/gf-api -n gf-ai
   ```

---

### Playbook 3: Emergency Token & Credential Revocation

**Scenario:** A JWT secret, API key, or database password is leaked or compromised.

**Execution Steps:**
1. Generate new high-entropy secrets (min 32 bytes):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the Kubernetes Secret or cloud parameter store:
   ```bash
   kubectl create secret generic gf-ai-secrets -n gf-ai \
     --from-literal=JWT_SECRET="<NEW_SECRET>" \
     --from-literal=REFRESH_SECRET="<NEW_REFRESH_SECRET>" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
3. Invalidate all active sessions in Redis:
   ```bash
   kubectl exec -it deployment/gf-api -n gf-ai -- node -e "/* invoke db.revokeAllActiveSessions() */"
   ```
4. Perform an immediate rolling restart of the API and Worker deployments:
   ```bash
   kubectl rollout restart deployment/gf-api deployment/gf-worker -n gf-ai
   ```

---

### Playbook 4: WebGL Context Loss / Client-side Memory Crash

**Symptoms:** User browser freezes or displays blank canvas on 3D avatar screen.

**Mitigation:**
1. GF-AI's `VrmAvatar.tsx` incorporates automatic `webglcontextlost` and `webglcontextrestored` event listeners.
2. If low-end GPU devices experience canvas crashing, the client dynamically switches to 2D Fallback Mode (`isLowPowerDevice` / `useSimpleRenderer`).
3. Asset memory is cleaned up via deep recursive disposal (`m.dispose()`, `m.map.dispose()`).

---

## 3. Rollback Playbooks

### Kubernetes Deployment Rollback
```bash
# Check revision history
kubectl rollout history deployment/gf-api -n gf-ai

# Roll back to the previous stable revision
kubectl rollout undo deployment/gf-api -n gf-ai
kubectl rollout undo deployment/gf-web -n gf-ai
```

### Helm Release Rollback
```bash
helm history gf-ai -n gf-ai
helm rollback gf-ai <PREVIOUS_REVISION_NUMBER> -n gf-ai
```

### Docker Compose Rollback
```bash
docker compose pull api:previous_tag
docker compose up -d --no-deps api
```

### Vercel Production Rollback
1. Access the Vercel Dashboard -> Project `gf-ai` -> Deployments.
2. Locate the previous verified production deployment.
3. Click `...` -> **Promote to Production** (takes effect instantaneously).
