import React, { useState } from 'react'
import { Sparkles, X, Check, Shirt, Heart, Palette, Headphones, Shield } from 'lucide-react'
import { WardrobeProvider, type WardrobeOutfit } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'

interface WardrobeDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const WardrobeDrawer: React.FC<WardrobeDrawerProps> = ({ isOpen, onClose }) => {
  const { skinId, setSkinId, accessories, setAccessories, setActiveFX, setActiveAction } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  if (!isOpen) return null

  const outfits = WardrobeProvider.getAllOutfits()
  const filtered = selectedCategory === 'all' ? outfits : outfits.filter((o) => o.category === selectedCategory || o.tags.includes(selectedCategory))

  const handleSelectOutfit = (outfit: WardrobeOutfit) => {
    // 1. Magical transformation spin with light-burst FX
    setActiveAction('sassy_hip_pop')
    setActiveFX(['sparkles', 'confetti', 'stars'])
    setSkinId(outfit.id)

    // 2. Ada voice response
    VoiceEngine.speak(outfit.voiceComment)

    setTimeout(() => {
      setActiveFX([])
      setActiveAction('idle')
    }, 3200)
  }

  const categories = [
    { id: 'all', label: 'All Outfits' },
    { id: 'indian', label: 'Desi / Indian' },
    { id: 'signature', label: 'Spy-Chic' },
    { id: 'casual', label: 'Casual' },
    { id: 'formal', label: 'Office' },
    { id: 'night', label: 'Bedtime' },
    { id: 'glamour', label: 'Gala & Festive' },
  ]

  return (
    <div className="fixed inset-y-0 right-0 w-96 glass-panel border-l border-cyan-500/30 z-40 flex flex-col shadow-2xl bg-slate-950/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold tracking-wider uppercase">
          <Shirt className="w-4 h-4 text-pink-400" />
          <span>Ada Wardrobe & Outfits (15+)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-pink-500/20 text-pink-300 border border-pink-400/50'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Outfits & Accessories List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tactical Accessories Toggles (Milestone 1) */}
        <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              Tactical Accessories
            </span>
            <span className="text-[9px] text-cyan-400/60 lowercase">live sync</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Comms Headset */}
            <button
              onClick={() =>
                setAccessories({ commsHeadset: !accessories?.commsHeadset })
              }
              className={`p-2 rounded-xl text-center border transition-all text-[11px] font-mono cursor-pointer flex flex-col items-center gap-1 ${
                accessories?.commsHeadset
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Headset</span>
              <span className="text-[9px] text-cyan-400/80">
                {accessories?.commsHeadset ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Black Gloves */}
            <button
              onClick={() =>
                setAccessories({ gloves: !accessories?.gloves })
              }
              className={`p-2 rounded-xl text-center border transition-all text-[11px] font-mono cursor-pointer flex flex-col items-center gap-1 ${
                accessories?.gloves !== false
                  ? 'bg-pink-500/25 border-pink-400 text-pink-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Gloves</span>
              <span className="text-[9px] text-pink-400/80">
                {accessories?.gloves !== false ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Boots */}
            <button
              onClick={() =>
                setAccessories({ boots: !accessories?.boots })
              }
              className={`p-2 rounded-xl text-center border transition-all text-[11px] font-mono cursor-pointer flex flex-col items-center gap-1 ${
                accessories?.boots !== false
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Boots</span>
              <span className="text-[9px] text-emerald-400/80">
                {accessories?.boots !== false ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {filtered.map((outfit) => {
          const isSelected = skinId === outfit.id
          return (
            <div
              key={outfit.id}
              onClick={() => handleSelectOutfit(outfit)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'border-pink-500/80 bg-pink-950/30 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: outfit.dressColor }}
                    />
                    <h3 className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                      {outfit.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pr-2">
                    {outfit.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-pink-500/30 border border-pink-400 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-pink-300" />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {outfit.tags.slice(0, 3).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950/60 text-slate-400 border border-slate-800"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-950/80 text-[11px] font-mono text-cyan-300/80 flex items-center justify-between">
        <span>✨ Voice: "Ada, wear a saree"</span>
        <button
          onClick={() => {
            const random = WardrobeProvider.selectIntelligentOutfit({ command: 'surprise me' })
            handleSelectOutfit(random)
          }}
          className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-400/40 hover:bg-pink-500/30 text-[10px] cursor-pointer"
        >
          Surprise Me
        </button>
      </div>
    </div>
  )
}
