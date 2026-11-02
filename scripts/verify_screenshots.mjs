import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');
const SCRATCH_DIR = path.join(ARTIFACT_DIR, 'scratch');

const VIEWPORTS = [
  { name: 'desktop_1920x1080', width: 1920, height: 1080 },
  { name: 'laptop_1366x768', width: 1366, height: 768 },
  { name: 'mobile_390x844', width: 390, height: 844 },
];

function saveScreenshot(filename, buffer) {
  fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
  fs.writeFileSync(path.join(SCRATCH_DIR, filename), buffer);
  console.log(`📸 Saved screenshot to: ${filename}`);
}

async function run() {
  console.log('🚀 Starting Playwright verification with Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
      // Wait for Three.js canvas, VRM model download and skin override application
      await page.waitForTimeout(6000);

      // Check canvas
      const canvasExists = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        return !!c && c.width > 0 && c.height > 0;
      });

      // Check for raw markdown asterisks in chat
      const hasRawMarkdown = await page.evaluate(() => {
        const text = document.body.innerText;
        return /\*\*[^*]+\*\*/.test(text);
      });

      // Check if bottom bar is inside viewport
      const bottomBarInViewport = await page.evaluate((vpHeight) => {
        const mic = document.querySelector('button[title*="Microphone"], button[title*="Hands-free"], .waveform-ring') || document.querySelector('input');
        if (!mic) return true;
        const rect = mic.getBoundingClientRect();
        return rect.bottom <= vpHeight + 2;
      }, vp.height);

      const buffer = await page.screenshot({ fullPage: false });
      saveScreenshot(`${vp.name}.png`, buffer);

      results.push({
        viewport: vp.name,
        canvasRendered: canvasExists,
        hasRawMarkdown,
        bottomBarInViewport,
        consoleErrorsCount: consoleErrors.length,
        consoleErrors: consoleErrors.slice(0, 3)
      });
    } catch (err) {
      console.error(`Error on ${vp.name}:`, err.message);
      results.push({
        viewport: vp.name,
        error: err.message
      });
    } finally {
      await page.close();
    }
  }

  // Test Stage Drawer Open at 1920x1080
  console.log('\nTesting Stage Drawer at http://localhost:5173...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(6000);
    const stageBtn = await page.$('button[title*="Performance Stage"]');
    if (stageBtn) {
      await stageBtn.click();
      await page.waitForTimeout(1000);
    }
    const stageBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('stage_drawer_1920x1080.png', stageBuffer);
    await page.close();
  }

  // Test Wardrobe Drawer Open at 1920x1080
  console.log('\nTesting Wardrobe Drawer at http://localhost:5173...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(6000);
    const wardrobeBtn = await page.$('button[title*="Wardrobe"]');
    if (wardrobeBtn) {
      await wardrobeBtn.click();
      await page.waitForTimeout(1000);
    }
    const wardrobeBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('wardrobe_drawer_1920x1080.png', wardrobeBuffer);
    await page.close();
  }

  // Test Environment Drawer Open at 1920x1080
  console.log('\nTesting Environment Drawer at http://localhost:5173...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(6000);
    const envBtn = await page.$('button[title*="Environments"]');
    if (envBtn) {
      await envBtn.click();
      await page.waitForTimeout(1000);
    }
    const envBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('environment_drawer_1920x1080.png', envBuffer);
    await page.close();
  }

  // Test Reaction Lab at http://localhost:5173/reaction-lab
  console.log('\nTesting Reaction Lab at http://localhost:5173/reaction-lab...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173/reaction-lab', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const reactionBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('reaction_lab_1920x1080.png', reactionBuffer);
    await page.close();
  }

  // Also test Debug HUD (?debug=1)
  console.log('\nTesting Debug HUD at http://localhost:5173/?debug=1...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(6000);
    const debugBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('debug_hud_1920x1080.png', debugBuffer);
    await page.close();
  }

  // Also test Animation Test bench (/animation-test)
  console.log('\nTesting Animation Test bench at http://localhost:5173/animation-test...');
  {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:5173/animation-test', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const animBuffer = await page.screenshot({ fullPage: false });
    saveScreenshot('animation_test_bench.png', animBuffer);
    await page.close();
  }

  await browser.close();

  console.log('\n=========================================');
  console.log('TEST SUMMARY RESULTS:');
  console.log(JSON.stringify(results, null, 2));
  console.log('=========================================');
}

run().catch(console.error);
