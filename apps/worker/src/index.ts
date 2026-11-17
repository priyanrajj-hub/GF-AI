/**
 * GF-AI / Jarvis Background Worker & Proactive Task Engine
 * ────────────────────────────────────────────────────────
 * Multi-tenant background worker connected to the shared relational database.
 * Supports:
 * - Atomic job claiming and concurrency defense
 * - Quiet-hour checking with user timezone support
 * - Daily proactive message cap enforcement
 * - Genuine notification delivery into conversation streams & audit events
 * - Dead-letter queue and exponential backoff retry policies
 * - Automated expired session and token cleanup
 */

import dotenv from 'dotenv'
import type { UserSettings } from '@ada/shared'
import { workerDb, type WorkerJob } from './db.js'

dotenv.config()

export type { WorkerJob as BackgroundJob }

/**
 * Checks if the current time falls within user's configured quiet hours.
 * Supports user timezone (defaults to Asia/Kolkata).
 */
export function isQuietHours(settings?: UserSettings, currentTime = new Date(), timeZone = 'Asia/Kolkata'): boolean {
  const startStr = settings?.quietHoursStart || '23:00'
  const endStr = settings?.quietHoursEnd || '07:00'

  const [startH] = startStr.split(':').map(Number)
  const [endH] = endStr.split(':').map(Number)

  let hours: number
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timeZone || 'Asia/Kolkata',
    })
    hours = Number(formatter.format(currentTime))
  } catch {
    hours = currentTime.getHours()
  }

  if (startH > endH) {
    // Overnight quiet hours, e.g. 23:00 to 07:00
    return hours >= startH || hours < endH
  } else {
    // Same day range, e.g. 13:00 to 15:00
    return hours >= startH && hours < endH
  }
}

/**
 * Determines whether proactive communication may be delivered to user right now.
 */
export async function canSendProactive(userId: string, settings?: UserSettings, currentTime = new Date()): Promise<boolean> {
  if (!userId || userId.startsWith('guest_') || userId === 'guest') {
    return false
  }

  // Check quiet hours
  if (isQuietHours(settings, currentTime)) {
    return false
  }

  // Enforce configured daily proactive cap
  const maxCap = settings?.dailyProactiveCap ?? 3
  const countToday = await workerDb.get24hProactiveCount(userId)
  if (countToday >= maxCap) {
    return false
  }

  return true
}

/**
 * Executes a claimed background job and performs actual external/persistent work.
 */
export async function processJob(job: WorkerJob): Promise<boolean> {
  console.log(`[Worker] Executing job ${job.id} (type: ${job.jobType}, user: ${job.userId})`)
  try {
    switch (job.jobType) {
      case 'MORNING_BRIEFING': {
        const text = `🌅 Good morning! Your Jarvis system is active and calibrated. Today's focus schedule and market tracking are primed. How can I assist you today?`
        const delivered = await workerDb.deliverProactiveMessage(job.userId, text, 'happy')
        if (!delivered) throw new Error('Failed to deliver morning briefing message')
        break
      }

      case 'EVENING_WRAPUP': {
        const text = `🌙 Evening debrief: Great work today! Make sure to take time to unwind and rest. Logging off background active monitors for quiet hours soon.`
        const delivered = await workerDb.deliverProactiveMessage(job.userId, text, 'calm')
        if (!delivered) throw new Error('Failed to deliver evening wrapup message')
        break
      }

      case 'MARKET_ALERT': {
        const symbol = job.payload?.symbol || 'NIFTY'
        const alertNote = job.payload?.message || 'Price alert threshold triggered.'
        const text = `⚡ [Market Alert]: ${symbol} — ${alertNote}`
        const delivered = await workerDb.deliverProactiveMessage(job.userId, text, 'thoughtful')
        if (!delivered) throw new Error('Failed to deliver market alert')
        break
      }

      case 'CLEANUP_EXPIRED_SESSIONS': {
        const cleanupRes = await workerDb.cleanupExpiredSessions()
        console.log(`[Worker] Expired sessions cleaned:`, cleanupRes)
        break
      }

      default: {
        const text = `🔔 System Notification: ${job.payload?.text || 'Scheduled task executed.'}`
        await workerDb.deliverProactiveMessage(job.userId, text, 'neutral')
      }
    }
    return true
  } catch (error: any) {
    console.error(`[Worker] Error executing job ${job.id}:`, error.message)
    return false
  }
}

/**
 * Main Scheduler Polling Routine
 * Atomically claims pending jobs and processes them with retry backoff and caps.
 */
export async function runProactiveScheduler(): Promise<{ processed: number; errors: number }> {
  let processed = 0
  let errors = 0
  const now = Date.now()

  // Loop to claim and process available pending jobs one by one (concurrency safe)
  while (true) {
    const job = await workerDb.claimNextPendingJob(now)
    if (!job) break // No more eligible jobs

    const settings = await workerDb.getUserSettings(job.userId)

    // Check proactive policy guards (quiet hours, daily cap)
    if (job.userId && job.jobType !== 'CLEANUP_EXPIRED_SESSIONS') {
      const allowed = await canSendProactive(job.userId, settings || undefined)
      if (!allowed) {
        console.log(`[Worker] Rescheduling job ${job.id} for user ${job.userId} (quiet hours or daily cap active)`)
        // Reschedule in 30 minutes
        await workerDb.failJob(job.id, 'Rescheduled due to quiet hours or daily cap', job.attempts - 1, job.maxAttempts)
        continue
      }
    }

    const success = await processJob(job)
    if (success) {
      await workerDb.completeJob(job.id)
      processed++
    } else {
      errors++
      await workerDb.failJob(job.id, 'Execution failed', job.attempts, job.maxAttempts)
    }
  }

  return { processed, errors }
}

console.log('⚡ [Ada Worker] Proactive Scheduler & Channel Dispatcher Online.')
console.log('⏰ Multi-tenant persistent job processor connected to durable relational database.')

// Polling interval (every 60s in non-test mode)
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      await runProactiveScheduler()
    } catch (err: any) {
      console.error('[Worker] Scheduler cycle error:', err.message)
    }
  }, 60000)
}
