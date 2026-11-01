import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnimeFXProps {
  activeFX: string[]
  avatarPosition: [number, number, number]
  showMascot?: boolean
}

export const AnimeFXLayer: React.FC<AnimeFXProps> = ({
  activeFX,
  avatarPosition,
  showMascot = true,
}) => {
  const particlesRef = useRef<THREE.Points>(null)
  const mascotRef = useRef<THREE.Group>(null)

  // Floating particles pool
  const particleCount = 45

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.75)')
      gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.25)')
      gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 64, 64)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  const [positions, colors, scales] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const col = new Float32Array(particleCount * 3)
    const sc = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 1.5
      pos[i * 3 + 1] = Math.random() * 1.8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.0

      // Warm pink / cyan / gold tones
      if (Math.random() > 0.5) {
        col[i * 3 + 0] = 1.0 // Pink/Red
        col[i * 3 + 1] = 0.2
        col[i * 3 + 2] = 0.6
      } else {
        col[i * 3 + 0] = 0.0 // Cyan
        col[i * 3 + 1] = 0.95
        col[i * 3 + 2] = 1.0
      }
      sc[i] = 0.04 + Math.random() * 0.04
    }
    return [pos, col, sc]
  }, [])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    // Animate particles rising gently
    if (particlesRef.current) {
      const geo = particlesRef.current.geometry
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
      if (posAttr) {
        for (let i = 0; i < particleCount; i++) {
          let y = posAttr.getY(i) + delta * 0.45
          if (y > 2.0) y = 0.1
          posAttr.setY(i, y)
          // gentle lateral sway
          const x = posAttr.getX(i) + Math.sin(time * 3.0 + i) * 0.002
          posAttr.setX(i, x)
        }
        posAttr.needsUpdate = true
      }
    }

    // Animate Floating Mascot Companion
    if (mascotRef.current) {
      // Hover near avatar's right shoulder with smooth follow
      const targetX = avatarPosition[0] + 0.45 + Math.sin(time * 2.5) * 0.04
      const targetY = avatarPosition[1] + 1.25 + Math.cos(time * 3.0) * 0.06
      const targetZ = avatarPosition[2] + 0.1 + Math.sin(time * 1.8) * 0.03

      mascotRef.current.position.x = THREE.MathUtils.lerp(
        mascotRef.current.position.x,
        targetX,
        delta * 3.0
      )
      mascotRef.current.position.y = THREE.MathUtils.lerp(
        mascotRef.current.position.y,
        targetY,
        delta * 3.0
      )
      mascotRef.current.position.z = THREE.MathUtils.lerp(
        mascotRef.current.position.z,
        targetZ,
        delta * 3.0
      )
      mascotRef.current.rotation.y = Math.sin(time * 2.0) * 0.25
    }
  })

  const hasAnyFX = activeFX && activeFX.length > 0

  return (
    <group>
      {/* 1. Anime Floating Emotes Particles */}
      {hasAnyFX && (
        <points ref={particlesRef} position={avatarPosition}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={particleTexture}
            size={0.08}
            vertexColors
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {/* 2. Floating Mascot Companion (Round 5 Cute Holo-Bot) */}
      {showMascot && (
        <group ref={mascotRef} position={[0.45, 1.25, 0]}>
          {/* Main Glowing Orb */}
          <mesh>
            <sphereGeometry args={[0.075, 24, 24]} />
            <meshStandardMaterial
              color="#00f3ff"
              emissive="#00f3ff"
              emissiveIntensity={0.65}
              roughness={0.2}
              transparent
              opacity={0.92}
            />
          </mesh>

          {/* Cute Little Wings / Ears */}
          <mesh position={[-0.07, 0.05, 0]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.03, 0.07, 16]} />
            <meshBasicMaterial color="#ff007f" />
          </mesh>
          <mesh position={[0.07, 0.05, 0]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.03, 0.07, 16]} />
            <meshBasicMaterial color="#ff007f" />
          </mesh>

          {/* Little Happy Eyes */}
          <mesh position={[-0.025, 0.015, 0.065]}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color="#05070f" />
          </mesh>
          <mesh position={[0.025, 0.015, 0.065]}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshBasicMaterial color="#05070f" />
          </mesh>

          {/* Horizontal Halo Orbit Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.11, 0.125, 32]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.65} />
          </mesh>
        </group>
      )}
    </group>
  )
}
