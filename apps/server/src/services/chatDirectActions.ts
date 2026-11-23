import {
  type ChatMessage,
  type StructuredReply,
  MemeService,
  resolveSong,
  POPULAR_SONG_CATALOG,
} from '@ada/shared'
import { db } from '../db/index.js'
import { searchRealSongTrack } from './musicSearchService.js'
import { TutorStudyService } from './tutorStudyService.js'
import { TaskExecutionService } from './taskExecutionService.js'

export interface DirectActionResult {
  reply: StructuredReply
}

export async function handleDirectActions(
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
): Promise<DirectActionResult | null> {
  // 0. Explicit Task Execution (YouTube, Search, Open URL, Switch Character, Web Tasks)
  const taskResult = await TaskExecutionService.handleTaskIntent(userId, message, language, cleanMsg, character, context)
  if (taskResult) {
    return taskResult
  }
  // 1. Meme Engine Intent
  const isMemeQuery =
    /meme|funny dev|joke image|send meme|give me a meme|share a meme|meme me|show me a funny|make a meme/i.test(cleanMsg)

  if (isMemeQuery) {
    let matchedMeme = MemeService.getRandomMeme()
    const all = MemeService.getAllMemes()
    if (cleanMsg.includes('drake') || cleanMsg.includes('deploy') || cleanMsg.includes('git')) {
      matchedMeme = all.find((m) => m.templateId === 'drake') || matchedMeme
    } else if (cleanMsg.includes('framework') || cleanMsg.includes('distract') || cleanMsg.includes('new tech')) {
      matchedMeme = all.find((m) => m.templateId === 'db') || matchedMeme
    } else if (cleanMsg.includes('fine') || cleanMsg.includes('fire') || cleanMsg.includes('burn') || cleanMsg.includes('crash')) {
      matchedMeme = all.find((m) => m.templateId === 'fine') || matchedMeme
    } else if (cleanMsg.includes('pooh') || cleanMsg.includes('debug') || cleanMsg.includes('console.log')) {
      matchedMeme = all.find((m) => m.templateId === 'pooh') || matchedMeme
    } else if (cleanMsg.includes('roll') || cleanMsg.includes('safe') || cleanMsg.includes('smart') || cleanMsg.includes('brain')) {
      matchedMeme = all.find((m) => m.templateId === 'rollsafe') || matchedMeme
    } else if (cleanMsg.includes('fry') || cleanMsg.includes('test') || cleanMsg.includes('suspicio')) {
      matchedMeme = all.find((m) => m.templateId === 'fry') || matchedMeme
    } else if (cleanMsg.includes('typescript') || cleanMsg.includes('mind') || cleanMsg.includes('javascript') || cleanMsg.includes('ts')) {
      matchedMeme = all.find((m) => m.templateId === 'cmm') || matchedMeme
    } else if (cleanMsg.includes('doge') || cleanMsg.includes('ram') || cleanMsg.includes('memory') || cleanMsg.includes('moon')) {
      matchedMeme = all.find((m) => m.templateId === 'doge') || matchedMeme
    } else if (cleanMsg.includes('machine') || cleanMsg.includes('works on my') || cleanMsg.includes('spongebob')) {
      matchedMeme = all.find((m) => m.templateId === 'spongebob') || matchedMeme
    } else if (cleanMsg.includes('push') || cleanMsg.includes('debt') || cleanMsg.includes('patrick')) {
      matchedMeme = all.find((m) => m.templateId === 'patrick') || matchedMeme
    }

    const reply: StructuredReply = {
      speech: `Haha, check this one out! ${matchedMeme.title}. ${matchedMeme.punchline}`,
      display_text: `Here's a classic developer meme for you! 😂\n\n**${matchedMeme.title}**\n*${matchedMeme.punchline}*`,
      emotion: 'playful',
      intensity: 0.9,
      gesture: 'laugh',
      voice_style: { rate: 1.05, pitch: 1.05, style: 'playful' },
      meme: {
        template: matchedMeme.templateId,
        topText: matchedMeme.topText,
        bottomText: matchedMeme.bottomText,
        imageUrl: matchedMeme.imageUrl,
        title: matchedMeme.title,
        punchline: matchedMeme.punchline,
      },
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      meme: reply.meme,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)
    return { reply }
  }

  // 2. Music, Singing & Dancing Song Intent
  const isSongDanceQuery =
    !/rock[- ]paper[- ]scissors|play (?:a )?game|play riddle|play trivia/i.test(cleanMsg) &&
    (
      /^(?:ada,?\s*)?(?:mira,?\s*)?(?:atlas,?\s*)?(?:please\s*)?(?:play|sing|dance|music|song|paatu|paadu|podu)$/i.test(cleanMsg) ||
      /^(?:ada,?\s*)?(?:mira,?\s*)?(?:please\s*)?(?:play|sing|put on|listen to|perform)\b/i.test(cleanMsg) ||
      /\b(?:from|theme of|theme from|ost of|ost from|soundtrack of|soundtrack from)\s+(?:bleach|naruto|one piece|jujutsu|demon slayer|aot|attack on titan|death note|dragon ball|chainsaw|tokyo ghoul|anime|movie|marvel|iron man|godfather|interstellar)\b/i.test(cleanMsg) ||
      /\b(?:dancing song|dance song|sing a song|sing song|play song|play music|sing me a song|let'?s dance|dance for me|soundtrack|theme song|anime theme|bgm|karaoke|singing)\b/i.test(cleanMsg) ||
      /\b(?:number one(?: from bleach| bleach)?|aizen theme|treachery bleach|chala head chala|blue bird naruto|sadness and sorrow|gurenge|homura|unravel|shinzou wo sasageyo|silhouette naruto|hollow purple)\b/i.test(cleanMsg) ||
      /(?:oru\s+)?paat(?:u|tu)\s+(?:paadu|podu)|(?:tamil|hindi|english|malayalam|telugu|korean|japanese)\s+song|(?:paatu|paadu|podu)\b/i.test(cleanMsg) ||
      /\b(?:vaathi coming|shape of you|believer|levitating|kesariya|badass|arabic kuthu|aizen|treachery|jailer|starlight sparkle|cyber sunrise|focus in the rain)\b/i.test(cleanMsg)
    )

  if (isSongDanceQuery) {
    const isTamilRequest =
      language === 'ta' ||
      /\b(?:tamil|paatu|paattu|podu|paadu)\b/i.test(cleanMsg)
    const isMiku = character === 'mira' || character === 'miku' || /miku|vocaloid|leek/i.test(cleanMsg)
    const isStark = character === 'atlas'

    let song: any = null

    // 1. Check Authentic Catalog FIRST (Prioritizing Miku Master Anthems & Top Hits)
    const catalogCandidate = resolveSong(cleanMsg, isMiku ? 'mira' : character)
    if (catalogCandidate && catalogCandidate.audioUrl && (
      !catalogCandidate.id.startsWith('custom-song-') || isMiku
    )) {
      song = { ...catalogCandidate }
    }

    // 2. If not found in catalog, search real global streaming tracks (JioSaavn/Audius)
    if (!song) {
      const realTrack = await searchRealSongTrack(cleanMsg, language)
      if (realTrack && realTrack.audioUrl) {
        song = {
          id: `song-${Date.now()}`,
          title: realTrack.title,
          artist: realTrack.artist,
          audioUrl: realTrack.audioUrl,
          artworkUrl: realTrack.artworkUrl,
          danceAction: isMiku ? 'dance_cute_idol' : 'dance_pop_groove',
          bpm: 120,
          duration: realTrack.duration || 210,
        }
      } else {
        const fallback = POPULAR_SONG_CATALOG.find(
          (t) =>
            cleanMsg.includes(t.title.toLowerCase()) ||
            (t.artist && cleanMsg.includes(t.artist.toLowerCase())) ||
            (isTamilRequest && t.id === 'vaathi') ||
            (isMiku && t.id.startsWith('song-miku'))
        ) || (isMiku ? POPULAR_SONG_CATALOG.find((s) => s.id === 'song-miku-world-is-mine') : POPULAR_SONG_CATALOG[0])
        song = { ...fallback }
      }
    }

    const danceAction = song?.danceAction || (isMiku ? 'dance_cute_idol' : 'dance_pop_groove')
    const songTitle = song?.title || 'Selected Track'
    const artistName = song?.artist || (isMiku ? 'Hatsune Miku (初音ミク)' : 'Live Audio')

    let speech = isTamilRequest
      ? `நிச்சயமாக! ${songTitle} பாடலை உங்களுக்காகப் பாடி ஆடுகிறேன். ரசித்து மகிழுங்கள்!`
      : isMiku
      ? `Miku da yo~! Performing "${songTitle}" by ${artistName} for you right now! Let's sing and dance together~!`
      : isStark
      ? `Jarvis Trade AI audio telemetry online. Initiating acoustic playback for "${songTitle}" by ${artistName}.`
      : `I'd love to! Performing "${songTitle}" by ${artistName} for you right now. Watch this!`

    let displayText = isTamilRequest
      ? `🎶 **இப்போது இசைக்கப்படுகிறது & நடனம்:** **${songTitle}**\n🎤 கலைஞர்: ${artistName}\n\n*உங்களுக்காக பிரத்யேகமாக பாடி ஆடுகிறேன்!* ✨`
      : isMiku
      ? `🎶 **Now Performing:** **${songTitle}** by *${artistName}*\n\n🎤 *Virtual Pop Idol Hatsune Miku concert stage live in session... enjoy the show!* ✨`
      : isStark
      ? `🎶 **Now Performing:** **${songTitle}** by *${artistName}*\n\n⚡ *Jarvis acoustic telemetry engaged... playback active.*`
      : `🎶 **Now Performing:** **${songTitle}** by *${artistName}*\n\n💃 *Syncing 3D avatar animations and studio audio stream... enjoy the show!* ✨`

    const resolvedSpeaker: 'ada' | 'mira' | 'atlas' = isMiku ? 'mira' : isStark ? 'atlas' : 'ada'

    const reply: StructuredReply = {
      speaker: resolvedSpeaker,
      speech,
      display_text: displayText,
      emotion: isMiku ? 'excited' : 'playful',
      intensity: 0.95,
      gesture: isMiku ? 'wave' : 'celebrate',
      voice_style: { rate: isMiku ? 1.10 : 1.05, pitch: isMiku ? 1.35 : 1.05, style: isMiku ? 'cheerful' : 'playful' },
      musicTrack: song,
      actions: [
        {
          name: 'sing',
          arguments: {
            songId: song.id,
            dance: danceAction,
            title: song.title,
            artist: song.artist,
            audioUrl: song.audioUrl,
            artworkUrl: song.artworkUrl,
            song,
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
      musicTrack: reply.musicTrack,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)
    return { reply }
  }

  // 3. Study, Focus & Pomodoro Intent
  const focusIntent = TutorStudyService.detectFocusIntent(message)
  if (focusIntent.isFocus) {
    const isTanglish = language === 'tanglish' || /padikka|focus pannuvom|stress/i.test(cleanMsg)
    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message)

    const speech = isTamil
      ? `${focusIntent.minutes} நிமிட ஃபோகஸ் நேரத்தை தொடங்குகிறேன். உங்கள் கவனத்தை செலுத்துங்கள், நான் உங்களுடன் இருக்கிறேன்!`
      : isTanglish
        ? `${focusIntent.minutes} minutes Pomodoro focus timer set pannitten! Phone-ah silent-la pottutu, namma ${focusIntent.goal}-ah super-ah mudichidalaam!`
        : `Setting a ${focusIntent.minutes}-minute focus timer for ${focusIntent.goal}. Minimize all distractions, breathe, and let us conquer this deep work block together!`

    const displayText = isTamil
      ? `⏱️ **${focusIntent.minutes} நிமிட ஃபோகஸ் அமர்வு தொடங்கியது** 🎯\n\n- **இலக்கு:** ${focusIntent.goal}\n- **முறை:** பொமோடோரோ (Pomodoro Focus)\n- **அறிவுரை:** அனைத்து கவனச்சிதறல்களையும் தவிர்க்கவும்.\n\n*உங்கள் இலக்கை முடிக்க நான் முழுமையாக உங்களுடன் இருக்கிறேன்!* ✨`
      : isTanglish
        ? `⏱️ **${focusIntent.minutes}-Minute Pomodoro Study Sprint Active** 🎯\n\n- **Goal:** ${focusIntent.goal}\n- **Strategy:** 25m Focus + 5m Chill Break\n- **Tip:** Notifications mute pannunga, single task mattum execute pannuvom.\n\n*Kalakunga, namma finish pannidalaam!* ✨`
        : `⏱️ **${focusIntent.minutes}-Minute Deep Focus Sprint Active** 🎯\n\n- **Goal:** ${focusIntent.goal}\n- **Interval:** Pomodoro Block (${focusIntent.minutes}m deep work + 5m rest)\n- **Protocol:** Screen perimeter secured, zero multitasking.\n\n*You have got this, sweetheart. Let us build momentum!* 🚀`

    const reply: StructuredReply = {
      speech,
      display_text: displayText,
      emotion: 'motivated',
      intensity: 0.9,
      gesture: 'fist_pump',
      voice_style: { rate: 1.05, pitch: 1.05, style: 'authoritative' },
      studyFocus: {
        goal: focusIntent.goal,
        durationMinutes: focusIntent.minutes,
        remainingSeconds: focusIntent.minutes * 60,
        isActive: true,
        mode: 'pomodoro',
      },
      actions: [
        {
          name: 'pomodoro',
          arguments: {
            minutes: focusIntent.minutes,
            goal: focusIntent.goal,
          },
        },
      ],
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      studyFocus: reply.studyFocus,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)
    return { reply }
  }

  // 4. To-Do List & Reminder Intent
  const todoIntent = TutorStudyService.detectTodoIntent(message)
  if (todoIntent.isTodo) {
    const todoRes = TutorStudyService.handleTodoOperation(userId, todoIntent)
    const isTanglish = language === 'tanglish' || /add pannu|enna tasks|remind pannu/i.test(cleanMsg)
    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(message)

    let speech = todoRes.speech
    let displayText = todoRes.display_text

    if (isTamil && todoIntent.action === 'add') {
      speech = `உங்கள் நினைவூட்டல் பட்டியலில் சேர்த்துள்ளேன்: ${todoIntent.taskTitle}. நான் உங்களுக்கு நினைவூட்டுகிறேன்!`
      displayText = `📝 **நினைவூட்டல் சேர்க்கப்பட்டது:**\n- [ ] **${todoIntent.taskTitle}**\n\n*பட்டியலில் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.*`
    } else if (isTanglish && todoIntent.action === 'add') {
      speech = `To-do list-la add pannitten: ${todoIntent.taskTitle}! Correct time-ku ungalukku remind panren.`
      displayText = `📝 **To-Do & Reminder Added:**\n- [ ] **${todoIntent.taskTitle}**\n\n*Database-la save aayiduchi. Total active tasks: ${todoRes.cardData.pendingCount}.* ✨`
    }

    const reply: StructuredReply = {
      speech,
      display_text: displayText,
      emotion: 'happy',
      intensity: 0.85,
      gesture: 'nod',
      voice_style: { rate: 1.0, pitch: 1.02, style: 'cheerful' },
      todoCard: todoRes.cardData,
      actions: [
        {
          name: 'todo',
          arguments: {
            action: todoIntent.action,
            taskTitle: todoIntent.taskTitle,
            pendingCount: todoRes.cardData.pendingCount,
          },
        },
      ],
    }

    const assistantMsgObj: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: reply.display_text,
      speech: reply.speech,
      emotion: reply.emotion,
      gesture: reply.gesture,
      todoCard: reply.todoCard,
      timestamp: Date.now(),
    }
    db.addMessage(userId, assistantMsgObj)
    return { reply }
  }

  return null
}
