export interface ScrapedWebPage {
  url: string
  title: string
  description?: string
  headings: string[]
  tables: string[]
  mainContent: string
  wordCount: number
  extractedAt: string
}

export class WebScraperService {
  /**
   * Detects if the user query contains a URL or explicit command to scrape/collect website data.
   */
  static detectScrapeIntent(message: string): { shouldScrape: boolean; url: string } {
    if (!message || typeof message !== 'string') return { shouldScrape: false, url: '' }

    // Direct URL match
    const urlMatch = message.match(/https?:\/\/[^\s"'<>]+/i)
    if (urlMatch) {
      return { shouldScrape: true, url: urlMatch[0] }
    }

    // Domain name without protocol (e.g. "read bbc.com", "collect data from github.com/trending")
    const domainMatch = message.match(
      /(?:visit|scrape|read|access|collect\s+(?:data\s+)?from|extract\s+(?:data\s+)?from|analyze|check)\s+([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i
    )
    if (domainMatch && domainMatch[1]) {
      return { shouldScrape: true, url: `https://${domainMatch[1]}` }
    }

    return { shouldScrape: false, url: '' }
  }

  /**
   * Scrapes and extracts full structured data from any provided URL.
   */
  static async extractPage(targetUrl: string): Promise<ScrapedWebPage | null> {
    if (!targetUrl || !targetUrl.startsWith('http')) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AdaBot/2.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        console.warn(`[WebScraper] HTTP ${res.status} when fetching ${targetUrl}`)
        return null
      }

      const html = await res.text()

      // 1. Extract Title
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : targetUrl

      // 2. Extract Meta Description
      const descMatch =
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
      const description = descMatch ? descMatch[1].trim() : undefined

      // 3. Extract Headings (h1, h2, h3)
      const headings: string[] = []
      const headingMatches = html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)
      for (const h of headingMatches) {
        const text = h[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text && text.length > 2 && text.length < 150) {
          headings.push(`H${h[1]}: ${text}`)
        }
      }

      // 4. Extract Tables
      const tables: string[] = []
      const tableMatches = html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)
      for (const t of tableMatches) {
        const rows: string[] = []
        const trMatches = t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
        for (const tr of trMatches) {
          const cells = Array.from(tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi))
            .map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
            .filter((c) => c.length > 0)
          if (cells.length > 0) {
            rows.push(cells.join(' | '))
          }
        }
        if (rows.length > 1) {
          tables.push(rows.slice(0, 15).join('\n'))
        }
      }

      // 5. Clean Main Body Content
      let cleaned = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')

      // Preserve paragraph and list breaks
      cleaned = cleaned
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')

      // Decode common HTML entities
      cleaned = cleaned
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#x20b9;/gi, '₹')
        .replace(/&nbsp;/gi, ' ')

      // Normalize whitespace
      cleaned = cleaned
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      const truncatedContent = cleaned.slice(0, 3500)
      const wordCount = truncatedContent.split(/\s+/).length

      return {
        url: targetUrl,
        title,
        description,
        headings: headings.slice(0, 8),
        tables: tables.slice(0, 3),
        mainContent: truncatedContent,
        wordCount,
        extractedAt: new Date().toISOString(),
      }
    } catch (err: any) {
      console.warn(`[WebScraper] Failed to extract from ${targetUrl}:`, err.message)
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Formats scraped webpage data into a prompt context for Ada.
   */
  static formatScrapedContext(page: ScrapedWebPage): string {
    const tableSection =
      page.tables.length > 0
        ? `\n### EXTRACTED DATA TABLES:\n${page.tables.map((t, idx) => `Table #${idx + 1}:\n${t}`).join('\n\n')}`
        : ''

    const headingSection =
      page.headings.length > 0 ? `\n### PAGE STRUCTURE & OUTLINE:\n${page.headings.join('\n')}` : ''

    return `🌐 LIVE WEBSITE EXTRACTED DATA (COLLECTED IN REAL-TIME FROM ${page.url}):
- Page Title: ${page.title}
- Meta Description: ${page.description || 'N/A'}
- Extracted Word Count: ~${page.wordCount} words
${headingSection}
${tableSection}

### MAIN EXTRACTED CONTENT:
${page.mainContent}

[SCRAPER MANDATE: Analyze, synthesize, and extract all key data, numbers, insights, and answers requested by the user directly from this website content. Address him warmly and clearly!]`
  }
}
