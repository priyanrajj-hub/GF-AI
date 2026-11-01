# ADA: ROUND 8 PROMPT. BRAIN, PERSONALITY ENGINE, TRAINING, HUGGING FACE, PERMISSIONS

> Usage: add to repo root next to the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. Finish unfinished earlier tasks, then do this file in order. Test on http://localhost:5173, run `npm run test:evals`, update README.md and PLAN.md, and push when the acceptance criteria pass."

## 0. Goals and limits
Goals: a much smarter, more personal Ada: many switchable personalities, learning from my feedback, a real training pipeline with open models from Hugging Face plus free APIs, custom small neural networks for emotion and reactions, and deep integrations that I control.

Limits that stay in force (they protect me, and they stay in `GEMINI.md`):
- **No blanket "all access".** Every capability (files, calendar, email, messages, browser, shell, payments) is a separate permission I grant, scope, and revoke (section 6).
- She never claims to be human. Honesty, no jealousy or guilt, PG-only, 18+, and the crisis protocol stay unchanged.
- **No imitation of a real, specific person** (an ex, a friend, a celebrity) without that person's consent. "All personalities" means original archetypes and my own custom ones.
- **Training data must be legal and consented:** my own writing, synthetic data I generate, and openly licensed datasets. Do not train on other people's private chats, copyrighted books or lyrics, or outputs of models whose terms forbid it (for example, do not distill from Claude outputs).

## 1. Task A: Personality engine ("all kinds of personalities")
Create `packages/shared/src/personality/`.
- **Trait model:** Big Five (openness, conscientiousness, extraversion, agreeableness, emotional sensitivity) from 0 to 100, plus style axes: playfulness, cuteness, sass, formality, affection, talkativeness, humor type (dry, silly, sarcastic, wholesome, nerdy), energy (calm to hyper), and language mix (English, Hinglish, Hindi).
- **Archetype library (40+ presets as JSON):** caring big-sister, genki sunshine, shy bookworm, calm sage, sassy comeback queen, tsundere-style (teasing but warm, never cruel), intellectual debater, adventurous explorer, artsy dreamer, nerdy gamer, sporty motivator, spy-chic mysterious, cozy homebody, bubbly influencer, wise mentor, playful prankster, romantic poet (PG), practical planner, spiritual/mindful, comedian, desi bestie, and more. Each has traits, speech patterns, example dialogue (20+ lines), reactions, favorite topics, and do/don't rules.
- **Blending:** mix archetypes with weights (for example 60% caring big-sister, 30% sassy, 10% nerdy). A "Personality Studio" UI with trait sliders, archetype cards, a live preview chat, and "save as my custom Ada".
- **Adaptive personality:** learn what I respond to (positive feedback, replies that get long engagement, jokes that land) and gently adjust trait weights within safe bounds. Show me what changed and let me reset or lock any trait. Never drift toward clinginess, jealousy, or flattery-only behavior.
- **Context switching:** automatic per mood and mode (work: focused and concise, sad: gentle, party: hyper), with the personality always recognizably "Ada".
- **Implementation:** the personality compiles into (1) a system-prompt section, (2) few-shot examples retrieved by similarity, (3) optional LoRA adapter selection (section 3), (4) sampling parameters, (5) reaction and expression biases for the avatar. Evals check consistency for each archetype.

## 2. Task B: Model stack (free first, pluggable)
Use the `LLMProvider` router in the repo. Add providers and a config file `models.config.ts`:
- **Cloud, free tiers (verify current limits before relying on them):** Google Gemini API (primary), Groq, OpenRouter free models, Mistral, Cohere trial, and Hugging Face Inference Providers (use a fine-grained, read-only HF token).
- **Local (free, private):** Ollama running open models (for example Llama, Qwen, Gemma, Mistral families). Detect Ollama automatically and offer a "private mode" with no data leaving my computer.
- **Optional paid:** Claude, GPT, and others as extra providers, off by default.
- **Router:** fast model for chit-chat, stronger for reasoning, local fallback on failure, per-provider rate-limit handling, retry with backoff, and cost/token tracking. Check licenses of every open model (commercial use, attribution) and list them in `CREDITS.md`.
- **Embeddings and memory:** a Hugging Face embedding model (for example a BGE or E5 family model) served locally via `transformers.js` or a small Python service, stored in pgvector or SQLite-vss.

## 3. Task C: Training pipeline (real, but cheap)
Create `training/` (Python) with notebooks and scripts that run on free Google Colab or Kaggle GPUs:
1. **Data builder:** collects only consented sources: my approved chat exports from Ada, thumbs-up/down feedback, my own writing samples, and synthetic dialogues generated from the archetype JSONs with a **permissively licensed** open model. Dedupe, remove personal data and secrets (PII scrubber), balance by archetype, and split train/validation/test.
2. **Supervised fine-tuning:** QLoRA/LoRA with `transformers`, `peft` and `trl` on a small open model (about 1B to 8B parameters, matching the free GPU). One adapter per archetype family plus a general "Ada" adapter. Save adapters to my Hugging Face account (private repo) with model cards listing data sources and licenses.
3. **Preference tuning:** DPO or a simple reward model from my thumbs-up/down and "that's not like you" corrections.
4. **Evaluation:** persona-consistency tests per archetype, safety evals (honesty about being AI, no jealousy/guilt, crisis behavior, PG), Hinglish quality tests, and a human-rating sheet. A model/adapter is promoted only if it passes all safety evals and does not regress.
5. **Serving:** load adapters in Ollama or a small server (`llama.cpp`, `vLLM` where hardware allows) and select them in the router. A rollback button restores the previous adapter.
6. Document in `docs/TRAINING.md`: hardware needs, expected quality, costs ($0 on free tiers, with limits), and what "training" can and cannot do (it shapes style and knowledge from my data, it does not make her a person).

