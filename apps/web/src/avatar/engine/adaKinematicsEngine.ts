import * as THREE from 'three'

interface BoneMap {
  pelvis?: THREE.Bone
  spine?: THREE.Bone
  spine1?: THREE.Bone
  chest?: THREE.Bone
  neck?: THREE.Bone
  head?: THREE.Bone
  lClavicle?: THREE.Bone
  rClavicle?: THREE.Bone
  lUpperArm?: THREE.Bone
  rUpperArm?: THREE.Bone
  lForearm?: THREE.Bone
  rForearm?: THREE.Bone
  lHand?: THREE.Bone
  rHand?: THREE.Bone
  lThigh?: THREE.Bone
  rThigh?: THREE.Bone
  lCalf?: THREE.Bone
  rCalf?: THREE.Bone
  lFoot?: THREE.Bone
  rFoot?: THREE.Bone
}

interface HairChainBone {
  bone: THREE.Bone
  restRot: THREE.Euler
  angle: number
  velocity: number
}

export class AdaKinematicsEngine {
  private bones: BoneMap = {}
  private hairBones: HairChainBone[] = []
  private restRotations = new Map<string, THREE.Euler>()
  private restPositions = new Map<string, THREE.Vector3>()

  // Head tracking smoothing
  private currentHeadYaw = 0
  private currentHeadPitch = 0
  private currentHeadRoll = 0
  private prevHeadYaw = 0
  private microGlanceTimer = 0
  private glanceOffset = { yaw: 0, pitch: 0, roll: 0 }

  // Action / gesture overlay state
  private activeAction: string = 'idle'
  private actionElapsed = 0
  private isPokeReaction = false
  private pokeElapsed = 0

  constructor(scene: THREE.Object3D) {
    this.discoverBones(scene)
  }

  private discoverBones(scene: THREE.Object3D) {
    scene.traverse((obj) => {
      if (!(obj as THREE.Bone).isBone) return
      const bone = obj as THREE.Bone
      const n = bone.name || ''

      // Save rest transforms
      this.restRotations.set(n, bone.rotation.clone())
      this.restPositions.set(n, bone.position.clone())

      // Biped matching
      if (n.includes('Pelvis')) this.bones.pelvis = bone
      else if (n.includes('Spine_') || n.includes('Spine0') || n.includes('Spine_03')) this.bones.spine = bone
      else if (n.includes('Spine1')) this.bones.spine1 = bone
      else if (n.includes('Spine2') || n.includes('Chest')) this.bones.chest = bone
      else if (n.includes('Neck') && !n.includes('Knit') && !n.includes('Neck1')) this.bones.neck = bone
      else if (n.includes('Head')) this.bones.head = bone
      else if (n.includes('L_Clavicle')) this.bones.lClavicle = bone
      else if (n.includes('R_Clavicle')) this.bones.rClavicle = bone
      else if (n.includes('L_UpperArm')) this.bones.lUpperArm = bone
      else if (n.includes('R_UpperArm')) this.bones.rUpperArm = bone
      else if (n.includes('L_Forearm')) this.bones.lForearm = bone
      else if (n.includes('R_Forearm')) this.bones.rForearm = bone
      else if (n.includes('L_Hand')) this.bones.lHand = bone
      else if (n.includes('R_Hand')) this.bones.rHand = bone
      else if (n.includes('L_Thigh')) this.bones.lThigh = bone
      else if (n.includes('R_Thigh')) this.bones.rThigh = bone
      else if (n.includes('L_Calf')) this.bones.lCalf = bone
      else if (n.includes('R_Calf')) this.bones.rCalf = bone
      else if (n.includes('L_Foot')) this.bones.lFoot = bone
      else if (n.includes('R_Foot')) this.bones.rFoot = bone

      // Hair chain matching
      if (n.startsWith('hair') && n.includes('chain')) {
        this.hairBones.push({
          bone,
          restRot: bone.rotation.clone(),
          angle: 0,
          velocity: 0,
        })
      }
    })
  }

  public triggerPoke() {
    this.isPokeReaction = true
    this.pokeElapsed = 0
  }

