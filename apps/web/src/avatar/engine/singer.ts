import { apiUrl } from '../../utils/api.js'
import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../../components/voice/VoiceEngine.js'
import {
  type SongLyricLine,
  type SongSpec,
  POPULAR_SONG_CATALOG,
  resolveSong,
} from '@ada/shared'
import { performAction } from '../motion/performAction.js'

export type { SongLyricLine, SongSpec }
export const ORIGINAL_SONGS: SongSpec[] = POPULAR_SONG_CATALOG

export class SongEngine {
  private audioCtx: AudioContext | null = null
  private currentSong: SongSpec | null = null
  private startTime = 0
  private isPlaying = false
  private oscList: OscillatorNode[] = []
  private vocalTimerIds: number[] = []
  private progressInterval: number | null = null
  private masterGain: GainNode | null = null
  private audioElement: HTMLAudioElement | null = null
  private analyserNode: AnalyserNode | null = null
  private animFrameId: number | null = null

  playSong(
    songOrId?: string | SongSpec,
    onProgress?: (currentLine: string, progressRatio: number) => void
  ): SongSpec {
    this.stop()

    let song: SongSpec
    if (typeof songOrId === 'object' && songOrId && 'lyrics' in songOrId) {
      song = songOrId
    } else if (typeof songOrId === 'string' && songOrId) {
      const existing = ORIGINAL_SONGS.find((s) => s.id === songOrId)
      if (existing) {
        song = existing
      } else {
        song = resolveSong(songOrId)
      }
    } else {
      song = ORIGINAL_SONGS[0]
    }

    this.currentSong = song
    this.isPlaying = true

    // Set global singing flags for ExpressionEngine & ProceduralAnimator
    if (typeof window !== 'undefined') {
      ;(window as any).__IS_SINGING__ = true
      ;(window as any).__SONG_BPM__ = song.bpm
    }

    const store = useAppStore.getState()
    store.setSystemState('speaking')
    store.setActiveSong(song)
    store.setKaraokeLine(song.lyrics[0]?.text || '')

    // Trigger & lock synchronized rhythm dance
    const dance = song.danceAction || 'dance_pop_groove'
    performAction(dance as any, {
      emotion: 'excited',
      intensity: 1.0,
      duration: song.duration || 32,
    })

    // Unlock audio context immediately
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        if (!this.audioCtx) this.audioCtx = new AudioContextClass()
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }
      }
    } catch {}

    // Stop any ongoing voice speech so the real online track plays with zero vocal clash
    VoiceEngine.interruptSpeaking()

    // Pure Online Audio Stream Playback
    const playOnlineAudio = (url: string) => {
      try {
        if (this.audioElement) {
          try {
            this.audioElement.pause()
            this.audioElement.src = ''
          } catch {}
          this.audioElement = null
        }

        // Direct hardware speaker stream from online URL (Zero CORS restrictions)
        this.audioElement = new Audio(url)
        this.audioElement.volume = store.audioVolume ?? 0.95
        this.audioElement.preload = 'auto'

        // Detect real full track length from audio metadata
        this.audioElement.onloadedmetadata = () => {
          if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration)) {
            const realDuration = Math.round(this.audioElement.duration)
            if (realDuration > 0) {
              song.duration = realDuration
              store.setActiveSong({ ...song, duration: realDuration })
              // Keep the 3D dance active for the complete duration of the song
              performAction((song.danceAction || 'dance_pop_groove') as any, {
                emotion: 'excited',
                intensity: 1.0,
                duration: realDuration + 4,
              })
            }
          }
        }

        this.audioElement.onerror = () => {
          console.warn('[Online Audio Stream Failed, falling back to Web Audio Synth]')
          this.startSynthesizerTrack(song, onProgress)
        }

        const playPromise = this.audioElement.play()
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Online Audio Stream Autoplay Blocked, falling back to Web Audio Synth]:', err)
            this.startSynthesizerTrack(song, onProgress)
          })
        }

        // ONLY stop when the complete song has finished playing from start to end!
        this.audioElement.onended = () => {
          console.log(`🎶 [SongEngine] Song "${song.title}" completed full playback!`)
          this.stop()
        }
      } catch (err) {
        console.warn('[Online Audio Stream Error]:', err)
        this.startSynthesizerTrack(song, onProgress)
      }
    }

    if (song.audioUrl) {
      playOnlineAudio(song.audioUrl)
    } else {
      // Fetch fresh online studio recording stream from backend
      fetch(apiUrl(`/api/music/search?q=${encodeURIComponent(song.title)}`))
        .then((res) => res.json())
        .then((data) => {
          if (data && data.track && data.track.audioUrl && this.isPlaying) {
            song.audioUrl = data.track.audioUrl
            song.artworkUrl = data.track.artworkUrl || song.artworkUrl
            song.duration = data.track.duration || song.duration
            store.setActiveSong({ ...song })
            playOnlineAudio(data.track.audioUrl)
          } else if (this.isPlaying) {
            this.startSynthesizerTrack(song, onProgress)
          }
        })
        .catch((fetchErr) => {
          console.warn('[Online Audio Stream Lookup Failed, using Web Audio Synth]:', fetchErr)
          if (this.isPlaying) {
            this.startSynthesizerTrack(song, onProgress)
          }
        })
    }

    // Live Frequency Visualizer Loop for HUD & 3D Avatar Mouth Lip-Sync
    const updateFrequencies = () => {
      if (!this.isPlaying) return
      const now = performance.now() / 1000
      const bpm = song.bpm || 120
      const beatPhase = Math.sin(now * (bpm / 60) * Math.PI * 2) * 0.5 + 0.5
      const energy = 0.65 + beatPhase * 0.30 + Math.random() * 0.08
      const simulated = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        const falloff = Math.max(0.35, 1.0 - i / 32)
        simulated[i] = Math.round(Math.min(255, energy * falloff * 255))
      }
      store.setAudioFrequencies(simulated)
      this.animFrameId = requestAnimationFrame(updateFrequencies)
    }
    this.animFrameId = requestAnimationFrame(updateFrequencies)

    // Schedule progress tracking & text karaoke updates (Never forcibly cut off active audio stream)
    const startPerf = performance.now()
    this.progressInterval = window.setInterval(() => {
      if (!this.isPlaying) return

      let elapsed: number
      let totalDuration: number = song.duration || 210

      if (this.audioElement && !isNaN(this.audioElement.currentTime) && this.audioElement.currentTime > 0) {
        elapsed = this.audioElement.currentTime
        if (this.audioElement.duration && !isNaN(this.audioElement.duration) && isFinite(this.audioElement.duration)) {
          totalDuration = this.audioElement.duration
        }
      } else {
        elapsed = (performance.now() - startPerf) / 1000
      }

      const ratio = Math.min(1.0, elapsed / Math.max(1, totalDuration))
      const current = this.getCurrentLine(elapsed)

      store.setKaraokeLine(current)
      if (onProgress) {
        onProgress(current, ratio)
      }

      // ONLY stop via timer if there is NO hardware audio element playing!
      // (If audioElement is playing, audioElement.onended will fire when the full song is complete)
      if (!this.audioElement && elapsed >= totalDuration) {
        this.stop()
      }
    }, 250)

    return song
  }

  private startSynthesizerTrack(
    song: SongSpec,
    onProgress?: (currentLine: string, progressRatio: number) => void
  ): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }

        this.masterGain = this.audioCtx.createGain()
        this.masterGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime)
        this.masterGain.connect(this.audioCtx.destination)

        const now = this.audioCtx.currentTime
        this.startTime = now

        const secondsPerBeat = 60 / song.bpm
        const totalBeats = Math.floor((song.duration || 24) / secondsPerBeat)
        const melodyScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
        const bassScale = [65.41, 73.42, 82.41, 98.0, 110.0]

        for (let b = 0; b < totalBeats; b++) {
          const beatTime = now + b * secondsPerBeat
          const isDance = song.bpm >= 120
          if (b % (isDance ? 1 : 2) === 0) {
            this.playKick(beatTime)
          }
          if (b % 2 === 1) {
            this.playSnare(beatTime)
          }
          this.playHiHat(beatTime)
          this.playHiHat(beatTime + secondsPerBeat * 0.5)

          if (b % 2 === 0) {
            const bassFreq = bassScale[b % bassScale.length]
            this.playBassNote(bassFreq, beatTime, secondsPerBeat * 1.5)
          }

          const melFreq = melodyScale[(b * 2) % melodyScale.length]
          this.playMelodyNote(melFreq, beatTime, secondsPerBeat * 0.8)
        }
      }
    } catch (e) {
      console.warn('[SongEngine WebAudio Synth]', e)
    }

    // Schedule vocals for procedural track
    song.lyrics.forEach((line) => {
      const delayMs = line.time * 1000
      const timerId = window.setTimeout(() => {
        if (!this.isPlaying) return
        useAppStore.getState().setKaraokeLine(line.text)
        VoiceEngine.speak(line.text, {
          rate: Math.min(1.2, Math.max(0.95, song.bpm / 105)),
          pitch: 1.25,
        })
        if (onProgress) {
          onProgress(line.text, line.time / song.duration)
        }
      }, delayMs)
      this.vocalTimerIds.push(timerId)
    })
  }

  private playKick(time: number): void {
    if (!this.audioCtx || !this.masterGain) return
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.frequency.setValueAtTime(120, time)
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12)
    gain.gain.setValueAtTime(0.45, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + 0.16)
    this.oscList.push(osc)
  }

  private playSnare(time: number): void {
    if (!this.audioCtx || !this.masterGain) return
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, time)
    gain.gain.setValueAtTime(0.25, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + 0.14)
    this.oscList.push(osc)
  }

  private playHiHat(time: number): void {
    if (!this.audioCtx || !this.masterGain) return
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(8000, time)
    gain.gain.setValueAtTime(0.05, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + 0.05)
    this.oscList.push(osc)
  }

  private playBassNote(freq: number, time: number, duration: number): void {
    if (!this.audioCtx || !this.masterGain) return
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + duration)
    this.oscList.push(osc)
  }

  private playMelodyNote(freq: number, time: number, duration: number): void {
    if (!this.audioCtx || !this.masterGain) return
    const osc = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(0.001, time)
    gain.gain.exponentialRampToValueAtTime(0.15, time + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(time)
    osc.stop(time + duration)
    this.oscList.push(osc)
  }

  getCurrentLine(elapsed: number): string {
    if (!this.currentSong || !this.currentSong.lyrics.length) return ''
    const line = this.currentSong.lyrics
      .slice()
      .reverse()
      .find((l) => elapsed >= l.time)
    return line ? line.text : this.currentSong.lyrics[0].text
  }

  generateSongFromQuery(query: string): SongSpec {
    return resolveSong(query)
  }

  stop(): void {
    this.isPlaying = false
    this.currentSong = null

    if (typeof window !== 'undefined') {
      ;(window as any).__IS_SINGING__ = false
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause()
        this.audioElement.src = ''
      } catch {}
      this.audioElement = null
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }

    this.vocalTimerIds.forEach((t) => clearTimeout(t))
    this.vocalTimerIds = []

    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    this.oscList.forEach((o) => {
      try {
        o.stop()
        o.disconnect()
      } catch {}
    })
    this.oscList = []

    if (this.audioCtx) {
      try {
        this.audioCtx.close()
      } catch {}
      this.audioCtx = null
    }

    const store = useAppStore.getState()
    if (store.systemState === 'speaking') {
      store.setSystemState('idle')
    }
    store.setActiveSong(null)
    store.setKaraokeLine('')
    store.setAudioFrequencies([])
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }
}

export const globalSongEngine = new SongEngine()
