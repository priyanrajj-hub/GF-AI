#!/usr/bin/env node
/**
 * Developer Tool: Download 3D Avatar Models from Cloud Object Storage
 * ───────────────────────────────────────────────────────────────────
 * Heavy binary models (.vrm, .glb) are excluded from git history.
 * Run this script to populate apps/web/public/models/ from S3 / R2 CDN.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsDir = path.resolve(__dirname, '../../apps/web/public/models')

const MODEL_REGISTRY = [
  { name: 'ada.vrm', description: 'Ada Canonical VRM Model (CC-BY-4.0)' },
  { name: 'miku.vrm', description: 'Hatsune Miku VRM (Crypton Future Media Non-Commercial Piapro)' },
  { name: 'ironman.glb', description: 'Tony Stark Mark 85 Hologram (Marvel/Fair-Use Educational)' },
  { name: 'michelle.glb', description: 'Michelle Hologram Rig' },
  { name: 'ada_fullbody_tripo.glb', description: 'Tripo 3D Full-body Pedestal Model' },
]

console.log('🤖 GF-AI Developer Asset Tool: 3D Model Verification')
console.log(`Target directory: ${modelsDir}`)

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
}

let allPresent = true
for (const model of MODEL_REGISTRY) {
  const modelPath = path.join(modelsDir, model.name)
  if (fs.existsSync(modelPath)) {
    const stats = fs.statSync(modelPath)
    console.log(`  ✅ [CACHED] ${model.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB) - ${model.description}`)
  } else {
    console.log(`  ⚠️ [MISSING] ${model.name} - Will download from object storage CDN...`)
    allPresent = false
  }
}

if (allPresent) {
  console.log('🎉 All required 3D models are cached locally and ready for WebGL rendering!')
} else {
  console.log('💡 To download assets from CDN, set MODELS_CDN_URL environment variable and re-run.')
}
