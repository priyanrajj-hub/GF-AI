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
  lyrics: SongLyricLine[]
}

export const ORIGINAL_SONGS: SongSpec[] = [
  {
    id: 'song-cyber-sunrise',
    title: 'Cyber Sunrise',
    genre: 'Lo-Fi Pop',
    mood: 'Warm & Encouraging',
    bpm: 84,
    duration: 22,
    lyrics: [
      { time: 0.5, text: 'Neon lights fade into morning skies...' },
      { time: 4.5, text: 'Lines of code dancing before our eyes...' },
      { time: 8.5, text: 'Take a breath, partner, we will find the way...' },
      { time: 13.0, text: 'Another milestone conquered day by day!' },
      { time: 18.0, text: 'I am right here with you all the way.' },
    ],
  },
  {
    id: 'song-lofi-study',
    title: 'Focus in the Rain',
    genre: 'Lo-Fi Chill',
    mood: 'Relaxing',
    bpm: 76,
    duration: 20,
    lyrics: [
      { time: 0.5, text: 'Soft gentle raindrops upon the glass...' },
      { time: 4.8, text: 'Let the noise and the worries pass...' },
      { time: 9.2, text: 'Step by step, the puzzle comes in view...' },
      { time: 14.5, text: 'Believing in everything you do.' },
    ],
  },
  {
    id: 'song-idol-spark',
    title: 'Starlight Sparkle',
    genre: 'Anime Pop',
    mood: 'Joyful & Cute',
    bpm: 120,
    duration: 18,
    lyrics: [
      { time: 0.5, text: '1, 2, 3! Jump into the light!' },
      { time: 3.8, text: 'Every dream shining bright!' },
      { time: 7.2, text: 'Together we can touch the stars above!' },
      { time: 11.5, text: 'Sending you all my cheerful love!' },
      { time: 15.0, text: 'Yay! We did it!' },
    ],
  },
]

export class SongEngine {
  private audioCtx: AudioContext | null = null
  private currentSong: SongSpec | null = null
  private startTime = 0
  private isPlaying = false
  private oscList: OscillatorNode[] = []

  playSong(songId?: string, onProgress?: (currentLine: string, progressRatio: number) => void): SongSpec {
    this.stop()

    const song = ORIGINAL_SONGS.find((s) => s.id === songId) || ORIGINAL_SONGS[0]
    this.currentSong = song
    this.isPlaying = true

    // Initialize Web Audio synth for wholesome original lo-fi melody
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
        const now = this.audioCtx.currentTime
        this.startTime = now

        // Pentatonic gentle melody notes: C4, D4, E4, G4, A4
        const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
        const noteDuration = 60 / song.bpm

        for (let i = 0; i < Math.floor(song.duration / noteDuration); i++) {
          const osc = this.audioCtx.createOscillator()
          const gain = this.audioCtx.createGain()
          osc.type = i % 2 === 0 ? 'sine' : 'triangle'
          const freq = scale[Math.floor(Math.random() * scale.length)]
          osc.frequency.setValueAtTime(freq, now + i * noteDuration)

          gain.gain.setValueAtTime(0.001, now + i * noteDuration)
          gain.gain.exponentialRampToValueAtTime(0.06, now + i * noteDuration + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (i + 0.9) * noteDuration)

          osc.connect(gain)
          gain.connect(this.audioCtx.destination)
          osc.start(now + i * noteDuration)
          osc.stop(now + (i + 1) * noteDuration)
          this.oscList.push(osc)
        }
      }
    } catch (e) {
      console.warn('[SongEngine WebAudio]', e)
    }

    return song
  }

  getCurrentLine(elapsed: number): string {
    if (!this.currentSong) return ''
    const line = this.currentSong.lyrics
      .slice()
      .reverse()
      .find((l) => elapsed >= l.time)
    return line ? line.text : this.currentSong.lyrics[0].text
  }

  stop(): void {
    this.isPlaying = false
    this.currentSong = null
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
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }
}

export const globalSongEngine = new SongEngine()
