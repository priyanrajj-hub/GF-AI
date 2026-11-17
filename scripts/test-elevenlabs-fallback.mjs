import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const apiKey = process.env.ELEVENLABS_API_KEY || '';
const client = new ElevenLabsClient({ apiKey });

async function synthesize(text, voiceId = 'NOpBlnGInO9m6vDvFkFC') {
  const candidateVoices = [
    voiceId,
    'cgSgspJ2msm6clMCkdW9', // Jessica (Playful, Warm, Premade Free)
    'EXAVITQu4vr4xnSDxMaL', // Sarah (Mature, Premade Free)
  ];

  for (const vId of candidateVoices) {
    try {
      console.log(`Attempting synthesis with voice: ${vId}...`);
      const stream = await client.textToSpeech.convert(vId, {
        text,
        modelId: 'eleven_multilingual_v2',
      });
      let len = 0;
      for await (const chunk of stream) len += chunk.length;
      console.log(`✅ Success with voice ${vId}! Length: ${len} bytes`);
      return { success: true, voiceUsed: vId, len };
    } catch (err) {
      console.warn(`Voice ${vId} error: ${err.message}`);
      if (err.statusCode === 402 || err.message?.includes('library')) {
        console.log('Detected 402/library voice constraint, switching to next available voice...');
      }
    }
  }
}

synthesize('Hello Operator, tactical feeds and systems are all optimal.').catch(console.error);
