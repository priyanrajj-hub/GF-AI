import type { DetectedEmotion, DetectedIntent, StickerRecommendation } from './types.js'
import stickersData from '../stickers/stickers.json' with { type: 'json' }

interface RawSticker {
  id: string
  title: string
  caption: string
  category: string
  emoji: string
  associatedMood: string
}

export class StickerRecommender {
  private static stickers = stickersData as RawSticker[]

  static recommend(
    emotion: DetectedEmotion,
    intent: DetectedIntent,
    messageText: string = ''
  ): StickerRecommendation[] {
    const lower = messageText.toLowerCase()

    const scored = this.stickers.map((st) => {
      let score = 0

      // Mood match
      if (st.associatedMood.toLowerCase().includes(emotion.toLowerCase())) score += 3.0
      if (emotion === 'happy' && (st.associatedMood === 'happy' || st.category === 'cheer')) score += 2.0
      if (emotion === 'excited' && (st.associatedMood === 'playful' || st.category === 'cheer')) score += 2.0
      if (emotion === 'playful' && st.category === 'banter') score += 2.5
      if (emotion === 'shy' && st.associatedMood === 'shy') score += 3.0
      if (emotion === 'tsundere' && (st.associatedMood === 'pout' || st.associatedMood === 'smug')) score += 3.0

      // Intent match
      if (intent === 'greeting' && st.category === 'greeting') score += 3.0
      if (intent === 'goodbye' && (st.id === 'ada_peace' || st.category === 'night')) score += 3.0
      if (intent === 'achievement' && (st.id === 'ada_fist_pump' || st.id === 'ada_cheer')) score += 3.5
      if (intent === 'tease' && (st.id === 'ada_pout' || st.id === 'ada_smug')) score += 3.0
      if (intent === 'flirt_light' && (st.category === 'love' || st.category === 'flirt')) score += 3.0

      // Keyword match
      if (lower.includes('chai') || lower.includes('coffee')) {
        if (st.id === 'ada_coffee') score += 5.0
      }
      if (lower.includes('desi') || lower.includes('saree')) {
        if (st.id === 'ada_saree') score += 5.0
      }

      return {
        stickerId: st.id,
        packId: st.category,
        title: st.title,
        emoji: st.emoji,
        matchScore: Number(score.toFixed(2)),
      }
    })

    return scored
      .filter((s) => s.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4)
  }
}
