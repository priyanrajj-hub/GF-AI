# Ada AI Companion: Privacy Policy & Data Transparency

> **Summary**: Ada is built with a **local-first, privacy-by-design architecture**. Your thoughts, journals, and conversations belong exclusively to you. We do not sell, license, or monetize your personal data.

---

## 1. What Data Is Stored & Where

| Data Category | Purpose | Storage Location | Retention / Control |
| :--- | :--- | :--- | :--- |
| **User Settings & Sliders** | Personality configuration, theme colors, preferred mode | Local Browser `localStorage` | Retained until cleared by user. |
| **Consented Memories** | Facts and preferences you explicitly ask Ada to remember | Local SQLite / Browser Cache | Fully editable and deletable via the Memory Manager (`Brain` icon). |
| **Mood Journal & Reflections** | Daily mood ratings, private reflections, and wellbeing check-ins | Local Browser `localStorage` / SQLite | Private to user; one-click export or delete. |
| **Chat Transcripts** | In-session conversational context | Local memory & local session cache | Cleared on "Clear Chat" or "Delete All Data". |
| **API Keys** | ElevenLabs, Hugging Face, Groq, or OpenRouter keys you provide | Local Browser `localStorage` | Stored exclusively on your device; never sent to any central Ada server. |

---

## 2. Voice & Microphone Data
- **Zero Raw Audio Storage**: When voice input is active, incoming audio is analyzed in-memory for speech-to-text recognition and real-time lip synchronization. **The raw audio stream is never recorded, saved to disk, or uploaded.**
- **Mic Indicator**: A distinct, visible pulsating microphone indicator is displayed at all times when audio capture is active.
- **Hardware Mute**: Pressing `M` on your keyboard or clicking the microphone icon instantly shuts off all microphone listening.

---

## 3. Third-Party Model Providers
Depending on your chosen configuration:
1. **Local-Only Mode (Ollama / Local Mock)**:
   - 100% private. All inference runs entirely on your local machine.
   - Zero network transmission occurs.
2. **Cloud APIs (Hugging Face, Groq, ElevenLabs, OpenRouter)**:
   - When you supply personal API keys, prompts are transmitted directly over HTTPS to the designated API endpoint according to that provider's privacy policy.
   - Project Ada does not proxy, intercept, or log these requests on any intermediary cloud servers.

---

## 4. User Rights & Data Autonomy
You maintain total sovereignty over your data:
- **Export All Data**: Download a complete, unencrypted JSON archive of all settings, memories, mood journals, and history at any time.
- **Delete All Data**: Permanently purge all local databases, cached memories, transcripts, and credentials with a single confirmation.
- **Selective Memory Erasure**: Open the Memory Manager to review, edit, or delete individual memories one by one, or instruct Ada via voice: *"Please forget everything you know about me."*

---

## 5. Contact & Support
For security inquiries or questions regarding privacy compliance, refer to the project repository or submit an issue on GitHub.
