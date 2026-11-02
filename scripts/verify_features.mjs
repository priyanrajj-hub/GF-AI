import { chromium } from 'playwright-core'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || process.env.HOME || ".", ".gemini", "antigravity", "brain", "9dddffaa-28a4-45f4-9190-18cc1e11e741")

async function runVerification() {
  console.log('🚀 Starting end-to-end browser verification...')
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--autoplay-policy=no-user-gesture-required'
    ]
  })

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[Music Engine]') || text.includes('[performAction]') || text.includes('[Meme Engine]') || text.includes('TTS') || text.includes('Skin') || text.includes('Audio')) {
      console.log('  [Browser Console]:', text)
    }
  })

  await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)

  // Dismiss any open modal overlay
  await page.evaluate(() => {
    if (window.useAppStore) {
      const state = window.useAppStore.getState()
      state.setShowFirstRunModal(false)
      state.setShowSettingsModal(false)
      state.setShowPersonalityStudio(false)
      state.setShowPermissionCenter(false)
      state.setShowWellbeingModal(false)
      state.setShowWardrobeDrawer(false)
    }
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)

  // 1. Verify Mira (Yor Forger) character switch
  console.log('👗 1. Switching to Mira (Yor Forger)...')
  await page.evaluate(() => {
    if (window.useAppStore) {
      window.useAppStore.getState().setActiveCharacter('mira')
    }
  })
  await page.waitForTimeout(3000)

  const miraScreenshotPath = path.join(ARTIFACT_DIR, 'mira_yor_forger_verified_1080p.png')
  await page.screenshot({ path: miraScreenshotPath, fullPage: true })
  console.log('✅ Captured Mira (Yor) screenshot:', miraScreenshotPath)

  // 2. Verify Atlas (Tony Stark) character switch
  console.log('⚡ 2. Switching to Atlas (Tony Stark)...')
  await page.evaluate(() => {
    if (window.useAppStore) {
      window.useAppStore.getState().setActiveCharacter('atlas')
    }
  })
  await page.waitForTimeout(3000)

  const atlasScreenshotPath = path.join(ARTIFACT_DIR, 'atlas_tony_stark_verified_1080p.png')
  await page.screenshot({ path: atlasScreenshotPath, fullPage: true })
  console.log('✅ Captured Atlas (Stark) screenshot:', atlasScreenshotPath)

  // Switch back to Mira for original song performance
  await page.evaluate(() => {
    if (window.useAppStore) {
      window.useAppStore.getState().setActiveCharacter('mira')
    }
  })
  await page.waitForTimeout(1500)

  // 3. Verify Original Studio Song & Synchronized Rhythm Dancing
  console.log('🎶 3. Requesting original song: Shape of You...')
  const input = page.locator('input[placeholder*="Talk or type to Ada"]')
  await input.fill('Ada, sing Shape of You')
  await input.press('Enter')

  // Wait 4 seconds for audio pipeline to stream & dance action to lock
  await page.waitForTimeout(4500)

  // Read Diagnostics HUD values
  const hudText = await page.locator('text=ADA DIAGNOSTICS HUD').locator('..').innerText().catch(() => '')
  console.log('📊 HUD Status during song playback:')
  console.log(hudText)

  const songScreenshotPath = path.join(ARTIFACT_DIR, 'original_song_shape_of_you_dancing_verified_1080p.png')
  await page.screenshot({ path: songScreenshotPath, fullPage: true })
  console.log('✅ Captured Original Song Dancing screenshot:', songScreenshotPath)

  // 4. Verify Real Online Developer Meme with Image & Template
  console.log('🖼️ 4. Requesting funny developer meme...')
  await input.fill('Show me a funny developer meme.')
  await input.press('Enter')
  await page.waitForTimeout(4000)

  const memeScreenshotPath = path.join(ARTIFACT_DIR, 'real_online_developer_meme_verified_1080p.png')
  await page.screenshot({ path: memeScreenshotPath, fullPage: true })
  console.log('✅ Captured Real Developer Meme screenshot:', memeScreenshotPath)

  await browser.close()
  console.log('🎉 Verification run complete!')
}

runVerification().catch((e) => {
  console.error('❌ Verification failed:', e)
  process.exit(1)
})
