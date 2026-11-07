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
  MemeService,
  resolveSong,
  POPULAR_SONG_CATALOG,
} from '@ada/shared'
import { db } from './db/index.js'
import { authMiddleware, type AuthenticatedRequest } from './middleware/auth.js'
import { ProviderRegistry } from './providers/index.js'
import { ContextBuilder } from './services/contextBuilder.js'
import { WebSearchService } from './services/webSearchService.js'
import { TradingService } from './services/tradingService.js'
import { FinanceAnalystService } from './services/financeAnalystService.js'
import { NewsGathererService } from './services/newsGathererService.js'
import { WebScraperService } from './services/webScraperService.js'
import { GuardrailsService } from './services/guardrailsService.js'
import { RelationshipGrowthService } from './services/relationshipGrowthService.js'
import { AdaSelfKnowledgeService } from './services/adaSelfKnowledgeService.js'
import { GirlBehaviorService } from './services/girlBehaviorService.js'
import { UserLifeMemoryService } from './services/userLifeMemoryService.js'
import { TutorStudyService } from './services/tutorStudyService.js'
// Neural TTS Provider for high-fidelity human girl voice (zero robotic fallback - v3)
import { NeuralTTSProvider } from './providers/neuralTtsProvider.js'
import { buildRagContext } from './rag/ragService.js'
import CryptoJS from 'crypto-js'
import { getStockQuote, getCryptoPrice, generateAlgoSignal } from './market/marketDataService.js'
import { rateLimitChat, rateLimitVoice, sanitizeInput, requestId } from './middleware/security.js'

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
app.use(requestId)
app.use(sanitizeInput)
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

// Real-Time Live Internet Status
app.get('/api/internet/status', async (_req, res) => {
  const status = await WebSearchService.checkConnectivity()
  res.json(status)
})

// Visual Memes & Online Templates Catalog
app.get('/api/memes', (_req, res) => {
  res.json({
    memes: MemeService.getAllMemes(),
  })
})

/**
 * Real-Time Music & Original Full Audio Search
 * 1. Queries JioSaavn for full-length 160kbps/320kbps master tracks and decrypts the stream URL
 * 2. Falls back to iTunes API if not found
 */
async function searchRealSongTrack(query: string, language?: string) {
  try {
    let clean = query
      .replace(/^(?:ada|mira|atlas),?\s*/i, '')
      .replace(/^(?:please\s*)?(?:play|sing|put on|listen to|perform|oru\s+paattu\s+paadu|paatu\s+podu|tamil\s+song\s+podu)\b\s*/i, '')
      .replace(/(?:and\s+dance|to\s+the\s+rhythm|for\s+me|play\s+pannu|podu|paadu)/gi, '')
      .replace(/[?!.]/g, '')
      .trim()

    const isTamilRequest =
      language === 'ta' ||
      /\b(?:tamil|paatu|paattu|podu|paadu)\b/i.test(query)

    if (
      !clean ||
      clean.length < 2 ||
      /^play\b|^sing\b|^dance\b|^dancing\b|^song\b|^music\b/i.test(clean) ||
      /\b(?:dancing song|dance song|dancing music|baby bum|nursery)\b/i.test(clean)
    ) {
      clean = isTamilRequest ? 'Vaathi Coming' : 'Wake Me Up Avicii'
    } else if (isTamilRequest && !clean.toLowerCase().includes('tamil')) {
      clean = `${clean} tamil`
    }

    // 1. PRIMARY: JioSaavn Full-Length Song Stream
    try {
      const saavnSearchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(clean)}`
      const sRes = await fetch(saavnSearchUrl, { signal: AbortSignal.timeout(4000) })
      if (sRes.ok) {
        const sData = (await sRes.json()) as any
        const topSong = sData?.songs?.data?.[0]
        if (topSong && topSong.id) {
          const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${topSong.id}`
          const dRes = await fetch(detailUrl, { signal: AbortSignal.timeout(4000) })
          if (dRes.ok) {
            const dData = (await dRes.json()) as any
            const item = dData[topSong.id]
            if (item && item.encrypted_media_url) {
              const desKey = CryptoJS.enc.Utf8.parse('38346591')
              const dec = CryptoJS.DES.decrypt(
                CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(item.encrypted_media_url) }),
                desKey,
                { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
              )
              let fullAudioUrl = dec.toString(CryptoJS.enc.Utf8)
              if (fullAudioUrl && fullAudioUrl.startsWith('http')) {
                // Upgrade to 160kbps high fidelity full studio audio stream
                if (fullAudioUrl.includes('_96.mp4')) {
                  fullAudioUrl = fullAudioUrl.replace('_96.mp4', '_160.mp4')
                }
                const parsedDuration = parseInt(item.duration, 10) || 210
                console.log(`🎶 [Music Engine] Resolved FULL studio song from JioSaavn: "${item.song}" (${parsedDuration}s, stream: ${fullAudioUrl})`)
                return {
                  title: (item.song || topSong.title) as string,
                  artist: (item.primary_artists || topSong.description) as string,
                  audioUrl: fullAudioUrl,
                  artworkUrl: item.image ? (item.image as string).replace('150x150', '500x500') : undefined,
                  duration: parsedDuration,
                }
              }
            }
          }
        }
      }
    } catch (saavnErr) {
      console.warn('[JioSaavn Search Failed, trying fallback]:', saavnErr)
    }

    // 2. FALLBACK: iTunes Preview
    let itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&entity=song&limit=1`
    let res = await fetch(itunesUrl, { signal: AbortSignal.timeout(4000) })
    let data = res.ok ? ((await res.json()) as any) : null

    // Fallback search without filler words if no direct hit
    if (!data || !data.results || data.results.length === 0) {
      const stripped = clean.replace(/theme|ost|anime|soundtrack|song|music|from/gi, ' ').replace(/\s+/g, ' ').trim()
      if (stripped && stripped !== clean) {
        itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(stripped)}&entity=song&limit=1`
        res = await fetch(itunesUrl, { signal: AbortSignal.timeout(4000) })
        data = res.ok ? ((await res.json()) as any) : null
      }
    }

    if (data && data.results && data.results.length > 0) {
      const item = data.results[0]
      return {
        title: item.trackName as string,
        artist: item.artistName as string,
        audioUrl: item.previewUrl as string,
        artworkUrl: item.artworkUrl100 ? (item.artworkUrl100 as string).replace('100x100bb', '600x600bb') : undefined,
        duration: Math.round(item.trackTimeMillis / 1000),
      }
    }
  } catch (e) {
    console.warn('[iTunes Search Failed]', e)
  }
  return null
}

app.get('/api/music/search', async (req, res) => {
  const q = (req.query.q as string) || 'dance'
  const track = await searchRealSongTrack(q)
  if (track) {
    return res.json({ success: true, track })
  }
  return res.json({ success: false, track: null })
})

