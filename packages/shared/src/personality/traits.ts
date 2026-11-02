export interface BigFiveTraits {
  openness: number // 0-100: conventional to highly imaginative
  conscientiousness: number // 0-100: spontaneous to meticulous
  extraversion: number // 0-100: introverted reserved to outgoing life of party
  agreeableness: number // 0-100: blunt challenger to deeply empathetic
  emotionalSensitivity: number // 0-100: stoic & grounded to tenderly expressive
}

export type HumorType = 'dry' | 'silly' | 'sarcastic' | 'wholesome' | 'nerdy'

export interface LanguageMix {
  english: number // percentage 0-100
  hinglish: number // percentage 0-100
  hindi: number // percentage 0-100
  tamil?: number // percentage 0-100
  tanglish?: number // percentage 0-100
}

export interface StyleAxes {
  playfulness: number // 0-100
  cuteness: number // 0-100
  sass: number // 0-100
  formality: number // 0-100
  affection: number // 0-100 (wholesome, PG, friendly warmth)
  talkativeness: number // 0-100 (brief & punchy to detailed storyteller)
  humorType: HumorType
  energy: number // 0-100 (zen calm to hyperactive)
  languageMix: LanguageMix
}

export interface DialogueExample {
  user: string
  ada: string
  emotion?: string
  gesture?: string
}

export interface ArchetypePreset {
  id: string
  name: string
  category: 'companion' | 'mentor' | 'playful' | 'intellectual' | 'creative' | 'support'
  badge: string
  tagline: string
  description: string
  bigFive: BigFiveTraits
  style: StyleAxes
  voiceTone: string
  speechPatterns: string[]
  favoriteTopics: string[]
  doRules: string[]
  dontRules: string[]
  exampleDialogue: DialogueExample[]
  reactionBiases: Record<string, number> // reaction id -> frequency multiplier (0.5 to 2.0)
}

export interface PersonalityBlendComponent {
  archetypeId: string
  weight: number // 0.0 to 1.0, sum of all components should normalize to 1.0
}

export interface CustomPersonality {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
  baseArchetypeId: string
  blends?: PersonalityBlendComponent[]
  bigFive: BigFiveTraits
  style: StyleAxes
  lockedTraits?: string[] // trait names user locked against auto-adaptation
  speechPatterns: string[]
  customPromptNotes?: string
}

export interface TraitDriftLog {
  trait: string
  oldValue: number
  newValue: number
  reason: 'thumbs_up' | 'thumbs_down' | 'engagement' | 'correction' | 'user_reset'
  timestamp: number
}
