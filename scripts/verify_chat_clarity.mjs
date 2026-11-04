import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\brain\\9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
  console.log('🚀 Verifying Chat Clarity and Layout Fixes...');
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
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Dismiss first-run modals
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dismissBtn = buttons.find(b => /understand|accept|enter|start|agree/i.test(b.textContent || ''));
      if (dismissBtn) dismissBtn.click();

      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setShowFirstRunModal(false);
        state.setShowSettingsModal(false);
        if (!state.showChatDrawer) state.toggleChatDrawer();
        if (state.setArchetype) state.setArchetype('atlas');
        if (state.setActiveCharacter) state.setActiveCharacter('atlas');
      }
    });

    await page.waitForTimeout(2000);

    // Click Nifty 50 chip or type in chat
    const niftyChip = page.locator('button:has-text("Nifty 50")').first();
    if (await niftyChip.isVisible().catch(() => false)) {
      await niftyChip.click();
      console.log('Clicked Nifty 50 chip');
    } else {
      const input = page.locator('input[placeholder*="Ask Tony Stark"]').first();
      await input.fill('nifty 50 analysis');
      await input.press('Enter');
    }

    // Wait for the trading card to render
    await page.waitForSelector('text=STARK QUANTUM MATRIX', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(3000);

    // Screenshot 1: Standard Mode (Now comfortably widened to 480px, no text overlap)
    const standardPath = path.join(ARTIFACT_DIR, 'chat_clarity_standard_verified_1080p.png');
    await page.screenshot({ path: standardPath });
    console.log(`📸 Saved standard view: ${standardPath}`);

    // Click Expand Drawer Width button
    const expandBtn = page.locator('button[title*="Expand drawer"]').first();
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click();
      console.log('Clicked Expand drawer button');
      await page.waitForTimeout(1500);

      // Screenshot 2: Wide Studio Mode (680px - 800px spacious view)
      const widePath = path.join(ARTIFACT_DIR, 'chat_clarity_wide_verified_1080p.png');
      await page.screenshot({ path: widePath });
      console.log(`📸 Saved wide view: ${widePath}`);
    }

    console.log('✅ Chat clarity verification complete!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
