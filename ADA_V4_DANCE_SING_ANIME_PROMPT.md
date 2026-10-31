# ADA: ROUND 4 PROMPT. DANCE, SING, ANIME STYLE, EXPRESSIONS, ACTIONS

> Usage: add to repo root. Tell Antigravity: "Read ADA_V4_DANCE_SING_ANIME_PROMPT.md, GEMINI.md, ADA_MASTER_PROMPT.md and ADA_V3_POLISH_PROMPT.md. Finish any unfinished V3 tasks first, then do this file in order. Screenshot or screen-record after each task and keep going until every acceptance criterion passes."

## 0. Goal
Ada must feel **alive and anime**: she dances to music, sings songs, strikes poses, reacts with big anime-style expressions and effects, moves constantly in natural ways, and performs actions on voice commands or when the LLM asks for them. All of it must stay tasteful and non-sexual, consistent with the project guardrails (18+, no explicit content).

Requirements for the avatar: a VRM 1.0 (or 0.x) with a standard humanoid skeleton and expression presets (VroidStudio exports have these). If custom expressions are missing, use the fallbacks in Task C.

## 1. Task A: Animation engine (foundation)
Build `apps/web/src/avatar/engine/` with:
- **Action registry** (`actions.ts`): every action has `id`, `category`, `clip` (VRMA or procedural), `duration`, `loop`, `blendIn/Out`, `faceOverride`, `fx[]`, `sfx?`, `interruptible`, `priority`. The LLM, voice commands, UI buttons and the scheduler all trigger actions through one `performAction(id, opts)` function.
- **Layered mixer:** (1) base body clip, (2) procedural breathing, weight shift and idle micro-moves, (3) look-at (eyes, then head, then neck), (4) face expressions, (5) lip-sync or singing mouth, (6) FX layer. Higher-priority actions interrupt lower ones with 0.25-0.4 s crossfades, and she always returns to idle gracefully.
- **Animation sources (verify licenses):** prefer CC0 VRMA packs (for example the pixiv VRM Animation samples) and your own clips. Mixamo clips may be used in an app, but do not commit raw Mixamo files to the public repo. Provide `scripts/fetch-animations.ts` that downloads/converts them locally and documents the license. Do not use copyrighted choreography or MMD dance motions copied from existing songs or games.
- **Procedural fallback:** if a clip is missing, a procedural generator drives the bones with sine-based motion (hips sway, shoulder bounce, arm swings, head bob, knee bends) so she always moves.
- A `/animation-test` page lists every action and expression with a play button, a speed slider, and a "loop all" mode for QA.

## 2. Task B: Action catalog (implement all)
**Dance (8+ styles, each 20-60 s loops with intro/outro):** Cute idol dance, Pop groove, Hip-hop bounce, Slow sway/ballad, Spy-chic jazz (confident walk-turn-pose), Energetic jump dance, Chill lo-fi nod-and-sway, Celebration dance. Plus 10-second "mini dances" for quick reactions.
**Music-reactive mode:** play any audio and she dances to the beat (see Task E).
**Everyday actions:** wave, bow, nod, head shake, shrug, think (chin touch), facepalm, clap, cheer (arms up), thumbs up, peace sign, blow kiss (light and playful), salute (Jarvis style), stretch, yawn, sip tea, read a book, type on a holographic keyboard, point/present (when explaining), count on fingers, heart hands, cat-paws pose, spin/twirl, curtsy, fist-pump "motivate", cry (wipe tears), laugh (holding stomach), sleepy nod-off, victory pose, and a "sassy hair flip".
**Mood poses (hold 3-5 s):** proud, shy (hands together, looking away), determined, mischievous, cozy.
**Idle variations:** 6+ idle loops chosen randomly every 8-15 s, plus glances, hair or dress adjustments and small smiles.
**Movement in the scene:** she can step side to side, lean toward the camera, walk a few steps and turn on the base (keep her feet on the base), and "wave at screen" with a camera push-in.

