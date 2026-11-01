import type { DetectedIntent, IntentClassificationResult } from './types.js'

interface IntentPattern {
  intent: DetectedIntent
  keywords: string[]
  regex?: RegExp
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'greeting',
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste', 'suno', 'kya haal', 'wassup'],
  },
  {
    intent: 'goodbye',
    keywords: ['bye', 'good night', 'see ya', 'tata', 'alvida', 'catch you later', 'shubh ratri', 'signing off'],
  },
  {
    intent: 'praise',
    keywords: ['good job', 'well done', 'you are awesome', 'proud of you', 'smart', 'great work', 'kamaal kar diya', 'shabash', 'mast'],
  },
  {
    intent: 'tease',
    keywords: ['you silly', 'nerd', 'robot', 'cant even', 'roast me', 'drama queen', 'pagal', 'nautanki', 'chhed rahe ho'],
  },
  {
    intent: 'thanks',
    keywords: ['thanks', 'thank you', 'thx', 'shukriya', 'dhanyawad', 'appreciate it'],
  },
  {
    intent: 'stress',
    keywords: ['tired', 'exhausted', 'stressed', 'hard day', 'cant take it', 'deadline', 'tension', 'sar phat raha hai', 'pareshan'],
  },
  {
    intent: 'achievement',
    keywords: ['i did it', 'passed', 'got the job', 'finished', 'won', 'shipped', 'accomplished', 'jeet gaye', 'ho gaya'],
  },
  {
    intent: 'joke',
    keywords: ['tell me a joke', 'make me laugh', 'funny story', 'chutkula', 'hansao'],
  },
  {
    intent: 'flirt_light',
    keywords: ['you are cute', 'love talking to you', 'you look pretty', 'my favorite ai', 'dil le gayi', 'bohot pyari ho'],
  },
  {
    intent: 'complaint',
    keywords: ['not working', 'wrong', 'you made a mistake', 'bad answer', 'sahi nahi hai', 'galat hai'],
  },
  {
    intent: 'game_move',
    keywords: ['rock', 'paper', 'scissors', 'guess', 'trivia', 'my turn', 'khelte hain'],
  },
  {
    intent: 'command',
    keywords: ['open', 'set', 'change', 'switch', 'show', 'clear', 'enable', 'disable', 'run', 'kholo', 'badlo'],
  },
]

export class IntentClassifier {
  static classify(text: string): IntentClassificationResult {
    const lower = text.toLowerCase().trim()

    let bestIntent: DetectedIntent = 'chit_chat'
    let highestScore = 0

    for (const pat of INTENT_PATTERNS) {
      let score = 0
      for (const kw of pat.keywords) {
        if (lower === kw) {
          score += 3.0 // Exact match
        } else if (lower.includes(kw)) {
          score += 1.5 // Substring match
        }
      }

      if (pat.regex && pat.regex.test(lower)) {
        score += 2.0
      }

      if (score > highestScore) {
        highestScore = score
        bestIntent = pat.intent
      }
    }

    const confidence = highestScore > 0 ? Math.min(1.0, 0.4 + highestScore * 0.2) : 0.35

    return {
      intent: bestIntent,
      confidence: Number(confidence.toFixed(2)),
    }
  }
}
