import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const c = new ElevenLabsClient({ apiKey: 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe' });
const vs = await c.voices.getAll();
const female = vs.voices.filter(v => v.labels?.gender === 'female');
console.log('Available Premade Female Voices for your account:');
female.forEach(v => {
  console.log(`- ${v.name}: ID = "${v.voice_id || v.voiceId}" (${v.labels?.description || v.labels?.accent || ''})`);
});
