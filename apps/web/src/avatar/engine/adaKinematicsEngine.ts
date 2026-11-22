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

interface FingerBoneGroup {
  // Left Hand Fingers
  lThumb: THREE.Bone[]
  lIndex: THREE.Bone[]
  lMid: THREE.Bone[]
  lRing: THREE.Bone[]
  lPinky: THREE.Bone[]

  // Right Hand Fingers
  rThumb: THREE.Bone[]
  rIndex: THREE.Bone[]
  rMid: THREE.Bone[]
  rRing: THREE.Bone[]
  rPinky: THREE.Bone[]
}

interface HairChainBone {
  bone: THREE.Bone
  restRot: THREE.Euler
  angle: number
  velocity: number
}

export class AdaKinematicsEngine {
  private bones: BoneMap = {}
  private fingers: FingerBoneGroup = {
    lThumb: [],
    lIndex: [],
    lMid: [],
    lRing: [],
    lPinky: [],
    rThumb: [],
    rIndex: [],
    rMid: [],
    rRing: [],
    rPinky: [],
  }
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

      // ─────────────────────────────────────────────────────────────
      // Finger bones matching (Left and Right hands, 3 joints each)
      // ─────────────────────────────────────────────────────────────
      if (n.includes('L_Finger0')) this.fingers.lThumb.push(bone)
      else if (n.includes('L_Finger1')) this.fingers.lIndex.push(bone)
      else if (n.includes('L_Finger2')) this.fingers.lMid.push(bone)
      else if (n.includes('L_Finger3')) this.fingers.lRing.push(bone)
      else if (n.includes('L_Finger4')) this.fingers.lPinky.push(bone)
      else if (n.includes('R_Finger0')) this.fingers.rThumb.push(bone)
      else if (n.includes('R_Finger1')) this.fingers.rIndex.push(bone)
      else if (n.includes('R_Finger2')) this.fingers.rMid.push(bone)
      else if (n.includes('R_Finger3')) this.fingers.rRing.push(bone)
      else if (n.includes('R_Finger4')) this.fingers.rPinky.push(bone)

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
    // 1. ORGANIC RESPIRATION & POSTURAL WEIGHT DRIFT
    // ─────────────────────────────────────────────────────────────
    const breathRate = systemState === 'speaking' ? 2.2 : 1.65
    const breath = Math.sin(time * breathRate)
    const deepBreath = Math.sin(time * (breathRate * 0.5)) * 0.5 + 0.5 // secondary respiratory rhythm
    const weightShift = Math.sin(time * 0.35) // slow contrapposto weight drift
    const fingerPulse = Math.sin(time * (breathRate * 0.9)) * 0.015 // micro-circulation finger twitch

    // ─────────────────────────────────────────────────────────────
    // 2. ATTENTIVE GAZE & HEAD TRACKING
    // ─────────────────────────────────────────────────────────────
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

    const targetYaw = THREE.MathUtils.clamp(pointer.x * 0.38 + this.glanceOffset.yaw, -0.65, 0.65)
    const targetPitch = THREE.MathUtils.clamp(-pointer.y * 0.22 + this.glanceOffset.pitch, -0.32, 0.28)
    const targetRoll = THREE.MathUtils.clamp(pointer.x * 0.08 + this.glanceOffset.roll, -0.15, 0.15)

    let speechNod = 0
    let speechTilt = 0
    if (systemState === 'speaking') {
      speechNod = Math.sin(time * 5.4) * 0.032 + Math.sin(time * 8.6) * 0.015
      speechTilt = Math.cos(time * 3.1) * 0.02
    }

    let pokeHeadPitch = 0
    let pokeSpinePitch = 0
    let pokeArmShift = 0
    if (this.isPokeReaction) {
      this.pokeElapsed += dt
      if (this.pokeElapsed < 0.25) {
        const prog = this.pokeElapsed / 0.25
        pokeHeadPitch = Math.sin(prog * Math.PI) * -0.18
        pokeSpinePitch = Math.sin(prog * Math.PI) * -0.09
        pokeArmShift = Math.sin(prog * Math.PI) * 0.25
      } else if (this.pokeElapsed < 2.0) {
        const fade = (2.0 - this.pokeElapsed) / 1.75
        pokeHeadPitch = Math.sin(this.pokeElapsed * 4.0) * 0.04 * fade
        pokeArmShift = 0.18 * fade
      } else {
        this.isPokeReaction = false
      }
    }

    const lerpSpeed = dt * 5.5
    this.currentHeadYaw = THREE.MathUtils.lerp(this.currentHeadYaw, targetYaw, lerpSpeed)
    this.currentHeadPitch = THREE.MathUtils.lerp(this.currentHeadPitch, targetPitch + speechNod + pokeHeadPitch, lerpSpeed)
    this.currentHeadRoll = THREE.MathUtils.lerp(this.currentHeadRoll, targetRoll + speechTilt, lerpSpeed)

