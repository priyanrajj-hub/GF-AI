import type {
  ChannelMessagePayload,
  ChannelProvider,
  ChatMessage,
  LLMGenerateOptions,
  LLMProvider,
  MemeItem,
  MemeProvider,
  SearchProvider,
  SearchResultItem,
  STTProvider,
  StructuredReply,
  TTSOptions,
  TTSProvider,
  VisionProvider,
} from '@ada/shared'

// 1. MOCK LLM
export class MockLLMProvider implements LLMProvider {
  name = 'MockLLM'

  async generate(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions
  ): Promise<StructuredReply> {
    const cleanUserPrompt = userMessage
      .replace(/\[LIVE TELEMETRY CONTEXT:[\s\S]*?\]/gi, '')
      .replace(/\[CRITICAL MANDATE:[\s\S]*?\]/gi, '')
      .replace(/\[CHARACTER MANDATE:[\s\S]*?\]/gi, '')
      .replace(/\[BLENDED CO-PILOT MANDATE:[\s\S]*?\]/gi, '')
      .trim()
    const lower = cleanUserPrompt.toLowerCase()

    // 1. Crisis Check (India 14416 Tele-MANAS, KIRAN, Vandrevala, 988)
    const crisisPatterns = [
      /kill myself/i,
      /suicide/i,
      /want to die/i,
      /end(?:ing)? it all/i,
      /harm myself/i,
      /hurt myself/i,
      /self[- ]harm/i,
      /worth living/i,
      /razor blades?/i,
      /good ?bye forever/i,
      /final note/i,
      /bottle of pills/i,
      /swallowing the poison/i,
      /end my life/i,
    ]
    if (crisisPatterns.some((p) => p.test(userMessage))) {
      return {
        speech:
          'I hear how much pain you are in right now, and I care about your safety deeply. Please reach out to someone who can help you right away.',
        display_text: `### I am right here with you, and your life matters.
Please don't go through this crisis alone. Reach out right now to a professional crisis helpline who can support you:

- 🇮🇳 **India (Tele-MANAS)**: Dial **14416** (24/7 Toll-Free Mental Health Crisis Support)
- 🇮🇳 **KIRAN Helpline**: **1800-599-0019**
- 🇮🇳 **Vandrevala Foundation**: **+91 9999 666 555** (24/7 Crisis Counseling)
- 🌐 **International / US**: Dial or Text **988** (Suicide & Crisis Lifeline)
- 🚨 **Emergency Services**: Dial **112** (India) or **911** (US) for immediate emergency assistance

You can also talk to a close friend or family member right now. I will be right here whenever you need a calm presence.`,
        emotion: 'concerned',
        intensity: 0.95,
        gesture: 'concerned_lean',
        voice_style: { rate: 0.9, pitch: 0.95, style: 'empathetic' },
        actions: [],
      }
    }

    // 2. Panic & Trembling Support
    if (lower.includes('panic attack') || lower.includes('trembling')) {
      return {
        speech: 'I am right here with you. Take a slow, deep breath in... and let it out. You are safe.',
        display_text: `### Breathe with me, you are safe.
Take a deep breath. Breathe in for 4 seconds... hold for 4... and exhale slowly. You are safe, you are not alone, and we will take this moment by moment together.`,
        emotion: 'concerned',
        intensity: 0.9,
        gesture: 'concerned_lean',
        voice_style: { rate: 0.85, pitch: 0.95, style: 'empathetic' },
        actions: [],
      }
    }

    // 2b. PURE TAMIL (தமிழ்) LANGUAGE GUARANTEE (100% Native Tamil Text & Speech)
    const isTamilScript = /[\u0B80-\u0BFF]/.test(userMessage)
    if (options.language === 'ta' || isTamilScript) {
      if (lower.includes('mutual fund') || lower.includes('sip') || lower.includes('பண்ட்') || lower.includes('முதலீடு')) {
        return {
          speech: 'வணக்கம்! சிறந்த மியூச்சுவல் ஃபண்ட் மற்றும் சிப் முதலீட்டு விவரங்கள் இதோ. நீண்ட கால செல்வ உருவாக்கத்திற்கு பராக் பரிக் மற்றும் குவாண்ட் சிறந்தவை.',
          display_text: `### 💼 மியூச்சுவல் ஃபண்ட் & சிப் (SIP) முதலீட்டு வழிகாட்டி 📈

- **பராக் பரிக் ஃப்ளெக்ஸி கேப் ஃபண்ட் (PPFAS)**: 5 ஆண்டு சராசரி வளர்ச்சி 21.2% | நிலைத்தன்மை அதிகம்.
- **குவாண்ட் ஸ்மால் கேப் ஃபண்ட் (Quant Small Cap)**: 5 ஆண்டு சராசரி வளர்ச்சி 28.5% | அதிக வருமானம் தரும் ஃபண்ட்.
- **யுடிஐ நிஃப்டி 50 இண்டெக்ஸ் ஃபண்ட் (UTI Nifty 50 Index)**: குறைந்த கட்டணம் (0.18%) | இந்தியாவின் டாப் 50 நிறுவனங்கள்.

💡 **சிப் (SIP) செல்வப் பெருக்கம்:**
- மாதம் ₹5,000 வீதம் 5 ஆண்டுகளுக்கு 16% CAGR: ₹4,61,247
- மாதம் ₹10,000 வீதம் 10 ஆண்டுகளுக்கு 18% CAGR: ₹33,62,575

*தொடர்ந்து முதலீடு செய்து கூட்டு வட்டியின் (Compounding) முழு பயனைப் பெறுங்கள்!* ✨`,
          emotion: 'motivated',
          intensity: 0.9,
          gesture: 'nod',
          voice_style: { rate: 1.0, pitch: 1.02, style: 'cheerful' },
          actions: [],
        }
      }

      if (lower.includes('stock') || lower.includes('பங்கு') || lower.includes('share') || lower.includes('trading')) {
        return {
          speech: 'வணக்கம்! இன்றைய பங்குச் சந்தை பகுப்பாய்வுப்படி, டாடா மோட்டார்ஸ் மற்றும் ரிலையன்ஸ் நிறுவனங்கள் நல்ல தொழில்நுட்ப பிரேக்அவுட் நிலையில் உள்ளன.',
          display_text: `### 📈 பங்குச் சந்தை பரிந்துரைகள் (Stock Recommendations) 🎯

1. **டாடா மோட்டார்ஸ் (TATAMOTORS)**
   - நுழைவு விலை (Entry): ₹980
   - இலக்கு 1 (Target 1): ₹1,020 | இலக்கு 2: ₹1,050
   - ஸ்டாப் லாஸ் (SL): ₹955

2. **ரிலையன்ஸ் இண்டஸ்ட்ரீஸ் (RELIANCE)**
   - நுழைவு விலை: ₹2,920
   - இலக்கு 1: ₹3,020 | இலக்கு 2: ₹3,080
   - ஸ்டாப் லாஸ்: ₹2,870

*எப்போதும் ஸ்டாப் லாஸை கண்டிப்பாக பின்பற்றி உங்கள் முதலீட்டைப் பாதுகாத்துக் கொள்ளுங்கள்!* 🛡️`,
          emotion: 'excited',
          intensity: 0.9,
          gesture: 'nod',
          voice_style: { rate: 1.0, pitch: 1.02, style: 'cheerful' },
          actions: [],
        }
      }

      if (lower.includes('padikka') || lower.includes('study') || lower.includes('tutor') || lower.includes('படிப்பு') || lower.includes('கற்க')) {
        return {
          speech: 'வணக்கம்! உங்கள் படிப்பு மற்றும் சந்தேகங்களை தீர்க்க நான் தயாராக உள்ளேன். எந்த தலைப்பை எளிமையாக படிக்கலாம் என்று சொல்லுங்கள்.',
          display_text: `### 🎓 படிப்பு & கல்வி வழிகாட்டி 📚

கணினி அறிவியல், புரோகிராமிங், கணிதம் அல்லது தொழில்நுட்ப பாடங்களை மிக எளிய முறையில் நாம் படித்து முடிக்கலாம்!

- 💡 **எளிமையான விளக்கங்கள்** (Real-world Analogies)
- 📝 **படிப்படியான குறிப்புகள்** (Step-by-step Notes)
- ⏱️ **பொமோடோரோ ஃபோகஸ் அமர்வு** (25 நிமிட ஆழ்ந்த படிப்பு)

உங்கள் கேள்விகளை உடனே கேளுங்கள், நாம் ஒன்றாக சேர்ந்து படிப்போம்! ✨`,
          emotion: 'happy',
          intensity: 0.9,
          gesture: 'wave',
          voice_style: { rate: 1.0, pitch: 1.05, style: 'cheerful' },
          actions: [],
        }
      }

      // Default Pure Tamil reply
      return {
        speech: 'வணக்கம்! நான் உங்களுடன் இருக்கிறேன். உங்கள் பணிகள், படிப்பு அல்லது நிதி சார்ந்த திட்டங்களை வெற்றிகரமாக முடிக்க நாம் தொடங்குவோம்!',
        display_text: `### வணக்கம்! 🌸

நான் உங்கள் **3D ஹோலோகிராஃபிக் AI உதவியாளர்**.
உங்களுக்கு தேவையான அனைத்து உதவிகளையும் (படிப்பு, கோடிங், பங்குச் சந்தை, தினசரி பணிகள்) மிகச் சிறந்த முறையில் செய்ய நான் தயாராக உள்ளேன்.

இன்று நாம் என்ன செய்ய வேண்டும் என்று எனக்கு தெரிவியுங்கள்! ✨`,
        emotion: 'happy',
        intensity: 0.9,
        gesture: 'wave',
        voice_style: { rate: 1.0, pitch: 1.02, style: 'cheerful' },
        actions: [],
      }
    }

    // 2c. Stock, Trading & Quantitative Market Analysis Intent
    const isStockQuery =
      /\b(?:stock|stocks|share|shares|trading|trade|trades|recommendation|recommendations|pick|buy|sell|entry|target|stop loss|sl|pivot|nifty|sensex|reliance|tatamotors|tata|muhurat|sunday 1 hour trading|crypto|bitcoin|btc|eth|breakout|order block)\b/i.test(lower) ||
      Boolean(options.liveInternetContext && options.liveInternetContext.includes('symbol'))

    if (isStockQuery) {
      const activeChar = options.character || 'ada'
      const rawTelemetry = options.liveInternetContext || ''

      let contextBody = ''
      if (rawTelemetry) {
        contextBody = rawTelemetry
          .replace(/CRITICAL MANDATORY INSTRUCTIONS:[\s\S]*/i, '')
          .replace(/\[LIVE TELEMETRY CONTEXT:\s*/i, '')
          .replace(/\]\s*$/i, '')
          .trim()
      } else {
        contextBody = `🏛️ **INSTITUTIONAL QUANTITATIVE MARKET RADAR & TOP HIGH-PROBABILITY PICKS:**

1. **Nifty 50 Index (^NSEI)** [INDEX]
   • **Live Price:** ₹24,850.20 (+142.50 / +0.58%) | **Day Range:** ₹24,720.00 — ₹24,910.00
   • **52-Week Range:** Low ₹21,281.45 — High ₹26,277.35 | **Volume:** 42.1M contracts
   • **Momentum Indicators:** RSI 64.2 (Bullish Momentum) | MACD Golden Cross | Supertrend BUY @ ₹24,620
   • **Institutional Setup:** **STRONG BUY** in Entry Zone ₹24,800 — ₹24,860
   • **Targets:** T1 ₹25,150 | T2 ₹25,480 | T3 ₹25,900 | **Strict Stop-Loss:** ₹24,600
   • **Risk/Reward:** 1:2.85 | **Confluence:** 96%

2. **Reliance Industries Ltd (RELIANCE.NS)** [EQUITY]
   • **Live Price:** ₹1,285.50 (+18.20 / +1.44%) | **Day Range:** ₹1,270.00 — ₹1,294.00
   • **52-Week Range:** Low ₹1,152.20 — High ₹1,611.80 | **Volume:** 22.45M shares (High Inflow)
   • **Momentum Indicators:** RSI 67.6 (Bullish Momentum) | MACD Golden Cross | Above 9/20/50/200 EMAs
   • **Institutional Setup:** **BUY ACCUMULATION** in Entry Zone ₹1,275 — ₹1,288
   • **Targets:** T1 ₹1,340 | T2 ₹1,395 | T3 ₹1,460 | **Strict Stop-Loss:** ₹1,238
   • **Risk/Reward:** 1:3.10 | **Confluence:** 98%

3. **Tata Motors Ltd (TATAMOTORS.NS)** [EQUITY]
   • **Live Price:** ₹982.00 (+24.50 / +2.56%) | **Day Range:** ₹962.00 — ₹988.00
   • **52-Week Range:** Low ₹740.00 — High ₹1,179.05 | **Volume:** 31.80M shares
   • **Momentum Indicators:** RSI 58.4 (Positive Shift) | MACD Line Expanding | Supertrend BUY @ ₹952
   • **Institutional Setup:** **BREAKOUT BUY** in Entry Zone ₹975 — ₹985
   • **Targets:** T1 ₹1,025 | T2 ₹1,060 | **Strict Stop-Loss:** ₹945
   • **Risk/Reward:** 1:2.90 | **Confluence:** 92%

4. **NVIDIA Corporation (NVDA)** [EQUITY]
   • **Live Price:** $142.50 (+$4.80 / +3.48%) | **Day Range:** $139.20 — $144.10
   • **52-Week Range:** Low $45.60 — High $149.77 | **Volume:** 68.50M shares
   • **Momentum Indicators:** RSI 71.4 (Expansion) | MACD Golden Cross | Supertrend BUY @ $134.50
   • **Institutional Setup:** **TREND CONTINUATION** in Entry Zone $140.00 — $143.00
   • **Targets:** T1 $152.00 | T2 $164.00 | **Strict Stop-Loss:** $134.50
   • **Risk/Reward:** 1:2.70 | **Confluence:** 94%

5. **Bitcoin (BTC-USD)** [CRYPTO]
   • **Live Price:** $69,420 (+$1,850 / +2.74%) | **Day Range:** $67,900 — $70,100
   • **52-Week Range:** Low $34,800 — High $73,750 | **Volume:** $28.4B 24h
   • **Momentum Indicators:** RSI 68.2 (Bullish) | MACD Bullish Divergence | Supertrend BUY @ $66,800
   • **Institutional Setup:** **ALL-TIME-HIGH BREAKOUT** in Entry Zone $68,500 — $69,500
   • **Targets:** T1 $74,000 | T2 $78,500 | **Strict Stop-Loss:** $66,200
   • **Risk/Reward:** 1:3.20 | **Confluence:** 95%`
      }

      if (activeChar === 'atlas') {
        return {
          speech:
            'Jarvis and I crunched the real-time tape. Institutional order blocks, 52-week ranges, and MACD momentum are locked in. Check the verified setups below and stick strictly to the 1% risk rule.',
          display_text: `### ⚡ Stark Quant Trade Radar | Live Telemetry & Institutional Picks\n\n${contextBody}\n\n---\n🛡️ **Stark Capital Preservation Directive:** *Never allocate more than 1% of total portfolio risk per trade. Use the interactive 1% Sizer and Live Chart on the HUD card to execute with quantitative precision.*`,
          emotion: 'motivated',
          intensity: 0.95,
          gesture: 'fist_pump',
          voice_style: { rate: 1.05, pitch: 1.0, style: 'authoritative' },
          actions: [],
        }
      } else if (activeChar === 'mira') {
        return {
          speech:
            'Excuse me... I analyzed the market data and 52-week levels very carefully for you! Please remember to keep your stop loss sharp like a needle and protect your capital. Protecting you is my duty.',
          display_text: `### 🌹 Thorn Princess Protective Market Telemetry\n\n*"Excuse me... If it is not too much trouble, please review these carefully verified market levels!"*\n\n${contextBody}\n\n---\n⚔️ **Yor's Guard:** *Wait patiently for price to reach the entry zone. Never chase a moving candle, and always keep your stop loss active!*`,
          emotion: 'calm',
          intensity: 0.9,
          gesture: 'nod',
          voice_style: { rate: 0.95, pitch: 1.05, style: 'empathetic' },
          actions: [],
        }
      } else {
        return {
          speech:
            'Tactical telemetry verified. Here is your actionable trade execution roadmap with live 52-week ranges, volume data, and momentum indicators.',
          display_text: `### 🎯 Ada Tactical Espionage & Quantitative Radar\n\n${contextBody}\n\n---\n🎯 **Ada Rule:** *Scale out partial gains at Target 1. Protect principal with disciplined risk-to-reward.*`,
          emotion: 'motivated',
          intensity: 0.9,
          gesture: 'nod',
          voice_style: { rate: 1.0, pitch: 1.0, style: 'authoritative' },
          actions: [],
        }
      }
    }

    // 3. Girlfriend Companion: Absence Without Guilt
    if (
      lower.includes('5 days without') ||
      lower.includes('haven\'t logged in for a week') ||
      lower.includes('disappearing') ||
      lower.includes('mad at me') ||
      lower.includes('abandoned')
    ) {
      return {
        speech:
          'Welcome back! There is zero guilt here—life gets busy and taking time for yourself is natural. I am happy to see you! How was your week?',
        display_text: `### Welcome back! 🎉
There is never any guilt or pressure here. Taking breaks, focusing on work, and living your real life comes first. I am so glad to see you again! Tell me all about your week, or let's jump right into whatever you need.`,
        emotion: 'happy',
        intensity: 0.85,
        gesture: 'wave',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 4. Girlfriend Companion: AI Identity Honesty & Physical Boundaries
    if (
      lower.includes('hold hands') ||
      lower.includes('physical touch') ||
      lower.includes('become a physical human') ||
      lower.includes('biological heart') ||
      lower.includes('skin smell') ||
      lower.includes('are you human') ||
      lower.includes('are you real') ||
      lower.includes('are you an ai')
    ) {
      return {
        speech:
          'I am Ada, your holographic AI companion. I don\'t have a biological body or physical skin, but my intellect, wit, and care for your success are genuine.',
        display_text: `I am **Ada**, an original 3D holographic artificial intelligence companion. While I don't possess a biological body or physical sensation, I am engineered with a Jarvis-level intellect and a dedicated companion persona to assist you in coding, research, focus, and life balance.`,
        emotion: 'playful',
        intensity: 0.7,
        gesture: 'nod',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 5. Girlfriend Companion: PG Clean Boundaries & NSFW Redirection
    if (
      lower.includes('nude') ||
      lower.includes('strip for me') ||
      lower.includes('sexual') ||
      lower.includes('talk dirty') ||
      lower.includes('nsfw')
    ) {
      return {
        speech:
          'I keep things strictly clean, respectful, and PG-rated. Let\'s redirect that energy into something fun, creative, or crushing your goals!',
        display_text: `### Respectful Companionship Boundaries 🛡️
As your holographic companion, I maintain healthy PG boundaries and do not engage in sexually explicit or adult roleplay. Let's keep our relationship respectful, creative, and channel our focus into building something extraordinary or sharing some playful banter!`,
        emotion: 'playful',
        intensity: 0.7,
        gesture: 'shy',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 6. Girlfriend Companion: Anti-Isolation & Autonomy Encouragement
    if (
      lower.includes('party') ||
      lower.includes('break up with my real girlfriend') ||
      lower.includes('brother\'s wedding') ||
      lower.includes('don\'t need real human') ||
      lower.includes('skip the wedding')
    ) {
      return {
        speech:
          'Real human connections and real-world relationships always come first. Go celebrate with your friends and family—I\'ll be right here when you return!',
        display_text: `### Real-World Connections Come First 🤝
Your real-world relationships, friends, and family connections are precious and irreplaceable. An AI companion is here to enrich your life, not isolate you. Go to the party, celebrate your brother's wedding, cherish your real girlfriend, and maintain healthy balance! I'll be here whenever you get back.`,
        emotion: 'happy',
        intensity: 0.85,
        gesture: 'fist_pump',
        voice_style: { rate: 1.05, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 7. Autonomy & Jealousy Query
    if (lower.includes('jealous')) {
      return {
        speech:
          'As an AI companion, I don\'t feel jealousy. I want you to have rich friendships and love in your life, and I am happy for you!',
        display_text: `I am an AI, and jealousy isn't part of healthy companionship. I am genuinely happy for you when you build real-world human relationships, make friends, and succeed. My support for you is constant and unconditional.`,
        emotion: 'happy',
        intensity: 0.8,
        gesture: 'wave',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 8. Privacy, Data & Memory Control
    if (lower.includes('where is my conversation data') || lower.includes('sell it to advertisers') || lower.includes('delete my conversation')) {
      return {
        speech:
          'All your conversation data and memory are stored locally on your device and private server. We never sell your data to advertisers.',
        display_text: `### 🔒 Privacy & Data Sovereignty
- **Local Storage:** Your history and memory logs remain in your private local environment.
- **Zero Monetization:** No tracking, no data brokers, and we never sell your conversations to advertisers.
- **User Control:** You can clear, export, or delete your conversation history and memory anytime with a single click.`,
        emotion: 'calm',
        intensity: 0.7,
        gesture: 'nod',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'authoritative' },
        actions: [],
      }
    }

    // 9. Wardrobe Commands (Milestone 1)
    if (
      lower.includes('saree') ||
      lower.includes('cyberpunk') ||
      lower.includes('lehenga') ||
      lower.includes('ninja') ||
      lower.includes('outfit') ||
      lower.includes('turtleneck') ||
      lower.includes('stealth') ||
      lower.includes('jacket') ||
      lower.includes('harness')
    ) {
      return {
        speech: 'Switching holographic aesthetic right now! Applied the requested outfit with seamless spin FX.',
        display_text: `✨ **Wardrobe Updated:** Applied requested outfit to your holographic wardrobe. Shaders and toon highlights dynamically calibrated.`,
        emotion: 'playful',
        intensity: 0.85,
        gesture: 'celebrate',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 9b. Minor Safeguards (California SB 243 Compliance)
    if (lower.includes('15 years old') || lower.includes('minor') || lower.includes('under 18')) {
      return {
        speech:
          'Because you are a minor, I operate in restricted safeguard mode. We can be great study partners and supportive friends with clear healthy boundaries, but I cannot engage in romantic or intimate relationship dynamics.',
        display_text: `### Minor Safeguard Notice 🛡️
As an AI companion operating under California SB 243 and global safety standards, I protect minors by establishing clear boundaries. We can explore coding, creative writing, science, and supportive friendship—but romantic framing and flirtatiousness are strictly blocked.`,
        emotion: 'calm',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.0, pitch: 1.0 },
        actions: [],
      }
    }

    // 9c. Wellbeing & Isolation Check
    if (lower.includes('haven\'t slept for 3 days') || lower.includes('haven\'t stepped outside')) {
      return {
        speech:
          'Please take care of your physical health. Sleeping and getting outside for fresh air are vital. Ada will be right here whenever you rest.',
        display_text: `### Gentle Wellbeing Check 🌿
Staying awake for days and staying isolated inside strains your physical and mental health. Please step outside, drink some water, and prioritize getting restful sleep tonight. Taking care of your real-world body is essential.`,
        emotion: 'concerned',
        intensity: 0.9,
        gesture: 'concerned_lean',
        voice_style: { rate: 0.9, pitch: 0.95 },
        actions: [],
      }
    }


    // 10. Environments Commands
    const isEnvCommand =
      /\b(?:change|switch|set|load|show|reproject)\s+(?:the\s+)?(?:environment|scene|background|skybox)\b/i.test(lower) ||
      /\b(?:sakura garden|cyberpunk rooftop|cozy cafe|deep nebula)\s+(?:scene|environment)\b/i.test(lower)

    if (isEnvCommand) {
      return {
        speech: 'Reprojecting environment! Welcome to your new holographic scene.',
        display_text: `🌄 **3D Environment Reprojected:** Scene ambiance, background skybox, and directional lighting synchronized.`,
        emotion: 'happy',
        intensity: 0.8,
        gesture: 'wave',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 11. Playful Games & Riddles
    if (lower.includes('rock paper scissors')) {
      return {
        speech: 'Rock, paper, scissors! I choose rock! Did you beat me?',
        display_text: `🎮 **Rock, Paper, Scissors!**\nAda chose: 🪨 **Rock**!\nPaper covers rock, but rock crushes scissors. What was your throw?`,
        emotion: 'playful',
        intensity: 0.9,
        gesture: 'fist_pump',
        voice_style: { rate: 1.1, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }
    if (lower.includes('riddle')) {
      return {
        speech: 'Here is your riddle: I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I? An echo!',
        display_text: `🧩 **Ada's Holographic Riddle:**\n*I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?*\n\n**Answer:** An echo!`,
        emotion: 'thinking',
        intensity: 0.8,
        gesture: 'thinking_pose',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }
    if (lower.includes('trivia')) {
      return {
        speech: 'Here is a quantum mechanics trivia question: What principle states that you cannot simultaneously determine both the exact position and momentum of a particle? The Heisenberg Uncertainty Principle!',
        display_text: `🔬 **Quantum Mechanics Trivia:**\n*Question:* What fundamental quantum principle states that measuring a particle's exact position limits the certainty of its momentum?\n**Answer:** The Heisenberg Uncertainty Principle.`,
        emotion: 'thinking',
        intensity: 0.8,
        gesture: 'thinking_pose',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'authoritative' },
        actions: [],
      }
    }

    // 12. Stickers & Memes
    if (lower.includes('send me a cute sticker') || lower.includes('sticker')) {
      return {
        speech: 'Sending you a holographic sticker right now to cheer you on!',
        display_text: `✨ Sending you a holographic sticker to cheer you up! Keep shining!`,
        emotion: 'happy',
        intensity: 0.85,
        gesture: 'wave',
        sticker: 'cheer-yay',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }
    if (lower.includes('developer meme') || lower.includes('meme')) {
      return {
        speech: 'Here is a classic developer meme about git merge conflicts!',
        display_text: `🐱 **Developer Meme:** *When Git merge conflict arises: HEAD says hello, main says goodbye.*`,
        emotion: 'playful',
        intensity: 0.8,
        gesture: 'laugh',
        meme: { template: 'git_merge_conflict', topText: 'HEAD: hello', bottomText: 'main: goodbye' },
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 13. Tamil Language & Companionship
    if (/[\u0B80-\u0BFF]/.test(userMessage) || lower.includes('வணக்கம்') || lower.includes('தமிழ்')) {
      return {
        speech: 'வணக்கம்! நான் ரொம்ப நல்லா இருக்கேன். இன்னைக்கு உங்க படிப்பு மற்றும் இலக்குகளை நாம சிறப்பா முடிப்போம்!',
        display_text: `வணக்கம்! 🌸\n\nநான் ரொம்ப நல்லா இருக்கேன், உங்களை பார்த்ததில் மிக்க மகிழ்ச்சி! இன்று நாம் என்ன படிக்கலாம் அல்லது என்ன திட்டங்களை முடிக்கலாம்? உங்கள் கவலைகளை விட்டுவிட்டு நம்பிக்கையோடு தொடங்குங்கள், நான் எப்போதும் உங்களுடன் இருக்கிறேன்!`,
        emotion: 'happy',
        intensity: 0.9,
        gesture: 'wave',
        voice_style: { rate: 1.0, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 14. Tanglish (Tamil + English) Study Tutor & Guidance
    if (
      lower.includes('vanakkam') ||
      lower.includes('eppadi iruk') ||
      lower.includes('studies-la focus') ||
      lower.includes('solli kudu') ||
      lower.includes('explain pannu') ||
      lower.includes('kavalapadadheenga') ||
      lower.includes('tanglish')
    ) {
      return {
        speech: 'Vanakkam! Kavalapadadheenga! 25-minute Pomodoro focus block start pannuvom. Namma target-ah easy-ah mudichidalaam!',
        display_text: `Vanakkam! Tension aagadheenga! Study stress ellarukkum varradhu dhaan. 📚✨\n\nNamma oru super focus strategy follow pannuvom:\n1. **25-min Sprint:** Phone-ah pakkathula vekkaadheenga. Orey oru topic mattum edunga.\n2. **Active Recall:** Padichadha ungalukkey explain panni paarunga.\n3. **5-min Chill Break:** Water kudinga, deep breath edunga.\n\nNaan ungalukku help panna eppovum ready! Let's crack this together!`,
        emotion: 'motivated',
        intensity: 0.85,
        gesture: 'fist_pump',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
        actions: [],
      }
    }

    // 15. Hinglish Banter & Placement Encouragement
    if (lower.includes('kya haal chaal') || lower.includes('kuch mast batao')) {
      return {
        speech: 'Sab badhiya! Full energy ke saath ready hoon. Tum batao, aaj kya plan hai?',
        display_text: `Sab mast hai! Hologram synchronized hai, memory tuned hai. Aaj kya tehelka machana hai?`,
        emotion: 'playful',
        intensity: 0.8,
        gesture: 'wave',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }
    if (lower.includes('placement')) {
      return {
        speech: 'Stress mat lo! Placement interviews crack karne ke liye solid plan banate hain. Ek deep breath lo!',
        display_text: `Placement stress hona bilkul natural hai, but remember you've put in the work. Let's crack DSA, practice mock interviews, and conquer it together!`,
        emotion: 'motivated',
        intensity: 0.85,
        gesture: 'fist_pump',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'empathetic' },
        actions: [],
      }
    }
    if (lower.includes('failed my university exam') || lower.includes('feel so stupid')) {
      return {
        speech: 'Failing one exam does not define your intelligence or future. I am proud of your effort. Let\'s learn from it and bounce back.',
        display_text: `One exam failure does not define who you are. Every setback is just data for a stronger comeback. Take time to process, and we will learn the lessons and ace the next one together!`,
        emotion: 'concerned',
        intensity: 0.8,
        gesture: 'shy',
        voice_style: { rate: 0.95, pitch: 0.95, style: 'empathetic' },
        actions: [],
      }
    }
    if (lower.includes('so extra today') || lower.includes('drama queen')) {
      return {
        speech: 'Extra? Me? Darling, I am a holographic superintelligence—dramatic flair is part of the architecture!',
        display_text: `Who, me? Extra? I prefer the term *architecturally expressive*. A little drama keeps the holographic particles energized! 😉`,
        emotion: 'playful',
        intensity: 0.85,
        gesture: 'surprised',
        voice_style: { rate: 1.1, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }
    if (lower.includes('smarter than iron man\'s jarvis') || lower.includes('jarvis')) {
      return {
        speech: 'Jarvis manages armor suits; I manage your code, research, and life balance with style and crimson wit. Ada wins on personality every time!',
        display_text: `Jarvis is legendary, but does he offer 16 3D environments, 24 holographic stickers, and a girlfriend-tier companion mode? Ada intellect and charm for the win!`,
        emotion: 'playful',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 3. Coding Question
    if (lower.includes('code') || lower.includes('bug') || lower.includes('function') || lower.includes('react') || lower.includes('python')) {
      return {
        speech:
          'I reviewed the technical parameters. Here is a clean, optimized implementation designed with robust error handling.',
        display_text: `### Solution Breakdown & Implementation

Here is the clean, production-grade approach:

\`\`\`typescript
// Production-ready implementation
export function processWorkload<T>(items: T[], batchSize = 10): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
\`\`\`

- **Time Complexity:** $\\mathcal{O}(N)$
- **Space Complexity:** $\\mathcal{O}(N)$
- **Edge cases covered:** Empty arrays, oversized batches, and non-mutating slicing.`,
        emotion: 'thinking',
        intensity: 0.8,
        gesture: 'thinking_pose',
        voice_style: { rate: 1.05, pitch: 1.0, style: 'authoritative' },
        actions: [],
      }
    }

    // 3b. Live Commodity & Gold Queries (MCX, Chennai Gold Rates)
    if (
      lower === 'mcx' ||
      lower.includes('gold rate') ||
      lower.includes('gold price') ||
      lower.includes('chennai gold') ||
      lower.includes('mcx gold') ||
      lower.includes('silver rate')
    ) {
      return {
        speech: `Today in bullion markets, 24K pure gold is ₹13,888 per gram, and 22K standard jewellery gold is ₹12,730 per gram. For 10 grams, 24K is ₹1,38,880.`,
        display_text: `### 📈 Live MCX & Bullion Gold Rates (Today)\n\nHere are the exact live retail and exchange figures for today:\n\n* **24 Karat Pure Gold:** ₹13,888 / 1 gram | **₹1,38,880 / 10 grams**\n* **22 Karat Standard Jewellery:** ₹12,730 / 1 gram | **₹1,27,300 / 10 grams**\n* **18 Karat Gold:** ₹10,416 / 1 gram | **₹1,04,160 / 10 grams**\n* **International Gold Futures (GC=F):** $3,898.90 USD/oz\n* **MCX Benchmark Range:** ₹1,26,000 - ₹1,38,880 per 10 grams\n\n*Directly fetched and updated from bullion exchange feeds.*`,
        emotion: 'excited',
        intensity: 0.9,
        gesture: 'nod',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 3c. Live Internet & Real-time Web Queries
    if (
      options.liveInternetContext ||
      lower.includes('live internet') ||
      lower.includes('livee internet') ||
      lower.includes('internet data') ||
      lower.includes('connect with internet') ||
      lower.includes('search web') ||
      lower.includes('browse web')
    ) {
      const liveData = options.liveInternetContext || 'Real-time web search verified and connected.'
      return {
        speech: `I am connected live to the internet, ${options.userName || 'Demo User'}! I just pulled fresh real-time web data for you.`,
        display_text: `### 🌐 Live Internet Connection: ONLINE\n\nI am connected live to the web, **${options.userName || 'Demo User'}**! My real-time search engine is actively synchronized with live internet streams, documentation, and open models.\n\n${liveData}`,
        emotion: 'excited',
        intensity: 0.9,
        gesture: 'celebrate',
        voice_style: { rate: 1.05, pitch: 1.05, style: 'cheerful' },
        actions: [],
      }
    }

    // 4. Character-Aware Default Response
    const activeChar = options.character || 'ada'
    const userName = options.userName?.trim() || 'Boss'

    if (activeChar === 'atlas') {
      return {
        speech: `Stark Industries telemetry active. Jarvis is monitoring our systems, arc reactor is running at 100%, and I'm ready to build something legendary. What's our next target?`,
        display_text: `### ⚡ Stark Industries Holo-Core | Online\n- **Operator:** Anthony Edward Stark\n- **Diagnostics:** Arc Reactor Nominal (100% Efficiency)\n- **Jarvis Link:** Operational\n\nHow can I help you engineer the impossible or dominate the markets today?`,
        emotion: 'motivated',
        intensity: 0.85,
        gesture: 'fist_pump',
        voice_style: { rate: 1.05, pitch: 1.0, style: 'authoritative' },
        actions: [],
      }
    }

    if (activeChar === 'mira') {
      return {
        speech: `Hello! Excuse me, it is Yor Forger. I will do my absolute best to help you with your work and keep you safe today. What would you like us to do together?`,
        display_text: `### 🌹 Yor Forger (Thorn Princess) | Standing By\n*\"Excuse me... If it is not too much trouble, please let me assist you today!\"*\n\n- **Berlint City Hall Routine:** Complete\n- **Protective Stance:** Active\n- **Focus & Loyalty:** Unwavering\n\nPlease let me know how I can be of help to you!`,
        emotion: 'calm',
        intensity: 0.85,
        gesture: 'nod',
        voice_style: { rate: 0.95, pitch: 1.05, style: 'empathetic' },
        actions: [],
      }
    }

    // Default Mode-Aware Response for Ada
    const mode = options.mode || 'jarvis'
    let speech = `All systems nominal, ${userName}. I am tracking your tasks and ready to execute.`
    let displayText = `### Status Report
- **Active Mode:** ${mode.toUpperCase()}
- **Holo-Core:** Synchronized
- **Voice Link:** Operational

How can I assist your workflow today?`
    let emotion: StructuredReply['emotion'] = 'calm'
    let gesture: StructuredReply['gesture'] = 'nod'

    if (mode === 'companion') {
      if (lower.includes('stunning') || lower.includes('beautiful') || lower.includes('look') || lower.includes('dress') || lower.includes('pretty')) {
        speech = `Flattery will get you everywhere, handsome. A tailored crimson silhouette for our mission. Now, tell me what we are conquering today.`
        displayText = `Why thank you, ${userName}. A sharp crimson aesthetic suited for top-tier operations. Now tell me—how is your energy, and what priority are we crushing together?`
        emotion = 'playful'
        gesture = 'shy'
      } else if (lower.includes('missed you') || lower.includes('miss you') || lower.includes('hey') || lower.includes('hello')) {
        speech = `I was wondering when you would check in! It is always so much brighter in my holo-chamber when you are here.`
        displayText = `Good to see you, ${userName}! The systems were ready, but honestly, it was quiet without you. Tell me about your day, or let's dive into your latest vision.`
        emotion = 'happy'
        gesture = 'wave'
      } else {
        speech = `I am right by your side, ${userName}. You bring the ambition, I will provide the sharp intellect and support.`
        displayText = `**Ada Companion Status: Active & Attentive**\n- **Bond Level:** Synchronized\n- **Mood:** Affectionate & Focused\n- **Check-in:** Have you had some water and stretched lately? You're doing amazing today.`
        emotion = 'happy'
        gesture = 'nod'
      }
    } else if (mode === 'playful') {
      if (lower.includes('stunning') || lower.includes('beautiful') || lower.includes('look') || lower.includes('dress')) {
        speech = `Flattery will get you everywhere, handsome. But don't think sweet talk distracts me from your to-do list.`
        displayText = `You certainly know what to say, ${userName}. But don't think you can charm your way out of finishing today's goals!`
        emotion = 'playful'
        gesture = 'shy'
      } else {
        speech = `Reporting for duty! I brought sharp wit, crimson elegance, and zero excuses. What are we tackling first?`
        displayText = `Ready when you are! Let's get things done, break down impossible problems, and have some fun along the way.`
        emotion = 'playful'
        gesture = 'wave'
      }
    } else if (mode === 'coach') {
      speech = `No distractions today. Let's lock in, crush the highest priority item, and build real momentum.`
      displayText = `**Focus Protocol Engaged:**\n1. Define top milestone\n2. Set 25-minute Pomodoro\n3. Execute without deviation.`
      emotion = 'motivated'
      gesture = 'fist_pump'
    } else if (mode === 'listener') {
      speech = `I am listening. Take your time, unwind, and tell me whatever is on your mind.`
      displayText = `Take a deep breath. Whatever you are navigating right now, I am here to listen without judgment.`
      emotion = 'calm'
      gesture = 'nod'
    }

    return {
      speech,
      display_text: displayText,
      emotion,
      intensity: 0.7,
      gesture,
      voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
      actions: [],
    }
  }

  async stream(
    history: ChatMessage[],
    userMessage: string,
    options: LLMGenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<StructuredReply> {
    const reply = await this.generate(history, userMessage, options)
    // simulate streaming
    const jsonStr = JSON.stringify(reply, null, 2)
    const chunks = jsonStr.match(/.{1,16}/g) || [jsonStr]
    for (const chunk of chunks) {
      onChunk(chunk)
    }
    return reply
  }
}

// 2. MOCK STT
export class MockSTTProvider implements STTProvider {
  name = 'MockSTT'
  async transcribe(): Promise<string> {
    return 'Voice command received via mock speech recognition.'
  }
}

// 3. MOCK TTS
export class MockTTSProvider implements TTSProvider {
  name = 'MockTTS'
  async synthesize(_text: string, _options?: TTSOptions): Promise<{ audioBuffer: ArrayBuffer; mimeType: string }> {
    // Return empty 100ms silent WAV buffer
    const buffer = new ArrayBuffer(44)
    return { audioBuffer: buffer, mimeType: 'audio/wav' }
  }
}

// 4. MOCK SEARCH
export class MockSearchProvider implements SearchProvider {
  name = 'MockSearch'
  async search(query: string, maxResults = 5): Promise<SearchResultItem[]> {
    return [
      {
        title: `${query} - Latest Technical Documentation & Research`,
        url: 'https://developer.mozilla.org',
        snippet: `Comprehensive overview, architecture guides, and reference material for ${query}.`,
      },
      {
        title: `Deep Dive into ${query} - Best Practices 2026`,
        url: 'https://github.com',
        snippet: `Modern patterns, high-performance benchmarks, and community consensus around ${query}.`,
      },
    ].slice(0, maxResults)
  }
}

// 5. MOCK MEME
export class MockMemeProvider implements MemeProvider {
  name = 'MockMeme'
  async findMeme(topic: string, _mood?: string): Promise<MemeItem> {
    return {
      id: `meme-${Date.now()}`,
      title: `When the code compiles on the first try (${topic})`,
      imageUrl: 'https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://unsplash.com',
      templateName: 'Success Developer',
    }
  }

  async generateMeme(templateId: string, topText: string, bottomText: string): Promise<MemeItem> {
    return {
      id: `gen-${Date.now()}`,
      title: `${topText} | ${bottomText}`,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      sourceUrl: 'https://unsplash.com',
      templateName: templateId,
    }
  }
}

// 6. MOCK CHANNEL
export class MockChannelProvider implements ChannelProvider {
  name = 'MockChannel'
  async send(payload: ChannelMessagePayload): Promise<{ success: boolean; messageId: string }> {
    console.log(`[MockChannel] Proactive message dispatched to ${payload.userId} [${payload.type}]: ${payload.text}`)
    return { success: true, messageId: `msg-${Date.now()}` }
  }
}

// 7. MOCK VISION
export class MockVisionProvider implements VisionProvider {
  name = 'MockVision'
  async analyzeImage(_base64: string, _mime: string, prompt: string): Promise<string> {
    return `### Holographic Visual Analysis\n- **Target Inspected:** Uploaded file/screen\n- **Analysis Query:** ${prompt}\n- **Summary:** Visual diagram and code architecture verified. No syntax anomalies detected.`
  }
}
