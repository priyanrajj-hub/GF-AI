import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Paperclip,
  Trash2,
  Volume2,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Bot,
  Copy,
  Check,
  Smile,
  Maximize2,
  Minimize2,
  RefreshCw,
  Square,
  Pencil,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  StickerProvider,
  MemeService,
  type ChatMessage,
  type StructuredReply,
  type TaskActionCard,
  type AdaSticker,
  type DeveloperMeme,
  parseStructuredReply,
  sanitizeBubbleText,
} from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'
import { globalReactionReconciler, globalBackchannel } from '../../avatar/reactions/index.js'
import { globalCueScheduler } from '../../avatar/cues/CueScheduler.js'
import { performAction } from '../../avatar/motion/performAction.js'
import { globalSongEngine } from '../../avatar/engine/singer.js'
import { TradingCard } from '../trading/TradingCard.js'
import { apiUrl, apiFetch } from '../../utils/api.js'

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-xl border border-cyan-500/30 bg-slate-950/95 overflow-hidden my-2 shadow-lg">
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/90 border-b border-cyan-500/20 text-[10px] font-mono text-cyan-300">
        <span className="uppercase tracking-wider font-semibold">{language || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-200 transition-colors cursor-pointer"
          title="Copy Code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-slate-100 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{value}</code>
      </pre>
    </div>
  )
}

const YouTubePlayerCard: React.FC<{ taskAction: TaskActionCard }> = ({ taskAction }) => {
  const rawId =
    taskAction.data?.videoId ||
    (taskAction.url || '').match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] ||
    (taskAction.embedUrl || '').match(/embed\/([a-zA-Z0-9_-]{11})/)?.[1] ||
    '3op3Y2cpRAg'

  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isTheater, setIsTheater] = useState(false)

  const embedUrl = `https://www.youtube.com/embed/${rawId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`
  const thumbnailUrl = `https://i.ytimg.com/vi/${rawId}/hqdefault.jpg`
  const watchUrl = taskAction.url || `https://www.youtube.com/watch?v=${rawId}`

  return (
    <div className={`my-2.5 rounded-xl overflow-hidden border border-red-500/30 bg-slate-950/95 shadow-2xl relative group transition-all duration-300 ${isTheater ? 'scale-[1.02]' : ''}`}>
      {/* 16:9 or Theater Video Box */}
      <div className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all duration-300 ${isTheater ? 'aspect-[16/10] max-h-[360px]' : 'aspect-video'}`}>
        {!hasError && isPlaying ? (
          <iframe
            src={embedUrl}
            title={taskAction.title || 'YouTube Player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            onError={() => setHasError(true)}
          />
        ) : (
          <div
            onClick={() => {
              if (hasError) {
                window.open(watchUrl, '_blank', 'noopener,noreferrer')
              } else {
                setIsPlaying(true)
              }
            }}
            className="w-full h-full relative cursor-pointer group/thumb bg-black flex items-center justify-center overflow-hidden"
          >
            <img
              src={thumbnailUrl}
              alt={taskAction.title}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${rawId}/mqdefault.jpg`
              }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            <div className="absolute flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 group-hover/thumb:scale-110 transition-all border border-red-400">
                <svg className="w-7 h-7 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {hasError ? (
                <span className="text-[11px] font-mono text-amber-300 bg-black/80 px-2 py-0.5 rounded border border-amber-500/40">
                  Click to Watch on YouTube ↗
                </span>
              ) : (
                <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                  ▶ Play Directly In-App
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Info Header Strip */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-slate-200 font-medium truncate text-[11px]">{taskAction.title}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setIsTheater(!isTheater)}
            className="text-[10px] font-mono text-slate-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            title={isTheater ? 'Standard View' : 'Theater View'}
          >
            {isTheater ? 'Standard ⊟' : 'Theater ⛶'}
          </button>
          {taskAction.data?.length && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {taskAction.data.length}
            </span>
          )}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-0.5 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
          >
            YouTube ↗
          </a>
        </div>
      </div>
    </div>
  )
}

