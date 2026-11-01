import {
  ArchetypePreset,
  BigFiveTraits,
  CustomPersonality,
  PersonalityBlendComponent,
  StyleAxes,
} from './traits.js'
import archetypesData from './archetypes.json' with { type: 'json' }

export const ARCHETYPES: ArchetypePreset[] = (archetypesData as unknown) as ArchetypePreset[]

export function getArchetypeById(id: string): ArchetypePreset | undefined {
  return ARCHETYPES.find((a) => a.id === id)
}

/**
 * Blend multiple archetypes with user-specified weights into a cohesive persona.
 * Weights are automatically normalized to sum to 1.0.
 */
export function blendArchetypes(
  name: string,
  components: PersonalityBlendComponent[],
  baseArchetypeId?: string
): CustomPersonality {
  if (!components || components.length === 0) {
    const fallback = ARCHETYPES[0]
    return {
      id: `custom-${Date.now()}`,
      name: name || fallback.name,
      baseArchetypeId: fallback.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bigFive: { ...fallback.bigFive },
      style: { ...fallback.style },
      speechPatterns: [...fallback.speechPatterns],
      blends: [{ archetypeId: fallback.id, weight: 1.0 }],
    }
  }

  // 1. Normalize weights
  const totalWeight = components.reduce((sum, c) => sum + Math.max(0, c.weight), 0)
  const normWeight = totalWeight > 0 ? totalWeight : 1.0
  const normalized = components.map((c) => ({
    archetypeId: c.archetypeId,
    weight: Math.max(0, c.weight) / normWeight,
  }))

  // 2. Resolve loaded archetypes
  const resolved = normalized
    .map((c) => ({
      archetype: getArchetypeById(c.archetypeId),
      weight: c.weight,
    }))
    .filter((r): r is { archetype: ArchetypePreset; weight: number } => Boolean(r.archetype))

  if (resolved.length === 0) {
    const fallback = ARCHETYPES[0]
    return {
      id: `custom-${Date.now()}`,
      name: name || fallback.name,
      baseArchetypeId: fallback.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      bigFive: { ...fallback.bigFive },
      style: { ...fallback.style },
      speechPatterns: [...fallback.speechPatterns],
    }
  }

  // 3. Interpolate Big Five
  const bigFive: BigFiveTraits = {
    openness: Math.round(resolved.reduce((sum, r) => sum + r.archetype.bigFive.openness * r.weight, 0)),
    conscientiousness: Math.round(
      resolved.reduce((sum, r) => sum + r.archetype.bigFive.conscientiousness * r.weight, 0)
    ),
    extraversion: Math.round(
      resolved.reduce((sum, r) => sum + r.archetype.bigFive.extraversion * r.weight, 0)
    ),
    agreeableness: Math.round(
      resolved.reduce((sum, r) => sum + r.archetype.bigFive.agreeableness * r.weight, 0)
    ),
    emotionalSensitivity: Math.round(
      resolved.reduce((sum, r) => sum + r.archetype.bigFive.emotionalSensitivity * r.weight, 0)
    ),
  }

  // 4. Interpolate Style Axes
  const dominant = resolved.reduce((max, r) => (r.weight > max.weight ? r : max), resolved[0])

  const style: StyleAxes = {
    playfulness: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.playfulness * r.weight, 0)),
    cuteness: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.cuteness * r.weight, 0)),
    sass: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.sass * r.weight, 0)),
    formality: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.formality * r.weight, 0)),
    affection: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.affection * r.weight, 0)),
    talkativeness: Math.round(
      resolved.reduce((sum, r) => sum + r.archetype.style.talkativeness * r.weight, 0)
    ),
    energy: Math.round(resolved.reduce((sum, r) => sum + r.archetype.style.energy * r.weight, 0)),
    humorType: dominant.archetype.style.humorType,
    languageMix: {
      english: Math.round(
        resolved.reduce((sum, r) => sum + r.archetype.style.languageMix.english * r.weight, 0)
      ),
      hinglish: Math.round(
        resolved.reduce((sum, r) => sum + r.archetype.style.languageMix.hinglish * r.weight, 0)
      ),
      hindi: Math.round(
        resolved.reduce((sum, r) => sum + r.archetype.style.languageMix.hindi * r.weight, 0)
      ),
    },
  }

  // 5. Gather combined speech patterns (top weighted items)
  const allSpeech: string[] = []
  resolved.forEach((r) => {
    allSpeech.push(...r.archetype.speechPatterns.slice(0, 3))
  })
  const speechPatterns = Array.from(new Set(allSpeech)).slice(0, 8)

  return {
    id: `custom-${Date.now()}`,
    name,
    baseArchetypeId: baseArchetypeId || dominant.archetype.id,
    blends: normalized,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    bigFive,
    style,
    speechPatterns,
  }
}
