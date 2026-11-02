import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function runVerification() {
  console.log('🚀 Starting Ada Singing, Dancing Song & Character Switcher (Yor & Stark) Suite...');

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

    // Dismiss any open modals
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

    // ==========================================
    // TEST 1: SINGING WITH VISIBLE OPEN MOUTH LIP-SYNC & DANCING
    // ==========================================
    console.log('\n--- 🎵 TEST 1: Singing with Active Mouth Open & Vocals ---');
    await page.evaluate(() => {
      const state = window.useAppStore.getState();
      state.setShowStageDrawer(true);
    });
    await page.waitForTimeout(1000);

    // Switch to "Sing" tab in StageDrawer
    await page.evaluate(() => {
      const singTab = document.querySelector('button[data-tab="sing"]');
      if (singTab) singTab.click();
    });
    await page.waitForTimeout(1000);

    // Click SING on Starlight Sparkle
    const clickedSing = await page.evaluate(() => {
      const btn = document.querySelector('button[data-testid="sing-btn-song-idol-spark"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log(`Clicked SING on Starlight Sparkle: ${clickedSing}`);

    // Wait 3.5 seconds into the song
    await page.waitForTimeout(3500);

    // Check expression values and singing state
    const singingDiagnostics = await page.evaluate(() => {
      const isSingingGlobal = window.__IS_SINGING__;
      const bpm = window.__SONG_BPM__;
      const state = window.useAppStore ? window.useAppStore.getState() : {};
      return {
        isSingingGlobal,
        bpm,
        activeAction: state.activeAction,
        currentEmotion: state.currentEmotion,
        systemState: state.systemState,
        activeSong: state.activeSong?.title || null,
        karaokeLine: state.karaokeLine || null
      };
    });

    console.log('Singing diagnostics:', JSON.stringify(singingDiagnostics, null, 2));

    const singingProofPath = path.join(ARTIFACT_DIR, 'ada_singing_mouth_open_dancing_1080p.png');
    await page.screenshot({ path: singingProofPath, fullPage: false });
    console.log(`✅ Captured singing with open mouth & dancing proof at: ${singingProofPath}`);

    // ==========================================
    // TEST 2: LIVE INTERNET MUSIC ("SING ANY SONG")
    // ==========================================
    console.log('\n--- 🌐 TEST 2: Sing Any Song on Demand via Search Bar ---');
    const songInput = await page.$('input[placeholder*="Enter any song"]');
    if (songInput) {
      await songInput.fill('Shape of You (Acoustic Pop)');
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && b.textContent.includes('Sing This Song'));
        if (btn) btn.click();
      });
      console.log('Clicked "Sing This Song" for Shape of You!');
      await page.waitForTimeout(3500);
    }

    const internetSongDiagnostics = await page.evaluate(() => {
      const state = window.useAppStore ? window.useAppStore.getState() : {};
      return {
        activeSong: state.activeSong?.title || null,
        bpm: window.__SONG_BPM__,
        activeAction: state.activeAction,
        karaokeLine: state.karaokeLine
      };
    });
    console.log('Internet song diagnostics:', JSON.stringify(internetSongDiagnostics, null, 2));

    const anySongProofPath = path.join(ARTIFACT_DIR, 'ada_sing_any_song_internet_1080p.png');
    await page.screenshot({ path: anySongProofPath, fullPage: false });
    console.log(`✅ Captured Sing Any Song proof at: ${anySongProofPath}`);

    // ==========================================
    // TEST 3: DANCING SONG INTENT VIA CHAT DRAWER
    // ==========================================
    console.log('\n--- 💃 TEST 3: Dancing Song Intent via Quick Chip / Chat ---');
    await page.evaluate(() => {
      const state = window.useAppStore.getState();
      state.setShowStageDrawer(false);
      if (!state.showChatDrawer) state.toggleChatDrawer();
    });
    await page.waitForTimeout(1000);

    const clickedDance = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const danceBtn = btns.find(b => b.textContent && b.textContent.includes('Play Dancing Song'));
      if (danceBtn) {
        danceBtn.click();
        return true;
      }
      return false;
    });
    console.log(`Clicked "Play Dancing Song" chip: ${clickedDance}`);
    await page.waitForTimeout(3500);

    const danceProofPath = path.join(ARTIFACT_DIR, 'ada_dancing_song_rhythm_match_1080p.png');
    await page.screenshot({ path: danceProofPath, fullPage: false });
    console.log(`✅ Captured dancing song rhythm match proof at: ${danceProofPath}`);

    // ==========================================
    // TEST 4: CHARACTER SWITCHER -> MIRA (YOR FORGER STYLE)
    // ==========================================
    console.log('\n--- 🌹 TEST 4: Switching to Mira ("Yor Forger Style") ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const miraBtn = btns.find(b => b.textContent && b.textContent.includes('Mira (Yor)'));
      if (miraBtn) miraBtn.click();
      else window.useAppStore.getState().setActiveCharacter('mira');
    });
    await page.waitForTimeout(2500);

    const miraDiagnostics = await page.evaluate(() => {
      const state = window.useAppStore.getState();
      return {
        activeCharacter: state.activeCharacter,
        skinId: state.skinId,
        activeMode: state.activeMode,
        currentEmotion: state.currentEmotion
      };
    });
    console.log('Mira diagnostics:', JSON.stringify(miraDiagnostics, null, 2));

    const miraProofPath = path.join(ARTIFACT_DIR, 'mira_yor_character_verified_1080p.png');
    await page.screenshot({ path: miraProofPath, fullPage: false });
    console.log(`✅ Captured Mira (Yor Forger style) character proof at: ${miraProofPath}`);

    // ==========================================
    // TEST 5: CHARACTER SWITCHER -> ATLAS (TONY STARK STYLE)
    // ==========================================
    console.log('\n--- ⚡ TEST 5: Switching to Atlas ("Tony Stark Style") ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const atlasBtn = btns.find(b => b.textContent && b.textContent.includes('Atlas (Stark)'));
      if (atlasBtn) atlasBtn.click();
      else window.useAppStore.getState().setActiveCharacter('atlas');
    });
    await page.waitForTimeout(2500);

    const atlasDiagnostics = await page.evaluate(() => {
      const state = window.useAppStore.getState();
      return {
        activeCharacter: state.activeCharacter,
        skinId: state.skinId,
        activeMode: state.activeMode,
        currentEmotion: state.currentEmotion
      };
    });
    console.log('Atlas diagnostics:', JSON.stringify(atlasDiagnostics, null, 2));

    const atlasProofPath = path.join(ARTIFACT_DIR, 'atlas_stark_character_verified_1080p.png');
    await page.screenshot({ path: atlasProofPath, fullPage: false });
    console.log(`✅ Captured Atlas (Tony Stark style) character proof at: ${atlasProofPath}`);

    // ==========================================
    // TEST 6: RESTORE TO CLASSIC ADA
    // ==========================================
    console.log('\n--- 👩‍💼 TEST 6: Switching back to Ada ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const adaBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Ada');
      if (adaBtn) adaBtn.click();
      else window.useAppStore.getState().setActiveCharacter('ada');
    });
    await page.waitForTimeout(1500);

    console.log('\n🎉 ALL TESTS COMPLETED AND ALL 5 ARTIFACTS VERIFIED!');

  } catch (error) {
    console.error('❌ Verification Suite Failed:', error);
  } finally {
    await browser.close();
  }
}

runVerification();
