import type {
  ChatMessage,
  LLMGenerateOptions,
  LLMProvider,
  StructuredReply,
} from '@ada/shared'
import { GeminiLLMProvider } from './geminiProvider.js'
import { HuggingFaceProvider } from './huggingfaceProvider.js'
import { GroqLLMProvider } from './groqProvider.js'
import { OpenRouterLLMProvider } from './openrouterProvider.js'
import { OllamaLLMProvider } from './ollamaProvider.js'
import { MockLLMProvider } from './mockProvider.js'

export interface UsageStats {
  totalRequests: number
  totalTokens: number
  estimatedCostUsd: number
  providerCounts: Record<string, number>
  fallbackCount: number
}

export class ModelRouter implements LLMProvider {
  name = 'smart_router'

  private gemini: GeminiLLMProvider
  private huggingface: HuggingFaceProvider
  private groq: GroqLLMProvider
  private openrouter: OpenRouterLLMProvider
  private ollama: OllamaLLMProvider
  private mock: MockLLMProvider

  private isPrivateMode: boolean = false
  private stats: UsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    providerCounts: {},
    fallbackCount: 0,
  }

  constructor() {
    this.gemini = new GeminiLLMProvider()
    this.huggingface = new HuggingFaceProvider()
    this.groq = new GroqLLMProvider()
    this.openrouter = new OpenRouterLLMProvider()
    this.ollama = new OllamaLLMProvider()
    this.mock = new MockLLMProvider()
  }

  setPrivateMode(enabled: boolean): void {
    this.isPrivateMode = enabled
    console.log(`🛡️ [ModelRouter] Private mode: ${enabled ? 'ENABLED (100% Local Ollama)' : 'DISABLED'}`)
  }

  getPrivateMode(): boolean {
    return this.isPrivateMode
  }

  getStats(): UsageStats {
    return { ...this.stats }
  }

  isConfigured(): boolean {
    return true
  }

  private classifyTask(message: string): 'chit_chat' | 'reasoning' {
    const reasoningKeywords = [
      'why', 'explain', 'compare', 'analyze', 'debug', 'code', 'plan', 'calculate',
      'summarize', 'review', 'architecture', 'solve', 'logic'
    ]
    const lower = message.toLowerCase()
    const isReasoning = reasoningKeywords.some((kw) => lower.includes(kw)) || message.length > 200
    return isReasoning ? 'reasoning' : 'chit_chat'
  }

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options?: LLMGenerateOptions
  ): Promise<StructuredReply> {
    this.stats.totalRequests++

    const normOptions: LLMGenerateOptions = options || {
      mode: 'companion',
      sliders: {
        humor: 65,
        warmth: 80,
        formality: 45,
        directness: 75,
        flirtiness: 30,
        talkativeness: 50,
      },
    }

    // 1. Private Mode: Ollama Only
    if (this.isPrivateMode) {
      if (this.ollama.isConfigured()) {
        try {
          this.recordUsage('ollama', userMessage.length)
          return await (this.ollama as any).generate(history, userMessage, normOptions)
        } catch (err) {
          console.error('❌ [ModelRouter] Ollama private mode failed:', err)
        }
      }
      // If private mode and Ollama down, strictly do NOT leak to cloud
      this.recordUsage('mock_private', userMessage.length)
      return {
        speech: 'Private mode is active, but local Ollama is offline. No cloud queries sent.',
        display_text: '🔒 Private Mode Active: Ollama (localhost:11434) is unreachable. Please start Ollama to maintain zero cloud leakage.',
        emotion: 'concerned',
        intensity: 0.8,
        gesture: 'thinking_pose',
        voice_style: { rate: 1.0, pitch: 1.0 },
      }
    }

    const taskType = this.classifyTask(userMessage)

    // 2. Select candidates based on task type
    const candidateProviders: { name: string; provider: LLMProvider }[] = []

    if (taskType === 'reasoning') {
      // Stronger reasoning providers first
      if (this.gemini.isConfigured()) candidateProviders.push({ name: 'gemini', provider: this.gemini })
      if (this.groq.isConfigured()) candidateProviders.push({ name: 'groq', provider: this.groq })
      if (this.huggingface.isConfigured()) candidateProviders.push({ name: 'huggingface', provider: this.huggingface })
      if (this.openrouter.isConfigured()) candidateProviders.push({ name: 'openrouter', provider: this.openrouter })
    } else {
      // Fast chit-chat: Groq instant / Gemini flash lite / HF
      if (this.groq.isConfigured()) candidateProviders.push({ name: 'groq', provider: this.groq })
      if (this.gemini.isConfigured()) candidateProviders.push({ name: 'gemini', provider: this.gemini })
      if (this.huggingface.isConfigured()) candidateProviders.push({ name: 'huggingface', provider: this.huggingface })
      if (this.openrouter.isConfigured()) candidateProviders.push({ name: 'openrouter', provider: this.openrouter })
    }

    // Local fallback
    if (this.ollama.isConfigured()) candidateProviders.push({ name: 'ollama', provider: this.ollama })
    // Mock ultimate fallback
    candidateProviders.push({ name: 'mock', provider: this.mock })

    // Execute through candidates with retry/failover
    let lastError: any = null
    for (let i = 0; i < candidateProviders.length; i++) {
      const candidate = candidateProviders[i]
      try {
        if (i > 0) this.stats.fallbackCount++
        const result = await candidate.provider.generate(history, userMessage, normOptions)
        this.recordUsage(candidate.name, userMessage.length + (result.display_text?.length || 50))
        return result
      } catch (err: any) {
        lastError = err
        console.warn(`⚠️ [ModelRouter] Provider ${candidate.name} failed (${err.message}). Trying next...`)
      }
    }

    // Ultimate safeguard
    return this.mock.generate(history, userMessage, normOptions)
  }

  private recordUsage(provider: string, approxChars: number): void {
    this.stats.providerCounts[provider] = (this.stats.providerCounts[provider] || 0) + 1
    const approxTokens = Math.ceil(approxChars / 4)
    this.stats.totalTokens += approxTokens
    // Free tier cost = $0
    this.stats.estimatedCostUsd = 0
  }
}
