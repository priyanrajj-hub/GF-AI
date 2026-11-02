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
  neutral: { joy: 0.12, fun: 0.45, lookDown: 0.02 }, // Composed, poised, intelligent gaze
  happy: { joy: 0.28, fun: 0.85, lookUp: 0.04 }, // Radiant mature feminine smile
  playful: { joy: 0.26, fun: 0.82, blinkR: 0.85 }, // Witty, charming wink
  companion: { joy: 0.24, fun: 0.72 }, // Attuned, loving, warm girlfriend connection
  calm: { joy: 0.14, fun: 0.50 }, // Serene, grounded, quiet composure
  motivated: { joy: 0.28, fun: 0.76, angry: 0.06, lookUp: 0.06 }, // Confident, high-energy, ambitious
  concerned: { sorrow: 0.38, joy: 0.05, lookDown: 0.12 }, // Gentle compassionate tenderness
  thinking: { fun: 0.42, lookUp: 0.22, lookDown: 0.04 }, // Analytical, contemplative focus
  love: { joy: 0.32, fun: 0.80, blink: 0.08 }, // Soft romantic girlfriend tenderness
  big_smile: { joy: 0.30, fun: 0.95, lookUp: 0.08 },
  laughing: { joy: 0.38, fun: 1.0, blink: 0.25, aa: 0.35 },
  giggle: { joy: 0.30, fun: 0.90, blink: 0.15, aa: 0.2 },
  pout: { sorrow: 0.45, angry: 0.25, lookDown: 0.15, oh: 0.35 }, // Cute puffy cheeks pout
  curious: { fun: 0.65, lookUp: 0.25 },
  confident: { joy: 0.22, fun: 0.70, lookDown: 0.05 },
  sad: { sorrow: 0.75, lookDown: 0.25 },
  crying: { sorrow: 0.95, lookDown: 0.35, blink: 0.2 },
  angry: { angry: 0.85, lookDown: 0.15 },
  annoyed: { angry: 0.45, sorrow: 0.25, lookDown: 0.12 },
  surprised: { fun: 0.75, aa: 0.4, lookUp: 0.25 },
  shocked: { sorrow: 0.35, angry: 0.25, aa: 0.65, lookUp: 0.3 },
  scared: { sorrow: 0.75, blink: 0.2, lookDown: 0.25 },
  worried: { sorrow: 0.55, lookDown: 0.18 },
  confused: { fun: 0.35, sorrow: 0.25, lookUp: 0.2 },
  smug: { joy: 0.25, fun: 0.85, lookDown: 0.08 },
  mischievous: { joy: 0.25, fun: 0.85, blinkR: 0.90 }, // Wink
  shy: { joy: 0.22, fun: 0.55, lookDown: 0.28, blink: 0.15 },
  sparkle_eyes: { joy: 0.25, fun: 0.95, lookUp: 0.12 },
  sleepy: { blink: 0.55, lookDown: 0.25 },
  tired: { sorrow: 0.35, blink: 0.45, lookDown: 0.3 },
  bored: { sorrow: 0.25, blink: 0.35, lookDown: 0.15 },
  proud: { joy: 0.25, fun: 0.80, lookUp: 0.18 },
  determined: { angry: 0.35, joy: 0.22, fun: 0.45 },
  smirk: { joy: 0.22, fun: 0.75 },
  deadpan: { sorrow: 0.1 },
  dizzy: { fun: 0.45, sorrow: 0.45, blink: 0.25 },
  relieved: { joy: 0.22, fun: 0.65, lookDown: 0.15 },
  apologetic: { sorrow: 0.55, joy: 0.18, lookDown: 0.25 },
  playful_tongue: { joy: 0.25, fun: 0.90, blinkL: 0.85, aa: 0.3 },
  kiss_face: { joy: 0.25, fun: 0.5, oh: 0.85 },
}

export class ExpressionEngine {
  private vrm: VRM
  private currentValues: ExpressionValues
  private targetValues: ExpressionValues
  private nextBlinkTime = 2.0
  private isBlinking = false
  private blinkProgress = 0

