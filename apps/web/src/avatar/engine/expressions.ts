import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'

export interface ExpressionValues {
  joy: number
  angry: number
  sorrow: number
  fun: number
  blink: number
  blinkL: number
  blinkR: number
  lookUp: number
  lookDown: number
  aa: number
  oh: number
}

export const EXPRESSION_PRESETS: Record<string, Partial<ExpressionValues>> = {
  neutral: { joy: 0.15, fun: 0.1 },
  happy: { joy: 0.85, fun: 0.6 },
  big_smile: { joy: 1.0, fun: 0.9, lookUp: 0.1 },
  laughing: { joy: 1.0, fun: 1.0, blink: 0.3, aa: 0.4 },
  sad: { sorrow: 0.8, lookDown: 0.25 },
  crying: { sorrow: 1.0, lookDown: 0.4, blink: 0.2 },
  angry: { angry: 0.9, lookDown: 0.2 },
  annoyed: { angry: 0.5, sorrow: 0.3, lookDown: 0.15 },
  surprised: { joy: 0.3, fun: 0.7, aa: 0.3, lookUp: 0.2 },
  shocked: { sorrow: 0.4, angry: 0.3, aa: 0.6, lookUp: 0.3 },
  scared: { sorrow: 0.8, blink: 0.2, lookDown: 0.3 },
  worried: { sorrow: 0.6, lookDown: 0.2 },
  confused: { fun: 0.4, sorrow: 0.3, lookUp: 0.2 },
  thinking: { fun: 0.3, lookUp: 0.4 },
  smug: { joy: 0.7, fun: 0.8, lookDown: 0.1 },
  mischievous: { joy: 0.8, blinkR: 0.95 }, // Wink
  shy: { joy: 0.4, sorrow: 0.3, lookDown: 0.35, blink: 0.2 },
  love: { joy: 0.9, fun: 0.8, blink: 0.15 },
  sparkle_eyes: { joy: 0.95, fun: 0.9, lookUp: 0.1 },
  sleepy: { blink: 0.65, lookDown: 0.3 },
  tired: { sorrow: 0.4, blink: 0.5, lookDown: 0.4 },
  bored: { sorrow: 0.3, blink: 0.4, lookDown: 0.2 },
  proud: { joy: 0.8, lookUp: 0.2 },
  determined: { angry: 0.4, joy: 0.5 },
  smirk: { joy: 0.6, fun: 0.7 },
  deadpan: { sorrow: 0.1 },
  dizzy: { fun: 0.5, sorrow: 0.5, blink: 0.3 },
  relieved: { joy: 0.6, lookDown: 0.2, blink: 0.3 },
  apologetic: { sorrow: 0.6, joy: 0.3, lookDown: 0.3 },
  playful_tongue: { joy: 0.8, fun: 0.9, blinkL: 0.9 },
  kiss_face: { joy: 0.5, oh: 0.8 },
}

export class ExpressionEngine {
  private vrm: VRM
  private currentValues: ExpressionValues
  private targetValues: ExpressionValues
  private nextBlinkTime = 2.0
  private isBlinking = false
  private blinkProgress = 0

  constructor(vrm: VRM) {
    this.vrm = vrm
    this.currentValues = {
      joy: 0.15,
      angry: 0,
      sorrow: 0,
      fun: 0.1,
      blink: 0,
      blinkL: 0,
      blinkR: 0,
      lookUp: 0,
      lookDown: 0,
      aa: 0,
      oh: 0,
    }
    this.targetValues = { ...this.currentValues }
  }

  setExpression(name: string, intensity = 1.0): void {
    const preset = EXPRESSION_PRESETS[name] || EXPRESSION_PRESETS.neutral
    const clampedInt = Math.max(0, Math.min(1.0, intensity))

    this.targetValues = {
      joy: (preset.joy || 0) * clampedInt,
      angry: (preset.angry || 0) * clampedInt,
      sorrow: (preset.sorrow || 0) * clampedInt,
      fun: (preset.fun || 0) * clampedInt,
      blink: (preset.blink || 0) * clampedInt,
      blinkL: (preset.blinkL || 0) * clampedInt,
      blinkR: (preset.blinkR || 0) * clampedInt,
      lookUp: (preset.lookUp || 0) * clampedInt,
      lookDown: (preset.lookDown || 0) * clampedInt,
      aa: (preset.aa || 0) * clampedInt,
      oh: (preset.oh || 0) * clampedInt,
    }
  }

  setLipSync(audioLevel: number, isSpeaking: boolean): void {
    if (!isSpeaking || audioLevel < 0.04) {
      this.targetValues.aa = 0
      this.targetValues.oh = 0
    } else {
      const open = Math.min(1.0, audioLevel * 2.5)
      this.targetValues.aa = open * 0.85
      this.targetValues.oh = (1.0 - open) * 0.3
    }
  }

  update(delta: number, time: number): void {
    const mgr = this.vrm.expressionManager
    if (!mgr) return

    // 1. Natural Blinking logic
    if (time > this.nextBlinkTime) {
      this.isBlinking = true
      this.blinkProgress = 0
      this.nextBlinkTime = time + 2.5 + Math.random() * 3.5
    }

    let naturalBlink = 0
    if (this.isBlinking) {
      this.blinkProgress += delta / 0.16
      if (this.blinkProgress < 0.5) {
        naturalBlink = this.blinkProgress * 2.0
      } else if (this.blinkProgress < 1.0) {
        naturalBlink = (1.0 - this.blinkProgress) * 2.0
      } else {
        this.isBlinking = false
        // Occasional double blink
        if (Math.random() < 0.25) {
          this.nextBlinkTime = time + 0.18
        }
      }
    }

    // 2. Smoothly Lerp values toward target
    const rate = delta * 6.0
    for (const key of Object.keys(this.targetValues) as (keyof ExpressionValues)[]) {
      this.currentValues[key] = THREE.MathUtils.lerp(
        this.currentValues[key],
        this.targetValues[key],
        rate
      )
    }

    // Combine natural blink with target blink
    const effectiveBlink = Math.max(naturalBlink, this.currentValues.blink)

    // 3. Apply to VRM expression presets (VRM 0.x / 1.0 compatible)
    mgr.setValue('happy', this.currentValues.joy)
    mgr.setValue('angry', this.currentValues.angry)
    mgr.setValue('sad', this.currentValues.sorrow)
    mgr.setValue('relaxed', this.currentValues.fun)
    mgr.setValue('blink', effectiveBlink)
    mgr.setValue('blinkLeft', Math.max(effectiveBlink, this.currentValues.blinkL))
    mgr.setValue('blinkRight', Math.max(effectiveBlink, this.currentValues.blinkR))
    mgr.setValue('lookUp', this.currentValues.lookUp)
    mgr.setValue('lookDown', this.currentValues.lookDown)
    mgr.setValue('aa', this.currentValues.aa)
    mgr.setValue('oh', this.currentValues.oh)
  }
}
