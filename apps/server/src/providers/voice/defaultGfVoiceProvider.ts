import {
  VoiceProvider,
  VoiceCapabilities,
  VoiceSynthesisOptions,
  VoiceSynthesisResult,
} from '@ada/shared'
import { NeuralTTSProvider } from '../neuralTtsProvider.js'

/**
 * Default GF-AI Voice Provider
 * 
 * Provides conversational speech synthesis for Ada, Atlas, and companion personas
 * using high-fidelity Microsoft Edge Neural TTS, Kokoro, and Gemini fallback.
 */
export class DefaultGfVoiceProvider implements VoiceProvider {
  readonly id = 'default-gf'
  readonly name = 'GF-AI High-Fidelity Studio Voice'
  readonly providerName = 'Microsoft Neural / Studio Speech'

  async initialize(): Promise<void> {
    // NeuralTTSProvider singleton initializes lazily
  }

  getCapabilities(): VoiceCapabilities {
    return {
      id: this.id,
      name: this.name,
      provider: this.providerName,
      type: 'speech',
      supportedLanguages: ['en', 'ta', 'tanglish', 'hi', 'ja'],
      isConfigured: true,
      licenseStatus: 'licensed',
      statusMessage: 'High-fidelity studio neural voice ready.',
      description: 'Human-grade neural speech for Ada, Atlas, and GF-AI companion personas.',
      requiresAuthorization: false,
      supportsStreaming: false,
    }
  }

  async synthesizeSpeech(
    text: string,
    options: VoiceSynthesisOptions = {}
  ): Promise<VoiceSynthesisResult> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required for TTS synthesis')
    }

    const cleanText = text.trim()
    const neuralProvider = NeuralTTSProvider.getInstance()
    const result = await neuralProvider.synthesize(cleanText, {
      voice: options.voiceId,
      rate: options.rate,
      pitch: options.pitch,
      language: options.language,
    })

    return {
      audioBase64: result.audioBase64,
      mimeType: result.mimeType || 'audio/mpeg',
      voice: result.voice,
      provider: this.providerName,
      model: 'msedge-neural-v2',
      isAuthenticMiku: false,
      licenseStatus: 'licensed',
    }
  }

  async stop(): Promise<void> {
    // In-memory generation is atomic
  }

  async dispose(): Promise<void> {
    // In-memory generation is atomic
  }
}
