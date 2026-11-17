import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('ada_first_run_acknowledged', 'true');
    localStorage.setItem('ada_legal_consented_v1', 'true');
    localStorage.setItem('ada_age_verified_18', 'true');
  });

  await page.goto('https://gf-ai-ochre.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const chatInput = await page.waitForSelector('input[placeholder*="Ask"], textarea[placeholder*="Ask"]', { timeout: 8000 });
  if (chatInput) {
    await chatInput.click();
    await chatInput.type('What are the opening and closing times of NSE, BSE, MCX, and US markets?');
    await page.keyboard.press('Enter');
  }

  // Wait 15 seconds for full stream completion & card render
  await new Promise(r => setTimeout(r, 15000));

  await page.screenshot({ path: 'C:/Users/PRIYANRAJ J/.gemini/antigravity/brain/9dddffaa-28a4-45f4-9190-18cc1e11e741/verify_live_market_hours_rendered.png' });
  console.log('Rendered screenshot saved!');
  await browser.close();
}

main().catch(console.error);
