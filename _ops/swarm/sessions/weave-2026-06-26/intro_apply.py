#!/usr/bin/env python3
"""Apply the curated new-introductions (the weave's generalization edges). Additive,
idempotent (skips a pair already linked), indent-matched, dirty-guarded. The edge is
written on the SOURCE side only. Dry-run by default; --apply to write."""
import os, re, json, glob, sys, subprocess
PALACE = "/Users/loudonstearns/Documents/The Palace"
SESS = os.path.join(PALACE, "_ops/swarm/sessions/weave-2026-06-26")
APPLY = "--apply" in sys.argv

# Curated edges: (source, target, type, label). Source-side write.
EDGES = [
  # --- BLUELINE coherent package ---
  ("BLUELINE", "Graphic Storytelling", "emerged-from", "speaks-comics-first"),
  ("BLUELINE", "Frame Designer", "spawned", "the-frame-shop"),
  ("Frame Designer", "Graphic Storytelling", "deepens", "applies-the-craft"),
  ("Frame Designer", "Comic and Cinema — Two Ways of Seeing", "exemplifies", "stages-the-seam"),
  ("Frame Designer", "The 2.5D Paper Stack", "emerged-from", "born-from-the-stack"),
  ("The 2.5D Paper Stack", "Comic and Cinema — Two Ways of Seeing", "connects-to", "depth-between-registers"),
  ("Hand-Drawn 3D Look", "The 2.5D Paper Stack", "connects-to", "lifts-ink-into-depth"),
  ("Remnants in Depth", "The 2.5D Paper Stack", "couples-with", "layers-in-space"),
  # --- storytelling = teaching ---
  ("Comic and Cinema — Two Ways of Seeing", "Hilaritas Generator", "connects-to", "compress-or-dilate-to-teach"),
  ("Hilaritas Generator", "Modes of Collaboration", "couples-with", "how-we-make-joy"),
  ("Loudon Live Design System", "Hilaritas Generator", "enables", "the-teaching-surface"),
  ("Typography as Meaning", "Hilaritas Generator", "enables", "a-voice-with-a-face"),
  ("Modes of Collaboration", "Cooperation Yields Agency", "deepens", "named-ways-to-cooperate"),
  # --- image/video/audio tools -> Loudon Live / storytelling ---
  ("ComfyUI", "Loudon Live Design System", "enables", "renders-the-lesson-art"),
  ("Kokoro", "Loudon Live Design System", "enables", "the-lesson-voice"),
  ("ffmpeg", "Loudon Live Design System", "enables", "assembles-the-reel"),
  ("Stable Audio Open", "Loudon Live Design System", "enables", "lesson-sound"),
  ("Radio Play", "Modes of Collaboration", "connects-to", "the-debrief-reel"),
  ("Radio Play", "Loudon Live Design System", "connects-to", "teaching-radio"),
  ("ffmpeg", "Radio Play", "enables", "assembles-the-play"),
  # --- people / bridges -> teaching anchors ---
  ("Andrei Tarkovsky", "Comic and Cinema — Two Ways of Seeing", "connects-to", "long-take-dilation"),
  ("Yasujirō Ozu", "Comic and Cinema — Two Ways of Seeing", "connects-to", "the-pillow-shot-gutter"),
]

DIRTY = set()
try:
    out = subprocess.run(['git','-C',PALACE,'status','--porcelain','-z'],capture_output=True,text=True).stdout
    for rec in out.split('\0'):
        if len(rec) > 3: DIRTY.add(os.path.join(PALACE, rec[3:]))
except Exception: pass

t2p = {}
for p in glob.glob(PALACE+'/**/*.md', recursive=True):
    if any(d in p for d in ('/.git/','/.obsidian/','/.claude/','/_tools/','/Archive/')): continue
    b = os.path.splitext(os.path.basename(p))[0]
    try: txt=open(p,encoding='utf-8').read()
    except Exception: continue
    if txt.startswith('---') and re.search(r'^\s*type\s*:', txt.split('---',2)[1], re.M):
        t2p.setdefault(b, p)

def list_indent(fm_lines, idx):
    for ln in fm_lines[idx+1:]:
        m=re.match(r'^(\s*)-\s', ln)
        if m: return m.group(1)
        if ln.strip() and not ln.startswith(' '): break
    return '  '

def add_one(src, tgt, ty, label):
    if src not in t2p:
        b=os.path.basename(src); src=b if b in t2p else src
    if src not in t2p: return 'no-src'
    if tgt not in t2p: return 'no-tgt'
    path=t2p[src]
    if path in DIRTY: return 'dirty'
    txt=open(path,encoding='utf-8').read(); _,fm,body=txt.split('---',2)
    if f'[[{tgt}]]' in fm: return 'present'
    lines=fm.split('\n')
    li=next((i for i,l in enumerate(lines) if re.match(r'^links\s*:',l)), None)
    ind=list_indent(lines, li) if li is not None else '  '
    block=[f'{ind}- target: "[[{tgt}]]"', f'{ind}  type: {ty}', f'{ind}  label: {label}']
    if li is None:
        while lines and lines[-1].strip()=='' : lines.pop()
        lines += ['links:']+block+['']          # trailing blank keeps closing --- on its own line
    else:
        end=None
        for i in range(li+1,len(lines)):
            if lines[i] and not lines[i].startswith((' ','\t')): end=i; break
        if end is None:                          # links is the last frontmatter key
            while lines and lines[-1].strip()=='' : lines.pop()
            lines = lines + block + ['']
        else:
            lines = lines[:end] + block + lines[end:]
    if APPLY: open(path,'w',encoding='utf-8').write('---'+'\n'.join(lines)+'---'+body)
    return 'added'

res={}; touched=set()
for e in EDGES:
    r=add_one(*e); res[r]=res.get(r,0)+1
    if r=='added': touched.add(os.path.relpath(t2p.get(e[0], t2p.get(os.path.basename(e[0]),'')), PALACE))
print(f"{'APPLY' if APPLY else 'DRY-RUN'}: {res}")
if APPLY:
    open(os.path.join(SESS,'intro-touched.txt'),'w').write('\n'.join(sorted(touched))+'\n')
