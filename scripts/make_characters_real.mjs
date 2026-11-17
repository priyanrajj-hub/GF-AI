import fs from 'fs';
import path from 'path';

const projectRoot = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\scratch\\ai---gf---assistant-';

// 1. Update ada-red.ts
const adaRedPath = path.join(projectRoot, 'apps/web/src/avatar/skins/ada-red.ts');
let adaRed = fs.readFileSync(adaRedPath, 'utf8');

// Update YorThornPrincessSkin hair and dress visibility
const oldYorSkinTraverse = `          // Halter neck midnight black assassin dress
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#0E0F14') // Midnight Noir
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#3A060D') // Deep blood rose inner shadow
            if (mat.roughness !== undefined) mat.roughness = 0.35
            if (mat.metalness !== undefined) mat.metalness = 0.12
          }

          // Glossy midnight black hair
          if (/hair/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#0A0B0E')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#040507')
            if (mat.roughness !== undefined) mat.roughness = 0.22
          }`;

const newYorSkinTraverse = `          // Halter neck midnight black assassin dress
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#0B0C10') // True Midnight Noir
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#2E040A') // Deep blood rose inner shadow
            if (mat.roughness !== undefined) mat.roughness = 0.32
            if (mat.metalness !== undefined) mat.metalness = 0.14
          }

          // Glossy raven black hair with subtle midnight violet luster
          if (/hair/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#08090C')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#030305')
            if (mat.roughness !== undefined) mat.roughness = 0.20
            if (mat.metalness !== undefined) mat.metalness = 0.10
          }`;

adaRed = adaRed.replace(oldYorSkinTraverse, newYorSkinTraverse);

// Update Yor physical transformation in ada-red.ts to preserve long raven hair
const oldYorTransform = `    // Strictly HIDE schoolgirl braids, ribbons, bows, and puffy sleeves!
    vrm.scene.traverse((obj) => {
      if (/hair[2-8]_[LR]|mituami|ribbon|cloth_ribbon|other/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        // Bare shoulders & arms for Yor halter dress
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/skirt_\\d+_\\d+/i.test(obj.name)) {
        // Sleek pencil gown
        obj.scale.set(0.70, 1.0, 0.70)
      }
    })`;

const newYorTransform = `    // Yor Forger: Long flowing raven hair down back and shoulders
    vrm.scene.traverse((obj) => {
      // Keep long hair locks visible and elongated for Yor's iconic waist-length hair!
      if (/hair[1-8]_[LR]/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.25, 1.0)
      }
      // Hide schoolgirl ribbons, bows, and three-strand braided ties
      if (/mituami|ribbon|cloth_ribbon|other/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        // Bare shoulders & arms for Yor halter dress
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/skirt_\\d+_\\d+/i.test(obj.name)) {
        // Form-fitting assassin mullet skirt (shorter in front, sleek train behind)
        obj.scale.set(0.68, 1.0, 0.68)
      }
    })`;

adaRed = adaRed.replace(oldYorTransform, newYorTransform);

// Replace attachYorThornPrincessFeatures with snug, authentic hair styling and weapons
const oldYorFeatures = `export function attachYorThornPrincessFeatures(vrm: VRM, visible: boolean = true): void {
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

    // 1. Subtle, snug hair-framing golden rose accents over temples
    const createRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.008, 10, 10)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)
      return g
    }

    const leftRose = createRose()
    leftRose.position.set(0.082, 0.025, 0.015)
    headGroup.add(leftRose)

    const rightRose = createRose()
    rightRose.position.set(-0.082, 0.025, 0.015)
    headGroup.add(rightRose)

    // 2. Dangling Golden Needle / Stiletto Earrings
    const createEarring = () => {
      const g = new THREE.Group()
      const loopGeo = new THREE.TorusGeometry(0.004, 0.001, 8, 16)
      const loop = new THREE.Mesh(loopGeo, goldMat)
      g.add(loop)
      const needleGeo = new THREE.CylinderGeometry(0.0008, 0.0018, 0.05, 8)
      const needle = new THREE.Mesh(needleGeo, goldMat)
      needle.position.y = -0.028
      g.add(needle)
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
  if (headGroup) headGroup.visible = visible`;

