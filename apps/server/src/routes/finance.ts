import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { FinanceAnalystService } from '../services/financeAnalystService.js'
import { SipCalculator } from '../services/sipCalculator.js'
import { JarvisTradeService } from '../services/jarvisTradeService.js'

export const financeRouter = Router()

// Real-Time Curated Mutual Funds & Analytics
financeRouter.get('/api/finance/mutual-funds', requireAuth, (req: Request, res: Response) => {
  const category = req.query.category as string | undefined
  const funds = FinanceAnalystService.getMutualFunds(category)
  res.json({ count: funds.length, category: category || 'all', funds })
})

// Systematic Investment Plan (SIP) Compounding Calculator
financeRouter.get('/api/finance/sip-calc', requireAuth, (req: Request, res: Response) => {
  const monthly = parseFloat((req.query.monthly as string) || '5000')
  const rate = parseFloat((req.query.rate as string) || '15')
  const years = parseFloat((req.query.years as string) || '5')
  const calculation = FinanceAnalystService.calculateSIP(monthly, rate, years)
  res.json({ calculation })
})

// Portfolio Hedging & Capital Preservation Strategies
financeRouter.get('/api/finance/hedging', requireAuth, (_req: Request, res: Response) => {
  const strategies = FinanceAnalystService.getHedgingStrategies()
  res.json({ strategies })
})

// Systematic Investment Plan (SIP) Actuarial Compounding Calculator (POST)
financeRouter.post('/api/finance/sip', requireAuth, (req: Request, res: Response) => {
  const result = SipCalculator.calculate(req.body || {})
  res.json({ result })
})

// Investments Advisor & Budget 2024 Tax Blueprint
financeRouter.get('/api/finance/investments', requireAuth, (req: Request, res: Response) => {
  const riskProfile = (req.query.riskProfile as any) || 'moderate'
  const advice = JarvisTradeService.getInvestmentsAdvice(riskProfile)
  res.json({ advice })
})
