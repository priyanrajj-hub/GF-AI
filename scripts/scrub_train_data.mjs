import fs from 'fs';
import path from 'path';

const filePath = 'training/data/train.jsonl';
if (!fs.existsSync(filePath)) {
  console.log(`No training file at ${filePath}`);
  process.exit(0);
}

const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

let replacementRules = [];
const privateReplacementsPath = path.resolve(process.cwd(), 'private/pii_replacements.json');
if (fs.existsSync(privateReplacementsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(privateReplacementsPath, 'utf8'));
    if (Array.isArray(raw.rules)) {
      replacementRules = raw.rules;
      console.log(`Loaded ${replacementRules.length} replacement rules from gitignored private/pii_replacements.json`);
    }
  } catch (err) {
    console.warn('Warning: Could not load private/pii_replacements.json', err.message);
  }
}

function cleanText(text) {
  let res = text;
  
  // Apply dynamic private rules if present
  for (const rule of replacementRules) {
    const re = new RegExp(rule.from, 'gi');
    res = res.replace(re, rule.to);
  }

  // Replace asterisk actions with cue tags
  res = res.replace(/\*smiles softly[^*]*\*/gi, '[emo:warm 0.7] [act:soft_smile]');
  res = res.replace(/\*looks at you[^*]*\*/gi, '[emo:caring 0.7] [act:look_attentive]');
  res = res.replace(/\*turns gracefully[^*]*\*/gi, '[emo:peaceful 0.7] [act:gentle_turn]');
  res = res.replace(/\*curls up comfortably[^*]*\*/gi, '[emo:sleepy 0.6] [act:cozy_rest]');
  res = res.replace(/\*lowers her gaze[^*]*\*/gi, '[emo:concerned 0.7] [act:comforting_hand]');
  res = res.replace(/\*gently reaches out[^*]*\*/gi, '[act:comforting_hand]');
  res = res.replace(/\*cheers enthusiastically[^*]*\*/gi, '[emo:excited 0.8] [act:cheer]');
  res = res.replace(/\*pours a virtual[^*]*\*/gi, '[emo:playful 0.6] [act:nod]');
  res = res.replace(/\*takes a cozy sip[^*]*\*/gi, '[emo:relaxed 0.6] [act:sip]');
  res = res.replace(/\*beams with pure delight[^*]*\*/gi, '[emo:happy 0.8] [act:smile]');
  res = res.replace(/\*celebrates excitedly[^*]*\*/gi, '[emo:excited 0.8] [act:cheer]');
  res = res.replace(/\*smiles proudly[^*]*\*/gi, '[emo:proud 0.8] [act:smile]');
  res = res.replace(/\*([a-zA-Z\s,]+)\*/g, (match, p1) => `[act:${p1.trim().replace(/\s+/g, '_')}]`);

  return res;
}

const cleanedLines = lines.map(line => {
  let cleaned = cleanText(line);
  cleaned = cleaned.replace(/"archetype":\s*"user_private_[a-zA-Z0-9_]*"/g, '"archetype": "user_demo"');
  return cleaned;
});

fs.writeFileSync(filePath, cleanedLines.join('\n') + '\n', 'utf8');
console.log(`✅ Cleaned ${cleanedLines.length} dialogues in ${filePath}.`);
