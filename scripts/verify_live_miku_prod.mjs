import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/PRIYANRAJ J/.gemini/antigravity/brain/9dddffaa-28a4-45f4-9190-18cc1e11e741';

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

  console.log('Navigating to live production URL: https://gf-ai-ochre.vercel.app ...');
  await page.goto('https://gf-ai-ochre.vercel.app', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('Page loaded, waiting for 3D model download and scene rendering...');
  await new Promise((r) => setTimeout(r, 8000));

  const avatarInfo = await page.evaluate(() => {
    const vrm = (window).__ADA_VRM__;
    const char = (window).__ACTIVE_CHAR__;
    return {
      hasVrm: Boolean(vrm),
      vrmTitle: vrm?.meta?.title || 'none',
      activeChar: char,
    };
  });
  console.log('Live Production Avatar Info:', avatarInfo);

  const screenshotPath = path.join(ARTIFACT_DIR, 'verify_live_miku_production.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved live production screenshot to:', screenshotPath);

  await browser.close();
}

main().catch(console.error);
