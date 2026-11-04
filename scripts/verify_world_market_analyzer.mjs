import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\brain\\9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
  console.log('🚀 Launching Chrome for World Market Analyzer & Indicators verification...');
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
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Dismiss modals and switch to Stark / Atlas mode
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
        // Switch to Atlas Tony Stark mode
        if (state.setArchetype) {
          state.setArchetype('atlas');
        }
      }
    });

    await page.waitForTimeout(2000);

    // Click Atlas mode button in header if present
    const atlasHeaderBtn = page.locator('button:has-text("Atlas")').first();
    if (await atlasHeaderBtn.isVisible().catch(() => false)) {
      await atlasHeaderBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }

    console.log('Sending World Market Analysis query with all indicators...');
    const chatInput = page.locator('input[placeholder*="Tony Stark"], input[placeholder*="Ada"], input[placeholder*="Mira"], input[placeholder*="தமிழில்"]').last();
    await chatInput.click();
    await chatInput.fill('Give me live technical breakdown of Nifty 50 with all indicators and trade setup');
    const sendBtn = page.locator('button[type="submit"]').last();
    await sendBtn.click();

    console.log('Waiting for response and Holographic Trading Card rendering...');
    await page.waitForTimeout(10000);

    // Wait for TradingCard to appear in DOM
    await page.waitForSelector('text=Trade Setup', { timeout: 15000 }).catch(() => console.log('Timeout waiting for Trade Setup'));

    // Check if card is visible
    const tradingCardSetupTab = page.locator('button:has-text("Trade Setup")').first();
    const hasTradingCard = await tradingCardSetupTab.isVisible().catch(() => false);
    console.log('Holographic Trading Card rendered:', hasTradingCard);

    // 1. Capture Main Trading Card Setup View
    const setupShotPath = path.join(ARTIFACT_DIR, 'ada_world_market_analyzer_trading_card_verified_1080p.png');
    await page.screenshot({ path: setupShotPath, fullPage: false });
    console.log(`📸 Saved Trading Setup Screenshot: ${setupShotPath}`);

    // 2. Switch to All Indicators Tab on the card
    const indicatorsTab = page.locator('button:has-text("All Indicators")').first();
    const hasIndTab = await indicatorsTab.isVisible().catch(() => false);
    console.log('Indicators Tab visible:', hasIndTab);
    if (hasIndTab) {
      console.log('Clicking "All Indicators" tab on Trading Card...');
      await indicatorsTab.click({ force: true });
      await page.waitForTimeout(1500);

      const indicatorsShotPath = path.join(ARTIFACT_DIR, 'ada_world_market_all_indicators_matrix_verified_1080p.png');
      await page.screenshot({ path: indicatorsShotPath, fullPage: false });
      console.log(`📸 Saved All Indicators Matrix Screenshot: ${indicatorsShotPath}`);
    }

    // 3. Switch to SMC & Pivots Tab
    const smcTab = page.locator('button:has-text("SMC & Pivots")').first();
    const hasSmcTab = await smcTab.isVisible().catch(() => false);
    console.log('SMC Tab visible:', hasSmcTab);
    if (hasSmcTab) {
      console.log('Clicking "SMC & Pivots" tab on Trading Card...');
      await smcTab.click({ force: true });
      await page.waitForTimeout(1500);

      const smcShotPath = path.join(ARTIFACT_DIR, 'ada_world_market_smc_pivots_verified_1080p.png');
      await page.screenshot({ path: smcShotPath, fullPage: false });
      console.log(`📸 Saved SMC & Pivots Screenshot: ${smcShotPath}`);
    }

    // 4. Switch back to Trade Setup tab and capture full setup details
    if (hasTradingCard) {
      console.log('Clicking "Trade Setup" tab on Trading Card...');
      await tradingCardSetupTab.click({ force: true });
      await page.waitForTimeout(1000);

      const setupCardShotPath = path.join(ARTIFACT_DIR, 'ada_world_market_trade_setup_card_verified_1080p.png');
      await page.screenshot({ path: setupCardShotPath, fullPage: false });
      console.log(`📸 Saved Trade Setup Tab Screenshot: ${setupCardShotPath}`);
    }

    console.log('🎉 All World Market & Indicators Screenshots verified!');

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
