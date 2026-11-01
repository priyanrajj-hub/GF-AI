import type { SearchProvider, SearchResultItem } from '@ada/shared'
import { WebSearchService } from '../services/webSearchService.js'

export class LiveWebSearchProvider implements SearchProvider {
  name = 'LiveWebSearch'

  async search(query: string, maxResults = 5): Promise<SearchResultItem[]> {
    return WebSearchService.search(query, maxResults)
  }
}
