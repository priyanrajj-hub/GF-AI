import fetch from 'node-fetch'

async function testAll() {
  console.log('🚀 Running Comprehensive Test for Finance Analyst, News Gatherer & Web Scraper...')
  const baseUrl = 'http://localhost:3001'

  // 1. Test Mutual Funds Endpoint
  try {
    const res = await fetch(`${baseUrl}/api/finance/mutual-funds?category=small`)
    const data: any = await res.json()
    console.log(`✅ [Mutual Funds API] Found ${data.count} funds (Category: ${data.category}):`)
    data.funds.forEach((f: any) => console.log(`   • ${f.name} (3Y CAGR: ${f.cagr3Y}, Expense: ${f.expenseRatio})`))
  } catch (e: any) {
    console.error('❌ [Mutual Funds API Failed]:', e.message)
  }

  // 2. Test SIP Calculator Endpoint
  try {
    const res = await fetch(`${baseUrl}/api/finance/sip-calc?monthly=10000&rate=18&years=5`)
    const data: any = await res.json()
    console.log(`✅ [SIP Calculator API]: Invested ${data.calculation.totalInvested} -> Future Value: ${data.calculation.totalFutureValue} (Gain: ${data.calculation.estimatedWealthGain})`)
  } catch (e: any) {
    console.error('❌ [SIP Calculator API Failed]:', e.message)
  }

  // 3. Test Hedging Strategies Endpoint ("he feature" / "hedging")
  try {
    const res = await fetch(`${baseUrl}/api/finance/hedging`)
    const data: any = await res.json()
    console.log(`✅ [Hedging Strategies API] Loaded ${data.strategies.length} capital preservation strategies:`)
    data.strategies.forEach((s: any) => console.log(`   • ${s.strategyName} (${s.instrument})`))
  } catch (e: any) {
    console.error('❌ [Hedging Strategies API Failed]:', e.message)
  }

  // 4. Test Live News Gatherer Endpoint
  try {
    const res = await fetch(`${baseUrl}/api/news?category=ai`)
    const data: any = await res.json()
    console.log(`✅ [Live News API] Retrieved ${data.count} headlines for AI:`)
    data.news.slice(0, 3).forEach((n: any) => console.log(`   • ${n.title} (${n.source})`))
  } catch (e: any) {
    console.error('❌ [Live News API Failed]:', e.message)
  }

  // 5. Test Web Scraper Endpoint
  try {
    const res = await fetch(`${baseUrl}/api/web/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://news.ycombinator.com' }),
    })
    const data: any = await res.json()
    if (data.page) {
      console.log(`✅ [Universal Web Scraper API] Scraped "${data.page.title}" (${data.page.wordCount} words):`)
      console.log(`   Snippet: ${data.page.mainContent.slice(0, 150)}...`)
    } else {
      console.warn('⚠️ Scrape did not return page object:', data)
    }
  } catch (e: any) {
    console.error('❌ [Universal Web Scraper API Failed]:', e.message)
  }

  // 6. Test Chat Injection with Mutual Funds
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Recommend the best mutual funds and small cap funds for me, Ada' }),
    })
    const data: any = await res.json()
    const rep = data.reply
    console.log(`✅ [Chat /api/chat MF Query Response]:`)
    console.log(`   Speech: "${rep?.speech}"`)
    console.log(`   Display: "${rep?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat MF Query Failed]:', e.message)
  }

  // 7. Test Chat Injection with New AI News
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the latest new AI news today?' }),
    })
    const data: any = await res.json()
    const rep = data.reply
    console.log(`✅ [Chat /api/chat AI News Query Response]:`)
    console.log(`   Speech: "${rep?.speech}"`)
    console.log(`   Display: "${rep?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat AI News Query Failed]:', e.message)
  }

  // 8. Test Chat Injection with Direct Web Scraping URL
  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ada, please extract and summarize the data from https://news.ycombinator.com' }),
    })
    const data: any = await res.json()
    const rep = data.reply
    console.log(`✅ [Chat /api/chat Web Scrape Query Response]:`)
    console.log(`   Speech: "${rep?.speech}"`)
    console.log(`   Display: "${rep?.display_text?.slice(0, 200)}..."`)
  } catch (e: any) {
    console.error('❌ [Chat Web Scrape Query Failed]:', e.message)
  }
}

testAll()
