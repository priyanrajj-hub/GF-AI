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

  constructor(vrm: VRM, initialAction = 'idle') {
    this.vrm = vrm
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

    // 4. Locomotion Layer (Legs & Lower Body)
    const effectiveAction = this.state.isMoving
      ? this.state.cutenessLevel > 50
        ? 'walk_cute'
        : 'walk'
      : this.state.currentActionId

    if (this.state.isMoving) {
      const walkFreq = effectiveAction === 'run' ? 9.5 : 5.8
      const stepPhase = time * walkFreq
      const legAmplitude = effectiveAction === 'run' ? 0.65 : 0.42

      if (leftUpperLeg && rightUpperLeg) {
        leftUpperLeg.rotation.x = Math.sin(stepPhase) * legAmplitude
        rightUpperLeg.rotation.x = -Math.sin(stepPhase) * legAmplitude
      }
      if (leftLowerLeg && rightLowerLeg) {
        leftLowerLeg.rotation.x = Math.max(0, -Math.sin(stepPhase) * 0.6)
        rightLowerLeg.rotation.x = Math.max(0, Math.sin(stepPhase) * 0.6)
      }
      if (hips) {
        hips.position.y = Math.abs(Math.sin(stepPhase * 2)) * 0.035
        hips.rotation.y = Math.sin(stepPhase) * 0.08
      }
    } else if (effectiveAction.startsWith('dance_')) {
      // DANCE MOTIONS (8 Styles)
      this.applyDanceMotion(effectiveAction, time, delta, humanoid, cuteRatio)
    } else {
      // Natural Idle Stance: gentle weight shifting
      if (hips) {
        hips.position.x = Math.sin(time * 0.7) * (0.01 + cuteRatio * 0.015)
        hips.rotation.y = Math.sin(time * 0.5) * 0.03
        hips.rotation.z = Math.sin(time * 0.7) * 0.02
      }
      if (leftUpperLeg && rightUpperLeg) {
        leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0, delta * 3.0)
        rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0, delta * 3.0)
        leftLowerLeg && (leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 0, delta * 3.0))
        rightLowerLeg && (rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 0, delta * 3.0))
      }
    }

    // 5. Upper-Body Actions & Gestures (Layered)
    const activeUpperAction = this.state.activeOverlayAction || (this.state.isMoving ? undefined : this.state.currentActionId)

    if (activeUpperAction && !effectiveAction.startsWith('dance_')) {
      this.applyUpperBodyAction(activeUpperAction, time, delta, humanoid, cuteRatio)
    } else if (!effectiveAction.startsWith('dance_')) {
      // Natural A-Pose with slight forearm bend & wrist neutral
      if (leftUpperArm && rightUpperArm) {
        const armSwing = this.state.isMoving ? Math.sin(time * 5.8) * 0.35 : 0
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.22, delta * 3.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -armSwing, delta * 4.0)

        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.22, delta * 3.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, armSwing, delta * 4.0)
      }
      if (leftLowerArm && rightLowerArm) {
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.15, delta * 3.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.15, delta * 3.0)
        leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, -0.15, delta * 3.0)
        rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, -0.15, delta * 3.0)
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
          hips.position.y = Math.abs(Math.sin(beat)) * 0.04
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
          hips.position.y = -0.04 + Math.abs(Math.sin(beat)) * 0.05
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
        if (hips) hips.position.y = Math.abs(Math.sin(beat)) * 0.07
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

    // Always keep arms at natural relaxed resting angles by default
    if (leftArm && rightArm) {
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.22, delta * 3.0)
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, delta * 3.0)
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.22, delta * 3.0)
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, delta * 3.0)
    }
    if (leftForeArm && rightForeArm) {
      leftForeArm.rotation.z = THREE.MathUtils.lerp(leftForeArm.rotation.z, 0.15, delta * 3.0)
      rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, -0.15, delta * 3.0)
      leftForeArm.rotation.x = THREE.MathUtils.lerp(leftForeArm.rotation.x, -0.15, delta * 3.0)
      rightForeArm.rotation.x = THREE.MathUtils.lerp(rightForeArm.rotation.x, -0.15, delta * 3.0)
    }

    switch (actionId) {
      case 'wave':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.45, delta * 5.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.65, delta * 5.0)
          rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, 0.75, delta * 5.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 0.6 + Math.sin(time * 9.0) * 0.45, delta * 6.0)
        }
        break
      case 'peace_sign':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.5, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.7, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.2, delta * 5.0)
        }
        break
      case 'heart_hands':
        if (leftArm && rightArm && leftForeArm && rightForeArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.7, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.7, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.85, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.85, delta * 4.0)
          leftForeArm.rotation.y = THREE.MathUtils.lerp(leftForeArm.rotation.y, 1.2, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, -1.2, delta * 4.0)
        }
        break
      case 'clap':
        if (leftArm && rightArm) {
          const clapCycle = Math.sin(time * 12.0) * 0.2
          leftArm.rotation.x = -0.7
          rightArm.rotation.x = -0.7
          leftArm.rotation.z = 0.5 + clapCycle
          rightArm.rotation.z = -0.5 - clapCycle
        }
        break
      case 'fist_pump':
        if (rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.2 + Math.sin(time * 7.0) * 0.25, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.5, delta * 4.0)
        }
        break
      case 'cheer':
        if (leftArm && rightArm) {
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 0.4, delta * 4.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.4, delta * 4.0)
          leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -1.2, delta * 4.0)
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.2, delta * 4.0)
        }
        break
      case 'poke_react':
        if (leftArm && rightArm && head) {
          head.rotation.z = 0.15
          leftArm.rotation.x = -0.4
          rightArm.rotation.x = -0.4
        }
        break
      case 'pout':
        if (leftArm && rightArm) {
          leftArm.rotation.x = -0.8
          rightArm.rotation.x = -0.8
          leftArm.rotation.z = 0.8
          rightArm.rotation.z = -0.8
        }
        break
      case 'sassy_hair_flip':
        if (rightArm && rightForeArm) {
          rightArm.rotation.z = -0.9
          rightArm.rotation.x = -0.6
          rightForeArm.rotation.y = 1.3
        }
        break
      default:
        break
    }
  }
}
