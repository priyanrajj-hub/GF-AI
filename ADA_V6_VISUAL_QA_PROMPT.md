# ADA: ROUND 6 PROMPT. VISUAL QUALITY PASS WITH SELF-CHECKING

> Usage: add to repo root. Tell Antigravity: "Read ADA_V6_VISUAL_QA_PROMPT.md plus all earlier ADA_*.md prompts and GEMINI.md. Where files conflict, the higher version number wins. Open http://localhost:5173 in your browser tool, screenshot at 1920x1080 and 1366x768, compare against the rubric in section 9, fix, and repeat until every rubric line passes. Commit after each task and push to the repo."

## 0. What the latest screenshot shows

Progress: Ada now has black hair and a red outfit, she is full body, the daily briefing card exists, and the layout no longer clips.

Still not good enough:
1. **Flat, dull render.** The dress and hair are dark-red and black blobs with no shading, no highlights and no rim light. The hologram effect is invisible. She looks like a basic game character on a black background.
2. **Stiff, unnatural pose.** Arms stick out away from the body in a rigid A-pose, the gloved hands are splayed like claws, the legs are very long and thin next to a small head, and nothing is moving.
3. **A thin vertical cyan line** runs through her legs down to the base (a rendering artifact or a stray beam). One of the floor rings is tilted and crosses the others.
4. **The bottom control bar covers her feet and the base**, so the home pad is hidden.
5. **Large empty panels:** the left panel is a tall empty box and the chat panel is mostly blank.
6. **Personality mismatch:** in Companion mode she says "Good morning, Operator... tactical feeds", which is the Jarvis voice, not the cute companion voice. The tags show "ACTION: IDLE" and nothing visibly happens.

## 1. Task A: Character render quality (most important)
- Lighting rig: warm key light front-left, crimson/magenta rim light from behind-right, cyan fill from the left, plus an environment map. Add a subtle ground bounce. ACES tone mapping, exposure about 0.9.
- Materials: lighten the dress base to a rich red (`#C81E2F`), add a darker shade color and a visible toon shade step, add a clean outline pass (thin, dark red), glossy highlights on hair (a "hair shine" band, hair base `#15151A` with a blue-white highlight), and a soft specular on the gloves and stockings. Stockings: change to black semi-sheer so the legs read clearly.
- **Hologram-lite shader** (see V3 Task D): thin scanlines, fresnel rim, bottom fade, a sweeping scan ring, and a short glitch when she starts speaking. It must be clearly visible but must not hide the face.
- Face: enlarge the eyes slightly via the VRM expression settings or the model, add a soft blush, and set a calm default smile. The face must be readable at the current size.
- Proportions: if the head-to-body ratio looks off, fix it in the model (VRoid proportion sliders) and note the steps in `docs/VROID_RECIPE.md`. As a runtime stopgap, apply a small uniform scale of the head bone (1.08-1.15) and shorten the leg length through a hips/legs scale of about 0.95. Document it and make it a setting.

## 2. Task B: Natural pose and visible motion
- Replace the rigid A-pose: upper arms down about 65-70 degrees from T-pose with a small outward gap from the torso, elbows slightly bent, wrists relaxed, **fingers in a soft curl** (no spread claws), shoulders slightly dropped, hips tilted a little with a weight shift, and one knee slightly bent.
- Animate always: breathing, weight shifts every 4-6 s, blinks every 2.5-5 s, eye and head tracking of the cursor, hair/skirt/spring-bone sway, and a random idle variation every 8-15 s (hair touch, glance away, small wave, stretch). Verify visually by recording 10 seconds and confirming she is never frozen.
- Make the "ACTION" tag trustworthy: when the UI says `ACTION: WAVE`, a wave clip must play. Add a development warning in the console when an action has no clip.
- Complete the V4 and V5 work for dance, singing, expressions and roaming. This round only requires that idle, wave, nod, happy cheer, shy, laugh and walk are working before moving on.

