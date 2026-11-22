import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { checkUserQuota } from '../middleware/quota.js'
import { WebScraperService } from '../services/webScraperService.js'
import { NewsGathererService } from '../services/newsGathererService.js'
import { WebSearchService } from '../services/webSearchService.js'

export const scraperRouter = Router()

// Universal Website Extractor & Scraper (Protected & SSRF-Hardened)
scraperRouter.post(
  '/api/web/scrape',
  requireAuth,
  checkUserQuota('scrape'),
  async (req: Request, res: Response) => {
    const { url, domainAllowlist } = req.body
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' })
    }
    const page = await WebScraperService.extractPage(url, domainAllowlist)
    if (!page) {
      return res.status(400).json({ error: `Failed to scrape or access blocked by security policies: ${url}` })
    }
    return res.json({ page })
  }
)

// Live News Gatherer across AI, Technology, Education, and Finance (Supports both /api/news and /api/market/news)
const handleNewsRequest = async (req: Request, res: Response) => {
  const category = (req.query.category as any) || 'all'
  const news = await NewsGathererService.getNews(category)
  return res.json({ category, count: news.length, news })
}

scraperRouter.get('/api/news', handleNewsRequest)
scraperRouter.get('/api/market/news', handleNewsRequest)

// Real-Time Web Search Endpoint
scraperRouter.get('/api/search', requireAuth, async (req: Request, res: Response) => {
  const q = (req.query.q as string) || ''
  if (!q.trim()) {
    return res.status(400).json({ error: 'Search query q is required' })
  }
  const results = await WebSearchService.search(q, 5)
  return res.json({ query: q, results })
})
