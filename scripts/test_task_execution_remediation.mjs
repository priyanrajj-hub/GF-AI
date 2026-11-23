import assert from 'node:assert/strict'
import { TaskExecutionService } from '../apps/server/src/services/taskExecutionService.js'
import { handleDirectActions } from '../apps/server/src/services/chatDirectActions.js'

console.log('═══════════════════════════════════════════════════════════════')
console.log(' 🚀 TASK EXECUTION ENGINE VERIFICATION SUITE')
console.log('═══════════════════════════════════════════════════════════════\n')

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✓ PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

async function runAll() {
  // ─── 1. YouTube Task Execution ───
  console.log('─── 1. YouTube Task Execution ───')

  await test('"open youtube: play a miku video" generates YouTube taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'open youtube: play a miku video',
      'en',
      'open youtube: play a miku video',
      'atlas'
    )
    assert.ok(result, 'Result must not be null')
    assert.ok(result.reply.taskAction, 'reply.taskAction must be attached')
    assert.equal(result.reply.taskAction.type, 'youtube')
    assert.ok(result.reply.taskAction.url.includes('youtube.com'))
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed'))
    assert.ok(result.reply.taskAction.query.toLowerCase().includes('miku'))
    assert.equal(result.reply.taskAction.status, 'ready')
    assert.ok(result.reply.actions.some(a => a.name === 'open_youtube'))
  })

  await test('"open youtube and play madangowrilatest vedio" resolves direct video playback', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'open youtube and play madangowrilatest vedio',
      'en',
      'open youtube and play madangowrilatest vedio',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.query.includes('Madan Gowri'))
    assert.ok(result.reply.taskAction.url.includes('youtube.com'))
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed'))
  })

  await test('"play a vedio on youtube it must go search and play the vedio" generates direct video playback', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'play a vedio on youtube it must go search and play the vedio',
      'en',
      'play a vedio on youtube it must go search and play the vedio',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.url.includes('youtube.com'))
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed'))
    assert.equal(result.reply.taskAction.status, 'ready')
  })

  await test('"i need the resent video of madhan gowri latest video" resolves the fresh latest video with upload date sorting', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'i need the resent video of madhan gowri latest video',
      'en',
      'i need the resent video of madhan gowri latest video',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.query.includes('Madan Gowri'))
    assert.ok(result.reply.taskAction.url.includes('youtube.com'))
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed'))
    assert.ok(result.reply.taskAction.data?.videoId, 'Must have resolved a concrete videoId')
  })

  await test('Tony Stark with generic "play video" returns Iron Man spotlight video with zero hallucination', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'play video',
      'en',
      'play video',
      'atlas'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed/3op3Y2cpRAg'))
    assert.ok(result.reply.taskAction.title.includes('Iron Man'))
    assert.ok(!result.reply.taskAction.subtitle?.includes('18y ago'), 'Must not hallucinate 18y ago')
  })

  await test('"its not the recent new vedio" recalibrates with chat history and resolves official newest video', async () => {
    // Seed chat history for test-user
    const { db } = await import('../apps/server/src/db/index.js')
    await db.addMessage('test-user-correction', {
      id: 'msg-prev',
      role: 'assistant',
      speaker: 'ada',
      content: 'Playing video',
      taskAction: {
        type: 'youtube',
        title: 'Older Video',
        query: 'Madan Gowri',
        url: 'https://youtube.com',
      },
      timestamp: Date.now() - 5000,
    })

    const result = await TaskExecutionService.handleTaskIntent(
      'test-user-correction',
      'its not the recent new vedio',
      'en',
      'its not the recent new vedio',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.url.includes('youtube.com'))
    assert.ok(result.reply.taskAction.embedUrl.includes('youtube.com/embed'))
    assert.ok(!result.reply.taskAction.subtitle?.includes('3 yr ago'), 'Must not return 3-year-old video')
    assert.ok(result.reply.speech.includes('recalibrated') || result.reply.speech.includes('latest'), 'Speech must confirm recalibration to latest upload')
  })

  await test('Serverless stateless correction with explicit context payload recalibrates and skips previous video', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'stateless-user',
      'its not the recent new vedio',
      'en',
      'its not the recent new vedio',
      'ada',
      {
        lastTaskQuery: 'A2D Channel',
        lastVideoId: 'dv_FLZQEgFY',
      }
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'youtube')
    assert.ok(result.reply.taskAction.data?.videoId, 'Must have resolved videoId')
    assert.notEqual(result.reply.taskAction.data?.videoId, 'dv_FLZQEgFY', 'Must skip previously played video')
    assert.ok(!result.reply.taskAction.subtitle?.includes('18y ago'), 'Must not return 18-year-old video')
    assert.ok(!result.reply.taskAction.subtitle?.includes('3 yr ago'), 'Must not return 3-year-old video')
  })

  await test('A2D Channel latest video resolution returns chronological recent upload', async () => {
    const result = await TaskExecutionService.resolveChannelLatestUpload('a2d', 4500, { preferFullVideo: true })
    assert.ok(result, 'Must resolve A2D upload')
    assert.ok(result.videoId, 'Must have videoId')
    assert.ok(result.title, 'Must have video title')
    assert.ok(result.publishedTime, 'Must have published time')
    assert.ok(!result.publishedTime.includes('year') && !result.publishedTime.includes('yr'), 'Must be fresh upload, not years old')
  })

  // ─── 2. Web Search Task Execution ───
  console.log('\n─── 2. Web Search Task Execution ───')

  await test('"search google for quantum computing" generates web_search taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'search google for quantum computing',
      'en',
      'search google for quantum computing',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'web_search')
    assert.ok(result.reply.taskAction.url.includes('google.com/search?q='))
    assert.ok(result.reply.taskAction.query.includes('quantum computing'))
    assert.ok(result.reply.actions.some(a => a.name === 'web_search'))
  })

  // ─── 3. Website Launch Task Execution ───
  console.log('\n─── 3. Website Launch Task Execution ───')

  await test('"open github" generates open_url taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'open github',
      'en',
      'open github',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'open_url')
    assert.equal(result.reply.taskAction.url, 'https://github.com')
    assert.ok(result.reply.actions.some(a => a.name === 'open_url'))
  })

  await test('"go to vercel.com" generates open_url taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'go to vercel.com',
      'en',
      'go to vercel.com',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'open_url')
    assert.equal(result.reply.taskAction.url, 'https://vercel.com')
  })

  // ─── 4. Character Switch Task Execution ───
  console.log('\n─── 4. Character Switch Task Execution ───')

  await test('"switch to miku" generates character_switch taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'switch to miku',
      'en',
      'switch to miku',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'character_switch')
    assert.equal(result.reply.taskAction.data?.character, 'mira')
    assert.equal(result.reply.speaker, 'mira')
    assert.ok(result.reply.actions.some(a => a.name === 'switch_character'))
  })

  await test('"switch to tony stark" generates character_switch taskAction with atlas', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'switch to tony stark',
      'en',
      'switch to tony stark',
      'ada'
    )
    assert.ok(result, 'Result must not be null')
    assert.equal(result.reply.taskAction?.type, 'character_switch')
    assert.equal(result.reply.taskAction.data?.character, 'atlas')
    assert.equal(result.reply.speaker, 'atlas')
  })

  // ─── 5. Direct Action Router Integration ───
  console.log('\n─── 5. Direct Action Router Integration ───')

  await test('handleDirectActions dispatches task execution as priority #0', async () => {
    const directResult = await handleDirectActions(
      'test-user',
      'open youtube: play a miku video',
      'en',
      'open youtube: play a miku video',
      'atlas'
    )
    assert.ok(directResult, 'Must return direct action result')
    assert.equal(directResult.reply.taskAction?.type, 'youtube')
  })

  // ─── 6. Omnitask Extended Engine: Maps, Weather, Timer, Todo, Math, Wardrobe, Time ───
  console.log('\n─── 6. Omnitask Extended Engine ───')

  await test('"open maps to Tokyo" generates maps taskAction with Google Maps deep link', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'open maps to Tokyo', 'en', 'open maps to tokyo', 'ada')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'maps')
    assert.ok(result.reply.taskAction.url.includes('google.com/maps/search/'))
    assert.ok(result.reply.taskAction.query.toLowerCase().includes('tokyo'))
  })

  await test('"what is the weather in Chennai" generates weather taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'what is the weather in Chennai', 'en', 'what is the weather in chennai', 'ada')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'weather')
    assert.ok(result.reply.taskAction.url.includes('google.com/search?q=weather+'))
    assert.ok(result.reply.taskAction.query.toLowerCase().includes('chennai'))
  })

  await test('"start timer 25 minutes" generates timer taskAction and arms studyFocus', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'start timer 25 minutes', 'en', 'start timer 25 minutes', 'atlas')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'timer')
    assert.equal(result.reply.taskAction.data?.durationMinutes, 25)
    assert.ok(result.reply.studyFocus)
    assert.equal(result.reply.studyFocus.durationMinutes, 25)
    assert.equal(result.reply.studyFocus.isActive, true)
  })

  await test('"add todo: finish quarterly report" generates todo taskAction and todoCard', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'add todo: finish quarterly report', 'en', 'add todo: finish quarterly report', 'ada')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'todo')
    assert.equal(result.reply.taskAction.data?.taskText, 'finish quarterly report')
    assert.ok(result.reply.todoCard)
    assert.equal(result.reply.todoCard.action, 'added')
    assert.equal(result.reply.todoCard.item?.title, 'finish quarterly report')
  })

  await test('"calculate 125 * 85" generates calculator taskAction with accurate math', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'calculate 125 * 85', 'en', 'calculate 125 * 85', 'atlas')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'calculator')
    assert.equal(result.reply.taskAction.data?.result, 10625)
  })

  await test('"wear saree" generates wardrobe taskAction with ada-saree', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'wear saree', 'en', 'wear saree', 'ada')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'wardrobe')
    assert.equal(result.reply.taskAction.data?.skinId, 'ada-saree')
    assert.ok(result.reply.actions.some(a => a.name === 'change_wardrobe'))
  })

  await test('"dance" generates stage motion deliverable taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'dance', 'en', 'dance', 'mira')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'deliverable')
    assert.ok(result.reply.actions.some(a => a.name === 'dance'))
  })

  await test('"what time is it" generates time chronometer taskAction', async () => {
    const result = await TaskExecutionService.handleTaskIntent('test-user', 'what time is it', 'en', 'what time is it', 'ada')
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'time')
    assert.ok(result.reply.taskAction.title)
    assert.ok(result.reply.taskAction.data?.timeStr)
    assert.ok(result.reply.taskAction.data?.dateStr)
    assert.equal(result.reply.taskAction.status, 'executed')
    assert.ok(result.reply.taskAction.data?.isLiveUpdater, 'Must enable live updater')
    assert.ok(Array.isArray(result.reply.taskAction.data?.marketSessions), 'Must include market sessions')
  })

  await test('"date and time now updater" generates real-time chronometer with zero-hallucination year 2026', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'date and time now updater',
      'en',
      'date and time now updater',
      'atlas',
      { clientTimeZone: 'Asia/Kolkata' }
    )
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'time')
    assert.ok(result.reply.taskAction.data?.dateStr.includes('2026'), 'Date must strictly reflect 2026')
    assert.ok(result.reply.taskAction.data?.istTime, 'Must include IST time')
    assert.ok(result.reply.taskAction.data?.estTime, 'Must include EST time')
    assert.ok(result.reply.taskAction.data?.utcTime, 'Must include UTC time')
  })

  await test('"time in new york" resolves America/New_York timezone accurately', async () => {
    const result = await TaskExecutionService.handleTaskIntent(
      'test-user',
      'what is the time in new york',
      'en',
      'what is the time in new york',
      'ada'
    )
    assert.ok(result)
    assert.equal(result.reply.taskAction?.type, 'time')
    assert.equal(result.reply.taskAction.data?.timeZone, 'America/New_York')
  })

  // ─── 7. Live Market Data Providers ───
  console.log('\n─── 7. Live Market Data Providers ───')

  await test('YahooLiveMarketProvider fetches live real-time index quote for ^NSEI', async () => {
    const { YahooLiveMarketProvider } = await import('../apps/server/src/market/MarketDataProvider.js')
    const provider = new YahooLiveMarketProvider()
    const quote = await provider.getQuote('^NSEI', '^NSEI', 'Nifty 50', 'INR')
    assert.ok(quote, 'Quote must not be null')
    assert.ok(quote.price > 10000, `Price must be realistic (got ${quote.price})`)
    assert.equal(quote.isLive, true)
    assert.equal(quote.status, 'live')
  })

  await test('BinanceLiveMarketProvider fetches live real-time crypto quote for BTC-USD', async () => {
    const { BinanceLiveMarketProvider } = await import('../apps/server/src/market/MarketDataProvider.js')
    const provider = new BinanceLiveMarketProvider()
    const quote = await provider.getQuote('BTC-USD', 'BTC', 'Bitcoin', 'USD')
    assert.ok(quote, 'Quote must not be null')
    assert.ok(quote.price > 10000, `BTC price must be realistic (got ${quote.price})`)
    assert.equal(quote.isLive, true)
    assert.equal(quote.status, 'live')
  })

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(` RESULTS: ${passed} / ${passed + failed} TESTS PASSED (${((passed / (passed + failed)) * 100).toFixed(1)}%)`)
  if (failed === 0) {
    console.log(' 🎉 ALL TASK EXECUTION TESTS VERIFIED CLEANLY!')
  } else {
    console.error(' ❌ SOME TESTS FAILED!')
    process.exit(1)
  }
  console.log('═══════════════════════════════════════════════════════════════\n')
}

runAll()