    const headAngularVelocity = (this.currentHeadYaw - this.prevHeadYaw) / dt
    this.prevHeadYaw = this.currentHeadYaw

    // ─────────────────────────────────────────────────────────────
    // 3. CORE SKELETAL ROTATIONS (Pelvis, Spine, Chest, Head)
    // ─────────────────────────────────────────────────────────────
    if (this.bones.pelvis) {
      const rest = this.restRotations.get(this.bones.pelvis.name) || new THREE.Euler()
      this.bones.pelvis.rotation.set(
        rest.x + breath * 0.008 + pokeSpinePitch * 0.5,
        rest.y + weightShift * 0.028,
        rest.z + weightShift * 0.022
      )
    }

    if (this.bones.spine) {
      const rest = this.restRotations.get(this.bones.spine.name) || new THREE.Euler()
      this.bones.spine.rotation.set(
        rest.x + breath * 0.015 + pokeSpinePitch,
        rest.y + weightShift * 0.015,
        rest.z - weightShift * 0.012
      )
    }

    if (this.bones.chest) {
      const rest = this.restRotations.get(this.bones.chest.name) || new THREE.Euler()
      this.bones.chest.rotation.set(
        rest.x + breath * 0.028 + deepBreath * 0.012 + (systemState === 'speaking' ? 0.02 : 0),
        rest.y + this.currentHeadYaw * 0.15,
        rest.z - weightShift * 0.015
      )
    }

    if (this.bones.lClavicle) {
      const rest = this.restRotations.get(this.bones.lClavicle.name) || new THREE.Euler()
      this.bones.lClavicle.rotation.set(rest.x, rest.y, rest.z - 0.045 + breath * 0.012)
    }
    if (this.bones.rClavicle) {
      const rest = this.restRotations.get(this.bones.rClavicle.name) || new THREE.Euler()
      this.bones.rClavicle.rotation.set(rest.x, rest.y, rest.z + 0.045 - breath * 0.012)
    }

    if (this.bones.neck) {
      const rest = this.restRotations.get(this.bones.neck.name) || new THREE.Euler()
      this.bones.neck.rotation.set(
        rest.x + this.currentHeadPitch * 0.35,
        rest.y + this.currentHeadYaw * 0.35,
        rest.z + this.currentHeadRoll * 0.35
      )
    }

    if (this.bones.head) {
      const rest = this.restRotations.get(this.bones.head.name) || new THREE.Euler()
      this.bones.head.rotation.set(
        rest.x + this.currentHeadPitch * 0.65,
        rest.y + this.currentHeadYaw * 0.65,
        rest.z + this.currentHeadRoll * 0.65
      )
    }

    // ─────────────────────────────────────────────────────────────
    // 4. NATURAL HUMAN ARM & HAND POSTURE (At Outer Hips, NO Flat Front Belly)
    // ─────────────────────────────────────────────────────────────
    const isSassy = this.activeAction === 'hip_pop' || this.activeAction === 'sassy' || this.isPokeReaction

    // Left Arm: Hangs naturally along left outer hip/thigh (x ≈ +0.183, y ≈ 0.698, z ≈ 0.027)
    if (this.bones.lUpperArm) {
      if (isSassy) {
        // Hand-on-hip pose: Upper arm angled out, elbow bent
        this.bones.lUpperArm.rotation.set(0.12, -0.25, -0.45)
      } else {
        // Natural relaxed side hang: drops straight down along ribcage and side of hip
        this.bones.lUpperArm.rotation.set(
          0.25 + Math.sin(time * 1.6) * 0.008,
          0.20,
          -1.20 + breath * 0.012
        )
      }
    }

    if (this.bones.lForearm) {
      if (isSassy) {
        this.bones.lForearm.rotation.set(0, -0.42, 0.22)
      } else {
        // Natural gentle elbow flex: keeps hand aligned with lateral hip seam
        this.bones.lForearm.rotation.set(0, -0.60, 0)
      }
    }

    if (this.bones.lHand) {
      if (isSassy) {
        // Hand resting firmly on waist
        this.bones.lHand.rotation.set(-0.15, 0.25, -0.35)
      } else {
        // Natural human wrist draping: rest bind orientation with subtle sway
        const rest = this.restRotations.get(this.bones.lHand.name) || new THREE.Euler(0.670, -0.094, 0.107)
        this.bones.lHand.rotation.set(
          rest.x,
          rest.y,
          rest.z + Math.sin(time * 1.2) * 0.005
        )
      }
    }

    // Right Arm: Hangs naturally alongside right tactical holster (x ≈ -0.183, y ≈ 0.698, z ≈ 0.027)
    if (this.bones.rUpperArm) {
      this.bones.rUpperArm.rotation.set(
        0.25 - Math.sin(time * 1.6) * 0.008,
        -0.20,
        1.20 - breath * 0.012 + pokeArmShift
      )
    }

