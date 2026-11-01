import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectorBaseProps {
  color?: string
}

/**
 * Sleek Holographic Home Pad (Task B & Round 5)
 * Scaled to 1.4x shoulder width (radius ~0.65m), thin glowing ring lines,
 * dark metallic disc, zero clipping through legs.
 */
export const ProjectorBase: React.FC<ProjectorBaseProps> = ({ color = '#00f3ff' }) => {
  const glyphsRef = useRef<THREE.Group>(null)
  const innerRingRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (glyphsRef.current) {
      glyphsRef.current.rotation.z += delta * 0.15
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.22
    }
  })

  const baseColor = new THREE.Color(color)

  return (
    <group position={[0, -0.72, 0]}>
      {/* 1. Flat Dark Metallic Disc Base (Radius 0.65m, top at y = 0) */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.65, 0.70, 0.04, 48]} />
        <meshStandardMaterial
          color="#080c18"
          metalness={0.92}
          roughness={0.25}
        />
      </mesh>

      {/* 2. Thin Glowing Outer Cyan Ring Line */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.61, 0.63, 64]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 3. Delicate Rotating Outer Glyph Ring */}
      <group ref={glyphsRef} position={[0, 0.004, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.52, 6]} />
          <meshBasicMaterial
            color={baseColor}
            opacity={0.55}
            transparent
            wireframe
          />
        </mesh>
      </group>

      {/* 4. Delicate Counter-Rotating Inner Ring */}
      <group ref={innerRingRef} position={[0, 0.006, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.30, 0.33, 8]} />
          <meshBasicMaterial
            color={baseColor}
            opacity={0.65}
            transparent
            wireframe
          />
        </mesh>
      </group>

      {/* 5. Center Core Emitter Dot */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.10, 32]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 6. Soft Contact Shadow Plane Underneath */}
      <mesh position={[0, -0.041, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.95, 32]} />
        <meshBasicMaterial
          color="#020408"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 7. Subtle Large Ground Grid */}
      <gridHelper
        args={[16, 32, color, '#0c1527']}
        position={[0, -0.042, 0]}
      />
    </group>
  )
}
