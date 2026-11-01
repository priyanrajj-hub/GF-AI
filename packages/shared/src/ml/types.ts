export type DetectedEmotion =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'annoyed'
  | 'grateful'
  | 'playful'
  | 'romantic'
  | 'stressed'
  | 'neutral'
  | 'tsundere'
  | 'shy'

export interface EmotionClassificationResult {
  primary: DetectedEmotion
  confidence: number
  scores: Record<DetectedEmotion, number>
  isHinglish: boolean
  valence: number // -1.0 (very negative) to +1.0 (very positive)
  arousal: number // 0.0 (calm) to 1.0 (hyper)
}

export type DetectedIntent =
  | 'praise'
  | 'tease'
  | 'thanks'
  | 'sadness'
  | 'stress'
  | 'achievement'
  | 'joke'
  | 'flirt_light'
  | 'complaint'
  | 'goodbye'
  | 'greeting'
  | 'game_move'
  | 'command'
  | 'chit_chat'

export interface IntentClassificationResult {
  intent: DetectedIntent
  confidence: number
  matchedEntities?: Record<string, string>
}

export interface ProsodyFeatures {
  rmsEnergy: number // 0 to 1
  pitchVariation: number // 0 to 1
  tempoWpm: number // words per minute estimate
  pauseDurationMs: number
}

export interface StickerRecommendation {
  stickerId: string
  packId: string
  title: string
  emoji: string
  matchScore: number
}

export interface ReactionPolicyAction {
  bodyAction: string
  movement: string
  expression: string
  voiceStyle: { rate: number; pitch: number }
  recommendedStickerId?: string
  confidence: number
}
