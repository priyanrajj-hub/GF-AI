# ADA: ROUND 12 PROMPT. BETTER LOOK AND VOICE, PDF TUTOR (LOCAL AI), FOCUS MODE, CIRCADIAN PLANNER, TO-DO, WEBCAM + VOICE, EFFICIENT API USE

> Usage: add to repo root with the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. Finish unfinished V10 and V11 tasks first (especially V11 Task A, privacy). Then do this file in order. Verify each task with the checks in section 11 (screenshots, a recording, test output, and token/cost logs) on http://localhost:5173/?debug=1, commit after each task, and push when it passes."

## 0. Goals
1. Ada looks noticeably better and more refined.
2. Her voice sounds natural and clear, and she can teach with it.
3. A **local-first AI tutor**: I give her a PDF and she teaches me from it with her voice, quizzes me, and tracks my progress.
4. Focus mode, a circadian-rhythm-aware planner, and a real to-do system.
5. She can use my microphone and webcam (with my consent, processed locally) and respond properly.
6. API usage is efficient: low tokens, caching, local models where possible, and a visible cost dashboard.
7. She helps my life in practical ways, like a supportive partner, without replacing real-world relationships.

## 1. Task A: Make her look better (concrete changes)
- **Shading and color grading:** tune the toon/PBR materials with a clear light-to-shade ramp, a soft rim light, and a per-time-of-day color-grading LUT (warm morning, crisp noon, golden dusk, cool night). Add subtle bloom only on emissive parts, SSAO for contact shadows, and an anti-aliased clean outline pass (thin and slightly darker than the base color, not black).
- **Face:** larger, more detailed eyes with layered iris, a moving catchlight, soft eyelid shading, natural brow shapes, tuned blush and lip color, and expression ranges that never distort the mesh. Add natural gaze behavior and micro-expressions (V11).
- **Hair:** hair-shine band, layered hair cards with soft translucency, tuned spring bones, no clipping through shoulders or clothes.
- **Outfits and fabric:** rich fabric textures (knit ribbing, satin sheen, silk drape), better seams and trims, and correct physics for sleeves, dupatta/saree drape and skirts.
- **Body:** natural weight shifts, relaxed shoulders, curled fingers, and posture that matches mood. Adult proportions come from the VRM itself (VRoid sliders), documented in `docs/VROID_RECIPE.md`.
- **Stage:** a clean reflective floor, soft contact shadow, subtle depth of field, gentle particles (soft round sprites), and a background that always stays darker or blurrier than her so she stands out.
- Build a `/look-lab` page: side-by-side render presets (Soft Anime, Cinematic Toon, Semi-Real), sliders for shading, outline, bloom and exposure, and one-click screenshot export. Pick the best default by comparing screenshots with me.

## 2. Task B: Better voice (speaking and listening)
- **TTS quality:** implement and compare, behind `TTSProvider`: a local neural voice (Kokoro or Piper, check each voice license), Google or Gemini TTS, Azure Neural, and ElevenLabs free tier (verify current limits, terms and attribution rules before use). Build a `/voice-lab` page with A/B listening tests across 10 fixed sentences (English, Hinglish, teaching text, an emotional line) and let me rate them. Use the highest-rated provider as the default, with a local fallback.
- **Voice persona:** warm, soft, friendly, mid-range, clear Indian-English and Hinglish pronunciation, natural pace around 0.95-1.05x. No cloning of real people without consent.
- **Speaking quality:** sentence-level streaming with prefetching, text sanitizer (no markdown, JSON, URLs, emoji or tags spoken), number/date/formula expansion, natural pauses, light breaths, and emotion-aware prosody through SSML or style controls (avoid heavy pitch/tempo post-processing).
- **Teaching voice mode:** slower and clearer, short chunks, emphasis on key terms, deliberate pauses before questions, and rules for reading math ("x squared plus 2x") and code ("for i in range 10") aloud.
- **STT quality:** voice activity detection, noise suppression and echo cancellation, a local Whisper-family model (such as `faster-whisper`, `whisper.cpp`, or `transformers.js`) with cloud fallback, Hinglish handling, custom vocabulary (DSA terms, my course names), partial results while I speak, and confidence handling (she asks "did you mean...?" instead of guessing).
- Latency target: first audio under about 1.2-1.5 s after I stop speaking, with barge-in always working.

## 3. Task C: Local-first PDF tutor
**User flow:** I drag a PDF onto Ada (or a document camera photo, see Task H). She builds a course from it, then teaches me with her voice while showing the PDF page beside her.