  public setAction(action: string) {
    if (this.activeAction !== action) {
      this.activeAction = action
      this.actionElapsed = 0
    }
  }

  public update(
    delta: number,
    time: number,
    pointer: THREE.Vector2,
    systemState: string = 'idle',
    isMoving: boolean = false
  ) {
    const dt = Math.min(delta, 0.1) // clamp delta to prevent physics explosion
    this.actionElapsed += dt

    // ─────────────────────────────────────────────────────────────
    // 1. ORGANIC BREATHING WAVE & IDLE WEIGHT DRIFT
    // ─────────────────────────────────────────────────────────────
    const breathRate = systemState === 'speaking' ? 2.2 : 1.65
    const breath = Math.sin(time * breathRate)
    const deepBreath = Math.sin(time * (breathRate * 0.5)) * 0.5 + 0.5 // secondary respiratory wave
    const weightShift = Math.sin(time * 0.35) // slow contrapposto weight drift

    // ─────────────────────────────────────────────────────────────
    // 2. INTERACTIVE HEAD & GAZE TRACKING (Attentive + Life-like)
    // ─────────────────────────────────────────────────────────────
    // Micro-glance logic: occasionally Ada casts a subtle sideways spy glance or head cock
    this.microGlanceTimer -= dt
    if (this.microGlanceTimer <= 0) {
      this.microGlanceTimer = 2.5 + Math.random() * 3.5
      if (Math.random() < 0.65) {
        this.glanceOffset.yaw = (Math.random() - 0.5) * 0.14
        this.glanceOffset.pitch = (Math.random() - 0.4) * 0.08
        this.glanceOffset.roll = (Math.random() - 0.5) * 0.06
      } else {
        this.glanceOffset.yaw = 0
        this.glanceOffset.pitch = 0
        this.glanceOffset.roll = 0
      }
    }

    // Pointer target angles
    const targetYaw = THREE.MathUtils.clamp(pointer.x * 0.38 + this.glanceOffset.yaw, -0.65, 0.65)
    const targetPitch = THREE.MathUtils.clamp(-pointer.y * 0.22 + this.glanceOffset.pitch, -0.32, 0.28)
    const targetRoll = THREE.MathUtils.clamp(pointer.x * 0.08 + this.glanceOffset.roll, -0.15, 0.15)

    // Speech cadence nodding
    let speechNod = 0
    let speechTilt = 0
    if (systemState === 'speaking') {
      speechNod = Math.sin(time * 5.4) * 0.032 + Math.sin(time * 8.6) * 0.015
      speechTilt = Math.cos(time * 3.1) * 0.02
    }

    // Poke reaction
    let pokeHeadPitch = 0
    let pokeSpinePitch = 0
    let pokeArmShift = 0
    if (this.isPokeReaction) {
      this.pokeElapsed += dt
      if (this.pokeElapsed < 0.25) {
        // Recoil back in surprise
        const prog = this.pokeElapsed / 0.25
        pokeHeadPitch = Math.sin(prog * Math.PI) * -0.18
        pokeSpinePitch = Math.sin(prog * Math.PI) * -0.09
        pokeArmShift = Math.sin(prog * Math.PI) * 0.25
      } else if (this.pokeElapsed < 2.0) {
        // Sassy recovery with hand-on-hip demeanor
        const fade = (2.0 - this.pokeElapsed) / 1.75
        pokeHeadPitch = Math.sin(this.pokeElapsed * 4.0) * 0.04 * fade
        pokeArmShift = 0.18 * fade
      } else {
        this.isPokeReaction = false
      }
    }

    // Smooth head interpolation
    const lerpSpeed = dt * 5.5
    this.currentHeadYaw = THREE.MathUtils.lerp(this.currentHeadYaw, targetYaw, lerpSpeed)
    this.currentHeadPitch = THREE.MathUtils.lerp(this.currentHeadPitch, targetPitch + speechNod + pokeHeadPitch, lerpSpeed)
    this.currentHeadRoll = THREE.MathUtils.lerp(this.currentHeadRoll, targetRoll + speechTilt, lerpSpeed)

    const headAngularVelocity = (this.currentHeadYaw - this.prevHeadYaw) / dt
    this.prevHeadYaw = this.currentHeadYaw

    // ─────────────────────────────────────────────────────────────
    // 3. APPLY SKELETAL ROTATIONS (Layered onto Rest Pose)
    // ─────────────────────────────────────────────────────────────

    // A. Pelvis & Hips: Confident Spy Contrapposto
    if (this.bones.pelvis) {
      const rest = this.restRotations.get(this.bones.pelvis.name) || new THREE.Euler()
      this.bones.pelvis.rotation.set(
        rest.x + breath * 0.008 + pokeSpinePitch * 0.5,
        rest.y + weightShift * 0.028,
        rest.z + weightShift * 0.022 // subtle natural hip tilt
      )
    }

    // B. Spine & Lower Torso
    if (this.bones.spine) {
      const rest = this.restRotations.get(this.bones.spine.name) || new THREE.Euler()
      this.bones.spine.rotation.set(
        rest.x + breath * 0.015 + pokeSpinePitch,
        rest.y + weightShift * 0.015,
        rest.z - weightShift * 0.012
      )
    }

    // C. Chest (Spine2_05): Full Respiratory Inhale/Exhale & Posture Presence
    if (this.bones.chest) {
      const rest = this.restRotations.get(this.bones.chest.name) || new THREE.Euler()
      this.bones.chest.rotation.set(
        rest.x + breath * 0.028 + deepBreath * 0.012 + (systemState === 'speaking' ? 0.02 : 0),
        rest.y + this.currentHeadYaw * 0.15, // chest leads head turn slightly
        rest.z - weightShift * 0.015
      )
    }

    // D. Clavicles (Shoulders): Relaxed Downwards Natural Slope
    if (this.bones.lClavicle) {
      const rest = this.restRotations.get(this.bones.lClavicle.name) || new THREE.Euler()
      this.bones.lClavicle.rotation.set(
        rest.x,
        rest.y,
        rest.z - 0.045 + breath * 0.012 // breath shoulder lift
      )
    }
    if (this.bones.rClavicle) {
      const rest = this.restRotations.get(this.bones.rClavicle.name) || new THREE.Euler()
      this.bones.rClavicle.rotation.set(
        rest.x,
        rest.y,
        rest.z + 0.045 - breath * 0.012
      )
    }

    // E. Neck: 35% of Gaze Curvature
    if (this.bones.neck) {
      const rest = this.restRotations.get(this.bones.neck.name) || new THREE.Euler()
      this.bones.neck.rotation.set(
        rest.x + this.currentHeadPitch * 0.35,
        rest.y + this.currentHeadYaw * 0.35,
        rest.z + this.currentHeadRoll * 0.35
      )
    }

    // F. Head: 65% of Gaze Curvature + Expressive Micro-Motion
    if (this.bones.head) {
      const rest = this.restRotations.get(this.bones.head.name) || new THREE.Euler()
      this.bones.head.rotation.set(
        rest.x + this.currentHeadPitch * 0.65,
        rest.y + this.currentHeadYaw * 0.65,
        rest.z + this.currentHeadRoll * 0.65
      )
    }

    // G. ARMS & HANDS: Natural Rest Down at Sides (Zero A-Pose!)
    // In Valve Biped rest pose, Z is abduction (+/- 0.561 rad).
    // Left arm down: decrease Z by ~0.65 to 0.72 rad.
    // Right arm down: increase Z by ~0.65 to 0.72 rad.
    const isSassy = this.activeAction === 'hip_pop' || this.activeAction === 'sassy' || this.isPokeReaction

    // Left Arm
    if (this.bones.lUpperArm) {
      const rest = this.restRotations.get(this.bones.lUpperArm.name) || new THREE.Euler()
      if (isSassy) {
        // Hand-on-hip: Left upper arm angled out, elbow flexed
        this.bones.lUpperArm.rotation.set(
          rest.x + 0.15,
          rest.y - 0.22,
          rest.z - 0.38 + breath * 0.008
        )
      } else {
        // Relaxed natural resting arm along torso
        this.bones.lUpperArm.rotation.set(
          rest.x + 0.08 + Math.sin(time * 1.6) * 0.015,
          rest.y - 0.05,
          rest.z - 0.68 + breath * 0.012
        )
      }
    }

    if (this.bones.lForearm) {
      const rest = this.restRotations.get(this.bones.lForearm.name) || new THREE.Euler()
      if (isSassy) {
        this.bones.lForearm.rotation.set(rest.x, rest.y - 0.45, rest.z + 0.25)
      } else {
        // Slight natural 18° forearm bend so arm hangs gracefully without stiff hyperextension
        this.bones.lForearm.rotation.set(
          rest.x,
          rest.y + 0.12,
          rest.z
        )
      }
    }

    if (this.bones.lHand) {
      const rest = this.restRotations.get(this.bones.lHand.name) || new THREE.Euler()
      this.bones.lHand.rotation.set(
        rest.x,
        rest.y + (isSassy ? -0.2 : 0.05),
        rest.z + (isSassy ? -0.15 : 0.08)
      )
    }

    // Right Arm: Relaxed at Side Near Holster
    if (this.bones.rUpperArm) {
      const rest = this.restRotations.get(this.bones.rUpperArm.name) || new THREE.Euler()
      this.bones.rUpperArm.rotation.set(
        rest.x + 0.08 - Math.sin(time * 1.6) * 0.015,
        rest.y + 0.05,
        rest.z + 0.68 - breath * 0.012 + pokeArmShift
      )
    }

    if (this.bones.rForearm) {
      const rest = this.restRotations.get(this.bones.rForearm.name) || new THREE.Euler()
      this.bones.rForearm.rotation.set(
        rest.x,
        rest.y - 0.12,
        rest.z
      )
    }

    if (this.bones.rHand) {
      const rest = this.restRotations.get(this.bones.rHand.name) || new THREE.Euler()
      this.bones.rHand.rotation.set(
        rest.x,
        rest.y - 0.05,
        rest.z - 0.08
      )
    }

    // H. Legs & Calves: Natural Stance Stability
    if (this.bones.lThigh) {
      const rest = this.restRotations.get(this.bones.lThigh.name) || new THREE.Euler()
      this.bones.lThigh.rotation.set(
        rest.x + weightShift * 0.012,
        rest.y,
        rest.z - 0.015
      )
    }
    if (this.bones.rThigh) {
      const rest = this.restRotations.get(this.bones.rThigh.name) || new THREE.Euler()
      this.bones.rThigh.rotation.set(
        rest.x - weightShift * 0.012,
        rest.y,
        rest.z + 0.015
      )
    }

    // ─────────────────────────────────────────────────────────────
    // 4. SECONDARY DYNAMICS: SILKY HAIR PHYSICS & STRAND INERTIA
    // ─────────────────────────────────────────────────────────────
    const hairSpring = 42.0 // spring tension
    const hairDamping = 6.5 // damping coefficient

    for (let i = 0; i < this.hairBones.length; i++) {
      const hb = this.hairBones[i]
      // External force from head turning inertia + ambient soft air turbulence
      const inertiaForce = -headAngularVelocity * 0.18
      const ambientBreeze = Math.sin(time * 2.8 + i * 0.7) * 0.025 + Math.cos(time * 4.2 + i * 1.1) * 0.012
      const totalForce = inertiaForce + ambientBreeze

      // Spring-damper integration
      const accel = -hairSpring * hb.angle - hairDamping * hb.velocity + totalForce
      hb.velocity += accel * dt
      hb.angle += hb.velocity * dt
      hb.angle = THREE.MathUtils.clamp(hb.angle, -0.35, 0.35)

      // Apply to bone relative to rest rotation
      hb.bone.rotation.set(
        hb.restRot.x + ambientBreeze * 0.5,
        hb.restRot.y + hb.angle,
        hb.restRot.z + hb.angle * 0.6
      )
    }
  }
}
