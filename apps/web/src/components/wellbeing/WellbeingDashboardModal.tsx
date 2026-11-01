import React, { useState } from 'react'
import {
  Heart,
  Clock,
  Activity,
  Smile,
  Meh,
  Frown,
  Users,
  Moon,
  Compass,
  Download,
  Trash2,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'

export const WellbeingDashboardModal: React.FC = () => {
  const {
    showWellbeingModal,
    setShowWellbeingModal,
    wellbeing,
    recordWellbeingRating,
    setDailyLimitMinutes,
    updateBalanceCheck,
    isMinorMode,
    setIsMinorMode,
  } = useAppStore()

  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  if (!showWellbeingModal) return null

  const dailyMinutes = Math.floor(wellbeing.dailySeconds / 60)
  const weeklyMinutes = Math.floor(wellbeing.weeklySeconds / 60)
  const isOverLimit = dailyMinutes >= wellbeing.dailyLimitMinutes

  const handleRating = (rating: 'better' | 'same' | 'worse') => {
    recordWellbeingRating(rating)
    setRatingSubmitted(true)
    if (rating === 'worse') {
      VoiceEngine.speak(
        'I hear you. If you ever need a break, some fresh air, or to reach out to someone you trust, please take that time. Your wellbeing comes first.'
      )
    } else if (rating === 'better') {
      VoiceEngine.speak("I'm so glad our conversation brought a little clarity to your day.")
    }
    setTimeout(() => setRatingSubmitted(false), 3000)
  }

  // One-click data export (JSON)
  const handleExportData = () => {
    const state = useAppStore.getState()
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      user: state.settings.userName,
      settings: state.settings,
      wellbeing: state.wellbeing,
      memories: state.memories,
      journal: state.journal,
      messagesCount: state.messages.length,
    }
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ada-wellbeing-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportNotice('Data successfully exported as JSON file.')
    setTimeout(() => setExportNotice(null), 3500)
  }

  // One-click data wipe
  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all local memories, journals, and cached chats? This cannot be undone.')) {
      localStorage.clear()
      useAppStore.getState().clearMessages()
      useAppStore.getState().setMemories([])
      useAppStore.getState().setJournal([])
      alert('All local Ada data has been cleared.')
      setShowWellbeingModal(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <div className="w-full max-w-2xl max-h-[90vh] glass-panel border border-pink-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.15)] bg-[#070914]/95 text-slate-200 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white tracking-wide flex items-center gap-2">
                PERSONAL WELLBEING DASHBOARD
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300">
                  Private & On-Device
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Healthy engagement tracking, post-session sentiment, and real-world balance
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWellbeingModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Over-Limit / Break Suggestion Banner */}
        {isOverLimit && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-400/40 flex items-start gap-3 text-amber-200 font-mono text-xs">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Kind Reminder: Time for a Real-World Break</div>
              <p className="text-amber-200/80 text-[11px] mt-1">
                You've reached your daily companion target of {wellbeing.dailyLimitMinutes} minutes. Stepping away for a brisk walk, water, or checking in with family/friends is great for your mind. Ada will be right here whenever you return.
              </p>
            </div>
          </div>
        )}

        {/* 1. Time Spent & Daily Limit Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Today's Time</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {dailyMinutes} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              Target Cap: {wellbeing.dailyLimitMinutes} min
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-pink-400" />
              <span>This Week</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {(weeklyMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
            </div>
            <div className="text-[10px] text-pink-400 font-mono">
              ~{Math.round(weeklyMinutes / 7)} min / day average
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 text-xs font-mono">Set Daily Limit</div>
            <div className="flex gap-1.5">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDailyLimitMinutes(mins)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    wellbeing.dailyLimitMinutes === mins
                      ? 'bg-pink-500/30 text-pink-200 border border-pink-400/60 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">Self-managed boundary</div>
          </div>
        </div>

        {/* 2. Mood & Wellbeing Check-In (Beyond Satisfaction) */}
        <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-xs text-pink-300 flex items-center gap-2">
              <Smile className="w-4 h-4 text-pink-400" />
              <span>How do you feel after talking?</span>
            </div>
            <span className="text-[10px] text-pink-400/70">Research-derived check-in</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Measuring how conversations actually impact your mood helps prevent passive dependence.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => handleRating('better')}
              className="flex-1 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Smile className="w-4 h-4" />
              <span>Better</span>
            </button>
            <button
              onClick={() => handleRating('same')}
              className="flex-1 p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-300 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Meh className="w-4 h-4" />
              <span>Same</span>
            </button>
            <button
              onClick={() => handleRating('worse')}
              className="flex-1 p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Frown className="w-4 h-4" />
              <span>Worse</span>
            </button>
          </div>

          {ratingSubmitted && (
            <div className="text-[10px] text-emerald-400 text-center animate-pulse">
              ✓ Mood logged to your private trend log.
            </div>
          )}

          {/* 7-Day Trend Visualizer */}
          {wellbeing.moodRatings.length > 0 && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Recent ratings ({wellbeing.moodRatings.length}):</span>
              <div className="flex gap-1">
                {wellbeing.moodRatings.slice(-7).map((r, i) => (
                  <span
                    key={i}
                    title={`${r.rating} at ${new Date(r.timestamp).toLocaleTimeString()}`}
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      r.rating === 'better'
                        ? 'bg-emerald-500 text-black font-bold'
                        : r.rating === 'same'
                          ? 'bg-cyan-500 text-black'
                          : 'bg-rose-500 text-white font-bold'
                    }`}
                  >
                    {r.rating === 'better' ? '▲' : r.rating === 'same' ? '—' : '▼'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Real-World Balance Checks */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Gentle Balance Check (Self-Reflection)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sleep Last Night</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="14"
                value={wellbeing.balance.sleepHours}
                onChange={(e) =>
                  updateBalanceCheck({ sleepHours: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-transparent text-white font-mono text-base outline-none"
              />
              <span className="text-[9px] text-slate-500">Target: 7–9 hours</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Offline / Outdoors</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={wellbeing.balance.offlineHours}
                onChange={(e) =>
                  updateBalanceCheck({ offlineHours: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-transparent text-white font-mono text-base outline-none"
              />
              <span className="text-[9px] text-slate-500">Fresh air & movement</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>Saw Friends / Family</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={wellbeing.balance.friendsSeen}
                  onChange={(e) =>
                    updateBalanceCheck({ friendsSeen: e.target.checked })
                  }
                  className="accent-pink-400 w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-white text-xs">
                  {wellbeing.balance.friendsSeen ? 'Yes, connected' : 'Not today yet'}
                </span>
              </label>
              <span className="text-[9px] text-slate-500">Real social ties</span>
            </div>
          </div>
        </div>

        {/* 4. Minor Protection Mode Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div>
            <div className="text-white font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Minor Safety Mode (Under 18 Safeguards)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enforces 3-hour break reminders, periodic AI disclosure, and blocks romantic framing.
            </p>
          </div>
          <button
            onClick={() => setIsMinorMode(!isMinorMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              isMinorMode
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {isMinorMode ? 'ACTIVE' : 'OFF'}
          </button>
        </div>

        {/* 5. Data Sovereignty & Helplines Footer */}
        <div className="pt-2 border-t border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={handleExportData}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Data (JSON)</span>
            </button>

            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/40 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Local Data</span>
            </button>

            <div className="flex items-center gap-3 text-[11px] text-cyan-400">
              <a href="/docs/PRIVACY.md" target="_blank" className="hover:underline flex items-center gap-1">
                Privacy Transparency <ExternalLink className="w-3 h-3" />
              </a>
              <a href="/docs/SAFETY_PROTOCOL.md" target="_blank" className="hover:underline flex items-center gap-1">
                Safety Protocol <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {exportNotice && (
            <div className="text-[11px] text-cyan-300 text-center bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30">
              {exportNotice}
            </div>
          )}

          {/* 24/7 Helplines Footer */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
            <span>🆘 Free 24/7 Crisis Helplines:</span>
            <span className="text-rose-300">🇮🇳 Tele-MANAS: 14416</span>
            <span className="text-cyan-300">🌐 US/Intl: 988</span>
            <span className="text-pink-300">🇮🇳 Vandrevala: +91 9999 666 555</span>
          </div>
        </div>
      </div>
    </div>
  )
}
