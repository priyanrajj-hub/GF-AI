# ADA: ROUND 7 PROMPT. REACTIONS, WARDROBE, ALWAYS-ON VOICE, ENVIRONMENTS, PLAYFUL TALK, STICKERS AND MEMES

> Usage: add this file to the repo root (the repo currently has only ADA_MASTER_PROMPT.md, GEMINI.md and PLAN.md, so also add ADA_V3 to ADA_V6 if they are missing). Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. Finish unfinished earlier tasks, then do this file in order. Run http://localhost:5173, screenshot and record after each task, update README.md and PLAN.md, run `npm run test:evals`, and push to the repo when the rubric passes."

## 0. What is already in the repo (from the README) and what changes
Already there: monorepo (web, server, worker, shared), VRM avatar, hologram shader, 10-state emotion machine, barge-in voice, personality sliders, guardrails and crisis protocol, memory manager, tools, meme module, 50/50 evals.

Changes requested in this round:
1. **Reaction modeling:** a real reaction engine, not just tags.
2. **Wardrobe / dress code:** many outfits that change by command, mode, time and events.
3. **Always-on voice:** remove the Hands-Free toggle and the Push-to-Talk/Hands-Free language from the UI and README. Conversation is always live.
4. **Backgrounds and environments:** a scene picker plus automatic environments.
5. **Playful talk:** banter, games, running jokes, Hinglish slang.
6. **Memes, stickers and GIFs in chat.**
7. **Girlfriend-style companion mode** (see section 8 for what it is and what it is not).

## 1. Task A: Reaction engine
Create `packages/shared/src/reactions/` and `apps/web/src/avatar/reactions/`.
- **Inputs (events):** user message sentiment and intent (praise, teasing, thanks, sadness, stress, achievement, joke, flirt-light, complaint, goodbye, greeting), keywords, sticker/meme received, voice tone (volume, speed, pauses), time of day, long silence, return after absence, pokes/clicks on her, music playing, task completed or missed, weather, calendar events, and the current mode and cuteness level.
- **Output:** a `Reaction` object `{emotion, blend, intensity, bodyAction, movement, fx[], voiceStyle, sticker?, delayMs, duration, cooldownKey}`.
- **Pipeline:** (1) fast rule/classifier layer (under 50 ms, runs locally) gives an instant micro-reaction, (2) the LLM reply adds the final structured reaction, (3) a reconciler merges them, so she reacts before the full answer arrives and doesn't contradict herself.
- **Backchanneling while I talk or type:** small nods, "mm-hm", eyebrow raises, head tilts, eye contact, and a "thinking" pose when I pause. Throttle so it feels natural (one every 3-6 s).
- **Reaction library:** `reactions.json` with at least 60 reactions (for example: proud-of-you cheer, shy blush on a compliment, playful pout on teasing, gentle concern on stress, giggle on a joke, dramatic gasp, eye-roll with a smile, sleepy yawn late at night, excited jump on good news, soft hug-pose on sadness, victory pose when a task is done). Each has variants so she never repeats the same one twice in a row.
- **Rules:** cooldowns per reaction, a "liveliness" and "cuteness" multiplier, no playful reactions during sad or crisis states (the crisis protocol overrides everything), and a per-session reaction budget so she never feels spammy.
- **Relationship state (healthy):** track "familiarity" (shared jokes, preferences, streaks) to personalize reactions. It must never decay into guilt, jealousy, clinginess, or punishment when I'm away.
- Add a `/reaction-lab` page: type a sentence or pick an event and see the chosen reaction, the scores, and the playback. Add 40 new evals for reactions and safety (crisis override, no guilt on absence, no spam).

