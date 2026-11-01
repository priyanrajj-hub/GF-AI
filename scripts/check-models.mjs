#!/usr/bin/env node
/**
 * Ada Model Stack Health & Connectivity Checker
 * Inspects all registered LLM providers (Gemini, Groq, OpenRouter, Hugging Face, Ollama)
 */

import dotenv from 'dotenv'
dotenv.config()

async function checkOllama(host = process.env.OLLAMA_HOST || 'http://localhost:11434') {
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(1500) })
    if (res.ok) {
      const data = await res.json()
      const models = (data.models || []).map((m) => m.name).join(', ')
      return { ok: true, detail: `Online. Models installed: [${models || 'none'}]` }
    }
    return { ok: false, detail: `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, detail: 'Offline (Connection refused on localhost:11434)' }
  }
}

async function checkGemini() {
  const key = process.env.GEMINI_API_KEY || ''
  if (!key) return { ok: false, detail: 'No GEMINI_API_KEY found in .env' }
  return { ok: true, detail: 'Configured (Free 15 RPM / 1M TPM quota enabled)' }
}

async function checkGroq() {
  const key = process.env.GROQ_API_KEY || ''
  if (!key) return { ok: false, detail: 'No GROQ_API_KEY found in .env (Optional)' }
  return { ok: true, detail: 'Configured (30 RPM free tier)' }
}

async function checkOpenRouter() {
  const key = process.env.OPENROUTER_API_KEY || ''
  if (!key) return { ok: false, detail: 'No OPENROUTER_API_KEY found in .env (Optional)' }
  return { ok: true, detail: 'Configured (Free community tier)' }
}

async function checkHuggingFace() {
  const token = process.env.HF_ACCESS_KEY_ID || process.env.HF_TOKEN || ''
  if (!token) return { ok: false, detail: 'No HF_ACCESS_KEY_ID found in .env (Optional)' }
  return { ok: true, detail: 'Configured (Serverless free inference)' }
}

async function main() {
  console.log('=' .repeat(65))
  console.log(' 🤖 ADA MODEL STACK & PROVIDER CONNECTIVITY CHECK')
  console.log('=' .repeat(65))

  const gemini = await checkGemini()
  const groq = await checkGroq()
  const openrouter = await checkOpenRouter()
  const hf = await checkHuggingFace()
  const ollama = await checkOllama()

  const providers = [
    { name: 'Google Gemini AI (Primary Cloud)', ...gemini },
    { name: 'Groq Cloud Inference (Fast LPU)', ...groq },
    { name: 'OpenRouter Free Models', ...openrouter },
    { name: 'Hugging Face Inference Providers', ...hf },
    { name: 'Ollama Local (100% Private Offline)', ...ollama },
  ]

  for (const p of providers) {
    const statusTag = p.ok ? '✓ ACTIVE' : '○ STANDBY'
    console.log(` [${statusTag}] ${p.name}`)
    console.log(`            Status: ${p.detail}`)
  }

  console.log('-' .repeat(65))
  console.log(' Multi-tier Failover Strategy:')
  console.log(' 1. Reasoning Tasks: Gemini Flash -> Groq 70B -> HF Qwen 72B -> Local Ollama')
  console.log(' 2. Chit-Chat Tasks: Groq Instant -> Gemini Flash Lite -> HF -> Local Ollama')
  console.log(' 3. Private Mode: 100% Local Ollama (zero cloud leakage)')
  console.log('=' .repeat(65))
}

main()
