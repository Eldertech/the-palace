"""
BLUELINE M3 — a ComfyUI custom node that injects an EXTERNAL latent-noise tensor (.npy) as the initial
sampling noise, so we can render with N_A (seed-lock) or N_warped (flow-warped) instead of seed-generated
noise. Used via SamplerCustomAdvanced's `noise` input (the standard external-noise path).

Install: copy/symlink this file into ComfyUI/custom_nodes/ (local SDXL verify AND the RunPod pod).
The .npy must be the latent shape for the model: SDXL = (4, H/8, W/8), FLUX = (16, H/8, W/8).
"""
import numpy as np, torch, os

class _NPYNoise:
    """A ComfyUI NOISE object: returns the loaded tensor as the sampler's initial noise."""
    def __init__(self, arr, seed=0):
        self.noise = torch.from_numpy(arr).float()      # (C, H, W)
        self.seed = int(seed)
    def generate_noise(self, latent_image):
        lat = latent_image["samples"]                    # (B, C, H, W) — match dtype/device/shape
        n = self.noise
        if n.dim() == 3: n = n.unsqueeze(0)
        n = n[:, :lat.shape[1], :lat.shape[2], :lat.shape[3]]
        return n.to(device=lat.device, dtype=lat.dtype).repeat(lat.shape[0], 1, 1, 1)[:, :lat.shape[1]]

class NoiseFromNPY:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"path": ("STRING", {"default": ""}),
                             "seed": ("INT", {"default": 0, "min": 0, "max": 2**31-1})}}
    RETURN_TYPES = ("NOISE",)
    RETURN_NAMES = ("noise",)
    FUNCTION = "load"
    CATEGORY = "BLUELINE"
    def load(self, path, seed):
        if not os.path.isfile(path):
            raise FileNotFoundError(f"NoiseFromNPY: {path} not found")
        arr = np.load(path).astype(np.float32)
        print(f"[BLUELINE] NoiseFromNPY loaded {path} shape={arr.shape} mean={arr.mean():+.3f} std={arr.std():.3f}")
        return (_NPYNoise(arr, seed),)

NODE_CLASS_MAPPINGS = {"NoiseFromNPY": NoiseFromNPY}
NODE_DISPLAY_NAME_MAPPINGS = {"NoiseFromNPY": "BLUELINE Noise from .npy"}
