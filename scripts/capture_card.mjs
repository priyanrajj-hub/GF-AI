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

  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  await page.goto('https://gf-ai-ochre.vercel.app', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_first_run_completed', 'true');
    localStorage.setItem('ada_memory_consent', 'true');
    localStorage.setItem('ada_active_character', 'atlas');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  const btn = await page.getByRole('button', { name: /Stock Picks/i });
  if (btn) await btn.click();
  await page.waitForTimeout(8000);

  const card = await page.locator('div.rounded-2xl:has-text("STARK QUANT MATRIX"):has(svg)').first();
  if (card) {
    const screenshotPath = path.join(ARTIFACT_DIR, 'verify_trading_card_direct_element.png');
    await card.screenshot({ path: screenshotPath });
    console.log('Saved verify_trading_card_direct_element.png');
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
