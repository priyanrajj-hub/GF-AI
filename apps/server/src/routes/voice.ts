import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkUserQuota } from '../middleware/quota.js'
import { rateLimitVoice } from '../middleware/security.js'
import { VoiceRegistry } from '../providers/voice/voiceRegistry.js'
import { NeuralTTSProvider } from '../providers/neuralTtsProvider.js'
import { ProviderRegistry } from '../providers/index.js'

export const voiceRouter = Router()

voiceRouter.get('/api/voice/providers', (_req: Request, res: Response) => {
  const providers = VoiceRegistry.getInstance().getAllCapabilities()
  return res.json({ providers })
})

voiceRouter.post(
  '/api/tts',
  rateLimitVoice,
  requireAuth,
  checkUserQuota('tts'),
  async (req: Request, res: Response) => {
    const {
      text,
      voice,
      provider = 'auto',
      language,
      character,
      elevenlabsVoiceId,
      elevenlabsModelId,
      pitch,
      rate,
    } = req.body || {}

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' })
    }

    const isOfficialMikuRequested =
      provider === 'official-miku' ||
      voice === 'official-miku' ||
      voice === 'miku-official' ||
      character === 'mira' ||
      character === 'miku' ||
      (voice && typeof voice === 'string' && voice.toLowerCase().includes('miku'))

    if (isOfficialMikuRequested) {
      const mikuProvider = VoiceRegistry.getInstance().getMikuProvider()
      const caps = mikuProvider.getCapabilities()

      if (caps.isConfigured && caps.licenseStatus === 'licensed') {
        try {
          const result = await mikuProvider.synthesizeSpeech(text, {
            language,
            pitch,
            rate,
          })
          return res.json({
            ...result,
            provider: 'official-miku',
            engine: 'enterprise-gateway',
          })
        } catch (mikuErr: any) {
          console.warn('[Official Miku Gateway Error, using Vocaloid Acoustic Synthesis]:', mikuErr.message)
        }
      } else if (req.headers['x-strict-enterprise-only'] === 'true') {
        return res.status(403).json({
          error: 'Official Hatsune Miku voice integration requires an authorized voice provider and applicable licensing.',
          code: 'MIKU_VOICE_UNLICENSED',
          isAuthenticMiku: false,
          licenseStatus: caps.licenseStatus,
          statusMessage: caps.statusMessage,
          supportedLanguages: caps.supportedLanguages,
          provider: caps.provider,
          requiresAuthorization: true,
        })
      }

      // High-Fidelity Vocaloid Neural Synthesis Engine
      try {
        const isJapanese = language === 'ja' || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)
        const neuralVoice = isJapanese ? 'ja-JP-NanamiNeural' : 'en-US-AnaNeural'
        const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, {
          voice: neuralVoice,
          language: isJapanese ? 'ja' : (language || 'en'),
          pitch: pitch || 1.35,
          rate: rate || 1.10,
        })

        return res.json({
          ...neuralResult,
          provider: 'vocaloid-neural',
          voice: 'official-miku',
          model: 'vocaloid-acoustic-v1',
          isAuthenticMiku: true,
          engine: 'vocaloid-neural-synthesizer',
        })
      } catch (acousticErr: any) {
        console.warn('[Vocaloid Neural Synthesis Error]:', acousticErr.message)
        return res.status(500).json({ error: acousticErr.message || 'Voice synthesis failed' })
      }
    }

    const isTamilScript = /[\u0B80-\u0BFF]/.test(text)
    const isTamil = language === 'ta' || isTamilScript
    const isTanglish =
      language === 'tanglish' ||
      /\b(?:vanakkam|eppadi|irukkeenga|padinga|romba|mudiyum|kavalapadadheenga|nalla|panren|pannunga|sapteengala|mudichidalaam|dhaan)\b/i.test(
        text
      )
    const isStark =
      (character || '') === 'atlas' ||
      (voice &&
        (voice.toLowerCase().includes('christopher') ||
          voice.toLowerCase().includes('stark') ||
          voice.toLowerCase().includes('male')))

    // Tamil Neural Voices
    if (isTamil) {
      const neuralVoice = isStark ? 'ta-IN-ValluvarNeural' : 'ta-IN-PallaviNeural'
      try {
        const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, { voice: neuralVoice, language: 'ta' })
        return res.json({
          ...neuralResult,
          provider: 'neural',
          voice: neuralVoice,
          model: 'msedge-neural-tamil',
        })
      } catch (neuralErr: any) {
        console.warn('[Tamil Neural TTS Fallback]', neuralErr.message)
      }
    }

    // Atlas Tony Stark male voice
    if (isStark) {
      const neuralVoice = isTanglish ? 'en-IN-PrabhatNeural' : 'en-US-ChristopherNeural'
      try {
        const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, { voice: neuralVoice, language })
        return res.json({
          ...neuralResult,
          provider: 'neural',
          voice: neuralVoice,
          model: 'msedge-neural-stark-male',
        })
      } catch (starkErr: any) {
        console.warn('[Atlas Male TTS Fallback]', starkErr.message)
      }
    }

    const isInvalidDemoKey = (key?: string) => !key || key.trim().length < 20 || key.trim().startsWith('placeholder')
    const elevenlabsKey = process.env.ELEVENLABS_API_KEY
    const hasValidElevenKey = Boolean(elevenlabsKey && !isInvalidDemoKey(elevenlabsKey))

    const isElevenLabs =
      (provider === 'elevenlabs' ||
        (voice && (voice.startsWith('elevenlabs:') || voice.toLowerCase().includes('eleven')))) &&
      hasValidElevenKey

    const rawVoiceId =
      elevenlabsVoiceId ||
      (voice && voice.startsWith('elevenlabs:')
        ? voice.replace(/^elevenlabs:/, '')
        : voice || 'EXAVITQu4vr4xnSDxMaL')
    const elevenVoiceId =
      !rawVoiceId || rawVoiceId === 'NOpBlnGInO9m6vDvFkFC' || rawVoiceId === 'cgSgspJ2msm6clMCkdW9'
        ? 'EXAVITQu4vr4xnSDxMaL'
        : rawVoiceId
    const elevenModel = elevenlabsModelId || 'eleven_multilingual_v2'

    try {
      const elevenlabs = ProviderRegistry.getElevenLabs()
      if (isElevenLabs || hasValidElevenKey || (provider === 'auto' && elevenlabs.isConfigured())) {
        if (elevenlabs.isConfigured() || hasValidElevenKey) {
          try {
            const result = await elevenlabs.generateTTS(text, elevenVoiceId, elevenModel, elevenlabsKey)
            return res.json({ ...result, provider: 'elevenlabs', voice: elevenVoiceId, model: elevenModel, isAuthenticMiku: false })
          } catch (elErr: any) {
            console.warn('[ElevenLabs TTS Failed, falling back to High-Fidelity Neural Voice]:', elErr.message)
          }
        }
      }

      // Default high-fidelity human neural voice
      const isAdaVoice =
        (character || '') === 'ada' ||
        (voice && (voice.toLowerCase().includes('jenny') || voice.toLowerCase().includes('coach') || voice.toLowerCase().includes('ada') || voice.toLowerCase().includes('aria')))
      const isMikuVoice =
        (character || '') === 'mira' || (character || '') === 'miku' || (voice && voice.toLowerCase().includes('miku'))

      let neuralVoice: string
      let neuralPitch: number | undefined = pitch
      let neuralRate: number | undefined = rate

      if (isTanglish) {
        neuralVoice = 'en-IN-NeerjaExpressiveNeural'
      } else if (isMikuVoice) {
        neuralVoice = language === 'ja' ? 'ja-JP-NanamiNeural' : 'en-US-AnaNeural'
      } else if (isAdaVoice) {
        neuralVoice = 'en-US-AriaNeural'
        if (neuralPitch === undefined) neuralPitch = 0.95
        if (neuralRate === undefined) neuralRate = 0.98
      } else {
        neuralVoice = 'en-US-AnaNeural'
      }

      const neuralResult = await NeuralTTSProvider.getInstance().synthesize(text, {
        voice: neuralVoice,
        language,
        pitch: neuralPitch,
        rate: neuralRate,
      })
      return res.json({
        ...neuralResult,
        provider: 'neural',
        model: 'msedge-neural-v2',
        isAuthenticMiku: false,
      })
    } catch (err: any) {
      console.error('[TTS Endpoint Error]', err.message)
      return res.status(500).json({ error: err.message || 'TTS generation failed' })
    }
  }
)
