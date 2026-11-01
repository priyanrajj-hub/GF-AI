import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { applyAvatarSkin } from '../../avatar/skins/ada-red.js'
import { ProceduralAnimator } from '../../avatar/engine/proceduralAnimator.js'
import { ExpressionEngine } from '../../avatar/engine/expressions.js'
import { RoamNavigator } from '../../avatar/roam/navigator.js'
import { AnimeFXLayer } from '../../avatar/engine/fx.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'

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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    systemState,
    currentEmotion,
    emotionIntensity,
    activeGesture,
    activeAction,
    setActiveAction,
    audioFrequencies,
    settings,
    skinId,
    cutenessLevel,
    roamConfig,
    activeFX,
    setActiveFX,
  } = useAppStore()

  const { pointer, camera, raycaster, scene: threeScene } = useThree()

  // Engines
  const animatorRef = useRef<ProceduralAnimator | null>(null)
  const expressionEngineRef = useRef<ExpressionEngine | null>(null)
  const navigatorRef = useMemo(() => new RoamNavigator(new THREE.Vector3(0, 0, 0)), [])
  const [avatarWorldPos, setAvatarWorldPos] = useState<[number, number, number]>([0, -0.72, 0])
  const [clickMarker, setClickMarker] = useState<[number, number, number] | null>(null)

  // 1. Load 3D Model (VRM or GLB)
  useEffect(() => {
    setIsLoading(true)
    setLoadError(null)

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const activeUrl = modelUrl || '/models/ada.vrm'

    loader.load(
      activeUrl,
      (gltf) => {
        setIsLoading(false)
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

          // Initial placement: feet resting firmly on floor / home pad (y = -0.72)
          loadedVrm.scene.position.set(0, -0.72, 0)

          // Proportions: Head scale 1.12, hips/legs scale 0.94 (Round 6 Task A)
          const headBone = loadedVrm.humanoid?.getNormalizedBoneNode('head')
          if (headBone) headBone.scale.set(1.12, 1.12, 1.12)
          const lLeg = loadedVrm.humanoid?.getNormalizedBoneNode('leftUpperLeg')
          const rLeg = loadedVrm.humanoid?.getNormalizedBoneNode('rightUpperLeg')
          if (lLeg) lLeg.scale.set(0.95, 0.94, 0.95)
          if (rLeg) rLeg.scale.set(0.95, 0.94, 0.95)

          // Set initial relaxed A-pose (Task A #5: arms down, not T-pose)
          const initLArm = loadedVrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
          const initRArm = loadedVrm.humanoid?.getNormalizedBoneNode('rightUpperArm')
          if (initLArm) initLArm.rotation.set(0, 0, 1.25)
          if (initRArm) initRArm.rotation.set(0, 0, -1.25)

          // Enable shadows and disable frustum culling
          loadedVrm.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh
              mesh.frustumCulled = false
              mesh.castShadow = true
              mesh.receiveShadow = true

              const applyHolo = (mat: any) => {
                if (!mat) return
                if (renderMode === 'solid' || renderMode === 'holo-lite') {
                  mat.transparent = false
                  mat.opacity = 1.0
                  mat.depthWrite = true
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(0x000000)
                    mat.emissiveIntensity = 0.0
                  }
                } else {
                  // Full Hologram mode
                  mat.transparent = true
                  mat.opacity = 0.85
                  mat.depthWrite = true
                  if ('emissive' in mat) {
                    mat.emissive = new THREE.Color(hologramColor)
                    mat.emissiveIntensity = 0.2
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

          // Apply Ada Spy-Chic Red & Black Signature Skin (Task A)
          applyAvatarSkin(loadedVrm, skinId || 'ada-red')

          // Initialize Procedural Kinematic Animator & Expression Engine
          animatorRef.current = new ProceduralAnimator(loadedVrm, activeAction || 'idle')
          expressionEngineRef.current = new ExpressionEngine(loadedVrm)

          setVrm(loadedVrm)
          ;(window as any).__ADA_VRM__ = loadedVrm
          setGlbScene(null)
        } else if (gltf.scene) {
          // Standard GLB Model (e.g. Tripo3D Full-Body Ada or Michelle)
          const container = new THREE.Group()
          const scene = gltf.scene
          const isTripo = activeUrl.includes('tripo')
          const box = new THREE.Box3().setFromObject(scene)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())

          if (size.y > 0) {
            // Tripo diorama model includes pedestal base; scale to 1.48 to fit framing
            const targetHeight = isTripo ? 1.48 : 1.65
            const scale = targetHeight / size.y
            scene.scale.set(scale, scale, scale)
            // Center scene horizontally and set base at y = 0
            scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
          }

          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh
              mesh.frustumCulled = false
              mesh.castShadow = true
              mesh.receiveShadow = true
            }
          })
          container.add(scene)
          setGlbScene(container)
          setVrm(null)
        }
      },
      undefined,
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
    }
  }, [modelUrl, renderMode, hologramColor])

  // Instant real-time wardrobe skin updates without re-loading the model
  useEffect(() => {
    if (vrm) {
      applyAvatarSkin(vrm, skinId || 'ada-red')
    }
  }, [skinId, vrm])

  // Sync action from global store to animator
  useEffect(() => {
    if (animatorRef.current && activeAction) {
      animatorRef.current.setAction(activeAction)
    }
  }, [activeAction])

  // Sync gesture triggers
  useEffect(() => {
    if (animatorRef.current && activeGesture && activeGesture !== 'idle') {
      animatorRef.current.setOverlayAction(activeGesture)
    }
  }, [activeGesture])

  // Sync cuteness level
  useEffect(() => {
    if (animatorRef.current) {
      animatorRef.current.setCuteness(cutenessLevel)
    }
  }, [cutenessLevel])

  // Support programmatic navigation & poke events (e.g. from test bench)
  useEffect(() => {
    const handleMoveEvent = (e: any) => {
      if (!e.detail) return
      if (e.detail.action === 'home') {
        navigatorRef.goHome()
      } else if (typeof e.detail.x === 'number' && typeof e.detail.z === 'number') {
        navigatorRef.moveTo(e.detail.x, e.detail.z, !!e.detail.isRunning)
      }
    }
    const handlePokeEvent = () => {
      const poke = navigatorRef.handlePoke()
      if (animatorRef.current) {
        animatorRef.current.setOverlayAction(poke.action)
      }
      useAppStore.getState().setEmotionAndGesture('happy', 1.0, poke.action as any)
      useAppStore.getState().addMessage({
        id: `msg-poke-${Date.now()}`,
        role: 'assistant',
        content: `*${poke.speech}*`,
        speech: poke.speech,
        emotion: 'happy',
        gesture: poke.action as any,
        timestamp: Date.now(),
      })
      VoiceEngine.speak(poke.speech, {
        rate: 1.06,
        pitch: 1.05,
        language: settings.language,
      })
      setActiveFX(['exclamation', 'hearts', 'sparkles'])
      setTimeout(() => setActiveFX([]), 2800)
    }
    window.addEventListener('ada:move_to', handleMoveEvent)
    window.addEventListener('ada:poke', handlePokeEvent)
    return () => {
      window.removeEventListener('ada:move_to', handleMoveEvent)
      window.removeEventListener('ada:poke', handlePokeEvent)
    }
  }, [navigatorRef, setActiveFX])

  // 2. Main Render & Kinematics Frame Loop
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    // A. Audio analysis for lip sync
    let avgAudio = 0
    if (audioFrequencies && audioFrequencies.length > 0) {
      const sum = audioFrequencies.reduce((acc: number, v: number) => acc + v, 0)
      avgAudio = sum / (audioFrequencies.length * 255)
    }

    // B. Roam Navigator update (wandering, steering, target approach)
    const roamResult = navigatorRef.update(delta, time, roamConfig)
    const currentPos = navigatorRef.currentPos

    // If arrival action was triggered, pass to procedural animator
    if (roamResult.actionToTrigger && animatorRef.current) {
      animatorRef.current.setOverlayAction(roamResult.actionToTrigger)
    }

    // C. Update VRM scene position & rotation
    if (vrm) {
      vrm.scene.position.set(currentPos.x, -0.72 + currentPos.y, currentPos.z)
      vrm.scene.rotation.y = Math.PI + navigatorRef.currentRotationY

      setAvatarWorldPos([currentPos.x, -0.72 + currentPos.y, currentPos.z])
      useAppStore.getState().setAvatarPosition([currentPos.x, -0.72 + currentPos.y, currentPos.z])

      // D. Update Procedural Animator (locomotion + dances + gestures)
      if (animatorRef.current) {
        animatorRef.current.setMovement(roamResult.isMoving, navigatorRef.moveSpeed)
        animatorRef.current.update(delta, time, pointer)
      }

      // E. Update Expression Engine (30+ expressions, natural blinking, lip-sync)
      if (expressionEngineRef.current) {
        expressionEngineRef.current.setExpression(currentEmotion, emotionIntensity)
        expressionEngineRef.current.setLipSync(avgAudio, systemState === 'speaking')
        expressionEngineRef.current.update(delta, time)
      }

      vrm.update(delta)
    }

    // Standard GLB fallback positioning & idle breathing
    if (glbScene) {
      glbScene.position.set(currentPos.x, -0.72 + currentPos.y, currentPos.z)
      const isTripo = (modelUrl || '').includes('tripo')
      const baseRotation = isTripo ? 0 : Math.PI
      glbScene.rotation.y = baseRotation + navigatorRef.currentRotationY
      // Subtle ambient breathing float
      glbScene.position.y += Math.sin(time * 2.0) * 0.003

      setAvatarWorldPos([currentPos.x, -0.72 + currentPos.y, currentPos.z])
      useAppStore.getState().setAvatarPosition([currentPos.x, -0.72 + currentPos.y, currentPos.z])
    }
  })

  // 3. Pointer Click Handling (Floor move & Avatar Poke)
  const handlePointerDown = (e: any) => {
    e.stopPropagation()

    // If clicked directly on avatar mesh -> Energetic Poke reaction!
    let isAvatarClicked = false
    let current = e.object
    while (current) {
      if (current === vrm?.scene || current === glbScene) {
        isAvatarClicked = true
        break
      }
      current = current.parent
    }

    if (isAvatarClicked) {
      const poke = navigatorRef.handlePoke()
      if (animatorRef.current) {
        animatorRef.current.setOverlayAction(poke.action)
      }
      useAppStore.getState().setEmotionAndGesture('happy', 1.0, poke.action as any)
      useAppStore.getState().addMessage({
        id: `msg-poke-${Date.now()}`,
        role: 'assistant',
        content: `*${poke.speech}*`,
        speech: poke.speech,
        emotion: 'happy',
        gesture: poke.action as any,
        timestamp: Date.now(),
      })
      VoiceEngine.speak(poke.speech, {
        rate: 1.06,
        pitch: 1.05,
        language: settings.language,
      })
      setActiveFX(['exclamation', 'hearts', 'sparkles'])
      setTimeout(() => setActiveFX([]), 2800)
      return
    }

    // Otherwise clicked on floor -> Walk or Run to spot with catwalk!
    if (e.point) {
      const isDouble = e.nativeEvent?.detail === 2
      navigatorRef.moveTo(e.point.x, e.point.z, isDouble, 'sassy_hip_pop')
      setClickMarker([e.point.x, -0.715, e.point.z])
      setTimeout(() => setClickMarker(null), 3000)
    }
  }

  return (
    <group onPointerDown={handlePointerDown}>
      {/* 1. VRM Character Scene */}
      {vrm && <primitive object={vrm.scene} />}

      {/* 2. Standard GLB Scene */}
      {glbScene && <primitive object={glbScene} />}

      {/* 3. Anime FX Layer (Clean stage, mascot hidden to focus on Ada) */}
      <AnimeFXLayer
        activeFX={activeFX}
        avatarPosition={avatarWorldPos}
        showMascot={false}
      />

      {/* 4. Interactive Destination Ripple Ring */}
      {clickMarker && (
        <group position={clickMarker}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.14, 32]} />
            <meshBasicMaterial color={hologramColor} transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.20, 0.24, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* 5. Clickable Invisible Floor Plane for Raycast Navigation */}
      <mesh
        position={[0, -0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
