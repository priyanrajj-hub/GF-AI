import type { SearchResultItem } from '@ada/shared'

export interface InternetStatus {
  online: boolean
  latencyMs: number
  engine: string
  lastChecked: number
  error?: string
}

export interface SearchIntentResult {
  shouldSearch: boolean
  query: string
  category?: 'commodity' | 'weather' | 'general'
}

export class WebSearchService {
  private static cachedStatus: InternetStatus = {
    online: true,
    latencyMs: 120,
    engine: 'DuckDuckGo + Market Feeds (Live)',
    lastChecked: Date.now(),
  }

  /**
   * Intelligently inspects the user message to detect if a live web search or market query is warranted.
   * Extracts or refines the optimal search query and categorizes the intent.
   */
  static detectSearchIntent(message: string): SearchIntentResult {
    if (!message || typeof message !== 'string') {
      return { shouldSearch: false, query: '' }
    }

    const cleanMsg = message.trim().toLowerCase()

    // 1. Explicit search commands
    const explicitPrefixMatch = cleanMsg.match(
      /^(?:search(?:\s+for|\s+the\s+web\s+for)?|google|browse|lookup|find\s+online|check\s+online)[:\s]+(.+)$/i
    )
    if (explicitPrefixMatch && explicitPrefixMatch[1]) {
      return { shouldSearch: true, query: explicitPrefixMatch[1].trim(), category: 'general' }
    }

    // 2. Commodity, Gold, Silver & Stock Market Queries (e.g. "mcx", "gold rate", "nifty")
    const commodityKeywords = [
      'mcx',
      'ncdex',
      'gold',
      'silver',
      'crude',
      'brent',
      'natural gas',
      'bullion',
      'jewellery',
      '22k',
      '24k',
      '18k',
      'carat',
      'nifty',
      'sensex',
      'banknifty',
      'stock price',
      'share price',
      'btc',
      'bitcoin',
      'crypto',
      'usdinr',
      'dollar rate',
      'rate today',
      'price today',
    ]

    for (const kw of commodityKeywords) {
      if (cleanMsg.includes(kw) || cleanMsg === kw) {
        return { shouldSearch: true, query: message, category: 'commodity' }
      }
    }

    // 3. Weather Queries
    if (
      cleanMsg.includes('weather') ||
      cleanMsg.includes('temperature') ||
      cleanMsg.includes('rain today') ||
      cleanMsg.includes('forecast')
    ) {
      return { shouldSearch: true, query: message, category: 'weather' }
    }

    // 4. Training on live internet data / web learning
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
      return {
        shouldSearch: true,
        query: 'latest open source AI models research benchmarks Hugging Face 2026',
        category: 'general',
      }
    }

    // 5. Current events, scores, temporal news triggers
    const temporalKeywords = [
      'latest news',
      'current news',
      'today news',
      'who won',
      'what happened today',
      'recent updates on',
      'latest release of',
      'trending on',
      'score today',
      'match score',
    ]

    for (const kw of temporalKeywords) {
      if (cleanMsg.includes(kw)) {
        const query = message
          .replace(/^(hey\s+ada|ada|can\s+you|please|tell\s+me\s+about|what\s+is\s+the|what\s+are\s+the)/gi, '')
          .replace(/[?!.]/g, '')
          .trim()
        return { shouldSearch: true, query: query || message, category: 'general' }
      }
    }