## 3. Task C: Fix rendering artifacts
- Find and remove the **vertical cyan line** through her legs (check for a stray beam mesh, a line helper, a scan-ring geometry, a post-processing edge, or a spring-bone debug line). Add a "debug objects" toggle in `?debug=1` so helper objects are never visible in normal mode.
- Rebuild the floor effect: concentric thin rings aligned to the floor plane (no tilted ring), a faint grid, a soft glow under her feet, and subtle ripples when she moves. The ring set must be centered on the home pad.

## 4. Task D: Layout and empty space
- Safe-area layout: the bottom control bar must never overlap the avatar's feet or the home pad. Reserve its height in the stage's safe rectangle (read from `ResizeObserver`), and move the avatar and pad up accordingly. Alternatively make the bar a slim dock at the very bottom (about 56 px).
- **Left panel:** size to its content, remove the tall empty box. Cards: Daily Briefing (weather, date, top 3 tasks), Focus timer, Priority targets, Mood check-in (5 emoji), Quick actions (Dance, Sing, Meme, Pep talk). Each card is collapsible and the whole panel can be hidden with a button.
- **Chat panel:** height fits its content (min 280 px, max 70% of the stage), a friendly empty state with 3 suggested prompts, message grouping, a typing indicator, and a copy button. The quick-action chips stay pinned above the input.
- When both panels are hidden, she gets a larger safe area and can roam the whole screen (V5).

## 5. Task E: Personality and copy
- **Companion mode must sound like Ada the companion**, not Jarvis: warm, light, playful, concise, using the user's name from settings (ask once during onboarding, never "Operator" or "Partner" unless the user picks that title). Jarvis mode keeps the butler/briefing voice.
- Add 10+ time-aware greeting templates per mode, 30+ companion example lines with the cuteness slider in mind (V5), and a "do not repeat the same opener twice in a row" rule. The first reply is 1-2 sentences.
- Show a visible **MOCK MODE** badge whenever mock providers are active, and show which LLM and voice are in use in `?debug=1`.

## 6. Task F: Voice
- Confirm TTS plays after the first user gesture with an auto-selected female English voice (en-IN, then en-GB, then en-US), and a Hindi voice. Add a voice picker, a test-voice button, and a visible speaking state. Lip-sync must visibly move her mouth and close it in silence.
- Confirm the mic/STT works with a clear permission state and an on-screen transcript while listening.

## 7. Task G: Repo and deployment hygiene
- Update `README.md` with a current screenshot or GIF, features, setup steps, env variables, the VRoid recipe, and a credits section. Keep `CREDITS.md` complete.
- Make sure no copyrighted character images or ripped assets exist in the repo or its history. Add a `.gitignore` for local VRM test files you do not have rights to share, and a note on licenses.
- Add a GitHub Actions workflow (lint, type-check, Playwright screenshot tests) and make the Vercel deployment build from `main`. List any needed environment variables in the README.
- Tag a release `v0.6.0` when the rubric below passes.

## 8. Self-check loop (required)
After each task: run the app, take screenshots at 1920x1080, 1366x768 and 390x844, record a 10 s clip of idle motion, and fix anything that fails the rubric. Do not report "done" until the whole rubric passes in the screenshots you attach.

## 9. Rubric (all must pass)
1. The character has visible shading, highlights and a rim light. The dress reads as red fabric and the hair has a shine band. The hologram-lite effect is visible but subtle, and the face stays clear.
2. Relaxed, natural pose with curled fingers, correct proportions, and continuous idle motion (breathing, weight shift, blinking, look-at, hair/skirt sway).
3. No vertical line artifact and no tilted ring. Floor rings are clean, with a glow under her feet.
4. Nothing overlaps her feet. The home pad is fully visible.
5. No large empty panels, and both panels can be hidden.
6. Companion mode sounds warm and cute, uses the user's name, and never says "Operator". MOCK MODE badge works.
7. `ACTION` tags correspond to actual visible animations. Voice plays and lip-sync works.
8. README, CREDITS, CI and deployment are updated. Screenshots and the idle recording are attached to the final report.

## 10. Final report
For each task: what changed, before/after screenshots, and what still needs me (VRoid VRM file, API keys, animation packs, voice IDs).
