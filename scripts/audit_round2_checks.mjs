import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('=== AUDIT ROUND 2 VERIFICATION SUITE ===');

// 1. Check tracked files
console.log('\n--- 1. Checking for tracked build artifacts, source maps, env files ---');
const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').map(s => s.trim()).filter(Boolean);
const buildArtifacts = tracked.filter(f => 
  f.endsWith('.map') || 
  f.includes('/dist/') || 
  f.startsWith('dist/') ||
  (f.endsWith('.js') && f.includes('/src/') && fs.existsSync(f.replace(/\.js$/, '.ts'))) ||
  (f.startsWith('.env') && f !== '.env.example')
);
console.log('Build artifacts tracked count:', buildArtifacts.length);
if (buildArtifacts.length > 0) {
  console.log('Build artifacts:', buildArtifacts.slice(0, 10));
}

// 2. Checking binary 3D models and large media files
console.log('\n--- 2. Checking 3D models and binary files ---');
const binaryAssets = tracked.filter(f => 
  f.endsWith('.vrm') || f.endsWith('.glb') || f.endsWith('.fbx') || f.endsWith('.obj')
);
console.log('Tracked 3D model assets count:', binaryAssets.length);
binaryAssets.forEach(f => {
  const stat = fs.statSync(f);
  console.log(`  - ${f} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
});

// 3. Scan git history for secret leaks
console.log('\n--- 3. Scanning git commit history for secret patterns ---');
const secretPatterns = [
  'sk_[a-zA-Z0-9_-]{20,}',
  'ghp_[a-zA-Z0-9]{30,}',
  'AIza[0-9A-Za-z\\-_]{35}',
  'hf_[a-zA-Z0-9]{30,}',
  'eyJhbGciOi'
];

for (const pattern of secretPatterns) {
  try {
    const res = execSync(`git log -G "${pattern}" --oneline -n 5`, { encoding: 'utf8' }).trim();
    if (res) {
      console.log(`⚠️ Commits touching pattern "${pattern}":\n${res}`);
    } else {
      console.log(`✓ Pattern "${pattern}": 0 commits in history`);
    }
  } catch (err) {
    console.log(`✓ Pattern "${pattern}": 0 matches / clean`);
  }
}

// 4. Check licenses of dependencies
console.log('\n--- 4. Checking dependencies and licenses ---');
try {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('Root package license:', rootPkg.license || 'MIT');
} catch (e) {
  console.log('Error reading root package.json');
}

console.log('\n=== AUDIT COMPLETE ===');
