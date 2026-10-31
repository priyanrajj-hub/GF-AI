import React, { useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Eye, User } from 'lucide-react'
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
    settings,
    updateSettings,
  } = useAppStore()

  // Draw miniature circular waveform oscilloscope
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
      const radius = 26
      const bars = 24

      ctx.save()
      ctx.translate(centerX, centerY)

      for (let i = 0; i < bars; i++) {
        const rad = (i * 2 * Math.PI) / bars
        const freqIndex = i % audioFrequencies.length
        const val = audioFrequencies[freqIndex] || 0
        const barHeight =
          systemState === 'speaking' || systemState === 'listening'
            ? 3 + (val / 255) * 14
            : 2 + Math.sin(Date.now() * 0.003 + i) * 1.5

        ctx.save()
        ctx.rotate(rad)

        const grad = ctx.createLinearGradient(0, radius, 0, radius + barHeight)
        if (systemState === 'listening') {
          grad.addColorStop(0, 'rgba(0, 255, 136, 0.4)')
          grad.addColorStop(1, '#00ff88')
        } else if (systemState === 'speaking') {
          grad.addColorStop(0, 'rgba(0, 243, 255, 0.4)')
          grad.addColorStop(1, '#ff007f')
        } else {
          grad.addColorStop(0, 'rgba(0, 243, 255, 0.25)')
          grad.addColorStop(1, '#00f3ff')
        }

        ctx.fillStyle = grad
        ctx.fillRect(-1.5, radius, 3, barHeight)
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
    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass-panel border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl bg-slate-950/80">
      {/* 1. Miniature Arc Reactor Mic Button */}
      <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
        <canvas
          ref={canvasRef}
          width={72}
          height={72}
          className="absolute inset-0 pointer-events-none"
        />

        <button
          onClick={handleMicClick}
          className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
            systemState === 'listening'
              ? 'bg-emerald-500/30 border-2 border-emerald-400 shadow-[0_0_20px_rgba(0,255,136,0.6)] scale-105'
              : systemState === 'speaking'
                ? 'bg-magenta-500/30 border-2 border-pink-500 shadow-[0_0_20px_rgba(255,0,127,0.6)]'
                : systemState === 'thinking'
                  ? 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_20px_rgba(255,183,3,0.6)]'
                  : 'bg-cyan-950/60 border border-cyan-400/50 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]'
          }`}
          title="Click to speak (Push to talk / interrupt)"
        >
          {systemState === 'listening' ? (
            <Mic className="w-5 h-5 text-emerald-400 animate-pulse" />
          ) : systemState === 'speaking' ? (
            <Volume2 className="w-5 h-5 text-pink-400 animate-pulse" />
          ) : systemState === 'thinking' ? (
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          ) : (
            <Mic className="w-5 h-5 text-cyan-300" />
          )}
        </button>
      </div>

      {/* 2. Audio & Control Pill */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Hands-Free Button */}
        <button
          onClick={toggleHandsFree}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
            isHandsFree
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              : 'text-slate-400 hover:text-white bg-slate-900/40 border border-slate-800'
          }`}
        >
          HANDS-FREE: {isHandsFree ? 'ON' : 'OFF'}
        </button>

        {/* Volume / Mute Toggle */}
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Close-Up Toggle */}
        <button
          onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
          className={`px-2 py-1 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
            settings.closeUpView
              ? 'bg-rose-500/25 text-rose-200 border border-rose-400/50'
              : 'bg-slate-900/40 text-slate-400 hover:text-white border border-slate-800'
          }`}
          title="Toggle Close-Up Camera Framing"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{settings.closeUpView ? 'HEAD' : 'FULL'}</span>
        </button>

        {/* Mode Label */}
        <span className="hidden md:inline-block px-2 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[10px] text-cyan-300 uppercase tracking-wider">
          {activeMode}
        </span>
      </div>
    </div>
  )
}