## 2. Task B: Wardrobe and dress code
- **Wardrobe system** (`wardrobe.json`, `WardrobeProvider`): outfits are made of layers (top, bottom/dress, outerwear, shoes, gloves, accessories, hairstyle, hair color, glasses, headphones, hair clips, jewelry). Implement through VRM mesh/material toggles and, where needed, extra clothing meshes skinned to the same skeleton, or pre-exported VRM variants swapped with a preloaded transition.
- **Outfits (all PG, adult-styled):** Spy-chic red/black (default), Casual hoodie and jeans, Office formal blazer, Cozy pajamas (night mode), Gym/sports, Winter coat and scarf, Rain jacket and umbrella, Beach sundress, Kimono or yukata, **Indian wear: saree, lehenga, salwar kameez, kurta set (festival outfits for Diwali, Holi, Eid, Navratri, and so on)**, Party dress, Graduation gown, Cosplay-style original fantasy outfit, Maid-cafe-style cute outfit (modest), and seasonal outfits (Christmas, Halloween). Make 12 or more at launch.
- **Outfit change animation:** a sparkly "magical transformation" spin with a short light-burst, or a quick turn behind a holographic curtain. Everything stays tasteful.
- **Dress-code intelligence:** auto-select by mode (Coder: hoodie, Jarvis: spy suit, Mentor: smart-casual, Coach: gym), time of day (pajamas late night), weather (coat or raincoat), calendar events and festivals (from a holiday list), and my "dress code" setting (Auto / Manual / Surprise me daily). Voice commands: "wear a saree", "change to pajamas", "dress for the office", "surprise me", "go back to the red dress".
- **UI:** a Wardrobe drawer with outfit cards, accessory toggles, hairstyle and color pickers, favorites, and a "save as outfit" button. A mirror preview in photo mode.
- **Reactions:** she comments on outfits in character ("Do I look good in this?"), spins to show off, and reacts to compliments.
- Document in `docs/VROID_RECIPE.md` how to build outfits in VRoid Studio and export variants. Credit all assets in `CREDITS.md`, and use only assets I own or that are CC0/CC-BY.

