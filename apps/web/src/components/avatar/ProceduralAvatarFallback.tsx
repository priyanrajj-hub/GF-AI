import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProceduralAvatarFallbackProps {
  character: 'ada' | 'mira' | 'atlas'
  systemState?: string
  onClick?: (e: any) => void
}

export const ProceduralAvatarFallback: React.FC<ProceduralAvatarFallbackProps> = ({
  character,
  systemState,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const leftTailRef = useRef<THREE.Group>(null)
  const rightTailRef = useRef<THREE.Group>(null)
  const arcReactorRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // Gentle breathing & floating idle motion
    const breath = Math.sin(t * 2) * 0.015
    const sway = Math.sin(t * 1.2) * 0.02
    groupRef.current.position.y = -0.72 + breath
    groupRef.current.rotation.y = sway

    // Miku twin-tails physics simulation
    if (leftTailRef.current && rightTailRef.current) {
      const tailSway = Math.sin(t * 2.5) * 0.08
      leftTailRef.current.rotation.z = 0.15 + tailSway
      rightTailRef.current.rotation.z = -0.15 - tailSway
      leftTailRef.current.rotation.x = Math.cos(t * 1.8) * 0.05
      rightTailRef.current.rotation.x = Math.cos(t * 1.8) * 0.05
    }

    // Arc reactor pulsation for Tony Stark
    if (arcReactorRef.current) {
      const pulse = 1.0 + Math.sin(t * 4) * 0.2
      arcReactorRef.current.scale.set(pulse, pulse, pulse)
    }

    // Rotating holographic halo / pedestal
    if (haloRef.current) {
      haloRef.current.rotation.y += delta * 0.5
    }
  })

  const isMiku = character === 'mira'
  const isStark = character === 'atlas'

  // Miku Colors
  const mikuCyan = '#39c5bb'
  const mikuDark = '#1a1d24'
  const mikuRibbon = '#ff2a85'
  const skinTone = '#ffeedd'

  // Ada Colors
  const adaRed = '#dc2626'
  const adaHair = '#1c1917'

  // Stark Colors
  const starkRed = '#991b1b'
  const starkGold = '#d97706'
  const starkArc = '#06b6d4'

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* ─── HATSUNE MIKU PROCEDURAL 3D FIGURE ─── */}
      {isMiku && (
        <group position={[0, 0, 0]}>
          {/* Head */}
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshStandardMaterial color={skinTone} roughness={0.4} />
          </mesh>

          {/* Bangs & Top Hair */}
          <mesh position={[0, 1.5, 0.03]} rotation={[0.2, 0, 0]}>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color={mikuCyan} roughness={0.3} />
          </mesh>

          {/* Headset & Mic */}
          <mesh position={[0, 1.48, 0]}>
            <torusGeometry args={[0.145, 0.015, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#111111" metalness={0.8} />
          </mesh>
          <mesh position={[-0.14, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0.14, 1.48, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.4} />
          </mesh>

          {/* Iconic Twin Tails with Ribbon Blocks */}
          {/* Left Twin Tail */}
          <group ref={leftTailRef} position={[-0.16, 1.52, -0.02]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshStandardMaterial color={mikuRibbon} emissive={mikuRibbon} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[-0.04, -0.45, 0]} rotation={[0, 0, 0.08]}>
              <cylinderGeometry args={[0.025, 0.05, 0.9, 16]} />
              <meshStandardMaterial color={mikuCyan} roughness={0.3} />
            </mesh>
          </group>

          {/* Right Twin Tail */}
          <group ref={rightTailRef} position={[0.16, 1.52, -0.02]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshStandardMaterial color={mikuRibbon} emissive={mikuRibbon} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0.04, -0.45, 0]} rotation={[0, 0, -0.08]}>
              <cylinderGeometry args={[0.025, 0.05, 0.9, 16]} />
              <meshStandardMaterial color={mikuCyan} roughness={0.3} />
            </mesh>
          </group>

          {/* Neck & Cyan Tie */}
          <mesh position={[0, 1.30, 0]}>
            <cylinderGeometry args={[0.04, 0.045, 0.06, 16]} />
            <meshStandardMaterial color={skinTone} />
          </mesh>
          <mesh position={[0, 1.18, 0.09]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.03, 0.18, 0.01]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.3} />
          </mesh>

          {/* Torso & Silver Sleeveless Top */}
          <mesh position={[0, 1.14, 0]}>
            <cylinderGeometry args={[0.11, 0.09, 0.28, 16]} />
            <meshStandardMaterial color="#c0c5cc" metalness={0.2} roughness={0.4} />
          </mesh>

          {/* Detached Synthesizer Sleeves & Equalizer Rings */}
          <mesh position={[-0.18, 1.05, 0]}>
            <cylinderGeometry args={[0.038, 0.05, 0.32, 16]} />
            <meshStandardMaterial color={mikuDark} roughness={0.5} />
          </mesh>
          <mesh position={[-0.18, 1.12, 0.04]}>
            <boxGeometry args={[0.04, 0.08, 0.01]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.8} />
          </mesh>

          <mesh position={[0.18, 1.05, 0]}>
            <cylinderGeometry args={[0.038, 0.05, 0.32, 16]} />
            <meshStandardMaterial color={mikuDark} roughness={0.5} />
          </mesh>
          <mesh position={[0.18, 1.12, 0.04]}>
            <boxGeometry args={[0.04, 0.08, 0.01]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.8} />
          </mesh>

          {/* Pleated Skirt */}
          <mesh position={[0, 0.94, 0]}>
            <cylinderGeometry args={[0.10, 0.20, 0.16, 24]} />
            <meshStandardMaterial color={mikuDark} roughness={0.6} />
          </mesh>
          {/* Skirt Cyan Hemline */}
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.198, 0.202, 0.02, 24]} />
            <meshStandardMaterial color={mikuCyan} emissive={mikuCyan} emissiveIntensity={0.5} />
          </mesh>

          {/* Thigh-High Boots */}
          <mesh position={[-0.08, 0.42, 0]}>
            <cylinderGeometry args={[0.042, 0.036, 0.82, 16]} />
            <meshStandardMaterial color={mikuDark} roughness={0.4} />
          </mesh>
          <mesh position={[0.08, 0.42, 0]}>
            <cylinderGeometry args={[0.042, 0.036, 0.82, 16]} />
            <meshStandardMaterial color={mikuDark} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* ─── TONY STARK (JARVIS QUANT AI) FIGURE ─── */}
      {isStark && (
        <group position={[0, 0, 0]}>
          {/* Helmet */}
          <mesh position={[0, 1.48, 0]}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshStandardMaterial color={starkRed} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Gold Faceplate */}
          <mesh position={[0, 1.48, 0.06]}>
            <boxGeometry args={[0.11, 0.14, 0.08]} />
            <meshStandardMaterial color={starkGold} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Glowing Eyes */}
          <mesh position={[-0.035, 1.50, 0.11]}>
            <boxGeometry args={[0.03, 0.008, 0.01]} />
            <meshStandardMaterial color="#ffffff" emissive={starkArc} emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.035, 1.50, 0.11]}>
            <boxGeometry args={[0.03, 0.008, 0.01]} />
            <meshStandardMaterial color="#ffffff" emissive={starkArc} emissiveIntensity={1.5} />
          </mesh>

          {/* Armor Torso */}
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.26, 0.38, 0.18]} />
            <meshStandardMaterial color={starkRed} metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Arc Reactor Core */}
          <mesh ref={arcReactorRef} position={[0, 1.20, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 24]} />
            <meshStandardMaterial color="#ffffff" emissive={starkArc} emissiveIntensity={2.5} />
          </mesh>

          {/* Shoulders & Arms */}
          <mesh position={[-0.20, 1.25, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={starkGold} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[-0.20, 1.02, 0]}>
            <cylinderGeometry args={[0.045, 0.04, 0.36, 16]} />
            <meshStandardMaterial color={starkRed} metalness={0.8} roughness={0.25} />
          </mesh>

          <mesh position={[0.20, 1.25, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color={starkGold} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.20, 1.02, 0]}>
            <cylinderGeometry args={[0.045, 0.04, 0.36, 16]} />
            <meshStandardMaterial color={starkRed} metalness={0.8} roughness={0.25} />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.08, 0.45, 0]}>
            <cylinderGeometry args={[0.05, 0.04, 0.88, 16]} />
            <meshStandardMaterial color={starkRed} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0.08, 0.45, 0]}>
            <cylinderGeometry args={[0.05, 0.04, 0.88, 16]} />
            <meshStandardMaterial color={starkRed} metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* ─── ADA WONG FIGURE ─── */}
      {!isMiku && !isStark && (
        <group position={[0, 0, 0]}>
          {/* Head & Sleek Black Bob Hair */}
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshStandardMaterial color={skinTone} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.50, -0.02]}>
            <sphereGeometry args={[0.145, 24, 24]} />
            <meshStandardMaterial color={adaHair} roughness={0.3} />
          </mesh>

          {/* Crimson Turtleneck Dress */}
          <mesh position={[0, 1.30, 0]}>
            <cylinderGeometry args={[0.05, 0.055, 0.08, 16]} />
            <meshStandardMaterial color={adaRed} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.10, 0]}>
            <cylinderGeometry args={[0.11, 0.13, 0.40, 16]} />
            <meshStandardMaterial color={adaRed} roughness={0.6} />
          </mesh>

          {/* Slender Arms */}
          <mesh position={[-0.16, 1.05, 0]}>
            <cylinderGeometry args={[0.035, 0.03, 0.38, 16]} />
            <meshStandardMaterial color={adaRed} roughness={0.6} />
          </mesh>
          <mesh position={[0.16, 1.05, 0]}>
            <cylinderGeometry args={[0.035, 0.03, 0.38, 16]} />
            <meshStandardMaterial color={adaRed} roughness={0.6} />
          </mesh>

          {/* Black Boots */}
          <mesh position={[-0.07, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.035, 0.84, 16]} />
            <meshStandardMaterial color="#111116" roughness={0.3} />
          </mesh>
          <mesh position={[0.07, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.035, 0.84, 16]} />
            <meshStandardMaterial color="#111116" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* ─── HOLOGRAPHIC AMBIENT STAGE PEDESTAL ─── */}
      <group ref={haloRef} position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial
            color={isMiku ? mikuCyan : isStark ? starkArc : '#ef4444'}
            transparent
            opacity={0.65}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.52, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </group>
  )
}
