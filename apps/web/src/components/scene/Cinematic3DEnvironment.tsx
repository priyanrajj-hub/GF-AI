import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../store/useAppStore.js'

/**
 * Cinematic 3D Animated Background Environments
 * Tailored specifically for Tony Stark (Stark Lab), Ada Wong (Espionage Penthouse), and Yor Forger (Moonlit Thorn Garden)
 */

// ─── 1. TONY STARK: High-Tech Stark Holographic Lab ────────────────────────────
function StarkLabEnvironment() {
  const hudRing1Ref = useRef<THREE.Group>(null)
  const hudRing2Ref = useRef<THREE.Group>(null)
  const hudRing3Ref = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // Particle sparks rising from floor
  const { positions, opacities } = useMemo(() => {
    const count = 120
    const pos = new Float32Array(count * 3)
    const op = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = Math.random() * 3 - 0.7
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
      op[i] = Math.random() * 0.8 + 0.2
    }
    return { positions: pos, opacities: op }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (hudRing1Ref.current) {
      hudRing1Ref.current.rotation.z += delta * 0.25
      hudRing1Ref.current.rotation.y = Math.sin(t * 0.3) * 0.2
    }
    if (hudRing2Ref.current) {
      hudRing2Ref.current.rotation.z -= delta * 0.35
      hudRing2Ref.current.rotation.x = Math.cos(t * 0.25) * 0.15
    }
    if (hudRing3Ref.current) {
      hudRing3Ref.current.rotation.y += delta * 0.18
      hudRing3Ref.current.position.y = 0.8 + Math.sin(t * 0.5) * 0.08
    }

    // Spark particles rise upward
    if (particlesRef.current) {
      const geo = particlesRef.current.geometry
      const posAttr = geo.attributes.position
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] += delta * 0.4
        if (arr[i * 3 + 1] > 2.8) {
          arr[i * 3 + 1] = -0.7
        }
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* High-tech Cyber Grid Floor */}
      <mesh position={[0, -0.73, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#060c18"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <gridHelper
        args={[16, 32, '#00f3ff', '#0c2238']}
        position={[0, -0.725, 0]}
      />

      {/* Hexagonal Room Outer Perimeter Columns */}
      {[-3.5, 3.5].map((x, i) => (
        <group key={`col-${i}`} position={[x, 0.8, -2.5]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.22, 3.2, 16]} />
            <meshStandardMaterial color="#0b1322" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Cyan Energy Channel Light Strip */}
          <mesh position={[0, 0, 0.19]}>
            <planeGeometry args={[0.06, 2.8]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.85} />
          </mesh>
          <pointLight color="#00f3ff" intensity={0.8} distance={2.5} position={[0, 0, 0.3]} />
        </group>
      ))}

      {/* Floating 3D Holographic HUD Rings (Tony Stark AI Lab UI) */}
      <group position={[0, 0.9, -1.2]}>
        {/* Ring 1 - Outer Tech Ring */}
        <group ref={hudRing1Ref}>
          <mesh>
            <ringGeometry args={[1.65, 1.68, 64]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[1.58, 1.60, 4, 1, 0, Math.PI * 1.5]} />
            <meshBasicMaterial color="#ffb703" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Ring 2 - Segmented Ring */}
        <group ref={hudRing2Ref}>
          <mesh>
            <ringGeometry args={[1.35, 1.38, 48]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Ring 3 - Horizontal Data Plane */}
        <group ref={hudRing3Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <mesh>
            <ringGeometry args={[1.8, 1.83, 64]} />
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* Floating Arc Sparks */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00f3ff"
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Atmospheric Backplate Holographic Display Wall */}
      <mesh position={[0, 1.0, -4.2]}>
        <planeGeometry args={[12, 5]} />
        <meshBasicMaterial color="#040915" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── 2. ADA WONG: Neo-Tokyo Espionage Penthouse ────────────────────────────────
