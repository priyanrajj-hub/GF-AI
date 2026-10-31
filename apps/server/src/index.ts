import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import multer from 'multer'
import {
  type ChatMessage,
  type PersonalityMode,
  type PersonalitySliders,
  type StructuredReply,
} from '@ada/shared'
import { db } from './db/index.js'
import { authMiddleware, type AuthenticatedRequest } from './middleware/auth.js'
import { ProviderRegistry } from './providers/index.js'
import { ContextBuilder } from './services/contextBuilder.js'

dotenv.config()
ProviderRegistry.init()

const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== 'production'

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // allow 3D canvas and audio blobs in local development
    crossOriginEmbedderPolicy: false,
  })
)

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isDev || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, true) // permissive for local dev/preview
      }
    },
    credentials: true,
  })
)

// Rate limiting (120 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
})
app.use('/api/', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(authMiddleware)

// File upload setup for vision inspection
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// ==========================================
// 1. HEALTH & SYSTEM DIAGNOSTICS
// ==========================================
app.get('/api/health', (req, res) => {
  const authReq = req as AuthenticatedRequest
  res.json({
    status: 'online',
    system: 'Ada AI Companion Backend',
    version: '1.0.0',
    userId: authReq.userId,
    activeLLM: ProviderRegistry.getLLM().name,
    timestamp: Date.now(),
  })
})

// ==========================================
// 2. CHAT & LLM STREAMING
// ==========================================
app.post('/api/chat', async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const userId = authReq.userId
  const { message, mode, sliders, language, stream } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' })
  }

  const settings = db.getUserSettings(userId)
  const activeMode: PersonalityMode = mode || settings.mode || 'jarvis'
  const activeSliders: PersonalitySliders = sliders || settings.sliders

  const history = db.getMessages(userId, 20)

  // Save User message
  const userMsgObj: ChatMessage = {
    id: `msg-${Date.now()}-user`,
    role: 'user',
    content: message,
    timestamp: Date.now(),
  }
  db.addMessage(userId, userMsgObj)

  const llm = ProviderRegistry.getLLM()

  try {
    let reply: StructuredReply
    try {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        reply = await (llm.stream
          ? llm.stream(
              history,
              message,
              { mode: activeMode, sliders: activeSliders, userName: settings.userName, language },
              (chunk) => {
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
              }
            )
          : llm.generate(history, message, {
              mode: activeMode,
              sliders: activeSliders,
              userName: settings.userName,
              language,
            }))
      } else {
        reply = await llm.generate(history, message, {
          mode: activeMode,
          sliders: activeSliders,
          userName: settings.userName,
          language,
        })
      }
    } catch (llmErr) {
      console.warn('⚠️ [Primary LLM Failed, Falling back to MockLLMProvider]:', (llmErr as Error).message)
      const mockLLM = ProviderRegistry.getMockLLM()
      reply = await mockLLM.generate(history, message, {
        mode: activeMode,
        sliders: activeSliders,
        userName: settings.userName,
        language,
      })
      if (stream) {
        res.write(`data: ${JSON.stringify({ chunk: reply.display_text })}\n\n`)
      }
    }

    // Save Assistant response
    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)

    // Log Token Usage
    const promptTokens = ContextBuilder.estimateTokens(message)
    const completionTokens = ContextBuilder.estimateTokens(reply.display_text)
    db.logTokens(userId, {
      model: llm.name,
      promptTokens,
      completionTokens,
      costUsd: (promptTokens + completionTokens) * 0.000001,
    })

    if (stream) {
      res.write(`data: ${JSON.stringify({ complete: true, reply })}\n\n`)
      res.end()
    } else {
      res.json({ reply })
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('[Chat Error]', error)
    res.status(500).json({ error: error.message || 'Failed to process chat response' })
  }
})

// ==========================================
// 3. VISION & FILE INSPECTION
// ==========================================
app.post('/api/chat/vision', upload.single('file'), async (req, res) => {
  const { prompt = 'Explain and analyze this file/image in detail.' } = req.body
  const file = req.file

  if (!file) {
    return res.status(400).json({ error: 'No image or document file was uploaded' })
  }

  const vision = ProviderRegistry.getVision()
  try {
    const base64 = file.buffer.toString('base64')
    const analysis = await vision.analyzeImage(base64, file.mimetype, prompt)
    res.json({ analysis })
  } catch (err: unknown) {
    const error = err as Error
    res.status(500).json({ error: error.message || 'Vision inspection failed' })
  }
})

// ==========================================
// 4. SETTINGS & PROFILE
// ==========================================
app.get('/api/settings', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const settings = db.getUserSettings(authReq.userId)
  res.json({ settings })
})

app.post('/api/settings', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const updated = db.updateUserSettings(authReq.userId, req.body)
  res.json({ settings: updated })
})

