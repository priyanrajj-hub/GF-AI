import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  type ChatMessage,
  type LLMGenerateOptions,
  type LLMProvider,
  parseAndRepairStructuredReply,
  type StructuredReply,
} from '@ada/shared'
import { ContextBuilder } from '../services/contextBuilder.js'

export class GeminiLLMProvider implements LLMProvider {
  name = 'Gemini'
  private apiKeys: string[] = []
  private currentKeyIndex = 0

  constructor(apiKey?: string) {
    const rawKeys = [
      apiKey,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
    ].filter((k): k is string => Boolean(k && k.trim() && k !== 'your_gemini_api_key_here'))

    this.apiKeys = Array.from(new Set(rawKeys))
  }

  isConfigured(): boolean {
    return this.apiKeys.length > 0
  }

  private getGenAI(): GoogleGenerativeAI {
    if (this.apiKeys.length === 0) {
      throw new Error('Gemini API key is not configured.')
    }
    const key = this.apiKeys[this.currentKeyIndex % this.apiKeys.length]
    return new GoogleGenerativeAI(key)
  }

  private rotateKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length
      console.log(`[GeminiLLMProvider] Rotated to API key #${this.currentKeyIndex + 1}`)
    }
  }

  private getCandidateModels(tier: 'fast' | 'reasoning' = 'fast'): string[] {
    const list = [
      process.env.GEMINI_MODEL,
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
    ].filter((m): m is string => Boolean(m && m.trim()))
    return Array.from(new Set(list))
  }

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply> {
    const { systemPrompt, trimmedHistory } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
    })

    const candidates = this.getCandidateModels(options.modelTier)
    let lastError: any = null

    for (let k = 0; k < Math.max(1, this.apiKeys.length); k++) {
      const genAI = this.getGenAI()

      for (const modelName of candidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: options.temperature ?? 0.7,
            },
          })

          const chat = model.startChat({
            history: trimmedHistory,
          })

          const result = await chat.sendMessage(userMessage)
          const text = result.response.text()

          return parseAndRepairStructuredReply(text)
        } catch (err: any) {
          lastError = err
          console.warn(`[GeminiLLMProvider] Model '${modelName}' key #${(this.currentKeyIndex % this.apiKeys.length) + 1} failed (${err?.status || err?.message}). Trying next fallback...`)
        }
      }
      this.rotateKey()
    }

    throw lastError || new Error('All Gemini candidate models failed')
  }

  async stream(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<StructuredReply> {
    const { systemPrompt, trimmedHistory } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
    })

    const candidates = this.getCandidateModels(options.modelTier)
    let lastError: any = null

    for (let k = 0; k < Math.max(1, this.apiKeys.length); k++) {
      const genAI = this.getGenAI()

      for (const modelName of candidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: options.temperature ?? 0.7,
            },
          })

          const chat = model.startChat({
            history: trimmedHistory,
          })

          const result = await chat.sendMessageStream(userMessage)
          let accumulatedText = ''

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            accumulatedText += chunkText
            onChunk(chunkText)
          }

          return parseAndRepairStructuredReply(accumulatedText)
        } catch (err: any) {
          lastError = err
          console.warn(`[GeminiLLMProvider stream] Model '${modelName}' key #${(this.currentKeyIndex % this.apiKeys.length) + 1} failed (${err?.status || err?.message}). Trying next fallback...`)
        }
      }
      this.rotateKey()
    }

    throw lastError || new Error('All Gemini candidate models failed for streaming')
  }

  /**
   * Gemini Neural Voice Synthesis (Girl Voice)
   * Prebuilt voice: 'Aoede' (sultry, confident, feminine) or 'Kore' (sweet, gentle girlfriend)
   */
  async generateTTS(
    text: string,
    voiceName: 'Aoede' | 'Kore' = 'Aoede'
  ): Promise<{ audioBase64: string; mimeType: string }> {
    const ttsModels = [
      process.env.GEMINI_TTS_MODEL,
      'gemini-3.8-flash-tts',
      'gemini-2.5-flash-preview-tts',
      'gemini-3.1-flash-tts-preview',
    ].filter((m): m is string => Boolean(m && m.trim()))

    let lastError: any = null

    for (let k = 0; k < Math.max(1, this.apiKeys.length); k++) {
      const genAI = this.getGenAI()

      for (const modelName of ttsModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            } as any,
          })

          const result = await model.generateContent(text)
          const part = result.response.candidates?.[0]?.content?.parts?.[0]
          if (part && (part as any).inlineData) {
            return {
              audioBase64: (part as any).inlineData.data,
              mimeType: (part as any).inlineData.mimeType || 'audio/wav',
            }
          }
        } catch (err: any) {
          lastError = err
          console.warn(`[Gemini TTS] Model '${modelName}' key #${(this.currentKeyIndex % this.apiKeys.length) + 1} failed: ${err.message}`)
        }
      }
      this.rotateKey()
    }

    throw lastError || new Error('All Gemini TTS attempts failed')
  }
}