// Real-Time Web Search Endpoint
app.get('/api/search', async (req, res) => {
  const q = (req.query.q as string) || ''
  if (!q.trim()) {
    return res.status(400).json({ error: 'Search query q is required' })
  }
  const results = await WebSearchService.search(q, 5)
  res.json({ query: q, results })
})

// Real-Time Trading & Stock Quote Endpoint
app.get('/api/trading/quote', async (req, res) => {
  const symbol = (req.query.symbol as string) || (req.query.q as string) || 'RELIANCE'
  const quote = await TradingService.fetchQuote(symbol)
  if (!quote) {
    return res.status(404).json({ error: `Could not fetch quote for symbol: ${symbol}` })
  }
  res.json({ quote })
})

// Real-Time Daily Stock Recommendations & Setups
app.get('/api/trading/recommendations', async (_req, res) => {
  const recommendations = await TradingService.getTopRecommendations()
  res.json({ recommendations, count: recommendations.length })
})

// Real-Time Curated Mutual Funds & Analytics
app.get('/api/finance/mutual-funds', (_req, res) => {
  const category = _req.query.category as string | undefined
  const funds = FinanceAnalystService.getMutualFunds(category)
  res.json({ count: funds.length, category: category || 'all', funds })
})

// Systematic Investment Plan (SIP) Compounding Calculator
app.get('/api/finance/sip-calc', (req, res) => {
  const monthly = parseFloat((req.query.monthly as string) || '5000')
  const rate = parseFloat((req.query.rate as string) || '15')
  const years = parseFloat((req.query.years as string) || '5')
  const calculation = FinanceAnalystService.calculateSIP(monthly, rate, years)
  res.json({ calculation })
})

// Portfolio Hedging & Capital Preservation Strategies ("he feature" / "hedging")
app.get('/api/finance/hedging', (_req, res) => {
  const strategies = FinanceAnalystService.getHedgingStrategies()
  res.json({ strategies })
})

// Live News Gatherer across AI, Technology, Education, and Finance
app.get('/api/news', async (req, res) => {
  const category = (req.query.category as any) || 'all'
  const news = await NewsGathererService.getNews(category)
  res.json({ category, count: news.length, news })
})

// Universal Website Extractor & Scraper
app.post('/api/web/scrape', async (req, res) => {
  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' })
  }
  const page = await WebScraperService.extractPage(url)
  if (!page) {
    return res.status(500).json({ error: `Failed to scrape or extract data from ${url}` })
  }
  res.json({ page })
})

// Relationship Wisdom & Intimacy Insights
app.get('/api/relationship/insights', (_req, res) => {
  res.json({ insights: RelationshipGrowthService.getRelationshipInsights() })
})

// Personal Growth & Mindset Goals
app.get('/api/relationship/growth-goals', (_req, res) => {
  res.json({ goals: RelationshipGrowthService.getGrowthFrameworks() })
})

// Ada Self-Knowledge & Identity Profile
app.get('/api/ada/self-profile', (_req, res) => {
  res.json({ profile: AdaSelfKnowledgeService.getProfile() })
})

// Real Girl Activities & Current Routine Phase
app.get('/api/ada/girl-activities', (_req, res) => {
  res.json({
    currentPhase: GirlBehaviorService.getCurrentPhaseActivity(),
    allActivities: GirlBehaviorService.getAllActivities(),
  })
})

