import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import { WardrobeProvider } from '@ada/shared'

export interface AvatarSkin {
  id: string
  name: string
  description: string
  apply: (vrm: VRM) => void
}

/**
 * Ada Spy-Chic Red & Black Signature Skin
 * Transforms pastel anime models into an elegant, sharp spy-chic operative:
 * - Hides oversized bows & pastel frills
 * - Near-black charcoal hair (#111218) with subtle sheen
 * - Deep crimson red dress & sleeves (#B0101E / #C1121F) with dark velvet shading
 * - Natural skin tones with confident lip accent
 */
export const AdaRedSkin: AvatarSkin = {
  id: 'ada-red',
  name: 'Ada Spy-Chic (Red & Black)',
  description: 'Signature crimson red dress, black hair, and hidden ribbon accessories.',
  apply: (vrm: VRM) => {
    attachStarkTechGlassesAndBeard(vrm, false)
    attachYorHeadbandRose(vrm, false)
    const chest = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
    if (chest) {
      const emblem = chest.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }
    const scene = vrm.scene

    scene.traverse((obj) => {
      // Hide three-strand braids (mituami), ribbons, and long side-strands to leave sleek chin-length Ada bob
      if (/mituami|ribbon|hair[2-8]_[LR]/i.test(obj.name)) {
        obj.scale.set(0, 0, 0)
        obj.visible = false
      }

      // Hide hair bow sub-mesh on bangs if separated
      if (obj.name.toLowerCase().includes('flonthairbaked_2') || obj.name.toLowerCase().includes('flonthair_2')) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }

      // Hide oversized bows, extra accessories, and flared tulip ruffle layers
      if (
        /other|cloth1|cloth2/i.test(obj.name) ||
        obj.name.toLowerCase().includes('cloth_ribbon')
      ) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }

      // Scale flared skirt bones inward to form a sleek pencil-cut cocktail dress
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        obj.scale.set(0.72, 1.0, 0.72)
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Hide hair bow / accessory materials
          if (/hair_wear|other_zwrite|ribbon/i.test(matName)) {
            mat.visible = false
            mat.opacity = 0
            mat.transparent = true
            return
          }

          // Hair Materials -> Glossy Near-Black with Blue-White Sheen Band (Task A)
          if (/hair/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#15151A')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0b0b0f')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#040406')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#0b0b0f')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#040406')
            if (mat.roughness !== undefined) mat.roughness = 0.28
            if (mat.metalness !== undefined) mat.metalness = 0.15
          }

          // Gloves & Halter Straps -> Sleek Midnight Spy Black with subtle specular
          else if (/body_wear|glove/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#111216')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#060609')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#000000')
            if (mat.roughness !== undefined) mat.roughness = 0.38
            if (mat.metalness !== undefined) mat.metalness = 0.25
          }

          // Semi-Sheer Black Stockings / Tights -> Leg silhouette reads clearly
          else if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = true
            mat.opacity = 0.88
            if (mat.color) mat.color.set('#141418')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#09090c')
            if (mat.roughness !== undefined) mat.roughness = 0.42
          }

          // Main Cocktail Dress Bodice & Skirt -> Rich Vibrant Crimson Red (#C81E2F) with Toon Shade Step
          else if (/wear|cloth|dress/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#C81E2F')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#5c0912')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#280205')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#5c0912')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#280205')
            if (mat.roughness !== undefined) mat.roughness = 0.42
            if (mat.metalness !== undefined) mat.metalness = 0.12
          }

          // Eyelashes & Eyeliner -> Bold Inky Black Cat-Eye
          else if (/mastuge/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#000000')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#000000')
          }

          // Eyes -> Alluring Amber-Hazel with Golden Depth
          else if (/eye/i.test(matName) && !/white/i.test(matName)) {
            if (mat.color) mat.color.set('#9e5124')
          }

          // Face Texture -> Dynamic Canvas Enhancement for Ruby Lips & Soft Blush
          else if (/alicia_face\b/i.test(matName)) {
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#f5ded6')
            if (mat.map && mat.map.image && !mat.userData.__adaMakeupApplied && typeof document !== 'undefined') {
              try {
                const img = mat.map.image
                if (img.width && img.height) {
                  const canvas = document.createElement('canvas')
                  canvas.width = 1024
                  canvas.height = 1024
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, 1024, 1024)

                    // 1. Mature Sculpted Cheekbone Contour & Rosy-Peach Blush
                    const gradL = ctx.createRadialGradient(380, 460, 4, 380, 460, 50)
                    gradL.addColorStop(0, 'rgba(235, 95, 115, 0.42)')
                    gradL.addColorStop(0.6, 'rgba(215, 80, 100, 0.18)')
                    gradL.addColorStop(1, 'rgba(215, 80, 100, 0)')
                    ctx.fillStyle = gradL
                    ctx.beginPath()
                    ctx.arc(380, 460, 50, 0, Math.PI * 2)
                    ctx.fill()

                    const gradR = ctx.createRadialGradient(644, 460, 4, 644, 460, 50)
                    gradR.addColorStop(0, 'rgba(235, 95, 115, 0.42)')
                    gradR.addColorStop(0.6, 'rgba(215, 80, 100, 0.18)')
                    gradR.addColorStop(1, 'rgba(215, 80, 100, 0)')
                    ctx.fillStyle = gradR
                    ctx.beginPath()
                    ctx.arc(644, 460, 50, 0, Math.PI * 2)
                    ctx.fill()

                    // 2. Mature Cat-Eye Eyeliner & Winged Depth (Above Upper Lash Line)
                    ctx.fillStyle = 'rgba(15, 15, 20, 0.88)'
                    // Left Eye Upper Wing
                    ctx.beginPath()
                    ctx.moveTo(330, 395)
                    ctx.quadraticCurveTo(365, 375, 415, 390)
                    ctx.quadraticCurveTo(365, 380, 330, 395)
                    ctx.fill()
                    // Right Eye Upper Wing
                    ctx.beginPath()
                    ctx.moveTo(694, 395)
                    ctx.quadraticCurveTo(659, 375, 609, 390)
                    ctx.quadraticCurveTo(659, 380, 694, 395)
                    ctx.fill()

                    // 3. Sophisticated Mature Ruby-Velvet Lips (Fuller Cupid's Bow & Satin Depth)
                    ctx.fillStyle = 'rgba(175, 10, 28, 0.95)'
                    ctx.beginPath()
                    ctx.moveTo(476, 594)
                    ctx.quadraticCurveTo(494, 580, 505, 586)
                    ctx.quadraticCurveTo(512, 590, 519, 586)
                    ctx.quadraticCurveTo(530, 580, 548, 594)
                    ctx.quadraticCurveTo(534, 614, 512, 615)
                    ctx.quadraticCurveTo(490, 614, 476, 594)
                    ctx.closePath()
                    ctx.fill()

                    // Inner velvet depth
                    ctx.fillStyle = 'rgba(105, 5, 15, 0.90)'
                    ctx.beginPath()
                    ctx.ellipse(512, 597, 25, 5.5, 0, 0, Math.PI * 2)
                    ctx.fill()

                    // Elegant lower-lip satin gloss highlight
                    ctx.fillStyle = 'rgba(255, 230, 240, 0.65)'
                    ctx.beginPath()
                    ctx.ellipse(512, 605, 12, 3.5, 0, 0, Math.PI * 2)
                    ctx.fill()

                    const newTex = new THREE.CanvasTexture(canvas)
                    newTex.flipY = mat.map.flipY
                    newTex.colorSpace = THREE.SRGBColorSpace
                    newTex.needsUpdate = true
                    mat.map = newTex
                    mat.needsUpdate = true
                    mat.userData.__adaMakeupApplied = true
                  }
                }
              } catch (e) {
                console.warn('[Ada Skin] Failed to apply face makeup canvas overlay:', e)
              }
            }
          }
        })
      }
    })
  },
}

