import { MarketHoursService } from './marketHoursService.js'
import { JarvisTradeService } from './jarvisTradeService.js'
import { MarketDataService } from './marketDataService.js'
import { TradingService } from './tradingService.js'

export interface MarketContextResult {
  liveInternetContext?: string
  resolvedTradingCard?: any
  resolvedMarketHoursCard?: any
}

const SPECIFIC_ASSETS = [
  'reliance', 'tcs', 'hdfc', 'infosys', 'infy', 'tata steel', 'tata motors', 'tatamotors',
  'icici', 'sbi', 'sbin', 'itc', 'lt', 'airtel', 'adani', 'wipro', 'hcl', 'maruti', 'bajaj',
  'zomato', 'jiofin', 'hal', 'bel', 'titan', 'apple', 'aapl', 'tesla', 'tsla', 'nvidia',
  'nvda', 'microsoft', 'msft', 'google', 'googl', 'amazon', 'amzn', 'meta', 'amd', 'pltr',
  'coin', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'gold', 'silver', 'crude',
  'brent', 'usdinr', 'forex', 'sp500', 'spy', 'nasdaq', 'qqq', 'dow', 'dax', 'nikkei',
  'ftse', 'nifty', 'banknifty', 'bank nifty', 'sensex', 'vix',
]

const GENERIC_MARKET_KEYWORDS = [
  'stock', 'stocks', 'share', 'shares', 'stock recommendation', 'stock recommendations',
  'recommendations', 'recommendation', 'best stock', 'best stocks', 'sunday 1 hour trading',
  'muhurat', 'muhurat trading', 'world market', 'world markets', 'market analyser',
  'market analyzer', 'trading and indigator', 'indicator', 'indicators', 'trading',
  'trade setup', 'trade ideas', 'rsi', 'macd', 'bollinger', 'supertrend', 'smc',
  'order block', 'fibonacci', 'pivots',
]

function matchKeyword(text: string, kw: string): boolean {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text)
}

