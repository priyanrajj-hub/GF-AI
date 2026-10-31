import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { VrmAvatar } from '../avatar/VrmAvatar.js'
import { FloatingParticles } from './FloatingParticles.js'
import { ProjectorBase } from './ProjectorBase.js'

function CameraRig({ closeUp = false }: { closeUp?: boolean }) {
  const controlsRef = useRef<any>(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // Subtle idle camera drift
    const targetY = closeUp ? 0.55 : 0.05 + Math.sin(t * 0.4) * 0.015
    const targetZ = closeUp ? 1.25 : 3.10

    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 2.5)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 2.5)

    if (controlsRef.current) {
      controlsRef.current.target.set(0, closeUp ? 0.55 : -0.10, 0)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={0.8}
      maxDistance={4.5}
      minAzimuthAngle={-Math.PI / 6.0} // ~30 degrees limit
      maxAzimuthAngle={Math.PI / 6.0}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 1.72}
      dampingFactor={0.06}
    />
  )
}

export const HoloScene: React.FC = () => {
  const { settings, currentEmotion } = useAppStore()

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

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#060814]">
      <Canvas
        camera={{ position: [0, 0.05, 3.10], fov: 30 }}
        dpr={settings.lowPerformanceMode ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={['#060814']} />

        {/* Studio Lighting Rig */}
        {/* Soft Ambient Fill */}
        <ambientLight intensity={0.45} color="#1e293b" />
        {/* Warm Key Light */}
        <directionalLight position={[1.5, 2.8, 2.0]} intensity={1.1} color="#fff2e6" />
        {/* Magenta Rim Light Behind */}
        <directionalLight position={[-1.5, 2.2, -2.0]} intensity={1.2} color="#ff007f" />
        {/* Cyan Fill Light from Side */}
        <directionalLight position={[-1.8, 1.0, 1.5]} intensity={0.6} color="#00f3ff" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Holo Projector Base */}
            <ProjectorBase color={activeColor} />

            {/* Floating Cyber Particles (Smaller & Sparser) */}
            <FloatingParticles color={activeColor} count={settings.lowPerformanceMode ? 50 : 120} />

            {/* Real 3D VRM/GLB Hologram Avatar Model */}
            <VrmAvatar
              modelUrl={settings.avatarModelUrl || '/models/ada.vrm'}
              hologramColor={activeColor}
              renderMode={settings.renderMode || 'holo-lite'}
            />
          </group>

          {/* Camera Controls with bounded framing */}
          <CameraRig closeUp={settings.closeUpView} />

          {/* Post-Processing Bloom (Threshold ~0.82 so only emissive and rim parts glow) */}
          {!settings.lowPerformanceMode && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.35}
                luminanceThreshold={0.82}
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
