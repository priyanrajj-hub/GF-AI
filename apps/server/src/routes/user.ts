import { Router, type Request, type Response } from 'express'
import { db } from '../db/index.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { UserLifeMemoryService } from '../services/userLifeMemoryService.js'
import { RelationshipGrowthService } from '../services/relationshipGrowthService.js'
import { AdaSelfKnowledgeService } from '../services/adaSelfKnowledgeService.js'
import { GirlBehaviorService } from '../services/girlBehaviorService.js'
import { WebScraperService } from '../services/webScraperService.js'

export const userRouter = Router()

// GDPR Data Export
userRouter.get('/api/user/data/export', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const data = db.exportUserData(authReq.userId)
  return res.json({ success: true, exportedAt: new Date().toISOString(), data })
})

// GDPR Data Purge / Right-to-be-forgotten
userRouter.delete('/api/user/data', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  db.deleteUserData(authReq.userId)
  return res.json({ success: true, message: 'All personal and operational data permanently deleted.' })
})

userRouter.get('/api/user/life-profile', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  return res.json({
    bio: UserLifeMemoryService.getBio(),
    memories: db.getMemories(authReq.userId),
    journal: db.getRelationshipJournal(authReq.userId),
  })
})

// Relationship Wisdom & Intimacy Insights
userRouter.get('/api/relationship/insights', (_req: Request, res: Response) => {
  res.json({ insights: RelationshipGrowthService.getRelationshipInsights() })
})

// Personal Growth & Mindset Goals
userRouter.get('/api/relationship/growth-goals', (_req: Request, res: Response) => {
  res.json({ goals: RelationshipGrowthService.getGrowthFrameworks() })
})

// Ada Self-Knowledge & Identity Profile
userRouter.get('/api/ada/self-profile', (_req: Request, res: Response) => {
  res.json({ profile: AdaSelfKnowledgeService.getProfile() })
})

// Real Girl Activities & Current Routine Phase
userRouter.get('/api/ada/girl-activities', (_req: Request, res: Response) => {
  res.json({
    currentPhase: GirlBehaviorService.getCurrentPhaseActivity(),
    allActivities: GirlBehaviorService.getAllActivities(),
  })
})

// Settings
userRouter.get('/api/settings', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const settings = db.getUserSettings(authReq.userId)
  return res.json(settings)
})

userRouter.post('/api/settings', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateUserSettings(authReq.userId, req.body || {})
  return res.json(updated)
})

// Messages
userRouter.get('/api/messages', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const messages = db.getMessages(authReq.userId)
  return res.json({ messages })
})

userRouter.delete('/api/messages', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  db.clearMessages(authReq.userId)
  return res.json({ success: true })
})

// Memory Management
userRouter.get('/api/memory', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const memories = db.getMemories(authReq.userId)
  return res.json({ memories })
})

userRouter.post('/api/memory', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { key, category, content, importance, pinned, source } = req.body || {}
  if (!key || !content) {
    return res.status(400).json({ error: 'Key and content are required' })
  }
  const memory = db.addMemory(authReq.userId, {
    key,
    category: category || 'fact',
    content,
    importance: importance || 3,
    pinned: Boolean(pinned),
    source: source || 'user',
  })
  return res.json({ memory })
})

userRouter.put('/api/memory/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateMemory(authReq.userId, String(req.params.id), req.body || {})
  if (!updated) return res.status(404).json({ error: 'Memory item not found' })
  return res.json({ memory: updated })
})

userRouter.delete('/api/memory/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteMemory(authReq.userId, String(req.params.id))
  return res.json({ success: deleted })
})

userRouter.delete('/api/memory/source/:source', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const count = db.deleteMemoriesBySource(authReq.userId, String(req.params.source))
  return res.json({ success: true, count })
})

userRouter.post('/api/memory/preview-link', requireAuth, async (req: Request, res: Response) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })
  try {
    const scraped = await WebScraperService.extractPage(url)
    const previewFacts: string[] = []
    if (scraped?.title) previewFacts.push(`Title: ${scraped.title}`)
    if (scraped?.description) previewFacts.push(`Description: ${scraped.description.slice(0, 160)}`)
    else if (scraped?.mainContent) previewFacts.push(`Overview: ${scraped.mainContent.slice(0, 160)}`)
    return res.json({ url, title: scraped?.title || 'Web Document', previewFacts })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to preview link' })
  }
})

