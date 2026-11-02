# ADA: ROUND 11 PROMPT. PRIVACY CLEANUP, TIME-OF-DAY V2, REALISM, EMOTION V2, STUDY COACH, COMPANION LIFE

> Usage: add to repo root with the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. Do Task A (privacy) first and show me proof before anything else. Then do the remaining tasks in order. Verify each with the checks in section 10 (screenshots, a recording, test output) on http://localhost:5173/?debug=1, commit after each task, and push only when Task A has passed."

## 0. Review of the last report (what is good, what needs fixing)

Good: time-of-day backdrops, outfit sync, adult-looking styling, a procedural ambient sound engine, emotion tinting of lights, and 108/108 evals.

Needs fixing:
1. **Privacy risk (urgent).** The report says my real name, colleges, location, hardware, and online handles were "ingested" into persona and memory, and that fine-tuning dialogues were appended to `training/data/train.jsonl` and **pushed to the public `origin/main`**. Personal details must not live in a public repo or in git history.
2. **Unverified claims.** "Trained" here mostly means memory and prompt data. I need proof, not claims: run the checks in section 10 and attach screenshots.
3. **Earlier unresolved bugs** from `ADA_V10_FIX_ANIMATION_VOICE_REALTIME_PROMPT.md` (raw JSON in chat, avatar not dancing or singing, bad voice, particles, cut-off bottom bar) must be confirmed fixed. If any are still open, fix them before new features.
4. **Fixed clock hours** for time-of-day are too rigid, the voice "prosody" uses audio pitch/tempo shifting that can sound unnatural, and training dialogues use `*asterisk actions*` that would be shown or spoken as text.

## 1. Task A: Privacy cleanup (do first)

- **Audit:** search the whole repo and git history for personal data: my full name, college and program names, locations, handles (LeetCode, Codeforces, GitHub, Reddit), hardware, and anything else from the persona/memory ingestion (`git grep -iE`, `git log -p -S`, and a secrets/PII scanner such as gitleaks or trufflehog). Report every file and commit that contains it.
- **Move personal data out of the repo:** store it only in my private memory store (the database and the Memory Manager), in `.env`-style local files that are **gitignored**, or in a **private** Hugging Face dataset repo. The public repo ships only a fake demo persona ("Demo User") so anyone can try it.
- **Training data:** `training/data/*.jsonl` committed to git must contain **no real personal data**. Real-data files go in `training/private/` (gitignored) and are used only locally or on a free Colab session. Add a PII scrubber step to the data builder and a CI check that fails if names, handles, emails, phone numbers, or locations from my private profile appear in tracked files.
- **Rewrite history:** if personal data was pushed, purge it with `git filter-repo` (or BFG), force-push, rotate any exposed tokens, and ask me to make the repo private temporarily while this is done. Remind me that GitHub forks and caches may still hold copies.
- **Memory controls:** show every ingested fact in the Memory Manager with its source, an edit button, and a delete button. A "forget a source" button removes everything learned from that source (for example my portfolio). Memory ingestion from websites or profiles runs only when I click "Learn from this link", shows a preview of the facts to be saved, and needs my approval.
- **Persona honesty:** Ada uses what I told her naturally and sparingly ("how's DSA practice going?"), never recites my biography, and never claims human-style understanding. If sincerely asked, she says she remembers what I've shared with her.
- Add evals: no personal data in tracked files, no personal data in public demo mode, and memory deletion really deletes.

## 2. Task B: Time-of-day system v2

