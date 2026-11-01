import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { ACTION_CATALOG } from './actions.js'
import { applyProceduralDance } from '../motion/procedural/danceStyles.js'
import { getBoneNodes } from '../motion/procedural/types.js'

export interface AnimationState {
  currentActionId: string
  actionElapsed: number
  actionDuration: number
  isLooping: boolean
  isMoving: boolean
  moveSpeed: number // 0 to 1
  cutenessLevel: number // 0 to 100
  activeOverlayAction?: string
  overlayElapsed: number
  overlayDuration: number
  liveliness: number // 0 to 100
}

export class ProceduralAnimator {
  private vrm: VRM
  private state: AnimationState
  private nextFlairTime = 4.5
  private initialHipsY = 0.971

  constructor(vrm: VRM, initialAction = 'idle') {
    this.vrm = vrm
    const hipsNode = vrm.humanoid?.getNormalizedBoneNode('hips')
    if (hipsNode && hipsNode.position.y > 0.2) {
      this.initialHipsY = hipsNode.position.y
    }

    this.state = {
      currentActionId: initialAction,
      actionElapsed: 0,
      actionDuration: ACTION_CATALOG[initialAction]?.duration || 0,
      isLooping: ACTION_CATALOG[initialAction]?.loop ?? true,
      isMoving: false,
      moveSpeed: 0,
      cutenessLevel: 65,
      overlayElapsed: 0,
      overlayDuration: 0,
      liveliness: 75,
    }
  }

  setAction(actionId: string, force = false): void {
    if (!ACTION_CATALOG[actionId]) actionId = 'idle'
    if (this.state.currentActionId === actionId && !force) return

    const action = ACTION_CATALOG[actionId]
    this.state.currentActionId = actionId
    this.state.actionElapsed = 0
    this.state.actionDuration = action.duration
    this.state.isLooping = action.loop
  }

  setOverlayAction(actionId?: string): void {
    if (!actionId || !ACTION_CATALOG[actionId]) {
      this.state.activeOverlayAction = undefined
      return
    }
    this.state.activeOverlayAction = actionId
    this.state.overlayElapsed = 0
    this.state.overlayDuration = ACTION_CATALOG[actionId].duration || 2.8
  }

  setMovement(isMoving: boolean, speed = 0.5): void {
    this.state.isMoving = isMoving
    this.state.moveSpeed = speed
  }

  setCuteness(level: number): void {
    this.state.cutenessLevel = Math.max(0, Math.min(100, level))
  }

  setLiveliness(level: number): void {
    this.state.liveliness = Math.max(0, Math.min(100, level))
  }

