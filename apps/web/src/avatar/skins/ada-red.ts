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
    attachYorThornPrincessFeatures(vrm, false)
    attachAdaTacticalAccessories(vrm, true)
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

          // Eyes -> Alluring Amber-Hazel with Golden Depth (Ada Wong)
          else if (/eye\b|alicia_eye/i.test(matName) && !/white/i.test(matName)) {
            if (mat.color) mat.color.set('#ba6820')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#3a1805')
            if (mat.map && mat.map.image && !mat.userData.__eyeTintAda && typeof document !== 'undefined') {
              try {
                const img = mat.map.image
                if (img.width && img.height) {
                  const canvas = document.createElement('canvas')
                  canvas.width = img.width
                  canvas.height = img.height
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    ctx.drawImage(img, 0, 0)
                    ctx.globalCompositeOperation = 'color'
                    ctx.fillStyle = '#a04812'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.globalCompositeOperation = 'source-over'
                    const tex = new THREE.CanvasTexture(canvas)
                    tex.colorSpace = THREE.SRGBColorSpace
                    tex.flipY = mat.map.flipY
                    mat.map = tex
                    mat.userData.__eyeTintAda = true
                    mat.needsUpdate = true
                  }
                }
              } catch(e) {}
            }
          }

          // Face Texture -> Ada Wong: Warm Olive Skin + BROWN Eyes painted on canvas (overrides baked-in blue)
          else if (/alicia_face\b/i.test(matName)) {
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#f0d5c0')
            if (mat.color) mat.color.set('#FCECD6') // warm olive-beige skin tint
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

                    // 0. Warm olive skin tone overlay (tone down the pale base)
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.fillStyle = 'rgba(255, 230, 195, 0.25)'
                    ctx.fillRect(0, 0, 1024, 1024)
                    ctx.globalCompositeOperation = 'source-over'

                    // 1. ADA BROWN EYES — paint warm amber-brown iris directly onto texture
                    // This fully overrides the baked-in blue iris on Alicia model
                    // LEFT EYE iris overlay
                    const leftIrisGrad = ctx.createRadialGradient(372, 400, 0, 372, 400, 24)
                    leftIrisGrad.addColorStop(0, 'rgba(40, 15, 5, 0.98)')    // dark pupil center
                    leftIrisGrad.addColorStop(0.25, 'rgba(100, 45, 12, 0.96)') // deep brown inner
                    leftIrisGrad.addColorStop(0.55, 'rgba(158, 81, 36, 0.92)') // warm amber-brown
                    leftIrisGrad.addColorStop(0.80, 'rgba(130, 65, 25, 0.75)') // outer ring fade
                    leftIrisGrad.addColorStop(1, 'rgba(60, 25, 8, 0.0)')
                    ctx.fillStyle = leftIrisGrad
                    ctx.beginPath()
                    ctx.ellipse(372, 400, 24, 19, 0, 0, Math.PI * 2)
                    ctx.fill()
                    // Left eye iris detail ring
                    ctx.strokeStyle = 'rgba(90, 42, 12, 0.60)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.ellipse(372, 400, 16, 12, 0, 0, Math.PI * 2)
                    ctx.stroke()
                    // LEFT pupil
                    ctx.fillStyle = 'rgba(10, 5, 2, 0.98)'
                    ctx.beginPath()
                    ctx.ellipse(372, 400, 7, 7, 0, 0, Math.PI * 2)
                    ctx.fill()
                    // Left eye glint
                    ctx.fillStyle = 'rgba(255, 240, 220, 0.75)'
                    ctx.beginPath()
                    ctx.ellipse(368, 395, 4, 3, -0.4, 0, Math.PI * 2)
                    ctx.fill()

                    // RIGHT EYE iris overlay
                    const rightIrisGrad = ctx.createRadialGradient(652, 400, 0, 652, 400, 24)
                    rightIrisGrad.addColorStop(0, 'rgba(40, 15, 5, 0.98)')
                    rightIrisGrad.addColorStop(0.25, 'rgba(100, 45, 12, 0.96)')
                    rightIrisGrad.addColorStop(0.55, 'rgba(158, 81, 36, 0.92)')
                    rightIrisGrad.addColorStop(0.80, 'rgba(130, 65, 25, 0.75)')
                    rightIrisGrad.addColorStop(1, 'rgba(60, 25, 8, 0.0)')
                    ctx.fillStyle = rightIrisGrad
                    ctx.beginPath()
                    ctx.ellipse(652, 400, 24, 19, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(90, 42, 12, 0.60)'
                    ctx.lineWidth = 2
                    ctx.beginPath()
                    ctx.ellipse(652, 400, 16, 12, 0, 0, Math.PI * 2)
                    ctx.stroke()
                    // Right pupil
                    ctx.fillStyle = 'rgba(10, 5, 2, 0.98)'
                    ctx.beginPath()
                    ctx.ellipse(652, 400, 7, 7, 0, 0, Math.PI * 2)
                    ctx.fill()
                    // Right eye glint
                    ctx.fillStyle = 'rgba(255, 240, 220, 0.75)'
                    ctx.beginPath()
                    ctx.ellipse(648, 395, 4, 3, -0.4, 0, Math.PI * 2)
                    ctx.fill()

                    // 2. Ada Mature Sculpted Cheekbone Contour & Warm Olive Blush
                    const gradL = ctx.createRadialGradient(360, 462, 4, 360, 462, 55)
                    gradL.addColorStop(0, 'rgba(210, 110, 80, 0.32)')
                    gradL.addColorStop(0.6, 'rgba(190, 95, 65, 0.12)')
                    gradL.addColorStop(1, 'rgba(190, 95, 65, 0)')
                    ctx.fillStyle = gradL
                    ctx.beginPath()
                    ctx.arc(360, 462, 55, 0, Math.PI * 2)
                    ctx.fill()

                    const gradR = ctx.createRadialGradient(664, 462, 4, 664, 462, 55)
                    gradR.addColorStop(0, 'rgba(210, 110, 80, 0.32)')
                    gradR.addColorStop(0.6, 'rgba(190, 95, 65, 0.12)')
                    gradR.addColorStop(1, 'rgba(190, 95, 65, 0)')
                    ctx.fillStyle = gradR
                    ctx.beginPath()
                    ctx.arc(664, 462, 55, 0, Math.PI * 2)
                    ctx.fill()

                    // 3. Ada Signature Cat-Eye Eyeliner (Sharp angled wing — adult spy)
                    ctx.fillStyle = 'rgba(10, 10, 15, 0.92)'
                    ctx.beginPath()
                    ctx.moveTo(328, 393)
                    ctx.quadraticCurveTo(360, 374, 408, 388)
                    ctx.quadraticCurveTo(418, 384, 426, 378)
                    ctx.quadraticCurveTo(410, 392, 360, 384)
                    ctx.quadraticCurveTo(328, 393, 328, 393)
                    ctx.fill()
                    ctx.beginPath()
                    ctx.moveTo(696, 393)
                    ctx.quadraticCurveTo(664, 374, 616, 388)
                    ctx.quadraticCurveTo(606, 384, 598, 378)
                    ctx.quadraticCurveTo(614, 392, 664, 384)
                    ctx.quadraticCurveTo(696, 393, 696, 393)
                    ctx.fill()

                    // 4. Ada Ruby-Velvet Lips — crisp cupid's bow, deeper crimson
                    ctx.fillStyle = 'rgba(165, 8, 24, 0.97)'
                    ctx.beginPath()
                    ctx.moveTo(475, 594)
                    ctx.quadraticCurveTo(493, 578, 505, 585)
                    ctx.quadraticCurveTo(512, 589, 520, 585)
                    ctx.quadraticCurveTo(532, 578, 549, 594)
                    ctx.quadraticCurveTo(535, 616, 512, 617)
                    ctx.quadraticCurveTo(489, 616, 475, 594)
                    ctx.closePath()
                    ctx.fill()
                    ctx.fillStyle = 'rgba(90, 3, 12, 0.88)'
                    ctx.beginPath()
                    ctx.ellipse(512, 596, 24, 5, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.fillStyle = 'rgba(255, 225, 235, 0.60)'
                    ctx.beginPath()
                    ctx.ellipse(512, 606, 11, 3, 0, 0, Math.PI * 2)
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
                console.warn('[Ada Skin] Failed to apply Ada face makeup canvas overlay:', e)
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
    attachGoldenPirateAccessories(vrm, false)

    const chestEmblem = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
    if (chestEmblem) {
      const em = chestEmblem.getObjectByName('__STARK_ARC_REACTOR__')
      if (em) em.visible = false
    }

    const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
    if (headBone) {
      const starkGlasses = headBone.getObjectByName('__STARK_TECH_SUNGLASSES__')
      if (starkGlasses) starkGlasses.visible = false
      const starkGoatee = headBone.getObjectByName('__STARK_GOATEE_BEARD__')
      if (starkGoatee) starkGoatee.visible = false
      const commsHeadset = headBone.getObjectByName('__ada_comms_headset__')
      if (commsHeadset) commsHeadset.visible = false
      const yorHead = headBone.getObjectByName('__YOR_HEAD_ASSEMBLY__')
      if (yorHead) yorHead.visible = false
    }

    const metaTitle = ((vrm.meta as any)?.title || (vrm.meta as any)?.name || '') as string
    const isNativeMiku = Boolean(
      metaTitle.includes('ミク') || metaTitle.toLowerCase().includes('miku') ||
      vrm.scene.getObjectByName('右髪１')
    )

    if (isNativeMiku) {
      // Native Tda Hatsune Miku: enable proper alpha discard, depth sorting, and preserve pristine textures
      vrm.scene.traverse((obj) => {
        if (/^__STARK_|^__YOR_|^__ADA_|^__ada_|^__headset/i.test(obj.name) || obj.parent?.name?.includes('headset') || obj.parent?.name?.includes('stark')) {
          obj.visible = false
          return
        }
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          mesh.frustumCulled = false
          mesh.castShadow = true
          mesh.receiveShadow = true
          mesh.renderOrder = 10

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat: any) => {
            if (!mat) return
            mat.transparent = true
            mat.depthWrite = true
            mat.depthTest = true
            mat.alphaTest = 0.5
            mat.needsUpdate = true
          })
        }
      })
      attachMikuVocaloidFeatures(vrm, false)
      attachStarkTechGlassesAndBeard(vrm, false)
      updateCommsHeadset(vrm, false, false)
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
          if (mat.name === '11' || mat.name === '12' || /hair/i.test(mat.name || '')) {
            if (mat.color) mat.color.set('#00F3FF')
            if (mat.emissive) {
              mat.emissive.set('#00A8FF')
              mat.emissiveIntensity = 0.35
            }
            mat.needsUpdate = true
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
          if (mat.name === '11' || mat.name === '12' || /hair/i.test(mat.name || '')) {
            if (mat.color) mat.color.set('#FFB7C5') // Sakura blossom pink
            mat.needsUpdate = true
          }
        })
      }
    })
  },
}

