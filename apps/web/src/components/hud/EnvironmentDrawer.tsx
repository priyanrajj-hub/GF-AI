import React, { useState } from 'react'
import { Sun, Moon, CloudRain, Sparkles, X, Check, Volume2, VolumeX, Compass } from 'lucide-react'
import { EnvironmentProvider, type EnvironmentPreset } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

interface EnvironmentDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const EnvironmentDrawer: React.FC<EnvironmentDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppStore()
  const [activeEnvId, setActiveEnvId] = useState<string>('holo-lab')
  const [isAutoEnv, setIsAutoEnv] = useState<boolean>(true)

  if (!isOpen) return null

  const environments = EnvironmentProvider.getAll()

  const handleSelectEnv = (env: EnvironmentPreset) => {
    setActiveEnvId(env.id)
    setIsAutoEnv(false)
    updateSettings({
      hologramColor: env.fillLight || '#00f3ff',
    })
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-panel border-l border-cyan-500/30 z-40 flex flex-col shadow-2xl bg-slate-950/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold tracking-wider uppercase">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>3D Environments & Stage (16+)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto Switcher Pill */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div>
          <div className="text-xs font-semibold text-slate-200">Auto Time & Weather Sync</div>
          <div className="text-[10px] text-slate-400">Syncs sunrise, day, sunset & focus timer</div>
        </div>
        <button
          onClick={() => {
            setIsAutoEnv(!isAutoEnv)
            if (!isAutoEnv) {
              const auto = EnvironmentProvider.selectIntelligentScene({})
              setActiveEnvId(auto.id)
            }
          }}
          className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
            isAutoEnv
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {isAutoEnv ? 'AUTO ON' : 'MANUAL'}
        </button>
      </div>

      {/* Environments Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {environments.map((env) => {
          const isSelected = activeEnvId === env.id
          return (
            <div
              key={env.id}
              onClick={() => handleSelectEnv(env)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: env.fillLight }}
                    />
                    <h3 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {env.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pr-2">
                    {env.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-cyan-300" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                <span className="uppercase text-cyan-300/80">{env.category}</span>
                <span>•</span>
                <span>Audio: {env.ambientAudio}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
