# ADA: ROUND 3 POLISH PROMPT

> Usage: add to repo root. Tell Antigravity: "Read ADA_V3_POLISH_PROMPT.md, GEMINI.md and ADA_MASTER_PROMPT.md. Do the tasks in order, run the app, screenshot at 1920x1080 and 1366x768 after each task, and keep going until every acceptance criterion passes."

## 0. Where we are (from the latest screenshot)

Progress: a real 3D VRM now loads, markdown renders, the briefing card exists, and the bottom bar is visible.

Still wrong:
1. **The character is not Ada.** It is a pastel sample model: long blonde hair, a giant blue bow, a light-blue frilly dress. Ada should be a short black bob, red/black spy-chic outfit, sharp and elegant.
2. **Framing is broken.** The character is cut off at the knees by the base and the bottom bar. The teal base disc is huge, solid-filled, and clips through her legs.
3. **Overexposed and monochrome.** The dress is blown out to white, everything is one teal color, and the "hologram" effect is barely visible (it just looks like a plain toon render).
4. **Stiff, awkward pose.** Arms hang rigid, one hand is clawed/pointing, and nothing moves.
5. **Empty UI areas.** The left panel and the chat panel are mostly blank, and the greeting is generic ("Partner").

## 1. Task A: Make her actually look like Ada

**Final solution (needs me, about 20 minutes):** I will make a VRM in VRoid Studio and put it at `apps/web/public/models/ada.vrm`. Write `docs/VROID_RECIPE.md` with the steps:
- Hair: short black bob with side-swept bangs (a "bob" base, dark `#0B0B0F`, slight blue sheen).
- Outfit: a fitted red dress or a red/black jacket, black gloves optional, black heels. Main red `#C1121F`, accents black, small gold details.
- Face: sharper, narrower eyes, a confident expression, deep-red lips, subtle eyeliner. No bows or pastel accessories.
- Export as VRM 1.0 with CC0 or personal-use settings. Keep under 15 MB, and compress textures.

**Interim solution (do now so the app already looks right):** apply runtime material overrides to the current model:
- Find the hair, bow/ribbon, dress and stocking meshes by material name (log all material names on load to a debug panel).
- Hide the bow meshes (`visible = false`). Tint hair materials to near-black (`#101014`), and tint the dress and sleeves to deep red (`#B0101E`) with darker shade color. Keep the face and skin untouched.
- Store these overrides in `apps/web/src/avatar/skins/ada-red.ts` so it's easy to swap when the real VRM arrives. Add a skin picker in settings.

## 2. Task B: Framing, camera and base

- Compute the avatar's bounding box after load, and **auto-fit the camera** (FOV 30, distance so the whole body, or head to mid-thigh in "close-up", fills 75-80% of the stage height). Target the chest/face height (about 55-60% of the body height).
- Put the avatar's feet exactly on top of the base (`y = baseTop`), and scale the base to about 1.4x the avatar's shoulder width (radius about 0.55-0.7 m). It must never clip through her legs or exceed the stage.
- Reserve the bottom 110 px of the stage (the control bar height) as padding so nothing important is covered. Add a "Full body / Bust" toggle that smoothly tweens the camera.
- OrbitControls: azimuth limited to plus or minus 25 degrees, no zoom out past the fit distance, no pan, damping on.

## 3. Task C: Lighting, exposure and colors

- Renderer: ACES filmic tone mapping, `toneMappingExposure` about 0.8-0.9, sRGB output. Reduce the ambient light. The dress must show fabric shading, not white blowout.
- Light rig: warm key (front-left, intensity moderate), magenta rim (behind-right), cyan fill (low intensity), plus a soft environment map for reflections.
- Bloom: threshold 0.9, intensity about 0.3-0.4, applied only to emissive/rim parts. Nothing should glow white.
- **Palette:** dark navy background, **cyan** for UI and hologram effects, **red/crimson** as Ada's accent. Right now it is all teal. Keep the base as a dark metal disc with thin glowing cyan ring lines, not a solid teal fill.

## 4. Task D: Real hologram effect (subtle and good-looking)

