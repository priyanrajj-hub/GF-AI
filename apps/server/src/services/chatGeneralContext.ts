import { WebScraperService } from './webScraperService.js'
import { FinanceAnalystService } from './financeAnalystService.js'
import { NewsGathererService } from './newsGathererService.js'
import { UserLifeMemoryService } from './userLifeMemoryService.js'
import { WebSearchService } from './webSearchService.js'

export async function resolveGeneralContext(
  message: string,
  cleanMsg: string = message.toLowerCase().trim(),
  userId: string = 'default-user'
): Promise<string | null> {
  // 1. Web Scraper Intent
  const scrapeIntent = WebScraperService.detectScrapeIntent(message)
  if (scrapeIntent.shouldScrape) {
    try {
      console.log(`🌐 [Web Scraper] Scraping and extracting live data from: "${scrapeIntent.url}"`)
      const pageData = await WebScraperService.extractPage(scrapeIntent.url)
      if (pageData) {
        return WebScraperService.formatScrapedContext(pageData)
      }
    } catch (scrapeErr: any) {
      console.warn('⚠️ [Web Scraper Error]:', scrapeErr?.message)
    }
  }

  // 2. Mutual Funds & SIP Investment Intent
  const isMfQuery =
    cleanMsg.includes('mutual fund') ||
    cleanMsg.includes('mutual funds') ||
    cleanMsg.includes(' sip') ||
    cleanMsg.startsWith('sip') ||
    cleanMsg.includes('parag parikh') ||
    cleanMsg.includes('small cap fund') ||
    cleanMsg.includes('mid cap fund') ||
    cleanMsg.includes('large cap fund') ||
    cleanMsg.includes('elss') ||
    cleanMsg.includes('tax saver') ||
    cleanMsg.includes('index fund') ||
    cleanMsg.includes('best mf') ||
    cleanMsg.includes('mf to buy') ||
    cleanMsg.includes('invest in mf')

  if (isMfQuery) {
    try {
      let cat: string | undefined
      if (cleanMsg.includes('small')) cat = 'small cap'
      else if (cleanMsg.includes('mid')) cat = 'mid cap'
      else if (cleanMsg.includes('large')) cat = 'large cap'
      else if (cleanMsg.includes('flexi')) cat = 'flexi cap'
      else if (cleanMsg.includes('elss') || cleanMsg.includes('tax')) cat = 'elss'
      else if (cleanMsg.includes('index')) cat = 'index fund'

      return FinanceAnalystService.formatMutualFundsContext(cat)
    } catch (mfErr: any) {
      console.warn('⚠️ [Mutual Funds Error]:', mfErr?.message)
    }
  }

  // 3. Portfolio Hedging & Wealth Protection Intent
  const isHedgeQuery =
    cleanMsg.includes('hedge') ||
    cleanMsg.includes('hedging') ||
    cleanMsg.includes('he feature') ||
    cleanMsg.includes('protect portfolio') ||
    cleanMsg.includes('portfolio protection') ||
    cleanMsg.includes('risk mitigation') ||
    cleanMsg.includes('stop loss trailing') ||
    cleanMsg.includes('put option')

  if (isHedgeQuery) {
    try {
      return FinanceAnalystService.formatHedgingContext()
    } catch (hErr: any) {
      console.warn('⚠️ [Hedging Error]:', hErr?.message)
    }
  }

  // 4. Live News Gatherer Intent
  const isNewsQuery =
    cleanMsg.includes('news') ||
    cleanMsg.includes('headline') ||
    cleanMsg.includes('latest in ai') ||
    cleanMsg.includes('new ai') ||
    cleanMsg.includes('tech updates') ||
    cleanMsg.includes('education news') ||
    cleanMsg.includes('exam updates') ||
    cleanMsg.includes('what happened in') ||
    cleanMsg.includes('market update')

  if (isNewsQuery) {
    try {
      let newsCat: 'ai' | 'tech' | 'education' | 'finance' | 'all' = 'all'
      if (cleanMsg.includes('ai') || cleanMsg.includes('model') || cleanMsg.includes('deepmind') || cleanMsg.includes('openai')) {
        newsCat = 'ai'
      } else if (cleanMsg.includes('tech') || cleanMsg.includes('cyber') || cleanMsg.includes('software')) {
        newsCat = 'tech'
      } else if (cleanMsg.includes('education') || cleanMsg.includes('exam') || cleanMsg.includes('college') || cleanMsg.includes('course') || cleanMsg.includes('study')) {
        newsCat = 'education'
      } else if (cleanMsg.includes('market') || cleanMsg.includes('finance') || cleanMsg.includes('economy')) {
        newsCat = 'finance'
      }

      return await NewsGathererService.formatNewsContext(newsCat)
    } catch (nErr: any) {
      console.warn('⚠️ [News Gatherer Error]:', nErr?.message)
    }
  }

  // 5. User's World, Life & Memory Intent
  const isUserWorldQuery =
    cleanMsg.includes('what do you know about me') ||
    cleanMsg.includes('about me') ||
    cleanMsg.includes('my world') ||
    cleanMsg.includes('my life') ||
    cleanMsg.includes('remember about me') ||
    cleanMsg.includes('my profile') ||
    cleanMsg.includes('who am i to you') ||
    cleanMsg.includes('what are my goals')

  if (isUserWorldQuery) {
    try {
      return UserLifeMemoryService.formatUserLifeContext(userId, message)
    } catch (lifeErr: any) {
      console.warn('⚠️ [User World Error]:', lifeErr?.message)
    }
  }

  // 6. Real-Time Live Web Search Intent
  const searchIntent = WebSearchService.detectSearchIntent(message)
  if (searchIntent.shouldSearch) {
    try {
      let marketData: string | null = null
      let weatherData: string | null = null

      if (searchIntent.category === 'commodity') {
        marketData = await WebSearchService.fetchLiveMarketQuote(searchIntent.query)
      } else if (searchIntent.category === 'weather') {
        weatherData = await WebSearchService.fetchLiveWeather(searchIntent.query)
      }

      const searchResults = await WebSearchService.search(searchIntent.query, 3)
      if (searchResults.length > 0 || marketData || weatherData) {
        return WebSearchService.formatForPrompt(
          searchIntent.query,
          searchResults,
          marketData,
          weatherData
        )
      }
    } catch (searchErr: any) {
      console.warn('⚠️ [Live Web Search Exception]:', searchErr?.message)
    }
  }

  return null
}
