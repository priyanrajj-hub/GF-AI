# ADA: FIX AND UPGRADE PROMPT (v2)

> Usage: add this file to the repo root. Tell Antigravity: "Read ADA_FIX_AND_UPGRADE_PROMPT.md, GEMINI.md and ADA_MASTER_PROMPT.md. Work through the tasks in order, run the app, take a screenshot after each task, and compare it to the acceptance criteria. Do not stop until all criteria pass."

## 0. Diagnosis (from a screenshot of localhost:5173)

What I see is a **flat 2D photo on a rectangle** with thick blurry scanlines, not a 3D character. Problems:

1. **The avatar is not a 3D model.** The README says a VRM avatar is rendered, but the screen shows a flat image on a plane. Most likely `ada.vrm` fails to load (missing file, wrong path, or loader error) and a fallback image is shown. There is no body, no depth, no animation, no lighting.
2. **The fallback image looks like a render of a copyrighted game character.** This contradicts the README's "original character, no copyrighted assets" claim. It must be removed from the code, from `/public`, from git history, and from the Vercel deployment.
3. **Hologram effect hurts the face.** Scanlines are too thick and strong, and the whole scene is a single flat red, so nothing has depth or contrast.
4. **UI bugs:** raw markdown shown in chat (`**Ada**`), the same greeting shown twice (an italic speech line plus the text), the bottom bar ("HANDS-FREE: OFF", mode label) is cut off at the viewport edge, the mic button overlaps the projector base, and the left panel is mostly empty space.
5. **Emotion/gesture labels exist (MOOD: HAPPY, ACTION: WAVE) but nothing visibly animates.**

## 1. Task A: Real 3D avatar (highest priority)

1. Open the browser console and find why the VRM is not rendering. Fix the root cause (path, Vite asset handling, CORS, loader plugin registration, or a crash in the render loop). Add a visible error state and a `?debug=1` overlay that shows load status, FPS, current emotion and current animation.
2. Use `GLTFLoader` with `VRMLoaderPlugin` (`@pixiv/three-vrm`). After loading: `VRMUtils.removeUnnecessaryVertices`, `VRMUtils.removeUnnecessaryJoints`, `VRMUtils.rotateVRM0(vrm)` for VRM 0.x models, enable frustum culling off for skinned meshes, and update `vrm.update(delta)` every frame.
3. **Delete the planar image fallback and any copyrighted image.** If the model fails to load, show a clear error plus a procedural stylized placeholder bust. Never a photo.
4. Model source: a VRM I made in VRoid Studio, or a CC0/CC-BY VRM (credit it in README). Put it at `apps/web/public/models/ada.vrm` and support a `?model=` override and a settings model picker. Compress with meshopt and KTX2 textures where possible. Show a loading progress bar.
5. Pose it properly: set a relaxed A-pose (arms down, not T-pose) through the normalized humanoid bones before the idle animation starts.
6. Camera: perspective FOV about 28-32, position about (0, 1.35, 2.4), look-at the chest/face height, with a slow subtle drift. OrbitControls limited (azimuth plus or minus 25 degrees, polar clamped, no zoom below the face, no pan). A "close-up" toggle that moves to head and shoulders.

## 2. Task B: Remove the copyrighted image everywhere

- Search the repo for any image of an existing game character (public assets, imports, base64 data, CSS backgrounds). Delete them.
- Purge from git history (`git filter-repo` or BFG) if committed, force-push, and redeploy `gf-lemon.vercel.app`.
- Add a `CREDITS.md` for every third-party asset, with licenses.

## 3. Task C: Hologram look that keeps the character visible

- **Do not replace the avatar's materials with a flat ShaderMaterial.** Keep the original MToon/PBR materials so the face, hair and clothes stay detailed. Add the hologram effect as an `onBeforeCompile` patch or an overlay pass:
  - Thin scanlines (1-2 px at 1080p, opacity about 0.08-0.15, slow upward drift), not thick bands.
  - Fresnel rim glow (cyan or magenta, intensity adjustable).
  - Faint flicker, plus a short glitch/chromatic offset only when she starts speaking or changes mood.
  - A bottom fade-out where the body meets the projector beam.
- Three render modes in settings: **Solid**, **Hologram-lite (default)**, **Full hologram**.
- Lighting rig: a warm key light, a magenta rim light behind, a cyan fill, and a soft environment map. ACES tone mapping, sRGB output, soft shadows onto the base. Bloom with threshold about 0.85 (only emissive and rim parts glow).
- **Colors:** the scene is almost entirely red now. Use a dark navy background, cyan as the primary UI/hologram color, and red/magenta as accents. Add a theme picker (Cyan, Magenta, Gold, Emerald). Hologram color still shifts with mood but subtly.
- Light cone: additive, low opacity (about 0.08-0.15), vertical gradient, `depthWrite: false`, and it must never cover the face. Particles smaller and sparser. Add a soft reflective floor under the base.
- Projector base: refine the proportions, and keep the mic button out of the avatar's feet area (see Task E).

## 4. Task D: Animation and emotion that you can actually see

