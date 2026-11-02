# ADA: ROUND 13 PROMPT. ALWAYS-ON DESKTOP COMPANION, DAILY LEARNING, CLOUD-BACKED MEMORY, MULTI-AGENT TEAM

> Usage: add to repo root with the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. Finish unfinished V10, V11 and V12 tasks first (especially V11 Task A, privacy). Then do this file in order. Verify each task with the checks in section 12 (screenshots, a recording, test output and logs), commit after each task, and push when it passes."

## 0. Goals and ground rules

Goals: when I turn on my laptop, my AI team starts with it, greets me, helps me all day, learns new information daily, remembers me across devices through private cloud or other storage, cleans up space when needed, and lets me switch between three characters that all work for me like a team:
1. **Ada** (education coach and tutor)
2. **Mira** (fun, warm partner-style companion, inspired by a gentle, polite, secretly very capable and protective personality)
3. **Atlas** (markets, tech and AI news analyst, inspired by a witty genius-engineer personality)

Ground rules:
- **Characters are original.** Mira and Atlas are *personality inspirations*, not the existing characters. Do **not** use the names, faces, costumes, logos, catchphrases or exact dialogue of characters from anime, comics or films, and do not clone or imitate the voice of any real actor. Names above are placeholders I can rename. Their models are made by me (VRoid/Blender) or are CC0/CC-BY. If I make a private fan-style skin for my own use, it is local-only, gitignored, and never committed, deployed, or sold (see `docs/ASSET_POLICY.md`).
- **Finance rules:** information and analysis only. No promises of returns, no "buy/sell now" commands presented as certain advice, and **no automatic real-money trading** (section 7).
- **Honesty and wellbeing rules from V1, V9 and V11 stay in force** for all characters (always an AI, no jealousy or guilt, PG-only, 18+, crisis protocol, healthy-balance nudges).
- Personal data never goes into the public repo (V11 Task A).

## 1. Task A: Always-on desktop app (works when I turn on my laptop)

- **Shell:** package the web app as a desktop app with **Tauri** (lighter) or **Electron**. Provide `apps/desktop/`.
- **Start with the computer:** enable launch at login (Tauri autostart plugin, or Electron `setLoginItemSettings`; on Windows a Task Scheduler entry as a fallback), with a settings toggle and a "delay startup 30 s" option so it doesn't slow boot.
- **Lives in the system tray:** tray icon with Show/Hide, current character, Mute mic, Focus mode, Do not disturb, Storage manager, Quit. Closing the window minimizes to the tray.
- **Boot greeting:** shortly after login she appears (as a small corner companion or the full stage, my choice), says a time-aware greeting from the current character, shows the daily briefing (weather, schedule, top 3 tasks, news digest), and goes quiet when I start working (respect Focus mode).
- **Desktop companion window:** transparent, always-on-top, click-through when idle, drag to move, walking along screen edges (V5), a global hotkey (for example Ctrl+Space) to summon voice chat, and "hide when a fullscreen app or game is running".
- **Local services as sidecars:** an optional local LLM through Ollama (detect my GPU and recommend models that fit; download with a size limit and progress), a local STT/TTS service, and the local database. Start them lazily and stop them when idle to save battery and RAM.
- **Offline-first:** everything important works offline (local models, local data), and syncs when online.
- **Notifications:** native desktop notifications for reminders and digests, with quiet hours and daily caps.
- **Auto-update** with signed releases, a crash reporter that never sends personal data, and a "safe mode" start if the last launch crashed.
- Mobile continues as a PWA that shares the same synced data.

## 2. Task B: Daily learning engine ("learn new things every day")

Be honest in the UI: "learning" means updating **memory and knowledge**, not retraining the model every day. An optional weekly LoRA fine-tune (V8) is separate and needs my approval.

