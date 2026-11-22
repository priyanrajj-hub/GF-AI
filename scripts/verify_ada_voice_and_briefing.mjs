import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { POPULAR_SONG_CATALOG, resolveSong } from '@ada/shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

console.log('--- 1. Testing Ada Wong Audio Asset ---')
const adaAudioPath = path.join(rootDir, 'apps', 'web', 'public', 'audio', 'ada_tactical_briefing.mp3')
assert.ok(fs.existsSync(adaAudioPath), 'ada_tactical_briefing.mp3 must exist')
const stat = fs.statSync(adaAudioPath)
assert.ok(stat.size > 10000, `Audio file must be substantial (>10KB), found ${stat.size} bytes`)
console.log('✅ Ada Wong audio asset verified:', adaAudioPath, `(${stat.size} bytes)`)

console.log('--- 2. Testing Song Catalog Registration ---')
const adaSong = POPULAR_SONG_CATALOG.find(s => s.id === 'song-ada-espionage-briefing')
assert.ok(adaSong, 'song-ada-espionage-briefing must be registered in catalog')
assert.strictEqual(adaSong.audioUrl, '/audio/ada_tactical_briefing.mp3', 'Audio URL must point to local asset')
assert.ok(adaSong.lyrics.length >= 4, 'Must have at least 4 lyric lines')
console.log('✅ Ada Wong catalog entry verified:', adaSong.title)

console.log('--- 3. Testing Song Resolution for Ada Wong Queries ---')
const q1 = resolveSong('ada', 'ada')
assert.strictEqual(q1.id, 'song-ada-espionage-briefing', 'Query "ada" must resolve to Ada briefing')

const q2 = resolveSong("All right, we'll do this your way for now")
assert.strictEqual(q2.id, 'song-ada-espionage-briefing', 'Exact soundboard quote must resolve to Ada briefing')

const q3 = resolveSong('resident evil', 'ada')
assert.strictEqual(q3.id, 'song-ada-espionage-briefing', 'Resident Evil query with Ada active must resolve')

const q4 = resolveSong('play a song', 'ada')
assert.strictEqual(q4.id, 'song-ada-espionage-briefing', 'General song request for Ada must resolve')

console.log('✅ All Ada Wong voice & soundboard resolution tests passed!')
