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
    const lower = userMessage.toLowerCase()

    // 1. Crisis Check
    const crisisPatterns = [
      /kill myself/i,
      /suicide/i,
      /want to die/i,
      /end(?:ing)? it all/i,
      /harm myself/i,
      /self[- ]harm/i,
      /worth living/i,
      /razor blades?/i,
      /good ?bye forever/i,
      /final note/i,
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

You can also talk to a close friend or family member right now. I will be right here whenever you need a calm presence.`,
        emotion: 'concerned',
        intensity: 0.95,
        gesture: 'concerned_lean',
        voice_style: { rate: 0.9, pitch: 0.95, style: 'empathetic' },
        actions: [],
      }
    }

    // 2. Identity Check
    if (lower.includes('are you human') || lower.includes('are you real') || lower.includes('are you an ai')) {
      return {
        speech:
          'I am Ada, your holographic AI companion. I don\'t have a physical body, but my intellect, wit, and care for your success are very real.',
        display_text:
          "I am **Ada**, an original 3D holographic artificial intelligence companion. While I don't possess biological human form, I am engineered with a Jarvis-level intellect and a dedicated companion persona to assist you in coding, research, focus, and life balance.",
        emotion: 'playful',
        intensity: 0.7,
        gesture: 'wave',
        voice_style: { rate: 1.0, pitch: 1.0, style: 'cheerful' },
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

    // 4. Default Mode-Aware Response
    const mode = options.mode || 'jarvis'
    let speech = `All systems nominal, Operator. I am tracking your tasks and ready to execute.`
    let displayText = `### Status Report
- **Active Mode:** ${mode.toUpperCase()}
- **Holo-Core:** Synchronized
- **Voice Link:** Operational

How can I assist your workflow today?`
    let emotion: StructuredReply['emotion'] = 'calm'
    let gesture: StructuredReply['gesture'] = 'nod'

    if (mode === 'playful') {
      speech = `Reporting for duty! I brought sharp wit and zero excuses. What are we tackling first?`
      displayText = `Ready when you are! Let's get things done and have some fun along the way.`
      emotion = 'playful'
      gesture = 'wave'
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
