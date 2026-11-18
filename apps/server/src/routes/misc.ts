import { Router, type Response } from 'express'
import { MODEL_REGISTRY, PolicyEngine, MemeService } from '@ada/shared'
import { db } from '../db/index.js'
import { ProviderRegistry } from '../providers/index.js'
import { requireAuth, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.js'
import { checkUserQuota } from '../middleware/quota.js'
import { WebSearchService } from '../services/webSearchService.js'
import { buildRagContext } from '../rag/ragService.js'
import { searchRealSongTrack } from '../services/musicSearchService.js'

export const miscRouter = Router()

// Internet Status
miscRouter.get('/internet/status', async (_req, res: Response) => {
  const status = await WebSearchService.checkConnectivity()
  res.json(status)
})

// Visual Memes Catalog
miscRouter.get('/memes', async (req, res: Response) => {
  const topic = req.query.topic as string | undefined
  const mood = req.query.mood as string | undefined
  if (topic || mood) {
    const memeProvider = ProviderRegistry.getMeme()
    const meme = await memeProvider.findMeme(topic || 'developer', mood)
    return res.json({ meme })
  }
  res.json({
    memes: MemeService.getAllMemes(),
  })
})

// Generate Meme
miscRouter.post('/memes/generate', requireAuth, async (req, res: Response) => {
  const { templateId = 'standard', topText = '', bottomText = '' } = req.body
  const memeProvider = ProviderRegistry.getMeme()
  const meme = await memeProvider.generateMeme(templateId, topText, bottomText)
  res.json({ meme })
})

// Real-Time Music & Audio Search
miscRouter.get('/music/search', async (req, res: Response) => {
  const q = (req.query.q as string) || 'dance'
  const track = await searchRealSongTrack(q)
  if (track) {
    return res.json({ success: true, track })
  }
  return res.json({ success: false, track: null })
})

// Morning Briefing
miscRouter.get('/briefing', requireAuth, (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const settings = db.getUserSettings(authReq.userId)
  const notes = db.getNotes(authReq.userId)
  const pendingTodos = notes.filter((n) => !n.completed)

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  res.json({
    briefing: {
      greeting: `Good morning, ${settings.userName}. Ada holo-systems synchronized.`,
      dateStr,
      weatherSummary: 'Optimal operational conditions. Clear skies ahead.',
      pendingTasksCount: pendingTodos.length,
      focusRecommendation: pendingTodos.length > 0 ? `Priority: ${pendingTodos[0].title}` : 'Ready for target planning.',
      motivationalQuote: '“Precision in execution creates effortless outcomes.”',
    },
  })
})

// 3D Model Status
miscRouter.get('/3d/status', (_req, res: Response) => {
  res.json({
    activeModel: 'ada.vrm',
    supportedPipelines: [
      {
        id: 'vroid',
        name: 'VRoid Studio VRM 1.0 (Recommended)',
        type: 'local_file',
        description: 'Drop .vrm into public/models/ada.vrm for 100% rigged humanoid with MToon textures & high heels.',
        cost: 'Free',
        status: 'ready',
      },
      {
        id: 'triposr',
        name: 'Hugging Face TripoSR (stabilityai/TripoSR)',
        type: 'image_to_3d',
        description: 'Single-image fast 3D mesh reconstruction via Hugging Face inference.',
        cost: 'Free HF Token',
        configured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
      },
      {
        id: 'hunyuan3d',
        name: 'Tencent Hunyuan3D-1 / InstantMesh',
        type: 'text_to_3d',
        description: 'Multi-view 3D synthesis via Hugging Face Spaces.',
        cost: 'Free HF Token',
        configured: Boolean(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
      },
      {
        id: 'tripo3d',
        name: 'Tripo3D API',
        type: 'text_to_3d_rigged',
        description: 'Direct auto-rigged game-ready humanoid generation.',
        cost: 'Tripo API Key',
        configured: Boolean(process.env.TRIPO_API_KEY),
      },
    ],
  })
})

// 3D Model Generation
miscRouter.post('/3d/generate', requireAuth, checkUserQuota('3d'), async (req, res: Response) => {
  const { prompt, imageUrl, pipeline = 'triposr' } = req.body

  if (!prompt && !imageUrl) {
    return res.status(400).json({ error: 'Either prompt or imageUrl is required for 3D generation' })
  }

  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY
  if (!hfToken && pipeline !== 'vroid') {
    return res.status(401).json({
      error: 'Hugging Face Token (HF_TOKEN) is required for 3D AI generation.',
      hint: 'Get your free token at https://huggingface.co/settings/tokens and add HF_TOKEN to your .env file.',
    })
  }

  res.json({
    status: 'queued',
    pipeline,
    prompt: prompt || 'Ada Wong spy outfit, red dress, black bob hair, high heels',
    message: `3D Generation requested via ${pipeline}. Processed with HF_TOKEN.`,
  })
})

// Provider Status
miscRouter.get('/providers/status', (_req, res: Response) => {
  res.json(ProviderRegistry.getStatus())
})

// Model Registry Config & Licensing
miscRouter.get('/models/config', (_req, res: Response) => {
  res.json({ registry: MODEL_REGISTRY })
})

// Private Mode Toggle (Admin Only)
miscRouter.post('/providers/private-mode', requireAuth, requireAdmin, (req, res: Response) => {
  const { enabled } = req.body
  const router = ProviderRegistry.getRouter()
  router.setPrivateMode(Boolean(enabled))
  res.json({ success: true, privateMode: router.getPrivateMode() })
})

// Router Usage & Cost/Token Stats (Admin Only)
miscRouter.get('/providers/router-stats', requireAuth, requireAdmin, (_req, res: Response) => {
  res.json(ProviderRegistry.getRouter().getStats())
})

// Policy Engine Check
miscRouter.post('/permissions/policy/check', requireAuth, (req, res: Response) => {
  const { integrationId, actionType, payloadDescription, sourceChannel } = req.body
  const decision = PolicyEngine.evaluateAction(integrationId, actionType, payloadDescription, sourceChannel)
  res.json({ decision })
})

// Master Killswitch: Pause All Integrations (Admin Only)
miscRouter.post('/permissions/pause-all', requireAuth, requireAdmin, (req, res: Response) => {
  const { paused } = req.body
  PolicyEngine.setAllPaused(Boolean(paused))
  res.json({ allPaused: PolicyEngine.isAllPaused() })
})

// Permissions Audit Log (Admin Only)
miscRouter.get('/permissions/audit', requireAuth, requireAdmin, (_req, res: Response) => {
  res.json({ auditLog: PolicyEngine.getAuditLog() })
})

// RAG Vector Database Query Endpoint
miscRouter.get('/rag/query', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const query = (req.query.q as string) || ''
  const character = (req.query.character as string) || 'ada'
  const result = await buildRagContext(query, character, 5, authReq.userId)
  res.json(result)
})
