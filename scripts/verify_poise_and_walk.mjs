import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PRIYANRAJ J\\.gemini\\antigravity\\brain\\9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function main() {
  console.log('🚀 Launching browser to capture serene home pad poise...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  // Wait 4 seconds for avatar shaders, lighting and contrapposto to stabilize
  await page.waitForTimeout(4000);

  // Close any open modal just in case
  await page.evaluate(() => {
    if (window.useAppStore) {
      const state = window.useAppStore.getState();
      if (state.setShowSettingsModal) state.setShowSettingsModal(false);
      if (state.setShowPersonalityStudio) state.setShowPersonalityStudio(false);
      if (state.setShowPermissionCenter) state.setShowPermissionCenter(false);
    }
  });
  await page.waitForTimeout(1000);

  const buffer = await page.screenshot({ fullPage: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_serene_poise_1080p.png'), buffer);
  console.log('📸 Saved ada_serene_poise_1080p.png');

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
