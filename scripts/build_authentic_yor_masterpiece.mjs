import fs from 'fs';
import path from 'path';

const projectRoot = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\scratch\\ai---gf---assistant-';
const adaRedPath = path.join(projectRoot, 'apps/web/src/avatar/skins/ada-red.ts');
let code = fs.readFileSync(adaRedPath, 'utf8');

const authenticYorFeatures = `export function attachYorThornPrincessFeatures(vrm: VRM, visible: boolean = true): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  const neckBone = vrm.humanoid?.getNormalizedBoneNode('neck')
  const leftHand = vrm.humanoid?.getNormalizedBoneNode('leftHand')
  const rightHand = vrm.humanoid?.getNormalizedBoneNode('rightHand')
  const leftArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
  const rightArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')

  if (!headBone) return

  let headGroup = headBone.getObjectByName('__YOR_HEAD_ASSEMBLY__') as THREE.Group | undefined
  if (!headGroup && visible) {
    headGroup = new THREE.Group()
    headGroup.name = '__YOR_HEAD_ASSEMBLY__'

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF5C542,
      metalness: 0.95,
      roughness: 0.12,
    })

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      roughness: 0.22,
      metalness: 0.10,
    })

    // --- A. SIGNATURE YOR UPDO BUN & FLOWING BACK HAIR (Firmly at back of skull, +Z) ---
    // In this VRM model: +Z is BACK of head, -Z is FRONT of face (mouth is at z=-0.055)
    const backHairGroup = new THREE.Group()
    backHairGroup.name = '__YOR_BACK_HAIR__'
    backHairGroup.position.set(0, 0.035, 0.082) // placed strictly behind the skull (+Z)

    // Updo bun sculpted at the back of the head
    const bunGeo = new THREE.SphereGeometry(0.048, 16, 16)
    bunGeo.scale(1.15, 0.95, 0.8)
    const bunMesh = new THREE.Mesh(bunGeo, hairMat)
    bunMesh.position.set(0, 0.015, 0.01)
    backHairGroup.add(bunMesh)

    // Flowing raven strands cascading down behind shoulders
    const createBackHairStrand = (length: number, width: number, xOffset: number, curveX: number) => {
      const g = new THREE.Group()
      const segments = 4
      for (let i = 0; i < segments; i++) {
        const segLen = length / segments
        const topW = width * (1.0 - (i / segments) * 0.3)
        const botW = width * (1.0 - ((i + 1) / segments) * 0.5)
        const geo = new THREE.CylinderGeometry(botW, topW, segLen, 8)
        const mesh = new THREE.Mesh(geo, hairMat)
        mesh.position.y = -segLen * (i + 0.5)
        mesh.position.x = xOffset + (i / segments) * curveX
        mesh.position.z = (i / segments) * 0.015 // stay behind back (+Z)
        g.add(mesh)
      }
      return g
    }

    // Three elegant back cascades draping behind shoulders
    backHairGroup.add(createBackHairStrand(0.32, 0.015, 0, 0))
    backHairGroup.add(createBackHairStrand(0.30, 0.013, 0.035, 0.015))
    backHairGroup.add(createBackHairStrand(0.30, 0.013, -0.035, -0.015))

    headGroup.add(backHairGroup)

    // --- B. TWIN FRONT RAVEN LOCKS (Draping cleanly down sides of face onto collarbone) ---
    // Placed at x = ±0.062, z = -0.032 to frame cheeks without covering mouth or eyes
    const createFrontLock = (isLeft: boolean) => {
      const g = new THREE.Group()
      const xSign = isLeft ? 1 : -1

      // Upper lock tapering down cheek
      const topGeo = new THREE.CylinderGeometry(0.005, 0.004, 0.11, 8)
      const topMesh = new THREE.Mesh(topGeo, hairMat)
      topMesh.position.set(0, -0.055, 0)
      topMesh.rotation.z = xSign * 0.03
      g.add(topMesh)

      // Lower slender lock tapering past collarbone
      const botGeo = new THREE.CylinderGeometry(0.004, 0.0015, 0.14, 8)
      const botMesh = new THREE.Mesh(botGeo, hairMat)
      botMesh.position.set(xSign * 0.003, -0.17, -0.004)
      botMesh.rotation.z = xSign * -0.02
      g.add(botMesh)

      return g
    }

    const leftFrontLock = createFrontLock(true)
    leftFrontLock.position.set(0.062, 0.032, -0.030)
    headGroup.add(leftFrontLock)

    const rightFrontLock = createFrontLock(false)
    rightFrontLock.position.set(-0.062, 0.032, -0.030)
    headGroup.add(rightFrontLock)

    // --- C. GOLDEN CROWN TIARA HEADBAND ---
    // Torus arc positioned over the crown of head
    const tiaraGeo = new THREE.TorusGeometry(0.076, 0.0022, 8, 36, Math.PI * 0.90)
    const tiaraMesh = new THREE.Mesh(tiaraGeo, goldMat)
    tiaraMesh.rotation.x = Math.PI * 0.52
    tiaraMesh.rotation.z = -Math.PI / 2
    tiaraMesh.position.set(0, 0.052, 0.005)
    headGroup.add(tiaraMesh)

    // --- D. DUAL SCULPTED GOLDEN ROSES OVER TEMPLES ---
    const createTempleRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.009, 10, 10)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const petalGeo = new THREE.CylinderGeometry(0.0048, 0.002, 0.010, 8)
        const petal = new THREE.Mesh(petalGeo, goldMat)
        petal.position.set(Math.cos(angle) * 0.008, Math.sin(angle) * 0.008, 0)
        petal.rotation.z = angle
        g.add(petal)
      }
      return g
    }

    const leftRose = createTempleRose()
    leftRose.position.set(0.069, 0.036, 0.005)
    headGroup.add(leftRose)

    const rightRose = createTempleRose()
    rightRose.position.set(-0.069, 0.036, 0.005)
    headGroup.add(rightRose)

    // --- E. DUAL PROTRUDING GOLDEN THORN HAIRPINS ("The Thorns") ---
    // Angled upwards and backwards (+Z) from the roses
    const stylusShaftGeo = new THREE.CylinderGeometry(0.0013, 0.0022, 0.11, 8)
    const stylusTipGeo = new THREE.ConeGeometry(0.0022, 0.020, 8)

    const createThornHairpin = (isLeft: boolean) => {
      const g = new THREE.Group()
      const shaft = new THREE.Mesh(stylusShaftGeo, goldMat)
      const tip = new THREE.Mesh(stylusTipGeo, goldMat)
      tip.position.y = 0.065
      g.add(shaft)
      g.add(tip)
      // Angle backwards (+Z) and slightly outwards
      g.rotation.x = Math.PI * 0.38
      g.rotation.z = isLeft ? -Math.PI * 0.14 : Math.PI * 0.14
      return g
    }

    const leftPin = createThornHairpin(true)
    leftPin.position.set(0.070, 0.042, 0.015)
    headGroup.add(leftPin)

    const rightPin = createThornHairpin(false)
    rightPin.position.set(-0.070, 0.042, 0.015)
    headGroup.add(rightPin)

    // --- F. DANGLING GOLDEN NEEDLE STILETTO EARRINGS ---
    const createDaggerEarring = () => {
      const g = new THREE.Group()
      const loopGeo = new THREE.TorusGeometry(0.0035, 0.0009, 8, 16)
      const loop = new THREE.Mesh(loopGeo, goldMat)
      g.add(loop)

      const needleGeo = new THREE.ConeGeometry(0.0016, 0.038, 8)
      const needle = new THREE.Mesh(needleGeo, goldMat)
      needle.rotation.x = Math.PI
      needle.position.y = -0.022
      g.add(needle)
      return g
    }

    const leftEarring = createDaggerEarring()
    leftEarring.position.set(0.068, 0.006, 0.008)
    headGroup.add(leftEarring)

    const rightEarring = createDaggerEarring()
    rightEarring.position.set(-0.068, 0.006, 0.008)
    headGroup.add(rightEarring)

    headBone.add(headGroup)
  }
  if (headGroup) headGroup.visible = visible

  // --- G. MIDNIGHT HALTER CHOKER & GOLDEN RING ---
  if (neckBone) {
    let choker = neckBone.getObjectByName('__YOR_CHOKER__') as THREE.Group | undefined
    if (!choker && visible) {
      choker = new THREE.Group()
      choker.name = '__YOR_CHOKER__'

      const leatherMat = new THREE.MeshStandardMaterial({
        color: 0x0A0B0E,
        roughness: 0.35,
        metalness: 0.15,
      })
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xF5C542,
        metalness: 0.95,
        roughness: 0.12,
      })

      const collarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.054, 0.020, 24, 1, true), leatherMat)
      choker.add(collarMesh)

      // Ring positioned at front of neck (-Z)
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0020, 8, 20), goldMat)
      ringMesh.position.set(0, -0.002, -0.052)
      choker.add(ringMesh)

      neckBone.add(choker)
    }
    if (choker) choker.visible = visible
  }

  // --- H. UPPER BICEP LEATHER ARMBANDS ---
  const strapArmMat = new THREE.MeshStandardMaterial({ color: 0x0A0B0E, roughness: 0.35, metalness: 0.15 })
  const attachArmBand = (armBone: THREE.Object3D | null | undefined, name: string) => {
    if (!armBone) return
    let band = armBone.getObjectByName(name)
    if (!band && visible) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.043, 0.012, 20, 1, true), strapArmMat)
      b.name = name
      b.position.set(0, -0.06, 0)
      armBone.add(b)
      band = b
    }
    if (band) band.visible = visible
  }
  attachArmBand(leftArm, '__YOR_ARMBAND_L__')
  attachArmBand(rightArm, '__YOR_ARMBAND_R__')

  // --- I. DUAL GOLDEN NEEDLE STILETTO DAGGERS ("The Thorns") ---
  const goldDaggerMat = new THREE.MeshStandardMaterial({
    color: 0xF5C542,
    metalness: 0.96,
    roughness: 0.10,
  })

  const attachThornDagger = (handBone: THREE.Object3D | null | undefined, name: string) => {
    if (!handBone) return
    let dagger = handBone.getObjectByName(name) as THREE.Group | undefined
    if (!dagger && visible) {
      dagger = new THREE.Group()
      dagger.name = name

      // Stiletto needle pointing down along hand & fingers
      const bladeGeo = new THREE.CylinderGeometry(0.0016, 0.0036, 0.26, 12)
      const blade = new THREE.Mesh(bladeGeo, goldDaggerMat)
      blade.position.y = -0.13
      dagger.add(blade)

      const tipGeo = new THREE.ConeGeometry(0.0036, 0.032, 12)
      const tip = new THREE.Mesh(tipGeo, goldDaggerMat)
      tip.rotation.x = Math.PI
      tip.position.y = -0.275
      dagger.add(tip)

      // Golden finger ring at the hilt
      const ringGeo = new THREE.TorusGeometry(0.014, 0.0026, 8, 24)
      const ring = new THREE.Mesh(ringGeo, goldDaggerMat)
      ring.position.y = 0.012
      dagger.add(ring)

      dagger.position.set(0, -0.04, 0.015)

      handBone.add(dagger)
    }
    if (dagger) dagger.visible = visible
  }

  attachThornDagger(leftHand, '__YOR_DAGGER_L__')
  attachThornDagger(rightHand, '__YOR_DAGGER_R__')
}`;

const startMarker = 'export function attachYorThornPrincessFeatures';
const endMarker = 'export function attachYorHeadbandRose';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + authenticYorFeatures + '\n\n// Backward-compatible alias\n' + code.substring(endIndex);
  fs.writeFileSync(adaRedPath, code, 'utf8');
  console.log('Successfully updated Yor features with precise behind-skull back hair and cheek-framing front locks!');
} else {
  console.error('Markers not found');
}
