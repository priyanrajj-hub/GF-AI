import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { ACTION_CATALOG } from './actions.js'

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
  private nextFlairTime = 3.5
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
      cutenessLevel: 60,
      overlayElapsed: 0,
      overlayDuration: 0,
      liveliness: 70,
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
    this.state.overlayDuration = ACTION_CATALOG[actionId].duration || 3.0
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

    // 1. Natural Finger Curl (Task E: soft natural curl, NO claw hands!)
    const curlBones = [
      'leftThumbProximal', 'leftIndexProximal', 'leftMiddleProximal', 'leftRingProximal', 'leftLittleProximal',
      'rightThumbProximal', 'rightIndexProximal', 'rightMiddleProximal', 'rightRingProximal', 'rightLittleProximal',
      'leftIndexIntermediate', 'leftMiddleIntermediate', 'leftRingIntermediate', 'leftLittleIntermediate',
      'rightIndexIntermediate', 'rightMiddleIntermediate', 'rightRingIntermediate', 'rightLittleIntermediate',
    ]
    curlBones.forEach((bName) => {
      const bone = humanoid.getNormalizedBoneNode(bName as any)
      if (bone) {
        const isInter = bName.includes('Intermediate')
        const targetCurl = isInter ? 0.38 : 0.28
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, bName.startsWith('right') ? -targetCurl : targetCurl, delta * 4.0)
      }
    })

    // 2. Head / Look-At Tracking
    if (head && neck) {
      const targetHeadY = THREE.MathUtils.clamp(-pointer.x * 0.45, -0.45, 0.45)
      const targetHeadX = THREE.MathUtils.clamp(-pointer.y * 0.35, -0.3, 0.3)
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadY, delta * 3.5)
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetHeadX, delta * 3.5)
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetHeadY * 0.3, delta * 3.5)
    }

    // 3. Procedural Spine Breathing
    const breath = Math.sin(time * 2.2) * 0.018 * liveRatio
    if (spine) spine.rotation.x = breath * 0.6
    if (chest) chest.rotation.x = breath

    // 4. Locomotion Layer & Action Mode
    const effectiveAction = this.state.isMoving
      ? this.state.cutenessLevel > 50
        ? 'walk_cute'
        : 'walk'
      : this.state.currentActionId

    // 5. Autonomous Girl Idle Flairs: dynamically perform sweet feminine gestures during idle
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
        this.nextFlairTime = time + 6.0 + Math.random() * 5.0
      }
    }

    // 6. Locomotion Kinematics (Legs & Lower Body)
    if (this.state.isMoving) {
      const walkFreq = effectiveAction === 'run' ? 9.5 : 5.8
      const stepPhase = time * walkFreq
      const legAmplitude = effectiveAction === 'run' ? 0.65 : 0.42

      if (leftUpperLeg && rightUpperLeg) {
        leftUpperLeg.rotation.x = Math.sin(stepPhase) * legAmplitude
        rightUpperLeg.rotation.x = -Math.sin(stepPhase) * legAmplitude
        leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, 0, delta * 3.0)
        rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0, delta * 3.0)
      }
      if (leftLowerLeg && rightLowerLeg) {
        leftLowerLeg.rotation.x = Math.max(0, -Math.sin(stepPhase) * 0.6)
        rightLowerLeg.rotation.x = Math.max(0, Math.sin(stepPhase) * 0.6)
      }
      if (hips) {
        hips.position.y = this.initialHipsY + Math.abs(Math.sin(stepPhase * 2)) * 0.035
        hips.position.x = Math.sin(stepPhase) * 0.025
        hips.rotation.y = Math.sin(stepPhase) * 0.10
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, 0, delta * 4.0)
      }
    } else if (effectiveAction.startsWith('dance_')) {
      // DANCE MOTIONS (8 Styles)
      this.applyDanceMotion(effectiveAction, time, delta, humanoid, cuteRatio)
    } else {
      // Natural Feminine Contrapposto: graceful weight shift & S-Curve posture
      const weightPhase = Math.sin(time * 0.42) // Weight cycles smoothly between hips
      const hipShiftX = weightPhase * (0.032 + cuteRatio * 0.02)
      const hipTiltZ = -weightPhase * (0.048 + cuteRatio * 0.025)
      const hipRotY = Math.cos(time * 0.3) * 0.04

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

      // Standing leg bears weight (straight), free leg relaxed with soft feminine knee bend
      if (leftUpperLeg && rightUpperLeg) {
        if (weightPhase > 0) {
          // Weight on right leg: left knee bends slightly inward and relaxed
          leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0.08, delta * 2.5)
          leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, -0.05, delta * 2.5)
          rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0.01, delta * 2.5)
          rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0.03, delta * 2.5)
        } else {
          // Weight on left leg: right knee bends slightly inward and relaxed
          rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0.08, delta * 2.5)
          rightUpperLeg.rotation.z = THREE.MathUtils.lerp(rightUpperLeg.rotation.z, 0.05, delta * 2.5)
          leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0.01, delta * 2.5)
          leftUpperLeg.rotation.z = THREE.MathUtils.lerp(leftUpperLeg.rotation.z, -0.03, delta * 2.5)
        }
      }

      // Spine & chest counter-tilt to maintain natural balance (S-Curve)
      if (spine) {
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, -hipTiltZ * 0.65, delta * 2.5)
      }
      if (chest) {
        chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, -hipTiltZ * 0.35, delta * 2.5)
      }
    }

    // 6. Upper-Body Actions & Gestures (Layered)
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
      const weightPhase = Math.sin(time * 0.42)

      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        const armSwing = this.state.isMoving ? Math.sin(time * 5.8) * 0.35 : 0

        if (this.state.isMoving) {
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.15, delta * 3.5)
          leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -armSwing, delta * 4.5)
          leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, 0, delta * 3.5)

          rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.15, delta * 3.5)
          rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, armSwing, delta * 4.5)
          rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0, delta * 3.5)

          leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.20, delta * 3.5)
          rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.20, delta * 3.5)
        } else {
          // Standing Idle: graceful feminine resting posture with gentle breathing sway
          const rRestZ = weightPhase > 0.1 ? -0.95 : -1.16
          const rRestX = weightPhase > 0.1 ? -0.12 : -0.04
          const rForeZ = weightPhase > 0.1 ? -0.32 : -0.12
          const rForeY = weightPhase > 0.1 ? 0.25 : 0.0

          const lRestZ = weightPhase < -0.1 ? 0.95 : 1.16
          const lRestX = weightPhase < -0.1 ? -0.12 : -0.04
          const lForeZ = weightPhase < -0.1 ? 0.32 : 0.12
          const lForeY = weightPhase < -0.1 ? -0.25 : 0.0

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
    const hips = humanoid.getNormalizedBoneNode('hips')
    const spine = humanoid.getNormalizedBoneNode('spine')
    const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
    const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
    const leftForeArm = humanoid.getNormalizedBoneNode('leftLowerArm')
    const rightForeArm = humanoid.getNormalizedBoneNode('rightLowerArm')

    switch (danceId) {
      case 'dance_cute_idol': {
        const beat = time * 7.5
        if (hips) {
          hips.position.y = this.initialHipsY + Math.abs(Math.sin(beat)) * 0.04
          hips.rotation.y = Math.sin(beat * 0.5) * 0.22
          hips.rotation.z = Math.cos(beat * 0.5) * 0.1
        }
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.6 + Math.sin(beat) * 0.35
          rightArm.rotation.z = -0.6 - Math.cos(beat) * 0.35
          leftArm.rotation.x = -0.4 + Math.cos(beat * 0.5) * 0.3
          rightArm.rotation.x = -0.4 - Math.sin(beat * 0.5) * 0.3
        }
        break
      }
      case 'dance_pop_groove': {
        const beat = time * 8.2
        if (hips) {
          hips.position.y = this.initialHipsY
          hips.rotation.y = Math.sin(beat * 0.5) * 0.28
          hips.position.x = Math.sin(beat * 0.5) * 0.03
        }
        if (spine) spine.rotation.z = Math.sin(beat * 0.5) * 0.08
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.8 + Math.sin(beat) * 0.25
          rightArm.rotation.z = -0.8 - Math.sin(beat) * 0.25
        }
        break
      }
      case 'dance_hiphop': {
        const beat = time * 6.5
        if (hips) {
          hips.position.y = this.initialHipsY - 0.04 + Math.abs(Math.sin(beat)) * 0.05
          hips.rotation.y = Math.sin(beat * 0.5) * 0.3
        }
        if (leftArm && rightArm) {
          leftArm.rotation.x = -0.7 + Math.sin(beat) * 0.35
          rightArm.rotation.x = -0.7 - Math.sin(beat) * 0.35
        }
        break
      }
      case 'dance_ballad_sway': {
        const beat = time * 3.5
        if (hips) {
          hips.position.y = this.initialHipsY
          hips.rotation.y = Math.sin(beat) * 0.2
          hips.rotation.z = Math.cos(beat) * 0.08
        }
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.9 + Math.sin(beat) * 0.3
          rightArm.rotation.z = -0.9 - Math.sin(beat) * 0.3
        }
        break
      }
      case 'dance_spy_jazz': {
        const beat = time * 5.0
        if (hips) {
          hips.position.y = this.initialHipsY
          hips.rotation.y = Math.sin(beat * 0.5) * 0.35
          hips.position.x = Math.cos(beat * 0.5) * 0.04
        }
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = -0.4 + Math.sin(beat) * 0.2
          rightArm.rotation.x = -0.6
          rightForeArm.rotation.y = 1.0
        }
        break
      }
      case 'dance_jump_energetic': {
        const beat = time * 9.0
        if (hips) hips.position.y = this.initialHipsY + Math.abs(Math.sin(beat)) * 0.07
        if (leftArm && rightArm) {
          leftArm.rotation.z = 0.4 + Math.sin(beat) * 0.4
          rightArm.rotation.z = -0.4 - Math.sin(beat) * 0.4
          leftArm.rotation.x = -0.8
          rightArm.rotation.x = -0.8
        }
        break
      }
      default: {
        // dance_lofi_chill / celebration
        const beat = time * 4.2
        if (hips) hips.rotation.y = Math.sin(beat) * 0.18
        if (leftArm && rightArm) {
          leftArm.rotation.z = 1.0 + Math.sin(beat) * 0.15
          rightArm.rotation.z = -1.0 - Math.sin(beat) * 0.15
        }
      }
    }
  }

  private applyUpperBodyAction(actionId: string, time: number, delta: number, humanoid: any, cute: number): void {
    const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
    const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
    const leftForeArm = humanoid.getNormalizedBoneNode('leftLowerArm')
    const rightForeArm = humanoid.getNormalizedBoneNode('rightLowerArm')
    const head = humanoid.getNormalizedBoneNode('head')
    const spine = humanoid.getNormalizedBoneNode('spine')
    const chest = humanoid.getNormalizedBoneNode('chest')

    switch (actionId) {
      case 'wave':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.45, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.65, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, 0.75, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.6 + Math.sin(time * 9.0) * 0.45, delta * 6.0)
        }
        if (leftArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.15, delta * 3.0)
        }
        break

      case 'hair_tuck':
        // Ada gracefully raises right hand to tuck hair behind ear with head tilt
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.52, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.35, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.50, delta * 5.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.14, delta * 4.0)
        }
        break

      case 'curious_lean':
        // Steps forward, hands clasped behind back, torso leans in towards screen!
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.35, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.45, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.35, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.45, delta * 4.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, -0.6, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.6, delta * 4.0)
        }
        if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, -0.22, delta * 4.0)
        if (chest) chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, -0.20, delta * 4.0)
        if (head) head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.28, delta * 4.0)
        break

      case 'hands_on_hips':
      case 'sassy_hip_pop':
        // Sassy posture with hands placed on waist/hips and sassy head tilt
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.72, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.15, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.72, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.15, delta * 4.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.82, delta * 4.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.82, delta * 4.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, -0.35, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.35, delta * 4.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.12, delta * 4.0)
        }
        break

      case 'cute_hop':
      case 'cheer':
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

      case 'playful_twirl':
        // Arms flared gracefully during spin
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.75, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.75, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.35, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.35, delta * 4.0)
        }
        break

      case 'shy_giggle':
        // Hand cupped delicately over mouth
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.38, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.35, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.30, delta * 5.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.08, delta * 4.0)
        }
        break

      case 'cat_paws':
        // Cute double paw bounce near cheeks
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.45, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 5.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.78, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.78, delta * 5.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 1.15, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -1.15, delta * 5.0)
          leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.65 + Math.sin(time * 8.0) * 0.15, delta * 6.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.65 - Math.sin(time * 8.0) * 0.15, delta * 6.0)
        }
        break

      case 'heart_hands':
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.65, delta * 4.5)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.65, delta * 4.5)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.85, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 4.5)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 1.25, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -1.25, delta * 4.5)
        }
        break

      case 'blow_kiss':
        if (rightArm && rightForeArm) {
          const kissPhase = Math.sin(time * 4.0)
          if (kissPhase > 0) {
            // Hand to lips
            rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.32, delta * 5.0)
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.88, delta * 5.0)
            rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.45, delta * 5.0)
          } else {
            // Blow forward
            rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 5.0)
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.55, delta * 5.0)
            rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.40, delta * 5.0)
          }
        }
        break

      case 'peace_sign':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.75, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.25, delta * 5.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.12, delta * 4.0)
        }
        break

      case 'thumbs_up':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.32, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.70, delta * 4.5)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.20, delta * 4.5)
        }
        break

      case 'shrug':
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

      case 'think':
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

      case 'clap':
        if (leftArm && rightArm) {
          const clapCycle = Math.sin(time * 12.0) * 0.22
          leftArm.rotation.x = -0.70
          rightArm.rotation.x = -0.70
          leftArm.rotation.z = 0.50 + clapCycle
          rightArm.rotation.z = -0.50 - clapCycle
        }
        break

      case 'fist_pump':
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.25 + Math.sin(time * 8.0) * 0.25, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.45, delta * 4.0)
        }
        break

      case 'bow':
        if (spine && chest) {
          spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.35, delta * 4.0)
          chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, 0.25, delta * 4.0)
        }
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.25, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.25, delta * 4.0)
        }
        break

      case 'curtsey':
        // Spy-chic elegant curtsey
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.95, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.95, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.15, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0.15, delta * 4.0)
        }
        if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.18, delta * 3.5)
        break

      case 'salute':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.55, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.15, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.65, delta * 5.0)
        }
        break

      case 'pout':
        // Arms crossed, head tilted away with cute pout
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.75, delta * 4.5)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.75, delta * 4.5)
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.65, delta * 4.5)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.65, delta * 4.5)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 0.85, delta * 4.5)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -0.85, delta * 4.5)
        }
        if (head) {
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.35, delta * 4.0)
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.12, delta * 4.0)
        }
        break

      case 'sassy_hair_flip':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.92, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.65, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.45, delta * 5.0)
        }
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.18, delta * 4.0)
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.22, delta * 4.0)
        }
        break

      case 'poke_react':
        if (leftArm && rightArm && head) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.18, delta * 6.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.45, delta * 6.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.45, delta * 6.0)
        }
        break

      default:
        break
    }
  }
}