- **Ingestion pipeline (local):** parse with `pdf.js` or `pdfplumber`, OCR scanned pages with Tesseract, extract headings, tables and equations as best as possible, keep page numbers and bounding boxes, and optionally describe figures with a local or cloud vision model on request. Show progress and let me cancel.
- **Chunking and index:** structure-aware chunks (by heading and paragraph) with page references, local embeddings (a BGE/E5-family model through `transformers.js` or a small local service), and a local vector store (SQLite-vss, Chroma, or pgvector). PDFs and indexes stay on my device unless I choose cloud mode.
- **Course builder:** generates a table of contents, learning objectives, a lesson plan per section (explain, example, check), glossary, flashcards, and quiz banks. Cache everything so it is built once.
- **Teaching loop:** explain a chunk in simple language, give an example, ask a check question, adapt (re-explain differently when wrong, go deeper when right), and schedule spaced-repetition reviews. Controls by voice or buttons: "slower", "repeat", "give an example", "why?", "skip", "quiz me", "summarize this chapter", "explain like I'm new", "go deeper", "pause".
- **Sync with the document:** show the PDF page with the passage she is explaining highlighted, and cite page numbers in every answer. Clicking a citation jumps to the page.
- **Grounding rules:** answer from the PDF first, say "this isn't in the document" when it isn't, and clearly label any outside knowledge as such. Never invent page numbers or quotes.
- **Math and code:** render with KaTeX, run small code samples in a sandbox, and draw diagrams with Mermaid when helpful.
- **Progress:** per-topic mastery, weak-topic list, daily review queue, and a lesson recap. Export notes as Markdown.
- **Large files:** lazy indexing, hierarchical summaries, and a cap with a clear message for very large PDFs.
- **Local AI mode:** when Ollama is available, the whole tutor runs locally with a small instruction model for explanations and quizzes and local embeddings for retrieval. Cloud mode is an optional upgrade for harder explanations, using the efficiency rules in Task D.

## 4. Task D: Use APIs efficiently
- **Router by task:** local models for embeddings, VAD, STT, emotion/intent classification, reranking and small chat; a cheap fast cloud model for ordinary replies; a stronger model only for hard reasoning or when I ask for deeper help.
- **Token budgets per feature** (for example chit-chat input under about 1.5k tokens, tutor answer under about 3k including retrieved chunks), enforced by the context builder with automatic summarization of older turns.
- **Retrieval discipline:** small top-k (3-5 chunks), rerank locally, strip boilerplate, and never resend the whole PDF. Use provider prompt caching or context caching where supported for static persona and course context, and an in-app semantic cache for repeated questions.
- **Precompute offline:** generate course outlines, flashcards and quizzes once per PDF and cache them, so live teaching mostly reads from storage.
- **Resilience:** request queue with rate-limit backoff, automatic fallback to another free provider or the local model, and a clear "eco mode" toggle that forces local-first behavior.
- **Cost dashboard:** tokens and estimated cost per feature, per provider, per day, with monthly caps and warnings at 80%. Show the average tokens per turn.
- Keep the API keys server-side only. Never commit keys.

## 5. Task E: Focus mode
- **Sessions:** Pomodoro (25/5), deep work (50/10 and 90/20), and custom blocks. Each session starts with a one-line goal and ends with a quick reflection (what I finished, distraction count, focus rating).
- **Body doubling:** Ada sits and studies beside me in a calm environment with soft lo-fi or rain ambience, minimal animations, no chatter, and short encouragement only at transitions (adjustable).
- **Distraction control:** detect when the tab loses focus and log it. An optional browser extension or desktop helper (with my permission) can block or warn about distracting sites during sessions, with a clear "end session" escape hatch. Pause her proactive messages and channel notifications during focus (do-not-disturb).
- **Optional presence and attention sensing** using the webcam, fully local (Task H): detect "away from desk", "looking away for a long time", and slouching, then give gentle nudges. It never records or uploads video.
- **Healthy breaks:** the 20-20-20 eye rule, hydration and stretch prompts, and guided micro-breaks with her demonstrating a stretch.
- **Focus analytics:** daily and weekly focus hours, best times of day, distraction patterns, and streaks that are encouraging and never guilt-based.

## 6. Task F: Circadian rhythm and energy planner
- **Chronotype setup:** a short questionnaire (morning/evening preference), my usual sleep and wake times, and optional import of sleep data from a health app with my consent. No medical claims or diagnoses, and a gentle suggestion to see a doctor if I report persistent sleep problems.
- **Energy tracking:** quick 1-5 energy and mood check-ins a few times a day. Learn my personal pattern over weeks and show it as a simple chart.
- **Smart scheduling:** place demanding tasks (study, coding, writing) in my peak-energy windows, light tasks in dips, and breaks and exercise at natural slumps. Suggest caffeine cut-off times, light exposure in the morning, meal and hydration reminders, and a wind-down routine at night.
- **Environment sync:** the UI warms and dims in the evening, the background and her outfit follow the time (V11), and at night she guides a short wind-down (breathing, journaling, plan for tomorrow) and says good night.
- **Wake-up routine:** a gentle alarm (PWA/push) with her good-morning message, the day's three priorities, and the weather.

