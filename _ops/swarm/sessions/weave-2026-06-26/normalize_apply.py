#!/usr/bin/env python3
"""Apply the RELIABLE People/Bridges normalization: forward_vector (where absent),
last_activated, activation_count, FOUR PILLARS connects-to->deepens, and clear stage
demotions. DEFERS born_year/died_year/domains (worker data proved unreliable — needs a
factual lookup pass). Textual frontmatter surgery, idempotent, dirty-file-guarded,
dry-run by default; --apply to write."""
import os, re, json, glob, sys, subprocess
PALACE = "/Users/loudonstearns/Documents/The Palace"
SESS = os.path.join(PALACE, "_ops/swarm/sessions/weave-2026-06-26")
APPLY = "--apply" in sys.argv
TODAY = "2026-06-26"

DIRTY = set()
try:
    out = subprocess.run(['git','-C',PALACE,'status','--porcelain','-z'],capture_output=True,text=True).stdout
    for rec in out.split('\0'):
        if len(rec) > 3: DIRTY.add(os.path.join(PALACE, rec[3:]))
except Exception: pass

# title -> path
t2p = {}
for p in glob.glob(PALACE+'/**/*.md', recursive=True):
    if any(d in p for d in ('/.git/','/.obsidian/','/.claude/','/_tools/','/Archive/')): continue
    b = os.path.splitext(os.path.basename(p))[0]
    try: txt = open(p,encoding='utf-8').read()
    except Exception: continue
    if txt.startswith('---') and re.search(r'^\s*type\s*:', txt.split('---',2)[1], re.M):
        t2p.setdefault(b, p)

# build plan from findings
plan = {}   # title -> {vector(if absent), is_people}
for bf, people in (('batch1-findings.json',False),('batch2-findings.json',True),('batch3-findings.json',False)):
    for r in json.load(open(os.path.join(SESS,bf))):
        e = r['entry_title']
        fv = r['forward_vector_check']
        rec = plan.setdefault(e, {'vector':None,'people':people,'stage':None,'fourpillars':False})
        if fv['strength'] in ('weak','absent') and not fv['present'] and fv.get('proposed'):
            rec['vector'] = fv['proposed'].strip()
        for m in r['metadata_flags']:
            f = m['field'].lower()
            if f.strip()=='stage' and 'growing' in m['proposed']: rec['stage']='growing'
            if 'pillars' in f or 'four pillars' in f: rec['fourpillars']=True

def esc(v):  # YAML double-quote-safe single line
    return '"' + v.replace('\\','\\\\').replace('"','\\"') + '"'

def edit_fm(path, rec):
    txt = open(path,encoding='utf-8').read()
    if not txt.startswith('---'): return None,'no-fm'
    _,fm,body = txt.split('---',2)
    lines = fm.split('\n'); changed=[]
    # last_activated
    for i,l in enumerate(lines):
        if re.match(r'^last_activated\s*:', l):
            if TODAY not in l: lines[i]=f'last_activated: {TODAY}'; changed.append('last_activated')
            break
    else:
        # insert after 'born:' if present
        for i,l in enumerate(lines):
            if re.match(r'^born\s*:', l): lines.insert(i+1, f'last_activated: {TODAY}'); changed.append('last_activated+'); break
    # activation_count +1
    for i,l in enumerate(lines):
        m=re.match(r'^activation_count\s*:\s*(\d+)', l)
        if m: lines[i]=f'activation_count: {int(m.group(1))+1}'; changed.append('activation_count'); break
    # stage demotion
    if rec['stage']:
        for i,l in enumerate(lines):
            if re.match(r'^stage\s*:', l):
                if rec['stage'] not in l: lines[i]=f'stage: {rec["stage"]}'; changed.append('stage')
                break
    # FOUR PILLARS connects-to -> deepens (within links block)
    if rec['fourpillars']:
        for i,l in enumerate(lines):
            if 'FOUR PILLARS' in l and 'target' in l:
                # next 1-2 lines hold type:
                for j in range(i+1, min(i+4,len(lines))):
                    if re.match(r'^\s*type\s*:\s*connects-to', lines[j]):
                        lines[j]=re.sub(r'type\s*:\s*connects-to','type: deepens',lines[j]); changed.append('fourpillars')
                    if re.match(r'^\s*-\s*target', lines[j]): break
                break
    # forward_vector — only ADD if absent (never overwrite an existing one)
    has_fv = any(re.match(r'^forward_vector\s*:', l) for l in lines)
    if rec['vector'] and not has_fv:
        ins = next((i for i,l in enumerate(lines) if re.match(r'^links\s*:', l)), None)
        line = f'forward_vector: {esc(rec["vector"])}'
        if ins is not None: lines.insert(ins, line)
        else:
            while lines and lines[-1].strip()=='' : lines.pop()
            lines.append(line)
        changed.append('forward_vector')
    if not changed: return 0,'nochange'
    new = '---'+'\n'.join(lines)+'---'+body
    if APPLY: open(path,'w',encoding='utf-8').write(new)
    return changed,'ok'

touched=[]; skipped_dirty=[]; summary={}
for e,rec in plan.items():
    if e not in t2p:
        b=os.path.basename(e)
        if b in t2p: e2=b
        else: continue
    else: e2=e
    path=t2p[e2]
    if path in DIRTY: skipped_dirty.append(e2); continue
    res,info = edit_fm(path, rec)
    if isinstance(res,list) and res:
        touched.append(os.path.relpath(path,PALACE))
        for c in res: summary[c]=summary.get(c,0)+1
print(f"{'APPLY' if APPLY else 'DRY-RUN'}: {len(touched)} entries changed")
print('field changes:', summary)
print('dirty-skipped:', skipped_dirty)
print('vectors-added:', summary.get('forward_vector',0), '/ entries with proposed vector:',
      sum(1 for r in plan.values() if r['vector']))
if APPLY:
    open(os.path.join(SESS,'normalize-touched.txt'),'w').write('\n'.join(touched)+'\n')
