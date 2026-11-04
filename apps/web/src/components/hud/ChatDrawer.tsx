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
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  StickerProvider,
  MemeService,
  type ChatMessage,
  type StructuredReply,
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
import { apiUrl } from '../../utils/api.js'

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
    setSystemState,
    setEmotionAndGesture,
    fullScreenHoloMode,
    activeSong,
    karaokeLine,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showStickerTray, setShowStickerTray] = useState(false)
  const [stickerTab, setStickerTab] = useState<'stickers' | 'memes'>('stickers')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setIsSending(true)
    setSystemState('thinking')

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
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': settings.userId,
        },
        body: JSON.stringify({
          message: text,
          mode: activeMode,
          character: activeCharacter,
          sliders: settings.sliders,
          language: settings.language,
          llmProvider: settings.llmProvider,
          huggingfaceApiKey: settings.huggingfaceApiKey,
          stream: false,
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
        musicTrack: (singAction?.arguments as any)?.song || parsedReply.musicTrack || (singAction ? {
          title: (singAction.arguments as any)?.title || 'Original Studio Track',
          artist: (singAction.arguments as any)?.artist,
          audioUrl: (singAction.arguments as any)?.audioUrl,
          artworkUrl: (singAction.arguments as any)?.artworkUrl,
          danceAction: (singAction.arguments as any)?.dance || 'dance_pop_groove',
          bpm: (singAction.arguments as any)?.bpm || 120,
          duration: (singAction.arguments as any)?.duration || 30,
        } : undefined),
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)
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

        performAction(dance as any, { emotion: 'excited', duration: (songObj?.duration || 32) + 2 })

        // Play authentic original studio recording and synchronized choreography immediately
        globalSongEngine.playSong(finalSong)

        // Real online track takes center stage - no TTS vocal clash!
      } else if (/now playing|now singing/i.test(parsedReply.display_text || '')) {
        // Fallback: If LLM output text mentions "Now Playing" or "Now Singing", immediately trigger music & dance!
        const match = (parsedReply.display_text || '').match(/now (?:playing|singing)(?:\s*&[^\n:]*)?:\s*([^\n*(]+)/i)
        const detectedTitle = match ? match[1].trim() : 'Starlight Sparkle'
        performAction('dance_pop_groove', { emotion: 'excited', duration: 32 })
        globalSongEngine.playSong(detectedTitle)
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
          VoiceEngine.speak(parsedReply.speech, {
            rate: parsedReply.voice_style?.rate || 1.05,
            pitch: parsedReply.voice_style?.pitch || 1.0,
            language: settings.language,
          })
        } else {
          setSystemState('idle')
        }
      }
    } catch (err) {
      console.error('[Chat Send Error]', err)
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Communications relay interrupted. Please ensure Ada backend is online.',
        timestamp: Date.now(),
      }
      addMessage(errorMsg)
      setSystemState('idle')
    } finally {
      setIsSending(false)
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
      const res = await fetch(apiUrl('/api/chat/vision'), {
        method: 'POST',
        headers: {
          'x-user-id': settings.userId,
        },
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
    <aside className="fixed inset-x-2 bottom-18 h-[52vh] md:h-auto md:top-16 md:right-4 md:left-auto md:w-96 md:max-h-[calc(100dvh-100px)] z-30 flex flex-col glass-panel rounded-2xl border border-cyan-500/25 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="px-3 py-2.5 border-b border-cyan-500/20 flex flex-col gap-2 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold tracking-wider text-slate-200 uppercase">
              Holo-Transcript Link
            </span>
          </div>

          <div className="flex items-center gap-1.5">
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

        {/* Blended Co-Pilot Switcher: Ada (Tutor) | Mira (Companion) | Atlas (Stark Trader) */}
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-[10px] font-mono">
          <button
            onClick={() => setActiveCharacter('ada')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 ${
              activeCharacter === 'ada' || !activeCharacter
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_8px_rgba(0,243,255,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ada: Code Tutor & Focus Mentor"
          >
            <span>👩‍💼</span> Ada
          </button>
          <button
            onClick={() => setActiveCharacter('mira')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 ${
              activeCharacter === 'mira'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : 'text-slate-400 hover:text-rose-200'
            }`}
            title="Mira: Fun & Caring Companion"
          >
            <span>🌹</span> Mira
          </button>
          <button
            onClick={() => setActiveCharacter('atlas')}
            className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1 ${
              activeCharacter === 'atlas'
                ? 'bg-gradient-to-r from-amber-600 to-cyan-600 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
            title="Atlas (Tony Stark): Quant Trader AI"
          >
            <span>⚡</span> Stark (Trader)
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[9px] font-mono text-cyan-400/80">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Co-Pilot: {activeCharacter === 'atlas' ? '⚡ Stark Trader AI' : activeCharacter === 'mira' ? '🌹 Mira Companion' : '👩‍💼 Ada Study Mentor'}
          </span>
          <span className="text-slate-400">Blended Mode Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[50vh]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group relative flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed relative ${
                msg.role === 'user'
                  ? 'bg-cyan-600/30 border border-cyan-400/40 text-cyan-50 rounded-br-none'
                  : 'bg-slate-900/70 border border-cyan-500/20 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              {/* Copy Button */}
              <button
                onClick={() => handleCopyMessage(msg.id, msg.content)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-950/70 text-slate-400 hover:text-cyan-300 transition-opacity cursor-pointer"
                title="Copy Message"
              >
                {copiedId === msg.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>

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
                    <span className="flex items-center gap-1 text-rose-300 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                      🌹 Mira (Companion)
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
                        {msg.musicTrack.artist ? `by ${msg.musicTrack.artist}` : 'Original Studio Master Preview'}
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
                          performAction(msg.musicTrack.danceAction || 'dance_pop_groove', { duration: 32 })
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
                      {activeSong?.id === msg.musicTrack.id ? (karaokeLine || 'Singing & Dancing...') : 'Studio Master Preview'}
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

              {/* Display text / Markdown */}
              <div className="prose prose-invert prose-xs max-w-none font-sans text-xs leading-relaxed break-words space-y-1.5 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-slate-950 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_pre]:bg-slate-950 [&_pre]:p-2 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-cyan-500/20 [&_strong]:text-cyan-200">
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
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Ada synthesizing neural response...</span>
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
              onClick={() => handleSendMessage('Play Vaathi Coming from Master')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:bg-pink-900/60 transition-colors cursor-pointer font-medium"
            >
              🎵 {settings.language === 'ta' ? 'தமிழ் பாடல்' : 'Tamil Song'}
            </button>
            <button
              onClick={() => handleSendMessage('Play a high energy dance song and dance to the rhythm!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer font-medium"
            >
              💃 {settings.language === 'ta' ? 'நடனம் ஆடு' : 'Dance Move'}
            </button>
            <button
              onClick={() => handleSendMessage('Show me a funny developer meme.')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer font-medium"
            >
              🎭 {settings.language === 'ta' ? 'மீம்ஸ்' : 'Meme Me'}
            </button>
            <button
              onClick={() => handleSendMessage(settings.language === 'ta' ? 'மீரா, என்னுடன் ஒரு டீ குடிக்க வரலாமா?' : 'Let\'s have a cozy chai date together, Mira!')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-orange-950/60 border border-orange-500/40 text-orange-300 hover:bg-orange-900/60 transition-colors cursor-pointer font-medium"
            >
              ☕ {settings.language === 'ta' ? 'டீ இடைவேளை' : 'Chai Date'}
            </button>
            <button
              onClick={() => handleSendMessage('வணக்கம் மீரா, எப்படி இருக்கீங்க?')}
              className="whitespace-nowrap px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 transition-colors cursor-pointer font-medium"
            >
              🌸 தமிழ் உரையாடல்
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
              ? `தமிழில் பேசவும் அல்லது தட்டச்சு செய்யவும் (${activeCharacter === 'atlas' ? 'டோனி ஸ்டார்க்' : activeCharacter === 'mira' ? 'மீரா' : 'அடா'})...`
              : settings.language === 'tanglish'
              ? `Tanglish-la pesunga (${activeCharacter === 'atlas' ? 'Tony Stark' : activeCharacter === 'mira' ? 'Mira' : 'Ada'})...`
              : activeCharacter === 'atlas'
              ? 'Ask Tony Stark about stocks, markets, tech, or wealth...'
              : activeCharacter === 'mira'
              ? 'Chat with Mira, sing a song, dance, or hang out...'
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
