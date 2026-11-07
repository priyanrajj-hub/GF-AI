import { chromium } from 'playwright-core';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function testCharacter(name, storageOverrides, screenshotName) {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  await page.evaluate((overrides) => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_first_run_completed', 'true');
    localStorage.setItem('ada_memory_consent', 'true');
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
  }, storageOverrides);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved ${screenshotName} for ${name}`);

  await browser.close();
}

async function main() {
  // 1. Tony Stark
  await testCharacter('Tony Stark', {
    ada_active_character: 'atlas',
    ada_avatar_model_url: '/models/ironman.glb'
  }, 'final_verify_stark.png');

  // 2. Yor Forger (Thorn Princess)
  await testCharacter('Yor Forger (Thorn Princess)', {
    ada_active_character: 'mira',
    ada_avatar_model_url: null,
    ada_skin_id: 'yor-thorn-princess'
  }, 'final_verify_yor.png');

  // 3. Ada Wong (RE4 Remake Scan)
  await testCharacter('Ada Wong (RE4 Remake Scan)', {
    ada_active_character: 'ada',
    ada_avatar_model_url: '/models/ada_fullbody_tripo.glb',
    ada_skin_id: 'ada-red'
  }, 'final_verify_ada_re4.png');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
