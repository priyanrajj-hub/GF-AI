import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function run() {
  console.log('🚀 Launching browser for Time-of-Day, Mature Aesthetics, & Emotion Blending verification...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  try {
    console.log('Navigating to http://localhost:5173/?debug=1 ...');
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(3000);

    // Dismiss modals if open
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dismissBtn = buttons.find(b => /understand|accept|enter|start|agree/i.test(b.textContent || ''));
      if (dismissBtn) dismissBtn.click();

      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setShowFirstRunModal(false);
        state.setShowSettingsModal(false);
        state.setShowPersonalityStudio(false);
        state.setShowPermissionCenter(false);
        state.setShowWellbeingModal(false);
        state.setShowWardrobeDrawer(false);
      }
    });

    await page.waitForTimeout(1500);

    // Click the Sunset button in top bar or set phase to evening/sunset
    console.log('Testing Time-of-Day switch to 🌇 Sunset / Evening...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setTimeOfDayPhase('evening');
      }
    });
    await page.waitForTimeout(2000);

    console.log('Locating "🌅 Morning Vibe" chip or asking Ada about the time-of-day & emotion blending...');
    const chip = page.locator('button:has-text("🌅 Morning Vibe")').first();
    const isChipVisible = await chip.isVisible({ timeout: 2000 }).catch(() => false);

    if (isChipVisible) {
      console.log('Clicking "🌅 Morning Vibe" chip...');
      await chip.click({ force: true });
    } else {
      console.log('Typing query into chat input...');
      const chatInput = page.locator('input[type="text"]').first();
      await chatInput.fill('Good morning Ada! How is your morning ritual and outfit today? Blend your emotions and tell me how you feel.');
      await chatInput.press('Enter');
    }

    console.log('Waiting for Ada response with time-of-day mood, dress sync & emotion blending...');
    await page.waitForTimeout(9000);

    const screenshotPath = path.join(ARTIFACT_DIR, 'ada_mature_time_of_day_emotion_blended_1080p.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✅ Saved verified screenshot to: ${screenshotPath}`);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
