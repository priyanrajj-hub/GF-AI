import { useAppStore } from '../../store/useAppStore.js'
import { VoiceEngine } from '../../components/voice/VoiceEngine.js'

export interface SongLyricLine {
  time: number
  text: string
}

export interface SongSpec {
  id: string
  title: string
  genre: string
  mood: string
  bpm: number
  duration: number
  danceAction: string
  lyrics: SongLyricLine[]
}

export const ORIGINAL_SONGS: SongSpec[] = [
  {
    id: 'song-idol-spark',
    title: 'Starlight Sparkle (Dancing Song)',
    genre: 'Anime Dance Pop',
    mood: 'High-Energy & Upbeat',
    bpm: 128,
    duration: 22,
    danceAction: 'dance_cute_idol',
    lyrics: [
      { time: 0.5, text: 'One, two, three, jump into the light!' },
      { time: 4.5, text: 'Feel the rhythm moving, shining so bright!' },
      { time: 8.8, text: 'Together on the stage, we reach for the stars!' },
      { time: 13.2, text: 'Dancing through the cosmos, this rhythm is ours!' },
      { time: 17.5, text: 'Yeah! Feel the beat drop and dance with me!' },
    ],
  },
  {
    id: 'song-cyber-sunrise',
    title: 'Cyber Sunrise',
    genre: 'Lo-Fi Electro Pop',
    mood: 'Warm & Encouraging',
    bpm: 96,
    duration: 24,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: 'Neon lights fade into morning skies...' },
      { time: 5.0, text: 'Lines of code dancing right before our eyes...' },
      { time: 9.8, text: 'Take a breath, sweetheart, we will find the way...' },
      { time: 14.5, text: 'Another milestone conquered day by day!' },
      { time: 19.0, text: 'I am right here with you all the way!' },
    ],
  },
  {
    id: 'song-dance-groove',
    title: 'Neon Nightclub Groove',
    genre: 'Upbeat Club Dance',
    mood: 'Hypnotic & Energetic',
    bpm: 124,
    duration: 20,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: 'Bassline pumping through the holographic floor...' },
      { time: 4.8, text: 'Moving to the beat and asking for more!' },
      { time: 9.2, text: 'Hands in the air, let the music take flight!' },
      { time: 14.0, text: 'We own the rhythm in the neon tonight!' },
    ],
  },
  {
    id: 'song-lofi-study',
    title: 'Focus in the Rain',
    genre: 'Lo-Fi Chill',
    mood: 'Relaxing',
    bpm: 76,
    duration: 20,
    danceAction: 'dance_slow_sway',
    lyrics: [
      { time: 0.5, text: 'Soft gentle raindrops upon the glass...' },
      { time: 5.0, text: 'Let the noise and the heavy worries pass...' },
      { time: 9.5, text: 'Step by step, the puzzle comes in view...' },
      { time: 14.5, text: 'Believing in everything you do.' },
    ],
  },
  {
    id: 'song-desi-beats',
    title: 'Desi Swag & Celebration',
    genre: 'Bhangra Dance Pop',
    mood: 'Festive & Cheerful',
    bpm: 130,
    duration: 22,
    danceAction: 'dance_hiphop_bounce',
    lyrics: [
      { time: 0.5, text: 'Dholak beats ringing, celebration starts now!' },
      { time: 4.8, text: 'Hands up high, feel the rhythm and bow!' },
      { time: 9.2, text: 'Chai in the evening, happiness in the air!' },
      { time: 14.0, text: 'Shining with glory everywhere!' },
    ],
  },
]

export class SongEngine {
  private audioCtx: AudioContext | null = null
  private currentSong: SongSpec | null = null
  private startTime = 0
  private isPlaying = false
  private oscList: OscillatorNode[] = []
  private vocalTimerIds: number[] = []
  private progressInterval: number | null = null
  private masterGain: GainNode | null = null