/**
 * Hatsune Miku • Golden Pirate Diva (Fortnite Collab Edition)
 * - 24k polished gold filigree pirate captain coat trims, buttons, and epaulettes
 * - Deep velvet pirate obsidian coat & pleated skirt with crimson lining
 * - Golden pirate skull & crossbones buckle on waist
 * - Twin nautical golden anchor hairclips on twintails
 * - Metallic gold pirate boots
 */
export const MikuGoldenPirateSkin: AvatarSkin = {
  id: 'miku-golden-pirate',
  name: 'Hatsune Miku • Golden Pirate Diva (Fortnite Edition)',
  description: 'Fortnite-inspired high-seas cyber pirate diva outfit. Features 24k polished gold filigree pirate captain coat trims, skull & compass crossbones buckle, golden twintail anchor ribbons, and shimmering metallic gold boots.',
  apply: (vrm: VRM) => {
    MikuClassicIdolSkin.apply(vrm)

    const metaTitle = ((vrm.meta as any)?.title || (vrm.meta as any)?.name || '') as string
    const isNativeMiku = Boolean(
      metaTitle.includes('ミク') || metaTitle.toLowerCase().includes('miku') ||
      vrm.scene.getObjectByName('右髪１')
    )

    // Apply high-seas golden pirate materials
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // For native Tda Miku V4X:
          if (isNativeMiku) {
            // Preserve pristine anime skin, face, eyes, and expressions:
            // Mat 0 = Body skin (arms, shoulders, thighs, hands)
            // Mat 2 = Face & neck skin
            // Mat 7, 8, 9, 10, 13, 14, 16, 17 = Eyes, brows, facial expressions
            if (['0', '2', '7', '8', '9', '10', '13', '14', '16', '17'].includes(mat.name)) {
              if (mat.color) mat.color.set('#FFFFFF')
              mat.transparent = true
              mat.depthWrite = true
              mat.depthTest = true
              mat.alphaTest = 0.5
              mat.needsUpdate = true
              return
            }

            // Outfit materials -> 24k Polished Liquid Gold (Fortnite Golden Pirate Edition):
            // Mat 1 = Full clothing mesh (vest/shirt, pleated skirt, detached sleeves, boots)
            // Mat 3 = Tie & hair ribbons
            // Mat 4 = Headset & clips
            // Mat 5 = Skirt pleats / secondary trims
            // Mat 6 = Belt buckle & waist trims
            // Mat 15 = Arm display console & sleeve trims
            if (['1', '3', '4', '5', '6', '15'].includes(mat.name)) {
              if (mat.color) mat.color.set('#FFD700')
              if (mat.roughness !== undefined) mat.roughness = 0.14
              if (mat.metalness !== undefined) mat.metalness = 0.96
              if (mat.emissive) {
                mat.emissive.set('#FFA500')
                mat.emissiveIntensity = 0.42
              }
              mat.needsUpdate = true
            } else if (mat.name === '11' || mat.name === '12') {
              // Signature cyan twintails with subtle gilded shimmer
              if (mat.roughness !== undefined) mat.roughness = 0.28
              if (mat.metalness !== undefined) mat.metalness = 0.15
              mat.needsUpdate = true
            }
          } else {
            // Ada fallback meshes
            if (/wear|cloth|dress/i.test(matName)) {
              if (mat.color) mat.color.set('#0E1118')
              if (mat.metalness !== undefined) mat.metalness = 0.65
            }
            if (/boot|shoe|belt/i.test(matName)) {
              if (mat.color) mat.color.set('#FFD700')
              if (mat.metalness !== undefined) mat.metalness = 0.88
            }
          }
        })
      }
    })

    // Attach Fortnite Golden Pirate 3D accessories
    attachGoldenPirateAccessories(vrm, true)
  },
}

