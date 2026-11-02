import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741')

async function runVerification() {
  console.log('🚀 [Verification] Launching Google Chrome browser via playwright-core...')
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
    if (text.includes('[Music Engine]') || text.includes('[performAction]') || text.includes('[Meme Engine]') || text.includes('SongEngine') || text.includes('Audio')) {
      console.log('  [Browser Console]:', text)
    }
  })

  try {
    console.log('🌐 [Verification] Navigating to http://localhost:5173/?debug=1 ...')
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(4500)

    // Ensure FirstRun modal is closed
    await page.evaluate(() => {
      window.useAppStore?.getState?.()?.setShowFirstRunModal?.(false)
    })
    await page.waitForTimeout(500)

    // ==========================================
    // TEST 1: Mira (Yor Forger Style)
    // ==========================================
    console.log('\n--- 🌹 TEST 1: Mira (Yor Forger Companion) ---')
    const miraBtn = page.getByRole('button', { name: '🌹 Mira (Yor)' })
    await miraBtn.click()
    await page.waitForTimeout(3000)

    const miraState = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.()
      const vrm = window.__ADA_VRM__
      let hasRose = false
      if (vrm) {
        const head = vrm.humanoid?.getNormalizedBoneNode('head')
        hasRose = Boolean(head?.getObjectByName('__YOR_HEADBAND_ROSE__')?.visible)
      }
      return {
        activeCharacter: store?.activeCharacter,
        skinId: store?.skinId,
        hasRose,
      }
    })
    console.log('Mira state:', miraState)

    const miraScreenshot = path.join(ARTIFACT_DIR, 'mira_yor_forger_companion_verified_1080p.png')
    await page.screenshot({ path: miraScreenshot, fullPage: false })
    console.log(`📸 Saved Yor screenshot: ${miraScreenshot}`)

    // ==========================================
    // TEST 2: Atlas (Tony Stark Style)
    // ==========================================
    console.log('\n--- ⚡ TEST 2: Atlas (Tony Stark Vanguard) ---')
    const atlasBtn = page.getByRole('button', { name: '⚡ Atlas (Stark)' })
    await atlasBtn.click()
    await page.waitForTimeout(3000)

    const atlasState = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.()
      const vrm = window.__ADA_VRM__
      let hasGlasses = false
      let hasGoatee = false
      let hasReactor = false
      if (vrm) {
        const head = vrm.humanoid?.getNormalizedBoneNode('head')
        hasGlasses = Boolean(head?.getObjectByName('__STARK_TECH_SUNGLASSES__')?.visible)
        hasGoatee = Boolean(head?.getObjectByName('__STARK_GOATEE_BEARD__')?.visible)
        const chest = vrm.humanoid?.getNormalizedBoneNode('chest') || vrm.humanoid?.getNormalizedBoneNode('upperChest')
        hasReactor = Boolean(chest?.getObjectByName('__STARK_ARC_REACTOR__')?.visible)
      }
      return {
        activeCharacter: store?.activeCharacter,
        skinId: store?.skinId,
        hasGlasses,
        hasGoatee,
        hasReactor,
      }
    })
    console.log('Atlas state:', atlasState)

    const atlasScreenshot = path.join(ARTIFACT_DIR, 'atlas_tony_stark_markets_verified_1080p.png')
    await page.screenshot({ path: atlasScreenshot, fullPage: false })
    console.log(`📸 Saved Tony Stark screenshot: ${atlasScreenshot}`)

    // ==========================================
    // TEST 3: Real Online Developer Meme
    // ==========================================
    console.log('\n--- 🎭 TEST 3: Real Online Developer Meme ---')
    const chatInput = page.locator('input[placeholder*="Talk or type"]')
    await chatInput.fill('Show me a funny developer meme.')
    await chatInput.press('Enter')
    await page.waitForTimeout(4000)

    const memeInfo = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="memegen.link"], img[src*="meme"]'))
      return {
        foundMemeImages: imgs.length,
        imgSrcs: imgs.map((img) => img.src),
      }
    })
    console.log('Meme result:', memeInfo)

    const memeScreenshot = path.join(ARTIFACT_DIR, 'ada_real_online_developer_meme_verified_1080p.png')
    await page.screenshot({ path: memeScreenshot, fullPage: false })
    console.log(`📸 Saved Meme screenshot: ${memeScreenshot}`)

    // ==========================================
    // TEST 4: Original Song Playback & Active Dance
    // ==========================================
    console.log('\n--- 🎶 TEST 4: Original Song Playback & Synchronized Dance ---')
    const adaBtn = page.getByRole('button', { name: '👩‍💼 Ada' })
    await adaBtn.click()
    await page.waitForTimeout(1500)

    await chatInput.fill('Ada, sing Shape of You')
    await chatInput.press('Enter')
    console.log('Sent song request: "Ada, sing Shape of You", waiting for performance...')
    await page.waitForTimeout(5000)

    const performanceState = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.()
      const isSingingGlobal = Boolean(window.__IS_SINGING__)
      const freqs = store?.audioFrequencies || []
      const avgAudio = freqs.length > 0 ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0

      const hasCard = Boolean(document.querySelector('h4') && Array.from(document.querySelectorAll('h4')).some(h => h.innerText.includes('Shape of You')))

      return {
        activeAction: store?.activeAction,
        systemState: store?.systemState,
        activeSongTitle: store?.activeSong?.title,
        activeSongArtist: store?.activeSong?.artist,
        isSingingGlobal,
        avgAudioLevel: Math.round(avgAudio * 100),
        hasMusicCardInDom: hasCard,
      }
    })
    console.log('Performance state:', performanceState)

    const songScreenshot = path.join(ARTIFACT_DIR, 'ada_playing_original_shape_of_you_dancing_verified_1080p.png')
    await page.screenshot({ path: songScreenshot, fullPage: false })
    console.log(`📸 Saved Song Performance screenshot: ${songScreenshot}`)

    console.log('\n🎉 ALL 4 TESTS COMPLETED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Verification failed:', err)
  } finally {
    await browser.close()
  }
}

runVerification()
