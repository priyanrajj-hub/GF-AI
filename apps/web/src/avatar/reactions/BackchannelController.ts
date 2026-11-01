import { useAppStore } from '../../store/useAppStore.js'
import { ReactionClassifier, type Reaction } from '@ada/shared'

export interface BackchannelConfig {
  minIntervalMs?: number // Default: 3000
  maxIntervalMs?: number // Default: 6000
  enabled?: boolean
}

export class BackchannelController {
  private lastBackchannelTime: number = 0
  private nextIntervalMs: number = 3500
  private timer: any = null
  private isUserSpeaking: boolean = false
  private isUserTyping: boolean = false

  constructor() {
    this.scheduleNext()
  }

  setUserSpeaking(speaking: boolean) {
    this.isUserSpeaking = speaking
    if (speaking) this.triggerImmediateIfStale()
  }

  setUserTyping(typing: boolean) {
    this.isUserTyping = typing
    if (typing) this.triggerImmediateIfStale()
  }

  private triggerImmediateIfStale() {
    const now = Date.now()
    if (now - this.lastBackchannelTime > 4000) {
      this.fireBackchannel()
    }
  }

  private scheduleNext() {
    if (this.timer) clearTimeout(this.timer)
    this.nextIntervalMs = 3000 + Math.random() * 3000 // 3-6 seconds

    this.timer = setTimeout(() => {
      if (this.isUserSpeaking || this.isUserTyping) {
        this.fireBackchannel()
      }
      this.scheduleNext()
    }, this.nextIntervalMs)
  }

  private fireBackchannel() {
    const store = useAppStore.getState()
    // Do not interrupt speaking state
    if (store.systemState === 'speaking') return

    this.lastBackchannelTime = Date.now()
    const rx = ReactionClassifier.classify({
      isSpeaking: this.isUserSpeaking,
      isTyping: this.isUserTyping,
    })

    // Apply subtle kinematic action
    store.setActiveAction(rx.bodyAction as any)
    store.setEmotionAndGesture(rx.emotion, 0.6, rx.bodyAction as any)

    setTimeout(() => {
      if (useAppStore.getState().systemState !== 'speaking') {
        useAppStore.getState().setActiveAction('idle')
      }
    }, rx.duration || 1200)
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer)
  }
}

export const globalBackchannel = new BackchannelController()
