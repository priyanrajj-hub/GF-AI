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
  Shirt,
  Compass,
  Smile,
  Users,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  CloudRain,
  Lock,
  Unlock,
  TrendingUp,
} from 'lucide-react'
import type { PersonalityMode } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { apiUrl } from '../../utils/api.js'

export const TopBar: React.FC = () => {
  const {
    activeCharacter,
    setActiveCharacter,
    activeMode,
    setActiveMode,
    systemState,
    currentEmotion,
    activeGesture,
    activeAction,
    showChatDrawer,
    toggleChatDrawer,
    showStageDrawer,
    setShowStageDrawer,
    showWardrobeDrawer,
    setShowWardrobeDrawer,
    showEnvironmentDrawer,
    setShowEnvironmentDrawer,
    showLiveMarketPanel,
    toggleLiveMarketPanel,
    fullScreenHoloMode,
    toggleFullScreenHolo,
    setShowSettingsModal,
    setShowMemoryModal,
    setShowMoodModal,
    setShowPersonalityStudio,
    setShowPermissionCenter,
    setShowWellbeingModal,
    isMinorMode,
    settings,
    updateSettings,
    solarHour,
    setSolarHour,
    isTimeLocked,
    setIsTimeLocked,
    weatherType,
    setWeatherType,
    timeOfDayPhase,
    timeSyncMode,
    setTimeSyncMode,
  } = useAppStore()

  const [showTimeSlider, setShowTimeSlider] = useState<boolean>(false)
  const [isMockMode, setIsMockMode] = useState<boolean>(false)
  const [isInternetOnline, setIsInternetOnline] = useState<boolean>(true)

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

    fetch(apiUrl('/api/internet/status'))
      .then((res) => res.json())
      .then((data) => {
        setIsInternetOnline(Boolean(data.online !== false))
      })
      .catch(() => {
        setIsInternetOnline(true)
      })
  }, [])

  const modes: Array<{ id: PersonalityMode; label: string }> = [
    { id: 'companion', label: 'Companion' },
    { id: 'tutor', label: 'Tutor' },
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

        {/* 3D Character Switcher: Tony Stark (RDJ) | Ada Wong (RE) | Yor Forger (Spy x Family) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-cyan-500/40 shadow-lg">
          <button
            onClick={() => {
              setActiveCharacter('atlas')
              import('../../components/voice/VoiceEngine.js').then(({ VoiceEngine }) => {
                VoiceEngine.speak("Jarvis online. Tony Stark ready. Let's make things happen.", { pitch: 0.94, rate: 1.05 })
              }).catch(() => {})
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeCharacter === 'atlas'
                ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-cyan-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.6)] border border-amber-400/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Tony Stark (RDJ / Iron Man): Billionaire Tech Genius & Quant Trader"
          >
            <span>⚡</span>
            <span>Tony Stark (RDJ)</span>
          </button>
          <button
            onClick={() => {
              setActiveCharacter('ada')
              import('../../components/voice/VoiceEngine.js').then(({ VoiceEngine }) => {
                VoiceEngine.speak("Ada Wong here. Tactical intelligence and market disciplines active.", { pitch: 1.05, rate: 1.02 })
              }).catch(() => {})
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeCharacter === 'ada' || !activeCharacter
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_14px_rgba(0,243,255,0.6)] border border-cyan-400/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Ada Wong (Resident Evil): Sleek Espionage Operative & Mentor"
          >
            <span>🍷</span>
            <span>Ada Wong</span>
          </button>
          <button
            onClick={() => {
              setActiveCharacter('mira')
              import('../../components/voice/VoiceEngine.js').then(({ VoiceEngine }) => {
                VoiceEngine.speak("Hello! Yor Forger at your service. I will protect you with all my heart!", { pitch: 1.22, rate: 1.00 })
              }).catch(() => {})
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeCharacter === 'mira'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_14px_rgba(244,63,94,0.6)] border border-rose-400/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Yor Forger (Spy x Family): Thorn Princess Assassin & Caring Companion"
          >
            <span>🌹</span>
            <span>Yor Forger</span>
          </button>
        </div>

        {/* Language Switcher Pill: EN | தமிழ் | Tanglish */}
        <div className="flex items-center gap-1 p-1 rounded-2xl glass-panel border border-cyan-500/30">
          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`px-2 py-0.5 rounded-xl text-[11px] font-mono transition-all duration-200 cursor-pointer ${
              settings.language === 'en' || !settings.language || settings.language === 'auto'
                ? 'bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/40 shadow-[0_0_8px_rgba(0,243,255,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => updateSettings({ language: 'ta' })}
            className={`px-2 py-0.5 rounded-xl text-[11px] font-mono transition-all duration-200 cursor-pointer ${
              settings.language === 'ta'
                ? 'bg-purple-500/30 text-purple-200 font-bold border border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="தமிழ் (Tamil)"
          >
            தமிழ்
          </button>
          <button
            onClick={() => updateSettings({ language: 'tanglish' })}
            className={`px-2 py-0.5 rounded-xl text-[11px] font-mono transition-all duration-200 cursor-pointer ${
              settings.language === 'tanglish'
                ? 'bg-amber-500/30 text-amber-200 font-bold border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tanglish (Tamil + English)"
          >
            Tanglish
          </button>
        </div>

        {/* Persistent AI Disclosure Badge (CA SB 243 / NY Law) */}
        <button
          onClick={() => setShowWellbeingModal(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-panel-subtle border border-cyan-500/30 text-[10px] font-mono text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
          title="Mandatory AI Disclosure: Ada is an artificial intelligence companion. Click for Wellbeing & Safety Protocol."
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider">AI COMPANION</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">PG-13</span>
        </button>

        {/* Live Internet Connected Badge */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-panel-subtle border text-[10px] font-mono ${
            isInternetOnline
              ? 'border-emerald-500/30 text-emerald-300'
              : 'border-slate-700 text-slate-400'
          }`}
          title="Live Internet Status: Real-time web search and knowledge synchronization active"
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isInternetOnline
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]'
                : 'bg-slate-500'
            }`}
          />
          <Globe className="w-3 h-3 text-emerald-400" />
          <span className="font-semibold tracking-wider">
            {isInternetOnline ? 'WEB: LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Minor Safeguard Mode Tag */}
        {isMinorMode && (
          <div className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
            MINOR SAFEGUARD
          </div>
        )}

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
          <span className="text-cyan-200 uppercase">{currentEmotion}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ACTION:</span>
          <span className="text-cyan-300 uppercase">{activeAction || activeGesture || 'idle'}</span>
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
        {/* Time of Day v2 Interactive Scrubbing Widget */}
        <div className="relative">
          <button
            onClick={() => setShowTimeSlider(!showTimeSlider)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-panel-subtle border border-amber-500/30 text-[11px] font-mono text-amber-300 hover:text-white hover:border-amber-400 transition-colors cursor-pointer"
            title="Time-of-Day v2: Click to scrub 24hr solar time, lock time, or pick weather!"
          >
            {timeOfDayPhase === 'morning' && '🌅 MORNING'}
            {timeOfDayPhase === 'noon' && '☀️ NOON'}
            {timeOfDayPhase === 'evening' && '🌇 SUNSET'}
            {timeOfDayPhase === 'night' && '🌙 NIGHT'}
            <span className="text-[9px] text-amber-400/80">
              {Math.floor(solarHour).toString().padStart(2, '0')}:{Math.floor((solarHour % 1) * 60).toString().padStart(2, '0')}
            </span>
            {isTimeLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <span className="text-[9px] text-amber-400/60 lowercase">({timeSyncMode})</span>}
          </button>

          {showTimeSlider && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3.5 glass-panel rounded-2xl border border-amber-500/40 shadow-2xl z-50 bg-slate-950/95 backdrop-blur-xl space-y-3 font-mono text-xs text-amber-200">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Sun className="w-3.5 h-3.5" /> 24hr Sun Time
                </span>
                <button
                  onClick={() => {
                    setTimeSyncMode('auto')
                    setShowTimeSlider(false)
                  }}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Back to Auto Sun
                </button>
              </div>

              {/* Scrubbing slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>00:00 Night</span>
                  <span className="font-bold text-amber-300">
                    {Math.floor(solarHour).toString().padStart(2, '0')}:{Math.floor((solarHour % 1) * 60).toString().padStart(2, '0')}
                  </span>
                  <span>23:59 Night</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.1"
                  value={solarHour}
                  onChange={(e) => {
                    const h = parseFloat(e.target.value)
                    setSolarHour(h)
                    setIsTimeLocked(true)
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Weather selector */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-cyan-400" /> Weather & Atmosphere:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {(['clear', 'rain', 'mist', 'monsoon', 'winter_fog', 'cloudy'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeatherType(w)}
                      className={`px-1.5 py-1 rounded-lg border capitalize transition-all ${
                        weatherType === w
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {w.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lock to this time */}
              <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[10px]">
                <span>Lock to this time:</span>
                <button
                  onClick={() => setIsTimeLocked(!isTimeLocked)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] ${
                    isTimeLocked
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {isTimeLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  {isTimeLocked ? 'Locked' : 'Unlocked'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ambient Sound Toggle */}
        <button
          onClick={() => useAppStore.getState().toggleAmbientAudio()}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            useAppStore.getState().ambientAudioEnabled
              ? 'text-teal-300 border border-teal-400/50 bg-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={
            useAppStore.getState().ambientAudioEnabled
              ? 'Ambient Background Sound: ON (Breeze, Lo-Fi, Waves, Hearth)'
              : 'Ambient Background Sound: MUTED'
          }
        >
          <Sparkles className="w-4 h-4" />
        </button>

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

        {/* Wardrobe Drawer (15+ Outfits & Desi Saree/Lehenga) */}
        <button
          onClick={() => setShowWardrobeDrawer(!showWardrobeDrawer)}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            showWardrobeDrawer
              ? 'text-pink-300 border border-pink-400/50 bg-pink-500/20 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'text-slate-400 hover:text-pink-300'
          }`}
          title="Ada Wardrobe (15+ Outfits, Saree, Lehenga, Blazer, Pajamas)"
        >
          <Shirt className="w-4 h-4" />
        </button>

        {/* 3D Environments Drawer (16 Scenes) */}
        <button
          onClick={() => setShowEnvironmentDrawer(!showEnvironmentDrawer)}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            showEnvironmentDrawer
              ? 'text-cyan-300 border border-cyan-400/50 bg-cyan-500/20 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
          title="3D Stage Environments (Holo Lab, Bedroom, Rooftop, Sakura Garden, Library)"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Live AlgoTrading & Market Radar */}
        <button
          onClick={toggleLiveMarketPanel}
          className={`p-2 rounded-xl glass-panel-subtle transition-all cursor-pointer ${
            showLiveMarketPanel
              ? 'text-emerald-300 border border-emerald-400/60 bg-emerald-500/20 shadow-[0_0_14px_rgba(16,185,129,0.5)]'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
          title="Live AlgoTrading Radar (Real-Time Signals, RSI, MACD, Bollinger Bands, Stocks & Crypto)"
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Reaction Lab Link */}
        <a
          href="/reaction-lab"
          className="p-2 rounded-xl glass-panel-subtle hover:text-amber-300 text-slate-300 transition-colors cursor-pointer"
          title="Reaction Lab (Test 60+ Kinematic Reactions & Safety Overrides)"
        >
          <Smile className="w-4 h-4 text-amber-400" />
        </a>


        {/* Wellbeing Dashboard (Usage Caps, Sentiment Trends, Real-World Balance) */}
        <button
          onClick={() => setShowWellbeingModal(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-emerald-300 text-slate-300 transition-colors cursor-pointer"
          title="Personal Wellbeing Dashboard (Time tracking, Mood trend, Boundaries)"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
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

        {/* Personality Studio (42 Archetypes & Blending) */}
        <button
          onClick={() => setShowPersonalityStudio(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-pink-300 text-slate-300 transition-colors cursor-pointer"
          title="Personality Studio (42 Archetypes, Blending, Big Five & Adaptive Learning)"
        >
          <Users className="w-4 h-4 text-pink-400" />
        </button>

        {/* Permission Center (Safe Integrations & Risk Tiers) */}
        <button
          onClick={() => setShowPermissionCenter(true)}
          className="p-2 rounded-xl glass-panel-subtle hover:text-emerald-300 text-slate-300 transition-colors cursor-pointer"
          title="Permission Center (Least-Privilege Scopes, Risk Tiers, Prompt Shield)"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
