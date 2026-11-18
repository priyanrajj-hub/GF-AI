/**
 * Centralized Multi-Capability AI Orchestrator for GF-AI
 * ──────────────────────────────────────────────────────
 * Coordinates user intent, capability routing, multi-model failover,
 * contextual memory retrieval, authorized tool invocation, and execution telemetry.
 */

import type {
  ChatMessage,
  LLMGenerateOptions,
  PersonalityMode,
  PersonalitySliders,
  StructuredReply,
} from '@ada/shared'
import { ProviderRegistry } from '../providers/index.js'
import { UserLifeMemoryService } from './userLifeMemoryService.js'

export type AgentCapability =
  | 'general_intelligence'
  | 'research'
  | 'coding'
  | 'learning'
  | 'financial_analysis'
  | 'personal_assistant'
  | 'relationship_companion'
  | 'creative'
  | 'productivity'
  | 'voice'

export interface OrchestrationMetadata {
  capability: AgentCapability
  provider: string
  latencyMs: number
  toolsExecuted: string[]
  tokensEstimated: number
  failoverOccurred: boolean
}

export interface OrchestratedResponse {
  reply: StructuredReply
  metadata: OrchestrationMetadata
}

export class AiOrchestrator {
  private static instance: AiOrchestrator | null = null

  public static getInstance(): AiOrchestrator {
    if (!this.instance) {
      this.instance = new AiOrchestrator()
    }
    return this.instance
  }

  /**
   * Classify user intent into an authoritative specialized agent capability
   */
  public classifyCapability(message: string, mode?: PersonalityMode): AgentCapability {
    const lower = message.toLowerCase().trim()

    // 1. Financial Analysis (Jarvis Trade AI)
    if (
      /\b(?:stock|trade|trading|rsi|macd|ema|bollinger|vwap|sip|xirr|cagr|nifty|banknifty|sensex|equity|portfolio|hedging|shares|crypto|bitcoin|btc|eth|breakout|order block|support and resistance|pivot points?)\b/i.test(lower)
    ) {
      return 'financial_analysis'
    }

    // 2. Coding & Software Architecture
    if (
      /\b(?:code|debug|function|refactor|typescript|javascript|python|rust|c\+\+|sql|database|api|endpoint|git|docker|kubernetes|compiler|syntax|algorithm|css|html|react|backend|frontend)\b/i.test(lower) ||
      message.includes('```') ||
      /^(?:write|create|implement|fix)\s+(?:a |the )?(?:script|function|class|component|hook|test|regex)/i.test(lower)
    ) {
      return 'coding'
    }

    // 3. Research & Live Web Intelligence
    if (
      /\b(?:search|latest news|who is|what happened|research|sources|citations|paper|study|compare|difference between|verify|facts|history of)\b/i.test(lower)
    ) {
      return 'research'
    }

    // 4. Productivity & Time Management
    if (
      /\b(?:pomodoro|timer|focus|study session|todo|to-do|reminder|schedule|deadline|tasks? list|plan my day)\b/i.test(lower)
    ) {
      return 'productivity'
    }

    // 5. Learning & Academic Coaching
    if (
      mode === 'tutor' ||
      /\b(?:teach me|explain|how does .+ work|tutorial|quiz me|learn|concept|curriculum|syllabus)\b/i.test(lower)
    ) {
      return 'learning'
    }

    // 6. Voice & Singing Performance
    if (
      /\b(?:sing|dance|song|karaoke|music track|vocaloid|play audio|voice line)\b/i.test(lower)
    ) {
      return 'voice'
    }

    // 7. Creative Writing & Entertainment
    if (
      /\b(?:story|poem|write a song|roleplay|joke|meme|creative|brainstorm|narrative)\b/i.test(lower)
    ) {
      return 'creative'
    }

    // 8. Personal Assistant & System Operations
    if (
      /\b(?:weather|system health|settings|profile|status|diagnostic|disk|battery|help me with)\b/i.test(lower)
    ) {
      return 'personal_assistant'
    }

    // 9. Relationship Companion (Empathetic / Supportive conversation)
    if (
      mode === 'companion' ||
      /\b(?:i feel|my day|lonely|tired|happy|sad|love|miss you|how are you|talk to me|thank you|good morning|good night)\b/i.test(lower)
    ) {
      return 'relationship_companion'
    }

    return 'general_intelligence'
  }

