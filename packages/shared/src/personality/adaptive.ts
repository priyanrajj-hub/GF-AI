import { CustomPersonality, TraitDriftLog } from './traits.js'
import { getArchetypeById } from './blender.js'

export interface UserInteractionEvent {
  type: 'thumbs_up' | 'thumbs_down' | 'long_reply' | 'short_reply' | 'correction'
  userMessage?: string
  adaReply?: string
  feedbackText?: string
}

export class AdaptivePersonalityLearner {
  private driftLogs: TraitDriftLog[] = []

  getDriftLogs(): TraitDriftLog[] {
    return [...this.driftLogs]
  }

  clearLogs(): void {
    this.driftLogs = []
  }

  /**
   * Gently adjust personality traits based on user interaction signal.
   * Clamped strictly within safe bounds [10, 90].
   * Locked traits are never modified.
   */
  adapt(personality: CustomPersonality, event: UserInteractionEvent): CustomPersonality {
    const updated = {
      ...personality,
      bigFive: { ...personality.bigFive },
      style: { ...personality.style },
      updatedAt: Date.now(),
    }

    const isLocked = (trait: string) => personality.lockedTraits?.includes(trait)

    const applyDelta = (
      target: 'bigFive' | 'style',
      trait: string,
      delta: number,
      reason: TraitDriftLog['reason']
    ) => {
      if (isLocked(trait)) return

      const current = (updated[target] as any)[trait]
      if (typeof current !== 'number') return

      const safeDelta = Math.max(-5, Math.min(5, delta)) // gentle increment
      const clamped = Math.max(10, Math.min(90, current + safeDelta))

      if (clamped !== current) {
        ;(updated[target] as any)[trait] = clamped
        this.driftLogs.push({
          trait,
          oldValue: current,
          newValue: clamped,
          reason,
          timestamp: Date.now(),
        })
      }
    }

    switch (event.type) {
      case 'thumbs_up':
        // Reinforce positive engagement: slight increase in warmth, playful wit
        applyDelta('style', 'affection', +2, 'thumbs_up')
        applyDelta('style', 'playfulness', +2, 'thumbs_up')
        applyDelta('bigFive', 'agreeableness', +1, 'thumbs_up')
        break

      case 'thumbs_down':
        // User disliked something: soften sass, lower formality, increase agreeable listening
        applyDelta('style', 'sass', -3, 'thumbs_down')
        applyDelta('style', 'formality', -2, 'thumbs_down')
        applyDelta('bigFive', 'agreeableness', +3, 'thumbs_down')
        break

      case 'long_reply':
        // High engagement: user is enjoying rich conversation
        applyDelta('style', 'talkativeness', +2, 'engagement')
        applyDelta('bigFive', 'openness', +1, 'engagement')
        break

      case 'short_reply':
        // Brief or busy operator: be more concise, less chatty
        applyDelta('style', 'talkativeness', -3, 'engagement')
        applyDelta('style', 'formality', +1, 'engagement')
        break

      case 'correction':
        // Explicit correction: adjust according to feedback
        applyDelta('style', 'sass', -4, 'correction')
        applyDelta('bigFive', 'conscientiousness', +3, 'correction')
        break
    }

    return updated
  }

  /**
   * Reset personality traits to archetype defaults
   */
  resetToArchetype(personality: CustomPersonality): CustomPersonality {
    const base = getArchetypeById(personality.baseArchetypeId)
    if (!base) return personality

    return {
      ...personality,
      bigFive: { ...base.bigFive },
      style: { ...base.style },
      speechPatterns: [...base.speechPatterns],
      updatedAt: Date.now(),
    }
  }
}

export const globalPersonalityLearner = new AdaptivePersonalityLearner()
