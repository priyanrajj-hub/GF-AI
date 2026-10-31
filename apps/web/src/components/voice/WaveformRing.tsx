import React, { useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from './VoiceEngine.js'

interface WaveformRingProps {
  onSendMessage: (text: string) => void
}

export const WaveformRing: React.FC<WaveformRingProps> = ({ onSendMessage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    systemState,
    setSystemState,
    audioFrequencies,
    isHandsFree,
    toggleHandsFree,
    isMuted,
    toggleMute,
    activeMode,
  } = useAppStore()

  // Draw circular waveform oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 64
      const bars = 36

      ctx.save()
      ctx.translate(centerX, centerY)

      for (let i = 0; i < bars; i++) {
        const rad = (i * 2 * Math.PI) / bars
        const freqIndex = i % audioFrequencies.length
        const val = audioFrequencies[freqIndex] || 0
        const barHeight = systemState === 'speaking' || systemState === 'listening'
          ? 6 + (val / 255) * 28
          : 4 + Math.sin(Date.now() * 0.003 + i) * 2

        ctx.save()
        ctx.rotate(rad)

        // Gradient line
        const grad = ctx.createLinearGradient(0, radius, 0, radius + barHeight)
        if (systemState === 'listening') {
          grad.addColorStop(0, 'rgba(0, 255, 136, 0.4)')
          grad.addColorStop(1, '#00ff88')
        } else if (systemState === 'speaking') {
          grad.addColorStop(0, 'rgba(0, 243, 255, 0.4)')
          grad.addColorStop(1, '#ff007f')
        } else {
          grad.addColorStop(0, 'rgba(0, 243, 255, 0.2)')
          grad.addColorStop(1, '#00f3ff')
        }

        ctx.fillStyle = grad
        ctx.fillRect(-2, radius, 4, barHeight)
        ctx.restore()
      }

      ctx.restore()
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [audioFrequencies, systemState])

  const handleMicClick = () => {
    if (systemState === 'listening') {
      VoiceEngine.stopListening()
      setSystemState('idle')
    } else {
      VoiceEngine.startListening((transcript) => {
        if (transcript) {
          onSendMessage(transcript)
        }
      })
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Outer Rotating Arc Ring */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Arc-reactor outer circle */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-arc-rotate" />
        <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/30 animate-arc-rotate-reverse" />

        {/* Canvas Oscilloscope */}
        <canvas
          ref={canvasRef}
          width={192}
          height={192}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Center Interactive Core Button */}
        <button
          onClick={handleMicClick}
          className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl cursor-pointer ${
            systemState === 'listening'
              ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-[0_0_30px_rgba(0,255,136,0.6)] scale-105'
              : systemState === 'speaking'
                ? 'bg-magenta-500/30 border-2 border-pink-500 shadow-[0_0_30px_rgba(255,0,127,0.6)]'
                : systemState === 'thinking'
                  ? 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_30px_rgba(255,183,3,0.6)]'
                  : 'bg-cyan-950/40 border border-cyan-400/40 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]'
          }`}
          title="Click to speak (Push to talk / interrupt)"
        >
          {systemState === 'listening' ? (
            <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
          ) : systemState === 'speaking' ? (
            <Volume2 className="w-8 h-8 text-pink-400 animate-pulse" />
          ) : systemState === 'thinking' ? (
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
          ) : (
            <Mic className="w-7 h-7 text-cyan-400" />
          )}
          <span className="text-[9px] font-mono tracking-widest uppercase mt-0.5 text-cyan-200">
            {systemState}
          </span>
        </button>
      </div>

      {/* Audio & Hands-Free Controls Pill */}
      <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle text-xs text-slate-300 border border-cyan-500/20">
        <button
          onClick={toggleHandsFree}
          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
            isHandsFree ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          Hands-Free: {isHandsFree ? 'ON' : 'OFF'}
        </button>

        <span className="w-px h-3 bg-cyan-500/30" />

        <button
          onClick={toggleMute}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title={isMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        <span className="w-px h-3 bg-cyan-500/30" />

        <span className="text-[10px] font-mono text-cyan-400/80 uppercase">
          {activeMode}
        </span>
      </div>
    </div>
  )
}