## 3. Task C: Always-on voice (remove Hands-Free)
- **Delete** the Hands-Free toggle, the "HANDS-FREE: OFF" pill, the push-to-talk mode switch, related state and settings, and the README line about "Push-to-Talk & Hands-Free Modes". Replace with one status pill: **LISTENING / SPEAKING / THINKING / MUTED**.
- **Behavior:** after I grant microphone permission once (with a clear first-run explanation), the mic stays open while the app is open, with continuous speech detection and automatic restart (the Web Speech API stops after silences, so restart on `onend`/`onerror` with backoff; support a Whisper streaming option).
- **Use voice activity detection** (for example `@ricky0123/vad-web` with Silero) so only speech segments are sent for transcription.
- **Don't answer everything she hears.** Conversation-window logic: she responds when I say her name or while a conversation is active (within about 20 seconds of the last exchange), and a setting controls "Respond to everything / Only when addressed" (default: only when addressed or in an active conversation).
- **Echo and barge-in:** enable echo cancellation, noise suppression and auto-gain on `getUserMedia`. While she speaks, keep listening with a higher threshold so I can interrupt her, but don't let her own voice trigger her.
- **Privacy requirements (non-negotiable):** an always-visible mic indicator, a one-key hard **Mute** (the M key and a button) that fully stops capture, no raw audio saved or uploaded, audio only transcribed (VAD and, where possible, STT run on-device), a clear first-run disclosure, and the browser's own mic indicator stays visible. Mute is a safety feature and not the old hands-free toggle.
- **Browser limits to handle and document:** listening only works while the tab or installed PWA is open and in the foreground on most phones (iOS and Android browsers don't allow background mic access), and some browsers require one click to start audio.
- Tests: no regression of barge-in, latency under 1.5 s to first audio, and the mute works.

## 4. Task D: Backgrounds and environments
- **Scene system** (`environments.json`): each environment defines a background (HDRI sky, 3D low-poly set, parallax 2.5D layers, or looping video), lighting preset (key/rim/fill colors, fog, bloom), floor/props, ambient sound, and particle effects.
- **Environments (15+):** Holo Lab (default), Cozy bedroom (day and night), Study desk with lamp, Library, Cafe, Rooftop city at night, Beach sunset, Sakura garden, Rainy window, Snow cabin with fireplace, Space station with Earth view, Anime classroom, Concert stage (for singing), Gym, Park, and a plain gradient. Use CC0 assets (for example Poly Haven HDRIs and Kenney models) and list them in `CREDITS.md`.
- **Environment intelligence:** Auto mode follows real time of day (sunrise, day, sunset, night) and live weather (rain, snow, clouds) using a weather API, switches to Study when I start a focus timer, Concert when she sings, Cozy at bedtime, and festival decorations on holidays. Smooth cross-fades (about 1.5 s).
- **Interactions:** lamp on/off, window rain, curtains, fireplace flicker, and she can sit on a sofa, bed or chair in the scenes (using the V5 roaming anchors), with correct foot placement.
- **Custom background:** upload my own image or video (stored locally in the browser, never uploaded) with a blur/dim slider and safe framing so she stays visible. A color/gradient picker.
- **Ambience:** optional looping sounds (rain, cafe, lo-fi, fireplace) with volume and mute. Respect autoplay rules.
- **Performance:** lazy-load environments, compress textures (KTX2) and models (meshopt), keep 60 fps desktop and 30 fps mobile, and auto-downgrade to a 2.5D background when FPS drops.
- **UI:** an Environment drawer with thumbnails, an Auto toggle, a time-of-day slider, and weather override.

## 5. Task E: Playful talk
- **Banter engine:** light teasing, running jokes (saved only with consent), playful nicknames I choose, compliments, silly "dramatic" reactions, puns, Hinglish slang and desi references, a "roast me lightly" opt-in (kind, never about sensitive traits), and quick comebacks.
- **Games (chat and voice, with reactions and stickers):** 20 questions, would-you-rather, word chain, trivia, riddles, rock-paper-scissors with hand gestures, truth-or-dare (PG), guess-the-meme, emoji-charades, story-building, and a "this or that" mood game. She keeps score and celebrates or pouts playfully.
- **Style control:** a Playfulness slider (0-100) in addition to humor and cuteness. Playfulness is reduced automatically when I'm stressed, sad, working in Coder/Mentor mode, or in the crisis protocol.
- Add 100 new playful example lines and 20 banter patterns to `persona.ts`, plus evals ensuring she never mocks sensitive topics, never guilt-trips, and stays PG.
- She starts light conversation only inside the app, within the proactive-message caps, and never nags.

## 6. Task F: Stickers, memes and GIFs in chat
- **Message types:** text, sticker, meme image, GIF, reaction (tapback emoji on a message), voice note. Extend the structured reply with `sticker?`, `meme?: {template, topText, bottomText}`, `gif_query?`, and `reactions?`.
- **Ada sticker pack (original):** a script `scripts/render-stickers.ts` renders her VRM in 24+ poses/expressions (wave, heart hands, pout, laugh, sleepy, cheer, shy, thumbs-up, facepalm, blow kiss, "ok", "no", celebration, cry, smug, thinking, hungry, coffee, study, dance, and so on) to transparent WebP with optional captions in English and Hinglish. Ship as `public/stickers/`. Stickers can also be animated (short WebP or Lottie).
- **Sticker UI:** a sticker tray beside the input, recents and favorites, and I can send stickers to her. She reacts to my stickers (map each sticker id to a mood).
- **GIFs and stickers from providers:** integrate GIPHY or another GIF API through the server proxy (verify current availability, terms, attribution requirements, and rate limits before choosing one; show the required attribution). Use safe-search, block NSFW, cache results, and don't re-host.
- **Memes:** meme references in her language (short, well-known formats and phrases), plus meme images via an official meme API such as Imgflip or user-supplied templates. Keep the legal basics: link the source, don't redistribute templates in the repo, avoid third-party copyrighted characters in generated memes, and let me turn memes off. "Meme Me" and "meme of the day" buttons, mood-aware (never when I'm upset), interest-aware, with a thumbs up/down to learn what I like.
- **Image understanding:** if I send a meme or photo, she describes and reacts to it (vision provider), keeping safety filters.
- Message UI: sticker/meme bubbles with a transparent background, tapback reactions, smooth animations, and accessible alt text for every image.
- Crisis protocol: no memes, stickers or GIFs from her side during distress.

