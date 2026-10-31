import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'
import { VrmAvatar } from '../avatar/VrmAvatar.js'
import { FloatingParticles } from './FloatingParticles.js'
import { ProjectorBase } from './ProjectorBase.js'

function CameraRig() {
  const { pointer } = useThree()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    // Gentle parallax drift (plus or minus 1.5 degrees) per Round 5
    const targetX = pointer.x * 0.14
    const targetY = 0.04 + pointer.y * 0.08 + Math.sin(t * 0.3) * 0.01
    const targetZ = 3.30

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 2.5)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 2.5)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 2.5)

    state.camera.lookAt(0, -0.10, 0)
  })

  return null
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
        camera={{ position: [0, 0.04, 3.30], fov: 30 }}
        dpr={settings.lowPerformanceMode ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.86,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={['#060814']} />

        {/* Balanced Lighting Rig (Task C: No white blowout, dress fabric shading preserved) */}
        {/* Soft Ambient Fill */}
        <ambientLight intensity={0.25} color="#182030" />
        {/* Warm Key Light */}
        <directionalLight position={[1.8, 2.5, 2.2]} intensity={0.9} color="#fff4eb" castShadow />
        {/* Magenta Rim Light Behind */}
        <directionalLight position={[-1.8, 2.0, -2.2]} intensity={1.0} color="#ff007f" />
        {/* Cyan Fill Light from Side */}
        <directionalLight position={[-1.8, 0.8, 1.5]} intensity={0.4} color="#00f3ff" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Holo Home Pad Base */}
            <ProjectorBase color={activeColor} />

            {/* Floating Cyber Particles (Smaller & Sparser) */}
            <FloatingParticles color={activeColor} count={settings.lowPerformanceMode ? 40 : 90} />

            {/* Real 3D VRM/GLB Hologram Avatar Model */}
            <VrmAvatar
              modelUrl={settings.avatarModelUrl || '/models/ada.vrm'}
              hologramColor={activeColor}
              renderMode={settings.renderMode || 'holo-lite'}
            />
          </group>

          {/* Fixed Wide Parallax Camera (Round 5: Always Full Body) */}
          <CameraRig />

          {/* Post-Processing Bloom (Threshold 0.90, intensity 0.28: only emissive parts glow) */}
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
