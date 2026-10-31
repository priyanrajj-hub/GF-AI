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
      // Hide twin-tail bones to leave sleek short bob hair
      if (/hair[1-8]_[LR]/i.test(obj.name)) {
        obj.scale.set(0, 0, 0)
      }

      // Hide bow & accessory meshes & ribbons
      if (
        /ribbon|other|bow|accessory/i.test(obj.name) ||
        obj.name.toLowerCase().includes('cloth_ribbon')
      ) {
        obj.visible = false
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

          // Hair Materials -> Pitch Charcoal Black with subtle sheen
          if (/hair/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#111218')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#06060a')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#000000')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#08080c')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#050508')
            if (mat.roughness !== undefined) mat.roughness = 0.4
          }

          // Clothing / Dress / Sleeves / Stockings -> Deep Crimson Red & Black
          else if (/wear|cloth|dress|body_wear/i.test(matName)) {
            mat.visible = true
            mat.transparent = false
            mat.opacity = 1.0
            if (mat.color) mat.color.set('#B0101E')
            if (mat.shadeColorFactor) mat.shadeColorFactor.set('#3d0308')
            if (mat.outlineColorFactor) mat.outlineColorFactor.set('#1a0104')
            if ('shadeColor' in mat && mat.shadeColor) mat.shadeColor.set('#3d0308')
            if ('outlineColor' in mat && mat.outlineColor) mat.outlineColor.set('#1a0104')
            if (mat.roughness !== undefined) mat.roughness = 0.55
            if (mat.metalness !== undefined) mat.metalness = 0.15
          }

          // Eye Accent -> Rich confident tint
          else if (/eye/i.test(matName) && !/white/i.test(matName)) {
            if (mat.color) mat.color.set('#c4823f')
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
