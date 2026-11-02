import environmentsData from './environments.json' with { type: 'json' }
import type { PersonalityMode } from '../types.js'

export interface EnvironmentPreset {
  id: string
  name: string
  category: string
  ambientColor: string
  keyLight: string
  rimLight: string
  fillLight: string
  ambientAudio: 'none' | 'lofi' | 'rain' | 'fireplace' | 'waves' | 'cafe' | 'birds' | 'city'
  description: string
}

export class EnvironmentProvider {
  static getAll(): EnvironmentPreset[] {
    return environmentsData as EnvironmentPreset[]
  }

  static getById(id: string): EnvironmentPreset {
    const all = this.getAll()
    const found = all.find((e) => e.id === id)
    return found || all[0]
  }

  /**
   * Auto-selects scene based on time of day, active mode, focus timer, or weather
   */
  static selectIntelligentScene(options: {
    mode?: PersonalityMode
    isPomodoro?: boolean
    isSinging?: boolean
    hour?: number
    weather?: string
  }): EnvironmentPreset {
    const hour = options.hour ?? new Date().getHours()

    if (options.isSinging) return this.getById('concert-stage')
    if (options.isPomodoro) return this.getById('study-library')

    if (options.weather === 'rain') return this.getById('rainy-window')
    if (options.weather === 'snow') return this.getById('snow-cabin')

    if (options.mode === 'coach') return this.getById('athletic-gym')

    // Day / Noon / Sunset / Night progression:
    // Morning (05:00 - 11:59): Serene Sakura Garden with morning light
    if (hour >= 5 && hour < 12) return this.getById('sakura-garden')
    // Noon / Afternoon (12:00 - 16:59): Grand Classical Library sunlit focus
    if (hour >= 12 && hour < 17) return this.getById('study-library')
    // Evening / Golden Hour (17:00 - 20:59): Golden Hour Beach Sunset
    if (hour >= 17 && hour < 21) return this.getById('beach-sunset')
    // Night (21:00 - 04:59): Cozy Bedroom with Warm Amber Lamps
    return this.getById('cozy-bedroom')
  }
}
