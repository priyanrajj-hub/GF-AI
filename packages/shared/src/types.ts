export type EmotionType =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'concerned'
  | 'thinking'
  | 'surprised'
  | 'playful'
  | 'calm'
  | 'motivated'
  | 'tired'

export type GestureType =
  | 'idle'
  | 'nod'
  | 'shake'
  | 'shrug'
  | 'wave'
  | 'thinking_pose'
  | 'laugh'
  | 'shy'
  | 'surprised'
  | 'concerned_lean'
  | 'celebrate'
  | 'fist_pump'
  | 'sleepy'

export type PersonalityMode =
  | 'jarvis'
  | 'mentor'
  | 'coder'
  | 'coach'
  | 'listener'
  | 'playful'
  | 'companion'

export interface PersonalitySliders {
  humor: number // 0-100
  warmth: number // 0-100
  formality: number // 0-100
  directness: number // 0-100
  flirtiness: number // 0-100 (mild default, capped)
  talkativeness: number // 0-100
}

export interface VoiceStyle {
  pitch?: number // 0.5 to 1.5
  rate?: number // 0.5 to 1.5
  style?: string // 'cheerful' | 'empathetic' | 'authoritative' | 'calm'
}

export interface ActionCall {
  name: string
  arguments: Record<string, unknown>
}

export interface StructuredReply {
  speech: string // 1-3 sentences spoken aloud
  display_text: string // formatted text/markdown in chat drawer
  emotion: EmotionType
  intensity: number // 0.0 to 1.0
  gesture: GestureType
  voice_style: VoiceStyle
  actions?: ActionCall[]
  sticker?: string
  meme?: {
    template: string
    topText?: string
    bottomText?: string
  }
  gif_query?: string
  reactions?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  speech?: string
  emotion?: EmotionType
  gesture?: GestureType
  sticker?: string
  meme?: {
    template: string
    topText?: string
    bottomText?: string
  }
  gif_query?: string
  reactions?: string[]
  timestamp: number
  metadata?: {
    model?: string
    tokensPrompt?: number
    tokensCompletion?: number
    costUsd?: number
    mode?: PersonalityMode
    toolCalls?: ActionCall[]
  }
}

export interface MemoryItem {
  id: string
  userId: string
  key: string
  category: 'preference' | 'goal' | 'fact' | 'date' | 'habit' | 'person'
  content: string
  importance: number // 1-5
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface NoteItem {
  id: string
  userId: string
  title: string
  content: string
  completed: boolean
  category?: 'todo' | 'note' | 'reminder'
  dueDate?: number
  createdAt: number
}

export interface MoodJournalEntry {
  id: string
  userId: string
  mood: 'great' | 'good' | 'neutral' | 'down' | 'anxious' | 'exhausted'
  notes?: string
  energyLevel: number // 1-5
  tags?: string[]
  createdAt: number
}

export type AvatarRenderMode = 'solid' | 'holo-lite' | 'holo-full'

export interface UserSettings {
  userId: string
  userName: string
  language: 'en' | 'hi' | 'hinglish' | 'auto'
  mode: PersonalityMode
  sliders: PersonalitySliders
  hologramColor: string
  renderMode: AvatarRenderMode
  avatarModelUrl: string
  handsFree: boolean
  wakeWordEnabled: boolean
  memoryConsent: boolean
  cameraConsent: boolean
  quietHoursStart: string // e.g. "23:00"
  quietHoursEnd: string // e.g. "07:00"
  dailyProactiveCap: number // default 3
  lowPerformanceMode: boolean
  soundVolume: number
  closeUpView?: boolean
  cutenessLevel?: number // 0-100, default 60
  skinId?: string // 'ada-red' | 'cozy-night' | 'original-pastel'
  roamEnabled?: boolean // default true
  liveliness?: number // 0-100, default 70
  voice?: string // 'Aoede' | 'Kore' | 'hexgrad/Kokoro-82M'
  llmProvider?: 'gemini' | 'huggingface' | 'auto'
}

export interface BriefingData {
  greeting: string
  dateStr: string
  weatherSummary: string
  pendingTasksCount: number
  keyGoalReminder?: string
  focusRecommendation: string
  motivationalQuote: string
}
