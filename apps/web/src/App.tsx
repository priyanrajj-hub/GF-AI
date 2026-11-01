import React, { useEffect, useState } from 'react'
import { HoloScene } from './components/scene/HoloScene.js'
import { TopBar } from './components/hud/TopBar.js'
import { MissionBriefing } from './components/hud/MissionBriefing.js'
import { ChatDrawer } from './components/hud/ChatDrawer.js'
import { WaveformRing } from './components/voice/WaveformRing.js'
import { SettingsModal } from './components/modals/SettingsModal.js'
import { MemoryManagerModal } from './components/modals/MemoryManagerModal.js'
import { MoodJournalModal } from './components/modals/MoodJournalModal.js'
import { PersonalityStudioModal } from './components/personality/PersonalityStudioModal.js'
import { PermissionCenterModal } from './components/permissions/PermissionCenterModal.js'
import { DebugHUD } from './components/hud/DebugHUD.js'
import { StageDrawer } from './components/hud/StageDrawer.js'
import { WardrobeDrawer } from './components/wardrobe/WardrobeDrawer.js'
import { EnvironmentDrawer } from './components/hud/EnvironmentDrawer.js'
import { AnimationTestPage } from './pages/AnimationTest.js'
import { ReactionLab } from './pages/ReactionLab.js'
import { VoiceEngine } from './components/voice/VoiceEngine.js'
import { globalSongEngine } from './avatar/engine/singer.js'
import { globalReactionReconciler } from './avatar/reactions/index.js'
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
    showWardrobeDrawer,
    setShowWardrobeDrawer,
    showEnvironmentDrawer,
    setShowEnvironmentDrawer,
  } = useAppStore()

  // Task D: Check for hidden /animation-test or /reaction-lab route
  const isAnimTest =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/animation-test' ||
      window.location.search.includes('anim-test=1'))

  const isReactionLab =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/reaction-lab' ||
      window.location.search.includes('reaction-lab=1'))

  if (isReactionLab) {
    return <ReactionLab />
  }

  // 1. Futuristic Boot-Up Animation Sequence
  useEffect(() => {
    if (isAnimTest) {
      setBooting(false)
      return
    }

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
          setTimeout(() => setBooting(false), 400)
          return prev
        }
      })
    }, 400)

    return () => clearInterval(interval)
  }, [isAnimTest])

  // 2. Pomodoro 1-Second Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      tickPomodoro()
    }, 1000)
    return () => clearInterval(timer)
  }, [tickPomodoro])

  // Stop active song/performance on Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        (e.target as HTMLElement)?.tagName !== 'INPUT' &&
        (e.target as HTMLElement)?.tagName !== 'TEXTAREA'
      ) {
        globalSongEngine.stop()
        useAppStore.getState().setActiveAction('idle')
        useAppStore.getState().setActiveSong(null)
        useAppStore.getState().setActiveFX([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

    // 1. Instant local micro-reaction (<50ms)
    globalReactionReconciler.dispatchMicroReaction(transcript)

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

      // 2. Reconcile with incoming LLM reply
      globalReactionReconciler.reconcileWithReply(reply)

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

  // If on /animation-test route
  if (isAnimTest) {
    return <AnimationTestPage />
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
    <div className="w-screen h-[100dvh] relative bg-[#060814] overflow-hidden select-none pb-[env(safe-area-inset-bottom)]">
      {/* 1. 3D Holographic Canvas Scene */}
      <HoloScene />

      {/* 2. Top Header HUD */}
      <TopBar />

      {/* 3. Left Mission & Focus Module (Collapsible) */}
      <MissionBriefing />

      {/* 4. Docked Bottom Control Bar (Below stage, out of base area) */}
      {!fullScreenHoloMode && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <WaveformRing onSendMessage={handleVoiceMessage} />
        </div>
      )}

      {/* 5. Stage Performance Drawer (Dance, Sing, Roam, Cuteness) */}
      <StageDrawer />

      {/* 6. Wardrobe Drawer (15+ Outfits, Desi Festive Wear) */}
      <WardrobeDrawer
        isOpen={showWardrobeDrawer}
        onClose={() => setShowWardrobeDrawer(false)}
      />

      {/* 7. 3D Environments Drawer (16 Scenes) */}
      <EnvironmentDrawer
        isOpen={showEnvironmentDrawer}
        onClose={() => setShowEnvironmentDrawer(false)}
      />

      {/* 8. Right Chat & Transcript Drawer */}
      <ChatDrawer />

      {/* 9. Diagnostics HUD (?debug=1) */}
      <DebugHUD />

      {/* 10. Modals */}
      <SettingsModal />
      <MemoryManagerModal />
      <MoodJournalModal />
      <PersonalityStudioModal />
      <PermissionCenterModal />
    </div>
  )
}
