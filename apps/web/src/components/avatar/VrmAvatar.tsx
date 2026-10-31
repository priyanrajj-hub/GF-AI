import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'

interface VrmAvatarProps {
  modelUrl: string
  hologramColor?: string
  renderMode?: 'solid' | 'holo-lite' | 'holo-full'
}

export const VrmAvatar: React.FC<VrmAvatarProps> = ({
  modelUrl,
  hologramColor = '#00f3ff',
  renderMode = 'holo-lite',
}) => {
  const [vrm, setVrm] = useState<VRM | null>(null)
  const [glbScene, setGlbScene] = useState<THREE.Group | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const avatarGroupRef = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const fallbackMeshRef = useRef<THREE.Group>(null)

  const {
    systemState,
    currentEmotion,
    emotionIntensity,
    activeGesture,
    audioFrequencies,
    glitchTrigger,
  } = useAppStore()

  const { pointer } = useThree()

  // Blinking state for VRM
  const nextBlinkTime = useRef<number>(2.0)
  const blinkDuration = 0.18
  const isBlinking = useRef<boolean>(false)
  const blinkProgress = useRef<number>(0)

  // Emotion memory for smooth drifting
  const currentEmotionRef = useRef<string>(currentEmotion)
  const emotionWeightRef = useRef<number>(0)

  // Glitch decay
  const glitchIntensity = useRef<number>(0)

  // 1. Load 3D Model (VRM or GLB)
  useEffect(() => {
    setIsLoading(true)
    setLoadError(null)
    setLoadingProgress(10)

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const activeUrl = modelUrl || '/models/ada.vrm'

    loader.load(
      activeUrl,
      (gltf) => {
        setIsLoading(false)
        setLoadingProgress(100)
        const loadedVrm: VRM | undefined = gltf.userData.vrm

        if (loadedVrm) {
          // --- VRM Humanoid Model ---
          VRMUtils.removeUnnecessaryVertices(gltf.scene)
          VRMUtils.removeUnnecessaryJoints(gltf.scene)

          // Rotate VRM 0.x models to face forward
          try {
            VRMUtils.rotateVRM0(loadedVrm)
          } catch {
            loadedVrm.scene.rotation.y = Math.PI
          }

          loadedVrm.scene.position.set(0, -0.95, 0)

          // Disable frustum culling on all skinned meshes to prevent clipping
          loadedVrm.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh
              mesh.frustumCulled = false

              const applyHolo = (mat: any) => {
                if (!mat) return
                if (renderMode === 'solid') {
                  mat.transparent = false
                  mat.opacity = 1.0
                  if ('emissive' in mat) mat.emissiveIntensity = 0.0
                } else if (renderMode === 'holo-lite') {
                  // Hologram-lite: keep original textures, add subtle 0.92 opacity + emissive rim glow
                  mat.transparent = true
                  mat.opacity = 0.92
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(hologramColor)
                    mat.emissiveIntensity = 0.35
                  }
                } else {
                  // Full Hologram: translucent neon glow
                  mat.transparent = true
                  mat.opacity = 0.65
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(hologramColor)
                    mat.emissiveIntensity = 0.75
                  }
                }
              }

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(applyHolo)
              } else if (mesh.material) {
                applyHolo(mesh.material)
              }
            }
          })

          // Set initial relaxed A-pose (arms down, not T-pose)
          const humanoid = loadedVrm.humanoid
          if (humanoid) {
            const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
            const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
            if (leftArm) leftArm.rotation.z = 1.18
            if (rightArm) rightArm.rotation.z = -1.18
          }

          setVrm(loadedVrm)
          setGlbScene(null)
          mixerRef.current = null
        } else if (gltf.scene) {
          // --- Standard GLB Model (e.g. Michelle or custom uploaded GLB) ---
          const scene = gltf.scene
          scene.position.set(0, -0.95, 0)
          scene.scale.set(1.0, 1.0, 1.0)

          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh
              mesh.frustumCulled = false

              const applyHolo = (mat: any) => {
                if (!mat) return
                if (renderMode === 'solid') {
                  mat.transparent = false
                  mat.opacity = 1.0
                  if ('emissive' in mat) mat.emissiveIntensity = 0.0
                } else if (renderMode === 'holo-lite') {
                  mat.transparent = true
                  mat.opacity = 0.92
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(hologramColor)
                    mat.emissiveIntensity = 0.35
                  }
                } else {
                  mat.transparent = true
                  mat.opacity = 0.65
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(hologramColor)
                    mat.emissiveIntensity = 0.75
                  }
                }
              }

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(applyHolo)
              } else if (mesh.material) {
                applyHolo(mesh.material)
              }
            }
          })

          // Setup animation mixer if gltf has animations
          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(scene)
            const clip =
              gltf.animations.find((a: any) => /idle|standing|dance|talk/i.test(a.name)) ||
              gltf.animations[0]
            const action = mixer.clipAction(clip)
            action.play()
            mixerRef.current = mixer
          } else {
            mixerRef.current = null
          }

          setGlbScene(scene)
          setVrm(null)
        } else {
          setLoadError('Unrecognized 3D format')
        }
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100))
        }
      },
      (err) => {
        console.warn(`[3D Avatar] Failed to load model from ${activeUrl}:`, err)
        setIsLoading(false)
        setLoadError(`Failed to load ${activeUrl}`)
      }
    )

    return () => {
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene)
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [modelUrl, renderMode, hologramColor])

  // Trigger glitch when speaking starts
  useEffect(() => {
    glitchIntensity.current = 0.75
  }, [systemState, glitchTrigger])

  // 2. Animation Loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    if (glitchIntensity.current > 0) {
      glitchIntensity.current = Math.max(0, glitchIntensity.current - delta * 2.5)
    }

    // A. Update GLB Mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // B. If Standard GLB without bones animation, add gentle breathing & cursor parallax
    if (glbScene && !mixerRef.current) {
      const breath = Math.sin(time * 2.0) * 0.015
      glbScene.position.y = -0.95 + breath
      glbScene.rotation.y = THREE.MathUtils.lerp(glbScene.rotation.y, pointer.x * 0.25, delta * 3.0)
    }

    // C. VRM Avatar Skeletal, Eye & Expression Control
    if (vrm) {
      vrm.update(delta)
      const humanoid = vrm.humanoid

      if (humanoid) {
        // Natural procedural breathing
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

        // Smooth head and neck tracking of pointer
        const head = humanoid.getNormalizedBoneNode('head')
        const neck = humanoid.getNormalizedBoneNode('neck')
        if (head && neck) {
          const targetY = THREE.MathUtils.clamp(-pointer.x * 0.45, -0.55, 0.55)
          const targetX = THREE.MathUtils.clamp(-pointer.y * 0.35, -0.35, 0.35)
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, delta * 3.0)
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, delta * 3.0)
          neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetY * 0.35, delta * 3.0)
        }

        // Visible gestures triggered by LLM actions
        const leftArm = humanoid.getNormalizedBoneNode('leftUpperArm')
        const rightArm = humanoid.getNormalizedBoneNode('rightUpperArm')
        const rightForeArm = humanoid.getNormalizedBoneNode('rightLowerArm')

        if (activeGesture === 'wave' && rightArm && rightForeArm) {
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.2, delta * 4.0)
          rightForeArm.rotation.y = THREE.MathUtils.lerp(
            rightForeArm.rotation.y,
            1.2 + Math.sin(time * 8.0) * 0.35,
            delta * 6.0
          )
        } else if (activeGesture === 'fist_pump' && rightArm) {
          rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.1 + Math.sin(time * 6.0) * 0.2, delta * 5.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.6, delta * 4.0)
        } else if (activeGesture === 'nod' && head) {
          head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, Math.sin(time * 8.0) * 0.2, delta * 5.0)
        } else if (activeGesture === 'shake' && head) {
          head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(time * 8.0) * 0.25, delta * 5.0)
        } else if (activeGesture === 'thinking_pose' && head && rightArm) {
          head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.15, delta * 3.0)
        } else if (leftArm && rightArm) {
          // Relaxed natural A-pose
          leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, 1.18, delta * 3.0)
          rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -1.18, delta * 3.0)
        }
      }

      // Natural randomized blinking
      if (time > nextBlinkTime.current) {
        isBlinking.current = true
        blinkProgress.current = 0
        nextBlinkTime.current = time + 2.5 + Math.random() * 3.0
      }
      if (isBlinking.current) {
        blinkProgress.current += delta / blinkDuration
        const blinkVal = Math.sin(blinkProgress.current * Math.PI)
        if (blinkProgress.current >= 1.0) {
          isBlinking.current = false
          vrm.expressionManager?.setValue('blink', 0)
        } else {
          vrm.expressionManager?.setValue('blink', blinkVal)
        }
      }

      // Audio Lip-Sync (aa / oh blendshapes)
      let avgAudio = 0
      if (audioFrequencies && audioFrequencies.length > 0) {
        const sum = audioFrequencies.reduce((acc: number, v: number) => acc + v, 0)
        avgAudio = sum / (audioFrequencies.length * 255)
      }
      if (systemState === 'speaking' || avgAudio > 0.05) {
        const mouthOpen = Math.min(1.0, (avgAudio > 0.05 ? avgAudio * 2.2 : 0.4) + Math.sin(time * 18.0) * 0.25)
        vrm.expressionManager?.setValue('aa', Math.max(0, mouthOpen * 0.8))
        vrm.expressionManager?.setValue('oh', Math.max(0, (1 - mouthOpen) * 0.3))
      } else {
        // Fully close mouth in silence
        vrm.expressionManager?.setValue('aa', 0)
        vrm.expressionManager?.setValue('oh', 0)
      }

      // Facial Emotions with smooth drift
      if (vrm.expressionManager) {
        const targetHappy = currentEmotion === 'happy' || currentEmotion === 'playful' ? emotionIntensity * 0.8 : 0
        const targetSad = currentEmotion === 'sad' ? emotionIntensity * 0.8 : 0
        const targetSurprised = currentEmotion === 'surprised' || currentEmotion === 'excited' ? emotionIntensity * 0.7 : 0
        const targetRelaxed = currentEmotion === 'calm' ? 0.5 : 0

        const exp = vrm.expressionManager
        exp.setValue('happy', THREE.MathUtils.lerp(exp.getValue('happy') || 0, targetHappy, delta * 3.0))
        exp.setValue('sad', THREE.MathUtils.lerp(exp.getValue('sad') || 0, targetSad, delta * 3.0))
        exp.setValue('surprised', THREE.MathUtils.lerp(exp.getValue('surprised') || 0, targetSurprised, delta * 3.0))
        exp.setValue('relaxed', THREE.MathUtils.lerp(exp.getValue('relaxed') || 0, targetRelaxed, delta * 3.0))
      }
    }

    // D. Procedural Fallback Animation
    if (fallbackMeshRef.current) {
      const breath = Math.sin(time * 2.0) * 0.02
      fallbackMeshRef.current.position.y = -0.95 + breath
      fallbackMeshRef.current.rotation.y = THREE.MathUtils.lerp(
        fallbackMeshRef.current.rotation.y,
        pointer.x * 0.35,
        delta * 3.0
      )
    }
  })

  // 1. If VRM loaded successfully
  if (vrm) {
    return <primitive ref={avatarGroupRef} object={vrm.scene} />
  }

  // 2. If Standard GLB loaded successfully
  if (glbScene) {
    return <primitive ref={avatarGroupRef} object={glbScene} />
  }

  // 3. Procedural Stylized Placeholder Bust (Task A: Never a photo!)
  const primaryCol = new THREE.Color(hologramColor)

  return (
    <group ref={fallbackMeshRef} position={[0, -0.95, 0]}>
      {/* Loading Progress Feedback */}
      {isLoading && (
        <group position={[0, 2.0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.24, 32]} />
            <meshBasicMaterial color={primaryCol} wireframe />
          </mesh>
        </group>
      )}

      {/* Stylized Cybernetic Holographic Operative Bust */}
      {/* Head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#0d111a"
          emissive={primaryCol}
          emissiveIntensity={0.3}
          roughness={0.25}
          metalness={0.8}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Cybernetic Bob Hair Shell */}
      <mesh position={[0, 1.66, -0.04]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshStandardMaterial
          color="#0a0a10"
          emissive={primaryCol}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Glowing Optic Visor */}
      <mesh position={[0, 1.62, 0.14]}>
        <boxGeometry args={[0.24, 0.045, 0.08]} />
        <meshBasicMaterial color={primaryCol} toneMapped={false} />
      </mesh>

      {/* Neck & Collar */}
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
        <meshStandardMaterial color="#08080c" emissive={primaryCol} emissiveIntensity={0.2} />
      </mesh>

      {/* Shoulders & Torso */}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.45, 32]} />
        <meshStandardMaterial
          color="#0d111a"
          emissive={primaryCol}
          emissiveIntensity={0.35}
          roughness={0.25}
          metalness={0.6}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Slender Arms in Spy Stance */}
      <mesh position={[-0.32, 1.05, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.65, 16]} />
        <meshStandardMaterial color="#0a0e17" emissive={primaryCol} emissiveIntensity={0.2} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.32, 1.05, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.65, 16]} />
        <meshStandardMaterial color="#0a0e17" emissive={primaryCol} emissiveIntensity={0.2} transparent opacity={0.9} />
      </mesh>

      {/* Lower Torso / Slender Legs */}
      <mesh position={[-0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.85, 16]} />
        <meshStandardMaterial color="#060910" emissive={primaryCol} emissiveIntensity={0.15} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.85, 16]} />
        <meshStandardMaterial color="#060910" emissive={primaryCol} emissiveIntensity={0.15} transparent opacity={0.88} />
      </mesh>

      {/* Holographic Concentric Floating Energy Rings */}
      <mesh position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.44, 32]} />
        <meshBasicMaterial color={primaryCol} transparent opacity={0.5} wireframe />
      </mesh>
    </group>
  )
}
