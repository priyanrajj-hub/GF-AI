import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import {
  type ChatMessage,
  type LLMGenerateOptions,
  type LLMProvider,
  parseStructuredReply,
  type StructuredReply,
} from '@ada/shared'
import { ContextBuilder } from '../services/contextBuilder.js'

const GEMINI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    speech: {
      type: SchemaType.STRING,
      description: '1-3 short spoken sentences for TTS, written for the ear. No markdown, no tags, no symbols.',
    },
    display_text: {
      type: SchemaType.STRING,
      description: 'Formatted display text for the chat UI with markdown if desired.',
    },
    emotion: {
      type: SchemaType.STRING,
      enum: ['happy', 'sad', 'excited', 'concerned', 'thinking', 'surprised', 'playful', 'calm', 'motivated', 'tired'],
    },
    intensity: {
      type: SchemaType.NUMBER,
      description: 'Emotion intensity from 0.0 to 1.0',
    },
    gesture: {
      type: SchemaType.STRING,
      enum: ['idle', 'nod', 'shake', 'shrug', 'wave', 'thinking_pose', 'laugh', 'shy', 'surprised', 'concerned_lean', 'celebrate', 'fist_pump', 'sleepy'],
    },
    voice_style: {
      type: SchemaType.OBJECT,
      properties: {
        rate: { type: SchemaType.NUMBER },
        pitch: { type: SchemaType.NUMBER },
        style: { type: SchemaType.STRING },
      },
    },
    actions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          arguments: { type: SchemaType.OBJECT },
        },
        required: ['name'],
      },
    },
    sticker: { type: SchemaType.STRING },
    gif_query: { type: SchemaType.STRING },
    reactions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['speech', 'display_text', 'emotion', 'gesture'],
}

export class GeminiLLMProvider implements LLMProvider {
  name = 'Gemini'
  private apiKeys: string[] = []
  private currentKeyIndex = 0

  constructor(apiKey?: string) {
    const rawKeys: (string | undefined)[] = [apiKey]

    if (process.env.GEMINI_API_KEYS) {
      const split = process.env.GEMINI_API_KEYS.split(/[,;\n]+/).map(s => s.trim())
      rawKeys.push(...split)
    }

    rawKeys.push(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6,
      process.env.GEMINI_API_KEY_7,
      process.env.GEMINI_API_KEY_8
    )

    this.apiKeys = Array.from(
      new Set(
        rawKeys.filter((k): k is string => Boolean(k && k.trim() && k !== 'your_gemini_api_key_here'))
      )
    )

    if (this.apiKeys.length > 0) {
      console.log(`🤖 [GeminiLLMProvider] Initialized active key pool with ${this.apiKeys.length} authenticated keys.`)
    }
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
      console.log(`[GeminiLLMProvider] Rotated to API key #${this.currentKeyIndex + 1} of ${this.apiKeys.length}`)
    }
  }

  private getCandidateModels(tier: 'fast' | 'reasoning' = 'fast'): string[] {
    const list = [
      process.env.GEMINI_MODEL,
      tier === 'reasoning' ? 'gemini-3.5-flash' : 'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
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
      liveInternetContext: options.liveInternetContext,
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
              responseSchema: GEMINI_RESPONSE_SCHEMA as any,
              temperature: options.temperature ?? 0.7,
            },
          })

          const chat = model.startChat({
            history: trimmedHistory,
          })

          const result = await chat.sendMessage(userMessage)
          const text = result.response.text()

          return parseStructuredReply(text, { userName: options.userName })
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
      liveInternetContext: options.liveInternetContext,
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
              responseSchema: GEMINI_RESPONSE_SCHEMA as any,
              temperature: options.temperature ?? 0.7,
            },
          })

          const chat = model.startChat({
            history: trimmedHistory,
          })

          const result = await chat.sendMessageStream(userMessage)
          let accumulatedText = ''
          let emittedLength = 0

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            accumulatedText += chunkText

            // Stream ONLY the clean display_text content, never raw JSON tokens!
            const dtIndex = accumulatedText.indexOf('"display_text"')
            if (dtIndex !== -1) {
              const valueStartIndex = accumulatedText.indexOf('"', dtIndex + 14)
              if (valueStartIndex !== -1) {
                const currentVal = accumulatedText.slice(valueStartIndex + 1)
                let endIdx = -1
                for (let i = 0; i < currentVal.length; i++) {
                  if (currentVal[i] === '"' && (i === 0 || currentVal[i - 1] !== '\\')) {
                    endIdx = i
                    break
                  }
                }
                const streamable = endIdx === -1 ? currentVal : currentVal.slice(0, endIdx)
                const decoded = streamable.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
                if (decoded.length > emittedLength) {
                  const delta = decoded.slice(emittedLength)
                  emittedLength = decoded.length
                  onChunk(delta)
                }
              }
            }
          }

          return parseStructuredReply(accumulatedText, { userName: options.userName })
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
      'gemini-3.8-flash-lite-tts',
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
