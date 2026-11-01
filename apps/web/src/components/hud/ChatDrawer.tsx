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
  type ChatMessage,
  type StructuredReply,
  type AdaSticker,
  parseStructuredReply,
  sanitizeBubbleText,
} from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'
import { globalReactionReconciler } from '../../avatar/reactions/index.js'
import { apiUrl } from '../../utils/api.js'

export const ChatDrawer: React.FC = () => {
  const {
    showChatDrawer,
    toggleChatDrawer,
    messages,
    addMessage,
    clearMessages,
    activeMode,
    settings,
    setSystemState,
    setEmotionAndGesture,
    fullScreenHoloMode,
  } = useAppStore()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showStickerTray, setShowStickerTray] = useState(false)
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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isSending) return

    setInput('')
    setIsSending(false)
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
          sliders: settings.sliders,
          language: settings.language,
          stream: false,
        }),
      })

      if (!res.ok) throw new Error('Failed to communicate with Ada server')
      const data = await res.json()
      const rawPayload = typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply || {})
      const parsedReply = parseStructuredReply(rawPayload, { userName: settings.userName })

      // 2. Reconcile with incoming LLM reply
      globalReactionReconciler.reconcileWithReply(parsedReply)

      // Add assistant message with strictly guarded display_text
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: sanitizeBubbleText(parsedReply.display_text, { userName: settings.userName }),
        speech: parsedReply.speech,
        emotion: parsedReply.emotion,
        gesture: parsedReply.gesture,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      // Trigger Voice
      if (parsedReply.speech) {
        VoiceEngine.speak(parsedReply.speech, {
          rate: parsedReply.voice_style?.rate || 1.05,
          pitch: parsedReply.voice_style?.pitch || 1.0,
          language: settings.language,
        })
      } else {
        setSystemState('idle')
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
      <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/40">
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

              {/* Display text / Markdown */}
              <div className="prose prose-invert prose-xs max-w-none font-sans text-xs leading-relaxed break-words space-y-1.5 [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-slate-950 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_pre]:bg-slate-950 [&_pre]:p-2 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-cyan-500/20 [&_strong]:text-cyan-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
        <div className="p-3 border-t border-pink-500/30 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold text-pink-300">
              Ada Stickers & Reaction GIFs (24+)
            </span>
            <button
              onClick={() => setShowStickerTray(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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
        </div>
      )}

      {/* Quick Action Suggestion Chips */}
      <div className="px-3 py-1.5 border-t border-cyan-500/15 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono bg-slate-950/20 scrollbar-none">
        <button
          onClick={() => handleSendMessage('Give me a morning briefing.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
        >
          🌅 Morning Briefing
        </button>
        <button
          onClick={() => handleSendMessage('Tell me a clever riddle.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
        >
          🧩 Riddle
        </button>
        <button
          onClick={() => handleSendMessage('Let\'s play Rock-Paper-Scissors! I pick Rock.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
        >
          ✊ Rock-Paper-Scissors
        </button>
        <button
          onClick={() => handleSendMessage('Show me a funny developer meme.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
        >
          🎭 Meme Me
        </button>
      </div>

      {/* Text Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="p-3 border-t border-cyan-500/20 bg-slate-950/50 flex items-center gap-2"
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
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Talk or type to Ada (${activeMode} mode)...`}
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