Patch the existing avatar materials via `onBeforeCompile` (don't replace them):
- **Scanlines:** thin (1-2 px), opacity about 0.08-0.12, slowly moving upward.
- **Fresnel rim:** a cyan/magenta edge glow, adjustable intensity.
- **Bottom fade:** the feet dissolve into the projector beam, with a bright thin "scan ring" that sweeps up and down the body every few seconds.
- **Flicker:** very low amplitude. A brief glitch/chromatic offset when she starts speaking or changes mood.
- Settings: Solid / Hologram-lite (default) / Full hologram. Add a hologram intensity slider.
- Light cone: additive, opacity about 0.08-0.12, never covering the face. Fewer, smaller particles.

## 5. Task E: Pose and animation

- Set a natural idle pose using the normalized humanoid bones (VRM 1.0 coordinates): upper arms rotated down about 60-70 degrees from T-pose (z about plus or minus 1.1-1.2 rad), forearms with a slight bend, wrists neutral, **fingers in a soft natural curl** (proximal about 0.2-0.35 rad, intermediate about 0.3-0.45) so there are no clawed hands, and a slight hip tilt and shoulder drop.
- Add real animation clips (VRMA via `@pixiv/three-vrm-animation`, or Mixamo retargeted): 3 idle variants, 4 talking gestures, wave, nod, shake head, shrug, laugh, shy, surprised, thinking, concerned, fist-pump, celebrate, tired. Crossfade 0.3 s.
- Layering: base clip, then procedural breathing and weight shift, then look-at (eyes first, then head, then neck) toward the cursor, then expressions, then lip-sync.
- Idle micro-behaviors every 6-12 s at random: hair or dress touch, glance away, small smile, head tilt. She must never stand frozen.
- The `/animation-test` page has a button for every emotion and clip. Verify "ACTION: WAVE" actually plays a wave.

## 6. Task F: Face and expression quality

- Verify the VRM expressions exist (`happy`, `sad`, `angry`, `surprised`, `relaxed`, `blink`, `aa/ih/ou/ee/oh`) and map the emotion engine to them with easing. Add subtle brow and eye-direction changes.
- Blink every 2.5-5 s with occasional double blinks. Lip-sync strictly closes the mouth when silent.
- A "calm default" face: slight smile, relaxed eyes (not a blank stare).

## 7. Task G: UI polish

- **Left panel:** collapsible cards, and no empty tall panel. Add: Daily Briefing (weather, top 3 tasks), Focus timer, Priority targets, Interests/Meme card, and a Mood check-in (5 emoji). The panel height fits its content.
- **Chat panel:** auto-height to its content up to 70% of the screen, with a clean empty state, message grouping, timestamps, a typing indicator, copy button, retry on error, and quick-action chips (Morning Briefing, Pep Talk, Meme Me) kept above the input.
- **Greeting and persona:** stop addressing the user as "Partner". Use the user's name from settings (ask once during onboarding), or no title. Generate varied greetings (time-aware: morning/evening) from 10+ templates. Keep the first reply short (1-2 sentences).
- Top bar: add text labels or tooltips for the 5 icon buttons. Hide the mode pills behind a dropdown below 1100 px.
- Bottom control bar: keep, but make the mic button bigger with the arc-reactor ring animating by state (idle/listening/thinking/speaking).
- Show a visible **MOCK MODE** badge when mock providers are active.

## 8. Task H: Voice and brain checks

- Confirm TTS audio plays after the first user gesture, with a female voice chosen automatically (en-IN, then en-GB, then en-US) and a voice picker in settings.
- Confirm the real LLM is used when `GEMINI_API_KEY` is set. Validate the structured JSON replies with Zod. Add the `?debug=1` overlay showing FPS, emotion, clip, latency and mock/real status.

## 9. Acceptance criteria

1. Ada has **short black hair and a red/black outfit**. No bows or pastel colors remain. (Interim: tinted skin, final: custom VRM.)
2. The **whole body or upper body is visible**, with feet on the base, nothing cut off or clipping, at 1920x1080 and 1366x768.
3. Colors are balanced (navy, cyan, red accents). No white blowout, and the dress shows shading.
4. A visible but subtle hologram effect (thin scanlines, rim glow, bottom fade, scan ring) and the face stays sharp.
5. Natural idle pose (no stiff arms or clawed hands), idle micro-movements, and every emotion/gesture visibly plays on `/animation-test`.
6. No big empty panels, a varied personalized greeting, and a visible MOCK MODE badge when applicable.
7. Screenshots (before/after) are attached in the final report, and the 50 evals still pass.

## 10. Final report

List what changed per task, attach screenshots, and list what still needs me (VRoid VRM file, API keys, ElevenLabs voice ID).
