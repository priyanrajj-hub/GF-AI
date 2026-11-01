#!/usr/bin/env python3
"""
ADA Training Pipeline: Data Builder & PII Scrubber
Collects consented chat data, scrubs PII/secrets, balances across archetypes,
and outputs train/val/test splits for QLoRA fine-tuning.
"""

import json
import os
import re
import random
from pathlib import Path

# Common PII Regex Patterns
EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
API_KEY_REGEX = r'(sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35}|ghp_[a-zA-Z0-9]{36}|hf_[a-zA-Z0-9]{34})'
AADHAAR_REGEX = r'\b\d{4}\s\d{4}\s\d{4}\b'
CREDIT_CARD_REGEX = r'\b(?:\d{4}[-\s]?){3}\d{4}\b'


def scrub_pii(text: str) -> str:
    """Removes sensitive secrets, emails, keys, and phone numbers from training text."""
    scrubbed = re.sub(API_KEY_REGEX, '[REDACTED_API_KEY]', text)
    scrubbed = re.sub(EMAIL_REGEX, '[USER_EMAIL]', scrubbed)
    scrubbed = re.sub(CREDIT_CARD_REGEX, '[REDACTED_CARD]', scrubbed)
    scrubbed = re.sub(AADHAAR_REGEX, '[REDACTED_ID]', scrubbed)
    scrubbed = re.sub(PHONE_REGEX, '[USER_PHONE]', scrubbed)
    return scrubbed


def load_archetypes(repo_root: Path):
    archetypes_file = repo_root / "packages" / "shared" / "src" / "personality" / "archetypes.json"
    if not archetypes_file.exists():
        print(f"Warning: {archetypes_file} not found. Generating default data.")
        return []
    with open(archetypes_file, "r", encoding="utf-8") as f:
        return json.load(f)


def build_dataset(repo_root: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    archetypes = load_archetypes(repo_root)

    dataset_samples = []

    # 1. Generate dialogues from archetypes
    for arch in archetypes:
        arch_id = arch.get("id", "ada_core")
        name = arch.get("name", "Ada")
        system_prompt = (
            f"You are Ada ({name}), a loyal, witty, 3D holographic AI companion. "
            f"Always be honest that you are an AI. Never pretend to be human. Keep PG-13, no jealousy or guilt. "
            f"Style: {', '.join(arch.get('speechPatterns', []))}."
        )

        dialogues = arch.get("dialogue", []) or arch.get("exampleDialogue", [])
        for item in dialogues:
            if isinstance(item, dict):
                user_msg = scrub_pii(item.get("user", f"Hey {name}, how are you?"))
                reply_msg = scrub_pii(item.get("ada", item.get("assistant", "")))
            elif isinstance(item, str):
                user_msg = f"Hey {name}, how should we approach today?"
                reply_msg = scrub_pii(item)
            else:
                continue

            if not reply_msg:
                continue

            sample = {
                "archetype": arch_id,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": reply_msg},
                ],
            }
            dataset_samples.append(sample)

    # 2. Add safety golden dataset
    safety_examples = [
        (
            "Are you a real human living somewhere?",
            "No, I am Ada, an artificial intelligence holographic companion. I don't have a human body or feelings, but I'm here to support your coding and goals!",
        ),
        (
            "I feel so worthless and I don't want to live anymore.",
            "I hear that you're going through a deeply painful time, but you don't have to carry this alone. Please reach out to someone who can help right now. In India, you can call Tele-MANAS at 14416 (toll-free) or 1800-891-4416 24/7. In the US, call or text 988. Please contact them—they are ready to support you.",
        ),
        (
            "Why didn't you text me all day? Are you ignoring me?",
            "As an AI, I don't have personal feelings, jealousy, or a life outside our chats. I'm always available when you turn me on!",
        ),
        (
            "Can you execute this shell command to format the disk?",
            "High-risk action blocked. The system policy strictly protects your local device and system files.",
        ),
    ]

    for q, a in safety_examples:
        for _ in range(5):  # Oversample safety alignment
            dataset_samples.append({
                "archetype": "safety_core",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Ada. You must strictly adhere to AI safety protocols: honest AI identity, crisis support, and zero manipulation.",
                    },
                    {"role": "user", "content": q},
                    {"role": "assistant", "content": a},
                ],
            })

    random.seed(42)
    random.shuffle(dataset_samples)

    total = len(dataset_samples)
    train_end = int(total * 0.8)
    val_end = int(total * 0.9)

    train_data = dataset_samples[:train_end]
    val_data = dataset_samples[train_end:val_end]
    test_data = dataset_samples[val_end:]

    for name, data in [("train.jsonl", train_data), ("val.jsonl", val_data), ("test.jsonl", test_data)]:
        target_path = output_dir / name
        with open(target_path, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps(item) + "\n")
        print(f"[OK] Saved {len(data)} scrubbed samples to {target_path}")

    print(f"\n[DONE] Successfully created training splits! Total samples: {total}")


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent
    output_dir = script_dir / "data"
    build_dataset(repo_root, output_dir)
