import { z } from 'zod'

/**
 * Feature Store Schema for Jarvis Trade AI ML Models
 */
export const FeatureStoreSchema = z.object({
  symbol: z.string(),
  timestamp: z.number().int().positive(),
  price: z.number().positive(),
  ema9_20_ratio: z.number(),
  ema50_200_ratio: z.number(),
  rsi14: z.number().min(0).max(100),
  atrPct: z.number().nonnegative(),
  vwapDistancePct: z.number(),
  volumeZScore: z.number(),
  macdHistogram: z.number(),
  bollingerWidthPct: z.number(),
})

export type FeatureStoreRecord = z.infer<typeof FeatureStoreSchema>

/**
 * Market Regime Detection Contract
 */
export type MarketRegime =
  | 'TRENDING_BULL'
  | 'TRENDING_BEAR'
  | 'MEAN_REVERTING_RANGE'
  | 'HIGH_VOLATILITY_EXPANSION'

export interface RegimeDetectionRequest {
  symbol: string
  timeframe: string
  features: FeatureStoreRecord
}

export interface RegimeDetectionResponse {
  symbol: string
  regime: MarketRegime
  confidence: number
  recommendedStrategy: 'BREAKOUT_MOMENTUM' | 'PULLBACK_BUY' | 'RANGE_FADE' | 'CAPITAL_PRESERVATION'
  modelVersion: string
  evaluatedAt: string
}

/**
 * ML Model Versioning & Registry Metadata
 */
export interface MLModelMetadata {
  modelId: string
  modelName: string
  version: string
  architecture: 'LightGBM' | 'XGBoost' | 'PyTorch_LSTM' | 'Transformer_Encoder'
  trainedAt: string
  stage: 'production' | 'staging' | 'shadow' | 'deprecated'
  metrics: {
    accuracy: number
    f1Score: number
    sharpeRatio: number
    maxDrawdownPct: number
  }
}