// ==========================================
// 5. MESSAGES / HISTORY
// ==========================================
app.get('/api/messages', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const limit = parseInt(req.query.limit as string) || 50
  const messages = db.getMessages(authReq.userId, limit)
  res.json({ messages })
})

app.delete('/api/messages', (req, res) => {
  const authReq = req as AuthenticatedRequest
  db.clearMessages(authReq.userId)
  res.json({ success: true, message: 'Chat history cleared' })
})

// ==========================================
// 6. LONG-TERM MEMORY (CONSENTED MEMORY MANAGER)
// ==========================================
app.get('/api/memory', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const memories = db.getMemories(authReq.userId)
  res.json({ memories })
})

app.post('/api/memory', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const { key, category, content, importance, pinned } = req.body
  if (!content) return res.status(400).json({ error: 'Content is required' })

  const created = db.addMemory(authReq.userId, {
    key: key || 'user_fact',
    category: category || 'preference',
    content,
    importance: importance || 3,
    pinned: !!pinned,
  })
  res.json({ memory: created })
})

app.put('/api/memory/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateMemory(authReq.userId, req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Memory item not found' })
  res.json({ memory: updated })
})

app.delete('/api/memory/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteMemory(authReq.userId, req.params.id)
  res.json({ success: deleted })
})

app.delete('/api/memory', (req, res) => {
  const authReq = req as AuthenticatedRequest
  db.clearMemories(authReq.userId)
  res.json({ success: true, message: 'All memories cleared with user consent' })
})

// ==========================================
// 7. NOTES & TO-DOS
// ==========================================
app.get('/api/notes', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const notes = db.getNotes(authReq.userId)
  res.json({ notes })
})

app.post('/api/notes', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const { title, content, completed = false, category = 'todo', dueDate } = req.body
  if (!title) return res.status(400).json({ error: 'Title is required' })
  const newNote = db.addNote(authReq.userId, {
    title,
    content: content || '',
    completed,
    category,
    dueDate,
  })
  res.json({ note: newNote })
})

app.put('/api/notes/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateNote(authReq.userId, req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Note not found' })
  res.json({ note: updated })
})

app.delete('/api/notes/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteNote(authReq.userId, req.params.id)
  res.json({ success: deleted })
})

// ==========================================
// 8. MOOD JOURNAL
// ==========================================
app.get('/api/journal', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const entries = db.getJournal(authReq.userId)
  res.json({ entries })
})

app.post('/api/journal', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const { mood, notes, energyLevel = 3, tags = [] } = req.body
  if (!mood) return res.status(400).json({ error: 'Mood is required' })
  const created = db.addJournalEntry(authReq.userId, {
    mood,
    notes,
    energyLevel,
    tags,
  })
  res.json({ entry: created })
})

// ==========================================
// 9. AGENT TOOLS: WEB SEARCH & MEMES
// ==========================================
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string
  if (!query) return res.status(400).json({ error: 'Search query required' })
  const searchProvider = ProviderRegistry.getSearch()
  const results = await searchProvider.search(query)
  res.json({ results })
})

app.get('/api/memes', async (req, res) => {
  const topic = (req.query.topic as string) || 'developer'
  const mood = req.query.mood as string
  const memeProvider = ProviderRegistry.getMeme()
  const meme = await memeProvider.findMeme(topic, mood)
  res.json({ meme })
})

app.post('/api/memes/generate', async (req, res) => {
  const { templateId = 'standard', topText = '', bottomText = '' } = req.body
  const memeProvider = ProviderRegistry.getMeme()
  const meme = await memeProvider.generateMeme(templateId, topText, bottomText)
  res.json({ meme })
})

// ==========================================
// 10. MORNING BRIEFING & BUDGET
// ==========================================
app.get('/api/briefing', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const settings = db.getUserSettings(authReq.userId)
  const notes = db.getNotes(authReq.userId)
  const pendingTodos = notes.filter((n) => !n.completed)

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  res.json({
    briefing: {
      greeting: `Good morning, ${settings.userName}. Ada holo-systems synchronized.`,
      dateStr,
      weatherSummary: 'Optimal operational conditions. Clear skies ahead.',
      pendingTasksCount: pendingTodos.length,
      focusRecommendation: pendingTodos.length > 0 ? `Priority: ${pendingTodos[0].title}` : 'Ready for target planning.',
      motivationalQuote: '“Precision in execution creates effortless outcomes.”',
    },
  })
})

app.get('/api/budget', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const usage = db.getMonthTokenUsage(authReq.userId)
  const budget = ContextBuilder.checkBudget(authReq.userId)
  res.json({ usage, budget })
})

// Start server
app.listen(PORT, () => {
  console.log(`✨ [Ada Server] Live and listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})