/**
 * Cozy Night Mode Pajamas Skin
 */
export const CozyNightSkin: AvatarSkin = {
  id: 'cozy-night',
  name: 'Cozy Night (Plum & Slate)',
  description: 'Relaxed evening tones with soft charcoal and lavender plum.',
  apply: (vrm: VRM) => {
    vrm.scene.traverse((obj) => {
      if (/ribbon|other|bow/i.test(obj.name)) obj.visible = false
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          if (/hair_wear|other/i.test(matName)) {
            mat.visible = false
            return
          }
          if (/hair/i.test(matName) && mat.color) mat.color.set('#181822')
          if (/wear|cloth/i.test(matName) && mat.color) mat.color.set('#4c2852')
        })
      }
    })
  },
}

/**
 * Original Default Skin (Preserved as option)
 */
export const OriginalPastelSkin: AvatarSkin = {
  id: 'original-pastel',
  name: 'Original Sample (Pastel Blue)',
  description: 'Default sample avatar colors with bow visible.',
  apply: (vrm: VRM) => {
    vrm.scene.traverse((obj) => {
      obj.visible = true
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          mat.visible = true
        })
      }
    })
  },
}

/**
 * Ada Original Signature Skin (Ribbed Burgundy Turtleneck & Tactical Harness)
 * Milestone 1 / Round 9 default skin
 */
