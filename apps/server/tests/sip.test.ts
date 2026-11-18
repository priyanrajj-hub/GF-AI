import { describe, it, expect } from 'vitest'
import { SipCalculator } from '../src/services/sipCalculator.js'

describe('SipCalculator Actuarial Unit Tests', () => {
  it('should compute standard SIP future value accurately (effective compounding, annuity due)', () => {
    const res = SipCalculator.calculate({
      monthlyInvestment: 10000,
      annualReturnRatePct: 12,
      tenureYears: 10,
    })

    expect(res.monthlyInvestment).toBe(10000)
    expect(res.totalMonths).toBe(120)
    expect(res.totalInvested).toBe(1200000)
    expect(res.futureValue).toBeGreaterThan(res.totalInvested)
    expect(res.estimatedWealthGain).toBe(res.futureValue - res.totalInvested)
    expect(res.formatted.futureValue).toContain('₹')
  })

  it('should compute ordinary annuity SIP (end of month) lower than annuity due', () => {
    const due = SipCalculator.calculate({
      monthlyInvestment: 5000,
      annualReturnRatePct: 15,
      tenureYears: 5,
      annuityDue: true,
    })

    const ordinary = SipCalculator.calculate({
      monthlyInvestment: 5000,
      annualReturnRatePct: 15,
      tenureYears: 5,
      annuityDue: false,
    })

    expect(due.futureValue).toBeGreaterThan(ordinary.futureValue)
    expect(due.totalInvested).toBe(ordinary.totalInvested)
  })

  it('should support nominal rate compounding (annual / 12)', () => {
    const nominal = SipCalculator.calculate({
      monthlyInvestment: 15000,
      annualReturnRatePct: 14,
      tenureYears: 15,
      effectiveCompounding: false,
    })

    const effective = SipCalculator.calculate({
      monthlyInvestment: 15000,
      annualReturnRatePct: 14,
      tenureYears: 15,
      effectiveCompounding: true,
    })

    expect(nominal.totalInvested).toBe(15000 * 180)
    expect(effective.totalInvested).toBe(nominal.totalInvested)
    expect(nominal.futureValue).toBeGreaterThan(0)
  })

  it('should correctly calculate inflation-adjusted future value', () => {
    const res = SipCalculator.calculate({
      monthlyInvestment: 20000,
      annualReturnRatePct: 15,
      tenureYears: 10,
      inflationRatePct: 6,
    })

    expect(res.inflationAdjustedFutureValue).toBeDefined()
    expect(res.inflationAdjustedFutureValue!).toBeLessThan(res.futureValue)
    expect(res.formatted.inflationAdjustedFutureValue).toBeDefined()
  })

  it('should handle zero interest rate gracefully', () => {
    const res = SipCalculator.calculate({
      monthlyInvestment: 5000,
      annualReturnRatePct: 0,
      tenureYears: 3,
    })

    expect(res.totalInvested).toBe(5000 * 36)
    expect(res.futureValue).toBe(res.totalInvested)
    expect(res.estimatedWealthGain).toBe(0)
  })

  it('should handle zero tenure gracefully', () => {
    const res = SipCalculator.calculate({
      monthlyInvestment: 5000,
      annualReturnRatePct: 12,
      tenureYears: 0,
    })

    expect(res.totalMonths).toBe(0)
    expect(res.totalInvested).toBe(0)
    expect(res.futureValue).toBe(0)
  })

  it('should compute lumpsum compounding correctly: FV = PV * (1 + r)^t', () => {
    const res = SipCalculator.calculateLumpsum(100000, 12, 5)

    expect(res.principal).toBe(100000)
    expect(res.futureValue).toBe(Math.round(100000 * Math.pow(1.12, 5)))
    expect(res.estimatedWealthGain).toBe(res.futureValue - 100000)
  })
})
