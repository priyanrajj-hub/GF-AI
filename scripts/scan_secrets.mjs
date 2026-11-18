import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🛡️  ==========================================');
console.log('🛡️  RUNNING SECRETS & CREDENTIALS SCANNER');
console.log('🛡️  ==========================================');

let filesToScan = new Set();

try {
  const tracked = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
  tracked.forEach((f) => filesToScan.add(f));
} catch (e) {
  console.warn('⚠️ Could not run git ls-files, scanning filesystem directly.');
}

// Ensure docs/ directory is explicitly enumerated and scanned
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      filesToScan.add(fullPath);
    }
  }
}

scanDir('docs');
scanDir('scripts');

const secretRules = [
  { name: 'OpenAI API Key', regex: /\bsk-[a-zA-Z0-9_-]{24,}\b/ },
  { name: 'Anthropic API Key', regex: /\bsk-ant-[a-zA-Z0-9_-]{24,}\b/ },
  { name: 'ElevenLabs API Key', regex: /\b(?:sk_[a-zA-Z0-9_-]{20,}|xi-[a-zA-Z0-9_-]{20,})\b/ },
  { name: 'Hugging Face Token', regex: /\bhf_[a-zA-Z0-9]{24,}\b/ },
  { name: 'GitHub Personal Access Token', regex: /\bgh[pousr]_[a-zA-Z0-9]{24,}\b/ },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS Secret Access Key', regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"][a-zA-Z0-9\/+=]{40}['"]/i },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Generic Password Assignment', regex: /(?:password|secret|api_key|access_token)\s*[:=]\s*['"][a-zA-Z0-9_!@#$%^&*-]{16,}['"]/i }
];

let violations = [];

for (const file of filesToScan) {
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.glb') || file.endsWith('.vrm')) continue;
  if (!fs.existsSync(file)) continue;

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Allow benign placeholder / mock keys / template variables
      if (
        line.includes('mock_') ||
        line.includes('placeholder') ||
        line.includes('your_') ||
        line.includes('sk-ant-api03-xxxx') ||
        line.includes('REDACTED') ||
        line.includes('REPLACE_WITH_') ||
        line.includes('test_verification_') ||
        line.includes('my-production-') ||
        line.includes('development-only-') ||
        line.includes('$PROD_') ||
        line.includes('$JWT_SECRET') ||
        line.includes('$REFRESH_SECRET')
      ) return;
      if (file.startsWith('scripts/scan_secrets')) return;

      // Zero-tolerance rule: flag ANY sk_ prefix in docs/ documentation
      if (file.startsWith('docs/') || file.includes('/docs/')) {
        const docsKeyPrefixRegex = /\bsk_[a-zA-Z0-9_-]+/i;
        if (docsKeyPrefixRegex.test(line)) {
          violations.push({
            file,
            line: idx + 1,
            rule: 'Exposed sk_ Secret Prefix in Docs',
            snippet: '[REDACTED_SECRET_IN_DOCS]'
          });
          return;
        }
      }

      for (const rule of secretRules) {
        if (rule.regex.test(line)) {
          // Strict Security Mandate: NEVER print raw secret values to logs, test output or console
          const redactedSnippet = line.replace(rule.regex, '[REDACTED_SECRET]').trim().slice(0, 80);
          violations.push({
            file,
            line: idx + 1,
            rule: rule.name,
            snippet: redactedSnippet
          });
          break;
        }
      }
    });
  } catch (err) {
    // skip binary or unreadable
  }
}

if (violations.length > 0) {
  console.error(`❌ [SECRETS SCAN FAILED]: ${violations.length} secret/credential violations detected!`);
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [${v.rule}]: "${v.snippet}"`);
  });
  process.exit(1);
} else {
  console.log(`✅ [SECRETS SCAN PASSED]: Zero secrets or exposed API credentials found in ${filesToScan.size} scanned files.`);
  process.exit(0);
}
