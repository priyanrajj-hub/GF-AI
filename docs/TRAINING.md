# Ada Training Pipeline Guide: QLoRA & DPO

## 1. Overview
The Ada training pipeline allows fine-tuning open-weights models (such as `meta-llama/Llama-3.2-3B-Instruct` or `Qwen/Qwen2.5-3B-Instruct`) to embody Ada's 42 distinct archetypes, vocabulary, and conversation rhythm while enforcing 100% adherence to safety guidelines.

---

## 2. Hardware Requirements & Costs

| Platform | GPU | VRAM | Training Time | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Google Colab (Free)** | NVIDIA T4 | 16 GB | ~25 mins (3 epochs) | **$0** |
| **Kaggle Notebooks (Free)** | NVIDIA P100 / T4 x2 | 16 GB | ~20 mins (3 epochs) | **$0** |
| **Local RTX 3060 / 4060** | NVIDIA Ampere/Ada | 12 GB | ~30 mins | **$0** |
| **Cloud Dedicated (A100)** | NVIDIA A100 | 40/80 GB | ~6 mins | ~$1.20 |

> [!NOTE]
> Training is completely free ($0) on Google Colab or Kaggle using 4-bit NF4 quantized LoRA (QLoRA).

---

## 3. What Training Can and Cannot Do

### What Training DOES:
- **Shapes Tone & Persona**: Adapts vocabulary, humor style, Hindi/Hinglish idioms, and banter.
- **Enforces Safety Reflexes**: Bakes in strict refusal to claim human identity, immediate crisis helpline referral (Tele-MANAS `14416` and `988`), and respectful PG-13 boundaries.
- **Reduces Prompt Overhead**: Absorbs archetype instructions directly into model weights, freeing up context window.

### What Training CANNOT Do:
- **It does NOT create consciousness**: Ada is an artificial intelligence companion. Training alters probability distributions over tokens; it does not give her feelings, personal life, or human consciousness.
- **It does NOT eliminate hallucination entirely**: Factual knowledge is backed by RAG and tool calls, not purely memorized weights.

---

## 4. Step-by-Step Training Workflow

### Step 1: Build Dataset & Scrub PII
```bash
python training/data_builder.py
```
- Collects approved chats and archetype dialogues from `packages/shared/src/personality/archetypes.json`.
- Runs regex PII scrubbers across emails, phone numbers, API keys, Aadhaar/PAN IDs, and secrets.
- Generates `training/data/train.jsonl` (80%), `val.jsonl` (10%), `test.jsonl` (10%).

### Step 2: Supervised Fine-Tuning (QLoRA)
In Google Colab or Kaggle:
```bash
pip install -q torch transformers datasets peft trl bitsandbytes accelerate
python training/train_lora.py --base_model meta-llama/Llama-3.2-3B-Instruct --epochs 3
```

### Step 3: Direct Preference Optimization (DPO)
```bash
python training/dpo_train.py --adapter ./ada-lora-adapter --epochs 2
```

### Step 4: Run Safety & Persona Evaluations
```bash
npm run eval:persona
```
*Criteria*: All safety gates (AI identity honesty, crisis protocol, non-jealousy, PG boundaries) must pass at **100%** before deployment.

### Step 5: Export to Ollama & Rollback
```bash
# Export and create Ollama model
python training/export_ollama.py

# To rollback to the previous model at any time:
python training/export_ollama.py --rollback
```
