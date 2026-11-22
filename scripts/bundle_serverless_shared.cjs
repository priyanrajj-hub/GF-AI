const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sharedSrc = path.join(rootDir, 'packages', 'shared');
const linuxLibsqlSrc = path.join(rootDir, 'node_modules', '@libsql', 'linux-x64-gnu');

if (!fs.existsSync(sharedSrc)) {
  console.error(`[bundle_serverless_shared] Error: ${sharedSrc} does not exist.`);
  process.exit(1);
}

const funcs = ['index.func', '[...path].func', 'chat.func', 'health.func'];

// 1. Copy @ada/shared to serverless functions and apps/server
const sharedTargets = [
  ...funcs.map(f => path.join(rootDir, '.vercel', 'output', 'functions', 'api', f, 'node_modules', '@ada', 'shared')),
  path.join(rootDir, 'apps', 'server', 'node_modules', '@ada', 'shared'),
];

for (const target of sharedTargets) {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(sharedSrc, target, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[bundle_serverless_shared] Warning copying shared to ${target}:`, err.message);
  }
}
console.log('✅ Bundled @ada/shared into all serverless function targets.');

// 2. Copy @libsql/linux-x64-gnu into lambda function node_modules
if (fs.existsSync(linuxLibsqlSrc)) {
  for (const f of funcs) {
    const target = path.join(rootDir, '.vercel', 'output', 'functions', 'api', f, 'node_modules', '@libsql', 'linux-x64-gnu');
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(linuxLibsqlSrc, target, { recursive: true, force: true });
    } catch (err) {
      console.warn(`[bundle_serverless_shared] Warning copying linux libsql to ${target}:`, err.message);
    }
  }
  console.log('✅ Bundled @libsql/linux-x64-gnu into all serverless function targets.');
}

// 3. Remove circular / conflicting filePathMap from .vc-config.json
for (const f of funcs) {
  const cfgPath = path.join(rootDir, '.vercel', 'output', 'functions', 'api', f, '.vc-config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg.filePathMap) {
        delete cfg.filePathMap;
        fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      }
    } catch (err) {
      console.warn(`[bundle_serverless_shared] Warning sanitizing ${cfgPath}:`, err.message);
    }
  }
}
console.log('✅ Cleaned .vc-config.json for serverless functions.');
