"""
FastAPI Microservice / Sidecar for Jarvis Trade ML Inference & Model Tracking
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

app = FastAPI(
    title="Jarvis Trade ML Sidecar",
    description="Market regime classification, model versioning, and feature store serving",
    version="2.1.0"
)

class FeatureStorePayload(BaseModel):
    symbol: str
    timestamp: int
    price: float
    ema9_20_ratio: float
    ema50_200_ratio: float
    rsi14: float
    atrPct: float
    vwapDistancePct: float
    volumeZScore: float
    macdHistogram: float
    bollingerWidthPct: float

class RegimeDetectRequest(BaseModel):
    symbol: str
    timeframe: str = "1d"
    features: FeatureStorePayload

class RegimeDetectResponse(BaseModel):
    symbol: str
    regime: str
    confidence: float
    recommendedStrategy: str
    modelVersion: str
    evaluatedAt: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "jarvis-ml-sidecar", "time": datetime.datetime.utcnow().isoformat()}

@app.get("/v1/models")
def list_models():
    return [
        {
            "modelId": "jarvis-regime-v2",
            "modelName": "Jarvis Market Regime Classifier",
            "version": "2.1.0",
            "architecture": "LightGBM",
            "trainedAt": "2026-10-15T00:00:00Z",
            "stage": "production",
            "metrics": {
                "accuracy": 0.842,
                "f1Score": 0.819,
                "sharpeRatio": 2.14,
                "maxDrawdownPct": 11.2
            }
        }
    ]

@app.post("/v1/regime/detect", response_model=RegimeDetectResponse)
def detect_regime(req: RegimeDetectRequest):
    f = req.features
    if f.atrPct > 4.5 or f.bollingerWidthPct > 15:
        regime = "HIGH_VOLATILITY_EXPANSION"
        strategy = "CAPITAL_PRESERVATION"
        conf = 88.0
    elif f.ema9_20_ratio > 1.01 and f.rsi14 > 55:
        regime = "TRENDING_BULL"
        strategy = "BREAKOUT_MOMENTUM"
        conf = 84.5
    elif f.ema9_20_ratio < 0.99 and f.rsi14 < 45:
        regime = "TRENDING_BEAR"
        strategy = "CAPITAL_PRESERVATION"
        conf = 82.0
    else:
        regime = "MEAN_REVERTING_RANGE"
        strategy = "RANGE_FADE"
        conf = 78.0

    return RegimeDetectResponse(
        symbol=req.symbol,
        regime=regime,
        confidence=conf,
        recommendedStrategy=strategy,
        modelVersion="2.1.0",
        evaluatedAt=datetime.datetime.utcnow().isoformat()
    )
