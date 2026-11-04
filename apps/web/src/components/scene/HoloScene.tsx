import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore, computeTimeOfDay } from '../../store/useAppStore.js'
import { VrmAvatar } from '../avatar/VrmAvatar.js'
import { FloatingParticles } from './FloatingParticles.js'
import { ProjectorBase } from './ProjectorBase.js'
import { ScenicEnvironmentBackdrop } from './ScenicEnvironmentBackdrop.js'
import { AmbientSoundEngine } from './AmbientSoundEngine.js'

function CameraRig() {
  const { pointer, size } = useThree()
  const { settings, avatarPosition } = useAppStore()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const isCloseUp = !!settings.closeUpView
    const aspect = size.width / Math.max(1, size.height)

    // Current position of Ada in world space
    const adaX = (avatarPosition && avatarPosition[0]) || 0
    const adaY = (avatarPosition && avatarPosition[1] !== undefined) ? avatarPosition[1] : -0.72
    const adaZ = (avatarPosition && avatarPosition[2]) || 0

    // Full-body responsive framing distance - perfectly framing head to toe
    let baseDist = 3.88
    if (aspect < 1.0) {
      baseDist = 4.35 // Mobile portrait
    } else if (size.height < 650) {
      baseDist = 3.95 // Short landscape
    }

    const targetZ = isCloseUp ? adaZ + 1.45 : baseDist
    const targetY = isCloseUp ? adaY + 1.22 : 0.02
    const targetX = adaX * (isCloseUp ? 0.90 : 0.35) + pointer.x * (isCloseUp ? 0.04 : 0.12)

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3.0)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + Math.sin(t * 0.4) * 0.006, delta * 3.0)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 3.0)

    const lookAtX = adaX * (isCloseUp ? 0.90 : 0.35)
    const lookAtY = isCloseUp ? adaY + 1.22 : -0.14
    const lookAtZ = isCloseUp ? adaZ : 0
    state.camera.lookAt(lookAtX, lookAtY, lookAtZ)
  })

  return null
}

import { SolarTimeService } from '../../services/solarTimeService.js'

/**
 * Dynamically blends 3D Key, Fill, Rim, and Ambient lights to match
 * the continuous Solar Time calculation (Real Sun & Twilight) plus the girl's active Emotion.
 */
function DynamicLightingRig() {
  const { solarHour, currentEmotion } = useAppStore()

  const ambRef = useRef<THREE.AmbientLight>(null)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)
  const fillRef = useRef<THREE.DirectionalLight>(null)

  // Real astronomical solar calculation
  const solar = useMemo(() => {
    return SolarTimeService.calculate(solarHour)
  }, [solarHour])

  const lightingPreset = useMemo(() => {
    return {
      ambColor: new THREE.Color(solar.ambientColor),
      ambIntensity: solar.ambientIntensity,
      keyColor: new THREE.Color(solar.sunColor),
      keyIntensity: solar.sunIntensity,
      keyPos: solar.sunPosition,
      rimColor: new THREE.Color(solar.rimColor),
      rimIntensity: solar.rimIntensity,
      fillColor: new THREE.Color(solar.skyMid),
      fillIntensity: Math.max(0.25, solar.ambientIntensity * 1.1),
    }
  }, [solar])

  // Emotion-reactive color highlights
  const emotionColor = useMemo(() => {
    switch (currentEmotion) {
      case 'happy':
        return new THREE.Color('#ffb703')
      case 'playful':
        return new THREE.Color('#ff007f')
      case 'thinking':
        return new THREE.Color('#00ff88')
      case 'concerned':
        return new THREE.Color('#c084fc')
      case 'motivated':
        return new THREE.Color('#ff5500')
      case 'sad':
        return new THREE.Color('#38bdf8')
      case 'calm':
      default:
        return new THREE.Color('#00f3ff')
    }
  }, [currentEmotion])

  useFrame((_, delta) => {
    const lerpSpeed = delta * 2.5

    if (ambRef.current) {
      ambRef.current.color.lerp(lightingPreset.ambColor, lerpSpeed)
      ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, lightingPreset.ambIntensity, lerpSpeed)
    }

    if (keyRef.current) {
      keyRef.current.color.lerp(lightingPreset.keyColor, lerpSpeed)
      keyRef.current.intensity = THREE.MathUtils.lerp(keyRef.current.intensity, lightingPreset.keyIntensity, lerpSpeed)
      keyRef.current.position.x = THREE.MathUtils.lerp(keyRef.current.position.x, lightingPreset.keyPos[0], lerpSpeed)
      keyRef.current.position.y = THREE.MathUtils.lerp(keyRef.current.position.y, lightingPreset.keyPos[1], lerpSpeed)
      keyRef.current.position.z = THREE.MathUtils.lerp(keyRef.current.position.z, lightingPreset.keyPos[2], lerpSpeed)
    }

    if (rimRef.current) {
      // Blend time-of-day rim with subtle emotion color
      const targetRim = lightingPreset.rimColor.clone().lerp(emotionColor, 0.35)
      rimRef.current.color.lerp(targetRim, lerpSpeed)
      rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, lightingPreset.rimIntensity, lerpSpeed)
    }

    if (fillRef.current) {
      fillRef.current.color.lerp(lightingPreset.fillColor, lerpSpeed)
      fillRef.current.intensity = THREE.MathUtils.lerp(fillRef.current.intensity, lightingPreset.fillIntensity, lerpSpeed)
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.3} color="#182030" />
      <directionalLight ref={keyRef} position={[1.8, 2.5, 2.2]} intensity={0.9} color="#fff4eb" castShadow />
      <directionalLight ref={rimRef} position={[-1.8, 2.0, -2.2]} intensity={1.0} color="#ff007f" />
      <directionalLight ref={fillRef} position={[-1.8, 0.8, 1.5]} intensity={0.4} color="#00f3ff" />
    </>
  )
}

