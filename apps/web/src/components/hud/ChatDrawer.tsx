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
} from 'lucide-react'
import type { ChatMessage, StructuredReply } from '@ada/shared'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../voice/VoiceEngine.js'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!showChatDrawer || fullScreenHoloMode) return null

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
      const reply: StructuredReply = data.reply

      // Update emotion & gesture
      setEmotionAndGesture(reply.emotion, reply.intensity, reply.gesture)

      // Add assistant message
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: reply.display_text,
        speech: reply.speech,
        emotion: reply.emotion,
        gesture: reply.gesture,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      // Trigger Voice
      if (reply.speech) {
        VoiceEngine.speak(reply.speech, {
          rate: reply.voice_style?.rate || 1.05,
          pitch: reply.voice_style?.pitch || 1.0,
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

  return (
    <aside className="fixed right-4 top-20 bottom-6 w-96 z-30 flex flex-col glass-panel rounded-2xl border border-cyan-500/25 overflow-hidden shadow-2xl">
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
            className="p-1 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleChatDrawer}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600/30 border border-cyan-400/40 text-cyan-50 rounded-br-none'
                  : 'bg-slate-900/70 border border-cyan-500/20 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              {/* Spoken subtitle for Ada replies */}
              {msg.role === 'assistant' && msg.speech && (
                <div className="flex items-center gap-1.5 text-[10px] text-pink-300/80 mb-1 font-mono italic">
                  <Volume2 className="w-3 h-3 text-pink-400 flex-shrink-0" />
                  <span>"{msg.speech}"</span>
                </div>
              )}

              {/* Display text / Markdown */}
              <div className="whitespace-pre-wrap font-sans">
                {msg.content}
              </div>

              {/* Emotion / Gesture Tag */}
              {msg.role === 'assistant' && msg.emotion && (
                <div className="mt-1.5 pt-1 border-t border-cyan-500/10 flex items-center gap-2 text-[9px] font-mono text-cyan-400/60 uppercase">
                  <span>Mood: {msg.emotion}</span>
                  {msg.gesture && <span>• Action: {msg.gesture}</span>}
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

      {/* Quick Action Suggestion Chips */}
      <div className="px-3 py-1.5 border-t border-cyan-500/15 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono bg-slate-950/20">
        <button
          onClick={() => handleSendMessage('Give me a morning briefing.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors"
        >
          🌅 Morning Briefing
        </button>
        <button
          onClick={() => handleSendMessage('Give me a focus pep talk for coding.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors"
        >
          ⚡ Pep Talk
        </button>
        <button
          onClick={() => handleSendMessage('Show me a funny developer meme.')}
          className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-900/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/60 transition-colors"
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
          className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-colors"
          title="Explain this file / screenshot (Vision)"
        >
          <Paperclip className="w-4 h-4" />
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
          className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,243,255,0.2)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  )
}