// Backward-compatible aliases
export const YorCrimsonSweaterSkin: AvatarSkin = MikuClassicIdolSkin;
export const YorThornPrincessSkin: AvatarSkin = MikuClassicIdolSkin;
export const YorBerlintGalaSkin: AvatarSkin = MikuMagicalMiraiSkin;

export const AdaCyberOperativeSkin: AvatarSkin = {
  id: 'ada-cyber-operative',
  name: 'Ada Wong • Neo-Tokyo Cyber Operative',
  description: 'Carbon mesh tactical agent suit with glowing magenta/cyan holographic piping and optics.',
  apply: (vrm: VRM) => {
    AdaRedSkin.apply(vrm)
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Carbon mesh operative suit
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#141620')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0A0C14')
            if (mat.roughness !== undefined) mat.roughness = 0.35
            if (mat.metalness !== undefined) mat.metalness = 0.45
            if (mat.emissive) mat.emissive.set('#4A0824') // Subtle neon undertone
          }

          // High-tech holographic straps
          if (/body_wear|glove|strap/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#00E5FF')
            if (mat.emissive) mat.emissive.set('#005577')
          }

          // Dark tactical stockings
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#0F1116')
          }

          // Sleek jet hair
          if (/hair/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#111218')
          }
        })
      }
    })
    attachYorHeadbandRose(vrm, false)
    attachStarkTechGlassesAndBeard(vrm, false)
  },
}

