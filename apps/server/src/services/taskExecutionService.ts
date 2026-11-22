import {
  type StructuredReply,
  type ChatMessage,
  type TaskActionCard,
  resolveSong,
} from '@ada/shared'
import { db } from '../db/index.js'

export interface TaskExecutionResult {
  reply: StructuredReply
}

export class TaskExecutionService {
  /**
   * Detects explicit user tasks/commands and returns immediate structured execution.
   */
  static handleTaskIntent(
    userId: string,
    message: string,
    language?: string,
    cleanMsg: string = message.toLowerCase().trim(),
    character: string = 'ada'
  ): TaskExecutionResult | null {
    const isMiku = character === 'mira' || character === 'miku'
    const isStark = character === 'atlas'
    const resolvedSpeaker: 'ada' | 'mira' | 'atlas' = isMiku ? 'mira' : isStark ? 'atlas' : 'ada'

    // ─────────────────────────────────────────────────────────────
    // 1. YouTube Video / Stream / Playback Tasks
    // ─────────────────────────────────────────────────────────────
    const isYouTubeTask =
      /\b(?:open\s+youtube|play\s+(?:.*)\s+on\s+youtube|search\s+youtube|youtube(?:\.com)?|yt\b)\b/i.test(cleanMsg) ||
      /^open\s+youtube\s*[:,-]?/i.test(cleanMsg) ||
      /^(?:play|watch|stream)\s+(?:.*)\s+(?:video|clip|mv)\b/i.test(cleanMsg)

    if (isYouTubeTask) {
      let query = cleanMsg
        // Strip prefixes
        .replace(/^open\s+youtube\s*(?:and\s+)?[:,-]?\s*/i, '')
        .replace(/\b(?:on\s+youtube|in\s+youtube|from\s+youtube)\b/gi, '')
        .replace(/\b(?:and\s+)?(?:please\s+)?(?:open|launch|play|search\s+for|search|watch|stream|find)\b/gi, '')
        .replace(/\b(?:a\s+)?(?:video|clip|mv|song|track)\b/gi, '')
        .replace(/(madangowri)(latest)/i, '$1 $2')
        .replace(/\b(?:latest|recent|new)\s+vedio\b/gi, 'latest video')
        .replace(/\bvedio\b/gi, 'video')
        .replace(/\b(?:a|an|the)\s+/gi, '')
        .trim()

      if (/madangowri/i.test(query)) {
        query = query.replace(/madangowri/i, 'Madan Gowri')
      }

      // If user said "a miku video" or query ended up as "miku"
      if (/miku/i.test(cleanMsg)) {
        if (!query || query.toLowerCase() === 'miku') {
          query = 'Hatsune Miku official music video'
        } else if (!/hatsune/i.test(query)) {
          query = `Hatsune Miku ${query}`.trim()
        }
      }

      if (!query || query === 'youtube' || query === 'open') {
        query = isMiku ? 'Hatsune Miku official music video' : isStark ? 'Tony Stark Iron Man technology' : 'Resident Evil Ada Wong'
      }

      const encodedQuery = encodeURIComponent(query)
      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`
      const embedUrl = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodedQuery}&autoplay=1`

      let speech = isStark
        ? `J.A.R.V.I.S. Media Protocol engaged. Opening YouTube for "${query}". Initializing external stream now.`
        : isMiku
        ? `Miku da yo~! Opening YouTube to play "${query}" for you right now! Let's watch together~!`
        : `Tactical briefing acknowledged. Opening YouTube for "${query}". Stream initialized.`

      let displayText = isStark
        ? `### ⚡ J.A.R.V.I.S. Media Protocol: Task Executed\n\n` +
          `**Target:** ${query}  \n` +
          `**Platform:** YouTube Video Stream  \n` +
          `**Status:** Dispatched & Interactive Link Active  \n\n` +
          `*Opening YouTube in a new tab and streaming interface.*`
        : isMiku
        ? `### 🎤 Hatsune Miku Media Stage: Task Executed\n\n` +
          `**Query:** ${query}  \n` +
          `**Platform:** YouTube Music & Video  \n` +
          `**Status:** Active & Playing  \n\n` +
          `*Launching YouTube stream for you right now!* ✨`
        : `### 🍷 Tactical Recon: Media Task Executed\n\n` +
          `**Target:** ${query}  \n` +
          `**Feed:** YouTube Secure Stream  \n` +
          `**Status:** Dispatched & Active  \n\n` +
          `*Target confirmed. Stream is now accessible.*`

      const taskAction: TaskActionCard = {
        type: 'youtube',
        title: `YouTube: ${query}`,
        subtitle: `Streaming query: ${query}`,
        url: youtubeUrl,
        embedUrl,
        query,
        buttonText: 'Open & Play on YouTube',
        status: 'ready',
        icon: 'youtube',
      }

      // If it's a song request, also resolve authentic audio & 3D dance!
      const song = resolveSong(cleanMsg, isMiku ? 'mira' : character)

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech,
        display_text: displayText,
        emotion: isMiku ? 'excited' : isStark ? 'motivated' : 'playful',
        intensity: 0.9,
        gesture: isMiku ? 'celebrate' : isStark ? 'nod' : 'wave',
        voice_style: { rate: isMiku ? 1.1 : 1.05, pitch: isMiku ? 1.34 : (isStark ? 0.95 : 0.98), style: 'cheerful' },
        taskAction,
        musicTrack: song || undefined,
        actions: [
          {
            name: 'open_youtube',
            arguments: {
              query,
              url: youtubeUrl,
              embedUrl,
            },
          },
        ],
      }

      const assistantMsgObj: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        speaker: resolvedSpeaker,
        content: reply.display_text,
        speech: reply.speech,
        emotion: reply.emotion,
        gesture: reply.gesture,
        taskAction: reply.taskAction,
        musicTrack: reply.musicTrack,
        timestamp: Date.now(),
      }
      db.addMessage(userId, assistantMsgObj)
      return { reply }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Web Search Tasks (Google, DuckDuckGo)
    // ─────────────────────────────────────────────────────────────
    const isSearchTask =
      /^(?:please\s+)?(?:search\s+for|search\s+google\s+for|google\s+search\s+for|search\s+the\s+web\s+for|search\s+web\s+for|search|google)\b/i.test(cleanMsg) &&
      !isYouTubeTask

