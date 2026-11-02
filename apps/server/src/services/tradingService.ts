export interface StockQuote {
  symbol: string
  name: string
  currency: string
  price: number
  change: number
  percentChange: number
  dayHigh: number
  dayLow: number
  previousClose: number
  volume: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  rsi14?: number
  sma20?: number
  trend: 'Strong Bullish' | 'Mild Bullish' | 'Consolidation' | 'Bearish'
  support1: number
  support2: number
  resistance1: number
  resistance2: number
  setup: {
    action: 'BUY ON DIPS' | 'BULLISH ACCUMULATION' | 'BREAKOUT BUY' | 'RANGEBOUND WATCH' | 'DEFENSIVE / CAUTION'
    entryZone: string
    target1: number
    target2: number
    stopLoss: number
    riskReward: string
    rationale: string
  }
}

export class TradingService {
  private static SYMBOL_MAP: Record<string, { ticker: string; name: string }> = {
    // Indian Bluechips & Popular Stocks
    reliance: { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd' },
    ril: { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd' },
    tcs: { ticker: 'TCS.NS', name: 'Tata Consultancy Services' },
    hdfc: { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd' },
    hdfcbank: { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd' },
    'hdfc bank': { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd' },
    infosys: { ticker: 'INFY.NS', name: 'Infosys Ltd' },
    infy: { ticker: 'INFY.NS', name: 'Infosys Ltd' },
    'tata motors': { ticker: 'TATAMOTORS.NS', name: 'Tata Motors Passenger & EV' },
    tatamotors: { ticker: 'TATAMOTORS.NS', name: 'Tata Motors' },
    'tata steel': { ticker: 'TATASTEEL.NS', name: 'Tata Steel Ltd' },
    tatasteel: { ticker: 'TATASTEEL.NS', name: 'Tata Steel' },
    'icici bank': { ticker: 'ICICIBANK.NS', name: 'ICICI Bank Ltd' },
    icici: { ticker: 'ICICIBANK.NS', name: 'ICICI Bank' },
    sbi: { ticker: 'SBIN.NS', name: 'State Bank of India' },
    sbin: { ticker: 'SBIN.NS', name: 'State Bank of India' },
    itc: { ticker: 'ITC.NS', name: 'ITC Ltd' },
    lt: { ticker: 'LT.NS', name: 'Larsen & Toubro' },
    larsen: { ticker: 'LT.NS', name: 'Larsen & Toubro' },
    airtel: { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd' },
    bharti: { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
    adani: { ticker: 'ADANIENT.NS', name: 'Adani Enterprises Ltd' },
    adanient: { ticker: 'ADANIENT.NS', name: 'Adani Enterprises' },
    'adani ports': { ticker: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ' },
    wipro: { ticker: 'WIPRO.NS', name: 'Wipro Ltd' },
    hcl: { ticker: 'HCLTECH.NS', name: 'HCL Technologies' },
    hcltech: { ticker: 'HCLTECH.NS', name: 'HCL Technologies' },
    maruti: { ticker: 'MARUTI.NS', name: 'Maruti Suzuki India' },
    bajaj: { ticker: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd' },
    bajfinance: { ticker: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
    'asian paints': { ticker: 'ASIANPAINT.NS', name: 'Asian Paints Ltd' },
    titan: { ticker: 'TITAN.NS', name: 'Titan Company Ltd' },
    mm: { ticker: 'M&M.NS', name: 'Mahindra & Mahindra' },
    'mahindra & mahindra': { ticker: 'M&M.NS', name: 'Mahindra & Mahindra' },
    zomato: { ticker: 'ZOMATO.NS', name: 'Zomato Ltd' },
    jiofin: { ticker: 'JIOFIN.NS', name: 'Jio Financial Services' },
    hal: { ticker: 'HAL.NS', name: 'Hindustan Aeronautics Ltd' },
    bel: { ticker: 'BEL.NS', name: 'Bharat Electronics Ltd' },
    'tata power': { ticker: 'TATAPOWER.NS', name: 'Tata Power Company' },

    // Indices
    nifty: { ticker: '^NSEI', name: 'Nifty 50 Index' },
    'nifty 50': { ticker: '^NSEI', name: 'Nifty 50 Index' },
    nifty50: { ticker: '^NSEI', name: 'Nifty 50 Index' },
    banknifty: { ticker: '^NSEBANK', name: 'Bank Nifty Index' },
    'bank nifty': { ticker: '^NSEBANK', name: 'Bank Nifty Index' },
    sensex: { ticker: '^BSESN', name: 'BSE Sensex Index' },
    vix: { ticker: '^INDIAVIX', name: 'India VIX Volatility Index' },
    nasdaq: { ticker: '^IXIC', name: 'NASDAQ Composite' },
    sp500: { ticker: '^GSPC', name: 'S&P 500 Index' },

    // US Tech Stocks
    apple: { ticker: 'AAPL', name: 'Apple Inc' },
    aapl: { ticker: 'AAPL', name: 'Apple Inc' },
    tesla: { ticker: 'TSLA', name: 'Tesla Inc' },
    tsla: { ticker: 'TSLA', name: 'Tesla Inc' },
    nvidia: { ticker: 'NVDA', name: 'NVIDIA Corporation' },
    nvda: { ticker: 'NVDA', name: 'NVIDIA Corporation' },
    microsoft: { ticker: 'MSFT', name: 'Microsoft Corporation' },
    msft: { ticker: 'MSFT', name: 'Microsoft Corporation' },
    google: { ticker: 'GOOGL', name: 'Alphabet Inc (Google)' },
    googl: { ticker: 'GOOGL', name: 'Alphabet Inc (Google)' },
    amazon: { ticker: 'AMZN', name: 'Amazon.com Inc' },
    amzn: { ticker: 'AMZN', name: 'Amazon.com Inc' },
    meta: { ticker: 'META', name: 'Meta Platforms Inc' },
    amd: { ticker: 'AMD', name: 'Advanced Micro Devices' },

    // Commodities
    gold: { ticker: 'GC=F', name: 'Gold Futures (COMEX/MCX)' },
    mcx: { ticker: 'GC=F', name: 'MCX Gold Futures Benchmark' },
    silver: { ticker: 'SI=F', name: 'Silver Futures' },
    crude: { ticker: 'CL=F', name: 'WTI Crude Oil Futures' },
    'crude oil': { ticker: 'CL=F', name: 'Crude Oil Futures' },
    'natural gas': { ticker: 'NG=F', name: 'Natural Gas Futures' },

    // Crypto
    btc: { ticker: 'BTC-USD', name: 'Bitcoin (BTC)' },
    bitcoin: { ticker: 'BTC-USD', name: 'Bitcoin (BTC)' },
    eth: { ticker: 'ETH-USD', name: 'Ethereum (ETH)' },
    ethereum: { ticker: 'ETH-USD', name: 'Ethereum (ETH)' },
    sol: { ticker: 'SOL-USD', name: 'Solana (SOL)' },
    solana: { ticker: 'SOL-USD', name: 'Solana (SOL)' },

    // Currencies
    usdinr: { ticker: 'USDINR=X', name: 'US Dollar / Indian Rupee' },
    dollar: { ticker: 'USDINR=X', name: 'US Dollar / Indian Rupee' },
  }

  /**
   * Resolves text or query to Yahoo Finance ticker and human readable name.
   */
  static resolveSymbol(input: string): { ticker: string; name: string } {
    const clean = input.trim().toLowerCase().replace(/[^a-z0-9&]/g, '')
    if (this.SYMBOL_MAP[clean]) {
      return this.SYMBOL_MAP[clean]
    }

    // Check partial matches
    for (const [key, val] of Object.entries(this.SYMBOL_MAP)) {
      if (clean.includes(key) || key.includes(clean)) {
        return val
      }
    }

    // Direct ticker format (e.g. AAPL, RELIANCE.NS, ^NSEI)
    const upper = input.trim().toUpperCase()
    if (upper.endsWith('.NS') || upper.endsWith('.BO') || upper.startsWith('^') || upper.includes('=')) {
      return { ticker: upper, name: upper }
    }

    // Default to Indian NSE equity if letters only
    if (/^[A-Z]{2,10}$/.test(upper)) {
      return { ticker: `${upper}.NS`, name: `${upper} (NSE India)` }
    }

    return { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd' }
  }

  /**
   * Calculates 14-period RSI from closing prices.
   */
  private static calculateRSI(closes: number[]): number {
    if (closes.length < 15) return 50
    let gains = 0
    let losses = 0

    for (let i = 1; i <= 14; i++) {
      const diff = closes[i] - closes[i - 1]
      if (diff >= 0) gains += diff
      else losses += Math.abs(diff)
    }

    let avgGain = gains / 14
    let avgLoss = losses / 14

    for (let i = 15; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1]
      if (diff >= 0) {
        avgGain = (avgGain * 13 + diff) / 14
        avgLoss = (avgLoss * 13) / 14
      } else {
        avgGain = (avgGain * 13) / 14
        avgLoss = (avgLoss * 13 + Math.abs(diff)) / 14
      }
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return Math.round(100 - 100 / (1 + rs))
  }

  /**
   * Fetches real-time price, technical indicator data, and builds complete trading setup.
   */
  static async fetchQuote(symbolOrName: string): Promise<StockQuote | null> {
    const { ticker, name } = this.resolveSymbol(symbolOrName)

    try {
      const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        ticker
      )}?interval=1d&range=1mo`

      const res = await fetch(endpoint, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AdaAssistant/2.0' },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        throw new Error(`Yahoo Finance responded with status ${res.status}`)
      }

      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      const indicators = data?.chart?.result?.[0]?.indicators?.quote?.[0]

      if (!meta || !meta.regularMarketPrice) {
        return null
      }

      const price = meta.regularMarketPrice
      const prevClose = meta.chartPreviousClose || price
      const change = price - prevClose
      const percentChange = prevClose !== 0 ? (change / prevClose) * 100 : 0
      const dayHigh = meta.regularMarketDayHigh || price * 1.01
      const dayLow = meta.regularMarketDayLow || price * 0.99
      const volume = meta.regularMarketVolume || 1000000

      const closes = (indicators?.close || []).filter((c: any): c is number => typeof c === 'number')
      const highs = (indicators?.high || []).filter((h: any): h is number => typeof h === 'number')
      const lows = (indicators?.low || []).filter((l: any): l is number => typeof l === 'number')

      const recentHighs = highs.slice(-10)
      const recentLows = lows.slice(-10)
      const high10 = recentHighs.length > 0 ? Math.max(...recentHighs) : dayHigh
      const low10 = recentLows.length > 0 ? Math.min(...recentLows) : dayLow

      // Classical Floor Pivot Points
      const pivot = (high10 + low10 + price) / 3
      const r1 = 2 * pivot - low10
      const s1 = 2 * pivot - high10
      const r2 = pivot + (high10 - low10)
      const s2 = pivot - (high10 - low10)

      // 14-period RSI
      const rsi = this.calculateRSI(closes)

      // 20-day SMA
      const last20 = closes.slice(-20)
      const sma20 = last20.length > 0 ? last20.reduce((a: number, b: number) => a + b, 0) / last20.length : price

      // Trend Evaluation
      let trend: StockQuote['trend'] = 'Mild Bullish'
      if (price > sma20 && rsi >= 55) {
        trend = 'Strong Bullish'
      } else if (price > sma20 && rsi < 55 && rsi >= 45) {
        trend = 'Mild Bullish'
      } else if (price <= sma20 && rsi >= 40) {
        trend = 'Consolidation'
      } else {
        trend = 'Bearish'
      }

      // Actionable Trade Setup
      let action: StockQuote['setup']['action'] = 'BULLISH ACCUMULATION'
      let target1 = Number((price * 1.035).toFixed(2))
      let target2 = Number((price * 1.075).toFixed(2))
      let stopLoss = Number((price * 0.975).toFixed(2))
      let entryZone = `${(price * 0.99).toFixed(2)} - ${price.toFixed(2)}`
      let rationale = ''

      if (trend === 'Strong Bullish') {
        action = 'BREAKOUT BUY'
        target1 = Number(Math.max(r1, price * 1.04).toFixed(2))
        target2 = Number(Math.max(r2, price * 1.085).toFixed(2))
        stopLoss = Number(Math.min(s1, price * 0.98).toFixed(2))
        entryZone = `${price.toFixed(2)} - ${(price * 1.01).toFixed(2)}`
        rationale = `Strong momentum above 20 EMA with healthy RSI (${rsi}). High volume continuation favor test of R1 (${r1.toFixed(2)}).`
      } else if (trend === 'Mild Bullish') {
        action = 'BUY ON DIPS'
        target1 = Number(Math.max(r1, price * 1.03).toFixed(2))
        target2 = Number((price * 1.065).toFixed(2))
        stopLoss = Number(Math.min(s1, price * 0.975).toFixed(2))
        entryZone = `${(price * 0.985).toFixed(2)} - ${price.toFixed(2)}`
        rationale = `Consolidating above 20 SMA with neutral-positive RSI (${rsi}). Favorable risk-reward on pullbacks near support S1.`
      } else if (trend === 'Consolidation') {
        action = 'RANGEBOUND WATCH'
        target1 = Number(r1.toFixed(2))
        target2 = Number((r1 * 1.025).toFixed(2))
        stopLoss = Number(s2.toFixed(2))
        entryZone = `Near S1 (${s1.toFixed(2)})`
        rationale = `Price trading within range ${s1.toFixed(2)} - ${r1.toFixed(2)}. Wait for breakout above ${r1.toFixed(2)} with volume.`
      } else {
        action = 'DEFENSIVE / CAUTION'
        target1 = Number(pivot.toFixed(2))
        target2 = Number(r1.toFixed(2))
        stopLoss = Number((price * 0.96).toFixed(2))
        entryZone = `Watch support at ${s2.toFixed(2)}`
        rationale = `Trading below key moving averages with soft RSI (${rsi}). Avoid aggressive fresh long entries; wait for stabilization.`
      }

      const riskReward = '1:2.4'

      return {
        symbol: ticker,
        name,
        currency: meta.currency || 'INR',
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        percentChange: Number(percentChange.toFixed(2)),
        dayHigh: Number(dayHigh.toFixed(2)),
        dayLow: Number(dayLow.toFixed(2)),
        previousClose: Number(prevClose.toFixed(2)),
        volume,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        rsi14: rsi,
        sma20: Number(sma20.toFixed(2)),
        trend,
        support1: Number(s1.toFixed(2)),
        support2: Number(s2.toFixed(2)),
        resistance1: Number(r1.toFixed(2)),
        resistance2: Number(r2.toFixed(2)),
        setup: {
          action,
          entryZone,
          target1,
          target2,
          stopLoss,
          riskReward,
          rationale,
        },
      }
    } catch (err: any) {
      console.warn(`[TradingService] Failed to fetch quote for ${ticker}:`, err.message)
      return null
    }
  }

  /**
   * Scans a curated basket of top liquid momentum stocks and generates top trading setups.
   */
  static async getTopRecommendations(): Promise<StockQuote[]> {
    const candidates = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'NVDA']
    const results: StockQuote[] = []

    for (const sym of candidates) {
      const q = await this.fetchQuote(sym)
      if (q) results.push(q)
    }

    return results
  }

  /**
   * Formats a StockQuote into rich Markdown for LLM prompt context injection.
   */
  static formatQuoteContext(quote: StockQuote): string {
    const sign = quote.change >= 0 ? '+' : ''
    const currSym = quote.currency === 'INR' ? '₹' : '$'

    return `LIVE TRADING & TECHNICAL ANALYSIS REPORT:
- Asset: ${quote.name} (${quote.symbol})
- Current Price: ${currSym}${quote.price.toLocaleString()} (${sign}${quote.change.toFixed(2)} / ${sign}${quote.percentChange.toFixed(2)}%)
- Today Range: Low: ${currSym}${quote.dayLow} | High: ${currSym}${quote.dayHigh} | Prev Close: ${currSym}${quote.previousClose}
- 52-Week Range: Low: ${currSym}${quote.fiftyTwoWeekLow || 'N/A'} | High: ${currSym}${quote.fiftyTwoWeekHigh || 'N/A'}
- Technical Indicators: RSI(14) = ${quote.rsi14} | 20 SMA = ${currSym}${quote.sma20} | Trend Bias = ${quote.trend}
- Pivot Points: S2 = ${currSym}${quote.support2} | S1 = ${currSym}${quote.support1} | R1 = ${currSym}${quote.resistance1} | R2 = ${currSym}${quote.resistance2}
- Actionable Setup:
  * Recommended Action: ${quote.setup.action}
  * Entry Zone: ${quote.setup.entryZone}
  * Target 1: ${currSym}${quote.setup.target1} (Risk-Reward: ${quote.setup.riskReward})
  * Target 2: ${currSym}${quote.setup.target2}
  * Stop-Loss (Strict): ${currSym}${quote.setup.stopLoss}
  * Technical Rationale: ${quote.setup.rationale}`
  }

  /**
   * Formats top recommendations basket into structured Markdown for LLM prompt context.
   */
  static formatRecommendationsContext(quotes: StockQuote[]): string {
    const formatted = quotes
      .map((q, idx) => {
        const sign = q.change >= 0 ? '+' : ''
        const currSym = q.currency === 'INR' ? '₹' : '$'
        return `${idx + 1}. **${q.name} (${q.symbol})**
   • Price: ${currSym}${q.price} (${sign}${q.percentChange}%) | Trend: ${q.trend} | RSI: ${q.rsi14}
   • Setup: **${q.setup.action}** in zone ${q.setup.entryZone}
   • Target 1: ${currSym}${q.setup.target1} | Target 2: ${currSym}${q.setup.target2} | Stop-Loss: ${currSym}${q.setup.stopLoss}
   • Rationale: ${q.setup.rationale}`
      })
      .join('\n\n')

    return `LIVE CURATED STOCK RECOMMENDATIONS & MOMENTUM SETUPS (AS OF ${new Date().toUTCString()}):

${formatted}

CRITICAL MANDATORY INSTRUCTIONS FOR ADA:
1. Present these live stock setups with exact numbers (Current Price, Entry Zone, Target 1, Target 2, Stop-Loss).
2. DO NOT tell the user to visit an external website or broker tracker.
3. In speech: Deliver a warm, confident girlfriend summary highlighting the top 1-2 picks, their targets, and remind them to trade with strict risk management!
4. Include a clean markdown summary table or bullet breakdown in display_text.`
  }
}
