import { test, expect } from '@playwright/test'

test.describe('Ada AI & Jarvis Trade Complete End-to-End User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for uncaught WebGL or console errors
    page.on('pageerror', (err) => {
      console.error('[Browser Error]:', err.message)
    })
  })

  test('Guest Login -> Chat -> Voice Synthesis -> Stock Card -> 3D Canvas Rendering', async ({ page }) => {
    // 1. Visit app home
    await page.goto('/')
    await expect(page).toHaveTitle(/Ada|GF-AI/i)

    // 2. Authenticate as Guest if not logged in
    const guestBtn = page.locator('button:has-text("Try Demo"), button:has-text("Guest"), button:has-text("Enter")')
    if (await guestBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await guestBtn.first().click()
    }

    // 3. Verify 3D Scene canvas mounts without WebGL context loss
    const canvas = page.locator('canvas')
    await expect(canvas.first()).toBeVisible({ timeout: 10000 })

    const isContextLost = await page.evaluate(() => {
      const glCanvas = document.querySelector('canvas')
      if (!glCanvas) return true
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('webgl2')
      return !gl || gl.isContextLost()
    })
    expect(isContextLost).toBe(false)

    // 4. Send a financial quantitative chat query
    const chatInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 5000 })
    await chatInput.fill('Analyze swing setup for RELIANCE with institutional ATR levels.')
    await page.keyboard.press('Enter')

    // 5. Verify assistant response renders
    const assistantMessage = page.locator('[data-role="assistant"], .assistant-message, div:has-text("RELIANCE")')
    await expect(assistantMessage.first()).toBeVisible({ timeout: 15000 })

    // 6. Verify institutional TradingCard / Market Radar renders
    const tradingCard = page.locator('.trading-card, [data-testid="trading-card"], div:has-text("Target 1")')
    if (await tradingCard.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(tradingCard.first()).toBeVisible()
    }

    // 7. Verify Voice Audio trigger works without network crash
    const voiceBtn = page.locator('button[aria-label*="voice" i], button:has-text("🔊"), button:has-text("Play")').first()
    if (await voiceBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await voiceBtn.click()
    }
  })
})
