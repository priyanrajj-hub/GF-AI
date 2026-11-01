#!/usr/bin/env python3
"""
ADA Direct Preference Optimization (DPO) Script
Tunes the fine-tuned model using thumbs-up (chosen) and thumbs-down (rejected) pairs.
Enforces authentic companion style and penalizes sycophancy or clinginess.
"""

import argparse
from pathlib import Path

def train_dpo(
    model_adapter_path: str = "./ada-lora-adapter",
    base_model_name: str = "meta-llama/Llama-3.2-3B-Instruct",
    dpo_data_path: str = "./data/dpo_pairs.jsonl",
    output_dir: str = "./ada-dpo-adapter",
    epochs: int = 2,
    beta: float = 0.1,
):
    print("=" * 60)
    print(" Ada AI Companion: Direct Preference Optimization (DPO)")
    print(f" LoRA Adapter: {model_adapter_path}")
    print(f" DPO Pairs: {dpo_data_path}")
    print(f" Beta Parameter: {beta}")
    print("=" * 60)

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
        from datasets import load_dataset
        from trl import DPOTrainer, DPOConfig
    except ImportError:
        print("\n[INFO] DPO libraries not yet installed in local environment.")
        print("To run in Colab/Kaggle, execute:")
        print("  pip install -q torch transformers datasets peft trl bitsandbytes")
        return

    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print("Loading base model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map="auto",
    )
    model = PeftModel.from_pretrained(base_model, model_adapter_path, is_trainable=True)

    dataset = load_dataset("json", data_files=dpo_data_path)

    training_args = DPOConfig(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=5e-5,
        beta=beta,
        logging_steps=10,
        save_strategy="epoch",
        report_to="none",
    )

    dpo_trainer = DPOTrainer(
        model=model,
        ref_model=None,
        args=training_args,
        train_dataset=dataset["train"],
        tokenizer=tokenizer,
        max_length=1024,
        max_prompt_length=512,
    )

    print("\n🚀 Executing DPO alignment...")
    dpo_trainer.train()

    print(f"\n✓ DPO training complete! Saved to {output_dir}")
    dpo_trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter", default="./ada-lora-adapter")
    parser.add_argument("--base_model", default="meta-llama/Llama-3.2-3B-Instruct")
    parser.add_argument("--data", default="./data/dpo_pairs.jsonl")
    parser.add_argument("--output", default="./ada-dpo-adapter")
    args = parser.parse_args()

    train_dpo(
        model_adapter_path=args.adapter,
        base_model_name=args.base_model,
        dpo_data_path=args.data,
        output_dir=args.output,
    )