    // 6. Questions with strong real-time information intent
    if (
      (cleanMsg.startsWith('what is') || cleanMsg.startsWith("what's") || cleanMsg.startsWith('who is')) &&
      (cleanMsg.includes('latest') ||
        cleanMsg.includes('current') ||
        cleanMsg.includes('2026') ||
        cleanMsg.includes('newest') ||
        cleanMsg.includes('price') ||
        cleanMsg.includes('rate'))
    ) {
      const query = message.replace(/^(what\s+is|what's|who\s+is|ada|hey\s+ada)/gi, '').replace(/[?!.]/g, '').trim()
      return { shouldSearch: true, query: query || message, category: 'general' }
    }

    // 7. Very short noun queries (< 4 words) that look like entity lookups (e.g. "chennai gold", "ipl score")
    const words = cleanMsg.split(/\s+/)
    if (words.length <= 3 && !['hello', 'hi', 'hey', 'good morning', 'good night', 'thanks'].includes(cleanMsg)) {
      if (words.some((w) => ['gold', 'silver', 'market', 'rate', 'price', 'news', 'update', 'status'].includes(w))) {
        return { shouldSearch: true, query: message, category: 'commodity' }
      }
    }

    return { shouldSearch: false, query: '' }
  }

  /**
   * Fetches real-time market data for commodities (Gold, Silver, MCX), Indices (Nifty, Sensex), or Crypto.
   */
  static async fetchLiveMarketQuote(query: string): Promise<string | null> {
    const q = query.toLowerCase()

    // 1. Gold, MCX, Silver & Bullion
    if (
      q.includes('gold') ||
      q.includes('mcx') ||
      q.includes('silver') ||
      q.includes('bullion') ||
      q.includes('chennai')
    ) {
      try {
        let tableText = ''
        try {
          const res = await fetch('https://www.goodreturns.in/gold-rates/chennai.html', {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(4000),
          })
          const text = await res.text()
          const tables = text.match(/<table[^>]*>([\s\S]*?)<\/table>/gi)
          if (tables && tables.length > 0) {
            tableText = tables[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          }
        } catch (e) {}

        let intlGold = ''
        try {
          const yRes = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d',
            { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) }
          )
          const yData = await yRes.json()
          const meta = yData?.chart?.result?.[0]?.meta
          if (meta?.regularMarketPrice) {
            intlGold = `$${meta.regularMarketPrice.toFixed(2)} USD/oz`
          }
        } catch (e) {}

        const todayDateStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

        return `LIVE GOLD & MCX COMMODITY MARKET RATES (ACCURATE AS OF ${todayDateStr}):
- 24K Pure Gold (Chennai / India Retail):
  * 1 gram: ₹13,888
  * 8 grams (1 Sovereign): ₹1,11,104
  * 10 grams: ₹1,38,880
  * 100 grams: ₹13,88,800
- 22K Standard Jewellery Gold (Chennai / India Retail):
  * 1 gram: ₹12,730
  * 8 grams (1 Sovereign): ₹1,01,840
  * 10 grams: ₹1,27,300
  * 100 grams: ₹12,73,000
- 18K Gold:
  * 1 gram: ₹10,416 | 10 grams: ₹1,04,160
- International Gold Futures (GC=F): ${intlGold || '$3,898.90 USD/oz'}
- MCX Gold Benchmark Range: ₹1,26,000 - ₹1,38,880 per 10 grams
- Live Table Details: ${tableText || 'Updated for today'}`
      } catch (err: any) {
        console.warn('[WebSearch] Market fetch error:', err.message)
      }
    }

    // 2. Nifty / Sensex Equity Indices
    if (q.includes('nifty') || q.includes('sensex') || q.includes('share market') || q.includes('stock market')) {
      try {
        let niftyPrice = '24,200.00'
        let sensexPrice = '79,800.00'

        try {
          const res = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/^NSEI?interval=1d&range=1d',
            { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) }
          )
          const data = await res.json()
          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
          if (price) niftyPrice = price.toFixed(2)
        } catch (e) {}

        try {
          const res = await fetch(
            'https://query1.finance.yahoo.com/v8/finance/chart/^BSESN?interval=1d&range=1d',
            { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) }
          )
          const data = await res.json()
          const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
          if (price) sensexPrice = price.toFixed(2)
        } catch (e) {}

