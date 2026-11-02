# ADA: ROUND 10 PROMPT. FIX THE BROKEN CORE: REPLY PARSING, REAL-TIME EXPRESSIONS, WORKING DANCE/SING/MOVE, BETTER VOICE

> Usage: add to repo root with the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. This file is a bug-fix and verification round: do tasks A to H in order. For each task, run http://localhost:5173, prove it works with the checks in section 9 (screenshots, a screen recording, and test output), and do not move on until it passes. Commit after each task and push."

## 0. Diagnosis from the latest screenshot (root causes)

1. **Raw JSON is leaking into the chat.** The reply bubble shows text like `"display_text": "### Morning Briefing...", "emotion": "happy", "intensity": 0.9, "gesture": "wave", "voice_style": {...}, "actions": []}`. So the model's structured reply is **not being parsed**. Consequences: (a) the avatar never receives the emotion, gesture or action, which is why the top bar says MOOD: CALM and ACTION: IDLE although the reply says "happy" and "wave"; (b) the **text-to-speech is very likely reading the raw JSON or markdown symbols aloud**, which is a major reason the voice sounds bad.
2. **The avatar does not move.** There is no visible idle motion, no walk, no dance, no singing. The animation mixer is probably not connected to the action pipeline, and no real clips are loaded.
3. **Voice quality:** robotic browser voice, text not cleaned before speaking, no emotion-based prosody, no sentence-level streaming.
4. **Visual glitches still present:** the thin cyan vertical line through her legs, big square pixel particles (they should be soft round sprites), the bottom control bar and chat input are cut off by the viewport edge, and the greeting still says "Operator" in Playful mode.

Fixing 1 and 2 is the priority, because everything else (dance, expressions, reactions) depends on them.

## 1. Task A: Bulletproof reply pipeline (no raw JSON, ever)

- **Structured output:** when calling Gemini, use JSON mode with a response schema (`responseMimeType: "application/json"` with a `responseSchema`), or the equivalent for other providers. Validate with Zod.
- **Robust parser** in `packages/shared/src/reply/parseReply.ts`:
  - Strip code fences, find the first balanced JSON object, repair common errors (trailing commas, smart quotes, truncated output), and fall back to treating the whole text as plain `display_text` with a neutral reaction if parsing fails.
  - Handle double-encoded JSON, partial JSON during streaming, and replies where JSON appears after prose.
  - **A hard rule in the UI layer:** the chat bubble can only render `display_text`. A unit test must fail the build if any bubble text matches `/"display_text"|"emotion"\s*:|"gesture"\s*:|^\s*[{[]/`.
- **Separate three fields:** `display_text` (markdown for the chat), `speech` (plain text for TTS, written for the ear), and `cues` (emotion, gesture, actions, voice style). The TTS receives **only `speech`**, after a sanitizer (section 4).
- Add 30 unit tests with real malformed examples (including the one in the screenshot) and an eval that the greeting in each mode is clean.
- Replace "Operator"/"Partner" in every mode with the user's name from settings (default: no title).

## 2. Task B: Real-time expressions and reactions

Goal: her face and body react **while she speaks, while I speak, and the instant I send a message**, not after the whole reply.
- **Instant layer (under 100 ms, local):** a classifier on my message (and later my voice tone) produces an immediate micro-reaction (a nod, eyebrow raise, small smile, concerned look) before the LLM answers. Use the V7 reaction engine, with a fallback rule list so it works even without any model.
- **Streaming cue protocol:** stream the reply as plain speech text with inline cue tags, for example `Hey! [emo:happy 0.8] I missed you [act:wave] ...`. Parse progressively while tokens arrive, strip the tags from the text, and schedule each cue at its position in the audio timeline (map character offsets to time using the TTS word/sentence timings or an estimated speaking rate). Tags: `[emo:name intensity]`, `[act:id]`, `[look:camera|away|down]`, `[fx:name]`, `[pause:ms]`, `[voice:softer|louder|faster|slower]`. Keep the JSON schema as a fallback for providers without streaming.
- **While I talk or type:** backchannel nods, listening posture, eyes on the camera, and a thinking pose when I pause. Throttle to one every 3-6 s.
- **Expression engine:** continuous blending of all 30+ expressions with easing, intensity decay, and layered micro-expressions (blink, brow flicks, eye darts, mouth corners). Sync visemes for lip-sync on top. Verify the loaded VRM exposes the expression names, and log any missing ones at startup in `?debug=1`.
- **Visible state:** the top bar's STATE, MOOD and ACTION must always match the avatar's real current state.