export const CrimsonTurtleneckSkin: AvatarSkin = {
  id: 'crimson_turtleneck',
  name: 'Ada Original (Crimson Turtleneck & Harness)',
  description: 'Default ribbed burgundy/crimson turtleneck sweater dress with black tactical leather harness, boots, and gloves.',
  apply: (vrm: VRM) => {
    AdaRedSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          // Deep burgundy ribbed dress tone
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#800020') // Deep Burgundy
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#400010')
            if (mat.roughness !== undefined) mat.roughness = 0.55 // ribbed knit texture
          }
          // Matte leather tactical harness
          if (/body_wear|glove|strap/i.test(matName)) {
            if (mat.color) mat.color.set('#16161A')
            if (mat.metalness !== undefined) mat.metalness = 0.35 // metallic buckle sheen
            if (mat.roughness !== undefined) mat.roughness = 0.3
          }
        })
      }
    })
  },
}

/**
 * Black Stealth Variant
 */
export const BlackStealthSkin: AvatarSkin = {
  id: 'black_stealth',
  name: 'Black Stealth Variant',
  description: 'All-black covert turtleneck sweater dress with matte leather chest harness.',
  apply: (vrm: VRM) => {
    AdaRedSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#16161A')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0A0A0E')
            if (mat.roughness !== undefined) mat.roughness = 0.5
          }
        })
      }
    })
  },
}

/**
 * Crimson Jacket & Black Pants Variant
 */
export const CrimsonJacketSkin: AvatarSkin = {
  id: 'crimson_jacket',
  name: 'Crimson Field Jacket & Pants',
  description: 'Tailored crimson operative field jacket with sleek black tactical trousers.',
  apply: (vrm: VRM) => {
    AdaRedSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#A50F22') // Field Crimson Jacket
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#520711')
          }
          if (/stocking|tight|leg_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#141418') // Black tactical pants
            mat.opacity = 1.0
            mat.transparent = false
          }
        })
      }
    })
  },
}

/**
 * Mira / Yor Forger-Inspired Off-The-Shoulder Crimson Red Sweater Dress Skin
 * - Off-the-shoulder crimson red chunky ribbed sweater dress (#BA263B)
 * - Deep ruby red eye tint (#C4273C)
 * - Glossy midnight-raven hair with headband accent (#0C0D12)
 * - Jet black thigh-high stockings (#141416)
 * - Light cream/beige ankle boots (#D9CFC4)
 */
export const YorCrimsonSweaterSkin: AvatarSkin = {
  id: 'yor-crimson-sweater',
  name: 'Mira (Yor Style • Off-Shoulder Crimson Sweater)',
  description: 'Signature off-the-shoulder red knit sweater dress, thigh-high stockings, headband, and ruby eyes.',
  apply: (vrm: VRM) => {
    AdaRedSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      // Allow hair side-strands & headband for Yor styling
      if (/hair[2-4]_[LR]|mituami/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Off-shoulder chunky crimson sweater dress
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#BA263B') // Yor Crimson Red
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#5E0E1B')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#5E0E1B')
            if (mat.roughness !== undefined) mat.roughness = 0.72 // soft chunky knit wool
            if (mat.metalness !== undefined) mat.metalness = 0.05
          }

          // Glossy midnight black hair
          if (/hair/i.test(matName)) {
            if (mat.color) mat.color.set('#0C0D12')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#050508')
            if (mat.roughness !== undefined) mat.roughness = 0.22 // silky sheen
          }

          // Golden/Pearl Headband accent
          if (/hair_wear|ribbon|accessory/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            mat.transparent = false
            if (mat.color) mat.color.set('#D4AF37') // Antique Gold / Pearl
            if (mat.metalness !== undefined) mat.metalness = 0.65
            if (mat.roughness !== undefined) mat.roughness = 0.25
          }

          // Thigh-high opaque black stockings
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.opacity = 0.95
            mat.transparent = true
            if (mat.color) mat.color.set('#141418')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0A0A0C')
            if (mat.roughness !== undefined) mat.roughness = 0.5
          }

          // Ruby/Crimson eyes
          if (/eye|iris/i.test(matName)) {
            if (mat.color) mat.color.set('#C4273C')
            if (mat.emissive) mat.emissive.set('#4A0812')
          }
        })
      }
    })
    attachYorHeadbandRose(vrm, true)
    attachStarkTechGlassesAndBeard(vrm, false)
    const chestBone = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
    if (chestBone) {
      const emblem = chestBone.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }
  },
}

/**
 * Attaches glowing holographic Arc Reactor chest emblem for Atlas / Stark Tech
 */
