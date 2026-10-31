import React, { useState } from 'react'
import { HoloScene } from '../components/scene/HoloScene.js'
import { useAppStore } from '../store/useAppStore.js'
import { ACTION_CATALOG } from '../avatar/engine/actions.js'
import { EXPRESSION_PRESETS } from '../avatar/engine/expressions.js'
import {
  Sparkles,
  ArrowLeft,
  Music,
  Smile,
  Compass,
  Heart,
  Volume2,
  Square,
  Footprints,
  Sliders,
} from 'lucide-react'

export const AnimationTestPage: React.FC = () => {
  const {
    currentEmotion,
    emotionIntensity,
    activeGesture,
    setEmotionAndGesture,
    activeAction,
    setActiveAction,
    cutenessLevel,
    setCutenessLevel,
    skinId,
    setSkinId,
    roamConfig,
    setRoamConfig,
    setAudioFrequencies,
    setSystemState,
    settings,
    updateSettings,
    setActiveFX,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<
    'dances' | 'moves' | 'faces' | 'roam' | 'cuteness'
  >('dances')

  const [intensity, setIntensity] = useState(0.85)

  // Dances (8 styles)
  const danceList = [
    { id: 'dance_cute_idol', name: 'Cute Idol Pop', desc: 'Upbeat idol step, head tilt & bounce' },
    { id: 'dance_pop_groove', name: 'Pop Groove', desc: 'Rhythmic hip swaying & chest accents' },
    { id: 'dance_hiphop', name: 'Hip-Hop Bounce', desc: 'Low bounce, shoulder drop, head bob' },
    { id: 'dance_ballad_sway', name: 'Ballad Sway', desc: 'Graceful slow waltz & lyrical arms' },
    { id: 'dance_spy_jazz', name: 'Spy Jazz', desc: 'Sleek, sharp, confident catwalk' },
    { id: 'dance_jump_energetic', name: 'Jump Energetic', desc: 'High-energy double hops & fist pumps' },
    { id: 'dance_lofi_chill', name: 'Lo-Fi Chill Sway', desc: 'Slow side-to-side relaxing sway' },
    { id: 'dance_celebration', name: 'Celebration Victory', desc: 'Cheering spins, hops & big waves' },
  ]

  // Everyday Actions (25+ moves)
  const actionKeys = Object.keys(ACTION_CATALOG).filter(
    (k) => !k.startsWith('dance_')
  )

  // Expressions (30+ blendshape presets)
  const expressionKeys = Object.keys(EXPRESSION_PRESETS)

  const handlePlayDance = (danceId: string) => {
    setActiveAction(danceId)
    setActiveFX(ACTION_CATALOG[danceId]?.fx || ['music_notes'])
  }

  const handlePlayAction = (actionId: string) => {
    setActiveAction(actionId)
    setActiveFX(ACTION_CATALOG[actionId]?.fx || [])
  }

  const handleStop = () => {
    setActiveAction('idle')
    setActiveFX([])
  }

  const handleRoamMove = (x: number, z: number, isRunning = false) => {
    window.dispatchEvent(
      new CustomEvent('ada:move_to', { detail: { x, z, isRunning } })
    )
  }

  const handleGoHome = () => {
    window.dispatchEvent(
      new CustomEvent('ada:move_to', { detail: { action: 'home' } })
    )
  }

  const handlePoke = () => {
    window.dispatchEvent(new CustomEvent('ada:poke'))
  }

  const triggerLipSyncTest = () => {
    setSystemState('speaking')
    let count = 0
    const interval = setInterval(() => {
      count++
      const freq = new Uint8Array(16)
      for (let i = 0; i < 16; i++) {
        freq[i] = Math.floor(Math.random() * 220 + 35)
      }
      setAudioFrequencies(freq)

      if (count > 25) {
        clearInterval(interval)
        setAudioFrequencies(new Uint8Array(16))
        setSystemState('idle')
      }
    }, 100)
  }

  return (
    <div className="w-screen h-screen relative bg-[#060814] overflow-hidden select-none">
      {/* 1. 3D Scene */}
      <HoloScene />

      {/* 2. Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white font-mono text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO APP</span>
          </a>

          <div className="px-3 py-1.5 rounded-xl glass-panel border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>3D ANIMATION, DANCE & ROAM TEST BENCH</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => updateSettings({ closeUpView: !settings.closeUpView })}
            className="px-3 py-1.5 rounded-xl glass-panel border border-cyan-500/30 text-xs font-mono text-cyan-200"
          >
            CAM: {settings.closeUpView ? 'HEAD/CHEST' : 'FULL BODY'}
          </button>
        </div>
      </header>

      {/* 3. Floating Interactive Testing Console */}
      <div className="fixed left-4 bottom-4 z-40 w-[420px] max-h-[80vh] overflow-y-auto glass-panel p-4 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-3.5 bg-slate-950/90 backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
          <span className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>ACTIVE: {activeAction.toUpperCase()}</span>
          </span>
          <button
            onClick={handleStop}
            className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono flex items-center gap-1 hover:bg-red-500/30"
          >
            <Square className="w-3 h-3" />
            <span>STOP</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-cyan-500/20 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('dances')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'dances'
                ? 'bg-pink-500/30 text-pink-200 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dances ({danceList.length})
          </button>
          <button
            onClick={() => setActiveTab('moves')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'moves'
                ? 'bg-cyan-500/30 text-cyan-200 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Moves ({actionKeys.length})
          </button>
          <button
            onClick={() => setActiveTab('faces')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'faces'
                ? 'bg-amber-500/30 text-amber-200 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Faces ({expressionKeys.length})
          </button>
          <button
            onClick={() => setActiveTab('roam')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'roam'
                ? 'bg-emerald-500/30 text-emerald-200 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Roam
          </button>
          <button
            onClick={() => setActiveTab('cuteness')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'cuteness'
                ? 'bg-purple-500/30 text-purple-200 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cuteness
          </button>
        </div>

        {/* TAB 1: DANCES */}
        {activeTab === 'dances' && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400">
              Select any of Ada's 8 full-body procedural dance choreographies:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {danceList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handlePlayDance(d.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    activeAction === d.id
                      ? 'bg-pink-500/30 text-pink-100 border-pink-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                      : 'bg-slate-900/60 text-slate-200 border-slate-800 hover:border-pink-500/40'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-pink-400" />
                    <span>{d.name}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1 line-clamp-1">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MOVES (25+ Actions) */}
        {activeTab === 'moves' && (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-slate-400">
              25+ natural poses, cute gestures, and everyday animations:
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {actionKeys.map((actionId) => (
                <button
                  key={actionId}
                  onClick={() => handlePlayAction(actionId)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    activeAction === actionId
                      ? 'bg-cyan-500/30 text-cyan-100 border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)]'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="text-[11px] font-mono font-medium truncate capitalize">
                    {actionId.replace(/_/g, ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FACES (30+ Expressions) */}
        {activeTab === 'faces' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Blendshape Intensity</span>
                <span className="text-cyan-300">{Math.round(intensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={intensity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setIntensity(val)
                  setEmotionAndGesture(currentEmotion, val, activeGesture)
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto pr-1">
              {expressionKeys.map((exp) => (
                <button
                  key={exp}
                  onClick={() => setEmotionAndGesture(exp as any, intensity, activeGesture)}
                  className={`p-1.5 rounded-xl border text-left transition-all ${
                    currentEmotion === exp
                      ? 'bg-amber-500/30 text-amber-100 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="text-[10px] font-mono font-medium truncate capitalize">
                    {exp.replace(/_/g, ' ')}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={triggerLipSyncTest}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-500/30 font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Volume2 className="w-4 h-4 text-cyan-300" />
              <span>TEST AUDIO LIP-SYNC (AA / OH)</span>
            </button>
          </div>
        )}

        {/* TAB 4: ROAM & NAVIGATION */}
        {activeTab === 'roam' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Free Roam Autonomous Mode</span>
              <button
                onClick={() => setRoamConfig({ enabled: !roamConfig.enabled })}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  roamConfig.enabled
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {roamConfig.enabled ? 'ENABLED' : 'PAUSED'}
              </button>
            </div>

            <div className="text-[10px] font-mono text-slate-400">
              Steer Ada across the holo-stage coordinates:
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGoHome}
                className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-cyan-500/30 font-semibold"
              >
                <span>🏠 Home Pad (0, 0)</span>
              </button>
              <button
                onClick={handlePoke}
                className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-pink-500/30 font-semibold"
              >
                <span>👉 Poke Ada ("Eep!")</span>
              </button>
              <button
                onClick={() => handleRoamMove(-0.95, -0.4, false)}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-[11px] font-mono hover:border-slate-700"
              >
                ↖ Top-Left Walk
              </button>
              <button
                onClick={() => handleRoamMove(0.95, -0.4, false)}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-[11px] font-mono hover:border-slate-700"
              >
                ↗ Top-Right Walk
              </button>
              <button
                onClick={() => handleRoamMove(-0.85, 0.35, false)}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-[11px] font-mono hover:border-slate-700"
              >
                ↙ Bottom-Left Walk
              </button>
              <button
                onClick={() => handleRoamMove(0.85, 0.35, false)}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-[11px] font-mono hover:border-slate-700"
              >
                ↘ Bottom-Right Walk
              </button>
              <button
                onClick={() => handleRoamMove(0.9, -0.2, true)}
                className="col-span-2 p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-amber-500/30"
              >
                <span>🏃 Sprint / Double-Click Run (Fast Speed)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: CUTENESS & SKIN */}
        {activeTab === 'cuteness' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Wholesome Cuteness Level</span>
                <span className="text-pink-300 font-bold">{cutenessLevel} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cutenessLevel}
                onChange={(e) => setCutenessLevel(parseInt(e.target.value, 10))}
                className="w-full accent-pink-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0 = Stoic Spy</span>
                <span>60 = Default Kawaii</span>
                <span>100 = Maximum Idol</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-mono text-slate-300 font-semibold">
                Outfit Skin Override:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSkinId('ada-red')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    skinId === 'ada-red'
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400 shadow'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">Ada Red</div>
                  <div className="text-[9px] text-slate-400">Spy-Chic</div>
                </button>
                <button
                  onClick={() => setSkinId('cozy-night')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    skinId === 'cozy-night'
                      ? 'bg-purple-500/30 text-purple-200 border-purple-400 shadow'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">Cozy Night</div>
                  <div className="text-[9px] text-slate-400">Deep Plum</div>
                </button>
                <button
                  onClick={() => setSkinId('original-pastel')}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    skinId === 'original-pastel'
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800'
                  }`}
                >
                  <div className="text-xs font-mono font-bold">Pastel</div>
                  <div className="text-[9px] text-slate-400">Original</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
