import type {
  ChatMessage,
  LLMProvider,
  PersonalityMode,
  PersonalitySliders,
  StructuredReply,
} from '@ada/shared'
import { buildAdaSystemPrompt } from '@ada/shared'

export class OllamaLLMProvider implements LLMProvider {
  name = 'ollama'
  private host: string
  private defaultModel: string
  private isOnline: boolean = false

  constructor(host: string = process.env.OLLAMA_HOST || 'http://localhost:11434', defaultModel: string = 'llama3.2:3b') {
    this.host = host
    this.defaultModel = defaultModel
    this.checkHealth()
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.host}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(1500) })
      this.isOnline = res.ok
      return this.isOnline
    } catch {
      this.isOnline = false
      return false
    }
  }

  isConfigured(): boolean {
    return this.isOnline
  }

  async generate(
    history: ChatMessage[],
    userMessage: string,
    context?: {
      mode?: PersonalityMode
      sliders?: PersonalitySliders
      userName?: string
      language?: string
      memories?: string[]
      notesSummary?: string
    }
  ): Promise<StructuredReply> {
    const systemPrompt = buildAdaSystemPrompt({
      userName: context?.userName,
      mode: context?.mode || 'companion',
      sliders: context?.sliders,
      language: (context?.language as any) || 'auto',
      memories: context?.memories,
      notesSummary: context?.notesSummary,
    })

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ]

    try {
      const res = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.defaultModel,
          messages,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.75,
            top_p: 0.9,
          },
        }),
      })

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      const rawText = data.message?.content || '{}'

      try {
        const parsed = JSON.parse(rawText)
        return {
          speech: parsed.speech || parsed.display_text || 'Acknowledged, Operator.',
          display_text: parsed.display_text || parsed.speech || rawText,
          emotion: parsed.emotion || 'happy',
          intensity: parsed.intensity ?? 0.7,
          gesture: parsed.gesture || 'idle',
          voice_style: parsed.voice_style || { rate: 1.0, pitch: 1.0 },
          sticker: parsed.sticker,
          meme: parsed.meme,
          reactions: parsed.reactions,
        }
      } catch {
        return {
          speech: rawText.slice(0, 150),
          display_text: rawText,
          emotion: 'calm',
          intensity: 0.6,
          gesture: 'idle',
          voice_style: { rate: 1.0, pitch: 1.0 },
        }
      }
    } catch (err: any) {
      console.warn('[Ollama Provider Error]:', err.message)
      throw err
    }
  }
}
