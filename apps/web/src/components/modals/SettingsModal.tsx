import React, { useRef } from 'react'
import { X, Sliders, Palette, Cpu, Shield, Globe, Zap, Box, Sparkles, Upload, Eye, Volume2 } from 'lucide-react'
import type { AvatarRenderMode } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export const SettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    settings,
    updateSettings,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

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
                  onClick={() => updateSettings({ avatarModelUrl: '/models/ada_fullbody_tripo.glb' })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.avatarModelUrl === '/models/ada_fullbody_tripo.glb'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-rose-400" />
                    <span>Tripo 3D Crossbow</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Tactical Full-Body PBR Figurine (.glb)
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
              <span>Language & Performance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* 4. Ada Girl Voice & Neural Speech Synthesis */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-pink-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Ada Girl Voice & Speech Engine</span>
              </span>
              <span className="text-[10px] text-pink-400/80 font-mono px-2 py-0.5 rounded border border-pink-500/30 bg-pink-950/40">
                MULTI-PROVIDER NEURAL ACTIVE
              </span>
            </h4>

            <div className="glass-panel-subtle p-4 rounded-xl border border-pink-500/20 space-y-3">
              {/* Voice Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Select Neural Girl Voice Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ voice: 'NOpBlnGInO9m6vDvFkFC' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      (settings.voice || 'NOpBlnGInO9m6vDvFkFC') === 'NOpBlnGInO9m6vDvFkFC'
                        ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold font-mono flex items-center gap-1">
                      <span>✨ ElevenLabs</span>
                    </div>
                    <div className="text-[10px] text-pink-300">Expressive AI Girl</div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">NOpBlnGInO9...</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettings({ voice: 'Aoede' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      settings.voice === 'Aoede'
                        ? 'border-pink-500 bg-pink-950/50 text-pink-200'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold font-mono">Aoede</div>
                    <div className="text-[10px] text-slate-400">Sultry Spy (Gemini)</div>
                    <div className="text-[9px] text-slate-500 font-mono">Dual-Key failover</div>
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
                    <div className="text-[10px] text-slate-400">Sweet Girlfriend</div>
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
                    <div className="text-[9px] text-slate-500 font-mono">Open-Source</div>
                  </button>
                </div>
              </div>

              {/* ElevenLabs API Key Configuration */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-pink-500/20 space-y-2">
                <div className="text-xs font-mono text-pink-300 flex items-center justify-between">
                  <span>ELEVENLABS API KEY & VOICE CONFIG</span>
                  <span className="text-[10px] text-slate-400 font-mono">modelId: eleven_v4</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      ElevenLabs API Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk_..."
                      value={settings.elevenlabsApiKey || ''}
                      onChange={(e) => updateSettings({ elevenlabsApiKey: e.target.value })}
                      className="w-full bg-slate-900 border border-pink-500/30 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      ElevenLabs Voice ID
                    </label>
                    <input
                      type="text"
                      placeholder="NOpBlnGInO9m6vDvFkFC"
                      value={settings.elevenlabsVoiceId || 'NOpBlnGInO9m6vDvFkFC'}
                      onChange={(e) => updateSettings({ elevenlabsVoiceId: e.target.value })}
                      className="w-full bg-slate-900 border border-pink-500/30 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <div className="text-xs font-mono font-semibold text-white">
                    Active Voice: {(settings.voice || 'NOpBlnGInO9m6vDvFkFC') === 'NOpBlnGInO9m6vDvFkFC'
                      ? 'ElevenLabs Expressive Girl (NOpBlnGInO9m6vDvFkFC)'
                      : settings.voice === 'hf:hexgrad/Kokoro-82M'
                      ? 'Kokoro-82M (Hugging Face)'
                      : settings.voice === 'Kore'
                      ? 'Kore (Sweet Girl)'
                      : 'Aoede (Ada Wong Spy-Chic)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Lip-sync blendshapes, visemes & acting cues ([giggles], [whispers]) enabled
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    import('../voice/VoiceEngine.js').then(({ VoiceEngine }) => {
                      const voiceName = settings.voice || 'NOpBlnGInO9m6vDvFkFC'
                      const greeting = voiceName === 'NOpBlnGInO9m6vDvFkFC'
                        ? 'Hey Operator... [giggles] I was waiting for you. [whispers] Ready to conquer today together?'
                        : voiceName.includes('Kore')
                        ? "Hi babe! I'm so glad we're together today! Anything you want me to do? 💕"
                        : "Hey Operator. Voice synthesis calibrated. Ready for whatever mission you've got in mind."
                      VoiceEngine.speak(greeting)
                    })
                  }}
                  className="px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/50 hover:bg-pink-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(244,63,94,0.3)]"
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
