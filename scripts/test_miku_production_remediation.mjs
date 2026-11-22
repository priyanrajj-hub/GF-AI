import assert from 'node:assert'
import { handleDirectActions } from '../apps/server/src/services/chatDirectActions.js'
import { searchRealSongTrack } from '../apps/server/src/services/musicSearchService.js'
import { resolveSong, POPULAR_SONG_CATALOG } from '@ada/shared'
import { ContextBuilder } from '../apps/server/src/services/contextBuilder.js'

console.log('═══════════════════════════════════════════════════════════════')
console.log(' 🎤 MIKU & PRODUCTION REMEDIATION VERIFICATION SUITE')
console.log('═══════════════════════════════════════════════════════════════\n')

let passed = 0

// Test 1: Song Resolution for "World is Mine"
console.log('─── 1. Miku Authentic Master Track Resolution ───')
const song = resolveSong('sing World is Mine', 'mira')
assert.strictEqual(song.id, 'song-miku-world-is-mine', 'Should resolve to song-miku-world-is-mine')
assert.ok(song.artist.includes('Hatsune Miku'), 'Artist should be Hatsune Miku')
assert.ok(song.audioUrl && song.audioUrl.startsWith('https://archive.org'), 'Must be authentic archive audio stream')
console.log('  ✓ PASS: "World is Mine" resolves to authentic Hatsune Miku master audio')
passed++

// Test 2: musicSearchService does NOT return Indian covers for Miku
console.log('─── 2. musicSearchService Miku Hijack Prevention ───')
const searchResult = await searchRealSongTrack('sing World is Mine')
assert.ok(searchResult, 'Should return a track result')
assert.strictEqual(searchResult.title, 'World is Mine (ワールドイズマイン)')
assert.ok(searchResult.artist.includes('Hatsune Miku'), 'Artist should be Hatsune Miku, not Robin Dhanva')
console.log('  ✓ PASS: searchRealSongTrack routes Miku requests directly to authentic Vocaloid master')
passed++

// Test 3: Direct Action Persona & Voice for Miku Singing
console.log('─── 3. Direct Action Miku Singing Dispatch ───')
const directResult = await handleDirectActions('test-user-1', 'sing World is Mine', 'en', 'sing world is mine', 'mira')
assert.ok(directResult, 'Direct action should be handled')
const reply = directResult.reply
assert.strictEqual(reply.speaker, 'mira', 'Speaker badge must be mira')
assert.ok(reply.speech.includes('Miku da yo~!') || reply.speech.includes('World is Mine'), 'Speech must be in Miku persona')
assert.ok(reply.display_text.includes('Hatsune Miku'), 'Display text must credit Hatsune Miku')
assert.ok(!reply.display_text.includes('Robin Dhanva'), 'Must not mention Indian artist cover')
assert.strictEqual(reply.musicTrack.id, 'song-miku-world-is-mine', 'Track ID must be authentic Miku song')
console.log('  ✓ PASS: Direct action generates authentic Miku persona and attaches master track')
passed++

// Test 4: Generic "sing a song" for Miku defaults to Miku Anthem
console.log('─── 4. Generic Song Request for Miku ───')
const genericMikuSong = resolveSong('sing a song for me', 'mira')
assert.ok(genericMikuSong.id.startsWith('song-miku'), 'Must default to an authentic Miku anthem')
assert.ok(genericMikuSong.audioUrl, 'Must have valid audioUrl')
console.log('  ✓ PASS: Generic singing request while Miku is active defaults to Miku anthem')
passed++

// Test 5: ContextBuilder Persona Isolation (No Ada Prompt Injection Conflict)
console.log('─── 5. ContextBuilder Character Persona Isolation ───')
const mikuContext = ContextBuilder.buildPromptContext({
  userId: 'test-user-1',
  history: [],
  userMessage: 'hi',
  mode: 'playful',
  sliders: { humor: 80, warmth: 90, formality: 20, directness: 80, flirtiness: 50, talkativeness: 70 },
  language: 'en',
  character: 'mira',
})
assert.ok(mikuContext.systemPrompt.includes('HATSUNE MIKU'), 'System prompt must identify as Hatsune Miku')
assert.ok(!mikuContext.systemPrompt.includes('Spy-Chic Intellectual Girlfriend with a Warm Heart'), 'Must NOT inject Ada self-knowledge')
assert.ok(!mikuContext.systemPrompt.includes('signature crimson turtleneck dress'), 'Must NOT describe Ada dress')
console.log('  ✓ PASS: ContextBuilder builds pure Hatsune Miku system prompt without Ada persona collision')
passed++

// Test 6: Tony Stark Persona Isolation
console.log('─── 6. Tony Stark / Jarvis Trade AI Persona Isolation ───')
const starkContext = ContextBuilder.buildPromptContext({
  userId: 'test-user-1',
  history: [],
  userMessage: 'analyze NIFTY 50',
  mode: 'jarvis',
  sliders: { humor: 30, warmth: 30, formality: 90, directness: 90, flirtiness: 0, talkativeness: 40 },
  language: 'en',
  character: 'atlas',
})
assert.ok(starkContext.systemPrompt.includes('JARVIS'), 'System prompt must identify as Jarvis')
assert.ok(!starkContext.systemPrompt.includes('signature crimson turtleneck dress'), 'Must NOT describe Ada dress')
console.log('  ✓ PASS: Tony Stark context builds clean quant trading system prompt')
passed++

// Test 7: J.A.R.V.I.S. Wake-Up Alarm Song Resolution
console.log('─── 7. J.A.R.V.I.S. Wake-Up Alarm Song Resolution ───')
const jarvisAlarm = resolveSong('Jarvis wake up alarm protocol', 'atlas')
assert.strictEqual(jarvisAlarm.id, 'song-jarvis-wakeup-alarm', 'Must resolve to song-jarvis-wakeup-alarm')
assert.strictEqual(jarvisAlarm.audioUrl, '/audio/jarvis_wakeup_protocol.mp3', 'Must point to local jarvis audio asset')
assert.ok(jarvisAlarm.lyrics && jarvisAlarm.lyrics.length >= 4, 'Must contain synchronized lyric cues')
console.log('  ✓ PASS: "Jarvis wake up alarm protocol" resolves to authentic Paul Bettany wake-up audio')
passed++

// Test 8: musicSearchService Jarvis Routing
console.log('─── 8. musicSearchService Jarvis Wake-Up Routing ───')
const jarvisSearchResult = await searchRealSongTrack('wake up alarm iron man protocol')
assert.ok(jarvisSearchResult, 'Should return a track result')
assert.strictEqual(jarvisSearchResult.audioUrl, '/audio/jarvis_wakeup_protocol.mp3', 'Must route directly to jarvis audio asset')
console.log('  ✓ PASS: searchRealSongTrack routes Jarvis requests directly to authentic wake-up track')
passed++

console.log('\n═══════════════════════════════════════════════════════════════')
console.log(` RESULTS: ${passed} / ${passed} TESTS PASSED (100.0%)`)
console.log(' 🎉 ALL MIKU PRODUCTION REMEDIATIONS VERIFIED!')
console.log('═══════════════════════════════════════════════════════════════\n')
