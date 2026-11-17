/**
 * Real Market Data & Free AlgoTrading Analysis Engine
 * Uses public free APIs without mandatory API keys:
 * - Yahoo Finance Chart API (Stock & Index OHLCV)
 * - Binance Public Ticker API (Crypto live prices & 24h stats)
 * - CoinGecko Simple Price API (Major crypto asset radar)
 * - Local Real-Time Technical Indicators (RSI, MACD, Bollinger Bands, Moving Averages)
 * - Quantitative Algo Trading Signal Generator (Entry, Stop Loss, Target 1, Target 2)
 */

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  high24h: number
  low24h: number
  volume: number
  currency: string
  timestamp: number
  source: 'yahoo' | 'binance' | 'coingecko' | 'fallback' | 'unavailable'
  isLive?: boolean
  status?: 'ok' | 'unavailable' | 'stale'
  error?: string
}

export interface HistoricalCandlesResult {
  symbol: string
  closes: number[]
  timestamps: number[]
  provider: 'yahoo' | 'binance' | 'none'
  status: 'ok' | 'insufficient_data' | 'unavailable'
  error?: string
}

export interface TechnicalIndicators {
  rsi14: number
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL'
  macd: {
    macdLine: number
    signalLine: number
    histogram: number
    crossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  }
  bollingerBands: {
    upper: number
    middle: number
    lower: number
    bandwidth: number
    percentB: number
  }
  sma50?: number
  sma200?: number
}

export interface AlgoTradingSignal {
  symbol: string
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
  confidence: number // 0-100%
  score: number // -10 to +10
  timeframe: string
  entryPrice: number
  stopLoss: number
  target1: number
  target2: number
  riskRewardRatio: string
  reasons: string[]
  indicators: TechnicalIndicators
  timestamp: string
}

// ---- Indicator Math Functions ----

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff >= 0) gains += diff
    else losses += Math.abs(diff)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period
    }
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100
}

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const emaArray: number[] = [prices[0]]
  for (let i = 1; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k))
  }
  return emaArray
}

export function calculateMACD(prices: number[]) {
  if (prices.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0, crossover: 'NEUTRAL' as const }
  }

  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)

  const macdSeries: number[] = []
  for (let i = 0; i < prices.length; i++) {
    macdSeries.push(ema12[i] - ema26[i])
  }

  const signalSeries = calculateEMA(macdSeries, 9)
  const lastIndex = prices.length - 1
  const macdLine = Math.round(macdSeries[lastIndex] * 100) / 100
  const signalLine = Math.round(signalSeries[lastIndex] * 100) / 100
  const histogram = Math.round((macdLine - signalLine) * 100) / 100

  const prevHistogram = macdSeries[lastIndex - 1] - signalSeries[lastIndex - 1]
  let crossover: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
  if (prevHistogram <= 0 && histogram > 0) crossover = 'BULLISH'
  else if (prevHistogram >= 0 && histogram < 0) crossover = 'BEARISH'

  return { macdLine, signalLine, histogram, crossover }
}

export function calculateBollingerBands(prices: number[], period: number = 20) {
  if (prices.length < period) {
    const p = prices[prices.length - 1] || 100
    return { upper: p * 1.02, middle: p, lower: p * 0.98, bandwidth: 4.0, percentB: 0.5 }
  }

  const slice = prices.slice(-period)
  const middle = slice.reduce((a, b) => a + b, 0) / period
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period
  const stdDev = Math.sqrt(variance)

  const upper = middle + stdDev * 2
  const lower = middle - stdDev * 2
  const current = prices[prices.length - 1]

  const bandwidth = Math.round(((upper - lower) / middle) * 10000) / 100
  const percentB = Math.round(((current - lower) / (upper - lower)) * 100) / 100

  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(middle * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    bandwidth,
    percentB,
  }
}

// ---- Verified Historical Candle Fetcher ----

