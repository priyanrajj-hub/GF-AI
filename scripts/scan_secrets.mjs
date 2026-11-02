import fs from 'fs';
import { execSync } from 'child_process';

console.log('🛡️  ==========================================');
console.log('🛡️  RUNNING SECRETS & CREDENTIALS SCANNER');
console.log('🛡️  ==========================================');

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

const secretRules = [
  { name: 'OpenAI API Key', regex: /\bsk-[a-zA-Z0-9_-]{24,}\b/ },
  { name: 'Anthropic API Key', regex: /\bsk-ant-[a-zA-Z0-9_-]{24,}\b/ },
  { name: 'ElevenLabs API Key', regex: /\bxi-[a-zA-Z0-9_-]{24,}\b/ },
  { name: 'Hugging Face Token', regex: /\bhf_[a-zA-Z0-9]{24,}\b/ },
  { name: 'GitHub Personal Access Token', regex: /\bgh[pousr]_[a-zA-Z0-9]{24,}\b/ },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS Secret Access Key', regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"][a-zA-Z0-9\/+=]{40}['"]/i },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Generic Password Assignment', regex: /(?:password|secret|api_key|access_token)\s*[:=]\s*['"][a-zA-Z0-9_!@#$%^&*-]{16,}['"]/i }
];

let violations = [];

for (const file of trackedFiles) {
  // Exclude documentation or test mocks that explicitly show placeholder syntax
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.glb') || file.endsWith('.vrm')) continue;
  if (!fs.existsSync(file)) continue;

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Allow benign placeholder / mock keys
      if (line.includes('mock_') || line.includes('placeholder') || line.includes('your_') || line.includes('sk-ant-api03-xxxx')) return;
      if (file.startsWith('scripts/scan_secrets')) return;

      for (const rule of secretRules) {
        if (rule.regex.test(line)) {
          violations.push({
            file,
            line: idx + 1,
            rule: rule.name,
            snippet: line.trim().slice(0, 80)
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
  console.log(`✅ [SECRETS SCAN PASSED]: Zero secrets or exposed API credentials found in ${trackedFiles.length} tracked files.`);
  process.exit(0);
}