/**
 * Tony Stark • Italian Tailored Executive Suit (Iron Man 1 & 2 / Avengers Gala)
 * - Bespoke charcoal Italian silk-wool blazer (#1C1F26) & tailored trousers
 * - Amber-tinted aviator sunglasses, sculpted goatee, and chest Arc Reactor
 */
export const StarkExecutiveSuitSkin: AvatarSkin = {
  id: 'stark-executive-suit',
  name: 'Tony Stark • Italian Tailored Executive Suit',
  description: 'Bespoke charcoal Italian wool blazer, amber aviator sunglasses, goatee beard, and chest Arc Reactor.',
  apply: (vrm: VRM) => {
    vrm.scene.traverse((obj) => {
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Charcoal tailored blazer & silk shirt
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#1C1F26')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0E1014')
            if (mat.roughness !== undefined) mat.roughness = 0.38
            if (mat.metalness !== undefined) mat.metalness = 0.22
          }

          // Dark textured hair
          if (/hair/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#181514')
          }

          // Suit Trousers
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            mat.transparent = false
            if (mat.color) mat.color.set('#14161C')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0A0C10')
          }

          // Masculine skin
          if (/alicia_face\b|alicia_body\b/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#FDEADE')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#E8C6B5')
          }
        })
      }
    })
    attachArcReactorEmblem(vrm)
    attachStarkTechGlassesAndBeard(vrm, true)
    attachYorHeadbandRose(vrm, false)
  },
}

/**
 * Tony Stark • S.H.I.E.L.D. Carbon Stealth Tech Hoodie (Avengers Endgame)
 * - Matte carbon-weave tactical hoodie with Stark Industries cyan luminescent traces
 */
export const StarkStealthHoodieSkin: AvatarSkin = {
  id: 'stark-stealth-hoodie',
  name: 'Tony Stark • S.H.I.E.L.D. Carbon Tech Hoodie',
  description: 'Matte carbon tactical tech hoodie with Stark cyan piping, dark aviator optics, and chest Arc Reactor.',
  apply: (vrm: VRM) => {
    vrm.scene.traverse((obj) => {
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (!mat) return
          const matName = (mat.name || '').toLowerCase()

          // Matte carbon-weave tech hoodie
          if (/wear|cloth|dress/i.test(matName) && !/hair_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#13151A')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#0A0B0E')
            if (mat.roughness !== undefined) mat.roughness = 0.55
            if (mat.metalness !== undefined) mat.metalness = 0.15
          }

          // Dark hair
          if (/hair/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#151312')
          }

          // Stealth cargo trousers
          if (/stocking|tight|leg_wear/i.test(matName)) {
            mat.visible = true
            mat.opacity = 1.0
            mat.transparent = false
            if (mat.color) mat.color.set('#101216')
          }

          // Skin
          if (/alicia_face\b|alicia_body\b/i.test(matName)) {
            mat.visible = true
            if (mat.color) mat.color.set('#FDEADE')
          }
        })
      }
    })
    attachArcReactorEmblem(vrm)
    attachStarkTechGlassesAndBeard(vrm, true)
    attachYorHeadbandRose(vrm, false)
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
  let goateeGroup = headBone.getObjectByName('__STARK_GOATEE_BEARD__') as THREE.Group | undefined

  if (!visible) {
    if (glassesGroup) {
      glassesGroup.visible = false
      glassesGroup.traverse((c) => { c.visible = false })
    }
    if (goateeGroup) {
      goateeGroup.visible = false
      goateeGroup.traverse((c) => { c.visible = false })
    }
    return
  }

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
 * Attaches Yor Forger's authentic Thorn Princess assassin assets:
 * 1. Golden floral headband crown & dual sculpted temple roses
 * 2. Dual protruding golden stylus needle hairpins ("The Thorns")
 * 3. Dangling golden dagger earrings
 * 4. Twin long raven-black side locks flowing past shoulders onto chest
 * 5. Midnight leather halter neck choker with golden ring
 * 6. Dual golden stiletto needle daggers in hands ("The Thorns")
 */
/**
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

  const metaTitle = ((vrm.meta as any)?.title || (vrm.meta as any)?.name || '') as string
  const isNativeMiku = Boolean(
    metaTitle.includes('ミク') || metaTitle.toLowerCase().includes('miku') ||
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
        segGroup.name = `__MIKU_SEG_${isLeft ? 'L' : 'R'}_${s}__`
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

export function attachYorThornPrincessFeatures(vrm: VRM, visible: boolean = true): void {
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
      // Keep executive suit jacket and trousers fully visible - NEVER strip to underwear
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
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

/**
 * Attaches Fortnite-inspired Golden Pirate Accessories to Hatsune Miku:
 * 1. 24k Gold Pirate Belt Buckle with Crossed Cutlasses & Skull Insignia at waist
 * 2. Twin 24k Gold Nautical Anchor Hair Clips with Crimson Ribbons on pigtails
 * 3. 24k Gold Pirate Captain Epaulettes with Bullion Fringes on shoulders
 */
