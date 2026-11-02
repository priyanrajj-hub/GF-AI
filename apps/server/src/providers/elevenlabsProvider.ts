import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export class ElevenLabsProvider {
  private client: ElevenLabsClient | null = null
  private activeApiKey: string = ''

  constructor(apiKey?: string) {
    this.setApiKey(
      apiKey ||
      process.env.ELEVENLABS_API_KEY ||
      'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe'
    )
  }

  setApiKey(apiKey: string): void {
    if (apiKey && apiKey.trim()) {
      this.activeApiKey = apiKey.trim()
      this.client = new ElevenLabsClient({ apiKey: this.activeApiKey })
    }
  }

  isConfigured(): boolean {
    return Boolean(this.activeApiKey && this.client)
  }

  /**
   * Convert text to expressive speech using ElevenLabs API
   * Supports custom voice ID (default: NOpBlnGInO9m6vDvFkFC) and model (eleven_v4 / eleven_multilingual_v2)
   */
  async generateTTS(
    text: string,
    voiceId: string = 'cgSgspJ2msm6clMCkdW9',
    modelId: string = 'eleven_turbo_v2_5',
    customApiKey?: string
  ): Promise<{ audioBase64: string; mimeType: string }> {
    if (customApiKey && customApiKey.trim() && customApiKey !== this.activeApiKey) {
      this.setApiKey(customApiKey)
    }

    if (!this.client) {
      throw new Error(
        'ElevenLabs API key is not configured. Please provide your ElevenLabs API key in settings or .env (ELEVENLABS_API_KEY).'
      )
    }

    // Strictly map to valid premade human female girl voices (Sarah / Laura / Alice / Bella)
    let primaryVoice = voiceId
    if (!primaryVoice || primaryVoice === 'NOpBlnGInO9m6vDvFkFC' || primaryVoice === 'cgSgspJ2msm6clMCkdW9') {
      primaryVoice = 'EXAVITQu4vr4xnSDxMaL' // Sarah - young, mature, reassuring, 100% real human girl
    }

    // 100% Real human female girl voices supported on free & paid tiers
    const candidateVoices = Array.from(
      new Set([
        primaryVoice,
        'EXAVITQu4vr4xnSDxMaL', // Sarah (young, warm, real human female)
        'FGY2WhTYpPnrIDTdsKH5', // Laura (young, expressive girl)
        'Xb7hH8MSUJpSbSDYk0k2', // Alice (clear, engaging girl)
        'hpp4J3VqNfWAUOO0d1Us', // Bella (warm, bright girl)
      ].filter(Boolean) as string[])
    )

    const candidateModels = Array.from(
      new Set([
        'eleven_multilingual_v2', // Supported on free tier!
        'eleven_turbo_v2_5',
        'eleven_turbo_v2',
        modelId,
      ].filter(Boolean) as string[])
    )

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
          if (err.statusCode === 402 || (err.message && err.message.includes('library'))) {
            console.warn(
              `[ElevenLabs TTS] Voice '${vId}' requires paid library plan (${err.message}). Advancing to next voice...`
            )
            break
          }
          console.warn(
            `[ElevenLabs TTS] Model '${mId}' with voice '${vId}' failed: ${err.message}. Trying fallback...`
          )
        }
      }
    }

    throw lastError || new Error(`ElevenLabs TTS failed for voice '${voiceId}'`)
  }
}