## 3. Task C: Expressions (30+) and anime FX
**Expression presets**, driven by the emotion engine with easing, intensity and blends (for example 60% happy + 30% shy): neutral, happy, big smile, laughing, sad, crying, angry/pouting, annoyed, surprised, shocked, scared, worried, confused, thinking, smug, mischievous (wink), shy/embarrassed, love/heart-eyes, sparkle-eyes (excited), sleepy, tired, bored, proud, determined, smirk, deadpan, dizzy (spiral eyes), relieved, apologetic, playful tongue-out, kiss face.
- Map to VRM presets where they exist. For missing ones, create combinations of existing blendshapes, and where needed add **eye/face decal overlays** (textured quads on the face) for: **blush lines, shine/sparkle eyes, heart eyes, spiral eyes, >< eyes, tears, sweat drop, anger mark**.
- Eye and brow animation: eye-direction changes, quick darting glances, brow raises and furrows, double blinks, and slow "soft" blinks when calm.

**Anime FX layer** (billboard sprites and particles, toggleable):
- Floating hearts, sparkles and stars, sweat drops, anger vein pop, a "!" or "?" popping over her head, music notes, Zzz, tears, blush gradient, sakura petals, snow, a light burst, and "sweatdrop + sigh" for awkward moments.
- **Anime camera language:** a quick zoom-punch on big reactions, a short slow-motion beat, a screen-edge glow (colored by mood), subtle speed lines for energetic moves, a spotlight cone and colored stage lights during dances.
- **Anime render style:** keep MToon cel-shading, add a clean outline pass, soft rim light, and "hair shine" highlights. Optional **chibi mode** (bigger head, smaller body, simple bouncy animations) as a toggle, and a "photo mode" with a pose picker and screenshot button.

## 4. Task D: Singing
- **Songwriter tool:** the LLM writes **original** songs (title, genre, mood, BPM, key, verses/chorus/bridge, lyrics) from a prompt such as "sing me a lo-fi song about exams". Output a `SongSpec` JSON. **Never reproduce copyrighted lyrics.** For existing songs, she can talk about them or hum a generic tune, but she does not output the lyrics. Public-domain songs (check each one) are allowed.
- **`SingingProvider` interface** with a mock and pluggable implementations. Evaluate and verify the current availability, pricing and terms of: an AI music/vocal generation API (such as ElevenLabs music, Google Lyria, or similar), an open-source singing voice synthesizer (such as DiffSinger), and a fallback "rhythmic spoken-word over an instrumental" mode using the existing TTS. **No cloning of real singers' voices without their consent.** Cache generated songs per user, with a cost cap and a budget warning.
- **Playback and lip-sync:** the vocal stem drives the mouth through amplitude plus an optional phoneme/viseme timeline (sustained vowels, wider mouth on high notes). If only a mixed track exists, drive the mouth from the mid-frequency band. Add vibrato-like head movement and expressive brows on long notes.
- **Performance staging:** a "concert mode" with stage lights, a spotlight cone, a faint audience-glow particle field, a microphone prop (optional) and camera cuts (wide, close-up, low angle) on section changes. Singing gestures: hand on chest on emotional lines, arm sweeps on high notes, finger-point on the beat, a bow at the end.
- **Karaoke panel:** synced lyrics highlight word by word, with a "sing along" toggle where my mic input is shown as a pitch/volume meter (no judging, just fun feedback).
- Controls: song picker, my library (generated songs), request ("sing me something happy"), tempo and volume sliders, stop button (a quick, polite fade-out), and barge-in (she stops if I say "stop").