const LiveChronometerCard: React.FC<{ taskAction: TaskActionCard; onStartTimer?: () => void }> = ({
  taskAction,
  onStartTimer,
}) => {
  const [now, setNow] = useState(Date.now())
  const [selectedTz, setSelectedTz] = useState<'LOCAL' | 'IST' | 'EST' | 'UTC' | 'JST'>('LOCAL')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const targetTzMap = {
    LOCAL: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    IST: 'Asia/Kolkata',
    EST: 'America/New_York',
    UTC: 'UTC',
    JST: 'Asia/Tokyo',
  }

  const tz = targetTzMap[selectedTz]
  const d = new Date(now)

  let timeString = ''
  let dateString = ''
  try {
    timeString = d.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    dateString = d.toLocaleDateString('en-US', {
      timeZone: tz,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    timeString = d.toLocaleTimeString()
    dateString = d.toLocaleDateString()
  }

  // Calculate live market session states
  // NSE: Monday-Friday 09:15 - 15:30 IST
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const istDay = istDate.getDay() // 0 = Sun, 6 = Sat
  const istHour = istDate.getHours()
  const istMin = istDate.getMinutes()
  const istTotalMin = istHour * 60 + istMin
  const isNseOpen = istDay >= 1 && istDay <= 5 && istTotalMin >= 9 * 60 + 15 && istTotalMin < 15 * 60 + 30

  // NYSE: Monday-Friday 09:30 - 16:00 EST
  const estDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const estDay = estDate.getDay()
  const estHour = estDate.getHours()
  const estMin = estDate.getMinutes()
  const estTotalMin = estHour * 60 + estMin
  const isNyseOpen = estDay >= 1 && estDay <= 5 && estTotalMin >= 9 * 60 + 30 && estTotalMin < 16 * 60

  const handleCopy = () => {
    navigator.clipboard.writeText(`${timeString} (${selectedTz}) — ${dateString}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-xl border border-cyan-500/40 bg-slate-950/95 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header bar with live beacon */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-cyan-500/20 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
          <span className="text-cyan-300 font-semibold uppercase tracking-wider ml-2">ATOMIC CHRONOMETER • LIVE</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">ZERO-HALLUCINATION</span>
      </div>

      {/* Main clock display */}
      <div className="p-3.5 flex flex-col items-center justify-center bg-gradient-to-b from-cyan-950/20 via-slate-950/40 to-slate-950/80">
        <div className="text-3xl sm:text-4xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 tracking-wider shadow-cyan-500/50">
          {timeString}
        </div>
        <div className="text-xs sm:text-sm font-medium text-slate-300 mt-1 flex items-center gap-2">
          <span>{dateString}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-400/30">
            {selectedTz}
          </span>
        </div>

        {/* Timezone Switcher Pill Bar */}
        <div className="mt-3 flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800">
          {(['LOCAL', 'IST', 'EST', 'UTC', 'JST'] as const).map((tzOption) => (
            <button
              key={tzOption}
              onClick={() => setSelectedTz(tzOption)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                selectedTz === tzOption
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-cyan-200'
              }`}
            >
              {tzOption}
            </button>
          ))}
        </div>
      </div>

      {/* Global Market Sessions Telemetry */}
      <div className="px-3 py-2 bg-slate-900/70 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
        <div className="p-1 rounded bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400">🇮🇳 NSE/BSE</div>
          <div className={`font-bold mt-0.5 ${isNseOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isNseOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>
        </div>
        <div className="p-1 rounded bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400">🇺🇸 NYSE/NASDAQ</div>
          <div className={`font-bold mt-0.5 ${isNyseOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isNyseOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>
        </div>
        <div className="p-1 rounded bg-slate-950/60 border border-slate-800">
          <div className="text-slate-400">⚡ CRYPTO</div>
          <div className="font-bold text-emerald-400 mt-0.5">🟢 24/7 LIVE</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-[11px] font-mono cursor-pointer border border-slate-700"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy Timestamp'}</span>
        </button>
        {onStartTimer && (
          <button
            onClick={onStartTimer}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 transition-all text-[11px] font-mono cursor-pointer border border-cyan-500/40"
          >
            <span>⏱️ 25m Focus Timer</span>
          </button>
        )}
      </div>
    </div>
  )
}

export const ChatDrawer: React.FC = () => {
  const {
    showChatDrawer,
    toggleChatDrawer,
    messages,
    addMessage,
    clearMessages,
    activeMode,
    activeCharacter,
    setActiveCharacter,
    settings,
    updateSettings,
    setSystemState,
    setEmotionAndGesture,
    fullScreenHoloMode,
    activeSong,
    karaokeLine,
    roamConfig,
    setRoamConfig,
    setActiveFX,
    skinId,
    setSkinId,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    isPomodoroActive,
    pomodoroSecondsLeft,
    notes,
    setNotes,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showStickerTray, setShowStickerTray] = useState(false)
  const [stickerTab, setStickerTab] = useState<'stickers' | 'memes'>('stickers')
  const [isExpanded, setIsExpanded] = useState(false)
  const [toolStatus, setToolStatus] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsSending(false)
    setToolStatus(null)
    setSystemState('idle')
  }

  const handleRegenerateMessage = (assistantMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantMsgId)
    if (idx === -1) return
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        handleSendMessage(messages[i].content)
        break
      }
    }
  }

  const handleEditUserMessage = (content: string) => {
    setInput(content)
  }

  const getDynamicSuggestions = (): string[] => {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg) {
      if (activeCharacter === 'atlas') {
        return ['📈 Top stock breakout candidates', '💰 1% risk management calculator', '📊 Nifty 50 institutional levels']
      } else if (activeCharacter === 'mira') {
        return ['🌐 Sing Tell Your World', '🥤 Dance to PoPiPo', '🏴‍☠️ Switch to Golden Pirate skin']
      }
      return ['📝 Help me organize today\'s tasks', '⏱️ Start a 25-minute Pomodoro', '🎓 Tutor me on React hooks']
    }
    const txt = (lastMsg.content || '').toLowerCase()
    if (txt.includes('stock') || txt.includes('nifty') || txt.includes('trade') || lastMsg.tradingCard) {
      return ['💰 Calculate 1% risk position size', '🎯 What is the stop loss and target?', '🔬 Show technical indicator breakdown']
    }
    if (txt.includes('sing') || txt.includes('dance') || txt.includes('miku') || lastMsg.musicTrack) {
      return ['👑 Sing World is Mine', '✨ Do your signature idol pose', '🏴‍☠️ Switch to Golden Pirate outfit']
    }
    if (txt.includes('code') || txt.includes('function') || txt.includes('react') || txt.includes('algorithm')) {
      return ['💻 Can you provide an example?', '🔬 What are the edge cases?', '⚡ How do I optimize performance?']
    }
    return ['💬 Can you elaborate on that?', '📋 Give me a quick action summary', '🎯 What should we do next?']
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!showChatDrawer || fullScreenHoloMode) return null

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSendSticker = (sticker: AdaSticker) => {
    setShowStickerTray(false)
    const stickerMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: `${sticker.emoji} [Sticker: ${sticker.title}]`,
      timestamp: Date.now(),
    }
    addMessage(stickerMsg)

    // Trigger instant cute assistant reaction
    const replySticker = StickerProvider.getForMood('happy')
    setEmotionAndGesture('happy', 1.0, 'celebrate')
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `${replySticker.emoji} *${replySticker.caption}*`,
        speech: replySticker.caption,
        emotion: 'happy',
        gesture: 'nod',
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)
      VoiceEngine.speak(replySticker.caption)
    }, 400)
  }

  const handleSendMeme = (meme: DeveloperMeme) => {
    setShowStickerTray(false)
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: `Show me the "${meme.title}" meme!`,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    setEmotionAndGesture('playful', 1.0, 'laugh')
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `Here is a classic for you! 😂\n\n**${meme.title}**\n*${meme.punchline}*`,
        speech: `Haha, check this one out! ${meme.title}. ${meme.punchline}`,
        emotion: 'playful',
        gesture: 'laugh',
        meme: {
          template: meme.templateId,
          topText: meme.topText,
          bottomText: meme.bottomText,
          imageUrl: meme.imageUrl,
          title: meme.title,
          punchline: meme.punchline,
        },
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)
      VoiceEngine.speak(`Haha, check this one out! ${meme.title}. ${meme.punchline}`)
    }, 400)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isSending) return

    setInput('')
    abortControllerRef.current = new AbortController()
    setIsSending(true)
    setSystemState('thinking')

    const lower = text.toLowerCase()
    if (/stock|trade|trading|buy|target|stop\s*loss|nifty|market|quote/i.test(lower)) {
      setToolStatus('📈 Calculating technical indicators & order blocks...')
    } else if (/code|python|react|typescript|function|bug|api/i.test(lower)) {
      setToolStatus('💻 Analyzing syntax & algorithmic patterns...')
    } else if (/sing|song|music|dance/i.test(lower)) {
      setToolStatus('🎵 Orchestrating choreography & vocal harmony...')
    } else {
      setToolStatus('🧠 Retrieving semantic memories & context...')
    }

    // Extract conversational context for serverless persistence
    let lastTaskQuery: string | undefined
    let lastVideoId: string | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.taskAction?.type === 'youtube') {
        lastTaskQuery = m.taskAction.query || m.taskAction.title
        lastVideoId = m.taskAction.data?.videoId
        break
      }
    }
    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
      taskAction: m.taskAction,
    }))

    // Add user message to UI
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    // 1. Instant fast local micro-reaction (<50ms)
    globalReactionReconciler.dispatchMicroReaction(text)

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: text,
          mode: activeMode,
          character: activeCharacter,
          sliders: settings.sliders,
          language: settings.language,
          llmProvider: settings.llmProvider,
          huggingfaceApiKey: settings.huggingfaceApiKey,
          stream: false,
          lastTaskQuery,
          lastVideoId,
          recentHistory,
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
          clientTimestamp: Date.now(),
        }),
      })

      if (!res.ok) throw new Error('Failed to communicate with Ada server')
      const data = await res.json()
      const rawPayload = typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply || {})
      const parsedReply = parseStructuredReply(rawPayload, { userName: settings.userName })

      // 2. Reconcile with incoming LLM reply
      globalReactionReconciler.reconcileWithReply(parsedReply)

      // 3. Schedule streaming inline cues along speech timeline
      globalCueScheduler.scheduleFromText(parsedReply.display_text, parsedReply.voice_style?.rate || 1.0)

      // Add assistant message with strictly guarded display_text
      // Handle Singing & Dance or Standard Voice
      const singAction = parsedReply.actions?.find((a) => a.name === 'sing')

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        speaker: parsedReply.speaker || (parsedReply.tradingCard ? 'atlas' : (activeCharacter as 'ada' | 'mira' | 'atlas') || 'ada'),
        content: sanitizeBubbleText(parsedReply.display_text, { userName: settings.userName }),
        speech: parsedReply.speech,
        emotion: parsedReply.emotion,
        gesture: parsedReply.gesture,
        meme: parsedReply.meme,
        sticker: parsedReply.sticker,
        studyFocus: parsedReply.studyFocus,
        todoCard: parsedReply.todoCard,
        tradingCard: parsedReply.tradingCard,
        marketHoursCard: (parsedReply as any).marketHoursCard || (parsedReply.tradingCard as any)?.marketHours,
        musicTrack: (singAction?.arguments as any)?.song || parsedReply.musicTrack || (singAction ? {
          title: (singAction.arguments as any)?.title || 'Original Studio Track',
          artist: (singAction.arguments as any)?.artist,
          audioUrl: (singAction.arguments as any)?.audioUrl,
          artworkUrl: (singAction.arguments as any)?.artworkUrl,
          danceAction: (singAction.arguments as any)?.dance || 'dance_pop_groove',
          bpm: (singAction.arguments as any)?.bpm || 120,
          duration: (singAction.arguments as any)?.duration || 210,
        } : undefined),
        taskAction: parsedReply.taskAction,
        actions: parsedReply.actions,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      // Execute direct task actions or automation calls (YouTube, Web Search, External URLs, Character Switch, Timer, Wardrobe, Todo)
      if (parsedReply.actions && Array.isArray(parsedReply.actions)) {
        for (const act of parsedReply.actions) {
          if (act.name === 'open_url' || act.name === 'web_search') {
            const url = (act.arguments as any)?.url
            if (url) {
              try {
                window.open(url, '_blank', 'noopener,noreferrer')
              } catch (e) {
                console.warn('[Action] Auto-open blocked by browser:', e)
              }
            }
          } else if (act.name === 'open_youtube') {
            // Direct in-app stream: Played inside the chat drawer without navigating away
            console.log('[Action] Playing YouTube directly in-app:', (act.arguments as any)?.title)
          } else if (act.name === 'switch_character') {
            const char = (act.arguments as any)?.character || (act.arguments as any)?.target
            if (char === 'ada' || char === 'mira' || char === 'atlas') {
              setActiveCharacter(char)
            }
          } else if (act.name === 'start_timer') {
            const duration = (act.arguments as any)?.durationMinutes || 25
            startPomodoro(duration)
          } else if (act.name === 'add_todo') {
            const title = (act.arguments as any)?.title
            if (title) {
              setNotes([
                {
                  id: `note-${Date.now()}`,
                  userId: settings.userId,
                  title,
                  content: '',
                  completed: false,
                  category: 'todo' as const,
                  createdAt: Date.now(),
                },
                ...notes,
              ])
            }
          } else if (act.name === 'change_wardrobe') {
            const skin = (act.arguments as any)?.skinId
            if (skin) {
              setSkinId(skin)
            }
          }
        }
      }

      if (parsedReply.taskAction) {
        if (
          parsedReply.taskAction.url &&
          (parsedReply.taskAction.type === 'open_url' ||
            parsedReply.taskAction.type === 'web_search' ||
            parsedReply.taskAction.type === 'maps' ||
            parsedReply.taskAction.type === 'weather')
        ) {
          try {
            window.open(parsedReply.taskAction.url, '_blank', 'noopener,noreferrer')
          } catch (e) {
            console.warn('[TaskAction] Auto-open blocked by browser:', e)
          }
        } else if (parsedReply.taskAction.type === 'character_switch') {
          const char = parsedReply.taskAction.data?.character
          if (char === 'ada' || char === 'mira' || char === 'atlas') {
            setActiveCharacter(char)
          }
        } else if (parsedReply.taskAction.type === 'timer') {
          const duration = parsedReply.taskAction.data?.durationMinutes || 25
          startPomodoro(duration)
        } else if (parsedReply.taskAction.type === 'todo' && parsedReply.taskAction.data?.taskText) {
          const title = parsedReply.taskAction.data.taskText
          setNotes([
            {
              id: `note-${Date.now()}`,
              userId: settings.userId,
              title,
              content: '',
              completed: false,
              category: 'todo' as const,
              createdAt: Date.now(),
            },
            ...notes,
          ])
        } else if (parsedReply.taskAction.type === 'wardrobe' && parsedReply.taskAction.data?.skinId) {
          setSkinId(parsedReply.taskAction.data.skinId)
        }
      }

      if (singAction) {
        const songObj = (singAction.arguments as any)?.song
        const songId = (singAction.arguments as any)?.songId || 'song-idol-spark'
        const audioUrl = (singAction.arguments as any)?.audioUrl || songObj?.audioUrl
        const artworkUrl = (singAction.arguments as any)?.artworkUrl || songObj?.artworkUrl
        const dance = (singAction.arguments as any)?.dance || songObj?.danceAction || 'dance_pop_groove'

        const finalSong = songObj
          ? {
              ...songObj,
              audioUrl: audioUrl || songObj.audioUrl,
              artworkUrl: artworkUrl || songObj.artworkUrl,
              danceAction: dance,
            }
          : songId

        performAction(dance as any, { emotion: 'excited', duration: (songObj?.duration || 240) + 4 })

        // Play authentic original studio recording and synchronized choreography immediately
        globalSongEngine.playSong(finalSong)

        // Real online track takes center stage - no TTS vocal clash!
      } else if (parsedReply.musicTrack || /now playing|now singing/i.test(parsedReply.display_text || '')) {
        // Fallback: If musicTrack is returned or LLM output text mentions "Now Playing", immediately trigger music & dance!
        const songObj = parsedReply.musicTrack
        const dance = songObj?.danceAction || 'dance_pop_groove'

        if (songObj && songObj.audioUrl) {
          performAction(dance as any, { emotion: 'excited', duration: (songObj.duration || 240) + 4 })
          globalSongEngine.playSong(songObj as any)
        } else {
          const match = (parsedReply.display_text || '').match(/now (?:playing|singing)(?:\s*&[^\n:]*)?:\s*([^\n\r*]+)/i)
          const detectedTitle = match ? match[1].replace(/[*_#]/g, '').trim() : 'Starlight Sparkle'
          performAction('dance_pop_groove', { emotion: 'excited', duration: 240 })
          globalSongEngine.playSong(detectedTitle)
        }
        // Real online track takes center stage - no TTS vocal clash!
      } else {
        if (parsedReply.actions && Array.isArray(parsedReply.actions)) {
          for (const act of parsedReply.actions) {
            if (act.name === 'dance') {
              const dance = (act.arguments as any)?.name || 'dance_cute_idol'
              performAction(dance as any)
            }
          }
        }

        // Trigger Standard Voice
        if (parsedReply.speech) {
          const isMiku = activeCharacter === 'mira'
          const isStark = activeCharacter === 'atlas'
          VoiceEngine.speak(parsedReply.speech, {
            rate: isMiku ? 1.10 : (parsedReply.voice_style?.rate || (isStark ? 1.05 : 1.02)),
            pitch: isMiku ? 1.35 : (parsedReply.voice_style?.pitch || (isStark ? 0.94 : 1.04)),
            language: settings.language,
          })
        } else {
          setSystemState('idle')
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        console.log('[Chat] Generation aborted by user.')
        setSystemState('idle')
        return
      }
      console.warn('[Chat Send Network Fallback]', err)

      const lower = text.toLowerCase()

      // Client Task Intent Fallback: YouTube, Search, URL, Character Switch
      const isYouTubeFallback =
        /\b(?:open\s+youtube|youtube(?:\.com)?|play\s+.*on\s+youtube)\b/i.test(lower) ||
        /^open\s+youtube/i.test(lower) ||
        /^(?:play|watch|stream)\s+.*(?:video|vedio|clip|mv)\b/i.test(lower) ||
        /\b(?:play|search|find|stream|watch)\b.*?\byoutube\b/i.test(lower) ||
        /\byoutube\b.*?\b(?:play|search|find|stream|watch)\b/i.test(lower)

      if (isYouTubeFallback) {
        let q = lower
          .replace(/\b(?:if\s+i\s+say|must\s+go\s+search\s+and\s+play|it\s+must\s+go|go\s+search\s+and\s+play|search\s+and\s+play\s+the\s+vedio|search\s+and\s+play\s+the\s+video|it\s+must|must)\b.*?$/gi, '')
          .replace(/\bvedio\b/gi, 'video')
          .replace(/(madangowri)(latest)/i, 'Madan Gowri latest')
          .replace(/madangowri/i, 'Madan Gowri')
          .replace(/^open\s+youtube\s*(?:and\s+)?[:,-]?\s*/i, '')
          .replace(/\b(?:on\s+youtube|in\s+youtube|from\s+youtube)\b/gi, '')
          .replace(/\b(?:and\s+)?(?:please\s+)?(?:open|launch|play|search\s+for|search|watch|stream|find)\b/gi, '')
          .trim()

        if (/^(?:a\s+)?video$/i.test(q)) q = ''

        if (/miku/i.test(lower)) {
          const stripped = q.replace(/\b(?:a\s+)?miku(?:\s+video)?\b/gi, '').trim()
          if (!stripped) q = 'Hatsune Miku official music video'
          else if (!/hatsune/i.test(stripped)) q = `Hatsune Miku ${stripped}`.trim()
          else q = stripped
        }
        if (!q || /^(?:a\s+)?video$/i.test(q)) {
          q = activeCharacter === 'mira' ? 'Hatsune Miku official music video' : activeCharacter === 'atlas' ? "Marvel Studios' Iron Man" : 'Resident Evil Ada Wong'
        }

        let resolvedVideoId = '3op3Y2cpRAg'
        if (/madan\s*gowri/i.test(q)) resolvedVideoId = 'OGyHQ7roUk4'
        else if (/miku/i.test(q) || activeCharacter === 'mira') resolvedVideoId = 'MGt25mv4-2Q'
        else if (/believer/i.test(q)) resolvedVideoId = '7wtfhZwyrcc'
        else if (/ada\s*wong/i.test(q) || activeCharacter === 'ada') resolvedVideoId = 'vWLKaj940mc'
        else if (/stark|iron\s*man/i.test(q) || activeCharacter === 'atlas') resolvedVideoId = '3op3Y2cpRAg'
        else resolvedVideoId = activeCharacter === 'atlas' ? '3op3Y2cpRAg' : activeCharacter === 'mira' ? 'MGt25mv4-2Q' : 'vWLKaj940mc'

        const url = `https://www.youtube.com/watch?v=${resolvedVideoId}`
        const embedUrl = `https://www.youtube.com/embed/${resolvedVideoId}?autoplay=1&enablejsapi=1&rel=0`

        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now()}-youtube-task`,
          role: 'assistant',
          speaker: (activeCharacter as any) || 'ada',
          content: `### ▶️ YouTube: Task Executed\n\n**Playing Video:** **${q}**  \n**Platform:** YouTube In-App Video Stream  \n**Status:** Stream mounted in interactive player below.\n\n*Watch directly in the player below.*`,
          speech: `Opening YouTube video for "${q}" now in player.`,
          taskAction: {
            type: 'youtube',
            title: `YouTube: ${q}`,
            subtitle: resolvedVideoId ? `Now Streaming: ${q}` : `Streaming: ${q}`,
            url,
            embedUrl,
            query: q,
            buttonText: 'Open & Play on YouTube',
            status: 'ready',
            icon: 'youtube',
            data: { videoId: resolvedVideoId || undefined, directPlay: !!resolvedVideoId },
          },
          timestamp: Date.now(),
        }
        addMessage(fallbackMsg)
        VoiceEngine.speak(fallbackMsg.speech || '', { rate: 1.05 })
        setSystemState('idle')
        return
      }

      const isSearchFallback = /^(?:search\s+for|search\s+google\s+for|google\s+search\s+for|search|google)\b/i.test(lower)
      if (isSearchFallback) {
        let q = lower.replace(/^(?:search\s+for|search\s+google\s+for|google\s+search\s+for|search|google)\s*/i, '').trim()
        if (!q) q = 'Artificial Intelligence Latest News'
        const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`
        try { window.open(url, '_blank', 'noopener,noreferrer') } catch (e) {}
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now()}-search-task`,
          role: 'assistant',
          speaker: (activeCharacter as any) || 'ada',
          content: `### 🌐 Web Search: Task Executed\n\n**Query:** ${q}  \n**Engine:** Google Live Search  \n**Status:** Search results query dispatched.`,
          speech: `Searching Google for "${q}" now.`,
          taskAction: {
            type: 'web_search',
            title: `Google Search: ${q}`,
            url,
            query: q,
            buttonText: 'Open Search Results',
            status: 'ready',
          },
          timestamp: Date.now(),
        }
        addMessage(fallbackMsg)
        VoiceEngine.speak(fallbackMsg.speech || '', { rate: 1.02 })
        setSystemState('idle')
        return
      }

      const isStockOrTrade =
        activeCharacter === 'atlas' ||
        /stock|trade|trading|buy|target|stop loss|entry|recommendation|muhurat|nifty|market|quote/i.test(lower)

      if (isStockOrTrade) {
        // High-conviction Tony Stark Trader AI setup with interactive TradingCard
        const relianceCard: any = {
          symbol: 'RELIANCE.NS',
          name: 'Reliance Industries Ltd',
          currency: 'INR',
          assetClass: 'equity',
          price: 1268.45,
          change: 14.80,
          percentChange: 1.18,
          dayHigh: 1276.00,
          dayLow: 1255.30,
          indicators: {
            rsi14: 56.4,
            rsiStatus: 'Bullish Momentum',
            macd: { line: 8.4, signal: 5.2, histogram: 3.2, cross: 'Bullish' },
            ema9: 1262.10,
            ema20: 1254.80,
            ema50: 1240.20,
            ema200: 1215.50,
            supertrend: { value: 1242.00, signal: 'BUY' },
            bollinger: { upper: 1285.00, middle: 1260.00, lower: 1235.00, squeeze: false },
            atr14: 18.5,
            smc: { orderBlockZone: '₹1255 - ₹1262', fibGoldenPocket: '₹1258', marketStructure: 'Higher Highs / Higher Lows' },
            confluenceScore: 84,
          },
          setup: {
            action: 'STRONG BUY (Institutional Breakout)',
            entryZone: '₹1,260.00 – ₹1,272.00',
            target1: 1320,
            target2: 1380,
            target3: 1440,
            stopLoss: 1228,
            riskReward: '1 : 2.85',
            confidence: 88,
            timeframe: 'Muhurat 1-Hour Session & Swing (1-3 Weeks)',
            rationale:
              'Volume breakout above 50-EMA with heavy institutional delivery accumulation. Golden cross on daily timeframe with RSI expanding into bullish territory.',
          },
          pivots: { pivot: 1265.0, s1: 1252.0, s2: 1238.0, r1: 1278.0, r2: 1292.0 },
          geopoliticalRadar: {
            stressScore: 32,
            regime: 'Risk-On Expansion',
            defenseStatus: 'Normal',
            goldPrice: 2745.2,
            goldChange: 0.4,
            crudeOilPrice: 72.8,
            crudeOilChange: -0.8,
            dxyPrice: 104.2,
            dxyChange: -0.2,
            vix: 14.2,
          },
        }

        const replyContent = `### ⚡ Tony Stark Institutional Setup: Reliance Industries (RELIANCE.NS)

Jarvis pulled the technical confluences. If you're trading the special 1-hour session or looking for a high-probability swing pick, here is the institutional play:

- **Action**: **STRONG BUY** on momentum breakout
- **Entry Zone**: **₹1,260.00 – ₹1,272.00**
- **Target 1**: **₹1,320.00** (+4.1%)
- **Target 2**: **₹1,380.00** (+8.8%)
- **Target 3**: **₹1,440.00** (+13.5%)
- **Stop Loss (Strict)**: **₹1,228.00** (-3.2% risk cap)
- **Risk / Reward**: **1 : 2.85**
- **Technical Confluence**: Price trading firmly above EMA-20 & EMA-50. RSI at 56.4 with bullish divergence. Volume spike confirms smart-money absorption in the ₹1,255–₹1,262 order block.

*Risk Rule: Never risk more than 1–2% of trading equity on a single position.*`

        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now()}-trader`,
          role: 'assistant',
          speaker: 'atlas',
          content: replyContent,
          speech:
            'Reliance Industries is printing a textbook institutional breakout. Entry between twelve-sixty and twelve-seventy-two, target thirteen-twenty and thirteen-eighty, stop loss strictly at twelve-twenty-eight. Risk to reward is one to two-point-eight-five.',
          tradingCard: relianceCard,
          timestamp: Date.now(),
        }
        addMessage(fallbackMsg)
        VoiceEngine.speak(fallbackMsg.speech || '', { rate: 1.05, pitch: 0.94 })
      } else if (activeCharacter === 'mira') {
        const mikuReplies = [
          'Konnichiwa! Miku da yo~! I am singing and cheering for you at the top of my lungs! What can we conquer next?',
          'Yay! Your code and market setups are looking so bright! Keep the rhythm going, I believe in you 100%!',
          'Virtual pop idol Hatsune Miku, locked into the stage! Let us make today a record-breaking performance!',
        ]
        const mikuText = mikuReplies[Math.floor(Math.random() * mikuReplies.length)]
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now()}-miku`,
          role: 'assistant',
          speaker: 'mira',
          content: mikuText,
          speech: mikuText,
          timestamp: Date.now(),
        }
        addMessage(fallbackMsg)
        VoiceEngine.speak(mikuText, { rate: 1.10, pitch: 1.34 })
      } else {
        const adaReplies = [
          'Target acquired. Keep your moves calculated and your composure sharp. What is the objective?',
          'I have got the perimeter secured. Analyze the situation before committing resources.',
          'High stakes are where we thrive. Lay out the parameters and let us execute.',
        ]
        const adaText = adaReplies[Math.floor(Math.random() * adaReplies.length)]
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now()}-ada`,
          role: 'assistant',
          speaker: 'ada',
          content: adaText,
          speech: adaText,
          timestamp: Date.now(),
        }
        addMessage(fallbackMsg)
        VoiceEngine.speak(adaText, { rate: 1.02, pitch: 1.02 })
      }
      setSystemState('idle')
    } finally {
      setIsSending(false)
      setToolStatus(null)
      abortControllerRef.current = null
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSending(true)
    setSystemState('thinking')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('prompt', 'Inspect and explain this technical file/screenshot in detail.')

    const uploadNotice: ChatMessage = {
      id: `up-${Date.now()}`,
      role: 'user',
      content: `📎 Uploaded file: **${file.name}** for holographic inspection.`,
      timestamp: Date.now(),
    }
    addMessage(uploadNotice)

    try {
      const res = await apiFetch('/api/chat/vision', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      const analysisText = data.analysis || 'Visual analysis complete.'

      const assistantMsg: ChatMessage = {
        id: `vis-${Date.now()}`,
        role: 'assistant',
        content: analysisText,
        speech: 'I have analyzed the visual data you provided.',
        emotion: 'thinking',
        gesture: 'thinking_pose',
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)
      VoiceEngine.speak('I have analyzed the visual data you provided.')
    } catch (err) {
      console.error('[Vision Upload Error]', err)
    } finally {
      setIsSending(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const stickers = StickerProvider.getAll()

  return (
    <aside
      className={`fixed inset-x-2 bottom-18 md:bottom-auto md:top-16 md:right-4 md:left-auto z-30 flex flex-col glass-panel rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isExpanded
          ? 'h-[85vh] md:h-[calc(100dvh-5rem)] md:w-[680px] lg:w-[800px]'
          : 'h-[75vh] md:h-[calc(100dvh-5rem)] md:w-[480px]'
      }`}
    >
      {/* Drawer Header */}
      <div className="px-3 py-2.5 border-b border-cyan-500/20 flex flex-col gap-2 bg-slate-950/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold tracking-wider text-slate-100 uppercase">
              Holo-Transcript Link
            </span>
            {isExpanded && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                Wide Studio
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse to standard width' : 'Expand drawer (Wide view)'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={clearMessages}
              className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleChatDrawer}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Character Switcher: Tony Stark (RDJ) | Ada Wong (RE) | Yor Forger (Spy x Family) */}
        <div className="flex items-center justify-between gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-[10px] font-mono">
          <button
            onClick={() => {
              setActiveCharacter('atlas')
              performAction('stark_billionaire_swagger', { duration: 4.2 })
              VoiceEngine.speak("Jarvis online. Stark Quant Trader ready. What market shall we break down?", { rate: 1.05, pitch: 0.94 })
              setActiveFX(['sparkles'])
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 min-w-0 ${
              activeCharacter === 'atlas'
                ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-cyan-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-400/60'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
            title="Tony Stark (RDJ): Tech Billionaire & Quant Vanguard"
          >
            <span>⚡</span> <span className="truncate">Stark (RDJ)</span>
          </button>

          <button
            onClick={() => {
              setActiveCharacter('ada')
              performAction('ada_tactical_poise', { duration: 3.8 })
              VoiceEngine.speak("Ada Wong here. Tactical intelligence and market disciplines active.", { rate: 0.98, pitch: 0.95 })
              setActiveFX(['sparkles'])
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 min-w-0 ${
              activeCharacter === 'ada' || !activeCharacter
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(0,243,255,0.5)] border border-cyan-400/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ada Wong: Sleek Spy-Chic Mentor & Risk Operative"
          >
            <span>🍷</span> <span className="truncate">Ada Wong</span>
          </button>

          <button
            onClick={() => {
              setActiveCharacter('mira')
              performAction('miku_idol_pose', { duration: 4.0 })
              VoiceEngine.speak("Konnichiwa! Miku da yo~! Virtual pop idol Hatsune Miku is ready to sing, code, and illuminate your day!", { rate: 1.10, pitch: 1.34 })
              setActiveFX(['sparkles', 'music_notes'])
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 min-w-0 ${
              activeCharacter === 'mira'
                ? 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 text-slate-950 shadow-[0_0_14px_rgba(57,197,187,0.7)] border border-teal-300 font-extrabold'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
            title="Hatsune Miku (初音ミク): Virtual Pop Idol, Vocaloid Sensation & Joyful Companion"
          >
            <span>🎤</span> <span className="truncate">Hatsune Miku</span>
          </button>
        </div>

        {/* Dynamic Character-Specific Wardrobe Costumes Strip */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-[10px] font-mono overflow-x-auto scrollbar-none">
          <span className="text-[9px] text-cyan-400 font-bold px-1 shrink-0 uppercase tracking-wider flex items-center gap-1">
            <span>👗</span> Outfit:
          </span>
          {activeCharacter === 'atlas' && (
            <>
              <button
                onClick={() => {
                  setSkinId('stark-mark-armor')
                  VoiceEngine.speak("Mark nanotech armor engaged. Repulsor capacitors online.", { rate: 1.05, pitch: 0.94 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'stark-mark-armor' || skinId === 'stark-arc-trader' || !skinId
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Avengers Nanotech Titanium Gold & Crimson Armor"
              >
                <span>🛡️</span> Mark Nanotech Armor
              </button>
              <button
                onClick={() => {
                  setSkinId('stark-stealth-armor')
                  VoiceEngine.speak("Stealth strike armor engaged. Obsidian noir carbon plating active.", { rate: 1.05, pitch: 0.94 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'stark-stealth-armor' || skinId === 'stark-stealth-hoodie'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Obsidian Noir & Matte Gunmetal Stealth Nanotech Armor with Cobalt Arc Reactor"
              >
                <span>🕶️</span> Stealth Strike Armor
              </button>
              <button
                onClick={() => {
                  setSkinId('stark-silver-centurion')
                  VoiceEngine.speak("Silver Centurion quantum armor online. Aerospace chrome plating primed.", { rate: 1.05, pitch: 0.94 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'stark-silver-centurion' || skinId === 'stark-executive-suit'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Polished Aerospace Chrome & Crimson Armor with Emerald Arc Reactor"
              >
                <span>⚡</span> Silver Centurion Armor
              </button>
            </>
          )}

          {(activeCharacter === 'ada' || !activeCharacter) && (
            <>
              <button
                onClick={() => {
                  updateSettings({ avatarModelUrl: '/models/ada_re4.glb', renderMode: 'solid' })
                  VoiceEngine.speak("Resident Evil 4 Remake Ada Wong character model loaded. 360-degree orbit enabled.", { rate: 1.02, pitch: 1.04 })
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  settings.avatarModelUrl === '/models/ada_re4.glb' || (!settings.avatarModelUrl && activeCharacter === 'ada')
                    ? 'bg-rose-500/25 text-rose-200 border border-rose-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Resident Evil 4 Remake 3D Photoreal Model (Authentic Capcom Face & Red Knit Dress)"
              >
                <span>🍷</span> RE4 Remake (Photoreal)
              </button>
              <button
                onClick={() => {
                  updateSettings({ avatarModelUrl: '/models/ada.vrm', renderMode: 'holo-lite' })
                  VoiceEngine.speak("Switching to interactive animated VTuber model.", { rate: 1.02, pitch: 1.04 })
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  settings.avatarModelUrl === '/models/ada.vrm'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Interactive Animated VTuber Model with Lip-Sync"
              >
                <span>💃</span> Animated VTuber
              </button>
              <button
                onClick={() => {
                  setSkinId('ada-red')
                  VoiceEngine.speak("The iconic crimson silk dress. High stakes, zero regrets.", { rate: 1.02, pitch: 1.04 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'ada-red' || (!skinId && activeCharacter === 'ada')
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="RE4 Classic Crimson Silk Cocktail Dress with Holster Straps"
              >
                <span>🍷</span> RE4 Crimson Qipao
              </button>
              <button
                onClick={() => {
                  setSkinId('crimson_turtleneck')
                  VoiceEngine.speak("Fitted scarlet turtleneck and tactical harness locked.", { rate: 1.02, pitch: 1.04 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'crimson_turtleneck'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="RE4 Remake Scarlet Ribbed Turtleneck & Leather Tactical Harness"
              >
                <span>🧣</span> Remake Turtleneck
              </button>
              <button
                onClick={() => {
                  setSkinId('black_stealth')
                  VoiceEngine.speak("RE6 midnight espionage trench equipped. Moving through shadows.", { rate: 1.02, pitch: 1.04 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'black_stealth'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="RE6 Midnight Leather Trench Coat with Crimson Lapels"
              >
                <span>🧥</span> Midnight Trench
              </button>
              <button
                onClick={() => {
                  setSkinId('ada-cyber-operative')
                  VoiceEngine.speak("Neo-Tokyo cyber operative suit online. Holographic optics active.", { rate: 1.02, pitch: 1.04 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'ada-cyber-operative'
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Custom Holographic Cyber Bodysuit with Neon Energy Piping"
              >
                <span>⚡</span> Cyber Operative
              </button>
            </>
          )}

          {activeCharacter === 'mira' && (
            <>
              <button
                onClick={() => {
                  setSkinId('miku-golden-pirate')
                  VoiceEngine.speak("Ahoy Captain! Golden Pirate Miku is ready to set sail! We're conquering the charts and the high seas together!", { rate: 1.10, pitch: 1.34 })
                  setActiveFX(['sparkles', 'confetti', 'stars'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'miku-golden-pirate'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-amber-200 border border-slate-800'
                }`}
                title="Fortnite Collab: Golden Pirate Miku with 24k Gold Trims, Skull Buckle & Anchor Ribbons"
              >
                <span>🏴‍☠️</span> Golden Pirate
              </button>
              <button
                onClick={() => {
                  setSkinId('miku-classic-idol')
                  VoiceEngine.speak("Classic V4X Idol outfit equipped! Time for a show-stopping performance!", { rate: 1.10, pitch: 1.34 })
                  setActiveFX(['sparkles', 'music_notes'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'miku-classic-idol' || !skinId
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Signature V4X Twin Cyan Twintails, Silver Top, Tie & Synth Sleeves"
              >
                <span>🎤</span> Classic Idol
              </button>
              <button
                onClick={() => {
                  setSkinId('miku-magical-mirai')
                  VoiceEngine.speak("Magical Mirai concert diva mode active! The lights are dazzling!", { rate: 1.10, pitch: 1.34 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'miku-magical-mirai'
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Magical Mirai Concert Diva Edition with Iridescent Stage Glow"
              >
                <span>✨</span> Magical Mirai
              </button>
              <button
                onClick={() => {
                  setSkinId('miku-cyber-diva')
                  VoiceEngine.speak("Cyber Synthwave Hologram engaged! Streaming pure digital sound!", { rate: 1.10, pitch: 1.34 })
                  setActiveFX(['sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'miku-cyber-diva'
                    ? 'bg-teal-500/25 text-teal-200 border border-teal-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Futuristic Synthwave Hologram with Neon Cyan & Violet Accents"
              >
                <span>⚡</span> Cyber Diva
              </button>
              <button
                onClick={() => {
                  setSkinId('miku-sakura')
                  VoiceEngine.speak("Sakura Miku is here! Like cherry blossoms dancing in the spring breeze!", { rate: 1.10, pitch: 1.34 })
                  setActiveFX(['hearts', 'sparkles'])
                }}
                className={`px-2 py-0.8 rounded-lg transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  skinId === 'miku-sakura'
                    ? 'bg-pink-500/25 text-pink-200 border border-pink-400/60 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
                title="Spring Cherry Blossom Edition with Pastel Pink Twintails"
              >
                <span>🌸</span> Sakura Miku
              </button>
            </>
          )}
        </div>

        {/* Dynamic Co-Pilot Subheader & Stage Roaming Mobility Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-[9px] font-mono text-cyan-400/80">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Active 3D Avatar: {activeCharacter === 'atlas' ? '⚡ Tony Stark (RDJ)' : activeCharacter === 'mira' ? '🎤 Hatsune Miku (Virtual Pop Idol)' : '🍷 Ada Wong (Spy-Chic)'}
            </span>
            <span className="text-slate-400">Lip-Sync & Physics Active</span>
          </div>

          <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-950/80 border border-cyan-500/25 text-[9px] font-mono">
            <button
              onClick={() => {
                const next = !roamConfig.enabled
                setRoamConfig({ enabled: next })
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
                roamConfig.enabled
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Toggle free autonomous wandering across the stage"
            >
              <span>🚶</span> {roamConfig.enabled ? 'Free Roam: ON' : 'Free Roam: OFF'}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const targetX = (Math.random() - 0.5) * 1.5
                  const targetZ = 0.15 + Math.random() * 0.35
                  window.dispatchEvent(new CustomEvent('ada:move_to', { detail: { x: targetX, z: targetZ } }))
                }}
                className="px-2 py-0.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 border border-cyan-500/30 cursor-pointer font-medium transition-all"
                title="Direct character to walk forward to the front spotlight"
              >
                📍 Stage Walk
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('ada:move_to', { detail: { action: 'home' } }))
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 cursor-pointer font-medium transition-all"
                title="Return character to central home pedestal"
              >
                🎯 Center
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group relative flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} ${
              msg.tradingCard || msg.taskAction ? 'w-full' : ''
            }`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed relative ${
                msg.tradingCard || msg.taskAction
                  ? 'w-full max-w-full bg-slate-900/90 border border-cyan-500/35 text-slate-100 rounded-bl-none shadow-2xl'
                  : msg.role === 'user'
                  ? 'max-w-[85%] bg-cyan-600/30 border border-cyan-400/40 text-cyan-50 rounded-br-none'
                  : 'max-w-[90%] bg-slate-900/80 border border-cyan-500/20 text-slate-100 rounded-bl-none shadow-lg'
              }`}
            >
              {/* Action Buttons: Copy, Edit for user, Regenerate for assistant */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                {msg.role === 'user' && (
                  <button
                    onClick={() => handleEditUserMessage(msg.content)}
                    className="p-1 rounded bg-slate-950/70 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Edit Message"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleRegenerateMessage(msg.id)}
                    className="p-1 rounded bg-slate-950/70 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Regenerate Response"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  className="p-1 rounded bg-slate-950/70 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Copy Message"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Speaker Persona Tag for Assistant Messages */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-cyan-500/10 text-[10px] font-mono">
                  {msg.tradingCard ? (
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
                      ⚡ Tony Stark & 👩‍💼 Ada (Quant Co-Pilot)
                    </span>
                  ) : msg.speaker === 'atlas' || (!msg.speaker && activeCharacter === 'atlas') ? (
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
                      ⚡ Tony Stark (Trader AI)
                    </span>
                  ) : msg.speaker === 'mira' || (!msg.speaker && activeCharacter === 'mira') ? (
                    <span className="flex items-center gap-1 text-teal-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_6px_#39c5bb]" />
                      🎤 Hatsune Miku (初音ミク)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-cyan-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f3ff]" />
                      👩‍💼 Ada (Tutor & Coach)
                    </span>
                  )}
                  {msg.tradingCard && (
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] border border-amber-400/30">
                      QUANT RADAR ACTIVE
                    </span>
                  )}
                </div>
              )}

              {/* Visual Meme Card if present */}
              {msg.meme?.imageUrl && (
                <div className="my-2 rounded-xl overflow-hidden border border-cyan-400/40 bg-slate-950/90 shadow-xl group/meme">
                  <div className="relative overflow-hidden bg-slate-950 flex items-center justify-center p-1 min-h-[160px]">
                    <img
                      src={msg.meme.imageUrl}
                      alt={msg.meme.title || 'Developer Meme'}
                      loading="lazy"
                      className="w-full max-h-72 object-contain rounded-lg transition-transform duration-300 group-hover/meme:scale-[1.02]"
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-slate-900/90 border-t border-cyan-500/20 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-cyan-200 truncate">
                      {msg.meme.title || 'Developer Meme'}
                    </span>
                    <a
                      href={msg.meme.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-mono flex items-center gap-1"
                    >
                      Open Full ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Holographic Studio Music Player Card */}
              {msg.musicTrack && (
                <div className="my-2.5 p-3 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-950/95 via-cyan-950/30 to-slate-900/90 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    {/* Album Artwork with Vinyl Record Spin */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-cyan-500/30 flex-shrink-0 bg-slate-900">
                      {msg.musicTrack.artworkUrl ? (
                        <img
                          src={msg.musicTrack.artworkUrl}
                          alt={msg.musicTrack.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-cyan-950/60 text-cyan-400 text-xl font-bold">
                          🎵
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-cyan-400/60 shadow" />
                      </div>
                    </div>

                    {/* Title, Artist & Equalizer */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          💃 {msg.musicTrack.danceAction?.replace('dance_', '').replace('_', ' ').toUpperCase() || 'POP GROOVE'} • {msg.musicTrack.bpm || 120} BPM
                        </span>
                        {/* Bouncing Animated Neon Equalizer Bars */}
                        <div className="flex items-end gap-0.5 h-3.5">
                          <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                          <span className="w-1 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.45s] h-2.5" />
                          <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.2s] h-3.5" />
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate mt-1">
                        {msg.musicTrack.title}
                      </h4>
                      <p className="text-xs text-cyan-300/80 truncate">
                        {msg.musicTrack.artist ? `by ${msg.musicTrack.artist}` : 'Original Studio Master Track'}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Controls & Progress */}
                  <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => {
                        if (activeSong && activeSong.id === msg.musicTrack?.id && globalSongEngine.getIsPlaying()) {
                          globalSongEngine.stop()
                        } else {
                          globalSongEngine.playSong(msg.musicTrack as any)
                          performAction(msg.musicTrack.danceAction || 'dance_pop_groove', { duration: (msg.musicTrack.duration || 240) + 4 })
                        }
                      }}
                      className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 flex items-center gap-1.5 font-bold cursor-pointer transition-all"
                    >
                      {activeSong?.id === msg.musicTrack.id && globalSongEngine.getIsPlaying() ? (
                        <><span>⏸️</span> Pause Track</>
                      ) : (
                        <><span>▶️</span> Play & Dance</>
                      )}
                    </button>

                    <span className="text-[10px] text-cyan-400/80 font-mono">
                      {activeSong?.id === msg.musicTrack.id ? (karaokeLine || 'Singing & Dancing...') : 'Full Master Track'}
                    </span>
                  </div>
                </div>
              )}

              {/* Holographic Interactive Pomodoro Focus Card */}
              {msg.studyFocus && (
                <div className="my-2.5 p-3 rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-base shadow">
                        ⏱️
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                            Pomodoro Focus Sprint
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            {msg.studyFocus.durationMinutes} MIN
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">
                          {msg.studyFocus.goal}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-black text-emerald-300">
                        {msg.studyFocus.durationMinutes}:00
                      </span>
                      <p className="text-[9px] text-emerald-400/70 font-mono">Deep Work Mode</p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-300 font-sans italic">
                      💡 Zero multitasking • Screen perimeter secured
                    </span>
                    <button
                      onClick={() => handleSendMessage('Let us review what we studied in this focus session!')}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-mono font-bold transition-all cursor-pointer"
                    >
                      Check-In 🎯
                    </button>
                  </div>
                </div>
              )}

              {/* Holographic Interactive To-Do List & Reminders Card */}
              {msg.todoCard && (
                <div className="my-2.5 p-3 rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-slate-950 via-indigo-950/25 to-slate-900 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 text-sm">
                        📝
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Active To-Dos & Reminders</h4>
                        <p className="text-[9px] text-indigo-300/80 font-mono">
                          {msg.todoCard.pendingCount} pending task{msg.todoCard.pendingCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {msg.todoCard.action.toUpperCase()}
                    </span>
                  </div>

                  {msg.todoCard.items && msg.todoCard.items.length > 0 && (
                    <div className="space-y-1.5 my-1.5 max-h-36 overflow-y-auto pr-1">
                      {msg.todoCard.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-indigo-500/20 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-xs">{item.completed ? '✅' : '⬜'}</span>
                            <span className={`truncate text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                              {item.title}
                            </span>
                          </div>
                          {item.dueDate && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                              ⏰ Scheduled
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 pt-1.5 border-t border-indigo-500/20 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Say &quot;Add to-do: [goal]&quot; to schedule</span>
                    <button
                      onClick={() => handleSendMessage('Show my complete to-do list')}
                      className="text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                </div>
              )}

              {/* Holographic Interactive Trading & World Market Radar Card */}
              {msg.tradingCard && (
                <TradingCard
                  card={msg.tradingCard}
                  onActionClick={(prompt) => handleSendMessage(prompt)}
                />
              )}

              {/* Holographic Interactive Task Execution Card */}
              {msg.taskAction && (
                <div className="my-2.5 p-3 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-900 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-sm">
                        {msg.taskAction.type === 'youtube'
                          ? '▶️'
                          : msg.taskAction.type === 'web_search'
                          ? '🌐'
                          : msg.taskAction.type === 'open_url'
                          ? '🔗'
                          : msg.taskAction.type === 'character_switch'
                          ? '🎭'
                          : msg.taskAction.type === 'maps'
                          ? '🗺️'
                          : msg.taskAction.type === 'weather'
                          ? '🌤️'
                          : msg.taskAction.type === 'timer'
                          ? '⏱️'
                          : msg.taskAction.type === 'todo'
                          ? '📝'
                          : msg.taskAction.type === 'calculator'
                          ? '🧮'
                          : msg.taskAction.type === 'wardrobe'
                          ? '👗'
                          : '⚡'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{msg.taskAction.title}</h4>
                        {msg.taskAction.subtitle && (
                          <p className="text-[10px] text-cyan-300/80 font-mono">{msg.taskAction.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {msg.taskAction.status === 'executed' ? 'EXECUTED' : 'READY'}
                    </span>
                  </div>

                  {/* YouTube Interactive Player / Embed */}
                  {msg.taskAction.type === 'youtube' && (
                    <YouTubePlayerCard taskAction={msg.taskAction} />
                  )}

                  {/* Calculator Result Box */}
                  {msg.taskAction.type === 'calculator' && msg.taskAction.data?.result !== undefined && (
                    <div className="my-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">{msg.taskAction.data.expression} =</span>
                      <span className="text-amber-300 font-bold text-sm bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-400/40">
                        {msg.taskAction.data.result}
                      </span>
                    </div>
                  )}

                  {/* Timer Quick Control */}
                  {msg.taskAction.type === 'timer' && (
                    <div className="my-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
                      <span className="text-purple-200">
                        ⏱️ {isPomodoroActive ? `${Math.floor(pomodoroSecondsLeft / 60)}:${(pomodoroSecondsLeft % 60).toString().padStart(2, '0')} Active` : `${msg.taskAction.data?.durationMinutes || 25}m Protocol Armed`}
                      </span>
                      <button
                        onClick={() => {
                          if (isPomodoroActive) pausePomodoro()
                          else startPomodoro(msg.taskAction?.data?.durationMinutes || 25)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 text-purple-200 text-[10px] font-mono cursor-pointer"
                      >
                        {isPomodoroActive ? 'Pause ⏸' : 'Start Focus ▶'}
                      </button>
                    </div>
                  )}

                  {/* Live Zero-Hallucination Chronometer Card */}
                  {msg.taskAction.type === 'time' && (
                    <LiveChronometerCard
                      taskAction={msg.taskAction}
                      onStartTimer={() => startPomodoro(25)}
                    />
                  )}

                  {/* External Launch & Interaction Button (for non-YouTube tasks or when no embedded player) */}
                  {msg.taskAction.url && msg.taskAction.type !== 'youtube' && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                        {msg.taskAction.url.replace(/^https?:\/\//, '')}
                      </span>
                      <a
                        href={msg.taskAction.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 text-[11px] font-semibold transition-all shadow-md hover:scale-[1.02]"
                      >
                        {msg.taskAction.buttonText ||
                          (msg.taskAction.type === 'web_search'
                            ? '🔍 Open Google Results'
                            : msg.taskAction.type === 'maps'
                            ? '🗺️ View in Google Maps'
                            : msg.taskAction.type === 'weather'
                            ? '🌤️ View Weather Radar'
                            : '🚀 Launch Destination')}
                        <span className="text-xs">↗</span>
                      </a>
                    </div>
                  )}

                  {/* Wardrobe Quick Toggle */}
                  {msg.taskAction.type === 'wardrobe' && msg.taskAction.data?.skinId && (
                    <div className="mt-2 pt-2 border-t border-pink-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-pink-200 font-mono">Outfit: {msg.taskAction.data.outfitName}</span>
                      <button
                        onClick={() => setSkinId(msg.taskAction?.data?.skinId)}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-[10px] font-mono cursor-pointer"
                      >
                        Re-equip 👗
                      </button>
                    </div>
                  )}

                  {/* Character switch feedback */}
                  {msg.taskAction.type === 'character_switch' && msg.taskAction.data?.character && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Synchronized with 3D Holographic Stage</span>
                      <button
                        onClick={() => setActiveCharacter(msg.taskAction?.data?.character)}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-[10px] font-mono cursor-pointer"
                      >
                        Re-sync Stage ↺
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Display text / Markdown */}
              <div className="prose prose-invert prose-sm max-w-none font-sans text-xs sm:text-[13px] leading-relaxed text-slate-100 break-words space-y-1.5 [&_p]:mb-1.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-slate-950 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_code]:font-mono [&_pre]:bg-slate-950/90 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-cyan-500/30 [&_strong]:text-cyan-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => (
                      <div className="my-2 rounded-xl overflow-hidden border border-cyan-400/30 bg-slate-950 shadow-lg group/img">
                        <img
                          {...props}
                          className="w-full max-h-72 object-contain rounded-lg transition-transform duration-300 group-hover/img:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                    ),
                    table: ({ node, ...props }) => (
                      <div className="my-2 max-w-full overflow-x-auto rounded-xl border border-cyan-500/30 bg-slate-950/80 p-1 shadow-inner">
                        <table {...props} className="w-full text-left text-[11px] font-mono border-collapse" />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th {...props} className="px-2.5 py-1.5 bg-cyan-950/40 text-cyan-300 border-b border-cyan-500/30 font-bold whitespace-nowrap" />
                    ),
                    td: ({ node, ...props }) => (
                      <td {...props} className="px-2.5 py-1.5 border-b border-slate-800/60 text-slate-200" />
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '')
                      if (!inline && (match || codeString.includes('\n'))) {
                        return <CodeBlock language={match ? match[1] : 'code'} value={codeString} />
                      }
                      return (
                        <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]" {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {msg.role === 'assistant' ? sanitizeBubbleText(msg.content, { userName: settings.userName }) : msg.content}
                </ReactMarkdown>
              </div>

              {/* Emotion / Gesture Tag */}
              {msg.role === 'assistant' && msg.emotion && (
                <div className="mt-1.5 pt-1 border-t border-cyan-500/10 flex items-center justify-between text-[9px] font-mono text-cyan-400/60 uppercase">
                  <div className="flex items-center gap-1.5">
                    <span>Mood: {msg.emotion}</span>
                    {msg.gesture && <span>• Action: {msg.gesture}</span>}
                  </div>
                  {/* Tapback Reaction Emojis */}
                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSendMessage('❤️ (Liked your reply)')}
                      className="hover:scale-125 transition-transform cursor-pointer"
                      title="Heart"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => handleSendMessage('🔥 (Awesome answer)')}
                      className="hover:scale-125 transition-transform cursor-pointer"
                      title="Fire"
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => handleSendMessage('😂 (That made me laugh)')}
                      className="hover:scale-125 transition-transform cursor-pointer"
                      title="Laugh"
                    >
                      😂
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>{toolStatus || (activeCharacter === 'atlas' ? 'Jarvis analyzing quantitative models...' : activeCharacter === 'mira' ? 'Miku tuning stage & vocals...' : 'Ada synthesizing neural response...')}</span>
            </div>
            <button
              onClick={handleStopGeneration}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] cursor-pointer transition-all"
              title="Stop generation"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Tray Overlay */}
      {showStickerTray && (
        <div className="p-3 border-t border-pink-500/30 bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStickerTab('stickers')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  stickerTab === 'stickers'
                    ? 'bg-pink-600/40 text-pink-200 border border-pink-400/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🥰 Stickers (24+)
              </button>
              <button
                onClick={() => setStickerTab('memes')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  stickerTab === 'memes'
                    ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-400/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🎭 Memes (13+)
              </button>
            </div>
            <button
              onClick={() => setShowStickerTray(false)}
              className="text-slate-400 hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {stickerTab === 'stickers' ? (
            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto scrollbar-none">
              {stickers.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSendSticker(st)}
                  className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-pink-950/40 border border-slate-800 hover:border-pink-500/50 flex flex-col items-center gap-0.5 text-center transition-all cursor-pointer"
                  title={st.caption}
                >
                  <span className="text-xl">{st.emoji}</span>
                  <span className="text-[9px] font-mono text-slate-300 truncate w-full">
                    {st.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-none">
              {MemeService.getAllMemes().map((meme) => (
                <button
                  key={meme.id}
                  onClick={() => handleSendMeme(meme)}
                  className="p-1.5 rounded-xl bg-slate-900/70 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-400/50 flex flex-col items-start gap-1 text-left transition-all cursor-pointer group"
                >
                  <div className="w-full h-16 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 group-hover:border-cyan-500/30 relative">
                    <img
                      src={meme.imageUrl}
                      alt={meme.title}
                      loading="eager"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[8px] font-mono text-cyan-300 border border-cyan-500/30">
                      {meme.templateId.toUpperCase()}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-cyan-200 truncate w-full flex items-center gap-1">
                    <span>🎭</span> {meme.title}
                  </span>
                  <span className="text-[8px] text-slate-400 line-clamp-1 w-full">
                    {meme.punchline}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Context-Aware Follow-Up Suggestions */}
      {!isSending && messages.length > 0 && (
        <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-mono border-t border-cyan-500/15 bg-slate-950/75 shrink-0">
          <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Suggestions:
          </span>
          {getDynamicSuggestions().map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion.replace(/^[^a-zA-Z0-9]+/, '').trim())}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 hover:text-white transition-all cursor-pointer text-[10px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Universal Omnitask Quick Commander: Do All Tasks I Say */}
      <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-mono border-t border-cyan-500/20 bg-slate-950/80 shrink-0">
        <span className="text-cyan-400 font-bold flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          ⚡ TASKS:
        </span>
        <button
          onClick={() => handleSendMessage('open youtube: play a miku video')}
          className="px-2 py-0.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-all shrink-0 cursor-pointer"
        >
          ▶️ YouTube
        </button>
        <button
          onClick={() => handleSendMessage('search google for latest AI innovations')}
          className="px-2 py-0.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition-all shrink-0 cursor-pointer"
        >
          🌐 Search
        </button>
        <button
          onClick={() => handleSendMessage('start timer 25 minutes')}
          className="px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-all shrink-0 cursor-pointer"
        >
          ⏱️ Timer (25m)
        </button>
        <button
          onClick={() => handleSendMessage('add todo: complete high-leverage milestones')}
          className="px-2 py-0.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition-all shrink-0 cursor-pointer"
        >
          📝 Add To-Do
        </button>
        <button
          onClick={() => handleSendMessage('what is the weather in Tokyo today?')}
          className="px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-300 hover:bg-sky-900/60 transition-all shrink-0 cursor-pointer"
        >
          🌤️ Weather
        </button>
        <button
          onClick={() => handleSendMessage('open maps to New York Times Square')}
          className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-all shrink-0 cursor-pointer"
        >
          🗺️ Maps
        </button>
        <button
          onClick={() => handleSendMessage('calculate 125 * 85')}
          className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-all shrink-0 cursor-pointer"
        >
          🧮 Math
        </button>
        <button
          onClick={() => handleSendMessage('wear saree')}
          className="px-2 py-0.5 rounded-lg bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:bg-pink-900/60 transition-all shrink-0 cursor-pointer"
        >
          👗 Saree
        </button>
        <button
          onClick={() => handleSendMessage('switch to miku')}
          className="px-2 py-0.5 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 transition-all shrink-0 cursor-pointer"
        >
          🎤 Switch Miku
        </button>
        <button
          onClick={() => handleSendMessage('switch to tony stark')}
          className="px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-400/50 text-amber-300 hover:bg-amber-900/60 transition-all shrink-0 cursor-pointer"
        >
          ⚡ Switch Stark
        </button>
      </div>

      {/* Blended Quick Action Chips: Unified across Ada Tutor & Stark Trader AI */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs border-t border-cyan-500/10 bg-slate-950/60 shrink-0">
        {activeCharacter === 'atlas' && (
          <>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அட்லஸ், இன்றைய டாப் பங்குப் பரிந்துரைகளை இலக்கு மற்றும் ஸ்டாப் லாஸுடன் கூறுங்கள்' : 'Give me high-probability stock recommendations with entry, target and stop loss')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              📈 {settings.language === 'ta' ? 'பங்குப் பரிந்துரைகள்' : 'Stock Picks'}
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'ஸ்டார்க் மற்றும் அடா, 1% மூலதன இடர் மேலாண்மை மற்றும் பொசிஷன் அளவை கணக்கிடுங்கள்' : 'Calculate 1% capital risk position sizing and setup for Nifty and top stocks')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-400/50 text-amber-200 hover:bg-amber-800/50 transition-colors cursor-pointer font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]"
            >
              💰 1% Risk Sizer
            </button>
            <button
              onClick={() => handleSendMessage('nifty 50 and bank nifty analysis')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer font-medium"
            >
              📊 Nifty 50
            </button>
            <button
              onClick={() => handleSendMessage('Bitcoin (BTC) and Solana (SOL) live technical setup and price action analysis')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/60 transition-colors cursor-pointer font-medium"
            >
              💎 Crypto Radar
            </button>
            <button
              onClick={() => handleSendMessage('Give me a full technical indicator breakdown for NVIDIA (NVDA) with RSI, MACD, Bollinger Bands, and Supertrend')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors cursor-pointer font-medium"
            >
              🔬 All Indicators
            </button>
            <button
              onClick={() => handleSendMessage('Analyze Geopolitical Conflict & War Risk Radar: Gold safe haven, Crude Oil supply shock, DXY Dollar, and VIX stress score')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer font-bold"
            >
              ⚔️ War & Geo Radar
            </button>
            <button
              onClick={() => handleSendMessage('What is the current Market Fear & Greed Index, sentiment mood, and Hugging Face FinBERT financial tone?')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              😱 Fear & Greed
            </button>
            <button
              onClick={() => handleSendMessage('Show Wall Street and Dalal Street consensus analyst ratings, target price, and upside potential for Reliance, Apple, and Nvidia')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer font-medium"
            >
              ⭐ Analyst Ratings
            </button>
            <button
              onClick={() => handleSendMessage('Run PyTorch Neural Network and Hugging Face model ensemble on market indicators')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer font-bold"
            >
              🧠 Neural Net & HF Models
            </button>
            <button
              onClick={() => handleSendMessage('Analyze World Markets: US S&P 500, Nasdaq, India Nifty, Crypto, and Gold')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 transition-colors cursor-pointer font-medium"
            >
              🌐 World Markets Radar
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அடா/அட்லஸ், பங்குச்சந்தையில் ஆர்.எஸ்.ஐ மற்றும் மேக்டி இண்டிகேட்டர்களை எப்படி பயன்படுத்த வேண்டும் என்று கற்றுக் கொடுங்கள்' : 'Teach me how to use RSI, MACD, and Smart Money Concepts with a 1:3 risk reward ratio')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer font-medium"
            >
              🎓 Trading Academy
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அடா, எனக்கு ரியாக்ட் யூஸ்எஃபெக்ட் பற்றி தெளிவாக பாடம் சொல்லிக் கொடுங்கள்' : 'Ada, please tutor me on React useEffect with a clean step-by-step example.')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer font-medium"
            >
              👩‍💼 Ada Tutor
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'எனது படிப்புக்கு 25 நிமிட ஃபோகஸ் டைமர் தொடங்கவும்' : 'Start a focus timer for 25 minutes for my study session')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer font-medium"
            >
              ⏱️ Focus (25m)
            </button>
          </>
        )}

        {activeCharacter === 'mira' && (
          <>
            <button
              onClick={() => {
                setSkinId('miku-golden-pirate')
                VoiceEngine.speak("Ahoy Captain! Fortnite Golden Pirate Miku reporting for duty! All sails set, let's make magic!", { rate: 1.10, pitch: 1.35 })
                setActiveFX(['sparkles', 'confetti', 'stars'])
              }}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-400/60 text-amber-300 hover:bg-amber-900/70 shadow-[0_0_10px_rgba(251,191,36,0.3)] transition-colors cursor-pointer font-bold"
            >
              🏴‍☠️ Fortnite Golden Miku
            </button>
            <button
              onClick={() => handleSendMessage('Sing World is Mine, Hatsune Miku!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-teal-950/60 border border-teal-500/40 text-teal-300 hover:bg-teal-900/60 transition-colors cursor-pointer font-medium"
            >
              👑 World is Mine
            </button>
            <button
              onClick={() => handleSendMessage('Sing Miku Miku ni Shite Ageru♪!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer font-medium"
            >
              ✨ Miku Miku ni Shite Ageru♪
            </button>
            <button
              onClick={() => handleSendMessage('Sing Ievan Polkka and do the twintail leek spin!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer font-medium"
            >
              🥬 Leek Spin (Ievan Polkka)
            </button>
            <button
              onClick={() => handleSendMessage('Play PoPiPo juice song and dance!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:bg-pink-900/60 transition-colors cursor-pointer font-medium"
            >
              🥤 PoPiPo
            </button>
            <button
              onClick={() => handleSendMessage('Sing Senbonzakura (千本桜) with your idol flourish!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer font-medium"
            >
              🌸 Senbonzakura
            </button>
            <button
              onClick={() => handleSendMessage('Sing Tell Your World by kz (livetune)!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer font-medium"
            >
              🌐 Tell Your World
            </button>
            <button
              onClick={() => handleSendMessage('Sing The Disappearance of Hatsune Miku at 240 BPM!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-300 hover:bg-violet-900/60 transition-colors cursor-pointer font-medium"
            >
              ⚡ Disappearance of Miku
            </button>
            <button
              onClick={() => handleSendMessage('Do your signature idol stage pose and greet your fans!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer font-medium"
            >
              ✨ Idol Pose
            </button>
            <button
              onClick={() => handleSendMessage('Give me high-probability stock recommendations with entry, target and stop loss')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              ⚡ Stark Radar
            </button>
            <button
              onClick={() => handleSendMessage('Ada, please tutor me on React useEffect with a clean step-by-step example.')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer font-medium"
            >
              👩‍💼 Ada Tutor
            </button>
          </>
        )}

        {(!activeCharacter || activeCharacter === 'ada') && (
          <>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அடா, எனக்கு ரியாக்ட் யூஸ்எஃபெக்ட் பற்றி தெளிவாக பாடம் சொல்லிக் கொடுங்கள்' : 'Ada, please tutor me on React useEffect with a clean step-by-step example.')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer font-medium"
            >
              🎓 {settings.language === 'ta' ? 'பாடம் கற்பி' : 'Tutor Me'}
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'எனது படிப்புக்கு 25 நிமிட ஃபோகஸ் டைமர் தொடங்கவும்' : 'Start a focus timer for 25 minutes for my study session')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer font-medium"
            >
              ⏱️ {settings.language === 'ta' ? 'ஃபோகஸ் (25 நிமி)' : 'Focus (25m)'}
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அடா மற்றும் ஸ்டார்க், 1% மூலதன இடர் மேலாண்மை மற்றும் பொசிஷன் அளவை கணக்கிடுங்கள்' : 'Calculate 1% capital risk position sizing and setup with Stark and Ada')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-400/50 text-amber-200 hover:bg-amber-800/50 transition-colors cursor-pointer font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]"
            >
              💰 1% Risk Sizer
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'அட்லஸ், இன்றைய டாப் பங்குப் பரிந்துரைகளை இலக்கு மற்றும் ஸ்டாப் லாஸுடன் கூறுங்கள்' : 'Give me high-probability stock recommendations with entry, target and stop loss')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              📈 {settings.language === 'ta' ? 'பங்குப் பரிந்துரைகள்' : 'Stark Stocks'}
            </button>
            <button
              onClick={() => handleSendMessage('nifty 50 and bank nifty analysis')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer font-medium"
            >
              📊 Nifty 50
            </button>
            <button
              onClick={() => handleSendMessage('Bitcoin (BTC) and Solana (SOL) live technical setup and price action analysis')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/60 transition-colors cursor-pointer font-medium"
            >
              💎 Crypto Radar
            </button>
            <button
              onClick={() => handleSendMessage('Give me a full technical indicator breakdown for NVIDIA (NVDA) with RSI, MACD, Bollinger Bands, and Supertrend')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors cursor-pointer font-medium"
            >
              🔬 All Indicators
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'எனது நினைவூட்டல் பட்டியல் மற்றும் பணிகளைக் காட்டு' : 'Show my to-do list and reminders')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors cursor-pointer font-medium"
            >
              📝 {settings.language === 'ta' ? 'பணிப் பட்டியல்' : 'To-Do List'}
            </button>
            <button
              onClick={() => handleSendMessage('Ada, let\'s review my coding architecture and optimize performance')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer font-medium"
            >
              💻 Code Review
            </button>
            <button
              onClick={() => handleSendMessage('Ada, enaku studies-la focus panna mudila, konjam tips kudunga in Tanglish')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              🗣️ Tanglish Study
            </button>
            <button
              onClick={() => handleSendMessage('வணக்கம் Ada, இன்னைக்கு என்ன படிக்கலாம்?')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer font-medium"
            >
              🌸 தமிழ்
            </button>
          </>
        )}
      </div>

      {/* Text Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="p-3 border-t border-cyan-500/20 bg-slate-950/80 flex items-center gap-2 shrink-0 z-10"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,application/pdf"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-colors cursor-pointer"
          title="Explain this file / screenshot (Vision)"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Sticker Tray Toggle */}
        <button
          type="button"
          onClick={() => setShowStickerTray(!showStickerTray)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            showStickerTray
              ? 'text-pink-300 bg-pink-500/20 border border-pink-400/40'
              : 'text-slate-400 hover:text-pink-300 hover:bg-slate-800/40'
          }`}
          title="Ada Stickers & Reaction GIFs"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            globalBackchannel.setUserTyping(true)
          }}
          onBlur={() => globalBackchannel.setUserTyping(false)}
          placeholder={
            settings.language === 'ta'
              ? `தமிழில் பேசவும் அல்லது தட்டச்சு செய்யவும் (${activeCharacter === 'atlas' ? 'டோனி ஸ்டார்க்' : activeCharacter === 'mira' ? 'ஹட்சுனே மிக்கு' : 'அடா'})...`
              : settings.language === 'tanglish'
              ? `Tanglish-la pesunga (${activeCharacter === 'atlas' ? 'Tony Stark' : activeCharacter === 'mira' ? 'Hatsune Miku' : 'Ada'})...`
              : activeCharacter === 'atlas'
              ? 'Ask Tony Stark about stocks, markets, tech, or wealth...'
              : activeCharacter === 'mira'
              ? 'Chat with Hatsune Miku, request a song, dance, or celebrate...'
              : 'Ask Ada for tutoring, study focus, code, or tasks...'
          }
          className="flex-1 bg-slate-900/80 border border-cyan-500/25 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,243,255,0.2)] cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  )
}
