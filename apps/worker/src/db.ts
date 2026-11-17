/**
 * Worker Durable Database Adapter
 * ───────────────────────────────
 * Connects directly to the shared relational SQL database (PostgreSQL, Turso, or local libSQL).
 * Implements atomic job claiming, concurrency protection, idempotency, and audit logging.
 */

import fs from 'node:fs'
import path from 'node:path'
import { Pool } from 'pg'
import { createClient, type Client as LibsqlClient } from '@libsql/client'
import type { UserSettings } from '@ada/shared'

export interface WorkerJob {
  id: string
  userId: string
  jobType: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  scheduledFor: number
  executedAt?: number
  attempts: number
  maxAttempts: number
  errorMessage?: string
  payload?: any
  createdAt: number
}

export class WorkerDatabase {
  private static instance: WorkerDatabase | null = null
  private pgPool: Pool | null = null
  private libsqlClient: LibsqlClient | null = null
  private engine: 'postgres' | 'libsql' | 'sqlite_local' = 'sqlite_local'

  private constructor() {
    this.initEngine()
  }

  static getInstance(): WorkerDatabase {
    if (!this.instance) {
      this.instance = new WorkerDatabase()
    }
    return this.instance
  }

  private initEngine(): void {
    const dbUrl = process.env.DATABASE_URL || ''
    const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || ''
    const tursoAuth = process.env.TURSO_AUTH_TOKEN || ''

    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      this.engine = 'postgres'
      this.pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })
      console.log('[WorkerDB] Connected to PostgreSQL')
    } else if (tursoUrl) {
      this.engine = 'libsql'
      this.libsqlClient = createClient({
        url: tursoUrl,
        authToken: tursoAuth,
      })
      console.log('[WorkerDB] Connected to Turso/libSQL')
    } else {
      this.engine = 'sqlite_local'
      let storageDir = './data'
      if (!fs.existsSync(storageDir) && fs.existsSync('../../data')) {
        storageDir = '../../data'
      }
      try {
        if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
      } catch {}
      const dbFile = path.join(storageDir, 'ada_relational.db')
      this.libsqlClient = createClient({
        url: `file:${dbFile}`,
      })
      console.log(`[WorkerDB] Connected to local database at: ${dbFile}`)
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    if (this.engine === 'postgres' && this.pgPool) {
      let paramIndex = 1
      const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`)
      const res = await this.pgPool.query(pgSql, params)
      return { rows: res.rows, rowCount: res.rowCount || 0 }
    }
    if (this.libsqlClient) {
      const res = await this.libsqlClient.execute({ sql, args: params })
      return { rows: (res.rows as unknown) as T[], rowCount: res.rowsAffected || res.rows.length }
    }
    throw new Error('[WorkerDB] No active database engine')
  }

  /**
   * Atomically claims the next pending job scheduled for execution.
   * Concurrency-safe: uses row-level update and verification.
   */
  async claimNextPendingJob(now: number = Date.now()): Promise<WorkerJob | null> {
    try {
      const pendingRes = await this.query<any>(
        `SELECT id, user_id, job_type, status, scheduled_for, attempts, max_attempts, payload, created_at
         FROM background_jobs
         WHERE status = 'PENDING' AND scheduled_for <= ? AND attempts < max_attempts
         ORDER BY scheduled_for ASC
         LIMIT 1`,
        [now]
      )

      if (!pendingRes.rows || pendingRes.rows.length === 0) {
        return null
      }

      const candidate = pendingRes.rows[0]
      const jobId = candidate.id

      // Atomic update with status guard
      const claimRes = await this.query(
        `UPDATE background_jobs
         SET status = 'RUNNING', attempts = attempts + 1
         WHERE id = ? AND status = 'PENDING'`,
        [jobId]
      )

      if (claimRes.rowCount === 0) {
        // Concurrency collision: another worker worker claimed this job
        return null
      }

      let payload: any = candidate.payload
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload) } catch {}
      }

      return {
        id: candidate.id,
        userId: candidate.user_id,
        jobType: candidate.job_type,
        status: 'RUNNING',
        scheduledFor: Number(candidate.scheduled_for),
        attempts: Number(candidate.attempts) + 1,
        maxAttempts: Number(candidate.max_attempts) || 3,
        payload,
        createdAt: Number(candidate.created_at),
      }
    } catch (err: any) {
      console.warn('[WorkerDB] claimNextPendingJob notice:', err.message)
      return null
    }
  }

  /**
   * Marks a job as successfully completed
   */
  async completeJob(jobId: string): Promise<void> {
    const now = Date.now()
    await this.query(
      `UPDATE background_jobs
       SET status = 'COMPLETED', executed_at = ?, error_message = NULL
       WHERE id = ?`,
      [now, jobId]
    )
  }

  /**
   * Records a job failure with dead-letter queue or exponential backoff rescheduling
   */
  async failJob(jobId: string, errorMsg: string, attempts: number, maxAttempts: number): Promise<void> {
    const now = Date.now()
    if (attempts >= maxAttempts) {
      // Dead-letter state
      await this.query(
        `UPDATE background_jobs
         SET status = 'FAILED', error_message = ?, executed_at = ?
         WHERE id = ?`,
        [errorMsg, now, jobId]
      )
    } else {
      // Exponential backoff retry
      const backoffDelay = Math.pow(2, attempts) * 60 * 1000
      const nextSchedule = now + backoffDelay
      await this.query(
        `UPDATE background_jobs
         SET status = 'PENDING', scheduled_for = ?, error_message = ?
         WHERE id = ?`,
        [nextSchedule, errorMsg, jobId]
      )
    }
  }

  /**
   * Retrieves user settings from the relational database
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const res = await this.query<any>(
        `SELECT * FROM user_settings WHERE user_id = ?`,
        [userId]
      )
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0]
        return {
          userId: row.user_id,
          userName: row.user_name || 'User',
          language: row.language || 'auto',
          mode: row.mode || 'companion',
          sliders: {
            humor: row.humor ?? 65,
            warmth: row.warmth ?? 85,
            formality: row.formality ?? 40,
            directness: row.directness ?? 75,
            flirtiness: row.flirtiness ?? 45,
            talkativeness: row.talkativeness ?? 55,
          },
          hologramColor: row.hologram_color || '#00f3ff',
          renderMode: row.render_mode || 'holo-lite',
          avatarModelUrl: row.avatar_model_url || '/models/miku.vrm',
          skinId: row.skin_id || 'miku-classic-idol',
          handsFree: Boolean(row.hands_free),
          wakeWordEnabled: Boolean(row.wake_word_enabled),
          memoryConsent: Boolean(row.memory_consent),
          cameraConsent: Boolean(row.camera_consent),
          quietHoursStart: row.quiet_hours_start || '23:00',
          quietHoursEnd: row.quiet_hours_end || '07:00',
          dailyProactiveCap: row.daily_proactive_cap ?? 3,
          lowPerformanceMode: Boolean(row.low_performance_mode),
          soundVolume: Number(row.sound_volume ?? 0.85),
        }
      }
    } catch (e: any) {
      console.warn('[WorkerDB] getUserSettings warning:', e.message)
    }
    return null
  }

  /**
   * Counts proactive assistant messages dispatched to this user in the last 24 hours
   */
  async get24hProactiveCount(userId: string): Promise<number> {
    const since = Date.now() - 24 * 3600 * 1000
    try {
      const res = await this.query<any>(
        `SELECT COUNT(*) as cnt FROM background_jobs
         WHERE user_id = ? AND status = 'COMPLETED' AND executed_at >= ?`,
        [userId, since]
      )
      if (res.rows && res.rows.length > 0) {
        return Number(res.rows[0].cnt || 0)
      }
    } catch {}
    return 0
  }

  /**
   * Dispatches proactive notification into the user's conversation stream and audit log
   */
  async deliverProactiveMessage(userId: string, content: string, mood = 'happy'): Promise<boolean> {
    const msgId = `msg_proactive_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const audId = `aud_proactive_${Date.now()}`
    const now = Date.now()

    try {
      await this.query(
        `INSERT INTO chat_messages (id, user_id, sender, content, mood, created_at)
         VALUES (?, ?, 'assistant', ?, ?, ?)`,
        [msgId, userId, content, mood, now]
      )

      await this.query(
        `INSERT INTO audit_events (id, user_id, ip_address, event_type, severity, details, timestamp)
         VALUES (?, ?, '127.0.0.1', 'PROACTIVE_NOTIFICATION_DELIVERED', 'INFO', ?, ?)`,
        [audId, userId, `Delivered proactive notification: ${content.substring(0, 80)}`, now]
      )
      return true
    } catch (err: any) {
      console.error('[WorkerDB] deliverProactiveMessage failed:', err.message)
      return false
    }
  }

  /**
   * Cleans up expired sessions, revoked tokens, and stale magic links
   */
  async cleanupExpiredSessions(now: number = Date.now()): Promise<{
    revokedTokensCleaned: number
    refreshTokensCleaned: number
    magicLinksCleaned: number
  }> {
    try {
      const revRes = await this.query('DELETE FROM revoked_tokens WHERE expires_at < ?', [now])
      const refRes = await this.query('DELETE FROM refresh_tokens WHERE expires_at < ?', [now])
      const magRes = await this.query('DELETE FROM magic_links WHERE expires_at < ?', [now])

      return {
        revokedTokensCleaned: revRes.rowCount,
        refreshTokensCleaned: refRes.rowCount,
        magicLinksCleaned: magRes.rowCount,
      }
    } catch (err: any) {
      console.warn('[WorkerDB] cleanupExpiredSessions notice:', err.message)
      return { revokedTokensCleaned: 0, refreshTokensCleaned: 0, magicLinksCleaned: 0 }
    }
  }
}

export const workerDb = WorkerDatabase.getInstance()