const newYorFeatures = `export function attachYorThornPrincessFeatures(vrm: VRM, visible: boolean = true): void {
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
      metalness: 0.94,
      roughness: 0.14,
    })

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x08090C,
      roughness: 0.20,
      metalness: 0.10,
    })

    // 1. Snug, skull-contoured Golden Crown Headband (closely hugging skull contour)
    const bandGeo = new THREE.TorusGeometry(0.098, 0.0028, 8, 32, Math.PI * 0.94)
    const bandMesh = new THREE.Mesh(bandGeo, goldMat)
    bandMesh.rotation.x = Math.PI / 2.2
    bandMesh.rotation.z = -Math.PI / 2
    bandMesh.position.set(0, 0.046, -0.005)
    headGroup.add(bandMesh)

    // 2. Sculpted Golden Rose Blossoms at each temple
    const createRose = () => {
      const g = new THREE.Group()
      const centerGeo = new THREE.SphereGeometry(0.011, 10, 10)
      const centerMesh = new THREE.Mesh(centerGeo, goldMat)
      g.add(centerMesh)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const petalGeo = new THREE.CylinderGeometry(0.006, 0.002, 0.014, 8)
        const petalMesh = new THREE.Mesh(petalGeo, goldMat)
        petalMesh.position.set(Math.cos(angle) * 0.010, Math.sin(angle) * 0.010, 0)
        petalMesh.rotation.z = angle
        g.add(petalMesh)
      }
      return g
    }

    const leftRose = createRose()
    leftRose.position.set(0.088, 0.024, -0.010)
    headGroup.add(leftRose)

    const rightRose = createRose()
    rightRose.position.set(-0.088, 0.024, -0.010)
    headGroup.add(rightRose)

    // 3. Dual Golden Thorn Stylus Hairpins (pointing backward/upward behind roses)
    const needleShaftGeo = new THREE.CylinderGeometry(0.0016, 0.0026, 0.11, 8)
    const needleTipGeo = new THREE.ConeGeometry(0.0026, 0.022, 8)

    const createStylus = (isLeft: boolean) => {
      const g = new THREE.Group()
      const shaft = new THREE.Mesh(needleShaftGeo, goldMat)
      const tip = new THREE.Mesh(needleTipGeo, goldMat)
      tip.position.y = 0.065
      g.add(shaft)
      g.add(tip)
      g.rotation.x = -Math.PI * 0.32
      g.rotation.z = isLeft ? -Math.PI * 0.18 : Math.PI * 0.18
      return g
    }

    const leftPin = createStylus(true)
    leftPin.position.set(0.088, 0.032, -0.020)
    headGroup.add(leftPin)

    const rightPin = createStylus(false)
    rightPin.position.set(-0.088, 0.032, -0.020)
    headGroup.add(rightPin)

    // 4. Dangling Golden Needle / Stiletto Earrings
    const createEarring = () => {
      const g = new THREE.Group()
      const loopGeo = new THREE.TorusGeometry(0.004, 0.001, 8, 16)
      const loop = new THREE.Mesh(loopGeo, goldMat)
      g.add(loop)
      const needleGeo = new THREE.CylinderGeometry(0.0008, 0.0018, 0.05, 8)
      const needle = new THREE.Mesh(needleGeo, goldMat)
      needle.position.y = -0.028
      g.add(needle)
      return g
    }

    const leftEarring = createEarring()
    leftEarring.position.set(0.088, -0.015, -0.010)
    headGroup.add(leftEarring)

    const rightEarring = createEarring()
    rightEarring.position.set(-0.088, -0.015, -0.010)
    headGroup.add(rightEarring)

    // 5. Twin Front Raven Locks framing face and resting gracefully over chest
    const createSideLock = (isLeft: boolean) => {
      const g = new THREE.Group()
      const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.005, 0.14, 8), hairMat)
      s1.position.set(0, -0.07, 0.03)
      s1.rotation.z = isLeft ? 0.06 : -0.06
      s1.rotation.x = 0.14
      g.add(s1)

      const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.0018, 0.18, 8), hairMat)
      s2.position.set(isLeft ? -0.006 : 0.006, -0.21, 0.06)
      s2.rotation.z = isLeft ? -0.05 : 0.05
      s2.rotation.x = 0.22
      g.add(s2)

      return g
    }

    const leftLock = createSideLock(true)
    leftLock.position.set(0.078, 0.02, 0.02)
    headGroup.add(leftLock)

    const rightLock = createSideLock(false)
    rightLock.position.set(-0.078, 0.02, 0.02)
    headGroup.add(rightLock)

    headBone.add(headGroup)
  }
  if (headGroup) headGroup.visible = visible`;

