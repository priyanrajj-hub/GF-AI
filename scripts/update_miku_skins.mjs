import fs from 'fs';

const filePath = 'apps/web/src/avatar/skins/ada-red.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace the Yor skins section (from '/**\n * Mira / Yor Forger-Inspired' up to 'export const AdaCyberOperativeSkin')
const startYor = code.indexOf('/**\n * Mira / Yor Forger-Inspired Off-The-Shoulder');
const endYor = code.indexOf('export const AdaCyberOperativeSkin');

if (startYor === -1 || endYor === -1) {
  console.error('Could not find Yor skins boundaries:', { startYor, endYor });
  process.exit(1);
}

const mikuSkinsBlock = `/**
 * Hatsune Miku • Classic Vocaloid Pop Idol (Official V4X Outfit)
 * - Signature knee-length twin cyan pigtails (#00E5FF / #39C5BB)
 * - Square black/magenta ribbons at the twintail bases
 * - Cyber idol headset with microphone boom
 * - Sleek silver sleeveless top with cyan collar and turquoise necktie with tie-clip
 * - Detached synthesizer arm-warmers with LED equalizer panels
 * - Black pleated skirt with cyan trim lining and yellow belt
 * - Thigh-high boots with cyan soles
 * - Red "01" Vocaloid tattoo decal on left upper arm
 */
export const MikuClassicIdolSkin: AvatarSkin = {
  id: 'miku-classic-idol',
  name: 'Hatsune Miku • Classic Vocaloid Diva (Official V4X Outfit)',
  description: 'Signature twin cyan pigtails, square ribbons, silver top, turquoise tie, detached synth sleeves, pleated skirt, thigh-high boots, and 01 tattoo.',
  apply: (vrm: VRM) => {
    attachAdaTacticalAccessories(vrm, false)
    attachYorThornPrincessFeatures(vrm, false)
    attachStarkTechGlassesAndBeard(vrm, false)

    const chestEmblem = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
    if (chestEmblem) {
      const em = chestEmblem.getObjectByName('__STARK_ARC_REACTOR__')
      if (em) em.visible = false
    }

    const isNativeMiku = Boolean(
      (vrm.meta?.title && (vrm.meta.title.includes('ミク') || vrm.meta.title.includes('Miku'))) ||
      vrm.scene.getObjectByName('右髪１')
    )

    if (isNativeMiku) {
      // Native Tda Hatsune Miku: keep textures pristine & vivid
      vrm.scene.traverse((obj) => {
        obj.visible = true
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          mesh.frustumCulled = false
          mesh.castShadow = true
          mesh.receiveShadow = true
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat: any) => {
            if (!mat) return
            mat.transparent = false
            mat.opacity = 1.0
            mat.depthWrite = true
          })
        }
      })
      attachMikuVocaloidFeatures(vrm, false)
      return
    }

    // Fallback on Ada base VRM:
    attachMikuVocaloidFeatures(vrm, true)

    vrm.scene.traverse((obj) => {
      // Hide Ada ribbons & side braids
      if (/hair[2-8]_[LR]|mituami|ribbon|cloth_ribbon/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Sleek silver sleeveless top (#D9DEE8)
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#D9DEE8')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#8B92A2')
            if (mat.roughness !== undefined) mat.roughness = 0.32
            if (mat.metalness !== undefined) mat.metalness = 0.40
          }

          // Signature Hatsune Miku vibrant cyan/teal hair (#00E5FF / #39C5BB)
          if (/hair/i.test(matName)) {
            if (mat.color) mat.color.set('#00E5FF')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#008899')
            if (mat.roughness !== undefined) mat.roughness = 0.25
          }

          // Teal anime eyes (#00E5FF)
          if (/eye|iris/i.test(matName)) {
            if (mat.color) mat.color.set('#00E5FF')
          }
        })
      }
    })
  },
}

