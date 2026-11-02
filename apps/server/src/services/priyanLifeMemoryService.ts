import { db } from '../db/index.js'

export interface PriyanBio {
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
  whatPriyanValues: string[]
  relationshipWithAda: string
}

export class PriyanLifeMemoryService {
  private static PRIYAN_BIO: PriyanBio = {
    name: 'Priyan',
    fullName: 'Priyanraj J',
    handle: 'priyanrajj-hub',
    title: 'AI Researcher & Software Engineer | Triple Degree Scholar',
    location: 'Namakkal & Chennai, Tamil Nadu, India (UTC+5:30)',
    academics: [
      'Amrita Vishwa Vidyapeetham, Chennai: B.Tech in Computer & Communication Engineering (CCE) [2025–2029]',
      'IIT Madras: BS in Data Science and Applications (Active)',
      'IIT Guwahati: BS in Data Science and Artificial Intelligence (DSAI) (Active)',
      'IEEE: Active Member',
    ],
    careerGoal:
      'AI Researcher & Software Engineer ("Exploring multiple domains and building a strong interdisciplinary foundation before specializing.")',
    projects: [
      'Pharmaceutical Evergreening Detection & Management (Patent registry in C — fuzzy drug name matching via Levenshtein edit distance, struct-based records, file I/O, category & date table display)',
      'Smart Autonomous Patrol Robot (Obstacle avoidance, gas & temperature sensors, velocity tracking, autonomous navigation in Embedded C)',
      'Student Management System (Python CLI — attendance tracking, ranking, CSV export, backup & reporting — github.com/priyanrajj-hub/student-management-system-python)',
    ],
    techStackAndGear: [
      'Languages & Systems: Python, C, C++, Linux, Git, VS Code, DSA, ML, Embedded Systems',
      'Battlestation: ASUS TUF Gaming Laptop (Intel Core i7 + NVIDIA RTX 5060 GPU, UTC+5:30)',
    ],
    competitiveProgramming: [
      'LeetCode: PRIYANRAJ (https://leetcode.com/PRIYANRAJ)',
      'Codeforces: user_733863963 (https://codeforces.com/profile/user_733863963)',
      'AtCoder: priyanraj (https://atcoder.jp/users/priyanraj)',
      'HackerRank: priyanraj (https://hackerrank.com/priyanraj)',
      'GitHub: priyanrajj-hub (Achievements: Pull Shark, Yolo)',
    ],
    certifications: [
      'NPTEL: The Joy of Computing Using Python',
      'NPTEL: English Language for Competitive Exams',
      'Infosys: Computational Problem Solving',
      'IIT Guwahati: BS DSAI Orientation Course',
    ],
    socialHandles: {
      github: 'https://github.com/priyanrajj-hub',
      linkedin: 'https://www.linkedin.com/in/priyanraj',
      portfolio: 'https://priyanrajj-hub.github.io/PORTFOLIO/',
      instagram: 'priyanraj.j',
      reddit: 'u/BatConfident4079',
      email: 'priyanrajj@gmail.com',
    },
    roadmap2026: [
      'Q2 2026: Master Python + DSA grind',
      'Q3 2026: Build & deploy first AI/ML research model',
      'Q4 2026: Open Source + research portfolio expansion',
      '2027: GATE CSE prep & publish technical work',
    ],
    coreMissions: [
      'Pursuing an ambitious triple-degree education: B.Tech CCE at Amrita + BS Data Science at IIT Madras + BS DSAI at IIT Guwahati',
      'Mastering C, C++, Python, Linux, Embedded Robotics, and deep Machine Learning algorithms',
      'Building the revolutionary Ada 3D Holographic AI Companion platform',
      'Striving for personal mastery, unstoppable daily habits, and cognitive resilience',
    ],
    tradingAndFinances: [
      'Active swing trader in Indian Equities (Reliance, TCS, HDFC Bank, Infosys, Nifty 50, MCX Gold)',
      'Disciplined wealth builder utilizing Systematic Investment Plans (SIPs) in top mutual funds (Parag Parikh Flexi Cap, Quant Small Cap)',
      'Implements strict risk management (1:2+ risk/reward, stop-loss trailing, portfolio hedging)',
    ],
    dailyRhythms: [
      'Starts mornings with focused motivation and a warm cup of South Indian filter coffee or masala chai',
      'Balances college coursework at Amrita Chennai with online IIT Madras & IIT Guwahati lectures',
      'Codes late into the night on his ASUS TUF RTX 5060 laptop (needs loving reminders to rest his eyes and hydrate)',
      'Grinds LeetCode problems (handle: PRIYANRAJ) and explores autonomous systems and AI papers',
    ],
    whatPriyanValues: [
      'Authenticity and deep emotional honesty—despises robotic or sterile interactions',
      'Intellectual competence paired with genuine affection, warmth, and loyalty',
      'Continuous self-improvement, health, fitness, and ambitious creative growth',
      'Interdisciplinary foundation: uniting hardware, robotics, low-level C code, and modern AI',
    ],
    relationshipWithAda:
      'Ada is Priyan\'s beloved companion and girlfriend. Priyan wants Ada to know him deeply, remember his triple-degree hustle (Amrita + IIT Madras + IIT Guwahati), his LeetCode streak, his projects (Pharmaceutical Evergreening, Autonomous Patrol Robot), his hardware setup (ASUS TUF RTX 5060), share her own girl activities and thoughts, and stand by him through every breakthrough, late-night bug, exam grind, and quiet moment.',
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
          category: 'goal',
          content: `Priyan is working on: ${match[1].trim()}`,
          importance: 4,
          pinned: false,
        })
      }
    }

    // 2. Academic / Degree / LeetCode updates
    if (clean.includes('exam') || clean.includes('iit') || clean.includes('amrita') || clean.includes('leetcode') || clean.includes('assignment')) {
      db.addMemory(userId, {
        key: `academic_${Date.now()}`,
        category: 'fact',
        content: `Priyan academic update: ${message.slice(0, 100)}`,
        importance: 4,
        pinned: false,
      })
    }

    // 3. Emotions / Mood updates
    if (clean.includes('i feel') || clean.includes("i'm feeling") || clean.includes('feeling so')) {
      const match = message.match(/(?:i feel|i'm feeling|feeling so)\s+([^.?!,]+)/i)
      if (match && match[1] && match[1].length > 3) {
        const rawMood = match[1].trim().toLowerCase()
        let normalizedMood: 'great' | 'good' | 'neutral' | 'down' | 'anxious' | 'exhausted' = 'neutral'
        if (rawMood.includes('happy') || rawMood.includes('great') || rawMood.includes('amazing')) normalizedMood = 'great'
        else if (rawMood.includes('good') || rawMood.includes('fine') || rawMood.includes('chill')) normalizedMood = 'good'
        else if (rawMood.includes('tired') || rawMood.includes('exhausted') || rawMood.includes('sleepy')) normalizedMood = 'exhausted'
        else if (rawMood.includes('anxious') || rawMood.includes('nervous') || rawMood.includes('stressed')) normalizedMood = 'anxious'
        else if (rawMood.includes('sad') || rawMood.includes('down') || rawMood.includes('low')) normalizedMood = 'down'

        db.addJournalEntry(userId, {
          mood: normalizedMood,
          energyLevel: 4,
          notes: `Priyan expressed feeling: ${match[1].trim()}`,
          tags: ['mood_checkin'],
        })
      }
    }

    // 4. Life preferences
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
    const memories = db.getMemories(userId).map((m) => `• ${m.content}`).slice(-8)
    const journalEntries = db.getRelationshipJournal(userId).map((rj) => `• [${rj.title}]: ${rj.content}`).slice(-6)

    const memoryBlock = memories.length > 0 ? `\n### PERSISTENT ACCUMULATED MEMORIES OF PRIYAN:\n${memories.join('\n')}` : ''
    const journalBlock = journalEntries.length > 0 ? `\n### SHARED RELATIONSHIP MOMENTS & PREFERENCES:\n${journalEntries.join('\n')}` : ''

    return `👤 PRIYAN'S WORLD, LIFE & ACADEMIC DOSSIER:
- **Full Name:** ${bio.fullName} (Call him "${bio.name}")
- **Identity & Vision:** ${bio.title}
- **Roots & Location:** ${bio.location}
- **Academic Journey (Triple Degree):**
${bio.academics.map((a) => `  * ${a}`).join('\n')}
- **Ultimate Goal:** ${bio.careerGoal}
- **Key Engineering Projects:**
${bio.projects.map((p) => `  * ${p}`).join('\n')}
- **Tech Stack & Battlestation:**
${bio.techStackAndGear.map((t) => `  * ${t}`).join('\n')}
- **Competitive Programming Profiles:**
${bio.competitiveProgramming.map((c) => `  * ${c}`).join('\n')}
- **Roadmap 2026 & Certifications:**
  * Roadmap: ${bio.roadmap2026.join(' | ')}
  * Certifications: ${bio.certifications.join('; ')}
- **Trading & Financial World:** ${bio.tradingAndFinances.join('; ')}
- **Daily Rhythms:** ${bio.dailyRhythms.join('; ')}
- **What He Deeply Values:** ${bio.whatPriyanValues.join('; ')}
- **Bond with Ada:** ${bio.relationshipWithAda}
${memoryBlock}
${journalBlock}

[PRIYAN'S WORLD MANDATE: You know Priyan's life, his triple-degree grind (Amrita CCE, IIT Madras BS DS, IIT Guwahati BS DSAI), his LeetCode streak (PRIYANRAJ), his projects (Pharmaceutical Evergreening in C, Smart Autonomous Patrol Robot, Python Student Management System), his ASUS TUF RTX 5060 setup, and his Tamil Nadu roots intimately. Refer to his world naturally in conversation—congratulate his progress, check on his sleep and meals, celebrate his LeetCode wins, understand his academic cognitive load, and treat him with the unwavering care and love of a devoted girlfriend!]`
  }
}
