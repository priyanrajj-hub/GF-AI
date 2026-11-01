import type { SearchResultItem } from '@ada/shared'

export interface InternetStatus {
  online: boolean
  latencyMs: number
  engine: string
  lastChecked: number
  error?: string
}

export class WebSearchService {
  private static cachedStatus: InternetStatus = {
    online: true,
    latencyMs: 120,
    engine: 'DuckDuckGo + Wikipedia',
    lastChecked: Date.now(),
  }

  /**
   * Intelligently inspects the user message to detect if a live web search is warranted.
   * Extracts or refines the optimal search query.
   */
  static detectSearchIntent(message: string): { shouldSearch: boolean; query: string } {
    if (!message || typeof message !== 'string') {
      return { shouldSearch: false, query: '' }
    }

    const cleanMsg = message.trim().toLowerCase()

    // 1. Explicit search commands
    const explicitPrefixMatch = cleanMsg.match(/^(?:search(?:\s+for|\s+the\s+web\s+for)?|google|browse|lookup|find\s+online|check\s+online)[:\s]+(.+)$/i)
    if (explicitPrefixMatch && explicitPrefixMatch[1]) {
      return { shouldSearch: true, query: explicitPrefixMatch[1].trim() }
    }

    // 2. Training on live internet data / web learning
    if (
      cleanMsg.includes('train yourself with live') ||
      cleanMsg.includes('live internet') ||
      cleanMsg.includes('livee internet') ||
      cleanMsg.includes('internet data') ||
      cleanMsg.includes('connect with internet') ||
      cleanMsg.includes('search internet') ||
      cleanMsg.includes('browse the web') ||
      cleanMsg.includes('browse internet')
    ) {
      // Formulate a high-yield search query for current AI / web research
      return {
        shouldSearch: true,
        query: 'latest open source AI models research benchmarks Hugging Face 2026',
      }
    }

    // 3. Current events, weather, stock, or temporal news triggers
    const temporalKeywords = [
      'latest news',
      'current news',
      'today news',
      'weather today',
      'stock price',
      'who won',
      'what happened today',
      'recent updates on',
      'latest release of',
      'trending on',
    ]

    for (const kw of temporalKeywords) {
      if (cleanMsg.includes(kw)) {
        // Remove conversational filler and use core query
        const query = message
          .replace(/^(hey\s+ada|ada|can\s+you|please|tell\s+me\s+about|what\s+is\s+the|what\s+are\s+the)/gi, '')
          .replace(/[?!.]/g, '')
          .trim()
        return { shouldSearch: true, query: query || message }
      }
    }

    // 4. Questions with strong real-time information intent
    if (
      (cleanMsg.startsWith('what is') || cleanMsg.startsWith("what's") || cleanMsg.startsWith('who is')) &&
      (cleanMsg.includes('latest') || cleanMsg.includes('current') || cleanMsg.includes('2026') || cleanMsg.includes('newest'))
    ) {
      const query = message.replace(/^(what\s+is|what's|who\s+is|ada|hey\s+ada)/gi, '').replace(/[?!.]/g, '').trim()
      return { shouldSearch: true, query: query || message }
    }

    return { shouldSearch: false, query: '' }
  }

  /**
   * Main multi-engine search method.
   * Tries DuckDuckGo HTML first, falls back to Wikipedia & HackerNews if needed.
   */
  static async search(query: string, maxResults = 5): Promise<SearchResultItem[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    // 1. Try DuckDuckGo POST HTML
    try {
      const ddgResults = await this.searchDuckDuckGo(trimmed, maxResults)
      if (ddgResults.length > 0) {
        return ddgResults
      }
    } catch (err: any) {
      console.warn(`[WebSearch] DuckDuckGo search failed (${err?.message}). Trying Wikipedia fallback...`)
    }

    // 2. Try Wikipedia Search API
    try {
      const wikiResults = await this.searchWikipedia(trimmed, maxResults)
      if (wikiResults.length > 0) {
        return wikiResults
      }
    } catch (err: any) {
      console.warn(`[WebSearch] Wikipedia search failed (${err?.message}). Trying HackerNews fallback...`)
    }

    // 3. Try HackerNews Search API
    try {
      const hnResults = await this.searchHackerNews(trimmed, maxResults)
      if (hnResults.length > 0) {
        return hnResults
      }
    } catch (err: any) {
      console.warn(`[WebSearch] HackerNews search failed (${err?.message}).`)
    }

    return []
  }

  /**
   * DuckDuckGo HTML Search via POST.
   * Completely free, fast, zero-API-key requirement.
   */
  static async searchDuckDuckGo(query: string, maxResults = 5): Promise<SearchResultItem[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    try {
      const response = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`DuckDuckGo responded with HTTP ${response.status}`)
      }

      const html = await response.text()
      const results: SearchResultItem[] = []

      // Split into individual result blocks
      const blocks = html.split(/class="result\s+results_links/i)

      for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
        const block = blocks[i]

        // Extract title & link
        const linkMatch =
          block.match(/<h2[^>]*class="result__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
          block.match(/<a[^>]*class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
          block.match(/<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)

        // Extract snippet
        const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)

        if (linkMatch) {
          let url = linkMatch[1]
          let title = linkMatch[2]
          const snippet = snippetMatch ? snippetMatch[1] : ''

          // Decode DDG redirected URL
          if (url.includes('uddg=')) {
            const uMatch = url.match(/uddg=([^&]+)/)
            if (uMatch) url = decodeURIComponent(uMatch[1])
          }
          if (url.startsWith('//')) {
            url = 'https:' + url
          }

          const cleanTitle = title.replace(/<[^>]+>/g, '').trim()
          const cleanSnippet = snippet.replace(/<[^>]+>/g, '').trim()

          if (cleanTitle && url.startsWith('http')) {
            results.push({
              title: cleanTitle,
              url,
              snippet: cleanSnippet || cleanTitle,
            })
          }
        }
      }

      return results
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Wikipedia Search API for factual, scientific, and conceptual queries.
   */
  static async searchWikipedia(query: string, maxResults = 4): Promise<SearchResultItem[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    try {
      const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&utf8=1&srlimit=${maxResults}`

      const res = await fetch(endpoint, {
        headers: { 'User-Agent': 'AdaHolographicAssistant/2.0 (mailto:priyan@example.com)' },
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`Wikipedia responded with HTTP ${res.status}`)

      const data = await res.json()
      const searchItems = data?.query?.search || []

      return searchItems.map((item: any) => ({
        title: item.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
        snippet: (item.snippet || '').replace(/<[^>]+>/g, ''),
      }))
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * HackerNews Algolia Search API for latest technology, models, and community updates.
   */
  static async searchHackerNews(query: string, maxResults = 4): Promise<SearchResultItem[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    try {
      const endpoint = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
        query
      )}&hitsPerPage=${maxResults}`

      const res = await fetch(endpoint, { signal: controller.signal })
      if (!res.ok) throw new Error(`HackerNews responded with HTTP ${res.status}`)

      const data = await res.json()
      const hits = data?.hits || []

      return hits
        .filter((h: any) => h.title)
        .map((h: any) => ({
          title: h.title,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
          snippet: h.story_text ? h.story_text.slice(0, 200) : `Score: ${h.points || 0} points, ${h.num_comments || 0} comments`,
        }))
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Formats search results into structured Markdown context for injection into LLM prompts.
   */
  static formatForPrompt(query: string, results: SearchResultItem[]): string {
    if (!results || results.length === 0) {
      return `Real-time search performed for query: "${query}", but no live web results were returned. Answer with your core knowledge and note your attempt to check the live web.`
    }

    const itemsFormatted = results
      .map(
        (r, idx) =>
          `${idx + 1}. **[${r.title}](${r.url})**\n   Summary: ${r.snippet}\n   Source URL: ${r.url}`
      )
      .join('\n\n')

    return `CURRENT LIVE INTERNET SEARCH RESULTS (TIMESTAMP: ${new Date().toUTCString()}):
User Query / Topic: "${query}"

${itemsFormatted}

CRITICAL INSTRUCTIONS FOR ADA:
1. You HAVE real-time live internet access. The search data above was fetched live just seconds ago.
2. NEVER claim you lack an active web-browsing plugin or cannot access the internet.
3. Synthesize and present these live findings directly to Priyan in your warm, brilliant companion voice.
4. Include source links in Markdown format [Title](URL) in your display_text so Priyan can inspect the articles directly.
5. In your speech output, give a concise, engaging summary in 1-2 spoken sentences addressing Priyan affectionately.`
  }

  /**
   * Checks real-time internet connectivity status.
   */
  static async checkConnectivity(): Promise<InternetStatus> {
    const startTime = Date.now()
    try {
      const res = await fetch('https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json', {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AdaAssistant/2.0' },
        signal: AbortSignal.timeout(4000),
      })
      const latencyMs = Date.now() - startTime

      this.cachedStatus = {
        online: res.ok,
        latencyMs,
        engine: 'DuckDuckGo + Wikipedia (Live)',
        lastChecked: Date.now(),
      }
      return this.cachedStatus
    } catch (err: any) {
      this.cachedStatus = {
        online: false,
        latencyMs: Date.now() - startTime,
        engine: 'DuckDuckGo + Wikipedia',
        lastChecked: Date.now(),
        error: err.message,
      }
      return this.cachedStatus
    }
  }

  static getStatus(): InternetStatus {
    return this.cachedStatus
  }
}
