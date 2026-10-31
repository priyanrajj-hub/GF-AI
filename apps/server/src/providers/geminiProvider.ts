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

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured.')
    }

    const modelName = options.modelTier === 'reasoning' ? this.defaultProModel : this.defaultFlashModel
    const { systemPrompt, trimmedHistory } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
    })

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

    const modelName = options.modelTier === 'reasoning' ? this.defaultProModel : this.defaultFlashModel
    const { systemPrompt, trimmedHistory } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
    })

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
  }
}
