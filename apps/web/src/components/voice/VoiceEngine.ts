import { useAppStore } from '../../store/useAppStore.js'
import { apiUrl } from '../../utils/api.js'

class VoiceEngineManager {
  private recognition: any = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array = new Uint8Array(32)
  private animFrameId: number | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private currentAudioSource: AudioBufferSourceNode | null = null
  private isNeuralPlaying = false

  initAudioContext(): void {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
        this.analyser = this.audioContext.createAnalyser()
        this.analyser.fftSize = 64
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
        this.startFrequencyLoop()
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  private startFrequencyLoop(): void {
    const loop = () => {
      if (this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray as any)
        useAppStore.getState().setAudioFrequencies(this.dataArray)
      }
      this.animFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  // --- Instant Barge-In Interrupt ---
  interruptSpeaking(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop()
        this.currentAudioSource.disconnect()
      } catch {
        // ignore
      }
      this.currentAudioSource = null
    }
    this.isNeuralPlaying = false

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    const store = useAppStore.getState()
    const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
    if (!isSinging && store.systemState === 'speaking') {
      store.setSystemState('idle')
    }
  }

  // --- Primary Text-to-Speech (TTS) with Girl Voice ---
  async speak(
    text: string,
    options: { rate?: number; pitch?: number; language?: string; onEnd?: () => void } = {}
  ): Promise<void> {
    this.initAudioContext()
    this.interruptSpeaking()

    const store = useAppStore.getState()
    if (store.isMuted) {
      if (options.onEnd) options.onEnd()
      return
    }

    // Map active character to authentic neural studio voice
    const activeChar = store.activeCharacter || 'mira'
    const defaultVoiceForChar =
      activeChar === 'atlas'
        ? 'en-US-ChristopherNeural'
        : activeChar === 'ada'
        ? 'en-US-JennyNeural'
        : 'en-US-AnaNeural' // 100% natural, sweet real human girl voice for Mira / Yor

    const rawVoice = store.settings.voice || defaultVoiceForChar
    const voiceSetting = (rawVoice === 'NOpBlnGInO9m6vDvFkFC' || rawVoice === 'cgSgspJ2msm6clMCkdW9') ? defaultVoiceForChar : rawVoice
    const isElevenLabs =
      voiceSetting === 'EXAVITQu4vr4xnSDxMaL' ||
      voiceSetting.startsWith('elevenlabs:') ||
      Boolean(store.settings.elevenlabsApiKey)

    // Clean text
    const cleanSpeech = text
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/[*_#`[\]]/g, '')
      .trim()

    if (!cleanSpeech) {
      if (options.onEnd) options.onEnd()
      return
    }

    // 1. Try High-Fidelity Studio Neural Voice
    try {
      const activeVoiceId =
        store.settings.elevenlabsVoiceId === 'NOpBlnGInO9m6vDvFkFC' || !store.settings.elevenlabsVoiceId
          ? 'EXAVITQu4vr4xnSDxMaL'
          : store.settings.elevenlabsVoiceId

      const res = await fetch(apiUrl('/api/tts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': store.settings.userId || 'default-user-1',
        },
        body: JSON.stringify({
          text: cleanSpeech,
          voice: voiceSetting,
          provider: isElevenLabs ? 'elevenlabs' : 'auto',
          elevenlabsApiKey: store.settings.elevenlabsApiKey,
          elevenlabsVoiceId: activeVoiceId,
          elevenlabsModelId: store.settings.elevenlabsModelId || 'eleven_multilingual_v2',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.audioBase64 && this.audioContext) {
          const binary = atob(data.audioBase64)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }

          const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer)
          const source = this.audioContext.createBufferSource()
          source.buffer = audioBuffer

          // Emotional Prosody Tuning (Playback rate, pitch & air presence)
          const emotion = store.currentEmotion || 'calm'
          let rateMultiplier = 1.0
          let airPresenceBoost = 2.2

          if (emotion === 'happy') {
            rateMultiplier = 1.04
            airPresenceBoost = 2.8
          } else if (emotion === 'playful') {
            rateMultiplier = 1.06
            airPresenceBoost = 3.0
          } else if (emotion === 'concerned') {
            rateMultiplier = 0.95
            airPresenceBoost = 2.5
          } else if (emotion === 'thinking') {
            rateMultiplier = 0.98
            airPresenceBoost = 1.9
          } else if (emotion === 'motivated') {
            rateMultiplier = 1.07
            airPresenceBoost = 2.6
          }

          source.playbackRate.value = rateMultiplier * (options.rate || 1.0)

          // Real Girl Vocal Presence & Air EQ: Gentle high-shelf boost at 3.8kHz
          // giving sweet, silky, breathy feminine warmth
          const highShelf = this.audioContext.createBiquadFilter()
          highShelf.type = 'highshelf'
          highShelf.frequency.value = 3800
          highShelf.gain.value = airPresenceBoost

          // Gain control
          const gainNode = this.audioContext.createGain()
          gainNode.gain.value = store.audioVolume ?? 0.95

          source.connect(highShelf)
          highShelf.connect(gainNode)

          // Connect to analyser for real-time lip-sync & visualizer rings
          if (this.analyser) {
            gainNode.connect(this.analyser)
            this.analyser.connect(this.audioContext.destination)
          } else {
            gainNode.connect(this.audioContext.destination)
          }

          this.currentAudioSource = source
          this.isNeuralPlaying = true

          source.onended = () => {
            this.isNeuralPlaying = false
            this.currentAudioSource = null
            const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
            if (!isSinging) {
              store.setSystemState('idle')
            }
            if (options.onEnd) options.onEnd()
          }

          store.setSystemState('speaking')
          store.triggerGlitch()
          source.start(0)
          return
        }
      }
    } catch (err) {
      console.warn('[Neural TTS] Server voice synthesis failed, falling back to Web Speech girl voice:', err)
    }

    // 2. High-Quality Web Speech API Female Girl Voice Fallback
    this.speakWebSpeech(cleanSpeech, options)
  }

