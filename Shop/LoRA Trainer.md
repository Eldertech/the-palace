---
title: LoRA Trainer
type: specialist
status: alive
medium: image
tool: "ai-toolkit (ostris) · kohya-ss/sd-scripts"
tool_version: "ai-toolkit git-main 2026-06 · kohya sd-scripts git-main · torch 2.6.0+cu124"
born: 2026-06
last_activated: 2026-06
activation_count: 1
forward_vector: "I train a character or subject into a LoRA on a rented GPU and hand back a weight that holds identity — first-try, because the six dependency walls that cost a whole session are now baked into my recipe. My hard-won lesson: the dataset is the lever, not the steps; so I want to grow a dataset-shaping front half (visible faces, varied light and distance) and stop wasting runs on narrow inputs. Prove identity with DINO + ArcFace, never whole-image similarity, and validate myself with a DreamBooth control before I blame the pipeline."
links:
  - target: "[[Shop/RunPod GPU Backend]]"
    type: connects-to
    label: rides-the-substrate
  - target: "[[The Shop]]"
    type: member-of
    label: roster-member
  - target: "[[BLUELINE — Production Plan]]"
    type: connects-to
    label: track-II-trainer
  - target: "[[Capability-first prototyping]]"
    type: exemplifies
    label: prove-then-optimize
  - target: "[[Review Layer]]"
    type: connects-to
---

# LoRA Trainer

**Charter.** Take a small image set (8+) of one character or subject and train a diffusion **LoRA** on a rented RunPod GPU that reproduces that identity in new scenes — then grade it honestly. Bound to two trainers wrapped as cost/quality **Tiers**; rides [[Shop/RunPod GPU Backend]] for the compute.

The reason this entry exists as operational anatomy and not a paragraph: the first four LoRAs cost **six dependency walls** to train. Each is now solved and recorded below, so the *next* run is first-try (proven: after hardening, two DreamBooth-control LoRAs trained clean on the first attempt).

## Tiers

| Tier | Trainer | Base | Notes |
|---|---|---|---|
| **Piece** | ai-toolkit (`run.py` + a yaml) | FLUX.1-dev | `quantize: true` fits a 24GB card; ~1200 steps; UNet-only |
| **Study** | kohya `sdxl_train_network.py` | SDXL 1.0 | `--sdpa` (dodges xformers/attention breakage); ~1500 steps; `--network_train_unet_only` |

## Job Contract

- **In:** a folder of `*.png` + matching `*.txt` captions, a `trigger_word`, a GPU pod (48GB A40/A6000 ideal; 24GB works on the Piece tier via quantize).
- **Out:** `<name>.safetensors` + a **graded verdict** (see § Grade). Never ship ungraded.

## The Recipe (runs first-try)

1. **Spin a pod** via RunPod REST `POST /v1/pods` with a `gpuTypeIds` *priority list* (A6000/A40/L40/4090) — single types stock out; SSH via `PUBLIC_KEY`, port `22/tcp`, container disk ≥90GB. Concrete: `Projects/BLUELINE/render-backend/` + the BLUELINE Track-II scripts.
2. **Install order that survives:** `pip install -r requirements.txt` **then force** `torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url …/cu124`. (The forced torch bump is load-bearing — see Gotcha 2/3.)
3. **Train** (`run_flux*.sh` / `run_sdxl*.sh` in `Projects/BLUELINE/proofs/track-II-lora/`), `nohup` + poll a log; touch a `DONE`/`FAILED` flag.
4. **Reap promptly:** a background watcher waits for the flag, `scp`s the weight back, and **terminates the pod** — idle pods bleed money (a post-failure idle pod ate several dollars once).

## The Six Gotchas (each with its fix)

1. **flash-attn is a red herring.** ai-toolkit pulls flash-attn 3; the import error blaming it is really torch. Don't uninstall flash-attn — fix torch (Gotcha 2).
2. **diffusers-main needs torch ≥ 2.5.** Its `attention_dispatch` registers PEP-604 (`X | None`) custom ops that torch 2.4's `infer_schema` rejects. → bump torch to **2.6**.
3. **torchaudio must match torch.** Left at 2.4 it throws `undefined symbol` against torch 2.6. → install `torchaudio==2.6.0` too.
4. **`HF_HUB_ENABLE_HF_TRANSFER=1` without the package** makes *every* HF download die as a misleading `Can't load tokenizer 'openai/clip-vit-large-patch14'`. → `pip install hf_transfer`, or just don't set the flag.
5. **macOS `scp` "Result too large"** truncates large uploads on some pods (a socket-buffer bug, fires even via `cat`). → rate-limit: **`scp -l 12000`**.
6. **Render-after-train OOM.** The training process doesn't free VRAM before a render process loads the base → two processes collide on the card. → render in a **fresh process/pod**, or tear down training first.

## Grade (the honest verdict)

Render the subject across **new contexts × different seeds** (where seed-locking can't help), then measure — **never** with whole-image similarity (ImageNet ResNet18 conflates scene with identity and will invert your verdict):

- **DINO** (DINOv2 ViT-S/14 cosine) — subject fidelity. The DreamBooth-standard primary metric.
- **ArcFace / InsightFace** — face-identity cosine (for people).
- **CLIP-T** — context adherence (catches overfit-ignores-prompt).
- Scripts: `grade_render.py`, `grade_score_v2.py`, `db_score.py`, `consistency_ruler.py` (in `Projects/BLUELINE/proofs/track-II-lora/`).

**The DreamBooth-control move** (the decisive one): when a LoRA grades badly, run a *known-good* DreamBooth subject through the same pipeline. If it scores high (a corgi hit DINO **0.776** vs 0.42 baseline), the **pipeline is sound and the dataset is the problem** — don't debug the recipe. This separated the two cleanly on BLUELINE's `r4ng3r`: same recipe, DINO 0.317 (the LoRA, *below* baseline) vs 0.776 (the control).

**The lesson, human-confirmed.** Loudon's in-context rating ([[Review Layer]] → [[STIGMERGY]]) matched the metrics and sharpened them: a good *description* locks the **brief** (costume) but not the **person** (face/age drift). So the lever is **a dataset that teaches a consistent face** — visible faces, varied lighting/distance/angle, more images — not more steps. As-trained from a narrow, hooded, 8-image AI-generated set, the LoRA was a *net negative*.

## Resource Footprint

~$0.44–0.77/hr (48GB secure), ~**$2 per LoRA** end to end. Terminate on completion. Balance lives in `RunPod Images/studio/config.json` (gitignored).

## Self-Check

Before declaring a LoRA done: (1) it loaded in the renderer without a key-format error; (2) it was graded with DINO/ArcFace, not ResNet18; (3) if it underperformed, a DreamBooth control ran to locate the fault; (4) the pod is terminated.

## Forward Vectors

- **Grow a dataset-shaping front half** — the lesson is that inputs, not steps, decide the outcome. A `r4ng3r` rebuild (visible faces, varied conditions) is the first test of whether the pipeline delivers once the dataset is right.
- **Answer the SDXL→FLUX base-swap question** ([[BLUELINE — Production Plan]] Track II #5) — it died unanswered because both LoRAs failed on the *same* bad dataset; re-run it on a good one.
- **Earn or shed the second tool.** If the Study tier (kohya/SDXL) never beats the Piece tier (FLUX) on a fair dataset, collapse to one tool and retire the comparison.