function attachArcReactorEmblem(vrm: VRM): void {
  const chest =
    vrm.humanoid?.getNormalizedBoneNode('chest') ||
    vrm.humanoid?.getNormalizedBoneNode('upperChest')
  if (!chest) return

  let emblem = chest.getObjectByName('__STARK_ARC_REACTOR__')
  if (!emblem) {
    const group = new THREE.Group()
    group.name = '__STARK_ARC_REACTOR__'

    // Outer titanium ring
    const ringGeo = new THREE.TorusGeometry(0.045, 0.006, 16, 32)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      metalness: 0.9,
      roughness: 0.15,
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    group.add(ringMesh)

    // Inner glowing core
    const coreGeo = new THREE.CircleGeometry(0.038, 32)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.92,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    coreMesh.position.z = 0.003
    group.add(coreMesh)

    // Triangular power nodes
    const triangleGeo = new THREE.RingGeometry(0.015, 0.03, 3)
    const triangleMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    })
    const triangleMesh = new THREE.Mesh(triangleGeo, triangleMat)
    triangleMesh.position.z = 0.004
    group.add(triangleMesh)

    // Dynamic Arc Reactor Point Light for authentic cinematic glow
    const arcLight = new THREE.PointLight(0x00f3ff, 1.2, 0.85)
    arcLight.position.set(0, 0, 0.06)
    group.add(arcLight)

    group.position.set(0, 0.05, 0.115)
    group.rotation.x = 0.08
    chest.add(group)
    emblem = group
  }
  emblem.visible = true
}

/**
 * Attaches or updates Tony Stark's signature Tinted Aviator Sunglasses and Goatee Beard
 */
export function attachStarkTechGlassesAndBeard(vrm: VRM, visible: boolean = true): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  if (!headBone) return

  let glassesGroup = headBone.getObjectByName('__STARK_TECH_SUNGLASSES__') as THREE.Group | undefined
  if (!glassesGroup) {
    glassesGroup = new THREE.Group()
    glassesGroup.name = '__STARK_TECH_SUNGLASSES__'

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.95,
      roughness: 0.15,
    })

    // Orange/Amber tinted aviator lenses (matching Tony Stark's iconic shades in Avengers/Iron Man)
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xee4b2b,
      emissive: 0x551105,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.75,
      roughness: 0.08,
      metalness: 0.25,
      transmission: 0.45,
    })

    // Left Rim & Lens (at eye level y = 0.046, z = 0.075)
    const leftRimGeo = new THREE.TorusGeometry(0.024, 0.0024, 12, 32)
    const leftRim = new THREE.Mesh(leftRimGeo, frameMat)
    leftRim.position.set(-0.038, 0.046, 0.075)
    leftRim.scale.set(1.15, 0.95, 1.0)
    glassesGroup.add(leftRim)

    const leftLensGeo = new THREE.CircleGeometry(0.023, 24)
    const leftLens = new THREE.Mesh(leftLensGeo, lensMat)
    leftLens.position.set(-0.038, 0.046, 0.075)
    leftLens.scale.set(1.12, 0.92, 1.0)
    glassesGroup.add(leftLens)

    // Right Rim & Lens
    const rightRimGeo = new THREE.TorusGeometry(0.024, 0.0024, 12, 32)
    const rightRim = new THREE.Mesh(rightRimGeo, frameMat)
    rightRim.position.set(0.038, 0.046, 0.075)
    rightRim.scale.set(1.15, 0.95, 1.0)
    glassesGroup.add(rightRim)

    const rightLensGeo = new THREE.CircleGeometry(0.023, 24)
    const rightLens = new THREE.Mesh(rightLensGeo, lensMat)
    rightLens.position.set(0.038, 0.046, 0.075)
    rightLens.scale.set(1.12, 0.92, 1.0)
    glassesGroup.add(rightLens)

    // Nose Bridge Wire
    const bridgeGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.026, 8)
    const bridge = new THREE.Mesh(bridgeGeo, frameMat)
    bridge.rotation.z = Math.PI / 2
    bridge.position.set(0, 0.046, 0.076)
    glassesGroup.add(bridge)

    // Aviator Top Brow Bar
    const browGeo = new THREE.CylinderGeometry(0.0015, 0.0015, 0.068, 8)
    const brow = new THREE.Mesh(browGeo, frameMat)
    brow.rotation.z = Math.PI / 2
    brow.position.set(0, 0.062, 0.074)
    glassesGroup.add(brow)

    headBone.add(glassesGroup)
  }
  glassesGroup.visible = visible

  // 2. Signature Tony Stark Goatee Beard & Mustache
  let goateeGroup = headBone.getObjectByName('__STARK_GOATEE_BEARD__') as THREE.Group | undefined
  if (!goateeGroup) {
    goateeGroup = new THREE.Group()
    goateeGroup.name = '__STARK_GOATEE_BEARD__'

    const beardMat = new THREE.MeshStandardMaterial({
      color: 0x141216,
      roughness: 0.65,
      metalness: 0.1,
    })

    // Upper Mustache Wings (centered above lips y = -0.022, z = 0.076)
    const mustacheGeo = new THREE.TorusGeometry(0.022, 0.0035, 8, 16, Math.PI * 0.75)
    const mustacheMesh = new THREE.Mesh(mustacheGeo, beardMat)
    mustacheMesh.rotation.z = -Math.PI * 0.88
    mustacheMesh.position.set(0, -0.022, 0.076)
    goateeGroup.add(mustacheMesh)

    // Soul Patch vertical tuft
    const soulGeo = new THREE.BoxGeometry(0.006, 0.012, 0.004)
    const soulMesh = new THREE.Mesh(soulGeo, beardMat)
    soulMesh.position.set(0, -0.040, 0.074)
    goateeGroup.add(soulMesh)

    // Chin Pointed Goatee Outline
    const chinGeo = new THREE.TorusGeometry(0.025, 0.004, 8, 16, Math.PI * 0.65)
    const chinMesh = new THREE.Mesh(chinGeo, beardMat)
    chinMesh.rotation.z = Math.PI * 0.18
    chinMesh.position.set(0, -0.058, 0.070)
    goateeGroup.add(chinMesh)

    headBone.add(goateeGroup)
  }
  goateeGroup.visible = visible
}

