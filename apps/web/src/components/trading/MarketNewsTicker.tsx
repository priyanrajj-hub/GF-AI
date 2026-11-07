import React, { useState, useEffect, useRef } from 'react'
import { apiUrl } from '../../utils/api.js'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsItem {
  sentiment: '📈' | '📉' | '⚠️'
  headline: string
  time: string
}

// ─── Static fallback headlines ────────────────────────────────────────────────

const DEFAULT_NEWS: NewsItem[] = [
  {
    sentiment: '📈',
    headline: 'NVIDIA surges 4.2% as AI chip demand hits record quarterly highs — analysts raise PT to $650',
    time: '09:32',
  },
  {
    sentiment: '⚠️',
    headline: 'Fed signals "higher for longer" stance as CPI remains sticky at 3.2% — markets brace for volatility',
    time: '10:15',
  },
  {
    sentiment: '📈',
    headline: 'Bitcoin breaks $70K resistance — ETF inflows hit $1.2B in a single session',
    time: '11:04',
  },
  {
    sentiment: '📉',
    headline: 'Oil slides 2.1% on demand concerns from China — WTI settles below $72 barrel',
    time: '11:47',
  },
  {
    sentiment: '📈',
    headline: 'Nifty 50 rallies 1.3% — Reliance, TCS lead gains amid strong FII buying in Indian equities',
    time: '12:30',
  },
  {
    sentiment: '⚠️',
    headline: 'Geopolitical tensions in Middle East push Gold above $2,780 — safe-haven demand elevated',
    time: '13:12',
  },
  {
    sentiment: '📈',
    headline: 'Solana ecosystem records 50M daily transactions — SOL +8% weekly outperforms market',
    time: '14:00',
  },
]

// ─── Separator ────────────────────────────────────────────────────────────────

function TickerSep() {
  return (
    <span className="inline-flex items-center mx-6 text-yellow-500/60 select-none">
      <span className="animate-live-blink">◆</span>
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MarketNewsTickerProps {
  className?: string
}

export const MarketNewsTicker: React.FC<MarketNewsTickerProps> = ({ className = '' }) => {
  const [news, setNews] = useState<NewsItem[]>(DEFAULT_NEWS)
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  // Try to fetch live news from server
  useEffect(() => {
    const tryFetch = async () => {
      try {
        const res = await fetch(apiUrl('/api/market/news'), { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            const mapped: NewsItem[] = data.map((item: any) => ({
              sentiment: (item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '⚠️') as NewsItem['sentiment'],
              headline: item.headline ?? item.title ?? 'Market Update',
              time: item.time ?? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
            setNews([...mapped, ...DEFAULT_NEWS].slice(0, 12))
          }
        }
      } catch {
        // silently fall back to static headlines
      }
    }
    tryFetch()
  }, [])

  // Build the ticker string — duplicated for seamless loop
  const tickerItems = [...news, ...news]

  return (
    <div
      className={`relative overflow-hidden h-7 flex items-center bg-slate-950/90 border-y border-yellow-500/20 select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Bloomberg-style left label */}
      <div className="shrink-0 flex items-center gap-1.5 px-2.5 h-full bg-yellow-500/10 border-r border-yellow-500/30 z-10">
        <span className="animate-live-blink w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
        <span className="text-[10px] font-mono font-bold text-yellow-300 tracking-widest whitespace-nowrap">
          MARKET WIRE
        </span>
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={tickerRef}
          className="flex items-center whitespace-nowrap text-[11px] font-mono"
          style={{
            animation: isPaused
              ? 'none'
              : 'tickerScroll 60s linear infinite',
          }}
        >
          {tickerItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <span className="inline-flex items-center gap-1.5 px-2">
                <span className="text-sm leading-none">{item.sentiment}</span>
                <span className="text-slate-300">{item.headline}</span>
                <span className="text-slate-600 text-[9px] ml-1">{item.time}</span>
              </span>
              <TickerSep />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right edge fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-950/90 to-transparent pointer-events-none" />
    </div>
  )
}
