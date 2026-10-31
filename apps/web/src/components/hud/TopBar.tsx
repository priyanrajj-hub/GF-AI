import React from 'react'
import {
  Brain,
  Sliders,
  Maximize2,
  Minimize2,
  Heart,
  MessageSquare,
  Shield,
  Zap,
} from 'lucide-react'
import type { PersonalityMode } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export const TopBar: React.FC = () => {
  const {
    activeMode,
    setActiveMode,
    systemState,
    currentEmotion,
    showChatDrawer,
    toggleChatDrawer,
    fullScreenHoloMode,
    toggleFullScreenHolo,
    setShowSettingsModal,
    setShowMemoryModal,
    setShowMoodModal,
  } = useAppStore()

  const modes: Array<{ id: PersonalityMode; label: string }> = [
    { id: 'jarvis', label: 'Jarvis' },
    { id: 'coder', label: 'Coder' },
    { id: 'mentor', label: 'Mentor' },
    { id: 'coach', label: 'Coach' },
    { id: 'listener', label: 'Listener' },
    { id: 'playful', label: 'Playful' },
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
          <span className="text-[10px] text-cyan-400/60 font-mono px-1 border border-cyan-400/20 rounded">
            v1.0 HOLO
          </span>
        </div>

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
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMode(m.id)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer ${
              activeMode === m.id
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setShowMoodModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-pink-300 text-slate-300 transition-colors"
          title="Daily Mood Check-in"
        >
          <Heart className="w-4 h-4 text-pink-400" />
        </button>

        <button
          onClick={() => setShowMemoryModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors"
          title="Memory Manager (Consented Memories)"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors"
          title="System Settings & Persona Sliders"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={toggleChatDrawer}
          className={`p-2 rounded-xl glass-panel-subtle transition-colors ${
            showChatDrawer ? 'text-cyan-400 border border-cyan-500/40' : 'text-slate-400'
          }`}
          title="Toggle Chat Drawer"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullScreenHolo}
          className="p-2 rounded-xl glass-panel-subtle hover:text-cyan-300 text-slate-300 transition-colors"
          title={fullScreenHoloMode ? 'Exit Cinematic Mode' : 'Cinematic Hologram Mode'}
        >
          {fullScreenHoloMode ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