/**
 * Attaches or updates Yor Forger's iconic Golden Rose Headband ornament
 */
export function attachYorHeadbandRose(vrm: VRM, visible: boolean = true): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  if (!headBone) return

  let roseGroup = headBone.getObjectByName('__YOR_HEADBAND_ROSE__') as THREE.Group | undefined
  if (!roseGroup) {
    roseGroup = new THREE.Group()
    roseGroup.name = '__YOR_HEADBAND_ROSE__'

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.75,
      roughness: 0.22,
    })

    // Stylized golden rose petals on the left temple
    const centerGeo = new THREE.SphereGeometry(0.012, 12, 12)
    const centerMesh = new THREE.Mesh(centerGeo, goldMat)
    roseGroup.add(centerMesh)

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const petalGeo = new THREE.CylinderGeometry(0.008, 0.004, 0.016, 8)
      const petalMesh = new THREE.Mesh(petalGeo, goldMat)
      petalMesh.position.set(Math.cos(angle) * 0.012, Math.sin(angle) * 0.012, 0)
      petalMesh.rotation.z = angle
      roseGroup.add(petalMesh)
    }

    roseGroup.position.set(0.098, 0.048, 0.038)
    headBone.add(roseGroup)
  }
  roseGroup.visible = visible
}

/**
 * Atlas / Tony Stark-Inspired High-Tech Market Analyst Skin
 * - Charcoal executive tailored blazer over carbon tech tee
 * - Glowing Cyan Arc Reactor chest badge (#00F3FF, emissive glow)
 * - Amber/Cyan gradient tech optics & sunglasses
 * - Precision metallic watch & cuff accents
 */
export const StarkArcTraderSkin: AvatarSkin = {
  id: 'stark-arc-trader',
  name: 'Atlas (Stark Tech • Arc Reactor & Charcoal Suit)',
  description: 'Charcoal executive blazer, glowing cyan arc reactor core, and tech optics.',
  apply: (vrm: VRM) => {
    // 1. Hide feminine accessories, ribbons, bows, and extra skirt flares
    vrm.scene.traverse((obj) => {
      if (/hair[1-8]_[LR]|mituami|ribbon|cloth_ribbon|other/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0.001, 0.001, 0.001)
      }
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        obj.scale.set(0.001, 0.001, 0.001)
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Hide feminine hair ribbons / bows
          if (/hair_wear|other/i.test(matName)) {
            mat.visible = false
            return
          }

          // Charcoal executive blazer & carbon tech shirt
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#1c1f26') // Charcoal tailored suit
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0e1014')
            if (mat.roughness !== undefined) mat.roughness = 0.38
            if (mat.metalness !== undefined) mat.metalness = 0.22
          }

          // Dark textured espresso hair
          if (/hair/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#181514')
            if (mat.roughness !== undefined) mat.roughness = 0.38
          }

          // High-tech accessories & metallic buckles
          if (/body_wear|glove|strap/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#0E1015')
            if (mat.metalness !== undefined) mat.metalness = 0.55
          }

          // Suit Trousers
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            mat.transparent = false
            if (mat.color) mat.color.set('#14161c')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0a0c10')
          }

          // Clean masculine skin
          if (/alicia_face\b|alicia_body\b/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#fdeade')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#e8c6b5')
          }
        })
      }
    })

    // 2. Attach Arc Reactor and signature Tony Stark Tech Glasses & Goatee Beard
    attachArcReactorEmblem(vrm)
    attachStarkTechGlassesAndBeard(vrm, true)
    attachYorHeadbandRose(vrm, false)
  },
}

export const AVATAR_SKINS: Record<string, AvatarSkin> = {
  'ada-red': AdaRedSkin,
  'crimson_turtleneck': CrimsonTurtleneckSkin,
  'black_stealth': BlackStealthSkin,
  'crimson_jacket': CrimsonJacketSkin,
  'cozy-night': CozyNightSkin,
  'original-pastel': OriginalPastelSkin,
  'yor-crimson-sweater': YorCrimsonSweaterSkin,
  'stark-arc-trader': StarkArcTraderSkin,
}