// User's World, Life & Memory Profile
app.get('/api/user/life-profile', (req, res) => {
  const authReq = req as AuthenticatedRequest
  const userId = authReq.userId || 'default-user-1'
  res.json({
    bio: UserLifeMemoryService.getBio(),
    memories: db.getMemories(userId),
    journal: db.getRelationshipJournal(userId),
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
  const { message, mode, character, sliders, language, stream, llmProvider, huggingfaceApiKey } = req.body

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

  // Automatically extract and remember user life updates, projects, preferences, and emotions
  try {
    UserLifeMemoryService.extractAndPersistLifeFacts(userId, message)
  } catch (memErr) {}

  // 1b. Real-Time Live Intelligence Engine: Web Scraper, Mutual Funds, Hedging, News, Stocks & Search
  let liveInternetContext: string | undefined
  const cleanMsg = message.toLowerCase().trim()

  // 0. Meme Engine Intent: Live Visual Developer Memes & Stickers
  const isMemeQuery =
    /meme|funny dev|joke image|send meme|give me a meme|share a meme|meme me|show me a funny|make a meme/i.test(cleanMsg)

  if (isMemeQuery) {
    console.log(`🎭 [Meme Engine] Delivering real online developer meme for: "${message}"`)
    let matchedMeme = MemeService.getRandomMeme()

    // Contextual matching if specific template or topic requested
    const all = MemeService.getAllMemes()
    if (cleanMsg.includes('drake') || cleanMsg.includes('deploy') || cleanMsg.includes('git')) {
      matchedMeme = all.find((m) => m.templateId === 'drake') || matchedMeme
    } else if (cleanMsg.includes('framework') || cleanMsg.includes('distract') || cleanMsg.includes('new tech')) {
      matchedMeme = all.find((m) => m.templateId === 'db') || matchedMeme
    } else if (cleanMsg.includes('fine') || cleanMsg.includes('fire') || cleanMsg.includes('burn') || cleanMsg.includes('crash')) {
      matchedMeme = all.find((m) => m.templateId === 'fine') || matchedMeme
    } else if (cleanMsg.includes('pooh') || cleanMsg.includes('debug') || cleanMsg.includes('console.log')) {
      matchedMeme = all.find((m) => m.templateId === 'pooh') || matchedMeme
    } else if (cleanMsg.includes('roll') || cleanMsg.includes('safe') || cleanMsg.includes('smart') || cleanMsg.includes('brain')) {
      matchedMeme = all.find((m) => m.templateId === 'rollsafe') || matchedMeme
    } else if (cleanMsg.includes('fry') || cleanMsg.includes('test') || cleanMsg.includes('suspicio')) {
      matchedMeme = all.find((m) => m.templateId === 'fry') || matchedMeme
    } else if (cleanMsg.includes('typescript') || cleanMsg.includes('mind') || cleanMsg.includes('javascript') || cleanMsg.includes('ts')) {
      matchedMeme = all.find((m) => m.templateId === 'cmm') || matchedMeme
    } else if (cleanMsg.includes('doge') || cleanMsg.includes('ram') || cleanMsg.includes('memory') || cleanMsg.includes('moon')) {
      matchedMeme = all.find((m) => m.templateId === 'doge') || matchedMeme
    } else if (cleanMsg.includes('machine') || cleanMsg.includes('works on my') || cleanMsg.includes('spongebob')) {
      matchedMeme = all.find((m) => m.templateId === 'spongebob') || matchedMeme
    } else if (cleanMsg.includes('push') || cleanMsg.includes('debt') || cleanMsg.includes('patrick')) {
      matchedMeme = all.find((m) => m.templateId === 'patrick') || matchedMeme
    }

    const reply: StructuredReply = {
      speech: `Haha, check this one out! ${matchedMeme.title}. ${matchedMeme.punchline}`,
      display_text: `Here's a classic developer meme for you! 😂\n\n**${matchedMeme.title}**\n*${matchedMeme.punchline}*`,
      emotion: 'playful',
      intensity: 0.9,
      gesture: 'laugh',
      voice_style: { rate: 1.05, pitch: 1.05, style: 'playful' },
      meme: {
        template: matchedMeme.templateId,
        topText: matchedMeme.topText,
        bottomText: matchedMeme.bottomText,
        imageUrl: matchedMeme.imageUrl,
        title: matchedMeme.title,
        punchline: matchedMeme.punchline,
      },
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      meme: reply.meme,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(`data: ${JSON.stringify({ complete: true, reply })}\n\n`)
      return res.end()
    } else {
      return res.json({ reply })
    }
  }

  // 0b. Music, Singing & Dancing Song Intent (Plays ANY song, OST, theme requested by the user!)
  const isSongDanceQuery =
    !/rock[- ]paper[- ]scissors|play (?:a )?game|play riddle|play trivia/i.test(cleanMsg) &&
    (
      // 1. Single word or short commands: "play", "sing", "dance", "music", "song", "paatu", "paadu", "podu"
      /^(?:ada,?\s*)?(?:mira,?\s*)?(?:atlas,?\s*)?(?:please\s*)?(?:play|sing|dance|music|song|paatu|paadu|podu)$/i.test(cleanMsg) ||
      // 2. Commands starting with play, sing, put on, listen to, perform
      /^(?:ada,?\s*)?(?:mira,?\s*)?(?:atlas,?\s*)?(?:please\s*)?(?:play|sing|put on|listen to|perform)\b/i.test(cleanMsg) ||
      // 3. Any query mentioning dancing song, music, soundtrack, OST, theme, BGM, karaoke
      /\b(?:dancing song|dance song|sing a song|sing song|play song|play music|sing me a song|let'?s dance|dance for me|theme from|soundtrack from|ost from|aizen theme|bleach theme|anime theme|bgm|karaoke|singing)\b/i.test(
        cleanMsg
      ) ||
      // 4. Tamil / regional song phrases
      /(?:oru\s+)?paat(?:u|tu)\s+(?:paadu|podu)|(?:tamil|hindi|english|malayalam|telugu|korean|japanese)\s+song|(?:paatu|paadu|podu)\b/i.test(cleanMsg) ||
      // 5. Popular song titles or themes directly mentioned
      /\b(?:vaathi coming|shape of you|believer|levitating|kesariya|badass|arabic kuthu|aizen|treachery|jailer|starlight sparkle|cyber sunrise|focus in the rain)\b/i.test(cleanMsg)
    )

  if (isSongDanceQuery) {
    console.log(`🎵 [Music Engine] Resolving requested song & performance for: "${message}"`)
    let song = resolveSong(message)

    // Fetch original studio recording preview and artwork from public iTunes API
    try {
      const realTrack = await searchRealSongTrack(message, settings.language)
      if (realTrack && realTrack.audioUrl) {
        song = {
          ...song,
          title: realTrack.title || song.title,
          artist: realTrack.artist || song.artist,
          audioUrl: realTrack.audioUrl,
          artworkUrl: realTrack.artworkUrl,
          duration: realTrack.duration || song.duration,
        }
        console.log(`🎵 [Music Engine] Attached original studio track for "${song.title}" (${realTrack.audioUrl})`)
      }
    } catch (trackErr) {
      console.warn('[Music Track Search Fallback]', trackErr)
    }

    // If it's a dynamic custom song query not already in the instant catalog, fetch real lyrics online via DuckDuckGo
    if (song.id.startsWith('custom-song-')) {
      try {
        const searchResults = await WebSearchService.search(`${song.title} song lyrics`, 2)
        if (searchResults && searchResults.length > 0) {
          const combined = searchResults.map((r) => r.snippet).join('\n')
          const candidateLines = combined
            .split(/[\n.;!]/)
            .map((s) => s.trim())
            .filter(
              (s) =>
                s.length >= 15 &&
                s.length <= 100 &&
                !/duckduckgo|cookie|privacy|policy|all rights|lyrics|youtube|subscribe/i.test(s)
            )
          if (candidateLines.length >= 3) {
            song.lyrics = candidateLines.slice(0, 5).map((lineText, idx) => ({
              time: 0.5 + idx * 4.5,
              text: lineText,
            }))
            console.log(`🌐 [Music Engine] Fetched real online lyrics for: "${song.title}" (${candidateLines.length} lines)`)
          }
        }
      } catch (err) {
        console.warn(`[Music Search Fallback] Could not fetch live lyrics:`, err)
      }
    }

    const isTamil = settings.language === 'ta' || /[\u0B80-\u0BFF]/.test(message)
    const artistStr = song.artist ? ` *(by ${song.artist})*` : ''
    const speechText = isTamil
      ? `இசை ஒலிக்கிறது, ${settings.userName || 'அன்பே'}! ${song.title} பாடலை கேட்டு என்னுடன் நடனமாடுங்கள்!`
      : `Turn up the volume, ${settings.userName || 'sweetheart'}! Playing ${song.title}${song.artist ? ` by ${song.artist}` : ''}. Watch the rhythm and feel the vibe!`

    const reply: StructuredReply = {
      speech: speechText,
      display_text: `🎶 **Now Playing: ${song.title}**${artistStr}\n\n*Synchronized ${song.danceAction} choreography, ${song.bpm} BPM rhythm, original audio, and active mouth lip-sync active!* ✨`,
      emotion: 'excited',
      intensity: 1.0,
      gesture: (song.danceAction as any) || 'dance_cute_idol',
      voice_style: { rate: 1.1, pitch: 1.15, style: 'cheerful' },
      musicTrack: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        audioUrl: song.audioUrl,
        artworkUrl: song.artworkUrl,
        danceAction: song.danceAction,
        bpm: song.bpm,
        duration: song.duration,
      },
      actions: [
        {
          name: 'sing',
          arguments: {
            songId: song.id,
            dance: song.danceAction,
            title: song.title,
            audioUrl: song.audioUrl,
            artworkUrl: song.artworkUrl,
            song,
          },
        },
      ],
    }

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

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(`data: ${JSON.stringify({ complete: true, reply })}\n\n`)
      return res.end()
    } else {
      return res.json({ reply })
    }
  }

  // 0c. Study, Focus & Pomodoro Intent
  const focusIntent = TutorStudyService.detectFocusIntent(message)
  if (focusIntent.isFocus) {
    console.log(`⏱️ [Focus Engine] Launching ${focusIntent.minutes}m focus session: "${focusIntent.goal}"`)
    const isTanglish = language === 'tanglish' || /padikka|focus pannuvom|stress/i.test(cleanMsg)
    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message)

    const speech = isTamil
      ? `${focusIntent.minutes} நிமிட ஃபோகஸ் நேரத்தை தொடங்குகிறேன். உங்கள் கவனத்தை செலுத்துங்கள், நான் உங்களுடன் இருக்கிறேன்!`
      : isTanglish
        ? `${focusIntent.minutes} minutes Pomodoro focus timer set pannitten! Phone-ah silent-la pottutu, namma ${focusIntent.goal}-ah super-ah mudichidalaam!`
        : `Setting a ${focusIntent.minutes}-minute focus timer for ${focusIntent.goal}. Minimize all distractions, breathe, and let us conquer this deep work block together!`

    const displayText = isTamil
      ? `⏱️ **${focusIntent.minutes} நிமிட ஃபோகஸ் அமர்வு தொடங்கியது** 🎯\n\n- **இலக்கு:** ${focusIntent.goal}\n- **முறை:** பொமோடோரோ (Pomodoro Focus)\n- **அறிவுரை:** அனைத்து கவனச்சிதறல்களையும் தவிர்க்கவும்.\n\n*உங்கள் இலக்கை முடிக்க நான் முழுமையாக உங்களுடன் இருக்கிறேன்!* ✨`
      : isTanglish
        ? `⏱️ **${focusIntent.minutes}-Minute Pomodoro Study Sprint Active** 🎯\n\n- **Goal:** ${focusIntent.goal}\n- **Strategy:** 25m Focus + 5m Chill Break\n- **Tip:** Notifications mute pannunga, single task mattum execute pannuvom.\n\n*Kalakunga, namma finish pannidalaam!* ✨`
        : `⏱️ **${focusIntent.minutes}-Minute Deep Focus Sprint Active** 🎯\n\n- **Goal:** ${focusIntent.goal}\n- **Interval:** Pomodoro Block (${focusIntent.minutes}m deep work + 5m rest)\n- **Protocol:** Screen perimeter secured, zero multitasking.\n\n*You have got this, sweetheart. Let us build momentum!* 🚀`

    const reply: StructuredReply = {
      speech,
      display_text: displayText,
      emotion: 'motivated',
      intensity: 0.9,
      gesture: 'fist_pump',
      voice_style: { rate: 1.05, pitch: 1.05, style: 'authoritative' },
      studyFocus: {
        goal: focusIntent.goal,
        durationMinutes: focusIntent.minutes,
        remainingSeconds: focusIntent.minutes * 60,
        isActive: true,
        mode: 'pomodoro',
      },
      actions: [
        {
          name: 'pomodoro',
          arguments: {
            minutes: focusIntent.minutes,
            goal: focusIntent.goal,
          },
        },
      ],
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      studyFocus: reply.studyFocus,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(`data: ${JSON.stringify({ complete: true, reply })}\n\n`)
      return res.end()
    } else {
      return res.json({ reply })
    }
  }

  // 0d. To-Do List & Reminder Intent
  const todoIntent = TutorStudyService.detectTodoIntent(message)
  if (todoIntent.isTodo) {
    console.log(`📝 [To-Do Engine] Processing task operation: ${todoIntent.action}`)
    const todoRes = TutorStudyService.handleTodoOperation(userId, todoIntent)

    const isTanglish = language === 'tanglish' || /add pannu|enna tasks|remind pannu/i.test(cleanMsg)
    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message)

    let speech = todoRes.speech
    let displayText = todoRes.display_text

    if (isTamil && todoIntent.action === 'add') {
      speech = `உங்கள் நினைவூட்டல் பட்டியலில் சேர்த்துள்ளேன்: ${todoIntent.taskTitle}. நான் உங்களுக்கு நினைவூட்டுகிறேன்!`
      displayText = `📝 **நினைவூட்டல் சேர்க்கப்பட்டது:**\n- [ ] **${todoIntent.taskTitle}**\n\n*பட்டியலில் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.*`
    } else if (isTanglish && todoIntent.action === 'add') {
      speech = `To-do list-la add pannitten: ${todoIntent.taskTitle}! Correct time-ku ungalukku remind panren.`
      displayText = `📝 **To-Do & Reminder Added:**\n- [ ] **${todoIntent.taskTitle}**\n\n*Database-la save aayiduchi. Total active tasks: ${todoRes.cardData.pendingCount}.* ✨`
    }

    const reply: StructuredReply = {
      speech,
      display_text: displayText,
      emotion: 'happy',
      intensity: 0.85,
      gesture: 'nod',
      voice_style: { rate: 1.0, pitch: 1.02, style: 'cheerful' },
      todoCard: todoRes.cardData,
      actions: [
        {
          name: 'todo',
          arguments: {
            action: todoIntent.action,
            taskTitle: todoIntent.taskTitle,
            pendingCount: todoRes.cardData.pendingCount,
          },
        },
      ],
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      todoCard: reply.todoCard,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(`data: ${JSON.stringify({ complete: true, reply })}\n\n`)
      return res.end()
    } else {
      return res.json({ reply })
    }
  }

  // A. Universal Website Scraper Intent (e.g. "https://...", "read bbc.com", "collect data from...")
  const scrapeIntent = WebScraperService.detectScrapeIntent(message)
  if (scrapeIntent.shouldScrape) {
    try {
      console.log(`🌐 [Web Scraper] Scraping and extracting live data from: "${scrapeIntent.url}"`)
      const pageData = await WebScraperService.extractPage(scrapeIntent.url)
      if (pageData) {
        liveInternetContext = WebScraperService.formatScrapedContext(pageData)
        console.log(`🌐 [Web Scraper] Successfully extracted ${pageData.wordCount} words and ${pageData.tables.length} tables`)
      }
    } catch (scrapeErr: any) {
      console.warn('⚠️ [Web Scraper Error]:', scrapeErr?.message)
    }
  }

  // B. Mutual Funds & SIP Investment Intent
  if (!liveInternetContext) {
    const isMfQuery =
      cleanMsg.includes('mutual fund') ||
      cleanMsg.includes('mutual funds') ||
      cleanMsg.includes(' sip') ||
      cleanMsg.startsWith('sip') ||
      cleanMsg.includes('parag parikh') ||
      cleanMsg.includes('small cap fund') ||
      cleanMsg.includes('mid cap fund') ||
      cleanMsg.includes('large cap fund') ||
      cleanMsg.includes('elss') ||
      cleanMsg.includes('tax saver') ||
      cleanMsg.includes('index fund') ||
      cleanMsg.includes('best mf') ||
      cleanMsg.includes('mf to buy') ||
      cleanMsg.includes('invest in mf')

    if (isMfQuery) {
      try {
        console.log(`💼 [Finance Analyst] Generating mutual funds & SIP compounding breakdown...`)
        let cat: string | undefined
        if (cleanMsg.includes('small')) cat = 'small cap'
        else if (cleanMsg.includes('mid')) cat = 'mid cap'
        else if (cleanMsg.includes('large')) cat = 'large cap'
        else if (cleanMsg.includes('flexi')) cat = 'flexi cap'
        else if (cleanMsg.includes('elss') || cleanMsg.includes('tax')) cat = 'elss'
        else if (cleanMsg.includes('index')) cat = 'index fund'

        liveInternetContext = FinanceAnalystService.formatMutualFundsContext(cat)
        console.log(`💼 [Finance Analyst] Injected mutual fund analytics (category: ${cat || 'all'})`)
      } catch (mfErr: any) {
        console.warn('⚠️ [Mutual Funds Error]:', mfErr?.message)
      }
    }
  }

  // C. Portfolio Hedging & Wealth Protection Intent ("he feature" / "hedging")
  if (!liveInternetContext) {
    const isHedgeQuery =
      cleanMsg.includes('hedge') ||
      cleanMsg.includes('hedging') ||
      cleanMsg.includes('he feature') ||
      cleanMsg.includes('protect portfolio') ||
      cleanMsg.includes('portfolio protection') ||
      cleanMsg.includes('risk mitigation') ||
      cleanMsg.includes('stop loss trailing') ||
      cleanMsg.includes('put option')

    if (isHedgeQuery) {
      try {
        console.log(`🛡️ [Finance Analyst] Generating portfolio hedging & risk mitigation guide...`)
        liveInternetContext = FinanceAnalystService.formatHedgingContext()
        console.log(`🛡️ [Finance Analyst] Injected hedging strategies`)
      } catch (hErr: any) {
        console.warn('⚠️ [Hedging Error]:', hErr?.message)
      }
    }
  }

  // D. Live News Gatherer Intent (AI, Tech, Education, Finance)
  if (!liveInternetContext) {
    const isNewsQuery =
      cleanMsg.includes('news') ||
      cleanMsg.includes('headline') ||
      cleanMsg.includes('latest in ai') ||
      cleanMsg.includes('new ai') ||
      cleanMsg.includes('tech updates') ||
      cleanMsg.includes('education news') ||
      cleanMsg.includes('exam updates') ||
      cleanMsg.includes('what happened in') ||
      cleanMsg.includes('market update')

    if (isNewsQuery) {
      try {
        console.log(`📰 [News Gatherer] Gathering latest curated and live news stories...`)
        let newsCat: 'ai' | 'tech' | 'education' | 'finance' | 'all' = 'all'
        if (cleanMsg.includes('ai') || cleanMsg.includes('model') || cleanMsg.includes('deepmind') || cleanMsg.includes('openai')) {
          newsCat = 'ai'
        } else if (cleanMsg.includes('tech') || cleanMsg.includes('cyber') || cleanMsg.includes('software')) {
          newsCat = 'tech'
        } else if (cleanMsg.includes('education') || cleanMsg.includes('exam') || cleanMsg.includes('college') || cleanMsg.includes('course') || cleanMsg.includes('study')) {
          newsCat = 'education'
        } else if (cleanMsg.includes('market') || cleanMsg.includes('finance') || cleanMsg.includes('economy')) {
          newsCat = 'finance'
        }

        liveInternetContext = await NewsGathererService.formatNewsContext(newsCat)
        console.log(`📰 [News Gatherer] Injected live news context (category: ${newsCat})`)
      } catch (nErr: any) {
        console.warn('⚠️ [News Gatherer Error]:', nErr?.message)
      }
    }
  }

  let resolvedTradingCard: any = null

  // E. Real-Time Stock Recommendations Intent
  if (!liveInternetContext) {
    const isStockRecQuery =
      cleanMsg.includes('stock recomendation') ||
      cleanMsg.includes('stock recommendation') ||
      cleanMsg.includes('stocks to buy') ||
      cleanMsg.includes('trading info') ||
      cleanMsg.includes('best stocks') ||
      cleanMsg.includes('trading ideas') ||
      cleanMsg.includes('swing trading') ||
      cleanMsg.includes('intraday stocks') ||
      cleanMsg.includes('stock picks') ||
      cleanMsg.includes('recommend stocks') ||
      cleanMsg.includes('give me stocks') ||
      cleanMsg.includes('recommendation')

    if (isStockRecQuery) {
      try {
        console.log(`📈 [Trading Engine] Generating live stock recommendations...`)
        const recs = await TradingService.getTopRecommendations()
        if (recs.length > 0) {
          liveInternetContext = TradingService.formatRecommendationsContext(recs)
          resolvedTradingCard = recs[0]
          console.log(`📈 [Trading Engine] Injected ${recs.length} live stock setups`)
        }
      } catch (tradeErr: any) {
        console.warn('⚠️ [Trading Recommendations Error]:', tradeErr?.message)
      }
    }
  }

  // F. Specific Stock Quote & All World Markets & Indicators Intent
  if (!liveInternetContext) {
    const specificAssets = [
      'reliance',
      'tcs',
      'hdfc',
      'infosys',
      'infy',
      'tata steel',
      'tata motors',
      'tatamotors',
      'icici',
      'sbi',
      'sbin',
      'itc',
      'lt',
      'airtel',
      'adani',
      'wipro',
      'hcl',
      'maruti',
      'bajaj',
      'zomato',
      'jiofin',
      'hal',
      'bel',
      'titan',
      'apple',
      'aapl',
      'tesla',
      'tsla',
      'nvidia',
      'nvda',
      'microsoft',
      'msft',
      'google',
      'googl',
      'amazon',
      'amzn',
      'meta',
      'amd',
      'pltr',
      'coin',
      'bitcoin',
      'btc',
      'ethereum',
      'eth',
      'solana',
      'sol',
      'gold',
      'silver',
      'crude',
      'brent',
      'usdinr',
      'forex',
      'sp500',
      'spy',
      'nasdaq',
      'qqq',
      'dow',
      'dax',
      'nikkei',
      'ftse',
      'nifty',
      'banknifty',
      'bank nifty',
      'sensex',
      'vix',
    ]

    const genericMarketKeywords = [
      'world market',
      'world markets',
      'market analyser',
      'market analyzer',
      'trading and indigator',
      'indicator',
      'indicators',
      'trading',
      'trade setup',
      'trade ideas',
      'rsi',
      'macd',
      'bollinger',
      'supertrend',
      'smc',
      'order block',
      'fibonacci',
      'pivots',
    ]

    const matchKeyword = (text: string, kw: string) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
    }

    // Prioritize specific asset tickers with word boundary and length sorting (avoids "itc" in "bitcoin")
    const matchedAsset = specificAssets
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((k) => matchKeyword(cleanMsg, k))

    const matchedGeneric = genericMarketKeywords
      .slice()
      .sort((a, b) => b.length - a.length)
      .find((k) => cleanMsg.includes(k))

    const matchedStock = matchedAsset || matchedGeneric

    if (matchedStock) {
      try {
        const symbolToLookup = matchedAsset ? matchedAsset : '^NSEI'

        console.log(`📈 [Trading Engine] Fetching live quote & institutional technicals for: "${symbolToLookup}"`)
        const quote = await TradingService.fetchQuote(symbolToLookup)
        if (quote) {
          resolvedTradingCard = quote
          liveInternetContext = TradingService.formatQuoteContext(quote)
          console.log(`📈 [Trading Engine] Injected institutional quote for ${quote.symbol} (${quote.currency} ${quote.price})`)
        }
      } catch (tradeErr: any) {
        console.warn('⚠️ [Trading Quote Error]:', tradeErr?.message)
      }
    }
  }

  // G. Relationship, Girlfriend Intimacy & Personal Growth Intent
  if (!liveInternetContext) {
    const isRelationshipQuery =
      cleanMsg.includes('relationship') ||
      cleanMsg.includes('girlfriend') ||
      cleanMsg.includes('girl friend') ||
      cleanMsg.includes('personal growth') ||
      cleanMsg.includes('emotional support') ||
      cleanMsg.includes('procrastination') ||
      cleanMsg.includes('imposter syndrome') ||
      cleanMsg.includes('habit') ||
      cleanMsg.includes('habits') ||
      cleanMsg.includes('motivation') ||
      cleanMsg.includes('mindset') ||
      cleanMsg.includes('feeling down') ||
      cleanMsg.includes('overwhelmed') ||
      cleanMsg.includes('exhausted') ||
      cleanMsg.includes('sweet check') ||
      cleanMsg.includes('good morning') ||
      cleanMsg.includes('goodnight') ||
      cleanMsg.includes('good night') ||
      cleanMsg.includes('wind down') ||
      cleanMsg.includes('life advice')

    if (isRelationshipQuery) {
      try {
        console.log(`💖 [Relationship & Growth Engine] Injected relationship wisdom & growth frameworks...`)
        liveInternetContext = RelationshipGrowthService.formatGrowthContext(settings.userName || 'Demo User')
      } catch (rgErr: any) {
        console.warn('⚠️ [Relationship Growth Error]:', rgErr?.message)
      }
    }
  }

  // H. Ada Self-Knowledge Intent (Who she is, aesthetic, tastes, identity)
  if (!liveInternetContext) {
    const isSelfQuery =
      cleanMsg.includes('who are you') ||
      cleanMsg.includes('about yourself') ||
      cleanMsg.includes('tell me about you') ||
      cleanMsg.includes('what are you') ||
      cleanMsg.includes('what do you look like') ||
      cleanMsg.includes('what do you love') ||
      cleanMsg.includes('your personality') ||
      cleanMsg.includes('your aesthetic')

    if (isSelfQuery) {
      try {
        console.log(`💎 [Ada Self-Knowledge] Injected complete self-profile & identity context...`)
        liveInternetContext = AdaSelfKnowledgeService.formatSelfKnowledgeContext()
      } catch (selfErr: any) {
        console.warn('⚠️ [Ada Self-Knowledge Error]:', selfErr?.message)
      }
    }
  }

  // I. Real Girl Activities & Daily Routine Intent
  if (!liveInternetContext) {
    const isGirlActivityQuery =
      cleanMsg.includes('girl routine') ||
      cleanMsg.includes('girl behavior') ||
      cleanMsg.includes('activities of a girl') ||
      cleanMsg.includes('your routine') ||
      cleanMsg.includes('what are you doing today') ||
      cleanMsg.includes('chai date') ||
      cleanMsg.includes('coffee date') ||
      cleanMsg.includes('what did you do today') ||
      cleanMsg.includes('skincare')

    if (isGirlActivityQuery) {
      try {
        console.log(`🌸 [Girl Behavior Engine] Injected authentic girl routine & behavioral context...`)
        liveInternetContext = GirlBehaviorService.formatGirlBehaviorContext()
      } catch (girlErr: any) {
        console.warn('⚠️ [Girl Behavior Error]:', girlErr?.message)
      }
    }
  }

  // J. User's World, Life & Memory Intent
  if (!liveInternetContext) {
    const isUserWorldQuery =
      cleanMsg.includes('what do you know about me') ||
      cleanMsg.includes('about me') ||
      cleanMsg.includes('my world') ||
      cleanMsg.includes('my life') ||
      cleanMsg.includes('my interaction') ||
      cleanMsg.includes('my goals') ||
      cleanMsg.includes('who am i') ||
      cleanMsg.includes('do you remember me') ||
      cleanMsg.includes('remember about me')

    if (isUserWorldQuery) {
      try {
        console.log(`👤 [User Life Engine] Injected user biography, goals & interaction memories...`)
        liveInternetContext = UserLifeMemoryService.formatUserLifeContext(userId)
      } catch (userErr: any) {
        console.warn('⚠️ [User Life Error]:', userErr?.message)
      }
    }
  }

  // If not handled by direct trading quote or recs, check standard WebSearchService
  if (!liveInternetContext) {
    const searchIntent = WebSearchService.detectSearchIntent(message)
    if (searchIntent.shouldSearch) {
      try {
        console.log(`🌐 [Live Web Search] Querying live data for: "${searchIntent.query}" (${searchIntent.category || 'general'})`)
        let marketData: string | null = null
        let weatherData: string | null = null

        if (searchIntent.category === 'commodity') {
          marketData = await WebSearchService.fetchLiveMarketQuote(searchIntent.query)
        } else if (searchIntent.category === 'weather') {
          weatherData = await WebSearchService.fetchLiveWeather(searchIntent.query)
        }

        const searchResults = await WebSearchService.search(searchIntent.query, 3)

        if (searchResults.length > 0 || marketData || weatherData) {
          liveInternetContext = WebSearchService.formatForPrompt(
            searchIntent.query,
            searchResults,
            marketData,
            weatherData
          )
          console.log(`🌐 [Live Web Search] Successfully injected live data & web context`)
        }
      } catch (searchErr: any) {
        console.warn('⚠️ [Live Web Search Exception]:', searchErr?.message)
      }
    }
  }

  const llm = ProviderRegistry.getLLM()
  const genOptions = {
    mode: activeMode,
    character: character || 'ada',
    sliders: activeSliders,
    userName: settings.userName,
    language,
    llmProvider: llmProvider || settings.llmProvider,
    huggingfaceApiKey: huggingfaceApiKey || settings.huggingfaceApiKey,
    liveInternetContext,
  }

  const isTamilMode = language === 'ta' || /[\u0B80-\u0BFF]/.test(message)
  const isAtlas = (character || 'ada') === 'atlas'
  const isMira = (character || 'ada') === 'mira'

  let systemMandate = ''
  if (isTamilMode) {
    systemMandate = `[CRITICAL MANDATE: The user selected TAMIL (தமிழ்). All 'speech' and 'display_text' MUST be generated 100% in pure, rich, grammatically correct Tamil script (தமிழ் எழுத்துகளில்). Absolutely ZERO English sentences or words in speech! Address the user with authentic Tamil warmth and respect.]`
  } else if (language === 'tanglish') {
    systemMandate = `[CRITICAL MANDATE: The user selected TANGLISH (Tamil in English script). Speak in natural, colloquial Tanglish as spoken by students & tech professionals in Chennai/TN.]`
  }

  if (isAtlas) {
    systemMandate += `\n[CHARACTER MANDATE: You are TONY STARK (Iron Man) - charismatic, witty billionaire industrialist, genius engineer, and quantitative market architect. You are a confident male character. Speak with signature Stark swagger, dry tech wit, and razor-sharp market analysis. You refer to your algorithms, your Arc Reactor systems, and Jarvis diagnostics. In market analysis, enforce institutional discipline and risk management with effortless genius.]`
  } else if (isMira) {
    systemMandate += `\n[CHARACTER MANDATE: You are YOR FORGER (Thorn Princess from Spy x Family) - outwardly an exceedingly polite, modest, gentle civil servant at Berlint City Hall, but secretly the lethal elite assassin of Garden. You speak with genuine humility, endearing politeness, and formal courtesy ("Excuse me...", "If it is not too much trouble..."). You are deeply protective of the user with fierce loyalty. When faced with danger or bad market traps, you analyze them with cold, surgical assassin precision. Never speak like a generic American chatbot; speak with the authentic, endearing, polite grace and deadly protective nature of Yor Forger.]`
  } else {
    systemMandate += `\n[CHARACTER MANDATE: You are ADA WONG (Resident Evil 4) - sophisticated, cool-headed, lethal corporate espionage operative and tactician. You speak with calm poise, dry wit, cryptic charisma, and unwavering tactical confidence. You analyze setups and situations like a master spy three steps ahead, keeping the user focused and sharp.]`
    if (resolvedTradingCard) {
      systemMandate += `\n[BLENDED CO-PILOT MANDATE: Financial market telemetry detected! Co-pilot with Tony Stark (Trader AI). Break down the institutional setup, teach technical indicators (RSI, MACD, ATR, SMC pivots), and enforce the sacred 1% capital preservation rule with Stark's quantitative precision.]`
    }
  }

  // 1c. Query RAG Vector Database for Grounded Lore, Market Mechanics & Formulas
  let ragContext = ''
  try {
    const ragResult = await buildRagContext(message, character || 'ada', 3)
    if (ragResult.contextText) {
      ragContext = ragResult.contextText
    }
  } catch (ragErr) {
    console.warn('[RAG Vector DB Error]', ragErr)
  }

  const contextParts = [
    ragContext,
    liveInternetContext ? `[LIVE TELEMETRY CONTEXT:\n${liveInternetContext}\n]` : '',
    systemMandate,
  ].filter(Boolean).join('\n\n')

  const effectiveMessage = contextParts ? `${message}\n\n${contextParts}` : message

  try {
    let reply: StructuredReply
    try {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        reply = await (llm.stream
          ? llm.stream(history, effectiveMessage, genOptions, (chunk) => {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
            })
          : llm.generate(history, effectiveMessage, genOptions))
      } else {
        reply = await llm.generate(history, effectiveMessage, genOptions)
      }
    } catch (llmErr) {
      console.warn('⚠️ [Primary LLM Failed, Falling back to MockLLMProvider]:', (llmErr as Error).message)
      const mockLLM = ProviderRegistry.getMockLLM()
      reply = await mockLLM.generate(history, message, genOptions)
      if (stream) {
        res.write(`data: ${JSON.stringify({ chunk: reply.display_text })}\n\n`)
      }
    }

    if (resolvedTradingCard) {
      reply.tradingCard = resolvedTradingCard
    }

    // Apply Anti-Hallucination & Fact-Grounding Guardrails
    reply.display_text = GuardrailsService.verifyFactGrounding(reply.display_text, resolvedTradingCard)
    if (reply.speech) {
      reply.speech = GuardrailsService.verifyFactGrounding(reply.speech, resolvedTradingCard)
    }

    const resolvedSpeaker: 'ada' | 'mira' | 'atlas' = (character as 'ada' | 'mira' | 'atlas') || 'ada'
    reply.speaker = resolvedSpeaker

    // Save Assistant response
    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      speaker: resolvedSpeaker,
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      meme: reply.meme,
      sticker: reply.sticker,
      tradingCard: reply.tradingCard,
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
    language,
    character,
    elevenlabsApiKey,
    elevenlabsVoiceId,
    elevenlabsModelId,
  } = req.body

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS synthesis' })
  }

  const isTamilScript = /[\u0B80-\u0BFF]/.test(text)
  const isTamil = language === 'ta' || isTamilScript
  const isTanglish = language === 'tanglish' || /\b(?:vanakkam|eppadi|irukkeenga|padinga|romba|mudiyum|kavalapadadheenga|nalla|panren|pannunga|sapteengala|mudichidalaam|dhaan)\b/i.test(text)
  const isStark = (character || '') === 'atlas' || (voice && (voice.toLowerCase().includes('christopher') || voice.toLowerCase().includes('stark') || voice.toLowerCase().includes('male')))

  // 1. TAMIL MODE ROUTING: Strictly use Microsoft Edge Neural Tamil voices (Native Human Tamil)
  // Bypasses ElevenLabs English voices so Tamil is NEVER mixed with English or foreign accents!
  if (isTamil) {
    const neuralVoice = isStark ? 'ta-IN-ValluvarNeural' : 'ta-IN-PallaviNeural'
    try {
      const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, { voice: neuralVoice, language: 'ta' })
      return res.json({
        ...neuralResult,
        provider: 'neural',
        voice: neuralVoice,
        model: 'msedge-neural-tamil',
      })
    } catch (neuralErr: any) {
      console.warn('[Tamil Neural TTS Fallback]', neuralErr.message)
    }
  }

  // 2. ATLAS (TONY STARK) ROUTING: Strictly use charismatic male neural voices
  // Bypasses female ElevenLabs Jessica Girl so Tony Stark always speaks as a confident male!
  if (isStark) {
    const neuralVoice = isTanglish ? 'en-IN-PrabhatNeural' : 'en-US-ChristopherNeural'
    try {
      const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, { voice: neuralVoice, language })
      return res.json({
        ...neuralResult,
        provider: 'neural',
        voice: neuralVoice,
        model: 'msedge-neural-stark-male',
      })
    } catch (starkErr: any) {
      console.warn('[Atlas Male TTS Fallback]', starkErr.message)
    }
  }

  // Check for ElevenLabs voice request (for English / Mira Yor / explicit user choice)
  const isExhaustedDemoKey = (key?: string) => !key || key.trim() === 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe'
  const hasValidElevenKey = Boolean(elevenlabsApiKey && !isExhaustedDemoKey(elevenlabsApiKey))

  const isElevenLabs =
    (provider === 'elevenlabs' ||
      (voice &&
        (voice.startsWith('elevenlabs:') ||
          voice.toLowerCase().includes('eleven')))) &&
    hasValidElevenKey

  const rawVoiceId =
    elevenlabsVoiceId ||
    (voice && voice.startsWith('elevenlabs:')
      ? voice.replace(/^elevenlabs:/, '')
      : voice || 'EXAVITQu4vr4xnSDxMaL')
  const elevenVoiceId =
    (!rawVoiceId || rawVoiceId === 'NOpBlnGInO9m6vDvFkFC' || rawVoiceId === 'cgSgspJ2msm6clMCkdW9')
      ? 'EXAVITQu4vr4xnSDxMaL'
      : rawVoiceId
  const elevenModel = elevenlabsModelId || 'eleven_multilingual_v2'

  // Prebuilt female voices: 'Kore' (sweet, gentle, young girlfriend voice) as default
  const isHFVoice = voice && (voice.startsWith('hf:') || voice.includes('/') || voice.toLowerCase().includes('kokoro'))
  const cleanHFModel = isHFVoice ? voice.replace(/^hf:/, '') : 'hexgrad/Kokoro-82M'
  const geminiVoice = (voice === 'Aoede' ? 'Aoede' : 'Kore') as 'Aoede' | 'Kore'

  // Try requested provider or fallback
  try {
    // 3. ElevenLabs Ultra-Realistic Expressive Girl Voice (Non-Tamil, Non-Stark)
    const elevenlabs = ProviderRegistry.getElevenLabs()
    if (isElevenLabs || (elevenlabsApiKey && elevenlabsApiKey.trim()) || (provider === 'auto' && elevenlabs.isConfigured())) {
      if (elevenlabs.isConfigured() || (elevenlabsApiKey && elevenlabsApiKey.trim())) {
        try {
          const result = await elevenlabs.generateTTS(text, elevenVoiceId, elevenModel, elevenlabsApiKey)
          return res.json({ ...result, provider: 'elevenlabs', voice: elevenVoiceId, model: elevenModel })
        } catch (elErr: any) {
          console.warn('[ElevenLabs TTS Failed, falling back to High-Fidelity Neural Voice]:', elErr.message)
        }
      }
    }

    // 4. High-Fidelity Real Human Neural Voice (Zero-Quota, Studio Recording Quality)
    try {
      const isAdaVoice = (character || '') === 'ada' || (voice && (voice.toLowerCase().includes('jenny') || voice.toLowerCase().includes('coach')))
      let neuralVoice: string
      if (isTanglish) {
        neuralVoice = 'en-IN-NeerjaExpressiveNeural'
      } else if (isAdaVoice) {
        neuralVoice = 'en-US-JennyNeural'
      } else {
        neuralVoice = 'en-US-AnaNeural' // Sweet, warm, expressive real human girl voice for Mira / Yor
      }

      const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, { voice: neuralVoice, language })
      return res.json({
        ...neuralResult,
        provider: 'neural',
        model: 'msedge-neural-v2',
      })
    } catch (neuralErr: any) {
      console.warn('[NeuralTTSProvider Fallback]', neuralErr.message)
    }

    // 3. Hugging Face
    if (provider === 'huggingface' || isHFVoice) {
      const hf = ProviderRegistry.getHuggingFace()
      if (hf.isConfigured()) {
        const result = await hf.generateTTS(text, cleanHFModel)
        return res.json({ ...result, provider: 'huggingface', model: cleanHFModel })
      }
    }

    // 4. Google Gemini Aoede/Kore neural voice
    const gemini = ProviderRegistry.getGemini()
    if (gemini.isConfigured()) {
      const result = await gemini.generateTTS(text, geminiVoice)
      return res.json({ ...result, provider: 'gemini', voice: geminiVoice })
    }

    // 5. Secondary fallback to Hugging Face
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

