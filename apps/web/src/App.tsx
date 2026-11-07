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
import { FirstRunModal } from './components/safety/FirstRunModal.js'
import { WellbeingDashboardModal } from './components/wellbeing/WellbeingDashboardModal.js'
import { DebugHUD } from './components/hud/DebugHUD.js'
import { StageDrawer } from './components/hud/StageDrawer.js'
import { WardrobeDrawer } from './components/wardrobe/WardrobeDrawer.js'
import { EnvironmentDrawer } from './components/hud/EnvironmentDrawer.js'
import { LiveMarketPanel } from './components/trading/LiveMarketPanel.js'
import { MarketNewsTicker } from './components/trading/MarketNewsTicker.js'
import { AnimationTestPage } from './pages/AnimationTest.js'
import { ReactionLab } from './pages/ReactionLab.js'
import { VoiceEngine } from './components/voice/VoiceEngine.js'
import { globalSongEngine } from './avatar/engine/singer.js'
import { performAction } from './avatar/motion/performAction.js'
import { globalReactionReconciler } from './avatar/reactions/index.js'
import { globalCueScheduler } from './avatar/cues/CueScheduler.js'
import { useAppStore } from './store/useAppStore.js'
import { apiUrl } from './utils/api.js'
import type { StructuredReply, ChatMessage } from '@ada/shared'
import { parseStructuredReply, sanitizeBubbleText } from '@ada/shared'

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
    tickWellbeingSeconds,
    isMinorMode,
    fullScreenHoloMode,
    showWardrobeDrawer,
    setShowWardrobeDrawer,
    showEnvironmentDrawer,
    setShowEnvironmentDrawer,
    showLiveMarketPanel,
    setShowLiveMarketPanel,
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

  // 2. Pomodoro & Wellbeing 1-Second Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      tickPomodoro()
      tickWellbeingSeconds()
    }, 1000)
    return () => clearInterval(timer)
  }, [tickPomodoro, tickWellbeingSeconds])

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
          llmProvider: settings.llmProvider,
          huggingfaceApiKey: settings.huggingfaceApiKey,
          stream: false,
        }),
      })

      if (!res.ok) throw new Error('Failed to query Ada')
      const data = await res.json()
      const rawPayload = typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply || {})
      const parsedReply = parseStructuredReply(rawPayload, { userName: settings.userName })

      // 2. Reconcile with incoming LLM reply
      globalReactionReconciler.reconcileWithReply(parsedReply)

      // 3. Schedule streaming inline cues along speech timeline
      globalCueScheduler.scheduleFromText(parsedReply.display_text, parsedReply.voice_style?.rate || 1.0)

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: sanitizeBubbleText(parsedReply.display_text, { userName: settings.userName }),
        speech: parsedReply.speech,
        emotion: parsedReply.emotion,
        gesture: parsedReply.gesture,
        tradingCard: parsedReply.tradingCard,
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      const singAction = parsedReply.actions?.find((a) => a.name === 'sing')
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
        globalSongEngine.playSong(finalSong)
      } else if (/now playing|now singing/i.test(parsedReply.display_text || '')) {
        const match = (parsedReply.display_text || '').match(/now (?:playing|singing)(?:\s*&[^\n:]*)?:\s*([^\n*(]+)/i)
        const detectedTitle = match ? match[1].trim() : 'Shape of You'
        performAction('dance_pop_groove', { emotion: 'excited', duration: 240 })
        globalSongEngine.playSong(detectedTitle)
      } else if (parsedReply.speech) {
        VoiceEngine.speak(parsedReply.speech, {
          rate: parsedReply.voice_style?.rate || 1.05,
          pitch: parsedReply.voice_style?.pitch || 1.0,
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

      {/* 2b. Live Market Bloomberg-style News Ticker */}
      {!fullScreenHoloMode && (
        <MarketNewsTicker className="fixed top-14 left-0 right-0 z-30 pointer-events-auto shadow-md" />
      )}

      {/* 2c. Floating Live AlgoTrading Radar Panel */}
      {showLiveMarketPanel && !fullScreenHoloMode && (
        <div className="fixed top-24 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto animate-fade-in-up">
          <LiveMarketPanel onClose={() => setShowLiveMarketPanel(false)} />
        </div>
      )}

      {/* 3. Left Mission & Focus Module (Collapsible) */}
      <MissionBriefing />

      {/* 4. Docked Bottom Control Bar (Below stage, out of base area) */}
      {!fullScreenHoloMode && (
        <div className="fixed bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
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
      <FirstRunModal />
      <WellbeingDashboardModal />
      <SettingsModal />
      <MemoryManagerModal />
      <MoodJournalModal />
      <PersonalityStudioModal />
      <PermissionCenterModal />
    </div>
  )
}
