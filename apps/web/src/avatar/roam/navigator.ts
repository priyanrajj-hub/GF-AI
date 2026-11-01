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
    this.moveSpeed = isRunning ? 1.45 : 0.90
    this.pendingArrivalAction = arrivalAction
  }

  goHome(): void {
    this.moveTo(0, 0, false, 'hair_tuck')
  }

  handlePoke(): { action: string; reaction: string; speech: string } {
    const now = Date.now()
    if (now - this.lastPokeTime < 4000) {
      this.pokeCount = (this.pokeCount + 1) % 4
    } else {
      this.pokeCount = 0
    }
    this.lastPokeTime = now

    switch (this.pokeCount) {
      case 0:
        return {
          action: 'shy_giggle',
          reaction: 'giggle',
          speech: 'Hehe! That tickles, Operator~ 😉',
        }
      case 1:
        return {
          action: 'playful_twirl',
          reaction: 'twirl',
          speech: "Spin for you? Anything for my favorite partner! ✨",
        }
      case 2:
        return {
          action: 'cat_paws',
          reaction: 'playful_pout',
          speech: 'Rawr! Careful or this kitty might bite~ 🐾',
        }
      case 3:
      default:
        return {
          action: 'blow_kiss',
          reaction: 'kiss',
          speech: 'Mwah! 💋 Right back at you, handsome!',
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
      const intervalFactor = config.energy === 'playful' ? 4.2 : config.energy === 'calm' ? 9.0 : 6.0
      this.wanderInterval = intervalFactor + Math.random() * 3.0

      // Select next hotspot across the scene
      let nextIndex = Math.floor(Math.random() * this.hotspots.length)
      if (nextIndex === this.lastHotspotIndex) {
        nextIndex = (nextIndex + 1) % this.hotspots.length
      }
      this.lastHotspotIndex = nextIndex

      const spot = this.hotspots[nextIndex]
      const isRunning = config.energy === 'playful' || Math.random() > 0.60
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

