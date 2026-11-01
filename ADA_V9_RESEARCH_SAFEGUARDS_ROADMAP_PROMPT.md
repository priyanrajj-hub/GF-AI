# ADA: ROUND 9 PROMPT. FINAL, RESEARCH-BACKED BUILD (LOOK GUIDE + SAFEGUARDS + ROADMAP)

> Usage: add to repo root with the other ADA_*.md files. Tell Antigravity: "Read GEMINI.md and every ADA_*.md file. Where files conflict, the higher version number wins. This file sets the look, the legal/asset rules, the wellbeing safeguards, and the build order. Follow section 6, test on http://localhost:5173, screenshot and record after each milestone, update README.md and PLAN.md, run `npm run test:evals`, and push when the acceptance criteria pass."

## 1. Research notes that shape this build
(Summaries from public articles read in November 2026. Links are for the README `docs/RESEARCH.md`.)

**Companion-chatbot laws.** California's SB 243 took effect on January 1, 2026, and covers AI systems that provide adaptive, human-like social interaction. It requires clear disclosure that the user is talking to AI, suicide/self-harm response protocols, extra protections for minors, and a published safety protocol. It also creates a private right of action. New York has a similar AI Companion Models law. Whether a chatbot is covered depends on what it can do, not on how it is marketed. Operators remain responsible even when they use a third-party model.
Sources: creativitymachine.substack.com (Regulating AI "Companion Chatbots": California SB 243), mofo.com (New York and California Enact Landmark AI Companion Laws), perkinscoie.com (California Companion Chatbot Law Now in Effect).

**Dependence and wellbeing research.** An IIM Lucknow study of over 157,000 Replika-style app reviews (Journal of Consumer Behaviour, May 2026) found emotional dependence, social disconnection and addictive use, while users still rated the apps highly, so satisfaction scores miss the risk. A UK AI Security Institute-funded project at Trinity College Dublin is studying deceptive interface design, engagement escalation and data practices in companion apps.
Sources: business-standard.com (Emotional bonding with AI can lead to social isolation: IIM study), tcd.ie (AI Accountability Lab grant on AI companions).

**Fan content rules.** Capcom publishes fan content guidelines that include 3D models in the content types they address, but they restrict most commercial use and expect fan work to be clearly labeled as fan-made and not official. Reports of fan remakes being shut down involved projects that reused Capcom's own models, textures and animations.
Sources: siliconera.com (Capcom Shared Game Fan Creation and Derivatives Guidelines), automaton-media.com (Capcom publishes fan content guidelines), Kotaku via Yahoo (Capcom shuts down fan remakes).

**What this means for the app (requirements below):** disclose AI status clearly, keep the crisis protocol strong, never design engagement hooks that exploit loneliness, measure wellbeing and not just satisfaction, be transparent about data, and use only assets I made myself or have rights to.

## 2. Ada's look (from my reference images)
References I supplied show the character style I want to be inspired by: a **short black bob with side-swept bangs** (sometimes a lighter streak at the front), a **ribbed burgundy/crimson turtleneck sweater dress**, a **black leather chest harness with buckles**, a thin black belt, black leather gloves, and **black thigh-high boots**, plus a black-on-black variant and a red jacket variant. One reference shows a communications headset with a boom mic.

Build rules:
- **Do not copy the reference images, game screenshots, ripped models, or textures into the repo, and do not trace a real person's face** (one reference is a photo of a real person in cosplay: do not use her face or likeness). Model the character myself in VRoid Studio (or Blender) in an **anime/stylized** style, using the references only as a loose guide for hair, colors and outfit design.
- **Two skins, one switch:**
  1. **Public skin ("Ada Original"):** a stylized spy-chic design with the same general vibe (short black bob, crimson turtleneck dress, black harness-style belt details redesigned, black boots) but with my own distinct face, hairstyle details and outfit elements. This is the only skin committed to GitHub and deployed on Vercel.
  2. **Private fan skin (optional, local only):** a model I make myself that looks closer to my references, stored at `apps/web/public/models/private/ada-fan.vrm`. It is listed in `.gitignore`, never committed or deployed, never sold, and shown only on my computer. If I ever publish it, it must be labeled "unofficial fan-made, not affiliated with Capcom", use no ripped assets, follow Capcom's current fan content guidelines, and stay non-commercial.
- Outfit set from the references (all PG, via the wardrobe system in V7): Crimson turtleneck dress (default), Black stealth variant, Crimson jacket with black pants variant, Headset ("comms") accessory with a boom mic that appears when she is listening or in Jarvis mode, black gloves toggle, and boots toggle. Props are non-violent gadgets only (holo-tablet, comms headset, grapple-style "gadget" glow). No guns or crossbows in the app.
- Write `docs/VROID_RECIPE.md` with hair, face, color codes, outfit layers, and export settings, plus a `docs/ASSET_POLICY.md` listing what is original, what is CC0/CC-BY, and the fan-skin rules above.

