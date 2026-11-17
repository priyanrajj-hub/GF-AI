import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve('artifacts');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_legal_consented_v1', 'true');
    localStorage.setItem('ada_age_verified_18', 'true');
    localStorage.setItem('ada_active_character', 'mira');
    localStorage.setItem('ada_avatar_model_url', '/models/miku.vrm');
    localStorage.setItem('ada_skin_id', 'miku-classic-idol');
  });

  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 4000));

  console.log('Sending chat: sing World is Mine ...');
  const chatInput = await page.$('input[placeholder*="Chat with Mira"]');
  if (chatInput) {
    await chatInput.type('sing World is Mine');
    await page.keyboard.press('Enter');
    console.log('Pressed enter, waiting for AI response & singing execution...');
    await new Promise((r) => setTimeout(r, 6000));
  } else {
    console.log('Chat input not found, checking alternatives...');
  }

  const chatMessages = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.rounded-2xl, [class*="chat"], [class*="bubble"]'));
    return bubbles.map((b) => b.textContent?.trim()).filter(Boolean);
  });
  console.log('Chat Messages snippet:', chatMessages.slice(-5));

  const audioScreenshot = path.join(ARTIFACT_DIR, 'verify_miku_singing_and_chat.png');
  await page.screenshot({ path: audioScreenshot });
  console.log('Saved singing screenshot:', audioScreenshot);

  await browser.close();
}

main().catch(console.error);
