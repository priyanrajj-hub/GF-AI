import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/PRIYANRAJ J/.gemini/antigravity/brain/9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
  console.log('🚀 Launching Playwright browser for Round 8 Studio & Permissions verification...');
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
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // 1. Open Personality Studio Modal
    console.log('Opening Personality Studio Modal...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowPersonalityStudio(true);
      }
    });
    await page.waitForTimeout(1000);

    const studioShot = await page.screenshot({ fullPage: false });
    const studioPath = path.join(ARTIFACT_DIR, 'ada_personality_studio_modal.png');
    fs.writeFileSync(studioPath, studioShot);
    console.log(`Saved Personality Studio screenshot to: ${studioPath}`);

    // Switch to Blender Tab inside Personality Studio
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const blenderBtn = btns.find(b => b.innerText?.includes('Archetype Blender'));
      if (blenderBtn) blenderBtn.click();
    });
    await page.waitForTimeout(500);

    const blenderShot = await page.screenshot({ fullPage: false });
    const blenderPath = path.join(ARTIFACT_DIR, 'ada_personality_blender_tab.png');
    fs.writeFileSync(blenderPath, blenderShot);
    console.log(`Saved Blender Tab screenshot to: ${blenderPath}`);

    // Close Personality Studio
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowPersonalityStudio(false);
      }
    });
    await page.waitForTimeout(500);

    // 2. Open Permission Center Modal
    console.log('Opening Permission Center Modal...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowPermissionCenter(true);
      }
    });
    await page.waitForTimeout(1000);

    const permShot = await page.screenshot({ fullPage: false });
    const permPath = path.join(ARTIFACT_DIR, 'ada_permission_center_modal.png');
    fs.writeFileSync(permPath, permShot);
    console.log(`Saved Permission Center screenshot to: ${permPath}`);

    // Close Permission Center
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowPermissionCenter(false);
      }
    });
    await page.waitForTimeout(500);

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