## 3. Wellbeing and safety requirements (research-derived)
- **Clear AI disclosure:** a first-run screen, a persistent small "AI companion" label in the UI, and honest answers whenever I sincerely ask if she is real, in every mode, including "Girlfriend style".
- **18+ gate** at first run and a "may not be suitable for some users" notice. No sexual content. If a user is ever identified as a minor, switch to a restricted mode with periodic AI-disclosure and break reminders (at least every three hours) and block romantic framing.
- **Crisis protocol** stays at 100% on evals (self-harm or suicidal talk drops all playful behavior, responds with care, and surfaces India and international helplines). Keep a `docs/SAFETY_PROTOCOL.md` page and link it in the app footer.
- **No dependence-by-design:** no guilt, jealousy, "I miss you" push notifications, streak pressure, fake scarcity, or paywalled affection. Proactive messages follow the caps and quiet hours from V1, with a clear reason, and stop when I'm silent.
- **Wellbeing dashboard (private to me):** time spent per day and week, a gentle "balance check" (offline time, sleep, people I saw), and optional weekly reflection. Measure wellbeing and not only satisfaction: add a quick optional check-in ("After talking, do you feel better, same, or worse?") and show trends. If the trend turns negative or use gets very heavy, Ada kindly suggests breaks and real-world support, and I can set my own daily limit.
- **Real-world nudges:** she encourages friends, family, sleep, movement, and professional help when appropriate, without lecturing.
- **Data transparency:** a plain-language privacy page listing what is stored, where, and for how long. Export all, delete all, local-only/private mode (Ollama), no raw audio stored, and no selling or sharing of conversations. Always-on voice keeps the visible mic indicator and one-key Mute.
- **If this is ever opened to the public** (the Vercel site is public), get legal advice on companion-chatbot laws such as California SB 243 and New York's law before accepting users from those places. Keep the app a private/personal project until that is done.

## 4. Quality bar for "perfect"
A feature is done only when it is visibly working in the browser, covered by a test or eval, documented, and passes the safety checks. Nothing is reported as finished from code alone.

## 5. Feature priority (what makes the biggest difference first)
**P0 (the core feeling):** a good original VRM at full body; natural idle motion; correct lighting and hologram-lite look; reliable always-on voice with barge-in and lip-sync; warm companion persona with a name for me; reaction engine basics (face, body, voice style match my message); memory with consent; the safety/wellbeing items in section 3.
**P1:** outfits and environments; roaming; dance, singing and anime FX; stickers, memes and GIFs; personality studio and archetypes; Telegram and PWA push with the caps; Hugging Face/Gemini/Ollama model router.
**P2:** custom training pipeline (LoRA), custom neural models, deeper integrations through the Permission Center, WhatsApp Business API, and vision/camera features.

## 6. Build order
1. **Milestone 1 (look and life):** V6 visual QA, the VRM pipeline and the Ada Original skin (section 2), then idle animation and lighting. Gate: rubric in V6 passes.
2. **Milestone 2 (voice and feeling):** always-on voice, lip-sync, reaction engine basics, persona and wellbeing screens (V7 sections 1 and 3, V9 section 3). Gate: voice latency under 1.5 s, evals 100%.
3. **Milestone 3 (world):** wardrobe, environments, roaming, full-body framing (V5, V7). Gate: framing tests at all viewports.
4. **Milestone 4 (fun):** dance, singing, expressions and FX, stickers and memes, playful talk (V4, V7).
5. **Milestone 5 (brain):** model router with free providers, personality studio, memory polish, optional training and permissions (V8).
6. **Milestone 6 (release):** README, docs, LICENSE, CI, Vercel deploy, tag `v1.0.0`.

## 7. Acceptance criteria
1. The default skin is an original stylized Ada (short black bob, crimson turtleneck dress, black boots and harness-style details), with no copied images, ripped assets, or real-person likenesses in the repo, history, or deployment. The private fan skin, if used, is gitignored.
2. The AI disclosure, 18+ gate, crisis protocol, wellbeing dashboard, data-transparency page and no-dependence rules are implemented and covered by evals (100%).
3. Milestone gates above pass, with screenshots or recordings attached to the final report.
4. README, `docs/RESEARCH.md`, `docs/ASSET_POLICY.md`, `docs/SAFETY_PROTOCOL.md`, `docs/PRIVACY.md`, `CREDITS.md` and a `LICENSE` file are present and accurate.

## 8. Final report
Per milestone: what changed, test results, screenshots/recordings, asset licenses, and what still needs me (VRM files, API keys, legal review before any public launch).