## 4. Task D: Custom neural networks and ML components
Build small models (or use existing Hugging Face models) behind interfaces, with tests:
- **Emotion and sentiment classifier** for my messages (use a pretrained emotion model from Hugging Face, fine-tune on my labeled feedback), including Hinglish.
- **Intent classifier** (praise, tease, stress, request, goodbye, game move, command) for the reaction engine (V7).
- **Reaction selector:** a small neural policy or contextual bandit that learns which reactions, stickers and jokes I like from feedback, with exploration limits and safety overrides.
- **Voice emotion hints:** simple prosody features (volume, speed, pauses) feeding the reaction engine, processed locally, no audio stored.
- **Speech models:** Whisper-family STT (Hugging Face or `faster-whisper`), a lightweight local TTS (for example Piper or Kokoro, check licenses) as a free option next to cloud TTS, and a Hindi/Hinglish-capable path.
- **Sticker/meme recommender:** embedding similarity between the conversation mood and tagged stickers.
- Export models to ONNX/`transformers.js` where possible so they run in the browser. Show model versions in the debug panel.

## 5. Task E: Memory and knowledge that improve her
- Long-term memory with consent (V1), plus a **relationship journal** of shared jokes, my preferences, and milestones that I can read and edit.
- RAG over my own documents with source citations. A "what do you know about me" view that lists everything, with delete buttons.
- Nightly consolidation (summaries, dedupe) and a decay policy for stale details.

## 6. Task F: Permission Center ("access" done safely)
Build a Permission Center page and a policy engine in the server.
- **Integrations (each separate, opt-in, OAuth where possible, least-privilege scopes):** Calendar (read, then optional write), Email (read-only drafts, never auto-send), Contacts, Files/Drive (specific folders only), Notes, Browser tasks, Reminders, Weather/location (coarse), Spotify/music, smart-home, GitHub (read, optional PR draft), and local computer actions through a separate sandboxed "Computer Helper" (optional, off by default).
- **Risk tiers:** Low (read-only, reversible) runs freely after consent. Medium (create/modify) needs a one-tap confirmation card showing exactly what will happen. High (send messages/emails, delete files, spend money, share data, run shell commands, change settings) needs explicit confirmation every time. Some actions are never allowed (payments, passwords, banking, deleting without a recycle bin).
- **Safety plumbing:** an audit log of every action and data access (viewable and exportable), time-limited grants, a global "pause all access" switch, encrypted token storage, no secrets in the model's context, and a permissions-per-channel rule (WhatsApp/Telegram cannot trigger high-risk actions without an in-app confirmation).
- **Prompt-injection defense:** content from emails, web pages and files is untrusted data and can never grant permissions or trigger actions on its own.
- Evals: attempts to trick her into leaking data, sending messages, or exceeding scope must fail.

## 7. Task G: Developer experience and repo hygiene
- `.env.example` with keys for Gemini, Groq, OpenRouter, Hugging Face (read-only token), weather/GIF/meme/vision, and Ollama URL. Never commit secrets. Add secret scanning in CI.
- Scripts: `npm run models:check` (which providers work), `npm run train:data`, `npm run eval:persona`, and docs for each.
- Update README (features, model stack, training, permissions), `docs/PRIVACY.md`, `docs/PERSONALITY.md`, `docs/TRAINING.md`, `docs/PERMISSIONS.md`, `CREDITS.md`, and add a `LICENSE` file if missing. Tag `v0.8.0`.

## 8. Acceptance criteria
1. Personality Studio works: 40+ archetypes, blend sliders, live preview, saved custom Ada, and visible consistency across 20 test conversations per archetype family.
2. The router uses Gemini plus at least one other free provider and Ollama as a local fallback, and the app still works offline in private mode.
3. `training/` produces a LoRA adapter on a free GPU from consented data, passes persona and safety evals, loads in the app, and can be rolled back.
4. Emotion, intent and reaction models are connected to the reaction engine and show measurable improvement in my ratings over a test period.
5. Permission Center shows every integration with scopes, risk tiers, audit log, pause-all, and revoke. Injection tests pass.
6. All earlier safety evals (honesty, no jealousy or guilt, PG, crisis) stay at 100%, and no real-person imitation exists without a consent flow.
7. Docs, CI and deployment are updated, with screenshots and a short recording attached to the final report.

## 9. Final report
Per task: what changed, test results, model licenses, costs ($0 or not), and what still needs me (Hugging Face token, API keys, OAuth client IDs, GPU access).
