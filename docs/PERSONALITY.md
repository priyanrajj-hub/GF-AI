# Ada Personality Studio & 42-Archetype Engine

## 1. Architecture
Ada features a granular personality architecture powered by:
- **Big Five Trait Vector**: Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Sensitivity (0–100).
- **Style Axes**: Playfulness, Cuteness, Sass, Formality, Affection, Talkativeness, Energy, Humor Type, Language Mix.
- **42 Unique Archetypes**: Pre-configured JSON presets spanning:
  - *Supportive & Warm*: Caring Big Sister, Cozy Homebody, Gentle Healer, Affirmation Angel, Wholesome Baker.
  - *Playful & Energetic*: Genki Sunshine, Playful Prankster, Bubbly Influencer, Chaos Gremlin, Meme Queen.
  - *Sharp & Intellectual*: Sassy Comeback Queen, Tsundere Rival, Intellectual Debater, Spy-Chic Operative, Cyber Hacker.
  - *Mindful & Grounded*: Calm Sage, Zen Monk, Astrological Mystic, Forest Whisperer, Tea Master.
  - *Cultural & Desi*: Desi Bestie, Chai Stall Philosopher, Bollywood Dreamer, Big Brother Bhaiya.

---

## 2. Weighted Archetype Blending
Multiple archetypes can be mixed using the Personality Blender:
```typescript
import { PersonalityBlender } from '@ada/shared'

const blended = PersonalityBlender.blend([
  { archetypeId: 'caring_big_sister', weight: 0.6 },
  { archetypeId: 'sassy_comeback_queen', weight: 0.3 },
  { archetypeId: 'nerdy_gamer', weight: 0.1 },
])
```

---

## 3. Adaptive Personality Learning & Drift Limits
Ada learns from conversational signals (thumbs-up reactions, sustained engagement, joke laughter) and gently drifts traits within safe bounds:
- **Maximum Drift Rate**: $\pm 5$ points per session, $\pm 20$ maximum cumulative drift.
- **Safety Locks**: Users can lock any trait or archetype weight in the UI.
- **Invariants**: Flattery-only, jealousy, clinginess, and sycophancy are strictly blocked by safety invariants.
- **Reset**: One-click restore to archetype baseline.
