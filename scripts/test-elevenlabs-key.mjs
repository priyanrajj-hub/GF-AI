import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';

const apiKey = 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe';
const voiceId = 'NOpBlnGInO9m6vDvFkFC';

async function testKey() {
  console.log('Testing ElevenLabs API key...');
  const elevenlabs = new ElevenLabsClient({ apiKey });

  try {
    // 1. Check user subscription info
    const user = await elevenlabs.user.get();
    console.log('✅ Authentication successful!');
    console.log('Subscription tier:', user.subscription?.tier || 'free');
    console.log('Character count used:', user.subscription?.character_count);
    console.log('Character limit:', user.subscription?.character_limit);
  } catch (err) {
    console.warn('Could not fetch user info:', err.message);
  }

  try {
    // 2. Generate a quick speech sample
    console.log('Testing TTS generation with voiceId:', voiceId);
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: "Hello User! I am Ada, your holographic companion.",
      modelId: 'eleven_turbo_v2_5', // Quick test with turbo
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    console.log(`✅ Generated audio buffer size: ${(buffer.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error('❌ TTS test error:', err.message);
    if (err.statusCode) console.error('Status code:', err.statusCode);
  }
}

testKey();