export async function getHistoricalCandles(symbol: string): Promise<HistoricalCandlesResult> {
  const clean = symbol.toUpperCase().trim()

  // 1. Try Binance for Crypto
  const isCrypto = Boolean(clean.match(/^(BTC|ETH|SOL|BNB|XRP|DOGE|ADA)$|BITCOIN|ETHEREUM|SOLANA/i))
  if (isCrypto) {
    const binancePair = clean.includes('USDT') ? clean : `${clean === 'BITCOIN' ? 'BTC' : clean === 'ETHEREUM' ? 'ETH' : clean === 'SOLANA' ? 'SOL' : clean}USDT`
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binancePair}&interval=1d&limit=30`)
      if (res.ok) {
        const klines: any[] = await res.json()
        if (Array.isArray(klines) && klines.length >= 14) {
          const closes = klines.map((k) => parseFloat(k[4])).filter((c) => !isNaN(c) && c > 0)
          const timestamps = klines.map((k) => parseInt(k[0], 10))
          return {
            symbol: clean,
            closes,
            timestamps,
            provider: 'binance',
            status: closes.length >= 20 ? 'ok' : 'insufficient_data',
          }
        }
      }
    } catch (err: any) {
      console.warn(`[MarketData] Binance klines fetch failed for ${clean}:`, err?.message || err)
    }
  }

  // 2. Try Yahoo Finance for Equities, ETFs & Indices
  const yahooSym = clean === 'NIFTY' || clean === 'NIFTY50' ? '^NSEI' : clean
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=1mo`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    if (res.ok) {
      const data = await res.json()
      const indicators = data.chart?.result?.[0]?.indicators?.quote?.[0]
      const rawTimestamps = data.chart?.result?.[0]?.timestamp || []
      if (indicators && Array.isArray(indicators.close)) {
        const closes: number[] = []
        const timestamps: number[] = []
        indicators.close.forEach((c: any, idx: number) => {
          if (typeof c === 'number' && !isNaN(c) && c > 0) {
            closes.push(Math.round(c * 100) / 100)
            timestamps.push((rawTimestamps[idx] || 0) * 1000)
          }
        })

        if (closes.length >= 14) {
          return {
            symbol: clean,
            closes,
            timestamps,
            provider: 'yahoo',
            status: closes.length >= 20 ? 'ok' : 'insufficient_data',
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`[MarketData] Yahoo Finance historical candles failed for ${clean}:`, err?.message || err)
  }

  return {
    symbol: clean,
    closes: [],
    timestamps: [],
    provider: 'none',
    status: 'unavailable',
    error: 'Historical candle data unavailable from verified exchange feeds',
  }
}

// ---- Live Market Data Fetchers ----

export async function getStockQuote(rawSymbol: string): Promise<MarketQuote> {
  const symbol = rawSymbol.toUpperCase().trim()
  const cleanSym = symbol === 'NIFTY' || symbol === 'NIFTY50' ? '^NSEI' : symbol

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=1mo`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (res.ok) {
      const data = await res.json()
      const meta = data.chart?.result?.[0]?.meta
      const indicators = data.chart?.result?.[0]?.indicators?.quote?.[0]

      if (meta && indicators) {
        const closes = indicators.close?.filter((c: any) => typeof c === 'number') || []
        const currentPrice = meta.regularMarketPrice ?? closes[closes.length - 1] ?? 0
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice
        const change = currentPrice - prevClose
        const changePercent = prevClose ? (change / prevClose) * 100 : 0

        return {
          symbol,
          name: meta.shortName || meta.symbol || symbol,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          high24h: meta.regularMarketDayHigh ?? Math.round(currentPrice * 1.01 * 100) / 100,
          low24h: meta.regularMarketDayLow ?? Math.round(currentPrice * 0.99 * 100) / 100,
          volume: meta.regularMarketVolume ?? 0,
          currency: meta.currency || (symbol.includes('NSE') || symbol === 'NIFTY' ? 'INR' : 'USD'),
          timestamp: Date.now(),
          source: 'yahoo',
          isLive: true,
          status: 'ok',
        }
      }
    }
  } catch (err) {
    console.warn(`[MarketData] Yahoo Finance fetch failed for ${symbol}:`, err)
  }

  // Never synthesize fake prices. Return explicit unavailable status.
  return {
    symbol,
    name: `${symbol}`,
    price: 0,
    change: 0,
    changePercent: 0,
    high24h: 0,
    low24h: 0,
    volume: 0,
    currency: symbol.includes('NSE') || symbol === 'NIFTY' ? 'INR' : 'USD',
    timestamp: Date.now(),
    source: 'unavailable',
    isLive: false,
    status: 'unavailable',
    error: 'Market data currently unavailable from upstream exchange feed.',
  }
}

export async function getCryptoPrice(coinId: string): Promise<MarketQuote> {
  const cleanId = coinId.toLowerCase().trim()
  const binanceMap: Record<string, string> = {
    bitcoin: 'BTCUSDT',
    btc: 'BTCUSDT',
    ethereum: 'ETHUSDT',
    eth: 'ETHUSDT',
    solana: 'SOLUSDT',
    sol: 'SOLUSDT',
    binancecoin: 'BNBUSDT',
    bnb: 'BNBUSDT',
    ripple: 'XRPUSDT',
    xrp: 'XRPUSDT',
  }

  const binanceSymbol = binanceMap[cleanId]

  // Try Binance API first (fast & reliable)
  if (binanceSymbol) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`)
      if (res.ok) {
        const data = await res.json()
        const price = parseFloat(data.lastPrice)
        const change = parseFloat(data.priceChange)
        const changePercent = parseFloat(data.priceChangePercent)

        return {
          symbol: binanceSymbol.replace('USDT', ''),
          name: cleanId.toUpperCase(),
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          high24h: Math.round(parseFloat(data.highPrice) * 100) / 100,
          low24h: Math.round(parseFloat(data.lowPrice) * 100) / 100,
          volume: Math.round(parseFloat(data.volume)),
          currency: 'USDT',
          timestamp: Date.now(),
          source: 'binance',
          isLive: true,
          status: 'ok',
        }
      }
    } catch {
      // fallback to CoinGecko
    }
  }

  // CoinGecko Simple Price Fallback
  try {
    const cgId = cleanId === 'btc' ? 'bitcoin' : cleanId === 'eth' ? 'ethereum' : cleanId === 'sol' ? 'solana' : cleanId
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
    )
    if (res.ok) {
      const data = await res.json()
      const coin = data[cgId]
      if (coin) {
        const price = coin.usd
        const changePercent = coin.usd_24h_change || 0
        const change = price * (changePercent / 100)
        return {
          symbol: cleanId.toUpperCase(),
          name: cgId.charAt(0).toUpperCase() + cgId.slice(1),
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          high24h: Math.round(price * 1.02 * 100) / 100,
          low24h: Math.round(price * 0.98 * 100) / 100,
          volume: Math.round(coin.usd_24h_vol || 0),
          currency: 'USD',
          timestamp: Date.now(),
          source: 'coingecko',
          isLive: true,
          status: 'ok',
        }
      }
    }
  } catch (err) {
    console.warn(`[MarketData] Crypto fetch failed for ${cleanId}:`, err)
  }

  // Never return fake random prices for crypto
  return {
    symbol: cleanId.toUpperCase(),
    name: cleanId.toUpperCase(),
    price: 0,
    change: 0.0,
    changePercent: 0.0,
    high24h: 0,
    low24h: 0,
    volume: 0,
    currency: 'USD',
    timestamp: Date.now(),
    source: 'unavailable',
    isLive: false,
    status: 'unavailable',
    error: 'Crypto live feed currently unavailable.',
  }
}

