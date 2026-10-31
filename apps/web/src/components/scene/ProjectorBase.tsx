import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProjectorBaseProps {
  color?: string
}

export const ProjectorBase: React.FC<ProjectorBaseProps> = ({ color = '#00f3ff' }) => {
  const outerRingRef = useRef<THREE.Group>(null)
  const innerRingRef = useRef<THREE.Group>(null)
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y += delta * 0.15
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 0.25
    }
    if (beamRef.current) {
      const material = beamRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 2.5) * 0.02
    }
  })

  const baseColor = new THREE.Color(color)

  return (
    <group position={[0, -1.0, 0]}>
      {/* 1. Heavy Metallic Base Cylinder */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 0.16, 64]} />
        <meshStandardMaterial color="#060913" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 2. Concentric Outer Glowing Emitter Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.45, 64]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 3. Rotating Outer Glyph Ring */}
      <group ref={outerRingRef} position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.15, 6]} />
          <meshBasicMaterial color={baseColor} opacity={0.6} transparent wireframe />
        </mesh>
      </group>

      {/* 4. Counter-Rotating Inner Glyphs */}
      <group ref={innerRingRef} position={[0, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.75, 8]} />
          <meshBasicMaterial color={baseColor} opacity={0.8} transparent wireframe />
        </mesh>
      </group>

      {/* 5. Center Core Emitter */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.08, 32]} />
        <meshBasicMaterial color={baseColor} toneMapped={false} />
      </mesh>

      {/* 6. Volumetric Light Cone Rising Upward (Waist-height, never covers face) */}
      <mesh ref={beamRef} position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.85, 0.35, 1.3, 32, 1, true]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 7. Soft Reflective Floor Ring under base */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 4.2, 64]} />
        <meshStandardMaterial
          color="#060914"
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 8. Subtle Tech Grid Floor */}
      <gridHelper args={[16, 32, color, '#0c1527']} position={[0, -0.092, 0]} />
    </group>
  )
}