  private lastExpressionChangeTime = 0
  private nextEyeDart = 2.0
  private eyeDartOffset = { x: 0, y: 0 }
  public availableExpressions: string[] = []
  public missingExpressions: string[] = []

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

    // Inspect available expressions on VRM
    if (vrm.expressionManager) {
      this.availableExpressions = vrm.expressionManager.expressions.map((e) => e.expressionName)
      const standardPresets = ['happy', 'angry', 'sad', 'relaxed', 'blink', 'blinkLeft', 'blinkRight', 'aa', 'oh', 'lookUp', 'lookDown']
      this.missingExpressions = standardPresets.filter((p) => !this.availableExpressions.includes(p))
      if (typeof window !== 'undefined') {
        ;(window as any).__ADA_VRM_EXPRESSIONS__ = this.availableExpressions
        ;(window as any).__ADA_MISSING_EXPRESSIONS__ = this.missingExpressions
      }
    }
  }

  setExpression(name: string, intensity = 1.0): void {
    const preset = EXPRESSION_PRESETS[name] || EXPRESSION_PRESETS.neutral
    const clampedInt = Math.max(0, Math.min(1.0, intensity))
    this.lastExpressionChangeTime = Date.now()

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

    // 2. Layered Micro-Expressions (Eye Darts & Brow Micro-Motion)
    if (time > this.nextEyeDart) {
      this.nextEyeDart = time + 2.0 + Math.random() * 3.0
      this.eyeDartOffset = {
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.06,
      }
    }

    // 3. Gentle Intensity Decay towards neutral after 4 seconds of stillness
    const timeSinceChange = Date.now() - this.lastExpressionChangeTime
    if (timeSinceChange > 4000) {
      const decayFactor = Math.min(1.0, (timeSinceChange - 4000) / 3000)
      const neutral = EXPRESSION_PRESETS.neutral
      this.targetValues.joy = THREE.MathUtils.lerp(this.targetValues.joy, neutral.joy || 0.1, delta * 0.5)
      this.targetValues.fun = THREE.MathUtils.lerp(this.targetValues.fun, neutral.fun || 0.35, delta * 0.5)
      this.targetValues.angry = THREE.MathUtils.lerp(this.targetValues.angry, 0, delta * 0.8)
      this.targetValues.sorrow = THREE.MathUtils.lerp(this.targetValues.sorrow, 0, delta * 0.8)
    }

    // 4. Smoothly Lerp values toward target with continuous easing
    const rate = delta * 6.5
    for (const key of Object.keys(this.targetValues) as (keyof ExpressionValues)[]) {
      this.currentValues[key] = THREE.MathUtils.lerp(
        this.currentValues[key],
        this.targetValues[key],
        rate
      )
    }

    // Combine natural blink with target blink
    const effectiveBlink = Math.max(naturalBlink, this.currentValues.blink)

    // 5. Apply to VRM expression presets (VRM 0.x / 1.0 compatible)
    mgr.setValue('happy', Math.min(1.0, this.currentValues.joy))
    mgr.setValue('angry', Math.min(1.0, this.currentValues.angry))
    mgr.setValue('sad', Math.min(1.0, this.currentValues.sorrow))
    mgr.setValue('relaxed', Math.min(1.0, this.currentValues.fun))
    mgr.setValue('blink', effectiveBlink)
    mgr.setValue('blinkLeft', Math.max(effectiveBlink, this.currentValues.blinkL))
    mgr.setValue('blinkRight', Math.max(effectiveBlink, this.currentValues.blinkR))
    mgr.setValue('lookUp', Math.max(0, this.currentValues.lookUp + this.eyeDartOffset.y))
    mgr.setValue('lookDown', Math.max(0, this.currentValues.lookDown - this.eyeDartOffset.y))
    mgr.setValue('aa', this.currentValues.aa)
    mgr.setValue('oh', this.currentValues.oh)
  }
}

