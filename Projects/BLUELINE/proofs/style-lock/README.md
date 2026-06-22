# BLUELINE · STYLE-LOCK — intuition-guided style, mastered by volume + selection

The problem Loudon set: **hold one hand-drawn look — black chisel-tip marker (+ grey dry-brush) on rough
white cold-press watercolor paper, loose gestural lines that amplify motion — consistent across MANY
characters**, and *use gen-AI well* (make many, toss the outliers; put intuition in the loop).

M4 already showed prompt-only style is **soft** — it drifts character to character. Consistency is engineered
with a ladder of locks (floor → strongest): locked recipe → **volume + outlier rejection** → **deterministic
substrate lock** → style reference → **style LoRA**. This folder is the working bench for that.

## The two surfaces

### 1. Taste Breeder — `taste-breeder.html` (the game) ▸ NEW
Put your **intuition** in the loop instead of a metric. Four frames; click the one that feels right; it
learns an online preference model over the style axes (tone · line · density · subject), refines the prompt,
**guesses your next pick**, and reports how well it's reading you. Fast (navigates a growing local pool
instantly). Verified: a consistent-taste player gets **~83 % next-pick accuracy** in ~12 rounds, with the
right axes rising to the top.
- Serve it: `python3 -m http.server 8206 --directory .` (or the `taste-breeder` launch config) → open
  `http://localhost:8206/taste-breeder.html`.
- **V2 (next):** a *breed-fresh* button generates 4 brand-new frames from the learned prompt each round
  (pod-backed for speed) instead of navigating a fixed pool.

### 2. Volume + select (the metric path) — for batch consistency, not interactive
- `style_explore.py` — generate MANY of a locked recipe across a cast (free local SDXL on :8189).
- `paper_marker.py` — **deterministic substrate lock**: the model draws the line/value; this owns the paper
  + marker tone identically on every image (quantize to {paper-white · dry-grey · ink-black}, break ink on a
  procedural cold-press tooth, lay faint grain). Substrate reads identical across characters *by construction*.
- `style_score.py` — content-independent **style descriptor** (tone histogram · ink coverage · gradient/line
  stats · paper-grain energy) → cosine to the batch centroid → flags outliers → contact sheet. "Toss the
  outliers" as a number.

### Shared — `pool_gen.py`
Generates the **style-spanning pool** (tone × line × density × subject, tagged) that the game navigates;
rewrites `pool-manifest.json` live as it fills. Faster/smaller config (640×896) — the breeder wants volume.

## The recipe (Loudon's pick, 2026-06-19)
black ink **+ grey dry-brush** · **loose & gestural** strokes that amplify motion · rough white cold-press
watercolor paper · lots of white space · sumi-e / Inoue-Vagabond / manga-ink lineage.

## The plan
Explore with the game → harvest the tight cluster it converges on → train a **style LoRA** (Track II) on that
cluster so the look is locked one-shot. The game solves the usual chicken-and-egg: it *produces* the
consistent set a LoRA needs.
