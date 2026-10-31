import React, { useEffect, useState } from 'react'
import {
  Brain,
  Sliders,
  Maximize2,
  Minimize2,
  Heart,
  MessageSquare,
  Eye,
  Activity,
  Sparkles,
} from 'lucide-react'
import type { PersonalityMode } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { apiUrl } from '../../utils/api.js'

export const TopBar: React.FC = () => {
  const {
    activeMode,
    setActiveMode,
    systemState,
    currentEmotion,
    showChatDrawer,
    toggleChatDrawer,
    showStageDrawer,
    setShowStageDrawer,
    fullScreenHoloMode,
    toggleFullScreenHolo,
    setShowSettingsModal,
    setShowMemoryModal,
    setShowMoodModal,
    settings,
    updateSettings,
  } = useAppStore()

  const [isMockMode, setIsMockMode] = useState<boolean>(false)

  // Check health and provider status
  useEffect(() => {
    fetch(apiUrl('/api/health'))
      .then((res) => res.json())
      .then((data) => {
        if (data.llm === 'MockLLM' || data.mock === true) {
          setIsMockMode(true)
        }
      })
      .catch(() => {
        setIsMockMode(true)
      })
  }, [])

  const modes: Array<{ id: PersonalityMode; label: string }> = [
    { id: 'companion', label: 'Companion' },
    { id: 'playful', label: 'Playful' },
    { id: 'jarvis', label: 'Jarvis' },
    { id: 'coder', label: 'Coder' },
    { id: 'mentor', label: 'Mentor' },
    { id: 'coach', label: 'Coach' },
    { id: 'listener', label: 'Listener' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between pointer-events-none">
      {/* Brand & Status Pill */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f3ff]" />
          <span className="font-bold tracking-widest text-sm text-cyan-300 font-mono">
            ADA
          </span>
          <span className="text-[10px] text-cyan-400/80 font-mono px-1 border border-cyan-400/20 rounded">
            v2.0 3D
          </span>
        </div>

        {/* Task G: MOCK MODE BADGE */}
        {isMockMode && (
          <div className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
            MOCK MODE
          </div>
        )}

        {/* State Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel-subtle text-xs font-mono text-slate-300">
          <span className="text-slate-400">STATE:</span>
          <span
            className={`font-semibold uppercase tracking-wider ${
              systemState === 'speaking'
                ? 'text-pink-400'
                : systemState === 'listening'
                  ? 'text-emerald-400'
                  : systemState === 'thinking'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
            }`}
          >
            {systemState}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">MOOD:</span>
          <span className="text-cyan-200 capitalize">{currentEmotion}</span>
        </div>
      </div>

      {/* Mode Selector Pill */}
      <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl glass-panel border border-cyan-500/20 pointer-events-auto">
        {modes.map((m) => {
          const isActive = activeMode === m.id
          const isCompanion = m.id === 'companion'
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer ${
                isActive
                  ? isCompanion
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/60 shadow-[0_0_14px_rgba(244,63,94,0.4)]'
                    : 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Close-Up Framing Toggle */}
        <button
          onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            settings.closeUpView
              ? 'text-cyan-300 border border-cyan-400/50 bg-cyan-500/20 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
          title={settings.closeUpView ? 'Switch to Full Body View' : 'Close-Up View (Head & Shoulders)'}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Stage Performance Studio (Dance, Sing, Moves, Roam, Cuteness) */}
        <button
          onClick={() => setShowStageDrawer(!showStageDrawer)}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            showStageDrawer
              ? 'text-pink-300 border border-pink-400/50 bg-pink-500/20 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-slate-400 hover:text-pink-300'
          }`}
          title="Performance Stage (8 Dance Styles, Original Songs, 25+ Moves, Roam, Cuteness)"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowMoodModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-pink-300 text-slate-300 transition-colors cursor-pointer"
          title="Daily Mood Check-in"
        >
          <Heart className="w-4 h-4 text-pink-400" />
        </button>

        <button
          onClick={() => setShowMemoryModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors cursor-pointer"
          title="Memory Manager (Consented Memories)"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors cursor-pointer"
          title="System Settings & 3D Model Configuration"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={toggleChatDrawer}
          className={`p-2 rounded-xl glass-panel-subtle transition-colors cursor-pointer ${
            showChatDrawer ? 'text-cyan-400 border border-cyan-500/40' : 'text-slate-400'
          }`}
          title="Toggle Chat Drawer"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullScreenHolo}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors cursor-pointer"
          title={fullScreenHoloMode ? 'Exit Cinematic Mode' : 'Cinematic Hologram Mode'}
        >
          {fullScreenHoloMode ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
