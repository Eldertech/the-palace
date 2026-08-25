#!/usr/bin/env python3
"""lint-voice-drift.py — the mechanical check for the Markup Density dial.

Measures typographic density per entry: bold spans and em-dashes per 1000 words
of body prose. Reports entries above the house ceiling.

Why this exists. The Palace Voice holds twelve dials — formality, jargon,
concision, cadence, and so on — and the palace obeyed all of them at the level of
word choice. The lexical hygiene held: the words Loudon nixed stayed at a floor of
0.2-0.3 per thousand words from March through July. What drifted instead was
*typography*, which no dial named. Measured across entries by the month they were
born:

    born      em-dashes/kw   bold spans/kw
    2026-03       18.9            16.4
    2026-04       19.2            14.7
    2026-05       19.2            15.9
    2026-06       24.6            25.1
    2026-07       26.7            22.3

Em-dashes up 41%, bold up 53%, against a founding baseline set when the voice was
being written deliberately. That is a model's house style, not Loudon's, and it
degrades the Cadence dial directly: when every third phrase is bolded, nothing
lands. The tell is that The Palace Voice itself — the entry defending plainness —
was written as a bolded bullet grid.

The dial that drifted is the one nobody named, which is the general lesson. A
stated value without a check drifts to whatever the writer's default is; the
palace already knows this ("a rule earns a gate once its check proves mechanical")
and this is that gate for the voice.

Thresholds are calibrated to the corpus, not to taste. Measured across 350
entries: bold has a median of 14.3/kw and a p90 of 33.4; em-dash a median of
20.9/kw and a p90 of 28.4. The ceilings sit at roughly p90, so the linter flags
the worst ~10% — an actionable list. Set at the March-May *mean* instead it
flagged 58% of the palace, which is noise rather than a gate: a check that fails
half the corpus teaches the reader to ignore it.

Two known false positives, by design rather than oversight. The
`Cross-Domain Resonances/` family runs 50-78 bold/kw because those entries are
structured side-by-side comparisons where the bolding is the structure; the same
is true of prompt templates in `_ops/swarm/`. Read a flag there as "check the
template," not "the voice drifted."

Entries under MIN_WORDS are skipped (short entries make the ratio meaningless).
Frontmatter, code blocks, tables, headings, and blockquotes are excluded —
tables legitimately bold their first column, and pull-quotes are quoted material.

Read-only. Exit 1 if any entry exceeds a ceiling, so it can gate a Weave the way
the sibling linters do. Advisory by design: a flagged entry needs a human read,
not an automatic rewrite. Run with --all to see every entry's numbers, --top N to
see the worst N.
"""
import argparse
import os
import re
import sys

SKIP_DIRS = {'.git', '.obsidian', '.claude', 'node_modules', '__pycache__',
             '.venvs', '_tools', '.venv', 'Archive'}
BOLD_CEILING = 32.0   # ~p90 of the current corpus
DASH_CEILING = 29.0   # ~p90 of the current corpus
MIN_WORDS = 150


def body_prose(text):
    """Strip frontmatter, fenced code, tables, and headings — measure prose only."""
    if text.startswith('---'):
        end = text.find('\n---', 3)
        if end >= 0:
            text = text[end + 4:]
    text = re.sub(r'```.*?```', '', text, flags=re.S)
    text = re.sub(r'^\s*\|.*$', '', text, flags=re.M)      # table rows
    text = re.sub(r'^\s{0,3}#{1,6} .*$', '', text, flags=re.M)  # headings
    text = re.sub(r'^\s*>.*$', '', text, flags=re.M)       # blockquotes (pull-quotes)
    return text


def measure(path):
    try:
        raw = open(path, encoding='utf-8', errors='replace').read()
    except OSError:
        return None
    if not raw.startswith('---') or not re.search(r'^type:\s*\S', raw[:2000], re.M):
        return None  # not a canon entry
    prose = body_prose(raw)
    words = len(prose.split())
    if words < MIN_WORDS:
        return None
    kw = words / 1000.0
    return {
        'words': words,
        'bold': len(re.findall(r'\*\*[^*\n]+\*\*', prose)) / kw,
        'dash': prose.count('—') / kw,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default='.')
    ap.add_argument('--all', action='store_true', help='print every measured entry')
    ap.add_argument('--top', type=int, default=0, help='print the worst N by bold density')
    args = ap.parse_args()

    rows = []
    for dp, dn, fn in os.walk(args.root):
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            if not f.endswith('.md'):
                continue
            p = os.path.join(dp, f)
            m = measure(p)
            if m:
                m['path'] = os.path.relpath(p, args.root)
                rows.append(m)

    if not rows:
        print('lint-voice-drift: no measurable entries found')
        return 0

    over = [r for r in rows if r['bold'] > BOLD_CEILING or r['dash'] > DASH_CEILING]
    rows.sort(key=lambda r: -r['bold'])

    show = rows if args.all else (rows[:args.top] if args.top else over)
    if show:
        print(f"{'bold/kw':>8} {'dash/kw':>8} {'words':>6}  entry")
        for r in show:
            flag = '!' if (r['bold'] > BOLD_CEILING or r['dash'] > DASH_CEILING) else ' '
            print(f"{r['bold']:8.1f} {r['dash']:8.1f} {r['words']:6d} {flag} {r['path']}")

    mean_b = sum(r['bold'] for r in rows) / len(rows)
    mean_d = sum(r['dash'] for r in rows) / len(rows)
    print()
    print(f"measured {len(rows)} entries — mean bold {mean_b:.1f}/kw, mean em-dash {mean_d:.1f}/kw")
    print(f"ceilings: bold {BOLD_CEILING}/kw, em-dash {DASH_CEILING}/kw (~p90 of the corpus)")
    print(f"over ceiling: {len(over)} entries ({100*len(over)/len(rows):.0f}%)")
    if over:
        print("\nAdvisory: a flagged entry wants a human read, not an automatic rewrite.")
        print("Bold what is load-bearing; let the sentence carry the rest.")
    return 1 if over else 0


if __name__ == '__main__':
    sys.exit(main())
