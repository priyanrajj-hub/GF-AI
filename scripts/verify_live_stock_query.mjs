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
  await page.goto('https://gf-ai-ochre.vercel.app', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_first_run_completed', 'true');
    localStorage.setItem('ada_memory_consent', 'true');
    localStorage.setItem('ada_active_character', 'atlas');
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Click the 'Stock Picks' quick chip button
  const stockPicksBtn = await page.getByRole('button', { name: /Stock Picks/i });
  if (stockPicksBtn) {
    await stockPicksBtn.click();
    console.log('Clicked Stock Picks button');
  }

  // Wait for response and trading card to render
  await page.waitForTimeout(8000);

  // Scroll to TradingCard element
  await page.evaluate(() => {
    const cardEl = document.querySelector('svg polyline, svg polygon, .shadow-2xl');
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'instant', block: 'center' });
    }
  });
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(ARTIFACT_DIR, 'verify_live_stock_query_fixed.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved verify_live_stock_query_fixed.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
