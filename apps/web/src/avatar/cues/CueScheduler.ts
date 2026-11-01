import { useAppStore } from '../../store/useAppStore.js'
import type { EmotionType, GestureType } from '@ada/shared'

export interface CueItem {
  type: 'emo' | 'act' | 'look' | 'fx' | 'pause' | 'voice'
  raw: string
  charOffset: number
  timeMs: number
  params: {
    name?: string
    intensity?: number
    id?: string
    target?: 'camera' | 'away' | 'down'
    ms?: number
    style?: string
  }
}

export interface ParsedCuesResult {
  cleanText: string
  cues: CueItem[]
}

export class CueScheduler {
  private activeTimers: any[] = []
  private lookTarget: 'camera' | 'away' | 'down' = 'camera'

  /**
   * Parse text containing inline cue tags e.g. [emo:happy 0.8] [act:wave] [look:camera]
   */
  parseCues(rawText: string, speechRate = 1.0): ParsedCuesResult {
    if (!rawText) return { cleanText: '', cues: [] }

    const tagRegex = /\[(emo|act|look|fx|pause|voice):([^\]]+)\]/gi
    let cleanText = ''
    const cues: CueItem[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    // Base speaking speed: ~15 chars/second at 1.0 rate -> ~66.7ms per char
    const msPerChar = (1000 / (15 * Math.max(0.5, Math.min(2.0, speechRate))))

    while ((match = tagRegex.exec(rawText)) !== null) {
      const matchIndex = match.index
      // Add text before tag to cleanText
      cleanText += rawText.slice(lastIndex, matchIndex)
      lastIndex = tagRegex.lastIndex

      const type = match[1].toLowerCase() as CueItem['type']
      const value = match[2].trim()
      const charOffset = cleanText.length
      const timeMs = Math.round(charOffset * msPerChar)

      const cue: CueItem = {
        type,
        raw: match[0],
        charOffset,
        timeMs,
        params: {},
      }

      switch (type) {
        case 'emo': {
          const parts = value.split(/\s+/)
          cue.params.name = parts[0]
          cue.params.intensity = parts[1] ? parseFloat(parts[1]) : 0.8
          break
        }
        case 'act': {
          cue.params.id = value
          break
        }
        case 'look': {
          const t = value.toLowerCase()
          cue.params.target = t === 'away' || t === 'down' ? t : 'camera'
          break
        }
        case 'fx': {
          cue.params.name = value
          break
        }
        case 'pause': {
          cue.params.ms = parseInt(value, 10) || 300
          break
        }
        case 'voice': {
          cue.params.style = value
          break
        }
      }

      cues.push(cue)
    }

    // Append remainder
    cleanText += rawText.slice(lastIndex)

    return { cleanText, cues }
  }

  /**
   * Schedules execution of parsed cues timed to TTS speech playback
   */
  schedule(cues: CueItem[], startTime: number = Date.now()): void {
    this.cancelAll()

    const store = useAppStore.getState()

    for (const cue of cues) {
      const delay = Math.max(0, cue.timeMs)
      const timer = setTimeout(() => {
        this.executeCue(cue)
      }, delay)

      this.activeTimers.push(timer)
    }
  }

  /**
   * Parse and schedule cues directly from speech/display text
   */
  scheduleFromText(text: string, speechRate = 1.0): string {
    const { cleanText, cues } = this.parseCues(text, speechRate)
    if (cues.length > 0) {
      this.schedule(cues)
    }
    return cleanText
  }

  private executeCue(cue: CueItem): void {
    const store = useAppStore.getState()

    switch (cue.type) {
      case 'emo': {
        const emoName = (cue.params.name?.toLowerCase() as EmotionType) || 'happy'
        const intensity = typeof cue.params.intensity === 'number' ? cue.params.intensity : 0.8
        store.setEmotionAndGesture(emoName, intensity)
        break
      }
      case 'act': {
        const actId = cue.params.id
        if (actId) {
          store.setActiveAction(actId)
          store.setEmotionAndGesture(store.currentEmotion, store.emotionIntensity, actId as GestureType)
        }
        break
      }
      case 'look': {
        this.lookTarget = cue.params.target || 'camera'
        ;(window as any).__ADA_LOOK_TARGET__ = this.lookTarget
        break
      }
      case 'fx': {
        if (cue.params.name) {
          store.setActiveFX([cue.params.name])
          setTimeout(() => {
            store.setActiveFX([])
          }, 2500)
        }
        break
      }
      case 'pause': {
        // Natural breath pause
        break
      }
      case 'voice': {
        // Handled in voice engine
        break
      }
    }
  }

  getLookTarget(): 'camera' | 'away' | 'down' {
    return this.lookTarget
  }

  cancelAll(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer)
    }
    this.activeTimers = []
  }
}

export const globalCueScheduler = new CueScheduler()
