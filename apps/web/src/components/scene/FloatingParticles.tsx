import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FloatingParticlesProps {
  color?: string
  count?: number
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({ color = '#00f3ff', count = 120 }) => {
  const pointsRef = useRef<THREE.Points>(null)

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
        size={0.018}
        color={color}
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
