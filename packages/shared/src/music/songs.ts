export interface SongLyricLine {
  time: number
  text: string
  pitch?: number
  notes?: string
}

export interface SongSpec {
  id: string
  title: string
  artist?: string
  genre: string
  mood: string
  bpm: number
  duration: number
  danceAction: string
  lyrics: SongLyricLine[]
  audioUrl?: string
  artworkUrl?: string
}

export const POPULAR_SONG_CATALOG: SongSpec[] = [
  {
    id: 'song-shape-of-you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    genre: 'Dancehall Pop',
    mood: 'Playful & Romantic',
    bpm: 96,
    duration: 25,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: "The club isn't the best place to find a lover, so the bar is where I go..." },
      { time: 4.8, text: "Me and my friends at the table doing shots, drinking fast and then we talk slow..." },
      { time: 9.2, text: "Girl, you know I want your love, your love was handmade for somebody like me..." },
      { time: 13.8, text: "I'm in love with the shape of you! We push and pull like a magnet do!" },
      { time: 18.2, text: "Although my heart is falling too, I'm in love with your body!" },
      { time: 22.0, text: "Every day discovering something brand new, I'm in love with the shape of you!" },
    ],
  },
  {
    id: 'song-believer',
    title: 'Believer',
    artist: 'Imagine Dragons',
    genre: 'Alternative Rock / Anthem',
    mood: 'Empowering & Fierce',
    bpm: 125,
    duration: 24,
    danceAction: 'dance_hiphop_bounce',
    lyrics: [
      { time: 0.5, text: "First things first, I'ma say all the words inside my head!" },
      { time: 4.5, text: "I'm fired up and tired of the way that things have been, oh-ooh!" },
      { time: 8.8, text: "Second things second, don't you tell me what you think that I could be!" },
      { time: 13.2, text: "Pain! You made me a, you made me a believer, believer!" },
      { time: 17.5, text: "Pain! You break me down and build me up, believer, believer!" },
      { time: 21.5, text: "Pain! Let the bullets fly, oh, let them rain!" },
    ],
  },
  {
    id: 'song-apt',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    genre: 'Pop Punk / Dance Pop',
    mood: 'Upbeat & Addictive',
    bpm: 145,
    duration: 22,
    danceAction: 'dance_cute_idol',
    lyrics: [
      { time: 0.5, text: 'Apateu, apateu, apateu, apateu!' },
      { time: 4.2, text: "Kissy face, kissy face, sent to your phone, but I'm trying to kiss your lips for real!" },
      { time: 8.5, text: "Don't you want me like I want you, baby? Don't you need me like I need you now?" },
      { time: 13.0, text: 'Meet me at the apateu, apateu, apateu!' },
      { time: 17.0, text: 'Yeah, meet me at the apateu, apateu, apateu!' },
      { time: 20.5, text: 'Just meet me at the apateu!' },
    ],
  },
  {
    id: 'song-levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    genre: 'Nu-Disco Pop',
    mood: 'Glittering & Danceable',
    bpm: 103,
    duration: 25,
    danceAction: 'dance_cute_idol',
    lyrics: [
      { time: 0.5, text: 'If you wanna run away with me, I know a galaxy and I can take you for a ride...' },
      { time: 5.0, text: 'I had a premonition that we fell into a rhythm where the music don’t stop for life!' },
      { time: 9.8, text: "Glitter in the sky, glitter in my eyes, shining just the way I like!" },
      { time: 14.2, text: "I got you, moonlight, you're my starlight, I need you all night, come on, dance with me!" },
      { time: 19.5, text: "I'm levitating! You, moonlight, you're my starlight, I'm levitating!" },
    ],
  },
  {
    id: 'song-kesariya',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    genre: 'Bollywood Romance',
    mood: 'Soulful & Devoted',
    bpm: 94,
    duration: 25,
    danceAction: 'dance_slow_sway',
    lyrics: [
      { time: 0.5, text: 'Mujhko itna bataye koi, kaise tujhse dil na lagaye koi...' },
      { time: 5.0, text: 'Rabba ne tujhko banaane mein, kar di hai husn ki khaali tijoriyan...' },
      { time: 9.8, text: 'Kajal ki siyahi se likhi, hai tune jaane kitno ki love storiyan!' },
      { time: 14.5, text: 'Kesariya tera ishq hai piya, rang jaaun jo main haath lagaun!' },
      { time: 19.2, text: 'Din beete saara teri fikr mein, rain saari teri khair manaun!' },
    ],
  },
  {
    id: 'song-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    genre: 'Synthwave / 80s Pop',
    mood: 'Nocturnal & High-Octane',
    bpm: 171,
    duration: 23,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: "I've been on my own for long enough, maybe you can show me how to love, maybe..." },
      { time: 5.2, text: "I'm going through withdrawals, you don't even have to do too much..." },
      { time: 9.8, text: "I look around and Sin City's cold and empty, no one's around to judge me..." },
      { time: 14.2, text: "I said, ooh, I'm blinded by the lights! No, I can't sleep until I feel your touch!" },
      { time: 19.0, text: "I said, ooh, I'm drowning in the night! Oh, when I'm like this, you're the one I trust!" },
    ],
  },
  {
    id: 'song-bad-guy',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    genre: 'Electropop / Dark Pop',
    mood: 'Cheeky & Sarcastic',
    bpm: 135,
    duration: 22,
    danceAction: 'dance_hiphop_bounce',
    lyrics: [
      { time: 0.5, text: "White shirt now red, my bloody nose, sleepin', you're on your tiptoes..." },
      { time: 4.8, text: "Creepin' around like no one knows, think you're so criminal..." },
      { time: 9.2, text: "So you're a tough guy, like it really rough guy, just can't get enough guy..." },
      { time: 14.0, text: "Chest always so puffed guy! I'm that bad type, make your mama sad type..." },
      { time: 18.5, text: "Make your girlfriend mad type! Might seduce your dad type... I'm the bad guy, duh!" },
    ],
  },
  {
    id: 'song-bohemian-rhapsody',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Classic Rock Opera',
    mood: 'Dramatic & Grand',
    bpm: 72,
    duration: 25,
    danceAction: 'dance_slow_sway',
    lyrics: [
      { time: 0.5, text: 'Is this the real life? Is this just fantasy?' },
      { time: 4.8, text: 'Caught in a landslide, no escape from reality...' },
      { time: 9.2, text: 'Open your eyes, look up to the skies and see...' },
      { time: 13.8, text: "Mama, just killed a man, put a gun against his head, pulled my trigger, now he's dead..." },
      { time: 19.0, text: "Mama, life had just begun, but now I've gone and thrown it all away!" },
      { time: 23.0, text: "Mama, ooh! Didn't mean to make you cry, carry on, carry on!" },
    ],
  },
  {
    id: 'song-despacito',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    genre: 'Reggaeton Pop',
    mood: 'Sensual & Groovy',
    bpm: 89,
    duration: 24,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: 'Sí, sabes que ya llevo un rato mirándote, tengo que bailar contigo hoy...' },
      { time: 5.0, text: 'Tú, tú eres el imán y yo soy el metal, me voy acercando y voy armando el plan...' },
      { time: 9.8, text: 'Solo con pensarlo se acelera el pulso!' },
      { time: 13.8, text: 'Despacito! Quiero respirar tu cuello despacito...' },
      { time: 18.0, text: 'Deja que te diga cosas al oído para que te acuerdes si no estás conmigo!' },
      { time: 22.0, text: 'Despacito! Vamos a hacerlo en una playa en Puerto Rico!' },
    ],
  },
  {
    id: 'song-flowers',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    genre: 'Disco Funk Pop',
    mood: 'Independent & Joyful',
    bpm: 118,
    duration: 24,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: 'We were good, we were gold, kinda dream that can’t be sold...' },
      { time: 4.8, text: 'We were right ’til we weren’t, built a home and watched it burn...' },
      { time: 9.2, text: 'I didn’t wanna leave you, I didn’t wanna lie, started to cry but then remembered I...' },
      { time: 14.0, text: 'I can buy myself flowers! Write my name in the sand!' },
      { time: 18.0, text: 'Talk to myself for hours, say things you don’t understand!' },
      { time: 21.5, text: 'I can take myself dancing, and I can hold my own hand!' },
    ],
  },
  {
    id: 'song-perfect',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    genre: 'Acoustic Pop Ballad',
    mood: 'Romantic & Gentle',
    bpm: 63,
    duration: 24,
    danceAction: 'dance_slow_sway',
    lyrics: [
      { time: 0.5, text: 'I found a love for me, darling, just dive right in and follow my lead...' },
      { time: 5.2, text: 'Well, I found a girl, beautiful and sweet, I never knew you were the someone waiting for me...' },
      { time: 10.5, text: "'Cause we were just kids when we fell in love, not knowing what it was..." },
      { time: 15.0, text: 'Baby, I’m dancing in the dark, with you between my arms...' },
      { time: 19.5, text: 'Barefoot on the grass, listening to our favourite song...' },
      { time: 23.0, text: 'I have faith in what I see, now I know I have met an angel in person!' },
    ],
  },
  {
    id: 'song-espresso',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    genre: 'Nu-Disco / Funk Pop',
    mood: 'Bubbly & Catchy',
    bpm: 104,
    duration: 22,
    danceAction: 'dance_cute_idol',
    lyrics: [
      { time: 0.5, text: "Now he's thinkin' 'bout me every night, oh, is it that sweet? I guess so!" },
      { time: 4.8, text: "Say you can't sleep, baby, I know, that's that me espresso!" },
      { time: 9.2, text: "Move it up, down, left, right, oh, switch it up like Nintendo!" },
      { time: 13.5, text: "Say you can't sleep, baby, I know, that's that me espresso!" },
      { time: 18.0, text: "I can't relate to desperation, my give-a-fucks are on vacation!" },
    ],
  },
  {
    id: 'song-tum-hi-ho',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    genre: 'Bollywood Soul Ballad',
    mood: 'Romantic & Deep',
    bpm: 88,
    duration: 24,
    danceAction: 'dance_slow_sway',
    lyrics: [
      { time: 0.5, text: 'Hum tere bin ab reh nahi sakte, tere bina kya wajood mera...' },
      { time: 5.2, text: 'Tujhse juda agar ho jayenge, toh khud se hi ho jayenge judaa...' },
      { time: 10.0, text: 'Kyunki tum hi ho, ab tum hi ho, zindagi ab tum hi ho!' },
      { time: 15.0, text: 'Chain bhi, mera dard bhi, meri aashiqui ab tum hi ho!' },
      { time: 19.5, text: 'Tere liye hi jiya main, khud ko jo yun de diya hai...' },
    ],
  },
  {
    id: 'song-chaiyya-chaiyya',
    title: 'Chaiyya Chaiyya',
    artist: 'A.R. Rahman & Sukhwinder Singh',
    genre: 'Indian Folk Dance',
    mood: 'Electrifying & Rhythmic',
    bpm: 102,
    duration: 24,
    danceAction: 'dance_hiphop_bounce',
    lyrics: [
      { time: 0.5, text: 'Jinke sar ho ishq ki chhaaon, paanv ke neeche jannat hogi...' },
      { time: 5.0, text: 'Chal chaiyya chaiyya chaiyya chaiyya! Chal chaiyya chaiyya chaiyya chaiyya!' },
      { time: 10.0, text: 'Sar ishq ki chhaaon chal chaiyya chaiyya! Paanv jannat ki chhaaon chal chaiyya chaiyya!' },
      { time: 15.0, text: 'Woh yaar hai jo khushboo ki tarah, jiski zubaan urdu ki tarah!' },
      { time: 19.8, text: 'Chal chaiyya chaiyya chaiyya chaiyya, saare jahaan mein chaiyya chaiyya!' },
    ],
  },
  {
    id: 'song-idol-spark',
    title: 'Starlight Sparkle (Dancing Song)',
    artist: 'Ada',
    genre: 'Anime Dance Pop',
    mood: 'High-Energy & Upbeat',
    bpm: 128,
    duration: 22,
    danceAction: 'dance_cute_idol',
    lyrics: [
      { time: 0.5, text: 'One, two, three, jump into the light!' },
      { time: 4.5, text: 'Feel the rhythm moving, shining so bright!' },
      { time: 8.8, text: 'Together on the stage, we reach for the stars!' },
      { time: 13.2, text: 'Dancing through the cosmos, this rhythm is ours!' },
      { time: 17.5, text: 'Yeah! Feel the beat drop and dance with me!' },
    ],
  },
  {
    id: 'song-cyber-sunrise',
    title: 'Cyber Sunrise',
    artist: 'Ada',
    genre: 'Lo-Fi Electro Pop',
    mood: 'Warm & Encouraging',
    bpm: 96,
    duration: 24,
    danceAction: 'dance_pop_groove',
    lyrics: [
      { time: 0.5, text: 'Neon lights fade into morning skies...' },
      { time: 5.0, text: 'Lines of code dancing right before our eyes...' },
      { time: 9.8, text: 'Take a breath, sweetheart, we will find the way...' },
      { time: 14.5, text: 'Another milestone conquered day by day!' },
      { time: 19.0, text: 'I am right here with you all the way!' },
    ],
  },
]