userRouter.post('/api/memory/approve-link-facts', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { url, facts } = req.body
  if (!facts || !Array.isArray(facts)) return res.status(400).json({ error: 'Facts array is required' })
  const added = facts.map((fact: string) => {
    return db.addMemory(authReq.userId, {
      key: 'link_fact',
      category: 'fact',
      content: fact,
      importance: 3,
      pinned: false,
      source: url || 'web_link',
    })
  })
  return res.json({ success: true, count: added.length, memories: added })
})

userRouter.delete('/api/memory', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  db.clearMemories(authReq.userId)
  return res.json({ success: true, message: 'All memories cleared with user consent' })
})

// Memory Transparency
userRouter.get('/api/memory/transparency', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  res.json(db.getTransparencyReport(authReq.userId))
})

// Memory Consolidation
userRouter.post('/api/memory/consolidate', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const result = db.consolidateAndDecay(authReq.userId)
  res.json({ success: true, result })
})

// RAG Documents with Source Citations
userRouter.get('/api/memory/rag', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const q = (req.query.q as string) || ''
  const docs = db.searchRagDocs(authReq.userId, q)
  res.json({ docs })
})

userRouter.post('/api/memory/rag', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { docTitle, chunkText, sourceCitation } = req.body
  if (!docTitle || !chunkText) return res.status(400).json({ error: 'docTitle and chunkText are required' })
  const created = db.addRagDoc(authReq.userId, docTitle, chunkText, sourceCitation || 'Uploaded document')
  res.json({ doc: created })
})

userRouter.delete('/api/memory/rag/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteRagDoc(authReq.userId, String(req.params.id))
  res.json({ success: deleted })
})

// Notes
userRouter.get('/api/notes', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const notes = db.getNotes(authReq.userId)
  return res.json({ notes })
})

userRouter.post('/api/notes', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { title, content, category } = req.body || {}
  const note = db.addNote(authReq.userId, {
    title: title || 'Untitled Note',
    content: content || '',
    category: category || 'general',
    completed: false,
  })
  return res.json({ note })
})

userRouter.put('/api/notes/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateNote(authReq.userId, String(req.params.id), req.body || {})
  return res.json({ note: updated })
})

userRouter.delete('/api/notes/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteNote(authReq.userId, String(req.params.id))
  return res.json({ success: deleted })
})

// Journal
userRouter.get('/api/journal', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const journal = db.getJournal(authReq.userId)
  return res.json({ journal })
})

userRouter.post('/api/journal', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { mood, reflection, notes, energyLevel, tags, gratitude } = req.body || {}
  const entry = db.addJournalEntry(authReq.userId, {
    mood: (mood as any) || 'neutral',
    notes: reflection || notes || '',
    energyLevel: energyLevel || 3,
    tags: tags || gratitude || [],
  })
  return res.json({ entry })
})

// Relationship Journal
userRouter.get('/api/relationship-journal', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const entries = db.getRelationshipJournal(authReq.userId)
  return res.json({ entries })
})

userRouter.post('/api/relationship-journal', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const { type, title, content } = req.body || {}
  const entry = db.addRelationshipJournalEntry(authReq.userId, {
    type: type || 'shared_memory',
    title: title || 'Journal Entry',
    content: content || '',
    editedByUser: true,
  })
  return res.json({ entry })
})

userRouter.put('/api/relationship-journal/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateRelationshipJournalEntry(authReq.userId, String(req.params.id), req.body || {})
  return res.json({ entry: updated })
})

userRouter.delete('/api/relationship-journal/:id', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteRelationshipJournalEntry(authReq.userId, String(req.params.id))
  return res.json({ success: deleted })
})

// Budget
userRouter.get('/api/budget', requireAuth, (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest
  const usage = db.getMonthTokenUsage(authReq.userId)
  return res.json({
    summary: {
      monthlyBudget: 50000,
      totalSpent: 31200,
      savingsRate: 37.6,
      currency: 'INR',
    },
    usage,
  })
})
