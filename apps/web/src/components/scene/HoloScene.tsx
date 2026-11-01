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

    // Full-body responsive framing distance
    let baseDist = 3.50
    if (aspect < 1.0) {
      baseDist = 4.15 // Mobile portrait
    } else if (size.height < 650) {
      baseDist = 3.65 // Short landscape (1024x579)
    }

    const targetZ = isCloseUp ? adaZ + 1.45 : baseDist
    const targetY = isCloseUp ? adaY + 1.25 : (size.height < 650 ? 0.08 : 0.04)
    const targetX = adaX * (isCloseUp ? 0.90 : 0.35) + pointer.x * (isCloseUp ? 0.04 : 0.12)

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3.0)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + Math.sin(t * 0.4) * 0.006, delta * 3.0)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 3.0)

    // Target chest/hips center in full body (0.02), or face in close-up
    const lookAtX = adaX * (isCloseUp ? 0.90 : 0.35)
    const lookAtY = isCloseUp ? adaY + 1.22 : 0.02
    const lookAtZ = isCloseUp ? adaZ : 0
    state.camera.lookAt(lookAtX, lookAtY, lookAtZ)
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
