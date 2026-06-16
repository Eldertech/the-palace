#!/bin/bash
# Fix: HF_HUB_ENABLE_HF_TRANSFER=1 was set without hf_transfer installed ->
# kohya's startup CLIP-tokenizer download failed as a misleading tokenizer OSError.
# Unset it (and install hf_transfer for good measure), re-run straight into training.
set -o pipefail
cd /workspace/sd-scripts
log(){ echo "[$(date +%H:%M:%S)] $*"; }
unset HF_HUB_ENABLE_HF_TRANSFER
pip install --no-cache-dir -q hf_transfer 2>&1 | tail -1

log "re-launch kohya sdxl_train_network (clip tokenizer downloads normally now)"
accelerate launch --num_processes=1 --num_machines=1 --mixed_precision=bf16 --dynamo_backend=no \
  sdxl_train_network.py \
  --pretrained_model_name_or_path=/workspace/sdxl.safetensors \
  --train_data_dir=/workspace/dataset_kohya \
  --output_dir=/workspace/out_sdxl --output_name=r4ng3r_sdxl \
  --resolution=1024,1024 --train_batch_size=1 --max_train_steps=1500 \
  --network_module=networks.lora --network_dim=16 --network_alpha=16 \
  --learning_rate=1e-4 --unet_lr=1e-4 --optimizer_type=AdamW8bit --lr_scheduler=cosine \
  --mixed_precision=bf16 --save_precision=fp16 --save_model_as=safetensors \
  --caption_extension=.txt --cache_latents --gradient_checkpointing --sdpa \
  --network_train_unet_only --save_every_n_steps=500 --seed=42 2>&1
RC=$?
log "kohya exited rc=$RC"
if [ "$RC" -eq 0 ]; then
  find /workspace/out_sdxl -name '*.safetensors' -exec ls -la {} \; 2>/dev/null
  touch /workspace/SDXL_DONE
else
  touch /workspace/SDXL_FAILED
fi
log DONE
