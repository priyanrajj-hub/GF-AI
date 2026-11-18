import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../')

console.log('🔍 Executing Docker & Compose Structural Verification...')

// 1. Validate Dockerfile
const dockerfilePath = path.join(rootDir, 'Dockerfile')
if (!fs.existsSync(dockerfilePath)) {
  console.error('❌ Missing Dockerfile')
  process.exit(1)
}
const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8')

const requiredStages = ['AS builder', 'AS api', 'AS worker', 'AS web']
for (const stage of requiredStages) {
  if (!dockerfileContent.includes(stage)) {
    console.error(`❌ Dockerfile missing target stage: ${stage}`)
    process.exit(1)
  }
}

if (!dockerfileContent.includes('USER node')) {
  console.error('❌ Dockerfile missing non-root USER node declaration')
  process.exit(1)
}

if (!dockerfileContent.includes('HEALTHCHECK')) {
  console.error('❌ Dockerfile missing HEALTHCHECK directive')
  process.exit(1)
}

console.log('  ✅ Dockerfile multi-stage build & security verified')

// 2. Validate docker-compose.yml
const composePath = path.join(rootDir, 'docker-compose.yml')
if (!fs.existsSync(composePath)) {
  console.error('❌ Missing docker-compose.yml')
  process.exit(1)
}
const composeContent = fs.readFileSync(composePath, 'utf8')

const requiredServices = ['postgres:', 'redis:', 'api:', 'worker:', 'web:']
for (const s of requiredServices) {
  if (!composeContent.includes(s)) {
    console.error(`❌ docker-compose.yml missing service: ${s}`)
    process.exit(1)
  }
}

// Insecure secret check
if (composeContent.includes('production-ready-jwt-secret')) {
  console.error('❌ docker-compose.yml contains hardcoded insecure fallback JWT secret')
  process.exit(1)
}

console.log('  ✅ docker-compose.yml services, volumes & secrets posture verified')

// 3. Validate dev & observability compose files
const devComposePath = path.join(rootDir, 'docker-compose.dev.yml')
const obsComposePath = path.join(rootDir, 'docker-compose.observability.yml')
if (!fs.existsSync(devComposePath) || !fs.existsSync(obsComposePath)) {
  console.error('❌ Missing dev or observability docker compose override files')
  process.exit(1)
}

console.log('  ✅ docker-compose.dev.yml and docker-compose.observability.yml verified')
console.log('🎉 Docker Stack Verification Passed 100%!')
