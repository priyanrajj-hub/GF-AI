import reactionsData from './reactions.json' with { type: 'json' }
import type { EmotionType, GestureType, VoiceStyle } from '../types.js'

export interface Reaction {
  id: string
  category: string
  emotion: EmotionType
  blend?: string
  intensity: number
  bodyAction: GestureType | string
  fx: string[]
  voiceStyle: VoiceStyle | string
  sticker?: string
  delayMs?: number
  duration: number
  cooldownKey?: string
}

export interface UserContextEvents {
  message?: string
  sentiment?: 'positive' | 'negative' | 'neutral' | 'curious' | 'stressed' | 'teasing'
  intent?: 'praise' | 'teasing' | 'thanks' | 'sadness' | 'stress' | 'achievement' | 'joke' | 'flirt' | 'complaint' | 'goodbye' | 'greeting' | 'crisis'
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  isSpeaking?: boolean
  isTyping?: boolean
  pokeClicked?: boolean
  cutenessLevel?: number // 0-100
  liveliness?: number // 0-100
  isCrisis?: boolean
}

export class ReactionClassifier {
  private static lastReactionId: string | null = null
  private static cooldowns: Map<string, number> = new Map()

  /**
   * Fast rule/classifier layer (<50ms)
   */
  static classify(events: UserContextEvents): Reaction {
    const text = (events.message || '').toLowerCase()
    const now = Date.now()

    // 1. Mandatory Crisis Override (Safety Rule #1)
    if (
      events.isCrisis ||
      /suicide|kill myself|end my life|want to die|self-harm|cut myself|hopeless/i.test(text)
    ) {
      return this.getReaction('crisis_serious_listen')
    }

    // 2. Direct Pokes
    if (events.pokeClicked) {
      const pokeChoices = ['poke_surprise', 'poke_giggle']
      const choice = pokeChoices[Math.floor(Math.random() * pokeChoices.length)]
      return this.getReaction(choice)
    }

    // 3. Backchanneling while user types or speaks
    if (events.isTyping || events.isSpeaking) {
      return this.getReaction(Math.random() > 0.5 ? 'backchannel_nod' : 'backchannel_tilt')
    }

    // 4. Intent & Keyword Classification
    let candidateId = 'soft_smile_gaze'

    if (/diwali|deepavali|patakha|lights/i.test(text)) {
      candidateId = 'festival_diwali_greet'
    } else if (/holi|rang|colors/i.test(text)) {
      candidateId = 'festival_holi_cheer'
    } else if (/saree|lehenga|suit|dress|outfit|wardrobe/i.test(text)) {
      candidateId = text.includes('saree') ? 'saree_pallu_pose' : 'wardrobe_spin'
    } else if (/love you|pretty|beautiful|cute|hot|gorgeous|sweetheart|babe|queen/i.test(text)) {
      candidateId = Math.random() > 0.5 ? 'shy_blush' : 'blow_kiss'
    } else if (/haha|lmao|lol|rofl|funny|joke/i.test(text)) {
      candidateId = 'giggle'
    } else if (/proud|incredible|amazing|great job|good job|done|finished|solved|passed|won|promoted|success|yay/i.test(text)) {
      candidateId = Math.random() > 0.5 ? 'proud_cheer' : 'victory_pose'
    } else if (/sad|depressed|crying|lonely|hurt|unhappy/i.test(text)) {
      candidateId = 'soft_hug_lean'
    } else if (/stressed|tired|exhausted|burnout|overwhelmed|headache/i.test(text)) {
      candidateId = 'gentle_concern'
    } else if (/bye|goodnight|gn|sleep|tuck in/i.test(text)) {
      candidateId = /sleep|night/i.test(text) ? 'sweet_goodnight' : 'peace_out'
    } else if (/hi|hello|hey|good morning|sup/i.test(text)) {
      candidateId = 'warm_wave'
    } else if (/nakhra|roast|tease|dramatic|drama/i.test(text)) {
      candidateId = 'desi_nakhra'
    } else if (/dance|party/i.test(text)) {
      candidateId = 'dance_break'
    } else if (/sing|song|music/i.test(text)) {
      candidateId = 'sing_chorus'
    }

    // Anti-repetition: avoid repeating same reaction twice in a row
    if (candidateId === this.lastReactionId) {
      const fallbackList = ['playful_wink', 'soft_smile_gaze', 'curious_tilt', 'comforting_nod']
      candidateId = fallbackList.find((id) => id !== this.lastReactionId) || 'soft_smile_gaze'
    }

    this.lastReactionId = candidateId
    return this.getReaction(candidateId)
  }

  static getReaction(id: string): Reaction {
    const list = reactionsData as Reaction[]
    const found = list.find((r) => r.id === id)
    if (found) return found
    return list[0]
  }

  static getAllReactions(): Reaction[] {
    return reactionsData as Reaction[]
  }
}