/**
 * Attaches or updates the Tactical Comms Headset with boom mic and LED indicator
 */
export function updateCommsHeadset(vrm: VRM, visible: boolean, isListening: boolean): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  if (!headBone) return

  let headsetGroup = headBone.getObjectByName('__ada_comms_headset__') as THREE.Group | undefined

  if (!headsetGroup) {
    headsetGroup = new THREE.Group()
    headsetGroup.name = '__ada_comms_headset__'

    // 1. Sleek metallic headband arc over crown
    const bandGeo = new THREE.TorusGeometry(0.13, 0.007, 8, 24, Math.PI * 0.95)
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x16161a,
      roughness: 0.3,
      metalness: 0.8,
    })
    const bandMesh = new THREE.Mesh(bandGeo, bandMat)
    bandMesh.rotation.x = Math.PI / 2
    bandMesh.rotation.z = -Math.PI / 2
    bandMesh.position.set(0, 0.08, 0)
    headsetGroup.add(bandMesh)

    // 2. Right ear cup
    const earGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.016, 16)
    const earMat = new THREE.MeshStandardMaterial({
      color: 0x111216,
      roughness: 0.35,
      metalness: 0.7,
    })
    const earMesh = new THREE.Mesh(earGeo, earMat)
    earMesh.rotation.z = Math.PI / 2
    earMesh.position.set(0.125, 0.01, 0)
    headsetGroup.add(earMesh)

    // 3. Articulated Boom Mic arm curving forward toward lips
    const boomGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.12, 8)
    const boomMesh = new THREE.Mesh(boomGeo, bandMat)
    boomMesh.position.set(0.115, -0.04, 0.06)
    boomMesh.rotation.x = Math.PI / 3.8
    boomMesh.rotation.z = -Math.PI / 18
    headsetGroup.add(boomMesh)

    // 4. Microphone tip capsule with illuminated LED status indicator
    const tipGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12)
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a20,
      roughness: 0.4,
    })
    const tipMesh = new THREE.Mesh(tipGeo, tipMat)
    tipMesh.position.set(0.10, -0.095, 0.11)
    tipMesh.rotation.x = Math.PI / 3.8
    headsetGroup.add(tipMesh)

    const ledGeo = new THREE.SphereGeometry(0.004, 8, 8)
    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
    })
    const ledMesh = new THREE.Mesh(ledGeo, ledMat)
    ledMesh.name = '__headset_led__'
    ledMesh.position.set(0.098, -0.105, 0.12)
    headsetGroup.add(ledMesh)

    headBone.add(headsetGroup)
  }

  headsetGroup.visible = visible

  // Update LED brightness/color based on listening state
  const led = headsetGroup.getObjectByName('__headset_led__') as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined
  if (led && led.material) {
    if (isListening) {
      led.material.color.set('#00ffcc') // Bright cyan/emerald pulse
    } else {
      led.material.color.set('#0077aa') // Dim standby cyan
    }
  }
}

/**
 * Applies accessory overrides (comms headset, gloves, boots)
 */
export function applyAvatarAccessories(
  vrm: VRM,
  accessories: { commsHeadset?: boolean; gloves?: boolean; boots?: boolean },
  isListening: boolean = false
): void {
  if (accessories.commsHeadset !== undefined) {
    updateCommsHeadset(vrm, accessories.commsHeadset, isListening)
  }

  if (accessories.gloves !== undefined) {
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          if (/glove|body_wear/i.test(matName)) {
            if (accessories.gloves) {
              if (mat.color) mat.color.set('#111216')
              mat.visible = true
            } else {
              // Hide gloves overlay / skin tone
              if (mat.color) mat.color.set('#f5ded6')
            }
          }
        })
      }
    })
  }

  if (accessories.boots !== undefined) {
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = accessories.boots !== false
          }
        })
      }
    })
  }
}

