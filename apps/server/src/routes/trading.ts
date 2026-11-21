import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { TradingService } from '../services/tradingService.js'
import { MarketHoursService } from '../services/marketHoursService.js'
import { JarvisTradeService } from '../services/jarvisTradeService.js'
import { MarketDataService } from '../services/marketDataService.js'
import { getStockQuote, getCryptoPrice, generateAlgoSignal } from '../market/marketDataService.js'
import { eventBus } from '../streaming/eventBus.js'
import { TOPICS } from '../streaming/schemas.js'

export const tradingRouter = Router()
const COMPLIANCE_DISCLAIMER = 'Educational purposes only. Not SEBI registered investment advice.'

// Live Signal Gateway (Server-Sent Events streaming with heartbeat and auto-reconnect)
tradingRouter.get('/api/trading/signals/stream', requireAuth, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  // Initial connection handshake specifying client retry delay
  res.write(`retry: 3000\n`)
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)

  // Heartbeat every 15 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
  }, 15000)

  // Stream live signals published by the signal engine
  const unsubscribe = eventBus.subscribe(
    TOPICS.SIGNALS_GENERATED,
    'signal-engine',
    (signal) => {
      res.write(`data: ${JSON.stringify({ type: 'signal', data: signal })}\n\n`)
    }
  )

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

// Real-Time Trading & Stock Quote Endpoint
tradingRouter.get('/api/trading/quote', requireAuth, async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || (req.query.q as string) || 'RELIANCE'
  const quote = await TradingService.fetchQuote(symbol)
  if (!quote) {
    return res.status(404).json({ error: `Could not fetch quote for symbol: ${symbol}` })
  }
  return res.json({ quote })
})

// Real-Time Daily Stock Recommendations & Setups
tradingRouter.get('/api/trading/recommendations', requireAuth, async (_req: Request, res: Response) => {
  const recommendations = await TradingService.getTopRecommendations()
  return res.json({ recommendations, count: recommendations.length, disclaimer: COMPLIANCE_DISCLAIMER })
})

// Real-Time Global Market Operating & Non-Operating Timings Radar
tradingRouter.get('/api/trading/market-hours', requireAuth, (_req: Request, res: Response) => {
  const radar = MarketHoursService.getGlobalMarketHoursRadar()
  return res.json({ radar })
})

// 1. 52-Week High Breakout & Low Rebound Screener
tradingRouter.get('/api/trading/screener/52week', requireAuth, async (req: Request, res: Response) => {
  const type = req.query.type as 'high' | 'low' | 'all' | undefined
  const maxDistancePct = req.query.maxDistancePct ? parseFloat(req.query.maxDistancePct as string) : undefined
  const screener = await JarvisTradeService.screen52Week({ type, maxDistancePct })
  return res.json(screener)
})

// 2. Swing Trading Engine
tradingRouter.get('/api/trading/swing/:symbol', requireAuth, async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol)
  const portfolio = req.query.portfolio ? parseFloat(req.query.portfolio as string) : undefined
  const risk = req.query.risk ? parseFloat(req.query.risk as string) : undefined
  const setup = await JarvisTradeService.analyzeSwingSetup(symbol, portfolio, risk)
  return res.json({ setup, disclaimer: COMPLIANCE_DISCLAIMER })
})

// 3. Long-Term Multi-Factor Score & DCF Sanity Check
tradingRouter.get('/api/trading/longterm/:symbol', requireAuth, async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol)
  const factors = await JarvisTradeService.analyzeLongTermFactors(symbol)
  return res.json({ factors })
})

// 4. Intraday 15m Execution Engine
tradingRouter.get('/api/trading/intraday/:symbol', requireAuth, async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol)
  const direction = req.query.direction as 'LONG' | 'SHORT' | undefined
  const intraday = await JarvisTradeService.analyzeIntradaySetup(symbol, direction)
  return res.json({ intraday, disclaimer: COMPLIANCE_DISCLAIMER })
})

// 5. Institutional IPO Intelligence & GMP Radar
tradingRouter.get('/api/trading/ipo', requireAuth, (_req: Request, res: Response) => {
  const ipos = JarvisTradeService.getIpoAnalysis()
  return res.json(ipos)
})

// 6. Macroeconomic Dashboard
tradingRouter.get('/api/trading/macro', requireAuth, async (_req: Request, res: Response) => {
  const macro = await MarketDataService.getMacroDashboard()
  return res.json(macro)
})

// 7. Multi-Agent Supervisor Consensus & Verdict
tradingRouter.get('/api/trading/verdict/:symbol', requireAuth, async (req: Request, res: Response) => {
  const symbol = String(req.params.symbol)
  const verdict = await JarvisTradeService.getJarvisTradeVerdict(symbol)
  return res.json({ verdict, disclaimer: COMPLIANCE_DISCLAIMER })
})

// 8. Financial News & FinBERT Sentiment Analysis
tradingRouter.get('/api/trading/news/sentiment', requireAuth, (_req: Request, res: Response) => {
  const sentiment = JarvisTradeService.getFinancialNewsSentiment()
  return res.json(sentiment)
})

// 9. Portfolio Risk, Performance & Rebalancing Tracker
tradingRouter.post('/api/trading/portfolio/analyze', requireAuth, (req: Request, res: Response) => {
  const holdings = req.body?.holdings || []
  const report = JarvisTradeService.analyzePortfolio(holdings)
  return res.json({ report })
})

// Quantitative Algotrading & Market Data
tradingRouter.get('/api/market/quote/:symbol', requireAuth, async (req: Request, res: Response) => {
  const quote = await getStockQuote(String(req.params.symbol))
  return res.json({ quote })
})

tradingRouter.get('/api/market/crypto/:coinId', requireAuth, async (req: Request, res: Response) => {
  const quote = await getCryptoPrice(String(req.params.coinId))
  return res.json({ quote })
})

tradingRouter.get('/api/market/algo/:symbol', requireAuth, async (req: Request, res: Response) => {
  const signal = await generateAlgoSignal(String(req.params.symbol))
  return res.json({ signal })
})

tradingRouter.get('/api/market/radar', requireAuth, async (_req: Request, res: Response) => {
  const [btc, eth, sol, nvda, aapl, nifty] = await Promise.all([
    getCryptoPrice('bitcoin'),
    getCryptoPrice('ethereum'),
    getCryptoPrice('solana'),
    getStockQuote('NVDA'),
    getStockQuote('AAPL'),
    getStockQuote('^NSEI'),
  ])
  return res.json({
    radar: {
      crypto: [btc, eth, sol],
      stocks: [nvda, aapl],
      indices: [nifty],
      updatedAt: new Date().toISOString(),
    },
  })
})