export function attachGoldenPirateAccessories(vrm: VRM, visible: boolean = true): void {
  const hips = vrm.humanoid?.getNormalizedBoneNode('hips') || vrm.humanoid?.getNormalizedBoneNode('spine')
  const head = vrm.humanoid?.getNormalizedBoneNode('head')
  const leftShoulder = vrm.humanoid?.getNormalizedBoneNode('leftShoulder') || vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
  const rightShoulder = vrm.humanoid?.getNormalizedBoneNode('rightShoulder') || vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')
  const upperChest = vrm.humanoid?.getNormalizedBoneNode('upperChest') || vrm.humanoid?.getNormalizedBoneNode('chest')

  if (!visible) {
    if (hips) {
      const b = hips.getObjectByName('__MIKU_PIRATE_BUCKLE__')
      if (b) b.visible = false
    }
    if (head) {
      const aL = head.getObjectByName('__MIKU_ANCHOR_L__')
      if (aL) aL.visible = false
      const aR = head.getObjectByName('__MIKU_ANCHOR_R__')
      if (aR) aR.visible = false
      const bL = head.getObjectByName('__MIKU_GOLD_BOW_L__')
      if (bL) bL.visible = false
      const bR = head.getObjectByName('__MIKU_GOLD_BOW_R__')
      if (bR) bR.visible = false
      const hat = head.getObjectByName('__FORTNITE_PIRATE_HAT__')
      if (hat) hat.visible = false
    }
    if (leftShoulder) {
      const epL = leftShoulder.getObjectByName('__MIKU_EPAULETTE_L__')
      if (epL) epL.visible = false
    }
    if (rightShoulder) {
      const epR = rightShoulder.getObjectByName('__MIKU_EPAULETTE_R__')
      if (epR) epR.visible = false
    }
    if (upperChest) {
      const jb = upperChest.getObjectByName('__FORTNITE_PIRATE_JABOT__')
      if (jb) jb.visible = false
    }
    return
  }

  const goldPbrMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.92,
    roughness: 0.16,
    emissive: new THREE.Color(0xD4AF37),
    emissiveIntensity: 0.25,
  })

  const crimsonSashMat = new THREE.MeshStandardMaterial({
    color: 0x99001F,
    roughness: 0.35,
    metalness: 0.20,
  })

  // 1. Golden Pirate Belt Buckle with Crossed Cutlasses & Skull Insignia at waist
  if (hips) {
    let buckle = hips.getObjectByName('__MIKU_PIRATE_BUCKLE__') as THREE.Group | undefined
    if (!buckle) {
      buckle = new THREE.Group()
      buckle.name = '__MIKU_PIRATE_BUCKLE__'

      // Gold rectangular buckle frame
      const frameGeom = new THREE.BoxGeometry(0.065, 0.046, 0.012)
      const frame = new THREE.Mesh(frameGeom, goldPbrMat)
      buckle.add(frame)

      // Inner buckle plate
      const innerGeom = new THREE.BoxGeometry(0.052, 0.034, 0.014)
      const innerMat = new THREE.MeshStandardMaterial({ color: 0x1A1408, roughness: 0.6 })
      const inner = new THREE.Mesh(innerGeom, innerMat)
      buckle.add(inner)

      // Center gold skull pin
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.010, 12, 12), goldPbrMat)
      skull.position.set(0, 0, 0.008)
      skull.scale.set(1.0, 1.2, 0.8)
      buckle.add(skull)

      // Crossed cutlasses behind skull
      const cutlass1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.040, 6), goldPbrMat)
      cutlass1.rotation.z = Math.PI / 4
      cutlass1.position.set(0, 0, 0.006)
      buckle.add(cutlass1)

      const cutlass2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.040, 6), goldPbrMat)
      cutlass2.rotation.z = -Math.PI / 4
      cutlass2.position.set(0, 0, 0.006)
      buckle.add(cutlass2)

      hips.add(buckle)
    }
    buckle.position.set(0, 0.045, 0.118)
    buckle.visible = true
  }

  // 2. Twin Nautical Golden Anchors on head/twintails
  if (head) {
    const buildAnchor = (name: string, sign: number) => {
      let anchor = head.getObjectByName(name) as THREE.Group | undefined
      if (!anchor) {
        anchor = new THREE.Group()
        anchor.name = name

        // Top ring
        const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.010, 0.0025, 8, 16), goldPbrMat)
        topRing.position.set(0, 0.022, 0)
        anchor.add(topRing)

        // Vertical shank
        const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.036, 8), goldPbrMat)
        shank.position.set(0, 0.005, 0)
        anchor.add(shank)

        // Horizontal cross stock
        const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.024, 8), goldPbrMat)
        stock.rotation.z = Math.PI / 2
        stock.position.set(0, 0.012, 0)
        anchor.add(stock)

        // Curved bottom flukes
        const flukes = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0028, 8, 16, Math.PI), goldPbrMat)
        flukes.rotation.z = Math.PI
        flukes.position.set(0, -0.012, 0)
        anchor.add(flukes)

        // Crimson ribbon bow accent
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.010, 0.006), crimsonSashMat)
        bow.position.set(0, 0.020, 0.004)
        anchor.add(bow)

        head.add(anchor)
      }
      anchor.position.set(sign * 0.096, 0.075, 0.016)
      anchor.rotation.y = sign * 0.35
      anchor.visible = true
    }
    buildAnchor('__MIKU_ANCHOR_L__', 1)
    buildAnchor('__MIKU_ANCHOR_R__', -1)

    // Twin Shimmering Golden Bow Ribbons on Twintails (Fortnite News Signature Art)
    const buildTwintailBow = (name: string, sign: number) => {
      let bowGroup = head.getObjectByName(name) as THREE.Group | undefined
      if (!bowGroup) {
        bowGroup = new THREE.Group()
        bowGroup.name = name

        // Center knot
        const knot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), goldPbrMat)
        knot.scale.set(1.2, 1.0, 0.9)
        bowGroup.add(knot)

        // Left bow wing loop
        const wingL = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 8, 16), goldPbrMat)
        wingL.position.set(-0.026, 0.006, 0)
        wingL.rotation.set(0, 0.35, 0.25)
        wingL.scale.set(1.3, 0.8, 0.5)
        bowGroup.add(wingL)

        // Right bow wing loop
        const wingR = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 8, 16), goldPbrMat)
        wingR.position.set(0.026, 0.006, 0)
        wingR.rotation.set(0, -0.35, -0.25)
        wingR.scale.set(1.3, 0.8, 0.5)
        bowGroup.add(wingR)

        // Trailing ribbon tails fluttering downwards
        const ribbonTail1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.065, 0.003), goldPbrMat)
        ribbonTail1.position.set(-0.012, -0.038, 0.004)
        ribbonTail1.rotation.set(0.12, 0, 0.22)
        bowGroup.add(ribbonTail1)

        const ribbonTail2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.003), goldPbrMat)
        ribbonTail2.position.set(0.014, -0.042, 0.004)
        ribbonTail2.rotation.set(0.12, 0, -0.25)
        bowGroup.add(ribbonTail2)

        head.add(bowGroup)
      }
      bowGroup.position.set(sign * 0.24, -0.15, -0.06)
      bowGroup.rotation.set(0.15, sign * 0.25, sign * -0.20)
      bowGroup.visible = true
    }
    buildTwintailBow('__MIKU_GOLD_BOW_L__', 1)
    buildTwintailBow('__MIKU_GOLD_BOW_R__', -1)
  }

  // 3. Golden Pirate Captain Epaulettes on shoulders
  const buildEpaulette = (shoulder: THREE.Object3D | null | undefined, name: string, isLeft: boolean) => {
    if (!shoulder) return
    let ep = shoulder.getObjectByName(name) as THREE.Group | undefined
    if (!ep) {
      ep = new THREE.Group()
      ep.name = name

      const sign = isLeft ? 1 : -1
      // Gold shoulder crescent plate
      const crescent = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.010, 16), goldPbrMat)
      crescent.position.set(sign * 0.02, 0.01, 0)
      ep.add(crescent)

      // Gold bullion hanging fringes
      for (let f = 0; f < 5; f++) {
        const fringe = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.026, 6), goldPbrMat)
        const angle = (f / 4) * Math.PI - Math.PI / 2
        fringe.position.set(
          sign * (0.02 + Math.cos(angle) * 0.028),
          -0.018,
          Math.sin(angle) * 0.028
        )
        ep.add(fringe)
      }
      shoulder.add(ep)
    }
    ep.visible = true
  }
  buildEpaulette(leftShoulder, '__MIKU_EPAULETTE_L__', true)
  buildEpaulette(rightShoulder, '__MIKU_EPAULETTE_R__', false)

  // 4. White Frilly Pirate Cravat / Jabot with Radiant Golden Heart Gem (Fortnite Collab Signature)
  if (upperChest) {
    let jabot = upperChest.getObjectByName('__FORTNITE_PIRATE_JABOT__') as THREE.Group | undefined
    if (!jabot) {
      jabot = new THREE.Group()
      jabot.name = '__FORTNITE_PIRATE_JABOT__'

      const frillWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xFAFAFA,
        roughness: 0.40,
        metalness: 0.05,
      })

      // Layer 1 (Top frill collar band)
      const frill1 = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.042, 0.014, 16, 1, true), frillWhiteMat)
      frill1.position.set(0, 0.052, 0.065)
      frill1.rotation.x = 0.25
      frill1.scale.set(1.1, 1.0, 0.7)
      jabot.add(frill1)

      // Layer 2 (Middle ruffled tier)
      const frill2 = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.018, 16, 1, true), frillWhiteMat)
      frill2.position.set(0, 0.036, 0.070)
      frill2.rotation.x = 0.22
      frill2.scale.set(1.15, 1.0, 0.75)
      jabot.add(frill2)

      // Layer 3 (Bottom pleated cascade frill)
      const frill3 = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.044, 0.022, 16, 1, true), frillWhiteMat)
      frill3.position.set(0, 0.018, 0.072)
      frill3.rotation.x = 0.18
      frill3.scale.set(1.0, 1.0, 0.7)
      jabot.add(frill3)

      // 24k Radiant Gold Heart Brooch Gem (Centerpiece)
      const heartGroup = new THREE.Group()
      heartGroup.position.set(0, 0.046, 0.088)

      const heartMat = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.95,
        roughness: 0.12,
        emissive: new THREE.Color(0xFFA500),
        emissiveIntensity: 0.45,
      })

      const heartL = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 12), heartMat)
      heartL.position.set(-0.004, 0.003, 0)
      heartGroup.add(heartL)

      const heartR = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 12, 12), heartMat)
      heartR.position.set(0.004, 0.003, 0)
      heartGroup.add(heartR)

      const heartBase = new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.010, 12), heartMat)
      heartBase.rotation.x = Math.PI
      heartBase.position.set(0, -0.0035, 0)
      heartGroup.add(heartBase)

      jabot.add(heartGroup)
      upperChest.add(jabot)
    }
    jabot.visible = true
  }

  // 5. Fortnite Gold Hatsune Miku Pirate Captain Tricorn Hat
  if (head) {
    let hat = head.getObjectByName('__FORTNITE_PIRATE_HAT__') as THREE.Group | undefined
    if (!hat) {
      hat = new THREE.Group()
      hat.name = '__FORTNITE_PIRATE_HAT__'

      // Solid Oval Crown Dome (Polished 24k Gold)
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.082, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.50),
        goldPbrMat
      )
      crown.position.set(0, 0.016, 0)
      crown.scale.set(1.0, 0.82, 1.12)
      hat.add(crown)

      // Solid Wide Tricorn Brim Base
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.152, 0.016, 36), goldPbrMat)
      brim.position.set(0, 0.018, 0)
      hat.add(brim)

      // Front Upturned Flap (Solid curved plate tilted outward)
      const frontFlap = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.076, 0.015), goldPbrMat)
      frontFlap.position.set(0, 0.052, 0.102)
      frontFlap.rotation.x = -0.36
      hat.add(frontFlap)

      // Left Upturned Flap
      const leftFlap = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.072, 0.015), goldPbrMat)
      leftFlap.position.set(-0.096, 0.050, -0.038)
      leftFlap.rotation.set(0.16, -Math.PI / 3, 0.36)
      hat.add(leftFlap)

      // Right Upturned Flap
      const rightFlap = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.072, 0.015), goldPbrMat)
      rightFlap.position.set(0.096, 0.050, -0.038)
      rightFlap.rotation.set(0.16, Math.PI / 3, -0.36)
      hat.add(rightFlap)

      // Big Iconic Golden Pirate Skull & Crossed Bones Emblem (Fortnite poster signature)
      const skullGroup = new THREE.Group()
      skullGroup.position.set(0, 0.055, 0.112)

      // Cranium
      const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.020, 20, 20), goldPbrMat)
      cranium.scale.set(1.0, 1.25, 0.85)
      skullGroup.add(cranium)

      // Jaw
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, 0.012), goldPbrMat)
      jaw.position.set(0, -0.016, 0.004)
      skullGroup.add(jaw)

      // Deep Dark Eye Sockets
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x150A00 })
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 14, 14), eyeMat)
      eyeL.position.set(-0.007, 0.004, 0.016)
      skullGroup.add(eyeL)

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 14, 14), eyeMat)
      eyeR.position.set(0.007, 0.004, 0.016)
      skullGroup.add(eyeR)

      // Crossed Bones with Knuckle Ends
      const addBone = (rotZ: number) => {
        const boneGrp = new THREE.Group()
        boneGrp.rotation.z = rotZ
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.062, 10), goldPbrMat)
        boneGrp.add(shaft)
        const k1 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), goldPbrMat)
        k1.position.set(0, 0.031, 0)
        boneGrp.add(k1)
        const k2 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 10), goldPbrMat)
        k2.position.set(0, -0.031, 0)
        boneGrp.add(k2)
        return boneGrp
      }
      const b1 = addBone(Math.PI / 4)
      b1.position.set(0, 0, -0.006)
      skullGroup.add(b1)
      const b2 = addBone(-Math.PI / 4)
      b2.position.set(0, 0, -0.006)
      skullGroup.add(b2)

      hat.add(skullGroup)

      // Sweeping Golden Feather Plume on Right Side (Gracefully sweeping backward)
      const feather = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.022, 0.160, 16), goldPbrMat)
      feather.position.set(0.108, 0.075, 0.010)
      feather.rotation.set(-0.55, -0.15, 0.40)
      feather.scale.set(0.38, 1.0, 1.35)
      hat.add(feather)

      head.add(hat)
    }
    hat.scale.set(1.20, 1.15, 1.20)
    hat.position.set(0, 0.180, 0.005)
    hat.rotation.set(-0.12, 0, 0)
    hat.visible = true
  }

  // Remove any legacy cravat so Miku's face and anime lips remain 100% unobstructed
  if (head) {
    const oldCravat = head.getObjectByName('__PIRATE_CRAVAT__')
    if (oldCravat) {
      head.remove(oldCravat)
    }
  }
}

