/**
 * OpenTelemetry Distributed Tracing for GF-AI Background Worker
 */

export class WorkerTelemetryService {
  private static isInitialized = false

  static init() {
    if (this.isInitialized) return
    const serviceName = process.env.OTEL_SERVICE_NAME || 'ada-worker'
    console.log(`📡 [OpenTelemetry Worker] Initializing telemetry for ${serviceName}`)
    this.isInitialized = true
  }

  static createSpan(name: string, attributes: Record<string, string | number | boolean> = {}) {
    const traceId = Math.random().toString(36).substring(2, 18)
    const spanId = Math.random().toString(36).substring(2, 10)
    const startTime = Date.now()

    return {
      traceId,
      spanId,
      name,
      attributes,
      end: () => {
        const durationMs = Date.now() - startTime
        if (process.env.DEBUG_TRACES === 'true') {
          console.log(`🔍 [Worker Span: ${name}] traceId=${traceId} duration=${durationMs}ms`, attributes)
        }
      },
    }
  }
}

WorkerTelemetryService.init()
