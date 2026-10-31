import React, { useState } from 'react'
import { HoloScene } from '../components/scene/HoloScene.js'
import { useAppStore } from '../store/useAppStore.js'
import type { EmotionType, GestureType } from '@ada/shared'
import { Sparkles, ArrowLeft, Play, RefreshCw, Volume2 } from 'lucide-react'

export const AnimationTestPage: React.FC = () => {
  const {
    currentEmotion,
    emotionIntensity,
    activeGesture,
    setEmotionAndGesture,
    setAudioFrequencies,
    setSystemState,
    settings,
    updateSettings,
  } = useAppStore()

  const emotions: EmotionType[] = [
    'happy',
    'sad',
    'excited',
    'concerned',
    'thinking',
    'surprised',
    'playful',
    'calm',
    'motivated',
    'tired',
  ]

  const gestures: GestureType[] = [
    'idle',
    'wave',
    'nod',
    'shake',
    'fist_pump',
    'thinking_pose',
    'laugh',
    'shy',
    'surprised',
    'concerned_lean',
    'celebrate',
    'shrug',
  ]

  const [intensity, setIntensity] = useState(0.8)

  const triggerLipSyncTest = () => {
    setSystemState('speaking')
    let count = 0
    const interval = setInterval(() => {
      count++
      // simulate audio frequencies
      const freq = new Uint8Array(16)
      for (let i = 0; i < 16; i++) {
        freq[i] = Math.floor(Math.random() * 220 + 35)
      }
      setAudioFrequencies(freq)

      if (count > 25) {
        clearInterval(interval)
        setAudioFrequencies(new Uint8Array(16))
        setSystemState('idle')
      }
    }, 100)
  }

  return (
    <div className="w-screen h-screen relative bg-[#060814] overflow-hidden select-none">
      {/* 1. 3D Scene */}
      <HoloScene />

      {/* 2. Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white font-mono text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO APP</span>
          </a>

          <div className="px-3 py-1.5 rounded-xl glass-panel border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold">
            🧪 3D ANIMATION & EMOTION TEST BENCH
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
            className="px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-xs font-mono text-cyan-200"
          >
            CAM: {settings.closeUpView ? 'HEAD/CHEST' : 'FULL BODY'}
          </button>
        </div>
      </header>

      {/* 3. Floating Interactive Testing Console */}
      <div className="fixed left-4 bottom-4 z-40 w-96 max-h-[75vh] overflow-y-auto glass-panel p-4 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4 bg-slate-950/85 backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <span className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>ACTIVE: {currentEmotion.toUpperCase()} • {activeGesture.toUpperCase()}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {Math.round(intensity * 100)}% INTENSITY
          </span>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Emotion Intensity</span>
            <span className="text-cyan-300">{intensity}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              setIntensity(val)
              setEmotionAndGesture(currentEmotion, val, activeGesture)
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Emotions Grid */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-slate-300 font-semibold">
            1. FACIAL EMOTIONS ({emotions.length})
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {emotions.map((emo) => (
              <button
                key={emo}
                onClick={() => setEmotionAndGesture(emo, intensity, activeGesture)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-mono capitalize transition-all cursor-pointer ${
                  currentEmotion === emo
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                    : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>

        {/* Gestures Grid */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono text-slate-300 font-semibold">
            2. BODY GESTURES ({gestures.length})
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {gestures.map((ges) => (
              <button
                key={ges}
                onClick={() => setEmotionAndGesture(currentEmotion, intensity, ges)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-mono capitalize transition-all cursor-pointer ${
                  activeGesture === ges
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                    : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {ges.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Lip-Sync & Mouth Test */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={triggerLipSyncTest}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-500/30 font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Volume2 className="w-4 h-4 text-cyan-300" />
            <span>TEST AUDIO LIP-SYNC (AA / OH)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
