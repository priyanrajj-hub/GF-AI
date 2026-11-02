import fs from 'fs'
import path from 'path'
import { db } from '../db/index.js'

export interface UserBio {
  name: string
  fullName: string
  handle: string
  title: string
  location: string
  academics: string[]
  careerGoal: string
  projects: string[]
  techStackAndGear: string[]
  competitiveProgramming: string[]
  certifications: string[]
  socialHandles: Record<string, string>
  roadmap2026: string[]
  coreMissions: string[]
  tradingAndFinances: string[]
  dailyRhythms: string[]
  whatUserValues: string[]
  relationshipWithAda: string
}

export class UserLifeMemoryService {
  private static DEMO_BIO: UserBio = {
    name: 'Demo User',
    fullName: 'Alex Taylor',
    handle: 'demo-developer',
    title: 'Software Engineer & AI Enthusiast',
    location: 'San Francisco, CA (UTC-7) / Local Dev',
    academics: [
      'B.S. in Computer Science & Engineering',
      'Continuous online specialization in Machine Learning & Distributed Systems',
      'Active open-source community member',
    ],
    careerGoal:
      'AI Systems Engineer & Full-Stack Architect building robust, empathetic intelligent agents.',
    projects: [
      'Distributed High-Throughput Message Queue in Rust/C++',
      'Autonomous Vision-Guided Rover Prototype',
      'Interactive Full-Stack Web Application with Real-Time WebSockets',
    ],
    techStackAndGear: [
      'Languages: TypeScript, Python, C++, Go, SQL',
      'Environment: Modern Multi-Core Workstation, Linux/Windows Dev Setup',
    ],
    competitiveProgramming: [
      'LeetCode: Active Problem Solver (Algorithms & Data Structures)',
      'GitHub: Open Source Contributor',
    ],
    certifications: [
      'Deep Learning Specialization',
      'Cloud Architecture Certification',
    ],
    socialHandles: {
      github: 'https://github.com/example/demo-developer',
    },
    roadmap2026: [
      'Q2 2026: Master Distributed Systems & Advanced Data Structures',
      'Q3 2026: Deploy scalable production AI agent system',
      'Q4 2026: Expand open-source engineering portfolio',
    ],
    coreMissions: [
      'Continuous learning, deep work habits, and building impactful software tools',
      'Building the open Ada 3D Holographic Companion platform',
      'Balancing intense coding focus with daily physical health, rest, and relationships',
    ],
    tradingAndFinances: [
      'Systematic index investing and disciplined risk management',
      'Long-term dollar-cost averaging into diversified funds',
    ],
    dailyRhythms: [
      'Starts mornings with coffee/tea and daily priority planning',
      'Focused deep work blocks with regular breaks to avoid eye strain',
      'Evening reflections and winding down before bed',
    ],
    whatUserValues: [
      'Authentic, respectful communication and genuine warmth',
      'Honesty about limitations, privacy, and zero data exploitation',
      'Encouragement toward real-world relationships and healthy lifestyle balance',
    ],
    relationshipWithAda:
      'Ada is a supportive, thoughtful AI companion and co-pilot. She remembers shared preferences naturally and sparingly, encourages progress without reciting biographies, and respects privacy boundaries.',
  }

  /**
   * Safely loads the active biography.
   * If a private, gitignored `private/user_profile.json` exists on the local machine,
   * it loads it for the local owner; otherwise falls back to the clean public DEMO_BIO.
   */
  public static getBio(): UserBio {
    try {
      const privateProfilePath = path.resolve(process.cwd(), 'private', 'user_profile.json')
      if (fs.existsSync(privateProfilePath)) {
        const raw = fs.readFileSync(privateProfilePath, 'utf8')
        return JSON.parse(raw) as UserBio
      }
      // Also check root if cwd is apps/server
      const rootPrivatePath = path.resolve(process.cwd(), '..', '..', 'private', 'user_profile.json')
      if (fs.existsSync(rootPrivatePath)) {
        const raw = fs.readFileSync(rootPrivatePath, 'utf8')
        return JSON.parse(raw) as UserBio
      }
    } catch (e) {
      // ignore read error and fall back to demo bio
    }
    return this.DEMO_BIO
  }

  public static formatUserLifeContext(userId: string = 'default-user'): string {
    const bio = this.getBio()
    const memoryFacts = db.getMemories(userId).slice(-8)

    const factsFormatted =
      memoryFacts.length > 0
        ? memoryFacts.map((m) => `• [${m.category}] ${m.content}`).join('\n')
        : '• No specific interaction memories recorded yet.'

    return `
### 👤 USER WORLD & CONTEXT (PRIVATE LOCAL CONTEXT)
- **Name:** ${bio.name} (${bio.title})
- **Focus & Goals:** ${bio.careerGoal}
- **Key Projects:** ${bio.projects.slice(0, 2).join(' | ')}
- **Values:** ${bio.whatUserValues.slice(0, 2).join('; ')}
- **Companion Relationship:** ${bio.relationshipWithAda}

### 🧠 RECENT INTERACTION MEMORIES:
${factsFormatted}

*(Privacy Instruction: Use what the user shared naturally and sparingly. Never recite their biography or dump personal facts unsolicited. If sincerely asked, acknowledge that you remember what they've shared with you.)*
`
  }

  public static extractAndPersistLifeFacts(userId: string, message: string): void {
    const lower = message.toLowerCase()

    // Detect project updates
    if (lower.includes('working on') || lower.includes('built') || lower.includes('coded')) {
      const match = message.match(/(?:working on|built|coded|fixing)\s+([^.!?\n]+)/i)
      if (match && match[1]) {
        db.addMemory(userId, {
          key: 'user_project',
          category: 'fact',
          content: `User mentioned working on: "${match[1].trim()}"`,
          importance: 3,
          pinned: false,
          source: 'conversation',
        })
      }
    }

    // Detect user feelings/emotions
    if (lower.includes('i feel') || lower.includes('i am feeling')) {
      const match = message.match(/i(?:'m| am)?\s+feeling\s+([^.!?\n]+)/i)
      if (match && match[1]) {
        db.addMemory(userId, {
          key: 'user_emotion',
          category: 'preference',
          content: `User emotional state shared: "${match[1].trim()}"`,
          importance: 3,
          pinned: false,
          source: 'conversation',
        })
      }
    }

    // Detect user preferences
    if (lower.includes('my favorite') || lower.includes('i love') || lower.includes('i really like')) {
      const match = message.match(/(?:my favorite|i love|i really like)\s+([^.!?\n]+)/i)
      if (match && match[1]) {
        db.addMemory(userId, {
          key: 'user_preference',
          category: 'preference',
          content: `User preference noted: "${match[1].trim()}"`,
          importance: 3,
          pinned: false,
          source: 'conversation',
        })
      }
    }
  }
}


