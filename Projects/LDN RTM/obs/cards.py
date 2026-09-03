#!/usr/bin/env python3
"""cards — render the LDN RTM title and end cards.

The END card is static, so it ships as one 1920x1080 PNG. The TITLE card is
dynamic (OBS reads title.txt / subtitle.txt live), so this only renders a preview
of it — what OBS composites is the real thing.

House style per [[Loudon Live Design System]]: Graphite skin, Anton display,
JetBrains Mono metadata, signal-amber accent, left-aligned editorial, 1px rules,
no emoji, no cyan. The wordmark is the all-caps Anton lockup — LOUD'N LIVE with
the 'N a full-size cap, "LIVE" carrying the accent.

  python3 cards.py            render end-card.png + title-preview.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FONTS = Path.home() / "Library" / "Fonts"
ANTON = FONTS / "Anton-Regular.ttf"
MONO = FONTS / "JetBrainsMono-Regular.ttf"
SIGIL = HERE / "sigil-lissajous.png"

W, H = 1920, 1080
BG = (10, 10, 15)              # #0a0a0f  graphite
INK = (232, 232, 240)          # #e8e8f0
AMBER = (232, 184, 74)         # #e8b84a  signal-amber
MUTED = (122, 122, 142)        # #7a7a8e
MARGIN = 160


def f(path, size):
    return ImageFont.truetype(str(path), size)


def tracked(d, xy, text, font, fill, spacing=0):
    """Draw text with letter-spacing (JetBrains Mono eyebrows want tracking)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + spacing
    return x


def base():
    im = Image.new("RGB", (W, H), BG)
    return im, ImageDraw.Draw(im)


def place_sigil(im, size, xy, opacity=1.0):
    if not SIGIL.exists():
        return
    s = Image.open(SIGIL).convert("RGBA").resize((size, size), Image.LANCZOS)
    if opacity < 1.0:
        a = s.getchannel("A").point(lambda v: int(v * opacity))
        s.putalpha(a)
    im.paste(s, xy, s)


def end_card():
    im, d = base()
    place_sigil(im, 520, (1240, 280))

    # wordmark — all-caps Anton lockup, LIVE carries the accent
    fw = f(ANTON, 150)
    x = MARGIN
    d.text((x, 430), "LOUD’N ", font=fw, fill=INK)
    x += d.textlength("LOUD’N ", font=fw)
    d.text((x, 430), "LIVE", font=fw, fill=AMBER)
    end_x = x + d.textlength("LIVE", font=fw)

    d.line([(MARGIN, 620), (end_x, 620)], fill=AMBER, width=1)
    tracked(d, (MARGIN, 648), "READ THE MANUAL", f(MONO, 22), MUTED, spacing=5)
    im.save(HERE / "end-card.png")
    return im


def title_preview(num_title="29.1  Arpeggiator", series="LDN RTM · LIVE 12"):
    im, d = base()
    place_sigil(im, 300, (1500, 130), opacity=0.55)
    tracked(d, (MARGIN, 392), series.upper(), f(MONO, 26), AMBER, spacing=6)
    d.line([(MARGIN, 440), (MARGIN + 620, 440)], fill=AMBER, width=1)
    d.text((MARGIN, 468), num_title, font=f(ANTON, 118), fill=INK)
    im.save(HERE / "title-preview.png")
    return im


if __name__ == "__main__":
    for p, n in ((ANTON, "Anton"), (MONO, "JetBrains Mono")):
        if not p.exists():
            raise SystemExit(f"missing font: {n} at {p}")
    end_card()
    title_preview()
    print("wrote end-card.png and title-preview.png")
