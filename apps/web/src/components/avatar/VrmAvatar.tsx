import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { applyAvatarSkin, applyAvatarAccessories, applyCharacterPhysicalTransformation } from '../../avatar/skins/ada-red.js'
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
    activeMode,
    currentEmotion,
    emotionIntensity,
    activeGesture,
    activeAction,
    setActiveAction,
    audioFrequencies,
    settings,
    activeCharacter,
    skinId,
    accessories,
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

    // Character boundaries: Tony Stark loads ironman.glb, Ada & Yor load fully rigged expressive VRM
    const isAtlas = activeCharacter === 'atlas' || (modelUrl || '').includes('ironman')
    const isExplicitTripo = (modelUrl || '').includes('tripo')

    if (isAtlas || isExplicitTripo) {
      setVrm(null)
    } else {
      setGlbScene(null)
    }

    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.register((parser) => new VRMLoaderPlugin(parser))

    const defaultUrl = isAtlas
      ? '/models/ironman.glb'
      : isExplicitTripo
      ? '/models/ada_fullbody_tripo.glb'
      : '/models/ada.vrm'

    const activeUrl = modelUrl || defaultUrl

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

          // Mature Adult Proportions (1:7.8 head-to-body ratio, statuesque elegant model poise):
          const headBone = loadedVrm.humanoid?.getNormalizedBoneNode('head')
          if (headBone) headBone.scale.set(0.96, 0.96, 0.96)
          const neckBone = loadedVrm.humanoid?.getNormalizedBoneNode('neck')
          if (neckBone) neckBone.scale.set(1.02, 1.05, 1.02)
          const spineBone = loadedVrm.humanoid?.getNormalizedBoneNode('spine')
          if (spineBone) spineBone.scale.set(1.0, 1.02, 1.0)
          const lLeg = loadedVrm.humanoid?.getNormalizedBoneNode('leftUpperLeg')
          const rLeg = loadedVrm.humanoid?.getNormalizedBoneNode('rightUpperLeg')
          if (lLeg) lLeg.scale.set(1.0, 1.0, 1.0)
          if (rLeg) rLeg.scale.set(1.0, 1.0, 1.0)
          const lLowerLeg = loadedVrm.humanoid?.getNormalizedBoneNode('leftLowerLeg')
          const rLowerLeg = loadedVrm.humanoid?.getNormalizedBoneNode('rightLowerLeg')
          if (lLowerLeg) lLowerLeg.scale.set(1.0, 1.0, 1.0)
          if (rLowerLeg) rLowerLeg.scale.set(1.0, 1.0, 1.0)

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

          // Apply Character Physical Transformation (Stark boy vs Yor vs Ada)
          applyCharacterPhysicalTransformation(loadedVrm, activeCharacter || 'ada')

          // Initialize Procedural Kinematic Animator & Expression Engine
          animatorRef.current = new ProceduralAnimator(loadedVrm, activeAction || 'idle')
          expressionEngineRef.current = new ExpressionEngine(loadedVrm)

          setVrm(loadedVrm)
          ;(window as any).__ADA_VRM__ = loadedVrm
          setGlbScene(null)
        } else if (gltf.scene) {
          // Standard GLB Model (e.g. Iron Man Mark Armor / Tripo3D Ada / Michelle)
          const container = new THREE.Group()
          const scene = gltf.scene
          const isIronman = activeUrl.includes('ironman')
          const isTripo = activeUrl.includes('tripo')

          // Rotate to face camera front
          if (isIronman) {
            scene.rotation.y = 0
          }

          const box = new THREE.Box3().setFromObject(scene)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())

          if (size.y > 0) {
            // Heroic superhero height for Iron Man Mark armor (1.82m)
            const targetHeight = isIronman ? 1.82 : (isTripo ? 1.72 : 1.62)
            const scale = targetHeight / size.y
            scene.scale.set(scale, scale, scale)
            // Center horizontally and align model feet with container base (container is at y = -0.72)
            scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
          }

          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh
              mesh.frustumCulled = false
              mesh.castShadow = true
              mesh.receiveShadow = true

              // Give Iron Man suit rich metallic reflections and solid finish
              if (isIronman && mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                mats.forEach((m: any) => {
                  if (m) {
                    m.transparent = false
                    m.opacity = 1.0
                    m.depthWrite = true
                    if (m.metalness !== undefined) m.metalness = Math.max(0.65, m.metalness || 0.7)
                    if (m.roughness !== undefined) m.roughness = Math.min(0.35, m.roughness || 0.3)
                  }
                })
              }
            }
          })

          if (isIronman) {
            // Add luminous chest Arc Reactor light & dynamic pulse
            const arcLight = new THREE.PointLight(0x00f3ff, 2.6, 4.0)
            arcLight.position.set(0, 0.95, 0.25)
            arcLight.name = '__IRONMAN_ARC_LIGHT__'
            container.add(arcLight)
          }

          container.add(scene)
          setGlbScene(container)
          setVrm(null)
          ;(window as any).__GLB_MODEL__ = container
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
  }, [activeCharacter, modelUrl, renderMode, hologramColor])

  // Instant real-time character transformation: Athletic Boy Stark vs Yor vs Ada
  useEffect(() => {
    if (vrm) {
      applyCharacterPhysicalTransformation(vrm, activeCharacter || 'ada')
      if (typeof window !== 'undefined') {
        ;(window as any).__ACTIVE_CHAR__ = activeCharacter || 'ada'
      }
    }
  }, [activeCharacter, vrm])

  // Instant real-time wardrobe skin updates for whichever character is active
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
  }, [skinId, vrm, activeCharacter])

  // Dynamic armor plating & Arc Reactor energy updates for Tony Stark's Iron Man suits
  useEffect(() => {
    if (glbScene && (modelUrl || '').includes('ironman')) {
      const arcLight = glbScene.getObjectByName('__IRONMAN_ARC_LIGHT__') as THREE.PointLight | undefined
      const isStealth = skinId === 'stark-stealth-armor' || skinId === 'stark-stealth-hoodie'
      const isSilver = skinId === 'stark-silver-centurion' || skinId === 'stark-executive-suit'

      if (arcLight) {
        if (isStealth) {
          arcLight.color.set('#3b82f6') // Deep Cobalt
        } else if (isSilver) {
          arcLight.color.set('#10b981') // Quantum Emerald
        } else {
          arcLight.color.set('#00f3ff') // Classic Cyan Core
        }
      }

      glbScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((mat: any) => {
            if (!mat || !mat.color) return
            if (isStealth) {
              if (mat.name === 'Mat.1' || mat.name === 'material') mat.color.set('#101216') // Obsidian Noir
              if (mat.name === 'Mat.2') mat.color.set('#2a2c35') // Gunmetal Carbon
            } else if (isSilver) {
              if (mat.name === 'Mat.1' || mat.name === 'material') mat.color.set('#a01826') // Crimson Trim
              if (mat.name === 'Mat.2') mat.color.set('#d8dee9') // Aerospace Chrome
            } else {
              if (mat.name === 'Mat.1') mat.color.set('#8B1E2B') // Titanium Hot-Rod Red
              if (mat.name === 'Mat.2') mat.color.set('#D4AF37') // Sunburst Gold
            }
          })
        }
      })
    }
  }, [skinId, glbScene, modelUrl])

  // Real-time accessory updates (Comms Headset, Gloves, Boots)
  useEffect(() => {
    if (vrm) {
      // Do not clutter Yor's head with sci-fi comms gear
      const showHeadset =
        activeCharacter !== 'mira' &&
        (accessories?.commsHeadset || (activeCharacter === 'ada' && activeMode === 'jarvis'))
      applyAvatarAccessories(
        vrm,
        {
          commsHeadset: Boolean(showHeadset),
          gloves: accessories?.gloves,
          boots: accessories?.boots,
        },
        systemState === 'listening'
      )
    }
  }, [vrm, accessories, systemState, activeMode, activeCharacter])

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
      const isStark = activeCharacter === 'atlas'
      const poke = navigatorRef.handlePoke(activeCharacter || 'ada')
      if (animatorRef.current) {
        animatorRef.current.setOverlayAction(poke.action)
      }
      useAppStore.getState().setEmotionAndGesture(isStark ? 'motivated' : 'happy', 1.0, poke.action as any)
      useAppStore.getState().addMessage({
        id: `msg-poke-${Date.now()}`,
        role: 'assistant',
        content: `*${poke.speech}*`,
        speech: poke.speech,
        emotion: isStark ? 'motivated' : 'happy',
        gesture: poke.action as any,
        timestamp: Date.now(),
      })
      VoiceEngine.speak(poke.speech, {
        rate: isStark ? 1.0 : 1.06,
        pitch: isStark ? 0.90 : 1.05,
        language: settings.language,
      })
      setActiveFX(isStark ? ['sparkles', 'exclamation'] : ['exclamation', 'hearts', 'sparkles'])
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
      const rawFirst = audioFrequencies[0] || 0
      const isByteScale = rawFirst > 1.0 || audioFrequencies.some((v: number) => v > 1.0)
      const sum = audioFrequencies.reduce((acc: number, v: number) => acc + v, 0)
      avgAudio = sum / (audioFrequencies.length * (isByteScale ? 255 : 1.0))
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
        const isSinging =
          (currentEmotion as string) === 'singing' ||
          activeAction.includes('dance') ||
          (typeof window !== 'undefined' && (window as any).__IS_SINGING__ === true)

        expressionEngineRef.current.isSinging = isSinging
        expressionEngineRef.current.singingBpm =
          (typeof window !== 'undefined' && (window as any).__SONG_BPM__) || 120

        expressionEngineRef.current.setExpression(currentEmotion, emotionIntensity)
        expressionEngineRef.current.setLipSync(avgAudio, systemState === 'speaking' || isSinging)
        expressionEngineRef.current.update(delta, time)
      }

      vrm.update(delta)
    }

    // Standard GLB fallback positioning & idle breathing
    if (glbScene) {
      glbScene.position.set(currentPos.x, -0.72 + currentPos.y, currentPos.z)
      const isTripo = (modelUrl || '').includes('tripo') || activeCharacter === 'ada'
      const isIronman = (modelUrl || '').includes('ironman') || activeCharacter === 'atlas'
      const baseRotation = isTripo || isIronman ? 0 : Math.PI
      glbScene.rotation.y = baseRotation + navigatorRef.currentRotationY

      // Repulsor hover pulse for Iron Man
      if (isIronman) {
        glbScene.position.y += Math.sin(time * 2.5) * 0.005
        const arcLight = glbScene.getObjectByName('__IRONMAN_ARC_LIGHT__') as THREE.PointLight | undefined
        if (arcLight) {
          arcLight.intensity = 2.4 + Math.sin(time * 4.0) * 0.4
        }
      } else {
        glbScene.position.y += Math.sin(time * 2.0) * 0.003
      }

      setAvatarWorldPos([currentPos.x, -0.72 + currentPos.y, currentPos.z])
      useAppStore.getState().setAvatarPosition([currentPos.x, -0.72 + currentPos.y, currentPos.z])
    }
  })

  // 3. Pointer Click Handling (Avatar Poke & Double-Click Navigation)
  const handleAvatarClick = (e: any) => {
    e.stopPropagation()
    const isStark = activeCharacter === 'atlas'
    const poke = navigatorRef.handlePoke(activeCharacter || 'ada')
    if (animatorRef.current) {
      animatorRef.current.setOverlayAction(poke.action)
    }
    useAppStore.getState().setEmotionAndGesture(isStark ? 'motivated' : 'happy', 1.0, poke.action as any)
    useAppStore.getState().addMessage({
      id: `msg-poke-${Date.now()}`,
      role: 'assistant',
      content: `*${poke.speech}*`,
      speech: poke.speech,
      emotion: isStark ? 'motivated' : 'happy',
      gesture: poke.action as any,
      timestamp: Date.now(),
    })
    VoiceEngine.speak(poke.speech, {
      rate: isStark ? 1.0 : 1.06,
      pitch: isStark ? 0.90 : 1.05,
      language: settings.language,
    })
    setActiveFX(isStark ? ['sparkles', 'exclamation'] : ['exclamation', 'hearts', 'sparkles'])
    setTimeout(() => setActiveFX([]), 2800)
  }

  const handleFloorDoubleClick = (e: any) => {
    e.stopPropagation()
    if (e.point) {
      navigatorRef.moveTo(e.point.x, e.point.z, true, 'sassy_hip_pop')
      setClickMarker([e.point.x, -0.715, e.point.z])
      setTimeout(() => setClickMarker(null), 3000)
    }
  }

  return (
    <group>
      {/* 1. VRM Character Scene (Ada & Yor: fully rigged, expressive, animated) */}
      {vrm && activeCharacter !== 'atlas' && (
        <group onClick={handleAvatarClick}>
          <primitive object={vrm.scene} />
        </group>
      )}

      {/* 2. Standard GLB Scene (Iron Man Mark Armor) */}
      {glbScene && (
        <group onClick={handleAvatarClick}>
          <primitive object={glbScene} />
        </group>
      )}

      {/* 3. Anime FX Layer */}
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

      {/* 5. Double-Click Floor Plane (Double-click to walk, drag to 360° rotate without conflict) */}
      <mesh
        position={[0, -0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onDoubleClick={handleFloorDoubleClick}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