/**
 * Hatsune Miku • Magical Mirai Concert Diva
 * - Vivid iridescent cyan and hot magenta stage aesthetic
 * - Luminous stage glow and audio-reactive equalizer accents
 */
export const MikuMagicalMiraiSkin: AvatarSkin = {
  id: 'miku-magical-mirai',
  name: 'Hatsune Miku • Magical Mirai Concert Diva',
  description: 'Concert tour diva edition with iridescent cyan, hot magenta accents, and luminous stage presence.',
  apply: (vrm: VRM) => {
    MikuClassicIdolSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          if (/wear|cloth|dress/i.test(mat.name || '')) {
            if (mat.color) mat.color.set('#1A1528')
            if (mat.roughness !== undefined) mat.roughness = 0.20
            if (mat.metalness !== undefined) mat.metalness = 0.60
          }
        })
      }
    })
  },
}

/**
 * Hatsune Miku • Cyber Diva (Synthwave Hologram)
 * - Digital glowing cyan & neon purple synthwave aesthetic
 */
export const MikuCyberDivaSkin: AvatarSkin = {
  id: 'miku-cyber-diva',
  name: 'Hatsune Miku • Cyber Synthwave Diva',
  description: 'Futuristic holographic synthwave aesthetic with neon cyan and electric violet pulses.',
  apply: (vrm: VRM) => {
    MikuClassicIdolSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          if (/hair/i.test(mat.name || '')) {
            if (mat.color) mat.color.set('#00F3FF')
          }
        })
      }
    })
  },
}

/**
 * Hatsune Miku • Sakura Miku (Cherry Blossom Edition)
 * - Pastel pink twintails and delicate floral cherry blossom aesthetic
 */
export const MikuSakuraSkin: AvatarSkin = {
  id: 'miku-sakura',
  name: 'Hatsune Miku • Sakura Miku (Cherry Blossom)',
  description: 'Spring cherry blossom edition with delicate pastel pink twintails and floral accents.',
  apply: (vrm: VRM) => {
    MikuClassicIdolSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          if (/hair/i.test(mat.name || '')) {
            if (mat.color) mat.color.set('#FFB7C5') // Sakura pink
          }
        })
      }
    })
  },
}

// Backward-compatible aliases
export const YorCrimsonSweaterSkin: AvatarSkin = MikuClassicIdolSkin;
export const YorThornPrincessSkin: AvatarSkin = MikuClassicIdolSkin;
export const YorBerlintGalaSkin: AvatarSkin = MikuMagicalMiraiSkin;

`;

code = code.substring(0, startYor) + mikuSkinsBlock + code.substring(endYor);
console.log('Successfully replaced Yor skins with Miku skins!');

// 2. Add attachMikuVocaloidFeatures right before attachYorThornPrincessFeatures
const yorFeaturesMarker = 'export function attachYorThornPrincessFeatures';
const mikuFeaturesCode = `/**
 * Attaches Hatsune Miku's iconic Vocaloid accessories:
 * 1. Long twin cyan/turquoise pigtails with natural idol curves & joints
 * 2. Futuristic square black/magenta hair clips/ribbons at the twintail bases
 * 3. Cyber idol headset with microphone boom curving to the cheek
 * 4. Turquoise necktie with metallic tie-clip
 * 5. Detached cyber synthesizer arm warmers / sleeves with LED digital equalizer display
 * 6. Red "01" Vocaloid tattoo decal on the left upper arm
 */
