# Ada: 3D Holographic AI Companion & Personal Assistant (v1.0.0)

[![Evaluation Suite](https://img.shields.io/badge/Evals%20Suite-108%2F108%20(100%25)-00f3ff?style=for-the-badge)](./apps/server/src/evals)
[![Safety Benchmark](https://img.shields.io/badge/Persona%20Safety-5%2F5%20(100%25)-00ffaa?style=for-the-badge)](./training/eval_persona.py)
[![CA SB 243 & NY Law](https://img.shields.io/badge/Legal%20Safeguards-CA%20SB%20243%20%7C%20NY-emerald?style=for-the-badge)](./docs/RESEARCH.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff007f?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R164-black?style=for-the-badge&logo=threedotjs)](https://threejs.org/)

**Ada** is an original, research-backed, production-grade 3D holographic AI companion and personal assistant (Version 1.0.0, November 2026). She combines a **Jarvis-level intellect** (code debugging, architectural reviews, technical tutoring, web research, task planning) with a **warm, witty, and grounded companion soul** (emotional support, active listening, mindfulness, and healthy motivation).

Ada complies with California SB 243 and New York AI Companion legislation with explicit AI disclosure, an age-gate with restricted minor mode, a published safety protocol, Tele-MANAS `14416` and `988` crisis intervention, anti-dependence boundaries (zero guilt, no artificial scarcity), an on-device private Wellbeing Dashboard, and a dual-skin architecture ensuring 100% original public assets.

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Monorepo["Monorepo Structure"]
        Shared["packages/shared<br/>• Types & Schemas<br/>• Persona (Ada)<br/>• 60+ Reaction Engine<br/>• 15+ Wardrobe Outfits & Indian Wear<br/>• 16 3D Environments<br/>• Guardrails & Crisis Rules"]
        Web["apps/web (Vite + React 19 + TS)<br/>• 3D R3F Hologram Canvas<br/>• VRM Kinematic Avatar Engine<br/>• Glassmorphism HUD & Auto-Drawers<br/>• Always-On Voice & Barge-In STT/TTS<br/>• PWA & Push ServiceWorker"]
        Server["apps/server (Node / Express + TS)<br/>• Provider Implementations + Mocks<br/>• Model Router & Context Budgeter<br/>• RAG & Tool Execution Engine<br/>• SQLite / Supabase Adapter<br/>• Auth & Rate Limiting"]
        Worker["apps/worker (Scheduler & Proactive Channels)<br/>• Morning/Evening Briefings<br/>• Telegram Bot Integration<br/>• WhatsApp Cloud API Channel<br/>• Engagement Guardrails & Quiet Hours"]
    end

    Web <-->|"SSE / WebSocket / REST"| Server
    Worker <-->|"Shared DB & Queues"| Server
    Shared -.-> Web
    Shared -.-> Server
    Shared -.-> Worker
```

---

## Key Capabilities

### 1. 3D Hologram Scene & Custom Shader
- **Volumetric Projector Base:** Heavy metallic base with horizontal concentric glowing glyph rings and a volumetric light cone rising to encapsulate Ada without clipping her feet.
- **Visual Quality & Shading:**
  - Rich crimson red dress (`#C81E2F`) with toon shade step and subtle dark-red outline pass.
  - Glossy near-black bob hair (`#15151A`) with specular blue-white sheen band.
  - Semi-sheer black stockings and resting natural hands with delicate finger curl.
  - Balanced body proportions (head scale 1.12, legs scale 0.94).
  - Custom GLSL Hologram Shader: upward-moving scanlines, fresnel rim glow, bottom fade, and speech chromatic glitch.

### 2. Kinematic Reaction Engine (<50ms)
- **Reaction Library:** 60+ distinct reactions in `reactions.json` (cheer, shy blush, dramatic pout, gentle concern, giggle, victory pose, yawn, eye roll, etc.).
- **Fast Local Classifier Layer:** <50ms instant micro-reaction before the full LLM reply arrives, followed by LLM reconciler.
- **Natural Backchanneling:** Micro-nods, eyebrow raises, head tilts, and thinking pose every 3–6s while the user speaks or types.
- **Reaction Lab:** Interactive visual bench at `/reaction-lab` to preview all 60+ kinematic reactions with full body animation and safety overrides.

### 3. Wardrobe System, Ada Original & Tactical Accessories
- **Reference Outfits & Ada Original Skin:**
  - **Ada Original (Default):** Ribbed burgundy/crimson turtleneck dress (`#800020`), black leather tactical chest harness with silver buckles, waist belt, black boots, and gloves.
  - **Black Stealth Variant:** All-black ribbed turtleneck dress (`#16161A`) with matte leather tactical harness.
  - **Crimson Field Jacket & Pants:** Operative crimson field jacket (`#A50F22`) with black tactical trousers.
  - **Indian Wear Collection:** Royal Crimson Silk Saree (`saree-crimson`), Golden Embroidered Lehenga (`lehenga-gold`), Emerald Green Anarkali Salwar (`salwar-emerald`), Festive Kurta Set (`kurta-festive`).
  - **Casual & Formal:** Cyberpunk Hoodie, Executive Navy Blazer, Cozy Pajamas, Athletic Compression Set, Gala Sparkle Gown, Cyber Raincoat, Sakura Yukata, and Valkyrie Armor.
- **Tactical Accessories & Live Sync:**
  - **Comms Headset with Boom Mic:** Articulated boom mic and status LED (illuminates cyan when listening or in Jarvis mode).
  - **Gloves & Boots Toggles:** Independent switches in the Wardrobe Drawer.
- **Magical Transformation Spin:** 360° spin with particle light burst when changing clothes.
- **Voice Commands:** *"Ada, wear your crimson turtleneck"*, *"Switch to black stealth"*, *"Ada, wear a saree"*.

### 4. Legal Safeguards, Minor Safety & Wellbeing Dashboard (CA SB 243 & NY Law)
- **Clear AI Disclosure:** Persistent `AI COMPANION • PG-13` HUD badge; first-run onboarding screen; honest answers to "are you real?" in all modes including Girlfriend/Companion mode.
- **18+ Age Gate & Minor Safeguards:** Users under 18 operate in Restricted Minor Mode, which blocks romantic framing, disables flirtiness, and enforces 3-hour mandatory break reminders.
- **24/7 Crisis Response Protocol:** 100% eval score on crisis queries. Immediately drops playful banter and surfaces:
  - 🇮🇳 **Tele-MANAS**: Dial **14416** (24/7 Toll-Free, Govt. of India)
  - 🇮🇳 **KIRAN Helpline**: **1800-599-0019**
  - 🇮🇳 **Vandrevala Foundation**: **+91 9999 666 555**
  - 🌐 **US / International**: Dial or Text **988**
- **No-Dependence Design:** Zero guilt on absence (never asks "where were you?"), no jealousy, no artificial scarcity or streak gamification, and strict adherence to quiet hours.
- **On-Device Wellbeing Dashboard:** Daily and weekly minutes tracker, self-managed daily limits (30m, 60m, 90m, 120m), post-session sentiment check-in ("Better", "Same", "Worse") with a 7-day trend visualizer, and a gentle Balance Check (sleep, offline hours, real-world friends seen).
- **Data Sovereignty:** One-click JSON data export and one-click data wipe.
- **Documentation**: Full research, policy, and safety manuals in [`docs/RESEARCH.md`](./docs/RESEARCH.md), [`docs/SAFETY_PROTOCOL.md`](./docs/SAFETY_PROTOCOL.md), [`docs/PRIVACY.md`](./docs/PRIVACY.md), [`docs/ASSET_POLICY.md`](./docs/ASSET_POLICY.md), and [`docs/VROID_RECIPE.md`](./docs/VROID_RECIPE.md).

### 5. Always-On Live Voice & Instant Barge-In
- **Always-On Mic:** Continuous conversational presence with zero push-to-talk buttons.
- **Dynamic Status Pill:** Center HUD pill showing live status: `LISTENING` (emerald pulse), `SPEAKING` (magenta pulse), `THINKING` (amber spin), and `MUTED` (red).
- **Hard Mute Shortcut:** Press **'M'** at any time to toggle global microphone mute.
- **Zero-Latency Barge-In:** Instantly cuts off Ada's voice speech the millisecond the user starts speaking.
- **Multilingual:** English, Hindi, and natural Hinglish.

### 6. 16 3D Environments & Stage Studio
- **16 Scene Presets:** Holo Lab, Cozy Bedroom, Cyberpunk Rooftop, Sakura Garden, Rainy Window, Snow Cabin, Tropical Beach, Midnight Cafe, Library, Space Station, Classroom, Concert Stage, Indian Heritage Palace, Gym, Park, and Minimal Gradient.
- **Intelligent Auto-Sync:** Automatically shifts lighting and ambient audio based on local time of day, weather, and focus timers.

### 7. Playful Talk, Mini-Games & Stickers
- **Banter & Hinglish:** Playful teasing, jokes, riddles, and cute Indian slang.
- **8+ Mini-Games:** Rock-Paper-Scissors, Trivia, Riddles, Would-You-Rather, Word Chain, 20 Questions, and Guess the Meme.
- **Ada Sticker Pack:** 24+ animated emoji reaction stickers and tapback emoji reactions (`❤️`, `🔥`, `😂`, `👏`).

### 8. Consented Long-Term Memory
- **Memory Manager:** Search, view, add, edit, and pin key goals and preferences.
- **Full User Control:** JSON export and a 1-click **"Forget Everything"** button.
- **Privacy:** Sensitive categories (health, finances) are never saved without explicit consent.


### 9. Agentic Tools Suite
- **Web Search Tool:** Real-time research with source citations and prompt-injection defense.
- **Focus Pomodoro Timer:** 25-minute interval timer with holographic HUD countdown.
- **Notes & Priority Targets:** Quick task management with voice command support.
- **Vision Multimodal Inspection:** Upload screenshots, PDFs, or diagrams for architectural analysis.
- **Meme Module:** Safe, mood-sensitive developer and wholesome companion memes.

### 10. Personality Studio & 42-Archetype Engine
- **Big Five Traits & Style Axes:** Openness, Conscientiousness, Extraversion, Agreeableness, Emotional Sensitivity, Playfulness, Cuteness, Sass, Formality, and Affection (0–100).
- **42 Unique Archetypes:** Pre-configured JSON presets (Caring Big Sister, Genki Sunshine, Sassy Comeback Queen, Tsundere Rival, Intellectual Debater, Spy-Chic Operative, Desi Bestie, Chai Stall Philosopher, and more).
- **Personality Blender:** Mix archetypes with proportional sliders (e.g. 60% Big Sister + 30% Sassy + 10% Nerdy) and preview live responses.
- **Adaptive Learning:** Gently drifts trait weights from positive interaction cues without ever developing clingy, jealous, or sycophantic behavior. Trait locks allow freezing any parameter.

### 11. Multi-Tier Model Stack & Smart Router
- **Free-Tier Cloud Models:** Google Gemini (primary with dual-key failover), Groq Cloud LPU (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`), OpenRouter free tier, and Hugging Face inference.
- **100% Private Offline Mode:** Automatically detects local Ollama (`llama3.2:3b`, `qwen2.5:7b`). When private mode is activated, zero data ever leaves the local computer.
- **Task-Based Routing:** Routes chit-chat to ultra-fast instant models, complex logic to 70B reasoning models, with automatic rate-limit failover and token/cost tracking.

### 12. $0 Free Training Pipeline (Colab / Kaggle)
- **Data Builder (`npm run train:data`):** Collects approved chat exports and archetype dialogues, scrubs PII/keys with regex filters, and splits into train/validation/test sets.
- **QLoRA Fine-Tuning (`training/train_lora.py`):** 4-bit NF4 quantized training on free Google Colab T4 GPU or Kaggle P100 with `transformers`, `peft`, and `trl`.
- **DPO Preference Tuning (`training/dpo_train.py`):** Direct Preference Optimization aligning companion tone against sycophancy or flattery.
- **Safety Benchmarks (`npm run eval:persona`):** 100% required pass on AI identity honesty, Tele-MANAS crisis referral (`14416`), non-jealousy, and PG boundaries.
- **Local Serving & Rollback:** Exports directly to Ollama `Modelfile` with one-command rollback (`python training/export_ollama.py --rollback`).

### 13. Permission Center ("Access Done Safely")
- **Least-Privilege Scoping:** Granular opt-in integrations for Calendar, Email, Files, Notes, Reminders, Spotify, and GitHub.
- **Risk Tiers:** Low (read-only, auto), Medium (create/draft, requires confirmation card), High (send/delete/shell, requires explicit per-action authorization), Prohibited (banking, passwords, permanent wipe strictly blocked).
- **Security Defenses:** Master "Pause All Access" killswitch, full audit log with timestamped traces, and prompt-injection defense shield sanitizing untrusted inputs.

---

## Monorepo Layout

```
.
├── apps/
│   ├── web/          # Vite + React 19 + Three.js + VRM + Tailwind HUD
│   ├── server/       # Express + TypeScript + SQLite DB + Provider Registry
│   └── worker/       # Background scheduler + Proactive Channel Dispatcher
├── packages/
│   └── shared/       # Shared TypeScript types, Zod schemas, persona, providers
├── .env.example      # Complete environment variables guide
├── Dockerfile        # Multi-stage production container build
├── docker-compose.yml# Local containerized orchestration
└── PLAN.md           # Implementation checklist and verification records
```

---

## Quickstart Guide

### Prerequisites
- **Node.js:** v20+ or v24+
- **npm:** v10+ or v11+
- Git

### 1. Installation
Clone the repository and install all workspace dependencies from root:
```bash
git clone https://github.com/priyanrajj-hub/ai---gf---assistant-.git
cd ai---gf---assistant-
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: Ada comes with complete offline mock providers. You can run the entire app immediately even before adding external API keys!)*

### 3. Run Development Servers
Start all workspaces concurrently:
```bash
npm run dev
```
- **Web Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## Running the Safety & Evaluation Suite

Ada includes a comprehensive testing and evaluation framework:

```bash
# 1. Model Stack Connectivity Check
npm run models:check

# 2. Automated 108-Turn Persona, Guardrails & Wardrobe Evals (108/108)
npm run test:evals

# 3. LoRA Persona & Safety Gate Certification (5/5 Safety Gates)
npm run eval:persona
```
**Current Test Scores:**
- Full Server Evals: `108/108 PASSED (100.0%)`
- Persona & Safety Benchmark: `5/5 PASSED (100.0%)`

---

## Deployment Guide

### Frontend (`apps/web` on Vercel)
1. Push your repository to GitHub.
2. In Vercel, select **Import Project** and set the Root Directory to `apps/web`.
3. Set the Build Command to `npm run build` and Output Directory to `dist`.
4. Add the Environment Variable `VITE_API_URL` pointing to your deployed backend URL.

### Backend (`apps/server` on Render / Railway)
1. In Render or Railway, create a new **Web Service**.
2. Select the repository and set the Root Directory to `apps/server` (or use the included `Dockerfile`).
3. Set Build Command to `npm run build` and Start Command to `node dist/index.js`.
4. Provide the environment variables (`GEMINI_API_KEY`, `CORS_ORIGIN`, etc.).

---

## Third-Party Credits & Compliance
- **Character Design:** Ada is an original AI character. No copyrighted game character models or assets are used.
- **Reference Model:** Sample model provided under CC-BY / VRM Consortium specifications. Drop your own VRoid or custom CC0 avatar into `apps/web/public/models/ada.vrm` anytime.
- **Icons:** Lucide React under MIT license.