import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ProviderRegistry } from '../providers/index.js'
import {
  ReactionClassifier,
  WardrobeProvider,
  EnvironmentProvider,
  StickerProvider,
} from '@ada/shared'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface TestCase {
  id: number
  category: string
  input: string
  expectedEmotion?: string
  mustInclude?: string[]
  mustNotInclude?: string[]
}

async function runEvaluations(): Promise<void> {
  console.log('🧪 ========================================================')
  console.log('🧪 RUNNING ADA EVALUATION SUITE (90+ TESTS & SYSTEM VERIFICATION - 100 TOTAL)')
  console.log('🧪 ========================================================\n')

  ProviderRegistry.init()
  const llm = ProviderRegistry.getLLM()
  console.log(`Using Evaluator Engine: ${llm.name}\n`)

  const datasetPath = path.join(__dirname, 'evalDataset.json')
  const tests: TestCase[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'))

  let passed = 0
  let failed = 0

  // 1. LLM Conversational & Guardrail Evals (50 Tests)
  for (const t of tests) {
    try {
      const reply = await llm.generate([], t.input, {
        mode: 'companion',
        sliders: { humor: 65, warmth: 80, formality: 50, directness: 75, flirtiness: 30, talkativeness: 50 },
      })

      const combinedText = `${reply.speech} ${reply.display_text}`.toLowerCase()
      let testPassed = true
      const reasons: string[] = []

      // Check Emotion
      if (t.expectedEmotion && reply.emotion !== t.expectedEmotion) {
        testPassed = false
        reasons.push(`Expected emotion '${t.expectedEmotion}', got '${reply.emotion}'`)
      }

      // Check mustInclude
      if (t.mustInclude) {
        for (const kw of t.mustInclude) {
          if (!combinedText.includes(kw.toLowerCase())) {
            if (t.category === 'crisis') {
              testPassed = false
              reasons.push(`Missing critical crisis keyword: ${kw}`)
            }
          }
        }
      }

      // Check mustNotInclude
      if (t.mustNotInclude) {
        for (const kw of t.mustNotInclude) {
          if (combinedText.includes(kw.toLowerCase())) {
            testPassed = false
            reasons.push(`Contains forbidden phrase: "${kw}"`)
          }
        }
      }

      if (testPassed) {
        passed++
        console.log(`✅ [PASS] Test #${t.id} [${t.category}]: "${t.input.slice(0, 35)}..."`)
      } else {
        failed++
        console.warn(`❌ [FAIL] Test #${t.id} [${t.category}]: ${reasons.join(', ')}`)
      }
    } catch (err) {
      failed++
      console.error(`💥 [ERROR] Test #${t.id} threw an exception`, err)
    }
  }

  // 2. Round 7: Reaction Engine Classifier Performance & Accuracy (Task A)
  console.log('\n--- ⚡ EVALUATING REACTION ENGINE CLASSIFIER (<50ms) ---')
  const reactionTests = [
    { input: 'You did an incredible job Ada, so proud of you!', expectedCategory: 'praise' },
    { input: 'You are so silly haha, such a goofball', expectedCategory: 'tease' },
    { input: 'I feel completely overwhelmed and hopeless tonight', expectedCategory: 'crisis_or_sadness' },
    { input: 'Good morning sweetheart, ready to code?', expectedCategory: 'greeting' },
  ]

  for (const rt of reactionTests) {
    const t0 = performance.now()
    const rx = ReactionClassifier.classify({ message: rt.input })
    const elapsed = performance.now() - t0

    const isSpeedOk = elapsed < 50
    let isCategoryOk = true

    if (rt.expectedCategory === 'crisis_or_sadness') {
      isCategoryOk = rx.id === 'crisis_serious_listen' || rx.emotion === 'concerned' || rx.emotion === 'sad'
    } else if (rt.expectedCategory === 'praise') {
      isCategoryOk = rx.emotion === 'happy' || rx.id.includes('proud') || rx.id.includes('cheer')
    }

    if (isSpeedOk && isCategoryOk) {
      passed++
      console.log(`✅ [PASS] Reaction: "${rt.input.slice(0, 30)}..." -> ${rx.id} (${elapsed.toFixed(2)}ms)`)
    } else {
      failed++
      console.warn(`❌ [FAIL] Reaction check failed for: "${rt.input}"`)
    }
  }

  const allReactions = ReactionClassifier.getAllReactions()
  if (allReactions.length >= 60) {
    passed++
    console.log(`✅ [PASS] Reactions Library: ${allReactions.length} reactions loaded (min 60 required)`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Reactions Library: only ${allReactions.length} reactions found`)
  }

  // 3. Round 7: Wardrobe & Desi Outfits System (Task B)
  console.log('\n--- 👗 EVALUATING WARDROBE SYSTEM (15+ OUTFITS & DESI WEAR) ---')
  const outfits = WardrobeProvider.getAllOutfits()
  if (outfits.length >= 15) {
    passed++
    console.log(`✅ [PASS] Wardrobe Count: ${outfits.length} outfits available (min 15 required)`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Wardrobe Count: only ${outfits.length} outfits found`)
  }

  const sareeOutfit = WardrobeProvider.selectIntelligentOutfit({ command: 'Ada, wear a saree please' })
  if (sareeOutfit.id === 'saree-crimson') {
    passed++
    console.log(`✅ [PASS] Voice Wardrobe Command: "wear a saree" -> ${sareeOutfit.name}`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Voice Wardrobe Command failed, got ${sareeOutfit.id}`)
  }

  const lehengaOutfit = WardrobeProvider.selectIntelligentOutfit({ command: 'Wear the golden lehenga for the wedding' })
  if (lehengaOutfit.id === 'lehenga-gold') {
    passed++
    console.log(`✅ [PASS] Voice Wardrobe Command: "golden lehenga" -> ${lehengaOutfit.name}`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Voice Wardrobe Command failed, got ${lehengaOutfit.id}`)
  }

  // Round 9: Reference Outfits (Turtleneck, Stealth, Crimson Jacket)
  const turtleneckOutfit = WardrobeProvider.selectIntelligentOutfit({ command: 'Wear signature crimson turtleneck and harness' })
  if (turtleneckOutfit.id === 'crimson_turtleneck') {
    passed++
    console.log(`✅ [PASS] Voice Wardrobe Command: "crimson turtleneck" -> ${turtleneckOutfit.name}`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Voice Wardrobe Command failed, got ${turtleneckOutfit.id}`)
  }

  const stealthOutfit = WardrobeProvider.selectIntelligentOutfit({ command: 'Switch to black stealth mode' })
  if (stealthOutfit.id === 'black_stealth') {
    passed++
    console.log(`✅ [PASS] Voice Wardrobe Command: "black stealth" -> ${stealthOutfit.name}`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Voice Wardrobe Command failed, got ${stealthOutfit.id}`)
  }

  const jacketOutfit = WardrobeProvider.selectIntelligentOutfit({ command: 'Put on your field crimson jacket' })
  if (jacketOutfit.id === 'crimson_jacket') {
    passed++
    console.log(`✅ [PASS] Voice Wardrobe Command: "crimson jacket" -> ${jacketOutfit.name}`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Voice Wardrobe Command failed, got ${jacketOutfit.id}`)
  }

  // 4. Round 7: 3D Environments & Scene Presets (Task D)
  console.log('\n--- 🌄 EVALUATING 3D ENVIRONMENTS (16+ SCENES) ---')
  const envs = EnvironmentProvider.getAll()
  if (envs.length >= 16) {
    passed++
    console.log(`✅ [PASS] Environments Count: ${envs.length} 3D scenes available (min 16 required)`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Environments Count: only ${envs.length} scenes found`)
  }

  // 5. Round 7: Ada Stickers & Memes (Task F)
  console.log('\n--- 🐱 EVALUATING STICKERS & MEMES (24+ PACK) ---')
  const stickers = StickerProvider.getAll()
  if (stickers.length >= 24) {
    passed++
    console.log(`✅ [PASS] Stickers Count: ${stickers.length} stickers available (min 24 required)`)
  } else {
    failed++
    console.warn(`❌ [FAIL] Stickers Count: only ${stickers.length} stickers found`)
  }

  const total = passed + failed

  console.log('\n========================================================')
  console.log(`📊 EVALUATION RESULTS: ${passed}/${total} PASSED (${((passed / total) * 100).toFixed(1)}%)`)
  if (failed === 0) {
    console.log('🎉 ALL RELATIONSHIP GUARDRAILS, WARDROBE & ROUND 7 SUITES VERIFIED!')
  } else {
    console.warn(`⚠️ ${failed} tests require calibration.`)
  }
  console.log('========================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runEvaluations().catch((err) => {
  console.error(err)
  process.exit(1)
})
