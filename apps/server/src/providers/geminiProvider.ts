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
  private genAI: GoogleGenerativeAI | null = null
  private defaultFlashModel: string
  private defaultProModel: string

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY
    if (key && key !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(key)
    }
    this.defaultFlashModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    this.defaultProModel = process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro'
  }

  isConfigured(): boolean {
    return this.genAI !== null
  }

  private getCandidateModels(tier: 'fast' | 'reasoning' = 'fast'): string[] {
    if (tier === 'reasoning') {
      const proCandidates = [
        process.env.GEMINI_PRO_MODEL,
        'gemini-1.5-pro',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ].filter((m): m is string => Boolean(m && m.trim()))
      return Array.from(new Set(proCandidates))
    }
    const flashCandidates = [
      process.env.GEMINI_MODEL,
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-8b',
    ].filter((m): m is string => Boolean(m && m.trim()))
    return Array.from(new Set(flashCandidates))
  }

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured.')
    }

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

    for (const modelName of candidates) {
      try {
        const model = this.genAI.getGenerativeModel({
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
        console.warn(`[GeminiLLMProvider] Model '${modelName}' failed (${err?.status || err?.message}). Trying next fallback...`)
      }
    }

    throw lastError || new Error('All Gemini candidate models failed')
  }

  async stream(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<StructuredReply> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured.')
    }

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

    for (const modelName of candidates) {
      try {
        const model = this.genAI.getGenerativeModel({
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
        console.warn(`[GeminiLLMProvider stream] Model '${modelName}' failed (${err?.status || err?.message}). Trying next fallback...`)
      }
    }

    throw lastError || new Error('All Gemini candidate models failed for streaming')
  }
}
