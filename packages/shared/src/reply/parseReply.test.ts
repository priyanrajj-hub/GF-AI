import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseStructuredReply,
  sanitizeSpeechText,
  sanitizeBubbleText,
  extractBalancedJson,
  repairJsonText,
  UI_GUARDRAIL_REGEX,
} from './parseReply.js'
import { getTimeAwareGreeting } from '../persona.js'
import type { PersonalityMode } from '../types.js'

describe('Task A: Bulletproof Reply Pipeline & UI Guardrails', () => {
  // Test 1: Clean valid JSON
  it('1. should parse clean valid JSON with all fields', () => {
    const raw = JSON.stringify({
      speech: 'All systems are functioning at peak efficiency.',
      display_text: '### System Status\nAll subroutines nominal.',
      emotion: 'calm',
      intensity: 0.9,
      gesture: 'nod',
      voice_style: { rate: 1.0, pitch: 1.0, style: 'calm' },
      actions: [{ name: 'check_status', arguments: {} }],
    })
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, '### System Status\nAll subroutines nominal.')
    assert.equal(res.speech, 'All systems are functioning at peak efficiency.')
    assert.equal(res.emotion, 'calm')
    assert.equal(res.gesture, 'nod')
    assert.equal(res.cues.emotion, 'calm')
    assert.equal(res.cues.gesture, 'nod')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 2: Clean valid JSON wrapped in ```json ... ```
  it('2. should strip ```json code fences', () => {
    const raw = `\`\`\`json
{
  "speech": "I have reviewed your pull request.",
  "display_text": "Code review complete: 0 vulnerabilities found.",
  "emotion": "happy",
  "gesture": "wave"
}
\`\`\``
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Code review complete: 0 vulnerabilities found.')
    assert.equal(res.speech, 'I have reviewed your pull request.')
    assert.equal(res.emotion, 'happy')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 3: Clean valid JSON wrapped in plain ``` ... ```
  it('3. should strip plain ``` code fences', () => {
    const raw = `\`\`\`
{
  "speech": "Good afternoon, Priyanraj.",
  "display_text": "Good afternoon, Priyanraj.",
  "emotion": "calm",
  "gesture": "idle"
}
\`\`\``
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Good afternoon, Priyanraj.')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 4: JSON preceded by conversational text
  it('4. should extract JSON when preceded by chatter', () => {
    const raw = `Sure! Here is the JSON reply:
{
  "speech": "Here are the metrics you asked for.",
  "display_text": "Metrics:\n- CPU: 12%\n- RAM: 4.2GB",
  "emotion": "calm",
  "gesture": "nod"
}`
    const res = parseStructuredReply(raw)
    assert.match(res.display_text, /Metrics:/)
    assert.equal(res.speech, 'Here are the metrics you asked for.')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 5: JSON followed by conversational text
  it('5. should extract JSON when followed by trailing notes', () => {
    const raw = `{
  "speech": "I found 3 matching files.",
  "display_text": "Found 3 matching files in directory.",
  "emotion": "happy",
  "gesture": "wave"
}
Let me know if you would like me to open them!`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Found 3 matching files in directory.')
    assert.equal(res.emotion, 'happy')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 6: Conversational text both before and after JSON
  it('6. should extract JSON when enveloped in conversational chatter', () => {
    const raw = `Certainly!
{
  "speech": "Starting database migration now.",
  "display_text": "**Migration:** In progress...",
  "emotion": "motivated",
  "gesture": "fist_pump"
}
Process will conclude shortly.`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, '**Migration:** In progress...')
    assert.equal(res.gesture, 'fist_pump')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 7: Double-encoded JSON string
  it('7. should unwrap double-encoded JSON strings', () => {
    const inner = JSON.stringify({
      speech: 'Double encoded test succeeded.',
      display_text: 'Double encoded unwrapped properly.',
      emotion: 'playful',
      gesture: 'shy',
    })
    const raw = JSON.stringify(inner)
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Double encoded unwrapped properly.')
    assert.equal(res.speech, 'Double encoded test succeeded.')
    assert.equal(res.emotion, 'playful')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 8: SCREENSHOT REPRODUCTION - Unenclosed JSON object starting with "display_text":
  it('8. should repair screenshot bug where raw JSON keys leak without outer braces', () => {
    const raw = `"display_text": "### Morning Briefing\nAll systems are green.", "emotion": "happy", "intensity": 0.9, "gesture": "wave", "voice_style": {"rate": 1.0, "pitch": 1.0}, "actions": []`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, '### Morning Briefing\nAll systems are green.')
    assert.equal(res.emotion, 'happy')
    assert.equal(res.gesture, 'wave')
    assert.equal(res.intensity, 0.9)
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 9: Trailing commas in object
  it('9. should repair trailing commas in JSON object', () => {
    const raw = `{
      "speech": "Trailing comma fixed.",
      "display_text": "Trailing comma test passed.",
      "emotion": "happy",
      "gesture": "nod",
    }`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Trailing comma test passed.')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 10: Trailing commas in arrays and nested objects
  it('10. should repair trailing commas in nested arrays and objects', () => {
    const raw = `{
      "speech": "Nested trailing commas fixed.",
      "display_text": "Nested commas clean.",
      "emotion": "calm",
      "gesture": "idle",
      "actions": [
        { "name": "do_work", "arguments": {}, },
      ],
    }`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Nested commas clean.')
    assert.equal(res.actions?.length, 1)
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 11: Smart quotes conversion
  it('11. should repair smart quotes (“ ” ‘ ’)', () => {
    const raw = `{
      “speech”: “Smart quotes handled.”,
      “display_text”: “Smart quotes repaired.”,
      “emotion”: “happy”,
      “gesture”: “wave”
    }`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Smart quotes repaired.')
    assert.equal(res.speech, 'Smart quotes handled.')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 12: Truncated JSON mid-string
  it('12. should gracefully recover from truncated JSON mid-string', () => {
    const raw = `{"speech": "Hello there", "display_text": "Here is the plan for today: step one is to`
    const res = parseStructuredReply(raw)
    assert.match(res.display_text, /Here is the plan for today: step one is to/)
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 13: Truncated JSON mid-object
  it('13. should gracefully recover from truncated JSON mid-object', () => {
    const raw = `{"speech": "Almost done", "display_text": "Almost done with the build", "emotion": "calm"`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Almost done with the build')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 14: Truncated JSON mid-array
  it('14. should gracefully recover from truncated JSON mid-array', () => {
    const raw = `{"speech": "Executing tasks", "display_text": "Executing 2 tasks", "actions": [{"name": "compile"`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Executing 2 tasks')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 15: Plain prose fallback
  it('15. should treat plain conversational prose as display_text without error', () => {
    const raw = `Hey there! I am happy to help you with that algorithm.`
    const res = parseStructuredReply(raw)
    assert.equal(res.display_text, 'Hey there! I am happy to help you with that algorithm.')
    assert.equal(res.speech, 'Hey there! I am happy to help you with that algorithm.')
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 16: Empty string input
  it('16. should handle empty string input gracefully', () => {
    const res = parseStructuredReply('')
    assert.ok(res.display_text.length > 0)
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 17: Whitespace only input
  it('17. should handle whitespace only input gracefully', () => {
    const res = parseStructuredReply('   \n\t   ')
    assert.ok(res.display_text.length > 0)
    assert.equal(UI_GUARDRAIL_REGEX.test(res.display_text), false)
  })

  // Test 18: sanitizeSpeechText removes markdown headers (###)
  it('18. sanitizeSpeechText should strip markdown headers', () => {
    const input = '### Morning Briefing\n## Status Report\n# Final Thoughts'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'Morning Briefing Status Report Final Thoughts')
  })

  // Test 19: sanitizeSpeechText removes bold, italics, strikethrough
  it('19. sanitizeSpeechText should strip bold and italics', () => {
    const input = 'This is **bold** and *italic* and __underline__ and ~~struck~~.'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'This is bold and italic and underline and struck.')
  })

  // Test 20: sanitizeSpeechText removes code blocks and backticks
  it('20. sanitizeSpeechText should strip inline code and code blocks', () => {
    const input = 'Run `npm test` or check this code: ```js\nconst x = 10;\n``` to proceed.'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'Run npm test or check this code: to proceed.')
  })

  // Test 21: sanitizeSpeechText removes URLs
  it('21. sanitizeSpeechText should strip web URLs', () => {
    const input = 'Check out https://github.com/project/ada for more details.'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'Check out for more details.')
  })

  // Test 22: sanitizeSpeechText removes cue tags ([emo:...], [act:...])
  it('22. sanitizeSpeechText should strip inline cue tags', () => {
    const input = 'Hello! [emo:happy 0.9] Welcome back [act:wave] to the studio.'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'Hello! Welcome back to the studio.')
  })

  // Test 23: sanitizeSpeechText expands dates
  it('23. sanitizeSpeechText should expand numeric dates', () => {
    const input = 'Today is 11/1/2026.'
    const cleaned = sanitizeSpeechText(input)
    assert.match(cleaned, /November 1, 2026/i)
  })

  // Test 24: sanitizeSpeechText removes emojis
  it('24. sanitizeSpeechText should strip emojis', () => {
    const input = 'Good morning Priyanraj! ✨💖🚀 Ready to conquer today? 🎉'
    const cleaned = sanitizeSpeechText(input)
    assert.equal(cleaned, 'Good morning Priyanraj! Ready to conquer today?')
  })

  // Test 25: Title replacement: replaces Operator with Priyanraj
  it('25. should replace Operator with userName (Priyanraj)', () => {
    const raw = JSON.stringify({
      speech: 'Good morning, Operator.',
      display_text: 'Good morning, **Operator**.',
      emotion: 'calm',
      gesture: 'nod',
    })
    const res = parseStructuredReply(raw, { userName: 'Priyanraj' })
    assert.equal(res.speech, 'Good morning, Priyanraj.')
    assert.equal(res.display_text, 'Good morning, **Priyanraj**.')
    assert.equal(res.speech.includes('Operator'), false)
    assert.equal(res.display_text.includes('Operator'), false)
  })

  // Test 26: Title replacement: replaces Partner with Priyanraj
  it('26. should replace Partner with userName (Priyanraj)', () => {
    const raw = JSON.stringify({
      speech: 'Why thank you, Partner.',
      display_text: 'Why thank you, Partner. Let us crush today!',
      emotion: 'playful',
      gesture: 'shy',
    })
    const res = parseStructuredReply(raw, { userName: 'Priyanraj' })
    assert.equal(res.speech, 'Why thank you, Priyanraj.')
    assert.equal(res.display_text, 'Why thank you, Priyanraj. Let us crush today!')
    assert.equal(res.speech.includes('Partner'), false)
    assert.equal(res.display_text.includes('Partner'), false)
  })

  // Test 27: Hard UI Guardrail Regex enforcement on sanitizeBubbleText
  it('27. sanitizeBubbleText must never return text matching UI_GUARDRAIL_REGEX', () => {
    const malformed = '{"display_text": "Hello world", "emotion": "happy", "gesture": "wave"}'
    const bubble = sanitizeBubbleText(malformed)
    assert.equal(bubble, 'Hello world')
    assert.equal(UI_GUARDRAIL_REGEX.test(bubble), false)
  })

  // Test 28: UI Guardrail holds even on extreme raw JSON inputs
  it('28. UI Guardrail must strictly strip leaked JSON keys from bubble text', () => {
    const inputs = [
      '{"display_text": "Simple message"}',
      '"display_text": "No outer braces message"',
      '{"emotion": "happy", "gesture": "wave", "display_text": "Reordered keys"}',
      '{"speech": "Only speech field was present"}',
      '[{"display_text": "Array wrapped"}]',
    ]
    for (const inp of inputs) {
      const bubble = sanitizeBubbleText(inp)
      assert.equal(
        UI_GUARDRAIL_REGEX.test(bubble),
        false,
        `Bubble text "${bubble}" leaked JSON from input: "${inp}"`
      )
    }
  })

  // Test 29: Greetings in all 7 personality modes never contain "Operator" or "Partner"
  it('29. getTimeAwareGreeting in all personality modes must never contain Operator or Partner', () => {
    const modes: PersonalityMode[] = [
      'jarvis',
      'mentor',
      'coder',
      'coach',
      'listener',
      'playful',
      'companion',
    ]
    for (const mode of modes) {
      const g = getTimeAwareGreeting('Priyanraj', mode)
      assert.equal(
        /operator|partner/i.test(g.content),
        false,
        `Mode ${mode} greeting content contained forbidden title: "${g.content}"`
      )
      assert.equal(
        /operator|partner/i.test(g.speech),
        false,
        `Mode ${mode} greeting speech contained forbidden title: "${g.speech}"`
      )
      assert.equal(UI_GUARDRAIL_REGEX.test(g.content), false)
    }
  })

  // Test 30: Default greeting with zero arguments never contains "Operator" or "Partner"
  it('30. getTimeAwareGreeting() default invocation must never contain Operator or Partner', () => {
    const g = getTimeAwareGreeting()
    assert.equal(
      /operator|partner/i.test(g.content),
      false,
      `Default greeting content contained forbidden title: "${g.content}"`
    )
    assert.equal(
      /operator|partner/i.test(g.speech),
      false,
      `Default greeting speech contained forbidden title: "${g.speech}"`
    )
    assert.equal(UI_GUARDRAIL_REGEX.test(g.content), false)
  })

  // Test 31: cues object is cleanly populated
  it('31. should return well-formed cues object separated from display_text and speech', () => {
    const raw = JSON.stringify({
      speech: 'Time for a break.',
      display_text: 'Take a quick 5-minute break.',
      emotion: 'concerned',
      intensity: 0.85,
      gesture: 'concerned_lean',
      voice_style: { rate: 0.95, pitch: 1.05, style: 'empathetic' },
      actions: [{ name: 'pause_pomodoro', arguments: {} }],
      sticker: 'ada_wave',
      gif_query: 'relaxation',
    })
    const res = parseStructuredReply(raw)
    assert.equal(res.cues.emotion, 'concerned')
    assert.equal(res.cues.intensity, 0.85)
    assert.equal(res.cues.gesture, 'concerned_lean')
    assert.equal(res.cues.voice_style.rate, 0.95)
    assert.equal(res.cues.actions.length, 1)
    assert.equal(res.cues.sticker, 'ada_wave')
    assert.equal(res.cues.gif_query, 'relaxation')
  })

  // Test 32: extractBalancedJson extracts correct substring when prose surrounds JSON
  it('32. extractBalancedJson correctly extracts JSON despite surrounding prose', () => {
    const text = 'Here is the data: {"a": 1, "b": {"nested": true}} and here is more text.'
    const extracted = extractBalancedJson(text)
    assert.equal(extracted, '{"a": 1, "b": {"nested": true}}')
  })
})