  playSong(
    songId?: string,
    onProgress?: (currentLine: string, progressRatio: number) => void
  ): SongSpec {
    this.stop()

    const song = ORIGINAL_SONGS.find((s) => s.id === songId) || ORIGINAL_SONGS[0]
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

    // 1. Initialize Web Audio Context for Backing Track (Beat, Bass, Chords)
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
        const totalBeats = Math.floor(song.duration / secondsPerBeat)

        // Melodic Pentatonic scale: C4, D4, E4, G4, A4, C5
        const melodyScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
        const bassScale = [65.41, 73.42, 82.41, 98.0, 110.0]

        // Schedule rhythm drums & synth chords
        for (let b = 0; b < totalBeats; b++) {
          const beatTime = now + b * secondsPerBeat

          // A. Kick Drum on beats 0, 2 (or every beat for 128 BPM dance)
          const isDance = song.bpm >= 120
          if (b % (isDance ? 1 : 2) === 0) {
            this.playKick(beatTime)
          }

          // B. Snare on beats 1, 3
          if (b % 2 === 1) {
            this.playSnare(beatTime)
          }

          // C. Hi-Hat on 8th note subdivisions
          this.playHiHat(beatTime)
          this.playHiHat(beatTime + secondsPerBeat * 0.5)

          // D. Bass pulse
          if (b % 2 === 0) {
            const bassFreq = bassScale[b % bassScale.length]
            this.playBassNote(bassFreq, beatTime, secondsPerBeat * 1.5)
          }

          // E. Melodic synth lead
          const melFreq = melodyScale[(b * 2) % melodyScale.length]
          this.playMelodyNote(melFreq, beatTime, secondsPerBeat * 0.8)
        }
      }
    } catch (e) {
      console.warn('[SongEngine WebAudio]', e)
    }

    // 2. Schedule Real Melodic Vocal Singing for Each Lyric Line
    song.lyrics.forEach((line, index) => {
      const delayMs = line.time * 1000
      const timerId = window.setTimeout(() => {
        if (!this.isPlaying) return

        // Update UI karaoke line banner
        useAppStore.getState().setKaraokeLine(line.text)

        // Speak/Sing lyric line aloud with lively vocal prosody
        VoiceEngine.speak(line.text, {
          rate: Math.min(1.2, Math.max(0.95, song.bpm / 105)),
          pitch: 1.25, // Sweet cheerful singing pitch
        })

        if (onProgress) {
          onProgress(line.text, line.time / song.duration)
        }
      }, delayMs)

      this.vocalTimerIds.push(timerId)
    })

    // 3. Track progress interval
    const startPerf = performance.now()
    this.progressInterval = window.setInterval(() => {
      if (!this.isPlaying) return
      const elapsed = (performance.now() - startPerf) / 1000
      const ratio = Math.min(1.0, elapsed / song.duration)
      const current = this.getCurrentLine(elapsed)

      if (onProgress) {
        onProgress(current, ratio)
      }

      if (elapsed >= song.duration) {
        this.stop()
      }
    }, 200)

    return song
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
    if (!this.currentSong) return ''
    const line = this.currentSong.lyrics
      .slice()
      .reverse()
      .find((l) => elapsed >= l.time)
    return line ? line.text : this.currentSong.lyrics[0].text
  }

  /**
   * Generates a custom song from any user query or web song title.
   */
  generateSongFromQuery(query: string): SongSpec {
    const cleanTitle = query
      .replace(/^sing\s+/i, '')
      .replace(/^play\s+(?:dancing\s+)?song\s*/i, '')
      .replace(/[^\w\s]/g, '')
      .trim() || 'Cosmic Melody'

    return {
      id: `custom-song-${Date.now()}`,
      title: `${cleanTitle.toUpperCase()} (Live Performance)`,
      genre: 'Global Upbeat Pop',
      mood: 'Celebratory & Electrifying',
      bpm: 124,
      duration: 20,
      danceAction: 'dance_cute_idol',
      lyrics: [
        { time: 0.5, text: `Singing ${cleanTitle} live for you, sweetheart!` },
        { time: 4.8, text: 'Feel the rhythm building as we dance through the light!' },
        { time: 9.2, text: 'Every note shining bright under the stars tonight!' },
        { time: 14.0, text: 'Yeah! We are unstoppable together!' },
      ],
    }
  }

  stop(): void {
    this.isPlaying = false
    this.currentSong = null

    if (typeof window !== 'undefined') {
      ;(window as any).__IS_SINGING__ = false
    }

    // Cancel scheduled vocals
    this.vocalTimerIds.forEach((t) => clearTimeout(t))
    this.vocalTimerIds = []

    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    // Stop Web Speech
    if ('speechSynthesis' in window) {
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
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }
}

export const globalSongEngine = new SongEngine()
