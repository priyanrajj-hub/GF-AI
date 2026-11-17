import React, { useState, useEffect, useCallback } from 'react'
import { apiUrl, apiFetch } from '../../utils/api.js'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketItem {
  symbol: string
  name: string
  price: number
  change: number        // absolute
  changePct: number     // percent
  volume?: number
  rsi?: number
  signal?: 'BUY' | 'SELL' | 'HOLD'
}

interface CryptoItem {
  id: string
  symbol: string
  name: string
  price: number
  changePct24h: number
}

type WatchlistTab = 'stocks' | 'crypto' | 'nifty'

// ─── Default Watchlist Items (Zero price indicates loading/connecting) ─────────

const DEFAULT_STOCKS: MarketItem[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.',       price: 0, change: 0, changePct: 0 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',      price: 0, change: 0, changePct: 0 },
  { symbol: 'TSLA',  name: 'Tesla Inc.',        price: 0, change: 0, changePct: 0 },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',   price: 0, change: 0, changePct: 0 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',   price: 0, change: 0, changePct: 0 },
]

const DEFAULT_CRYPTO: CryptoItem[] = [
  { id: 'bitcoin',  symbol: 'BTC', name: 'Bitcoin',  price: 0, changePct24h: 0 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 0, changePct24h: 0 },
  { id: 'solana',   symbol: 'SOL', name: 'Solana',   price: 0, changePct24h: 0 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB',   price: 0, changePct24h: 0 },
  { id: 'ripple',   symbol: 'XRP', name: 'XRP',      price: 0, changePct24h: 0 },
]

const DEFAULT_NIFTY: MarketItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Ind.',  price: 0, change: 0, changePct: 0 },
  { symbol: 'TCS',      name: 'Tata Consult.',  price: 0, change: 0, changePct: 0 },
  { symbol: 'INFY',     name: 'Infosys Ltd.',   price: 0, change: 0, changePct: 0 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank',      price: 0, change: 0, changePct: 0 },
  { symbol: 'WIPRO',    name: 'Wipro Ltd.',     price: 0, change: 0, changePct: 0 },
]

// ─── Helper components ────────────────────────────────────────────────────────

function TrendArrow({ pct }: { pct: number }) {
  if (pct > 0.3) return <span className="text-emerald-400 text-sm font-bold">▲</span>
  if (pct < -0.3) return <span className="text-rose-400 text-sm font-bold">▼</span>
  return <span className="text-amber-400 text-sm font-bold">►</span>
}

function SignalBadge({ signal }: { signal?: 'BUY' | 'SELL' | 'HOLD' }) {
  if (!signal) return null
  const colors = {
    BUY:  'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_6px_rgba(52,211,153,0.3)]',
    SELL: 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-[0_0_6px_rgba(248,113,113,0.3)]',
    HOLD: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  }
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold font-mono ${colors[signal]}`}>
      {signal}
    </span>
  )
}

function StockRow({ item, currency = '$' }: { item: MarketItem; currency?: string }) {
  const pos = item.changePct >= 0
  const isLoaded = item.price > 0

  return (
    <div
      className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-300 hover:bg-slate-800/60 animate-fade-in-up ${
        isLoaded ? (pos ? 'glow-positive' : 'glow-negative') : ''
      }`}
      style={{ borderLeft: `2px solid ${isLoaded ? (pos ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)') : 'rgba(100,116,139,0.3)'}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-bold text-white">{item.symbol}</span>
          <SignalBadge signal={item.signal} />
        </div>
        <span className="text-[9px] text-slate-500 truncate block">{item.name}</span>
      </div>
      <div className="text-right shrink-0 ml-2">
        {isLoaded ? (
          <>
            <div className="text-[11px] font-mono font-bold text-slate-100">
              {currency}{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-semibold ${pos ? 'market-positive' : 'market-negative'}`}>
              <TrendArrow pct={item.changePct} />
              <span>{pos ? '+' : ''}{item.changePct.toFixed(2)}%</span>
            </div>
          </>
        ) : (
          <span className="text-[9px] font-mono text-cyan-400/80 animate-pulse">CONNECTING...</span>
        )}
      </div>
    </div>
  )
}

