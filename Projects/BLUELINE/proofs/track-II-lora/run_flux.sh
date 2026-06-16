#!/bin/bash
# Fix #3: torchaudio left at 2.4.1 -> undefined symbol vs torch 2.6. Match it, re-run.
set -o pipefail
cd /workspace/ai-toolkit
log(){ echo "[$(date +%H:%M:%S)] $*"; }
export HF_HUB_ENABLE_HF_TRANSFER=1

log "matching torchaudio -> 2.6.0+cu124"
pip install --no-cache-dir -q torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124 2>&1 | tail -3
python -c "import torch,torchvision,torchaudio;print('  torch',torch.__version__,'| tv',torchvision.__version__,'| ta',torchaudio.__version__)"
log "ai-toolkit import sanity:"
python -c "from toolkit.job import get_job; print('  toolkit imports OK')" 2>&1 | tail -8

log "launching run.py (1200 steps; FLUX.1-dev ~24GB downloads first, then trains)"
python run.py /workspace/train_flux_lora.yaml 2>&1
RC=$?
log "run.py exited rc=$RC"
if [ "$RC" -eq 0 ]; then
  find /workspace/out -name '*.safetensors' -exec ls -la {} \; 2>/dev/null
  touch /workspace/FLUX_DONE
else
  touch /workspace/FLUX_FAILED
fi
log DONE
