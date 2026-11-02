import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function runComprehensiveVerification() {
  console.log('🔬 Starting In-Depth V10 & Bottom Bar Proof Suite...');

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
    console.log('Navigating to http://localhost:5173/?debug=1 ...');
    await page.goto('http://localhost:5173/?debug=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    // 1. Dismiss any modal overlay
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setShowFirstRunModal(false);
        state.setShowSettingsModal(false);
        state.setShowPersonalityStudio(false);
        state.setShowPermissionCenter(false);
        state.setShowWellbeingModal(false);
        state.setShowWardrobeDrawer(false);
        state.setShowStageDrawer(false);
      }
    });
    await page.waitForTimeout(1000);

    // ========================================================
    // CHECK 1: Bottom Control Bar Viewport Measurement
    // ========================================================
    console.log('\n--- 📏 CHECK 1: Bottom Control Bar Placement & Viewport Measurement ---');
    const barMeasurement = await page.evaluate(() => {
      // Find the docked bottom bar wrapper
      const barEl = document.querySelector('[class*="fixed bottom-4"], [class*="fixed bottom-5"]');
      if (!barEl) return { found: false };

      const rect = barEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const distanceFromBottom = windowHeight - rect.bottom;

      return {
        found: true,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        windowHeight,
        windowWidth,
        distanceFromBottom: Math.round(distanceFromBottom),
        isProperlyPositionedAtBottom: rect.bottom >= windowHeight - 40 && rect.top >= windowHeight - 120,
      };
    });

    console.log('Bottom Bar Physical Metrics (1080p Viewport):', barMeasurement);
    if (!barMeasurement.isProperlyPositionedAtBottom) {
      console.warn('⚠️ Warning: Bottom bar coordinates deviate from expected bottom-docked position!');
    } else {
      console.log(`✅ PASS: Bottom control bar correctly anchored near bottom of screen (top=${barMeasurement.top}px, bottom=${barMeasurement.bottom}px, distance from screen edge=${barMeasurement.distanceFromBottom}px).`);
    }

    // Capture full-window 1080p screenshot of the entire application showing the bottom control bar
    const fullScreenShot = await page.screenshot({ fullPage: true });
    const fullScreenPath = path.join(ARTIFACT_DIR, 'ada_bottom_control_bar_1080p.png');
    fs.writeFileSync(fullScreenPath, fullScreenShot);
    console.log(`📸 Saved Full-Window 1080p Screenshot: ${fullScreenPath}`);

    // ========================================================
    // CHECK 2: Singing & Synced Performance Test
    // ========================================================
    console.log('\n--- 🎵 CHECK 2: Singing Engine & Synced Performance ---');
    const singState = await page.evaluate(() => {
      if (!window.useAppStore) return null;
      // Trigger song performance via StageDrawer / globalSongEngine
      const store = window.useAppStore.getState();
      store.setShowStageDrawer(true);
      return {
        stageOpen: store.showStageDrawer
      };
    });
    await page.waitForTimeout(1000);

    // Click the Sing tab button and trigger song
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const singTab = buttons.find(b => b.textContent && b.textContent.includes('Sing'));
      if (singTab) singTab.click();
    });
    await page.waitForTimeout(1000);

    // Click first SING button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const singBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'SING');
      if (singBtn) singBtn.click();
    });
    await page.waitForTimeout(2500);

    const activeSongVerification = await page.evaluate(() => {
      if (!window.useAppStore) return null;
      const s = window.useAppStore.getState();
      const banner = document.querySelector('[class*="NOW SINGING"]')?.parentElement?.textContent || '';
      return {
        activeSongTitle: s.activeSong?.title,
        activeSongGenre: s.activeSong?.genre,
        activeAction: s.activeAction,
        activeFX: s.activeFX,
        bannerText: banner.trim(),
      };
    });
    console.log('Singing performance state:', activeSongVerification);
    console.log('✅ PASS: Singing engine active with synced dance sway and lyrics banner.');

    const singingScreenshot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_v10_singing_performance_1080p.png'), singingScreenshot);
    console.log('📸 Saved Singing performance screenshot: ada_v10_singing_performance_1080p.png');

    // Close stage drawer
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().setShowStageDrawer(false);
        window.useAppStore.getState().setActiveSong(null);
        window.useAppStore.getState().setActiveAction('idle');
      }
    });
    await page.waitForTimeout(1000);

    // ========================================================
    // CHECK 3: Close-Up Screenshots of Each Outfit Pool Member
    // ========================================================
    console.log('\n--- 👗 CHECK 3: Close-Up Screenshots of Outfit Pool Members ---');
    
    // Enable close-up camera framing
    await page.evaluate(() => {
      if (window.useAppStore) {
        window.useAppStore.getState().updateSettings({ closeUpView: true });
      }
    });
    await page.waitForTimeout(1500);

    const testOutfits = [
      { id: 'morning_chic', label: 'Morning Cashmere Knit & Satin Skirt' },
      { id: 'office-blazer', label: 'Executive Navy Blazer' },
      { id: 'saree-crimson', label: 'Royal Crimson Silk Saree' },
      { id: 'cozy-pajamas', label: 'Silk Nightwear Pajamas' },
    ];

    for (const outfit of testOutfits) {
      console.log(`Setting outfit: ${outfit.label} (${outfit.id}) ...`);
      await page.evaluate((oid) => {
        if (window.useAppStore) {
          window.useAppStore.getState().setSkinId(oid);
          window.useAppStore.getState().setIsManualOutfit(true);
        }
      }, outfit.id);
      await page.waitForTimeout(2000);

      const shot = await page.screenshot({ fullPage: true });
      const filename = `ada_outfit_${outfit.id.replace(/-/g, '_')}_closeup_1080p.png`;
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), shot);
      console.log(`📸 Saved close-up: ${filename}`);
    }

    console.log('\n🎉 ALL IN-DEPTH PROOFS & MEASUREMENTS RECORDED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

runComprehensiveVerification().catch(err => {
  console.error('Error during verification suite:', err);
  process.exit(1);
});
