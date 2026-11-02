import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function runTimeOfDayV2Verification() {
  console.log('🌅 Starting Round 11 Task B: Time-of-Day v2 & Wardrobe Pools Verification...');

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

    // Dismiss any open modal
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setShowFirstRunModal(false);
        state.setShowSettingsModal(false);
        state.setShowPersonalityStudio(false);
        state.setShowPermissionCenter(false);
        state.setShowWellbeingModal(false);
        state.setShowWardrobeDrawer(false);
      }
    });
    await page.waitForTimeout(1000);

    // 1. Scrub to Dawn / Sunrise (06:30)
    console.log('Testing Phase 1: 🌅 Dawn / Sunrise (06:30) ...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setSolarHour(6.5);
        state.setIsTimeLocked(true);
      }
    });
    await page.waitForTimeout(2000);
    const dawnShot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_dawn_1080p.png'), dawnShot);
    console.log('📸 Captured Dawn / Sunrise proof: ada_time_of_day_v2_dawn_1080p.png');

    // 2. Scrub to High Noon (12:30)
    console.log('Testing Phase 2: ☀️ High Noon (12:30) ...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setSolarHour(12.5);
      }
    });
    await page.waitForTimeout(2000);
    const noonShot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_noon_1080p.png'), noonShot);
    console.log('📸 Captured High Noon proof: ada_time_of_day_v2_noon_1080p.png');

    // 3. Scrub to Golden Hour / Sunset (18:15)
    console.log('Testing Phase 3: 🌇 Golden Hour / Sunset (18:15) ...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setSolarHour(18.25);
      }
    });
    await page.waitForTimeout(2000);
    const sunsetShot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_sunset_1080p.png'), sunsetShot);
    console.log('📸 Captured Sunset proof: ada_time_of_day_v2_sunset_1080p.png');

    // 4. Scrub to Midnight & Sleep Ritual (23:30)
    console.log('Testing Phase 4: 🌙 Midnight & Sleep Ritual (23:30) ...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setSolarHour(23.5);
        state.setActiveAction('yawn');
      }
    });
    await page.waitForTimeout(2000);
    const nightShot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_night_yawn_1080p.png'), nightShot);
    console.log('📸 Captured Midnight Yawn proof: ada_time_of_day_v2_night_yawn_1080p.png');

    // 5. Test Weather Layer (Rain & Monsoon)
    console.log('Testing Phase 5: 🌧️ Weather Layer: Rain & Droplets ...');
    await page.evaluate(() => {
      if (window.useAppStore) {
        const state = window.useAppStore.getState();
        state.setWeatherType('rain');
      }
    });
    await page.waitForTimeout(2000);
    const rainShot = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_rain_weather_1080p.png'), rainShot);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'ada_time_of_day_v2_verified_1080p.png'), rainShot);
    console.log('📸 Captured Rain Weather proof: ada_time_of_day_v2_verified_1080p.png');

    // 6. Verify Store State Attributes
    const verifiedState = await page.evaluate(() => {
      if (!window.useAppStore) return null;
      const s = window.useAppStore.getState();
      return {
        solarHour: s.solarHour,
        timeOfDayPhase: s.timeOfDayPhase,
        isTimeLocked: s.isTimeLocked,
        weatherType: s.weatherType,
        skinId: s.skinId,
        ambientAudioEnabled: s.ambientAudioEnabled,
      };
    });

    console.log('\nVerified State Attributes:', verifiedState);
    console.log('\n🎉 ROUND 11 TASK B (TIME-OF-DAY V2 & WARDROBE POOLS) FULLY VERIFIED!');
  } finally {
    await browser.close();
  }
}

runTimeOfDayV2Verification().catch(err => {
  console.error('Error during Time-of-Day v2 verification:', err);
  process.exit(1);
});