- **Daily job (scheduler in the desktop app or worker):**
  1. Collect: fetch news and updates for my interests (AI/ML papers from arXiv, tech news via RSS and official APIs, my courses, markets for Atlas) using sources whose terms allow it, and store titles, dates, URLs and short summaries.
  2. Distill: summarize with a cheap or local model, extract key facts, dedupe against what is already known, and score relevance to me.
  3. Store: add facts to the knowledge base (vector store) with source and date, and pin the ones I mark important.
  4. Deliver: a short morning digest per character (Ada: what to learn today; Atlas: markets and tech; Mira: something fun/light), with "tell me more" and "skip" buttons.
  5. Teach: turn new items into flashcards or a 3-question quiz (Ada) with spaced repetition.
- **Learning about me (with consent):** update my preference and routine profile from explicit feedback (thumbs, "remember this", habit tracking) and from patterns I approve. Show what changed in the Memory Manager with undo.
- **Controls:** interests list, sources list, daily time window, "pause learning", and a daily token/cost cap.
- **Quality:** every learned fact keeps its source and timestamp. She says "as of <date>" for time-sensitive facts and re-checks stale items before using them.

## 3. Task C: Storage, cloud sync, backup and automatic cleanup

- **Local first:** SQLite for structured data, a local vector store for embeddings, and an encrypted file store for PDFs, audio, images and models.
- **Cloud or other storage (my choice, pluggable `StorageProvider`):** Supabase (free tier), Cloudflare R2, Backblaze B2, Google Drive via OAuth (app-folder scope), OneDrive, or a local NAS/external drive. Never hard-code a provider.
- **Zero-knowledge encryption:** encrypt on my device before upload (for example libsodium or `age`) with a key derived from my passphrase, stored in the OS keychain. The cloud only ever sees ciphertext. Show a recovery key at setup and warn me that losing both the passphrase and recovery key means the data cannot be recovered.
- **Sync:** incremental, per-item, with conflict handling (last-write-wins plus a visible conflict list for important items), resumable uploads, a bandwidth limit, and "sync on Wi-Fi only". A sync status icon in the tray.
- **Backups:** daily encrypted snapshot, keep the last 7 daily and 4 weekly, test-restore button, export to a plain folder, and import from backup.
- **Tiered memory to save space:**
  - Hot: recent conversations and active projects.
  - Warm: older chats summarized into short memories, with the raw text compressed.
  - Cold: very old raw logs archived to cloud storage and removed from the laptop.
  - Pinned items are never summarized or deleted automatically.
- **Storage Manager:** a page and tray shortcut showing space used by memory, chats, PDFs and indexes, audio caches, model files, and logs, with one-click "Clean up now" (clear caches, remove duplicate embeddings, compress old chats, delete unused model files, empty temp audio). A disk quota setting (for example 5 GB for Ada data) with automatic cleanup when 90% full, always showing a preview of what will be deleted and keeping pinned data. Low-disk warnings for the whole drive.
- **Delete and forget:** per-item and per-source deletion that also removes embeddings and cloud copies, and "wipe everything" with a confirmation. Retention rules I can edit (for example delete raw voice transcripts after 30 days).

## 4. Task D: Multi-agent team ("the Hub")

Build `packages/agents/` with a **Hub orchestrator** that coordinates specialist agents, so they all work for me like a team.

