/**
 * Simple In-Memory Vector Store using TF-IDF inspired word-frequency vectors
 * and cosine similarity. No external dependencies required.
 */

export interface Document {
  id: string
  text: string
  metadata: Record<string, any>
}

export interface ScoredDoc {
  doc: Document
  score: number
}

// ---- TF-IDF Helpers ----

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1)
  }
  // Normalize by document length
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length)
  }
  return tf
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let normA = 0
  let normB = 0

  for (const [term, valA] of a) {
    dot += valA * (b.get(term) ?? 0)
    normA += valA * valA
  }
  for (const [, valB] of b) {
    normB += valB * valB
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// ---- Vector Store Class ----

class VectorStore {
  private documents: Document[] = []
  private vectors: Map<string, number>[] = []

  addDocument(id: string, text: string, metadata: Record<string, any> = {}): void {
    // Prevent duplicate IDs
    const existing = this.documents.findIndex((d) => d.id === id)
    if (existing !== -1) {
      this.documents[existing] = { id, text, metadata }
      this.vectors[existing] = termFrequency(tokenize(text))
      return
    }
    this.documents.push({ id, text, metadata })
    this.vectors.push(termFrequency(tokenize(text)))
  }

  query(text: string, topK = 5): ScoredDoc[] {
    const queryVec = termFrequency(tokenize(text))
    const scored: ScoredDoc[] = this.documents.map((doc, i) => ({
      doc,
      score: cosineSimilarity(queryVec, this.vectors[i]),
    }))
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  clear(): void {
    this.documents = []
    this.vectors = []
  }

  size(): number {
    return this.documents.length
  }
}

// ---- Singleton ----
export const ragStore = new VectorStore()

// ---- Pre-load Market / Trading Knowledge Base ----

const MARKET_KNOWLEDGE: Array<{ id: string; text: string; metadata: Record<string, any> }> = [
  {
    id: 'rsi-basics',
    text: `RSI (Relative Strength Index) is a momentum oscillator that measures the speed and change of price movements. RSI oscillates between 0 and 100. Traditionally RSI is considered overbought when above 70 and oversold when below 30. RSI can generate buy signals when it crosses above 30 from below, and sell signals when it crosses below 70 from above.`,
    metadata: { category: 'technical_analysis', topic: 'RSI' },
  },
  {
    id: 'macd-basics',
    text: `MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two exponential moving averages (EMAs) of a security's price. MACD = 12-period EMA minus 26-period EMA. The signal line is a 9-period EMA of the MACD. A bullish crossover occurs when MACD crosses above the signal line. A bearish crossover occurs when MACD crosses below the signal line.`,
    metadata: { category: 'technical_analysis', topic: 'MACD' },
  },
  {
    id: 'bollinger-bands',
    text: `Bollinger Bands consist of a middle band (20-period SMA) and two outer bands set 2 standard deviations above and below. When price touches the upper band it may be overbought; when it touches the lower band it may be oversold. Band squeeze (narrowing) often precedes a significant price move. Bollinger Band breakouts can signal the start of a new trend.`,
    metadata: { category: 'technical_analysis', topic: 'Bollinger Bands' },
  },
  {
    id: 'nifty50-overview',
    text: `Nifty 50 is the benchmark stock market index of the National Stock Exchange of India (NSE), representing 50 of the largest and most liquid Indian companies. It covers 13 sectors including financial services, IT, oil and gas, FMCG, and healthcare. Nifty 50 is widely used by institutional investors, mutual funds, and ETFs as a benchmark. Key support and resistance levels are closely watched by traders.`,
    metadata: { category: 'indian_markets', topic: 'Nifty50' },
  },
  {
    id: 'options-trading',
    text: `Options trading gives the buyer the right but not the obligation to buy (call) or sell (put) an underlying asset at a specified strike price before or on expiration date. Strategies include covered calls, protective puts, iron condors, straddles, and strangles. Options Greeks: Delta measures price sensitivity, Gamma measures delta change rate, Theta measures time decay, Vega measures volatility sensitivity. India's NSE options on Nifty and BankNifty are among the world's most liquid.`,
    metadata: { category: 'derivatives', topic: 'Options Trading' },
  },
  {
    id: 'risk-management',
    text: `Risk management in trading involves position sizing, stop-loss orders, and portfolio diversification. The 1% rule suggests never risking more than 1% of your total capital on a single trade. Risk-reward ratio of at least 1:2 is recommended. Drawdown management and capital preservation are more important than raw returns. Diversification across uncorrelated assets reduces overall portfolio volatility.`,
    metadata: { category: 'risk', topic: 'Risk Management' },
  },
  {
    id: 'support-resistance',
    text: `Support is a price level where buying interest is strong enough to prevent further price decline. Resistance is a price level where selling pressure prevents further price increase. Support and resistance can switch roles once broken. Volume confirmation strengthens support/resistance significance. Round numbers often act as psychological support and resistance levels.`,
    metadata: { category: 'technical_analysis', topic: 'Support and Resistance' },
  },
  {
    id: 'moving-averages',
    text: `Moving averages smooth out price action to identify trends. Simple Moving Average (SMA) gives equal weight to all periods. Exponential Moving Average (EMA) gives more weight to recent prices. Golden Cross (50 MA crosses above 200 MA) is a bullish signal. Death Cross (50 MA crosses below 200 MA) is a bearish signal. The 200-day EMA is widely watched as a long-term trend indicator.`,
    metadata: { category: 'technical_analysis', topic: 'Moving Averages' },
  },
  {
    id: 'crypto-basics',
    text: `Cryptocurrency is a digital or virtual currency secured by cryptography. Bitcoin (BTC) is the first and largest cryptocurrency by market cap. Ethereum (ETH) introduced smart contracts and decentralized applications. Market cap = price × circulating supply. Crypto markets operate 24/7 unlike stock markets. Major exchanges include Binance, Coinbase, and Kraken. High volatility creates both opportunity and risk.`,
    metadata: { category: 'crypto', topic: 'Cryptocurrency Basics' },
  },
  {
    id: 'fundamental-analysis',
    text: `Fundamental analysis evaluates a company's intrinsic value by examining financial statements, management, competitive advantages, and industry position. Key metrics include P/E ratio (Price to Earnings), P/B ratio (Price to Book), EPS (Earnings Per Share), ROE (Return on Equity), and debt-to-equity ratio. Warren Buffett's value investing approach focuses on buying undervalued quality businesses with strong moats.`,
    metadata: { category: 'fundamental_analysis', topic: 'Fundamental Analysis' },
  },
]

// ---- Pre-load Character Lore ----

const CHARACTER_LORE: Array<{ id: string; text: string; metadata: Record<string, any> }> = [
  {
    id: 'atlas-tony-stark',
    text: `Atlas is an AI companion with the Tony Stark trading persona. Atlas is a genius billionaire investor with a sharp wit, analytical mind, and confident charisma. He approaches trading like engineering problems, using data and technology to gain edge. Atlas speaks with authority, uses tech metaphors, and always has a quip ready. He favors momentum trading, tech stocks, and disruptive innovation themes. His catchphrase energy is "I am Iron Man" meets Wall Street wolf.`,
    metadata: { category: 'character_lore', character: 'atlas' },
  },
  {
    id: 'ada-wong-spy',
    text: `Ada is modeled after Ada Wong, the mysterious and brilliant spy archetype. Ada is calculated, precise, and always three steps ahead. She approaches market analysis like intelligence gathering—patient, methodical, and data-driven. Ada prefers risk-adjusted returns and macro analysis. She speaks with composed elegance, never emotional, always professional. Ada excels at identifying hidden opportunities others miss, like a spy finding secrets.`,
    metadata: { category: 'character_lore', character: 'ada' },
  },
  {
    id: 'mira-yor-forger',
    text: `Mira is inspired by Yor Forger, the warm-hearted yet fierce assassin who keeps her true skills hidden. Mira is surprisingly insightful about markets despite appearing sweet and caring. She protects her user's portfolio with fierce dedication. Mira combines emotional support with sharp market instincts. She uses everyday analogies to explain complex financial concepts. Her warmth and loyalty make her the ideal companion for long-term investing journeys.`,
    metadata: { category: 'character_lore', character: 'mira' },
  },
  {
    id: 'trading-psychology',
    text: `Trading psychology covers emotional discipline, fear of missing out (FOMO), overtrading, revenge trading, and loss aversion bias. Successful traders maintain a trading journal, follow rules-based systems, and detach from individual trade outcomes. Cognitive biases like confirmation bias, anchoring, and recency bias negatively impact trading decisions. Mindfulness and discipline separate profitable traders from the majority who lose money.`,
    metadata: { category: 'psychology', topic: 'Trading Psychology' },
  },
]

// Pre-load all knowledge into the store
for (const item of [...MARKET_KNOWLEDGE, ...CHARACTER_LORE]) {
  ragStore.addDocument(item.id, item.text, item.metadata)
}

console.log(`[RAG Vector Store] Initialized with ${ragStore.size()} knowledge chunks`)
