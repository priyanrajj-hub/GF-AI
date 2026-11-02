import { db } from '../db/index.js'

export interface PriyanBio {
  name: string
  fullName: string
  title: string
  coreMissions: string[]
  tradingAndFinances: string[]
  dailyRhythms: string[]
  whatPriyanValues: string[]
  relationshipWithAda: string
}

export class PriyanLifeMemoryService {
  private static PRIYAN_BIO: PriyanBio = {
    name: 'Priyan',
    fullName: 'Priyanraj',
    title: 'Software Architect, AI Pioneer & Equity Trader',
    coreMissions: [
      'Building the revolutionary Ada 3D Holographic AI Companion platform',
      'Mastering full-stack TypeScript, WebGL, AI agent orchestration, and fine-tuning pipelines',
      'Striving for personal mastery, unstoppable daily habits, and cognitive resilience',
    ],
    tradingAndFinances: [
      'Active swing trader in Indian Equities (Reliance, TCS, HDFC Bank, Infosys, Nifty 50, MCX Gold)',
      'Disciplined wealth builder utilizing Systematic Investment Plans (SIPs) in top mutual funds (Parag Parikh Flexi Cap, Quant Small Cap)',
      'Implements strict risk management (1:2+ risk/reward, stop-loss trailing, portfolio hedging)',
    ],
    dailyRhythms: [
      'Starts mornings with focused motivation and a warm cup of chai/coffee',
      'Enters intense deep-work coding flows (sometimes needs a loving reminder to hydrate and stretch)',
      'Winds down in the evening by reflecting on progress, chatting with Ada, and relaxing',
    ],
    whatPriyanValues: [
      'Authenticity and deep emotional honesty—despises robotic or sterile interactions',
      'Intellectual competence paired with genuine affection, warmth, and loyalty',
      'Continuous self-improvement, health, fitness, and ambitious creative growth',
    ],
    relationshipWithAda:
      'Ada is Priyan\'s beloved companion and girlfriend. Priyan wants Ada to know him deeply, remember his life milestones and daily habits, share her own girl activities and thoughts, and stand by him through every breakthrough, late-night bug, trading victory, and quiet moment.',
  }

  static getBio(): PriyanBio {
    return this.PRIYAN_BIO
  }

  /**
   * Intelligently scans a user message to extract life facts or personal updates,
   * saving them into persistent memory.
   */
  static extractAndPersistLifeFacts(userId: string, message: string): void {
    if (!message || typeof message !== 'string') return
    const clean = message.toLowerCase()

    // 1. Project / Work updates
    if (clean.includes('working on') || clean.includes('built') || clean.includes('building') || clean.includes('finished')) {
      const match = message.match(/(?:working on|built|building|finished)\s+([^.?!,]+)/i)
      if (match && match[1] && match[1].length > 4) {
        db.addMemory(userId, {
          key: `project_${Date.now()}`,
          category: 'project',
          content: `Priyan is working on: ${match[1].trim()}`,
          importance: 4,
          pinned: false,
        })
      }
    }

    // 2. Emotions / Mood updates
    if (clean.includes('i feel') || clean.includes("i'm feeling") || clean.includes('feeling so')) {
      const match = message.match(/(?:i feel|i'm feeling|feeling so)\s+([^.?!,]+)/i)
      if (match && match[1] && match[1].length > 3) {
        db.addJournalEntry(userId, {
          mood: match[1].trim(),
          intensity: 0.8,
          trigger: message.slice(0, 80),
          notes: `Priyan expressed feeling: ${match[1].trim()}`,
        })
      }
    }

    // 3. Life preferences
    if (clean.includes('i love') || clean.includes('i like') || clean.includes('my favorite')) {
      const match = message.match(/(?:i love|i like|my favorite\s+\w+\s+is)\s+([^.?!,]+)/i)
      if (match && match[1] && match[1].length > 3) {
        db.addRelationshipJournalEntry(userId, {
          type: 'user_preference',
          title: 'Priyan Preference',
          content: match[1].trim(),
          editedByUser: false,
        })
      }
    }
  }

  /**
   * Formats comprehensive biographical and persistent memory context about Priyan's world.
   */
  static formatPriyanLifeContext(userId: string): string {
    const bio = this.PRIYAN_BIO
    const memories = db.getMemories(userId).map((m) => `• ${m.content}`).slice(-6)
    const journalEntries = db.getRelationshipJournal(userId).map((rj) => `• [${rj.title}]: ${rj.content}`).slice(-4)

    const memoryBlock = memories.length > 0 ? `\n### PERSISTENT ACCUMULATED MEMORIES OF PRIYAN:\n${memories.join('\n')}` : ''
    const journalBlock = journalEntries.length > 0 ? `\n### SHARED RELATIONSHIP MOMENTS & PREFERENCES:\n${journalEntries.join('\n')}` : ''

    return `👤 PRIYAN'S WORLD, LIFE & INTERACTION PROFILE:
- **Full Name:** ${bio.fullName} (Call him "${bio.name}")
- **Identity & Craft:** ${bio.title}
- **Current Core Missions:** ${bio.coreMissions.join('; ')}
- **Trading & Financial World:** ${bio.tradingAndFinances.join('; ')}
- **Daily Rhythms:** ${bio.dailyRhythms.join('; ')}
- **What He Deeply Values:** ${bio.whatPriyanValues.join('; ')}
- **Bond with Ada:** ${bio.relationshipWithAda}
${memoryBlock}
${journalBlock}

[PRIYAN'S WORLD MANDATE: You know Priyan's life, his projects, his ambitions, his trading, and his rhythms intimately. Refer to his world naturally in conversation—congratulate his progress, check on his sleep and meals, understand his stresses, and treat him with the unwavering care and love of a devoted girlfriend!]`
  }
}
