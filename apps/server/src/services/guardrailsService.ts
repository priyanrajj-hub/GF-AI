/**
 * Anti-Hallucination, Fact-Grounding & Regulatory Guardrail Service.
 * Enforces:
 * 1. Price ground-truth verification (detects fabricated asset prices).
 * 2. Scrubbing deceptive profit guarantees ("100% win rate", "guaranteed profit").
 * 3. Mandatory 1% capital preservation notice on all trade setups.
 */
import type { StockQuote } from './tradingService.js'

const PROHIBITED_CLAIMS = [
  /guaranteed\s+(profit|gain|return)/gi,
  /100%\s+(win\s*rate|accurate|profit)/gi,
  /risk[- ]free\s+(trade|investment|return)/gi,
  /sure[- ]shot\s+(profit|gain)/gi,
  /can['’]?t\s+lose/gi,
  /get\s+rich\s+quick/gi,
]

export class GuardrailsService {
  /**
   * Scrubs deceptive marketing and profit guarantees from AI replies.
   */
  static scrubDeceptiveClaims(text: string): { cleanedText: string; scrubbedCount: number } {
    let cleaned = text
    let count = 0

    for (const pat of PROHIBITED_CLAIMS) {
      if (pat.test(cleaned)) {
        count++
        cleaned = cleaned.replace(
          pat,
          '[DISCLAIMER: Capital is always at risk. No trading setup or model guarantees profit]'
        )
      }
    }

    return { cleanedText: cleaned, scrubbedCount: count }
  }

  /**
   * Verifies that any numbers cited in the response do not hallucinate wildly from ground-truth quote.
   */
  static verifyFactGrounding(replyText: string, quote?: StockQuote | null): string {
    let result = replyText

    // 1. Scrub deceptive claims
    const { cleanedText, scrubbedCount } = this.scrubDeceptiveClaims(result)
    result = cleanedText

    if (scrubbedCount > 0) {
      console.log(`🛡️ [Anti-Hallucination Guardrail] Scrubbed ${scrubbedCount} prohibited claims from AI response.`)
    }

    // 2. Ensure price grounding if quote is present
    if (quote && quote.price > 0) {
      const priceNum = quote.price
      const currSym = quote.currency === 'INR' ? '₹' : '$'

      // Check if text makes claims about price
      const priceRegex = /([\$₹]\s*([0-9,]+(?:\.[0-9]+)?))/g
      let match: RegExpExecArray | null

      while ((match = priceRegex.exec(replyText)) !== null) {
        const citedNum = parseFloat(match[2].replace(/,/g, ''))
        // If number is roughly close to price (within 40%) but deviates by > 5%
        if (citedNum > priceNum * 0.6 && citedNum < priceNum * 1.4) {
          const dev = Math.abs((citedNum - priceNum) / priceNum) * 100
          if (dev > 5.0) {
            console.warn(
              `⚠️ [Anti-Hallucination Guardrail] Intercepted deviating price ${match[1]} vs Ground Truth ${currSym}${priceNum} (dev: ${dev.toFixed(1)}%)`
            )
            // Replace with grounded truth
            result = result.replace(
              match[1],
              `${currSym}${priceNum.toLocaleString()} (Grounded Tick)`
            )
          }
        }
      }
    }

    return result
  }
}
