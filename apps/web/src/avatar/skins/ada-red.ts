import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'

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

          // Hair Materials -> Pitch Charcoal/Jet Black with subtle sheen
          if (/hair/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#090a0f')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#040407')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#000000')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#040407')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#000000')
            if (mat.roughness !== undefined) mat.roughness = 0.35
          }

          // Halter Straps, Choker, and Lingerie Underlayer -> Sleek Midnight Spy Black
          else if (/body_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#121318')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#060609')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#000000')
            if (mat.roughness !== undefined) mat.roughness = 0.5
            if (mat.metalness !== undefined) mat.metalness = 0.2
          }

          // Main Cocktail Dress Bodice & Skirt -> Deep Crimson Velvet Red
          else if (/wear|cloth|dress/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#B0101E')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#320308')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#150103')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#320308')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#150103')
            if (mat.roughness !== undefined) mat.roughness = 0.52
            if (mat.metalness !== undefined) mat.metalness = 0.15
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

export const AVATAR_SKINS: Record<string, AvatarSkin> = {
  'ada-red': AdaRedSkin,
  'cozy-night': CozyNightSkin,
  'original-pastel': OriginalPastelSkin,
}

export function applyAvatarSkin(vrm: VRM, skinId: string = 'ada-red'): void {
  const skin = AVATAR_SKINS[skinId] || AdaRedSkin
  skin.apply(vrm)
}
