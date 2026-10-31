import type {
  ChannelProvider,
  LLMProvider,
  MemeProvider,
  SearchProvider,
  STTProvider,
  TTSProvider,
  VisionProvider,
} from '@ada/shared'
import { GeminiLLMProvider } from './geminiProvider.js'
import {
  MockChannelProvider,
  MockLLMProvider,
  MockMemeProvider,
  MockSearchProvider,
  MockSTTProvider,
  MockTTSProvider,
  MockVisionProvider,
} from './mockProvider.js'

export class ProviderRegistry {
  private static llmProvider: LLMProvider
  private static sttProvider: STTProvider
  private static ttsProvider: TTSProvider
  private static searchProvider: SearchProvider
  private static memeProvider: MemeProvider
  private static channelProvider: ChannelProvider
  private static visionProvider: VisionProvider

  static init(): void {
    // 1. LLM
    const gemini = new GeminiLLMProvider()
    if (gemini.isConfigured()) {
      console.log('🤖 [Provider] Using Google Gemini LLM Provider')
      this.llmProvider = gemini
    } else {
      console.log('🤖 [Provider] Gemini API key not provided; using MockLLMProvider with full persona')
      this.llmProvider = new MockLLMProvider()
    }

    // 2. STT
    this.sttProvider = new MockSTTProvider()

    // 3. TTS
    this.ttsProvider = new MockTTSProvider()

    // 4. Search
    this.searchProvider = new MockSearchProvider()

    // 5. Meme
    this.memeProvider = new MockMemeProvider()

    // 6. Channel
    this.channelProvider = new MockChannelProvider()

    // 7. Vision
    this.visionProvider = new MockVisionProvider()
  }

  static getLLM(): LLMProvider {
    if (!this.llmProvider) this.init()
    return this.llmProvider
  }

  static getMockLLM(): LLMProvider {
    return new MockLLMProvider()
  }

  static getSTT(): STTProvider {
    if (!this.sttProvider) this.init()
    return this.sttProvider
  }

  static getTTS(): TTSProvider {
    if (!this.ttsProvider) this.init()
    return this.ttsProvider
  }

  static getSearch(): SearchProvider {
    if (!this.searchProvider) this.init()
    return this.searchProvider
  }

  static getMeme(): MemeProvider {
    if (!this.memeProvider) this.init()
    return this.memeProvider
  }

  static getChannel(): ChannelProvider {
    if (!this.channelProvider) this.init()
    return this.channelProvider
  }

  static getVision(): VisionProvider {
    if (!this.visionProvider) this.init()
    return this.visionProvider
  }
}
