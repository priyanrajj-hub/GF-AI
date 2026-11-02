# ADA: ROUND 5 PROMPT. ALWAYS FULL BODY, ROAM THE SCREEN, CUTER

> Usage: add to repo root. Tell Antigravity: "Read ADA_V5_FULLBODY_ROAM_CUTE_PROMPT.md together with GEMINI.md, ADA_MASTER_PROMPT.md, ADA_V3_POLISH_PROMPT.md and ADA_V4_DANCE_SING_ANIME_PROMPT.md. **Where this file conflicts with an older one, this file wins.** Finish unfinished V3/V4 tasks, then do this file in order. Screenshot or screen-record after each task and keep going until every acceptance criterion passes."

## 0. Goal
1. Ada is **always shown full body** (head to toe), never cropped.
2. She **moves around the whole screen** like a living desktop companion: walking, running, skipping, hopping, wandering, coming close to the camera, going to the corners, sitting on UI panels, and returning "home" to the projector pad.
3. She acts **cuter**: playful, wholesome, kawaii body language and expressions, with a cuteness slider.

## 1. Overrides to older prompts
- **Remove** the Bust/Close-up camera modes and the zoom-in presets from V3 and V4. Full body is the only framing. The "camera push-in" and "close-up on singing" ideas become a very small, brief scale/position emphasis (at most 10%) and the whole body must stay visible.
- The projector base is no longer where she is locked. It becomes an optional **home pad** (she walks to it for hologram/briefing mode and when idle for a long time).
- OrbitControls: disable user zoom and orbit. The camera is fixed, wide and slightly low, with only a gentle parallax drift (plus or minus 1.5 degrees).

## 2. Task A: Always full-body framing
- Compute the **safe stage rectangle**: the viewport minus the top bar, the bottom control bar and any open side panels (read their live bounding boxes through `ResizeObserver`). Ada's whole body (head, hair tips, hands and feet, plus a 4% margin) must fit inside this rectangle at every position she walks to.
- Choose the camera distance and FOV (about 30) so a standing Ada is 62-70% of the safe rectangle's height on desktop and 55-60% of the screen height on mobile portrait. As she walks closer to the camera she may scale up to at most 1.25x and still stay fully visible. When she walks away she scales down to about 0.7x (real perspective, not fake scaling).
- Test viewports: 1920x1080, 1366x768, 1280x720, 2560x1440, 390x844 (portrait), 844x390 (landscape). Add a Playwright test that moves her to all four corners and the center, and asserts that the body's projected bounding box stays inside the safe rectangle.
- If a side panel opens or closes, she smoothly walks to stay inside the new safe area and never ends up hidden behind a panel.

## 3. Task B: Free-roam system
Create `apps/web/src/avatar/roam/` with:
- **Stage world:** a large floor plane mapped to the safe screen rectangle (use a raycast from screen coordinates to the floor). Include depth (near and far), so she can walk toward and away from the camera, with a soft contact shadow and subtle footstep ripples/glow.
- **Navigation:** steering with smooth acceleration and deceleration, turn-in-place animation for big direction changes (90/180 degrees), arrival easing, a stop-distance rule so she doesn't overlap the cursor, and obstacle avoidance around UI "no-go" regions (read from panel bounding boxes, with some padding).
- **Locomotion clips (VRMA or retargeted):** idle, walk, cute walk (a bouncy variant), skip, run, tiptoe, side-step, hop, and turn. **Match the clip's stride length to her actual speed** and use foot-lock (or plant detection) to prevent foot sliding. Use root-motion-free clips and drive the root from the navigator.
- **Roam behaviors (a small behavior-tree or utility AI):**
  - Wander to a random spot every 8-20 s when idle, pausing to look around, stretch, twirl or wave.
  - Follow the cursor slowly at a distance when I move it ("come here" mode toggle), and look at me when I speak.
  - Click or tap the floor and she walks there. Double-click and she runs. Drag her gently to relocate (she giggles and straightens up).
  - Come to the front and wave at the camera when I greet her, go to center stage to dance or sing (V4), go to the home pad for the morning briefing, and step aside when I open a big panel.
  - **Peek and perch:** sit on the top edge of the chat panel with legs swinging, lean on the left panel's edge, peek out from behind a panel, and sit on the home pad. Anchor points are defined from the panels' bounding boxes. Keep these cute but physically plausible (feet and body aligned to the edge, no clipping).
  - React to me poking her (clicking her): a surprised "eep", a giggle, a little hop, and a cute pose. After 3 quick pokes she pouts playfully, then forgives.
- **Upper/lower body layering:** locomotion plays on the lower body while upper-body overlay actions (wave, blow a kiss, peace sign, clap, think, point, hair twirl, heart hands) can play at the same time using bone masks. Dance, sing and sit fully override the mask.
- **Settings:** Roaming on/off, roam range (home area, half screen, full screen), roam energy (calm to playful), follow-cursor, and a "stay put" button for focus mode (she goes to the home pad and sits quietly). Respect reduced-motion: no wandering, only gentle idles.
- Keep her on the floor plane at all times (no sinking or floating), and keep her facing direction smooth with no popping.

