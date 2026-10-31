import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { createHologramMaterial } from '../scene/HologramShader.js'

interface VrmAvatarProps {
  modelUrl: string
  hologramColor?: string
  solidRendering?: boolean
}

export const VrmAvatar: React.FC<VrmAvatarProps> = ({
  modelUrl,
  hologramColor = '#00f3ff',
  solidRendering = false,
}) => {
  const [vrm, setVrm] = useState<VRM | null>(null)
  const [loadError, setLoadError] = useState<boolean>(false)
  const avatarGroupRef = useRef<THREE.Group>(null)
  const materialsRef = useRef<THREE.ShaderMaterial[]>([])

  const {
    systemState,
    currentEmotion,
    emotionIntensity,
    activeGesture,
    audioFrequencies,
    glitchTrigger,
  } = useAppStore()

  const { pointer } = useThree()

  // Blinking state
  const nextBlinkTime = useRef<number>(2.0)
  const blinkDuration = 0.18
  const isBlinking = useRef<boolean>(false)
  const blinkProgress = useRef<number>(0)

  // Glitch decay timer
  const glitchIntensity = useRef<number>(0)

  // 1. Load VRM Model
  useEffect(() => {
    setLoadError(false)
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    loader.load(
      modelUrl,
      (gltf) => {
        const loadedVrm: VRM = gltf.userData.vrm
        if (!loadedVrm) {
          console.warn('[VRM] No VRM instance found in loaded asset, falling back to procedural mesh.')
          setLoadError(true)
          return
        }

        // Optimize and rotate to face camera
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.removeUnnecessaryJoints(gltf.scene)
        loadedVrm.scene.rotation.y = Math.PI // Face forward

        // Apply custom Hologram Shader to avatar meshes
        const holoMat = createHologramMaterial(hologramColor, '#ff007f')
        materialsRef.current = [holoMat]

        loadedVrm.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh
            if (!solidRendering) {
              mesh.material = holoMat
            }
          }
        })

        setVrm(loadedVrm)
      },
      undefined,
      (err) => {
        console.warn(`[VRM] Failed to load from ${modelUrl}, displaying procedural holographic avatar:`, err)
        setLoadError(true)
      }
    )

    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene)
      }
    }
  }, [modelUrl, solidRendering])

  // Update shader color when changed in settings
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      mat.uniforms.uHoloColor.value.set(hologramColor)
      mat.uniforms.uSolid.value = solidRendering ? 1.0 : 0.0
    })
  }, [hologramColor, solidRendering])

  // Trigger glitch when speaking starts or state changes
  useEffect(() => {
    glitchIntensity.current = 0.8
  }, [systemState, glitchTrigger])

  // 2. Animation, Lip-Sync & Life Loop per frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    // Decay glitch
    if (glitchIntensity.current > 0) {
      glitchIntensity.current = Math.max(0, glitchIntensity.current - delta * 2.5)
    }

    // Update shader uniforms
    materialsRef.current.forEach((mat) => {
      mat.uniforms.uTime.value = time
      mat.uniforms.uGlitch.value = glitchIntensity.current
    })

    if (!vrm) return

    // Update VRM internal spring bones and physics
    vrm.update(delta)

    const humanoid = vrm.humanoid
    if (!humanoid) return

    // --- A. Procedural Life Loop (Breathing & Weight Shift) ---
    const breath = Math.sin(time * 2.0) * 0.02
    const spine = humanoid.getNormalizedBoneNode('spine')
    const chest = humanoid.getNormalizedBoneNode('chest')
    if (spine) spine.rotation.x = breath * 0.5
    if (chest) chest.rotation.x = breath

    // Subtle hip weight sway
    const hips = humanoid.getNormalizedBoneNode('hips')
    if (hips) {
      hips.position.x = Math.sin(time * 0.8) * 0.015
      hips.rotation.y = Math.sin(time * 0.5) * 0.02
    }

    // --- B. Soft Head & Eye Tracking ---
    const head = humanoid.getNormalizedBoneNode('head')
    const neck = humanoid.getNormalizedBoneNode('neck')
    if (head && neck) {
      // Clamped smooth tracking of user cursor/touch
      const targetY = THREE.MathUtils.clamp(-pointer.x * 0.45, -0.6, 0.6)
      const targetX = THREE.MathUtils.clamp(-pointer.y * 0.35, -0.4, 0.4)

      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, delta * 3.0)
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, delta * 3.0)
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetY * 0.4, delta * 3.0)
    }

    // --- C. Natural Randomized Blinking ---
    if (time > nextBlinkTime.current) {
      isBlinking.current = true
      blinkProgress.current = 0
      nextBlinkTime.current = time + 2.5 + Math.random() * 3.0
    }

    if (isBlinking.current) {
      blinkProgress.current += delta / blinkDuration
      const blinkValue = Math.sin(blinkProgress.current * Math.PI)
      if (blinkProgress.current >= 1.0) {
        isBlinking.current = false
        if (vrm.expressionManager) {
          vrm.expressionManager.setValue('blink', 0)
        }
      } else if (vrm.expressionManager) {
        vrm.expressionManager.setValue('blink', blinkValue)
      }
    }

    // --- D. Audio Lip-Sync Driving Vowels (A, I, U, E, O) ---
    let avgAudio = 0
    if (audioFrequencies && audioFrequencies.length > 0) {
      const sum = audioFrequencies.reduce((acc, v) => acc + v, 0)
      avgAudio = sum / (audioFrequencies.length * 255)
    }

    // If speaking, oscillate mouth blendshapes based on amplitude
    if (systemState === 'speaking' || avgAudio > 0.05) {
      const mouthOpen = Math.min(1.0, (avgAudio > 0.05 ? avgAudio * 2.2 : 0.4) + Math.sin(time * 18.0) * 0.25)
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('aa', Math.max(0, mouthOpen * 0.8))
        vrm.expressionManager.setValue('oh', Math.max(0, (1 - mouthOpen) * 0.3))
      }
    } else {
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('aa', 0)
        vrm.expressionManager.setValue('oh', 0)
      }
    }

    // --- E. Emotion Expression Blending ---
    if (vrm.expressionManager) {
      const targetHappy = currentEmotion === 'happy' || currentEmotion === 'playful' ? emotionIntensity * 0.8 : 0
      const targetSad = currentEmotion === 'sad' ? emotionIntensity * 0.8 : 0
      const targetSurprised = currentEmotion === 'surprised' || currentEmotion === 'excited' ? emotionIntensity * 0.7 : 0
      const targetRelaxed = currentEmotion === 'calm' ? 0.5 : 0

      // Smoothly blend expressions
      const exp = vrm.expressionManager
      exp.setValue('happy', THREE.MathUtils.lerp(exp.getValue('happy') || 0, targetHappy, delta * 4.0))
      exp.setValue('sad', THREE.MathUtils.lerp(exp.getValue('sad') || 0, targetSad, delta * 4.0))
      exp.setValue('surprised', THREE.MathUtils.lerp(exp.getValue('surprised') || 0, targetSurprised, delta * 4.0))
      exp.setValue('relaxed', THREE.MathUtils.lerp(exp.getValue('relaxed') || 0, targetRelaxed, delta * 4.0))
    }

    // --- F. Body Gestures ---
    const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
    const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
    const rightForeArm = humanoid.getNormalizedBoneNode('rightLowerArm')

    if (activeGesture === 'wave' && rightArm && rightForeArm) {
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, delta * 4.0)
      rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, 1.2 + Math.sin(time * 8.0) * 0.35, delta * 6.0)
    } else if (activeGesture === 'fist_pump' && rightArm) {
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.1 + Math.sin(time * 6.0) * 0.2, delta * 5.0)
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.6, delta * 4.0)
    } else if (activeGesture === 'thinking_pose' && head && rightArm) {
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.15, delta * 3.0)
    } else if (leftArm && rightArm) {
      // return to natural idle stance
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.15, delta * 3.0)
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.15, delta * 3.0)
    }
  })

  // Procedural Holographic Avatar Fallback (Rendered if VRM is not loaded)
  if (loadError || !vrm) {
    return (
      <group ref={avatarGroupRef} position={[0, -0.9, 0]}>
        {/* Holographic Torso */}
        <mesh position={[0, 1.1, 0]}>
          <capsuleGeometry args={[0.22, 0.6, 16, 32]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
        {/* Holographic Head */}
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
        {/* Holographic Visor Ring */}
        <mesh position={[0, 1.62, 0.12]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.1]} />
          <meshBasicMaterial color={hologramColor} toneMapped={false} />
        </mesh>
        {/* Holographic Limbs */}
        <mesh position={[-0.32, 1.0, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.7, 16]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
        <mesh position={[0.32, 1.0, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.7, 16]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
        <mesh position={[-0.14, 0.4, 0]}>
          <cylinderGeometry args={[0.09, 0.07, 0.8, 16]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
        <mesh position={[0.14, 0.4, 0]}>
          <cylinderGeometry args={[0.09, 0.07, 0.8, 16]} />
          <primitive object={materialsRef.current[0] || createHologramMaterial(hologramColor)} />
        </mesh>
      </group>
    )
  }

  return (
    <primitive
      ref={avatarGroupRef}
      object={vrm.scene}
      position={[0, -0.95, 0]}
    />
  )
}
