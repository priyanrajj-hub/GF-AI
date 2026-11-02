import wardrobeData from './wardrobe.json' with { type: 'json' }
import type { PersonalityMode } from '../types.js'

export interface WardrobeOutfit {
  id: string
  name: string
  category: 'signature' | 'indian' | 'casual' | 'formal' | 'night' | 'sport' | 'seasonal' | 'weather' | 'summer' | 'traditional' | 'glamour' | 'cosplay' | 'tactical'
  description: string
  dressColor: string
  accentColor?: string
  hairColor: string
  tags: string[]
  voiceComment: string
}

export interface WardrobeHistoryEntry {
  skinId: string
  timestamp: number
}

export class WardrobeProvider {
  static getAllOutfits(): WardrobeOutfit[] {
    return wardrobeData as WardrobeOutfit[]
  }

  static getOutfitById(id: string): WardrobeOutfit {
    const list = this.getAllOutfits()
    const found = list.find((o) => o.id === id)
    return found || list[0]
  }

  /**
   * Pools defined per time-of-day phase for varied, non-repeating daily wear
   */
  static readonly POOLS = {
    morning: ['morning_chic', 'kurta-festive', 'gym-athletic', 'beach-sundress'],
    noon: ['office-blazer', 'casual-hoodie', 'black_stealth', 'crimson_jacket'],
    evening: ['saree-crimson', 'lehenga-gold', 'party-gown', 'salwar-emerald', 'ada-red'],
    night: ['cozy-pajamas', 'casual-hoodie', 'morning_chic'],
  } as const

  /**
   * Auto-selects intelligent outfit based on time pools, weather, mode, calendar and 3-day anti-repeat history.
   */
  static selectIntelligentOutfit(options: {
    command?: string
    mode?: PersonalityMode
    hour?: number
    phase?: 'morning' | 'noon' | 'evening' | 'night'
    weather?: string
    isExamWeek?: boolean
    history?: WardrobeHistoryEntry[]
  }): WardrobeOutfit {
    const cmd = (options.command || '').toLowerCase()
    const hour = options.hour ?? new Date().getHours()
    const history = options.history || []
    const now = Date.now()
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

    // 1. Direct Voice / Text Command matching (explicit override)
    if (/turtleneck|harness|ada original/i.test(cmd)) return this.getOutfitById('crimson_turtleneck')
    if (/stealth|black stealth/i.test(cmd)) return this.getOutfitById('black_stealth')
    if (/jacket|crimson jacket|field jacket/i.test(cmd)) return this.getOutfitById('crimson_jacket')
    if (/saree/i.test(cmd)) return this.getOutfitById('saree-crimson')
    if (/lehenga/i.test(cmd)) return this.getOutfitById('lehenga-gold')
    if (/salwar/i.test(cmd)) return this.getOutfitById('salwar-emerald')
    if (/kurta/i.test(cmd)) return this.getOutfitById('kurta-festive')
    if (/pajama|pajamas|sleep|bed/i.test(cmd)) return this.getOutfitById('cozy-pajamas')
    if (/office|blazer|work|formal/i.test(cmd)) return this.getOutfitById('office-blazer')
    if (/hoodie|coder|hacker|jeans/i.test(cmd)) return this.getOutfitById('casual-hoodie')
    if (/gym|workout|sport|fitness/i.test(cmd)) return this.getOutfitById('gym-athletic')
    if (/rain|raincoat/i.test(cmd)) return this.getOutfitById('rain-jacket')
    if (/winter|coat|snow/i.test(cmd)) return this.getOutfitById('winter-coat')
    if (/beach|sundress/i.test(cmd)) return this.getOutfitById('beach-sundress')
    if (/kimono|yukata/i.test(cmd)) return this.getOutfitById('sakura-yukata')
    if (/gala|gown|party/i.test(cmd)) return this.getOutfitById('party-gown')
    if (/cosplay|valkyrie|armor/i.test(cmd)) return this.getOutfitById('fantasy-cosplay')

    // 2. Weather & Seasonal Context Overrides
    const weather = (options.weather || '').toLowerCase()
    if (weather.includes('rain') || weather.includes('monsoon')) {
      return this.getOutfitById('rain-jacket')
    }
    if (weather.includes('winter') || weather.includes('snow') || weather.includes('freezing')) {
      return this.getOutfitById('winter-coat')
    }

    // 3. Calendar Context Override (e.g. Exam week -> study hoodie)
    if (options.isExamWeek) {
      return this.getOutfitById('casual-hoodie')
    }

    // 4. Personality Mode Affinity Override
    if (options.mode === 'coach') return this.getOutfitById('gym-athletic')
    if (options.mode === 'mentor') return this.getOutfitById('office-blazer')

    // 5. Time-of-Day Pool Selection with 3-Day Anti-Repeat Protection
    let phase: 'morning' | 'noon' | 'evening' | 'night' = options.phase || 'morning'
    if (!options.phase) {
      if (hour >= 5 && hour < 12) phase = 'morning'
      else if (hour >= 12 && hour < 17) phase = 'noon'
      else if (hour >= 17 && hour < 21) phase = 'evening'
      else phase = 'night'
    }

    const pool = this.POOLS[phase] || this.POOLS.morning

    // Filter out outfits worn within the last 3 days
    const recentIds = new Set(
      history
        .filter((entry) => now - entry.timestamp < THREE_DAYS_MS)
        .map((entry) => entry.skinId)
    )

    const candidates = pool.filter((id) => !recentIds.has(id))
    const selectedId = candidates.length > 0 ? candidates[0] : pool[0]

    return this.getOutfitById(selectedId)
  }
}
