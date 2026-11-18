#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

/**
 * Standalone Software Bill of Materials (SBOM) Generator for Ada Monorepo
 * Produces compliant SPDX 2.3 JSON specification.
 */

console.log('🛡️ [SBOM Generator] Generating Software Bill of Materials (SPDX 2.3 JSON)...')

const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const serverPkg = JSON.parse(fs.readFileSync('apps/server/package.json', 'utf8'))
const webPkg = JSON.parse(fs.readFileSync('apps/web/package.json', 'utf8'))

const allDeps = {
  ...rootPkg.dependencies,
  ...serverPkg.dependencies,
  ...webPkg.dependencies,
}

const packages = Object.entries(allDeps).map(([name, version], idx) => ({
  SPDXID: `SPDXRef-Package-${name.replace(/[^a-zA-Z0-9-]/g, '-')}`,
  name,
  versionInfo: version.replace(/[\^~]/g, ''),
  downloadLocation: `https://registry.npmjs.org/${name}/-/${name}-${version.replace(/[\^~]/g, '')}.tgz`,
  filesAnalyzed: false,
  licenseConcluded: 'NOASSERTION',
  licenseDeclared: 'NOASSERTION',
  copyrightText: 'NOASSERTION',
}))

const sbom = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: 'Ada AI & Jarvis Trade Monorepo SBOM',
  documentNamespace: `https://github.com/priyanrajj-hub/GF-AI/spdx/${Date.now()}`,
  creationInfo: {
    creators: ['Tool: Ada-SBOM-Generator-1.0', 'Organization: Ada Security Engineering'],
    created: new Date().toISOString(),
  },
  packages: [
    {
      SPDXID: 'SPDXRef-RootPackage',
      name: 'gf-ai',
      versionInfo: rootPkg.version || '1.0.0',
      downloadLocation: 'git+https://github.com/priyanrajj-hub/GF-AI.git',
      filesAnalyzed: false,
      licenseConcluded: 'MIT',
      licenseDeclared: 'MIT',
      copyrightText: 'Copyright (c) 2026 GF-AI Authors',
    },
    ...packages,
  ],
}

fs.writeFileSync('sbom.spdx.json', JSON.stringify(sbom, null, 2))
console.log(`✅ [SBOM Generator] Successfully generated sbom.spdx.json with ${sbom.packages.length} registered packages.`)