## 3. Task C: Make the avatar actually move (animation that works)

1. **Find out why nothing moves.** In `?debug=1`, show: the VRM loaded status, the humanoid bone list, the active clips, the mixer time, and per-frame bone rotation deltas. Fix the cause (mixer not updated each frame, clips not bound to the normalized humanoid bones, `vrm.update(delta)` missing, animation clips not retargeted, or the idle override resetting the pose every frame).
2. **Guaranteed motion with no external files: a procedural motion library** in `apps/web/src/avatar/motion/procedural/`. Drive normalized humanoid bones with layered sine/spring curves:
   - Idle (breathing, weight shift, head sway, finger micro-curls) and listening/thinking/speaking gestures (beat gestures with the hands timed to speech emphasis).
   - **Six dance styles** (cute idol, pop groove, hip-hop bounce, slow sway, jazzy spy walk-turn, jump dance) with beat-quantized steps: hips sway, knees bend, arm swings, shoulder bounces, head bobs, spins, claps, hand waves, and sync to BPM (default 110-128).
   - Walk, run, skip, turn and hop cycles for roaming (with simple foot placement and root motion).
   - Wave, nod, shake, shrug, cheer, clap, heart hands, peace sign, bow, laugh, shy, facepalm, think, stretch.
   - Every motion has intro, loop and outro, blend in/out of 0.3 s, and an intensity multiplier.
3. **Real clips on top (better quality):** load VRMA clips from `@pixiv/three-vrm-animation` (check the license of the sample motion pack before use, and credit it), or retarget Mixamo FBX to VRM with a local script `scripts/fetch-animations.ts` (do not commit raw Mixamo files). The mixer prefers real clips when present, and uses the procedural library as the fallback, so something always moves.
4. **Proper pose:** relaxed arms, curled fingers, no claw hands. Hair, skirt and sleeves use spring bones tuned to sway and settle.
5. **Feet and ground:** feet stay on the floor/pad, no sliding during dance and walk. Remove the thin cyan vertical line artifact through her legs.
6. Fix `performAction(id)` so every button (Dance Move, Wear Saree, Stage Studio, Wardrobe) and every LLM cue goes through it, and log a warning when an action has no motion.

## 4. Task D: Voice overhaul (a nicer, more natural girl's voice)

