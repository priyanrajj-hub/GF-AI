import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export class ElevenLabsProvider {
  private client: ElevenLabsClient | null = null
  private activeApiKey: string = ''

  constructor(apiKey?: string) {
    this.setApiKey(apiKey || process.env.ELEVENLABS_API_KEY || '')
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
    voiceId: string = process.env.ELEVENLABS_VOICE_ID || 'NOpBlnGInO9m6vDvFkFC',
    modelId: string = process.env.ELEVENLABS_MODEL_ID || 'eleven_v4',
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

    const candidateVoices = Array.from(
      new Set([
        voiceId,
        process.env.ELEVENLABS_VOICE_ID,
        process.env.ELEVENLABS_FALLBACK_VOICE_ID || 'cgSgspJ2msm6clMCkdW9',
        'EXAVITQu4vr4xnSDxMaL',
      ].filter(Boolean) as string[])
    )

    const candidateModels = Array.from(
      new Set([
        modelId,
        'eleven_multilingual_v2',
        'eleven_v4',
        'eleven_turbo_v2_5',
        'eleven_monolingual_v1',
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