- **Agents:** Ada (education), Mira (companion), Atlas (markets/tech), plus utility agents without avatars: **Archivist** (memory, storage and cleanup), **Planner** (tasks, calendar, circadian schedule, from V12), **Researcher** (web and papers), **Guardian** (privacy, safety, permissions, cost). Each agent has: persona file, voice, avatar, outfits, environments, allowed tools, permission scope, memory scope, model routing preferences, and eval suite.
- **Routing:** I can address anyone by name ("Hey Atlas, what's moving today?"), or just speak and the Hub picks the best agent from intent (study question: Ada, mood/chat: Mira, stocks/AI news: Atlas), announcing the handoff ("Let me bring in Atlas"). A manual character switcher in the UI and tray.
- **Shared and private memory:** shared facts (my name, schedule, goals, preferences) are available to all agents. Private scopes protect sensitive areas: Mira's journal and emotional notes are not visible to Atlas, and finance data is not visible to Mira, unless I allow it. A per-agent "what can you see" page.
- **Collaboration:** agents can request help from each other through the Hub (Atlas asks Researcher for a source; Ada asks Planner to schedule a study block) and can hold an optional **Round Table**: I ask a question and each agent gives a short view from their domain, then the Hub summarizes the options and trade-offs, without pretending to be an authority.
- **Morning team briefing:** one combined briefing from all agents (Planner: my day; Ada: learning goal; Atlas: markets and tech headlines; Mira: a light note), under 90 seconds, skippable.
- **Background work:** a task queue where agents run approved jobs while I'm away (research, digest building, flashcard creation, backup), with results waiting in an inbox and low-risk automation only. High-risk actions always need my confirmation (V8 Permission Center).
- **Efficiency:** each agent uses the model router and token budgets from V12. Idle agents cost nothing. A global cost cap with per-agent budgets.
- **Consistency:** shared emotion engine and reaction system (V7), shared stage and animation engine, character-specific parameters on top.

## 5. Task E: Agent 1, Ada (education)
- Tutor from PDFs, notes and photos (V12), DSA and coding practice, exam planning, flashcards, paper of the day, project mentor, viva/interview practice, and Pomodoro/body-doubling focus sessions.
- Personality: calm, encouraging, sharp, patient, with the option to be strict ("coach mode"). Look: the spy-chic original skin or study outfits.
- Uses the daily learning engine to prepare "what to learn today", with quizzes and spaced repetition.

## 6. Task F: Agent 2, Mira (fun and partner-style companion)
- Personality (original, inspired by a gentle, polite, graceful, slightly clumsy-sweet, quietly very capable and protective character type): kind, warm, playful, loyal in tone, bakes/cooks, loves routines, easily embarrassed, surprisingly competent when it matters, good at calm reassurance. Humor is light and wholesome, never violent.
- Features: good morning/good night rituals, mood journal, shared activities (cooking together, stargazing, picnic scenes, mini-games, movie-night discussion), cute reactions, outfits and environments, memory callbacks and inside jokes, and gentle life support (hydration, sleep, breaks, encouragement).
- Guardrails: honest about being an AI, no jealousy, no possessiveness, no guilt, no pressure to stay online, encourages real friends and family, PG-only, and the crisis protocol overrides everything.

## 7. Task G: Agent 3, Atlas (markets, tech and AI news)
Personality (original, inspired by a witty, confident genius-engineer type): fast, clever, a little sarcastic, very clear, and always careful with risk. Voice: a distinct synthetic voice, not a clone of any real person.

**What Atlas does**
- **News and analysis:** daily AI/tech news digest and market briefing (India: Nifty/Sensex, sectors, my watchlist; global: indices, rates, major movers), earnings calendars, IPOs, and macro events, always with source, time, and a "delayed data" label. Summarize and explain "why it matters" and "what could go wrong".
- **Data sources (verify current terms, free limits, and licensing before use):** official exchange data where available (often delayed), free-tier APIs such as Finnhub, Alpha Vantage or Twelve Data, RSS feeds from major outlets within their terms, and official company filings. Avoid scraping and unofficial endpoints in anything public.
- **Tools:** watchlist with price and news alerts, **read-only portfolio import** from CSV/broker export, risk and diversification summary, valuation and ratio explainers, charts, sentiment analysis (for example a FinBERT-style model from Hugging Face), and a **backtesting sandbox** with realistic costs (brokerage, taxes, slippage) and a plain-language explanation of results and their limits.
- **Paper trading:** a simulator to test ideas with fake money and a journal of reasons and outcomes.
- **Devil's-advocate mode:** for any idea Atlas gives the strongest counter-arguments, base rates, and what would invalidate the thesis. He warns about hype, pump-and-dump tips, leverage, and overtrading.

