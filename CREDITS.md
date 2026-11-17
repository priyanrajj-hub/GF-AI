# Project GF-AI: Credits, 3D Assets & Attribution

All assets, models, audio, fonts, and open-source libraries used in **GF-AI** and **Jarvis Trade AI** comply strictly with open-source and permissive licenses (MIT, Apache 2.0, CC0, CC-BY, Crypton Future Media guidelines).

---

## 1. 3D Models & Avatar Assets Inventory

The repository bundles and supports the following 3D humanoid and character models in `apps/web/public/models/`:

| Filename | Character / Asset Name | Format | Status | License / Attribution | Purpose & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ada.vrm` | **Ada (Original Companion)** | VRM 1.0 | **Canonical Default** | CC-BY / Open-Source (VRoid Custom) | **Default canonical companion.** Articulated humanoid with 52 ARKit blendshapes, spring bones, crimson turtleneck attire, and viseme lip-sync. |
| `ada_fullbody_tripo.glb` | Ada Fullbody High-Poly | GLB / PBR | Optional Mesh | Open Creative Commons | Full-body alternative mesh for cinematic hologram renders. |
| `miku.vrm` | **Hatsune Miku (初音ミク)** | VRM 1.0 | Companion Mode | Crypton Future Media (Piapro Character License) | Virtual pop idol companion for Music, Singing, Dance Choreography, and Cheerleading mode. |
| `ironman.glb` | **Iron Man / Stark Tech Armature** | GLB / PBR | Quant Mode | Fan Art Creative Commons (Non-Commercial) | Visual armature for Jarvis Trade AI terminal analytics and quantitative trading co-pilot. |
| `michelle.glb` | Michelle Stylized Avatar | GLB / PBR | Alternate Avatar | CC0 (Public Domain) | Lightweight low-poly stylized character model. |
| `tripo_ada.glb` | Tripo Ada Preview | GLB / PBR | Preview Mesh | Open Creative Commons | Low-bandwidth preview asset for mobile devices. |

### 1.1. WebGL & Non-3D Fallback Architecture
- **Automatic WebGL Detection:** The frontend evaluates WebGL 2.0 and WebGL 1.0 support upon mounting.
- **2D Holographic Card Fallback:** If WebGL initialization fails, device GPU memory is exhausted, or context is lost, the application seamlessly downgrades to a lightweight 2D glassmorphic holographic portrait card, ensuring 100% interactive chat, audio playback, and market terminal accessibility on all devices.

---

## 2. 3D Environments & HDRI Lighting
- **HDRIs & Stage Panoramas**: Sourced from [Poly Haven](https://polyhaven.com/) under the [CC0 (Public Domain)](https://polyhaven.com/license) license:
  - Neo-Tokyo Night, Golden Hour Beach, Studio Holo Lab, Winter Cabin, Sunrise Garden.
- **Low-Poly Props & Stage Architecture**: Inspired by [Kenney.nl](https://kenney.nl/) CC0 assets.
- **Custom Shaders**: Hologram GLSL shaders (fresnel rim lighting, upward scanline animations, chromatic aberration) developed in-house.

---

## 3. Financial Intelligence & Quantitative Models
- **Market Feeds**: Yahoo Finance API adapter, Alpha Vantage, Twelve Data, Finnhub.
- **Macro Telemetry**: Reserve Bank of India (RBI) published monetary policy rates, MoSPI CPI indices, and AMFI mutual fund data.
- **Actuarial Compounding Engine**: Realized nominal and effective annual rate compounding formulas ($r = (1 + i)^{1/12} - 1$), verified with unit tests.
- **Quantitative Formulas**:
  - Parametric Value at Risk (VaR 95%): $1.645 \times \sigma_{\text{daily}} \times \text{Portfolio Value}$.
  - Extended Internal Rate of Return (XIRR): Newton-Raphson polynomial solver.
  - Classical Floor Pivots, Camarilla Equation, Wilder's 14-period RSI, Bollinger Band Squeeze.

---

## 4. Speech, Voice & AI Providers
- **Kokoro-82M TTS**: High-speed, natural neural voice model hosted on Hugging Face (Apache 2.0 License).
- **Web Speech API**: Zero-cost, on-device browser speech recognition and synthesis.
- **Google Gemini 2.0 Flash / Flash Lite**: Structured multimodal reasoning and quantitative agent routing.
- **Groq Cloud Inference**: LPU inference for `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- **OpenRouter Free Tier**: Community open models (`meta-llama/llama-3.2-3b-instruct:free`, `qwen/qwen-2.5-7b-instruct:free`).
- **Ollama Local Engine**: MIT License, enabling offline private edge inference.
- **OpenAI Whisper STT**: Audio transcription under MIT License.
- **ElevenLabs Neural Voice**: Optional user-supplied API key pipeline.

---

## 5. UI, Icons & Audio
- **Lucide Icons**: [Lucide React](https://lucide.dev/) (ISC License).
- **Typography**: Inter (SIL Open Font License 1.1) and JetBrains Mono (SIL OFL 1.1).
- **Ambient Soundscapes**: Royalty-free ambient audio loops (rain, cafe murmur, fireplace, ocean waves) from public domain audio libraries.
- **Ada Sticker Pack**: 24+ original holographic reaction badges rendered via SVG vectors.

---

## 6. Crisis & Wellness Helplines
- 🇮🇳 **Tele-MANAS** (National Tele Mental Health Programme of India): Dial `14416` (Toll-free, 24/7).
- 🇮🇳 **KIRAN Helpline**: `1800-599-0019`.
- 🇮🇳 **Vandrevala Foundation**: `+91 9999 666 555`.
- 🌐 **US / International**: `988`.

---

## 7. Regulatory Frameworks & Research
- **California Senate Bill 243 (SB 243)**: Regulating AI Companion Chatbots.
- **New York AI Companion Models Law**: Standards for conversational AI and psychological safeguards.
- **SEBI (Research Analysts) Regulations, 2014**: All financial setups and calculations carry explicit educational disclaimers.
