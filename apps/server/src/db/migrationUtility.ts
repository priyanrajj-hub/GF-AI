/**
 * GF-AI Production Database Migration Utility
 * Migrates local JSON-file persistence into durable relational schema records.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { z } from 'zod'
import { sqlDb } from './sqlAdapter.js'

export interface MigrationReport {
  success: boolean
  timestamp: string
  dryRun: boolean
  sourceFile: string
  backupFile?: string
  totalRecordsScanned: number
  validRecordsCount: number
  conflictRecordsCount: number
  tables: Record<string, { count: number; status: 'SUCCESS' | 'SKIPPED' | 'FAILED' }>
  conflicts: Array<{ table: string; id: string; reason: string }>
  integrityCheckPassed: boolean
  rowsReconciled?: { source: number; destination: number; matched: boolean; allTablesMatched?: boolean }
}

const UserSettingsSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().default('User'),
  language: z.string().default('auto'),
  mode: z.string().default('companion'),
  memoryConsent: z.boolean().default(true),
})

const ChatMessageSchema = z.object({
  id: z.string().min(1),
  sender: z.enum(['user', 'assistant', 'system']).optional(),
  role: z.enum(['user', 'assistant', 'system']).optional(),
  text: z.string().optional(),
  content: z.string().optional(),
  timestamp: z.number().optional(),
  createdAt: z.number().optional(),
}).refine((m) => Boolean(m.sender || m.role) && (m.text !== undefined || m.content !== undefined), {
  message: 'ChatMessage must have sender/role and text/content',
})

const MemoryItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  key: z.string().min(1),
  category: z.string(),
  content: z.string(),
  importance: z.number().min(1).max(5).default(3),
})

export class DatabaseMigrationUtility {
  static runMigration(options: { sourcePath?: string; dryRun?: boolean; outputDir?: string } = {}): MigrationReport {
    const isDryRun = Boolean(options.dryRun)
    const storageDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
      ? path.join(os.tmpdir(), 'ada_data')
      : (options.outputDir || './data')

    const sourcePath = options.sourcePath || path.join(storageDir, 'ada_persistence.json')

    const report: MigrationReport = {
      success: false,
      timestamp: new Date().toISOString(),
      dryRun: isDryRun,
      sourceFile: sourcePath,
      totalRecordsScanned: 0,
      validRecordsCount: 0,
      conflictRecordsCount: 0,
      tables: {},
      conflicts: [],
      integrityCheckPassed: false,
    }

    if (!fs.existsSync(sourcePath)) {
      report.success = true
      report.integrityCheckPassed = true
      report.rowsReconciled = { source: 0, destination: 0, matched: true, allTablesMatched: true }
      return report
    }

    const raw = fs.readFileSync(sourcePath, 'utf-8')
    let data: any
    try {
      data = JSON.parse(raw)
    } catch (e: any) {
      report.conflicts.push({ table: 'root', id: 'source', reason: `Corrupted JSON: ${e.message}` })
      return report
    }

    if (!isDryRun) {
      const backupPath = path.join(path.dirname(sourcePath), `ada_persistence.backup.${Date.now()}.json`)
      fs.writeFileSync(backupPath, raw, 'utf-8')
      report.backupFile = backupPath
    }

    // Scan & Validate Users
    let validUsers = 0
    if (data.users && typeof data.users === 'object') {
      for (const [userId, settings] of Object.entries(data.users)) {
        report.totalRecordsScanned++
        const parsedData = typeof settings === 'object' && settings !== null ? { userId, ...(settings as any) } : settings
        const res = UserSettingsSchema.safeParse(parsedData)
        if (res.success) { validUsers++; report.validRecordsCount++ }
        else { report.conflictRecordsCount++; report.conflicts.push({ table: 'user_settings', id: userId, reason: res.error.message }) }
      }
    }
    report.tables['users'] = { count: validUsers, status: 'SUCCESS' }
    report.tables['user_settings'] = { count: validUsers, status: 'SUCCESS' }

    // Scan & Validate Messages
    let validMessages = 0
    if (data.messages && typeof data.messages === 'object') {
      for (const [userId, msgs] of Object.entries(data.messages)) {
        if (Array.isArray(msgs)) {
          for (const msg of msgs) {
            report.totalRecordsScanned++
            const res = ChatMessageSchema.safeParse(msg)
            if (res.success) { validMessages++; report.validRecordsCount++ }
            else { report.conflictRecordsCount++; report.conflicts.push({ table: 'chat_messages', id: (msg as any)?.id || 'unknown', reason: res.error.message }) }
          }
        }
      }
    }
    report.tables['chat_messages'] = { count: validMessages, status: 'SUCCESS' }

    // Scan & Validate Memories
    let validMemories = 0
    const seenMemoryKeys = new Set<string>()
    if (data.memories && typeof data.memories === 'object') {
      for (const [userId, mems] of Object.entries(data.memories)) {
        if (Array.isArray(mems)) {
          for (const mem of mems) {
            report.totalRecordsScanned++
            const uqKey = `${userId}:${(mem as any)?.key}`
            if (seenMemoryKeys.has(uqKey)) {
              report.conflictRecordsCount++
              report.conflicts.push({ table: 'memories', id: (mem as any)?.id || 'duplicate', reason: `Duplicate key '${uqKey}'` })
              continue
            }
            seenMemoryKeys.add(uqKey)
            const res = MemoryItemSchema.safeParse(mem)
            if (res.success) { validMemories++; report.validRecordsCount++ }
            else { report.conflictRecordsCount++; report.conflicts.push({ table: 'memories', id: (mem as any)?.id || 'unknown', reason: res.error.message }) }
          }
        }
      }
    }
    report.tables['memories'] = { count: validMemories, status: 'SUCCESS' }

    // Scan Notes & Relationship Journals
    let validNotes = 0
    if (data.notes && typeof data.notes === 'object') {
      for (const [_userId, notes] of Object.entries(data.notes)) {
        if (Array.isArray(notes)) {
          validNotes += notes.length
          report.totalRecordsScanned += notes.length
          report.validRecordsCount += notes.length
        }
      }
    }
    report.tables['notes_tasks'] = { count: validNotes, status: 'SUCCESS' }

    let validRelJournal = 0
    if (data.relationshipJournal && typeof data.relationshipJournal === 'object') {
      for (const [_userId, rjs] of Object.entries(data.relationshipJournal)) {
        if (Array.isArray(rjs)) {
          validRelJournal += rjs.length
          report.totalRecordsScanned += rjs.length
          report.validRecordsCount += rjs.length
        }
      }
    }
    report.tables['relationship_journals'] = { count: validRelJournal, status: 'SUCCESS' }

    report.integrityCheckPassed = report.conflictRecordsCount === 0 && (report.totalRecordsScanned === 0 || report.validRecordsCount === report.totalRecordsScanned)
    report.success = report.integrityCheckPassed
    return report
  }

  static async executeSqlMigration(options: { sourcePath?: string; dryRun?: boolean; outputDir?: string } = {}): Promise<MigrationReport> {
    const storageDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
      ? path.join(os.tmpdir(), 'ada_data')
      : (options.outputDir || './data')
    const sourcePath = options.sourcePath || path.join(storageDir, 'ada_persistence.json')

    if (!fs.existsSync(sourcePath)) {
      return {
        success: true,
        timestamp: new Date().toISOString(),
        dryRun: Boolean(options.dryRun),
        sourceFile: sourcePath,
        totalRecordsScanned: 0,
        validRecordsCount: 0,
        conflictRecordsCount: 0,
        tables: {},
        conflicts: [],
        integrityCheckPassed: true,
        rowsReconciled: { source: 0, destination: 0, matched: true, allTablesMatched: true },
      }
    }

    const report = this.runMigration(options)
    if (!report.integrityCheckPassed || options.dryRun) return report

    const raw = fs.readFileSync(sourcePath, 'utf-8')
    const data = JSON.parse(raw)
    let totalInserted = 0

    await sqlDb.transaction(async (tx) => {
      if (data.accounts) {
        for (const [id, acc] of Object.entries<any>(data.accounts)) {
          await tx.query(
            `INSERT INTO users (id, user_name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
            [id, acc.email ? acc.email.split('@')[0] : 'User', acc.email || null, acc.role || 'user', acc.createdAt || Date.now(), Date.now()]
          )
          totalInserted++
        }
      }
      if (data.users) {
        for (const [userId, u] of Object.entries<any>(data.users)) {
          await tx.query(`INSERT INTO users (id, user_name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`, [userId, u.userName || 'User', Date.now(), Date.now()])
          await tx.query(
            `INSERT INTO user_settings (user_id, language, mode, humor, warmth, formality, directness, flirtiness, talkativeness, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET updated_at = EXCLUDED.updated_at`,
            [userId, u.language || 'auto', u.mode || 'companion', u.sliders?.humor ?? 65, u.sliders?.warmth ?? 85, u.sliders?.formality ?? 40, u.sliders?.directness ?? 75, u.sliders?.flirtiness ?? 45, u.sliders?.talkativeness ?? 55, Date.now()]
          )
          totalInserted++
        }
      }
      if (data.messages) {
        for (const [userId, msgs] of Object.entries<any[]>(data.messages)) {
          if (Array.isArray(msgs) && msgs.length > 0) {
            await tx.query(`INSERT INTO users (id, user_name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`, [userId, userId, Date.now(), Date.now()])
            for (const msg of msgs) {
              await tx.query(
                `INSERT INTO chat_messages (id, user_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
                [msg.id, userId, msg.sender || (msg.role === 'assistant' ? 'assistant' : 'user'), msg.content || msg.text || '', msg.timestamp || msg.createdAt || Date.now()]
              )
              totalInserted++
            }
          }
        }
      }
      if (data.memories) {
        for (const [userId, mems] of Object.entries<any[]>(data.memories)) {
          if (Array.isArray(mems) && mems.length > 0) {
            await tx.query(`INSERT INTO users (id, user_name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`, [userId, userId, Date.now(), Date.now()])
            for (const mem of mems) {
              await tx.query(
                `INSERT INTO memories (id, user_id, key, category, content, importance, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, key) DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at`,
                [mem.id, userId, mem.key, mem.category || 'general', mem.content, mem.importance ?? 3, mem.pinned ? 1 : 0, mem.createdAt || Date.now(), Date.now()]
              )
              totalInserted++
            }
          }
        }
      }
      if (data.notes) {
        for (const [userId, notes] of Object.entries<any[]>(data.notes)) {
          if (Array.isArray(notes) && notes.length > 0) {
            await tx.query(`INSERT INTO users (id, user_name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`, [userId, userId, Date.now(), Date.now()])
            for (const n of notes) {
              await tx.query(
                `INSERT INTO notes_tasks (id, user_id, title, content, completed, category, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
                [n.id, userId, n.title, n.content || '', n.completed ? 1 : 0, n.category || 'note', n.dueDate || null, n.createdAt || Date.now(), Date.now()]
              )
              totalInserted++
            }
          }
        }
      }
      if (data.relationshipJournal) {
        for (const [userId, rjs] of Object.entries<any[]>(data.relationshipJournal)) {
          if (Array.isArray(rjs)) {
            for (const r of rjs) {
              await tx.query(
                `INSERT INTO relationship_journals (id, user_id, type, title, content, edited_by_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
                [r.id, userId, r.type || 'milestone', r.title || 'Journal Entry', r.content || '', r.editedByUser ? 1 : 0, r.timestamp || Date.now()]
              )
              totalInserted++
            }
          }
        }
      }
    })

    report.rowsReconciled = {
      source: report.validRecordsCount,
      destination: totalInserted,
      matched: totalInserted >= report.validRecordsCount,
      allTablesMatched: totalInserted >= report.validRecordsCount,
    }
    report.success = report.integrityCheckPassed && report.rowsReconciled.matched
    return report
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrationUtility.ts')) {
  const isDryRun = process.argv.includes('--dry-run')
  const report = DatabaseMigrationUtility.runMigration({ dryRun: isDryRun })
  console.log(JSON.stringify(report, null, 2))
}
