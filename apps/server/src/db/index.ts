import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'
import type {
  ChatMessage,
  MemoryItem,
  MoodJournalEntry,
  NoteItem,
  UserSettings,
} from '@ada/shared'
import { sqlDb } from './sqlAdapter.js'

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

export interface BackgroundJob {
  id: string
  userId: string
  jobType: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  scheduledFor: number
  executedAt?: number
  attempts: number
  maxAttempts: number
  errorMessage?: string
  payload?: any
  createdAt: number
}

export interface UserAccount {
  id: string
  email: string
  role: 'admin' | 'user' | 'guest'
  passwordHash?: string
  magicToken?: string
  magicTokenExpires?: number
  refreshToken?: string
  createdAt: number
  lastLoginAt: number
}

export interface RevokedTokenRecord {
  jti: string
  userId?: string
  expiresAt: number
  revokedAt: number
}

export interface RefreshTokenRecord {
  tokenHash: string
  userId: string
  familyId: string
  generation: number
  isRevoked: boolean
  expiresAt: number
  createdAt: number
}

export interface MagicLinkRecord {
  id: string
  email: string
  tokenHash: string
  failedAttempts: number
  lockoutUntil?: number
  expiresAt: number
  usedAt?: number
  createdAt: number
}

interface DatabaseSchema {
  accounts: Record<string, UserAccount>
  users: Record<string, UserSettings>
  messages: Record<string, ChatMessage[]>
  memories: Record<string, MemoryItem[]>
  notes: Record<string, NoteItem[]>
  journal: Record<string, MoodJournalEntry[]>
  relationshipJournal: Record<string, RelationshipJournalEntry[]>
  ragDocs: Record<string, RagDocChunk[]>
  backgroundJobs: BackgroundJob[]
  revokedTokens: Record<string, RevokedTokenRecord>
  refreshTokens: Record<string, RefreshTokenRecord>
  magicLinks: Record<string, MagicLinkRecord>
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
  private isMemoryOnly: boolean