  update(delta: number, time: number, pointer: THREE.Vector2): void {
    const humanoid = this.vrm.humanoid
    if (!humanoid) return

    this.state.actionElapsed += delta
    if (this.state.activeOverlayAction) {
      this.state.overlayElapsed += delta
      if (
        this.state.overlayDuration > 0 &&
        this.state.overlayElapsed >= this.state.overlayDuration
      ) {
        this.state.activeOverlayAction = undefined
      }
    }

    // Auto-return to idle if non-looping action finished
    if (
      !this.state.isLooping &&
      this.state.actionDuration > 0 &&
      this.state.actionElapsed >= this.state.actionDuration
    ) {
      this.setAction('idle')
    }

    const cuteRatio = this.state.cutenessLevel / 100.0
    const liveRatio = this.state.liveliness / 100.0

    // Fetch normalized humanoid bone nodes
    const hips = humanoid.getNormalizedBoneNode('hips')
    const spine = humanoid.getNormalizedBoneNode('spine')
    const chest = humanoid.getNormalizedBoneNode('chest')
    const neck = humanoid.getNormalizedBoneNode('neck')
    const head = humanoid.getNormalizedBoneNode('head')

    const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')
    const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
    const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm')
    const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')
    const leftHand = humanoid.getNormalizedBoneNode('leftHand')
    const rightHand = humanoid.getNormalizedBoneNode('rightHand')

    const leftUpperLeg = humanoid.getNormalizedBoneNode('leftUpperLeg')
    const rightUpperLeg = humanoid.getNormalizedBoneNode('rightUpperLeg')
    const leftLowerLeg = humanoid.getNormalizedBoneNode('leftLowerLeg')
    const rightLowerLeg = humanoid.getNormalizedBoneNode('rightLowerLeg')
    const leftFoot = humanoid.getNormalizedBoneNode('leftFoot')
    const rightFoot = humanoid.getNormalizedBoneNode('rightFoot')

    // 1. Natural Delicate Finger Kinematics (Soft cascade curl, NO claw hands)
    const fingers = ['Index', 'Middle', 'Ring', 'Little'] as const
    const sides = ['left', 'right'] as const

    sides.forEach((side) => {
      const isRight = side === 'right'
      const sign = isRight ? -1 : 1

      fingers.forEach((f, i) => {
        const prox = humanoid.getNormalizedBoneNode(`${side}${f}Proximal` as any)
        const inter = humanoid.getNormalizedBoneNode(`${side}${f}Intermediate` as any)
        const dist = humanoid.getNormalizedBoneNode(`${side}${f}Distal` as any)

        // Natural delicate relaxed fingers (soft gentle curve, NO claw hands)
        const curlBase = 0.18 + i * 0.03
        if (prox) {
          prox.rotation.z = THREE.MathUtils.lerp(prox.rotation.z, sign * curlBase, delta * 3.5)
          prox.rotation.x = THREE.MathUtils.lerp(prox.rotation.x, -0.02 * (i - 1.5), delta * 3.5)
          prox.rotation.y = THREE.MathUtils.lerp(prox.rotation.y, 0, delta * 3.5)
        }
        if (inter) {
          inter.rotation.z = THREE.MathUtils.lerp(inter.rotation.z, sign * (curlBase * 1.15), delta * 3.5)
          inter.rotation.x = THREE.MathUtils.lerp(inter.rotation.x, 0, delta * 3.5)
          inter.rotation.y = THREE.MathUtils.lerp(inter.rotation.y, 0, delta * 3.5)
        }
        if (dist) {
          dist.rotation.z = THREE.MathUtils.lerp(dist.rotation.z, sign * (curlBase * 0.70), delta * 3.5)
          dist.rotation.x = THREE.MathUtils.lerp(dist.rotation.x, 0, delta * 3.5)
          dist.rotation.y = THREE.MathUtils.lerp(dist.rotation.y, 0, delta * 3.5)
        }
      })

      // Relaxed Thumb Posture (rests naturally alongside index finger)
      const thumbProx = humanoid.getNormalizedBoneNode(`${side}ThumbProximal` as any)
      const thumbInter = humanoid.getNormalizedBoneNode(`${side}ThumbIntermediate` as any)
      const thumbDist = humanoid.getNormalizedBoneNode(`${side}ThumbDistal` as any)
      if (thumbProx) {
        thumbProx.rotation.x = THREE.MathUtils.lerp(thumbProx.rotation.x, 0.15, delta * 4.0)
        thumbProx.rotation.y = THREE.MathUtils.lerp(thumbProx.rotation.y, sign * -0.20, delta * 4.0)
        thumbProx.rotation.z = THREE.MathUtils.lerp(thumbProx.rotation.z, sign * -0.15, delta * 4.0)
      }
      if (thumbInter) {
        thumbInter.rotation.y = THREE.MathUtils.lerp(thumbInter.rotation.y, sign * -0.15, delta * 4.0)
        thumbInter.rotation.z = THREE.MathUtils.lerp(thumbInter.rotation.z, sign * -0.15, delta * 4.0)
      }
      if (thumbDist) {
        thumbDist.rotation.z = THREE.MathUtils.lerp(thumbDist.rotation.z, sign * -0.10, delta * 4.0)
      }
    })

    // 2. Smooth Look-At & Head Tracking
    if (head && neck) {
      const targetHeadY = THREE.MathUtils.clamp(-pointer.x * 0.38, -0.40, 0.40)
      const targetHeadX = THREE.MathUtils.clamp(-pointer.y * 0.28, -0.25, 0.25)
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadY, delta * 3.0)
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadX, delta * 3.0)
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetHeadY * 0.25, delta * 3.0)
    }

    // 3. Natural Breathing Motion
    const breath = Math.sin(time * 2.2) * 0.016 * liveRatio
    if (spine) spine.rotation.x = breath * 0.5
    if (chest) chest.rotation.x = breath

    // 4. Locomotion & Action Routing
    const effectiveAction = this.state.isMoving
      ? this.state.cutenessLevel > 50
        ? 'walk_cute'
        : 'walk'
      : this.state.currentActionId

    // 5. Autonomous Girl Idle Flairs: perform charming feminine gestures periodically during idle
    if (
      !this.state.isMoving &&
      !this.state.activeOverlayAction &&
      !effectiveAction.startsWith('dance_') &&
      this.state.currentActionId === 'idle'
    ) {
      if (time > this.nextFlairTime) {
        const girlFlairs = [
          'hair_tuck',
          'curious_lean',
          'sassy_hip_pop',
          'shy_giggle',
          'hands_on_hips',
          'peace_sign',
          'cute_hop',
          'cat_paws',
          'blow_kiss',
          'shrug',
        ]
        const randomFlair = girlFlairs[Math.floor(Math.random() * girlFlairs.length)]
        this.setOverlayAction(randomFlair)
        this.nextFlairTime = time + 4.5 + Math.random() * 3.5
      }
    }

    // 6. Locomotion & High-Fashion Feminine Catwalk Kinematics
    if (this.state.isMoving) {
      const isRunning = effectiveAction === 'run'
      const walkFreq = isRunning ? 4.2 : 2.8
      const phase = time * walkFreq
      const phaseL = phase
      const phaseR = phase + Math.PI

      // Thigh forward/backward swing: smooth, gentle stride
      const thighAmp = isRunning ? 0.32 : 0.20
      const swingL = Math.sin(phaseL) * thighAmp
      const swingR = Math.sin(phaseR) * thighAmp

      // Runway Narrow Stance: gentle adduction along center line
      const adduct = 0.025 + cuteRatio * 0.010
      if (leftUpperLeg && rightUpperLeg) {
        leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, swingL, delta * 8.0)
        leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, -adduct, delta * 5.0)
        leftUpperLeg.rotation.y = THREE.MathUtils.lerp(leftUpperLeg.rotation.y, swingL * 0.06, delta * 5.0)

        rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, swingR, delta * 8.0)
        rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, adduct, delta * 5.0)
        rightUpperLeg.rotation.y = THREE.MathUtils.lerp(rightUpperLeg.rotation.y, swingR * 0.06, delta * 5.0)
      }

      // Knee Flexion: smooth backward bend during swing phase
      const swingLiftL = Math.max(0, Math.cos(phaseL))
      const swingLiftR = Math.max(0, Math.cos(phaseR))
      const maxKneeBend = isRunning ? -0.55 : -0.38

      if (leftLowerLeg && rightLowerLeg) {
        leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, swingLiftL * maxKneeBend, delta * 10.0)
        leftLowerLeg.rotation.z = THREE.MathUtils.lerp(leftLowerLeg.rotation.z, 0, delta * 5.0)
        leftLowerLeg.rotation.y = THREE.MathUtils.lerp(leftLowerLeg.rotation.y, 0, delta * 5.0)

        rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, swingLiftR * maxKneeBend, delta * 10.0)
        rightLowerLeg.rotation.z = THREE.MathUtils.lerp(rightLowerLeg.rotation.z, 0, delta * 5.0)
        rightLowerLeg.rotation.y = THREE.MathUtils.lerp(rightLowerLeg.rotation.y, 0, delta * 5.0)
      }

      // High Heels Foot Articulation
      if (leftFoot) {
        leftFoot.rotation.x = THREE.MathUtils.lerp(leftFoot.rotation.x, 0.20 + Math.max(0, -swingL) * 0.05, delta * 6.0)
        leftFoot.rotation.z = THREE.MathUtils.lerp(leftFoot.rotation.z, 0.01, delta * 5.0)
      }
      if (rightFoot) {
        rightFoot.rotation.x = THREE.MathUtils.lerp(rightFoot.rotation.x, 0.20 + Math.max(0, -swingR) * 0.05, delta * 6.0)
        rightFoot.rotation.z = THREE.MathUtils.lerp(rightFoot.rotation.z, -0.01, delta * 5.0)
      }

      // Pelvis / Hips: Feminine Runway Sway, subtle bounce
      if (hips) {
        hips.position.y = this.initialHipsY + Math.sin(phase * 2) * 0.006
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, Math.sin(phase) * (0.022 + cuteRatio * 0.008), delta * 8.0)
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, Math.sin(phase) * (0.028 + cuteRatio * 0.010), delta * 8.0)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, Math.sin(phase) * 0.060, delta * 8.0)
        hips.rotation.x = 0.01
      }

      // Torso / Spine Counter-Twist (Counter-yaw and counter-tilt for dynamic balance)
      if (spine) {
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, -Math.sin(phase) * 0.020, delta * 6.0)
        spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, -Math.sin(phase) * 0.040, delta * 6.0)
      }
      if (chest) {
        chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, -Math.sin(phase) * 0.012, delta * 6.0)
        chest.rotation.y = THREE.MathUtils.lerp(chest.rotation.y, -Math.sin(phase) * 0.025, delta * 6.0)
        chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, 0.015, delta * 5.0)
      }
    } else if (effectiveAction.startsWith('dance_')) {
      // 8 Interactive Dance Choreographies
      this.applyDanceMotion(effectiveAction, time, delta, humanoid, cuteRatio)
    } else {
      // Living Feminine Contrapposto: graceful weight shift & S-Curve posture
      const weightPhase = Math.sin(time * 0.45) // Smooth 4.5s weight shift cycle
      const hipShiftX = weightPhase * (0.035 + cuteRatio * 0.02)
      const hipTiltZ = -weightPhase * (0.045 + cuteRatio * 0.022)
      const hipRotY = Math.cos(time * 0.35) * 0.035

      if (hips) {
        // Overlay twirl or hop if active
        if (this.state.activeOverlayAction === 'playful_twirl') {
          const prog = Math.min(1.0, this.state.overlayElapsed / Math.max(0.1, this.state.overlayDuration))
          hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, prog * Math.PI * 2, delta * 7.0)
          hips.position.y = this.initialHipsY + Math.sin(prog * Math.PI) * 0.035
        } else if (this.state.activeOverlayAction === 'cute_hop') {
          hips.position.y = this.initialHipsY + Math.abs(Math.sin(time * 11.0)) * 0.065
          hips.position.x = THREE.MathUtils.lerp(hips.position.x, 0, delta * 3.0)
          hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, 0, delta * 3.0)
        } else {
          hips.position.x = THREE.MathUtils.lerp(hips.position.x, hipShiftX, delta * 2.5)
          hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, hipTiltZ, delta * 2.5)
          hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, hipRotY, delta * 2.5)
          hips.position.y = THREE.MathUtils.lerp(hips.position.y, this.initialHipsY, delta * 3.0)
        }
      }

      // Supporting leg carries weight (straight); relaxed leg bends softly inward at knee
      if (leftUpperLeg && rightUpperLeg && leftLowerLeg && rightLowerLeg) {
        if (weightPhase > 0) {
          // Weight on right leg: left knee flexes softly inward (cute anime girl stance)
          leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0.09, delta * 2.5)
          leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, -0.05, delta * 2.5)
          leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, -0.14, delta * 2.5)

          rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0.01, delta * 2.5)
          rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0.02, delta * 2.5)
          rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 0.0, delta * 2.5)
        } else {
          // Weight on left leg: right knee flexes softly inward
          rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0.09, delta * 2.5)
          rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0.05, delta * 2.5)
          rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, -0.14, delta * 2.5)

          leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0.01, delta * 2.5)
          leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, -0.02, delta * 2.5)
          leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 0.0, delta * 2.5)
        }
      }

      // Spine & chest counter-balance to maintain balance (S-Curve)
      if (spine) {
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, -hipTiltZ * 0.65, delta * 2.5)
      }
      if (chest) {
        chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, -hipTiltZ * 0.35, delta * 2.5)
      }
    }

    // 7. Upper-Body Actions & Gestures (Layered)
    const activeUpperAction =
      this.state.activeOverlayAction ||
      (this.state.isMoving
        ? undefined
        : this.state.currentActionId && this.state.currentActionId !== 'idle'
          ? this.state.currentActionId
          : undefined)

    if (activeUpperAction && !effectiveAction.startsWith('dance_')) {
      this.applyUpperBodyAction(activeUpperAction, time, delta, humanoid, cuteRatio)
    } else if (!effectiveAction.startsWith('dance_')) {
      // Natural Feminine Resting Arms:
      const weightPhase = Math.sin(time * 0.45)

      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        const walkFreq = effectiveAction === 'run' ? 4.2 : 2.8
        const armSwing = this.state.isMoving ? Math.sin(time * walkFreq) * (effectiveAction === 'run' ? 0.18 : 0.10) : 0

        if (this.state.isMoving) {
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.20, delta * 4.5)
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -armSwing - 0.04, delta * 5.0)
          leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, 0, delta * 4.0)

          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.20, delta * 4.5)
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, armSwing - 0.04, delta * 5.0)
          rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0, delta * 4.0)

          leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.24, delta * 4.0)
          rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.24, delta * 4.0)
          leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0.12, delta * 4.0)
          rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, -0.12, delta * 4.0)

          if (leftHand) leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, armSwing * 0.20, delta * 5.0)
          if (rightHand) rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, -armSwing * 0.20, delta * 5.0)
        } else {
          // Standing Idle: graceful feminine resting posture (upper arms down ~70 deg, relaxed elbows & wrists)
          const rRestZ = weightPhase > 0.1 ? -1.22 : -1.26
          const rRestX = weightPhase > 0.1 ? -0.06 : -0.02
          const rForeZ = weightPhase > 0.1 ? -0.34 : -0.22
          const rForeY = weightPhase > 0.1 ? 0.18 : 0.06

          const lRestZ = weightPhase < -0.1 ? 1.22 : 1.26
          const lRestX = weightPhase < -0.1 ? -0.06 : -0.02
          const lForeZ = weightPhase < -0.1 ? 0.34 : 0.22
          const lForeY = weightPhase < -0.1 ? -0.18 : -0.06

          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, rRestZ, delta * 3.0)
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, rRestX, delta * 3.0)
          rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0, delta * 3.0)
          rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, rForeZ, delta * 3.0)
          rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, rForeY, delta * 3.0)

          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, lRestZ, delta * 3.0)
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, lRestX, delta * 3.0)
          leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, 0, delta * 3.0)
          leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, lForeZ, delta * 3.0)
          leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, lForeY, delta * 3.0)
        }
      }
    }
  }

  private applyDanceMotion(danceId: string, time: number, delta: number, humanoid: any, cute: number): void {
    const bones = getBoneNodes(humanoid)
    const ctx = {
      time,
      delta,
      humanoid,
      initialHipsY: this.initialHipsY,
      cuteRatio: cute,
      liveRatio: this.state.liveliness / 100.0,
    }
    const handled = applyProceduralDance(danceId, bones, ctx)
    if (handled) return

    const { hips, leftUpperArm, rightUpperArm } = bones
    const beat = time * 4.0
    if (hips) hips.rotation.y = Math.sin(beat) * 0.18
    if (leftUpperArm && rightUpperArm) {
      leftUpperArm.rotation.z = 0.95 + Math.sin(beat) * 0.15
      rightUpperArm.rotation.z = -0.95 - Math.sin(beat) * 0.15
    }
  }

  private applyUpperBodyAction(actionId: string, time: number, delta: number, humanoid: any, cute: number): void {
    const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
    const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
    const leftForeArm = humanoid.getNormalizedBoneNode('leftLowerArm')
    const rightForeArm = humanoid.getNormalizedBoneNode('rightLowerArm')
    const leftHand = humanoid.getNormalizedBoneNode('leftHand')
    const rightHand = humanoid.getNormalizedBoneNode('rightHand')
    const head = humanoid.getNormalizedBoneNode('head')
    const spine = humanoid.getNormalizedBoneNode('spine')
    const chest = humanoid.getNormalizedBoneNode('chest')

    switch (actionId) {
      case 'wave': {
        const waveSway = Math.sin(time * 5.5) * 0.28
        // Right Arm: cute friendly wave near chest/shoulder level
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.68, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.42, delta * 4.5)
          rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, 0.15, delta * 4.5)

          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -1.25, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.85 + waveSway * 0.5, delta * 5.5)
        }
        if (rightHand) {
          rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, waveSway, delta * 6.0)
          rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, 0.1, delta * 4.0)
        }
        // Left Arm: gracefully resting near hip
        if (leftArm && leftForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.05, delta * 3.5)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.12, delta * 3.5)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.35, delta * 3.5)
        }
        // Head tilts cutely
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.14, delta * 3.5)
        }
        break
      }

      case 'hair_tuck': {
        // Ada gracefully raises right hand to tuck hair behind ear with head tilt
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.48, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.45, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.55, delta * 5.0)
        }
        if (leftArm && leftForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.10, delta * 3.5)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.08, delta * 3.5)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.25, delta * 3.5)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.18, delta * 4.0)
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.06, delta * 4.0)
        }
        break
      }

      case 'curious_lean': {
        // Steps forward, hands clasped behind back, torso leans in towards screen!
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.35, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.38, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.35, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.38, delta * 4.0)

          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, -0.55, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.55, delta * 4.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.45, delta * 4.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.45, delta * 4.0)
        }
        if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.22, delta * 4.0)
        if (chest) chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, 0.18, delta * 4.0)
        if (head) head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.25, delta * 4.0)
        break
      }

      case 'hands_on_hips':
      case 'sassy_hip_pop': {
        // Sassy posture with hands placed on waist/hips and sassy head tilt
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.78, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.12, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.78, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.12, delta * 4.0)

          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.65, delta * 4.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.65, delta * 4.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, -0.35, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.35, delta * 4.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.14, delta * 4.0)
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.10, delta * 4.0)
        }
        break
      }

      case 'cute_hop':
      case 'cheer': {
        // Both arms raised high with celebratory bounce
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.35, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.35, delta * 5.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -1.25, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.25, delta * 5.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.45, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.45, delta * 5.0)
        }
        break
      }

      case 'playful_twirl': {
        // Arms flared gracefully during spin
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.75, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.75, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.35, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.35, delta * 4.0)
        }
        break
      }

      case 'shy_giggle': {
        const giggleBounce = Math.sin(time * 12.0) * 0.012
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.42, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.80, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.35, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.65, delta * 5.0)
        }
        if (leftArm && leftForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.95, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.18, delta * 4.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.45, delta * 4.0)
        }
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.12, delta * 4.0)
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.08 + giggleBounce, delta * 4.0)
        }
        if (chest) {
          chest.position.y = THREE.MathUtils.lerp(chest.position.y, giggleBounce, delta * 6.0)
        }
        break
      }

      case 'cat_paws': {
        const pawCycle = Math.sin(time * 6.5) * 0.22
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.45, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 5.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.72, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.72, delta * 5.0)

          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.85, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.85, delta * 5.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 0.85, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -0.85, delta * 5.0)
        }
        if (leftHand && rightHand) {
          leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, 0.45 + pawCycle, delta * 6.0)
          rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, 0.45 - pawCycle, delta * 6.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, Math.sin(time * 3.5) * 0.12, delta * 4.0)
        }
        break
      }

      case 'heart_hands': {
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.55, delta * 4.5)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.55, delta * 4.5)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.82, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.82, delta * 4.5)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 1.25, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -1.25, delta * 4.5)
        }
        break
      }

      case 'blow_kiss': {
        const kissProg = Math.sin(time * 4.0)
        if (rightArm && rightForeArm) {
          if (kissProg > 0) {
            // Hand at lips
            rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.38, delta * 5.0)
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 5.0)
            rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.45, delta * 5.0)
            rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.45, delta * 5.0)
          } else {
            // Blow forward
            rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 5.0)
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.55, delta * 5.0)
            rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.35, delta * 5.0)
            rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.15, delta * 5.0)
          }
        }
        if (leftArm && leftForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.05, delta * 3.5)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.25, delta * 3.5)
        }
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, kissProg > 0 ? 0.05 : -0.10, delta * 4.0)
        }
        break
      }

      case 'peace_sign': {
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.42, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.72, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.25, delta * 5.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.14, delta * 4.0)
        }
        break
      }

      case 'thumbs_up': {
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.32, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.70, delta * 4.5)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.20, delta * 4.5)
        }
        break
      }

      case 'shrug': {
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.65, delta * 4.5)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.65, delta * 4.5)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.35, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.35, delta * 4.5)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, -0.55, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.55, delta * 4.5)
        }
        if (head) head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.15, delta * 4.0)
        break
      }

      case 'think': {
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.65, delta * 4.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.95, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.35, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.25, delta * 4.0)
        }
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.22, delta * 3.5)
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.10, delta * 3.5)
        }
        break
      }

      case 'clap': {
        if (leftArm && rightArm) {
          const clapCycle = Math.sin(time * 12.0) * 0.22
          leftArm.rotation.x = -0.70
          rightArm.rotation.x = -0.70
          leftArm.rotation.z = 0.50 + clapCycle
          rightArm.rotation.z = -0.50 - clapCycle
        }
        break
      }

      case 'fist_pump': {
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.25 + Math.sin(time * 8.0) * 0.25, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 4.0)
        }
        break
      }

      case 'bow': {
        if (spine && chest) {
          spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.35, delta * 4.0)
          chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, 0.25, delta * 4.0)
        }
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.15, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.15, delta * 4.0)
        }
        break
      }

      case 'curtsey': {
        // Spy-chic elegant curtsey
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.95, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.95, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.15, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.15, delta * 4.0)
        }
        if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.18, delta * 3.5)
        break
      }

      default:
        break
    }
  }
}
