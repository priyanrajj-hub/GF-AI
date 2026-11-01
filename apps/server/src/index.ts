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
  MODEL_REGISTRY,
  PolicyEngine,
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

app.get('/api/providers/status', (_req, res) => {
  res.json(ProviderRegistry.getStatus())
})

// Model Registry Config & Licensing
app.get('/api/models/config', (_req, res) => {
  res.json({ registry: MODEL_REGISTRY })
})

// Private Mode Toggle (Zero cloud leakage)
app.post('/api/providers/private-mode', (req, res) => {
  const { enabled } = req.body
  const router = ProviderRegistry.getRouter()
  router.setPrivateMode(Boolean(enabled))
  res.json({ success: true, privateMode: router.getPrivateMode() })
})

// Router Usage & Cost/Token Stats
app.get('/api/providers/router-stats', (_req, res) => {
  res.json(ProviderRegistry.getRouter().getStats())
})

// Relationship Journal
app.get('/api/relationship-journal', (req, res) => {
  const authReq = req as AuthenticatedRequest
  res.json({ entries: db.getRelationshipJournal(authReq.userId) })
})

app.post('/api/relationship-journal', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const { type, title, content } = req.body
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' })
  const created = db.addRelationshipJournalEntry(authReq.userId, {
    type: type || 'shared_memory',
    title,
    content,
    editedByUser: false,
  })
  res.json({ entry: created })
})

app.put('/api/relationship-journal/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const updated = db.updateRelationshipJournalEntry(authReq.userId, req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Entry not found' })
  res.json({ entry: updated })
})

app.delete('/api/relationship-journal/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteRelationshipJournalEntry(authReq.userId, req.params.id)
  res.json({ success: deleted })
})

// "What do you know about me" Transparency View
app.get('/api/memory/transparency', (req, res) => {
  const authReq = req as AuthenticatedRequest
  res.json(db.getTransparencyReport(authReq.userId))
})

// Memory Consolidation & Decay
app.post('/api/memory/consolidate', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const result = db.consolidateAndDecay(authReq.userId)
  res.json({ success: true, result })
})

// RAG Documents with Source Citations
app.get('/api/memory/rag', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const q = (req.query.q as string) || ''
  const docs = db.searchRagDocs(authReq.userId, q)
  res.json({ docs })
})

app.post('/api/memory/rag', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const { docTitle, chunkText, sourceCitation } = req.body
  if (!docTitle || !chunkText) return res.status(400).json({ error: 'docTitle and chunkText are required' })
  const created = db.addRagDoc(authReq.userId, docTitle, chunkText, sourceCitation || 'Uploaded document')
  res.json({ doc: created })
})

app.delete('/api/memory/rag/:id', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const deleted = db.deleteRagDoc(authReq.userId, req.params.id)
  res.json({ success: deleted })
})

// Policy Engine Check
app.post('/api/permissions/policy/check', (req, res) => {
  const { integrationId, actionType, payloadDescription, sourceChannel } = req.body
  const decision = PolicyEngine.evaluateAction(integrationId, actionType, payloadDescription, sourceChannel)
  res.json({ decision })
})

// Master Killswitch: Pause All Integrations
app.post('/api/permissions/pause-all', (req, res) => {
  const { paused } = req.body
  PolicyEngine.setAllPaused(Boolean(paused))
  res.json({ allPaused: PolicyEngine.isAllPaused() })
})

// Permissions Audit Log
app.get('/api/permissions/audit', (_req, res) => {
  res.json({ auditLog: PolicyEngine.getAuditLog() })
})



