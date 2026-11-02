import fs from 'node:fs'
import path from 'node:path'
import type {
  ChatMessage,
  MemoryItem,
  MoodJournalEntry,
  NoteItem,
  UserSettings,
} from '@ada/shared'

export interface RelationshipJournalEntry {
  id: string
  userId: string
  type: 'shared_joke' | 'user_preference' | 'milestone' | 'shared_memory'
  title: string
  content: string
  timestamp: number
  editedByUser: boolean
}

export interface RagDocChunk {
  id: string
  userId: string
  docTitle: string
  chunkText: string
  sourceCitation: string
  createdAt: number
}

interface DatabaseSchema {
  users: Record<string, UserSettings>
  messages: Record<string, ChatMessage[]>
  memories: Record<string, MemoryItem[]>
  notes: Record<string, NoteItem[]>
  journal: Record<string, MoodJournalEntry[]>
  relationshipJournal: Record<string, RelationshipJournalEntry[]>
  ragDocs: Record<string, RagDocChunk[]>
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
  userName: 'Demo User',
  language: 'auto',
  mode: 'companion',
  sliders: {
    humor: 65,
    warmth: 85,
    formality: 40,
    directness: 75,
    flirtiness: 45,
    talkativeness: 55,
  },
  hologramColor: '#00f3ff',
  renderMode: 'holo-lite',
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
        const parsed = JSON.parse(raw)
        // Normalize any legacy Operator/Partner usernames
        if (parsed.users) {
          for (const u of Object.values(parsed.users as Record<string, any>)) {
            if (!u.userName || u.userName === 'Operator' || u.userName === 'Partner') {
              u.userName = 'Demo User'
            }
          }
        }
        return parsed
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
      relationshipJournal: {
        'default-user-1': [
          {
            id: 'rj-1',
            userId: 'default-user-1',
            type: 'milestone',
            title: 'First Holographic Activation',
            content: 'Activated Ada Hologram v0.8 with 42 personalities and multi-tier model stack.',
            timestamp: Date.now() - 3600000,
            editedByUser: false,
          },
          {
            id: 'rj-2',
            userId: 'default-user-1',
            type: 'shared_joke',
            title: 'Tea vs Coffee Protocol',
            content: 'Ada knows the user loves a warm cup of chai or coffee first thing in the morning.',
            timestamp: Date.now() - 1800000,
            editedByUser: false,
          },
        ],
      },
      ragDocs: { 'default-user-1': [] },
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
    const currentName = this.data.users[userId].userName
    if (!currentName || currentName === 'Operator' || currentName === 'Partner') {
      this.data.users[userId].userName = 'Demo User'
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

  deleteMemoriesBySource(userId: string, source: string): number {
    const list = this.data.memories[userId] || []
    const filtered = list.filter((m) => (m.source || 'conversation') !== source)
    const removedCount = list.length - filtered.length
    this.data.memories[userId] = filtered
    if (removedCount > 0) this.save()
    return removedCount
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

  // --- Relationship Journal (Milestones, shared jokes, preferences) ---
  getRelationshipJournal(userId: string): RelationshipJournalEntry[] {
    return this.data.relationshipJournal?.[userId] || []
  }

  addRelationshipJournalEntry(
    userId: string,
    entry: Omit<RelationshipJournalEntry, 'id' | 'userId' | 'timestamp'>
  ): RelationshipJournalEntry {
    if (!this.data.relationshipJournal) this.data.relationshipJournal = {}
    if (!this.data.relationshipJournal[userId]) this.data.relationshipJournal[userId] = []
    const newEntry: RelationshipJournalEntry = {
      ...entry,
      id: `rj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      timestamp: Date.now(),
    }
    this.data.relationshipJournal[userId].unshift(newEntry)
    this.save()
    return newEntry
  }

  updateRelationshipJournalEntry(
    userId: string,
    id: string,
    partial: Partial<RelationshipJournalEntry>
  ): RelationshipJournalEntry | null {
    const list = this.data.relationshipJournal?.[userId] || []
    const idx = list.findIndex((e) => e.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...partial, editedByUser: true }
    this.save()
    return list[idx]
  }

  deleteRelationshipJournalEntry(userId: string, id: string): boolean {
    const list = this.data.relationshipJournal?.[userId] || []
    const filtered = list.filter((e) => e.id !== id)
    const changed = filtered.length !== list.length
    if (!this.data.relationshipJournal) this.data.relationshipJournal = {}
    this.data.relationshipJournal[userId] = filtered
    if (changed) this.save()
    return changed
  }

  // --- RAG Document Chunks & Source Citations ---
  addRagDoc(userId: string, docTitle: string, chunkText: string, sourceCitation: string): RagDocChunk {
    if (!this.data.ragDocs) this.data.ragDocs = {}
    if (!this.data.ragDocs[userId]) this.data.ragDocs[userId] = []
    const chunk: RagDocChunk = {
      id: `rag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      docTitle,
      chunkText,
      sourceCitation,
      createdAt: Date.now(),
    }
    this.data.ragDocs[userId].push(chunk)
    this.save()
    return chunk
  }

  searchRagDocs(userId: string, query: string, topK: number = 3): RagDocChunk[] {
    const list = this.data.ragDocs?.[userId] || []
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    if (queryWords.length === 0) return list.slice(0, topK)

    const scored = list.map((doc) => {
      const textLower = (doc.docTitle + ' ' + doc.chunkText).toLowerCase()
      let score = 0
      for (const w of queryWords) {
        if (textLower.includes(w)) score += 1
      }
      return { doc, score }
    })

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.doc)
  }

  deleteRagDoc(userId: string, id: string): boolean {
    const list = this.data.ragDocs?.[userId] || []
    const filtered = list.filter((d) => d.id !== id)
    const changed = filtered.length !== list.length
    if (!this.data.ragDocs) this.data.ragDocs = {}
    this.data.ragDocs[userId] = filtered
    if (changed) this.save()
    return changed
  }

  // --- "What do you know about me" Transparency View ---
  getTransparencyReport(userId: string) {
    const user = this.getUserSettings(userId)
    const memories = this.getMemories(userId)
    const journalEntries = this.getRelationshipJournal(userId)
    const ragDocs = this.data.ragDocs?.[userId] || []
    const notes = this.getNotes(userId)

    return {
      userName: user.userName,
      mode: user.mode,
      memoriesCount: memories.length,
      memories: memories.map((m) => ({ id: m.id, key: m.key, content: m.content, pinned: m.pinned, importance: m.importance })),
      relationshipMilestones: journalEntries.map((j) => ({ id: j.id, type: j.type, title: j.title, content: j.content })),
      documentsIndexed: ragDocs.map((d) => ({ id: d.id, title: d.docTitle, citation: d.sourceCitation })),
      notesCount: notes.length,
    }
  }

  // --- Nightly Consolidation & Memory Decay ---
  consolidateAndDecay(userId: string): { deduplicatedCount: number; decayedCount: number } {
    const list = this.data.memories[userId] || []
    const now = Date.now()
    const thirtyDaysMs = 30 * 86400000

    let decayedCount = 0
    let deduplicatedCount = 0

    // 1. Decay unpinned memories older than 30 days
    for (const mem of list) {
      if (!mem.pinned && now - mem.updatedAt > thirtyDaysMs) {
        if (mem.importance > 1) {
          mem.importance = Math.max(1, mem.importance - 1)
          mem.updatedAt = now
          decayedCount++
        }
      }
    }

    // 2. Simple deduplication by key
    const seenKeys = new Set<string>()
    const deduped: MemoryItem[] = []
    for (const mem of list) {
      if (!seenKeys.has(mem.key)) {
        seenKeys.add(mem.key)
        deduped.push(mem)
      } else {
        deduplicatedCount++
      }
    }

    this.data.memories[userId] = deduped
    this.save()
    return { deduplicatedCount, decayedCount }
  }
}

export const db = new AppDatabase()