  /**
   * Execute full orchestrated inference lifecycle with multi-provider failover
   */
  public async orchestrate(
    userId: string,
    history: ChatMessage[],
    userMessage: string,
    options: {
      mode?: PersonalityMode
      character?: string
      sliders?: PersonalitySliders
      userName?: string
      language?: string
      llmProvider?: string
      liveInternetContext?: string
      onChunk?: (chunk: string) => void
    }
  ): Promise<OrchestratedResponse> {
    const startTime = Date.now()
    const capability = this.classifyCapability(userMessage, options.mode)
    const toolsExecuted: string[] = []

    // 1. Retrieve user-specific memory context with semantic relevance
    const userMemoryContext = UserLifeMemoryService.formatUserLifeContext(userId, userMessage)
    toolsExecuted.push('memory_retrieval')

    if (options.liveInternetContext) {
      toolsExecuted.push('live_telemetry_integration')
    }

    // 2. Select Candidate Providers in Priority Order
    const providersToTry: { name: string; getProvider: () => any }[] = []

    const isMockMode = process.env.MOCK_PROVIDERS === 'true' || process.env.NODE_ENV === 'test'

    if (isMockMode) {
      providersToTry.push({ name: 'mock', getProvider: () => ProviderRegistry.getMockLLM() })
    } else {
      // Check user preference
      const requested = (options.llmProvider || '').toLowerCase()
      const gemini = ProviderRegistry.getGemini()
      const groq = ProviderRegistry.getGroq()
      const openrouter = ProviderRegistry.getOpenRouter()
      const hf = ProviderRegistry.getHuggingFace()
      const ollama = ProviderRegistry.getOllama()

      if (requested === 'groq' && groq.isConfigured()) {
        providersToTry.push({ name: 'groq', getProvider: () => groq })
      } else if (requested === 'openrouter' && openrouter.isConfigured()) {
        providersToTry.push({ name: 'openrouter', getProvider: () => openrouter })
      } else if (requested === 'huggingface' && hf.isConfigured()) {
        providersToTry.push({ name: 'huggingface', getProvider: () => hf })
      } else if (requested === 'ollama' && ollama.isConfigured()) {
        providersToTry.push({ name: 'ollama', getProvider: () => ollama })
      }

      // Primary reasoning/financial/coding candidate: Gemini Multi-Key Rotation
      if (gemini.isConfigured()) {
        providersToTry.push({ name: 'gemini', getProvider: () => gemini })
      }
      // High-speed low-latency candidate: Groq
      if (groq.isConfigured()) {
        providersToTry.push({ name: 'groq', getProvider: () => groq })
      }
      // Gateway fallback: OpenRouter
      if (openrouter.isConfigured()) {
        providersToTry.push({ name: 'openrouter', getProvider: () => openrouter })
      }
      // Serverless fallback: Hugging Face
      if (hf.isConfigured()) {
        providersToTry.push({ name: 'huggingface', getProvider: () => hf })
      }
      // Local offline candidate: Ollama
      if (ollama.isConfigured()) {
        providersToTry.push({ name: 'ollama', getProvider: () => ollama })
      }

      // Fallback safe mock provider (guarantees zero crash in offline test / mock environments)
      providersToTry.push({ name: 'mock', getProvider: () => ProviderRegistry.getMockLLM() })
    }

    // Build synthesized generation options
    const defaultSliders: PersonalitySliders = {
      humor: 50,
      warmth: 75,
      formality: 40,
      directness: 70,
      flirtiness: 25,
      talkativeness: 50,
    }

    const genOptions: LLMGenerateOptions = {
      mode: options.mode || 'companion',
      character: options.character || 'ada',
      sliders: options.sliders || defaultSliders,
      userName: options.userName,
      language: options.language,
      liveInternetContext: options.liveInternetContext
        ? `${options.liveInternetContext}\n\n${userMemoryContext}`
        : userMemoryContext,
    }

    let resolvedReply: StructuredReply | null = null
    let activeProviderName = 'unknown'
    let failoverOccurred = false

    for (let i = 0; i < providersToTry.length; i++) {
      const candidate = providersToTry[i]
      try {
        const providerInstance = candidate.getProvider()
        if (options.onChunk && typeof providerInstance.stream === 'function') {
          resolvedReply = await providerInstance.stream(history, userMessage, genOptions, options.onChunk)
        } else {
          resolvedReply = await providerInstance.generate(history, userMessage, genOptions)
        }

        if (resolvedReply && resolvedReply.display_text) {
          activeProviderName = candidate.name
          if (i > 0) failoverOccurred = true
          break
        }
      } catch (err: any) {
        console.warn(`[AiOrchestrator] Provider '${candidate.name}' failed: ${err.message}. Cascading to failover...`)
        failoverOccurred = true
      }
    }

    const finalReply: StructuredReply = resolvedReply || {
      speech: 'I encountered an issue reaching AI reasoning services. Please try again in a moment.',
      display_text: '⚠️ **All AI providers are currently unavailable.** Please check network connectivity or API credentials.',
      emotion: 'concerned',
      intensity: 0.8,
      gesture: 'thinking_pose',
      voice_style: { rate: 1.0, pitch: 1.0, style: 'calm' },
    }

    if (!resolvedReply) {
      activeProviderName = 'error'
    }

    const latencyMs = Date.now() - startTime
    const tokensEstimated = Math.ceil((userMessage.length + (finalReply.display_text?.length || 0)) / 4)

    return {
      reply: finalReply,
      metadata: {
        capability,
        provider: activeProviderName,
        latencyMs,
        toolsExecuted,
        tokensEstimated,
        failoverOccurred,
      },
    }
  }
}
