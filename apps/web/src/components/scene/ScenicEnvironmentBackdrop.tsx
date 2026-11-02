import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TimeOfDayPhase } from '@ada/shared'

interface ScenicEnvironmentBackdropProps {
  phase: TimeOfDayPhase
  emotionColor: string
}

export const ScenicEnvironmentBackdrop: React.FC<ScenicEnvironmentBackdropProps> = ({
  phase,
  emotionColor,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastPhaseRef = useRef<string>('')
  const lastColorRef = useRef<string>('')

  // Generate or update procedural gradient canvas texture
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    canvasRef.current = canvas

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    textureRef.current = tex
    return tex
  }, [])

  // Draw gradient matching time-of-day phase & subtle emotion warmth
  const drawBackdrop = (currentPhase: TimeOfDayPhase, tintColor: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const grad = ctx.createLinearGradient(0, 0, 0, h)

    if (currentPhase === 'morning') {
      // Radiant Dawn Sunrise: Deep sapphire to peach-gold sunrise
      grad.addColorStop(0.0, '#090d16') // High sky
      grad.addColorStop(0.35, '#1e1b4b') // Morning indigo
      grad.addColorStop(0.60, '#6366f1') // Violet dawn
      grad.addColorStop(0.78, '#f472b6') // Rosy horizon
      grad.addColorStop(0.92, '#fde047') // Golden sunrise glow
      grad.addColorStop(1.0, '#fffbeb') // Horizon light
    } else if (currentPhase === 'noon') {
      // Bright High-Noon Daylight: Deep azure to brilliant sunlit sky
      grad.addColorStop(0.0, '#032030') // Overhead sky
      grad.addColorStop(0.25, '#0369a1') // Mid sky
      grad.addColorStop(0.55, '#0284c7') // Azure
      grad.addColorStop(0.80, '#38bdf8') // Light sky
      grad.addColorStop(0.94, '#bae6fd') // Cloud strata
      grad.addColorStop(1.0, '#f0f9ff') // Daylight horizon
    } else if (currentPhase === 'evening') {
      // Golden Hour Sunset: Deep twilight violet to blazing amber horizon
      grad.addColorStop(0.0, '#0f051d') // High dusk sky
      grad.addColorStop(0.30, '#3b0764') // Twilight purple
      grad.addColorStop(0.55, '#9d174d') // Rose magenta
      grad.addColorStop(0.75, '#e11d48') // Crimson glow
      grad.addColorStop(0.90, '#f97316') // Sunset amber
      grad.addColorStop(1.0, '#fbbf24') // Golden horizon
    } else {
      // Deep Midnight Cosmos: Starry indigo to dark velvet abyss
      grad.addColorStop(0.0, '#02040a') // Deep space
      grad.addColorStop(0.35, '#060a17') // Midnight navy
      grad.addColorStop(0.65, '#0f172a') // Slate night
      grad.addColorStop(0.88, '#1e1b4b') // Distant nebula
      grad.addColorStop(1.0, '#020617') // Ground horizon
    }

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Sun / Moon / Horizon Glow Disc
    if (currentPhase === 'morning' || currentPhase === 'noon' || currentPhase === 'evening') {
      const sunY = currentPhase === 'morning' ? h * 0.85 : currentPhase === 'noon' ? h * 0.35 : h * 0.90
      const sunX = currentPhase === 'morning' ? w * 0.70 : currentPhase === 'noon' ? w * 0.50 : w * 0.30
      const sunRadius = currentPhase === 'noon' ? 90 : 130

      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius * 2.5)
      const sunColor = currentPhase === 'evening' ? 'rgba(251, 191, 36, 0.45)' : 'rgba(255, 247, 237, 0.50)'
      sunGrad.addColorStop(0, sunColor)
      sunGrad.addColorStop(0.4, currentPhase === 'evening' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(254, 215, 170, 0.20)')
      sunGrad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = sunGrad
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Starry Cosmos: Generate twinkling celestial star points
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 12345.67) % 1000)
        const sy = ((i * 98765.43) % 750)
        const r = (i % 3 === 0) ? 1.8 : 1.1
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Soft Celestial Crescent Moon
      const moonX = w * 0.75
      const moonY = h * 0.25
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 80)
      moonGrad.addColorStop(0, 'rgba(224, 242, 254, 0.50)')
      moonGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)')
      moonGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = moonGrad
      ctx.beginPath()
      ctx.arc(moonX, moonY, 80, 0, Math.PI * 2)
      ctx.fill()
    }

    // Subtle Emotion Tint Overlay
    if (tintColor) {
      ctx.fillStyle = `${tintColor}12` // ~7% subtle emotional radiance
      ctx.fillRect(0, 0, w, h)
    }

    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }

  useFrame(() => {
    if (phase !== lastPhaseRef.current || emotionColor !== lastColorRef.current) {
      lastPhaseRef.current = phase
      lastColorRef.current = emotionColor
      drawBackdrop(phase, emotionColor)
    }
  })

  if (!texture) return null

  return (
    <group position={[0, 0.6, -4.5]}>
      {/* Panoramic Curved Sky Dome Backdrop */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[14, 14, 14, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.10]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Soft Ground Atmosphere Horizon Disc */}
      <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshBasicMaterial
          color={
            phase === 'morning'
              ? '#140c18'
              : phase === 'noon'
              ? '#061a29'
              : phase === 'evening'
              ? '#1c0715'
              : '#040711'
          }
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