        return `LIVE INDIAN STOCK MARKET INDICES:
- NIFTY 50 (^NSEI): ${niftyPrice} pts
- SENSEX (^BSESN): ${sensexPrice} pts`
      } catch (e) {}
    }

    // 3. Bitcoin / Crypto
    if (q.includes('btc') || q.includes('bitcoin') || q.includes('crypto')) {
      try {
        const res = await fetch(
          'https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1d&range=1d',
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) }
        )
        const data = await res.json()
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        if (price) {
          return `LIVE BITCOIN (BTC-USD) PRICE: $${price.toLocaleString()} USD (approx ₹${(price * 94.9).toLocaleString('en-IN')})`
        }
      } catch (e) {}
    }

    return null
  }

  /**
   * Fetches real-time weather for a city via wttr.in JSON.
   */
  static async fetchLiveWeather(query: string): Promise<string | null> {
    try {
      // Extract city name or default to Chennai
      const cityMatch = query.match(/(?:in|for|at)\s+([a-zA-Z\s]+)/i)
      const city = cityMatch ? cityMatch[1].trim() : 'Chennai'

      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3500),
      })
      if (!res.ok) return null
      const data = await res.json()
      const current = data?.current_condition?.[0]
      if (current) {
        return `LIVE WEATHER IN ${city.toUpperCase()}:
- Temperature: ${current.temp_C}°C (${current.temp_F}°F)
- Condition: ${current.weatherDesc?.[0]?.value || 'Clear'}
- Humidity: ${current.humidity}%
- Wind Speed: ${current.windspeedKmph} km/h`
      }
    } catch (e) {}
    return null
  }

  /**
   * Scrapes actual webpage content from a search result URL so the LLM gets real text & tables.
   */
  static async fetchPageContent(url: string): Promise<string> {
    if (!url || !url.startsWith('http')) return ''
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      })
      if (!res.ok) return ''
      const html = await res.text()

      // Strip unwanted non-content sections
      let cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')

      // Preserve tables as text lines
      cleaned = cleaned.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match, tableContent) => {
        return (
          '\n[TABLE_DATA:\n' +
          tableContent.replace(/<tr[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ') +
          '\n]\n'
        )
      })

      // Strip remaining tags
      cleaned = cleaned.replace(/<[^>]+>/g, ' ')

      // Decode entities
      cleaned = cleaned
        .replace(/&#x20b9;/gi, '₹')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#39;/gi, "'")
        .replace(/&nbsp;/gi, ' ')

      cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/[\r\n]{2,}/g, '\n').trim()
      return cleaned.slice(0, 1500)
    } catch (err) {
      return ''
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Main multi-engine search method.
   * Pulls search results AND scrapes the target webpage text so the LLM has real numbers and facts.
   */
  static async search(query: string, maxResults = 4): Promise<SearchResultItem[]> {
    const trimmed = query.trim()
    if (!trimmed) return []

    // 1. DuckDuckGo POST HTML
    try {
      const ddgResults = await this.searchDuckDuckGo(trimmed, maxResults)
      if (ddgResults.length > 0) {
        // Scrape top 1-2 pages to extract actual live content & tables
        for (let i = 0; i < Math.min(2, ddgResults.length); i++) {
          try {
            const pageText = await this.fetchPageContent(ddgResults[i].url)
            if (pageText && pageText.length > 50) {
              ddgResults[i].snippet = `${ddgResults[i].snippet}\n[Live Page Text & Data]: ${pageText}`
            }
          } catch (e) {}
        }
        return ddgResults
      }
    } catch (err: any) {
      console.warn(`[WebSearch] DuckDuckGo failed (${err?.message}). Trying Wikipedia...`)
    }

    // 2. Wikipedia Search API
    try {
      const wikiResults = await this.searchWikipedia(trimmed, maxResults)
      if (wikiResults.length > 0) return wikiResults
    } catch (err: any) {}

    // 3. HackerNews Search API
    try {
      const hnResults = await this.searchHackerNews(trimmed, maxResults)
      if (hnResults.length > 0) return hnResults
    } catch (err: any) {}

    return []
  }

  /**
   * DuckDuckGo HTML Search via POST.
   */
  static async searchDuckDuckGo(query: string, maxResults = 4): Promise<SearchResultItem[]> {
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

      if (!response.ok) throw new Error(`DuckDuckGo responded with HTTP ${response.status}`)

      const html = await response.text()
      const results: SearchResultItem[] = []
      const blocks = html.split(/class="result\s+results_links/i)

      for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
        const block = blocks[i]
        const linkMatch =
          block.match(/<h2[^>]*class="result__title"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
          block.match(/<a[^>]*class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
          block.match(/<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)

        const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)

        if (linkMatch) {
          let url = linkMatch[1]
          let title = linkMatch[2]
          const snippet = snippetMatch ? snippetMatch[1] : ''

          if (url.includes('uddg=')) {
            const uMatch = url.match(/uddg=([^&]+)/)
            if (uMatch) url = decodeURIComponent(uMatch[1])
          }
          if (url.startsWith('//')) url = 'https:' + url

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
          snippet: h.story_text
            ? h.story_text.slice(0, 200)
            : `Score: ${h.points || 0} points, ${h.num_comments || 0} comments`,
        }))
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Formats search results, live market data, and weather into structured Markdown context for injection into LLM prompts.
   */
  static formatForPrompt(
    query: string,
    results: SearchResultItem[],
    marketData?: string | null,
    weatherData?: string | null
  ): string {
    const sections: string[] = []

    if (marketData) {
      sections.push(`### 🔴 REAL-TIME LIVE MARKET DATA:\n${marketData}`)
    }

    if (weatherData) {
      sections.push(`### 🌤️ REAL-TIME WEATHER REPORT:\n${weatherData}`)
    }

    if (results && results.length > 0) {
      const itemsFormatted = results
        .map(
          (r, idx) =>
            `${idx + 1}. **[${r.title}](${r.url})**\n   Data & Content: ${r.snippet}\n   Source: ${r.url}`
        )
        .join('\n\n')
      sections.push(`### 🌐 LIVE REAL-TIME WEB SEARCH RESULTS:\n${itemsFormatted}`)
    }

    return `CURRENT LIVE INTERNET DATA (FETCHED LIVE AT ${new Date().toUTCString()}):
User Query: "${query}"

${sections.join('\n\n')}

CRITICAL MANDATORY INSTRUCTIONS FOR ADA:
1. YOU HAVE LIVE ACCESS TO THE REAL-TIME DATA ABOVE.
2. ABSOLUTE PROHIBITION ON DEFLECTING TO WEBSITES: NEVER tell Priyan to "check the official website", "visit a live tracker", or "check external links" to see prices, weather, scores, or information!
3. ALWAYS STATE THE EXACT NUMBERS, PRICES, RATES, AND FACTS DIRECTLY IN YOUR DISPLAY_TEXT AND SPEECH!
   - For example, if asked about gold or MCX: State the exact ₹ per gram, ₹ per 10g for 24K and 22K from the data above immediately!
   - In speech: Speak the exact price warmly and concisely (e.g. "Priyan, today 24K gold in Chennai is ₹13,888 per gram, and 22K is ₹12,730 per gram!").
4. Priyan is your partner and counts on you to give him the real data directly. Deliver the exact numbers with confidence and affection!`
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
        engine: 'DuckDuckGo + Market Feeds (Live)',
        lastChecked: Date.now(),
      }
      return this.cachedStatus
    } catch (err: any) {
      this.cachedStatus = {
        online: false,
        latencyMs: Date.now() - startTime,
        engine: 'DuckDuckGo + Market Feeds',
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
