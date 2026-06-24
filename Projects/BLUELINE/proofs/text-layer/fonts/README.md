# BLUELINE text — font library

A wide skeleton-font palette so each text voice can have its own face (the font carries the source).

- **`lib/`** — fetched by `fetch_fonts.py` from **Google Fonts** (OFL / Apache — free, redistributable,
  commercial-OK; committed). Add more: edit the `FONTS` list and re-run. Other clean libraries to pull from
  the same way: **Velvetyne** (libre/experimental), **The League of Moveable Type**, **Open Foundry**.
- **`dropin/`** — drop any `.ttf`/`.otf` here (e.g. a cool one from **dafont.com**) and the sampler + harness
  find it automatically. *Not committed* — dafont licenses vary (many are "free for personal use" only; check
  per font before publishing a video). This is the dafont workflow: you browse + download, I integrate.
- **`samples/`** + **`font-sampler.html`** — `font_sampler.py` renders one word in every available font onto a
  contact sheet so you can pick by eye. Re-run after adding fonts: `font_sampler.py --word "BURNING"`.

The harness picks a font per voice from the `"font"` field in `text-prompts.json` (resolved by name across
system faces · `lib/` · `dropin/`); falls back to Chalkduster. OFL requires the license travel with the font —
the per-family `OFL.txt` lives in the Google Fonts repo alongside each.
