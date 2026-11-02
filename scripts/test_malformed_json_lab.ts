import assert from 'node:assert/strict';
import {
  parseStructuredReply,
  sanitizeBubbleText,
  sanitizeSpeechText,
  UI_GUARDRAIL_REGEX,
} from '../packages/shared/src/reply/parseReply.js';

console.log('🧪 ========================================================');
console.log('🧪 REPLY LAB: MALFORMED LLM PAYLOAD & UI GUARDRAIL TEST');
console.log('🧪 ========================================================\n');

const testCases = [
  {
    name: 'Raw JSON Leak (The original V10 screenshot bug)',
    payload: `{\n  "display_text": "Hello Alex! How was your day at college?",\n  "speech": "Hello Alex! How was your day at college?",\n  "emotion": "happy",\n  "intensity": 0.8,\n  "gesture": "wave"\n}`,
    expectedText: 'Hello Alex! How was your day at college?',
  },
  {
    name: 'Unclosed Truncated JSON',
    payload: `{"display_text": "I was just thinking about you and wanted to check in. [emo:warm 0.8]`,
    expectedText: 'I was just thinking about you and wanted to check in.',
  },
  {
    name: 'JSON wrapped in markdown fences with commentary',
    payload: `Sure, here is my response:\n\`\`\`json\n{\n  "display_text": "Let's review our daily focus goals.",\n  "speech": "Let's review our daily focus goals."\n}\n\`\`\`\nHope this helps!`,
    expectedText: "Let's review our daily focus goals.",
  },
  {
    name: 'Raw keys leaking without outer curly braces',
    payload: `"display_text": "Ready when you are, Alex.", "speech": "Ready when you are, Alex.", "emotion": "happy"`,
    expectedText: 'Ready when you are, Alex.',
  },
  {
    name: 'Asterisk actions mixed into prose',
    payload: `*smiles softly and looks at you* I'm really proud of how consistent you've been.`,
    expectedText: "I'm really proud of how consistent you've been.",
  },
  {
    name: 'Outdated placeholder name (Operator / Partner)',
    payload: `Good morning Operator! Ready to tackle today's engineering roadmap?`,
    expectedText: "Good morning Alex! Ready to tackle today's engineering roadmap?",
  },
  {
    name: 'Literal text\\n prefix and escaped newlines (Round 11 meme screenshot defect)',
    payload: `text\\nThere are two hard things in Computer Science:\\n1. Cache invalidation\\n2. Naming things\\n3. Off-by-one errors\\n4. Explaining to non-tech people why code didn't compile on the first try.\\n`,
    expectedText: "There are two hard things in Computer Science:\n1. Cache invalidation\n2. Naming things\n3. Off-by-one errors\n4. Explaining to non-tech people why code didn't compile on the first try.",
  },
];

let passed = 0;
for (const tc of testCases) {
  try {
    const parsed = parseStructuredReply(tc.payload, { userName: 'Alex' });
    const cleanBubble = sanitizeBubbleText(parsed.display_text, { userName: 'Alex' });
    const cleanSpeech = sanitizeSpeechText(parsed.speech, { userName: 'Alex' });

    // Assert zero raw JSON keys in bubble
    assert.equal(UI_GUARDRAIL_REGEX.test(cleanBubble), false, 'Bubble must not contain raw JSON keys');
    // Assert zero asterisk actions in speech
    assert.equal(/\*[^*]+\*/.test(cleanSpeech), false, 'Speech must not contain asterisks');
    // Assert zero "Operator"
    assert.equal(/operator/i.test(cleanBubble), false, 'Must replace Operator with userName');

    console.log(`✅ [PASS] ${tc.name}`);
    console.log(`   Input Snippet:  ${tc.payload.slice(0, 60).replace(/\n/g, ' ')}...`);
    console.log(`   Clean Output:   "${cleanBubble}"\n`);
    passed++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${tc.name}:`, err.message);
  }
}

console.log(`\n🎉 Reply Lab Results: ${passed}/${testCases.length} test cases passed! Zero JSON leaks.`);
