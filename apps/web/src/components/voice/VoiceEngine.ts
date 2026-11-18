import { useAppStore } from '../../store/useAppStore.js'
import { apiUrl, apiFetch } from '../../utils/api.js'

class VoiceEngineManager {
  private recognition: any = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array = new Uint8Array(32)
  private animFrameId: number | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private currentAudioSource: AudioBufferSourceNode | null = null
  private currentHtmlAudio: HTMLAudioElement | null = null
  private isNeuralPlaying = false
  // Lock ID: incremented each speak() call; callbacks check against it to prevent stale double-play
  private _speakLockId = 0

  getAudioContext(): AudioContext | null {
    this.initAudioContext()
    return this.audioContext
  }

  getAnalyser(): AnalyserNode | null {
    this.initAudioContext()
    return this.analyser
  }

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
      const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
      if (!isSinging && this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray as any)
        useAppStore.getState().setAudioFrequencies(this.dataArray)
      }
      this.animFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  // --- Instant Barge-In Interrupt ---
  interruptSpeaking(): void {
    // Invalidate any in-flight speak() promise so its fallback won't fire
    this._speakLockId++

    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop()
        this.currentAudioSource.disconnect()
      } catch {
        // ignore
      }
      this.currentAudioSource = null
    }
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause()
        this.currentHtmlAudio.src = ''
      } catch { /* ignore */ }
      this.currentHtmlAudio = null
    }
    this.isNeuralPlaying = false

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (this.currentUtterance) {
      this.currentUtterance = null
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
    // Capture this invocation's lock. If a newer speak() fires before we finish,
    // our async callbacks will see a different lockId and silently bail.
    const myLockId = this._speakLockId

    const store = useAppStore.getState()
    const activeChar = store.activeCharacter || 'ada'
    if (store.isMuted) {
      if (options.onEnd) options.onEnd()
      return
    }

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

    // Determine active voice provider & configuration
    const userVoice = store.settings.voice || ''
    const userProvider = store.settings.voiceProvider || (userVoice === 'official-miku' ? 'official-miku' : userVoice === 'system' ? 'system' : 'default-gf')

    // 1. System / Browser Voice (Web Speech API)
    if (userProvider === 'system' || userVoice === 'system') {
      this.speakWebSpeech(cleanSpeech, options, myLockId)
      return
    }

    // 2. Official Hatsune Miku Voice (Crypton Future Media / Yamaha VOCALOID)
    if (userProvider === 'official-miku' || userVoice === 'official-miku') {
      try {
        this.initAudioContext()
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume().catch(() => {})
        }

        const res = await apiFetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanSpeech,
            voice: 'official-miku',
            provider: 'official-miku',
            language: options.language || store.settings.language || 'ja',
            character: activeChar,
            pitch: options.pitch,
            rate: options.rate,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const noticeMsg = errData.error || errData.statusMessage || 'Official Hatsune Miku voice integration requires an authorized voice provider and applicable licensing.'
          console.warn('[Official Miku Voice Notice]:', noticeMsg)
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('ada:voice_notice', {
                detail: {
                  message: noticeMsg,
                  code: errData.code || 'MIKU_VOICE_UNLICENSED',
                  licenseStatus: errData.licenseStatus || 'not_configured',
                },
              })
            )
          }

          // Do NOT substitute with an imitation voice
          if (options.onEnd) options.onEnd()
          store.setSystemState('idle')
          return
        }

        const data = await res.json()
        if (data.audioBase64) {
          await this.playAudioBase64(data.audioBase64, data.mimeType || 'audio/mpeg', myLockId, options, true)
          return
        }
      } catch (mikuErr: any) {
        console.warn('[Official Miku Voice Network Error]:', mikuErr)
        if (options.onEnd) options.onEnd()
        store.setSystemState('idle')
        return
      }
    }

    // 3. Default GF-AI Studio Voice (Microsoft Edge Neural / ElevenLabs / Gemini / Kokoro)
    const isTamil = (options.language || store.settings.language) === 'ta' || /[\u0B80-\u0BFF]/.test(cleanSpeech)
    const isTanglish = (options.language || store.settings.language) === 'tanglish'
    const isAtlas = activeChar === 'atlas'

    // Map active character & language to authentic neural studio voice
    let voiceSetting: string
    let isElevenLabs = false

    if (isTamil) {
      voiceSetting = isAtlas ? 'ta-IN-ValluvarNeural' : 'ta-IN-PallaviNeural'
      isElevenLabs = false
    } else if (isAtlas) {
      voiceSetting = isTanglish ? 'en-IN-PrabhatNeural' : 'en-US-ChristopherNeural'
      isElevenLabs = false
    } else if (activeChar === 'ada') {
      voiceSetting = isTanglish ? 'en-IN-NeerjaExpressiveNeural' : 'en-US-JennyNeural'
      isElevenLabs = false
    } else {
      const isJapanese = options.language === 'ja' || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(cleanSpeech)
      voiceSetting = isJapanese ? 'ja-JP-NanamiNeural' : 'en-US-AnaNeural'
      isElevenLabs = false
    }

    try {
      this.initAudioContext()
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch(() => {})
      }

      const activeVoiceId =
        store.settings.elevenlabsVoiceId === 'NOpBlnGInO9m6vDvFkFC' || !store.settings.elevenlabsVoiceId
          ? 'EXAVITQu4vr4xnSDxMaL'
          : store.settings.elevenlabsVoiceId

      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanSpeech,
          voice: voiceSetting,
          provider: isElevenLabs ? 'elevenlabs' : 'auto',
          language: options.language || store.settings.language,
          character: activeChar,
          elevenlabsApiKey: store.settings.elevenlabsApiKey,
          elevenlabsVoiceId: activeVoiceId,
          elevenlabsModelId: store.settings.elevenlabsModelId || 'eleven_multilingual_v2',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.audioBase64) {
          await this.playAudioBase64(data.audioBase64, data.mimeType || 'audio/mpeg', myLockId, options, activeChar === 'mira')
          return
        }
      }
    } catch (err) {
      console.warn('[Neural TTS] Server voice synthesis failed, falling back to Web Speech:', err)
    }

    // 4. Web Speech API Fallback — ONLY if default neural TTS truly failed
    if (this._speakLockId !== myLockId) return
    this.speakWebSpeech(cleanSpeech, options, myLockId)
  }

  /**
   * Helper: Plays decoded audio buffer through Web Audio graph with analyser and visceral EQ
   */
  private async playAudioBase64(
    audioBase64: string,
    mimeType: string,
    myLockId: number,
    options: { rate?: number; pitch?: number; language?: string; onEnd?: () => void } = {},
    isMiku = false
  ): Promise<void> {
    const store = useAppStore.getState()
    const activeChar = store.activeCharacter || 'ada'

    this.initAudioContext()
    if (this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume().catch(() => {})
        }

        const binary = atob(audioBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }

        const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer.slice(0))
        const source = this.audioContext.createBufferSource()
        source.buffer = audioBuffer

        // Emotional Prosody Tuning
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

        if (isMiku) {
          rateMultiplier *= 1.08 // Sweet, brisk Vocaloid idol speed
        }

        source.playbackRate.value = rateMultiplier * (options.rate || 1.0)

        // Formant & Air Presence EQ
        const vocaloidFilter = this.audioContext.createBiquadFilter()
        vocaloidFilter.type = 'peaking'
        vocaloidFilter.frequency.value = isMiku ? 1650 : 2500
        vocaloidFilter.Q.value = isMiku ? 2.6 : 1.0
        vocaloidFilter.gain.value = isMiku ? 5.8 : 0.0

        const vocaloidPresence = this.audioContext.createBiquadFilter()
        vocaloidPresence.type = 'peaking'
        vocaloidPresence.frequency.value = isMiku ? 2850 : 3000
        vocaloidPresence.Q.value = isMiku ? 2.2 : 1.0
        vocaloidPresence.gain.value = isMiku ? 4.2 : 0.0

        const highShelf = this.audioContext.createBiquadFilter()
        highShelf.type = 'highshelf'
        highShelf.frequency.value = isMiku ? 4600 : 3800
        highShelf.gain.value = isMiku ? 4.8 : airPresenceBoost

        const gainNode = this.audioContext.createGain()
        gainNode.gain.value = store.audioVolume ?? 0.95

        source.connect(vocaloidFilter)
        vocaloidFilter.connect(vocaloidPresence)
        vocaloidPresence.connect(highShelf)
        highShelf.connect(gainNode)

        // Connect to analyser for real-time lip-sync & visualizer rings
        if (this.analyser) {
          gainNode.connect(this.analyser)
          this.analyser.connect(this.audioContext.destination)
        } else {
          gainNode.connect(this.audioContext.destination)
        }

        if (this._speakLockId !== myLockId) return

        this.currentAudioSource = source
        this.isNeuralPlaying = true

        source.onended = () => {
          if (this._speakLockId !== myLockId) return
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
      } catch (decodeErr) {
        console.warn('[Web Audio Decode Error, attempting HTMLAudio fallback]:', decodeErr)
      }
    }

    // HTMLAudioElement Fallback for guaranteed playback in any browser context
    if (this._speakLockId !== myLockId) return
    try {
      const audioElem = new Audio(`data:${mimeType || 'audio/mpeg'};base64,${audioBase64}`)
      this.currentHtmlAudio = audioElem
      audioElem.volume = store.audioVolume ?? 0.95
      audioElem.onended = () => {
        if (this._speakLockId !== myLockId) return
        this.currentHtmlAudio = null
        const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
        if (!isSinging) {
          store.setSystemState('idle')
        }
        if (options.onEnd) options.onEnd()
      }
      store.setSystemState('speaking')
      await audioElem.play()
    } catch (audioElemErr) {
      console.warn('[HTMLAudio Fallback Failed]:', audioElemErr)
      if (options.onEnd) options.onEnd()
      store.setSystemState('idle')
    }
  }

  private speakWebSpeech(
    cleanSpeech: string,
    options: { rate?: number; pitch?: number; language?: string; onEnd?: () => void } = {},
    lockId?: number
  ): void {
    if (lockId !== undefined && this._speakLockId !== lockId) return
    if (this.isNeuralPlaying) return

    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] SpeechSynthesis not supported in this browser.')
      if (options.onEnd) options.onEnd()
      return
    }

    window.speechSynthesis.cancel()

    const store = useAppStore.getState()
    const activeChar = store.activeCharacter || 'ada'
    const isAtlas = activeChar === 'atlas'
    const utterance = new SpeechSynthesisUtterance(cleanSpeech)
    this.currentUtterance = utterance

    // Character-Specific Pitch & Cadence:
    // Atlas (Tony Stark): 0.94 masculine deep resonant pitch
    // Ada (Ada Wong): 1.04 poised, articulate tutor pitch
    // Mira (Hatsune Miku): 1.35 sweet, energetic, high-pitch Vocaloid cyber idol pitch
    const isMiku = activeChar === 'mira'
    const defaultPitch = isAtlas ? 0.94 : isMiku ? 1.35 : 1.04
    const defaultRate = isAtlas ? 1.05 : isMiku ? 1.10 : 1.02
    utterance.pitch = options.pitch ?? defaultPitch
    utterance.rate = options.rate ?? defaultRate
    utterance.volume = store.audioVolume ?? 0.95

    const lang = options.language || store.settings.language
    const isTamilScript = /[\u0B80-\u0BFF]/.test(cleanSpeech)
    const isJapaneseScript = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(cleanSpeech)
    if (isTamilScript || lang === 'ta') {
      utterance.lang = 'ta-IN'
    } else if (isJapaneseScript || lang === 'ja') {
      utterance.lang = 'ja-JP'
    } else if (lang === 'tanglish' || lang === 'hi') {
      utterance.lang = 'en-IN'
    } else {
      utterance.lang = 'en-US'
    }

    const voices = window.speechSynthesis.getVoices()
    const maleNames = ['david', 'mark', 'george', 'richard', 'guy', 'stefan', 'male', 'christopher', 'alex', 'james']

    let preferredVoice: SpeechSynthesisVoice | undefined
    if (isAtlas) {
      // Atlas / Tony Stark: Strictly select masculine male voices
      const maleCandidates = voices.filter((v) =>
        maleNames.some((m) => v.name.toLowerCase().includes(m))
      )
      preferredVoice =
        maleCandidates.find((v) => v.lang.startsWith(utterance.lang)) ||
        maleCandidates[0] ||
        voices.find((v) => v.lang.startsWith('en'))
    } else {
      // Ada Wong & Hatsune Miku: Strictly select feminine female voices
      const femaleCandidates = voices.filter(
        (v) => !maleNames.some((m) => v.name.toLowerCase().includes(m))
      )
      if (isMiku && (isJapaneseScript || lang === 'ja')) {
        preferredVoice =
          femaleCandidates.find((v) => v.lang.startsWith('ja') || v.name.includes('Nanami') || v.name.includes('Kyoko') || v.name.includes('Ayumi')) ||
          voices.find((v) => v.lang.startsWith('ja'))
      }
      if (!preferredVoice) {
        preferredVoice =
          ((isTamilScript || lang === 'ta') && femaleCandidates.find((v) => v.lang.startsWith('ta'))) ||
          (lang === 'tanglish' && femaleCandidates.find((v) => v.lang === 'en-IN')) ||
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
      }
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    let speechSynthInterval: any = null
    utterance.onstart = () => {
      if (lockId !== undefined && this._speakLockId !== lockId) {
        window.speechSynthesis.cancel()
        return
      }
      if (this.isNeuralPlaying) {
        window.speechSynthesis.cancel()
        return
      }
      store.setSystemState('speaking')
      store.triggerGlitch()
      // Generate synthetic speech frequency pulses for real-time lip-sync & visualizers
      const synthArray = new Uint8Array(32)
      speechSynthInterval = setInterval(() => {
        if (useAppStore.getState().systemState !== 'speaking') {
          clearInterval(speechSynthInterval)
          return
        }
        const t = performance.now() / 1000
        const pulse = Math.max(0, Math.sin(t * 22.0) * Math.sin(t * 10.0))
        const amp = Math.floor(pulse * 190 + Math.random() * 50)
        synthArray.fill(amp)
        useAppStore.getState().setAudioFrequencies(synthArray)
      }, 45)
    }

    utterance.onend = () => {
      if (speechSynthInterval) clearInterval(speechSynthInterval)
      useAppStore.getState().setAudioFrequencies(new Uint8Array(32))
      const isSinging = typeof window !== 'undefined' && Boolean((window as any).__IS_SINGING__)
      if (!isSinging) {
        store.setSystemState('idle')
      }
      if (options.onEnd) options.onEnd()
    }

    utterance.onerror = (e) => {
      if (speechSynthInterval) clearInterval(speechSynthInterval)
      useAppStore.getState().setAudioFrequencies(new Uint8Array(32))
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
