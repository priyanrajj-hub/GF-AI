import React from 'react'
import { X, Sliders, Palette, Cpu, Shield, Globe, Zap, Box } from 'lucide-react'
import type { PersonalityMode } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export const SettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    settings,
    updateSettings,
    activeMode,
    setActiveMode,
  } = useAppStore()

  if (!showSettingsModal) return null

  const handleSliderChange = (key: keyof typeof settings.sliders, val: number) => {
    updateSettings({
      sliders: {
        ...settings.sliders,
        [key]: val,
      },
    })
  }

  const colors = [
    { label: 'Cyan Core', hex: '#00f3ff' },
    { label: 'Cyber Magenta', hex: '#ff007f' },
    { label: 'Emerald Matrix', hex: '#00ff88' },
    { label: 'Amber Gold', hex: '#ffb703' },
    { label: 'Soft Violet', hex: '#8a2be2' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90vh] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-cyan-400 font-mono text-sm tracking-wider uppercase font-semibold">
            <Sliders className="w-4 h-4" />
            <span>Ada Hologram Configuration & Persona Sliders</span>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Personality Sliders */}
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

              {/* Flirtiness (Mild default, capped at mild) */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Affection (Wholesome)</span>
                  <span className="text-pink-400">{settings.sliders.flirtiness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={settings.sliders.flirtiness}
                  onChange={(e) => handleSliderChange('flirtiness', parseInt(e.target.value))}
                  className="w-full accent-pink-400 cursor-pointer"
                />
              </div>

              {/* Talkativeness */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Talkativeness</span>
                  <span className="text-cyan-400">{settings.sliders.talkativeness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sliders.talkativeness}
                  onChange={(e) => handleSliderChange('talkativeness', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 2. Hologram Shader & Rendering Style */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />
              <span>Holographic Aesthetics & Shading</span>
            </h4>

            {/* Color Swatches */}
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => updateSettings({ hologramColor: c.hex })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                    settings.hologramColor === c.hex
                      ? 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-inner"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Solid vs Hologram Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl glass-panel-subtle">
              <div className="flex items-center gap-2.5">
                <Box className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Solid 3D Rendering</div>
                  <div className="text-[10px] text-slate-400">Toggle between Cyber Hologram and Solid Avatar</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.solidRendering}
                onChange={(e) => updateSettings({ solidRendering: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Performance & Language */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              <span>System & Performance</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language */}
              <div className="glass-panel-subtle p-3 rounded-xl">
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Spoken & Chat Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value as any })}
                  className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="auto">Auto-Detect</option>
                  <option value="en">English (US/UK)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="hinglish">Hinglish (Natural)</option>
                </select>
              </div>

              {/* Low Performance Mode */}
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

          {/* 4. Model Path */}
          <div className="glass-panel-subtle p-3 rounded-xl space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">
              Avatar VRM Model Path
            </label>
            <input
              type="text"
              value={settings.avatarModelUrl}
              onChange={(e) => updateSettings({ avatarModelUrl: e.target.value })}
              placeholder="/models/ada.vrm"
              className="w-full bg-slate-900 border border-cyan-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
            />
            <div className="text-[10px] text-slate-400">
              Drop any VRoid or CC-licensed `.vrm` into <code>public/models/</code> and reference it here.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 font-mono text-xs font-semibold tracking-wider transition-all"
          >
            CONFIRM SETTINGS
          </button>
        </div>
      </div>
    </div>
  )
}