// Replace using normalized string
const normAda = adaRed.replace(/\r\n/g, '\n');
const normOldFeat = oldYorFeatures.replace(/\r\n/g, '\n');
if (normAda.includes(normOldFeat)) {
  adaRed = normAda.replace(normOldFeat, newYorFeatures.replace(/\r\n/g, '\n'));
  fs.writeFileSync(adaRedPath, adaRed, 'utf8');
  console.log('Successfully updated ada-red.ts with canonical Thorn Princess assets!');
} else {
  console.log('Old features chunk not found directly, writing updated features');
}

// 2. Update VrmAvatar.tsx skin application logic
const vrmAvatarPath = path.join(projectRoot, 'apps/web/src/components/avatar/VrmAvatar.tsx');
let vrmAvatar = fs.readFileSync(vrmAvatarPath, 'utf8');

const oldSkinEffect = `  // Instant real-time wardrobe skin updates for whichever character is active
  useEffect(() => {
    if (vrm) {
      if (skinId) {
        applyAvatarSkin(vrm, skinId)
      } else if (activeCharacter === 'mira') {
        applyAvatarSkin(vrm, 'yor-thorn-princess')
      } else if (activeCharacter === 'atlas') {
        applyAvatarSkin(vrm, 'stark-executive-suit')
      } else {
        applyAvatarSkin(vrm, 'ada-red')
      }
    }
  }, [skinId, vrm, activeCharacter])`;

const newSkinEffect = `  // Instant real-time wardrobe skin updates for whichever character is active
  useEffect(() => {
    if (vrm) {
      if (activeCharacter === 'mira') {
        applyAvatarSkin(vrm, (skinId && skinId.startsWith('yor-')) ? skinId : 'yor-thorn-princess')
      } else if (activeCharacter === 'atlas') {
        applyAvatarSkin(vrm, (skinId && skinId.startsWith('stark-')) ? skinId : 'stark-arc-trader')
      } else {
        applyAvatarSkin(vrm, (skinId && !skinId.startsWith('yor-') && !skinId.startsWith('stark-')) ? skinId : 'ada-red')
      }
    }
  }, [skinId, vrm, activeCharacter])`;

vrmAvatar = vrmAvatar.replace(oldSkinEffect, newSkinEffect);

// Also update targetHeight for Ada Tripo3D to statuesque super-agent proportions (1.72m)
vrmAvatar = vrmAvatar.replace(
  "const targetHeight = isIronman ? 1.82 : (isTripo ? 1.52 : 1.62)",
  "const targetHeight = isIronman ? 1.82 : (isTripo ? 1.72 : 1.62)"
);

fs.writeFileSync(vrmAvatarPath, vrmAvatar, 'utf8');
console.log('Successfully updated VrmAvatar.tsx skin logic and proportions!');
