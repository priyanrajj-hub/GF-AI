# 🚀 GF-AI / Ada Holographic AI Companion — Vercel Deployment Guide

## Quick Start (Deploy in 5 Minutes)

### 1. Push to GitHub
Your repository is hosted at:
**[https://github.com/priyanrajj-hub/GF-AI](https://github.com/priyanrajj-hub/GF-AI)**

To commit and push the latest changes:
```bash
git add .
git commit -m "feat: voice sync fix, RAG vector DB, real algotrading radar, openrouter multi-model, vercel ready"
git push origin main
```

---

### 2. Connect to Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** → **"Project"**.
3. Import **`priyanrajj-hub/GF-AI`**.
4. Configure the project settings:
   - **Framework Preset**: Other / None
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `npm install`

---

### 3. Environment Variables (Vercel Dashboard)

Add these variables under **Settings → Environment Variables**:

| Variable | Description | Where to get it (Free) |
|---|---|---|
| `GEMINI_API_KEY` | Primary Google Gemini LLM | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENROUTER_API_KEY` | Free Multi-Model Router (Llama 3, Mistral, Qwen) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `GROQ_API_KEY` | Ultra-fast Llama 3.3 70B inference | [console.groq.com/keys](https://console.groq.com/keys) |
| `HF_TOKEN` | Hugging Face Free Serverless Inference | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `JWT_SECRET` | 32+ character random secret string | Any random 32 char string |
| `NODE_ENV` | `production` | Set manually |
| `ELEVENLABS_API_KEY` | Optional premium high-res voice | [elevenlabs.io](https://elevenlabs.io) |

---

### 4. 3D Model CDN / Storage

The app bundles 3D models:
- `/models/ironman.glb` (Tony Stark PBR model)
- `/models/ada.vrm` (Ada Wong & Yor Forger VRM avatars)
- `/models/ada_fullbody_tripo.glb` (Alternate full-body mesh)

For Vercel deployment:
- `vercel.json` contains immutable cache headers for `/models/*` so assets are cached globally across Vercel's edge network.
- For optimal load times, you can also host `.glb` / `.vrm` files on **Vercel Blob** or **Cloudflare R2** and configure the URL in the Settings Modal.

---

### 5. Verify Live Deployment

Once deployed, visit your Vercel URL (e.g., `https://gf-ai.vercel.app`):
- ✅ **Holographic 3D Canvas**: Renders Tony Stark, Ada Wong, and Yor Forger.
- ✅ **Voice Engine**: Zero-overlap audio synthesis with synchronized mouth lip-sync.
- ✅ **Live AlgoTrading Radar**: Live real-time stocks, crypto, and Nifty 50 data with RSI, MACD, and Bollinger Bands.
- ✅ **Bloomberg Market Ticker**: Continuous financial headlines and macro sentiment.
- ✅ **RAG Vector Database**: Deep trading mechanics & character lore context injection.
