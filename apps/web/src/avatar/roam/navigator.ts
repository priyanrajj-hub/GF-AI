import * as THREE from 'three'

export interface RoamTarget {
  x: number
  z: number
  speed: number // 1 = walk, 2 = run
  actionOnArrival?: string
}

export interface RoamConfig {
  enabled: boolean
  range: 'home' | 'half' | 'full'
  energy: 'calm' | 'balanced' | 'playful'
  followCursor: boolean
}

export class RoamNavigator {
  public currentPos: THREE.Vector3
  public targetPos: THREE.Vector3
  public currentRotationY = 0
  public isMoving = false
  public moveSpeed = 0
  public pokeCount = 0
  public lastPokeTime = 0
  private lastWanderTime = 6.0
  private wanderInterval = 8.5
  public pendingArrivalAction?: string

  // Expanded Stage Boundaries: traversing across whole cyber stage
  private bounds = {
    xMin: -1.45,
    xMax: 1.45,
    zMin: -0.15,
    zMax: 0.55,
  }

  // Meaningful Stage Hotspots (Tuned for unobstructed spotlight between UI drawers)
  private hotspots = [
    { name: 'home_pad', x: 0.0, z: 0.0, action: 'hair_tuck' },
    { name: 'stage_front_center', x: -0.05, z: 0.35, action: 'curious_lean' },
    { name: 'stage_left_catwalk', x: -0.45, z: 0.15, action: 'sassy_hip_pop' },
    { name: 'stage_left_cute', x: -0.30, z: 0.25, action: 'shy_giggle' },
    { name: 'stage_left_twirl', x: -0.35, z: 0.05, action: 'playful_twirl' },
    { name: 'stage_front_kiss', x: -0.15, z: 0.25, action: 'blow_kiss' },
    { name: 'stage_center_wave', x: 0.10, z: 0.20, action: 'wave' },
    { name: 'stage_companion_paws', x: -0.20, z: 0.15, action: 'cat_paws' },
  ]
  private lastHotspotIndex = -1

  constructor(initialPos = new THREE.Vector3(0, 0, 0)) {
    this.currentPos = initialPos.clone()
    this.targetPos = initialPos.clone()
    this.currentRotationY = 0
  }

  setBounds(xMin: number, xMax: number, zMin: number, zMax: number): void {
    this.bounds = { xMin, xMax, zMin, zMax }
  }

  moveTo(x: number, z: number, isRunning = false, arrivalAction?: string): void {
    const clampedX = THREE.MathUtils.clamp(x, this.bounds.xMin, this.bounds.xMax)
    const clampedZ = THREE.MathUtils.clamp(z, this.bounds.zMin, this.bounds.zMax)
    this.targetPos.set(clampedX, 0, clampedZ)
    this.moveSpeed = isRunning ? 0.70 : 0.40
    this.pendingArrivalAction = arrivalAction
  }

  goHome(): void {
    this.moveTo(0, 0, false, 'hair_tuck')
  }

  handlePoke(character: string = 'ada'): { action: string; reaction: string; speech: string } {
    const now = performance.now() / 1000
    if (now - this.lastPokeTime < 8.0) {
      this.pokeCount = (this.pokeCount + 1) % 4
    } else {
      this.pokeCount = 0
    }
    this.lastPokeTime = now

    // 1. Tony Stark (Iron Man / Quant Trader)
    if (character === 'atlas') {
      switch (this.pokeCount) {
        case 0:
          return {
            action: 'stark_billionaire_swagger',
            reaction: 'proud',
            speech: "Repulsors charged. Easy on the gold-titanium armor, chief.",
          }
        case 1:
          return {
            action: 'stark_glasses_adjust',
            reaction: 'confident',
            speech: "I'm Tony Stark. I engineer breakthrough tech, crush market alphas, and look damn good doing it.",
          }
        case 2:
          return {
            action: 'thumbs_up',
            reaction: 'smile',
            speech: "Jarvis, run a real-time diagnostic. Let's find our next winning trade.",
          }
        case 3:
        default:
          return {
            action: 'fist_pump',
            reaction: 'hyped',
            speech: "Arc reactor humming at 100% capacity. Ready for high-stakes execution.",
          }
      }
    }

    // 2. Yor Forger (Thorn Princess / Assassin)
    if (character === 'mira') {
      switch (this.pokeCount) {
        case 0:
          return {
            action: 'yor_rose_elegance',
            reaction: 'gentle_smile',
            speech: "O-oh! Pardon me, did I startle you? I was just tending to our workspace! 🌹",
          }
        case 1:
          return {
            action: 'yor_tender_wave',
            reaction: 'sweet_smile',
            speech: "Please take good care of yourself today... I will protect this family no matter what!",
          }
        case 2:
          return {
            action: 'shy_giggle',
            reaction: 'shy_blush',
            speech: "Is anyone causing you trouble? I can... resolve the situation very quietly.",
          }
        case 3:
        default:
          return {
            action: 'bow',
            reaction: 'polite_bow',
            speech: "I am honored to assist you. Let us do our best together!",
          }
      }
    }

    // 3. Ada Wong (Resident Evil Spy / Strategic Operator)
    switch (this.pokeCount) {
      case 0:
        return {
          action: 'ada_tactical_poise',
          reaction: 'smirk',
          speech: "Eyes on the objective. A good operator never loses focus.",
        }
      case 1:
        return {
          action: 'hair_tuck',
          reaction: 'intrigue',
          speech: "Curious? You know a woman in red never gives away all her secrets.",
        }
      case 2:
        return {
          action: 'sassy_hip_pop',
          reaction: 'playful_smile',
          speech: "Careful now. Playing with high stakes has its consequences.",
        }
      case 3:
      default:
        return {
          action: 'salute',
          reaction: 'confident_nod',
          speech: "Right on schedule. Let's execute the next mission phase.",
        }
    }
  }