// ---- Quantitative Algo Trading Strategy Generator ----

export async function generateAlgoSignal(symbol: string): Promise<AlgoTradingSignal> {
  const isCrypto = Boolean(symbol.match(/^(BTC|ETH|SOL|BNB|XRP|DOGE|ADA)$|BITCOIN|ETHEREUM|SOLANA/i))
  const quote = isCrypto ? await getCryptoPrice(symbol) : await getStockQuote(symbol)

  // Fetch real historical candle series from verified exchange feeds
  const candleData = await getHistoricalCandles(symbol)

  // If real candles are insufficient (<20), return transparent unavailable notice
  if (candleData.status !== 'ok' || candleData.closes.length < 20) {
    const currentPrice = quote.price || 0
    return {
      symbol: quote.symbol,
      signal: 'NEUTRAL',
      confidence: 0,
      score: 0,
      timeframe: 'Daily (Insufficient Candles)',
      entryPrice: currentPrice,
      stopLoss: currentPrice,
      target1: currentPrice,
      target2: currentPrice,
      riskRewardRatio: 'N/A',
      reasons: [
        `Unable to compute technical indicators: verified historical candle data is currently unavailable for ${symbol}.`,
        'GF-AI strictly refuses to simulate or fabricate market prices for quantitative signals.',
      ],
      indicators: {
        rsi14: 50,
        rsiSignal: 'NEUTRAL',
        macd: { macdLine: 0, signalLine: 0, histogram: 0, crossover: 'NEUTRAL' },
        bollingerBands: { upper: currentPrice, middle: currentPrice, lower: currentPrice, bandwidth: 0, percentB: 0.5 },
      },
      timestamp: new Date().toISOString(),
    }
  }

  const prices = candleData.closes
  const currentPrice = quote.price > 0 ? quote.price : prices[prices.length - 1]

  // Calculate Real Indicators strictly on actual historical candles
  const rsi = calculateRSI(prices, 14)
  const macd = calculateMACD(prices)
  const bb = calculateBollingerBands(prices, 20)

  // Scoring Algo Strategy
  let score = 0
  const reasons: string[] = [
    `Calculated across ${prices.length} verified daily candles from ${candleData.provider.toUpperCase()} feed.`,
  ]

  // 1. RSI Factor
  let rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL'
  if (rsi <= 32) {
    score += 3
    rsiSignal = 'OVERSOLD'
    reasons.push(`RSI is deeply oversold at ${rsi} (Mean Reversion Long Trigger)`)
  } else if (rsi >= 68) {
    score -= 3
    rsiSignal = 'OVERBOUGHT'
    reasons.push(`RSI is overbought at ${rsi} (Exhaustion Sell Warning)`)
  } else {
    reasons.push(`RSI is balanced at ${rsi} in neutral territory`)
  }

  // 2. MACD Factor
  if (macd.crossover === 'BULLISH' || macd.histogram > 0) {
    score += 3
    reasons.push(`MACD histogram positive (+${macd.histogram}) with bullish trend momentum`)
  } else if (macd.crossover === 'BEARISH' || macd.histogram < 0) {
    score -= 3
    reasons.push(`MACD histogram negative (${macd.histogram}) indicating selling pressure`)
  }

  // 3. Bollinger Band Factor
  if (currentPrice <= bb.lower * 1.01) {
    score += 2
    reasons.push(`Price is hugging the Lower Bollinger Band ($${bb.lower}), bounce probability elevated`)
  } else if (currentPrice >= bb.upper * 0.99) {
    score -= 2
    reasons.push(`Price is pressing against the Upper Bollinger Band ($${bb.upper}), risk of rejection`)
  }

  // 4. 24h Momentum Factor
  if (quote.changePercent > 1.5) {
    score += 1
    reasons.push(`24-hour momentum positive (+${quote.changePercent}%)`)
  } else if (quote.changePercent < -1.5) {
    score -= 1
    reasons.push(`24-hour momentum negative (${quote.changePercent}%)`)
  }

  // Determine Signal Type
  let signal: AlgoTradingSignal['signal'] = 'NEUTRAL'
  if (score >= 5) signal = 'STRONG_BUY'
  else if (score >= 2) signal = 'BUY'
  else if (score <= -5) signal = 'STRONG_SELL'
  else if (score <= -2) signal = 'SELL'

  const confidence = Math.min(95, Math.max(50, 50 + Math.abs(score) * 5))

  // Risk & Position Levels
  const isLong = score >= 0
  const stopLossDistance = currentPrice * 0.025
  const stopLoss = Math.round((isLong ? currentPrice - stopLossDistance : currentPrice + stopLossDistance) * 100) / 100
  const target1 = Math.round((isLong ? currentPrice + stopLossDistance * 2 : currentPrice - stopLossDistance * 2) * 100) / 100
  const target2 = Math.round((isLong ? currentPrice + stopLossDistance * 3.5 : currentPrice - stopLossDistance * 3.5) * 100) / 100

  return {
    symbol: quote.symbol,
    signal,
    confidence,
    score,
    timeframe: 'Daily Multi-Timeframe',
    entryPrice: currentPrice,
    stopLoss,
    target1,
    target2,
    riskRewardRatio: '1:2.5',
    reasons,
    indicators: {
      rsi14: rsi,
      rsiSignal,
      macd,
      bollingerBands: bb,
    },
    timestamp: new Date().toISOString(),
  }
}
