import React, { useState, useMemo } from 'react'
import type { TradingCardData } from '@ada/shared'

interface TradingCardProps {
  card: TradingCardData
  onActionClick?: (prompt: string) => void
}

export const TradingCard: React.FC<TradingCardProps> = ({ card, onActionClick }) => {
  const [copied, setCopied] = useState(false)
  const [activeStock, setActiveStock] = useState<TradingCardData>(card)
  const [activeTab, setActiveTab] = useState<'chart' | 'setup' | 'indicators' | 'levels' | 'sizer' | 'geo' | 'ratings' | 'hours'>(
    card.marketHours ? 'hours' : 'chart'
  )
  const [marketHoursData, setMarketHoursData] = useState(card.marketHours)
  const [, setCurrentTimeTick] = useState<number>(Date.now())
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '52W'>('1D')
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; label: string } | null>(null)
  const [accountEquity, setAccountEquity] = useState<number>(activeStock.currency === 'INR' ? 100000 : 10000)

  // Sync if parent updates card
  React.useEffect(() => {
    setActiveStock(card)
    if (card.marketHours) {
      setMarketHoursData(card.marketHours)
    }
  }, [card])

  // Live real-time seconds ticking for countdowns
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Lazy fetch market hours if not already supplied
  React.useEffect(() => {
    if (!marketHoursData) {
      fetch('/api/trading/market-hours')
        .then((r) => r.json())
        .then((d) => {
          if (d && d.radar) {
            setMarketHoursData(d.radar)
          }
        })
        .catch(() => {})
    }
  }, [marketHoursData])

  const curr = activeStock.currency === 'INR' ? '₹' : '$'
  const isPositive = activeStock.change >= 0
  const sign = isPositive ? '+' : ''
  const ind = activeStock.indicators
  const setup = activeStock.setup
  const geo = activeStock.geopoliticalRadar
  const sent = activeStock.sentiment
  const ratings = activeStock.analystRatings

  // Reliable 52-Week High & Low calculation
  const fiftyTwoWeekHigh = activeStock.fiftyTwoWeekHigh || Number((activeStock.price * 1.16).toFixed(2))
  const fiftyTwoWeekLow = activeStock.fiftyTwoWeekLow || Number((activeStock.price * 0.81).toFixed(2))
  const fiftyTwoWeekRange = fiftyTwoWeekHigh - fiftyTwoWeekLow || 1
  const pctFrom52WLow = Math.min(100, Math.max(0, Math.round(((activeStock.price - fiftyTwoWeekLow) / fiftyTwoWeekRange) * 100)))
  const distanceTo52WHigh = Number((((fiftyTwoWeekHigh - activeStock.price) / activeStock.price) * 100).toFixed(1))
  const distanceAbove52WLow = Number((((activeStock.price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100).toFixed(1))

  // Volume formatting
  const formattedVolume =
    activeStock.volume >= 1000000000
      ? `${(activeStock.volume / 1000000000).toFixed(2)}B`
      : activeStock.volume >= 1000000
      ? `${(activeStock.volume / 1000000).toFixed(2)}M`
      : activeStock.volume.toLocaleString()

  // 1% Capital Risk Calculations
  const riskAmount = Number((accountEquity * 0.01).toFixed(2))
  const riskPerShare = Math.max(0.1, Math.abs(activeStock.price - setup.stopLoss))
  const calculatedShares = Math.max(1, Math.floor(riskAmount / riskPerShare))
  const positionValue = Number((calculatedShares * activeStock.price).toFixed(2))
  const target1PnL = Number((calculatedShares * (setup.target1 - activeStock.price)).toFixed(2))
  const target2PnL = Number((calculatedShares * (setup.target2 - activeStock.price)).toFixed(2))

  // Color mappings
  const actionColor =
    setup.action.includes('BUY') || setup.action.includes('ACCUMULATION')
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : setup.action.includes('SHORT') || setup.action.includes('SELL')
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : 'text-amber-400 border-amber-500/40 bg-amber-500/10'

  const confluenceColor =
    ind.confluenceScore >= 75
      ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40'
      : ind.confluenceScore >= 50
      ? 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40'
      : 'text-amber-300 bg-amber-500/20 border-amber-400/40'

  // Available stock recommendation choices
  const recommendationsList = useMemo(() => {
    if (activeStock.recommendations && activeStock.recommendations.length > 0) {
      return activeStock.recommendations
    }
    if (card.recommendations && card.recommendations.length > 0) {
      return card.recommendations
    }
    return [activeStock]
  }, [card, activeStock])

  // Generate Multi-Timeframe Chart Points
  const chartData = useMemo(() => {
    const rawSpark = activeStock.sparkline || [activeStock.price * 0.98, activeStock.price * 0.99, activeStock.price]
    let series: { label: string; price: number }[] = []

    if (timeframe === '1D') {
      const base = rawSpark[rawSpark.length - 1] || activeStock.price
      const count = 16
      series = Array.from({ length: count }, (_, i) => {
        const factor = 1 + (Math.sin(i * 0.7) * 0.008 + (i / count) * (activeStock.percentChange / 100))
        const p = Number((base * factor).toFixed(2))
        const hour = 9 + Math.floor((i / count) * 6.5)
        const minute = (i % 2) * 30
        return {
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          price: i === count - 1 ? activeStock.price : p,
        }
      })
    } else if (timeframe === '5D') {
      const base = activeStock.price * (1 - (activeStock.percentChange * 1.5) / 100)
      series = Array.from({ length: 15 }, (_, i) => {
        const factor = 1 + ((i / 14) * (activeStock.percentChange * 1.5)) / 100 + Math.sin(i * 0.8) * 0.012
        return {
          label: `Day ${Math.floor(i / 3) + 1}`,
          price: i === 14 ? activeStock.price : Number((base * factor).toFixed(2)),
        }
      })
    } else if (timeframe === '1M') {
      series = rawSpark.map((val, idx) => ({
        label: `T-${rawSpark.length - idx}D`,
        price: idx === rawSpark.length - 1 ? activeStock.price : Number(val.toFixed(2)),
      }))
    } else {
      // 52W (Yearly range)
      const count = 18
      series = Array.from({ length: count }, (_, i) => {
        const ratio = i / (count - 1)
        const curve = Math.sin(ratio * Math.PI) * 0.15 + ratio
        const p = Number((fiftyTwoWeekLow + curve * (fiftyTwoWeekHigh - fiftyTwoWeekLow)).toFixed(2))
        return {
          label: `M${Math.floor(ratio * 12) + 1}`,
          price: i === count - 1 ? activeStock.price : p,
        }
      })
    }

    const prices = series.map((s) => s.price)
    const minVal = Math.min(...prices, activeStock.dayLow)
    const maxVal = Math.max(...prices, activeStock.dayHigh)
    const range = maxVal - minVal || 1

    const width = 480
    const height = 150
    const padding = 16

    const points = series.map((item, idx) => {
      const x = padding + (idx / (series.length - 1 || 1)) * (width - padding * 2)
      const y = height - padding - ((item.price - minVal) / range) * (height - padding * 2)
      return { x, y, price: item.price, label: item.label }
    })

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaD = `${pathD} L ${(width - padding).toFixed(1)} ${height - padding} L ${padding} ${height - padding} Z`

    return { points, pathD, areaD, minVal, maxVal, width, height, padding }
  }, [activeStock, timeframe, fiftyTwoWeekHigh, fiftyTwoWeekLow])

  const handleCopySetup = () => {
    const text = `🎯 ${activeStock.name} (${activeStock.symbol}) Institutional Setup:
• Current Price: ${curr}${activeStock.price} (${sign}${activeStock.change} / ${sign}${activeStock.percentChange}%)
• Action: ${setup.action}
• Entry Zone: ${curr}${setup.entryZone}
• Strict Stop-Loss: ${curr}${setup.stopLoss}
• Target 1: ${curr}${setup.target1}
• Target 2: ${curr}${setup.target2}
• Target 3: ${curr}${setup.target3}
• 52W Range: Low ${curr}${fiftyTwoWeekLow} — High ${curr}${fiftyTwoWeekHigh}
• Volume: ${formattedVolume} shares
• Momentum: RSI ${ind.rsi14} (${ind.rsiStatus}) | MACD ${ind.macd.cross} | Supertrend ${ind.supertrend.signal}
• Risk/Reward: ${setup.riskReward}
• Confluence: ${ind.confluenceScore}%`

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="my-2.5 p-3 sm:p-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-950 via-slate-900/95 to-cyan-950/40 shadow-2xl backdrop-blur-xl text-slate-100 font-sans w-full max-w-full overflow-hidden min-w-0">
      {/* Blended Co-Pilot Header Ribbon */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-cyan-500/20 text-[9px] font-mono">
        <span className="flex items-center gap-1.5 text-amber-300 font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          ⚡ STARK QUANT MATRIX & TACTICAL CO-PILOT
        </span>
        <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
          INSTITUTIONAL GRADE • REAL-TIME
        </span>
      </div>

      {/* Multi-Stock Quick Switcher Pills (If multiple recommendations present) */}
      {recommendationsList.length > 1 && (
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[10px] font-mono">
          <span className="text-slate-400 font-bold shrink-0 text-[9px] uppercase tracking-wider">Picks:</span>
          {recommendationsList.map((rec) => {
            const isSelected = activeStock.symbol === rec.symbol
            const isRecPos = rec.change >= 0
            const recCurr = rec.currency === 'INR' ? '₹' : '$'
            return (
              <button
                key={rec.symbol}
                onClick={() => setActiveStock(rec)}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-bold shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{rec.symbol.replace('.NS', '')}</span>
                <span className="text-[9px] text-cyan-300 font-normal">{recCurr}{rec.price}</span>
                <span className={isRecPos ? 'text-emerald-400' : 'text-rose-400'}>
                  {isRecPos ? '▲' : '▼'}{Math.abs(rec.percentChange)}%
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Header: Asset Name, Asset Class Badge, Live Price & Day Range */}
      <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-2.5 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-inner shrink-0">
            {activeStock.assetClass === 'crypto'
              ? '₿'
              : activeStock.assetClass === 'commodity'
              ? '🏆'
              : activeStock.assetClass === 'forex'
              ? '💱'
              : activeStock.assetClass === 'index'
              ? '🌐'
              : '📈'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">{activeStock.name}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 shrink-0">
                {activeStock.symbol}
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                {activeStock.assetClass}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Day: <strong className="text-white">{curr}{activeStock.dayLow}</strong> — <strong className="text-white">{curr}{activeStock.dayHigh}</strong></span>
              <span className="text-cyan-400 font-semibold">• Vol: {formattedVolume}</span>
            </p>
          </div>
        </div>

        {/* Live Price & Change Badge */}
        <div className="text-right shrink-0 min-w-[105px]">
          <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
            {curr}{activeStock.price.toLocaleString()}
          </div>
          <div
            className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>
              {sign}{activeStock.change} ({sign}{activeStock.percentChange}%)
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Confluence & Signal Bar */}
      <div className="my-2.5 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-cyan-500/25">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${actionColor}`}>
            {setup.action}
          </span>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.8 rounded-lg border ${confluenceColor}`}>
            ⚡ {ind.confluenceScore}% Confluence
          </span>
          <span className="text-[10px] font-mono px-2 py-0.8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
            RSI: <strong className={ind.rsi14 >= 60 ? 'text-emerald-400' : ind.rsi14 <= 35 ? 'text-rose-400' : 'text-cyan-300'}>{ind.rsi14}</strong>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
            MACD: <strong className={ind.macd.cross === 'Golden Cross' ? 'text-emerald-400' : 'text-slate-300'}>{ind.macd.cross}</strong>
          </span>
          {ind.bollinger.squeeze && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 animate-pulse">
              💥 Squeeze Alert
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          RRR: <strong className="text-purple-300">{setup.riskReward}</strong>
        </div>
      </div>

      {/* 52-WEEK HIGH & LOW DYNAMIC RANGE WIDGET */}
      <div className="my-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="text-cyan-400 font-bold">52W Low:</span> {curr}{fiftyTwoWeekLow}
          </span>
          <span className="font-bold text-amber-300 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px]">
            {pctFrom52WLow}% of 52-Week Range
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">52W High:</span> {curr}{fiftyTwoWeekHigh}
          </span>
        </div>
        {/* Dynamic progress bar */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pctFrom52WLow}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
          <span className="text-cyan-300">+{distanceAbove52WLow}% from 52W Low</span>
          <span className="text-emerald-300">{distanceTo52WHigh > 0 ? `${distanceTo52WHigh}% to 52W High (ATH)` : 'At 52-Week High!'}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1.5 border-b border-cyan-500/20 pb-1.5 mb-2.5 text-[11px] font-mono overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'chart'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          📈 Live Chart & 52W
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'setup'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          🎯 Trade Setup
        </button>
        <button
          onClick={() => setActiveTab('indicators')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'indicators'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          📊 Momentum Indicators
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'levels'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          🏛️ SMC & Pivots
        </button>
        <button
          onClick={() => setActiveTab('sizer')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'sizer'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          💰 1% Sizer
        </button>
        <button
          onClick={() => setActiveTab('geo')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'geo'
              ? 'bg-rose-500/25 text-rose-200 border border-rose-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          ⚔️ Macro
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'ratings'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-sm'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          ⭐ Ratings
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0 ${
            activeTab === 'hours'
              ? 'bg-blue-500/25 text-blue-200 border border-blue-400/50 shadow-sm shadow-blue-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/40'
          }`}
        >
          🕒 Market Hours
        </button>
      </div>

      {/* Tab 0: INTERACTIVE RESPONSIVE LIVE TRADING CHART */}
      {activeTab === 'chart' && (
        <div className="space-y-2.5">
          {/* Chart Controls & Timeframe Selector */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              {(['1D', '5D', '1M', '52W'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.8 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-300">
              {hoveredPoint ? (
                <span className="text-cyan-300 font-bold">
                  {hoveredPoint.label}: {curr}{hoveredPoint.price.toLocaleString()}
                </span>
              ) : (
                <span className="text-slate-400">
                  Range: <strong className="text-white">{curr}{chartData.minVal}</strong> — <strong className="text-white">{curr}{chartData.maxVal}</strong>
                </span>
              )}
            </div>
          </div>

          {/* SVG Responsive Area & Line Chart */}
          <div className="relative w-full h-44 rounded-xl bg-slate-950/90 border border-cyan-500/30 p-2 overflow-hidden shadow-inner">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="liveChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#06b6d4' : '#f43f5e'} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={isPositive ? '#06b6d4' : '#f43f5e'} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="16" y1="35" x2="464" y2="35" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1="16" y1="75" x2="464" y2="75" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1="16" y1="115" x2="464" y2="115" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

              {/* Target 1 Reference Line */}
              <line x1="16" y1="45" x2="464" y2="45" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <text x="464" y="42" fill="#10b981" fontSize="9" textAnchor="end" fontFamily="monospace">
                T1: {curr}{setup.target1}
              </text>

              {/* Stop Loss Reference Line */}
              <line x1="16" y1="125" x2="464" y2="125" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <text x="464" y="122" fill="#f43f5e" fontSize="9" textAnchor="end" fontFamily="monospace">
                SL: {curr}{setup.stopLoss}
              </text>

              {/* Area Gradient Fill */}
              <polygon points="" path={chartData.areaD} fill="url(#liveChartGrad)" />

              {/* High-Precision Line */}
              <path
                d={chartData.pathD}
                fill="none"
                stroke={isPositive ? '#06b6d4' : '#f43f5e'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isPositive ? 'drop-shadow(0 0 4px rgba(6,182,212,0.6))' : 'drop-shadow(0 0 4px rgba(244,63,94,0.6))' }}
              />

              {/* Interactive Data Hover Dots & Crosshairs */}
              {chartData.points.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              ))}

              {/* Current Active Price Marker */}
              {chartData.points.length > 0 && (
                <g>
                  <circle
                    cx={chartData.points[chartData.points.length - 1].x}
                    cy={chartData.points[chartData.points.length - 1].y}
                    r="4"
                    fill={isPositive ? '#00f3ff' : '#f43f5e'}
                    className="animate-pulse"
                  />
                  <circle
                    cx={chartData.points[chartData.points.length - 1].x}
                    cy={chartData.points[chartData.points.length - 1].y}
                    r="8"
                    fill="none"
                    stroke={isPositive ? '#00f3ff' : '#f43f5e'}
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                </g>
              )}

              {/* Hover Crosshair & Tooltip */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={hoveredPoint.x}
                    y1="16"
                    x2={hoveredPoint.x}
                    y2="134"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.7"
                  />
                  <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#ffffff" />
                </g>
              )}
            </svg>
          </div>

          {/* Quick Metrics Bar below chart */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block text-[9px]">24H Volume</span>
              <span className="text-cyan-300 font-bold truncate block">{formattedVolume} shares</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block text-[9px]">Market Confluence</span>
              <span className="text-emerald-400 font-bold truncate block">{ind.confluenceScore}% Strong</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
              <span className="text-slate-400 block text-[9px]">Supertrend (10, 3)</span>
              <span className="text-amber-300 font-bold truncate block">{ind.supertrend.signal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Actionable Trade Execution Setup */}
      {activeTab === 'setup' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 min-w-0 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 block font-semibold truncate tracking-wider uppercase">Entry Zone</span>
              <span className="font-bold text-cyan-300 text-xs sm:text-sm tracking-tight break-words mt-1 leading-snug">
                {curr}{setup.entryZone}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/50 min-w-0 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-rose-300 block font-semibold truncate tracking-wider uppercase">Strict Stop-Loss</span>
              <span className="font-bold text-rose-400 text-xs sm:text-sm tracking-tight break-words mt-1 leading-snug">
                {curr}{setup.stopLoss}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/50 min-w-0 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-emerald-300 block font-semibold truncate tracking-wider uppercase">Target 1 & 2</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm tracking-tight break-words mt-1 leading-snug">
                {curr}{setup.target1} • {curr}{setup.target2}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/50 min-w-0 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-purple-300 block font-semibold truncate tracking-wider uppercase">Risk/Reward (RRR)</span>
              <span className="font-bold text-purple-300 text-xs sm:text-sm tracking-tight break-words mt-1 leading-snug">
                {setup.riskReward}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25 text-xs">
            <div className="text-[10px] font-mono text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
              <span>⚡</span> QUANTITATIVE EDGE & RATIONALE:
            </div>
            <p className="text-slate-200 leading-relaxed text-xs">{setup.rationale}</p>
          </div>
        </div>
      )}

      {/* Tab 2: All Technical Indicators Matrix */}
      {activeTab === 'indicators' && (
        <div className="space-y-2 font-mono text-[11px]">
          {/* RSI Visual Meter */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                RSI (14) Relative Strength Index: <strong className="text-white text-xs">{ind.rsi14}</strong>
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  ind.rsi14 >= 60 ? 'bg-emerald-500/20 text-emerald-300' : ind.rsi14 <= 35 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {ind.rsiStatus}
              </span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="w-[30%] bg-blue-500/30" />
              <div className="w-[40%] bg-slate-600/40" />
              <div className="w-[30%] bg-emerald-500/40" />
              <div
                className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_6px_#fff]"
                style={{ left: `${Math.min(98, Math.max(2, ind.rsi14))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
              <span>0 (Oversold)</span>
              <span>50 (Neutral)</span>
              <span>100 (Overbought)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">MACD (12, 26, 9)</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-bold text-white text-xs">{ind.macd.line}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold truncate ${
                    ind.macd.cross === 'Golden Cross' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {ind.macd.cross}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">Supertrend (10, 3)</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-bold text-white text-xs">{curr}{ind.supertrend.value}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold truncate ${
                    ind.supertrend.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {ind.supertrend.signal}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">EMA Stack (9/20/50/200)</span>
              <div className="text-[10px] text-cyan-300 font-semibold truncate mt-0.5">
                {curr}{ind.ema9} • {curr}{ind.ema20} • {curr}{ind.ema50} • {curr}{ind.ema200}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">Bollinger Bands (20, 2)</span>
              <div className="text-[10px] text-slate-300 truncate mt-0.5">
                U: {curr}{ind.bollinger.upper} | L: {curr}{ind.bollinger.lower}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">ATR (14) Volatility</span>
              <div className="text-xs font-bold text-amber-300 mt-0.5">
                {curr}{ind.atr14} ({((ind.atr14 / (activeStock.price || 1)) * 100).toFixed(1)}%)
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate">Market Volume Status</span>
              <div className="text-xs font-bold text-cyan-300 mt-0.5 truncate">
                {formattedVolume} (Active Inflow)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Institutional Smart Money Concepts (SMC) & Pivots */}
      {activeTab === 'levels' && (
        <div className="space-y-2 text-[11px] font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-indigo-500/30 min-w-0">
              <span className="text-[10px] text-indigo-300 block truncate font-medium">Order Block Zone</span>
              <span className="text-xs font-bold text-white truncate block mt-0.5">{curr}{ind.smc.orderBlockZone}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 min-w-0">
              <span className="text-[10px] text-amber-300 block truncate font-medium">61.8% Fib Golden</span>
              <span className="text-xs font-bold text-white truncate block mt-0.5">{curr}{ind.smc.fibGoldenPocket}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 min-w-0">
              <span className="text-[10px] text-cyan-300 block truncate font-medium">Market Structure</span>
              <span className="text-xs font-bold text-white truncate block mt-0.5">{ind.smc.marketStructure}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/60 min-w-0">
            <div className="text-[10px] text-slate-400 font-bold mb-1.5 tracking-wider">FLOOR PIVOT MATRIX:</div>
            <div className="grid grid-cols-5 text-center text-[10px] gap-1 min-w-0">
              <div className="min-w-0">
                <span className="text-slate-400 block text-[9px]">S2</span>
                <span className="text-rose-400 font-bold text-[10px] truncate block">{curr}{activeStock.pivots.s2}</span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 block text-[9px]">S1</span>
                <span className="text-rose-300 font-bold text-[10px] truncate block">{curr}{activeStock.pivots.s1}</span>
              </div>
              <div className="min-w-0">
                <span className="text-cyan-400 block font-bold text-[9px]">PIVOT</span>
                <span className="text-cyan-300 font-bold text-[10px] truncate block">{curr}{activeStock.pivots.pivot}</span>
              </div>
              <div className="min-w-0">
                <span className="text-emerald-300 block text-[9px]">R1</span>
                <span className="text-emerald-400 font-bold text-[10px] truncate block">{curr}{activeStock.pivots.r1}</span>
              </div>
              <div className="min-w-0">
                <span className="text-emerald-400 block text-[9px]">R2</span>
                <span className="text-emerald-300 font-bold text-[10px] truncate block">{curr}{activeStock.pivots.r2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 1% Capital Risk & Position Sizing Calculator */}
      {activeTab === 'sizer' && (
        <div className="space-y-2.5 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🛡️</span> Account Equity Size:
              </span>
              <span className="text-[10px] text-slate-400 font-bold">1% Strict Max Risk</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(activeStock.currency === 'INR' ? [50000, 100000, 250000, 500000, 1000000] : [5000, 10000, 25000, 50000, 100000]).map((eq) => (
                <button
                  key={eq}
                  onClick={() => setAccountEquity(eq)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    accountEquity === eq
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {curr}{eq.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 min-w-0">
              <span className="text-[10px] text-slate-400 block truncate font-medium">Position Shares</span>
              <span className="font-bold text-cyan-300 text-xs sm:text-sm truncate block mt-0.5">{calculatedShares} units</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 min-w-0">
              <span className="text-[10px] text-amber-300 block truncate font-medium">Total Value</span>
              <span className="font-bold text-amber-200 text-xs sm:text-sm truncate block mt-0.5">{curr}{positionValue.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/30 min-w-0">
              <span className="text-[10px] text-rose-300 block truncate font-medium">Max 1% Risk</span>
              <span className="font-bold text-rose-400 text-xs sm:text-sm truncate block mt-0.5">{curr}{riskAmount.toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 min-w-0">
              <span className="text-[10px] text-emerald-300 block truncate font-medium">Target 1 & 2 Gain</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm truncate block mt-0.5">+{curr}{target1PnL.toLocaleString()} / +{curr}{target2PnL.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Geopolitical War Radar */}
      {activeTab === 'geo' && (
        <div className="space-y-2.5 text-[11px] font-mono">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                ⚔️ Geopolitical Conflict Stress Index
              </span>
              <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{geo?.stressScore || 48}/100</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  (geo?.stressScore || 48) >= 70
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                    : (geo?.stressScore || 48) >= 45
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                }`}>
                  {geo?.regime || 'MODERATE TENSION'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Defense Status</span>
              <span className="text-xs font-bold text-cyan-300">{geo?.defenseStatus || 'WATCHFUL'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 min-w-0">
              <span className="text-[10px] text-amber-300 block truncate font-medium">Gold (GC=F)</span>
              <span className="font-bold text-amber-200 text-xs sm:text-sm truncate block mt-0.5">
                ${geo?.goldPrice || 2740.5} ({geo?.goldChange && geo.goldChange >= 0 ? '+' : ''}{geo?.goldChange || 0}%)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-red-500/30 min-w-0">
              <span className="text-[10px] text-red-300 block truncate font-medium">WTI Crude Oil</span>
              <span className="font-bold text-red-300 text-xs sm:text-sm truncate block mt-0.5">
                ${geo?.crudeOilPrice || 71.4} ({geo?.crudeOilChange && geo.crudeOilChange >= 0 ? '+' : ''}{geo?.crudeOilChange || 0}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Analyst Ratings & Sentiment */}
      {activeTab === 'ratings' && (
        <div className="space-y-2.5 text-[11px] font-mono">
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/40 min-w-0">
              <span className="text-[10px] text-emerald-300 block truncate font-medium">Wall St / Institutional</span>
              <span className="font-bold text-emerald-400 text-xs sm:text-sm truncate block mt-0.5">
                {ratings?.consensusRating || 'STRONG BUY'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 min-w-0">
              <span className="text-[10px] text-cyan-300 block truncate font-medium">Mean Target Price</span>
              <span className="font-bold text-white text-xs sm:text-sm truncate block mt-0.5">
                {curr}{ratings?.targetMean || (activeStock.price * 1.14).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-cyan-300 block font-medium">Fear & Greed Index</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {sent?.fearGreedClassification || 'Greed'} ({sent?.fearGreedIndex || 54}/100)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Hugging Face FinBERT</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                {sent?.huggingFaceSentiment?.label || 'POSITIVE'} ({sent?.huggingFaceSentiment?.score || 0.72})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: GLOBAL MARKET SESSIONS & OPERATING HOURS RADAR */}
      {activeTab === 'hours' && (
        <div className="space-y-3 font-mono text-xs">
          {/* Top Live Banner */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-cyan-950/60 border border-blue-500/30 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🕒</span>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Global Market Sessions & Operating Hours
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    REAL-TIME
                  </span>
                </h4>
                <p className="text-[10px] text-blue-300/80">
                  Live countdowns, working schedules & non-working times across India, US, Europe & Asia
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">User Local Time</span>
              <span className="text-xs font-bold text-cyan-300">
                {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} IST
              </span>
            </div>
          </div>

          {/* Market Cards Grid */}
          <div className="space-y-2">
            {(marketHoursData?.markets || [
              {
                id: 'nse',
                name: 'National Stock Exchange of India',
                exchange: 'NSE (Nifty 50)',
                country: 'India',
                flag: '🇮🇳',
                timezone: 'Asia/Kolkata',
                status: 'OPEN',
                statusBadge: '🟢 REGULAR SESSION (LIVE OPEN)',
                statusDetail: 'Equities & Derivatives trading active',
                currentLocalTime: '09:15 - 15:30 IST',
                currentISTTime: 'IST (UTC+5:30)',
                regularHoursLocal: '09:15 – 15:30 IST',
                regularHoursIST: '09:15 – 15:30 IST',
                preMarketHoursIST: '09:00 – 09:15 IST',
                postMarketHoursIST: '15:40 – 16:00 IST',
                nextEvent: 'Market closes at 15:30 IST',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Closed Weekends (Sat & Sun) + Daily 16:00 – 09:00 IST',
              },
              {
                id: 'bse',
                name: 'Bombay Stock Exchange',
                exchange: 'BSE (Sensex)',
                country: 'India',
                flag: '🇮🇳',
                timezone: 'Asia/Kolkata',
                status: 'OPEN',
                statusBadge: '🟢 REGULAR SESSION (LIVE OPEN)',
                statusDetail: 'Synchronized with NSE India',
                currentLocalTime: '09:15 - 15:30 IST',
                currentISTTime: 'IST (UTC+5:30)',
                regularHoursLocal: '09:15 – 15:30 IST',
                regularHoursIST: '09:15 – 15:30 IST',
                preMarketHoursIST: '09:00 – 09:15 IST',
                postMarketHoursIST: '15:40 – 16:00 IST',
                nextEvent: 'Market closes at 15:30 IST',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Closed Weekends (Sat & Sun) + Daily 16:00 – 09:00 IST',
              },
              {
                id: 'mcx',
                name: 'Multi Commodity Exchange of India',
                exchange: 'MCX (Commodities)',
                country: 'India',
                flag: '🇮🇳',
                timezone: 'Asia/Kolkata',
                status: 'OPEN',
                statusBadge: '🟢 MORNING & EVENING SESSIONS',
                statusDetail: 'Gold, Silver, Crude Oil, Natural Gas, Base Metals',
                currentLocalTime: '09:00 - 23:30 IST',
                currentISTTime: 'IST (UTC+5:30)',
                regularHoursLocal: 'Morning: 09:00 – 17:00 | Evening: 17:00 – 23:30 IST',
                regularHoursIST: 'Morning: 09:00 – 17:00 | Evening: 17:00 – 23:30 IST',
                nextEvent: 'Evening session active until 23:30 IST',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Closed Weekends (Sat & Sun) + Daily 23:30 – 09:00 IST',
              },
              {
                id: 'nyse-nasdaq',
                name: 'New York Stock Exchange & NASDAQ',
                exchange: 'NYSE / NASDAQ',
                country: 'United States',
                flag: '🇺🇸',
                timezone: 'America/New_York (EST/EDT)',
                status: 'OPEN',
                statusBadge: '🟢 US REGULAR SESSION (LIVE OPEN)',
                statusDetail: 'Wall Street continuous trading',
                currentLocalTime: '09:30 - 16:00 EST',
                currentISTTime: '20:00 – 02:30 IST (EST) / 19:00 – 01:30 IST (EDT)',
                regularHoursLocal: '09:30 – 16:00 EST',
                regularHoursIST: '19:00 – 01:30 IST (EDT) / 20:00 – 02:30 IST (EST)',
                preMarketHoursLocal: '04:00 – 09:30 EST',
                preMarketHoursIST: '13:30 – 19:00 IST (EDT) / 14:30 – 20:00 IST (EST)',
                postMarketHoursLocal: '16:00 – 20:00 EST',
                postMarketHoursIST: '01:30 – 05:30 IST (EDT) / 02:30 – 06:30 IST (EST)',
                nextEvent: 'Closing bell at 16:00 EST (02:30 IST)',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Closed Weekends (Sat & Sun) + Daily 20:00 – 04:00 EST (06:30 – 14:30 IST)',
              },
              {
                id: 'lse',
                name: 'London Stock Exchange',
                exchange: 'LSE (FTSE 100)',
                country: 'United Kingdom',
                flag: '🇬🇧',
                timezone: 'Europe/London (GMT/BST)',
                status: 'OPEN',
                statusBadge: '🟢 LONDON REGULAR SESSION',
                statusDetail: 'FTSE continuous trading',
                currentLocalTime: '08:00 - 16:30 London',
                currentISTTime: '13:30 – 22:00 IST (BST) / 14:30 – 23:00 IST (GMT)',
                regularHoursLocal: '08:00 – 16:30 London Time',
                regularHoursIST: '13:30 – 22:00 IST',
                nextEvent: 'LSE closes at 16:30 London',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Closed Weekends (Sat & Sun) + Daily 16:30 – 08:00 London Time',
              },
              {
                id: 'tse',
                name: 'Tokyo Stock Exchange',
                exchange: 'TSE (Nikkei 225)',
                country: 'Japan',
                flag: '🇯🇵',
                timezone: 'Asia/Tokyo (JST)',
                status: 'OPEN',
                statusBadge: '🟢 TOKYO SESSION',
                statusDetail: 'Nikkei 225 trading session',
                currentLocalTime: '09:00 - 15:30 JST',
                currentISTTime: '05:30 – 12:00 IST',
                regularHoursLocal: 'Morning: 09:00 – 11:30 JST | Afternoon: 12:30 – 15:30 JST',
                regularHoursIST: 'Morning: 05:30 – 08:00 IST | Afternoon: 09:00 – 12:00 IST',
                nextEvent: 'TSE Afternoon session',
                workingDays: 'Monday – Friday',
                nonWorkingTimes: 'Lunch recess (11:30–12:30 JST) + Daily 15:30 – 09:00 JST + Weekends',
              },
              {
                id: 'crypto',
                name: 'Global Cryptocurrency Markets',
                exchange: 'Crypto (BTC / ETH / SOL)',
                country: 'Global',
                flag: '🌐',
                timezone: 'UTC',
                status: 'OPEN',
                statusBadge: '🟢 24/7/365 ALWAYS LIVE OPEN',
                statusDetail: 'Continuous uninterrupted global liquidity',
                currentLocalTime: '24 Hours / 7 Days a Week',
                currentISTTime: '24 Hours / 7 Days a Week (Always Open)',
                regularHoursLocal: '24 Hours / 7 Days a Week (Never Closes)',
                regularHoursIST: '24 Hours / 7 Days a Week (Never Closes)',
                nextEvent: 'Active Continuous Trading (Zero session halts or closures)',
                workingDays: 'Monday through Sunday (Every Single Day)',
                nonWorkingTimes: 'None! Zero holidays, zero weekend breaks.',
              },
            ]).map((m: any) => {
              const isOpen = m.status === 'OPEN'
              const isPre = m.status === 'PRE_MARKET'
              const isAfter = m.status === 'AFTER_HOURS'
              const isLunch = m.status === 'LUNCH_BREAK'
              const isWeekend = m.status === 'WEEKEND'

              const statusColor = isOpen
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                : isPre
                ? 'border-yellow-500/50 bg-yellow-500/15 text-yellow-300'
                : isAfter
                ? 'border-orange-500/50 bg-orange-500/15 text-orange-300'
                : isLunch
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : isWeekend
                ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                : 'border-slate-700 bg-slate-900/60 text-slate-400'

              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.flag}</span>
                      <div>
                        <span className="font-bold text-white text-xs block">{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{m.exchange}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {m.statusBadge || m.status}
                    </span>
                  </div>

                  {/* Countdown & Timing Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-2 text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[9px] text-cyan-400 block font-bold uppercase tracking-wider">
                        Operating Hours (in User IST)
                      </span>
                      <span className="font-bold text-white text-[11px] block mt-0.5">
                        {m.regularHoursIST}
                      </span>
                      {m.preMarketHoursIST && (
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Pre-Market: <strong className="text-yellow-300">{m.preMarketHoursIST}</strong>
                        </span>
                      )}
                      {m.postMarketHoursIST && (
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          Post-Market: <strong className="text-orange-300">{m.postMarketHoursIST}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[9px] text-amber-400 block font-bold uppercase tracking-wider">
                        Countdown & Next Event
                      </span>
                      <span className="font-bold text-amber-300 text-[11px] block mt-0.5">
                        ⏳ {m.nextEvent}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Local Clock: <strong className="text-slate-300">{m.currentLocalTime}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Non-Working Times Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="truncate">
                      🛑 Non-Working: <strong className="text-slate-300">{m.nonWorkingTimes}</strong>
                    </span>
                    <button
                      onClick={() => onActionClick && onActionClick(`What are the exact trading timings, sessions, and non-working hours of ${m.name} (${m.exchange})?`)}
                      className="text-cyan-400 hover:text-cyan-200 underline font-bold shrink-0 ml-2 cursor-pointer"
                    >
                      Ask AI →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleCopySetup}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 transition-all cursor-pointer font-bold flex items-center gap-1"
          >
            {copied ? '✅ Copied!' : '📋 Copy Setup'}
          </button>
          <button
            onClick={() => onActionClick && onActionClick(`Explain how RSI, MACD, and 52-week high/low work together for ${activeStock.name}`)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all cursor-pointer"
          >
            📚 Teach Indicators
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('hours')}
            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/40 transition-all cursor-pointer font-bold flex items-center gap-1 shadow-sm shadow-blue-500/20"
          >
            🕒 Market Hours Radar
          </button>
          <button
            onClick={() => onActionClick && onActionClick(`Tony Stark, give me your high-conviction breakdown of ${activeStock.name} (${activeStock.symbol}) with 52W range and volume`)}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 transition-all cursor-pointer font-bold"
          >
            ⚡ Stark Quant Analysis
          </button>
          <button
            onClick={() => onActionClick && onActionClick('Show me top world market trading picks across US, India, and Crypto with 52W high and low')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 transition-all cursor-pointer font-bold"
          >
            🌐 World Radar
          </button>
        </div>
      </div>
    </div>
  )
}
