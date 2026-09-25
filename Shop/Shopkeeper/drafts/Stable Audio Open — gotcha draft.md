# Proposed edit to Shop/Stable Audio Open.md — dated gotcha (draft, not applied)

Re-checked on the Hub 2026-09-25. The premise of the ask ("SA3 is live, add a note") is already covered: the entry migrated to SA3 on 2026-05-26 and its Gotchas record the install, the family (small-music, small-sfx, medium) and MPS timings. So I am not proposing a duplicate. Four things the Hub shows that the entry does not yet say:

**2026-09-25 — Re-check of the SA3 family on the Hub; what the entry didn't have.**
- **Inpainting is a first-class feature.** The model card says SA3 supports inpainting for targeted edits and continuing short recordings (`generate_diffusion_cond_inpaint` in `stable-audio-tools`). The entry's Capabilities never mention it. Untested by us.
- **Licence has a second layer.** Stability AI Community License, and the text encoder (T5Gemma) is redistributed under the Gemma Terms of Use (use restrictions, §3.2), accepted at the gated download. Commercial use points to https://stability.ai/license. This sharpens the existing open question about monetized Loudon Live use.
- **Lighter routes exist, unverified by me.** `stabilityai/stable-audio-3-optimized` (ONNX/TFLite), MLX ports (`mlx-community/stable-audio-3-small-music`, `-small-sfx`), a Comfy-Org single-file build for ComfyUI, and a q4 ONNX web build (`lsb/stable-audio-3-small-music-onnx`). All are third-party or newer than our install; I did not run any.
- Card claims "a few seconds on a MacBook Pro M4" for small models; our own 2026-05-26 timings (0.8 s / 2.1 s) are consistent.

Suggested frontmatter change: `last_gotcha: 2026-09-25` (elder to apply after Loudon's yes, already given as standing order d5).
