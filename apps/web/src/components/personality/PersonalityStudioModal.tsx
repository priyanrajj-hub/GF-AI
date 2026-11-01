import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Sliders,
  Users,
  Brain,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  MessageSquare,
  Search,
  Check,
  ChevronRight,
  Send,
} from 'lucide-react'
import {
  ARCHETYPES,
  ArchetypePreset,
  blendArchetypes,
  compilePersonalityPrompt,
  CustomPersonality,
  BigFiveTraits,
  StyleAxes,
  globalPersonalityLearner,
} from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export const PersonalityStudioModal: React.FC = () => {
  const {
    showPersonalityStudio,
    setShowPersonalityStudio,
    activeCustomPersonality,
    setActiveCustomPersonality,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'library' | 'traits' | 'blender' | 'adaptive'>('library')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected or active archetype
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(
    activeCustomPersonality?.baseArchetypeId || ARCHETYPES[0].id
  )

  const activeArchetype = useMemo(
    () => ARCHETYPES.find((a) => a.id === selectedArchetypeId) || ARCHETYPES[0],
    [selectedArchetypeId]
  )

  // Working traits for custom tuning
  const [workingBigFive, setWorkingBigFive] = useState<BigFiveTraits>(
    activeCustomPersonality?.bigFive || { ...activeArchetype.bigFive }
  )
  const [workingStyle, setWorkingStyle] = useState<StyleAxes>(
    activeCustomPersonality?.style || { ...activeArchetype.style }
  )
  const [lockedTraits, setLockedTraits] = useState<string[]>(
    activeCustomPersonality?.lockedTraits || []
  )
  const [customName, setCustomName] = useState<string>(
    activeCustomPersonality?.name || `Custom ${activeArchetype.name}`
  )

  // Blender state
  const [blend1, setBlend1] = useState<string>(selectedArchetypeId)
  const [weight1, setWeight1] = useState<number>(60)
  const [blend2, setBlend2] = useState<string>('sassy_comeback_queen')
  const [weight2, setWeight2] = useState<number>(30)
  const [blend3, setBlend3] = useState<string>('nerdy_gamer')
  const [weight3, setWeight3] = useState<number>(10)

  // Live preview chat
  const [previewMessages, setPreviewMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: activeArchetype.exampleDialogue[0]?.ada || `Hello! I am operating in ${activeArchetype.name} mode. How can I help you today?`,
    },
  ])
  const [previewInput, setPreviewInput] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  if (!showPersonalityStudio) return null

  // Filtered archetypes
  const filteredArchetypes = ARCHETYPES.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.favoriteTopics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })

  // Trait lock toggle
  const toggleLock = (traitName: string) => {
    setLockedTraits((prev) =>
      prev.includes(traitName) ? prev.filter((t) => t !== traitName) : [...prev, traitName]
    )
  }

  // Handle archetype selection
  const handleSelectArchetype = (arch: ArchetypePreset) => {
    setSelectedArchetypeId(arch.id)
    setWorkingBigFive({ ...arch.bigFive })
    setWorkingStyle({ ...arch.style })
    setCustomName(`Ada (${arch.name})`)
    setPreviewMessages([
      {
        role: 'assistant',
        text: arch.exampleDialogue[0]?.ada || `Switched to ${arch.name} mode. Ready when you are!`,
      },
    ])
  }

  // Handle blending
  const handleApplyBlend = () => {
    const blended = blendArchetypes(customName, [
      { archetypeId: blend1, weight: weight1 },
      { archetypeId: blend2, weight: weight2 },
      { archetypeId: blend3, weight: weight3 },
    ], blend1)

    setWorkingBigFive(blended.bigFive)
    setWorkingStyle(blended.style)
    setSelectedArchetypeId(blended.baseArchetypeId)
    setPreviewMessages([
      {
        role: 'assistant',
        text: `Blended persona applied! (${weight1}% ${getArchName(blend1)}, ${weight2}% ${getArchName(blend2)}, ${weight3}% ${getArchName(blend3)})`,
      },
    ])
    setActiveTab('traits')
  }

  function getArchName(id: string) {
    return ARCHETYPES.find((a) => a.id === id)?.name || id
  }

  // Save custom personality
  const handleSaveCustom = () => {
    const custom: CustomPersonality = {
      id: `custom-ada-${Date.now()}`,
      name: customName,
      baseArchetypeId: selectedArchetypeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bigFive: workingBigFive,
      style: workingStyle,
      lockedTraits,
      speechPatterns: activeArchetype.speechPatterns,
    }
    setActiveCustomPersonality(custom)
    setShowPersonalityStudio(false)
  }

  // Live preview test prompt
  const handleSendPreview = (text?: string) => {
    const query = text || previewInput
    if (!query.trim() || isPreviewLoading) return

    setPreviewMessages((prev) => [...prev, { role: 'user', text: query }])
    setPreviewInput('')
    setIsPreviewLoading(true)

    // Local compiled generation simulation
    setTimeout(() => {
      const compiled = compilePersonalityPrompt(
        {
          id: 'preview',
          name: customName,
          baseArchetypeId: selectedArchetypeId,
          createdAt: 0,
          updatedAt: 0,
          bigFive: workingBigFive,
          style: workingStyle,
          speechPatterns: activeArchetype.speechPatterns,
        },
        query
      )

      // Find best dialogue match or synthesize
      const match = activeArchetype.exampleDialogue.find(
        (d) => query.toLowerCase().includes(d.user.toLowerCase().slice(0, 8))
      )
      const reply = match
        ? match.ada
        : activeArchetype.exampleDialogue[
            Math.floor(Math.random() * activeArchetype.exampleDialogue.length)
          ]?.ada || `*Responding with ${workingStyle.humorType} wit & ${workingStyle.affection}% warmth* ${activeArchetype.speechPatterns[0]}`

      setPreviewMessages((prev) => [...prev, { role: 'assistant', text: reply }])
      setIsPreviewLoading(false)
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[92vh] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl bg-slate-950/95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <span>ADA PERSONALITY STUDIO</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  42 ARCHETYPES
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Big Five Traits, Neural Style Axes, Archetype Blending & Adaptive Learning
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCustom}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.2)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE & ACTIVATE</span>
            </button>
            <button
              onClick={() => setShowPersonalityStudio(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Subheader Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Archetype Library (42)</span>
          </button>

          <button
            onClick={() => setActiveTab('traits')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'traits'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Trait Sliders & Style Axes</span>
          </button>

          <button
            onClick={() => setActiveTab('blender')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'blender'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Archetype Blender</span>
          </button>

          <button
            onClick={() => setActiveTab('adaptive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'adaptive'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>4. Adaptive Learning & Drift Logs</span>
          </button>
        </div>

        {/* Studio Main Body (Left: Editor / Right: Live Preview Chat) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Main Controls (Left 8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto p-5 border-r border-slate-800/80 space-y-5">
            {/* TAB 1: ARCHETYPE LIBRARY */}
            {activeTab === 'library' && (
              <div className="space-y-4">
                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search archetypes by name, topic, or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {['all', 'companion', 'mentor', 'playful', 'intellectual', 'creative', 'support'].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono capitalize transition-all cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Grid of Archetypes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredArchetypes.map((arch) => {
                    const isSelected = selectedArchetypeId === arch.id
                    return (
                      <div
                        key={arch.id}
                        onClick={() => handleSelectArchetype(arch)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_14px_rgba(0,243,255,0.2)]'
                            : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                            <span>{arch.badge}</span>
                            <span>{arch.name}</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-400 font-mono capitalize">
                            {arch.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-cyan-300/90 italic mb-2 line-clamp-1">
                          "{arch.tagline}"
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {arch.description}
                        </div>
                        <div className="flex flex-wrap gap-1 text-[9px] font-mono text-slate-400">
                          {arch.favoriteTopics.slice(0, 3).map((topic, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800/60">
                              #{topic}
                            </span>
                          ))}
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-cyan-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: TRAIT SLIDERS & STYLE AXES */}
            {activeTab === 'traits' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-3 flex items-center justify-between">
                    <span>Big Five Trait Spectrum</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click lock to preserve trait against adaptation</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'openness', label: 'Openness', desc: 'Curiosity & Imagination' },
                      { key: 'conscientiousness', label: 'Conscientiousness', desc: 'Discipline & Thoroughness' },
                      { key: 'extraversion', label: 'Extraversion', desc: 'Expressiveness & Social Energy' },
                      { key: 'agreeableness', label: 'Agreeableness', desc: 'Warmth & Empathy' },
                      { key: 'emotionalSensitivity', label: 'Emotional Sensitivity', desc: 'Resonance & Tenderness' },
                    ].map(({ key, label, desc }) => {
                      const val = (workingBigFive as any)[key]
                      const locked = lockedTraits.includes(key)
                      return (
                        <div key={key} className="glass-panel-subtle p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white font-semibold">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-cyan-400 font-bold">{val}%</span>
                              <button
                                type="button"
                                onClick={() => toggleLock(key)}
                                className={`p-1 rounded cursor-pointer ${
                                  locked ? 'text-amber-400 bg-amber-950/40' : 'text-slate-600 hover:text-slate-400'
                                }`}
                                title={locked ? 'Trait Locked' : 'Lock Trait'}
                              >
                                {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400">{desc}</div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            disabled={locked}
                            onChange={(e) =>
                              setWorkingBigFive((prev) => ({
                                ...prev,
                                [key]: parseInt(e.target.value),
                              }))
                            }
                            className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-pink-300 mb-3">
                    Style & Demeanor Axes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'playfulness', label: 'Playfulness & Jokes' },
                      { key: 'cuteness', label: 'Cuteness & Charm' },
                      { key: 'sass', label: 'Sass & Quips' },
                      { key: 'formality', label: 'Formality & Precision' },
                      { key: 'affection', label: 'Affection (Wholesome PG)' },
                      { key: 'talkativeness', label: 'Talkativeness & Detail' },
                      { key: 'energy', label: 'Energy (Calm to Hyper)' },
                    ].map(({ key, label }) => {
                      const val = (workingStyle as any)[key]
                      const locked = lockedTraits.includes(key)
                      return (
                        <div key={key} className="glass-panel-subtle p-3 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-white">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-pink-400 font-bold">{val}%</span>
                              <button
                                type="button"
                                onClick={() => toggleLock(key)}
                                className={`p-1 rounded cursor-pointer ${
                                  locked ? 'text-amber-400 bg-amber-950/40' : 'text-slate-600 hover:text-slate-400'
                                }`}
                                title={locked ? 'Trait Locked' : 'Lock Trait'}
                              >
                                {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={val}
                            disabled={locked}
                            onChange={(e) =>
                              setWorkingStyle((prev) => ({
                                ...prev,
                                [key]: parseInt(e.target.value),
                              }))
                            }
                            className="w-full accent-pink-400 cursor-pointer disabled:opacity-40"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Language Mix */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-300 mb-2">
                    Language Mix Ratio
                  </h4>
                  <div className="glass-panel-subtle p-3 rounded-xl space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div>
                        <div className="text-slate-400 text-[10px]">English</div>
                        <div className="text-white font-bold">{workingStyle.languageMix.english}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Hinglish</div>
                        <div className="text-cyan-300 font-bold">{workingStyle.languageMix.hinglish}%</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Hindi</div>
                        <div className="text-emerald-300 font-bold">{workingStyle.languageMix.hindi}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ARCHETYPE BLENDER */}
            {activeTab === 'blender' && (
              <div className="space-y-5">
                <div className="text-xs text-slate-300 leading-relaxed">
                  Mix multiple archetypes together with custom weights. The Personality Blender interpolates Big Five trait vectors, synthesizes speech patterns, and preserves core safety protocols.
                </div>

                <div className="space-y-4">
                  {/* Archetype 1 */}
                  <div className="glass-panel-subtle p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-bold">Primary Archetype</span>
                      <span className="text-cyan-400 font-bold">{weight1}%</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={blend1}
                        onChange={(e) => setBlend1(e.target.value)}
                        className="bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      >
                        {ARCHETYPES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.badge} {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight1}
                        onChange={(e) => setWeight1(parseInt(e.target.value))}
                        className="accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Archetype 2 */}
                  <div className="glass-panel-subtle p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-pink-300 font-bold">Secondary Archetype</span>
                      <span className="text-pink-400 font-bold">{weight2}%</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={blend2}
                        onChange={(e) => setBlend2(e.target.value)}
                        className="bg-slate-900 border border-pink-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      >
                        {ARCHETYPES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.badge} {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight2}
                        onChange={(e) => setWeight2(parseInt(e.target.value))}
                        className="accent-pink-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Archetype 3 */}
                  <div className="glass-panel-subtle p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-amber-300 font-bold">Accent Spice Archetype</span>
                      <span className="text-amber-400 font-bold">{weight3}%</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={blend3}
                        onChange={(e) => setBlend3(e.target.value)}
                        className="bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      >
                        {ARCHETYPES.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.badge} {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight3}
                        onChange={(e) => setWeight3(parseInt(e.target.value))}
                        className="accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleApplyBlend}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/30 via-pink-500/30 to-amber-500/30 hover:opacity-90 border border-cyan-400/50 text-xs font-mono font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Blend & Preview Persona
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: ADAPTIVE LEARNING & DRIFT LOGS */}
            {activeTab === 'adaptive' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Trait Drift & Learning History
                    </h4>
                    <div className="text-[11px] text-slate-400">
                      Transparent audit of micro-adaptations learned from your feedback
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      globalPersonalityLearner.clearLogs()
                      setWorkingBigFive({ ...activeArchetype.bigFive })
                      setWorkingStyle({ ...activeArchetype.style })
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Archetype Baseline</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {globalPersonalityLearner.getDriftLogs().length === 0 ? (
                    <div className="glass-panel-subtle p-6 rounded-2xl text-center text-xs font-mono text-slate-500">
                      No trait drift recorded yet. Thumbs up/down, reaction ratings, and multi-turn conversations will automatically calibrate Ada within safe bounds.
                    </div>
                  ) : (
                    globalPersonalityLearner.getDriftLogs().map((log, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl glass-panel-subtle border border-slate-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-semibold">{log.trait}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-slate-400">{log.oldValue}%</span>
                          <span className="text-emerald-400 font-bold">{log.newValue}%</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {log.reason}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Chat Column (4 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-slate-950/60 overflow-hidden">
            {/* Header info */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Persona Preview</span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono truncate">
                  {activeArchetype.name} (Temp: {((workingBigFive.openness * 0.4 + workingStyle.playfulness * 0.4) / 100 * 0.3 + 0.65).toFixed(2)})
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {workingStyle.humorType}
              </span>
            </div>

            {/* Quick Prompts */}
            <div className="p-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
              {[
                'Tell me a joke',
                "I'm stressed with work",
                'What is your perspective on life?',
                'Did I do good today?',
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendPreview(p)}
                  className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 whitespace-nowrap cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Messages Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {previewMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs font-mono leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/30'
                        : 'bg-slate-900/80 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isPreviewLoading && (
                <div className="text-[10px] font-mono text-cyan-400 animate-pulse">
                  Synthesizing persona response...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a test message..."
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPreview()}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleSendPreview()}
                disabled={!previewInput.trim()}
                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
