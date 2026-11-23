import assert from 'node:assert/strict'

async function runProductionMatrix() {
  const base = 'https://gf-ai-ochre.vercel.app'
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(` 🌐 LIVE PRODUCTION VALIDATION MATRIX: ${base}`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  // 1. Authenticate as Guest
  const authRes = await fetch(`${base}/api/auth/guest`, { method: 'POST' })
  assert.equal(authRes.status, 200, 'Guest authentication failed')
  const authData = await authRes.json()
  const token = authData.token
  assert.ok(token, 'Token must not be empty')
  console.log(`✓ Guest Authentication: ${authData.user?.userId} (Token valid)\n`)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  let passed = 0
  let failed = 0

  async function checkTest(name, fn) {
    try {
      await fn()
      console.log(`  ✓ PASS: ${name}`)
      passed++
    } catch (e) {
      console.error(`  ✗ FAIL: ${name}`)
      console.error(`    ${e.message}`)
      failed++
    }
  }

  // ─── 1. YouTube & Media Protocols ───
  console.log('─── 1. Live YouTube & Media Protocols ───')

  await checkTest('Tony Stark: "play a video" returns Iron Man spotlight video (zero hallucination)', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'play a video', character: 'atlas', language: 'en' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.speaker, 'atlas')
    assert.equal(r.taskAction?.type, 'youtube')
    assert.ok(r.taskAction?.embedUrl?.includes('3op3Y2cpRAg'), 'Must embed Iron Man trailer 3op3Y2cpRAg')
    assert.ok(!r.taskAction?.subtitle?.includes('18y ago'), 'Must not hallucinate 18y ago')
  })

  await checkTest('Ada: "i need the resent video of madhan gowri latest video" resolves fresh video without nocookie', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'i need the resent video of madhan gowri latest video', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'youtube')
    assert.ok(r.taskAction?.embedUrl?.includes('youtube.com/embed/'), 'Must use canonical embed URL')
    assert.ok(!r.taskAction?.embedUrl?.includes('nocookie'), 'Must not use youtube-nocookie')
    assert.ok(r.taskAction?.data?.videoId, 'Must have concrete videoId')
  })

  await checkTest('Miku: "open youtube: play a miku video" resolves canonical Miku track', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'open youtube: play a miku video', character: 'mira' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'youtube')
    assert.ok(r.taskAction?.embedUrl?.includes('youtube.com/embed/'))
  })

  // ─── 2. Omnitask Productivity Suite ───
  console.log('\n─── 2. Omnitask Productivity Suite ───')

  await checkTest('Calculator: "calculate 125 * 85" computes 10625 mathematically', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'calculate 125 * 85', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'calculator')
    assert.equal(r.taskAction?.data?.result, 10625)
  })

  await checkTest('Pomodoro: "start timer 25 minutes" initializes chronometer protocol', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'start timer 25 minutes', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'timer')
    assert.equal(r.taskAction?.data?.durationMinutes, 25)
  })

  await checkTest('Todo: "add todo: finish quarterly report" stores action item', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'add todo: finish quarterly report', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'todo')
    assert.ok(r.taskAction?.data?.taskText?.toLowerCase().includes('quarterly report'))
  })

  // ─── 3. 3D Stage & Wardrobe Controls ───
  console.log('\n─── 3. 3D Stage & Wardrobe Controls ───')

  await checkTest('Wardrobe: "wear saree" changes outfit to ada-saree', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'wear saree', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'wardrobe')
    assert.equal(r.taskAction?.data?.skinId, 'ada-saree')
  })

  await checkTest('Stage Motion: "dance" triggers stage action deliverable', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'dance', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'deliverable')
  })

  // ─── 4. Character Roster Switching ───
  console.log('\n─── 4. Character Roster Switching ───')

  await checkTest('Switch: "switch to miku" synchronizes stage to mira', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'switch to miku', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'character_switch')
    assert.equal(r.taskAction?.data?.character, 'mira')
  })

  await checkTest('Switch: "switch to tony stark" synchronizes stage to atlas', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'switch to tony stark', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'character_switch')
    assert.equal(r.taskAction?.data?.character, 'atlas')
  })

  // ─── 5. Web Search & Navigation ───
  console.log('\n─── 5. Web Search & Navigation ───')

  await checkTest('Web Search: "search google for quantum computing" provides Google results card', async () => {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'search google for quantum computing', character: 'ada' }),
    })
    const json = await res.json()
    const r = json.reply || json
    assert.equal(res.status, 200)
    assert.equal(r.taskAction?.type, 'web_search')
    assert.ok(r.taskAction?.url?.includes('google.com/search'))
  })

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(` LIVE MATRIX RESULTS: ${passed} / ${passed + failed} PASSED (${((passed / (passed + failed)) * 100).toFixed(1)}%)`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runProductionMatrix()
