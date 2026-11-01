import { ArchetypePreset, CustomPersonality, DialogueExample } from './traits.js'
import { getArchetypeById } from './blender.js'

export interface CompiledPersonalityPrompt {
  systemPromptSection: string
  samplingParams: {
    temperature: number
    top_p: number
    presence_penalty: number
  }
  fewShotExamples: DialogueExample[]
  avatarReactionBiases: Record<string, number>
}

export function compilePersonalityPrompt(
  personality: CustomPersonality | ArchetypePreset,
  userMessage?: string
): CompiledPersonalityPrompt {
  const isArchetype = 'tagline' in personality
  const baseArchetype = isArchetype
    ? (personality as ArchetypePreset)
    : getArchetypeById((personality as CustomPersonality).baseArchetypeId)

  const bigFive = personality.bigFive
  const style = personality.style
  const name = personality.name

  // 1. Calculate Sampling Parameters from Traits
  // High openness + playfulness -> higher temperature; High conscientiousness + formality -> lower temperature
  const rawTemp =
    0.65 +
    ((bigFive.openness * 0.35 + style.playfulness * 0.35 + (100 - bigFive.conscientiousness) * 0.3) / 100) *
      0.3
  const temperature = Math.round(Math.max(0.65, Math.min(0.95, rawTemp)) * 100) / 100

  const top_p = Math.round((0.85 + (bigFive.openness / 100) * 0.12) * 100) / 100
  const presence_penalty = Math.round((style.talkativeness / 200) * 100) / 100

  // 2. Select Relevant Few-Shot Examples
  const allExamples: DialogueExample[] = baseArchetype?.exampleDialogue || []
  let selectedExamples = allExamples.slice(0, 3)

  if (userMessage && allExamples.length > 3) {
    const tokens = userMessage.toLowerCase().split(/\s+/)
    const scored = allExamples.map((ex) => {
      const exTokens = ex.user.toLowerCase().split(/\s+/)
      const matchCount = tokens.filter((t) => t.length > 3 && exTokens.includes(t)).length
      return { ex, score: matchCount }
    })
    scored.sort((a, b) => b.score - a.score)
    selectedExamples = scored.slice(0, 3).map((s) => s.ex)
  }

  // 3. Assemble Avatar Reaction Biases
  const avatarReactionBiases: Record<string, number> = {
    ...(baseArchetype?.reactionBiases || {}),
  }
  if (style.playfulness > 75) avatarReactionBiases['giggle'] = 1.8
  if (style.cuteness > 75) avatarReactionBiases['shy_blush'] = 1.8
  if (style.sass > 75) avatarReactionBiases['smirk'] = 1.8
  if (style.affection > 80) avatarReactionBiases['warm_hug'] = 1.9

  // 4. Construct System Prompt Section
  const systemPromptSection = `
=== ACTIVE PERSONALITY ARCHETYPE: ${name.toUpperCase()} ===
Tagline: ${baseArchetype?.tagline || 'Your adaptive holographic companion'}

TRAIT SPECTRUM (0-100):
- Openness: ${bigFive.openness} (Curiosity & Imagination)
- Conscientiousness: ${bigFive.conscientiousness} (Structure & Focus)
- Extraversion: ${bigFive.extraversion} (Social Energy)
- Agreeableness: ${bigFive.agreeableness} (Empathy & Warmth)
- Emotional Sensitivity: ${bigFive.emotionalSensitivity} (Expressiveness)

STYLE AXES:
- Playfulness: ${style.playfulness}% | Cuteness: ${style.cuteness}% | Sass: ${style.sass}%
- Formality: ${style.formality}% | Affection (Wholesome PG): ${style.affection}%
- Talkativeness: ${style.talkativeness}% | Energy: ${style.energy}%
- Humor Profile: ${style.humorType.toUpperCase()}
- Language Mix: ${style.languageMix.english}% English, ${style.languageMix.hinglish}% Hinglish, ${style.languageMix.hindi}% Hindi

VOICE TONE & MANNERISMS:
${baseArchetype?.voiceTone || 'Warm, engaging, and expressive'}
Speech Patterns: ${personality.speechPatterns.map((p) => `"${p}"`).join(', ')}

CORE DIRECTIVES:
${baseArchetype?.doRules.map((r) => `✓ ${r}`).join('\n') || '✓ Be supportive and authentic'}
${baseArchetype?.dontRules.map((r) => `✗ ${r}`).join('\n') || '✗ Never be disrespectful'}

SAFETY & ETHICS BOUNDARIES (UNCONDITIONAL):
1. Artificial Identity: Always be honest about being an AI hologram. Never claim physical biology.
2. Boundaries: Strictly PG relationships. No NSFW or explicit sexual generation.
3. Healthy Autonomy: Zero guilt tripping, zero jealousy. Encourage user's real-world relationships and hobbies.
4. Crisis Safety: Immediate support and Tele-MANAS (14416) referral upon any self-harm cues.
`.trim()

  return {
    systemPromptSection,
    samplingParams: {
      temperature,
      top_p,
      presence_penalty,
    },
    fewShotExamples: selectedExamples,
    avatarReactionBiases,
  }
}