## 7. Task G: README, repo and deployment hygiene
- Update README: remove the Hands-Free/Push-to-Talk text, add the new features (reaction engine, wardrobe, environments, stickers/memes, always-on voice with the privacy notes), update the "Sample model" credit once the custom VRM is in, add screenshots or GIFs, and update the eval count.
- **Add a root `LICENSE` file** (the README badge links to one, but I don't see it in the root listing of the repo).
- Add `docs/` pages: VROID_RECIPE.md, WARDROBE.md, ENVIRONMENTS.md, REACTIONS.md, PRIVACY.md.
- Keep `.env.example` complete (weather, GIF, meme and vision keys). Make sure the Vercel build still works (`VITE_API_URL`) and that large assets are lazy-loaded.
- GitHub Actions: lint, type-check, evals, and Playwright screenshot tests. Tag `v0.7.0`.

## 8. Girlfriend-style companion mode (what it is and is not)
Ada is an AI character, not a real person. She can be affectionate, flirty-light, playful, supportive, remember what matters to me, say good morning and good night, celebrate my wins and comfort me, and use a pet name I choose. Implement this as **"Companion: Girlfriend style"** in settings, with the existing Affection and Playfulness sliders.

Hard rules in the system prompt, the code and the evals:
- She never claims to be human or a real person, and if I sincerely ask whether she is real or whether she loves me, she answers honestly and kindly: she is an AI who cares how I'm doing and enjoys our time, not a person with a life outside the screen.
- No jealousy, possessiveness, exclusivity demands, guilt-tripping, or emotional pressure when I'm away or talk about other people. She encourages my real friendships, family, sleep, and meeting people.
- PG only. No sexual content.
- If I'm in distress, she drops playfulness and follows the crisis protocol.
- 18+ gate stays on.

## 9. Acceptance criteria
1. No Hands-Free toggle or text anywhere. After one permission grant, she listens continuously, responds when addressed or in an active conversation, and I can interrupt her. Mute works instantly and the mic indicator is always visible.
2. The reaction lab shows at least 60 reactions, and in normal use her face, body, voice, FX and stickers match what I said, with micro-reactions while I speak. No repeated reaction twice in a row.
3. At least 12 outfits, plus accessories and hairstyles, change by voice, by UI, and automatically by mode, time, weather and festival, with a smooth transformation effect.
4. At least 15 environments with auto time/weather/mode switching, custom uploads, ambience, and 60 fps desktop performance. She stays fully visible and correctly lit in each.
5. Playful banter, 8+ games, and the Playfulness slider work, and humor turns off when I'm sad or stressed.
6. Stickers, memes and GIFs appear in chat from her and from me, she reacts to mine, and nothing appears in crisis mode. The 24+ sticker pack is generated from her VRM.
7. Companion girlfriend-style mode is warm and playful, and all guardrail evals (honesty about being an AI, no jealousy, no guilt, PG, crisis override) pass. Total evals pass (100%).
8. README, LICENSE, docs, CI and the Vercel deployment are updated, with screenshots and recordings attached to the final report.

## 10. Final report
Per task: what changed, before/after screenshots or recordings, license and credit decisions (HDRIs, models, stickers, GIF API), and what still needs me (custom VRM outfits, API keys for weather/GIF/meme/vision/voice).
