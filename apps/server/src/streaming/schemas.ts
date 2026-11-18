import { z } from 'zod'

/**
 * Event Streaming Topics & JSON/Zod Schemas for GF-AI Jarvis Trade
 * ─────────────────────────────────────────────────────────────────
 * Topics:
 * - market.ticks
 * - market.ohlcv.1m
 * - news.raw
 * - signals.generated
 * - alerts.triggered
 */

export const TOPICS = {
  MARKET_TICKS: 'market.ticks',
  MARKET_OHLCV_1M: 'market.ohlcv.1m',
  NEWS_RAW: 'news.raw',
  SIGNALS_GENERATED: 'signals.generated',
  ALERTS_TRIGGERED: 'alerts.triggered',
} as const

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS]

export const MarketTickSchema = z.object({
  symbol: z.string().min(1),
  price: z.number().positive(),
  volume: z.number().nonnegative(),
  bid: z.number().positive().optional(),
  ask: z.number().positive().optional(),
  timestamp: z.number().int().positive(),
  source: z.string(),
  exchange: z.string().default('NSE'),
})

export type MarketTickEvent = z.infer<typeof MarketTickSchema>

export const MarketOhlcvSchema = z.object({
  symbol: z.string().min(1),
  interval: z.literal('1m'),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
  vwap: z.number().positive().optional(),
  bucketStart: z.number().int().positive(),
  bucketEnd: z.number().int().positive(),
  source: z.string(),
})

export type MarketOhlcvEvent = z.infer<typeof MarketOhlcvSchema>

export const NewsRawSchema = z.object({
  id: z.string(),
  headline: z.string().min(1),
  summary: z.string(),
  source: z.string(),
  url: z.string().url(),
  publishedAt: z.number().int().positive(),
  category: z.enum(['finance', 'ai', 'tech', 'economy', 'general']),
  symbols: z.array(z.string()).default([]),
})

export type NewsRawEvent = z.infer<typeof NewsRawSchema>

export const SignalGeneratedSchema = z.object({
  signalId: z.string(),
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '1d', 'swing']),
  direction: z.enum(['LONG', 'SHORT']),
  entryZone: z.string(),
  target1: z.number().positive(),
  target2: z.number().positive().optional(),
  stopLoss: z.number().positive(),
  confidence: z.number().min(0).max(100),
  rationale: z.string(),
  strategy: z.string(),
  generatedAt: z.number().int().positive(),
  disclaimer: z.string().default('Educational analysis only. Not SEBI registered advice.'),
})

export type SignalGeneratedEvent = z.infer<typeof SignalGeneratedSchema>

export const AlertTriggeredSchema = z.object({
  alertId: z.string(),
  userId: z.string(),
  symbol: z.string(),
  triggerType: z.enum(['PRICE_CROSS', 'SL_HIT', 'TP_HIT', 'UNUSUAL_VOLUME', 'NEWS_BREAK']),
  message: z.string(),
  triggeredPrice: z.number().positive(),
  triggeredAt: z.number().int().positive(),
})

export type AlertTriggeredEvent = z.infer<typeof AlertTriggeredSchema>
