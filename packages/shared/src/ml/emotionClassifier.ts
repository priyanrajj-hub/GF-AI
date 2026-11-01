import type { DetectedEmotion, EmotionClassificationResult } from './types.js'

const HINGLISH_MARKERS = [
  'arre', 'yaar', 'bhai', 'mast', 'bohot', 'kamaal', 'suno', 'achha', 'theek',
  'batao', 'dil', 'pagal', 'tension', 'chalo', 'waah', 'badiya', 'jhakaas',
  'shukriya', 'sharam', 'hadd'
]

const EMOTION_LEXICON: Record<DetectedEmotion, { en: string[]; hi: string[]; valence: number; arousal: number }> = {
  happy: {
    en: ['happy', 'great', 'awesome', 'wonderful', 'smile', 'joy', 'glad', 'yay', 'hooray', 'love this'],
    hi: ['khush', 'mast', 'badiya', 'jhakaas', 'sahi hai', 'mazza', 'waah'],
    valence: 0.8,
    arousal: 0.7,
  },
  excited: {
    en: ['omg', 'incredible', 'pumped', 'hyped', 'cant wait', 'fire', 'epic', 'lets go'],
    hi: ['dhamaal', 'bawaal', 'dhamaka', 'toofan', 'faad'],
    valence: 0.9,
    arousal: 0.95,
  },
  sad: {
    en: ['sad', 'down', 'depressed', 'crying', 'unhappy', 'broken', 'lonely', 'miss', 'heartbroken'],
    hi: ['udaas', 'dukh', 'rona', 'akela', 'dard', 'bura laga'],
    valence: -0.7,
    arousal: 0.2,
  },
  stressed: {
    en: ['stressed', 'overwhelmed', 'deadline', 'pressure', 'exhausted', 'cant handle', 'burnout', 'anxious'],
    hi: ['tension', 'pareshan', 'thak gaya', 'dimag kharab', 'sar dard'],
    valence: -0.6,
    arousal: 0.8,
  },
  playful: {
    en: ['haha', 'lmao', 'lol', 'rofl', 'kidding', 'joke', 'silly', 'tease', 'troll', 'hehee'],
    hi: ['masti', 'mazak', 'pagal', 'nautanki', 'chhedna'],
    valence: 0.7,
    arousal: 0.6,
  },
  grateful: {
    en: ['thank you', 'thanks', 'appreciate', 'grateful', 'blessed', 'helpful', 'lifesaver'],
    hi: ['shukriya', 'dhanyawad', 'shukrana', 'ehsaan', 'meherbani'],
    valence: 0.85,
    arousal: 0.4,
  },
  romantic: {
    en: ['darling', 'sweetheart', 'gorgeous', 'cute', 'hug', 'warmth', 'adore', 'blush'],
    hi: ['pyaar', 'jaan', 'dilbar', 'ishq', 'deewana', 'mohabbat'],
    valence: 0.8,
    arousal: 0.5,
  },
  annoyed: {
    en: ['annoying', 'irritating', 'angry', 'shut up', 'hate', 'ugh', 'stupid', 'whatever'],
    hi: ['gussa', 'bakwaas', 'chup', 'dimag mat khao', 'pagal ho kya'],
    valence: -0.8,
    arousal: 0.8,
  },
  shy: {
    en: ['shy', 'blushing', 'nervous', 'awkward', 'quiet', 'embarrassed', 'look away'],
    hi: ['sharam', 'hichkichahat', 'dheere', 'nazrein'],
    valence: 0.3,
    arousal: 0.3,
  },
  tsundere: {
    en: ['baka', 'its not like i like you', 'dummy', 'not for you', 'whatever idiot'],
    hi: ['tere liye nahi', 'zyaada mat socho', 'hadd hai', 'dramebaaz'],
    valence: 0.4,
    arousal: 0.6,
  },
  neutral: {
    en: ['okay', 'sure', 'fine', 'status', 'check', 'next', 'yes', 'no', 'update'],
    hi: ['theek hai', 'achha', 'ha', 'nahi', 'suno'],
    valence: 0.0,
    arousal: 0.3,
  },
}

export class EmotionClassifier {
  static classify(text: string): EmotionClassificationResult {
    const lower = text.toLowerCase()
    const tokens = lower.split(/[\s,!?.]+/)

    // Check Hinglish
    const isHinglish = HINGLISH_MARKERS.some((marker) => lower.includes(marker))

    const scores: Record<DetectedEmotion, number> = {
      happy: 0.1,
      sad: 0.05,
      excited: 0.05,
      annoyed: 0.05,
      grateful: 0.05,
      playful: 0.1,
      romantic: 0.05,
      stressed: 0.05,
      neutral: 0.2,
      tsundere: 0.02,
      shy: 0.02,
    }

    for (const [emotion, lex] of Object.entries(EMOTION_LEXICON) as [
      DetectedEmotion,
      (typeof EMOTION_LEXICON)[DetectedEmotion],
    ][]) {
      let matchCount = 0
      for (const phrase of lex.en) {
        if (lower.includes(phrase)) matchCount += 2
      }
      for (const phrase of lex.hi) {
        if (lower.includes(phrase)) matchCount += 2.5
      }
      scores[emotion] += matchCount * 0.25
    }

    // Punctuation heuristics
    if (text.includes('!')) scores.excited += 0.2
    if (text.includes('?')) scores.neutral += 0.1
    if (text.includes('...')) {
      scores.shy += 0.15
      scores.sad += 0.1
    }

    // Softmax normalization
    const emotions = Object.keys(scores) as DetectedEmotion[]
    const expScores = emotions.map((e) => Math.exp(scores[e]))
    const sumExp = expScores.reduce((acc, v) => acc + v, 0)

    const normalizedScores = {} as Record<DetectedEmotion, number>
    emotions.forEach((e, idx) => {
      normalizedScores[e] = Number((expScores[idx] / sumExp).toFixed(3))
    })

    // Find primary
    let primary: DetectedEmotion = 'neutral'
    let maxScore = -1
    for (const e of emotions) {
      if (normalizedScores[e] > maxScore) {
        maxScore = normalizedScores[e]
        primary = e
      }
    }

    const lexData = EMOTION_LEXICON[primary] || EMOTION_LEXICON.neutral

    return {
      primary,
      confidence: maxScore,
      scores: normalizedScores,
      isHinglish,
      valence: lexData.valence,
      arousal: lexData.arousal,
    }
  }
}
