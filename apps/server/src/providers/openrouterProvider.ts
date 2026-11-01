import type {
  ChatMessage,
  LLMProvider,
  PersonalityMode,
  PersonalitySliders,
  StructuredReply,
} from '@ada/shared'
import { buildAdaSystemPrompt } from '@ada/shared'

export class OpenRouterLLMProvider implements LLMProvider {
  name = 'openrouter'
  private apiKey: string
  private defaultModel: string

  constructor(
    apiKey: string = process.env.OPENROUTER_API_KEY || '',
    defaultModel: string = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'
  ) {
    this.apiKey = apiKey.trim()
    this.defaultModel = defaultModel
  }

  isConfigured(): boolean {
    return this.apiKey.length > 5
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
      customPrompt?: string
    }
  ): Promise<StructuredReply> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API Key is not configured')
    }

    const systemPrompt =
      context?.customPrompt ||
      buildAdaSystemPrompt({
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://ada-hologram.local',
        'X-Title': 'Ada Holographic Assistant',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages,
        temperature: 0.75,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter API Error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    try {
      const parsed = JSON.parse(content)
      return {
        speech: parsed.speech || parsed.display_text || 'Hey!',
        display_text: parsed.display_text || parsed.speech || content,
        emotion: parsed.emotion || 'happy',
        intensity: parsed.intensity ?? 0.75,
        gesture: parsed.gesture || 'idle',
        voice_style: parsed.voice_style || { rate: 1.0, pitch: 1.0 },
        sticker: parsed.sticker,
        meme: parsed.meme,
        reactions: parsed.reactions,
      }
    } catch {
      return {
        speech: content.slice(0, 300),
        display_text: content,
        emotion: 'happy',
        intensity: 0.7,
        gesture: 'idle',
        voice_style: { rate: 1.0, pitch: 1.0 },
      }
    }
  }
}
