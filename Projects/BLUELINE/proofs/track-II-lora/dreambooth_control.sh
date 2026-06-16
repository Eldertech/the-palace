#!/bin/bash
# DreamBooth pipeline-control: train a FLUX LoRA on a KNOWN-GOOD subject, render a grading
# set. If DINO subject-fidelity is HIGH here, our pipeline is sound and r4ng3r's failure is
# purely the dataset. Args: SUBJ TRIG CLASS   e.g.  dog sks dog
set -o pipefail
SUBJ=$1; TRIG=$2; CLASS="$3"
cd /workspace
log(){ echo "[$(date +%H:%M:%S)] $*"; }
log "=== DreamBooth control: subject=$SUBJ trigger=$TRIG class='$CLASS' ==="
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

# 1. data (the few-shot subject + trivial captions)
[ -d dreambooth ] || git clone --depth 1 https://github.com/google/dreambooth 2>&1 | tail -2
mkdir -p /workspace/db_data
cp dreambooth/dataset/$SUBJ/* /workspace/db_data/ 2>/dev/null
for f in /workspace/db_data/*; do case "$f" in *.txt) ;; *) echo "a photo of $TRIG $CLASS" > "${f%.*}.txt";; esac; done
NIMG=$(ls /workspace/db_data/ | grep -ivc '\.txt$')
log "data: $NIMG images"; [ "$NIMG" -lt 2 ] && { log "NO DATA for $SUBJ"; touch /workspace/DBCTRL_FAILED; exit 1; }

# 2. ai-toolkit (gotchas baked: requirements -> force torch 2.6 + matched torchaudio)
[ -d ai-toolkit ] || git clone --depth 1 https://github.com/ostris/ai-toolkit 2>&1 | tail -2
cd ai-toolkit && git submodule update --init --recursive 2>&1 | tail -1
pip install --no-cache-dir -q -r requirements.txt 2>&1 | tail -3
pip install --no-cache-dir -q torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124 2>&1 | tail -2
python -c "import torch,diffusers;print('  torch',torch.__version__,'diffusers',diffusers.__version__,'cuda',torch.cuda.is_available())" || { touch /workspace/DBCTRL_FAILED; exit 1; }

# 3. config + train
cat > /workspace/db_train.yaml <<YAML
job: extension
config:
  name: "${SUBJ}_flux_lora"
  process:
    - type: 'sd_trainer'
      training_folder: "/workspace/out"
      device: cuda:0
      trigger_word: "$TRIG"
      network: {type: "lora", linear: 16, linear_alpha: 16}
      save: {dtype: float16, save_every: 1000, max_step_saves_to_keep: 1}
      datasets:
        - folder_path: "/workspace/db_data"
          caption_ext: "txt"
          caption_dropout_rate: 0.05
          cache_latents_to_disk: true
          resolution: [768, 1024]
      train:
        batch_size: 1
        steps: 1000
        train_unet: true
        train_text_encoder: false
        gradient_checkpointing: true
        noise_scheduler: "flowmatch"
        optimizer: "adamw8bit"
        lr: 1e-4
        dtype: bf16
      model: {name_or_path: "black-forest-labs/FLUX.1-dev", is_flux: true, quantize: true}
      sample:
        sampler: "flowmatch"
        sample_every: 1000
        prompts: ["a photo of $TRIG $CLASS on a beach"]
        neg: ""
        width: 768
        height: 1024
        sample_steps: 20
meta: {name: "$SUBJ", version: '1.0'}
YAML
log "training ($TRIG $CLASS, 1000 steps)"
python run.py /workspace/db_train.yaml 2>&1 | tail -16
LORA=$(find /workspace/out -name "${SUBJ}_flux_lora.safetensors" | head -1)
log "trained LoRA: $LORA"
[ -z "$LORA" ] && { log "no LoRA produced"; touch /workspace/DBCTRL_FAILED; exit 1; }

# 4. render grading set (4 new contexts x 4 seeds; lora + baseline)
cat > /workspace/db_render.py <<PY
import torch, os
from diffusers import FluxPipeline
TRIG="$TRIG"; CLASS="$CLASS"; SUBJ="$SUBJ"
CTX=["on a sandy beach","in a snowy forest","on a wooden table","on a city street at night"]
SEEDS=[101,202,303,404]
os.makedirs("/workspace/dbgrade",exist_ok=True)
p=FluxPipeline.from_pretrained("black-forest-labs/FLUX.1-dev",torch_dtype=torch.bfloat16)
p.load_lora_weights("$LORA")
vram=torch.cuda.get_device_properties(0).total_memory/1e9
(p.to("cuda") if vram>=40 else p.enable_model_cpu_offload())
def gen(prompts,tag):
    for i,(pr,s) in enumerate(zip(prompts,SEEDS)):
        im=p(pr,generator=torch.Generator("cpu").manual_seed(s),num_inference_steps=24,guidance_scale=3.5,height=1024,width=1024).images[0]
        im.save(f"/workspace/dbgrade/{tag}_{i}_seed{s}.png"); print("saved",tag,i,flush=True)
gen([f"a photo of {TRIG} {CLASS} {c}" for c in CTX], SUBJ+"_lora")
p.unload_lora_weights()
gen([f"a photo of a {CLASS} {c}" for c in CTX], SUBJ+"_base")
print("DB_RENDER_DONE")
PY
python /workspace/db_render.py 2>&1 | tail -12
RC=$?
echo "--- dbgrade ---"; ls -la /workspace/dbgrade/ 2>/dev/null
if [ "$RC" -eq 0 ]; then touch /workspace/DBCTRL_DONE; else touch /workspace/DBCTRL_FAILED; fi
log DONE
