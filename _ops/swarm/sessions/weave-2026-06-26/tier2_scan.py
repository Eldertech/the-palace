#!/usr/bin/env python3
"""Tier-2 zero-LLM weave scan: body [[wikilinks]] not in YAML (unsung paths) + face existence,
over canon entries NOT covered by Tier-1 deep workers. Pure string/file work, no model."""
import os, re, json, glob

PALACE = "/Users/loudonstearns/Documents/The Palace"
SESS = os.path.join(PALACE, "_ops/swarm/sessions/weave-2026-06-26")
EXCLUDE_DIRS = ('/.git/', '/.obsidian/', '/.claude/', '/_tools/', '/node_modules/', '/Archive/')

# Tier-1 deep-audited entries (pilot + b1 + b2 + b3) — skip these
AUDITED = set()
for b in ('batch1-findings.json', 'batch2-findings.json', 'batch3-findings.json'):
    p = os.path.join(SESS, b)
    if os.path.exists(p):
        for r in json.load(open(p)):
            AUDITED.add(r['entry_title'])
# pilot + planned b3 (in case b3 not yet written)
AUDITED |= {'Graphic Storytelling','Comic and Cinema — Two Ways of Seeing','Frame Designer',
            'Steer the Generator','Radio Play'}

def frontmatter_and_body(text):
    if text.startswith('---'):
        parts = text.split('---', 2)
        if len(parts) >= 3:
            return parts[1], parts[2]
    return '', text

def wikilink_targets(s):
    out = set()
    for m in re.findall(r'\[\[([^\]]+)\]\]', s):
        t = m.split('|')[0].split('#')[0].strip()
        if t:
            out.add(t)
    return out

# Build the canon title set (files with frontmatter carrying a type:)
all_md = []
for p in glob.glob(PALACE + '/**/*.md', recursive=True):
    if any(d in p for d in EXCLUDE_DIRS):
        continue
    all_md.append(p)

titles = {}      # all canon titles (for match target set)
etype = {}       # base -> type
for p in all_md:
    base = os.path.splitext(os.path.basename(p))[0]
    try:
        txt = open(p, encoding='utf-8').read()
    except Exception:
        continue
    fm, _ = frontmatter_and_body(txt)
    tm = re.search(r'^\s*type\s*:\s*["\']?([a-z]+)', fm, re.M)
    if tm:  # canon = has a type
        titles[base] = p
        etype[base] = tm.group(1)

title_set = set(titles)

# Entries we will NOT treat as unsung sources: meta docs + log/index/handoff/context files.
# These legitimately name many entries in prose without wanting typed frontmatter links.
LOGISH = ('Archive', 'To-Do', 'Handoff', '— Context', 'Graffiti', 'Deposit Map',
          'README', 'SCHEMA', 'CLAUDE', 'ROSETTA', 'JEWEL', 'SUBSTRATE', 'Ceremony',
          'Quotes', 'Skill', ' Map', 'Map ', 'Production Plan', 'Build Plan', 'Spec')
def is_unsung_source(base):
    if etype.get(base) == 'meta':
        return False
    if any(w in base for w in LOGISH):
        return False
    return True

unsung_rows = []
face_missing = []
scanned = 0
for base, p in titles.items():
    if base in AUDITED:
        continue
    scanned += 1
    txt = open(p, encoding='utf-8').read()
    fm, body = frontmatter_and_body(txt)
    yaml_targets = wikilink_targets(fm)
    body_links = wikilink_targets(body)
    # unsung = body wikilink to a known canon title, not already a YAML link target, not self
    # only for genuine idea/work entries (not meta/log/index files)
    if is_unsung_source(base):
        for t in sorted(body_links):
            if t == base:
                continue
            if t in title_set and t not in yaml_targets and etype.get(t) != 'meta':
                unsung_rows.append({'entry': base, 'references': t})
    # face existence: bundle folder sibling named exactly like the entry
    bundle = os.path.join(os.path.dirname(p), base)
    has_hero = bool(glob.glob(bundle + '/* — hero.png')) or os.path.exists(bundle + f'/{base} — hero.png')
    has_icon = bool(glob.glob(bundle + '/* — icon.png')) or os.path.exists(bundle + f'/{base} — icon.png')
    if not (has_hero and has_icon):
        face_missing.append({'entry': base, 'has_hero': has_hero, 'has_icon': has_icon})

out = {'scanned': scanned, 'unsung_paths': unsung_rows, 'face_missing': face_missing}
json.dump(out, open(os.path.join(SESS, 'tier2-findings.json'), 'w'), indent=1, ensure_ascii=False)
print(f"Tier-2 scan: {scanned} canon entries scanned (excludes {len(AUDITED)} Tier-1)")
print(f"  unsung paths (body [[wikilink]] not in YAML): {len(unsung_rows)} across {len(set(r['entry'] for r in unsung_rows))} entries")
print(f"  faces missing: {len(face_missing)} entries")
# top entries by unsung count
from collections import Counter
c = Counter(r['entry'] for r in unsung_rows)
print("  top unsung-heavy entries:", c.most_common(12))
