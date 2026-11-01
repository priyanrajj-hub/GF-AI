import React, { useEffect, useState } from 'react'
import { Activity, Cpu, Eye, Sparkles, Terminal, Volume2, Music, User } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'

export const DebugHUD: React.FC = () => {
  const {
    currentEmotion,
    emotionIntensity,
    activeGesture,
    activeAction,
    systemState,
    settings,
    updateSettings,
    audioFrequencies,
    activeMode,
  } = useAppStore()

  const [fps, setFps] = useState<number>(60)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  // Check URL param ?debug=1 or keyboard shortcut Ctrl+Shift+D
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('debug') === '1') {
        setIsVisible(true)
      }

      const handleKey = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          setIsVisible((prev) => !prev)
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
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

  const voiceProvider =
    settings.elevenlabsApiKey || settings.voice === 'cgSgspJ2msm6clMCkdW9' || settings.voice === 'EXAVITQu4vr4xnSDxMaL' || settings.voice === 'FGY2WhTYpPnrIDTdsKH5' || settings.voice === 'NOpBlnGInO9m6vDvFkFC'
      ? 'ElevenLabs (Jessica Girl)'
      : settings.voice?.startsWith('hf:')
      ? 'Hugging Face (Kokoro Girl)'
      : 'Gemini Neural (Kore Girl)'

  const llmProvider = settings.llmProvider || 'HuggingFace / Gemini'

  return (
    <div className="fixed top-16 left-4 z-50 p-3.5 rounded-2xl glass-panel border border-cyan-400/40 text-[11px] font-mono text-cyan-200 shadow-2xl space-y-2.5 pointer-events-auto bg-slate-950/90 backdrop-blur-md w-72">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 font-bold">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <Terminal className="w-3.5 h-3.5" />
          <span>ADA DIAGNOSTICS HUD</span>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white px-1 cursor-pointer"
          title="Close HUD (Ctrl+Shift+D)"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5 text-[11px]">
        {/* FPS Counter */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">FPS:</span>
          <span className={`font-bold ${fps >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {fps} FPS
          </span>
        </div>

        {/* System State */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">STATE:</span>
          <span className="text-cyan-300 font-semibold uppercase">{systemState}</span>
        </div>

        {/* Emotion & Intensity */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">EMOTION:</span>
          <span className="text-pink-300 font-semibold">
            {currentEmotion} ({Math.round(emotionIntensity * 100)}%)
          </span>
        </div>

        {/* Active Action & Gesture */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">ACTION / GESTURE:</span>
          <span className="text-amber-300 font-semibold uppercase truncate max-w-[140px] text-right">
            {activeAction || activeGesture || 'idle'}
          </span>
        </div>

        {/* Voice Engine */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">TTS ENGINE:</span>
          <span className="text-emerald-300 text-[10px] font-semibold truncate max-w-[150px] text-right">
            {voiceProvider}
          </span>
        </div>

        {/* LLM Engine */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">LLM BRAIN:</span>
          <span className="text-indigo-300 text-[10px] font-semibold truncate max-w-[150px] text-right">
            {llmProvider}
          </span>
        </div>

        {/* Live Internet Search Engine */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">LIVE INTERNET:</span>
          <span className="text-emerald-300 text-[10px] font-semibold truncate max-w-[150px] text-right">
            🟢 Online (DDG+Wiki)
          </span>
        </div>

        {/* User & Mode */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">USER / MODE:</span>
          <span className="text-cyan-300 text-[10px]">
            {settings.userName || 'Priyan'} ({activeMode})
          </span>
        </div>

        {/* Audio Meter */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">AUDIO LEVEL:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, avgAudio)}%` }}
              />
            </div>
            <span className="text-emerald-300 text-[10px]">{avgAudio}%</span>
          </div>
        </div>

        {/* Render Mode & Framing */}
        <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
          <span className="text-slate-400">CAMERA:</span>
          <button
            onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              settings.closeUpView
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {settings.closeUpView ? 'HEAD/CHEST' : 'FULL BODY'}
          </button>
        </div>
      </div>
    </div>
  )
}
