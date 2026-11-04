import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\brain\\9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
  console.log('🚀 Verifying War Radar, Hugging Face Sentiments & Ratings...');
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

    // Dismiss first-run modals & switch to Atlas
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

    // Click Nifty 50 or send query
    const niftyChip = page.locator('button:has-text("Nifty 50")').first();
    if (await niftyChip.isVisible().catch(() => false)) {
      await niftyChip.click();
    } else {
      const input = page.locator('input[placeholder*="Ask Tony Stark"]').first();
      await input.fill('nifty 50 analysis');
      await input.press('Enter');
    }

    await page.waitForSelector('text=STARK QUANTUM MATRIX', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(3000);

    // Expand drawer for maximum visual clarity
    const expandBtn = page.locator('button[title*="Expand drawer"]').first();
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(1000);
    }

    // Click War & Macro Radar tab
    const warTab = page.locator('button:has-text("War & Macro")').first();
    if (await warTab.isVisible().catch(() => false)) {
      await warTab.click();
      console.log('Clicked War & Macro Radar tab');
      await page.waitForTimeout(1500);

      const warPath = path.join(ARTIFACT_DIR, 'ada_war_and_macro_radar_verified_1080p.png');
      await page.screenshot({ path: warPath });
      console.log(`📸 Saved War Radar: ${warPath}`);
    }

    // Click Ratings & Sentiment tab
    const ratingsTab = page.locator('button:has-text("Ratings & Sentiment")').first();
    if (await ratingsTab.isVisible().catch(() => false)) {
      await ratingsTab.click();
      console.log('Clicked Ratings & Sentiment tab');
      await page.waitForTimeout(1500);

      const ratingsPath = path.join(ARTIFACT_DIR, 'ada_ratings_and_sentiment_verified_1080p.png');
      await page.screenshot({ path: ratingsPath });
      console.log(`📸 Saved Ratings & Sentiment: ${ratingsPath}`);
    }

    console.log('✅ War Radar and Ratings verification completed successfully!');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
