import fetch from 'node-fetch'

async function scrapePriyanWeb() {
  console.log("🔍 Scraping Priyan's web presence...")

  // 1. Portfolio
  try {
    const res = await fetch('https://priyanrajj-hub.github.io/PORTFOLIO/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    })
    console.log('Portfolio HTTP Status:', res.status)
    const text = await res.text()
    const clean = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    console.log('Portfolio snippet:', clean.slice(0, 1000))
  } catch (e: any) {
    console.warn('Portfolio fetch note:', e.message)
  }

  // 2. GitHub README Raw
  try {
    const res = await fetch('https://raw.githubusercontent.com/priyanrajj-hub/priyanrajj-hub/main/README.md', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    })
    console.log('GitHub Raw README Status:', res.status)
    if (res.ok) {
      const md = await res.text()
      console.log('GitHub Raw README:\n', md)
    }
  } catch (e: any) {
    console.warn('GitHub README fetch note:', e.message)
  }
}

scrapePriyanWeb()
