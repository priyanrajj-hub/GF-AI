const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');

async function main() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-US-AriaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const script = "Ada Wong. All right, we'll do this your way for now. Alright, I'm going. Keep your eyes open and your mind sharp. See you around.";
  const outDir = path.join(__dirname, '..', 'apps', 'web', 'public', 'audio');
  fs.mkdirSync(outDir, { recursive: true });

  const destFile = path.join(outDir, 'ada_tactical_briefing.mp3');
  console.log('Synthesizing Ada briefing to:', destFile);

  const res = await tts.toFile(outDir, script, { rate: '-3%', pitch: '-5Hz' });
  const generatedPath = res.audioFilePath || path.join(outDir, 'audio.mp3');

  if (fs.existsSync(generatedPath)) {
    if (generatedPath !== destFile) {
      if (fs.existsSync(destFile)) fs.unlinkSync(destFile);
      fs.renameSync(generatedPath, destFile);
    }
    console.log('Successfully created:', destFile, 'Size:', fs.statSync(destFile).size, 'bytes');
  } else {
    throw new Error('Failed to find generated audio');
  }
}

main().catch(err => {
  console.error('Synthesis failed:', err);
  process.exit(1);
});
