import {
  VoiceProvider,
  VoiceCapabilities,
  VoiceSynthesisOptions,
  VoiceSynthesisResult,
} from '@ada/shared'

/**
 * System / Web Speech Voice Provider
 * 
 * Represents client-side / local operating system speech synthesis.
 */
export class SystemVoiceProvider implements VoiceProvider {
  readonly id = 'system'
  readonly name = 'System / Browser Voice'
  readonly providerName = 'Web Speech API'

  async initialize(): Promise<void> {}

  getCapabilities(): VoiceCapabilities {
    return {
      id: this.id,
      name: this.name,
      provider: this.providerName,
      type: 'speech',
      supportedLanguages: ['*'],
      isConfigured: true,
      licenseStatus: 'licensed',
      statusMessage: 'Client-side system voice synthesis.',
      description: 'Local browser speech synthesis (Web Speech API).',
      requiresAuthorization: false,
      supportsStreaming: false,
    }
  }

  async synthesizeSpeech(
    text: string,
    options: VoiceSynthesisOptions = {}
  ): Promise<VoiceSynthesisResult> {
    // Client-side Web Speech API is rendered directly in the browser;
    // this returns a signal indicating client-side execution
    return {
      audioBase64: '',
      mimeType: 'audio/x-system-speech',
      voice: options.voiceId || 'system-default',
      provider: this.providerName,
      model: 'web-speech-api',
      isAuthenticMiku: false,
      licenseStatus: 'licensed',
    }
  }

  async stop(): Promise<void> {}
  async dispose(): Promise<void> {}
}
