import { chromium } from 'playwright-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741')

async function verifyBleachSong() {
  console.log('🚀 [Verification] Testing Bleach Aizen Theme in Google Chrome...')
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    permissions: ['microphone'],
  })

  // Skip FirstRunModal onboarding
  await context.addInitScript(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true')
  })

  const page = await context.newPage()
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('[Music Engine]') || text.includes('[performAction]') || text.includes('SongEngine') || text.includes('Audio')) {
      console.log('  [Browser Console]:', text)
    }
  })

  try {
    console.log('🌐 Navigating to http://localhost:5173/?debug=1 ...')
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(4000)

    // Ensure FirstRun modal is closed
    await page.evaluate(() => {
      window.useAppStore?.getState?.()?.setShowFirstRunModal?.(false)
    })
    await page.waitForTimeout(500)

    console.log('\n--- 🎶 Submitting user query: "play aizen theme from bleach anime treachery" ---')
    const chatInput = page.locator('input[placeholder*="Talk or type"]')
    await chatInput.fill('play aizen theme from bleach anime treachery')
    await chatInput.press('Enter')
    console.log('Sent query, waiting 6 seconds for music card & dance sync...')
    await page.waitForTimeout(6000)

    const result = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.()
      const isSingingGlobal = Boolean(window.__IS_SINGING__)
      const freqs = store?.audioFrequencies || []
      const avgAudio = freqs.length > 0 ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0

      const h4Elements = Array.from(document.querySelectorAll('h4')).map(h => h.innerText)
      const hasBleachCard = h4Elements.some(t => t.toLowerCase().includes('treachery') || t.toLowerCase().includes('aizen') || t.toLowerCase().includes('bleach'))

      return {
        activeAction: store?.activeAction,
        systemState: store?.systemState,
        activeSongTitle: store?.activeSong?.title,
        activeSongArtist: store?.activeSong?.artist,
        isSingingGlobal,
        avgAudioLevel: Math.round(avgAudio * 100),
        h4Elements,
        hasBleachCard,
      }
    })
    console.log('Result:', JSON.stringify(result, null, 2))

    const screenshotPath = path.join(ARTIFACT_DIR, 'ada_bleach_aizen_theme_treachery_verified_1080p.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`📸 Saved verified screenshot: ${screenshotPath}`)

    if (result.hasBleachCard && result.activeAction?.includes('dance')) {
      console.log('🎉 Bleach Aizen Theme successfully verified! Music card rendered and dance choreography active!')
    } else {
      console.warn('⚠️ Verification check warning. Inspect result details.')
    }
  } catch (err) {
    console.error('❌ Verification failed:', err)
  } finally {
    await browser.close()
  }
}

verifyBleachSong()
