import fs from 'node:fs'
import path from 'node:path'
import type {
  ChatMessage,
  MemoryItem,
  MoodJournalEntry,
  NoteItem,
  UserSettings,
} from '@ada/shared'

interface DatabaseSchema {
  users: Record<string, UserSettings>
  messages: Record<string, ChatMessage[]>
  memories: Record<string, MemoryItem[]>
  notes: Record<string, NoteItem[]>
  journal: Record<string, MoodJournalEntry[]>
  tokenLogs: Array<{
    userId: string
    timestamp: number
    model: string
    promptTokens: number
    completionTokens: number
    costUsd: number
  }>
}

const DEFAULT_SETTINGS: UserSettings = {
  userId: 'default-user-1',
  userName: 'Operator',
  language: 'auto',
  mode: 'jarvis',
  sliders: {
    humor: 65,
    warmth: 80,
    formality: 45,
    directness: 75,
    flirtiness: 30, // mild default
    talkativeness: 50,
  },
  hologramColor: '#00f3ff',
  solidRendering: false,
  avatarModelUrl: '/models/ada.vrm',
  handsFree: false,
  wakeWordEnabled: true,
  memoryConsent: true,
  cameraConsent: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  dailyProactiveCap: 3,
  lowPerformanceMode: false,
  soundVolume: 0.85,
}

export class AppDatabase {
  private filePath: string
  private data: DatabaseSchema

  constructor(storageDir = './data') {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }
    this.filePath = path.join(storageDir, 'ada_persistence.json')
    this.data = this.load()
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        return JSON.parse(raw)
      } catch (err) {
        console.warn('[DB] Could not parse existing DB file, starting fresh', err)
      }
    }
    return {
      users: { 'default-user-1': DEFAULT_SETTINGS },
      messages: { 'default-user-1': [] },
      memories: {
        'default-user-1': [
          {
            id: 'mem-1',
            userId: 'default-user-1',
            key: 'companion_bond',
            category: 'fact',
            content: 'Knows Ada is an original AI companion with a spy-chic aesthetic and Jarvis-level intellect.',
            importance: 5,
            pinned: true,
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000,
          },
          {
            id: 'mem-2',
            userId: 'default-user-1',
            key: 'primary_goal',
            category: 'goal',
            content: 'Building ambitious software projects and maintaining high focus with healthy life balance.',
            importance: 4,
            pinned: false,
            createdAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000,
          },
        ],
      },
      notes: {
        'default-user-1': [
          {
            id: 'note-1',
            userId: 'default-user-1',
            title: 'Welcome to Ada System',
            content: 'Voice and 3D Holographic AI Companion ready for research, coding, and day-to-day focus.',
            completed: false,
            category: 'note',
            createdAt: Date.now(),
          },
        ],
      },
      journal: { 'default-user-1': [] },
      tokenLogs: [],
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('[DB] Failed to persist data', err)
    }
  }

  // --- Users & Settings ---
  getUserSettings(userId: string): UserSettings {
    if (!this.data.users[userId]) {
      this.data.users[userId] = { ...DEFAULT_SETTINGS, userId }
      this.save()
    }
    return this.data.users[userId]
  }

  updateUserSettings(userId: string, partial: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings(userId)
    this.data.users[userId] = { ...current, ...partial, userId }
    this.save()
    return this.data.users[userId]
  }

  // --- Messages & Rolling Context ---
  getMessages(userId: string, limit = 50): ChatMessage[] {
    const list = this.data.messages[userId] || []
    return list.slice(-limit)
  }

  addMessage(userId: string, message: ChatMessage): void {
    if (!this.data.messages[userId]) {
      this.data.messages[userId] = []
    }
    this.data.messages[userId].push(message)
    // keep rolling conversation within 150 turns
    if (this.data.messages[userId].length > 150) {
      this.data.messages[userId] = this.data.messages[userId].slice(-100)
    }
    this.save()
  }

  clearMessages(userId: string): void {
    this.data.messages[userId] = []
    this.save()
  }

  // --- Memories (Consented Long-Term Memory) ---
  getMemories(userId: string): MemoryItem[] {
    return this.data.memories[userId] || []
  }

  addMemory(userId: string, item: Omit<MemoryItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): MemoryItem {
    if (!this.data.memories[userId]) {
      this.data.memories[userId] = []
    }
    const fullItem: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.data.memories[userId].push(fullItem)
    this.save()
    return fullItem
  }

  updateMemory(userId: string, id: string, partial: Partial<MemoryItem>): MemoryItem | null {
    const list = this.data.memories[userId] || []
    const idx = list.findIndex((m) => m.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...partial, updatedAt: Date.now() }
    this.save()
    return list[idx]
  }

  deleteMemory(userId: string, id: string): boolean {
    const list = this.data.memories[userId] || []
    const filtered = list.filter((m) => m.id !== id)
    const changed = filtered.length !== list.length
    this.data.memories[userId] = filtered
    if (changed) this.save()
    return changed
  }

  clearMemories(userId: string): void {
    this.data.memories[userId] = []
    this.save()
  }

  // --- Notes & To-Dos ---
  getNotes(userId: string): NoteItem[] {
    return this.data.notes[userId] || []
  }

  addNote(userId: string, item: Omit<NoteItem, 'id' | 'userId' | 'createdAt'>): NoteItem {
    if (!this.data.notes[userId]) this.data.notes[userId] = []
    const newNote: NoteItem = {
      ...item,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: Date.now(),
    }
    this.data.notes[userId].unshift(newNote)
    this.save()
    return newNote
  }

  updateNote(userId: string, id: string, partial: Partial<NoteItem>): NoteItem | null {
    const list = this.data.notes[userId] || []
    const idx = list.findIndex((n) => n.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...partial }
    this.save()
    return list[idx]
  }

  deleteNote(userId: string, id: string): boolean {
    const list = this.data.notes[userId] || []
    const filtered = list.filter((n) => n.id !== id)
    const changed = filtered.length !== list.length
    this.data.notes[userId] = filtered
    if (changed) this.save()
    return changed
  }

  // --- Mood Journal ---
  getJournal(userId: string): MoodJournalEntry[] {
    return this.data.journal[userId] || []
  }

  addJournalEntry(userId: string, entry: Omit<MoodJournalEntry, 'id' | 'userId' | 'createdAt'>): MoodJournalEntry {
    if (!this.data.journal[userId]) this.data.journal[userId] = []
    const newEntry: MoodJournalEntry = {
      ...entry,
      id: `jrn-${Date.now()}`,
      userId,
      createdAt: Date.now(),
    }
    this.data.journal[userId].unshift(newEntry)
    this.save()
    return newEntry
  }

  // --- Token & Budget Logging ---
  logTokens(userId: string, log: { model: string; promptTokens: number; completionTokens: number; costUsd: number }): void {
    this.data.tokenLogs.push({
      userId,
      timestamp: Date.now(),
      ...log,
    })
    this.save()
  }

  getMonthTokenUsage(userId: string): { totalTokens: number; totalCostUsd: number; requestCount: number } {
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const logs = this.data.tokenLogs.filter((l) => l.userId === userId && l.timestamp >= thirtyDaysAgo)
    const totalTokens = logs.reduce((acc, l) => acc + l.promptTokens + l.completionTokens, 0)
    const totalCostUsd = logs.reduce((acc, l) => acc + l.costUsd, 0)
    return { totalTokens, totalCostUsd, requestCount: logs.length }
  }
}

export const db = new AppDatabase()
