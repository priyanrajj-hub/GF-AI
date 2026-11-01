import { ReactionClassifier, type Reaction, type StructuredReply, type EmotionType, type GestureType } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export class ReactionReconciler {
  private activeMicroReaction: Reaction | null = null
  private microReactionTimestamp: number = 0

  /**
   * 1. Trigger fast local micro-reaction (<50ms) as soon as user submits message
   */
  dispatchMicroReaction(userMessage: string): Reaction {
    const micro = ReactionClassifier.classify({
      message: userMessage,
      cutenessLevel: useAppStore.getState().cutenessLevel,
    })

    this.activeMicroReaction = micro
    this.microReactionTimestamp = Date.now()

    const store = useAppStore.getState()
    store.setEmotionAndGesture(micro.emotion, micro.intensity, micro.bodyAction as GestureType)
    if (micro.bodyAction && micro.bodyAction !== 'idle') {
      store.setActiveAction(micro.bodyAction as any)
    }
    if (micro.fx && micro.fx.length > 0) {
      store.setActiveFX(micro.fx)
    }

    return micro
  }

  /**
   * 2. Reconcile with LLM reply once received
   */
  reconcileWithReply(reply: StructuredReply) {
    const elapsed = Date.now() - this.microReactionTimestamp
    const store = useAppStore.getState()

    // If micro-reaction was crisis or strong emotion, preserve emotional consistency
    const targetEmotion: EmotionType = reply.emotion || this.activeMicroReaction?.emotion || 'happy'
    const targetGesture: GestureType = reply.gesture || (this.activeMicroReaction?.bodyAction as GestureType) || 'idle'

    // Smooth transition
    store.setEmotionAndGesture(targetEmotion, reply.intensity ?? 0.8, targetGesture)
    if (targetGesture !== 'idle') {
      store.setActiveAction(targetGesture as any)
    }

    // Clear transient micro-reaction effects after reasonable duration
    setTimeout(() => {
      if (store.systemState === 'idle') {
        store.setActiveFX([])
      }
    }, 2500)

    this.activeMicroReaction = null
  }
}

export const globalReactionReconciler = new ReactionReconciler()
