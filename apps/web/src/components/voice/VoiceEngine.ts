import { useAppStore } from '../../store/useAppStore.js'

class VoiceEngineManager {
  private recognition: any = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array = new Uint8Array(32)
  private animFrameId: number | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    const store = useAppStore.getState()
    if (store.systemState === 'speaking') {
      store.setSystemState('idle')
    }
  }

  // --- Text-to-Speech (TTS) ---
  speak(
    text: string,
    options: { rate?: number; pitch?: number; language?: string; onEnd?: () => void } = {}
  ): void {
    this.initAudioContext()
    this.interruptSpeaking()

    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] SpeechSynthesis not supported in this browser.')
      if (options.onEnd) options.onEnd()
      return
    }

    const store = useAppStore.getState()
    if (store.isMuted) {
      if (options.onEnd) options.onEnd()
      return
    }

    // Clean text (remove URLs, symbols, code blocks)
    const cleanSpeech = text
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/[*_#`[\]]/g, '')
      .trim()

    if (!cleanSpeech) {
      if (options.onEnd) options.onEnd()
      return
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    this.currentUtterance = utterance

    utterance.rate = options.rate ?? 1.05
    utterance.pitch = options.pitch ?? 1.0
    utterance.volume = store.audioVolume ?? 0.9

    // Language selection (Hindi, English, or default)
    const lang = options.language || store.settings.language
    if (lang === 'hi') {
      utterance.lang = 'hi-IN'
    } else {
      utterance.lang = 'en-US'
    }

    // Voice neural selection
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) =>
        (lang === 'hi' && v.lang.startsWith('hi')) ||
        v.name.includes('Samantha') ||
        v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Zira') ||
        v.name.includes('Jenny')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      store.setSystemState('speaking')
      store.triggerGlitch()
    }

    utterance.onend = () => {
      store.setSystemState('idle')
      if (options.onEnd) options.onEnd()
    }

    utterance.onerror = (e) => {
      console.warn('[TTS Error]', e)
      store.setSystemState('idle')
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
