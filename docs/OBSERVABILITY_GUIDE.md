# Observability, Telemetry & Monitoring Architecture

This document describes the telemetry collection, metric exposition, log aggregation, and alerting policies for **GF-AI**.

---

## 1. Metrics Exposition (`/metrics`)

The API microservice exposes real-time Prometheus-formatted metrics at `GET /metrics`.

### Core Metrics Inventory

| Metric Name | Type | Description |
|---|---|---|
| `gf_ai_uptime_seconds` | Counter | Total application uptime in seconds |
| `gf_ai_http_requests_total{status="<CODE>"}` | Counter | Cumulative HTTP request count segmented by status code |
| `gf_ai_http_request_duration_seconds_total` | Counter | Aggregate wall-clock duration of all processed requests |
| `gf_ai_database_connected` | Gauge | Database connection health state (`1` = healthy, `0` = down) |
| `gf_ai_process_memory_rss_bytes` | Gauge | Resident Set Size (RSS) memory consumption |
| `gf_ai_process_memory_heap_used_bytes` | Gauge | V8 JavaScript heap memory utilization |

---

## 2. Scraping Configuration

Prometheus scrapes the microservices using Kubernetes annotations or explicit jobs:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gf-ai-api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api:3001']
        labels:
          service: 'gf-api'
          environment: 'production'
```

---

## 3. Grafana Dashboards & PromQL Queries

### Key Performance Indicators (KPIs)

#### 1. Request Rate (RPS)
```promql
sum(rate(gf_ai_http_requests_total[1m]))
```

#### 2. HTTP 5xx Error Rate Percentage
```promql
sum(rate(gf_ai_http_requests_total{status=~"5.."}[1m])) 
/ 
sum(rate(gf_ai_http_requests_total[1m])) * 100
```

#### 3. Average Request Latency
```promql
rate(gf_ai_http_request_duration_seconds_total[1m])
/
rate(gf_ai_http_requests_total[1m])
```

#### 4. Memory Utilization Trend
```promql
gf_ai_process_memory_heap_used_bytes / 1024 / 1024
```

---

## 4. Alerting Thresholds & SLIs/SLOs

| Alert | Condition | Severity | Action |
|---|---|---|---|
| **DatabaseDisconnected** | `gf_ai_database_connected == 0` for 1m | P0 (Critical) | Page on-call; check DB connectivity and pool saturation |
| **HighErrorRate** | 5xx rate > 2% for 3m | P1 (High) | Check recent deployments, upstream LLM provider status |
| **HighMemoryPressure** | Heap used > 850MB for 5m | P2 (Medium) | Trigger HPA scale-out, investigate memory leak |
| **HighLatency** | Avg latency > 2.0s for 5m | P2 (Medium) | Inspect external LLM response latency and database locks |

---

## 5. Log Aggregation (Loki & Promtail)

All backend services emit structured JSON logs to `stdout`/`stderr`. Promtail collects these streams and ships them to Grafana Loki:

```json
{
  "timestamp": "2026-11-18T16:00:00.000Z",
  "level": "info",
  "requestId": "req_84f93b",
  "route": "/api/chat",
  "domain": "finance",
  "provider": "gemini",
  "durationMs": 412,
  "statusCode": 200
}
```
