# Track II — running the character-LoRA training

The dataset (`dataset/*.png` + `*.txt`) and config (`train_flux_lora.yaml`) are ready. Training itself
needs **shell access on a GPU pod** — the inference pods we use expose only ComfyUI's HTTP API, so a
trainer needs an **SSH-enabled** pod. This is the one-time procedure.

## Why a different pod than the render pods

`pod_runner.py` drives ComfyUI over `:8188/proxy` — great for rendering, but you can't `git clone` or run
a trainer through it. Training needs a real shell, which means a pod created **with a `PUBLIC_KEY`** so
you can SSH in.

## FLUX path (ai-toolkit — matches the Piece tier)

```bash
# 0. local: make a keypair (once)
ssh-keygen -t ed25519 -f ~/.ssh/runpod -N ""

# 1. create an SSH pod (A40/A100, the model volume mounted, your pubkey as PUBLIC_KEY).
#    image: runpod/worker-comfyui:5.8.4-flux1-dev-fp8 (has python+torch+CUDA) OR a pytorch image.
#    set env PUBLIC_KEY="$(cat ~/.ssh/runpod.pub)", ports "22/tcp", volume aqm8oev4b0 -> /workspace.

# 2. SSH in (RunPod prints the exact host/port in the pod page)
ssh root@<pod-ip> -p <port> -i ~/.ssh/runpod        # or  ssh <id>@ssh.runpod.io -i ~/.ssh/runpod

# 3. push the dataset + config up
scp -P <port> -i ~/.ssh/runpod -r dataset train_flux_lora.yaml root@<pod-ip>:/workspace/

# 4. on the pod: trainer + FLUX access
cd /workspace
git clone https://github.com/ostris/ai-toolkit && cd ai-toolkit
pip install -r requirements.txt
huggingface-cli login            # token must have accepted black-forest-labs/FLUX.1-dev (gated)
python run.py /workspace/train_flux_lora.yaml      # ~1200 steps; samples land in /workspace/out

# 5. the LoRA: /workspace/out/r4ng3r_flux_lora/*.safetensors  -> scp it back, then TERMINATE the pod
```

## SDXL fallback (kohya — the reliable, ungated path; the Study tier)

If FLUX.1-dev access / ai-toolkit fights you, an SDXL character LoRA is battle-tested and needs no gated
download (the base swap SDXL→FLUX is itself Track II's question, so the Study-tier character is a valid
start):

```bash
# pod has no SDXL -> grab one
wget -O /workspace/sdxl.safetensors \
  "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
git clone https://github.com/kohya-ss/sd-scripts && cd sd-scripts && pip install -r requirements.txt
accelerate launch sdxl_train_network.py \
  --pretrained_model_name_or_path=/workspace/sdxl.safetensors \
  --train_data_dir=/workspace/dataset_kohya --output_dir=/workspace/out \
  --network_module=networks.lora --network_dim=16 --network_alpha=16 \
  --resolution=768,1024 --train_batch_size=1 --max_train_steps=1500 \
  --learning_rate=1e-4 --optimizer_type=AdamW8bit --mixed_precision=bf16 \
  --output_name=r4ng3r_sdxl
# (kohya wants its repeat-folder layout: dataset_kohya/10_r4ng3r/<png+txt>)
```

## The test that grades it (Track II's actual question)

Once the LoRA exists, this is the proof — **does it lock identity across DIFFERENT seeds** (where the
Track V seed-lock trick can't help)?

1. Load the LoRA in ComfyUI; render `r4ng3r` in 3–4 **new** poses with **different seeds each**.
2. `consistency_ruler.py` on those renders. Expect **high `embed_cos` despite different seeds** — the LoRA
   holding identity where the seed-locked baseline (Track V independent: 0.82) drifted.
3. That number vs the no-LoRA different-seed baseline is the Track II result.
