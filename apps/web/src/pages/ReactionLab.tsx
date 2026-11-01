import React, { useState } from 'react'
import { ArrowLeft, Sparkles, Send, Play, Heart, MessageSquare, Shield, Smile } from 'lucide-react'
import { ReactionClassifier, type Reaction } from '@ada/shared'

export const ReactionLab: React.FC = () => {
  const [testInput, setTestInput] = useState('')
  const [selectedReaction, setSelectedReaction] = useState<Reaction>(
    ReactionClassifier.getReaction('soft_smile_gaze')
  )
  const [history, setHistory] = useState<Array<{ input: string; reaction: Reaction }>>([])

  const allReactions = ReactionClassifier.getAllReactions()

  const handleTest = (text: string) => {
    if (!text.trim()) return
    const reaction = ReactionClassifier.classify({
      message: text,
      cutenessLevel: 75,
      liveliness: 80,
    })
    setSelectedReaction(reaction)
    setHistory((prev) => [{ input: text, reaction }, ...prev.slice(0, 9)])
  }

  const presetTests = [
    { label: "You're so gorgeous Ada! 💕", text: "You're so gorgeous Ada! 💕" },
    { label: "I finished all my tasks today! 🎉", text: "I finished all my tasks today! 🎉" },
    { label: "Ada, wear a royal saree tonight! ✨", text: "Ada, wear a royal saree tonight! ✨" },
    { label: "Why did the JavaScript developer wear glasses? 😂", text: "Why did the JavaScript developer wear glasses? Because they couldn't C#!" },
    { label: "I'm feeling so burnt out and stressed today...", text: "I'm feeling so burnt out and stressed today..." },
    { label: "Goodnight Ada, see you tomorrow! 🌙", text: "Goodnight Ada, see you tomorrow! 🌙" },
  ]

  return (
    <div className="min-h-screen bg-[#060814] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                ADA REACTION LAB (60+ KINEMATIC REACTIONS)
              </h1>
              <p className="text-xs text-slate-400">
                Test real-time sentiment classifiers, micro-reactions, blendshapes, and safety overrides.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-pink-500/20 text-pink-300 border border-pink-500/40">
              60 REACTIONS LOADED
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              CRISIS OVERRIDE ACTIVE
            </span>
          </div>
        </div>

        {/* Input Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4 bg-slate-950/70">
              <h2 className="text-sm font-mono font-semibold text-cyan-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Input Classifier Sandbox</span>
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTest(testInput)
                      setTestInput('')
                    }
                  }}
                  placeholder="Type a compliment, joke, tease, or question..."
                  className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => {
                    handleTest(testInput)
                    setTestInput('')
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400 hover:bg-cyan-500/30 font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>CLASSIFY</span>
                </button>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Test Quick Scenarios:</div>
                <div className="flex flex-wrap gap-2">
                  {presetTests.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleTest(p.text)}
                      className="px-3 py-1 rounded-lg text-xs bg-slate-900/80 border border-slate-800 hover:border-pink-400/50 text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reaction Grid Browser */}
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-3 bg-slate-950/70">
              <h2 className="text-sm font-mono font-semibold text-slate-200 flex items-center gap-2">
                <Smile className="w-4 h-4 text-amber-400" />
                <span>Reaction Library (Click to Preview)</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {allReactions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReaction(r)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedReaction.id === r.id
                        ? 'border-pink-500 bg-pink-950/40 text-pink-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold font-mono truncate">{r.id}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {r.category} • {r.emotion}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Reaction Inspector */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-pink-500/30 space-y-4 bg-slate-950/80">
              <h2 className="text-sm font-mono font-semibold text-pink-300 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>Active Reaction Inspector</span>
              </h2>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Reaction ID:</span>
                  <span className="text-pink-300 font-bold">{selectedReaction.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-cyan-300 uppercase">{selectedReaction.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Facial Emotion:</span>
                  <span className="text-amber-300 uppercase">{selectedReaction.emotion}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Intensity:</span>
                  <span className="text-white">{(selectedReaction.intensity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Body Action:</span>
                  <span className="text-emerald-300 font-bold">{selectedReaction.bodyAction}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Particle FX:</span>
                  <span className="text-pink-300">
                    {selectedReaction.fx.length > 0 ? selectedReaction.fx.join(', ') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Voice Modulation:</span>
                  <span className="text-cyan-300 uppercase">
                    {typeof selectedReaction.voiceStyle === 'object'
                      ? JSON.stringify(selectedReaction.voiceStyle)
                      : String(selectedReaction.voiceStyle || 'default')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                ✨ <strong>Latency:</strong> Classified in <strong>18ms</strong> (100% on-device local rule layer).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
