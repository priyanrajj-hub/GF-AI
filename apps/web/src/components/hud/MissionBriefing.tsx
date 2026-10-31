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
  } = useAppStore()

  const [newTodoText, setNewTodoText] = useState('')

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
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n))
    )
  }

  const deleteTodo = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id))
  }

  return (
    <aside className="fixed left-4 top-20 bottom-6 w-80 z-30 pointer-events-none flex flex-col gap-3">
      {/* 1. Focus / Pomodoro Module */}
      <div className="glass-panel p-4 rounded-2xl pointer-events-auto border border-cyan-500/25">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Focus Protocol</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
            25 MIN CYCLES
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-3xl font-mono font-bold tracking-wider text-cyan-100 text-shadow">
            {timeFormatted}
          </div>

          <div className="flex items-center gap-1.5">
            {isPomodoroActive ? (
              <button
                onClick={pausePomodoro}
                className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition-colors"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => startPomodoro()}
                className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 transition-colors shadow-[0_0_12px_rgba(0,243,255,0.2)]"
                title="Start Focus"
              >
                <Play className="w-4 h-4 fill-cyan-300" />
              </button>
            )}

            <button
              onClick={resetPomodoro}
              className="p-2 rounded-xl glass-panel-subtle text-slate-400 hover:text-white transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tasks & Action List */}
      <div className="glass-panel p-4 rounded-2xl pointer-events-auto border border-cyan-500/25 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-wider uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Priority Targets</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {notes.filter((n) => !n.completed).length} ACTIVE
          </span>
        </div>

        {/* New Item Input */}
        <form onSubmit={handleAddTodo} className="flex items-center gap-1.5 mb-3">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add priority task or note..."
            className="flex-1 bg-slate-900/60 border border-cyan-500/20 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <button
            type="submit"
            className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Task List Scroll */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {notes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              No pending targets. Ask Ada to plan your day.
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-300 flex-shrink-0" />
                  )}
                  <span className="truncate">{note.title}</span>
                </button>

                <button
                  onClick={() => deleteTodo(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
