export interface ModelDefinition {
  id: string
  name: string
  provider: 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'ollama' | 'mistral' | 'cohere' | 'mock'
  tier: 'free' | 'freemium' | 'local_private' | 'paid'
  tierLimitDescription: string
  contextWindow: number
  license: string // 'Apache-2.0' | 'MIT' | 'Llama-3.3-Community' | 'Gemma-Terms' | 'Commercial'
  suitableFor: 'chit_chat' | 'reasoning' | 'creative' | 'code' | 'fast_response'
  costPer1kTokensUsd: number // 0 for free tiers / local
  maxOutputTokens: number
}

export interface ProviderConfig {
  id: string
  name: string
  website: string
  freeTierAvailable: boolean
  requiresApiKey: boolean
  envKeyName: string
  supportsStreaming: boolean
  models: ModelDefinition[]
}

export const MODEL_REGISTRY: Record<string, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini AI',
    website: 'https://ai.google.dev',
    freeTierAvailable: true,
    requiresApiKey: true,
    envKeyName: 'GEMINI_API_KEY',
    supportsStreaming: true,
    models: [
      {
        id: 'gemini-flash-lite-latest',
        name: 'Gemini 2.0 Flash Lite',
        provider: 'gemini',
        tier: 'free',
        tierLimitDescription: '15 RPM / 1M TPM free tier quota',
        contextWindow: 1048576,
        license: 'Google AI Studio Terms',
        suitableFor: 'fast_response',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 8192,
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini 2.0 Flash',
        provider: 'gemini',
        tier: 'free',
        tierLimitDescription: '15 RPM free tier quota',
        contextWindow: 1048576,
        license: 'Google AI Studio Terms',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 8192,
      },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud Inference',
    website: 'https://groq.com',
    freeTierAvailable: true,
    requiresApiKey: true,
    envKeyName: 'GROQ_API_KEY',
    supportsStreaming: true,
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'groq',
        tier: 'free',
        tierLimitDescription: '30 RPM free tier',
        contextWindow: 128000,
        license: 'Llama 3.3 Community License',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 8192,
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'groq',
        tier: 'free',
        tierLimitDescription: '30 RPM free tier (~500 T/s speed)',
        contextWindow: 128000,
        license: 'Llama 3.1 Community License',
        suitableFor: 'chit_chat',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 8192,
      },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter Free Models',
    website: 'https://openrouter.ai',
    freeTierAvailable: true,
    requiresApiKey: true,
    envKeyName: 'OPENROUTER_API_KEY',
    supportsStreaming: true,
    models: [
      {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B Instruct (Free)',
        provider: 'openrouter',
        tier: 'free',
        tierLimitDescription: 'Free tier 20 req/min',
        contextWindow: 131072,
        license: 'Llama 3.2 Community License',
        suitableFor: 'chit_chat',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
      {
        id: 'qwen/qwen-2.5-7b-instruct:free',
        name: 'Qwen 2.5 7B Instruct (Free)',
        provider: 'openrouter',
        tier: 'free',
        tierLimitDescription: 'Free tier 20 req/min',
        contextWindow: 32768,
        license: 'Apache-2.0',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
    ],
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face Inference Providers',
    website: 'https://huggingface.co',
    freeTierAvailable: true,
    requiresApiKey: true,
    envKeyName: 'HF_ACCESS_KEY_ID',
    supportsStreaming: true,
    models: [
      {
        id: 'Qwen/Qwen2.5-72B-Instruct',
        name: 'Qwen 2.5 72B Instruct',
        provider: 'huggingface',
        tier: 'freemium',
        tierLimitDescription: 'Free rate-limited serverless inference',
        contextWindow: 32768,
        license: 'Apache-2.0',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
      {
        id: 'meta-llama/Llama-3.3-70B-Instruct',
        name: 'Llama 3.3 70B Instruct',
        provider: 'huggingface',
        tier: 'freemium',
        tierLimitDescription: 'Free rate-limited serverless inference',
        contextWindow: 128000,
        license: 'Llama 3.3 Community License',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Local (100% Private Offline)',
    website: 'https://ollama.com',
    freeTierAvailable: true,
    requiresApiKey: false,
    envKeyName: 'OLLAMA_HOST',
    supportsStreaming: true,
    models: [
      {
        id: 'llama3.2:3b',
        name: 'Llama 3.2 3B (Local)',
        provider: 'ollama',
        tier: 'local_private',
        tierLimitDescription: 'Unlimited offline local compute',
        contextWindow: 131072,
        license: 'Llama 3.2 Community License',
        suitableFor: 'chit_chat',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B (Local)',
        provider: 'ollama',
        tier: 'local_private',
        tierLimitDescription: 'Unlimited offline local compute',
        contextWindow: 32768,
        license: 'Apache-2.0',
        suitableFor: 'reasoning',
        costPer1kTokensUsd: 0,
        maxOutputTokens: 4096,
      },
    ],
  },
}

export interface ModelRoutingDecision {
  selectedProvider: 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'ollama' | 'mock'
  selectedModel: string
  taskType: 'chit_chat' | 'reasoning' | 'private_mode'
  reason: string
}