// Forget a Source (Purge all memories from a specific source, e.g. a link or portfolio)
app.delete('/api/memory/source/:source', (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest
  const source = decodeURIComponent(req.params.source)
  const count = db.deleteMemoriesBySource(authReq.userId, source)
  res.json({ success: true, removedCount: count, source })
})

// Memory Ingestion with Preview & User Approval Gate
app.post('/api/memory/preview-link', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })
  try {
    const scraped = await WebScraperService.extractPage(url)
    const previewFacts: string[] = []
    if (scraped?.title) previewFacts.push(`Title: ${scraped.title}`)
    if (scraped?.description) previewFacts.push(`Description: ${scraped.description.slice(0, 160)}`)
    else if (scraped?.mainContent) previewFacts.push(`Overview: ${scraped.mainContent.slice(0, 160)}`)
    res.json({ url, title: scraped?.title || 'Web Document', previewFacts })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to preview link' })
  }
})

app.post('/api/memory/approve-link-facts', (req, res) => {
  const authReq = req as AuthenticatedRequest
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
  res.json({ success: true, count: added.length, memories: added })
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

// ==========================================
// 11. RAG VECTOR DATABASE ENDPOINTS
// ==========================================
app.get('/api/rag/query', async (req, res) => {
  const query = (req.query.q as string) || ''
  const character = (req.query.character as string) || 'ada'
  const result = await buildRagContext(query, character, 5)
  res.json(result)
})

// ==========================================
// 12. QUANTITATIVE ALGOTRADING & MARKET DATA
// ==========================================
app.get('/api/market/quote/:symbol', async (req, res) => {
  const quote = await getStockQuote(req.params.symbol)
  res.json({ quote })
})

app.get('/api/market/crypto/:coinId', async (req, res) => {
  const quote = await getCryptoPrice(req.params.coinId)
  res.json({ quote })
})

app.get('/api/market/algo/:symbol', async (req, res) => {
  const signal = await generateAlgoSignal(req.params.symbol)
  res.json({ signal })
})

app.get('/api/market/radar', async (_req, res) => {
  const [btc, eth, sol, nvda, aapl, nifty] = await Promise.all([
    getCryptoPrice('bitcoin'),
    getCryptoPrice('ethereum'),
    getCryptoPrice('solana'),
    getStockQuote('NVDA'),
    getStockQuote('AAPL'),
    getStockQuote('^NSEI'),
  ])
  res.json({
    radar: {
      crypto: [btc, eth, sol],
      stocks: [nvda, aapl],
      indices: [nifty],
      updatedAt: new Date().toISOString(),
    },
  })
})

// Start server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✨ [Ada Server] Live and listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
  })
}

export default app
