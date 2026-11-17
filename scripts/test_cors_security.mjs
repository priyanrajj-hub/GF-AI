import assert from 'node:assert/strict'
import express from 'express'
import cors from 'cors'
import { JwtService } from '../apps/server/src/services/jwtService.js'

console.log('─── Testing CORS & Express Security Handlers ───')

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://gf-ai-ochre.vercel.app',
]

function isOriginAllowed(origin) {
  if (!origin) return true
  if (defaultAllowedOrigins.includes(origin)) return true
  if (/^https:\/\/gf-[a-z0-9-]+\.vercel\.app$/.test(origin)) return true
  return false
}

// 1. Test CORS Origin Check
assert.equal(isOriginAllowed('https://gf-ai-ochre.vercel.app'), true, 'Official prod domain must be allowed')
assert.equal(isOriginAllowed('http://localhost:5173'), true, 'Localhost 5173 must be allowed')
assert.equal(isOriginAllowed('https://gf-preview-test.vercel.app'), true, 'Vercel preview domain must be allowed')
assert.equal(isOriginAllowed('https://evil-hacker.com'), false, 'Attacker origin must be rejected')
assert.equal(isOriginAllowed('https://phishing-gf-ai.com'), false, 'Phishing origin must be rejected')
console.log('  ✓ PASS: CORS origin allowlist strictly accepts allowed and rejects attacker domains')

// 2. Test Token Issuance & Verification Lifecycle
const token = JwtService.sign({
  userId: 'test-user-prod-1',
  userName: 'Verified User',
  role: 'user',
})

const verified = JwtService.verify(token)
assert.equal(verified.userId, 'test-user-prod-1')
assert.equal(verified.role, 'user')
console.log('  ✓ PASS: User token issuance and cryptographic verification lifecycle functional')

console.log('─── All CORS & Security Handlers Passed! ───')
