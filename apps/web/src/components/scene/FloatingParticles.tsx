import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FloatingParticlesProps {
  color?: string
  count?: number
}

/**
 * Creates a smooth radial soft particle sprite texture (Task F)
 * Eliminates harsh square pixel particles, rendering soft glowing round bokeh orbs.
 */
function createRadialParticleTexture(): THREE.Texture {
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
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({ color = '#00f3ff', count = 120 }) => {
  const pointsRef = useRef<THREE.Points>(null)

  const particleTexture = useMemo(() => createRadialParticleTexture(), [])

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Cylinder distribution around the avatar
      const radius = 0.3 + Math.random() * 1.6
      const theta = Math.random() * Math.PI * 2
      pos[i * 3 + 0] = Math.cos(theta) * radius
      pos[i * 3 + 1] = -0.8 + Math.random() * 2.8 // height
      pos[i * 3 + 2] = Math.sin(theta) * radius
      spd[i] = 0.2 + Math.random() * 0.5
    }
    return [pos, spd]
  }, [count])

  useFrame((_state, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const array = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      // Move upward
      array[i * 3 + 1] += delta * speeds[i]
      // Loop back to bottom
      if (array[i * 3 + 1] > 2.2) {
        array[i * 3 + 1] = -0.9
      }
    }
    posAttr.needsUpdate = true
    pointsRef.current.rotation.y += delta * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        size={0.038}
        color={color}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