  constructor(storageDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) ? path.join(os.tmpdir(), 'ada_data') : './data') {
    this.isMemoryOnly = storageDir === ':memory:'
    if (!this.isMemoryOnly) {
      try {
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true })
        }
      } catch (e) {
        console.warn('[DB] Storage dir creation bypassed (serverless environment):', e)
      }
      this.filePath = path.join(storageDir, 'ada_persistence.json')
    } else {
      this.filePath = ':memory:'
    }
    this.data = this.load()

    // Trigger async relational migration in background
    sqlDb.runMigrations().catch((err) => {
      console.warn('[DB] Relational background migration notice:', err.message)
    })
  }

  async init(): Promise<void> {
    await sqlDb.runMigrations()
  }

  async healthCheck(): Promise<boolean> {
    return sqlDb.healthCheck()
  }

  getEngine(): string {
    return sqlDb.getEngine()
  }

  async recordAuditEvent(event: {
    userId?: string
    ipAddress?: string
    eventType: string
    severity?: 'INFO' | 'WARN' | 'CRITICAL'
    details?: string
  }): Promise<void> {
    const id = `aud_${randomBytes(8).toString('hex')}`
    const now = Date.now()
    try {
      await sqlDb.query(
        `INSERT INTO audit_events (id, user_id, ip_address, event_type, severity, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, event.userId || null, event.ipAddress || '127.0.0.1', event.eventType, event.severity || 'INFO', event.details || '', now]
      )
    } catch (err: any) {
      console.warn('[DB] Failed to record audit event in SQL:', err.message)
    }
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        if (parsed.users) {
          for (const u of Object.values(parsed.users as Record<string, any>)) {
            if (!u.userName || u.userName === 'Operator' || u.userName === 'Partner') {
              u.userName = 'Demo User'
            }
          }
        }
        if (!Array.isArray(parsed.backgroundJobs)) parsed.backgroundJobs = []
        if (!parsed.accounts) parsed.accounts = {}
        if (!parsed.revokedTokens) parsed.revokedTokens = {}
        if (!parsed.refreshTokens) parsed.refreshTokens = {}
        if (!parsed.magicLinks) parsed.magicLinks = {}
        if (!Array.isArray(parsed.tokenLogs)) parsed.tokenLogs = []
        return parsed
      } catch (err) {
        console.warn('[DB] Could not parse existing DB file, starting fresh', err)
      }
    }
    return {
      accounts: {},
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
        ],
      },
      ragDocs: { 'default-user-1': [] },
      backgroundJobs: [],
      revokedTokens: {},
      refreshTokens: {},
      magicLinks: {},
      tokenLogs: [],
    }
  }

  private save(): void {
    if (this.isMemoryOnly) return
    try {
      const tempPath = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`
      const serialized = JSON.stringify(this.data, null, 2)
      fs.writeFileSync(tempPath, serialized, 'utf-8')
      fs.renameSync(tempPath, this.filePath)
    } catch (err) {
      console.error('[DB] Failed to persist data atomically:', err)
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

  // --- Real Account & Identity Management ---
  createAccount(email: string, role?: 'user' | 'admin', passwordHash?: string): UserAccount {
    const cleanEmail = email.toLowerCase().trim()
    // Admin role strictly derived from ADMIN_EMAILS environment variable
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const finalRole: 'user' | 'admin' = adminEmails.includes(cleanEmail) ? 'admin' : (role || 'user')
    const id = `usr_${randomBytes(8).toString('hex')}`

    const account: UserAccount = {
      id,
      email: cleanEmail,
      role: finalRole,
      passwordHash,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    }
    if (!this.data.accounts) this.data.accounts = {}
    this.data.accounts[id] = account
    if (!this.data.users[id]) {
      this.data.users[id] = { ...DEFAULT_SETTINGS, userId: id, userName: cleanEmail.split('@')[0] }
    }
    this.save()
    return account
  }

  getAccountByEmail(email: string): UserAccount | null {
    const cleanEmail = email.toLowerCase().trim()
    for (const acc of Object.values(this.data.accounts || {})) {
      if (acc.email === cleanEmail) return acc
    }
    return null
  }

  getAccountById(id: string): UserAccount | null {
    return this.data.accounts?.[id] || null
  }

  // --- Secure Magic Link Auth (SHA-256 Hashed, Single-Use, Brute-Force Lockout) ---
  saveMagicToken(email: string, rawToken: string, expiresAt: number): boolean {
    const cleanEmail = email.toLowerCase().trim()
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const id = `mlk_${randomBytes(8).toString('hex')}`

    // Check existing lockout state
    const existing = this.data.magicLinks?.[cleanEmail]
    if (existing && existing.lockoutUntil && Date.now() < existing.lockoutUntil) {
      return false // Currently locked out
    }

    if (!this.data.magicLinks) this.data.magicLinks = {}
    this.data.magicLinks[cleanEmail] = {
      id,
      email: cleanEmail,
      tokenHash,
      failedAttempts: 0,
      lockoutUntil: undefined,
      expiresAt,
      createdAt: Date.now(),
    }

    this.save()
    return true
  }

  verifyMagicToken(email: string, rawToken: string): UserAccount | null {
    const cleanEmail = email.toLowerCase().trim()
    const record = this.data.magicLinks?.[cleanEmail]
    if (!record) return null

    // 1. Check Brute-Force Lockout (15 min lockout after 5 failed attempts)
    if (record.lockoutUntil && Date.now() < record.lockoutUntil) {
      console.warn(`[Security Alert] Authentication blocked: email ${cleanEmail} is locked out until ${new Date(record.lockoutUntil).toISOString()}`)
      return null
    }

    // 2. Check Expiration
    if (Date.now() > record.expiresAt) {
      delete this.data.magicLinks[cleanEmail]
      this.save()
      return null
    }

    // 3. Constant-Time Hash Comparison
    const candidateHash = createHash('sha256').update(rawToken.trim()).digest('hex')
    const candBuf = Buffer.from(candidateHash)
    const storedBuf = Buffer.from(record.tokenHash)

    if (candBuf.length !== storedBuf.length || !timingSafeEqual(candBuf, storedBuf)) {
      record.failedAttempts = (record.failedAttempts || 0) + 1
      if (record.failedAttempts >= 5) {
        record.lockoutUntil = Date.now() + 15 * 60 * 1000 // 15-minute lockout
        console.warn(`[Security Alert] Email ${cleanEmail} exceeded 5 failed verification attempts. Locked for 15 minutes.`)
      }
      this.save()
      return null
    }

    // 4. Single-Use Check
    if (record.usedAt) {
      return null
    }
    record.usedAt = Date.now()
    record.failedAttempts = 0
    delete this.data.magicLinks[cleanEmail]

    // 5. Retrieve or create user account with strictly derived admin role
    let acc = this.getAccountByEmail(cleanEmail)
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin = adminEmails.includes(cleanEmail)

    if (!acc) {
      acc = this.createAccount(cleanEmail, isAdmin ? 'admin' : 'user')
    } else if (isAdmin && acc.role !== 'admin') {
      acc.role = 'admin'
    }

    acc.lastLoginAt = Date.now()
    this.save()
    return acc
  }

  isEmailLocked(email: string): boolean {
    const record = this.data.magicLinks?.[email.toLowerCase().trim()]
    return Boolean(record?.lockoutUntil && Date.now() < record.lockoutUntil)
  }

  // --- Cryptographic Token Revocation & Refresh Token Families ---
  revokeToken(jti: string, userId?: string, expiresAt?: number): void {
    if (!jti) return
    if (!this.data.revokedTokens) this.data.revokedTokens = {}
    this.data.revokedTokens[jti] = {
      jti,
      userId,
      expiresAt: expiresAt || Date.now() + 30 * 24 * 3600 * 1000,
      revokedAt: Date.now(),
    }
    this.save()
  }

  isTokenRevoked(jti: string): boolean {
    if (!jti) return true
    const rec = this.data.revokedTokens?.[jti]
    if (!rec) return false
    if (Date.now() > rec.expiresAt) {
      delete this.data.revokedTokens[jti]
      this.save()
      return false
    }
    return true
  }

  storeRefreshTokenFamily(
    rawToken: string,
    userId: string,
    familyId: string,
    generation: number,
    expiresAt: number
  ): void {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    if (!this.data.refreshTokens) this.data.refreshTokens = {}
    this.data.refreshTokens[tokenHash] = {
      tokenHash,
      userId,
      familyId,
      generation,
      isRevoked: false,
      expiresAt,
      createdAt: Date.now(),
    }
    this.save()

    // Persist directly to durable SQL database, ensuring user entity exists for foreign key constraint
    const now = Date.now()
    sqlDb
      .query(
        `INSERT INTO users (id, user_name, role, created_at, updated_at) VALUES (?, ?, 'user', ?, ?)
         ON CONFLICT (id) DO NOTHING`,
        [userId, userId, now, now]
      )
      .then(() => {
        return sqlDb.query(
          `INSERT INTO refresh_tokens (token_hash, user_id, family_id, generation, is_revoked, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (token_hash) DO UPDATE SET is_revoked = EXCLUDED.is_revoked`,
          [tokenHash, userId, familyId, generation, 0, expiresAt, now]
        )
      })
      .catch((err) => {
        console.warn('[DB] SQL storeRefreshTokenFamily notice:', err.message)
      })
  }

  getRefreshTokenRecord(rawToken: string): RefreshTokenRecord | null {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    return this.data.refreshTokens?.[tokenHash] || null
  }

  revokeRefreshToken(rawToken: string): void {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const rec = this.data.refreshTokens?.[tokenHash]
    if (rec) {
      rec.isRevoked = true
      this.save()
    }
    sqlDb.query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]).catch(() => {})
  }

  revokeRefreshTokenFamily(familyId: string): void {
    if (!familyId) return
    let changed = false
    for (const rec of Object.values(this.data.refreshTokens || {})) {
      if (rec.familyId === familyId) {
        rec.isRevoked = true
        changed = true
      }
    }
    if (changed) this.save()
    sqlDb.query('UPDATE refresh_tokens SET is_revoked = 1 WHERE family_id = ?', [familyId]).catch(() => {})
  }

  revokeUserRefreshTokens(userId: string): void {
    if (!userId) return
    let changed = false
    for (const rec of Object.values(this.data.refreshTokens || {})) {
      if (rec.userId === userId) {
        rec.isRevoked = true
        changed = true
      }
    }
    if (changed) this.save()
    sqlDb.query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [userId]).catch(() => {})
  }

  setRefreshToken(userId: string, refreshToken: string | null): void {
    const acc = this.data.accounts?.[userId]
    if (acc) {
      acc.refreshToken = refreshToken || undefined
      this.save()
    }
  }

  getRefreshToken(userId: string): string | null {
    return this.data.accounts?.[userId]?.refreshToken || null
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
    if (!this.data.tokenLogs) this.data.tokenLogs = []
    this.data.tokenLogs.push({
      userId,
      timestamp: Date.now(),
      ...log,
    })
    this.save()
  }

  getMonthTokenUsage(userId: string): { totalTokens: number; totalCostUsd: number; requestCount: number } {
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const logs = (this.data.tokenLogs || []).filter((l) => l.userId === userId && l.timestamp >= thirtyDaysAgo)
    const totalTokens = logs.reduce((acc, l) => acc + l.promptTokens + l.completionTokens, 0)
    const totalCostUsd = logs.reduce((acc, l) => acc + l.costUsd, 0)
    return { totalTokens, totalCostUsd, requestCount: logs.length }
  }

  // --- Relationship Journal ---
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

  // --- RAG Document Chunks ---
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

  // --- Transparency View ---
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

  // --- Consolidation & Decay ---
  consolidateAndDecay(userId: string): { deduplicatedCount: number; decayedCount: number } {
    const list = this.data.memories[userId] || []
    const now = Date.now()
    const thirtyDaysMs = 30 * 86400000

    let decayedCount = 0
    let deduplicatedCount = 0

    for (const mem of list) {
      if (!mem.pinned && now - mem.updatedAt > thirtyDaysMs) {
        if (mem.importance > 1) {
          mem.importance = Math.max(1, mem.importance - 1)
          mem.updatedAt = now
          decayedCount++
        }
      }
    }

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

  // --- Background Jobs ---
  enqueueBackgroundJob(job: Omit<BackgroundJob, 'id' | 'status' | 'attempts' | 'createdAt'>): BackgroundJob {
    if (!this.data.backgroundJobs) this.data.backgroundJobs = []
    const newJob: BackgroundJob = {
      ...job,
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING',
      attempts: 0,
      createdAt: Date.now(),
    }
    this.data.backgroundJobs.push(newJob)
    this.save()
    return newJob
  }

  getPendingBackgroundJobs(): BackgroundJob[] {
    const now = Date.now()
    return (this.data.backgroundJobs || []).filter(
      (j) => j.status === 'PENDING' && j.scheduledFor <= now && j.attempts < j.maxAttempts
    )
  }

  updateBackgroundJob(id: string, updates: Partial<BackgroundJob>): void {
    const job = (this.data.backgroundJobs || []).find((j) => j.id === id)
    if (job) {
      Object.assign(job, updates)
      this.save()
    }
  }

  getUserBackgroundJobs(userId: string): BackgroundJob[] {
    return (this.data.backgroundJobs || []).filter((j) => j.userId === userId)
  }

  /**
   * GDPR / CCPA Data Portability Export: Covers ALL user tables
   */
  exportUserData(userId: string): Record<string, any> {
    const acc = this.data.accounts?.[userId]
    const sanitizedAccount = acc ? { id: acc.id, email: acc.email, role: acc.role, createdAt: acc.createdAt, lastLoginAt: acc.lastLoginAt } : null

    return {
      userId,
      account: sanitizedAccount,
      userSettings: this.data.users[userId] || null,
      messages: this.data.messages[userId] || [],
      memories: this.data.memories[userId] || [],
      notes: this.data.notes[userId] || [],
      journal: this.data.journal[userId] || [],
      relationshipJournal: this.data.relationshipJournal[userId] || [],
      ragDocs: this.data.ragDocs[userId] || [],
      tokenLogs: (this.data.tokenLogs || []).filter((l) => l.userId === userId),
      backgroundJobs: (this.data.backgroundJobs || []).filter((j) => j.userId === userId),
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * GDPR / CCPA Right-To-Be-Forgotten: Strictly purges all user data across every table
   */
  deleteUserData(userId: string): { purged: boolean; recordsRemoved: number; sqlPromise?: Promise<void> } {
    let recordsRemoved = 0
    // Capture user email before account deletion for magic link purging
    const userEmail = this.data.accounts?.[userId]?.email

    if (this.data.accounts && this.data.accounts[userId]) {
      delete this.data.accounts[userId]
      recordsRemoved++
    }
    if (this.data.users[userId]) {
      delete this.data.users[userId]
      recordsRemoved++
    }
    if (this.data.messages[userId]) {
      recordsRemoved += this.data.messages[userId].length
      delete this.data.messages[userId]
    }
    if (this.data.memories[userId]) {
      recordsRemoved += this.data.memories[userId].length
      delete this.data.memories[userId]
    }
    if (this.data.notes[userId]) {
      recordsRemoved += this.data.notes[userId].length
      delete this.data.notes[userId]
    }
    if (this.data.journal[userId]) {
      recordsRemoved += this.data.journal[userId].length
      delete this.data.journal[userId]
    }
    if (this.data.relationshipJournal[userId]) {
      recordsRemoved += this.data.relationshipJournal[userId].length
      delete this.data.relationshipJournal[userId]
    }
    if (this.data.ragDocs[userId]) {
      recordsRemoved += this.data.ragDocs[userId].length
      delete this.data.ragDocs[userId]
    }
    if (this.data.backgroundJobs) {
      const remaining = this.data.backgroundJobs.filter((j) => j.userId !== userId)
      recordsRemoved += this.data.backgroundJobs.length - remaining.length
      this.data.backgroundJobs = remaining
    }
    if (this.data.tokenLogs) {
      const remaining = this.data.tokenLogs.filter((l) => l.userId !== userId)
      recordsRemoved += this.data.tokenLogs.length - remaining.length
      this.data.tokenLogs = remaining
    }
    if (this.data.refreshTokens) {
      for (const [hash, rec] of Object.entries(this.data.refreshTokens)) {
        if (rec.userId === userId) {
          delete this.data.refreshTokens[hash]
          recordsRemoved++
        }
      }
    }
    // P1 Requirement: Purge pending magic links keyed by user email
    if (userEmail && this.data.magicLinks?.[userEmail.toLowerCase().trim()]) {
      delete this.data.magicLinks[userEmail.toLowerCase().trim()]
      recordsRemoved++
    }
    // P1 Requirement: Purge revocation records associated with this user
    if (this.data.revokedTokens) {
      for (const [jti, rec] of Object.entries(this.data.revokedTokens)) {
        if (rec.userId === userId) {
          delete this.data.revokedTokens[jti]
          recordsRemoved++
        }
      }
    }

    this.save()

    // Durable SQL multi-table transactional cascade purge
    const sqlPromise = sqlDb
      .transaction(async (tx) => {
        if (userEmail) {
          await tx.query('DELETE FROM magic_links WHERE LOWER(email) = ?', [userEmail.toLowerCase().trim()])
        }
        await tx.query('DELETE FROM revoked_tokens WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM background_jobs WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM api_usage_costs WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM rag_document_chunks WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM relationship_journals WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM mood_journals WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM notes_tasks WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM memories WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM chat_messages WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM user_settings WHERE user_id = ?', [userId])
        await tx.query('DELETE FROM users WHERE id = ?', [userId])
      })
      .catch((err) => {
        console.warn('[DB] SQL user deletion notice:', err.message)
      })

    return { purged: true, recordsRemoved, sqlPromise }
  }
}

export const db = new AppDatabase()