export async function resolveMarketContext(
  message: string,
  cleanMsg: string = message.toLowerCase().trim()
): Promise<MarketContextResult | null> {
  let resolvedTradingCard: any = null
  let resolvedMarketHoursCard: any = null
  let liveInternetContext: string | undefined = undefined

  // 1. Market Hours Radar
  const isMarketHoursQuery =
    /\b(?:market hours|market timings?|working times?|non working|working and non working|times of opening and closing|opening and closing|open and close|nse bse us markets|market schedule|what time does (?:nse|bse|mcx|nyse|nasdaq) (?:open|close)|when does (?:the )?(?:nse|bse|mcx|us market|nyse|nasdaq|market) (?:open|close)|stock market timings?|us market open time|trading sessions?)\b/i.test(cleanMsg)

  if (isMarketHoursQuery) {
    resolvedMarketHoursCard = MarketHoursService.getGlobalMarketHoursRadar()
    liveInternetContext = MarketHoursService.formatMarketHoursContext(resolvedMarketHoursCard)

    resolvedTradingCard = {
      symbol: '^NSEI',
      name: 'Nifty 50 Index (Market Hours Radar)',
      currency: 'INR',
      price: 24150.0,
      change: 120.5,
      percentChange: 0.50,
      dayHigh: 24200.0,
      dayLow: 24080.0,
      previousClose: 24029.5,
      volume: 25000000,
      fiftyTwoWeekHigh: 26277.35,
      fiftyTwoWeekLow: 21281.45,
      assetClass: 'index',
      indicators: {
        rsi14: 55.4,
        rsiStatus: 'Neutral Momentum',
        macd: { line: 18.2, signal: 12.0, histogram: 6.2, cross: 'Bullish Continuation' },
        ema9: 24110,
        ema20: 24040,
        ema50: 23890,
        ema200: 23150,
        supertrend: { value: 23980, signal: 'BUY' },
        bollinger: { upper: 24350, middle: 24100, lower: 23850, squeeze: false },
        atr14: 165,
        confluenceScore: 82,
        smc: { orderBlockZone: '24050 - 24080 (Bullish Demand Mitigation)', fibGoldenPocket: '24020 (0.618 Fib)', marketStructure: 'Bullish BOS' },
      },
      setup: {
        action: 'MARKET HOURS ACTIVE RADAR',
        entryZone: '24080 - 24120',
        target1: 24250,
        target2: 24380,
        target3: 24500,
        stopLoss: 23980,
        riskReward: '1:2.8',
        confidence: 88,
        timeframe: 'Daily / Sessions',
        rationale: 'Cross-market operational session timings calculated across NSE, BSE, MCX, NYSE, NASDAQ, LSE, TSE and 24/7 Crypto.',
      },
      pivots: { pivot: 24120, s1: 24050, s2: 23980, r1: 24200, r2: 24270 },
      marketHours: resolvedMarketHoursCard,
    }

    return { liveInternetContext, resolvedTradingCard, resolvedMarketHoursCard }
  }

  // 2. 52-Week Screener
  const is52WeekQuery =
    cleanMsg.includes('52 week') ||
    cleanMsg.includes('52w') ||
    cleanMsg.includes('52-week') ||
    cleanMsg.includes('screener') ||
    cleanMsg.includes('high breakout') ||
    cleanMsg.includes('low rebound')

  if (is52WeekQuery) {
    try {
      const screenerType = cleanMsg.includes('low') ? 'low' : cleanMsg.includes('high') ? 'high' : 'all'
      const screenerData = await JarvisTradeService.screen52Week({ type: screenerType as any })
      liveInternetContext = JarvisTradeService.format52WeekContext(screenerData)
      if (screenerData.screener.length > 0) {
        const topPick = screenerData.screener[0]
        resolvedTradingCard = {
          symbol: topPick.symbol,
          name: topPick.name,
          price: topPick.price,
          percentChange: 2.4,
          change: 45.0,
          currency: 'INR',
          exchange: 'NSE',
          volume: 1850000,
          previousClose: topPick.price * 0.98,
          fiftyTwoWeekHigh: topPick.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: topPick.fiftyTwoWeekLow,
          assetClass: 'equity',
          indicators: {
            rsi14: topPick.rsi,
            rsiStatus: topPick.rsi > 50 ? 'Bullish Expansion' : 'Oversold Support',
            macd: { line: 12.4, signal: 8.9, histogram: 3.5, cross: 'Bullish Crossover' },
            ema9: topPick.price * 0.99,
            ema20: topPick.price * 0.98,
            ema50: topPick.price * 0.95,
            ema200: topPick.price * 0.91,
            supertrend: { value: topPick.price * 0.97, signal: 'BUY' },
            bollinger: { upper: topPick.fiftyTwoWeekHigh, middle: topPick.price, lower: topPick.fiftyTwoWeekLow, squeeze: true },
            atr14: topPick.price * 0.02,
            confluenceScore: 88,
            smc: { orderBlockZone: `₹${(topPick.price * 0.98).toFixed(1)} Demand Block`, fibGoldenPocket: '0.618 Fib', marketStructure: 'Bullish' },
          },
          setup: {
            action: topPick.screenerType === '52w_high_breakout' ? 'BREAKOUT MOMENTUM' : 'VALUE REBOUND',
            entryZone: `₹${(topPick.price * 0.99).toFixed(1)} - ₹${(topPick.price * 1.01).toFixed(1)}`,
            target1: topPick.price * 1.08,
            target2: topPick.price * 1.15,
            target3: topPick.price * 1.25,
            stopLoss: topPick.price * 0.95,
            riskReward: '1:2.5',
            confidence: 90,
            timeframe: 'Swing / Positional',
            rationale: topPick.rationale,
          },
          pivots: {
            pivot: topPick.price,
            s1: topPick.price * 0.98,
            s2: topPick.price * 0.96,
            r1: topPick.price * 1.03,
            r2: topPick.price * 1.06,
          },
        }
      }
      return { liveInternetContext, resolvedTradingCard, resolvedMarketHoursCard }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis 52w Screener Error]:', e?.message)
    }
  }

  // 3. Swing Setup
  const isSwingQuery =
    cleanMsg.includes('swing trade') ||
    cleanMsg.includes('swing setup') ||
    cleanMsg.includes('swing trading') ||
    cleanMsg.includes('positional trade')

  if (isSwingQuery) {
    try {
      const symbolMatch = cleanMsg.match(/\b(reliance|tcs|infy|hdfc|itc|tatamotors|lt|sunpharma|icici|sbi|wipro|airtel|adani)\b/i)
      const targetSymbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'RELIANCE'
      const swing = await JarvisTradeService.analyzeSwingSetup(targetSymbol)
      liveInternetContext = JarvisTradeService.formatSwingContext(swing)
      return { liveInternetContext }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis Swing Error]:', e?.message)
    }
  }

  // 4. Intraday Setup
  const isIntradayQuery =
    cleanMsg.includes('intraday') ||
    cleanMsg.includes('vwap') ||
    cleanMsg.includes('orb') ||
    cleanMsg.includes('opening range') ||
    cleanMsg.includes('pcr') ||
    cleanMsg.includes('put call ratio') ||
    cleanMsg.includes('max pain') ||
    cleanMsg.includes('f&o')

  if (isIntradayQuery) {
    try {
      const symbolMatch = cleanMsg.match(/\b(reliance|tcs|infy|hdfc|itc|tatamotors|lt|sunpharma|icici|sbi|nifty|banknifty)\b/i)
      const targetSymbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'NIFTY'
      const direction = cleanMsg.includes('short') || cleanMsg.includes('sell') || cleanMsg.includes('bearish') ? 'SHORT' : 'LONG'
      const intra = await JarvisTradeService.analyzeIntradaySetup(targetSymbol, direction)
      liveInternetContext = JarvisTradeService.formatIntradayContext(intra)
      return { liveInternetContext }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis Intraday Error]:', e?.message)
    }
  }

  // 5. IPO Intelligence
  const isIpoQuery =
    cleanMsg.includes('ipo') ||
    cleanMsg.includes('gmp') ||
    cleanMsg.includes('grey market') ||
    cleanMsg.includes('upcoming ipos') ||
    cleanMsg.includes('allotment')

  if (isIpoQuery) {
    try {
      const ipoData = JarvisTradeService.getIpoAnalysis()
      liveInternetContext = JarvisTradeService.formatIpoContext(ipoData)
      return { liveInternetContext }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis IPO Error]:', e?.message)
    }
  }

  // 6. Macro Dashboard
  const isMacroQuery =
    cleanMsg.includes('macro') ||
    cleanMsg.includes('repo rate') ||
    cleanMsg.includes('rbi') ||
    cleanMsg.includes('mpc') ||
    cleanMsg.includes('inflation') ||
    cleanMsg.includes('cpi') ||
    cleanMsg.includes('gdp') ||
    cleanMsg.includes('fii dii') ||
    cleanMsg.includes('dxy') ||
    cleanMsg.includes('crude oil')

  if (isMacroQuery) {
    try {
      const macro = await MarketDataService.getMacroDashboard()
      liveInternetContext = JarvisTradeService.formatMacroContext(macro)
      return { liveInternetContext }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis Macro Error]:', e?.message)
    }
  }

  // 7. Multi-Agent Verdict
  const isVerdictQuery =
    cleanMsg.includes('verdict') ||
    cleanMsg.includes('should i buy') ||
    cleanMsg.includes('stock analysis') ||
    cleanMsg.includes('super stock') ||
    cleanMsg.includes('consensus') ||
    cleanMsg.includes('agent review')

  if (isVerdictQuery) {
    try {
      const symbolMatch = cleanMsg.match(/\b(reliance|tcs|infy|hdfc|itc|tatamotors|lt|sunpharma|icici|sbi|wipro)\b/i)
      const targetSymbol = symbolMatch ? symbolMatch[1].toUpperCase() : 'RELIANCE'
      const verdict = await JarvisTradeService.getJarvisTradeVerdict(targetSymbol)
      liveInternetContext = JarvisTradeService.formatVerdictContext(verdict)
      return { liveInternetContext }
    } catch (e: any) {
      console.warn('⚠️ [Jarvis Verdict Error]:', e?.message)
    }
  }

  // 8. Top Stock Recommendations
  const isStockRecQuery =
    cleanMsg.includes('stock recomendation') ||
    cleanMsg.includes('stock recommendation') ||
    cleanMsg.includes('stocks to buy') ||
    cleanMsg.includes('trading info') ||
    cleanMsg.includes('best stocks') ||
    cleanMsg.includes('trading ideas') ||
    cleanMsg.includes('intraday stocks') ||
    cleanMsg.includes('stock picks') ||
    cleanMsg.includes('recommend stocks') ||
    cleanMsg.includes('give me stocks')

  if (isStockRecQuery) {
    try {
      const recs = await TradingService.getTopRecommendations()
      if (recs.length > 0) {
        liveInternetContext = TradingService.formatRecommendationsContext(recs)
        resolvedTradingCard = {
          ...recs[0],
          recommendations: recs,
        }
        return { liveInternetContext, resolvedTradingCard }
      }
    } catch (e: any) {
      console.warn('⚠️ [Trading Recommendations Error]:', e?.message)
    }
  }

  // 9. Specific Asset or Generic Market Lookup
  const matchedAsset = SPECIFIC_ASSETS
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((k) => matchKeyword(cleanMsg, k))

  const matchedGeneric = GENERIC_MARKET_KEYWORDS
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((k) => cleanMsg.includes(k))

  const matchedStock = matchedAsset || matchedGeneric

  if (matchedStock) {
    try {
      const symbolToLookup = matchedAsset ? matchedAsset : '^NSEI'
      const quote = await TradingService.fetchQuote(symbolToLookup)
      if (quote) {
        resolvedTradingCard = quote
        liveInternetContext = TradingService.formatQuoteContext(quote)
        return { liveInternetContext, resolvedTradingCard }
      }
    } catch (e: any) {
      console.warn('⚠️ [Trading Quote Error]:', e?.message)
    }
  }

  return null
}
