import { useAppStore } from '../../store/useAppStore.js'
import { ACTION_CATALOG } from '../engine/actions.js'
import type { EmotionType, GestureType } from '@ada/shared'

export const SIX_DANCE_STYLES = [
  'dance_cute_idol',
  'dance_pop_groove',
  'dance_hiphop_bounce',
  'dance_slow_sway',
  'dance_jazzy_spy',
  'dance_jump_dance',
] as const

export type DanceStyleId = typeof SIX_DANCE_STYLES[number]

export interface PerformActionOptions {
  duration?: number
  intensity?: number
  bpm?: number
  fx?: string[]
  emotion?: EmotionType
  onComplete?: () => void
}

let activeActionTimeout: any = null

/**
 * Universal Action Dispatcher (Task C & E)
 * Guarantees that every button (Dance Move, Wear Saree, Stage Studio, Wardrobe)
 * and every LLM cue routes through a unified, safe motion execution pipeline.
 */
export function performAction(
  actionId: string,
  options?: PerformActionOptions
): boolean {
  const store = useAppStore.getState()
  if (!actionId) return false

  let targetId = actionId.toLowerCase().trim()

  // 1. Resolve Aliases & Meta-actions
  if (targetId === 'dance' || targetId === 'dance_move' || targetId === 'dance_random') {
    const randomIndex = Math.floor(Math.random() * SIX_DANCE_STYLES.length)
    targetId = SIX_DANCE_STYLES[randomIndex]
  } else if (targetId === 'dance_hiphop') {
    targetId = 'dance_hiphop_bounce'
  } else if (targetId === 'dance_ballad_sway') {
    targetId = 'dance_slow_sway'
  } else if (targetId === 'dance_spy_jazz') {
    targetId = 'dance_jazzy_spy'
  } else if (targetId === 'dance_jump_energetic') {
    targetId = 'dance_jump_dance'
  }

  // Quick Action Buttons
  if (targetId === 'wear_saree') {
    store.setSkinId('saree-crimson')
    store.setActiveFX(['sparkles', 'confetti'])
    targetId = 'sassy_hip_pop'
  } else if (targetId === 'wardrobe') {
    store.setShowWardrobeDrawer(true)
    return true
  } else if (targetId === 'stage_studio') {
    store.setShowStageDrawer(true)
    return true
  }

  // 2. Validate motion existence in ACTION_CATALOG
  const actionDef = ACTION_CATALOG[targetId] || ACTION_CATALOG[actionId]
  if (!actionDef && !targetId.startsWith('dance_')) {
    console.warn(`[performAction] Warning: No motion definition found for action '${actionId}'. Falling back to idle.`)
    store.setActiveAction('idle')
    return false
  }

  // 3. Determine Duration
  // For dances, default to at least 20 seconds (22s) unless specified
  const isDance = targetId.startsWith('dance_')
  const defaultDuration = isDance ? 22 : (actionDef?.duration || 3.5)
  const duration = options?.duration ?? defaultDuration

  // 4. Clear any pending auto-idle resets
  if (activeActionTimeout) {
    clearTimeout(activeActionTimeout)
    activeActionTimeout = null
  }

  // 5. Update Global State
  store.setActiveAction(targetId)

  const emo = options?.emotion || (isDance ? 'happy' : store.currentEmotion)
  store.setEmotionAndGesture(emo, options?.intensity ?? (isDance ? 0.95 : 0.8), targetId as GestureType)

  // Trigger FX
  const fxList = options?.fx || (isDance ? ['sparkles', 'confetti'] : actionDef?.fx)
  if (fxList && fxList.length > 0) {
    store.setActiveFX(fxList)
  }

  // Dispatch custom DOM event for decoupled listeners, debug overlay, and test harnesses
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ada:action', {
        detail: {
          actionId: targetId,
          duration,
          isDance,
          timestamp: Date.now(),
        },
      })
    )
  }

  // 6. Schedule auto-idle reset if duration is bounded
  if (duration > 0) {
    activeActionTimeout = setTimeout(() => {
      const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
      if (!isSinging && useAppStore.getState().activeAction === targetId) {
        useAppStore.getState().setActiveAction('idle')
        useAppStore.getState().setActiveFX([])
      }
      if (options?.onComplete) {
        options.onComplete()
      }
    }, duration * 1000)
  }

  return true
}

export const SIX_DANCE_METADATA = [
  { id: 'dance_cute_idol', name: 'Cute Idol', bpm: 120, description: 'Lively idol hip bounce, peppy arm pumps & heart hand poses.' },
  { id: 'dance_pop_groove', name: 'Pop Groove', bpm: 118, description: 'Rhythmic hip sway, shoulder roll, arm wave and bounce.' },
  { id: 'dance_hiphop_bounce', name: 'Hip-Hop Bounce', bpm: 108, description: 'Grounded knee bounce, chest hits, energetic urban groove.' },
  { id: 'dance_slow_sway', name: 'Slow Sway', bpm: 85, description: 'Graceful slow waltz sway with flowing floating arms.' },
  { id: 'dance_jazzy_spy', name: 'Jazzy Spy Walk-Turn', bpm: 112, description: 'Sultry spy pivot steps, finger snaps and 360-degree twirl.' },
  { id: 'dance_jump_dance', name: 'Jump Dance', bpm: 128, description: 'High-energy hops, raised arms and celebratory victory spins.' },
]