function AdaPenthouseEnvironment() {
  const rainRef = useRef<THREE.Points>(null)

  const { rainPositions } = useMemo(() => {
    const count = 350
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = Math.random() * 6 - 1
      pos[i * 3 + 2] = -2.8 + (Math.random() - 0.5) * 3
    }
    return { rainPositions: pos }
  }, [])

  useFrame((_, delta) => {
    if (rainRef.current) {
      const posAttr = rainRef.current.geometry.attributes.position
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= delta * 4.8 // fast rain
        if (arr[i * 3 + 1] < -1.0) {
          arr[i * 3 + 1] = 4.5
        }
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Sleek Polished Dark Marble Floor with High Specular Reflection */}
      <mesh position={[0, -0.73, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#0a0709"
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Luxury Penthouse Floor Accent LED Strip (Crimson Red Ada Signature) */}
      <mesh position={[0, -0.725, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 0.05]} />
        <meshBasicMaterial color="#c81e2f" transparent opacity={0.8} />
      </mesh>

      {/* Panoramic Skyline Window Frame Pillars */}
      {[-3.0, 0, 3.0].map((x, i) => (
        <mesh key={`win-col-${i}`} position={[x, 1.2, -3.2]}>
          <boxGeometry args={[0.16, 4.0, 0.25]} />
          <meshStandardMaterial color="#120e14" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Horizontal Transom Bar */}
      <mesh position={[0, 2.2, -3.2]}>
        <boxGeometry args={[8.0, 0.12, 0.25]} />
        <meshStandardMaterial color="#120e14" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Distant Cyber City Skyline Buildings */}
      {[-4, -2.5, -1.2, 0.8, 2.2, 3.8].map((x, i) => {
        const height = 1.8 + ((i * 37) % 5) * 0.45
        const neonColor = i % 2 === 0 ? '#ff0055' : i % 3 === 0 ? '#00f3ff' : '#ffb703'
        return (
          <group key={`bldg-${i}`} position={[x, height / 2 - 0.5, -5.2]}>
            <mesh>
              <boxGeometry args={[1.1, height, 1.1]} />
              <meshStandardMaterial color="#050308" roughness={0.7} />
            </mesh>
            {/* Window Glow Spots */}
            <mesh position={[0, height * 0.3, 0.56]}>
              <planeGeometry args={[0.7, 0.08]} />
              <meshBasicMaterial color={neonColor} transparent opacity={0.75} />
            </mesh>
          </group>
        )
      })}

      {/* Falling Rain Particles outside glass */}
      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[rainPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#bae6fd"
          transparent
          opacity={0.45}
        />
      </points>

      {/* Espionage Tactical Holographic Map Node */}
      <group position={[1.8, 0.7, -1.8]} rotation={[0, -0.4, 0]}>
        <mesh>
          <planeGeometry args={[0.9, 0.6]} />
          <meshBasicMaterial color="#c81e2f" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.15, 0.18, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Warm Crimson & Amber Rim Lighting */}
      <pointLight color="#c81e2f" intensity={1.2} distance={5} position={[-2, 1.5, 0]} />
      <pointLight color="#ff8844" intensity={0.9} distance={6} position={[2.5, 2.0, -1]} />
    </group>
  )
}

// ─── 3. HATSUNE MIKU: Cyber Vocaloid Hologram Concert Stage ──────────────────
function MikuConcertStageEnvironment() {
  const particlesRef = useRef<THREE.Points>(null)
  const spotlightL = useRef<THREE.SpotLight>(null)
  const spotlightR = useRef<THREE.SpotLight>(null)
  const stageRingRef = useRef<THREE.Mesh>(null)

  const { particlePositions, particleSpeeds } = useMemo(() => {
    const count = 220
    const pos = new Float32Array(count * 3)
    const speeds = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = Math.random() * 4 - 0.6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
      speeds[i * 3] = (Math.random() - 0.5) * 0.15 // drift X
      speeds[i * 3 + 1] = 0.25 + Math.random() * 0.40 // rise Y (upward stage sparkle)
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.15 // drift Z
    }
    return { particlePositions: pos, particleSpeeds: speeds }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // Upward floating concert stage particles
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3] += particleSpeeds[i * 3] * delta + Math.sin(t * 1.5 + i) * 0.003
        arr[i * 3 + 1] += particleSpeeds[i * 3 + 1] * delta
        arr[i * 3 + 2] += particleSpeeds[i * 3 + 2] * delta

        if (arr[i * 3 + 1] > 3.6) {
          arr[i * 3 + 1] = -0.6
          arr[i * 3] = (Math.random() - 0.5) * 8
        }
      }
      posAttr.needsUpdate = true
    }

    // Sweeping concert laser spotlights
    if (spotlightL.current) {
      spotlightL.current.position.x = -2.5 + Math.sin(t * 1.2) * 0.8
      spotlightL.current.target.position.set(Math.sin(t * 1.6) * 0.5, 0.4, 0)
      spotlightL.current.target.updateMatrixWorld()
    }
    if (spotlightR.current) {
      spotlightR.current.position.x = 2.5 - Math.cos(t * 1.2) * 0.8
      spotlightR.current.target.position.set(-Math.sin(t * 1.6) * 0.5, 0.4, 0)
      spotlightR.current.target.updateMatrixWorld()
    }

    // Audio-reactive pulsing holographic stage ring
    if (stageRingRef.current) {
      const pulse = 1.0 + Math.sin(t * 5.0) * 0.035
      stageRingRef.current.scale.set(pulse, pulse, 1.0)
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Reflective Glossy Cyber Stage Floor */}
      <mesh position={[0, -0.73, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#060c14"
          roughness={0.20}
          metalness={0.85}
        />
      </mesh>

      {/* Luminous Neon Stage Rings around Miku's Feet */}
      <mesh position={[0, -0.725, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.16, 48]} />
        <meshBasicMaterial color="#39c5bb" />
      </mesh>
      <mesh position={[0, -0.725, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.54, 48]} />
        <meshBasicMaterial color="#ff007f" />
      </mesh>
      {/* Subtle outer audio-reactive concert floor aura */}
      <mesh ref={stageRingRef} position={[0, -0.724, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.85, 1.88, 64]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Concert Laser Spotlights */}
      <spotLight
        ref={spotlightL}
        position={[-2.5, 3.2, 1.5]}
        intensity={3.2}
        angle={0.45}
        penumbra={0.6}
        color="#00e5ff"
        castShadow
      />
      <spotLight
        ref={spotlightR}
        position={[2.5, 3.2, 1.5]}
        intensity={3.2}
        angle={0.45}
        penumbra={0.6}
        color="#ff007f"
        castShadow
      />

      {/* Distant Cyber Holographic Stage Wall Glow */}
      <mesh position={[0, 1.2, -4.5]}>
        <planeGeometry args={[14, 5.5]} />
        <meshBasicMaterial color="#040915" side={THREE.DoubleSide} />
      </mesh>

      {/* Upward Rising Stage Energy Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.048}
          color="#39c5bb"
          transparent
          opacity={0.85}
        />
      </points>

      {/* Vibrant Cyan & Magenta Concert Atmosphere Glow */}
      <pointLight color="#00e5ff" intensity={1.2} distance={8} position={[-2, 1.6, 0]} />
      <pointLight color="#ff007f" intensity={1.1} distance={8} position={[2, 1.6, 0]} />
      <pointLight color="#e0f7f6" intensity={0.8} distance={6} position={[0, 1.2, 1.8]} />
    </group>
  )
}

// ─── Main Environment Router ──────────────────────────────────────────────────
export const Cinematic3DEnvironment: React.FC = () => {
  const { activeCharacter } = useAppStore()

  if (activeCharacter === 'atlas') {
    return <StarkLabEnvironment />
  }

  if (activeCharacter === 'mira') {
    return <MikuConcertStageEnvironment />
  }

  // Default: Ada Wong Espionage Penthouse
  return <AdaPenthouseEnvironment />
}
