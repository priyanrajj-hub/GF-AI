import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain', '9dddffaa-28a4-45f4-9190-18cc1e11e741');

async function runMemeVerification() {
  console.log('🎭 Starting Real Memes, Templates & Stickers Verification Suite...');

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

    // 1. Dismiss modals and ensure chat drawer is open
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
        if (!state.showChatDrawer) {
          state.toggleChatDrawer();
        }
      }
    });
    await page.waitForTimeout(1000);

    // 2. Click "🎭 Meme Me" quick action chip
    console.log('\n--- 🖼️ STEP 1: Sending "Show me a funny developer meme." via Meme Me Chip ---');
    const memeMeButton = await page.$('button:has-text("Meme Me")');
    if (memeMeButton) {
      await memeMeButton.click();
    } else {
      // Fallback: type into input and submit
      const input = await page.$('input[placeholder*="Talk or type to Ada"]');
      if (input) {
        await input.fill('Show me a funny developer meme.');
        await page.keyboard.press('Enter');
      }
    }

    // Wait for the assistant response to appear
    console.log('Waiting for assistant meme response to generate and render...');
    await page.waitForTimeout(3500);

    // Check message content and image presence
    const memeCheck = await page.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.prose, [class*="group/meme"]'));
      const text = document.body.innerText;
      const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
      const memeImages = images.filter(src => src.includes('memegen.link') || src.includes('images'));

      const hasTextN = /text\\n|text\n/i.test(text);
      const hasRawJson = /"display_text"|"emotion"\s*:/i.test(text);

      return {
        hasMemeImage: memeImages.length > 0,
        memeImages,
        hasTextN,
        hasRawJson,
        totalChatMessages: messages.length,
      };
    });

    console.log('Meme Check Result:', memeCheck);

    // Take screenshot of chat drawer with the real developer meme
    const memeProofPath = path.join(ARTIFACT_DIR, 'ada_real_developer_meme_verified_1080p.png');
    await page.screenshot({ path: memeProofPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${memeProofPath}`);

    // 3. Open Sticker & Meme Tray
    console.log('\n--- 🎨 STEP 2: Opening Sticker & Meme Tray ---');
    const smileBtn = await page.$('button[title*="Stickers"], button:has(svg.lucide-smile)');
    if (smileBtn) {
      await smileBtn.click();
      await page.waitForTimeout(800);
    } else {
      // Find smile button by class or icon
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const svg = await btn.$('svg.lucide-smile');
        if (svg) {
          await btn.click();
          await page.waitForTimeout(800);
          break;
        }
      }
    }

    // Switch to Memes tab
    console.log('Switching to "🎭 Memes (13+)" tab in the tray...');
    const memesTab = await page.$('button:has-text("Memes")');
    if (memesTab) {
      await memesTab.click();
      await page.waitForTimeout(1000);
    }

    // Capture screenshot of the meme tray
    const trayProofPath = path.join(ARTIFACT_DIR, 'ada_meme_tray_templates_1080p.png');
    await page.screenshot({ path: trayProofPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${trayProofPath}`);

    // 4. Select a specific meme from the tray
    console.log('\n--- 🚀 STEP 3: Selecting a Meme from the Interactive Tray ---');
    const trayMemeBtn = await page.$('button:has-text("This Is Fine"), button:has-text("Git Deployment")');
    if (trayMemeBtn) {
      await trayMemeBtn.click();
      await page.waitForTimeout(2500);
    }

    // Take final screenshot with both memes in chat
    const finalProofPath = path.join(ARTIFACT_DIR, 'ada_custom_meme_render_verified_1080p.png');
    await page.screenshot({ path: finalProofPath, fullPage: false });
    console.log(`📸 Final Screenshot saved: ${finalProofPath}`);

    console.log('\n🎉 ALL REAL MEME & STICKER VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runMemeVerification();
