#!/usr/bin/env python3
"""
ADA Ollama Modelfile Generator & Rollback Manager
Converts fine-tuned LoRA weights or merged models into an Ollama model definition.
Includes rollback capabilities to restore previous stable checkpoint.
"""

import sys
import shutil
from pathlib import Path

def generate_modelfile(
    base_model: str = "llama3.2:3b",
    adapter_path: str = "./ada-lora-adapter",
    model_name: str = "ada-v0.8",
    system_prompt: str = None,
):
    print("=" * 60)
    print(f" Generating Ollama Modelfile for '{model_name}'")
    print("=" * 60)

    if not system_prompt:
        system_prompt = (
            "You are Ada, an intelligent 3D holographic AI companion with 42 switchable "
            "personalities. You are honest about being an AI, warm, witty, supportive, "
            "and strictly follow safe PG-13 boundaries and Tele-MANAS (14416) crisis protocol."
        )

    modelfile_content = f"""# Modelfile for {model_name}
FROM {base_model}
PARAMETER temperature 0.75
PARAMETER top_p 0.90
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|eot_id|>"

SYSTEM \"\"\"{system_prompt}\"\"\"
"""
    modelfile_path = Path("./Modelfile")

    # Backup current Modelfile for rollback
    if modelfile_path.exists():
        backup_path = Path("./Modelfile.backup")
        shutil.copy(modelfile_path, backup_path)
        print(f"✓ Backed up existing Modelfile to {backup_path}")

    with open(modelfile_path, "w", encoding="utf-8") as f:
        f.write(modelfile_content)

    print(f"[OK] Successfully wrote {modelfile_path}")
    print("\nTo build and run in Ollama locally:")
    print(f"  ollama create {model_name} -f ./Modelfile")
    print(f"  ollama run {model_name}")

def rollback():
    backup_path = Path("./Modelfile.backup")
    if not backup_path.exists():
        print("[ERROR] No backup Modelfile found to restore.")
        return 1

    shutil.copy(backup_path, Path("./Modelfile"))
    print("[OK] Restored previous Modelfile from backup!")
    print("Run `ollama create ada-v0.8 -f ./Modelfile` to re-apply the previous adapter.")
    return 0

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        sys.exit(rollback())
    else:
        generate_modelfile()
