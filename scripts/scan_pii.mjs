import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

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

// Allowed public safety helplines (Govt mandated emergency crisis lines)
const isKnownHelplineOrFalsePositive = (line) => {
  return (
    line.includes('1800-599-0019') ||
    line.includes('1800-891-4416') ||
    line.includes('14416') ||
    line.includes('988') ||
    line.includes('KIRAN') ||
    line.includes('Tele-MANAS') ||
    line.includes('images.unsplash.com') ||
    line.includes('float hash') ||
    line.includes('fract(sin')
  );
};

// 1. Generic PII patterns applicable to all repositories in CI/CD
const genericPiiPatterns = [
  { 
    name: 'generic_personal_email', 
    regex: /\b[a-zA-Z0-9._%+-]+@(?!example\.com|test\.com|yourdomain\.com|demo\.user)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i,
    allowed: (line) => line.includes('priyanrajj-hub') || line.includes('support@') || line.includes('noreply@')
  },
  { 
    name: 'phone_number', 
    regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    allowed: isKnownHelplineOrFalsePositive
  },
  { 
    name: 'us_ssn', 
    regex: /\b\d{3}-\d{2}-\d{4}\b/ 
  }
];

// 2. Load private patterns dynamically from gitignored private/pii_patterns.json if present
let customPatterns = [];
const privatePatternsPath = path.resolve(process.cwd(), 'private/pii_patterns.json');
if (fs.existsSync(privatePatternsPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(privatePatternsPath, 'utf8'));
    if (Array.isArray(raw.patterns)) {
      customPatterns = raw.patterns.map((p, idx) => ({
        name: `custom_private_pattern_${idx + 1}`,
        regex: new RegExp(p, 'i')
      }));
      console.log(`🔒 Loaded ${customPatterns.length} private patterns from gitignored private/pii_patterns.json`);
    }
  } catch (err) {
    console.warn(`⚠️ Warning: could not parse private/pii_patterns.json:`, err.message);
  }
} else {
  console.log(`ℹ️ [CI/Public mode]: No local private/pii_patterns.json detected. Enforcing generic PII guardrails.`);
}

const allPatterns = [...genericPiiPatterns, ...customPatterns];

let violationCount = 0;
const violations = [];

const binaryExtensions = ['.vrm', '.glb', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.mp3', '.wav', '.ogg'];

for (const file of trackedFiles) {
  // Exclude binary assets
  if (binaryExtensions.some((ext) => file.endsWith(ext))) continue;

  // Exclude prompt requirement specifications and scanner scripts themselves
  if (file.startsWith('docs/prompts/ADA_V11') || file.startsWith('docs/prompts/ADA_V12') || file.startsWith('docs/prompts/ADA_V13')) continue;
  if (file.startsWith('scripts/scan_pii') || file.startsWith('scripts/audit_pii') || file.includes('runEvals')) continue;
  if (!fs.existsSync(file)) continue;

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const pat of allPatterns) {
        if (pat.regex.test(line)) {
          if (pat.allowed && pat.allowed(line)) continue;
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
