import React, { useState } from 'react'
import type { TradingCardData } from '@ada/shared'

interface TradingCardProps {
  card: TradingCardData
  onActionClick?: (prompt: string) => void
}

export const TradingCard: React.FC<TradingCardProps> = ({ card, onActionClick }) => {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'setup' | 'indicators' | 'levels' | 'sizer'>('setup')
  const [accountEquity, setAccountEquity] = useState<number>(card.currency === 'INR' ? 100000 : 10000)

  const curr = card.currency === 'INR' ? '₹' : '$'
  const isPositive = card.change >= 0
  const sign = isPositive ? '+' : ''
  const ind = card.indicators
  const setup = card.setup

  // 1% Capital Risk Calculations
  const riskAmount = Number((accountEquity * 0.01).toFixed(2))
  const riskPerShare = Math.max(0.1, Math.abs(card.price - setup.stopLoss))
  const calculatedShares = Math.max(1, Math.floor(riskAmount / riskPerShare))
  const positionValue = Number((calculatedShares * card.price).toFixed(2))
  const target1PnL = Number((calculatedShares * (setup.target1 - card.price)).toFixed(2))
  const target2PnL = Number((calculatedShares * (setup.target2 - card.price)).toFixed(2))

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

  // Generate SVG Sparkline Points
  const sparkline = card.sparkline || [card.price * 0.98, card.price * 0.99, card.price]
  const minP = Math.min(...sparkline)
  const maxP = Math.max(...sparkline)
  const rangeP = maxP - minP || 1
  const width = 240
  const height = 48
  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1 || 1)) * width
      const y = height - ((val - minP) / rangeP) * (height - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const handleCopySetup = () => {
    const text = `🎯 ${card.name} (${card.symbol}) Setup:
• Action: ${setup.action}
• Entry Zone: ${curr}${setup.entryZone}
• Stop-Loss (Strict): ${curr}${setup.stopLoss}
• Target 1: ${curr}${setup.target1}
• Target 2: ${curr}${setup.target2}
• Target 3: ${curr}${setup.target3}
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
    <div className="my-3 p-3.5 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-slate-950 via-slate-900/90 to-cyan-950/30 shadow-2xl backdrop-blur-xl text-slate-200 font-sans">
      {/* Blended Co-Pilot Header Ribbon */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-cyan-500/20 text-[9px] font-mono">
        <span className="flex items-center gap-1.5 text-amber-300 font-bold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          ⚡ STARK QUANTUM MATRIX & ADA RISK CO-PILOT
        </span>
        <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
          INSTITUTIONAL RADAR
        </span>
      </div>

      {/* Header: Asset Name, Asset Class Badge, Live Price */}
      <div className="flex items-start justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-inner">
            {card.assetClass === 'crypto'
              ? '₿'
              : card.assetClass === 'commodity'
              ? '🏆'
              : card.assetClass === 'forex'
              ? '💱'
              : card.assetClass === 'index'
              ? '🌐'
              : '📈'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">{card.name}</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-400/30 text-cyan-300">
                {card.symbol}
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {card.assetClass}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Day: {curr}{card.dayLow} - {curr}{card.dayHigh} • Vol: {(card.volume / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Live Price & Change Badge */}
        <div className="text-right">
          <div className="text-base font-bold font-mono text-white">
            {curr}{card.price.toLocaleString()}
          </div>
          <div
            className={`text-[11px] font-mono font-semibold flex items-center justify-end gap-1 ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>
              {sign}{card.change} ({sign}{card.percentChange}%)
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Confluence & Signal Bar */}
      <div className="my-2.5 flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-cyan-500/25">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${actionColor}`}>
            {setup.action}
          </span>
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.8 rounded-lg border ${confluenceColor}`}>
            ⚡ {ind.confluenceScore}% Confluence
          </span>
          {ind.bollinger.squeeze && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 animate-pulse">
              💥 Squeeze Breakout
            </span>
          )}
        </div>

        {/* Mini SVG Sparkline */}
        <div className="hidden sm:block">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 border-b border-cyan-500/20 pb-1 mb-2.5 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
            activeTab === 'setup'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 Trade Setup
        </button>
        <button
          onClick={() => setActiveTab('indicators')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
            activeTab === 'indicators'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 All Indicators ({ind.confluenceScore}%)
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
            activeTab === 'levels'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏛️ SMC & Pivots
        </button>
        <button
          onClick={() => setActiveTab('sizer')}
          className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
            activeTab === 'sizer'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💰 1% Risk Sizer
        </button>
      </div>

      {/* Tab 1: Actionable Trade Execution Setup */}
      {activeTab === 'setup' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Entry Zone</span>
              <span className="font-bold text-cyan-300 text-xs">{curr}{setup.entryZone}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-rose-500/30">
              <span className="text-[10px] text-rose-300 block">Strict Stop-Loss</span>
              <span className="font-bold text-rose-400 text-xs">{curr}{setup.stopLoss}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 block">Target 1 & 2</span>
              <span className="font-bold text-emerald-400 text-xs">
                {curr}{setup.target1} • {curr}{setup.target2}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-purple-500/30">
              <span className="text-[10px] text-purple-300 block">Risk/Reward (RRR)</span>
              <span className="font-bold text-purple-300 text-xs">{setup.riskReward}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-cyan-500/20 text-xs">
            <div className="text-[10px] font-mono text-cyan-300 font-bold mb-1">
              ⚡ QUANTITATIVE EDGE & RATIONALE:
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{setup.rationale}</p>
          </div>
        </div>
      )}

      {/* Tab 2: All Technical Indicators Matrix */}
      {activeTab === 'indicators' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">RSI (14)</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{ind.rsi14}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded ${
                  ind.rsi14 >= 60 ? 'bg-emerald-500/20 text-emerald-300' : ind.rsi14 <= 35 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {ind.rsiStatus}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">MACD (12, 26, 9)</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{ind.macd.line}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded ${
                  ind.macd.cross === 'Golden Cross' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {ind.macd.cross}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Supertrend (10, 3)</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">{curr}{ind.supertrend.value}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  ind.supertrend.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {ind.supertrend.signal}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">EMA Stack (9 / 20 / 50 / 200)</span>
            <div className="text-[10px] text-cyan-300 font-semibold truncate">
              {curr}{ind.ema9} • {curr}{ind.ema20} • {curr}{ind.ema50} • {curr}{ind.ema200}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">Bollinger Bands (20, 2)</span>
            <div className="text-[10px] text-slate-300 truncate">
              U: {curr}{ind.bollinger.upper} | L: {curr}{ind.bollinger.lower}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block">ATR (14) Volatility</span>
            <div className="text-xs font-bold text-amber-300">
              {curr}{ind.atr14} ({((ind.atr14 / (card.price || 1)) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Institutional Smart Money Concepts (SMC) & Pivots */}
      {activeTab === 'levels' && (
        <div className="space-y-2 text-[11px] font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-slate-900/70 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300 block">Order Block Zone</span>
              <span className="text-xs font-bold text-white">{curr}{ind.smc.orderBlockZone}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-amber-500/30">
              <span className="text-[10px] text-amber-300 block">61.8% Fib Golden Pocket</span>
              <span className="text-xs font-bold text-white">{curr}{ind.smc.fibGoldenPocket}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-cyan-500/30">
              <span className="text-[10px] text-cyan-300 block">Market Structure</span>
              <span className="text-xs font-bold text-white">{ind.smc.marketStructure}</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 font-bold mb-1">FLOOR PIVOT MATRIX:</div>
            <div className="grid grid-cols-5 text-center text-[10px]">
              <div>
                <span className="text-slate-400 block">S2</span>
                <span className="text-rose-400 font-bold">{curr}{card.pivots.s2}</span>
              </div>
              <div>
                <span className="text-slate-400 block">S1</span>
                <span className="text-rose-300 font-bold">{curr}{card.pivots.s1}</span>
              </div>
              <div>
                <span className="text-cyan-400 block font-bold">PIVOT</span>
                <span className="text-cyan-300 font-bold">{curr}{card.pivots.pivot}</span>
              </div>
              <div>
                <span className="text-emerald-300 block">R1</span>
                <span className="text-emerald-400 font-bold">{curr}{card.pivots.r1}</span>
              </div>
              <div>
                <span className="text-emerald-400 block">R2</span>
                <span className="text-emerald-300 font-bold">{curr}{card.pivots.r2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 1% Capital Risk & Kelly Position Sizing Calculator */}
      {activeTab === 'sizer' && (
        <div className="space-y-2.5 text-[11px] font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🛡️</span> Select Account Equity Size:
              </span>
              <span className="text-[10px] text-slate-400 font-bold">1% Strict Max Risk</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(card.currency === 'INR' ? [50000, 100000, 250000, 500000, 1000000] : [5000, 10000, 25000, 50000, 100000]).map((eq) => (
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">Position Shares</span>
              <span className="font-bold text-cyan-300 text-xs">{calculatedShares} units</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/30">
              <span className="text-[10px] text-amber-300 block">Total Value</span>
              <span className="font-bold text-amber-200 text-xs">{curr}{positionValue.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-rose-500/30">
              <span className="text-[10px] text-rose-300 block">Max 1% Risk</span>
              <span className="font-bold text-rose-400 text-xs">{curr}{riskAmount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 block">Target 1 & 2 Gain</span>
              <span className="font-bold text-emerald-400 text-xs">+{curr}{target1PnL.toLocaleString()} / +{curr}{target2PnL.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5 text-[10px]">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">⚡ Stark Quant Rule:</span>
              <span className="text-slate-300">
                &quot;Asymmetric {setup.riskReward} risk-reward guarantees that even with a 45% win rate, your expectancy is overwhelmingly positive. Honor the stop at {curr}{setup.stopLoss}.&quot;
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold shrink-0">👩‍💼 Ada Risk Discipline:</span>
              <span className="text-slate-300">
                &quot;Risking strictly 1% ({curr}{riskAmount.toLocaleString()}) means your account survives 20 consecutive losses with 81% capital intact. Never gamble on emotional revenge trades!&quot;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopySetup}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 transition-all cursor-pointer font-bold flex items-center gap-1"
          >
            {copied ? '✅ Copied to Clipboard!' : '📋 Copy Setup'}
          </button>
          <button
            onClick={() => onActionClick && onActionClick(`Explain how the RSI and MACD confluence works for ${card.name}`)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all cursor-pointer"
          >
            📚 Teach Indicators
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onActionClick && onActionClick(`Tony Stark, give me your high-conviction breakdown of ${card.name} (${card.symbol})`)}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 transition-all cursor-pointer font-bold"
          >
            ⚡ Stark Quant Analysis
          </button>
          <button
            onClick={() => onActionClick && onActionClick('Show me top world market trading picks across US, India, and Crypto')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 transition-all cursor-pointer font-bold"
          >
            🌐 World Radar
          </button>
        </div>
      </div>
    </div>
  )
}
