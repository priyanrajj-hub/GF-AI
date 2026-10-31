import React, { useEffect, useState } from 'react'
import { Activity, Cpu, Eye, Sparkles, Terminal } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'

export const DebugHUD: React.FC = () => {
  const {
    currentEmotion,
    emotionIntensity,
    activeGesture,
    systemState,
    settings,
    updateSettings,
    audioFrequencies,
  } = useAppStore()

  const [fps, setFps] = useState<number>(60)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  // Check URL param ?debug=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('debug') === '1') {
        setIsVisible(true)
      }
    }
  }, [])

  // Calculate FPS smoothly
  useEffect(() => {
    if (!isVisible) return
    let frameCount = 0
    let lastTime = performance.now()
    let animId: number

    const loop = (now: number) => {
      frameCount++
      if (now - lastTime >= 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = now
      }
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [isVisible])

  if (!isVisible) return null

  let avgAudio = 0
  if (audioFrequencies && audioFrequencies.length > 0) {
    avgAudio = Math.round((audioFrequencies[4] / 255) * 100)
  }

  return (
    <div className="fixed top-16 left-4 z-50 p-3 rounded-2xl glass-panel border border-cyan-400/40 text-[11px] font-mono text-cyan-200 shadow-2xl space-y-2 pointer-events-auto bg-slate-950/85 backdrop-blur-md w-64">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 font-bold">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <Terminal className="w-3.5 h-3.5" />
          <span>ADA SYSTEM DIAGNOSTICS</span>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white px-1"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-400">FPS:</span>
          <span className={fps >= 55 ? 'text-emerald-400' : 'text-amber-400'}>
            {fps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">STATE:</span>
          <span className="text-cyan-300 uppercase">{systemState}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">EMOTION:</span>
          <span className="text-pink-300">
            {currentEmotion} ({Math.round(emotionIntensity * 100)}%)
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">GESTURE:</span>
          <span className="text-amber-300 uppercase">{activeGesture}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">AUDIO LEVEL:</span>
          <span className="text-emerald-300">{avgAudio}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">RENDER MODE:</span>
          <span className="text-cyan-300 uppercase">{settings.renderMode}</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-800">
          <span className="text-slate-400">CLOSE-UP VIEW:</span>
          <button
            onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
            className={`px-2 py-0.5 rounded text-[10px] ${
              settings.closeUpView
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.closeUpView ? 'HEAD/CHEST' : 'FULL BODY'}
          </button>
        </div>
      </div>
    </div>
  )
}