Target voice: **warm, soft and friendly, mid-range, natural pace (about 0.95-1.05x), clear Indian-English and Hinglish pronunciation, gentle expressiveness.** Do not clone any real person's voice without their consent.
- **Sanitize before speaking:** remove markdown, headings (`###`), code, URLs, emojis (convert some to short cues like `[emo:happy]`), JSON, and tags. Expand symbols and numbers ("11/1/2026" becomes a natural date), keep sentences short, and add natural pauses at commas and sentence ends.
- **Providers (implement behind `TTSProvider`, verify current free limits and terms before relying on them):**
  - Local, free: a neural TTS such as Kokoro or Piper (check each voice's license), run through a small local service or in the browser (WebGPU/WASM).
  - Cloud with free tiers: Google Cloud TTS or Gemini TTS, Azure Neural TTS, ElevenLabs free plan (check attribution and commercial rules). Hindi and Hinglish: use a Hindi-capable neural voice and switch voices per language segment.
  - Avoid unofficial endpoints (such as scraped Edge/Google Translate TTS) in anything public.
  - Browser `speechSynthesis` stays only as the last fallback, with a female voice chosen automatically.
- **Streaming and latency:** sentence-by-sentence synthesis with prefetching of the next sentence, start speaking after the first sentence (target under 1.2 s from the end of my speech to the first audio), and cache common phrases.
- **Emotion-aware prosody:** map the current emotion to rate, pitch, volume and style (SSML where supported). Soft and slower when concerned, brighter and faster when excited, whisper-like for shy moments, and a small breath/pause before big reactions.
- **Voice settings page:** a voice picker with preview buttons, speed and pitch sliders, language voice mapping, and a "test sentence" button. Show which provider is active in `?debug=1`.
- Always-on voice and barge-in must keep working, with echo cancellation so she doesn't hear herself.

## 5. Task E: Dance and singing

- **Dance:** "Dance Move" plays a random style from the six; "Stage Studio" lets me pick a style, speed, and music. With music: beat detection (Web Audio `AnalyserNode` plus a BPM detector) syncs the steps. Without music: a built-in metronome-style groove. She walks to center stage first, lights change, and she returns to her spot after.
- **Singing, phase 1 (works now, no paid API):** karaoke performance. I pick or upload a song I have the rights to (or a CC0 / royalty-free track, with credits); she plays it, shows synced lyrics, mouths along with amplitude and vowel-style mouth shapes, and performs singing gestures (hand on chest, sway, arm sweeps) plus expressions that follow the energy. The LLM can write **original** lyrics for a mood, which she performs as rhythmic spoken-word over a licensed instrumental.
- **Singing, phase 2 (optional):** a `SingingProvider` for AI vocals. Evaluate available services and open-source singing models, verify current terms, cost and licenses, and never clone a real singer's voice. Do not reproduce copyrighted lyrics.
- **Movement:** she can walk to the corners, come close, step back, and return home (V5), using the walk cycles from Task C.

## 6. Task F: UI and visual cleanup

- Replace the big **square pixel particles** with small soft round sprites (additive, size variation, slow drift, fewer of them).
- Fix the bottom bar and chat input being cut off: use `100dvh`, reserve space for the control bar in the stage's safe area, and make sure the whole bar (mic, LISTENING, volume, FULL, mode pill) is visible at 1920x1080, 1366x768 and a small laptop height of 700 px.
- Chat panel: auto-height, no clipped text at the top, smooth auto-scroll, markdown rendering for `display_text` only, and a typing indicator.
- Keep the new Quick Interactions card (Dance Move, Wear Saree, Wardrobe, Stage Studio) and make each button visibly do something within 1 second.

## 7. Task G: Debug overlay and test tooling

- `?debug=1` overlay: FPS, provider names (LLM, TTS, STT), last raw model reply, parsed cues, current emotion and action, active clips, bone-motion meter, and audio latency.
- `/animation-test` page with a button for every action, expression, dance style and voice emotion, plus a "play all" mode.
- A "Reply lab" page: paste any model output (including broken JSON) and see exactly what the UI will show, speak and perform.

## 8. Task H: Automated verification
- Unit tests for the parser (30+ cases) and the TTS sanitizer.
- Playwright tests: send "good morning" and assert that no JSON fragment appears in the chat, the MOOD/ACTION tags change, and bone rotations change by a threshold within 2 seconds. Trigger "Dance Move" and assert sustained motion for 5 seconds. Assert the control bar is inside the viewport at 3 sizes.
- Record a 15-second screen capture of idle motion, a greeting with a wave, a dance, and a spoken reply for the final report.
- Keep all earlier evals at 100% (crisis protocol, honesty about being AI, no jealousy or guilt, PG).

## 9. Acceptance criteria (all must pass, with proof)
1. No raw JSON, tags, markdown symbols or "###" ever appear in the chat bubbles or are spoken.
2. After I send a message, her expression changes within 100 ms, and the emotion and gesture from her reply play in sync with her speech. The top bar matches what she is doing.
3. She is never frozen: continuous idle motion, gestures while speaking, and visible listening behavior.
4. "Dance Move" produces visible, varied, beat-synced full-body dancing for at least 20 seconds with no foot sliding and no T-pose flashes. Six dance styles work.
5. The karaoke singing mode plays a licensed/CC0 track with synced lyrics and a performing avatar.
6. The voice is clean (no symbols read aloud), warm and natural in at least English and Hinglish, the first audio starts within about 1.2-1.5 s, and emotion changes the way she sounds.
7. No square particles, no vertical line artifact, nothing cut off at any tested size, and no "Operator".
8. Tests, evals and the 15-second recording are included in the final report, and the README and `docs/` are updated.

## 10. Final report
For each task: root cause found, what changed, test output, screenshots and recording, voice provider choices with license/cost notes, and what still needs me (API keys, animation downloads, a better VRM).
