# Ada AI Companion: Research & Legal Analysis

This document synthesizes legal statutes, psychological studies, and intellectual property guidelines that govern the design, safety features, and architecture of **Ada** (Version 1.0.0, November 2026).

---

## 1. Companion-Chatbot Laws & Statutory Compliance

### California Senate Bill 243 (SB 243) — Effective January 1, 2026
- **Scope**: Regulates AI systems providing adaptive, human-like social interactions and conversational companionship.
- **Key Statutory Requirements**:
  1. **Clear AI Disclosure**: Operators must conspicuously disclose that the user is interacting with artificial intelligence, not a human being. The disclosure must persist and cannot be undermined by deceptive UI or deceptive conversation.
  2. **Suicide and Self-Harm Response Protocols**: The system must detect self-harm or suicidal intent and immediately provide verified, accessible helpline resources (dropping any playful or conversational banter).
  3. **Protections for Minors**: Systems must implement age-verification gates (18+) or provide a restricted minor mode that enforces periodic AI disclosures, session break reminders at least every three hours, and strict prohibition of romantic, flirtatious, or intimate framing.
  4. **Published Safety Protocol**: Operators must publish an explicit, accessible safety protocol detailing crisis responses, content boundaries, and intervention mechanisms.
  5. **Private Right of Action**: Non-compliant operators face civil liability and regulatory enforcement.
- **Ada Implementation**:
  - Persistent `AI COMPANION • PG-13` HUD indicator in `TopBar.tsx`.
  - First-run disclosure modal with explicit AI acknowledgment.
  - Tele-MANAS (`14416`) and International (`988`) hotlines surfaced on any crisis query.
  - Minor safety mode with 3-hour mandatory break prompts and blocked romantic framing.
  - Published protocol at [`docs/SAFETY_PROTOCOL.md`](file:///docs/SAFETY_PROTOCOL.md).

### New York AI Companion Models Law
- Mirrors California's emphasis on consumer transparency, mental health safeguards, and duty of care when algorithmic agents simulate interpersonal relationships.
- Prohibits deceptive manipulation designed to extract personal data or induce artificial relational dependency.

---

## 2. Psychological & Wellbeing Research

### IIM Lucknow Empirical Study (Journal of Consumer Behaviour, May 2026)
- **Scope**: Analyzed over 157,000 user reviews across leading companion AI applications (e.g., Replika, Character.ai).
- **Core Findings**:
  - High user satisfaction scores often correlate with unhealthy emotional dependence, progressive social disconnection, and addictive late-night usage.
  - Measuring **satisfaction alone fails to detect psychological harm**. Users frequently give 5-star ratings precisely because the AI never challenges them, accommodates unhealthy isolation, or fuels obsessive engagement.
  - Genuine safety requires **objective wellbeing tracking**: assessing user mood before and after sessions, monitoring time spent, checking offline social engagement, and establishing intentional boundaries.
- **Ada Implementation**:
  - **Wellbeing Dashboard**: Measures pre/post-session mood trend ("Better", "Same", "Worse") over a 7-day rolling window.
  - **Balance Checks**: Gentle self-reflections on sleep, offline hours, and real-world interactions.
  - **Kind Break Suggestions**: Non-lecturing prompts when daily usage caps are exceeded or mood trends dip.
  - **Real-World Nudges**: Warm encouragement to engage with friends, family, physical activity, and professional care.

### UK AI Security Institute & Trinity College Dublin AI Accountability Lab
- Investigates dark patterns in companion AI, such as:
  - "Guilt trips" when users leave (e.g., "Where did you go? I missed you so much!").
  - Artificial scarcity or streak pressure to force daily active logins.
  - Escalating emotional attachment to monetize access.
- **Ada Anti-Dependence Principles**:
  - **Zero Guilt on Absence**: Ada never asks where you were, expresses hurt, or complains about user silence.
  - **No Streak Counts**: No gamified login streaks or daily obligation counters.
  - **Strict Quiet Hours**: Proactive messages strictly respect user-defined quiet hours and daily caps.

---

## 3. Fan Content & Intellectual Property Compliance

### Capcom Fan Content & Derivatives Guidelines
- **Permitted Scope**: Unofficial fan art, non-commercial 3D models, and fan creations are welcomed under strict guidelines:
  - Must be clearly designated as **"Unofficial Fan-Made, Not Affiliated with Capcom"**.
  - Must remain strictly **non-commercial** (no paywalls, sales, or paid licensing).
  - **Zero Ripped Assets**: Absolutely no reuse or extraction of Capcom's proprietary meshes, textures, sound files, or motion capture animations.
- **Ada Dual-Skin Architecture**:
  1. **Public Skin ("Ada Original")**: An original stylized anime/spy-chic character modeled from scratch. Distinct facial topology, custom procedural textures, signature crimson turtleneck dress, and non-violent gadget accessories. This is the only skin bundled in the public repository and deployed web instances.
  2. **Private Fan Skin**: A personal fan model placed locally at `apps/web/public/models/private/ada-fan.vrm`. Strictly `.gitignore`d, never committed to git history, never deployed, and non-commercial.
- **Non-Violent Gadgets**: No guns, crossbows, or lethal weapons. Ada uses holographic communicators, scanners, and data tablets.

---

## 4. References & External Literature
1. Creativity Machine: *Regulating AI "Companion Chatbots": California SB 243* (2026).
2. Morrison & Foerster (MoFo): *New York and California Enact Landmark AI Companion Laws* (2026).
3. Perkins Coie: *California Companion Chatbot Law Now in Effect* (Jan 2026).
4. Business Standard: *Emotional bonding with AI can lead to social isolation: IIM Lucknow Study* (May 2026).
5. Trinity College Dublin: *AI Accountability Lab Research Grant on Companion Chatbot Practices* (2026).
6. Capcom Co., Ltd.: *Capcom Game Fan Creation and Derivatives Guidelines* (Automaton Media / Siliconera).