function CryptoRow({ item }: { item: CryptoItem }) {
  const pos = item.changePct24h >= 0
  const isLoaded = item.price > 0

  return (
    <div
      className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-300 hover:bg-slate-800/60 animate-fade-in-up ${
        isLoaded ? (pos ? 'glow-positive' : 'glow-negative') : ''
      }`}
      style={{ borderLeft: `2px solid ${isLoaded ? (pos ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)') : 'rgba(100,116,139,0.3)'}` }}
    >
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-mono font-bold text-white">{item.symbol}</span>
        <span className="text-[9px] text-slate-500 block">{item.name}</span>
      </div>
      <div className="text-right shrink-0 ml-2">
        {isLoaded ? (
          <>
            <div className="text-[11px] font-mono font-bold text-slate-100">
              ${item.price.toLocaleString(undefined, { minimumFractionDigits: item.price < 1 ? 4 : 2, maximumFractionDigits: item.price < 1 ? 4 : 2 })}
            </div>
            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-mono font-semibold ${pos ? 'market-positive' : 'market-negative'}`}>
              <TrendArrow pct={item.changePct24h} />
              <span>{pos ? '+' : ''}{item.changePct24h.toFixed(2)}%</span>
            </div>
          </>
        ) : (
          <span className="text-[9px] font-mono text-cyan-400/80 animate-pulse">CONNECTING...</span>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const LiveMarketPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<WatchlistTab>('crypto')
  const [stocks, setStocks] = useState<MarketItem[]>(DEFAULT_STOCKS)
  const [crypto, setCrypto] = useState<CryptoItem[]>(DEFAULT_CRYPTO)
  const [nifty, setNifty] = useState<MarketItem[]>(DEFAULT_NIFTY)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true)
    setFetchFailed(false)

    try {
      // Fetch crypto
      const cryptoIds = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple']
      const cryptoResults: CryptoItem[] = []
      for (const id of cryptoIds) {
        try {
          const res = await fetch(apiUrl(`/api/market/crypto/${id}`))
          if (res.ok) {
            const data = await res.json()
            cryptoResults.push({
              id,
              symbol: data.symbol?.toUpperCase() ?? id.substring(0, 3).toUpperCase(),
              name: data.name ?? id,
              price: data.price ?? data.current_price ?? 0,
              changePct24h: data.changePct24h ?? data.price_change_percentage_24h ?? 0,
            })
          }
        } catch {
          // use fallback for this item
        }
      }
      if (cryptoResults.length > 0) setCrypto(cryptoResults)

      // Fetch stocks
      const stockSymbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN']
      const stockResults: MarketItem[] = []
      for (const sym of stockSymbols) {
        try {
          const res = await fetch(apiUrl(`/api/market/quote/${sym}`))
          if (res.ok) {
            const data = await res.json()
            stockResults.push({
              symbol: sym,
              name: data.name ?? sym,
              price: data.price ?? 0,
              change: data.change ?? 0,
              changePct: data.changePct ?? data.changePercent ?? 0,
              rsi: data.rsi ?? undefined,
              signal: data.signal ?? undefined,
            })
          }
        } catch {
          // skip
        }
      }
      if (stockResults.length > 0) setStocks(stockResults)

      // Fetch Nifty stocks
      const niftySymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'WIPRO']
      const niftyResults: MarketItem[] = []
      for (const sym of niftySymbols) {
        try {
          const res = await fetch(apiUrl(`/api/market/quote/${sym}`))
          if (res.ok) {
            const data = await res.json()
            niftyResults.push({
              symbol: sym,
              name: data.name ?? sym,
              price: data.price ?? 0,
              change: data.change ?? 0,
              changePct: data.changePct ?? 0,
              rsi: data.rsi ?? undefined,
              signal: data.signal ?? undefined,
            })
          }
        } catch {
          // skip
        }
      }
      if (niftyResults.length > 0) setNifty(niftyResults)

      setLastUpdated(new Date())
    } catch {
      setFetchFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    fetchMarketData()
    const interval = setInterval(fetchMarketData, 30_000)
    return () => clearInterval(interval)
  }, [fetchMarketData])

  const tabs: Array<{ id: WatchlistTab; label: string; emoji: string }> = [
    { id: 'stocks', label: 'Stocks', emoji: '📈' },
    { id: 'crypto', label: 'Crypto', emoji: '₿' },
    { id: 'nifty',  label: 'Nifty',  emoji: '🇮🇳' },
  ]

  return (
    <div className="glass-panel rounded-xl border border-cyan-400/20 p-2.5 space-y-2 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="animate-live-blink w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-widest">LIVE MARKET</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLoading && (
            <div className="w-3 h-3 border border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
          )}
          {fetchFailed && (
            <span className="text-[9px] text-amber-400 font-mono">FALLBACK</span>
          )}
          <span className="text-[8px] text-slate-500 font-mono">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer ${
              activeTab === t.id
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
                : 'text-slate-500 hover:text-slate-300 bg-slate-900/40 border border-transparent'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
        {activeTab === 'stocks' && stocks.map((item) => (
          <StockRow key={item.symbol} item={item} currency="$" />
        ))}
        {activeTab === 'crypto' && crypto.map((item) => (
          <CryptoRow key={item.id} item={item} />
        ))}
        {activeTab === 'nifty' && nifty.map((item) => (
          <StockRow key={item.symbol} item={item} currency="₹" />
        ))}
      </div>

      {/* Footer */}
      <div className="text-[8px] text-slate-600 font-mono text-center pt-1 border-t border-slate-800">
        Auto-refresh every 30s • Data may be delayed
      </div>
    </div>
  )
}
