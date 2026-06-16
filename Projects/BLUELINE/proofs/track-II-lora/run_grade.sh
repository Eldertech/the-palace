#!/bin/bash
# BLUELINE Track II — grade render setup + run on a GPU pod.
set -o pipefail
cd /workspace
export HF_HUB_ENABLE_HF_TRANSFER=1
log(){ echo "[$(date +%H:%M:%S)] $*"; }

log "=== grade render setup ==="
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
log "torch 2.6 + diffusers(main) + peft — the stack that created these LoRAs"
pip install --no-cache-dir -q torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124 2>&1 | tail -2
pip install --no-cache-dir -q "git+https://github.com/huggingface/diffusers" transformers accelerate peft sentencepiece protobuf hf_transfer 2>&1 | tail -5
python -c "import torch,diffusers,peft;print('  torch',torch.__version__,'| diffusers',diffusers.__version__,'| peft',peft.__version__,'| cuda',torch.cuda.is_available())" || { log "import broke"; touch /workspace/GRADE_FAILED; exit 1; }

log "rendering grade set (FLUX lora+base, SDXL lora+base; 4 scenes x 4 seeds)"
python /workspace/grade_render.py 2>&1
RC=$?
log "render rc=$RC"
echo "--- grade dir ---"; ls -la /workspace/grade/ 2>/dev/null
if [ "$RC" -eq 0 ]; then touch /workspace/GRADE_DONE; else touch /workspace/GRADE_FAILED; fi
log DONE
