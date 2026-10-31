import React, { useState, useEffect } from 'react'
import { X, Heart, Smile, Meh, Frown, Sparkles, BatteryCharging, BatteryLow } from 'lucide-react'
import type { MoodJournalEntry } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { apiUrl } from '../../utils/api.js'

export const MoodJournalModal: React.FC = () => {
  const {
    showMoodModal,
    setShowMoodModal,
    settings,
    journal,
    setJournal,
    setEmotionAndGesture,
  } = useAppStore()

  const [selectedMood, setSelectedMood] = useState<MoodJournalEntry['mood']>('good')
  const [energyLevel, setEnergyLevel] = useState(3)
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    if (showMoodModal) {
      fetch(apiUrl('/api/journal'), {
        headers: { 'x-user-id': settings.userId },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.entries) setJournal(data.entries)
        })
        .catch(console.error)
    }
  }, [showMoodModal, settings.userId])

  if (!showMoodModal) return null

  const moods: Array<{ id: MoodJournalEntry['mood']; label: string; icon: string }> = [
    { id: 'great', label: 'Energized', icon: '🚀' },
    { id: 'good', label: 'Good & Calm', icon: '✨' },
    { id: 'neutral', label: 'Focused / Steady', icon: '⚡' },
    { id: 'down', label: 'Low Energy', icon: '🌧️' },
    { id: 'anxious', label: 'Stressed', icon: '🌪️' },
    { id: 'exhausted', label: 'Burnt Out', icon: '🪫' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(apiUrl('/api/journal'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': settings.userId,
        },
        body: JSON.stringify({
          mood: selectedMood,
          energyLevel,
          notes: reflection,
        }),
      })
      const data = await res.json()
      if (data.entry) {
        setJournal([data.entry, ...journal])
        setReflection('')
        // update Ada's immediate response posture
        if (selectedMood === 'down' || selectedMood === 'exhausted' || selectedMood === 'anxious') {
          setEmotionAndGesture('concerned', 0.8, 'concerned_lean')
        } else {
          setEmotionAndGesture('happy', 0.8, 'wave')
        }
        setShowMoodModal(false)
      }
    } catch (err) {
      console.error('[Journal Submit Error]', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-pink-500/30 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-pink-400 font-mono text-sm tracking-wider uppercase font-semibold">
            <Heart className="w-4 h-4" />
            <span>Daily Emotional Pulse & Reflection</span>
          </div>
          <button
            onClick={() => setShowMoodModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mood Selectors */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {moods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    selectedMood === m.id
                      ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="text-[11px] font-mono">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Slider */}
          <div className="glass-panel-subtle p-3 rounded-2xl">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Energy Reservoir</span>
              <span className="text-pink-400">{energyLevel} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full accent-pink-400 cursor-pointer"
            />
          </div>

          {/* Reflection text */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
              Reflections / Notes for Ada (Private)
            </label>
            <textarea
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well today? What drained your battery? Any thoughts you want to offload..."
              className="w-full bg-slate-900 border border-pink-500/20 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-400"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowMoodModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-400/40 hover:bg-pink-500/30 text-xs font-mono font-semibold tracking-wider transition-all"
            >
              SAVE CHECK-IN
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