## 7. Task G: To-do and planner
- **Tasks:** title, notes, project, tags, priority (Eisenhower matrix), due date, time estimate, subtasks, recurrence, and status. Offline-first storage (IndexedDB) with optional sync to my account.
- **Voice and natural language:** "Add finish graph assignment tomorrow evening, two hours, high priority" creates the task correctly. She reads back what she understood and I can correct it.
- **Planning:** a Today view with at most three "must do" items, auto time-blocking into my calendar gaps and peak-energy windows, rollover of unfinished tasks with a gentle prompt (not scolding), and weekly planning and review.
- **Calendar:** optional Google Calendar integration through OAuth with least-privilege scopes (read first, write only with confirmation), plus ICS/CSV import and export.
- **Coaching:** she breaks big tasks into steps, estimates effort, notices overload and suggests dropping or moving items, and celebrates completions with a reaction, sound and sticker.
- **Reminders:** push and Telegram within the daily caps and quiet hours.
- **Tie-ins:** start a focus session from any task, log time to the task, and link tutor lessons and flashcard reviews as tasks.

## 8. Task H: Microphone and webcam with proper consent
- **Permissions UX:** a clear first-run explanation, per-feature toggles (voice, webcam presence, expression awareness, gesture control, camera-as-document-scanner, screen sharing), a persistent on-screen indicator whenever a sensor is active, and a one-key hard mute and "camera off".
- **Local processing:** use on-device models in the browser (for example MediaPipe face/pose/hand landmarks) for presence, attention, posture, simple gestures (wave, thumbs-up) and optional expression mirroring. **No identity recognition, no saving or uploading frames**, and no emotion "diagnosis". Treat any mood estimate as a soft hint ("you look tired, want a break?") and let me correct it.
- **On-demand vision:** "look at this" captures one frame (or my chosen window through screen share) and sends it to a vision model only after I click or say so. Use it for a book page, handwritten notes, a diagram, a coding problem on screen, or an error message, then she explains and teaches from it. Show exactly what was sent.
- **Document scanner:** photograph a page, OCR it, and add it to the tutor as a lesson.
- **Responding properly:** reactions to what she sees and hears (a smile when I smile, concern when I look exhausted, a wave back) must be subtle, throttled and never creepy. A "privacy mode" disables all of it with one switch.
- **Safety and privacy:** sensor data is processed locally by default, retention is zero by default, and the privacy page lists exactly what each sensor does.

## 9. Task I: Partner-like support (healthy)
- Daily check-in that connects my mood, sleep, tasks and goals, and offers one or two concrete suggestions. Weekly review with wins, patterns and one small experiment for next week.
- Accountability that is kind: she reminds me of commitments I set, helps me restart after a bad day, and never shames.
- Stress support: breathing exercises, short walks, journaling prompts, a "tell me what's on your mind" mode, and a gentle push toward real people (friends, family, mentors) and professional help when needed.
- Life dashboard (private): sleep regularity, focus hours, tasks done, learning progress, mood trend, and time spent with Ada, so the app supports a balanced life and doesn't replace it.
- She stays honest about being an AI, does not become jealous or possessive, and keeps the V9 wellbeing safeguards and crisis protocol.

## 10. Task J: Other modifications
- First-run onboarding wizard (name, chronotype, goals, voice choice, permissions, privacy), a consolidated settings page, keyboard shortcuts, an offline-capable PWA, data export and backup, themes, localization (English, Hindi, Tamil UI strings where practical), accessibility (captions, reduced motion, large text), clear error states and retry buttons, and a "what's new" changelog.
- Performance: 60 fps desktop, 30 fps mobile, lazy-load heavy features (PDF tooling, vision models, voice models), and keep initial load under 5 s.
- Evals: add tests for PDF grounding (no invented citations), token budgets, focus/circadian scheduling, task parsing, sensor privacy (no frames stored or sent without action), and all earlier safety evals at 100%.

## 11. Verification and acceptance (all must pass, with proof)
1. **Look:** `/look-lab` screenshots at the three presets and morning/noon/dusk/night, and my approved default.
2. **Voice:** `/voice-lab` results and a 15-second recording of a natural reply and a teaching explanation, with first-audio latency numbers.
3. **PDF tutor:** I upload a real sample PDF (a textbook chapter or paper). Ada builds the course, teaches a section by voice with the matching page highlighted, answers a question with correct page citations, says "not in the document" for an unrelated question, quizzes me, and schedules review. Run it once fully local with Ollama.
4. **Efficiency:** the cost dashboard shows tokens per turn, cache hits, and local vs cloud usage for a 30-minute tutoring session, with an average input under the budgets above.
5. **Focus and circadian:** a recorded focus session with body doubling, a distraction log, and break prompts, plus a day plan placing hard tasks in my peak energy window.
6. **To-do:** a voice-created task with correct parsing, time-blocking, rollover, and calendar import or export.
7. **Webcam and mic:** consent flows, visible indicators, presence/posture nudge working locally, an on-demand "look at this" example, and proof that no frames are stored or uploaded otherwise.
8. All V10 and V11 criteria still pass, evals are at 100%, docs and README are updated, and the final report lists what still needs me (API keys, models to download, OAuth IDs, a better VRM).

## 12. Final report
Per task: what changed, test output, screenshots and recordings, token/cost numbers, model and voice licenses, and anything that needs my input.
