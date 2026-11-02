import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function run() {
  console.log('🚀 Launching browser for Privacy Cleanup & Memory Manager verification...');
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

    // Dismiss first run / modals if open
    await page.evaluate(() => {
      localStorage.clear();
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

        // Fetch fresh memories from server
        fetch('http://localhost:3001/api/memory')
          .then(res => res.json())
          .then(data => {
            if (data.memories) state.setMemories(data.memories);
          });

        // Open the Memory Manager Modal
        state.setShowMemoryModal(true);
      }
    });

    await page.waitForTimeout(2500);

    console.log('Capturing verified 1080p screenshot of Privacy & Memory Manager...');
    const screenshotPath = path.join(ARTIFACT_DIR, 'ada_privacy_memory_controls_verified_1080p.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✅ Saved verified screenshot to: ${screenshotPath}`);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