export function applyAvatarSkin(vrm: VRM, skinId: string = 'crimson_turtleneck'): void {
  if (AVATAR_SKINS[skinId]) {
    AVATAR_SKINS[skinId].apply(vrm)
    return
  }

  // Dynamic wardrobe outfit support for all 15+ presets (Indian wear, casual, formal, etc.)
  AdaRedSkin.apply(vrm) // Apply base bob hair and makeup styling

  const outfit = WardrobeProvider.getOutfitById(skinId)
  if (!outfit) return

  vrm.scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

      materials.forEach((mat: any) => {
        if (!mat) return
        const matName = (mat.name || '').toLowerCase()

        // Apply outfit hair color if specified
        if (/hair/i.test(matName) && outfit.hairColor) {
          if (mat.color) mat.color.set(outfit.hairColor)
        }

        // Apply outfit dress / cloth color
        if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
          if (mat.color) mat.color.set(outfit.dressColor)
          if (mat.shadeColorFactor) {
            const c = new THREE.Color(outfit.dressColor).multiplyScalar(0.55)
            mat.shadeColorFactor.set(c)
          }
          if ('shadeColor' in mat && mat.shadeColor) {
            const c = new THREE.Color(outfit.dressColor).multiplyScalar(0.55)
            mat.shadeColor.set(c)
          }
          if (skinId === 'tripo-tactical-turtleneck' || skinId === 'crimson_turtleneck') {
            if (mat.roughness !== undefined) mat.roughness = 0.55 // ribbed wool texture
          }
        }

        // Specific Time-of-Day & Special Outfit Treatments:
        if (skinId === 'morning_chic') {
          if (/wear|cloth|dress/i.test(matName)) {
            if (mat.roughness !== undefined) mat.roughness = 0.65 // soft cashmere knit
          }
          if (/stocking|tight|leg_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#F5EBE0')
            mat.opacity = 0.60
          }
        } else if (skinId === 'office-blazer') {
          if (/wear|cloth|dress/i.test(matName)) {
            if (mat.roughness !== undefined) mat.roughness = 0.35 // structured executive wool
          }
          if (/stocking|tight|leg_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#111216')
            mat.opacity = 0.88
          }
        } else if (skinId === 'saree-crimson') {
          if (/wear|cloth|dress/i.test(matName)) {
            if (mat.roughness !== undefined) mat.roughness = 0.30 // rich banarasi silk
            if (mat.metalness !== undefined) mat.metalness = 0.18 // golden zari shimmer
          }
        } else if (skinId === 'cozy-pajamas' || skinId === 'cozy-night') {
          if (/wear|cloth|dress/i.test(matName)) {
            if (mat.roughness !== undefined) mat.roughness = 0.48 // comfortable bedtime silk
          }
          if (/stocking|tight|leg_wear/i.test(matName)) {
            if (mat.color) mat.color.set('#1E293B')
            mat.opacity = 0.70
          }
        }

        // Tactical Harness & Buckle Straps for Tripo outfit & Crimson Turtleneck
        if ((skinId === 'tripo-tactical-turtleneck' || skinId === 'crimson_turtleneck') && /glove|strap|body_wear|arm/i.test(matName)) {
          if (mat.color) mat.color.set('#16161A') // matte tactical harness black
          if (mat.metalness !== undefined) mat.metalness = 0.35 // metallic buckle sheen
          if (mat.roughness !== undefined) mat.roughness = 0.3
        }
      })
    }
  })
}

/**
 * Applies character-specific 3D humanoid skeletal transformations, physical silhouettes,
 * and wardrobe signatures:
 * - Atlas (Tony Stark): Broad masculine athletic male physique (wide shoulders 1.28, broad chest 1.25,
 *   narrow hips 0.85, muscular arms 1.18, taller legs 1.14), charcoal suit, aviator glasses, goatee beard, arc reactor.
 * - Mira (Yor Forger): Feminine hourglass silhouette (curvy hips 1.16, cinched waist 0.94, bust 1.10),
 *   golden rose headband, crimson off-shoulder sweater dress, black thigh-highs.
 * - Ada (Coach/Tutor): Standard spy-chic athletic female proportions (1.0 baseline), crimson turtleneck dress.
 */
