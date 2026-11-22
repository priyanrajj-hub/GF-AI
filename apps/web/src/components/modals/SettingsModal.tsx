import React, { useRef, useState, useEffect } from 'react'
import { X, Sliders, Palette, Cpu, Shield, Globe, Zap, Box, Sparkles, Upload, Eye, Volume2, AlertTriangle, Music, CheckCircle2 } from 'lucide-react'
import type { AvatarRenderMode, VoiceCapabilities } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { apiFetch } from '../../utils/api.js'

export const SettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    settings,
    updateSettings,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [voiceProviders, setVoiceProviders] = useState<VoiceCapabilities[]>([])
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null)

  useEffect(() => {
    if (showSettingsModal) {
      apiFetch('/api/voice/providers')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.providers) setVoiceProviders(data.providers)
        })
        .catch(() => {})
    }
  }, [showSettingsModal])

  useEffect(() => {
    const handleNotice = (e: any) => {
      if (e.detail?.message) setVoiceNotice(e.detail.message)
    }
    window.addEventListener('ada:voice_notice', handleNotice)
    return () => window.removeEventListener('ada:voice_notice', handleNotice)
  }, [])

  if (!showSettingsModal) return null

  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      updateSettings({
        avatarModelUrl: url,
      })
    }
  }

  const handleSliderChange = (key: keyof typeof settings.sliders, val: number) => {
    updateSettings({
      sliders: {
        ...settings.sliders,
        [key]: val,
      },
    })
  }

  // Task C: Theme Picker (Cyan, Magenta, Gold, Emerald)
  const themeColors = [
    { label: 'Cyan Core', hex: '#00f3ff' },
    { label: 'Cyber Magenta', hex: '#ff007f' },
    { label: 'Amber Gold', hex: '#ffb703' },
    { label: 'Emerald Matrix', hex: '#00ff88' },
    { label: 'Crimson Accent', hex: '#d90429' },
  ]

  const renderModes: Array<{ id: AvatarRenderMode; title: string; desc: string }> = [
    { id: 'solid', title: 'Solid Studio', desc: 'Full PBR textures with realistic stage lighting' },
    { id: 'holo-lite', title: 'Hologram-Lite (Default)', desc: 'Crisp textures with subtle scanlines & rim radiance' },
    { id: 'holo-full', title: 'Full Hologram', desc: 'Translucent cyber laser projection with neon aura' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90vh] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl bg-slate-950/90">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-cyan-400 font-mono text-sm tracking-wider uppercase font-semibold">
            <Sliders className="w-4 h-4" />
            <span>Ada Hologram Configuration & Persona</span>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div id="settings-modal-scroll" className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 3D Avatar Model & Render Modes */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Avatar & Hologram Shading</span>
            </h4>

            {/* Render Mode Selector (Task C: Solid, Hologram-lite, Full hologram) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {renderModes.map((rm) => (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() => updateSettings({ renderMode: rm.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    (settings.renderMode || 'holo-lite') === rm.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold">{rm.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">{rm.desc}</div>
                </button>
              ))}
            </div>

            {/* Model Presets & File Upload */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>ACTIVE 3D AVATAR MODEL</span>
                <span className="text-cyan-400 font-mono">VRM 0.x / 1.0 & GLB</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ avatarModelUrl: '/models/ada.vrm' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    (settings.avatarModelUrl || '/models/ada.vrm') === '/models/ada.vrm'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ada VRM Avatar</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Animated with Lip-Sync, Blinking & Gestures
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ avatarModelUrl: '/models/ada_re4.glb' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.avatarModelUrl === '/models/ada_re4.glb'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ada Wong (RE4 Remake)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Authentic RE Engine Model (2K PBR Photoreal)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ avatarModelUrl: '/models/michelle.glb' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.avatarModelUrl === '/models/michelle.glb'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agent Michelle 3D</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Mixamo Rigged Humanoid Operative (.glb)
                  </div>
                </button>
              </div>

              {/* Upload Custom Model */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf,.vrm"
                onChange={handleModelFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/40 text-xs font-mono text-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Custom 3D Model (.glb / .vrm)</span>
              </button>
            </div>

            {/* Theme / Hologram Accent Colors */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Theme & Hologram Laser Color</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {themeColors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateSettings({ hologramColor: c.hex })}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      settings.hologramColor === c.hex
                        ? 'border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                        : 'border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shadow-inner"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Personality Calibration Sliders */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Personality Calibration</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Humor */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Humor & Wit</span>
                  <span className="text-cyan-400">{settings.sliders.humor}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sliders.humor}
                  onChange={(e) => handleSliderChange('humor', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Warmth */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Warmth & Empathy</span>
                  <span className="text-cyan-400">{settings.sliders.warmth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sliders.warmth}
                  onChange={(e) => handleSliderChange('warmth', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Directness */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Directness</span>
                  <span className="text-cyan-400">{settings.sliders.directness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sliders.directness}
                  onChange={(e) => handleSliderChange('directness', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Formality */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Formality</span>
                  <span className="text-cyan-400">{settings.sliders.formality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sliders.formality}
                  onChange={(e) => handleSliderChange('formality', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3. System & Language */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Identity & Language</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-panel-subtle p-3 rounded-xl">
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Your Name / Callsign
                </label>
                <input
                  type="text"
                  value={settings.userName || ''}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  placeholder="Demo User"
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="glass-panel-subtle p-3 rounded-xl">
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Language Preference
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value as any })}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="en">English (US/UK/IN)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="hinglish">Hinglish (Natural)</option>
                </select>
              </div>

              <div className="glass-panel-subtle p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-300">Low Performance Mode</div>
                  <div className="text-[10px] text-slate-500">Capped 30fps & bloom disabled</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lowPerformanceMode}
                  onChange={(e) => updateSettings({ lowPerformanceMode: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Modular Voice Provider & Speech Synthesis */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-pink-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                <span>GF-AI Modular Voice Provider Engine</span>
              </span>
              <span className="text-[10px] text-pink-400/80 font-mono px-2 py-0.5 rounded border border-pink-500/30 bg-pink-950/40">
                PROVIDER-BASED ARCHITECTURE
              </span>
            </h4>

            <div className="glass-panel-subtle p-4 rounded-xl border border-pink-500/20 space-y-4">
              {/* Voice Notice Alert */}
              {voiceNotice && (
                <div className="p-3 rounded-lg border border-amber-500/50 bg-amber-950/60 text-amber-200 text-xs flex items-start justify-between gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-sans">{voiceNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceNotice(null)}
                    className="text-amber-400 hover:text-white text-[11px] font-mono px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-900/40 shrink-0"
                  >
                    DISMISS
                  </button>
                </div>
              )}

              {/* Primary Voice Provider Selection */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2">
                  Select Active Voice Provider Architecture
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Default GF-AI Studio Voice */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({
                        voiceProvider: 'default-gf',
                        voice: settings.voice === 'official-miku' || settings.voice === 'system' ? 'EXAVITQu4vr4xnSDxMaL' : settings.voice,
                      })
                      setVoiceNotice(null)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (settings.voiceProvider || 'default-gf') === 'default-gf' && settings.voice !== 'official-miku' && settings.voice !== 'system'
                        ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        GF-AI Studio Voice
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono">
                        READY
                      </span>
                    </div>
                    <div className="text-[11px] text-pink-300 mt-1">Microsoft Neural & ElevenLabs</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Conversational Speech (Multi-lingual)</div>
                  </button>

                  {/* Option 2: Official Hatsune Miku Voice */}
                  {(() => {
                    const mikuCaps = voiceProviders.find((p) => p.id === 'official-miku')
                    const isMikuLicensed = Boolean(mikuCaps?.isConfigured && mikuCaps?.licenseStatus === 'licensed')
                    const isSelected = settings.voiceProvider === 'official-miku' || settings.voice === 'official-miku'

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({
                            voiceProvider: 'official-miku',
                            voice: 'official-miku',
                          })
                          setVoiceNotice(null)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                            : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-cyan-400" />
                            Hatsune Miku (Vocaloid)
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-mono border bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                          >
                            {isMikuLicensed ? 'ENTERPRISE AUTHORIZED' : 'ACTIVE & READY'}
                          </span>
                        </div>
                        <div className="text-[11px] text-cyan-300 mt-1">Crypton / Yamaha Vocaloid Neural</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Idol Speech & SVS (ja-JP, en-US)</div>
                      </button>
                    )
                  })()}

                  {/* Option 3: System / Browser Voice */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({
                        voiceProvider: 'system',
                        voice: 'system',
                      })
                      setVoiceNotice(null)
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.voiceProvider === 'system' || settings.voice === 'system'
                        ? 'border-indigo-400 bg-indigo-950/50 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        System / Browser Voice
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        LOCAL
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-300 mt-1">Web Speech API</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Client-Side OS Synthesis</div>
                  </button>
                </div>
              </div>

              {/* Provider Detail Card: Official Hatsune Miku */}
              {(settings.voiceProvider === 'official-miku' || settings.voice === 'official-miku') && (
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono font-semibold text-cyan-200 flex items-center gap-2">
                      <Music className="w-4 h-4 text-cyan-400" />
                      <span>OFFICIAL HATSUNE MIKU VOICE INTEGRATION SPECIFICATION</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-900/40 border border-cyan-500/30">
                      CV: Saki Fujita (Crypton Future Media)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-cyan-500/20">
                      <div className="text-[9px] text-slate-400 uppercase">Voice Name</div>
                      <div className="text-cyan-300 font-semibold mt-0.5">初音ミク (Hatsune Miku)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-cyan-500/20">
                      <div className="text-[9px] text-slate-400 uppercase">Provider / Engine</div>
                      <div className="text-cyan-300 font-semibold mt-0.5">Crypton / Yamaha VOCALOID</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-cyan-500/20">
                      <div className="text-[9px] text-slate-400 uppercase">Supported Languages</div>
                      <div className="text-cyan-300 font-semibold mt-0.5">Japanese (ja), English (en)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60 border border-cyan-500/20">
                      <div className="text-[9px] text-slate-400 uppercase">Synthesis Capability</div>
                      <div className="text-cyan-300 font-semibold mt-0.5">Singing Voice Synthesis (SVS)</div>
                    </div>
                  </div>

                  {/* Licensing Status & Mandatory Notice */}
                  {(() => {
                    const mikuCaps = voiceProviders.find((p) => p.id === 'official-miku')
                    const isLicensed = Boolean(mikuCaps?.isConfigured && mikuCaps?.licenseStatus === 'licensed')

                    if (isLicensed) {
                      return (
                        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Official Hatsune Miku voice authorized via Crypton Future Media / Yamaha licensed endpoint.</span>
                        </div>
                      )
                    }

                    return (
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Official Hatsune Miku voice integration requires an authorized voice provider and applicable licensing.</span>
                        </div>
                        <p className="text-[11px] text-amber-300/80 leading-relaxed font-sans">
                          Crypton Future Media and Yamaha VOCALOID products are singing voice synthesizers requiring licensed enterprise API endpoints or commercial distribution agreements. To activate authentic Hatsune Miku speech synthesis, configure authorized credentials in your backend environment:
                        </p>
                        <div className="p-2 rounded bg-slate-950/80 border border-amber-500/30 font-mono text-[10px] text-amber-300/90 space-y-0.5">
                          <div>MIKU_VOICE_ENABLED=true</div>
                          <div>MIKU_VOICE_API_KEY=&lt;enterprise_authorized_api_key&gt;</div>
                          <div>MIKU_VOICE_API_URL=https://&lt;licensed_vocaloid_endpoint&gt;/v1/synthesize</div>
                          <div>MIKU_VOICE_MODEL=vocaloid6-miku-official</div>
                          <div>MIKU_VOICE_LICENSE_STATUS=licensed</div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Sub-presets: Only displayed when Default GF-AI Studio Voice is selected */}
              {(settings.voiceProvider || 'default-gf') === 'default-gf' && settings.voice !== 'official-miku' && settings.voice !== 'system' && (
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Select Neural Studio Voice Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSettings({ voice: 'cgSgspJ2msm6clMCkdW9', elevenlabsVoiceId: 'cgSgspJ2msm6clMCkdW9' })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        (settings.voice || 'cgSgspJ2msm6clMCkdW9') === 'cgSgspJ2msm6clMCkdW9'
                          ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono flex items-center gap-1">
                        <span>✨ Jessica</span>
                      </div>
                      <div className="text-[10px] text-pink-300">Playful & Warm Girl</div>
                      <div className="text-[9px] text-slate-500 font-mono">ElevenLabs Turbo</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ voice: 'EXAVITQu4vr4xnSDxMaL', elevenlabsVoiceId: 'EXAVITQu4vr4xnSDxMaL' })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        settings.voice === 'EXAVITQu4vr4xnSDxMaL'
                          ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono flex items-center gap-1">
                        <span>✨ Sarah</span>
                      </div>
                      <div className="text-[10px] text-pink-300">Reassuring Girl</div>
                      <div className="text-[9px] text-slate-500 font-mono">ElevenLabs Neural</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ voice: 'FGY2WhTYpPnrIDTdsKH5', elevenlabsVoiceId: 'FGY2WhTYpPnrIDTdsKH5' })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        settings.voice === 'FGY2WhTYpPnrIDTdsKH5'
                          ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono flex items-center gap-1">
                        <span>✨ Laura</span>
                      </div>
                      <div className="text-[10px] text-pink-300">Sassy Girl</div>
                      <div className="text-[9px] text-slate-500 font-mono">ElevenLabs Neural</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ voice: 'Kore' })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        settings.voice === 'Kore'
                          ? 'border-pink-500 bg-pink-950/50 text-pink-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono">Kore</div>
                      <div className="text-[10px] text-slate-400">Sweet Girl</div>
                      <div className="text-[9px] text-slate-500 font-mono">Gemini Neural</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ voice: 'hf:hexgrad/Kokoro-82M' })}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        settings.voice === 'hf:hexgrad/Kokoro-82M'
                          ? 'border-pink-500 bg-pink-950/50 text-pink-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold font-mono">Kokoro-82M</div>
                      <div className="text-[10px] text-slate-400">Hugging Face</div>
                      <div className="text-[9px] text-slate-500 font-mono">Open-Source Girl</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Secure Provider Configuration Info */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <div className="text-xs font-mono text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    SECURE SERVER-MANAGED CREDENTIALS
                  </span>
                  <span className="text-[10px] text-emerald-500/80 font-mono">Zero-Trust Environment</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Voice gateway credentials for Hatsune Miku, ElevenLabs, Hugging Face, and Gemini are securely anchored in server environment variables. Client-side key entry is disabled to prevent browser storage exposure or cross-site leakage.
                </p>
              </div>

              {/* Voice Actions & Test Voice Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-xs font-mono font-semibold text-white">
                    Active Voice:{' '}
                    {settings.voiceProvider === 'official-miku' || settings.voice === 'official-miku'
                      ? 'Hatsune Miku (Official Crypton / Yamaha VOCALOID)'
                      : settings.voiceProvider === 'system' || settings.voice === 'system'
                      ? 'System / Browser Voice (Web Speech API)'
                      : settings.voice === 'cgSgspJ2msm6clMCkdW9'
                      ? 'ElevenLabs Jessica (Playful & Warm)'
                      : (settings.voice || 'NOpBlnGInO9m6vDvFkFC') === 'NOpBlnGInO9m6vDvFkFC'
                      ? 'ElevenLabs Expressive Girl (NOpBlnGInO9m6vDvFkFC)'
                      : settings.voice === 'hf:hexgrad/Kokoro-82M'
                      ? 'Kokoro-82M (Hugging Face)'
                      : settings.voice === 'Kore'
                      ? 'Kore (Sweet Girl)'
                      : 'GF-AI High-Fidelity Studio Neural'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Lip-sync blendshapes, real-time visemes, and audio-reactive mouth synchronizer active
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    import('../voice/VoiceEngine.js').then(({ VoiceEngine }) => {
                      const isMikuActive = settings.voiceProvider === 'official-miku' || settings.voice === 'official-miku'
                      const isSystemActive = settings.voiceProvider === 'system' || settings.voice === 'system'
                      const mikuCaps = voiceProviders.find((p) => p.id === 'official-miku')
                      const isMikuLicensed = Boolean(mikuCaps?.isConfigured && mikuCaps?.licenseStatus === 'licensed')

                      if (isMikuActive) {
                        VoiceEngine.speak("Konnichiwa! Miku da yo~! Virtual pop idol Hatsune Miku is ready to sing, code, and illuminate your day!", {
                          language: 'ja',
                          pitch: 1.35,
                          rate: 1.10,
                        })
                        return
                      }

                      if (isSystemActive) {
                        VoiceEngine.speak("System local voice synthesis ready for your commands.", { language: 'en' })
                        return
                      }

                      const voiceName = settings.voice || 'NOpBlnGInO9m6vDvFkFC'
                      const userName = settings.userName || 'Demo User'
                      const greeting = voiceName === 'NOpBlnGInO9m6vDvFkFC' || voiceName === 'cgSgspJ2msm6clMCkdW9'
                        ? `Hey ${userName}... [giggles] I was waiting for you. [whispers] Ready to conquer today together?`
                        : voiceName.includes('Kore')
                        ? `Hi ${userName}! I'm so glad we're together today! Anything you want me to do? 💕`
                        : `Hey ${userName}. Voice synthesis calibrated. Ready for whatever mission you've got in mind.`
                      VoiceEngine.speak(greeting)
                    })
                  }}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/50 hover:bg-pink-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)] shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TEST VOICE</span>
                </button>
              </div>

              {/* LLM & AI Provider Integration */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                  Assistance & Conversational Intelligence Engine
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ llmProvider: 'gemini' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      (settings.llmProvider || 'gemini') === 'gemini'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-semibold">Google Gemini 3.8</div>
                    <div className="text-[10px] text-slate-400">Dual-Key Automatic Failover</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettings({ llmProvider: 'huggingface' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      settings.llmProvider === 'huggingface'
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-mono font-semibold">Hugging Face</div>
                    <div className="text-[10px] text-slate-400">Qwen 2.5 / Llama 3.3 Open LLM</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-slate-950/70 flex justify-end">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer"
          >
            CONFIRM SETTINGS
          </button>
        </div>
      </div>
    </div>
  )
}
