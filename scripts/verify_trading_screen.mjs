import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\brain\\9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
  console.log('🚀 Launching browser for Trading & Stock Intelligence verification...');
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

    // Dismiss any open modal/disclaimer
    await page.evaluate(() => {
      // Click any button with "I Understand", "Enter", "Get Started", "Start"
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

    await page.waitForTimeout(2000);

    console.log('Locating chat input or suggestion chip...');
    const stockChip = page.locator('button:has-text("📈 Stock Picks")').first();
    const isChipVisible = await stockChip.isVisible({ timeout: 2000 }).catch(() => false);

    if (isChipVisible) {
      console.log('Clicking "📈 Stock Picks" chip...');
      await stockChip.click({ force: true });
    } else {
      console.log('Typing stock query into chat input...');
      const chatInput = page.locator('input[type="text"]').first();
      await chatInput.fill('give me top stock recommendations to buy');
      await chatInput.press('Enter');
    }

    console.log('Waiting for Ada reply with live financial data & levels...');
    await page.waitForTimeout(10000);

    const screenshotPath = path.join(ARTIFACT_DIR, 'ada_live_stock_trading_verified_1080p.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`✅ Saved verified screenshot to: ${screenshotPath}`);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
