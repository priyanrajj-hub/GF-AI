import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectorBaseProps {
  color?: string
}

/**
 * Expansive Holographic Cyber Stage (Task B & Round 6)
 * Multi-tiered concentric holographic stage rings, dark metallic pedestal,
 * clean smooth circular cyber circuits (no jagged wireframe spikes).
 * Covers the entire roaming area so Ada is always on a glowing stage.
 */
export const ProjectorBase: React.FC<ProjectorBaseProps> = ({ color = '#00f3ff' }) => {
  const glyphsRef = useRef<THREE.Group>(null)
  const innerRingRef = useRef<THREE.Group>(null)
  const outerCircuitRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (glyphsRef.current) {
      glyphsRef.current.rotation.z += delta * 0.12
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.18
    }
    if (outerCircuitRef.current) {
      outerCircuitRef.current.rotation.z += delta * 0.06
    }
  })

  const baseColor = new THREE.Color(color)

  return (
    <group position={[0, -0.72, 0]}>
      {/* 1. Flat Dark Metallic Pedestal Disc (Center home pad, radius 0.70m) */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.70, 0.75, 0.04, 64]} />
        <meshStandardMaterial
          color="#080c18"
          metalness={0.92}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Core Glowing Home Pad Neon Ring */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.66, 0.69, 64]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 3. Concentric Mid-Stage Glowing Ring (Radius 1.15m) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.17, 64]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* 4. Expansive Outer Stage Perimeter Ring (Radius 1.65m) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 1.68, 64]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* 5. Smooth Rotating Cyber Glyph Ring (Circular, high segment, no spikes) */}
      <group ref={glyphsRef} position={[0, 0.003, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.51, 48]} />
          <meshBasicMaterial
            color={baseColor}
            opacity={0.65}
            transparent
          />
        </mesh>
      </group>

      {/* 6. Counter-Rotating Inner Cyber Ring */}
      <group ref={innerRingRef} position={[0, 0.004, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.30, 48]} />
          <meshBasicMaterial
            color={baseColor}
            opacity={0.75}
            transparent
          />
        </mesh>
      </group>

      {/* 7. Rotating Outer Stage Circuit Segments */}
      <group ref={outerCircuitRef} position={[0, 0.002, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.38, 1.40, 64]} />
          <meshBasicMaterial
            color={baseColor}
            opacity={0.35}
            transparent
          />
        </mesh>
      </group>

      {/* 8. Center Core Emitter Glow Dot */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.09, 32]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 9. Soft Contact Shadow Plane Underneath Pedestal */}
      <mesh position={[0, -0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 1.85, 32]} />
        <meshBasicMaterial
          color="#020408"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 10. Subtle Stage Floor Grid */}
      <gridHelper
        args={[16, 32, color, '#0c1527']}
        position={[0, -0.042, 0]}
      />
    </group>
  )
}