  private speakWebSpeech(
    cleanSpeech: string,
    options: { rate?: number; pitch?: number; language?: string; onEnd?: () => void } = {}
  ): void {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] SpeechSynthesis not supported in this browser.')
      if (options.onEnd) options.onEnd()
      return
    }

    const store = useAppStore.getState()
    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    this.currentUtterance = utterance

    // Feminine girl pitch (1.24 = sweet, bright, melodic feminine tone)
    utterance.pitch = options.pitch ?? 1.24
    utterance.rate = options.rate ?? 1.02
    utterance.volume = store.audioVolume ?? 0.95

    const lang = options.language || store.settings.language
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US'

    // Explicitly filter for FEMALE / GIRL voices, strictly avoiding male voices
    const voices = window.speechSynthesis.getVoices()
    const maleNames = ['david', 'mark', 'george', 'richard', 'guy', 'stefan', 'male']
    const femaleCandidates = voices.filter(
      (v) => !maleNames.some((m) => v.name.toLowerCase().includes(m))
    )

    const preferredVoice =
      femaleCandidates.find(
        (v) =>
          v.name.includes('Jenny') ||
          v.name.includes('Aria') ||
          v.name.includes('Ana') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google US English') ||
          v.name.includes('Zira') ||
          v.name.includes('Victoria') ||
          v.name.includes('Natural')
      ) ||
      femaleCandidates.find((v) => v.lang.startsWith('en')) ||
      voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      store.setSystemState('speaking')
      store.triggerGlitch()
    }

    utterance.onend = () => {
      const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
      if (!isSinging) {
        store.setSystemState('idle')
      }
      if (options.onEnd) options.onEnd()
    }

    utterance.onerror = (e) => {
      console.warn('[WebSpeech Error]', e)
      const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
      if (!isSinging) {
        store.setSystemState('idle')
      }
      if (options.onEnd) options.onEnd()
    }

    window.speechSynthesis.speak(utterance)
  }

  // --- Speech-to-Text (STT) with Barge-In and Wake-Word ---
  startListening(onTranscript: (text: string) => void): boolean {
    this.initAudioContext()
    this.interruptSpeaking() // Stop Ada speaking the second user engages

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      console.warn('[STT] Web Speech API not supported.')
      return false
    }

    try {
      this.recognition = new SpeechRec()
      this.recognition.continuous = false
      this.recognition.interimResults = true

      const store = useAppStore.getState()
      this.recognition.lang = store.settings.language === 'hi' ? 'hi-IN' : 'en-US'

      this.recognition.onstart = () => {
        store.setSystemState('listening')
      }

      this.recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (event.results[0].isFinal) {
          onTranscript(transcript.trim())
          this.stopListening()
        }
      }

      this.recognition.onerror = (err: any) => {
        console.warn('[STT Error]', err)
        store.setSystemState('idle')
      }

      this.recognition.onend = () => {
        if (store.systemState === 'listening') {
          store.setSystemState('idle')
        }
      }

      this.recognition.start()
      return true
    } catch (err) {
      console.warn('[STT Launch Failed]', err)
      return false
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // ignore
      }
      this.recognition = null
    }
  }
}

export const VoiceEngine = new VoiceEngineManager()
