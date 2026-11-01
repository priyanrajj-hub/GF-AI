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
import { GroqLLMProvider } from './groqProvider.js'
import { OpenRouterLLMProvider } from './openrouterProvider.js'
import { OllamaLLMProvider } from './ollamaProvider.js'
import { ModelRouter } from './modelRouter.js'
import { LiveWebSearchProvider } from './searchProvider.js'
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
  private static groqProvider: GroqLLMProvider
  private static openrouterProvider: OpenRouterLLMProvider
  private static ollamaProvider: OllamaLLMProvider
  private static modelRouter: ModelRouter
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
    this.groqProvider = new GroqLLMProvider()
    this.openrouterProvider = new OpenRouterLLMProvider()
    this.ollamaProvider = new OllamaLLMProvider()
    this.modelRouter = new ModelRouter()
    this.elevenlabsProvider = new ElevenLabsProvider()

    // 1. LLM selection: check explicit preference or use ModelRouter
    const preferred = process.env.LLM_PROVIDER?.toLowerCase()

    if (preferred === 'huggingface' && this.huggingfaceProvider.isConfigured()) {
      console.log('🤗 [Provider] Using Hugging Face LLM Provider (Primary)')
      this.llmProvider = this.huggingfaceProvider
    } else if (preferred === 'gemini' && this.geminiProvider.isConfigured()) {
      console.log('🤖 [Provider] Using Google Gemini LLM Provider')
      this.llmProvider = this.geminiProvider
    } else if (preferred === 'groq' && this.groqProvider.isConfigured()) {
      console.log('⚡ [Provider] Using Groq Cloud LLM Provider')
      this.llmProvider = this.groqProvider
    } else if (preferred === 'openrouter' && this.openrouterProvider.isConfigured()) {
      console.log('🌐 [Provider] Using OpenRouter LLM Provider')
      this.llmProvider = this.openrouterProvider
    } else if (preferred === 'ollama' && this.ollamaProvider.isConfigured()) {
      console.log('🦙 [Provider] Using Ollama Local LLM Provider')
      this.llmProvider = this.ollamaProvider
    } else {
      console.log('🔀 [Provider] Using Smart ModelRouter (Task-based failover & local fallback)')
      this.llmProvider = this.modelRouter
    }

    // 2. STT
    this.sttProvider = new MockSTTProvider()

    // 3. TTS
    this.ttsProvider = new MockTTSProvider()

    // 4. Search (Live Internet Search Engine)
    this.searchProvider = new LiveWebSearchProvider()

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

  static getGroq(): GroqLLMProvider {
    if (!this.groqProvider) this.init()
    return this.groqProvider
  }

  static getOpenRouter(): OpenRouterLLMProvider {
    if (!this.openrouterProvider) this.init()
    return this.openrouterProvider
  }

  static getOllama(): OllamaLLMProvider {
    if (!this.ollamaProvider) this.init()
    return this.ollamaProvider
  }

  static getRouter(): ModelRouter {
    if (!this.modelRouter) this.init()
    return this.modelRouter
  }

  static getStatus() {
    if (!this.llmProvider) this.init()
    return {
      activeLLM: this.llmProvider.name,
      geminiConfigured: this.geminiProvider?.isConfigured() ?? false,
      huggingfaceConfigured: this.huggingfaceProvider?.isConfigured() ?? false,
      groqConfigured: this.groqProvider?.isConfigured() ?? false,
      openrouterConfigured: this.openrouterProvider?.isConfigured() ?? false,
      ollamaConfigured: this.ollamaProvider?.isConfigured() ?? false,
      elevenlabsConfigured: this.elevenlabsProvider?.isConfigured() ?? false,
      privateMode: this.modelRouter?.getPrivateMode() ?? false,
      routerStats: this.modelRouter?.getStats() ?? null,
      models: {
        geminiChat: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
        geminiTTS: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts',
        hfModel: process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct',
        hfTTS: process.env.HF_TTS_MODEL || 'hexgrad/Kokoro-82M',
        groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        openrouterModel: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free',
        ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        elevenlabsVoice: process.env.ELEVENLABS_VOICE_ID || 'NOpBlnGInO9m6vDvFkFC',
        elevenlabsModel: process.env.ELEVENLABS_MODEL_ID || 'eleven_v4',
      },
    }
  }
}

