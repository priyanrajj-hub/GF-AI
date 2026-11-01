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

    // Day/Night progression
    if (hour >= 23 || hour < 6) return this.getById('cozy-bedroom')
    if (hour >= 6 && hour < 10) return this.getById('beach-sunset')
    if (hour >= 10 && hour < 17) return this.getById('cafe-lofi')
    if (hour >= 17 && hour < 21) return this.getById('rooftop-night')
    if (hour >= 21 && hour < 23) return this.getById('sakura-garden')

    return this.getById('holo-lab')
  }
}
