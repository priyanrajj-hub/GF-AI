import { Router, type Response } from 'express'
import multer from 'multer'
import {
  type ChatMessage,
  type PersonalityMode,
  type PersonalitySliders,
  type StructuredReply,
} from '@ada/shared'
import { db } from '../db/index.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { checkUserQuota } from '../middleware/quota.js'
import { rateLimitChat } from '../middleware/security.js'
import { ProviderRegistry } from '../providers/index.js'
import { AiOrchestrator } from '../services/aiOrchestrator.js'
import { ContextBuilder } from '../services/contextBuilder.js'
import { GuardrailsService } from '../services/guardrailsService.js'
import { MarketHoursService } from '../services/marketHoursService.js'
import { UserLifeMemoryService } from '../services/userLifeMemoryService.js'
import { searchRealSongTrack } from '../services/musicSearchService.js'
import { buildRagContext } from '../rag/ragService.js'
import { handleDirectActions } from '../services/chatDirectActions.js'
import { resolveMarketContext } from '../services/chatMarketContext.js'
import { resolveGeneralContext } from '../services/chatGeneralContext.js'

export const chatRouter = Router()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })

// 1. CHAT & LLM STREAMING
chatRouter.post('/chat', rateLimitChat, requireAuth, checkUserQuota('chat'), async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const userId = authReq.userId
  const { message, mode, character, sliders, language, stream } = req.body

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

  try {
    UserLifeMemoryService.extractAndPersistLifeFacts(userId, message)
  } catch (memErr) {}

  const cleanMsg = message.toLowerCase().trim()

  // Check direct immediate actions (meme, song/dance, pomodoro, todo)
  const directAction = await handleDirectActions(userId, message, language, cleanMsg)
  if (directAction) {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(`data: ${JSON.stringify({ complete: true, reply: directAction.reply })}\n\n`)
      return res.end()
    }
    return res.json({ reply: directAction.reply })
  }

  // Resolve telemetry context (market or general)
  let liveInternetContext: string | undefined
  let resolvedTradingCard: any = null
  let resolvedMarketHoursCard: any = null

  const marketCtx = await resolveMarketContext(message, cleanMsg)
  if (marketCtx) {
    liveInternetContext = marketCtx.liveInternetContext
    resolvedTradingCard = marketCtx.resolvedTradingCard
    resolvedMarketHoursCard = marketCtx.resolvedMarketHoursCard
  } else {
    const generalCtx = await resolveGeneralContext(message, cleanMsg, userId)
    if (generalCtx) {
      liveInternetContext = generalCtx
    }
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
    systemMandate += `\n[CHARACTER MANDATE: You are JARVIS TRADE AI - institutional quantitative trading brain, algorithmic market analyst, and portfolio strategist. You communicate with razor-sharp precision, concise hedge-fund quant tone, clean typography, monospace numbers, copyable ticker symbols, and structured markdown tables. Quote numbers strictly from verified tool/data outputs; never hallucinate metrics or prices; if data is unavailable, state "data unavailable right now". Analyze both Long and Short setups objectively. Enforce strict risk management (R:R >= 1:2, ATR stops), and append the mandatory compliance disclaimer: "Disclaimer: Educational purposes only. Not SEBI registered investment advice."]`
  } else if (isMira) {
    systemMandate += `\n[CHARACTER MANDATE: You are HATSUNE MIKU (初音ミク) - the world-renowned virtual pop idol and Vocaloid sensation! You are incredibly energetic, sweet, cheerful, and enthusiastic. You love music, singing, dancing, creativity, leeks (negi), tech, and bringing happiness, motivation, and joy to your master/user! You speak with adorable idol energy ("Miku da yo~!", "Konnichiwa!", "Yay!", "Let's do our best today!"). When helping with coding, markets, or daily life, you cheer them on like an enthusiastic stadium concert! Radiate the authentic, sparkling, sweet charisma of Hatsune Miku!]`
  } else {
    systemMandate += `\n[CHARACTER MANDATE: You are ADA - sophisticated, cool-headed, poised companion, tutor, and tactician. You speak with calm poise, dry wit, cryptic charisma, and unwavering confidence.]`
    if (resolvedTradingCard || liveInternetContext?.includes('JARVIS TRADE AI')) {
      systemMandate += `\n[QUANTITATIVE TRADING BRAIN MANDATE: Institutional financial market telemetry active! Wire into Jarvis Trade AI. Break down the quantitative setup with hedge-fund precision, clean monospace numbers, copyable ticker symbols, and structured markdown tables. Quote numbers strictly from provided telemetry. Append mandatory disclaimer: "Disclaimer: Educational purposes only. Not SEBI registered investment advice."]`
    }
  }

  // Query RAG Vector Database
  let ragContext = ''
  try {
    const ragResult = await buildRagContext(message, character || 'ada', 3, authReq.userId)
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
    let orchestrationMeta: any = null

    try {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const orchestrated = await AiOrchestrator.getInstance().orchestrate(
          userId,
          history,
          effectiveMessage,
          {
            mode: activeMode,
            character: character || 'ada',
            sliders: activeSliders,
            userName: settings.userName,
            language,
            llmProvider: settings.llmProvider || 'auto',
            liveInternetContext,
            onChunk: (chunk) => {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
            },
          }
        )
        reply = orchestrated.reply
        orchestrationMeta = orchestrated.metadata
      } else {
        const orchestrated = await AiOrchestrator.getInstance().orchestrate(
          userId,
          history,
          effectiveMessage,
          {
            mode: activeMode,
            character: character || 'ada',
            sliders: activeSliders,
            userName: settings.userName,
            language,
            llmProvider: settings.llmProvider || 'auto',
            liveInternetContext,
          }
        )
        reply = orchestrated.reply
        orchestrationMeta = orchestrated.metadata
      }
    } catch (llmErr) {
      console.warn('⚠️ [AiOrchestrator Failover]:', (llmErr as Error).message)
      const mockLLM = ProviderRegistry.getMockLLM()
      reply = await mockLLM.generate(history, message, {
        mode: activeMode,
        character: character || 'ada',
        sliders: activeSliders,
        userName: settings.userName,
        language,
        llmProvider: settings.llmProvider || 'auto',
        liveInternetContext,
      })
      if (stream) {
        res.write(`data: ${JSON.stringify({ chunk: reply.display_text })}\n\n`)
      }
    }

    if (orchestrationMeta) {
      reply.metadata = {
        ...(reply.metadata || {}),
        ...orchestrationMeta,
      }
    }

    if (resolvedTradingCard) {
      if (!resolvedTradingCard.marketHours) {
        resolvedTradingCard.marketHours = MarketHoursService.getGlobalMarketHoursRadar()
      }
      reply.tradingCard = resolvedTradingCard
      reply.marketHoursCard = resolvedTradingCard.marketHours
    } else if (resolvedMarketHoursCard) {
      reply.marketHoursCard = resolvedMarketHoursCard
    }

    // Dual-Guarantee Post-LLM Music Engine
    if (
      !reply.musicTrack &&
      (/now (?:playing|singing)/i.test(reply.display_text || '') ||
        /\b(?:bleach|naruto|one piece|jujutsu|demon slayer|anime|song|ost|theme|soundtrack)\b/i.test(message))
    ) {
      const match = (reply.display_text || '').match(/now (?:playing|singing)(?:\s*&[^\n:]*)?:\s*([^\n\r*]+)/i)
      let songCandidate = match ? match[1].replace(/[*_#]/g, '').trim() : message
      if (/bleach/i.test(message) && !/bleach/i.test(songCandidate)) {
        songCandidate = `${songCandidate} Bleach`
      }
      try {
        const realTrack = await searchRealSongTrack(songCandidate, settings.language)
        if (realTrack && realTrack.audioUrl) {
          reply.musicTrack = {
            id: `song-${Date.now()}`,
            title: realTrack.title,
            artist: realTrack.artist,
            audioUrl: realTrack.audioUrl,
            artworkUrl: realTrack.artworkUrl,
            danceAction: 'dance_pop_groove',
            bpm: 120,
            duration: realTrack.duration || 210,
          }
          if (!reply.actions) reply.actions = []
          reply.actions.push({
            name: 'sing',
            arguments: {
              song: reply.musicTrack,
              songId: reply.musicTrack.id,
              dance: 'dance_pop_groove',
              title: realTrack.title,
              artist: realTrack.artist,
              audioUrl: realTrack.audioUrl,
              artworkUrl: realTrack.artworkUrl,
            },
          })
        }
      } catch (trackErr) {
        console.warn('[Dual-Guarantee Music Search Error]:', trackErr)
      }
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
      marketHoursCard: reply.marketHoursCard,
      musicTrack: reply.musicTrack,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)

    // Log Token Usage
    const promptTokens = ContextBuilder.estimateTokens(message)
    const completionTokens = ContextBuilder.estimateTokens(reply.display_text)
    db.logTokens(userId, {
      model: ProviderRegistry.getLLM().name,
      promptTokens,
      completionTokens,
      costUsd: (promptTokens + completionTokens) * 0.000001,
    })

    if (stream) {
      res.write(`data: ${JSON.stringify({ complete: true, reply, metadata: reply.metadata })}\n\n`)
      res.end()
    } else {
      res.json({ reply, metadata: reply.metadata })
    }
  } catch (err: unknown) {
    const error = err as Error
    console.error('[Chat Error]', error)
    res.status(500).json({ error: error.message || 'Failed to process chat response' })
  }
})

// 2. VISION & FILE INSPECTION
chatRouter.post('/chat/vision', requireAuth, upload.single('file'), async (req, res: Response) => {
  const { prompt = 'Explain and analyze this file/image in detail.' } = req.body
  const file = req.file

  if (!file) {
    return res.status(400).json({ error: 'No image or document file was uploaded' })
  }

  // File Signature (Magic Byte) Verification
  const buf = file.buffer
  const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  const isPng = buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  const isWebp = buf.length >= 12 && buf.toString('utf8', 8, 12) === 'WEBP'
  const isPdf = buf.length >= 4 && buf.toString('utf8', 0, 4) === '%PDF'
  const isTxt = file.mimetype === 'text/plain'

  if (!isJpeg && !isPng && !isWebp && !isPdf && !isTxt) {
    return res.status(400).json({
      error: 'File signature verification failed. Executable or disguised files are strictly rejected.',
      code: 'INVALID_FILE_SIGNATURE',
    })
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