## 4. Task C: Make her cuter (wholesome kawaii)
**Cuteness slider** (0-100, default 60) scales the behaviors below. It never changes her adult appearance or age cues: Ada stays an adult character with adult proportions in default mode, and cuteness means playful, warm and wholesome, never baby-talk, never infantilizing, never sexualized.

- **Body language:** head tilt when curious, hands clasped behind her back while swaying, bouncing on her toes while waiting, hair twirl, hugging an imaginary plush, peace sign, cat-paws pose, heart hands, shy foot-shuffle, happy wiggle, tiny jump of joy, clapping with small hops, hiding her face behind her hands when praised, a proud chest-puff, a sleepy rub of the eyes, and a tiny wave goodbye.
- **Expressions (use the V4 set plus these):** puffed cheeks, pouty lips, blush on praise, sparkly eyes for exciting news, happy closed-eye smile (^_^), cat smile (:3), gentle wink, tongue-out playful, embarrassed swirl eyes. Include automatic soft blinks, tiny ear/hair-spring bounces (spring-bone tuning) and cheeky glances at the camera.
- **Voice and writing style:** warm, light and a little playful: short sentences, occasional soft interjections ("hehe", "aww", "yay!", "oh!"), encouraging words, and gentle teasing. Frequency scales with the slider. No spam of emoji, no forced baby-talk. Add 30 new persona example lines in `persona.ts` and keep the Jarvis-sharp mode available when I'm working (cuteness drops automatically in Coder/Mentor/Jarvis modes unless I ask).
- **Cute sounds:** tiny licensed SFX (soft giggle, "eep", sparkle chime, footstep taps) at low volume with a mute toggle. Check licenses (CC0) and list them in `CREDITS.md`.
- **Cute FX:** hearts and sparkles on praise, little sweat drops when flustered, sakura petals when she walks in happy mode, a faint footstep sparkle trail, music notes when she hums.
- **Small companion (optional, default on):** an original tiny floating mascot (for example a glowing round "holo-sprite" or a small cat-like bot made by us, not copying any existing character) that follows her, reacts to events (sleeps, bounces, hides) and can be poked. Keep it lightweight (sprite or low-poly).
- **Outfit and style options:** a few outfit/skin variations (default red spy-chic, casual hoodie, cozy pajamas for night mode, festival outfit) and a hair accessory picker. These are material and mesh toggles on the VRM, so no extra models are needed. Night mode: she yawns, wears the cozy look, and speaks softer.
- **Context-aware cuteness:** cheers on my wins, gently concerned when I'm down (no jokes or dancing, a soft posture, staying near), sleepy when it's late, excited on my birthday and holidays I set. During the crisis protocol she drops all playful behavior and movement and stays still and attentive.

## 5. Task D: Integration with V4
- Dance and singing happen **anywhere on the stage**. For concert mode she first walks to center stage. The stage lights follow her position.
- All V4 actions, expressions and FX remain available through `performAction`. Add a `moveTo(x, y, style)` action and a `sitOn(anchor)` action, and extend the LLM structured reply with `movement?: {type: "walk_to"|"come_closer"|"go_home"|"wander"|"sit_on"|"follow_cursor", target?, style?}`. Voice commands (English, Hindi, Hinglish): "come here", "go to the corner", "walk around", "sit down", "stay", "follow me", "go home", "come closer".
- Update `/animation-test` with a "Roam test" tab: buttons to send her to each corner, center, near, far, and each perch point, plus a stride/foot-slide debug view.

## 6. Task E: Performance and quality
- Target 60 fps desktop and 30 fps mobile while roaming with FX. Navigation and behaviors run on a fixed timestep with interpolation. Cap pixel ratio at 2 and auto-lower quality if FPS drops.
- Hair, skirt and accessories use tuned spring bones: they sway when she walks and settle when she stops, with no explosions, no clipping through the body, and no jitter at the start or end of a walk.
- No T-pose flashes during transitions. No sliding feet (measure foot slide, with a pass threshold under 2 cm per step). No foot or body clipping into the floor or panels.
- Every new behavior is disabled automatically when `prefers-reduced-motion` is set.

## 7. Acceptance criteria
1. At every tested viewport and every position she walks to, **her full body (head to toe) is visible**, with no cropping and nothing hidden behind panels.
2. She idles, wanders, walks, runs, skips and turns naturally across the whole screen with no foot sliding, and returns home when asked or after long idle.
3. Clicking the floor sends her there, and poking her gets a cute reaction. She sits on a panel edge and peeks from behind a panel without clipping.
4. Upper-body actions (wave, blow a kiss, peace sign, heart hands) play while she walks. Dance and sing work from any position, and concert mode brings her to center stage.
5. The cuteness slider visibly changes her gestures, expressions and voice style. Cuteness drops in work modes and disappears completely in the crisis protocol. She always reads as an adult character.
6. Voice commands in English, Hindi and Hinglish control her movement, and the LLM can move her through the `movement` field.
7. Playwright tests for framing at all viewports pass, the 50 evals still pass, and performance targets are met. Screen recordings or GIFs are attached to the final report.

## 8. Final report
List what was built per task, attach screenshots or recordings, list license and credit decisions (animations, SFX), and list what still needs me (VRM with full expressions, locomotion clip downloads, API keys).