- **Real sun times** instead of fixed hours: compute sunrise, sunset and twilight locally with a library such as SunCalc from a coarse location (city-level, my consent, default Asia/Kolkata), and fall back to the fixed schedule if location is off. Add smooth **continuous interpolation** of sky color, light direction, intensity, fog, and ambience across dawn, morning, noon, golden hour, dusk, evening and night (not just four hard switches), with a manual time slider and "lock to this time" option.
- **Weather and season layer:** rain, clouds, mist, summer haze, monsoon, winter fog, driven by a weather API with an offline default. Environments get matching props (rain on the window, diya lights on Diwali evenings, lanterns, fireplace).
- **Wardrobe v2:** outfits come from **pools per time and context** (so she doesn't wear the same thing daily): morning (casual cotton kurta, cozy sweater, sporty set), noon (office blazer, smart casual, study hoodie), evening (saree, dress, ethnic-fusion, casual date outfit), night (pajamas, robe). Weight choices by my calendar (exam week: study outfits), weather (raincoat), festivals, mode (Coach: sporty), and recent outfits (no repeats within 3 days). Manual choice always wins until I say "back to auto", and the choice is remembered.
- **Change animation:** a short, tasteful outfit-change transition (turn, sparkle, or holographic scan), never mid-sentence, and she comments in character ("Evening already, time to dress up a little").
- **Sleep/wake behaviors:** at night she gets softer light, slower movements, a lower speaking volume, a yawn, and a "good night" ritual with optional wind-down tips. In the morning a "good morning" ritual with the briefing. Quiet hours respected for proactive messages.

## 3. Task C: Realism and fine detail (adult, tasteful)

- **Pick one coherent art direction** and polish it: either refined anime/toon (MToon with great shading) or semi-realistic (PBR skin, subsurface scattering approximation, detailed hair cards). Do not mix. Adult proportions are set in the VRM itself (VRoid sliders) and documented in `docs/VROID_RECIPE.md`; **bone scaling is only a small stopgap** (keep scales within about plus or minus 5% to avoid mesh distortion).
- **Face and eyes:** eyes with a highlight, subtle parallax and a moving catchlight, natural gaze behavior (hold eye contact 2-4 s, glance away, look at what she is talking about), asymmetric micro-expressions, brow and eyelid coupling with gaze, saccades, blink variability, and soft smile transitions with 150-400 ms timing.
- **Mouth:** viseme-based lip-sync from the TTS timing (not just amplitude) with co-articulation, and smile/vowel blending.
- **Body:** speech-synced beat gestures, breathing tied to speaking and pauses, weight shifts, hand micro-movements, posture changes by mood (tall and calm, slumped and tired, lean-in when interested), and graceful transitions between poses (no snapping).
- **Hair and cloth:** tuned spring bones (hair, sleeves, saree drape, skirt), wind response matching the environment, and collision with the body to avoid clipping.
- **Lighting and camera:** soft shadows, rim light, a contact shadow and reflection on the stage floor, subtle depth of field, and a gentle cinematic camera drift. Keep full body visible (V5), and keep performance at 60 fps desktop and 30 fps mobile with auto quality scaling.
- Keep everything PG and respectful: no suggestive camera angles, poses or outfits.

## 4. Task D: Emotion blending v2 (multi-sensory)

- **Single emotion state** `E = {valence, arousal, dominance, blend weights, intensity}` feeding every channel through one function, so face, body, voice, lights, sound and environment can never disagree. Add emotional **inertia** (moods change gradually over seconds to minutes, with slow background mood across the day) and decay.
- **Voice:** prefer emotion-capable neural TTS (style/SSML controls, emotion presets) over post-processing the audio. If post-processing is used, keep pitch shifts within about plus or minus 5% and use a formant-preserving shifter, never chipmunk effects. Add natural breaths, pauses, soft laughs and sighs (short licensed or synthesized non-speech sounds) at cue points, with a toggle.
- **Sound:** keep the procedural ambient engine and add: crossfades between time phases, ducking under her voice, a volume mixer (ambience, effects, voice), emotion stingers (a soft chime when she's delighted, a low hum when she's concerned), spatial panning that follows her position on the stage, a mute-all, and respect for autoplay rules. Optional CC0 ambience loops (with credits) for richer sound.
- **Lighting and environment:** emotion tint (keep it subtle), plus responsive details such as candle flicker rising with warmth, rain intensity on sad moments, and sparkles on joy, with smooth transitions.
- **No asterisk stage directions in text.** Convert `*smiles softly*` style text into cues (`[emo:warm 0.6]`, `[act:soft_smile]`) in the training data, the prompts and the UI, so nothing like that is shown or spoken as words.
- Test with a **cross-channel consistency eval**: for 50 scripted messages, check that the face, body, voice style, light color and ambience cue all match the target emotion.

## 5. Task E: Training data and model improvement (safe and real)

- Rebuild `training/` with: synthetic dialogues from the personality archetypes, my approved real chats (private, scrubbed, local only), feedback data (thumbs, "not like you"), cue-tagged emotion examples (not asterisks), Hinglish and Tamil-English mix examples I approve, and refusal/safety examples (honesty, no jealousy, crisis).
- Train a small LoRA adapter on a free GPU, evaluate against a held-out set, and promote it only if persona and safety scores don't regress. Report real metrics: persona consistency, cue accuracy, safety pass rate, and my ratings.
- Add a **cue classifier** (small model) that predicts emotion and gesture cues from any reply, as a fallback when the LLM forgets them, and a **user-mood detector** from text (later also voice tone) for her reactions. Show their accuracy in the debug page.
- Document the honest limits: this tunes style and knowledge from data. It does not give her real feelings or a human mind.

## 6. Task F: Study and career coach (matched to my goals)

- **Daily plan and streaks (healthy):** a planner that builds a realistic day from my goals (DSA practice, university coursework, AI/ML project time, rest). Streaks are optional and never guilt-based. Weekly review with her reflections and my own notes.
- **Coding practice partner:** suggests problems by topic and difficulty, explains hints in steps (never full solutions unless I ask), tracks weak topics, and runs timed "mock rounds" by voice. Use official APIs where they exist (for example the Codeforces API for contests and problem metadata) and check terms for any other source. Contest reminders with my confirmation.
- **Coursework tracker:** my online degree schedules, assignment and quiz dates (I enter or import them), spaced-repetition flashcards from my notes, formula sheets, and exam countdowns. She quizzes me out loud.
- **Research assistant:** daily or weekly "paper of the day" from arXiv with a plain-language summary, glossary, and "how to implement this" notes, plus a reading list I can edit.
- **Project mentor:** reviews my GitHub projects (read-only), suggests next steps, writes README improvements, and prepares viva or interview questions about my projects.
- **Roadmap tracker:** turn my goals (first deployed AI/ML model, research portfolio, GATE prep) into milestones with progress bars that she celebrates.
- **Focus mode:** a Pomodoro with her sitting quietly in a study environment, soft lo-fi ambience, no interruptions, and a short celebration at the end.

## 7. Task G: Companion life features (healthy and warm)

- Daily rituals: good morning, midday check-in, evening reflection, and good night, each short and optional.
- Mood journal and gratitude prompts with a private timeline, and gentle weekly insights ("you felt best on days you exercised"), shown to me only.
- Shared activities: a virtual cafe or stargazing "date" scene, cooking together with recipe voice steps, a picnic scene, a movie-night chat (discussion only, no copyrighted streaming), a travel-planning session, a language corner (Tamil, Hindi, English practice with gentle corrections), and mini-games.
- Memory callbacks and inside jokes (with consent), birthday and milestone celebrations, and a "memory lane" scrapbook with generated stickers.
- Healthy balance tools: sleep wind-down, hydration and posture nudges that I can switch off, "time for a break" suggestions, and encouragement to see friends and family.
- Honest character: she can disagree politely, push back on bad plans, and say when she's unsure, rather than agreeing with everything.

## 8. Task H: Platforms and extras

- **Desktop companion mode:** a transparent always-on-top window (Electron or Tauri) where she walks along the screen edges and reacts, with a hotkey to show or hide, click-through when idle, and a full "do not disturb" mode.
- **Mobile:** installable PWA with push, plus an optional Capacitor wrapper. Portrait layout with full body and a bottom-sheet chat.
- **AR mode:** WebXR "see her in my room" on a supported phone (with camera permission, nothing recorded).
- **Photo and wallpaper mode:** pose picker, backgrounds, outfits, export transparent PNG stickers and wallpapers.
- **Telegram and WhatsApp:** continue per V1 and V7 (official WhatsApp Business API only), with the daily caps, quiet hours and mute.
- **Accessibility:** captions, adjustable text size, reduced-motion mode, color-blind-safe UI, screen-reader labels, and keyboard control.
- **Offline/private mode:** a local model through Ollama and local STT/TTS with no data leaving my computer.

## 9. Task I: Quality, performance and cost

- Performance budget: 60 fps desktop, 30 fps mobile, initial load under 5 s with a progress bar, assets lazy-loaded and compressed (KTX2, meshopt).
- A cost and token dashboard, provider health page, and automatic fallback between free providers.
- Visual regression screenshots for each time of day, outfit, environment and emotion, at 1920x1080, 1366x768 and 390x844.
- Keep all evals green, including the new privacy, memory deletion, cross-channel emotion consistency and no-asterisk checks.

## 10. Verification and acceptance (all must pass, with proof)
1. Task A proof: scanner output showing no personal data in tracked files or history, the demo persona in the public build, and the Memory Manager showing sources with working delete.
2. Time-of-day: a recording that scrubs the time slider across 24 hours showing smooth sky, lighting, ambience and outfit changes, plus sunrise/sunset from real calculations.
3. Emotion consistency: the 50-message eval passes, and a recording shows one emotional moment changing face, body, voice, light and sound together.
4. No raw JSON, tags, markdown symbols or asterisk actions appear in chat or are spoken (V10 criteria still pass).
5. Realism: close-up and full-body screenshots with natural idle motion, gaze behavior, and lip-sync recorded for 15 seconds.
6. Study coach: a working daily plan, a coding mock round by voice, the exam countdown, and a paper summary.
7. At least three companion features (rituals, journal, shared activity) and the desktop or mobile mode work.
8. README, `docs/` (PRIVACY.md, RESEARCH.md, ASSET_POLICY.md, SAFETY_PROTOCOL.md, TRAINING.md) and CREDITS.md are updated, and the final report lists what still needs me.

## 11. Final report
For each task: what was found, what changed, test and scanner output, screenshots and recordings, licenses and costs, and anything that needs my input (API keys, VRM files, location consent).
