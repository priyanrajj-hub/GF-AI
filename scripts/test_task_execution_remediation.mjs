import assert from 'node:assert/strict'
import { TaskExecutionService } from '../apps/server/src/services/taskExecutionService.js'
import { handleDirectActions } from '../apps/server/src/services/chatDirectActions.js'

console.log('═══════════════════════════════════════════════════════════════')
console.log(' 🚀 TASK EXECUTION ENGINE VERIFICATION SUITE')
console.log('═══════════════════════════════════════════════════════════════\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

// ─── 1. YouTube Task Execution ───
console.log('─── 1. YouTube Task Execution ───')

test('"open youtube: play a miku video" generates YouTube taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent(
    'test-user',
    'open youtube: play a miku video',
    'en',
    'open youtube: play a miku video',
    'atlas'
  )
  assert.ok(result, 'Result must not be null')
  assert.ok(result.reply.taskAction, 'reply.taskAction must be attached')
  assert.equal(result.reply.taskAction.type, 'youtube')
  assert.ok(result.reply.taskAction.url.includes('youtube.com/results?search_query='))
  assert.ok(result.reply.taskAction.embedUrl.includes('youtube-nocookie.com/embed'))
  assert.ok(result.reply.taskAction.query.toLowerCase().includes('miku'))
  assert.equal(result.reply.taskAction.status, 'ready')
  assert.ok(result.reply.actions.some(a => a.name === 'open_youtube'))
})

test('"open youtube and play madangowrilatest vedio" correctly normalizes query', () => {
  const result = TaskExecutionService.handleTaskIntent(
    'test-user',
    'open youtube and play madangowrilatest vedio',
    'en',
    'open youtube and play madangowrilatest vedio',
    'ada'
  )
  assert.ok(result, 'Result must not be null')
  assert.equal(result.reply.taskAction?.type, 'youtube')
  assert.ok(result.reply.taskAction.query.includes('Madan Gowri'))
  assert.ok(result.reply.taskAction.query.includes('latest video'))
  assert.ok(result.reply.taskAction.url.includes('Madan%20Gowri'))
})

// ─── 2. Web Search Task Execution ───
console.log('\n─── 2. Web Search Task Execution ───')

test('"search google for quantum computing" generates web_search taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent(
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

test('"open github" generates open_url taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent(
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

test('"go to vercel.com" generates open_url taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent(
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

test('"switch to miku" generates character_switch taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent(
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

test('"switch to tony stark" generates character_switch taskAction with atlas', () => {
  const result = TaskExecutionService.handleTaskIntent(
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

test('handleDirectActions dispatches task execution as priority #0', async () => {
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

// ─── 6. Omnitask Extended Engine: Maps, Weather, Timer, Todo, Math, Wardrobe ───
console.log('\n─── 6. Omnitask Extended Engine ───')

test('"open maps to Tokyo" generates maps taskAction with Google Maps deep link', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'open maps to Tokyo', 'en', 'open maps to tokyo', 'ada')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'maps')
  assert.ok(result.reply.taskAction.url.includes('google.com/maps/search/'))
  assert.ok(result.reply.taskAction.query.toLowerCase().includes('tokyo'))
})

test('"what is the weather in Chennai" generates weather taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'what is the weather in Chennai', 'en', 'what is the weather in chennai', 'ada')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'weather')
  assert.ok(result.reply.taskAction.url.includes('google.com/search?q=weather+'))
  assert.ok(result.reply.taskAction.query.toLowerCase().includes('chennai'))
})

test('"start timer 25 minutes" generates timer taskAction and arms studyFocus', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'start timer 25 minutes', 'en', 'start timer 25 minutes', 'atlas')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'timer')
  assert.equal(result.reply.taskAction.data?.durationMinutes, 25)
  assert.ok(result.reply.studyFocus)
  assert.equal(result.reply.studyFocus.durationMinutes, 25)
  assert.equal(result.reply.studyFocus.isActive, true)
})

test('"add todo: finish quarterly report" generates todo taskAction and todoCard', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'add todo: finish quarterly report', 'en', 'add todo: finish quarterly report', 'ada')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'todo')
  assert.equal(result.reply.taskAction.data?.taskText, 'finish quarterly report')
  assert.ok(result.reply.todoCard)
  assert.equal(result.reply.todoCard.action, 'added')
  assert.equal(result.reply.todoCard.item?.title, 'finish quarterly report')
})

test('"calculate 125 * 85" generates calculator taskAction with accurate math', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'calculate 125 * 85', 'en', 'calculate 125 * 85', 'atlas')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'calculator')
  assert.equal(result.reply.taskAction.data?.result, 10625)
})

test('"wear saree" generates wardrobe taskAction with ada-saree', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'wear saree', 'en', 'wear saree', 'ada')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'wardrobe')
  assert.equal(result.reply.taskAction.data?.skinId, 'ada-saree')
  assert.ok(result.reply.actions.some(a => a.name === 'change_wardrobe'))
})

test('"dance" generates stage motion deliverable taskAction', () => {
  const result = TaskExecutionService.handleTaskIntent('test-user', 'dance', 'en', 'dance', 'mira')
  assert.ok(result)
  assert.equal(result.reply.taskAction?.type, 'deliverable')
  assert.ok(result.reply.actions.some(a => a.name === 'dance'))
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