    if (this.bones.rForearm) {
      this.bones.rForearm.rotation.set(0, 0.60, 0)
    }

    if (this.bones.rHand) {
      const rest = this.restRotations.get(this.bones.rHand.name) || new THREE.Euler(0.670, 0.094, -0.107)
      this.bones.rHand.rotation.set(
        rest.x,
        rest.y,
        rest.z - Math.sin(time * 1.2) * 0.005
      )
    }

    // Legs
    if (this.bones.lThigh) {
      const rest = this.restRotations.get(this.bones.lThigh.name) || new THREE.Euler()
      this.bones.lThigh.rotation.set(rest.x + weightShift * 0.012, rest.y, rest.z - 0.015)
    }
    if (this.bones.rThigh) {
      const rest = this.restRotations.get(this.bones.rThigh.name) || new THREE.Euler()
      this.bones.rThigh.rotation.set(rest.x - weightShift * 0.012, rest.y, rest.z + 0.015)
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ANATOMICAL RELAXED HUMAN FINGER CURL (Passive Muscle Tone)
    // ─────────────────────────────────────────────────────────────
    // The GLB bind pose already provides Capcom RE4 Remake's natural finger sculpting.
    // We add a subtle passive tone offset and micro-circulation respiration pulse.

    // LEFT HAND FINGERS (curl direction: negative Z on Valve Biped)
    this.curlFingers(this.fingers.lThumb, -1, [0.02, 0.03, 0.02], fingerPulse)
    this.curlFingers(this.fingers.lIndex, -1, [0.03, 0.04, 0.02], fingerPulse)
    this.curlFingers(this.fingers.lMid,   -1, [0.03, 0.05, 0.03], fingerPulse)
    this.curlFingers(this.fingers.lRing,  -1, [0.04, 0.05, 0.03], fingerPulse)
    this.curlFingers(this.fingers.lPinky, -1, [0.05, 0.06, 0.04], fingerPulse)

    // RIGHT HAND FINGERS (curl direction: positive Z on Valve Biped)
    this.curlFingers(this.fingers.rThumb, 1, [0.02, 0.03, 0.02], fingerPulse)
    this.curlFingers(this.fingers.rIndex, 1, [0.03, 0.04, 0.02], fingerPulse)
    this.curlFingers(this.fingers.rMid,   1, [0.03, 0.05, 0.03], fingerPulse)
    this.curlFingers(this.fingers.rRing,  1, [0.04, 0.05, 0.03], fingerPulse)
    this.curlFingers(this.fingers.rPinky, 1, [0.05, 0.06, 0.04], fingerPulse)

    // ─────────────────────────────────────────────────────────────
    // 6. SECONDARY DYNAMICS: SILKY HAIR PHYSICS & STRAND INERTIA
    // ─────────────────────────────────────────────────────────────
    const hairSpring = 42.0
    const hairDamping = 6.5

    for (let i = 0; i < this.hairBones.length; i++) {
      const hb = this.hairBones[i]
      const inertiaForce = -headAngularVelocity * 0.18
      const ambientBreeze = Math.sin(time * 2.8 + i * 0.7) * 0.025 + Math.cos(time * 4.2 + i * 1.1) * 0.012
      const totalForce = inertiaForce + ambientBreeze

      const accel = -hairSpring * hb.angle - hairDamping * hb.velocity + totalForce
      hb.velocity += accel * dt
      hb.angle += hb.velocity * dt
      hb.angle = THREE.MathUtils.clamp(hb.angle, -0.35, 0.35)

      hb.bone.rotation.set(
        hb.restRot.x + ambientBreeze * 0.5,
        hb.restRot.y + hb.angle,
        hb.restRot.z + hb.angle * 0.6
      )
    }
  }

  /**
   * Applies realistic anatomical curvature across the joints of a finger.
   * @param joints The 3 bones of the finger [proximal, middle, distal]
   * @param sign -1 for Left hand, +1 for Right hand
   * @param angles Array of base flex angles [proximal, middle, distal] in radians
   * @param pulse Subtle micro-twitch to simulate blood circulation and muscle life
   * @param yawOffset Optional thumb opposition yaw in radians
   */
  private curlFingers(
    joints: THREE.Bone[],
    sign: number,
    angles: [number, number, number],
    pulse: number,
    yawOffset: number = 0
  ) {
    if (!joints || joints.length === 0) return

    for (let i = 0; i < joints.length; i++) {
      const joint = joints[i]
      const rest = this.restRotations.get(joint.name) || new THREE.Euler()
      const flexAngle = (angles[i] !== undefined ? angles[i] : 0.3) + pulse

      joint.rotation.set(
        rest.x,
        rest.y + (i === 0 ? yawOffset : 0),
        rest.z + sign * flexAngle
      )
    }
  }
}
