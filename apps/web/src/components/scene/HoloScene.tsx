import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore, computeTimeOfDay } from '../../store/useAppStore.js'
import { VrmAvatar } from '../avatar/VrmAvatar.js'
import { FloatingParticles } from './FloatingParticles.js'
import { ProjectorBase } from './ProjectorBase.js'
import { ScenicEnvironmentBackdrop } from './ScenicEnvironmentBackdrop.js'
import { AmbientSoundEngine } from './AmbientSoundEngine.js'
import { Cinematic3DEnvironment } from './Cinematic3DEnvironment.js'

function CameraController() {
  const { settings, avatarPosition } = useAppStore()
  const controlsRef = useRef<any>(null)

  const isCloseUp = !!settings.closeUpView
  const adaX = (avatarPosition && avatarPosition[0]) || 0
  const adaY = (avatarPosition && avatarPosition[1] !== undefined) ? avatarPosition[1] : -0.72
  const adaZ = (avatarPosition && avatarPosition[2]) || 0

  const targetY = isCloseUp ? adaY + 1.25 : 0.38
  const targetX = adaX * 0.5
  const targetZ = adaZ * 0.5

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(targetX, targetY, targetZ)
      controlsRef.current.update()
    }
  }, [targetX, targetY, targetZ])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={6.0}
      maxPolarAngle={Math.PI / 2 + 0.02}
      minPolarAngle={0.10}
      target={[targetX, targetY, targetZ]}
      enablePan={true}
    />
  )
}

import { SolarTimeService } from '../../services/solarTimeService.js'

/**
 * Dynamically blends 3D Key, Fill, Rim, and Ambient lights to match
 * the continuous Solar Time calculation (Real Sun & Twilight) plus the girl's active Emotion.
 */
function DynamicLightingRig() {
  const { solarHour, currentEmotion, activeCharacter } = useAppStore()

  const ambRef = useRef<THREE.AmbientLight>(null)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)
  const fillRef = useRef<THREE.DirectionalLight>(null)

  // Real astronomical solar calculation
  const solar = useMemo(() => {
    return SolarTimeService.calculate(solarHour)
  }, [solarHour])

  const lightingPreset = useMemo(() => {
    // High-definition studio baseline: ensures characters are radiant and visible at all times
    const baseAmbIntensity = Math.max(0.75, solar.ambientIntensity * 1.8)
    const baseKeyIntensity = Math.max(1.35, solar.sunIntensity * 1.25)
    return {
      ambColor: new THREE.Color(solar.ambientColor).lerp(new THREE.Color('#e2e8f0'), 0.55),
      ambIntensity: baseAmbIntensity,
      keyColor: new THREE.Color(solar.sunColor).lerp(new THREE.Color('#ffffff'), 0.45),
      keyIntensity: baseKeyIntensity,
      keyPos: [0.6, 2.4, 3.2] as [number, number, number],
      rimColor: new THREE.Color(solar.rimColor).lerp(new THREE.Color('#ffffff'), 0.35),
      rimIntensity: Math.max(1.15, solar.rimIntensity),
      fillColor: new THREE.Color(solar.skyMid).lerp(new THREE.Color('#f0f9ff'), 0.55),
      fillIntensity: Math.max(0.70, solar.ambientIntensity * 1.6),
    }
  }, [solar])

  // Character-specific signature studio lighting
  const emotionColor = useMemo(() => {
    if (activeCharacter === 'atlas') {
      return new THREE.Color('#00f3ff') // Electric Arc Cyan
    }
    if (activeCharacter === 'mira') {
      return new THREE.Color('#fb7185') // Vibrant Rose
    }
    switch (currentEmotion) {
      case 'happy':
        return new THREE.Color('#ffb703')
      case 'playful':
        return new THREE.Color('#ff007f')
      case 'thinking':
        return new THREE.Color('#00f3ff')
      case 'concerned':
        return new THREE.Color('#c084fc')
      case 'motivated':
        return new THREE.Color('#c81e2f')
      case 'sad':
        return new THREE.Color('#38bdf8')
      case 'calm':
      default:
        return new THREE.Color('#00f3ff')
    }
  }, [currentEmotion, activeCharacter])

  useFrame((_, delta) => {
    const lerpSpeed = delta * 3.0

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
      const targetRim = lightingPreset.rimColor.clone().lerp(emotionColor, 0.40)
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
      <ambientLight ref={ambRef} intensity={0.75} color="#cbd5e1" />
      {/* Front Studio Key Light: perfectly illuminates face, chest, and costume */}
      <directionalLight ref={keyRef} position={[0.6, 2.4, 3.2]} intensity={1.35} color="#ffffff" castShadow />
      {/* Back Hair & Shoulder Rim Light: creates separation from dark space */}
      <directionalLight ref={rimRef} position={[-1.8, 2.2, -2.2]} intensity={1.15} color="#00f3ff" />
      {/* Soft Fill Light: clears shadows on side and waist */}
      <directionalLight ref={fillRef} position={[-2.0, 1.2, 2.2]} intensity={0.70} color="#f0f9ff" />
      {/* Dedicated Face Portrait Spotlight for razor-sharp anime eye & facial feature clarity */}
      <spotLight position={[0, 1.5, 2.6]} intensity={0.95} color="#ffffff" angle={0.55} penumbra={0.7} />
      {/* Holographic Emitter Floor Glow */}
      <pointLight
        position={[0, -0.65, 0.35]}
        intensity={1.2}
        color={activeCharacter === 'atlas' ? '#00f3ff' : activeCharacter === 'mira' ? '#fb7185' : '#00f3ff'}
        distance={3.2}
      />
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
        camera={{ position: [0, 0.45, 3.80], fov: 32 }}
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
          {/* Custom 3D Animated Background Environments (Stark Lab, Ada Penthouse, Yor Moonlit Garden) */}
          <Cinematic3DEnvironment />

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

          {/* 360° Rotatable Orbit Controls & Framed Camera */}
          <CameraController />

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
