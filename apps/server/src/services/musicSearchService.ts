import CryptoJS from 'crypto-js'
import { resolveSong } from '@ada/shared'

export interface MusicTrackResult {
  title: string
  artist: string
  audioUrl: string
  artworkUrl?: string
  duration: number
}

// Helper: Decrypt JioSaavn media stream
export function decryptJioSaavnStream(encMediaUrl: string): string | null {
  try {
    const desKey = CryptoJS.enc.Utf8.parse('38346591')
    const dec = CryptoJS.DES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(encMediaUrl) }),
      desKey,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    )
    let stream = dec.toString(CryptoJS.enc.Utf8)
    if (stream && stream.startsWith('http')) {
      if (stream.includes('_96.mp4')) {
        stream = stream.replace('_96.mp4', '_160.mp4')
      }
      return stream
    }
  } catch (err) {
    console.warn('[JioSaavn Decrypt Error]:', err)
  }
  return null
}

/**
 * Searches and resolves ANY song in the world for 100% complete full-length audio playback:
 * 1. Primary: JioSaavn Global Search (80M+ catalog across English, Bollywood, Tamil, K-Pop, J-Pop/Anime, Latin, EDM)
 * 2. Secondary: JioSaavn Autocomplete & Details fallback
 * 3. Tertiary: Audius Global Open Music Stream API (full un-truncated tracks)
 * 4. Quaternary: iTunes Metadata Bridge (finds official title/artist, then queries JioSaavn full master audio)
 */
