import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const apiKey = process.env.ELEVENLABS_API_KEY || '';
const c = new ElevenLabsClient({ apiKey });
const vs = await c.voices.getAll();
const female = vs.voices.filter(v => v.labels?.gender === 'female');
console.log('Available Premade Female Voices for your account:');
female.forEach(v => {
  console.log(`- ${v.name}: ID = "${v.voice_id || v.voiceId}" (${v.labels?.description || v.labels?.accent || ''})`);
});