export function applyCharacterPhysicalTransformation(vrm: VRM, char: 'ada' | 'mira' | 'atlas'): void {
  if (!vrm || !vrm.humanoid) return

  const humanoid = vrm.humanoid

  const leftShoulder = humanoid.getNormalizedBoneNode('leftShoulder')
  const rightShoulder = humanoid.getNormalizedBoneNode('rightShoulder')
  const chest = humanoid.getNormalizedBoneNode('chest')
  const upperChest = humanoid.getNormalizedBoneNode('upperChest')
  const hips = humanoid.getNormalizedBoneNode('hips')
  const spine = humanoid.getNormalizedBoneNode('spine')
  const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')
  const rightUpperArm = humanoid.getNormalizedBoneNode('rightUpperArm')
  const leftLowerArm = humanoid.getNormalizedBoneNode('leftLowerArm')
  const rightLowerArm = humanoid.getNormalizedBoneNode('rightLowerArm')
  const leftUpperLeg = humanoid.getNormalizedBoneNode('leftUpperLeg')
  const rightUpperLeg = humanoid.getNormalizedBoneNode('rightUpperLeg')
  const leftLowerLeg = humanoid.getNormalizedBoneNode('leftLowerLeg')
  const rightLowerLeg = humanoid.getNormalizedBoneNode('rightLowerLeg')

  if (char === 'atlas') {
    // ⚡ ATLAS (TONY STARK): Athletic Masculine Boy Frame
    // 1. Broad masculine athletic shoulders (+28% width)
    if (leftShoulder) leftShoulder.scale.set(1.28, 1.15, 1.25)
    if (rightShoulder) rightShoulder.scale.set(1.28, 1.15, 1.25)

    // 2. Wide male chest & upper chest V-taper
    if (chest) chest.scale.set(1.25, 1.12, 1.18)
    if (upperChest) upperChest.scale.set(1.25, 1.12, 1.18)
    if (spine) spine.scale.set(1.08, 1.02, 1.10)

    // 3. Narrow masculine hips (neutralizes female curved waistline)
    if (hips) hips.scale.set(0.85, 1.02, 0.86)

    // 4. Athletic male arms (muscular bicep & forearm structure)
    if (leftUpperArm) leftUpperArm.scale.set(1.18, 1.06, 1.18)
    if (rightUpperArm) rightUpperArm.scale.set(1.18, 1.06, 1.18)
    if (leftLowerArm) leftLowerArm.scale.set(1.12, 1.04, 1.12)
    if (rightLowerArm) rightLowerArm.scale.set(1.12, 1.04, 1.12)

    // 5. Straight, taller male legs (+14% leg length & masculine stance)
    if (leftUpperLeg) leftUpperLeg.scale.set(1.14, 1.06, 1.14)
    if (rightUpperLeg) rightUpperLeg.scale.set(1.14, 1.06, 1.14)
    if (leftLowerLeg) leftLowerLeg.scale.set(1.10, 1.06, 1.10)
    if (rightLowerLeg) rightLowerLeg.scale.set(1.10, 1.06, 1.10)

    // Hide feminine hair ribbons, hair bows, and collapse skirt into male suit trousers
    vrm.scene.traverse((obj) => {
      if (/hair[2-4]_[LR]|mituami|ribbon|accessory/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        obj.scale.set(0.001, 0.001, 0.001)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0.001, 0.001, 0.001)
      }
    })

    // Attach Stark Tech Glasses, Goatee Beard, and Arc Reactor
    attachStarkTechGlassesAndBeard(vrm, true)
    attachArcReactorEmblem(vrm)
    attachYorHeadbandRose(vrm, false)

    // Apply Stark Suit textures & charcoal materials
    StarkArcTraderSkin.apply(vrm)

  } else if (char === 'mira') {
    // 🌹 MIRA (YOR FORGER): Feminine Hourglass Silhouette & Knit Sweater
    if (leftShoulder) leftShoulder.scale.set(0.96, 0.98, 0.98)
    if (rightShoulder) rightShoulder.scale.set(0.96, 0.98, 0.98)
    if (chest) chest.scale.set(1.10, 1.08, 1.12)
    if (upperChest) upperChest.scale.set(1.10, 1.08, 1.12)
    if (spine) spine.scale.set(0.94, 1.00, 0.95) // slender waist
    if (hips) hips.scale.set(1.16, 1.02, 1.14) // curvy feminine hourglass hips
    if (leftUpperArm) leftUpperArm.scale.set(0.95, 1.00, 0.95)
    if (rightUpperArm) rightUpperArm.scale.set(0.95, 1.00, 0.95)
    if (leftLowerArm) leftLowerArm.scale.set(0.95, 1.00, 0.95)
    if (rightLowerArm) rightLowerArm.scale.set(0.95, 1.00, 0.95)
    if (leftUpperLeg) leftUpperLeg.scale.set(1.05, 1.02, 1.05)
    if (rightUpperLeg) rightUpperLeg.scale.set(1.05, 1.02, 1.05)

    // Allow feminine hair ribbons/side strands and restore dress skirt
    vrm.scene.traverse((obj) => {
      if (/hair[2-4]_[LR]|mituami/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        obj.scale.set(0.72, 1.0, 0.72)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
    })

    attachStarkTechGlassesAndBeard(vrm, false)
    attachYorHeadbandRose(vrm, true)
    const chestBone = humanoid.getNormalizedBoneNode('chest') || humanoid.getNormalizedBoneNode('upperChest')
    if (chestBone) {
      const emblem = chestBone.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }

    YorCrimsonSweaterSkin.apply(vrm)

  } else {
    // 👩‍💼 ADA (COACH & TUTOR): Spy-Chic Athletic Female Proportions (Standard 1.0)
    const bones = [
      leftShoulder, rightShoulder, chest, upperChest, spine, hips,
      leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm,
      leftUpperLeg, rightUpperLeg, leftLowerLeg, rightLowerLeg,
    ]
    bones.forEach((b) => {
      if (b) b.scale.set(1.0, 1.0, 1.0)
    })

    vrm.scene.traverse((obj) => {
      if (/hair[2-4]_[LR]|mituami/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        obj.scale.set(0.72, 1.0, 0.72)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
    })

    attachStarkTechGlassesAndBeard(vrm, false)
    attachYorHeadbandRose(vrm, false)
    const chestBone = humanoid.getNormalizedBoneNode('chest') || humanoid.getNormalizedBoneNode('upperChest')
    if (chestBone) {
      const emblem = chestBone.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }

    AdaRedSkin.apply(vrm)
  }
}