## 5. Task E: Dance sync to music
- Beat tracking in the browser using Web Audio `AnalyserNode` plus a beat/BPM detector (such as `essentia.js` or a lightweight onset detector). Detect BPM, beat phase, and energy (bass/mid/high).
- **Choreography schema** (`choreo.json`): bars/beats mapped to action IDs and intensity, for example `{bpm, sections:[{startBeat, endBeat, moves:[...]}]}`. Auto-generate a choreography for any track by mapping energy levels to move sets (low: sway, mid: groove, high: jump), with a new move every 4 or 8 beats, never repeating the same move twice in a row.
- Speed-scale and time-warp each clip to the song BPM, and snap transitions to the beat. Add a "freestyle" mode where the procedural generator reacts to live audio (my own music file, or system audio where the browser allows).
- Users can upload an audio file they have rights to. Show a notice that uploaded music stays on their device.
- Dance has stage lighting synced to the beat (color pulses, strobes limited to a safe rate, **at most 3 flashes per second**, with a reduced-motion/photosensitivity setting that disables flashing).

## 6. Task F: Make the LLM drive all this
- Extend the structured reply: `{speech, display_text, emotion, intensity, blend?:{emotion:weight}, action, action_params, fx[], camera?, song_request?, dance_request?}` validated with Zod.
- **Voice and text commands** (English, Hindi and Hinglish): "dance", "sing a song", "do the cute dance", "wave", "make me laugh", "act sad", "pep talk with a fist pump", "stop", "again", "faster/slower", "do a spin", "take a bow".
- Autonomous but restrained behavior: when she is happy about good news she does a small cheer, when I say thanks she nods or does a tiny bow, when I'm sad she uses a soft concerned pose (no jokes or dancing), when idle for a long time she stretches or yawns. A **"liveliness" slider** (0-100) controls how often she gestures, and a quiet mode for focus sessions.
- Action cooldowns so she doesn't spam gestures. Never dance or use exaggerated reactions during a crisis conversation (the crisis protocol overrides everything).

## 7. Task G: UI
- A **"Stage" drawer** with tabs: **Dance** (style cards with previews), **Sing** (song picker, create-a-song prompt, library), **Moves** (action buttons grid), **Expressions** (face grid), **FX toggles**, **Camera** (wide, bust, close-up, auto-director).
- A mini "now performing" bar with progress, a stop button and a loop toggle. Keyboard shortcuts (1-9 for quick actions, Space to stop).
- Mobile layout: bottom sheet instead of a drawer.

## 8. Task H: Performance and safety
- Target 60 fps desktop and 30 fps mobile with FX on. Pool particles, limit simultaneous sprites, preload clips lazily, dispose unused ones, and auto-reduce FX when FPS drops.
- Feet must stay planted on the base (use foot-lock or clamp the root offset). No mesh clipping through the dress or hair (tune the spring bones: `three-vrm` spring bone gravity and stiffness for hair, skirt, ribbons so they swing nicely but don't explode).
- Keep all content PG-rated, with no suggestive camera angles or movements.
- Credits: update `CREDITS.md` with every animation pack, song generator, music asset and license.

## 9. Acceptance criteria
1. At least 8 dance styles, 25+ action clips and 30+ expressions play correctly from `/animation-test` with smooth blending and no T-pose flashes, foot sliding off the base, or hair/skirt glitches.
2. "Sing me a song about X" creates an **original** song, plays it, shows synced lyrics, and her mouth, face and body perform to it. Stopping works instantly.
3. Uploading an audio file makes her dance in time to the beat (visible beat sync, auto-choreography with varied moves).
4. Anime FX (hearts, sparkles, sweat drops, anger mark, "!" pop, blush, music notes) appear on the right emotions, and the camera zoom-punch works.
5. The LLM triggers actions and expressions on its own, voice commands work in English and Hindi/Hinglish, and the liveliness slider changes behavior.
6. Crisis conversations disable dancing and playful FX. The photosensitivity setting works.
7. Performance targets are met. Before/after screen recordings or GIFs are attached to the final report.

## 10. Final report
List what was built per task, attach screenshots or recordings, list license/credit decisions, and list what still needs me (VRM with expressions, API keys for music/voice, any animation packs I must download).
