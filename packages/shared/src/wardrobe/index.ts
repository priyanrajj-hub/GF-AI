import wardrobeData from './wardrobe.json' with { type: 'json' }
import type { PersonalityMode } from '../types.js'

export interface WardrobeOutfit {
  id: string
  name: string
  category: 'signature' | 'indian' | 'casual' | 'formal' | 'night' | 'sport' | 'seasonal' | 'weather' | 'summer' | 'traditional' | 'glamour' | 'cosplay'
  description: string
  dressColor: string
  hairColor: string
  tags: string[]
  voiceComment: string
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
   * Auto-selects outfit based on mode, time of day, weather, and voice commands
   */
  static selectIntelligentOutfit(options: {
    command?: string
    mode?: PersonalityMode
    hour?: number
    weather?: string
  }): WardrobeOutfit {
    const cmd = (options.command || '').toLowerCase()
    const hour = options.hour ?? new Date().getHours()

    // 1. Voice command detection
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
    if (/morning|breakfast|sunrise/i.test(cmd)) return this.getOutfitById('morning_chic')
    if (/noon|daywear/i.test(cmd)) return this.getOutfitById('office-blazer')
    if (/evening|sunset/i.test(cmd)) return this.getOutfitById('saree-crimson')
    if (/red dress|classic|spy/i.test(cmd)) return this.getOutfitById('crimson_turtleneck')
    if (/surprise me|random/i.test(cmd)) {
      const all = this.getAllOutfits()
      return all[Math.floor(Math.random() * all.length)]
    }

    // 2. Mode matching (if explicitly specified)
    if (options.mode === 'coder') return this.getOutfitById('casual-hoodie')
    if (options.mode === 'mentor') return this.getOutfitById('office-blazer')
    if (options.mode === 'coach') return this.getOutfitById('gym-athletic')

    // 3. Time-of-Day Wardrobe Progression:
    // Morning (05:00 - 11:59): Morning Cashmere Knit & Satin Skirt
    if (hour >= 5 && hour < 12) return this.getOutfitById('morning_chic')
    // Noon / Afternoon (12:00 - 16:59): Tailored Executive Navy Blazer
    if (hour >= 12 && hour < 17) return this.getOutfitById('office-blazer')
    // Evening / Golden Hour (17:00 - 20:59): Royal Crimson Silk Saree
    if (hour >= 17 && hour < 21) return this.getOutfitById('saree-crimson')
    // Night (21:00 - 04:59): Silk Nightwear Pajamas
    return this.getOutfitById('cozy-pajamas')
  }
}
