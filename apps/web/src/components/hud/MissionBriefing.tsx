import React, { useState } from 'react'
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'

export const MissionBriefing: React.FC = () => {
  const {
    settings,
    notes,
    setNotes,
    pomodoroSecondsLeft,
    isPomodoroActive,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    fullScreenHoloMode,
    setActiveAction,
    setActiveFX,
    setSkinId,
    setShowWardrobeDrawer,
    setShowStageDrawer,
  } = useAppStore()

  const [newTodoText, setNewTodoText] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1100
  )

  if (fullScreenHoloMode) return null

  // Format seconds into MM:SS
  const mins = Math.floor(pomodoroSecondsLeft / 60)
  const secs = pomodoroSecondsLeft % 60
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return
    const newNote = {
      id: `note-${Date.now()}`,
      userId: settings.userId,
      title: newTodoText.trim(),
      content: '',
      completed: false,
      category: 'todo' as const,
      createdAt: Date.now(),
    }
    setNotes([newNote, ...notes])
    setNewTodoText('')
  }

  const toggleTodo = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n)))
  }

  const deleteTodo = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
  }

  if (isCollapsed) {
    return (
      <div className="fixed left-4 top-20 z-30 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2.5 rounded-2xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white shadow-xl flex items-center gap-1.5 font-mono text-xs cursor-pointer"
          title="Expand Mission Briefing Panel"
        >
          <ChevronRight className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">PANEL</span>
        </button>
      </div>
    )
  }

  return (
    <aside className="fixed left-4 top-16 w-80 z-30 pointer-events-none flex flex-col gap-2.5 max-h-[calc(100dvh-95px)] overflow-y-auto scrollbar-none pb-2">
      {/* 1. Today's Briefing & Weather Card */}
      <div className="glass-panel p-3.5 rounded-2xl pointer-events-auto border border-cyan-500/25 space-y-2 shadow-lg">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
            <span>DAILY BRIEFING</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400/80">24°C • OPTIMAL</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Collapse Panel"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="text-[11px] text-slate-300 leading-snug">
          "Focus on high-leverage milestones today. Maintain clean posture and hydration."
        </div>
      </div>

      {/* 2. Focus / Pomodoro Module */}
      <div className="glass-panel p-3.5 rounded-2xl pointer-events-auto border border-cyan-500/25 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Focus Protocol</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
            25 MIN
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-mono font-bold tracking-wider text-cyan-100">
            {timeFormatted}
          </div>

          <div className="flex items-center gap-1.5">
            {isPomodoroActive ? (
              <button
                onClick={pausePomodoro}
                className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                title="Pause"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => startPomodoro()}
                className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 transition-colors shadow-[0_0_12px_rgba(0,243,255,0.2)] cursor-pointer"
                title="Start Focus"
              >
                <Play className="w-3.5 h-3.5 fill-cyan-300" />
              </button>
            )}

            <button
              onClick={resetPomodoro}
              className="p-1.5 rounded-xl glass-panel-subtle text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Priority Targets & Action Items */}
      <div className="glass-panel p-3.5 rounded-2xl pointer-events-auto border border-cyan-500/25 flex flex-col shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Priority Targets</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400">
            {notes.filter((n) => !n.completed).length} ACTIVE
          </span>
        </div>

        {/* New Item Input */}
        <form onSubmit={handleAddTodo} className="flex items-center gap-1.5 mb-2.5">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add priority task..."
            className="flex-1 bg-slate-900/60 border border-cyan-500/20 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
          />
          <button
            type="submit"
            className="p-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Task List */}
        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
          {notes.length === 0 ? (
            <div className="text-center py-2 text-xs text-slate-400 font-mono">
              Ready for high-leverage milestones.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                  note.completed
                    ? 'bg-slate-950/30 border-slate-800 text-slate-500 line-through'
                    : 'bg-slate-900/40 border-cyan-500/15 text-slate-200 hover:border-cyan-400/30'
                }`}
              >
                <button
                  onClick={() => toggleTodo(note.id)}
                  className="flex items-center gap-2 text-left text-xs flex-1 truncate cursor-pointer"
                >
                  {note.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-300 flex-shrink-0" />
                  )}
                  <span className="truncate">{note.title}</span>
                </button>

                <button
                  onClick={() => deleteTodo(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Quick Companion & Stage Actions Card */}
      <div className="glass-panel p-3 rounded-2xl pointer-events-auto border border-pink-500/25 shadow-lg space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-pink-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>QUICK INTERACTIONS</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400">STAGE & STYLE</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              setActiveAction('sassy_hip_pop')
              setActiveFX(['sparkles', 'confetti'])
              setTimeout(() => {
                setActiveAction('idle')
                setActiveFX([])
              }, 4000)
            }}
            className="px-2.5 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-200 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>💃</span>
            <span>Dance Move</span>
          </button>

          <button
            onClick={() => {
              setSkinId('saree-crimson')
              setActiveFX(['sparkles', 'stars'])
              setActiveAction('sassy_hip_pop')
              setTimeout(() => {
                setActiveAction('idle')
                setActiveFX([])
              }, 3000)
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🥻</span>
            <span>Wear Saree</span>
          </button>

          <button
            onClick={() => setShowWardrobeDrawer(true)}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>👗</span>
            <span>Wardrobe</span>
          </button>

          <button
            onClick={() => setShowStageDrawer(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🎤</span>
            <span>Stage Studio</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
