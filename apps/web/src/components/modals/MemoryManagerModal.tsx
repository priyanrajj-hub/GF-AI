import React, { useState, useEffect } from 'react'
import {
  X,
  Brain,
  Trash2,
  Pin,
  Plus,
  Download,
  AlertTriangle,
  Search,
  Check,
} from 'lucide-react'
import type { MemoryItem } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'

export const MemoryManagerModal: React.FC = () => {
  const {
    showMemoryModal,
    setShowMemoryModal,
    settings,
    updateSettings,
    memories,
    setMemories,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference')
  const [showConfirmWipe, setShowConfirmWipe] = useState(false)

  // Fetch memories from backend
  useEffect(() => {
    if (showMemoryModal) {
      fetch('/api/memory', {
        headers: { 'x-user-id': settings.userId },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.memories) setMemories(data.memories)
        })
        .catch(console.error)
    }
  }, [showMemoryModal, settings.userId])

  if (!showMemoryModal) return null

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim()) return

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': settings.userId,
        },
        body: JSON.stringify({
          key: `user_${newCategory}`,
          category: newCategory,
          content: newContent.trim(),
          importance: 4,
          pinned: false,
        }),
      })
      const data = await res.json()
      if (data.memory) {
        setMemories([...memories, data.memory])
        setNewContent('')
      }
    } catch (err) {
      console.error('[Add Memory Error]', err)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': settings.userId },
      })
      setMemories(memories.filter((m) => m.id !== id))
    } catch (err) {
      console.error('[Delete Memory Error]', err)
    }
  }

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': settings.userId,
        },
        body: JSON.stringify({ pinned: !currentPinned }),
      })
      const data = await res.json()
      if (data.memory) {
        setMemories(memories.map((m) => (m.id === id ? data.memory : m)))
      }
    } catch (err) {
      console.error('[Pin Error]', err)
    }
  }

  const handleWipeAll = async () => {
    try {
      await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'x-user-id': settings.userId },
      })
      setMemories([])
      setShowConfirmWipe(false)
    } catch (err) {
      console.error('[Wipe Memory Error]', err)
    }
  }

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `ada_memories_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 text-cyan-400 font-mono text-sm tracking-wider uppercase font-semibold">
            <Brain className="w-4 h-4" />
            <span>Ada Long-Term Memory Manager (Consented)</span>
          </div>
          <button
            onClick={() => setShowMemoryModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Consent Banner */}
          <div className="p-4 rounded-2xl glass-panel-subtle border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-cyan-300 font-semibold uppercase">
                Memory Storage Consent
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Ada stores preferences and goals only with your active consent. Sensitive data (health, finances) is never stored without permission.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.memoryConsent}
              onChange={(e) => updateSettings({ memoryConsent: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories by keyword..."
                className="w-full bg-slate-900 border border-cyan-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl glass-panel-subtle text-slate-300 hover:text-white border border-cyan-500/20 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Export all memories to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Add New Memory Form */}
          <form onSubmit={handleAddMemory} className="p-4 rounded-2xl bg-slate-950/40 border border-cyan-500/20 space-y-3">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
              Teach Ada a New Fact / Preference
            </div>
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="bg-slate-900 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="goal">Goal</option>
                <option value="preference">Preference</option>
                <option value="fact">Fact</option>
                <option value="habit">Habit</option>
                <option value="person">Person</option>
              </select>
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="E.g., Prefers functional programming over OOP; working towards a master's degree..."
                className="flex-1 bg-slate-900 border border-cyan-500/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-40 transition-colors flex items-center gap-1 text-xs font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Memory Items List */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Saved Memories ({filteredMemories.length})
            </div>

            {filteredMemories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                No memories recorded. Add a memory above or talk with Ada.
              </div>
            ) : (
              filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    m.pinned
                      ? 'bg-cyan-950/20 border-cyan-500/40'
                      : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/20'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 uppercase">
                        {m.category}
                      </span>
                      {m.pinned && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-200">{m.content}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePin(m.id, m.pinned)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.pinned ? 'text-amber-400 hover:text-slate-400' : 'text-slate-500 hover:text-amber-400'
                      }`}
                      title={m.pinned ? 'Unpin' : 'Pin to high priority'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer with "Forget Everything" consent purge */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-slate-950/60 flex items-center justify-between">
          {showConfirmWipe ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400 font-mono">Wipe all memories permanently?</span>
              <button
                onClick={handleWipeAll}
                className="px-2.5 py-1 rounded-lg bg-red-500/30 text-red-300 border border-red-500/50 hover:bg-red-500/40 font-mono text-[11px]"
              >
                Yes, Forget Everything
              </button>
              <button
                onClick={() => setShowConfirmWipe(false)}
                className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmWipe(true)}
              className="text-xs font-mono text-red-400/80 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget Everything (Purge All Memories)</span>
            </button>
          )}

          <button
            onClick={() => setShowMemoryModal(false)}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 font-mono text-xs"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  )
}