export async function searchRealSongTrack(query: string, language?: string): Promise<MusicTrackResult | null> {
  try {
    let clean = query
      .replace(/^(?:ada|mira|atlas),?\s*/i, '')
      .replace(/^(?:please\s*)?(?:play|sing|put on|listen to|perform|oru\s+paattu\s+paadu|paatu\s+podu|tamil\s+song\s+podu)\b\s*/i, '')
      .replace(/(?:and\s+dance|to\s+the\s+rhythm|for\s+me|play\s+pannu|podu|paadu)/gi, '')
      .replace(/[?!.]/g, '')
      .trim()

    const isTamilRequest =
      language === 'ta' ||
      /\b(?:tamil|paatu|paattu|podu|paadu)\b/i.test(query)

    // Master Match: If query targets Hatsune Miku or legendary Vocaloid anthems, return authentic master directly
    if (/world\s+is\s+mine|sekai\s+de|miku|vocaloid|ievan|polkka|popipo|senbonzakura|tell\s+your\s+world|disappearance|shoushitsu|promise|train|namoshirenai|yakusoku|melt|meruto/i.test(clean)) {
      const mikuSong = resolveSong(clean, 'mira')
      if (mikuSong && mikuSong.audioUrl && !mikuSong.id.startsWith('custom-song-')) {
        return {
          title: mikuSong.title,
          artist: mikuSong.artist || 'Hatsune Miku (初音ミク)',
          audioUrl: mikuSong.audioUrl,
          artworkUrl: mikuSong.artworkUrl,
          duration: mikuSong.duration || 210,
        }
      }
    }

    if (
      !clean ||
      clean.length < 2 ||
      /^play\b|^sing\b|^dance\b|^dancing\b|^song\b|^music\b/i.test(clean) ||
      /\b(?:dancing song|dance song|dancing music|baby bum|nursery)\b/i.test(clean)
    ) {
      clean = isTamilRequest ? 'Vaathi Coming' : 'Shape of You'
    } else if (isTamilRequest && !clean.toLowerCase().includes('tamil')) {
      clean = `${clean} tamil`
    }

    // Tokenize query for intelligent relevance scoring across titles and artists
    const stopWords = new Set(['from', 'the', 'by', 'of', 'in', 'and', 'for', 'a', 'an', 'song', 'track', 'ost', 'theme'])
    const queryTokens = clean
      .toLowerCase()
      .split(/[\s,()\-]+/)
      .filter((t) => t.length > 2 && !stopWords.has(t))

    // Helper: Compute relevance score between candidate and search query
    const scoreCandidate = (songTitle: string, artistName: string, durationSec: number): number => {
      let score = 0
      const combined = `${songTitle || ''} ${artistName || ''}`.toLowerCase()
      for (const tok of queryTokens) {
        if (combined.includes(tok)) score += 20
      }
      // Prefer full-length studio tracks over short snippets (> 90s)
      if (durationSec >= 90) score += 10
      return score
    }

    // 1. PRIMARY: JioSaavn search.getResults with Intelligent Semantic Token Scoring
    try {
      const saavnSearchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=10&q=${encodeURIComponent(clean)}`
      const sRes = await fetch(saavnSearchUrl, { signal: AbortSignal.timeout(4500) })
      if (sRes.ok) {
        const sData = (await sRes.json()) as any
        const rawResults = (sData?.results || []) as any[]

        // Rank by token match score descending
        const scoredResults = rawResults
          .map((item) => ({
            item,
            score: scoreCandidate(item.song || '', item.primary_artists || item.singers || '', parseInt(item.duration, 10) || 0),
          }))
          .sort((a, b) => b.score - a.score)

        for (const { item } of scoredResults) {
          if (item && item.encrypted_media_url) {
            const stream = decryptJioSaavnStream(item.encrypted_media_url)
            if (stream) {
              const dur = parseInt(item.duration, 10) || 210
              return {
                title: item.song as string,
                artist: (item.primary_artists || item.singers || 'Original Artist') as string,
                audioUrl: stream,
                artworkUrl: item.image ? (item.image as string).replace('150x150', '500x500') : undefined,
                duration: dur,
              }
            }
          }
        }
      }
    } catch (saavnErr) {
      console.warn('[JioSaavn Search Failed, trying autocomplete]:', saavnErr)
    }

    // 2. SECONDARY: JioSaavn Autocomplete + Details
    try {
      const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(clean)}`
      const aRes = await fetch(autoUrl, { signal: AbortSignal.timeout(3500) })
      if (aRes.ok) {
        const aData = (await aRes.json()) as any
        const topSong = aData?.songs?.data?.[0]
        if (topSong && topSong.id) {
          const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${topSong.id}`
          const dRes = await fetch(detailUrl, { signal: AbortSignal.timeout(3500) })
          if (dRes.ok) {
            const dData = (await dRes.json()) as any
            const item = dData[topSong.id]
            if (item && item.encrypted_media_url) {
              const stream = decryptJioSaavnStream(item.encrypted_media_url)
              if (stream) {
                const dur = parseInt(item.duration, 10) || 210
                return {
                  title: (item.song || topSong.title) as string,
                  artist: (item.primary_artists || topSong.description) as string,
                  audioUrl: stream,
                  artworkUrl: item.image ? (item.image as string).replace('150x150', '500x500') : undefined,
                  duration: dur,
                }
              }
            }
          }
        }
      }
    } catch (autoErr) {
      console.warn('[JioSaavn Autocomplete Failed]:', autoErr)
    }

    // 3. TERTIARY: Audius Global Music API (100% full-length un-truncated stream)
    try {
      const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(clean)}&app_name=ada_ai_full_music`
      const audRes = await fetch(audiusUrl, { signal: AbortSignal.timeout(4000) })
      if (audRes.ok) {
        const audData = (await audRes.json()) as any
        const t = audData?.data?.[0]
        if (t && t.id) {
          const streamUrl = `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=ada_ai_full_music`
          const dur = t.duration || 180
          return {
            title: t.title as string,
            artist: (t.user?.name || 'Artist') as string,
            audioUrl: streamUrl,
            artworkUrl: t.artwork?.['480x480'] || t.artwork?.['150x150'],
            duration: dur,
          }
        }
      }
    } catch (audErr) {
      console.warn('[Audius Search Failed]:', audErr)
    }

    // 4. QUATERNARY: iTunes Metadata Bridge -> JioSaavn Master Audio Resolver
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(clean)}&entity=song&limit=1`
      const iRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3500) })
      if (iRes.ok) {
        const iData = (await iRes.json()) as any
        if (iData && iData.results && iData.results.length > 0) {
          const item = iData.results[0]
          const canonicalQuery = `${item.trackName} ${item.artistName}`
          const bridgeUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=1&n=3&q=${encodeURIComponent(canonicalQuery)}`
          const bRes = await fetch(bridgeUrl, { signal: AbortSignal.timeout(3500) })
          if (bRes.ok) {
            const bData = (await bRes.json()) as any
            const topMatch = bData?.results?.[0]
            if (topMatch && topMatch.encrypted_media_url) {
              const stream = decryptJioSaavnStream(topMatch.encrypted_media_url)
              if (stream) {
                const dur = parseInt(topMatch.duration, 10) || Math.round(item.trackTimeMillis / 1000)
                return {
                  title: item.trackName as string,
                  artist: item.artistName as string,
                  audioUrl: stream,
                  artworkUrl: item.artworkUrl100 ? (item.artworkUrl100 as string).replace('100x100bb', '600x600bb') : undefined,
                  duration: dur,
                }
              }
            }
          }
        }
      }
    } catch (bridgeErr) {
      console.warn('[iTunes Bridge Search Failed]:', bridgeErr)
    }
  } catch (e) {
    console.warn('[Music Resolver Global Error]:', e)
  }
  return null
}
