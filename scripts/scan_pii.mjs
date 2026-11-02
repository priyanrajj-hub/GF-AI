import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔒 ==========================================');
console.log('🔒 RUNNING PII & PRIVACY SECURITY SCANNER');
console.log('🔒 ==========================================');

let trackedFiles = [];
try {
  trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
} catch (e) {
  console.error('Failed to get tracked files from git:', e.message);
  process.exit(1);
}

const piiPatterns = [
  { name: 'priyanraj', regex: /priyanraj/i },
  { name: 'priyan', regex: /\bpriyan\b/i },
  { name: 'amrita', regex: /amrita/i },
  { name: 'iit_colleges', regex: /iit\s+(madras|guwahati)/i },
  { name: 'namakkal', regex: /namakkal/i },
  { name: 'batconfident', regex: /batconfident/i },
  { name: 'asus_hardware', regex: /asus\s+tuf|rtx\s*5060/i },
  { name: 'personal_email', regex: /priyanrajj@gmail\.com/i }
];

let violationCount = 0;
const violations = [];

for (const file of trackedFiles) {
  // Exclude prompt requirement specifications and scanner scripts themselves
  if (file.startsWith('docs/prompts/ADA_V11') || file.startsWith('docs/prompts/ADA_V12') || file.startsWith('docs/prompts/ADA_V13')) continue;
  if (file.startsWith('scripts/scan_pii') || file.startsWith('scripts/audit_pii') || file.includes('runEvals')) continue;
  if (!fs.existsSync(file)) continue;

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const pat of piiPatterns) {
        if (pat.regex.test(line)) {
          violationCount++;
          violations.push({
            file,
            line: idx + 1,
            pattern: pat.name,
            snippet: line.trim().slice(0, 100),
          });
          break;
        }
      }
    });
  } catch (err) {
    // skip unreadable
  }
}

if (violationCount > 0) {
  console.error(`❌ [PII SCAN FAILED]: ${violationCount} privacy violations detected in tracked files!`);
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [${v.pattern}]: "${v.snippet}"`);
  });
  process.exit(1);
} else {
  console.log(`✅ [PII SCAN PASSED]: Zero personal data or private profile information found in ${trackedFiles.length} tracked files.`);
  process.exit(0);
}
