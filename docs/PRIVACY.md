# Ada Wong AI: Always-On Voice & Privacy Architecture

Ada Wong features a continuous speech interface engineered with strict on-device privacy protections.

## 🛡️ Core Privacy Principles

1. **Continuous On-Device Voice Activity Detection (VAD)**:
   - Audio capture uses client-side VAD (Web Speech API / Silero) running locally in your browser.
   - Silence and background ambient noise are never transmitted or processed by external LLMs.
2. **Hard One-Key Hardware Mute ('M' Key)**:
   - Pressing the **M key** on your keyboard or clicking the microphone icon triggers an immediate hard mute that completely terminates audio stream capture.
3. **No Audio Storage**:
   - Zero raw user audio is stored, uploaded to external servers, or used for model training.
   - Text transcripts are stored only in your local client database (`localStorage` / SQLite) with full user deletion controls.
4. **Active Conversation Window**:
   - Ada listens actively when addressed by name ("Ada") or within 20 seconds of an ongoing exchange, preventing accidental background triggers.
