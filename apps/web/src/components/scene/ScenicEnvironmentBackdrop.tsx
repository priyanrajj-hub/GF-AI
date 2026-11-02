import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TimeOfDayPhase } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { SolarTimeService } from '../../services/solarTimeService.js'

interface ScenicEnvironmentBackdropProps {
  phase: TimeOfDayPhase
  emotionColor: string
}

export const ScenicEnvironmentBackdrop: React.FC<ScenicEnvironmentBackdropProps> = ({
  emotionColor,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastHourRef = useRef<number>(-1)
  const lastWeatherRef = useRef<string>('')
  const lastColorRef = useRef<string>('')

  const { solarHour, weatherType } = useAppStore()

  // Generate procedural gradient canvas texture
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

  // Draw continuous gradient matching real sun calculations & weather layers
  const drawBackdrop = (hour: number, weather: string, tintColor: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const solar = SolarTimeService.calculate(hour)

    // 1. Continuous Sky Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0.0, solar.skyZenith)
    grad.addColorStop(0.5, solar.skyMid)
    grad.addColorStop(1.0, solar.skyHorizon)

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // 2. Weather Overlays (Rain streaks, Mist, Haze)
    if (weather === 'rain' || weather === 'monsoon') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.22)'
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)'
      ctx.lineWidth = 1.2
      // Draw falling raindrops
      for (let i = 0; i < 140; i++) {
        const rx = (i * 37) % w
        const ry = (i * 59 + hour * 100) % h
        ctx.beginPath()
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx - 4, ry + 22)
        ctx.stroke()
      }
    } else if (weather === 'mist' || weather === 'winter_fog') {
      const mistGrad = ctx.createLinearGradient(0, h * 0.45, 0, h)
      mistGrad.addColorStop(0, 'rgba(203, 213, 225, 0)')
      mistGrad.addColorStop(0.6, 'rgba(226, 232, 240, 0.45)')
      mistGrad.addColorStop(1, 'rgba(241, 245, 249, 0.60)')
      ctx.fillStyle = mistGrad
      ctx.fillRect(0, h * 0.45, w, h * 0.55)
    }

    // 3. Sun / Moon / Horizon Glow Disc
    if (!solar.isNight) {
      // Sun position mapped smoothly from altitude (0 to Math.PI/2) and azimuth
      const sunNormAlt = Math.max(0, Math.min(1, (solar.altitude + 0.1) / 1.3))
      const sunY = h * (0.92 - sunNormAlt * 0.65)
      const sunX = w * (0.5 + Math.sin(solar.azimuth) * 0.35)
      const sunRadius = 90 + (1 - sunNormAlt) * 45

      const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, sunRadius * 2.5)
      sunGrad.addColorStop(0, solar.sunColor)
      sunGrad.addColorStop(0.35, `${solar.sunColor}77`)
      sunGrad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = sunGrad
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Starry Cosmos: Twinkling celestial star points
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
      for (let i = 0; i < 110; i++) {
        const sx = (i * 12345.67) % 1000
        const sy = (i * 98765.43) % 720
        const r = i % 4 === 0 ? 1.8 : 1.1
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Soft Celestial Crescent Moon
      const moonX = w * 0.75
      const moonY = h * 0.22
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 80)
      moonGrad.addColorStop(0, 'rgba(224, 242, 254, 0.65)')
      moonGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.20)')
      moonGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = moonGrad
      ctx.beginPath()
      ctx.arc(moonX, moonY, 80, 0, Math.PI * 2)
      ctx.fill()
    }

    // 4. Subtle Emotion Radiance Tint Overlay
    if (tintColor) {
      ctx.fillStyle = `${tintColor}12` // ~7% emotional radiance
      ctx.fillRect(0, 0, w, h)
    }

    if (textureRef.current) {
      textureRef.current.needsUpdate = true
    }
  }

  useFrame(() => {
    const roundedHour = Math.round(solarHour * 10) / 10
    if (
      roundedHour !== lastHourRef.current ||
      weatherType !== lastWeatherRef.current ||
      emotionColor !== lastColorRef.current
    ) {
      lastHourRef.current = roundedHour
      lastWeatherRef.current = weatherType
      lastColorRef.current = emotionColor
      drawBackdrop(solarHour, weatherType, emotionColor)
    }
  })

  if (!texture) return null

  const solar = SolarTimeService.calculate(solarHour)

  return (
    <group position={[0, 0.6, -4.5]}>
      {/* Panoramic Curved Sky Dome Backdrop */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[14, 14, 14, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.1]} />
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
          color={solar.fogColor}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
