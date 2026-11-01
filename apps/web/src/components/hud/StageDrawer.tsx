import React, { useState } from 'react'
import {
  Music,
  Sparkles,
  Smile,
  Footprints,
  Play,
  Square,
  X,
  Volume2,
  Heart,
  Sliders,
  Compass,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore.js'
import { ACTION_CATALOG } from '../../avatar/engine/actions.js'
import { EXPRESSION_PRESETS } from '../../avatar/engine/expressions.js'
import { ORIGINAL_SONGS, globalSongEngine } from '../../avatar/engine/singer.js'
import { performAction } from '../../avatar/motion/performAction.js'

const songEngine = globalSongEngine

export const StageDrawer: React.FC = () => {
  const {
    showStageDrawer,
    setShowStageDrawer,
    activeAction,
    setActiveAction,
    currentEmotion,
    setEmotionAndGesture,
    cutenessLevel,
    setCutenessLevel,
    skinId,
    setSkinId,
    roamConfig,
    setRoamConfig,
    activeSong,
    setActiveSong,
    activeFX,
    setActiveFX,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<
    'dance' | 'sing' | 'moves' | 'expressions' | 'roam' | 'cuteness'
  >('dance')

  const [karaokeLine, setKaraokeLine] = useState<string>('')

  if (!showStageDrawer) return null

  const handlePlayDance = (danceId: string) => {
    performAction(danceId, { duration: 30, emotion: 'happy' })
  }

  const handlePlayAction = (actionId: string) => {
    performAction(actionId)
  }

  const handlePlaySong = (songId: string) => {
    const song = songEngine.playSong(songId)
    setActiveSong(song)
    performAction('dance_slow_sway', { duration: 60, emotion: 'singing' as any, fx: ['music_notes', 'sparkles'] })
    setKaraokeLine(song.lyrics[0]?.text || '')
  }

  const handleStopAll = () => {
    songEngine.stop()
    setActiveSong(null)
    setActiveAction('idle')
    setActiveFX([])
    setKaraokeLine('')
  }

  return (
    <div className="fixed inset-x-3 bottom-20 max-h-[55vh] md:inset-auto md:right-4 md:top-20 md:bottom-24 md:w-[420px] md:max-h-[calc(100vh-180px)] z-40 glass-panel rounded-2xl border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white tracking-wider">
            STAGE & PERFORMANCE STUDIO
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeAction !== 'idle' && (
            <button
              onClick={handleStopAll}
              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Stop Performance (Space)"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>STOP</span>
            </button>
          )}
          <button
            onClick={() => setShowStageDrawer(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto text-xs font-mono">
        {[
          { id: 'dance', label: 'Dance (8)', icon: Music },
          { id: 'sing', label: 'Sing', icon: Volume2 },
          { id: 'moves', label: 'Moves (25+)', icon: Sparkles },
          { id: 'expressions', label: 'Faces (30+)', icon: Smile },
          { id: 'roam', label: 'Free Roam', icon: Footprints },
          { id: 'cuteness', label: 'Cuteness & Skin', icon: Heart },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Performance / Karaoke Banner */}
      {activeSong && (
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border-b border-cyan-500/20 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="text-cyan-400 animate-pulse font-bold">♪ NOW SINGING:</span>
            <span className="text-white truncate">{activeSong.title}</span>
          </div>
          <span className="text-pink-300 italic text-[11px] truncate max-w-[180px]">
            "{karaokeLine || activeSong.lyrics[0].text}"
          </span>
        </div>
      )}

      {/* Tab Contents */}
      <div className="p-4 overflow-y-auto space-y-3 text-xs">
        {/* 1. DANCE TAB */}
        {activeTab === 'dance' && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'dance_cute_idol', name: 'Cute Idol Dance', style: 'Anime idol hops & cute hip sways' },
              { id: 'dance_pop_groove', name: 'Pop Groove', style: 'Rhythmic shoulder rolls & snaps' },
              { id: 'dance_hiphop', name: 'Hip-Hop Bounce', style: 'Low-gravity bounce & head bobs' },
              { id: 'dance_ballad_sway', name: 'Slow Ballad Sway', style: 'Graceful waltz & arm arcs' },
              { id: 'dance_spy_jazz', name: 'Spy-Chic Jazz', style: 'Ada signature confident turns' },
              { id: 'dance_jump_energetic', name: 'Energetic Jump', style: 'High hops & double hand waves' },
              { id: 'dance_lofi_chill', name: 'Lo-Fi Chill Sway', style: 'Relaxed weight shift & groove' },
              { id: 'dance_celebration', name: 'Celebration Dance', style: 'Triumphant spins & hands up' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => handlePlayDance(d.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  activeAction === d.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{d.name}</span>
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{d.style}</div>
              </button>
            ))}
          </div>
        )}

        {/* 2. SING TAB */}
        {activeTab === 'sing' && (
          <div className="space-y-2.5">
            <div className="text-[11px] text-slate-400 font-mono">
              Ada writes original, copyright-safe lo-fi & anime songs with synced karaoke vocals:
            </div>
            {ORIGINAL_SONGS.map((song) => (
              <div
                key={song.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{song.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
                      {song.genre}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {song.bpm} BPM • {song.mood}
                  </div>
                </div>
                <button
                  onClick={() => handlePlaySong(song.id)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>SING</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. EVERYDAY MOVES TAB */}
        {activeTab === 'moves' && (
          <div className="grid grid-cols-3 gap-1.5">
            {[
              'wave', 'peace_sign', 'heart_hands', 'cat_paws', 'blow_kiss', 'cheer',
              'thumbs_up', 'fist_pump', 'laugh', 'spin_twirl', 'sassy_hair_flip', 'salute',
              'bow', 'nod', 'shake', 'shrug', 'think', 'facepalm', 'clap',
              'stretch', 'yawn', 'sip_tea', 'type_holo', 'point_present', 'pout'
            ].map((actionId) => (
              <button
                key={actionId}
                onClick={() => handlePlayAction(actionId)}
                className={`p-2 rounded-lg border text-center font-mono text-[11px] cursor-pointer transition-all capitalize ${
                  activeAction === actionId
                    ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                {actionId.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* 4. EXPRESSIONS TAB */}
        {activeTab === 'expressions' && (
          <div className="grid grid-cols-3 gap-1.5">
            {Object.keys(EXPRESSION_PRESETS).map((expName) => (
              <button
                key={expName}
                onClick={() => setEmotionAndGesture(expName as any, 0.9, 'idle')}
                className={`p-2 rounded-lg border text-center font-mono text-[11px] cursor-pointer transition-all capitalize ${
                  currentEmotion === expName
                    ? 'border-pink-400 bg-pink-500/20 text-white font-bold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-pink-500/40 hover:text-white'
                }`}
              >
                {expName.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* 5. FREE ROAM TAB */}
        {activeTab === 'roam' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-200">Autonomous Free Roaming</span>
              <button
                onClick={() => setRoamConfig({ enabled: !roamConfig.enabled })}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  roamConfig.enabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {roamConfig.enabled ? 'ACTIVE' : 'STAY PUT'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="text-slate-200">Follow Cursor ("Come Here")</span>
              <button
                onClick={() => setRoamConfig({ followCursor: !roamConfig.followCursor })}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  roamConfig.followCursor ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {roamConfig.followCursor ? 'FOLLOWING' : 'OFF'}
              </button>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Roam Range</span>
                <span className="text-cyan-400 uppercase">{roamConfig.range}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['home', 'half', 'full'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoamConfig({ range: r })}
                    className={`py-1 rounded text-center text-[10px] cursor-pointer uppercase ${
                      roamConfig.range === r
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Roam Energy</span>
                <span className="text-cyan-400 uppercase">{roamConfig.energy}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['calm', 'balanced', 'playful'] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setRoamConfig({ energy: e })}
                    className={`py-1 rounded text-center text-[10px] cursor-pointer uppercase ${
                      roamConfig.energy === e
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. CUTENESS & SKIN TAB */}
        {activeTab === 'cuteness' && (
          <div className="space-y-3 font-mono">
            {/* Cuteness Slider (0-100, Round 5) */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  <span>Kawaii Cuteness Slider</span>
                </span>
                <span className="text-pink-400 font-bold">{cutenessLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={cutenessLevel}
                onChange={(e) => setCutenessLevel(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Jarvis Calm</span>
                <span>Playful / Wholesome</span>
              </div>
            </div>

            {/* Skin Selector */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
              <span className="text-slate-200 font-bold">Signature Outfit Skin</span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'ada-red', name: 'Ada Spy-Chic (Red & Black)', desc: 'Crimson dress, charcoal black hair, no ribbons' },
                  { id: 'cozy-night', name: 'Cozy Night (Plum & Slate)', desc: 'Relaxed evening pajamas' },
                  { id: 'original-pastel', name: 'Original Sample (Pastel)', desc: 'Unmodified sample model' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSkinId(s.id)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      skinId === s.id
                        ? 'border-red-500 bg-red-500/20 text-white shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
