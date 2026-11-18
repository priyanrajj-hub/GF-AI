import {
  VoiceProvider,
  VoiceCapabilities,
  VoiceSynthesisOptions,
  VoiceSynthesisResult,
} from '@ada/shared'
import { OfficialMikuVoiceProvider } from './officialMikuVoiceProvider.js'
import { DefaultGfVoiceProvider } from './defaultGfVoiceProvider.js'
import { SystemVoiceProvider } from './systemVoiceProvider.js'

/**
 * GF-AI Modular Voice Provider Registry
 * 
 * Manages all registered voice providers, enforces licensing checks,
 * reports provider capabilities, and routes synthesis requests securely.
 */
export class VoiceRegistry {
  private static instance: VoiceRegistry
  private providers: Map<string, VoiceProvider> = new Map()

  private constructor() {
    this.registerProvider(new OfficialMikuVoiceProvider())
    this.registerProvider(new DefaultGfVoiceProvider())
    this.registerProvider(new SystemVoiceProvider())
  }

  public static getInstance(): VoiceRegistry {
    if (!VoiceRegistry.instance) {
      VoiceRegistry.instance = new VoiceRegistry()
    }
    return VoiceRegistry.instance
  }

  public registerProvider(provider: VoiceProvider): void {
    this.providers.set(provider.id, provider)
  }

  public getProvider(id: string): VoiceProvider | undefined {
    return this.providers.get(id)
  }

  public getMikuProvider(): OfficialMikuVoiceProvider {
    return this.providers.get('official-miku') as OfficialMikuVoiceProvider
  }

  public getAllCapabilities(): VoiceCapabilities[] {
    const list: VoiceCapabilities[] = []
    for (const provider of this.providers.values()) {
      list.push(provider.getCapabilities())
    }
    return list
  }

  public async synthesize(
    providerId: string,
    text: string,
    options: VoiceSynthesisOptions = {}
  ): Promise<VoiceSynthesisResult> {
    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(`Voice provider '${providerId}' not found. Available: ${Array.from(this.providers.keys()).join(', ')}`)
    }
    return provider.synthesizeSpeech(text, options)
  }
}