export const HoloScene: React.FC = () => {
  const {
    settings,
    currentEmotion,
    timeOfDayPhase,
    timeSyncMode,
    setTimeOfDayPhase,
    ambientAudioEnabled,
    isMuted,
    skinId,
    activeCharacter,
  } = useAppStore()

  // Emotion-driven subtle hologram accent tints
  const emotionColorMap: Record<string, string> = {
    happy: '#ffb703', // Warm gold
    playful: '#ff007f', // Cyber magenta
    calm: '#00f3ff', // Cyan
    thinking: '#00ff88', // Emerald
    concerned: '#a855f7', // Soft violet
    motivated: '#ff5500', // Fiery amber
    sad: '#3b82f6', // Melancholy blue
  }

  const activeColor = settings.hologramColor || emotionColorMap[currentEmotion] || '#00f3ff'

  // Time-of-day periodic checker (ticks every 30s when in auto mode)
  useEffect(() => {
    if (timeSyncMode !== 'auto') return
    const interval = setInterval(() => {
      const nowPhase = computeTimeOfDay()
      if (nowPhase !== timeOfDayPhase) {
        setTimeOfDayPhase(nowPhase)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [timeSyncMode, timeOfDayPhase, setTimeOfDayPhase])

  // Sync ambient audio with time of day phase
  useEffect(() => {
    if (ambientAudioEnabled && !isMuted) {
      AmbientSoundEngine.start()
      AmbientSoundEngine.setPhase(timeOfDayPhase)
    } else {
      AmbientSoundEngine.stop()
    }
  }, [timeOfDayPhase, ambientAudioEnabled, isMuted])

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#030611] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0.04, 3.30], fov: 30 }}
        dpr={settings.lowPerformanceMode ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.88,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={['#030611']} />

        {/* Dynamic Multi-Stop Sky & Atmosphere Backdrop */}
        <ScenicEnvironmentBackdrop phase={timeOfDayPhase} emotionColor={activeColor} />

        {/* Time-of-Day & Emotion Blended Lighting Rig */}
        <DynamicLightingRig />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Holo Home Pad Base with Emotion Reaction */}
            <ProjectorBase color={activeColor} />

            {/* Floating Atmosphere & Emotion Particles */}
            <FloatingParticles
              color={
                timeOfDayPhase === 'morning'
                  ? '#fbcfe8'
                  : timeOfDayPhase === 'noon'
                  ? '#bae6fd'
                  : timeOfDayPhase === 'evening'
                  ? '#f97316'
                  : activeColor
              }
              count={settings.lowPerformanceMode ? 40 : 90}
            />

            {/* Real 3D VRM/GLB Hologram Avatar Model */}
            <VrmAvatar
              modelUrl={
                activeCharacter === 'atlas'
                  ? '/models/ironman.glb'
                  : settings.avatarModelUrl || '/models/ada.vrm'
              }
              hologramColor={activeColor}
              renderMode={activeCharacter === 'atlas' ? 'solid' : (settings.renderMode || 'holo-lite')}
            />
          </group>

          {/* Fixed Wide Parallax Camera */}
          <CameraRig />

          {/* Post-Processing Bloom */}
          {!settings.lowPerformanceMode && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.28}
                luminanceThreshold={0.90}
                luminanceSmoothing={0.7}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
