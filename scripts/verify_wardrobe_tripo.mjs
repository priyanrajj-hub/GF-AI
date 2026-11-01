import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/PRIYANRAJ J/.gemini/antigravity/brain/9dddffaa-28a4-45f4-9190-18cc1e11e741';

async function run() {
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
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Open Wardrobe drawer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.title?.includes('Wardrobe') || b.innerText?.includes('Wardrobe') || b.querySelector('svg.lucide-shirt'));
      if (target) target.click();
    });

    await page.waitForTimeout(1000);

    const shot = await page.screenshot({ fullPage: false });
    const targetPath = path.join(ARTIFACT_DIR, 'ada_tripo_wardrobe_drawer.png');
    fs.writeFileSync(targetPath, shot);
    console.log(`Saved screenshot to: ${targetPath}`);

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