export function attachMikuVocaloidFeatures(vrm: VRM, visible: boolean = true): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  const chestBone = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
  const lArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
  const lForearm = vrm.humanoid?.getNormalizedBoneNode('leftLowerArm')
  const rForearm = vrm.humanoid?.getNormalizedBoneNode('rightLowerArm')

  if (!headBone) return

  const isNativeMiku = Boolean(
    (vrm.meta?.title && (vrm.meta.title.includes('ミク') || vrm.meta.title.includes('Miku'))) ||
    vrm.scene.getObjectByName('右髪１')
  )

  let headGroup = headBone.getObjectByName('__MIKU_HEAD_ASSEMBLY__') as THREE.Group | undefined
  if (!headGroup && visible && !isNativeMiku) {
    headGroup = new THREE.Group()
    headGroup.name = '__MIKU_HEAD_ASSEMBLY__'

    const cyanHairMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      roughness: 0.28,
      metalness: 0.12,
    })

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.35,
      metalness: 0.20,
    })
    const magentaTrimMat = new THREE.MeshStandardMaterial({
      color: 0xFF007F,
      roughness: 0.20,
      metalness: 0.30,
      emissive: new THREE.Color(0xFF007F),
      emissiveIntensity: 0.25,
    })

    const headsetMat = new THREE.MeshStandardMaterial({
      color: 0x1A1D24,
      metalness: 0.85,
      roughness: 0.25,
    })
    const ledCyanMat = new THREE.MeshStandardMaterial({
      color: 0x39C5BB,
      emissive: new THREE.Color(0x39C5BB),
      emissiveIntensity: 0.6,
      roughness: 0.1,
    })

    // Twin cyan pigtails
    const buildTwintail = (isLeft: boolean) => {
      const tail = new THREE.Group()
      tail.name = isLeft ? '__MIKU_TAIL_L__' : '__MIKU_TAIL_R__'
      const sign = isLeft ? 1 : -1

      const clipBox = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.038, 0.032), ribbonMat)
      clipBox.position.set(0, 0, 0)
      tail.add(clipBox)

      const trimBox = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.040, 0.008), magentaTrimMat)
      trimBox.position.set(0, 0, 0.016)
      tail.add(trimBox)

      const segments = 8
      let parentObj: THREE.Object3D = tail
      for (let s = 0; s < segments; s++) {
        const segGroup = new THREE.Group()
        segGroup.name = \`__MIKU_SEG_\${isLeft ? 'L' : 'R'}_\${s}__\`
        const segLen = 0.095
        const t = s / segments
        const topRadius = 0.024 * (1.0 - t * 0.45)
        const bottomRadius = 0.024 * (1.0 - (s + 1) / segments * 0.45)

        const segGeo = new THREE.CylinderGeometry(bottomRadius, topRadius, segLen, 12)
        const segMesh = new THREE.Mesh(segGeo, cyanHairMat)
        segMesh.position.y = -segLen * 0.5
        segGroup.add(segMesh)

        segGroup.position.set(
          s === 0 ? sign * 0.015 : sign * 0.006 * (1.0 - t),
          s === 0 ? -0.02 : -segLen,
          s === 0 ? 0.01 : 0.004
        )
        segGroup.rotation.z = sign * (0.12 - t * 0.04)

        parentObj.add(segGroup)
        parentObj = segGroup
      }

      tail.position.set(sign * 0.088, 0.065, 0.020)
      return tail
    }

    headGroup.add(buildTwintail(true))
    headGroup.add(buildTwintail(false))

    // Headset
    const headsetBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.088, 0.004, 8, 32, Math.PI),
      headsetMat
    )
    headsetBand.rotation.x = -Math.PI / 2
    headsetBand.position.set(0, 0.045, 0.008)
    headGroup.add(headsetBand)

    const createEarPad = (isLeft: boolean) => {
      const g = new THREE.Group()
      const sign = isLeft ? 1 : -1
      const earPad = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.022, 0.014, 16), headsetMat)
      earPad.rotation.z = Math.PI / 2
      g.add(earPad)

      const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0025, 8, 20), ledCyanMat)
      ledRing.rotation.y = Math.PI / 2
      ledRing.position.x = sign * 0.008
      g.add(ledRing)

      g.position.set(sign * 0.085, 0.015, -0.005)

      if (isLeft) {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.085, 8), headsetMat)
        boom.rotation.z = -0.75
        boom.rotation.y = 0.55
        boom.position.set(-0.028, -0.035, -0.035)
        g.add(boom)

        const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 8), ledCyanMat)
        micTip.position.set(-0.055, -0.065, -0.068)
        g.add(micTip)
      }
      return g
    }
    headGroup.add(createEarPad(true))
    headGroup.add(createEarPad(false))

    headBone.add(headGroup)
  }
  if (headGroup) headGroup.visible = visible && !isNativeMiku

  // Chest Necktie
  if (chestBone && !isNativeMiku) {
    let tie = chestBone.getObjectByName('__MIKU_CHEST_TIE__') as THREE.Group | undefined
    if (!tie && visible) {
      tie = new THREE.Group()
      tie.name = '__MIKU_CHEST_TIE__'

      const tieMat = new THREE.MeshStandardMaterial({
        color: 0x00E5FF,
        roughness: 0.35,
        metalness: 0.15,
      })
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xD0D4DC,
        metalness: 0.90,
        roughness: 0.20,
      })

      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.014), tieMat)
      knot.position.set(0, 0.11, -0.075)
      tie.add(knot)

      const tieBody = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.16, 0.006), tieMat)
      tieBody.position.set(0, 0.02, -0.082)
      tie.add(tieBody)

      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.008), silverMat)
      clip.position.set(0, 0.05, -0.084)
      tie.add(clip)

      chestBone.add(tie)
    }
    if (tie) tie.visible = visible
  }

  // Red "01" Tattoo Decal on Left Shoulder
  if (lArm && !isNativeMiku) {
    let tattoo = lArm.getObjectByName('__MIKU_01_TATTOO__') as THREE.Mesh | undefined
    if (!tattoo && visible) {
      const tattooMat = new THREE.MeshStandardMaterial({
        color: 0xFF0033,
        emissive: new THREE.Color(0xFF0033),
        emissiveIntensity: 0.45,
        roughness: 0.2,
      })
      tattoo = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.018), tattooMat)
      tattoo.name = '__MIKU_01_TATTOO__'
      tattoo.position.set(0.046, -0.035, 0)
      tattoo.rotation.y = Math.PI / 2
      lArm.add(tattoo)
    }
    if (tattoo) tattoo.visible = visible
  }

  // Detached Synthesizer Sleeves
  const synthSleeveMat = new THREE.MeshStandardMaterial({
    color: 0x1A1C23,
    roughness: 0.35,
    metalness: 0.25,
  })
  const synthLedMat = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    emissive: new THREE.Color(0x00E5FF),
    emissiveIntensity: 0.70,
  })

  const attachSynthSleeve = (forearmBone: THREE.Object3D | null | undefined, name: string) => {
    if (!forearmBone || isNativeMiku) return
    let sleeve = forearmBone.getObjectByName(name) as THREE.Group | undefined
    if (!sleeve && visible) {
      sleeve = new THREE.Group()
      sleeve.name = name

      const sleeveMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.062, 0.20, 20, 1, true),
        synthSleeveMat
      )
      sleeveMesh.position.set(0, -0.09, 0)
      sleeve.add(sleeveMesh)

      const eqPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.024, 0.07),
        synthLedMat
      )
      eqPanel.position.set(0, -0.08, -0.052)
      sleeve.add(eqPanel)

      forearmBone.add(sleeve)
    }
    if (sleeve) sleeve.visible = visible
  }

  attachSynthSleeve(lForearm, '__MIKU_SLEEVE_L__')
  attachSynthSleeve(rForearm, '__MIKU_SLEEVE_R__')
}

`;

code = code.replace(yorFeaturesMarker, mikuFeaturesCode + yorFeaturesMarker);
console.log('Successfully added attachMikuVocaloidFeatures!');

// 3. Update applyCharacterPhysicalTransformation for 'mira'
const charMiraMarker = "} else if (char === 'mira') {";
const nextCharMarker = "} else {\n    // 👩‍💼 ADA (COACH & TUTOR):";

const startMira = code.indexOf(charMiraMarker);
const endMira = code.indexOf(nextCharMarker);

if (startMira === -1 || endMira === -1) {
  console.error('Could not find char === mira boundaries:', { startMira, endMira });
  process.exit(1);
}

const mikuPhysicalTransformation = `} else if (char === 'mira') {
    // 🎤 HATSUNE MIKU (初音ミク): Slender Youthful Pop Idol Poise (158cm / 5'2")
    const isNativeMiku = Boolean(
      (vrm.meta?.title && (vrm.meta.title.includes('ミク') || vrm.meta.title.includes('Miku'))) ||
      vrm.scene.getObjectByName('右髪１')
    )

    if (isNativeMiku) {
      // Native Tda Miku model: perfect natural proportions
      if (head) head.scale.set(1.0, 1.0, 1.0)
      if (neck) neck.scale.set(1.0, 1.0, 1.0)
      if (chest) chest.scale.set(1.0, 1.0, 1.0)
      if (hips) hips.scale.set(1.0, 1.0, 1.0)
    } else {
      // Fallback Ada base: slender youthful pop idol frame
      if (leftShoulder) leftShoulder.scale.set(0.92, 0.95, 0.92)
      if (rightShoulder) rightShoulder.scale.set(0.92, 0.95, 0.92)
      if (chest) chest.scale.set(0.95, 0.96, 0.95)
      if (upperChest) upperChest.scale.set(0.95, 0.96, 0.95)
      if (spine) spine.scale.set(0.95, 1.00, 0.95)
      if (hips) hips.scale.set(0.95, 1.00, 0.95)
      if (leftUpperArm) leftUpperArm.scale.set(0.90, 1.00, 0.90)
      if (rightUpperArm) rightUpperArm.scale.set(0.90, 1.00, 0.90)
      if (leftLowerArm) leftLowerArm.scale.set(0.90, 1.00, 0.90)
      if (rightLowerArm) rightLowerArm.scale.set(0.90, 1.00, 0.90)
      if (neck) neck.scale.set(0.98, 1.00, 0.98)
      if (head) head.scale.set(1.02, 1.02, 1.02)
    }

    // Detach other character assets
    attachStarkTechGlassesAndBeard(vrm, false)
    attachAdaTacticalAccessories(vrm, false)
    attachYorThornPrincessFeatures(vrm, false)

    const chestBone = humanoid.getNormalizedBoneNode('chest') || humanoid.getNormalizedBoneNode('upperChest')
    if (chestBone) {
      const emblem = chestBone.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }

    MikuClassicIdolSkin.apply(vrm)
  `;

code = code.substring(0, startMira) + mikuPhysicalTransformation + code.substring(endMira);
console.log('Successfully updated applyCharacterPhysicalTransformation for Hatsune Miku!');

// 4. Update AVATAR_SKINS map
const avatarSkinsMarker = 'export const AVATAR_SKINS: Record<string, AvatarSkin> = {';
const skinsMapReplacement = `export const AVATAR_SKINS: Record<string, AvatarSkin> = {
  // Hatsune Miku Skins
  'miku-classic-idol': MikuClassicIdolSkin,
  'miku-magical-mirai': MikuMagicalMiraiSkin,
  'miku-cyber-diva': MikuCyberDivaSkin,
  'miku-sakura': MikuSakuraSkin,

  // Legacy Yor aliases
  'yor-thorn-princess': MikuClassicIdolSkin,
  'yor-crimson-sweater': MikuMagicalMiraiSkin,
  'yor-berlint-gala': MikuCyberDivaSkin,
`;

code = code.replace(avatarSkinsMarker, skinsMapReplacement);
console.log('Successfully updated AVATAR_SKINS map!');

fs.writeFileSync(filePath, code);
console.log('Saved updated ada-red.ts!');
