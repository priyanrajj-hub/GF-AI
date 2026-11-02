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
import { WebSearchService } from './services/webSearchService.js'
import { TradingService } from './services/tradingService.js'
import { FinanceAnalystService } from './services/financeAnalystService.js'
import { NewsGathererService } from './services/newsGathererService.js'
import { WebScraperService } from './services/webScraperService.js'
import { RelationshipGrowthService } from './services/relationshipGrowthService.js'

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

// Real-Time Live Internet Status
app.get('/api/internet/status', async (_req, res) => {
  const status = await WebSearchService.checkConnectivity()
  res.json(status)
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

  // 1b. Real-Time Live Intelligence Engine: Web Scraper, Mutual Funds, Hedging, News, Stocks & Search
  let liveInternetContext: string | undefined
  const cleanMsg = message.toLowerCase().trim()

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
          console.log(`📈 [Trading Engine] Injected ${recs.length} live stock setups`)
        }
      } catch (tradeErr: any) {
        console.warn('⚠️ [Trading Recommendations Error]:', tradeErr?.message)
      }
    }
  }

  // F. Specific Stock Quote Lookup Intent
  if (!liveInternetContext) {
    const quoteKeywords = [
      'reliance',
      'tcs',
      'hdfc',
      'infosys',
      'infy',
      'tata steel',
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
      'hal',
      'bel',
      'nifty',
      'banknifty',
      'bank nifty',
      'sensex',
      'apple',
      'tesla',
      'nvidia',
      'nvda',
      'microsoft',
      'google',
      'amazon',
      'btc',
      'bitcoin',
      'crude',
    ]
    const matchedStock = quoteKeywords.find((k) => cleanMsg.includes(k))

    if (matchedStock) {
      try {
        console.log(`📈 [Trading Engine] Fetching live stock quote & technical levels for: "${matchedStock}"`)
        const quote = await TradingService.fetchQuote(matchedStock)
        if (quote) {
          liveInternetContext = TradingService.formatQuoteContext(quote)
          console.log(`📈 [Trading Engine] Injected live quote for ${quote.symbol} (₹${quote.price})`)
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
        liveInternetContext = RelationshipGrowthService.formatGrowthContext(settings.userName || 'Priyan')
      } catch (rgErr: any) {
        console.warn('⚠️ [Relationship Growth Error]:', rgErr?.message)
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
    sliders: activeSliders,
    userName: settings.userName,
    language,
    llmProvider: llmProvider || settings.llmProvider,
    huggingfaceApiKey: huggingfaceApiKey || settings.huggingfaceApiKey,
    liveInternetContext,
  }

  const effectiveMessage = liveInternetContext
    ? `${message}\n\n[SYSTEM MANDATE: Real-time live intelligence (stocks, mutual funds, portfolio hedging, live news, or extracted website data) has been pulled and provided in your context. You are Priyan's brilliant, affectionate AI girlfriend, finance analyst, and intelligence gatherer. You MUST state the exact numbers, stock levels, fund CAGRs, news items, and insights directly to ${settings.userName || 'Priyan'}. Provide clear, confident, structured financial setups, news summaries, and analysis! NEVER tell him to visit an external website, link, or tracker.]`
    : message

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

  const rawVoiceId =
    elevenlabsVoiceId ||
    (voice && voice.startsWith('elevenlabs:')
      ? voice.replace(/^elevenlabs:/, '')
      : voice || 'cgSgspJ2msm6clMCkdW9')
  // Automatically remap Grandpa Spuds Oxley to Jessica (real human girl)
  const elevenVoiceId = rawVoiceId === 'NOpBlnGInO9m6vDvFkFC' ? 'cgSgspJ2msm6clMCkdW9' : rawVoiceId
  const elevenModel = elevenlabsModelId || 'eleven_turbo_v2_5'

  // Prebuilt female voices: 'Kore' (sweet, gentle, young girlfriend voice) as default
  const isHFVoice = voice && (voice.startsWith('hf:') || voice.includes('/') || voice.toLowerCase().includes('kokoro'))
  const cleanHFModel = isHFVoice ? voice.replace(/^hf:/, '') : 'hexgrad/Kokoro-82M'
  const geminiVoice = (voice === 'Aoede' ? 'Aoede' : 'Kore') as 'Aoede' | 'Kore'

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
