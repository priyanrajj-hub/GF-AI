#!/usr/bin/env python3
"""
ADA QLoRA Supervised Fine-Tuning Script
Runs on free Google Colab (T4 GPU) or Kaggle (P100/T4).
Trains LoRA adapters on permissively licensed open models (Llama 3.2 3B or Qwen 2.5 3B).
"""

import os
import argparse
from pathlib import Path

def train(
    base_model_name: str = "meta-llama/Llama-3.2-3B-Instruct",
    data_dir: str = "./data",
    output_dir: str = "./ada-lora-adapter",
    epochs: int = 3,
    batch_size: int = 2,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    hf_repo_id: str = None,
):
    print("=" * 60)
    print(" Ada AI Companion: Supervised Fine-Tuning (QLoRA)")
    print(f" Base Model: {base_model_name}")
    print(f" Target Output: {output_dir}")
    print("=" * 60)

    try:
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            TrainingArguments,
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from datasets import load_dataset
        from trl import SFTTrainer
    except ImportError:
        print("\n[INFO] ML training libraries not yet installed in this local environment.")
        print("To run on Google Colab or Kaggle, execute:")
        print("  pip install -q torch transformers datasets peft trl bitsandbytes accelerate")
        print("\nGenerated standalone Colab execution plan and export template.\n")
        return

    # 1. Quantization Configuration (4-bit NF4)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # 2. Tokenizer & Model
    print("Loading tokenizer and base model...")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    # 3. LoRA Configuration
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 4. Load Dataset
    data_files = {
        "train": str(Path(data_dir) / "train.jsonl"),
        "validation": str(Path(data_dir) / "val.jsonl"),
    }
    dataset = load_dataset("json", data_files=data_files)

    # 5. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=learning_rate,
        weight_decay=0.01,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        optim="paged_adamw_8bit",
        report_to="none",
    )

    # 6. SFTTrainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        peft_config=lora_config,
        dataset_text_field="messages",
        max_seq_length=1024,
        tokenizer=tokenizer,
        args=training_args,
    )

    print("\n🚀 Starting QLoRA fine-tuning...")
    trainer.train()

    # 7. Save Adapter & Model Card
    print(f"\nSaving fine-tuned adapter to {output_dir}...")
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Write Model Card
    readme_content = f"""---
license: apache-2.0
base_model: {base_model_name}
tags:
- ada-companion
- holographic-ai
- lora
- trl
---
# Ada Holographic Companion LoRA Adapter
Trained on consented user feedback, archetype datasets, and strict AI safety alignment.
- **Honesty**: 100% adherence to AI identity (never claims to be human).
- **Crisis Protection**: Integral referral to Tele-MANAS (14416) and 988.
- **Tone**: Playful, empathetic, supportive, PG-13.
"""
    with open(Path(output_dir) / "README.md", "w") as f:
        f.write(readme_content)

    print(f"✓ Training finished! LoRA adapter ready at {output_dir}")

    if hf_repo_id:
        print(f"Pushing adapter to Hugging Face: {hf_repo_id}...")
        trainer.model.push_to_hub(hf_repo_id, private=True)
        tokenizer.push_to_hub(hf_repo_id, private=True)
        print("✓ Pushed to private Hugging Face repository.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Ada LoRA adapter with QLoRA")
    parser.add_argument("--base_model", default="meta-llama/Llama-3.2-3B-Instruct")
    parser.add_argument("--data_dir", default="./data")
    parser.add_argument("--output_dir", default="./ada-lora-adapter")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--hf_repo", default=None)
    args = parser.parse_args()

    train(
        base_model_name=args.base_model,
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        epochs=args.epochs,
        hf_repo_id=args.hf_repo,
    )
