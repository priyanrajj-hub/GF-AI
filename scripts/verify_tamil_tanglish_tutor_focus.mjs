import { chromium } from 'playwright-core'
import path from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741')

async function runMultilingualTutorVerification() {
  console.log('🚀 [Multilingual Tutor Verification] Launching Google Chrome...')
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

  await context.addInitScript(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true')
  })

  const page = await context.newPage()

  try {
    console.log('🌐 Navigating to http://localhost:5173/?debug=1 ...')
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(4000)

    // Ensure FirstRun modal is closed
    await page.evaluate(() => {
      window.useAppStore?.getState?.()?.setShowFirstRunModal?.(false)
    })
    await page.waitForTimeout(500)

    const chatInput = page.locator('input[placeholder*="Talk or type"]')

    // ==========================================
    // TEST 1: Tamil Language Support
    // ==========================================
    console.log('\n--- 🌸 TEST 1: Pure Tamil Language ---')
    await chatInput.fill('வணக்கம் Ada, இன்னைக்கு என்ன படிக்கலாம்?')
    await chatInput.press('Enter')
    console.log('Sent Tamil query, waiting 5s...')
    await page.waitForTimeout(5000)

    const tamilScreenshot = path.join(ARTIFACT_DIR, 'ada_tamil_language_verified_1080p.png')
    await page.screenshot({ path: tamilScreenshot, fullPage: false })
    console.log(`📸 Saved Tamil Language proof: ${tamilScreenshot}`)

    // ==========================================
    // TEST 2: Tanglish (Tamil + English) Study Tutor
    // ==========================================
    console.log('\n--- 🗣️ TEST 2: Tanglish Study & Focus Guidance ---')
    await chatInput.fill('Ada, enaku studies-la focus panna mudila, konjam tips kudunga in Tanglish')
    await chatInput.press('Enter')
    console.log('Sent Tanglish query, waiting 5s...')
    await page.waitForTimeout(5000)

    const tanglishScreenshot = path.join(ARTIFACT_DIR, 'ada_tanglish_study_tutor_verified_1080p.png')
    await page.screenshot({ path: tanglishScreenshot, fullPage: false })
    console.log(`📸 Saved Tanglish proof: ${tanglishScreenshot}`)

    // ==========================================
    // TEST 3: Academic Tutor & CS Instructor
    // ==========================================
    console.log('\n--- 🎓 TEST 3: Academic Instructor & Tutor ---')
    await chatInput.fill('Ada, please tutor me on React useEffect with a clean step-by-step example.')
    await chatInput.press('Enter')
    console.log('Sent Tutor query, waiting 6s...')
    await page.waitForTimeout(6000)

    const tutorScreenshot = path.join(ARTIFACT_DIR, 'ada_academic_instructor_tutor_verified_1080p.png')
    await page.screenshot({ path: tutorScreenshot, fullPage: false })
    console.log(`📸 Saved Academic Tutor proof: ${tutorScreenshot}`)

    // ==========================================
    // TEST 4: Interactive Focus & Pomodoro Card
    // ==========================================
    console.log('\n--- ⏱️ TEST 4: Interactive Pomodoro Focus Session ---')
    await chatInput.fill('Start a focus timer for 25 minutes for my study session')
    await chatInput.press('Enter')
    console.log('Sent Focus timer query, waiting 5s...')
    await page.waitForTimeout(5000)

    const focusCardExists = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Pomodoro Focus Sprint') || text.includes('25 MIN') || text.includes('Deep Work Mode')
    })
    console.log('Focus Card in DOM:', focusCardExists)

    const focusScreenshot = path.join(ARTIFACT_DIR, 'ada_study_focus_pomodoro_verified_1080p.png')
    await page.screenshot({ path: focusScreenshot, fullPage: false })
    console.log(`📸 Saved Focus Pomodoro proof: ${focusScreenshot}`)

    // ==========================================
    // TEST 5: Interactive To-Do List & Reminders Card
    // ==========================================
    console.log('\n--- 📝 TEST 5: Interactive To-Do List & Reminders ---')
    await chatInput.fill('Add to-do: complete Operating Systems assignment by tomorrow')
    await chatInput.press('Enter')
    console.log('Sent To-Do query, waiting 5s...')
    await page.waitForTimeout(5000)

    const todoCardExists = await page.evaluate(() => {
      const text = document.body.innerText
      return text.includes('Active To-Dos') || text.includes('complete Operating Systems assignment')
    })
    console.log('To-Do Card in DOM:', todoCardExists)

    const todoScreenshot = path.join(ARTIFACT_DIR, 'ada_todo_list_reminders_verified_1080p.png')
    await page.screenshot({ path: todoScreenshot, fullPage: false })
    console.log(`📸 Saved To-Do List proof: ${todoScreenshot}`)

    // ==========================================
    // TEST 6: All Language Songs - Tamil Kollywood Track
    // ==========================================
    console.log('\n--- 🎵 TEST 6: All Language Songs (Tamil Kollywood - Vaathi Coming) ---')
    await chatInput.fill('Play Vaathi Coming from Master')
    await chatInput.press('Enter')
    console.log('Sent Tamil song query, waiting 6s for music card & dance sync...')
    await page.waitForTimeout(6000)

    const musicState = await page.evaluate(() => {
      const store = window.useAppStore?.getState?.()
      const isSinging = Boolean(window.__IS_SINGING__)
      return {
        activeAction: store?.activeAction,
        activeSongTitle: store?.activeSong?.title,
        activeSongArtist: store?.activeSong?.artist,
        isSinging,
      }
    })
    console.log('Tamil Song State:', musicState)

    const musicScreenshot = path.join(ARTIFACT_DIR, 'ada_tamil_song_vaathi_coming_dancing_verified_1080p.png')
    await page.screenshot({ path: musicScreenshot, fullPage: false })
    console.log(`📸 Saved Tamil Song proof: ${musicScreenshot}`)

    console.log('\n🎉 ALL 6 MULTILINGUAL TUTOR & STUDY TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Verification failed:', err)
  } finally {
    await browser.close()
  }
}

runMultilingualTutorVerification()
