import {
  buildSystemPrompt,
  type ChatMessage,
  type PersonalityMode,
  type PersonalitySliders,
} from '@ada/shared'
import { db } from '../db/index.js'
import { AdaSelfKnowledgeService } from './adaSelfKnowledgeService.js'
import { GirlBehaviorService } from './girlBehaviorService.js'
import { PriyanLifeMemoryService } from './priyanLifeMemoryService.js'

export interface BudgetStatus {
  warning: boolean
  exceeded: boolean
  currentCostUsd: number
  limitCostUsd: number
  message?: string
}

export class ContextBuilder {
  private static MONTHLY_BUDGET_USD = 15.0 // configurable budget cap

  /**
   * Approximates token count for text (~4 chars per token).
   */
  static estimateTokens(text: string): number {
    return Math.ceil((text || '').length / 4)
  }

  static checkBudget(userId: string): BudgetStatus {
    const usage = db.getMonthTokenUsage(userId)
    const limit = this.MONTHLY_BUDGET_USD
    const ratio = usage.totalCostUsd / limit

    return {
      warning: ratio >= 0.8 && ratio < 1.0,
      exceeded: ratio >= 1.0,
      currentCostUsd: usage.totalCostUsd,
      limitCostUsd: limit,
      message:
        ratio >= 1.0
          ? 'Monthly LLM budget cap reached (100%). Downgrading to lightweight speed model.'
          : ratio >= 0.8
            ? `Notice: 80% of monthly LLM budget reached ($${usage.totalCostUsd.toFixed(2)} / $${limit.toFixed(2)}).`
            : undefined,
    }
  }

  static buildPromptContext(options: {
    userId: string
    history: ChatMessage[]
    userMessage: string
    mode: PersonalityMode
    sliders: PersonalitySliders
    language?: string
    liveInternetContext?: string
  }): {
    systemPrompt: string
    trimmedHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
    estimatedPromptTokens: number
  } {
    const { userId, history, userMessage, mode, sliders, language = 'en', liveInternetContext } = options

    const settings = db.getUserSettings(userId)
    const memories = settings.memoryConsent ? db.getMemories(userId).map((m) => m.content) : []

    // Deep context layers: Ada Self-Knowledge, Girl Behavior & Activities, Priyan's World & Memories
    const selfKnowledgeStr = AdaSelfKnowledgeService.formatSelfKnowledgeContext()
    const girlBehaviorStr = GirlBehaviorService.formatGirlBehaviorContext()
    const priyanLifeStr = PriyanLifeMemoryService.formatPriyanLifeContext(userId)

    const augmentedContext = [
      liveInternetContext,
      selfKnowledgeStr,
      girlBehaviorStr,
      priyanLifeStr,
    ]
      .filter(Boolean)
      .join('\n\n')

    // 1. Build Base System Persona
    const systemPrompt = buildSystemPrompt({
      mode,
      sliders,
      userName: settings.userName,
      memories,
      language,
      currentDateStr: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      liveInternetContext: augmentedContext,
    })

    // 2. Trim chat history to stay under ~2,000 tokens
    let accumulatedTokens = this.estimateTokens(userMessage)
    const maxHistoryTokens = 2000
    const turns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i]
      const msgTokens = this.estimateTokens(msg.content)
      if (accumulatedTokens + msgTokens > maxHistoryTokens) {
        break
      }
      accumulatedTokens += msgTokens
      turns.unshift({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }

    const totalEstimated = this.estimateTokens(systemPrompt) + accumulatedTokens

    return {
      systemPrompt,
      trimmedHistory: turns,
      estimatedPromptTokens: totalEstimated,
    }
  }
}
