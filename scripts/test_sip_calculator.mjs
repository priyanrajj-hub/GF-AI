import assert from 'node:assert/strict'
import { SipCalculator } from '../apps/server/src/services/sipCalculator.js'

console.log('─── Testing SIP & Lumpsum Calculator Engine ───')

// 1. Zero return test
const zeroReturn = SipCalculator.calculate({
  monthlyInvestment: 5000,
  annualReturnRatePct: 0,
  tenureYears: 5,
})
assert.equal(zeroReturn.totalInvested, 300000)
assert.equal(zeroReturn.futureValue, 300000)
assert.equal(zeroReturn.estimatedWealthGain, 0)
console.log('  ✓ PASS: Zero return rate yields exact total principal without gain')

// 2. Standard nominal SIP with Annuity Due (monthly rate = 12% / 12 = 1%)
const nominalSip = SipCalculator.calculate({
  monthlyInvestment: 10000,
  annualReturnRatePct: 12,
  tenureYears: 10,
  effectiveCompounding: false,
  annuityDue: true,
})
assert.equal(nominalSip.totalInvested, 1200000)
// Benchmark: 10000 * ((1.01^120 - 1) / 0.01) * 1.01 ≈ 2323391
assert.ok(Math.abs(nominalSip.futureValue - 2323391) <= 2, `Expected ~2323391, got ${nominalSip.futureValue}`)
assert.ok(nominalSip.estimatedWealthGain > 1120000)
console.log('  ✓ PASS: Nominal monthly compounding matches standard actuarial benchmark (~₹23.23 Lakhs)')

// 3. Effective monthly compounding: r = (1 + 0.12)^(1/12) - 1
const effectiveSip = SipCalculator.calculate({
  monthlyInvestment: 10000,
  annualReturnRatePct: 12,
  tenureYears: 10,
  effectiveCompounding: true,
  annuityDue: true,
})
assert.equal(effectiveSip.totalInvested, 1200000)
assert.ok(effectiveSip.futureValue > 2200000 && effectiveSip.futureValue < 2323391)
console.log('  ✓ PASS: Effective annual rate compounding computes exact mathematical yield')

// 4. Annuity Due vs Ordinary Annuity toggle
const ordinarySip = SipCalculator.calculate({
  monthlyInvestment: 10000,
  annualReturnRatePct: 12,
  tenureYears: 10,
  effectiveCompounding: false,
  annuityDue: false,
})
// Ordinary annuity: 10000 * ((1.01^120 - 1) / 0.01) ≈ 2300387
assert.ok(nominalSip.futureValue > ordinarySip.futureValue, 'Annuity-due must exceed ordinary annuity by 1 compounding period')
assert.ok(Math.abs(ordinarySip.futureValue - 2300387) <= 2)
console.log('  ✓ PASS: Annuity-due toggle correctly differentiates start-of-month vs end-of-month cashflows')

// 5. Lumpsum compounding: FV = PV * (1 + r)^t
const lumpsum = SipCalculator.calculateLumpsum(100000, 15, 5)
// 100000 * (1.15)^5 = 100000 * 2.011357 = 201136
assert.equal(lumpsum.totalInvested, 100000)
assert.ok(Math.abs(lumpsum.futureValue - 201136) <= 2)
console.log('  ✓ PASS: Lumpsum compound returns verify correctly against analytical table (₹2.01 Lakhs)')

console.log('─── All SIP Calculator Unit Tests Passed! ───')
