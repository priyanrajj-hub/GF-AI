import { InferenceClient } from '@huggingface/inference'
import {
  type ChatMessage,
  type LLMGenerateOptions,
  type LLMProvider,
  parseStructuredReply,
  type StructuredReply,
} from '@ada/shared'
import { ContextBuilder } from '../services/contextBuilder.js'

export class HuggingFaceProvider implements LLMProvider {
  name = 'HuggingFace'
  private client: InferenceClient | null = null
  private token: string = ''

  constructor(token?: string) {
    this.token =
      token ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HUGGING_FACE_HUB_TOKEN ||
      ''

    if (this.token && this.token.trim()) {
      this.client = new InferenceClient(this.token.trim())
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.token.trim())
  }

  private getClient(): InferenceClient {
    if (!this.client) {
      if (!this.token) {
        this.token =
          process.env.HF_TOKEN ||
          process.env.HUGGINGFACE_API_KEY ||
          process.env.HUGGING_FACE_HUB_TOKEN ||
          ''
      }
      if (!this.token) {
        throw new Error('Hugging Face API token (HF_TOKEN) is not configured.')
      }
      this.client = new InferenceClient(this.token.trim())
    }
    return this.client
  }

  private getCandidateModels(tier: 'fast' | 'reasoning' = 'fast'): string[] {
    const list = [
      process.env.HF_MODEL,
      tier === 'reasoning'
        ? 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B'
        : 'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-Small-24B-Instruct-2501',
      'Qwen/Qwen2.5-Coder-32B-Instruct',
    ].filter((m): m is string => Boolean(m && m.trim()))
    return Array.from(new Set(list))
  }

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply> {
    const client = this.getClient()
    const { systemPrompt } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
      liveInternetContext: options.liveInternetContext,
    })

    const messages = [
      { role: 'system' as const, content: `${systemPrompt}\n\nIMPORTANT: You must output ONLY a valid JSON object matching the required schema.` },
      ...history.slice(-10).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    const candidateModels = this.getCandidateModels(options.modelTier)
    let lastError: any = null

    for (const model of candidateModels) {
      try {
        const response = await client.chatCompletion({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: 1024,
        })

        const content = response.choices?.[0]?.message?.content || ''
        return parseStructuredReply(content, { userName: options.userName })
      } catch (err: any) {
        lastError = err
        console.warn(`[HuggingFaceProvider] Model '${model}' failed: ${err.message}. Trying next fallback...`)
      }
    }

    throw lastError || new Error('All Hugging Face candidate models failed')
  }

  async stream(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<StructuredReply> {
    const client = this.getClient()
    const { systemPrompt } = ContextBuilder.buildPromptContext({
      userId: options.userName || 'default-user-1',
      history,
      userMessage,
      mode: options.mode,
      sliders: options.sliders,
      language: options.language,
      liveInternetContext: options.liveInternetContext,
    })

    const messages = [
      { role: 'system' as const, content: `${systemPrompt}\n\nIMPORTANT: You must output ONLY a valid JSON object matching the required schema.` },
      ...history.slice(-10).map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    const candidateModels = this.getCandidateModels(options.modelTier)
    let lastError: any = null

    for (const model of candidateModels) {
      try {
        const stream = await client.chatCompletionStream({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: 1024,
        })

        let accumulated = ''
        let emittedLength = 0
        for await (const chunk of stream) {
          const text = chunk.choices?.[0]?.delta?.content || ''
          if (text) {
            accumulated += text

            // Only stream clean display_text characters
            const dtIndex = accumulated.indexOf('"display_text"')
            if (dtIndex !== -1) {
              const valueStartIndex = accumulated.indexOf('"', dtIndex + 14)
              if (valueStartIndex !== -1) {
                const currentVal = accumulated.slice(valueStartIndex + 1)
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
            } else if (!accumulated.trim().startsWith('{')) {
              // Not JSON, stream plain text
              onChunk(text)
            }
          }
        }

        return parseStructuredReply(accumulated, { userName: options.userName })
      } catch (err: any) {
        lastError = err
        console.warn(`[HuggingFaceProvider stream] Model '${model}' failed: ${err.message}. Trying next...`)
      }
    }

    throw lastError || new Error('All Hugging Face stream candidate models failed')
  }

  /**
   * Hugging Face Neural Voice Synthesis (Kokoro / MMS / ESPnet)
   */
  async generateTTS(
    text: string,
    voiceModel: string = 'hexgrad/Kokoro-82M'
  ): Promise<{ audioBase64: string; mimeType: string }> {
    const client = this.getClient()
    const ttsCandidates = [
      voiceModel,
      'hexgrad/Kokoro-82M',
      'facebook/mms-tts-eng',
      'espnet/kan-bayashi_ljspeech_vits',
    ]

    let lastError: any = null

    for (const model of ttsCandidates) {
      try {
        const blob = await client.textToSpeech({
          model,
          inputs: text,
        })

        const arrayBuffer = await blob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = blob.type || 'audio/wav'

        return { audioBase64: base64, mimeType }
      } catch (err: any) {
        lastError = err
        console.warn(`[HuggingFace TTS] Model '${model}' failed: ${err.message}. Trying next...`)
      }
    }

    throw lastError || new Error('All Hugging Face TTS candidate models failed')
  }
}
