import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProceduralAvatarFallbackProps {
  character: 'ada' | 'mira' | 'atlas'
  systemState?: string
  onClick?: (e: any) => void
}

/**
 * High-tech Holographic Quantum Teleportation / Sync Beam.
 * Displayed cleanly while high-res 3D assets stream into memory.
 * NEVER renders blocky mannequins or cylinder dolls.
 */
export const ProceduralAvatarFallback: React.FC<ProceduralAvatarFallbackProps> = ({
  character,
  systemState,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  const beamRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  const isMiku = character === 'mira'
  const isStark = character === 'atlas'

  // Character-specific signature energy colors
  const primaryColor = isMiku ? '#39c5bb' : isStark ? '#00f3ff' : '#dc2626'
  const secondaryColor = isMiku ? '#ff2a85' : isStark ? '#d97706' : '#f59e0b'

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    // Smooth rotational scanning of holographic rings
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 1.2
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.9
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 1.5

    // Pulsing energy beam
    if (beamRef.current) {
      const pulse = 0.85 + Math.sin(t * 4) * 0.15
      const mat = beamRef.current.material as THREE.MeshBasicMaterial
      if (mat) mat.opacity = 0.35 * pulse
    }

    // Core oscillation
    if (coreRef.current) {
      coreRef.current.position.y = 0.75 + Math.sin(t * 2.5) * 0.08
      const scale = 1.0 + Math.sin(t * 5) * 0.12
      coreRef.current.scale.set(scale, scale, scale)
    }

    // Vertical hover motion for the entire pedestal
    if (groupRef.current) {
      groupRef.current.position.y = -0.72 + Math.sin(t * 1.5) * 0.015
    }
  })

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* 1. Base Holographic Projector Rings */}
      <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Ring 1 - Outer reticle */}
        <mesh ref={ring1Ref}>
          <ringGeometry args={[0.55, 0.62, 48]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* Ring 2 - Mid segmented scanner */}
        <mesh ref={ring2Ref} position={[0, 0, 0.02]}>
          <ringGeometry args={[0.38, 0.44, 32]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>

        {/* Ring 3 - Inner quantum focus */}
        <mesh ref={ring3Ref} position={[0, 0, 0.04]}>
          <ringGeometry args={[0.18, 0.22, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2. Vertical Holographic Column / Teleportation Beam */}
      <mesh ref={beamRef} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.32, 0.48, 1.7, 32, 1, true]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Concentric Floating Energy Core */}
      <mesh ref={coreRef} position={[0, 0.75, 0]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 4. Upper Constellation Ring */}
      <mesh position={[0, 1.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.30, 32]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
