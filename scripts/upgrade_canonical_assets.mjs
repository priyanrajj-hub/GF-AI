import fs from 'fs'

const filePath = 'apps/web/src/avatar/skins/ada-red.ts'
let content = fs.readFileSync(filePath, 'utf8')
let lines = content.split(/\r?\n/)

// Find line starting with '/**' right before attachYorThornPrincessFeatures
let startIdx = -1
for (let i = 1210; i < 1225; i++) {
  if (lines[i].includes('export function attachYorThornPrincessFeatures')) {
    startIdx = i - 3 // the /** line
    break
  }
}

// Find line ending of attachAdaTacticalAccessories
let endIdx = -1
for (let i = startIdx; i < startIdx + 80; i++) {
  if (lines[i].includes('export const StarkArcTraderSkin')) {
    endIdx = i - 1
    // Walk back to empty line
    while (lines[endIdx].trim() !== '' && endIdx > startIdx) {
      endIdx--
    }
    break
  }
}

console.log(`Replacing lines ${startIdx + 1} to ${endIdx + 1} with canonical 3D accessories`)

const newAccessories = `/**
 * Attaches Yor Forger's authentic Thorn Princess assassin assets:
 * 1. Golden floral headband crown & dual sculpted temple roses
 * 2. Dual protruding golden stylus needle hairpins ("The Thorns")
 * 3. Dangling golden dagger earrings
 * 4. Twin long raven-black side locks flowing past shoulders onto chest
 * 5. Midnight leather halter neck choker with golden ring
 * 6. Dual golden stiletto needle daggers in hands ("The Thorns")
 */
export function attachYorThornPrincessFeatures(vrm: VRM, visible: boolean = true): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  const neckBone = vrm.humanoid?.getNormalizedBoneNode('neck')
  const leftHand = vrm.humanoid?.getNormalizedBoneNode('leftHand')
  const rightHand = vrm.humanoid?.getNormalizedBoneNode('rightHand')

  if (!headBone) return

  let headGroup = headBone.getObjectByName('__YOR_HEAD_ASSEMBLY__') as THREE.Group | undefined
  if (!headGroup && visible) {
    headGroup = new THREE.Group()
    headGroup.name = '__YOR_HEAD_ASSEMBLY__'

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF7D060,
      metalness: 0.92,
      roughness: 0.16,
    })

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x0A0B0E,
      roughness: 0.22,
      metalness: 0.15,
    })

    // 1. Golden Headband Crown
    const bandGeo = new THREE.TorusGeometry(0.125, 0.0036, 12, 36, Math.PI * 0.96)
    const bandMesh = new THREE.Mesh(bandGeo, goldMat)
    bandMesh.rotation.x = Math.PI / 2
    bandMesh.rotation.z = -Math.PI / 2
    bandMesh.position.set(0, 0.080, 0.015)
    headGroup.add(bandMesh)

    // 2. Sculpted Golden Roses over temples
    const createRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.013, 12, 12)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const petalGeo = new THREE.CylinderGeometry(0.008, 0.003, 0.018, 8)
        const petalMesh = new THREE.Mesh(petalGeo, goldMat)
        petalMesh.position.set(Math.cos(angle) * 0.013, Math.sin(angle) * 0.013, 0)
        petalMesh.rotation.z = angle
        g.add(petalMesh)
      }
      return g
    }

    const leftRose = createRose()
    leftRose.position.set(0.098, 0.045, -0.012)
    headGroup.add(leftRose)

    const rightRose = createRose()
    rightRose.position.set(-0.098, 0.045, -0.012)
    headGroup.add(rightRose)

    // 3. Protruding Golden Stylus Needles (Hairpins pointing backward/upward)
    const needleShaftGeo = new THREE.CylinderGeometry(0.0018, 0.0032, 0.14, 10)
    const needleTipGeo = new THREE.ConeGeometry(0.0032, 0.026, 10)

    const createStylus = (isLeft: boolean) => {
      const g = new THREE.Group()
      const shaft = new THREE.Mesh(needleShaftGeo, goldMat)
      const tip = new THREE.Mesh(needleTipGeo, goldMat)
      tip.position.y = 0.082
      g.add(shaft)
      g.add(tip)
      g.rotation.x = -Math.PI * 0.28
      g.rotation.z = isLeft ? -Math.PI * 0.22 : Math.PI * 0.22
      return g
    }

    const leftPin = createStylus(true)
    leftPin.position.set(0.098, 0.055, -0.025)
    headGroup.add(leftPin)

    const rightPin = createStylus(false)
    rightPin.position.set(-0.098, 0.055, -0.025)
    headGroup.add(rightPin)

    // 4. Dangling Golden Needle / Stiletto Earrings
    const createEarring = () => {
      const g = new THREE.Group()
      const loopGeo = new THREE.TorusGeometry(0.004, 0.001, 8, 16)
      const loop = new THREE.Mesh(loopGeo, goldMat)
      const spikeGeo = new THREE.ConeGeometry(0.0024, 0.038, 8)
      const spike = new THREE.Mesh(spikeGeo, goldMat)
      spike.rotation.x = Math.PI
      spike.position.y = -0.022
      g.add(loop)
      g.add(spike)
      return g
    }

    const leftEarring = createEarring()
    leftEarring.position.set(0.098, -0.015, -0.010)
    headGroup.add(leftEarring)

    const rightEarring = createEarring()
    rightEarring.position.set(-0.098, -0.015, -0.010)
    headGroup.add(rightEarring)

    // 5. Twin Front Raven Hair Locks (framing face and draping forward over chest)
    const createSideLock = (isLeft: boolean) => {
      const g = new THREE.Group()
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.006, 0.12, 8), hairMat)
      s1.position.set(0, -0.06, 0.02)
      s1.rotation.z = isLeft ? 0.08 : -0.08
      s1.rotation.x = 0.15
      g.add(s1)

      const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.002, 0.16, 8), hairMat)
      s2.position.set(isLeft ? -0.008 : 0.008, -0.19, 0.05)
      s2.rotation.z = isLeft ? -0.06 : 0.06
      s2.rotation.x = 0.25
      g.add(s2)

      return g
    }

    const leftLock = createSideLock(true)
    leftLock.position.set(0.088, 0.03, 0.01)
    headGroup.add(leftLock)

    const rightLock = createSideLock(false)
    rightLock.position.set(-0.088, 0.03, 0.01)
    headGroup.add(rightLock)

    headBone.add(headGroup)
  }
  if (headGroup) headGroup.visible = visible

  // 6. Midnight Leather Halter Choker with Central Golden Ring
  if (neckBone) {
    let choker = neckBone.getObjectByName('__YOR_CHOKER__') as THREE.Group | undefined
    if (!choker && visible) {
      choker = new THREE.Group()
      choker.name = '__YOR_CHOKER__'

      const leatherMat = new THREE.MeshStandardMaterial({
        color: 0x111216,
        roughness: 0.40,
        metalness: 0.15,
      })
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xF7D060,
        metalness: 0.92,
        roughness: 0.16,
      })

      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.056, 0.022, 24, 1, true), leatherMat)
      choker.add(collarMesh)

      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.002, 8, 20), goldMat)
      ringMesh.position.set(0, 0, -0.056)
      choker.add(ringMesh)

      neckBone.add(choker)
    }
    if (choker) choker.visible = visible
  }

  // 7. Dual Golden Stiletto Needle Daggers ("The Thorns")
  const goldMatDagger = new THREE.MeshStandardMaterial({
    color: 0xF7D060,
    metalness: 0.94,
    roughness: 0.14,
  })

  const attachDagger = (handBone: THREE.Object3D | null | undefined, name: string) => {
    if (!handBone) return
    let dagger = handBone.getObjectByName(name) as THREE.Group | undefined
    if (!dagger && visible) {
      dagger = new THREE.Group()
      dagger.name = name

      const bladeGeo = new THREE.CylinderGeometry(0.0018, 0.0042, 0.26, 12)
      const blade = new THREE.Mesh(bladeGeo, goldMatDagger)
      blade.position.y = 0.13
      dagger.add(blade)

      const tipGeo = new THREE.ConeGeometry(0.0018, 0.024, 12)
      const tip = new THREE.Mesh(tipGeo, goldMatDagger)
      tip.position.y = 0.27
      dagger.add(tip)

      const ringGeo = new THREE.TorusGeometry(0.014, 0.0026, 8, 20)
      const ring = new THREE.Mesh(ringGeo, goldMatDagger)
      ring.position.y = -0.025
      dagger.add(ring)

      dagger.rotation.x = Math.PI / 2
      dagger.position.set(0, 0, 0.04)

      handBone.add(dagger)
    }
    if (dagger) dagger.visible = visible
  }

  attachDagger(leftHand, '__YOR_DAGGER_L__')
  attachDagger(rightHand, '__YOR_DAGGER_R__')
}

// Backward-compatible alias
export function attachYorHeadbandRose(vrm: VRM, visible: boolean = true): void {
  attachYorThornPrincessFeatures(vrm, visible)
}

/**
 * Clean tactical espionage styling for Ada Wong:
 * Form-fitting shoulder harness and sleek right-thigh tactical holster.
 */
export function attachAdaTacticalAccessories(vrm: VRM, visible: boolean = true): void {
  const chestBone = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
  const rLegBone = vrm.humanoid?.getNormalizedBoneNode('rightUpperLeg')

  if (chestBone) {
    let harness = chestBone.getObjectByName('__ADA_HARNESS__') as THREE.Group | undefined
    if (!harness && visible) {
      harness = new THREE.Group()
      harness.name = '__ADA_HARNESS__'
      const holsterMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.38, metalness: 0.22 })
      const buckleMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.20, metalness: 0.85 })

      const strapMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.014, 28, 1, true), holsterMat)
      strapMesh.position.set(0, 0.02, 0)
      strapMesh.rotation.z = -0.18
      harness.add(strapMesh)

      const pouchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.016), holsterMat)
      pouchMesh.position.set(0.082, 0.01, -0.098)
      pouchMesh.rotation.z = -0.15
      harness.add(pouchMesh)

      const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.006), buckleMat)
      buckleMesh.position.set(0.05, 0.07, -0.096)
      harness.add(buckleMesh)

      chestBone.add(harness)
    }
    if (harness) harness.visible = visible
  }

  if (rLegBone) {
    let thighHolster = rLegBone.getObjectByName('__ADA_THIGH_HOLSTER__') as THREE.Group | undefined
    if (!thighHolster && visible) {
      thighHolster = new THREE.Group()
      thighHolster.name = '__ADA_THIGH_HOLSTER__'
      const holsterMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.38, metalness: 0.22 })

      const legStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.072, 0.016, 24, 1, true), holsterMat)
      legStrap.position.set(0, -0.14, 0)
      thighHolster.add(legStrap)

      const holsterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.085, 0.022), holsterMat)
      holsterMesh.position.set(0.075, -0.15, -0.008)
      holsterMesh.rotation.y = Math.PI * 0.1
      thighHolster.add(holsterMesh)

      rLegBone.add(thighHolster)
    }
    if (thighHolster) thighHolster.visible = visible
  }
}`

