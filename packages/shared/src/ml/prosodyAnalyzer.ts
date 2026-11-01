import type { ProsodyFeatures } from './types.js'

export class ProsodyAnalyzer {
  /**
   * Analyzes an audio buffer or text-timing tokens locally without saving audio to disk.
   */
  static extractFeatures(audioData?: Float32Array, textDurationSec: number = 2.0): ProsodyFeatures {
    if (!audioData || audioData.length === 0) {
      return {
        rmsEnergy: 0.5,
        pitchVariation: 0.5,
        tempoWpm: 140,
        pauseDurationMs: 200,
      }
    }

    // Calculate RMS Energy
    let sumSq = 0
    for (let i = 0; i < audioData.length; i++) {
      sumSq += audioData[i] * audioData[i]
    }
    const rms = Math.sqrt(sumSq / audioData.length)
    const normalizedRms = Math.min(1.0, Math.max(0.0, rms * 5.0))

    // Estimate zero-crossing rate as proxy for pitch variation
    let zcr = 0
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0 && audioData[i - 1] < 0) || (audioData[i] < 0 && audioData[i - 1] >= 0)) {
        zcr++
      }
    }
    const normalizedPitch = Math.min(1.0, zcr / (audioData.length * 0.1))

    return {
      rmsEnergy: Number(normalizedRms.toFixed(2)),
      pitchVariation: Number(normalizedPitch.toFixed(2)),
      tempoWpm: Math.round(130 + normalizedPitch * 40),
      pauseDurationMs: 150,
    }
  }

  /**
   * Adjusts emotion intensity and arousal based on speech prosody hints.
   */
  static applyProsodyHint(baseIntensity: number, features: ProsodyFeatures): number {
    // High volume/pitch increases arousal and intensity
    const boost = (features.rmsEnergy - 0.5) * 0.3 + (features.pitchVariation - 0.5) * 0.2
    return Number(Math.min(1.0, Math.max(0.2, baseIntensity + boost)).toFixed(2))
  }
}
