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
  | 'tutor'

export type CompanionCharacter = 'ada' | 'mira' | 'atlas'

export interface CharacterProfile {
  id: CompanionCharacter
  name: string
  title: string
  role: string
  tagline: string
  skinId: string
  defaultMode: PersonalityMode
  voiceStyle: string
  avatarDescription: string
  systemPromptAddendum: string
}

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
    imageUrl?: string
    title?: string
    punchline?: string
  }
  gif_query?: string
  reactions?: string[]
  musicTrack?: {
    id?: string
    title: string
    artist?: string
    audioUrl?: string
    artworkUrl?: string
    danceAction?: string
    bpm?: number
    duration?: number
  }
  studyFocus?: {
    goal: string
    durationMinutes: number
    remainingSeconds: number
    isActive: boolean
    mode: 'pomodoro' | 'deep_study' | 'short_break'
  }
  todoCard?: {
    action: 'list' | 'added' | 'completed' | 'deleted'
    item?: { id: string; title: string; completed: boolean; dueDate?: number }
    items?: Array<{ id: string; title: string; completed: boolean; dueDate?: number }>
    pendingCount: number
  }
  tradingCard?: TradingCardData
  speaker?: 'ada' | 'mira' | 'atlas'
}

export interface TradingCardData {
  symbol: string
  name: string
  currency: string
  price: number
  change: number
  percentChange: number
  dayHigh: number
  dayLow: number
  previousClose: number
  volume: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  assetClass: 'equity' | 'index' | 'crypto' | 'commodity' | 'forex'
  sparkline?: number[]
  indicators: {
    rsi14: number
    rsiStatus: string
    macd: { line: number; signal: number; histogram: number; cross: string }
    ema9: number
    ema20: number
    ema50: number
    ema200: number
    supertrend: { value: number; signal: 'BUY' | 'SELL' }
    bollinger: { upper: number; middle: number; lower: number; squeeze: boolean }
    atr14: number
    stochastic?: { k: number; d: number; signal: string }
    smc: { orderBlockZone: string; fibGoldenPocket: string; marketStructure: string }
    confluenceScore: number
  }
  setup: {
    action: string
    entryZone: string
    target1: number
    target2: number
    target3: number
    stopLoss: number
    riskReward: string
    confidence: number
    timeframe: string
    rationale: string
  }
  pivots: {
    pivot: number
    s1: number
    s2: number
    s3?: number
    r1: number
    r2: number
    r3?: number
  }
  geopoliticalRadar?: {
    stressScore: number
    regime: string
    defenseStatus: string
    goldPrice: number
    goldChange: number
    crudeOilPrice: number
    crudeOilChange: number
    dxyPrice: number
    dxyChange: number
    vix: number
    strategicAdvice: string
  }
  sentiment?: {
    fearGreedIndex: number
    fearGreedClassification: string
    marketTone: string
    huggingFaceSentiment?: { label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'; score: number; model: string }
  }
  analystRatings?: {
    consensusRating: string
    numberOfAnalysts: number
    targetMean: number
    targetHigh: number
    targetLow: number
    upsidePotentialPct: number
  }
  recommendations?: TradingCardData[]
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
    imageUrl?: string
    title?: string
    punchline?: string
  }
  gif_query?: string
  reactions?: string[]
  timestamp: number
  musicTrack?: {
    id?: string
    title: string
    artist?: string
    audioUrl?: string
    artworkUrl?: string
    danceAction?: string
    bpm?: number
    duration?: number
  }
  studyFocus?: {
    goal: string
    durationMinutes: number
    remainingSeconds: number
    isActive: boolean
    mode: 'pomodoro' | 'deep_study' | 'short_break'
  }
  todoCard?: {
    action: 'list' | 'added' | 'completed' | 'deleted'
    item?: { id: string; title: string; completed: boolean; dueDate?: number }
    items?: Array<{ id: string; title: string; completed: boolean; dueDate?: number }>
    pendingCount: number
  }
  tradingCard?: TradingCardData
  speaker?: 'ada' | 'mira' | 'atlas'
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
  source?: string // e.g. 'conversation', 'portfolio', or target URL
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
export type TimeOfDayPhase = 'morning' | 'noon' | 'evening' | 'night'

export interface UserSettings {
  userId: string
  userName: string
  language: 'en' | 'hi' | 'hinglish' | 'ta' | 'tanglish' | 'auto'
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
  voice?: string // 'NOpBlnGInO9m6vDvFkFC' | 'Aoede' | 'Kore' | 'hexgrad/Kokoro-82M'
  llmProvider?: 'gemini' | 'huggingface' | 'auto'
  elevenlabsApiKey?: string
  elevenlabsVoiceId?: string
  elevenlabsModelId?: string
  huggingfaceApiKey?: string
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
