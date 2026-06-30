#!/usr/bin/env python3
"""Apply weave unsung-path links: additive, idempotent, indent-matched, textual (no YAML reserialize
so Obsidian formatting/comments survive). Dry-run by default; pass --apply to write.

Sources: batch1/2/3-findings.json (deep workers: entry, references_entry, proposed_link_type,
proposed_label) + tier2-findings.json (programmatic: entry, references -> connects-to, no label).
Targets are validated against the canon title set; unknown targets are skipped and logged."""
import os, re, json, glob, sys, subprocess

PALACE = "/Users/loudonstearns/Documents/The Palace"
SESS = os.path.join(PALACE, "_ops/swarm/sessions/weave-2026-06-26")
APPLY = "--apply" in sys.argv

# Files another Claude is mid-editing — never entangle their work into our commit.
DIRTY = set()
try:
    out = subprocess.run(['git','-C',PALACE,'status','--porcelain','-z'],
                         capture_output=True, text=True).stdout
    for rec in out.split('\0'):
        if len(rec) > 3:
            DIRTY.add(os.path.join(PALACE, rec[3:]))
except Exception:
    pass
EXCLUDE = ('/.git/', '/.obsidian/', '/.claude/', '/_tools/', '/node_modules/', '/Archive/')

CANON_TYPES = {'connects-to','mirrors','enables','deepens','spawned','emerged-from',
               'contradicts','couples-with','exemplifies','member-of'}

def fm_body(text):
    if text.startswith('---'):
        p = text.split('---', 2)
        if len(p) >= 3:
            return p[1], p[2], True
    return '', text, False

# --- canon title -> path map ---
title2path, etype = {}, {}
for p in glob.glob(PALACE + '/**/*.md', recursive=True):
    if any(d in p for d in EXCLUDE): continue
    base = os.path.splitext(os.path.basename(p))[0]
    try: txt = open(p, encoding='utf-8').read()
    except Exception: continue
    fm, _, ok = fm_body(txt)
    tm = re.search(r'^\s*type\s*:\s*["\']?([a-z]+)', fm, re.M)
    if ok and tm:
        title2path[base] = p
        etype[base] = tm.group(1)
TITLES = set(title2path)

# --- collect unsung edges: (src_title) -> list of (target, type, label) ---
from collections import defaultdict
edges = defaultdict(dict)   # src -> {target: (type,label)}  (dedup, typed beats bare)
skipped = []

def add_edge(src, tgt, ltype, label):
    if src not in TITLES and os.path.basename(src) in TITLES:
        src = os.path.basename(src)          # worker reported a path-style title (e.g. Shop/Lettering)
    if tgt not in TITLES and os.path.basename(tgt) in TITLES:
        tgt = os.path.basename(tgt)
    if src not in TITLES:
        skipped.append((src, tgt, 'unknown-source')); return
    if tgt not in TITLES:
        skipped.append((src, tgt, 'unknown-target')); return
    if src == tgt: return
    if etype.get(tgt) == 'meta':   # don't formalize links to foundational/meta docs
        skipped.append((src, tgt, 'meta-target')); return
    ltype = ltype if ltype in CANON_TYPES else 'connects-to'
    prev = edges[src].get(tgt)
    # prefer a typed (non-connects-to) proposal over a bare connects-to
    if prev and prev[0] != 'connects-to' and ltype == 'connects-to':
        return
    edges[src][tgt] = (ltype, (label or '').strip())

for b in ('batch1-findings.json','batch2-findings.json','batch3-findings.json'):
    fp = os.path.join(SESS, b)
    if not os.path.exists(fp): continue
    for r in json.load(open(fp)):
        src = r['entry_title']
        for u in r.get('unsung_paths', []):
            add_edge(src, u.get('references_entry',''), u.get('proposed_link_type',''), u.get('proposed_label',''))
t2 = json.load(open(os.path.join(SESS,'tier2-findings.json')))
for u in t2.get('unsung_paths', []):
    add_edge(u['entry'], u['references'], 'connects-to', '')

