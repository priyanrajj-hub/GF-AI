import fs from 'fs';
import { execSync } from 'child_process';

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean);

const piiPatterns = [
  { name: 'priyanraj', regex: /priyanraj/i },
  { name: 'priyan', regex: /\bpriyan\b/i },
  { name: 'amrita', regex: /amrita/i },
  { name: 'iit_colleges', regex: /iit\s+(madras|guwahati)/i },
  { name: 'namakkal', regex: /namakkal/i },
  { name: 'batconfident', regex: /batconfident/i },
  { name: 'priyanrajj', regex: /priyanrajj/i },
  { name: 'asus_hardware', regex: /asus\s+tuf|rtx\s*5060/i },
  { name: 'email', regex: /priyanrajj@gmail\.com/i }
];

const results = {};
let totalMatches = 0;

for (const file of trackedFiles) {
  if (!fs.existsSync(file)) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Don't flag prompt docs that mention the requirements or the audit itself
      if (file.startsWith('docs/prompts/ADA_V11') || file.startsWith('docs/prompts/ADA_V12')) return;
      if (file === 'scripts/audit_pii.mjs') return;

      for (const pat of piiPatterns) {
        if (pat.regex.test(line)) {
          if (!results[file]) results[file] = [];
          results[file].push({ line: idx + 1, pattern: pat.name, text: line.trim().slice(0, 140) });
          totalMatches++;
          break;
        }
      }
    });
  } catch (e) {
    // skip binary files
  }
}

console.log(`🔍 AUDIT COMPLETE: Found ${totalMatches} PII occurrences across ${Object.keys(results).length} files:`);
for (const [file, matches] of Object.entries(results)) {
  console.log(`\n📄 [${file}] (${matches.length} matches):`);
  matches.forEach(m => console.log(`   L${m.line} [${m.pattern}]: ${m.text}`));
}
