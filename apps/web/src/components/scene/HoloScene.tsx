import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { VrmAvatar } from '../avatar/VrmAvatar.js'
import { FloatingParticles } from './FloatingParticles.js'
import { ProjectorBase } from './ProjectorBase.js'

function CameraRig() {
  const controlsRef = useRef<any>(null)

  useFrame((state) => {
    // Subtle idle camera drift
    const t = state.clock.elapsedTime
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.25 + Math.sin(t * 0.5) * 0.03, 0)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={1.4}
      maxDistance={3.8}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 1.85}
      dampingFactor={0.06}
    />
  )
}

export const HoloScene: React.FC = () => {
  const { settings, currentEmotion } = useAppStore()

  // Emotion-driven hologram accent colors
  const emotionColorMap: Record<string, string> = {
    happy: '#ffb703', // Warm gold
    playful: '#ff007f', // Cyber magenta
    calm: '#00f3ff', // Cyan
    thinking: '#00ff88', // Emerald
    concerned: '#8a2be2', // Soft violet
    motivated: '#ff5500', // Fiery amber
    sad: '#4361ee', // Melancholy blue
  }

  const activeColor = settings.hologramColor || emotionColorMap[currentEmotion] || '#00f3ff'

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#060810]">
      <Canvas
        camera={{ position: [0, 0.35, 2.4], fov: 42 }}
        dpr={settings.lowPerformanceMode ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
      >
        <color attach="background" args={['#060810']} />

        {/* Ambient & Rim Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} color="#00f3ff" />
        <directionalLight position={[-2, 1, -2]} intensity={0.6} color="#ff007f" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Holo Projector Base */}
            <ProjectorBase color={activeColor} />

            {/* Floating Cyber Particles */}
            <FloatingParticles color={activeColor} count={settings.lowPerformanceMode ? 100 : 250} />

            {/* VRM Avatar / Hologram Controller */}
            <VrmAvatar
              modelUrl={settings.avatarModelUrl || '/models/ada.vrm'}
              hologramColor={activeColor}
              solidRendering={settings.solidRendering}
            />
          </group>

          {/* Camera Controls with bounded framing */}
          <CameraRig />

          {/* Post-Processing Bloom (Disabled in low-performance / battery-saver mode) */}
          {!settings.lowPerformanceMode && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.45}
                luminanceThreshold={0.5}
                luminanceSmoothing={0.8}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}
