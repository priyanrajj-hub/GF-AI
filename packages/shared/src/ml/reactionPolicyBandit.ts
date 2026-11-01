import type { DetectedEmotion, DetectedIntent, ReactionPolicyAction } from './types.js'

interface PolicyArm {
  id: string
  bodyAction: string
  movement: string
  expression: string
  voiceStyle: { rate: number; pitch: number }
  compatibleIntents: DetectedIntent[]
  weight: number
  pullCount: number
  rewardSum: number
}

export class ReactionPolicyBandit {
  private arms: PolicyArm[] = [
    {
      id: 'warm_bow',
      bodyAction: 'bow',
      movement: 'center',
      expression: 'happy',
      voiceStyle: { rate: 1.0, pitch: 1.05 },
      compatibleIntents: ['greeting', 'thanks', 'praise'],
      weight: 1.0,
      pullCount: 1,
      rewardSum: 1,
    },
    {
      id: 'enthusiastic_cheer',
      bodyAction: 'cheer',
      movement: 'step_forward',
      expression: 'excited',
      voiceStyle: { rate: 1.1, pitch: 1.15 },
      compatibleIntents: ['achievement', 'praise'],
      weight: 1.2,
      pullCount: 1,
      rewardSum: 1.2,
    },
    {
      id: 'playful_pout',
      bodyAction: 'pout',
      movement: 'lean_back',
      expression: 'tsundere',
      voiceStyle: { rate: 1.05, pitch: 1.1 },
      compatibleIntents: ['tease', 'joke'],
      weight: 1.1,
      pullCount: 1,
      rewardSum: 1.1,
    },
    {
      id: 'gentle_comfort',
      bodyAction: 'comfort',
      movement: 'lean_in',
      expression: 'sympathetic',
      voiceStyle: { rate: 0.92, pitch: 0.98 },
      compatibleIntents: ['sadness', 'stress'],
      weight: 1.3,
      pullCount: 1,
      rewardSum: 1.3,
    },
    {
      id: 'shy_tuck',
      bodyAction: 'tuck_hair',
      movement: 'step_back',
      expression: 'shy',
      voiceStyle: { rate: 0.95, pitch: 1.08 },
      compatibleIntents: ['flirt_light', 'praise'],
      weight: 1.0,
      pullCount: 1,
      rewardSum: 1.0,
    },
    {
      id: 'attentive_nod',
      bodyAction: 'nod',
      movement: 'idle_sway',
      expression: 'neutral',
      voiceStyle: { rate: 1.0, pitch: 1.0 },
      compatibleIntents: ['command', 'chit_chat', 'complaint'],
      weight: 1.0,
      pullCount: 1,
      rewardSum: 1.0,
    },
    {
      id: 'wave_goodbye',
      bodyAction: 'wave',
      movement: 'step_back',
      expression: 'warm',
      voiceStyle: { rate: 0.98, pitch: 1.02 },
      compatibleIntents: ['goodbye'],
      weight: 1.2,
      pullCount: 1,
      rewardSum: 1.2,
    },
  ]

  private epsilon: number = 0.15 // 15% exploration, 85% exploitation

  selectAction(intent: DetectedIntent, emotion: DetectedEmotion): ReactionPolicyAction {
    const compatible = this.arms.filter((a) => a.compatibleIntents.includes(intent))
    const pool = compatible.length > 0 ? compatible : this.arms

    let chosen: PolicyArm

    // Epsilon-greedy with exploration bounds
    if (Math.random() < this.epsilon) {
      // Explore random arm in pool
      chosen = pool[Math.floor(Math.random() * pool.length)]
    } else {
      // Exploit best arm
      chosen = pool.reduce((best, curr) => (curr.weight > best.weight ? curr : best), pool[0])
    }

    chosen.pullCount++

    // Enforce safety override: never allow extremes
    const safeRate = Math.min(1.2, Math.max(0.85, chosen.voiceStyle.rate))
    const safePitch = Math.min(1.25, Math.max(0.85, chosen.voiceStyle.pitch))

    return {
      bodyAction: chosen.bodyAction,
      movement: chosen.movement,
      expression: chosen.expression,
      voiceStyle: { rate: safeRate, pitch: safePitch },
      confidence: Number((chosen.weight / 2.0).toFixed(2)),
    }
  }

  recordFeedback(armId: string, reward: number): void {
    const arm = this.arms.find((a) => a.id === armId)
    if (arm) {
      arm.rewardSum += reward
      // Running average update
      const avgReward = arm.rewardSum / Math.max(1, arm.pullCount)
      // Clamped weight to prevent runaway drift
      arm.weight = Math.min(2.5, Math.max(0.2, avgReward))
    }
  }

  getArmWeights(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const a of this.arms) {
      result[a.id] = Number(a.weight.toFixed(2))
    }
    return result
  }
}
