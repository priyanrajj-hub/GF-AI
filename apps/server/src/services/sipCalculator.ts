/**
 * Systematic Investment Plan (SIP) & Lumpsum Actuarial Calculator
 * ──────────────────────────────────────────────────────────────
 * Rigorous mathematical compounding engine supporting both effective annual rate
 * compounding (r = (1+annual)^(1/12)-1) and standard nominal convention,
 * with full Annuity-Due (beginning-of-month) and Ordinary Annuity toggles.
 */

export interface SipCalculationInput {
  monthlyInvestment: number
  annualReturnRatePct: number
  tenureYears: number
  annuityDue?: boolean // true = start of month (standard SIP), false = end of month
  effectiveCompounding?: boolean // true = (1+i)^(1/12)-1, false = i/12
  inflationRatePct?: number // optional inflation adjustment
}

export interface SipCalculationResult {
  monthlyInvestment: number
  annualReturnRatePct: number
  tenureYears: number
  totalMonths: number
  annuityDue: boolean
  effectiveCompounding: boolean
  monthlyRatePct: number
  totalInvested: number
  estimatedWealthGain: number
  futureValue: number
  inflationAdjustedFutureValue?: number
  formatted: {
    totalInvested: string
    estimatedWealthGain: string
    futureValue: string
    inflationAdjustedFutureValue?: string
  }
}

export class SipCalculator {
  /**
   * Calculates SIP Future Value with exact actuarial formulas.
   */
  static calculate(input: SipCalculationInput): SipCalculationResult {
    const P = Math.max(0, input.monthlyInvestment)
    const annualRate = input.annualReturnRatePct / 100
    const years = Math.max(0, input.tenureYears)
    const n = Math.round(years * 12)
    const annuityDue = input.annuityDue !== false // default true (payments at start of month)
    const effectiveCompounding = input.effectiveCompounding !== false // default true

    // Compute monthly rate
    let r: number
    if (annualRate === 0) {
      r = 0
    } else if (effectiveCompounding) {
      // Effective compound monthly rate: r = (1 + annual)^(1/12) - 1
      r = Math.pow(1 + annualRate, 1 / 12) - 1
    } else {
      // Nominal rate: r = annual / 12
      r = annualRate / 12
    }

    const totalInvested = Math.round(P * n)

    let futureValue: number
    if (r === 0 || n === 0) {
      futureValue = totalInvested
    } else {
      // Future Value of Annuity:
      // Ordinary Annuity: P * [ ((1 + r)^n - 1) / r ]
      // Annuity Due: Ordinary Annuity * (1 + r)
      const ordinaryFv = P * ((Math.pow(1 + r, n) - 1) / r)
      futureValue = Math.round(annuityDue ? ordinaryFv * (1 + r) : ordinaryFv)
    }

    const estimatedWealthGain = Math.max(0, futureValue - totalInvested)

    let inflationAdjustedFutureValue: number | undefined
    if (input.inflationRatePct && input.inflationRatePct > 0) {
      const inflationDec = input.inflationRatePct / 100
      inflationAdjustedFutureValue = Math.round(
        futureValue / Math.pow(1 + inflationDec, years)
      )
    }

    return {
      monthlyInvestment: P,
      annualReturnRatePct: input.annualReturnRatePct,
      tenureYears: years,
      totalMonths: n,
      annuityDue,
      effectiveCompounding,
      monthlyRatePct: Number((r * 100).toFixed(4)),
      totalInvested,
      estimatedWealthGain,
      futureValue,
      inflationAdjustedFutureValue,
      formatted: {
        totalInvested: `₹${totalInvested.toLocaleString('en-IN')}`,
        estimatedWealthGain: `₹${estimatedWealthGain.toLocaleString('en-IN')}`,
        futureValue: `₹${futureValue.toLocaleString('en-IN')}`,
        inflationAdjustedFutureValue: inflationAdjustedFutureValue
          ? `₹${inflationAdjustedFutureValue.toLocaleString('en-IN')}`
          : undefined,
      },
    }
  }

  /**
   * Calculates Lumpsum Compounding: FV = PV * (1 + r)^t
   */
  static calculateLumpsum(
    principal: number,
    annualReturnRatePct: number,
    tenureYears: number
  ) {
    const PV = Math.max(0, principal)
    const r = annualReturnRatePct / 100
    const t = Math.max(0, tenureYears)

    const futureValue = Math.round(PV * Math.pow(1 + r, t))
    const totalGain = futureValue - PV

    return {
      principal: PV,
      annualReturnRatePct,
      tenureYears: t,
      totalInvested: PV,
      estimatedWealthGain: totalGain,
      futureValue,
      formatted: {
        totalInvested: `₹${PV.toLocaleString('en-IN')}`,
        estimatedWealthGain: `₹${totalGain.toLocaleString('en-IN')}`,
        futureValue: `₹${futureValue.toLocaleString('en-IN')}`,
      },
    }
  }
}
