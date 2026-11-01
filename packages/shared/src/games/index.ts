export interface GameState {
  activeGame: 'rps' | 'trivia' | 'would_you_rather' | 'riddles' | 'word_chain' | 'twenty_questions' | 'truth_or_dare' | 'guess_meme' | null
  userScore: number
  adaScore: number
  round: number
  currentQuestion?: string
  options?: string[]
  expectedAnswer?: string
  hint?: string
}

export const TRIVIA_QUESTIONS = [
  { q: "What's the only mammal capable of true flight?", a: "Bat", options: ["Bat", "Flying Squirrel", "Sugar Glider", "Colugo"] },
  { q: "Which planet in our solar system spins clockwise (retrograde)?", a: "Venus", options: ["Mars", "Venus", "Jupiter", "Neptune"] },
  { q: "In computer science, what does 'HTTP' stand for?", a: "Hypertext Transfer Protocol", options: ["Hypertext Transfer Protocol", "High Text Transmission Process", "Hyperlink Transit Program", "Host Terminal Telephony Protocol"] },
  { q: "What is the capital city of Australia?", a: "Canberra", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"] },
  { q: "Which programming language was originally called 'Oak'?", a: "Java", options: ["Python", "Java", "C++", "Ruby"] },
]

export const RIDDLES = [
  { q: "I have branches, but no fruit, trunk or leaves. What am I?", a: "Bank", hint: "Think finance!" },
  { q: "What can travel all around the world while staying in a corner?", a: "Stamp", hint: "It belongs on an envelope." },
  { q: "The more of me you take, the more you leave behind. What am I?", a: "Footsteps", hint: "Look at your path." },
  { q: "What has keys, but no locks; space, but no room; you can enter, but never go in?", a: "Keyboard", hint: "You're typing on it right now!" },
]

export const WOULD_YOU_RATHER = [
  "Would you rather have the ability to teleport anywhere instantly, or pause time for 10 minutes once a day?",
  "Would you rather live without music or live without movies/video games?",
  "Would you rather code only in Assembly for a year, or debug legacy PHP code forever?",
  "Would you rather explore the deepest depths of the ocean or travel to the edge of the galaxy?",
  "Would you rather have Ada design your entire wardrobe, or pick your vacation destination?",
]

export class MiniGameEngine {
  static playRockPaperScissors(userMove: 'rock' | 'paper' | 'scissors'): {
    adaMove: 'rock' | 'paper' | 'scissors'
    result: 'win' | 'lose' | 'draw'
    speech: string
    gesture: string
  } {
    const moves: Array<'rock' | 'paper' | 'scissors'> = ['rock', 'paper', 'scissors']
    const adaMove = moves[Math.floor(Math.random() * moves.length)]

    if (userMove === adaMove) {
      return {
        adaMove,
        result: 'draw',
        speech: `I threw ${adaMove} too! Great minds think alike — let's go again!`,
        gesture: 'shrug',
      }
    }

    const winsOver: Record<string, string> = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    }

    if (winsOver[userMove] === adaMove) {
      return {
        adaMove,
        result: 'win',
        speech: `No way! Your ${userMove} beats my ${adaMove}! You win this round, fair and square! 🎉`,
        gesture: 'celebrate',
      }
    } else {
      return {
        adaMove,
        result: 'lose',
        speech: `Haha! My ${adaMove} beats your ${userMove}! Ada takes the point this time! 😏`,
        gesture: 'peace_sign',
      }
    }
  }
}
