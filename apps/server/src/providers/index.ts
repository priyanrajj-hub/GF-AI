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
import { HuggingFaceProvider } from './huggingfaceProvider.js'
import { ElevenLabsProvider } from './elevenlabsProvider.js'
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
  private static geminiProvider: GeminiLLMProvider
  private static huggingfaceProvider: HuggingFaceProvider
  private static elevenlabsProvider: ElevenLabsProvider
  private static sttProvider: STTProvider
  private static ttsProvider: TTSProvider
  private static searchProvider: SearchProvider
  private static memeProvider: MemeProvider
  private static channelProvider: ChannelProvider
  private static visionProvider: VisionProvider

  static init(): void {
    this.geminiProvider = new GeminiLLMProvider()
    this.huggingfaceProvider = new HuggingFaceProvider()
    this.elevenlabsProvider = new ElevenLabsProvider()

    // 1. LLM selection: check explicit preference or active keys
    const preferred = process.env.LLM_PROVIDER?.toLowerCase()

    if (preferred === 'huggingface' && this.huggingfaceProvider.isConfigured()) {
      console.log('🤗 [Provider] Using Hugging Face LLM Provider (Primary)')
      this.llmProvider = this.huggingfaceProvider
    } else if (this.geminiProvider.isConfigured()) {
      console.log('🤖 [Provider] Using Google Gemini LLM Provider (Dual-key failover enabled)')
      this.llmProvider = this.geminiProvider
    } else if (this.huggingfaceProvider.isConfigured()) {
      console.log('🤗 [Provider] Using Hugging Face LLM Provider')
      this.llmProvider = this.huggingfaceProvider
    } else {
      console.log('🤖 [Provider] No active API key found; using MockLLMProvider with full persona')
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

  static getGemini(): GeminiLLMProvider {

    if (!this.geminiProvider) this.init()
    return this.geminiProvider
  }

  static getHuggingFace(): HuggingFaceProvider {
    if (!this.huggingfaceProvider) this.init()
    return this.huggingfaceProvider
  }

  static getElevenLabs(): ElevenLabsProvider {
    if (!this.elevenlabsProvider) this.init()
    return this.elevenlabsProvider
  }

  static getStatus() {
    if (!this.llmProvider) this.init()
    return {
      activeLLM: this.llmProvider.name,
      geminiConfigured: this.geminiProvider?.isConfigured() ?? false,
      huggingfaceConfigured: this.huggingfaceProvider?.isConfigured() ?? false,
      elevenlabsConfigured: this.elevenlabsProvider?.isConfigured() ?? false,
      models: {
        geminiChat: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
        geminiTTS: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts',
        hfModel: process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct',
        hfTTS: process.env.HF_TTS_MODEL || 'hexgrad/Kokoro-82M',
        elevenlabsVoice: process.env.ELEVENLABS_VOICE_ID || 'NOpBlnGInO9m6vDvFkFC',
        elevenlabsModel: process.env.ELEVENLABS_MODEL_ID || 'eleven_v4',
      },
    }
  }
}

