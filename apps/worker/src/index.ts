import dotenv from 'dotenv'
import type { BriefingData } from '@ada/shared'

dotenv.config()

interface ProactiveState {
  lastMessageTimestamp: number
  messagesSentToday: number
  dateStr: string
  snoozedUntil: number
}

const userState: Record<string, ProactiveState> = {}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getUserState(userId: string): ProactiveState {
  const today = getTodayStr()
  if (!userState[userId] || userState[userId].dateStr !== today) {
    userState[userId] = {
      lastMessageTimestamp: 0,
      messagesSentToday: 0,
      dateStr: today,
      snoozedUntil: 0,
    }
  }
  return userState[userId]
}

export function isQuietHours(currentTime = new Date()): boolean {
  // Quiet hours default 11:00 PM to 7:00 AM
  const hours = currentTime.getHours()
  return hours >= 23 || hours < 7
}

export function canSendProactive(userId: string): boolean {
  if (isQuietHours()) {
    return false
  }

  const state = getUserState(userId)
  if (Date.now() < state.snoozedUntil) {
    return false
  }

  const DAILY_CAP = 3
  if (state.messagesSentToday >= DAILY_CAP) {
    return false
  }

  // Minimum 3 hours between proactive nudges
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000
  if (Date.now() - state.lastMessageTimestamp < THREE_HOURS_MS) {
    return false
  }

  return true
}

export function recordProactiveSent(userId: string): void {
  const state = getUserState(userId)
  state.messagesSentToday += 1
  state.lastMessageTimestamp = Date.now()
}

export function snoozeProactive(userId: string, hours = 4): void {
  const state = getUserState(userId)
  state.snoozedUntil = Date.now() + hours * 60 * 60 * 1000
  console.log(`[Worker] User ${userId} snoozed proactive notifications for ${hours} hours.`)
}

console.log('⚡ [Ada Worker] Proactive Scheduler & Channel Dispatcher Online.')
console.log('⏰ Guardrails Active: Quiet Hours (23:00 - 07:00), Daily Max 3 messages, Snooze enabled.')

// Periodic background loop (every 60 seconds)
setInterval(() => {
  const now = new Date()
  const userId = 'default-user-1'

  // Sample check: morning trigger between 8:00 AM and 8:05 AM
  if (now.getHours() === 8 && now.getMinutes() === 0) {
    if (canSendProactive(userId)) {
      console.log(`[Worker] Dispatching Morning Briefing to ${userId}...`)
      recordProactiveSent(userId)
    }
  }

  // Sample check: evening check-in at 8:30 PM
  if (now.getHours() === 20 && now.getMinutes() === 30) {
    if (canSendProactive(userId)) {
      console.log(`[Worker] Dispatching Evening Wrap-up to ${userId}...`)
      recordProactiveSent(userId)
    }
  }
}, 60000)
