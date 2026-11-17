import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const apiKey = process.env.ELEVENLABS_API_KEY || '';

async function listVoices() {
  const elevenlabs = new ElevenLabsClient({ apiKey });
  const voices = await elevenlabs.voices.getAll();
  console.log(`Total voices available: ${voices.voices.length}`);
  const femaleVoices = voices.voices.filter(v => v.labels?.gender === 'female' || v.category === 'premade');
  console.log('\nTop Free/Premade Female Voices:');
  femaleVoices.slice(0, 10).forEach(v => {
    console.log(`- Name: "${v.name}", ID: "${v.voice_id}", Category: "${v.category}", Description: "${v.labels?.description || v.labels?.accent || ''}"`);
  });
}

listVoices().catch(console.error);
