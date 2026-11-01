# Asset & Intellectual Property Policy

This document defines the strict asset provenance, copyright compliance, and dual-skin architecture for **Project Ada**.

---

## 1. Core Principles
1. **Original Public Assets**: All 3D models, textures, animations, audio, and code included in the public repository, commits, and production deployments are original creations or openly licensed (CC0, MIT, Apache 2.0).
2. **No Ripped Game Assets**: No proprietary game meshes, textures, rigs, sound effects, or motion capture data from commercial games (including Capcom's *Resident Evil* franchise) are present or permitted in this repository.
3. **No Real-Person Likenesses**: Character designs must remain anime/stylized and not trace, deepfake, or duplicate the biometric facial likeness of any real-world person or cosplayer.
4. **Non-Violent Gadgets**: Weaponry such as firearms, crossbows, and blades are prohibited. All character accessories are non-violent tactical tools (e.g., holographic communicator, data tablet, energy grapple beacon).

---

## 2. Dual-Skin Architecture

### Skin A: "Ada Original" (Public Default Skin)
- **Status**: Included in repository and production deployments.
- **Style**: Stylized anime spy-chic operative.
- **Specifications**:
  - **Hair**: Short black bob (`#15151A`) with soft side-swept bangs and subtle cool-blue sheen band.
  - **Outfit**: Ribbed burgundy/crimson turtleneck sweater dress (`#800020` / `#C81E2F`), procedural black leather chest harness with silver buckles, thin black waist belt, matte black gloves, and thigh-high leather boots over sheer dark stockings.
  - **Accessories**: Comms headset with boom mic (illuminates during listening and Jarvis operations).
  - **Face & Makeup**: Procedural Canvas2D makeup with ruby Cupid's bow lips (`#C81E2F`), cat-eye liner, and warm blush.
- **License**: MIT / Open Source.

### Skin B: "Private Fan Skin" (Local-Only Fan Creation)
- **Status**: Strictly `.gitignore`d; **never** committed to version control, never deployed to Vercel or cloud hosts.
- **Location**: `apps/web/public/models/private/ada-fan.vrm`
- **Legal Compliance**:
  - Maintained solely for the developer's private, personal, non-commercial use on local hardware.
  - In alignment with Capcom's Fan Content Guidelines:
    - Clearly identified as *"Unofficial Fan-Made, Not Affiliated with Capcom"*.
    - Completely non-commercial (no donations, paywalls, or merchandise).
    - Modeled independently without extracting or reusing Capcom's proprietary game files.

---

## 3. Audio & Voice Provenance
- **Voice Synthesis**: Generated via ElevenLabs API using authorized, legally licensed synthetic voices (`NOpBlnGInO9m6vDvFkFC`), or offline Web Speech API / Piper TTS.
- **Audio Ingestion**: Speech recognition is processed in-memory. **Zero raw user voice recordings are stored or transmitted.**

---

## 4. Third-Party Libraries & Shaders
- **Three.js**: MIT License (Ricardo Cabello / mrdoob).
- **@pixiv/three-vrm**: MIT License (Pixiv Inc.).
- **Lucide Icons**: ISC License.
- **Tailwind CSS**: MIT License (Tailwind Labs).
- **Canvas Shader Procedural Textures**: Custom original shader code authored for Project Ada.
