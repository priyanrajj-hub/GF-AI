import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function main() {
  console.log('🚀 Launching browser for Round 9 Visual Quality & Safeguards pass...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. Capture 1920x1080 First Run Screen
  const page1080 = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  // Clear acknowledgment so first-run screen is visible
  await page1080.addInitScript(() => {
    localStorage.removeItem('ada_first_run_acknowledged');
  });

  await page1080.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page1080.waitForTimeout(3000);

  // Force showFirstRunModal if needed
  await page1080.evaluate(() => {
    if (window.useAppStore) {
      window.useAppStore.getState().setShowFirstRunModal(true);
    }
  });
  await page1080.waitForTimeout(1000);

  const firstRun1080 = await page1080.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v9_first_run_1080p.png'), firstRun1080);
  console.log('📸 Saved ada_v9_first_run_1080p.png');

  // 2. Capture 1366x768 First Run Screen
  const page768 = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });
  await page768.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page768.waitForTimeout(2000);
  await page768.evaluate(() => {
    if (window.useAppStore) {
      window.useAppStore.getState().setShowFirstRunModal(true);
    }
  });
  await page768.waitForTimeout(800);
  const firstRun768 = await page768.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v9_first_run_768p.png'), firstRun768);
  console.log('📸 Saved ada_v9_first_run_768p.png');
  await page768.close();

  // 3. Dismiss First Run and capture Ada Original Skin on main stage (1920x1080)
  await page1080.evaluate(() => {
    if (window.useAppStore) {
      const state = window.useAppStore.getState();
      state.setShowFirstRunModal(false);
      state.setShowSettingsModal(false);
      state.setShowPersonalityStudio(false);
      state.setShowPermissionCenter(false);
      state.setShowWellbeingModal(false);
      state.setShowWardrobeDrawer(false);
      state.setSkinId('crimson_turtleneck');
      state.setAccessories({ commsHeadset: true, gloves: true, boots: true });
    }
  });
  await page1080.waitForTimeout(3500);

  const originalSkin1080 = await page1080.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v9_original_skin_1080p.png'), originalSkin1080);
  console.log('📸 Saved ada_v9_original_skin_1080p.png');

  // 4. Capture Wellbeing Dashboard (1920x1080)
  await page1080.evaluate(() => {
    if (window.useAppStore) {
      const state = window.useAppStore.getState();
      state.recordWellbeingRating('better');
      state.recordWellbeingRating('better');
      state.recordWellbeingRating('same');
      state.setShowWellbeingModal(true);
    }
  });
  await page1080.waitForTimeout(1000);

  const wellbeing1080 = await page1080.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v9_wellbeing_dashboard_1080p.png'), wellbeing1080);
  console.log('📸 Saved ada_v9_wellbeing_dashboard_1080p.png');

  // 5. Capture Wardrobe Drawer with new presets & accessories toggles (1920x1080)
  await page1080.evaluate(() => {
    if (window.useAppStore) {
      const state = window.useAppStore.getState();
      state.setShowWellbeingModal(false);
      state.setShowWardrobeDrawer(true);
    }
  });
  await page1080.waitForTimeout(1000);

  const wardrobe1080 = await page1080.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v9_wardrobe_accessories_1080p.png'), wardrobe1080);
  console.log('📸 Saved ada_v9_wardrobe_accessories_1080p.png');

  await browser.close();
  console.log('🎉 Round 9 visual verification complete!');
}

main().catch(console.error);
