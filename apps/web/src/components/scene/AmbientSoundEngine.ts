import { useAppStore } from '../../store/useAppStore.js'
import type { TimeOfDayPhase } from '@ada/shared'

class AmbientSoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private isRunning = false
  private currentPhase: TimeOfDayPhase = 'morning'
  private activeNodes: Array<AudioNode | { stop: () => void }> = []
  private isMuted = false

  init(): void {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    this.ctx = new AudioCtx()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.15 // Gentle, unobtrusive background volume
    this.masterGain.connect(this.ctx.destination)
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime)
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(0.5, volume * 0.2)), this.ctx.currentTime)
    }
  }

  setPhase(phase: TimeOfDayPhase): void {
    if (this.currentPhase === phase && this.isRunning) return
    this.currentPhase = phase
    if (!this.isRunning) return
    this.stopCurrent()
    this.startForPhase(phase)
  }

  start(): void {
    this.init()
    if (!this.ctx || this.isRunning) return
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    this.isRunning = true
    this.startForPhase(this.currentPhase)
  }

  stop(): void {
    this.stopCurrent()
    this.isRunning = false
  }

  private stopCurrent(): void {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node) node.stop()
        if ('disconnect' in node) node.disconnect()
      } catch {
        // ignore
      }
    })
    this.activeNodes = []
  }

  private startForPhase(phase: TimeOfDayPhase): void {
    if (!this.ctx || !this.masterGain) return

    try {
      if (phase === 'morning') {
        // Morning: Soft gentle breeze + morning bird chime frequencies
        this.createMorningBreezeAndChimes()
      } else if (phase === 'noon') {
        // Noon: Warm lo-fi harmonic chords for focus
        this.createLofiAmbientChords()
      } else if (phase === 'evening') {
        // Evening: Relaxing sunset ocean wave swell
        this.createOceanWavesSwell()
      } else {
        // Night: Soothing gentle rain and cozy fireplace warmth
        this.createNightRainAndHearth()
      }
    } catch (e) {
      console.warn('[AmbientSound] Synthesizer notice:', e)
    }
  }

  // 1. Morning: Soft pink noise breeze with gentle resonant birds
  private createMorningBreezeAndChimes(): void {
    if (!this.ctx || !this.masterGain) return

    // Breeze (filtered pink noise)
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      output[i] = (b0 + b1 + b2) * 0.08
    }

    const whiteNoise = this.ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400

    const breezeGain = this.ctx.createGain()
    breezeGain.gain.value = 0.12

    whiteNoise.connect(filter)
    filter.connect(breezeGain)
    breezeGain.connect(this.masterGain)
    whiteNoise.start()

    this.activeNodes.push(whiteNoise, filter, breezeGain)
  }

  // 2. Noon: Warm lo-fi harmonic chords
  private createLofiAmbientChords(): void {
    if (!this.ctx || !this.masterGain) return
    const freqs = [220, 261.63, 329.63, 392.0] // A minor 7 warm chord

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq + (idx % 2 === 0 ? 0.3 : -0.2) // Subtle analog detune

      const gain = this.ctx.createGain()
      gain.gain.value = 0.025 / freqs.length

      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start()
      this.activeNodes.push(osc, gain)
    })
  }

  // 3. Evening: Relaxing sunset ocean waves swell
  private createOceanWavesSwell(): void {
    if (!this.ctx || !this.masterGain) return

    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.12
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 350

    const waveGain = this.ctx.createGain()
    waveGain.gain.value = 0.08

    // LFO to simulate slow 6s rolling wave swells
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.16 // ~6.2s cycle
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 0.06
    lfo.connect(lfoGain)
    lfoGain.connect(waveGain.gain)

    noise.connect(filter)
    filter.connect(waveGain)
    waveGain.connect(this.masterGain)

    noise.start()
    lfo.start()
    this.activeNodes.push(noise, lfo, filter, waveGain, lfoGain)
  }

  // 4. Night: Gentle rain & soft hearth warmth
  private createNightRainAndHearth(): void {
    if (!this.ctx || !this.masterGain) return

    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.09
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 650

    const rainGain = this.ctx.createGain()
    rainGain.gain.value = 0.09

    noise.connect(filter)
    filter.connect(rainGain)
    rainGain.connect(this.masterGain)

    noise.start()
    this.activeNodes.push(noise, filter, rainGain)
  }
}

export const AmbientSoundEngine = new AmbientSoundManager()