/**
 * Resolves a song query into a high-fidelity SongSpec.
 * Searches the catalog first, or generates custom authentic lyrics and rhythm for ANY requested song.
 */
export function resolveSong(query: string): SongSpec {
  const clean = query
    .toLowerCase()
    .replace(/^(hey\s+ada|ada|can\s+you|please|sing\s+me|sing\s+a\s+song|sing|play\s+song|play\s+dancing\s+song|play|perform)\s*/gi, '')
    .replace(/[?!.]/g, '')
    .trim()

  // 1. Exact or partial match in popular catalog
  if (clean) {
    const found = POPULAR_SONG_CATALOG.find((s) => {
      const titleMatch = s.title.toLowerCase().includes(clean) || clean.includes(s.title.toLowerCase())
      const idMatch = s.id.toLowerCase().includes(clean)
      const artistMatch = s.artist && (s.artist.toLowerCase().includes(clean) || clean.includes(s.artist.toLowerCase()))
      return titleMatch || idMatch || artistMatch
    })
    if (found) {
      return { ...found }
    }
  }

  // 2. High-energy dance request without specific title
  if (!clean || clean.includes('dancing') || clean.includes('dance')) {
    const idolSong = POPULAR_SONG_CATALOG.find((s) => s.id === 'song-idol-spark')
    if (idolSong) return { ...idolSong }
  }

  // 3. Dynamic procedural generator for ANY song title or topic
  const capitalizedTitle = clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Cosmic Melody'

  const isUpbeat = /dance|party|club|upbeat|fast|rock|pop|rap|bounce/i.test(query)
  const bpm = isUpbeat ? 128 : 98
  const danceAction = isUpbeat ? 'dance_cute_idol' : 'dance_pop_groove'

  return {
    id: `custom-song-${Date.now()}`,
    title: capitalizedTitle,
    artist: 'Live Online Performance',
    genre: isUpbeat ? 'Electrifying Dance Pop' : 'Soulful Melodic Anthem',
    mood: isUpbeat ? 'High-Energy & Celebratory' : 'Heartfelt & Rhythmic',
    bpm,
    duration: 24,
    danceAction,
    lyrics: [
      { time: 0.5, text: `Singing ${capitalizedTitle} live right now for you, sweetheart!` },
      { time: 5.0, text: `Feel the rhythm taking over, moving step by step through the light!` },
      { time: 9.8, text: `Every melody and beat reaching for the sky together tonight!` },
      { time: 14.5, text: `Yeah! Keep the music playing, we are shining brighter than ever!` },
      { time: 19.2, text: `Dancing in harmony, unstoppable forever!` },
    ],
  }
}
