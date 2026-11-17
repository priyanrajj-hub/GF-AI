import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function main() {
  console.log('🚀 Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  // Pre-seed localStorage to bypass FirstRunModal and set default rigged model
  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_first_run_completed', 'true');
    localStorage.setItem('ada_memory_consent', 'true');
    localStorage.setItem('ada_active_character', 'ada');
    localStorage.removeItem('ada_avatar_model_url');
  });

  console.log('Navigating to http://localhost:5174...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);

  // Take screenshot 1: Ada Wong Front view (fully rigged, animated, high-key studio lighting)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ada_animated_front.png') });
  console.log('Saved verify_ada_animated_front.png');

  // Perform mouse drag in center of canvas to test 360° OrbitControls
  console.log('Testing 3D Drag Rotation (dragging from 640px to 380px)...');
  await page.mouse.move(640, 360);
  await page.mouse.down();
  await page.mouse.move(380, 360, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(2000);

  // Take screenshot 2: Rotated 3D scene view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_ada_rotated_orbit.png') });
  console.log('Saved verify_ada_rotated_orbit.png');

  // Switch to Yor Forger
  console.log('Switching to Yor Forger...');
  const yorBtn = page.locator('button', { hasText: /yor/i }).or(page.locator('button:has-text("Mira")')).first();
  if (await yorBtn.count() > 0) {
    await yorBtn.click();
  } else {
    await page.evaluate(() => {
      localStorage.setItem('ada_active_character', 'mira');
    });
    await page.reload({ waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(6000);

  // Take screenshot 3: Yor Forger without floating halo
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_yor_clean_head.png') });
  console.log('Saved verify_yor_clean_head.png');

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
