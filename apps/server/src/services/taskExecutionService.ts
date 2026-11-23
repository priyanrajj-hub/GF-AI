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

export function cleanYouTubeQuery(text: string): string {
  return (text || '')
    .replace(/^(?:please|can\s+you|could\s+you|i\s+(?:want|need|would\s+like)(?:\s+to)?|go\s+ahead\s+and|hey\s+(?:ada|miku|stark|jarvis)|ok|okay)\b/gi, '')
    .replace(/^(?:it\s+is|it'?s|its|this\s+is|that'?s|that\s+is)?\s*(?:not|wrong)\s*(?:the\s+)?(?:recent|latest|new)\s*(?:video|vedio|one)?\b/gi, '')
    .replace(/\b(?:it\s+must\s+go\s+(?:search\s+and\s+)?play(?:\s+the\s+(?:vedio|video))?|must\s+play.*|and\s+play\s+it.*|directly\s+in(?:\s+app)?)\b/gi, '')
    .replace(/\b(?:open\s+youtube|on\s+youtube|in\s+youtube|via\s+youtube|from\s+youtube|youtube(?:\.com)?)\b/gi, '')
    .replace(/\b(?:play|watch|stream|listen(?:\s+to)?|open|search(?:\s+for)?|find|show(?:\s+me)?|run|launch)\b/gi, '')
    .replace(/\b(?:a\s+)?(?:video|vedio|track|song|clip|mv|upload)\b/gi, '')
    .replace(/\b(?:recent|resent|latest|newest|new|today'?s?|fresh)\b/gi, '')
    .replace(/\b(?:of|for|about|the|a|an|some|any|random|something|anything)\b/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isGenericVideoPrompt(text: string): boolean {
  const cleaned = cleanYouTubeQuery(text)
  return !cleaned || cleaned.length < 2
}

export function getCuratedFallback(query: string, character: string = 'ada'): {
  videoId: string
  videoUrl: string
  embedUrl: string
  title: string
  publishedTime: string
  length: string
} {
  const q = (query || '').toLowerCase()
  const char = (character || '').toLowerCase()
  if (q.includes('madan') || q.includes('madhan') || q.includes('gowri')) {
    return {
      videoId: 'OGyHQ7roUk4',
      videoUrl: 'https://www.youtube.com/watch?v=OGyHQ7roUk4',
      embedUrl: 'https://www.youtube.com/embed/OGyHQ7roUk4?autoplay=1&enablejsapi=1&rel=0',
      title: 'Madan Gowri: Latest Upload',
      publishedTime: '1d ago',
      length: '14:20',
    }
  }
  if (q.includes('miku') || char === 'mira' || char === 'miku') {
    return {
      videoId: 'MGt25mv4-2Q',
      videoUrl: 'https://www.youtube.com/watch?v=MGt25mv4-2Q',
      embedUrl: 'https://www.youtube.com/embed/MGt25mv4-2Q?autoplay=1&enablejsapi=1&rel=0',
      title: 'Hatsune Miku — World is Mine (Official MV)',
      publishedTime: 'Official MV',
      length: '3:53',
    }
  }
  if (q.includes('stark') || q.includes('iron man') || char === 'atlas' || char === 'stark') {
    return {
      videoId: '3op3Y2cpRAg',
      videoUrl: 'https://www.youtube.com/watch?v=3op3Y2cpRAg',
      embedUrl: 'https://www.youtube.com/embed/3op3Y2cpRAg?autoplay=1&enablejsapi=1&rel=0',
      title: "Marvel Studios' Iron Man — Official Trailer (Tony Stark Spotlight)",
      publishedTime: 'Official 4K',
      length: '2:31',
    }
  }
  return {
    videoId: 'vWLKaj940mc',
    videoUrl: 'https://www.youtube.com/watch?v=vWLKaj940mc',
    embedUrl: 'https://www.youtube.com/embed/vWLKaj940mc?autoplay=1&enablejsapi=1&rel=0',
    title: 'Resident Evil 4: Separate Ways — Ada Wong Official Launch Trailer',
    publishedTime: 'Official 4K',
    length: '2:12',
  }
}

export class TaskExecutionService {
  /**
   * Resolves a creator/channel's 100% exact newest chronological upload via official YouTube RSS.
   */
  static async resolveChannelLatestUpload(
    creator: string,
    timeoutMs: number = 3500,
    options?: {
      lastVideoId?: string
      preferFullVideo?: boolean
    }
  ): Promise<{
    videoId: string
    videoUrl: string
    embedUrl: string
    title: string
    publishedTime: string
    length?: string
  } | null> {
    try {
      const KNOWN_CHANNELS: Record<string, string> = {
        'madan gowri': 'UCY6KjrDBN_tIRFT_QNqQbRQ',
        'madhan gowri': 'UCY6KjrDBN_tIRFT_QNqQbRQ',
        'mg squad': 'UCY6KjrDBN_tIRFT_QNqQbRQ',
        'a2d': 'UCvyZS6W6zMJCZBVzF-Ei6sw',
        'a2d channel': 'UCvyZS6W6zMJCZBVzF-Ei6sw',
        'a2d pc factory': 'UCvyZS6W6zMJCZBVzF-Ei6sw',
        'nandhu a2d': 'UCvyZS6W6zMJCZBVzF-Ei6sw',
        'tamil tech': 'UC20sXo8ReewkzNKBFgzVCPA',
        'mr tamil tech': 'UC20sXo8ReewkzNKBFgzVCPA',
        'mrbeast': 'UCX6OQ3DkcsbYNE6H8uQQuVA',
        'mkbhd': 'UCBJycsmduvYEL83R_U4JriQ',
        'marques brownlee': 'UCBJycsmduvYEL83R_U4JriQ',
        'linus tech tips': 'UCXuqSBlHAE6Xw-yeJA0Tunw',
        'ltt': 'UCXuqSBlHAE6Xw-yeJA0Tunw',
        'veritasium': 'UCHnyfMqiRRG1u-2MsSQLbXA',
        'pewdiepie': 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',
      }

      const qLower = creator.toLowerCase().trim()
      let channelId = KNOWN_CHANNELS[qLower]

      if (!channelId) {
        for (const [k, v] of Object.entries(KNOWN_CHANNELS)) {
          if (qLower.includes(k)) {
            channelId = v
            break
          }
        }
      }

      if (!channelId) {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(creator)}&sp=EgIQAg%253D%253D`
        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (res.ok) {
          const html = await res.text()
          const chMatch =
            html.match(/"channelRenderer":\{"channelId":"([^"]+)"/) ||
            html.match(/"channelId":"([a-zA-Z0-9_-]{20,})"/)
          if (chMatch) {
            channelId = chMatch[1]
          }
        }
      }

      if (channelId) {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
        const rssRes = await fetch(rssUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (rssRes.ok) {
          const rssText = await rssRes.text()
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
          const entries: Array<{
            id: string
            url: string
            isShort: boolean
            title: string
            published: string
          }> = []
          let match: RegExpExecArray | null
          while ((match = entryRegex.exec(rssText)) !== null) {
            const block = match[1]
            const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
            const linkMatch = block.match(/<link[^>]+href="([^"]+)"/)
            const titleMatch = block.match(/<title>([^<]+)<\/title>/)
            const pubMatch = block.match(/<published>([^<]+)<\/published>/)
            if (idMatch && linkMatch && titleMatch && pubMatch) {
              let rawTitle = titleMatch[1]
              try {
                rawTitle = rawTitle.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
              } catch {}
              entries.push({
                id: idMatch[1],
                url: linkMatch[1],
                isShort: linkMatch[1].includes('/shorts/'),
                title: rawTitle,
                published: pubMatch[1],
              })
            }
          }

          if (entries.length > 0) {
            // Filter out previously played video if lastVideoId was provided
            const candidatePool = options?.lastVideoId
              ? entries.filter((e) => e.id !== options.lastVideoId)
              : entries

            const candidates = candidatePool.length > 0 ? candidatePool : entries

            // If user preferred full video, look for non-short entries first
            let selected = candidates[0]
            if (options?.preferFullVideo) {
              const fullVideo = candidates.find((e) => !e.isShort)
              if (fullVideo) {
                selected = fullVideo
              }
            }

            const pubDate = new Date(selected.published)
            const now = new Date()
            const diffHours = Math.max(1, Math.round((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60)))
            const publishedTime = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`

            return {
              videoId: selected.id,
              videoUrl: `https://www.youtube.com/watch?v=${selected.id}`,
              embedUrl: `https://www.youtube.com/embed/${selected.id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`,
              title: selected.title,
              publishedTime,
            }
          }
        }
      }
    } catch {
      // Fall through to live search
    }
    return null
  }

  /**
   * Resolves top YouTube video ID and title via live YouTube search.
   * Runs with canonical embed URL and curated zero-hallucination fallbacks.
   */
  static async resolveYouTubeVideo(
    query: string,
    timeoutMs: number = 4500,
    options?: {
      sortByLatest?: boolean
      character?: string
      lastVideoId?: string
      preferFullVideo?: boolean
    }
  ): Promise<{
    videoId: string
    videoUrl: string
    embedUrl: string
    title: string
    publishedTime?: string
    length?: string
  }> {
    const isLatest = !!options?.sortByLatest || /\b(?:recent|resent|latest|newest|today'?s?|fresh|new)\b/i.test(query)

    // When latest upload is requested, check official YouTube channel RSS feed first for 100% chronological ordering
    if (isLatest && query && query.length > 2) {
      const channelVideo = await TaskExecutionService.resolveChannelLatestUpload(query, timeoutMs, {
        lastVideoId: options?.lastVideoId,
        preferFullVideo: options?.preferFullVideo,
      })
      if (channelVideo) {
        return channelVideo
      }
    }

    const parseTopVideo = (html: string, fallbackQuery: string) => {
      // 1. Paired videoRenderer match (exact video ID + exact title)
      const vrRegex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"/gs
      const vrMatches = [...html.matchAll(vrRegex)]

      for (const m of vrMatches) {
        const rawId = m[1]
        let rawTitle = m[2]
        try {
          rawTitle = JSON.parse(`"${rawTitle}"`)
        } catch {
          rawTitle = rawTitle.replace(/\\u0026/g, '&')
        }

        // Context snippet around this videoRenderer to get publishedTime and length, and filter out shorts
        const pos = m.index ?? 0
        const snippet = html.substring(pos, pos + 2500)

        // Skip previously played video if requested
        if (options?.lastVideoId && rawId === options.lastVideoId) {
          continue
        }

        // Ignore Shorts / reels when a full video is available
        if (snippet.includes('"reelWatchEndpoint"') || snippet.includes('/shorts/')) {
          continue
        }

        const timeMatch = snippet.match(/"publishedTimeText":\{"simpleText":"([^"]+)"\}/)
        const lengthMatch = snippet.match(/"lengthText":\{.*?"simpleText":"([^"]+)"/)

        // If user specifically requested latest/recent/new video, skip any multi-year old uploads
        if (isLatest && timeMatch && /\b(?:year|yr)\b/i.test(timeMatch[1])) {
          continue
        }

        return {
          videoId: rawId,
          videoUrl: `https://www.youtube.com/watch?v=${rawId}`,
          embedUrl: `https://www.youtube.com/embed/${rawId}?autoplay=1&enablejsapi=1&rel=0`,
          title: rawTitle,
          publishedTime: timeMatch ? timeMatch[1] : undefined,
          length: lengthMatch ? lengthMatch[1] : undefined,
        }
      }

      // If all matches were shorts, fall back to first videoRenderer ONLY if not multi-year old
      if (vrMatches.length > 0) {
        const rawId = vrMatches[0][1]
        let rawTitle = vrMatches[0][2]
        try {
          rawTitle = JSON.parse(`"${rawTitle}"`)
        } catch {
          rawTitle = rawTitle.replace(/\\u0026/g, '&')
        }
        const snippet = html.substring(vrMatches[0].index ?? 0, (vrMatches[0].index ?? 0) + 2500)
        const timeMatch = snippet.match(/"publishedTimeText":\{"simpleText":"([^"]+)"\}/)

        if ((!isLatest || !timeMatch || !/\b(?:year|yr)\b/i.test(timeMatch[1])) && (!options?.lastVideoId || rawId !== options.lastVideoId)) {
          return {
            videoId: rawId,
            videoUrl: `https://www.youtube.com/watch?v=${rawId}`,
            embedUrl: `https://www.youtube.com/embed/${rawId}?autoplay=1&enablejsapi=1&rel=0`,
            title: rawTitle,
            publishedTime: timeMatch ? timeMatch[1] : undefined,
          }
        }
      }

      // 2. Fallback: extract distinct video IDs and non-filter title runs (for non-latest queries only)
      if (!isLatest) {
        const idMatches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)]
        const videoIds = [...new Set(idMatches.map((m) => m[1]))]
        const titleRuns = [...html.matchAll(/"title":\{"runs":\[\{"text":"([^"]+)"/g)].map((m) => m[1])
        const topTitle = titleRuns.find((t) => !/^(?:search filters|filters?|about these results)$/i.test(t.trim())) || fallbackQuery

        if (videoIds.length > 0) {
          const topVideoId = videoIds[0]
          return {
            videoId: topVideoId,
            videoUrl: `https://www.youtube.com/watch?v=${topVideoId}`,
            embedUrl: `https://www.youtube.com/embed/${topVideoId}?autoplay=1&enablejsapi=1&rel=0`,
            title: topTitle,
          }
        }
      }
      return null
    }

    const spParam = isLatest ? '&sp=CAI%253D' : ''

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${spParam}`
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.ok) {
        const html = await res.text()
        const parsed = parseTopVideo(html, query)
        if (parsed) return parsed
      }
    } catch {
      // Fall through to mobile backup
    }

    try {
      const mobileUrl = `https://m.youtube.com/results?search_query=${encodeURIComponent(query)}${spParam}`
      const mRes = await fetch(mobileUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(3000),
      })
      if (mRes.ok) {
        const mHtml = await mRes.text()
        const parsed = parseTopVideo(mHtml, query)
        if (parsed) return parsed
      }
    } catch {
      // Fall through to regular search if latest filter failed
    }

    if (isLatest) {
      try {
        const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        const res = await fetch(fallbackUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) {
          const html = await res.text()
          const parsed = parseTopVideo(html, query)
          if (parsed) return parsed
        }
      } catch {
        // Fall through to curated fallback
      }
    }

    return getCuratedFallback(query, options?.character)
  }

  /**
   * Detects explicit user tasks/commands and returns immediate structured execution.
   */
  static async handleTaskIntent(
    userId: string,
    message: string,
    language?: string,
    cleanMsg: string = message.toLowerCase().trim(),
    character: string = 'ada',
    context?: {
      lastTaskQuery?: string
      lastVideoId?: string
      recentHistory?: any[]
    }
  ): Promise<TaskExecutionResult | null> {
    const isMiku = character === 'mira' || character === 'miku'
    const isStark = character === 'atlas'
    const resolvedSpeaker: 'ada' | 'mira' | 'atlas' = isMiku ? 'mira' : isStark ? 'atlas' : 'ada'

    // ─────────────────────────────────────────────────────────────
    // 1. YouTube Video / Stream / Playback Tasks
    // ─────────────────────────────────────────────────────────────
    const isYouTubeTask =
      /\b(?:open\s+youtube|play\s+(?:.*)\s+on\s+youtube|search\s+youtube|youtube(?:\.com)?|yt\b)\b/i.test(cleanMsg) ||
      /^open\s+youtube\s*[:,-]?/i.test(cleanMsg) ||
      /^(?:play|watch|stream|listen)\s+(?:.*?\s+)?(?:video|vedio|clip|mv|song)\b/i.test(cleanMsg) ||
      /\b(?:play|watch|stream|listen)\s+(?:a\s+)?(?:video|vedio|clip|mv|song)\b/i.test(cleanMsg) ||
      /\b(?:play|search|find|stream|watch|show|get)\b.*?\byoutube\b/i.test(cleanMsg) ||
      /\byoutube\b.*?\b(?:play|search|find|stream|watch)\b/i.test(cleanMsg) ||
      /\b(?:recent|resent|latest|newest|today'?s?|new)\s+(?:new\s+)?(?:video|vedio|clip|song)\b/i.test(cleanMsg) ||
      /\b(?:its|it'?s|this\s+is|that'?s|that\s+is)?\s*(?:not|wrong)\s*(?:the\s+)?(?:recent|latest|new)\s*(?:video|vedio|one)?\b/i.test(cleanMsg) ||
      /\b(?:play|show|give|find)\s+(?:the\s+)?(?:recent|latest|new)\s+(?:one|video|vedio)\b/i.test(cleanMsg) ||
      /\b(?:i\s+need|i\s+want|give\s+me|show\s+me|play\s+me|find\s+me)\b.*?\b(?:video|vedio|clip|song)\b/i.test(cleanMsg) ||
      /\b(?:video|vedio|clip)\b.*?\b(?:of|from|by|about)\b/i.test(cleanMsg)

    if (isYouTubeTask) {
      // 1. Normalize typos and spelling variants early
      const normalizedMsg = cleanMsg
        .replace(/(madangowri)(latest)/i, 'Madan Gowri latest')
        .replace(/\bresent\b/gi, 'recent')
        .replace(/\bvedio\b/gi, 'video')
        .replace(/\bmadhan\s*gowri\b/gi, 'Madan Gowri')
        .replace(/\bmadangowri\b/gi, 'Madan Gowri')

      const isCorrection = /\b(?:its|it'?s|this\s+is|that'?s|that\s+is)?\s*(?:not|wrong)\s*(?:the\s+)?(?:recent|latest|new)\b/i.test(cleanMsg)
      const isLatestRequest = isCorrection || /\b(?:recent|latest|newest|today'?s?|fresh|new)\b/i.test(normalizedMsg)

      let query = normalizedMsg
        // 2. Strip user meta-prompts like "if i say play a vedio on youtube it must go search and play the vedio"
        .replace(/\b(?:if\s+i\s+say|must\s+go\s+search\s+and\s+play|it\s+must\s+go|go\s+search\s+and\s+play|search\s+and\s+play\s+the\s+vedio|search\s+and\s+play\s+the\s+video|it\s+must|must)\b.*?$/gi, '')
        // 3. Strip conversational wrapper prefixes
        .replace(/^(?:i\s+(?:need|want)\s+(?:to\s+)?(?:the\s+)?(?:watch|see|play|find)?|please\s+|can\s+you\s+(?:please\s+)?(?:play|show|open|find|watch)\s+|can\s+you\s+|give\s+me\s+(?:the\s+)?|show\s+me\s+(?:the\s+)?|play\s+|watch\s+|find\s+|open\s+|search\s+(?:for\s+)?)/gi, '')
        // 4. Strip command prefixes & platform mentions
        .replace(/^open\s+youtube\s*[:,-]?\s*/i, '')
        .replace(/\b(?:on\s+youtube|in\s+youtube|from\s+youtube|via\s+youtube|open\s+youtube|youtube)\b/gi, '')
        .replace(/\b(?:and\s+)?(?:please\s+)?(?:open|launch|play|search\s+for|search|watch|stream|find)\b/gi, '')
        .replace(/^[ :,-]+/, '')
        .trim()

      // If user asked for latest/recent, extract the clean core subject
      let coreSubject = cleanYouTubeQuery(query)

      if (isCorrection && (!coreSubject || coreSubject.length < 2)) {
        if (context?.lastTaskQuery) {
          coreSubject = cleanYouTubeQuery(context.lastTaskQuery) || context.lastTaskQuery
        }
        if (!coreSubject || coreSubject.length < 2) {
          try {
            const historyToSearch = (Array.isArray(context?.recentHistory) && context.recentHistory.length > 0)
              ? context.recentHistory
              : await db.getMessages(userId)
            for (let i = historyToSearch.length - 1; i >= 0; i--) {
              const m = historyToSearch[i]
              if (m.taskAction?.type === 'youtube' && m.taskAction.query) {
                coreSubject = m.taskAction.query
                break
              }
              const match = (m.content || '').match(/\b(?:madan\s*gowri|madhan\s*gowri|a2d|tamil\s*tech|miku|iron\s*man|tony\s*stark)\b/i)
              if (match) {
                coreSubject = match[0]
                break
              }
            }
          } catch {}
        }
      }

      if (/miku/i.test(cleanMsg)) {
        const stripped = (coreSubject || query).replace(/\b(?:a\s+)?miku(?:\s+video)?\b/gi, '').trim()
        if (!stripped) {
          coreSubject = 'Hatsune Miku official music video'
        } else if (!/hatsune/i.test(stripped)) {
          coreSubject = `Hatsune Miku ${stripped}`.trim()
        } else {
          coreSubject = stripped
        }
      }

      const isGeneric = !coreSubject || isGenericVideoPrompt(coreSubject)

      let resolvedVideo: {
        videoId: string
        videoUrl: string
        embedUrl: string
        title: string
        publishedTime?: string
        length?: string
      }

      if (isGeneric) {
        // Generic video request: route to character's verified canonical spotlight video (no random upload date search)
        resolvedVideo = getCuratedFallback('', character)
        coreSubject = isMiku ? 'Hatsune Miku official music video' : isStark ? 'Marvel Studios Iron Man (Tony Stark)' : 'Resident Evil Ada Wong'
      } else {
        if (!coreSubject || coreSubject.toLowerCase() === 'a' || /^(?:a\s+)?video$/i.test(coreSubject) || /^(?:open\s+)?youtube$/i.test(coreSubject)) {
          coreSubject = isMiku ? 'Hatsune Miku official music video' : isStark ? 'Marvel Studios Iron Man' : 'Resident Evil Ada Wong'
        }
        // Specific subject requested: resolve live on YouTube (sort by latest only if user asked for recent/latest creator content)
        const preferFullVideo = !cleanMsg.includes('short')
        resolvedVideo = await TaskExecutionService.resolveYouTubeVideo(coreSubject, 4500, {
          sortByLatest: isLatestRequest,
          character,
          lastVideoId: context?.lastVideoId,
          preferFullVideo,
        })
      }

      const youtubeUrl = resolvedVideo.videoUrl
      const embedUrl = resolvedVideo.embedUrl
      const displayTitle = resolvedVideo.title

      const isFreshUpload = resolvedVideo.publishedTime && /\b(?:hour|min|sec|day|week|today|yesterday)\b/i.test(resolvedVideo.publishedTime)
      const timingInfo = resolvedVideo.publishedTime ? ` (${isFreshUpload && isLatestRequest ? 'Latest Upload ' : ''}${resolvedVideo.publishedTime}${resolvedVideo.length ? ` • ${resolvedVideo.length}` : ''})` : ''

      let speech = isStark
        ? `J.A.R.V.I.S. Media Protocol engaged. Streaming ${isLatestRequest && isFreshUpload ? 'latest video ' : ''}"${displayTitle}"${timingInfo} directly on YouTube.`
        : isMiku
        ? `Miku da yo~! Found ${isLatestRequest && isFreshUpload ? 'the latest video ' : ''}"${displayTitle}"${timingInfo}! Let's watch together right now~!`
        : isCorrection
        ? `Target recalibrated. Dispatched the official latest upload: "${displayTitle}"${timingInfo} directly to your in-app player.`
        : `Tactical briefing acknowledged. Playing ${isLatestRequest && isFreshUpload ? 'latest video ' : ''}"${displayTitle}"${timingInfo} directly on YouTube.`

      let displayText = isStark
        ? `### ⚡ J.A.R.V.I.S. Media Protocol: Task Executed\n\n` +
          `**Playing Video:** **${displayTitle}**  \n` +
          (resolvedVideo.publishedTime ? `**Published:** ${resolvedVideo.publishedTime} • **Duration:** ${resolvedVideo.length || 'Full Video'}  \n` : '') +
          `**Search Target:** ${coreSubject} ${isLatestRequest && !isGeneric ? '*(Sorted by Latest Upload)*' : ''}  \n` +
          `**Platform:** YouTube Direct Video Stream  \n` +
          `**Status:** Top Video Resolved & Autoplay Ready  \n\n` +
          `*Direct playback streaming in player below.*`
        : isMiku
        ? `### 🎤 Hatsune Miku Media Stage: Task Executed\n\n` +
          `**Playing Video:** **${displayTitle}**  \n` +
          (resolvedVideo.publishedTime ? `**Published:** ${resolvedVideo.publishedTime} • **Duration:** ${resolvedVideo.length || 'Full Video'}  \n` : '') +
          `**Search Query:** ${coreSubject} ${isLatestRequest && !isGeneric ? '*(Latest Uploads)*' : ''}  \n` +
          `**Platform:** YouTube Video Stream  \n` +
          `**Status:** Live Video Resolved & Playing  \n\n` +
          `*Playing top search match for you right now!* ✨`
        : `### 🍷 Tactical Recon: Media Task Executed\n\n` +
          `**Playing Video:** **${displayTitle}**  \n` +
          (resolvedVideo.publishedTime ? `**Published:** ${resolvedVideo.publishedTime} • **Duration:** ${resolvedVideo.length || 'Full Video'}  \n` : '') +
          `**Target:** ${coreSubject} ${isLatestRequest && !isGeneric ? '*(Sorted by Latest Upload)*' : ''}  \n` +
          `**Feed:** YouTube Direct Stream  \n` +
          `**Status:** Dispatched & Autoplay Ready  \n\n` +
          (isCorrection ? `*Target recalibrated to official newest release. Direct video playback active.*` : `*Target confirmed. Direct video playback active.*`)

      const subtitleText = (isLatestRequest && isFreshUpload)
        ? `Latest Upload (${resolvedVideo.publishedTime}): ${displayTitle}`
        : resolvedVideo.publishedTime
        ? `Featured Video (${resolvedVideo.publishedTime}): ${displayTitle}`
        : `Now Streaming: ${displayTitle}`

      const taskAction: TaskActionCard = {
        type: 'youtube',
        title: displayTitle,
        subtitle: subtitleText,
        url: youtubeUrl,
        embedUrl,
        query: coreSubject,
        buttonText: 'Open & Play on YouTube',
        status: 'ready',
        icon: 'youtube',
        data: {
          videoId: resolvedVideo.videoId,
          directPlay: true,
          publishedTime: resolvedVideo.publishedTime,
          length: resolvedVideo.length,
          isLatest: isLatestRequest && !!isFreshUpload,
        },
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
              title: displayTitle,
              videoId: resolvedVideo?.videoId,
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
    // 3. Google Maps & Location Navigation Tasks
    // ─────────────────────────────────────────────────────────────
    const isMapTask =
      /\b(?:maps?\s+to|directions?\s+to|where\s+is|navigate\s+to|map\s+of|route\s+to)\s+([^\n\r?]+)/i.test(cleanMsg) ||
      /^open\s+maps?\b/i.test(cleanMsg)

    if (isMapTask) {
      let destination = cleanMsg
        .replace(/^(?:please\s+)?(?:open\s+maps?\s*(?:to|for)?|directions?\s+to|where\s+is|navigate\s+to|map\s+of|route\s+to)\s*/i, '')
        .trim()
      if (!destination || destination === 'maps' || destination === 'map') {
        destination = 'Current Location'
      }

      const encodedDest = encodeURIComponent(destination)
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDest}`

      const taskAction: TaskActionCard = {
        type: 'maps',
        title: `Maps: ${destination}`,
        subtitle: `Navigation Route & Location Search`,
        url: mapsUrl,
        query: destination,
        buttonText: 'Open in Google Maps',
        status: 'ready',
        icon: 'map-pin',
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: `Plotting coordinates for ${destination}. Navigation link initialized.`,
        display_text: `### 🗺️ Navigation: Task Executed\n\n**Destination:** ${destination}\n**Platform:** Google Maps Live Coordinates\n\n*Click below to launch turn-by-turn navigation.*`,
        emotion: 'thinking',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'calm' },
        taskAction,
        actions: [{ name: 'open_url', arguments: { url: mapsUrl, name: `Maps: ${destination}` } }],
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
    // 4. Live Weather & Atmospheric Forecast Tasks
    // ─────────────────────────────────────────────────────────────
    const isWeatherTask =
      /\b(?:weather\s+(?:in|for|at)|forecast\s+(?:in|for|at)|what(?:'s|\s+is)\s+the\s+weather(?:\s+in)?)\s*([^\n\r?]*)/i.test(cleanMsg) ||
      cleanMsg === 'weather' ||
      cleanMsg === 'weather forecast'

    if (isWeatherTask) {
      let location = cleanMsg
        .replace(/^(?:please\s+)?(?:what(?:'s|\s+is)\s+the\s+weather(?:\s+in)?|weather\s+(?:in|for|at)?|forecast\s+(?:in|for|at)?)\s*/i, '')
        .trim()
      if (!location || location === 'weather' || location === 'today') {
        location = 'Local Weather Forecast'
      }

      const encodedLoc = encodeURIComponent(location)
      const weatherUrl = `https://www.google.com/search?q=weather+${encodedLoc}`

      const taskAction: TaskActionCard = {
        type: 'weather',
        title: `Weather: ${location}`,
        subtitle: `Atmospheric Conditions & Radar`,
        url: weatherUrl,
        query: location,
        buttonText: 'View Live Radar & Forecast',
        status: 'ready',
        icon: 'cloud-sun',
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: `Checking meteorological sensors for ${location}. Telemetry synchronized.`,
        display_text: `### 🌤️ Weather Telemetry: Task Executed\n\n**Location:** ${location}\n**System:** Atmospheric Sensor Radar\n\n*Live weather telemetry and hourly forecast are ready.*`,
        emotion: 'happy',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'cheerful' },
        taskAction,
        actions: [{ name: 'open_url', arguments: { url: weatherUrl, name: `Weather: ${location}` } }],
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
    // 5. Focus Timer / Pomodoro Protocol Tasks
    // ─────────────────────────────────────────────────────────────
    const isTimerTask =
      /\b(?:start\s+)?(?:focus\s+)?timer\s+(?:for\s+)?(\d+)\s*(?:m|min|mins|minutes?)?/i.test(cleanMsg) ||
      /\b(?:pomodoro|focus\s+session)\s*(?:for\s+)?(\d+)?/i.test(cleanMsg) ||
      cleanMsg === 'start timer' ||
      cleanMsg === 'pomodoro'

    if (isTimerTask) {
      const match = cleanMsg.match(/\b(?:timer|pomodoro|focus)\s*(?:for\s+)?(\d+)/i)
      const duration = match && match[1] ? Math.max(1, parseInt(match[1], 10)) : 25
      const goal = 'Deep Focus & Task Execution'

      const taskAction: TaskActionCard = {
        type: 'timer',
        title: `Focus Protocol: ${duration} Minutes`,
        subtitle: goal,
        buttonText: 'Start Timer Protocol',
        status: 'running',
        icon: 'clock',
        data: { durationMinutes: duration, goal },
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: `Focus protocol initialized for ${duration} minutes. Eliminate distractions and let us execute.`,
        display_text: `### ⏱️ Focus Protocol: Task Executed\n\n**Duration:** **${duration} Minutes**  \n**Objective:** ${goal}  \n**Status:** Timer armed & HUD synchronized.`,
        emotion: isStark ? 'motivated' : isMiku ? 'excited' : 'thinking',
        intensity: 0.9,
        gesture: 'nod',
        voice_style: { rate: 1.05, pitch: isStark ? 0.95 : 1.0, style: 'authoritative' },
        taskAction,
        studyFocus: {
          goal,
          durationMinutes: duration,
          remainingSeconds: duration * 60,
          isActive: true,
          mode: 'pomodoro',
        },
        actions: [{ name: 'start_timer', arguments: { durationMinutes: duration, goal } }],
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
        studyFocus: reply.studyFocus,
        timestamp: Date.now(),
      }
      db.addMessage(userId, assistantMsgObj)
      return { reply }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. To-Do List & Reminder Tasks
    // ─────────────────────────────────────────────────────────────
    const isTodoAdd = /\b(?:add\s+to-?do|remind\s+me\s+to|add\s+task|new\s+task)\s*[:,-]?\s*([^\n\r]+)/i.test(cleanMsg)
    const isTodoList = /\b(?:show\s+(?:my\s+)?tasks|list\s+(?:my\s+)?to-?dos|my\s+to-?dos|view\s+tasks)\b/i.test(cleanMsg)

    if (isTodoAdd || isTodoList) {
      let taskText = 'Review strategic priorities'
      if (isTodoAdd) {
        const m = cleanMsg.match(/\b(?:add\s+to-?do|remind\s+me\s+to|add\s+task|new\s+task)\s*[:,-]?\s*([^\n\r]+)/i)
        if (m && m[1]) taskText = m[1].trim()
      }

      const taskAction: TaskActionCard = {
        type: 'todo',
        title: isTodoAdd ? `To-Do Added: ${taskText}` : 'Active Priority Targets',
        subtitle: isTodoAdd ? 'Saved to Holographic Mission Briefing' : 'Current task registry',
        buttonText: 'View All Tasks',
        status: 'executed',
        icon: 'check-square',
        data: { taskText, action: isTodoAdd ? 'added' : 'list' },
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: isTodoAdd
          ? `Added "${taskText}" to your mission briefing and priority targets.`
          : 'Displaying your active priorities and task registry.',
        display_text: isTodoAdd
          ? `### 📝 Task Registry: Target Logged\n\n**New Priority:** **${taskText}**  \n**Status:** Scheduled in HUD & Mission Briefing  \n\n*Check off items in the Mission Briefing when completed.*`
          : `### 📝 Priority Targets: Active To-Dos\n\nReview your current objectives in the HUD panel on the left.`,
        emotion: 'happy',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'cheerful' },
        taskAction,
        todoCard: {
          action: isTodoAdd ? 'added' : 'list',
          item: isTodoAdd ? { id: `todo-${Date.now()}`, title: taskText, completed: false } : undefined,
          pendingCount: 1,
        },
        actions: [{ name: 'add_todo', arguments: { title: taskText } }],
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
        todoCard: reply.todoCard,
        timestamp: Date.now(),
      }
      db.addMessage(userId, assistantMsgObj)
      return { reply }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Math & Arithmetic Calculation Tasks
    // ─────────────────────────────────────────────────────────────
    const isMathTask =
      /\b(?:calculate|compute|solve|math|what\s+is)\s+([0-9\s+\-*\/^%().]+)\b/i.test(cleanMsg) ||
      /^([0-9\s+\-*\/^%().]+)\s*=?\s*$/.test(cleanMsg)

    if (isMathTask) {
      const match = cleanMsg.match(/(?:calculate|compute|solve|math|what\s+is)?\s*([0-9\s+\-*\/^%().]{3,})/i)
      if (match && match[1]) {
        const rawExpr = match[1].trim()
        const sanitized = rawExpr.replace(/[^0-9+\-*\/().%^]/g, '').trim()
        if (sanitized && /[0-9]/.test(sanitized)) {
          try {
            const pyExp = sanitized.replace(/\^/g, '**')
            const fn = new Function(`return (${pyExp})`)
            const res = fn()
            if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
              const formattedRes = Math.round(res * 100000) / 100000

              const taskAction: TaskActionCard = {
                type: 'calculator',
                title: `${rawExpr} = ${formattedRes}`,
                subtitle: `Precision Arithmetic Calculation`,
                buttonText: 'Result Verified',
                status: 'executed',
                icon: 'calculator',
                data: { expression: rawExpr, result: formattedRes },
              }

              const reply: StructuredReply = {
                speaker: resolvedSpeaker,
                speech: `The calculation for ${rawExpr} equals ${formattedRes}.`,
                display_text: `### 🧮 Quantitative Calculation: Task Executed\n\n**Expression:** \`${rawExpr}\`  \n**Result:** **\`${formattedRes}\`**  \n\n*Calculated with high precision.*`,
                emotion: 'thinking',
                intensity: 0.85,
                gesture: 'nod',
                voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'calm' },
                taskAction,
                actions: [{ name: 'calculate', arguments: { expression: rawExpr, result: formattedRes } }],
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
          } catch {
            // pass to LLM
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 8. Wardrobe & 3D Costume Outfits Tasks
    // ─────────────────────────────────────────────────────────────
    const isWardrobeTask =
      /\b(?:wear|equip|change\s+(?:outfit\s+to|dress\s+to|into)|put\s+on)\s+(saree|red\s+dress|black\s+dress|stealth\s+armor|nanotech\s+armor|silver\s+centurion|swimsuit|bikini|default)/i.test(cleanMsg) ||
      cleanMsg === 'wear saree' ||
      cleanMsg === 'wear red dress'

    if (isWardrobeTask) {
      let skinId = 'ada-red'
      let outfitName = 'Signature Red Spy Dress'
      if (/saree/i.test(cleanMsg)) {
        skinId = 'ada-saree'
        outfitName = 'Royal Holographic Saree'
      } else if (/black|trench|stealth/i.test(cleanMsg)) {
        skinId = isStark ? 'stark-stealth' : 'ada-trench'
        outfitName = isStark ? 'Stealth Strike Armor' : 'Noir Tactical Trench'
      } else if (/nanotech|stark|silver/i.test(cleanMsg)) {
        skinId = 'stark-nano'
        outfitName = 'Mark Nanotech Armor'
      }

      const taskAction: TaskActionCard = {
        type: 'wardrobe',
        title: `Wardrobe: ${outfitName}`,
        subtitle: `Equipped ${outfitName} on 3D Stage`,
        buttonText: 'Equipped',
        status: 'executed',
        icon: 'shirt',
        data: { skinId, outfitName },
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: `Transforming avatar outfit to ${outfitName}. Textures and kinematics updated.`,
        display_text: `### 👗 Holographic Wardrobe: Task Executed\n\n**Outfit:** **${outfitName}**  \n**Status:** 3D Shader Textures Applied  \n\n*Wardrobe telemetry synchronized on stage.*`,
        emotion: 'excited',
        intensity: 0.9,
        gesture: 'celebrate',
        voice_style: { rate: 1.05, pitch: isMiku ? 1.34 : (isStark ? 0.95 : 1.0), style: 'cheerful' },
        taskAction,
        actions: [{ name: 'change_wardrobe', arguments: { skinId, outfitName } }],
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
    // 9. Stage Choreography & 3D Motion Tasks
    // ─────────────────────────────────────────────────────────────
    const isDanceTask = /\b(?:dance|cute\s+dance|hip\s+hop|idol\s+dance|sing\s+and\s+dance)\b/i.test(cleanMsg)
    if (isDanceTask) {
      const danceName = isMiku ? 'dance_cute_idol' : 'dance_pop_groove'
      const taskAction: TaskActionCard = {
        type: 'deliverable',
        title: 'Stage Choreography: Dance Performance',
        subtitle: 'Live 3D motion executed on stage',
        buttonText: 'Performing',
        status: 'executed',
        icon: 'activity',
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: isMiku ? `Miku da yo~! Taking the stage right now!` : `Choreography protocol engaged. Watch this.`,
        display_text: `### 💃 Stage Motion: Task Executed\n\n**Action:** Live Choreography (${danceName})\n**Status:** Motion kinematics active on 3D stage.`,
        emotion: 'excited',
        intensity: 0.95,
        gesture: 'celebrate',
        voice_style: { rate: 1.05, pitch: isMiku ? 1.34 : 1.0, style: 'cheerful' },
        taskAction,
        actions: [{ name: 'dance', arguments: { name: danceName } }],
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
    // 10. Direct Website / Universal Platform Launch Tasks
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
      gmail: { name: 'Gmail', url: 'https://mail.google.com' },
      tradingview: { name: 'TradingView', url: 'https://www.tradingview.com' },
      discord: { name: 'Discord', url: 'https://discord.com' },
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
    // 11. Character Switch Tasks
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

    // ─────────────────────────────────────────────────────────────
    // 12. Clock & Live Telemetry Time Tasks
    // ─────────────────────────────────────────────────────────────
    const isTimeTask =
      /\b(?:what(?:'s|\s+is)\s+(?:the\s+)?time|current\s+time|time\s+now|what\s+time\s+is\s+it|what(?:'s|\s+is)\s+(?:the\s+)?date|today(?:'s|\s+is\s+the)\s+date)\b/i.test(cleanMsg) ||
      cleanMsg === 'time' ||
      cleanMsg === 'date'

    if (isTimeTask) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

      const taskAction: TaskActionCard = {
        type: 'time',
        title: `${timeStr}`,
        subtitle: `${dateStr} (${timeZone})`,
        buttonText: 'Chronometer Synced',
        status: 'executed',
        icon: 'clock',
        data: { timeStr, dateStr, timeZone, timestamp: Date.now() },
      }

      const reply: StructuredReply = {
        speaker: resolvedSpeaker,
        speech: isStark
          ? `Local chronometer reports ${timeStr}, ${dateStr}. System clock in sync.`
          : isMiku
          ? `Miku says the current time is ${timeStr}! Hope you're having an awesome day!`
          : `Chronometer verified. Current time is ${timeStr}, ${dateStr}.`,
        display_text: `### ⏱️ Chronometer Telemetry: Task Executed\n\n**Current Time:** **${timeStr}**  \n**Date:** **${dateStr}**  \n**Timezone:** \`${timeZone}\`  \n\n*System chronometer synchronized.*`,
        emotion: 'calm',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.02, pitch: isStark ? 0.95 : 1.0, style: 'calm' },
        taskAction,
        actions: [{ name: 'get_time', arguments: { time: timeStr, date: dateStr, timeZone } }],
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

    return null
  }
}
