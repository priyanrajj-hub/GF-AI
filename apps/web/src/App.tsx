import React, { useEffect, useState } from 'react'
import { HoloScene } from './components/scene/HoloScene.js'
import { TopBar } from './components/hud/TopBar.js'
import { MissionBriefing } from './components/hud/MissionBriefing.js'
import { ChatDrawer } from './components/hud/ChatDrawer.js'
import { WaveformRing } from './components/voice/WaveformRing.js'
import { SettingsModal } from './components/modals/SettingsModal.js'
import { MemoryManagerModal } from './components/modals/MemoryManagerModal.js'
import { MoodJournalModal } from './components/modals/MoodJournalModal.js'
import { VoiceEngine } from './components/voice/VoiceEngine.js'
import { useAppStore } from './store/useAppStore.js'
import { apiUrl } from './utils/api.js'
import type { StructuredReply, ChatMessage } from '@ada/shared'

export const App: React.FC = () => {
  const [booting, setBooting] = useState(true)
  const [bootStep, setBootStep] = useState(0)

  const {
    settings,
    activeMode,
    addMessage,
    setSystemState,
    setEmotionAndGesture,
    tickPomodoro,
    fullScreenHoloMode,
  } = useAppStore()

  // 1. Futuristic Boot-Up Animation Sequence
  useEffect(() => {
    const steps = [
      'INITIALIZING QUANTUM HOLO-CORE...',
      'CALIBRATING EMOTION ENGINE & VRM RIG...',
      'CONNECTING TO SECURE LOCAL PERSISTENCE...',
      'ADA PERSONAL COMPANION ONLINE.',
    ]

    const interval = setInterval(() => {
      setBootStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1
        } else {
          clearInterval(interval)
          setTimeout(() => setBooting(false), 500)
          return prev
        }
      })
    }, 450)

    return () => clearInterval(interval)
  }, [])

  // 2. Pomodoro 1-Second Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      tickPomodoro()
    }, 1000)
    return () => clearInterval(timer)
  }, [tickPomodoro])

  // 3. Central voice message dispatcher
  const handleVoiceMessage = async (transcript: string) => {
    if (!transcript.trim()) return

    setSystemState('thinking')

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: transcript,
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
          message: transcript,
          mode: activeMode,
          sliders: settings.sliders,
          language: settings.language,
          stream: false,
        }),
      })

      if (!res.ok) throw new Error('Failed to query Ada')
      const data = await res.json()
      const reply: StructuredReply = data.reply

      setEmotionAndGesture(reply.emotion, reply.intensity, reply.gesture)

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
      console.error('[Voice Dispatch Error]', err)
      setSystemState('idle')
    }
  }

  // Render Boot-Up Terminal
  if (booting) {
    const bootSteps = [
      'INITIALIZING QUANTUM HOLO-CORE...',
      'CALIBRATING EMOTION ENGINE & VRM RIG...',
      'CONNECTING TO SECURE LOCAL PERSISTENCE...',
      'ADA PERSONAL COMPANION ONLINE.',
    ]

    return (
      <div className="w-screen h-screen bg-[#05070e] flex flex-col items-center justify-center font-mono text-cyan-400 p-6 select-none">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_15px_#00f3ff]" />
            <span className="text-xl font-bold tracking-widest text-white">
              PROJECT ADA
            </span>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-2 text-xs">
            {bootSteps.slice(0, bootStep + 1).map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-cyan-500/60">&gt;</span>
                <span className={idx === bootStep ? 'text-white animate-pulse' : 'text-cyan-400/80'}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_#00f3ff]"
              style={{ width: `${((bootStep + 1) / bootSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen relative bg-[#060810] overflow-hidden select-none">
      {/* 1. 3D Holographic Canvas Scene */}
      <HoloScene />

      {/* 2. Top Header HUD */}
      <TopBar />

      {/* 3. Left Mission & Focus Module */}
      <MissionBriefing />

      {/* 4. Center Bottom Arc-Reactor Waveform Core */}
      {!fullScreenHoloMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <WaveformRing onSendMessage={handleVoiceMessage} />
        </div>
      )}

      {/* 5. Right Chat & Transcript Drawer */}
      <ChatDrawer />

      {/* 6. Modals */}
      <SettingsModal />
      <MemoryManagerModal />
      <MoodJournalModal />
    </div>
  )
}