# --- insertion engine ---
def existing_targets(fm_text):
    return set(re.findall(r'\[\[([^\]\|#]+)', fm_text))

def list_indent(fm_lines, links_idx):
    for ln in fm_lines[links_idx+1:]:
        m = re.match(r'^(\s*)-\s', ln)
        if m: return m.group(1)
        if ln.strip() and not ln.startswith(' '): break
    return '  '

def insert_links(path, new):
    txt = open(path, encoding='utf-8').read()
    fm, body, ok = fm_body(txt)
    if not ok: return None, 'no-frontmatter'
    fm_lines = fm.split('\n')
    have = existing_targets(fm)
    to_add = [(t,ty,lb) for (t,(ty,lb)) in new.items() if t not in have]
    if not to_add: return 0, 'all-present'
    # find links: block
    links_idx = next((i for i,l in enumerate(fm_lines) if re.match(r'^links\s*:\s*$', l)), None)
    block = []
    ind = list_indent(fm_lines, links_idx) if links_idx is not None else '  '
    for (t,ty,lb) in to_add:
        block.append(f'{ind}- target: "[[{t}]]"')
        block.append(f'{ind}  type: {ty}')
        if lb: block.append(f'{ind}  label: {lb}')
    if links_idx is None:
        # no links: block — create one at end of frontmatter
        fm_lines = [l for l in fm_lines]
        # drop trailing empties
        while fm_lines and fm_lines[-1].strip()=='' : fm_lines.pop()
        fm_lines += ['links:'] + block
    else:
        # find end of the links list = first line at/after links_idx+1 that is a top-level key or end
        end = len(fm_lines)
        for i in range(links_idx+1, len(fm_lines)):
            l = fm_lines[i]
            if l.strip()=='' and i==len(fm_lines)-1: end=i; break
            if l and not l.startswith(' ') and not l.startswith('\t'):
                end = i; break
        else:
            end = len(fm_lines)
        fm_lines = fm_lines[:end] + block + fm_lines[end:]
    new_txt = '---' + '\n'.join(fm_lines) + '---' + body
    if APPLY:
        open(path,'w',encoding='utf-8').write(new_txt)
    return len(to_add), (new_txt if not APPLY else 'applied')

# --- run ---
total_add = 0; files_touched = 0; per_file = []; samples = []; touched_paths = []
dirty_skipped = []
for src in sorted(edges):
    path = title2path[src]
    if path in DIRTY:
        dirty_skipped.append(src); continue      # leave in-flight files to their owner
    n, info = insert_links(path, edges[src])
    if n is None:
        skipped.append((src,'','no-frontmatter')); continue
    if n > 0:
        total_add += n; files_touched += 1
        per_file.append((src, n))
        touched_paths.append(path)
        if len(samples) < 3 and not APPLY:
            # capture just the new frontmatter for a sample
            fmtxt = info.split('---',2)[1]
            samples.append((src, n))

print(f"{'APPLY' if APPLY else 'DRY-RUN'}: {total_add} unsung links across {files_touched} files")
print(f"skipped: {len(skipped)} (unknown/meta/self) — e.g. {skipped[:5]}")
print(f"dirty-skipped (left to their owner): {len(dirty_skipped)} -> {dirty_skipped}")
print("top files by additions:")
for s,n in sorted(per_file, key=lambda x:-x[1])[:15]:
    print(f"   {n:3d}  {s}")
json.dump({'edges':{k:v for k,v in {s:dict(t) for s,t in edges.items()}.items()},
           'total_add':total_add,'files':files_touched,'skipped':skipped},
          open(os.path.join(SESS,'unsung-applied.json' if APPLY else 'unsung-dryrun.json'),'w'),
          indent=1, ensure_ascii=False)
if APPLY:
    with open(os.path.join(SESS,'touched-paths.txt'),'w',encoding='utf-8') as fh:
        for p in touched_paths:
            fh.write(os.path.relpath(p, PALACE) + '\n')
