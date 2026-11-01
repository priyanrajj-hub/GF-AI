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

                    // 1. Soft Rosy Cheek Blush
                    const gradL = ctx.createRadialGradient(380, 460, 4, 380, 460, 45)
                    gradL.addColorStop(0, 'rgba(238, 90, 110, 0.40)')
                    gradL.addColorStop(1, 'rgba(238, 90, 110, 0)')
                    ctx.fillStyle = gradL
                    ctx.beginPath()
                    ctx.arc(380, 460, 45, 0, Math.PI * 2)
                    ctx.fill()

                    const gradR = ctx.createRadialGradient(644, 460, 4, 644, 460, 45)
                    gradR.addColorStop(0, 'rgba(238, 90, 110, 0.40)')
                    gradR.addColorStop(1, 'rgba(238, 90, 110, 0)')
                    ctx.fillStyle = gradR
                    ctx.beginPath()
                    ctx.arc(644, 460, 45, 0, Math.PI * 2)
                    ctx.fill()

                    // 2. Ada Wong's Signature Ruby Lips (Cupid's bow + fullness)
                    ctx.fillStyle = 'rgba(185, 12, 30, 0.92)'
                    ctx.beginPath()
                    ctx.moveTo(476, 594)
                    ctx.quadraticCurveTo(494, 582, 505, 587)
                    ctx.quadraticCurveTo(512, 591, 519, 587)
                    ctx.quadraticCurveTo(530, 582, 548, 594)
                    ctx.quadraticCurveTo(534, 612, 512, 613)
                    ctx.quadraticCurveTo(490, 612, 476, 594)
                    ctx.closePath()
                    ctx.fill()

                    // Inner velvet depth
                    ctx.fillStyle = 'rgba(110, 5, 15, 0.85)'
                    ctx.beginPath()
                    ctx.ellipse(512, 597, 24, 5, 0, 0, Math.PI * 2)
                    ctx.fill()

                    // Glossy lower-lip highlight
                    ctx.fillStyle = 'rgba(255, 220, 230, 0.55)'
                    ctx.beginPath()
                    ctx.ellipse(512, 604, 11, 3, 0, 0, Math.PI * 2)
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

export const AVATAR_SKINS: Record<string, AvatarSkin> = {
  'ada-red': AdaRedSkin,
  'crimson_turtleneck': CrimsonTurtleneckSkin,
  'black_stealth': BlackStealthSkin,
  'crimson_jacket': CrimsonJacketSkin,
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