  update(
    delta: number,
    time: number,
    config: RoamConfig,
    cursorWorldPos?: THREE.Vector3
  ): { isMoving: boolean; actionToTrigger?: string } {
    if (!config.enabled) {
      this.isMoving = false
      return { isMoving: false }
    }

    // 1. Follow Cursor mode
    if (config.followCursor && cursorWorldPos) {
      const distToCursor = cursorWorldPos.distanceTo(this.currentPos)
      if (distToCursor > 0.8) {
        this.moveTo(cursorWorldPos.x * 0.65, cursorWorldPos.z * 0.65, distToCursor > 1.6)
      }
    }

    // 2. Active Stage Wandering (every 5-8s)
    if (!config.followCursor && time - this.lastWanderTime > this.wanderInterval) {
      this.lastWanderTime = time
      const intervalFactor = config.energy === 'playful' ? 14.0 : config.energy === 'calm' ? 28.0 : 20.0
      this.wanderInterval = intervalFactor + Math.random() * 8.0

      // Select next hotspot across the scene
      let nextIndex = Math.floor(Math.random() * this.hotspots.length)
      if (nextIndex === this.lastHotspotIndex) {
        nextIndex = (nextIndex + 1) % this.hotspots.length
      }
      this.lastHotspotIndex = nextIndex

      const spot = this.hotspots[nextIndex]
      const isRunning = false // Always maintain poised, elegant catwalk pace
      this.moveTo(spot.x, spot.z, isRunning, spot.action)
    }

    // 3. Navigation Steering & Movement
    const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.currentPos)
    toTarget.y = 0
    const dist = toTarget.length()
    let actionToTrigger: string | undefined

    if (dist > 0.05) {
      this.isMoving = true
      toTarget.normalize()

      // CATWALK STEERING: Ada ALWAYS faces the user/camera!
      // She turns at most +/-30 deg (+/-0.52 rad) toward direction of travel,
      // gliding with model runway presence, NEVER turning her back!
      const lateralBias = Math.atan2(toTarget.x, Math.max(0.35, Math.abs(toTarget.z) * 0.7))
      const targetAngle = THREE.MathUtils.clamp(lateralBias, -0.52, 0.52)

      let diff = targetAngle - this.currentRotationY
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2
      this.currentRotationY += diff * Math.min(1.0, delta * 6.0)

      // Advance position smoothly
      const step = Math.min(dist, this.moveSpeed * delta)
      this.currentPos.addScaledVector(toTarget, step)
    } else {
      if (this.isMoving) {
        // Just arrived! Trigger arrival flair if one was queued
        if (this.pendingArrivalAction) {
          actionToTrigger = this.pendingArrivalAction
          this.pendingArrivalAction = undefined
        }
      }
      this.isMoving = false

      // Turn back to face the camera smoothly when stopped (0 rad)
      let diffToFront = 0 - this.currentRotationY
      while (diffToFront < -Math.PI) diffToFront += Math.PI * 2
      while (diffToFront > Math.PI) diffToFront -= Math.PI * 2
      this.currentRotationY += diffToFront * Math.min(1.0, delta * 4.5)
    }

    return { isMoving: this.isMoving, actionToTrigger }
  }
}