// ==========================================
// 2. CHAT & LLM STREAMING
// ==========================================
app.post('/api/chat', async (req, res) => {
  const authReq = req as AuthenticatedRequest
  const userId = authReq.userId
  const { message, mode, sliders, language, stream, llmProvider, huggingfaceApiKey } = req.body

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' })
  }

  const settings = db.getUserSettings(userId)
  const activeMode: PersonalityMode = mode || settings.mode || 'companion'
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
  const genOptions = {
    mode: activeMode,
    sliders: activeSliders,
    userName: settings.userName,
    language,
    llmProvider: llmProvider || settings.llmProvider,
    huggingfaceApiKey: huggingfaceApiKey || settings.huggingfaceApiKey,
  }

  try {
    let reply: StructuredReply
    try {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        reply = await (llm.stream
          ? llm.stream(history, message, genOptions, (chunk) => {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
            })
          : llm.generate(history, message, genOptions))
      } else {
        reply = await llm.generate(history, message, genOptions)
      }
    } catch (llmErr) {
      console.warn('⚠️ [Primary LLM Failed, Falling back to MockLLMProvider]:', (llmErr as Error).message)
      const mockLLM = ProviderRegistry.getMockLLM()
      reply = await mockLLM.generate(history, message, genOptions)
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
// 3.5. NEURAL AI VOICE SYNTHESIS (GIRL VOICE)
// ==========================================
app.post('/api/tts', async (req, res) => {
  const {
    text,
    voice,
    provider = 'auto',
    elevenlabsApiKey,
    elevenlabsVoiceId,
    elevenlabsModelId,
  } = req.body

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS synthesis' })
  }

  // Check for ElevenLabs voice request (NOpBlnGInO9m6vDvFkFC or elevenlabs:*)
  const isElevenLabs =
    provider === 'elevenlabs' ||
    (voice &&
      (voice.startsWith('elevenlabs:') ||
        voice === 'NOpBlnGInO9m6vDvFkFC' ||
        voice === 'cgSgspJ2msm6clMCkdW9' ||
        voice.toLowerCase().includes('eleven')))

  const elevenVoiceId =
    elevenlabsVoiceId ||
    (voice && voice.startsWith('elevenlabs:')
      ? voice.replace(/^elevenlabs:/, '')
      : voice === 'NOpBlnGInO9m6vDvFkFC' || voice === 'cgSgspJ2msm6clMCkdW9'
      ? voice
      : process.env.ELEVENLABS_VOICE_ID || 'NOpBlnGInO9m6vDvFkFC')
  const elevenModel = elevenlabsModelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_v4'

  // Prebuilt female voices: 'Aoede' (sultry, confident, spy-chic) or 'Kore' (sweet, gentle girlfriend)
  const isHFVoice = voice && (voice.startsWith('hf:') || voice.includes('/') || voice.toLowerCase().includes('kokoro'))
  const cleanHFModel = isHFVoice ? voice.replace(/^hf:/, '') : 'hexgrad/Kokoro-82M'
  const geminiVoice = (voice === 'Kore' ? 'Kore' : 'Aoede') as 'Aoede' | 'Kore'

  // Try requested provider or fallback
  try {
    // 1. ElevenLabs Ultra-Realistic Expressive Girl Voice
    const elevenlabs = ProviderRegistry.getElevenLabs()
    if (isElevenLabs || (elevenlabsApiKey && elevenlabsApiKey.trim()) || (provider === 'auto' && elevenlabs.isConfigured())) {
      if (elevenlabs.isConfigured() || (elevenlabsApiKey && elevenlabsApiKey.trim())) {
        try {
          const result = await elevenlabs.generateTTS(text, elevenVoiceId, elevenModel, elevenlabsApiKey)
          return res.json({ ...result, provider: 'elevenlabs', voice: elevenVoiceId, model: elevenModel })
        } catch (elErr: any) {
          console.warn('[ElevenLabs TTS Failed, falling back to Gemini]:', elErr.message)
          if (provider === 'elevenlabs') {
            return res.status(502).json({ error: elErr.message || 'ElevenLabs synthesis failed' })
          }
        }
      }
    }

    // 2. Hugging Face
    if (provider === 'huggingface' || isHFVoice) {
      const hf = ProviderRegistry.getHuggingFace()
      if (hf.isConfigured()) {
        const result = await hf.generateTTS(text, cleanHFModel)
        return res.json({ ...result, provider: 'huggingface', model: cleanHFModel })
      }
    }

    // 3. Google Gemini Aoede/Kore neural voice
    const gemini = ProviderRegistry.getGemini()
    if (gemini.isConfigured()) {
      const result = await gemini.generateTTS(text, geminiVoice)
      return res.json({ ...result, provider: 'gemini', voice: geminiVoice })
    }

    // 4. Secondary fallback to Hugging Face
    const hf = ProviderRegistry.getHuggingFace()
    if (hf.isConfigured()) {
      const result = await hf.generateTTS(text, cleanHFModel)
      return res.json({ ...result, provider: 'huggingface', model: cleanHFModel })
    }

    return res.status(503).json({
      error: 'No TTS provider configured. Add ELEVENLABS_API_KEY, GEMINI_API_KEY, or HF_TOKEN in .env or settings.',
      availableProviders: {
        elevenlabs: elevenlabs.isConfigured() || Boolean(elevenlabsApiKey),
        gemini: gemini.isConfigured(),
        huggingface: hf.isConfigured(),
      },
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('[TTS Endpoint Error]', error.message)
    return res.status(500).json({ error: error.message || 'TTS generation failed' })
  }
})

// ==========================================
// 3.6. 3D AI GENERATION & MODEL STATUS
// ==========================================
app.get('/api/3d/status', (_req, res) => {
  res.json({
    activeModel: 'ada.vrm',
    supportedPipelines: [
      {
        id: 'vroid',
        name: 'VRoid Studio VRM 1.0 (Recommended)',
        type: 'local_file',
        description: 'Drop .vrm into public/models/ada.vrm for 100% rigged humanoid with MToon textures & high heels.',
        cost: 'Free',
        status: 'ready',
      },
      {
        id: 'triposr',
        name: 'Hugging Face TripoSR (stabilityai/TripoSR)',
        type: 'image_to_3d',
        description: 'Single-image fast 3D mesh reconstruction via Hugging Face inference.',
        cost: 'Free HF Token',
        configured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
      },
      {
        id: 'hunyuan3d',
        name: 'Tencent Hunyuan3D-1 / InstantMesh',
        type: 'text_to_3d',
        description: 'Multi-view 3D synthesis via Hugging Face Spaces.',
        cost: 'Free HF Token',
        configured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
      },
      {
        id: 'tripo3d',
        name: 'Tripo3D API',
        type: 'text_to_3d_rigged',
        description: 'Direct auto-rigged game-ready humanoid generation.',
        cost: 'Tripo API Key',
        configured: Boolean(process.env.TRIPO_API_KEY),
      },
    ],
  })
})

app.post('/api/3d/generate', async (req, res) => {
  const { prompt, imageUrl, pipeline = 'triposr' } = req.body

  if (!prompt && !imageUrl) {
    return res.status(400).json({ error: 'Either prompt or imageUrl is required for 3D generation' })
  }

  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
  if (!hfToken && pipeline !== 'vroid') {
    return res.status(401).json({
      error: 'Hugging Face Token (HF_TOKEN) is required for 3D AI generation.',
      hint: 'Get your free token at https://huggingface.co/settings/tokens and add HF_TOKEN to your .env file.',
    })
  }

  // Return instructions and queued job status
  res.json({
    status: 'queued',
    pipeline,
    prompt: prompt || 'Ada Wong spy outfit, red dress, black bob hair, high heels',
    message: `3D Generation requested via ${pipeline}. Processed with HF_TOKEN.`,
  })
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
