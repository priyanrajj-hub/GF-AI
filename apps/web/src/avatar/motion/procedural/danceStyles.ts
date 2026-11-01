import * as THREE from 'three'
import type { KinematicContext, BoneNodes } from './types.js'

/**
 * 6 Procedural Beat-Quantized Dance Choreographies (Task C & E)
 * Beat-quantized steps: hips sway, knees bend, arm swings, shoulder bounces,
 * head bobs, spins, claps, and hand waves.
 */
export function applyProceduralDance(
  danceId: string,
  bones: BoneNodes,
  ctx: KinematicContext
): boolean {
  const { time, delta, initialHipsY, cuteRatio } = ctx
  const { hips, spine, chest, leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm, head, leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg, leftFoot, rightFoot } = bones

  switch (danceId) {
    // 1. Cute Idol (120 BPM)
    case 'dance_cute_idol': {
      const bpm = ctx.bpm || 120
      const beat = time * (bpm / 60) * Math.PI // 2 beats per second at 120 BPM
      const hop = Math.abs(Math.sin(beat)) * 0.035
      const sway = Math.sin(beat * 0.5)

      if (hips) {
        hips.position.y = initialHipsY + hop
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, sway * (0.04 + cuteRatio * 0.015), delta * 8.0)
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -sway * 0.08, delta * 8.0)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, sway * 0.15, delta * 8.0)
      }

      // Knee bounce on beat
      if (leftUpperLeg && rightUpperLeg && leftLowerLeg && rightLowerLeg) {
        const kneeBend = -hop * 2.5
        leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, kneeBend, delta * 10.0)
        rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, kneeBend, delta * 10.0)
      }

      // Rhythmic idol arms: pumping up and down to the beat with heart-hands flourish
      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        const armPumpL = 0.55 + Math.sin(beat) * 0.28
        const armPumpR = -0.55 - Math.cos(beat) * 0.28

        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, armPumpL, delta * 6.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.40 + Math.cos(beat * 0.5) * 0.20, delta * 6.0)
        leftUpperArm.rotation.y = 0.15

        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, armPumpR, delta * 6.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.40 - Math.sin(beat * 0.5) * 0.20, delta * 6.0)
        rightUpperArm.rotation.y = -0.15

        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.45, delta * 6.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.45, delta * 6.0)
      }

      if (head) {
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, Math.sin(beat * 0.5) * 0.10, delta * 6.0)
      }
      return true
    }

    // 2. Pop Groove (118 BPM)
    case 'dance_pop_groove': {
      const bpm = ctx.bpm || 118
      const beat = time * (bpm / 60) * Math.PI
      const sway = Math.sin(beat * 0.5)

      if (hips) {
        hips.position.y = initialHipsY + Math.sin(beat * 2.0) * 0.008
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, sway * 0.045, delta * 8.0)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, sway * 0.22, delta * 8.0)
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -sway * 0.06, delta * 8.0)
      }

      if (spine && chest) {
        spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, -sway * 0.12, delta * 6.0)
        chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, sway * 0.05, delta * 6.0)
      }

      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        // Pop groove side-to-side arm sway with wrist snap
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.95 + sway * 0.25, delta * 6.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.25, delta * 6.0)
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.95 + sway * 0.25, delta * 6.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.25, delta * 6.0)

        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.65 + Math.sin(beat) * 0.15, delta * 6.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.65 - Math.sin(beat) * 0.15, delta * 6.0)
      }

      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -sway * 0.15, delta * 6.0)
      }
      return true
    }

    // 3. Hip-Hop Bounce (108 BPM)
    case 'dance_hiphop_bounce':
    case 'dance_hiphop': {
      const bpm = ctx.bpm || 108
      const beat = time * (bpm / 60) * Math.PI
      const bounce = Math.abs(Math.sin(beat)) * 0.045
      const side = Math.sin(beat * 0.5)

      if (hips) {
        // Lower center of gravity with heavy rhythmic down-beat
        hips.position.y = initialHipsY - bounce * 0.8
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, side * 0.035, delta * 8.0)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, side * 0.18, delta * 8.0)
        hips.rotation.x = 0.08
      }

      // Strong grounded knee bend
      if (leftUpperLeg && rightUpperLeg && leftLowerLeg && rightLowerLeg) {
        const kneeFlex = -0.15 - bounce * 3.0
        leftUpperLeg.rotation.x = THREE.MathUtils.lerp(leftUpperLeg.rotation.x, 0.18, delta * 8.0)
        rightUpperLeg.rotation.x = THREE.MathUtils.lerp(rightUpperLeg.rotation.x, 0.18, delta * 8.0)
        leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, kneeFlex, delta * 8.0)
        rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, kneeFlex, delta * 8.0)
      }

      // Hip-hop arms: chest hits, folded groove posture
      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.80, delta * 8.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.55 + Math.sin(beat) * 0.15, delta * 8.0)
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.80, delta * 8.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.55 - Math.sin(beat) * 0.15, delta * 8.0)

        leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, 0.65, delta * 8.0)
        rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, -0.65, delta * 8.0)
      }

      if (chest) {
        chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, -Math.sin(beat) * 0.08, delta * 8.0)
      }
      return true
    }

    // 4. Slow Sway (85 BPM)
    case 'dance_slow_sway':
    case 'dance_ballad_sway': {
      const bpm = ctx.bpm || 85
      const beat = time * (bpm / 60) * Math.PI
      const sway = Math.sin(beat * 0.5)

      if (hips) {
        hips.position.y = initialHipsY + Math.sin(beat) * 0.005
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, sway * 0.05, delta * 3.5)
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -sway * 0.08, delta * 3.5)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, sway * 0.12, delta * 3.5)
      }

      // Graceful flowing waltz arms: high delicate sweep
      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        const armL = 0.85 + sway * 0.22
        const armR = -0.85 + sway * 0.22

        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, armL, delta * 3.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.22 - sway * 0.10, delta * 3.0)
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, armR, delta * 3.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.22 + sway * 0.10, delta * 3.0)

        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.35, delta * 3.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.35, delta * 3.0)
      }

      if (spine && chest) {
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, sway * 0.05, delta * 3.0)
        chest.rotation.z = THREE.MathUtils.lerp(chest.rotation.z, sway * 0.03, delta * 3.0)
      }

      if (head) {
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -sway * 0.08, delta * 3.0)
      }
      return true
    }

    // 5. Jazzy Spy Walk-Turn (112 BPM)
    case 'dance_jazzy_spy':
    case 'dance_spy_jazz': {
      const bpm = ctx.bpm || 112
      const beat = time * (bpm / 60) * Math.PI
      // 8-beat turn phrase
      const phrase = (time * 0.4) % (Math.PI * 2)
      const isSpinning = phrase > Math.PI * 1.5

      if (hips) {
        if (isSpinning) {
          // Sultry 360-degree pivot twirl
          hips.rotation.y += delta * 4.5
        } else {
          hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, Math.sin(beat * 0.5) * 0.25, delta * 6.0)
        }
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, Math.sin(beat * 0.5) * 0.03, delta * 6.0)
        hips.position.y = initialHipsY
      }

      // Snappy spy jazz hands: one hand on hip, other snapping/pointing
      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        // Left hand on hip
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.75, delta * 6.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.30, delta * 6.0)
        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 1.25, delta * 6.0)

        // Right arm snappy jazz extension
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.65 - Math.sin(beat) * 0.25, delta * 6.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.60, delta * 6.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.40, delta * 6.0)
      }

      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.cos(beat * 0.5) * 0.15, delta * 6.0)
        head.rotation.x = -0.06 // Sharp confident chin angle
      }
      return true
    }

    // 6. Jump Dance (128 BPM)
    case 'dance_jump_dance':
    case 'dance_jump_energetic': {
      const bpm = ctx.bpm || 128
      const beat = time * (bpm / 60) * Math.PI
      const hop = Math.abs(Math.sin(beat)) * 0.055

      if (hips) {
        hips.position.y = initialHipsY + hop
        hips.position.x = THREE.MathUtils.lerp(hips.position.x, Math.sin(beat * 0.5) * 0.03, delta * 10.0)
        hips.rotation.y = THREE.MathUtils.lerp(hips.rotation.y, Math.sin(beat * 0.5) * 0.20, delta * 10.0)
      }

      // Knee bounce on jump landing
      if (leftUpperLeg && rightUpperLeg && leftLowerLeg && rightLowerLeg) {
        const landingBend = -hop * 2.8
        leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, landingBend, delta * 12.0)
        rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, landingBend, delta * 12.0)
      }

      // Celebratory high arms
      if (leftUpperArm && rightUpperArm && leftLowerArm && rightLowerArm) {
        const armLift = 0.40 + Math.sin(beat) * 0.20
        leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, armLift, delta * 8.0)
        leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.85, delta * 8.0)
        rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -armLift, delta * 8.0)
        rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.85, delta * 8.0)

        leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.40, delta * 8.0)
        rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.40, delta * 8.0)
      }

      if (head) {
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.12, delta * 8.0) // Looking up joyfully
      }
      return true
    }

    default:
      return false
  }
}