export const AVATAR_SKINS: Record<string, AvatarSkin> = {
  // Hatsune Miku Skins
  'miku-classic-idol': MikuClassicIdolSkin,
  'miku-golden-pirate': MikuGoldenPirateSkin,
  'miku-magical-mirai': MikuMagicalMiraiSkin,
  'miku-cyber-diva': MikuCyberDivaSkin,
  'miku-sakura': MikuSakuraSkin,

  // Legacy Yor aliases
  'yor-thorn-princess': MikuClassicIdolSkin,
  'yor-crimson-sweater': MikuMagicalMiraiSkin,
  'yor-berlint-gala': MikuCyberDivaSkin,

  // Ada Wong Costumes
  'ada-red': AdaRedSkin,
  'crimson_turtleneck': CrimsonTurtleneckSkin,
  'black_stealth': BlackStealthSkin,
  'crimson_jacket': CrimsonJacketSkin,
  'ada-cyber-operative': AdaCyberOperativeSkin,

  // Tony Stark Costumes
  'stark-mark-armor': StarkArcTraderSkin,
  'stark-arc-trader': StarkArcTraderSkin,
  'stark-executive-suit': StarkExecutiveSuitSkin,
  'stark-stealth-hoodie': StarkStealthHoodieSkin,

  // Wardrobe / Lifestyle Variants
  'cozy-night': CozyNightSkin,
  'original-pastel': OriginalPastelSkin,
}

