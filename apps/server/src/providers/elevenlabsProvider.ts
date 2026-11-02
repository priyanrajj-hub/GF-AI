import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export class ElevenLabsProvider {
  private client: ElevenLabsClient | null = null
  private activeApiKey: string = ''
  private isQuotaExhausted: boolean = false

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ELEVENLABS_API_KEY || ''
    // Ignore exhausted demo key if passed
    if (key && key !== 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe') {
      this.setApiKey(key)
    }
  }

  setApiKey(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
      const clean = apiKey.trim()
      if (this.activeApiKey !== clean) {
        this.activeApiKey = clean
        this.isQuotaExhausted = false
        this.client = new ElevenLabsClient({ apiKey: this.activeApiKey })
      }
    } else {
      this.activeApiKey = ''
      this.client = null
      this.isQuotaExhausted = false
    }
  }

  isConfigured(): boolean {
    return Boolean(this.activeApiKey && this.client && !this.isQuotaExhausted)
  }

  /**
   * Convert text to expressive speech using ElevenLabs API
   * Supports custom voice ID and model.
   * Immediately fails over if quota is exhausted without hung retries.
   */
  async generateTTS(
    text: string,
    voiceId: string = 'EXAVITQu4vr4xnSDxMaL',
    modelId: string = 'eleven_multilingual_v2',
    customApiKey?: string
  ): Promise<{ audioBase64: string; mimeType: string }> {
    if (customApiKey && customApiKey.trim() && customApiKey !== this.activeApiKey) {
      this.setApiKey(customApiKey)
    }

    if (this.isQuotaExhausted) {
      throw new Error('ElevenLabs quota exhausted (10,000/10,000 credits). Instant fallback active.')
    }

    if (!this.client) {
      throw new Error(
        'ElevenLabs API key is not configured or credits exhausted. Falling back to High-Fidelity Studio Neural Voice.'
      )
    }

    // Strictly map to valid premade human female girl voices (Sarah / Laura / Alice / Bella)
    let primaryVoice = voiceId
    if (!primaryVoice || primaryVoice === 'NOpBlnGInO9m6vDvFkFC' || primaryVoice === 'cgSgspJ2msm6clMCkdW9') {
      primaryVoice = 'EXAVITQu4vr4xnSDxMaL' // Sarah - young, warm, real human female
    }

    const candidateVoices = [
      primaryVoice,
      'EXAVITQu4vr4xnSDxMaL',
    ].filter(Boolean)

    const candidateModels = [
      modelId || 'eleven_multilingual_v2',
      'eleven_turbo_v2_5',
    ]

    let lastError: any = null

    for (const vId of candidateVoices) {
      for (const mId of candidateModels) {
        try {
          const audioStream = await this.client.textToSpeech.convert(vId, {
            text,
            modelId: mId,
            languageCode: 'en',
            voiceSettings: {
              stability: 0.38,
              similarityBoost: 0.85,
              style: 0.55,
              useSpeakerBoost: true,
            },
          })

          // Collect chunks from response stream
          const chunks: Buffer[] = []
          for await (const chunk of audioStream as any) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }

          const fullBuffer = Buffer.concat(chunks)
          const base64 = fullBuffer.toString('base64')

          return {
            audioBase64: base64,
            mimeType: 'audio/mpeg',
          }
        } catch (err: any) {
          lastError = err
          const msg = (err.message || '').toLowerCase()
          const isQuotaOrAuth =
            err.statusCode === 401 ||
            err.statusCode === 402 ||
            err.statusCode === 429 ||
            msg.includes('quota') ||
            msg.includes('credit') ||
            msg.includes('unauthorized') ||
            msg.includes('limit') ||
            msg.includes('character') ||
            msg.includes('payment')

          if (isQuotaOrAuth) {
            this.isQuotaExhausted = true
            console.warn(
              `[ElevenLabs TTS] Quota limit or credits exhausted (${err.message}). Instant failover to High-Fidelity Studio Neural Voice.`
            )
            throw err
          }

          if (err.statusCode === 402 || msg.includes('library')) {
            console.warn(`[ElevenLabs TTS] Voice '${vId}' requires paid library plan. Advancing...`)
            break
          }
          console.warn(`[ElevenLabs TTS] Model '${mId}' with voice '${vId}' failed: ${err.message}.`)
        }
      }
    }

    throw lastError || new Error(`ElevenLabs TTS failed for voice '${voiceId}'`)
  }
}
