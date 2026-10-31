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
  private lastWanderTime = 0
  private wanderInterval = 12

  // Safe Stage Floor Boundaries
  private bounds = {
    xMin: -1.35,
    xMax: 1.35,
    zMin: -0.65,
    zMax: 0.45,
  }

  constructor(initialPos = new THREE.Vector3(0, 0, 0)) {
    this.currentPos = initialPos.clone()
    this.targetPos = initialPos.clone()
    this.currentRotationY = 0
  }

  setBounds(xMin: number, xMax: number, zMin: number, zMax: number): void {
    this.bounds = { xMin, xMax, zMin, zMax }
  }

  moveTo(x: number, z: number, isRunning = false): void {
    const clampedX = THREE.MathUtils.clamp(x, this.bounds.xMin, this.bounds.xMax)
    const clampedZ = THREE.MathUtils.clamp(z, this.bounds.zMin, this.bounds.zMax)
    this.targetPos.set(clampedX, 0, clampedZ)
    this.moveSpeed = isRunning ? 1.6 : 0.85
  }

  goHome(): void {
    this.moveTo(0, 0, false)
  }

  handlePoke(): { action: string; reaction: string } {
    const now = Date.now()
    if (now - this.lastPokeTime < 3000) {
      this.pokeCount++
    } else {
      this.pokeCount = 1
    }
    this.lastPokeTime = now

    if (this.pokeCount >= 3) {
      this.pokeCount = 0
      return { action: 'pout', reaction: 'playful_pout' }
    }
    return { action: 'poke_react', reaction: 'giggle' }
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
        this.moveTo(cursorWorldPos.x * 0.7, cursorWorldPos.z * 0.7, distToCursor > 1.6)
      }
    }

    // 2. Autonomous Idle Wandering (every 8-18s)
    if (!config.followCursor && time - this.lastWanderTime > this.wanderInterval) {
      this.lastWanderTime = time
      const intervalFactor = config.energy === 'playful' ? 7 : config.energy === 'calm' ? 18 : 12
      this.wanderInterval = intervalFactor + Math.random() * 6

      // Wander within range
      const span = config.range === 'home' ? 0.35 : config.range === 'half' ? 0.75 : 1.2
      const randomX = (Math.random() - 0.5) * 2 * span
      const randomZ = (Math.random() - 0.5) * 2 * (span * 0.45)
      this.moveTo(randomX, randomZ, config.energy === 'playful' && Math.random() > 0.6)
    }

    // 3. Navigation Steering & Movement
    const toTarget = new THREE.Vector3().subVectors(this.targetPos, this.currentPos)
    toTarget.y = 0
    const dist = toTarget.length()

    if (dist > 0.04) {
      this.isMoving = true
      toTarget.normalize()

      // Smooth turning toward direction of movement
      const targetAngle = Math.atan2(toTarget.x, toTarget.z)
      // Lerp angle smoothly
      let diff = targetAngle - this.currentRotationY
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2
      this.currentRotationY += diff * Math.min(1.0, delta * 7.0)

      // Advance position
      const step = Math.min(dist, this.moveSpeed * delta)
      this.currentPos.addScaledVector(toTarget, step)
    } else {
      this.isMoving = false
      // Turn back to face the camera smoothly when stopped
      let diffToFront = 0 - this.currentRotationY
      while (diffToFront < -Math.PI) diffToFront += Math.PI * 2
      while (diffToFront > Math.PI) diffToFront -= Math.PI * 2
      this.currentRotationY += diffToFront * Math.min(1.0, delta * 3.0)
    }

    return { isMoving: this.isMoving }
  }
}