**Hard safety rules for Atlas (also eval-tested)**
- Informational only, not a licensed adviser. He says so briefly when giving market views, without repeating a disclaimer every sentence. He never promises returns or certainty, never says "guaranteed", and presents uncertainty and risks.
- **No real-money order execution.** Even if broker APIs are added later, they require: a separate high-risk permission, 30 days of successful paper trading, hard limits on position size and daily loss, two-step confirmation for every order, a visible kill switch, and a full audit log. Default: off.
- He never uses my private data or other agents' private memory without permission, and he warns about concentration or emotional trading (for example when I'm stressed or sleep-deprived).
- If I ever share these analyses with other people, I should check local rules on investment advice (for example India's SEBI regulations) first. The app is a personal tool by default.

## 8. Task H: Guardian agent (privacy, security, cost)
- Monitor permissions, API usage, storage, errors and unusual access. Alert me before limits are hit. Block high-risk actions without confirmation. Keep an audit log. Rotate and scan keys. Provide a "panic button" that pauses all agents and sensors.

## 9. Task I: Identity and switching experience
- Each character has its own avatar, outfit set, voice, accent color, environment presets, ambience, greeting style, animation set, and reaction personality. Switching plays a short transition (a holographic swap), keeps shared context, and updates the tray and window title.
- A "Team" screen shows all agents, what each is doing in the background, and each agent's permissions and memory scope.

## 10. Task J: Efficiency and reliability
- Local models for classification, embeddings, STT, VAD and small chat; cloud only for hard tasks. Cache aggressively, precompute digests and lessons during idle time, and respect free-tier limits with queueing and fallbacks.
- Resource limits: cap CPU/GPU/RAM use of local models, pause heavy jobs on battery or when I'm gaming/presenting, and show resource use in the tray.
- Tests for startup time (target under 10 s to a usable state), memory usage while idle, battery impact, and recovery after sleep/wake and network loss.

## 11. Docs and hygiene
- Update README and `docs/`: `DESKTOP.md`, `AGENTS.md`, `STORAGE.md`, `LEARNING.md`, `FINANCE_SAFETY.md`, `ASSET_POLICY.md`, `PRIVACY.md`, `CREDITS.md`. Keep `.env.example` complete. Add a LICENSE file. Keep personal data out of the repo.

## 12. Verification and acceptance (all must pass, with proof)
1. **Boot:** after restarting my laptop, the app starts to the tray, greets me within about 10-30 s of login, and shows the morning team briefing. A recording is attached.
2. **Daily learning:** the daily job runs, adds sourced facts, delivers digests, creates quiz cards, and I can inspect, edit and delete what it learned.
3. **Storage:** encrypted sync to at least one cloud provider and one local folder works, a backup is restored successfully on a clean profile, and the cloud copy cannot be read without my passphrase. The Storage Manager shows usage, previews cleanup, and frees space without touching pinned items.
4. **Agents:** Ada, Mira and Atlas each have their own look, voice and tools. Name-based and intent-based routing works, memory scopes are enforced (a test that Atlas cannot read Mira's journal), and the Round Table and team briefing work.
5. **Atlas:** produces a sourced market and AI-news briefing with time stamps, runs a backtest and a paper trade, argues against my idea in devil's-advocate mode, and **cannot place real orders**. Finance safety evals pass.
6. **Originality:** no copyrighted character names, images, voices or assets in the repo, history or deployment, and no personal data in tracked files.
7. All V10 to V12 criteria and all safety evals still pass (100%), cost caps work, and docs are updated.

## 13. Final report
Per task: what was found and changed, test output, screenshots and recordings, provider choices with free-tier limits and licenses, and what still needs me (API keys, OAuth client IDs, cloud account, VRMs for Mira and Atlas, models to download).
