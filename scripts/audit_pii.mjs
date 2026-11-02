import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean);

let patterns = [
  { name: 'generic_personal_email', regex: /\b[a-zA-Z0-9._%+-]+@(?!example\.com|test\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i },
  { name: 'phone_number', regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { name: 'api_secret_key', regex: /\b(?:sk-[a-zA-Z0-9]{20,}|xi-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,})\b/i }
];

const privatePatternsPath = path.resolve(process.cwd(), 'private/pii_patterns.json');
if (fs.existsSync(privatePatternsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(privatePatternsPath, 'utf8'));
    if (Array.isArray(raw.patterns)) {
      raw.patterns.forEach((pat, i) => {
        patterns.push({ name: `private_pattern_${i + 1}`, regex: new RegExp(pat, 'i') });
      });
      console.log(`Loaded ${raw.patterns.length} patterns from gitignored private/pii_patterns.json`);
    }
  } catch (e) {
    console.error('Error loading private/pii_patterns.json:', e.message);
  }
}

const results = {};
let totalMatches = 0;

for (const file of trackedFiles) {
  if (!fs.existsSync(file)) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Don't flag prompt docs that mention the requirements or the audit itself
      if (file.startsWith('docs/prompts/ADA_V11') || file.startsWith('docs/prompts/ADA_V12') || file.startsWith('docs/prompts/ADA_V13')) return;
      if (file.startsWith('scripts/audit_pii') || file.startsWith('scripts/scan_pii')) return;

      for (const pat of patterns) {
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

console.log(`🔍 AUDIT COMPLETE: Found ${totalMatches} PII/Secret occurrences across ${Object.keys(results).length} files.`);
for (const [file, matches] of Object.entries(results)) {
  console.log(`\n📄 [${file}] (${matches.length} matches):`);
  matches.forEach(m => console.log(`   L${m.line} [${m.pattern}]: ${m.text}`));
}