lines.splice(startIdx, endIdx - startIdx, newAccessories)
content = lines.join('\n')

// 2. Fix YorThornPrincessSkin so it does NOT call AdaRedSkin.apply(vrm)
content = content.replace(
  /export const YorThornPrincessSkin: AvatarSkin = \{[\s\S]*?apply: \(vrm: VRM\) => \{\s*AdaRedSkin\.apply\(vrm\)/,
  `export const YorThornPrincessSkin: AvatarSkin = {
  id: 'yor-thorn-princess',
  name: 'Yor Forger • Thorn Princess (Assassin Form)',
  description: 'Iconic midnight noir halter dress with rose-printed lining, dual temple gold roses, and assassin stiletto boots.',
  apply: (vrm: VRM) => {
    // Directly apply Thorn Princess styling without bleeding Ada red dress
    attachStarkTechGlassesAndBeard(vrm, false)
    attachAdaTacticalAccessories(vrm, false)
    attachYorThornPrincessFeatures(vrm, true)
    const chestEmblem = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
    if (chestEmblem) {
      const em = chestEmblem.getObjectByName('__STARK_ARC_REACTOR__')
      if (em) em.visible = false
    }`
)

fs.writeFileSync(filePath, content, 'utf8')
console.log('✓ Successfully wrote updated ada-red.ts')
