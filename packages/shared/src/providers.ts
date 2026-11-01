import type {
  ChatMessage,
  PersonalityMode,
  PersonalitySliders,
  StructuredReply,
} from './types.js'

// ==========================================
// 1. LLM PROVIDER INTERFACE & MOCK
// ==========================================
export interface LLMGenerateOptions {
  mode: PersonalityMode
  sliders: PersonalitySliders
  userName?: string
  memories?: string[]
  language?: string
  modelTier?: 'fast' | 'reasoning'
  temperature?: number
  llmProvider?: 'gemini' | 'huggingface' | 'auto'
  huggingfaceApiKey?: string
}

export interface LLMProvider {
  name: string
  generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply>
  stream?(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<StructuredReply>
}

// ==========================================
// 2. STT (SPEECH-TO-TEXT) PROVIDER
// ==========================================
export interface STTOptions {
  language?: string
}

export interface STTProvider {
  name: string
  transcribe(audioBuffer: Uint8Array | ArrayBuffer | any, options?: STTOptions): Promise<string>
}

// ==========================================
// 3. TTS (TEXT-TO-SPEECH) PROVIDER
// ==========================================
export interface TTSOptions {
  voiceId?: string
  pitch?: number
  rate?: number
  style?: string
  language?: string
}

export interface TTSProvider {
  name: string
  synthesize(text: string, options?: TTSOptions): Promise<{ audioBuffer: ArrayBuffer; mimeType: string }>
}

// ==========================================
// 4. SEARCH PROVIDER
// ==========================================
export interface SearchResultItem {
  title: string
  url: string
  snippet: string
}

export interface SearchProvider {
  name: string
  search(query: string, maxResults?: number): Promise<SearchResultItem[]>
}

// ==========================================
// 5. MEME PROVIDER
// ==========================================
export interface MemeItem {
  id: string
  title: string
  imageUrl: string
  sourceUrl: string
  templateName?: string
}

export interface MemeProvider {
  name: string
  findMeme(topic: string, mood?: string): Promise<MemeItem>
  generateMeme(templateId: string, topText: string, bottomText: string): Promise<MemeItem>
}

// ==========================================
// 6. CHANNEL PROVIDER (Proactive Messaging)
// ==========================================
export interface ChannelMessagePayload {
  userId: string
  text: string
  audioUrl?: string
  imageUrl?: string
  type: 'briefing' | 'nudge' | 'reminder' | 'meme' | 'chat'
}

export interface ChannelProvider {
  name: string
  send(payload: ChannelMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }>
}

// ==========================================
// 7. VISION PROVIDER
// ==========================================
export interface VisionProvider {
  name: string
  analyzeImage(
    imageDataBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<string>
}