/**
 * Attaches or updates the Tactical Comms Headset with boom mic and LED indicator
 */
export function updateCommsHeadset(vrm: VRM, visible: boolean, isListening: boolean): void {
  const headBone = vrm.humanoid?.getNormalizedBoneNode('head')
  if (!headBone) return

  let headsetGroup = headBone.getObjectByName('__ada_comms_headset__') as THREE.Group | undefined

  if (!visible) {
    if (headsetGroup) {
      headsetGroup.visible = false
      headsetGroup.traverse((c) => { c.visible = false })
    }
    return
  }

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
  const neck = humanoid.getNormalizedBoneNode('neck')
  const head = humanoid.getNormalizedBoneNode('head')
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

    // 6. Tony Stark masculine head/neck proportions (slight head scale reduction for mature male face)
    if (neck) neck.scale.set(1.08, 1.05, 1.08)
    if (head) head.scale.set(0.94, 0.94, 0.94)

    // Hide feminine hair ribbons, hair bows, and collapse skirt into male suit trousers
    vrm.scene.traverse((obj) => {
      if (/hair[2-4]_[LR]|mituami|ribbon|accessory/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      // Keep suit garment meshes fully visible
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = true
        obj.scale.set(1.0, 1.0, 1.0)
      }
    })

    // Attach Stark Tech Glasses, Goatee Beard, and Arc Reactor
    attachStarkTechGlassesAndBeard(vrm, true)
    attachArcReactorEmblem(vrm)
    attachYorHeadbandRose(vrm, false)

    // Apply Stark Suit textures & charcoal materials
    StarkArcTraderSkin.apply(vrm)

  } else if (char === 'mira') {
    // 🎤 HATSUNE MIKU (初音ミク): Slender Youthful Pop Idol Poise (158cm / 5'2")
    const metaTitle = ((vrm.meta as any)?.title || (vrm.meta as any)?.name || '') as string
    const isNativeMiku = Boolean(
      metaTitle.includes('ミク') || metaTitle.toLowerCase().includes('miku') ||
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

    // 🔴 Ada Wong: confident adult spy — slightly defined shoulders, narrower head = mature adult
    if (leftShoulder) leftShoulder.scale.set(1.06, 1.02, 1.04)
    if (rightShoulder) rightShoulder.scale.set(1.06, 1.02, 1.04)
    if (chest) chest.scale.set(1.04, 1.02, 1.05) // subtle adult chest definition
    if (hips) hips.scale.set(1.08, 1.0, 1.06) // feminine hips but athletic (not exaggerated)
    if (neck) neck.scale.set(1.02, 1.02, 1.02)
    if (head) head.scale.set(0.98, 0.98, 0.98)

    // Strictly HIDE schoolgirl braids, ribbons, and puffy sleeves
    vrm.scene.traverse((obj) => {
      if (/hair[2-8]_[LR]|mituami|ribbon|cloth_ribbon|other/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/cloth1|cloth2/i.test(obj.name)) {
        obj.visible = false
        obj.scale.set(0, 0, 0)
      }
      if (/skirt_\d+_\d+/i.test(obj.name)) {
        // Sleek pencil-cut cocktail dress
        obj.scale.set(0.72, 1.0, 0.72)
      }
    })

    // Reset makeup cache so face canvas re-applies fresh when switching back to Ada
    vrm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat: any) => {
          if (mat && mat.userData) {
            delete mat.userData.__adaMakeupApplied
            delete mat.userData.__yorMakeupApplied
            delete mat.userData.__yorThornMakeupApplied
          }
        })
      }
    })

    attachStarkTechGlassesAndBeard(vrm, false)
    attachYorThornPrincessFeatures(vrm, false)
    attachAdaTacticalAccessories(vrm, true)

    const chestBone = humanoid.getNormalizedBoneNode('chest') || humanoid.getNormalizedBoneNode('upperChest')
    if (chestBone) {
      const emblem = chestBone.getObjectByName('__STARK_ARC_REACTOR__')
      if (emblem) emblem.visible = false
    }

    AdaRedSkin.apply(vrm)
  }
}

