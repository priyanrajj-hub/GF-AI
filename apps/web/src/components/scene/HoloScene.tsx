import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
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
  const { settings, avatarPosition, activeCharacter } = useAppStore()
  const controlsRef = useRef<any>(null)

  const isCloseUp = !!settings.closeUpView
  const isAda = activeCharacter === 'ada' || (!activeCharacter && !settings.avatarModelUrl)
  const adaX = (avatarPosition && avatarPosition[0]) || 0
  const adaY = (avatarPosition && avatarPosition[1] !== undefined) ? avatarPosition[1] : -0.72
  const adaZ = (avatarPosition && avatarPosition[2]) || 0

  // For Ada Wong, frame cinematic portrait view at upper torso / eye height
  const defaultTargetY = isAda ? 0.42 : 0.38
  const targetY = isCloseUp ? adaY + 1.25 : defaultTargetY
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
 * the continuous Solar Time calculation (Real Sun & Twilight) plus character signature studio lighting.
 */
function DynamicLightingRig() {
  const { solarHour, currentEmotion, activeCharacter, settings } = useAppStore()

  const ambRef = useRef<THREE.AmbientLight>(null)
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)
  const fillRef = useRef<THREE.DirectionalLight>(null)

  const isAda = activeCharacter === 'ada' || (!activeCharacter && !(settings.avatarModelUrl || '').includes('ironman') && !(settings.avatarModelUrl || '').includes('miku'))
  const isAtlas = activeCharacter === 'atlas'
  const isMira = activeCharacter === 'mira'

  // Real astronomical solar calculation
  const solar = useMemo(() => {
    return SolarTimeService.calculate(solarHour)
  }, [solarHour])

  const lightingPreset = useMemo(() => {
    if (isAda) {
      // Dedicated AAA Character Portrait Studio Lighting for Ada Wong
      // Natural skin-tones, flattering eye-level key light, soft peach fill, rose-gold rim, zero dark eye-sockets
      return {
        ambColor: new THREE.Color('#fdf2f8').lerp(new THREE.Color(solar.ambientColor), 0.25),
        ambIntensity: 0.95,
        keyColor: new THREE.Color('#fff7ed'), // Warm pearl-white
        keyIntensity: 1.85,
        keyPos: [0.4, 1.55, 2.2] as [number, number, number], // Eye-level key light avoids harsh brow shadows
        rimColor: new THREE.Color('#fb7185'), // Soft rose-gold rim light
        rimIntensity: 1.35,
        rimPos: [-1.6, 1.8, -1.8] as [number, number, number],
        fillColor: new THREE.Color('#fed7aa'), // Soft warm peach fill light
        fillIntensity: 0.90,
        fillPos: [-1.4, 1.1, 1.8] as [number, number, number],
        floorGlowColor: '#e11d48', // Crimson floor emitter
        floorGlowIntensity: 1.25,
        eyeSpotIntensity: 0.80,
      }
    }
    if (isAtlas) {
      // Stark Tech High-Contrast Metallic Arc Lighting
      return {
        ambColor: new THREE.Color('#0f172a'),
        ambIntensity: 0.70,
        keyColor: new THREE.Color('#ffffff'),
        keyIntensity: 1.65,
        keyPos: [0.8, 2.2, 2.8] as [number, number, number],
        rimColor: new THREE.Color('#00f3ff'),
        rimIntensity: 1.40,
        rimPos: [-2.0, 2.2, -2.0] as [number, number, number],
        fillColor: new THREE.Color('#38bdf8'),
        fillIntensity: 0.75,
        fillPos: [-1.8, 1.2, 2.0] as [number, number, number],
        floorGlowColor: '#00f3ff',
        floorGlowIntensity: 1.40,
        eyeSpotIntensity: 0.95,
      }
    }
    if (isMira) {
      // Vibrant Pop Idol Stage Lighting for Hatsune Miku
      return {
        ambColor: new THREE.Color('#e0f2fe'),
        ambIntensity: 0.85,
        keyColor: new THREE.Color('#ffffff'),
        keyIntensity: 1.50,
        keyPos: [0.5, 2.0, 3.0] as [number, number, number],
        rimColor: new THREE.Color('#39c5bb'),
        rimIntensity: 1.30,
        rimPos: [-1.8, 2.0, -2.0] as [number, number, number],
        fillColor: new THREE.Color('#fbcfe8'),
        fillIntensity: 0.80,
        fillPos: [-1.8, 1.2, 2.2] as [number, number, number],
        floorGlowColor: '#39c5bb',
        floorGlowIntensity: 1.30,
        eyeSpotIntensity: 0.95,
      }
    }
    // High-definition studio baseline for generic / custom models
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
      rimPos: [-1.8, 2.2, -2.2] as [number, number, number],
      fillColor: new THREE.Color(solar.skyMid).lerp(new THREE.Color('#f0f9ff'), 0.55),
      fillIntensity: Math.max(0.70, solar.ambientIntensity * 1.6),
      fillPos: [-2.0, 1.2, 2.2] as [number, number, number],
      floorGlowColor: '#00f3ff',
      floorGlowIntensity: 1.20,
      eyeSpotIntensity: 0.95,
    }
  }, [solar, isAda, isAtlas, isMira])

  useFrame((_, delta) => {
    const lerpSpeed = delta * 3.5

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
      rimRef.current.color.lerp(lightingPreset.rimColor, lerpSpeed)
      rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, lightingPreset.rimIntensity, lerpSpeed)
      rimRef.current.position.x = THREE.MathUtils.lerp(rimRef.current.position.x, lightingPreset.rimPos[0], lerpSpeed)
      rimRef.current.position.y = THREE.MathUtils.lerp(rimRef.current.position.y, lightingPreset.rimPos[1], lerpSpeed)
      rimRef.current.position.z = THREE.MathUtils.lerp(rimRef.current.position.z, lightingPreset.rimPos[2], lerpSpeed)
    }

    if (fillRef.current) {
      fillRef.current.color.lerp(lightingPreset.fillColor, lerpSpeed)
      fillRef.current.intensity = THREE.MathUtils.lerp(fillRef.current.intensity, lightingPreset.fillIntensity, lerpSpeed)
      fillRef.current.position.x = THREE.MathUtils.lerp(fillRef.current.position.x, lightingPreset.fillPos[0], lerpSpeed)
      fillRef.current.position.y = THREE.MathUtils.lerp(fillRef.current.position.y, lightingPreset.fillPos[1], lerpSpeed)
      fillRef.current.position.z = THREE.MathUtils.lerp(fillRef.current.position.z, lightingPreset.fillPos[2], lerpSpeed)
    }
  })

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.95} color="#cbd5e1" />
      {/* Front Studio Key Light: perfectly illuminates face, chest, and costume */}
      <directionalLight ref={keyRef} position={[0.4, 1.55, 2.2]} intensity={1.85} color="#ffffff" castShadow />
      {/* Back Hair & Shoulder Rim Light: creates separation from dark space */}
      <directionalLight ref={rimRef} position={[-1.6, 1.8, -1.8]} intensity={1.35} color="#fb7185" />
      {/* Soft Fill Light: clears shadows on side and waist */}
      <directionalLight ref={fillRef} position={[-1.4, 1.1, 1.8]} intensity={0.90} color="#fed7aa" />
      {/* Dedicated Face Portrait Spotlight for razor-sharp eye & facial feature clarity */}
      <spotLight position={isAda ? [0, 1.58, 1.4] : [0, 1.5, 2.6]} intensity={lightingPreset.eyeSpotIntensity} color="#ffffff" angle={0.35} penumbra={0.8} />
      {/* Holographic Emitter Floor Glow */}
      <pointLight
        position={[0, -0.65, 0.35]}
        intensity={lightingPreset.floorGlowIntensity}
        color={lightingPreset.floorGlowColor}
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

  const activeColor = activeCharacter === 'mira'
    ? '#39c5bb'
    : activeCharacter === 'atlas'
    ? '#00f3ff'
    : activeCharacter === 'ada'
    ? '#ff2a55'
    : (settings.hologramColor || emotionColorMap[currentEmotion] || '#00f3ff')

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
          toneMappingExposure: 0.96,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={['#030611']} />

        {/* Dynamic Multi-Stop Sky & Atmosphere Backdrop */}
        <ScenicEnvironmentBackdrop phase={timeOfDayPhase} emotionColor={activeColor} />

        {/* Photoreal Image-Based Lighting (IBL) with Pre-filtered Environment Reflections */}
        <Environment files="/environments/city.hdr" environmentIntensity={0.85} />

        {/* Time-of-Day & Character Studio Blended Lighting Rig */}
        <DynamicLightingRig />

        <Suspense fallback={null}>
          {/* Custom 3D Animated Background Environments (Stark Lab, Ada Penthouse, Yor Moonlit Garden) */}
          <Cinematic3DEnvironment />

          <group position={[0, 0, 0]}>
            {/* 3D Holo Home Pad Base with Character Theme Glow */}
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
                  : activeCharacter === 'mira'
                  ? '/models/miku.vrm'
                  : settings.avatarModelUrl || '/models/ada_fullbody_tripo.glb'
              }
              hologramColor={activeCharacter === 'mira' ? '#39c5bb' : activeColor}
              renderMode={activeCharacter === 'atlas' || activeCharacter === 'mira' || (settings.avatarModelUrl || '').includes('tripo') || (!settings.avatarModelUrl && activeCharacter === 'ada') ? 'solid' : (settings.renderMode || 'solid')}
            />
          </group>

          {/* 360° Rotatable Orbit Controls & Framed Camera */}
          <CameraController />

          {/* Post-Processing Bloom */}
          {!settings.lowPerformanceMode && (
            <EffectComposer multisampling={4}>
              <Bloom
                intensity={activeCharacter === 'mira' ? 0.12 : 0.28}
                luminanceThreshold={activeCharacter === 'mira' ? 0.98 : 0.90}
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
