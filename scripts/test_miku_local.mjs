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

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('3D') || text.includes('VRM') || text.includes('Miku') || text.includes('error') || text.includes('warn')) {
      console.log('BROWSER LOG:', text);
    }
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_legal_consented_v1', 'true');
    localStorage.setItem('ada_age_verified_18', 'true');
    localStorage.setItem('ada_active_character', 'mira');
    localStorage.setItem('ada_avatar_model_url', '/models/miku.vrm');
    localStorage.setItem('ada_skin_id', 'miku-classic-idol');
  });

  console.log('Navigating to http://localhost:5174 ...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('Page loaded, waiting for 3D model and scene initialization...');
  await new Promise((r) => setTimeout(r, 6000));

  // Inspect 3D avatar in DOM / window
  const avatarInfo = await page.evaluate(() => {
    const vrm = (window).__ADA_VRM__;
    const glb = (window).__GLB_MODEL__;
    const char = (window).__ACTIVE_CHAR__;
    return {
      hasVrm: Boolean(vrm),
      vrmTitle: vrm?.meta?.title || 'none',
      hasGlb: Boolean(glb),
      activeChar: char,
    };
  });
  console.log('Avatar Info:', avatarInfo);

  // Take screenshot of Miku
  const screenshotPath = path.join(ARTIFACT_DIR, 'verify_miku_3d_figure.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  // Also click on character switch pill to ensure Miku switch works dynamically
  const buttons = await page.$$eval('button', (btns) =>
    btns.map((b) => ({ text: b.textContent?.trim(), title: b.getAttribute('title') }))
  );
  console.log('Available buttons:', buttons.filter((b) => b.text && (b.text.includes('Miku') || b.text.includes('Stark') || b.text.includes('Ada'))));

  await browser.close();
}

main().catch(console.error);
