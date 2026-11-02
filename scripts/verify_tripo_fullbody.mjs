import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || "", ".gemini", "antigravity", "brain", "9dddffaa-28a4-45f4-9190-18cc1e11e741");

async function run() {
  console.log('🚀 Launching Playwright browser...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Avatar') || text.includes('Tripo') || msg.type() === 'error') {
      console.log(`[Browser ${msg.type()}]:`, text);
    }
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // 1. Open Settings modal
    console.log('Opening settings modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.title?.includes('Settings') || b.innerText?.includes('Settings') || b.innerHTML?.includes('lucide-sliders') || b.querySelector('svg.lucide-sliders'));
      if (target) target.click();
    });
    await page.waitForTimeout(1000);

    // Screenshot Settings Modal with Tripo 3D Crossbow option visible
    const settingsShot = await page.screenshot({ fullPage: false });
    const settingsPath = path.join(ARTIFACT_DIR, 'ada_tripo3d_model_settings.png');
    fs.writeFileSync(settingsPath, settingsShot);
    console.log(`Saved Settings Modal screenshot to: ${settingsPath}`);

    // 2. Click "Tripo 3D Crossbow" button
    console.log('Clicking Tripo 3D Crossbow button...');
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tripoBtn = btns.find(b => b.innerText?.includes('Tripo 3D Crossbow'));
      if (tripoBtn) {
        tripoBtn.click();
        return true;
      }
      return false;
    });
    console.log('Tripo button clicked:', clicked);
    await page.waitForTimeout(1000);

    // 3. Close Settings modal
    console.log('Closing settings modal...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowSettingsModal(false);
      }
    });
    await page.waitForTimeout(1000);

    // 4. Wait for 19MB Tripo PBR GLB model to load and meshopt decode
    console.log('Waiting for Tripo 3D Full-Body model to render on stage...');
    await page.waitForTimeout(8000);

    // Capture Full-Body Tripo Stage screenshot
    const stageShot = await page.screenshot({ fullPage: false });
    const stagePath = path.join(ARTIFACT_DIR, 'ada_tripo3d_fullbody_stage.png');
    fs.writeFileSync(stagePath, stageShot);
    console.log(`Saved Tripo 3D Stage screenshot to: ${stagePath}`);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
