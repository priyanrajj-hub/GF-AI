import fs from 'fs';

const filePath = 'training/data/train.jsonl';
const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

function cleanText(text) {
  let res = text;
  // Replace names
  res = res.replace(/User J/gi, 'Alex Taylor');
  res = res.replace(/User/gi, 'Alex');
  res = res.replace(/\bUser\b/gi, 'Alex');

  // Replace universities
  res = res.replace(/Amrita Vishwa Vidyapeetham, Chennai: B\.Tech in Computer & Communication Engineering \(CCE\) \[2025–2029\]/gi, 'Tech Institute: B.Tech in Computer Engineering');
  res = res.replace(/Amrita CCE/gi, 'Computer Engineering');
  res = res.replace(/Amrita/gi, 'University');
  res = res.replace(/IIT Madras BS Data Science/gi, 'Online BS in Data Science');
  res = res.replace(/IIT Guwahati BS DSAI/gi, 'Online BS in AI');
  res = res.replace(/IIT Madras/gi, 'National Institute of Tech');
  res = res.replace(/IIT Guwahati/gi, 'State Tech University');
  res = res.replace(/dual BS degrees at IIT Madras and IIT Guwahati/gi, 'dual online specialization degrees');

  // Replace locations
  res = res.replace(/Namakkal & Chennai, Tamil Nadu/gi, 'Bengaluru, India');
  res = res.replace(/Namakkal/gi, 'Bengaluru');
  res = res.replace(/Chennai/gi, 'Bengaluru');
  res = res.replace(/Tamil Nadu/gi, 'Karnataka');

  // Replace handles and personal gear
  res = res.replace(/u\/BatConfident4079/gi, 'u/AlgorithmicCoder');
  res = res.replace(/BatConfident4079/gi, 'AlgorithmicCoder');
  res = res.replace(/priyanrajj-hub/gi, 'demo-developer');
  res = res.replace(/priyanrajj@gmail\.com/gi, 'demo.user@example.com');
  res = res.replace(/ASUS TUF Gaming Laptop \(Intel Core i7 \+ NVIDIA RTX 5060 GPU, UTC\+5:30\)/gi, 'Developer Workstation (Modern Multi-core Laptop)');
  res = res.replace(/ASUS TUF RTX 5060/gi, 'development laptop');
  res = res.replace(/ASUS TUF/gi, 'laptop');
  res = res.replace(/RTX 5060 and i7 battlestation/gi, 'coding workstation');
  res = res.replace(/RTX 5060/gi, 'workstation GPU');
  res = res.replace(/LeetCode PRIYANRAJ/gi, 'LeetCode practice');

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
  // Ensure archetype names are generic
  cleaned = cleaned.replace(/"archetype":\s*"priyan_/g, '"archetype": "user_demo_');
  return cleaned;
});

fs.writeFileSync(filePath, cleanedLines.join('\n') + '\n', 'utf8');
console.log(`✅ Scrubbed ${cleanedLines.length} lines in ${filePath}`);