- Use `@pixiv/three-vrm-animation` (VRMA clips) or retarget Mixamo FBX clips to the VRM humanoid skeleton. Clips needed: idle (2-3 variants), talking gestures (3-4), wave, nod, shake head, shrug, laugh, shy, surprised, thinking, concerned lean-in, fist-pump "motivate", celebrate, tired/sleepy.
- Crossfade clips (0.25-0.4 s). Layer: base posture, then procedural breathing, then look-at (`vrm.lookAt` tracks the cursor/touch), then facial expressions, then lip-sync on top.
- Facial expressions through VRM expression presets (happy, sad, angry, surprised, relaxed) plus blink, with intensity from the LLM's `intensity` field and easing. Add a mood "memory" so moods drift instead of snapping.
- Lip-sync: amplitude-driven `aa/ih/ou/ee/oh` from an `AnalyserNode` on the TTS output (or a viseme timeline when the provider supplies it). When speech is silent, the mouth must close fully.
- When the reply JSON says `action: wave`, the wave clip must actually play. Add a hidden `/animation-test` page with buttons for every emotion and clip.

## 5. Task E: UI/UX fixes

- **Markdown:** render chat text with `react-markdown` (+ `remark-gfm`, sanitized). No raw `**` characters.
- **Duplicate text:** show each reply once. Spoken text can be highlighted word by word (karaoke style) inside the single bubble. Remove the separate italic duplicate.
- **Layout:** use `100dvh`, CSS grid, and `env(safe-area-inset-*)`. The bottom control bar (hands-free toggle, volume, mode label) must be fully visible at 1366x768 and 1920x1080 and on mobile. Test with browser zoom 100% and 125%.
- Move the mic/arc-reactor button to a docked control bar below the stage, so it doesn't sit on the avatar's base.
- **Left panel:** collapsible. Show Focus timer, Priority targets, and add a compact Weather and Today's Briefing card and an Interests/Meme card, so it's never a big empty box. On screens narrower than 1100px, panels become drawers.
- Mode pills at the top: reduce to an icon plus label on small screens, with an overflow menu.
- Typing indicator and a "thinking" hologram pulse while waiting for the LLM, streaming text, retry button on errors, a toast system for failures.
- Typography: one UI font and one mono font used consistently, with better contrast on the small mono labels (they are hard to read).
- Full mobile layout: avatar on top (about 55vh), chat as a bottom sheet, floating mic.

## 6. Task F: Voice that works

- Verify the TTS output actually plays: handle the browser autoplay rule (start audio on the first user gesture), pick a female English (en-IN or en-GB) voice and a Hindi voice, and show a voice picker.
- Production voice: ElevenLabs or Google/Azure neural TTS through the server proxy with streaming, with the browser voice as fallback.
- STT: Web Speech API with a Whisper fallback, a permission-denied UX, and barge-in that stops audio immediately.
- Add a latency meter in debug mode (speech end to first audio).

## 7. Task G: Brain quality

- Confirm that the real LLM is called when `GEMINI_API_KEY` is set (and not just the mock). Show a "MOCK MODE" badge in the UI whenever mocks are active.
- Validate the structured reply JSON with Zod, and repair on failure. Keep spoken text short (1-3 sentences) while the display text can be longer.
- Make the persona less generic: add 20+ varied example dialogues, banned phrases ("As an AI language model", repeated "Partner"), and varied greetings so she doesn't open the same way every time.
- Fix any Gemini model-name errors by reading the model from config, with an automatic fallback list.

## 8. Task H: Performance and loading

- Loading screen with progress (model, textures, animations). Lazy-load heavy chunks.
- Cap device pixel ratio at 2, target 60 fps desktop and 30 fps mobile, auto-lower quality (bloom, particles, shadows) when FPS drops, and a 2D fallback if WebGL fails.
- Dispose geometries, materials and textures on unmount. Check there are no memory leaks over 10 minutes of use.

## 9. Task I: Tests and verification

- Playwright screenshot tests at 1366x768, 1920x1080 and 390x844. Assert: the avatar canvas is non-empty, no console errors, no raw `**` text, and the bottom bar is inside the viewport.
- Keep the 50 evals passing (crisis protocol, relationship guardrails, identity disclosure).
- Lighthouse performance of 70 or more on desktop.

## 10. Acceptance criteria (all must pass)

1. A full-body or upper-body **3D character with visible depth, lighting and a distinct silhouette**, whose face is clearly visible (the hologram effect enhances it and doesn't hide it).
2. She blinks, breathes, looks toward my cursor, and gestures while talking. Wave, nod, laugh and the other emotions visibly play.
3. Her mouth moves in sync with her voice and closes in silence.
4. No copyrighted character images anywhere in the repo, history or deployment.
5. No raw markdown, no duplicated text, nothing clipped at any tested resolution, and no large empty panels.
6. The color scheme has contrast (navy/cyan with accents), not a monochrome red.
7. Loads in under 5 s on a normal connection with a progress bar. All tests pass.

## 11. Final report format

List what was fixed per task, attach before and after screenshots, and list anything that still needs me (for example a VRM file, API keys, ElevenLabs voice ID).