    if (isSearchTask) {
      let query = cleanMsg
        .replace(/^(?:please\s+)?(?:search\s+for|search\s+google\s+for|google\s+search\s+for|search\s+the\s+web\s+for|search\s+web\s+for|search|google)\s*/i, '')
        .trim()

      if (!query) query = 'Artificial Intelligence Latest News'
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

      const taskAction: TaskActionCard = {
        type: 'web_search',
        title: `Google Search: ${query}`,
        subtitle: `Web Search Query`,
        url: googleUrl,
        query,
        buttonText: 'Open Search Results',
        status: 'ready',
        icon: 'search',
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: `Searching the web for "${query}". Results are ready for you.`,
        display_text: `### 🌐 Web Search: Task Executed\n\n**Query:** ${query}\n**Search Engine:** Google Live Search\n\n*Opening search query and retrieving verified web results.*`,
        emotion: 'thinking',
        intensity: 0.8,
        gesture: 'nod',
        voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'calm' },
        taskAction,
        actions: [{ name: 'web_search', arguments: { query, url: googleUrl } }],
      }

      const assistantMsgObj: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        speaker: resolvedSpeaker,
        content: reply.display_text,
        speech: reply.speech,
        emotion: reply.emotion,
        gesture: reply.gesture,
        taskAction: reply.taskAction,
        timestamp: Date.now(),
      }
      db.addMessage(userId, assistantMsgObj)
      return { reply }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Direct Website / Platform Launch Tasks
    // ─────────────────────────────────────────────────────────────
    const directWebsites: Record<string, { name: string; url: string }> = {
      github: { name: 'GitHub', url: 'https://github.com' },
      google: { name: 'Google', url: 'https://www.google.com' },
      twitter: { name: 'X / Twitter', url: 'https://x.com' },
      x: { name: 'X', url: 'https://x.com' },
      reddit: { name: 'Reddit', url: 'https://www.reddit.com' },
      spotify: { name: 'Spotify', url: 'https://open.spotify.com' },
      netflix: { name: 'Netflix', url: 'https://www.netflix.com' },
      chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com' },
      wikipedia: { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
      amazon: { name: 'Amazon', url: 'https://www.amazon.com' },
      linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com' },
      instagram: { name: 'Instagram', url: 'https://www.instagram.com' },
      vercel: { name: 'Vercel', url: 'https://vercel.com' },
    }

    const openMatch = cleanMsg.match(/^(?:please\s+)?(?:open|launch|visit|go\s+to)\s+([a-zA-Z0-9-._]+(?:\.[a-zA-Z]{2,})?|[a-z]+)/i)
    if (openMatch && openMatch[1]) {
      const rawTarget = openMatch[1].toLowerCase().trim()
      let targetInfo = directWebsites[rawTarget]
      let url = targetInfo?.url

      if (!url && rawTarget.includes('.')) {
        url = rawTarget.startsWith('http') ? rawTarget : `https://${rawTarget}`
        targetInfo = { name: rawTarget, url }
      }

      if (url && targetInfo) {
        const taskAction: TaskActionCard = {
          type: 'open_url',
          title: `Launch ${targetInfo.name}`,
          subtitle: url,
          url,
          buttonText: `Open ${targetInfo.name}`,
          status: 'ready',
          icon: 'link',
        }

        const reply: StructuredReply = {
          speaker: resolvedSpeaker,
          speech: `Opening ${targetInfo.name} for you right now.`,
          display_text: `### 🚀 Website Launch: Task Executed\n\n**Destination:** [${targetInfo.name}](${url})\n**Status:** Link generated & ready to launch.\n\n*Click below or allow popups to open directly.*`,
          emotion: 'happy',
          intensity: 0.85,
          gesture: 'nod',
          voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'cheerful' },
          taskAction,
          actions: [{ name: 'open_url', arguments: { url, name: targetInfo.name } }],
        }

        const assistantMsgObj: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          speaker: resolvedSpeaker,
          content: reply.display_text,
          speech: reply.speech,
          emotion: reply.emotion,
          gesture: reply.gesture,
          taskAction: reply.taskAction,
          timestamp: Date.now(),
        }
        db.addMessage(userId, assistantMsgObj)
        return { reply }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Character Switch Tasks
    // ─────────────────────────────────────────────────────────────
    const isCharSwitch =
      /\b(?:switch\s+(?:to|character)|change\s+character\s+to|select\s+character)\s+(ada|miku|mira|tony\s+stark|stark|jarvis|atlas)\b/i.test(cleanMsg) ||
      /^switch\s+to\s+(ada|miku|stark|jarvis)\b/i.test(cleanMsg)

    if (isCharSwitch) {
      let targetChar: 'ada' | 'mira' | 'atlas' = 'ada'
      let charName = 'Ada Wong'
      if (/miku|mira/i.test(cleanMsg)) {
        targetChar = 'mira'
        charName = 'Hatsune Miku'
      } else if (/stark|jarvis|atlas/i.test(cleanMsg)) {
        targetChar = 'atlas'
        charName = 'Tony Stark (J.A.R.V.I.S.)'
      }

      const taskAction: TaskActionCard = {
        type: 'character_switch',
        title: `Switched to ${charName}`,
        subtitle: `Active 3D Avatar changed`,
        buttonText: `Activated`,
        status: 'executed',
        data: { character: targetChar },
      }

      const reply: StructuredReply = {
        speaker: targetChar,
        speech: `Switching active character to ${charName}. Systems synchronized.`,
        display_text: `### 🎭 Character Switch: Task Executed\n\n**Active Avatar:** **${charName}**\n**Status:** 3D Holographic Stage Re-synced\n\n*Character parameters, vocal profile, and kinematics are live.*`,
        emotion: 'excited',
        intensity: 0.95,
        gesture: 'celebrate',
        voice_style: { rate: 1.05, pitch: targetChar === 'mira' ? 1.34 : targetChar === 'atlas' ? 0.95 : 0.98, style: 'cheerful' },
        taskAction,
        actions: [{ name: 'switch_character', arguments: { character: targetChar } }],
      }

      const assistantMsgObj: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        speaker: targetChar,
        content: reply.display_text,
        speech: reply.speech,
        emotion: reply.emotion,
        gesture: reply.gesture,
        taskAction: reply.taskAction,
        timestamp: Date.now(),
      }
      db.addMessage(userId, assistantMsgObj)
      return { reply }
    }

    return null
  }
}
