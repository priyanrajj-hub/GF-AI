import { chromium } from 'playwright-core';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_first_run_completed', 'true');
    localStorage.setItem('ada_memory_consent', 'true');
    localStorage.setItem('ada_active_character', 'mira');
    localStorage.removeItem('ada_avatar_model_url');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Drag OrbitControls on canvas
  await page.mouse.move(500, 360);
  await page.mouse.down();
  await page.mouse.move(250, 360, { steps: 25 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_yor_side_orbit.png') });
  console.log('Saved verify_yor_side_orbit.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
