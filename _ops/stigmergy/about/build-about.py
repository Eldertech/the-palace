#!/usr/bin/env python3
"""
build-about.py — generate the Palace "SYSTEM INFO" bulletin.

A regenerable About page for The Palace, rendered in the STIGMERGY / cracked-
shareware BBS aesthetic (green phosphor, VT323 + IBM Plex Mono, 80 columns,
CP437-weight CSS borders, scanlines). It is the aesthetic descendant of the
retired LoginScreen: the dial-in ritual that was removed as an entry-step is
redirected here into a sysop "node stats" bulletin.

Stats are computed live from the working tree + git at generation time and
baked into a self-contained index.html (openable via file:// or a static
server). Re-run this script to refresh the numbers — that is the whole point;
the page must not rot like a hand-typed snapshot.

Usage:  python3 _ops/stigmergy/about/build-about.py
        (writes index.html beside this script; pass a palace root as argv[1]
         to point elsewhere)
"""
from __future__ import annotations
import os, re, sys, subprocess, collections, datetime, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", ".."))
OUT  = os.path.join(HERE, "index.html")

SKIP = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "venv", "__pycache__", "_tools"}
# Canonical entry-type vocabulary (SCHEMA §1, v1.6). Types outside this set are
# real values found in the wild (bundle files, working docs) and shown as "other".
CANON_TYPES = ["concept", "hub", "project", "breakthrough", "source", "meta",
               "practice", "person", "question", "spore", "specialist", "maker"]
STAGE_ORDER = ["seed", "sprout", "growing", "mature", "fruiting", "dormant",
               "composting", "foundational"]


def walk_files(root):
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP]
        for fn in fns:
            yield os.path.join(dp, fn)


def frontmatter(path):
    try:
        t = open(path, encoding="utf-8", errors="ignore").read()
    except OSError:
        return ""
    if not t.startswith("---"):
        return ""
    m = re.match(r"---\s*\n(.*?)\n---", t, re.S)
    return m.group(1) if m else ""


def fm_scalar(fm, key):
    m = re.search(rf"^{key}:\s*\"?([A-Za-z0-9_-]+)\"?\s*$", fm, re.M)
    return m.group(1) if m else None


def git(*a):
    try:
        return subprocess.check_output(["git", "-C", ROOT, *a], text=True,
                                       stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


def human_bytes(n):
    f = float(n)
    for u in ("B", "KB", "MB", "GB"):
        if f < 1024:
            return f"{f:.0f} {u}" if u != "B" else f"{int(f)} {u}"
        f /= 1024
    return f"{f:.1f} TB"


def collect():
    md, total_bytes, all_files = [], 0, 0
    for ap in walk_files(ROOT):
        all_files += 1
        try:
            total_bytes += os.path.getsize(ap)
        except OSError:
            pass
        if ap.lower().endswith(".md"):
            md.append(ap)

    types = collections.Counter()
    stages = collections.Counter()
    links = 0
    fv = 0
    hubs = set()
    entries = 0  # knowledge entries: .md, not under _ops/, not a symlink alias

    for ap in md:
        rp = os.path.relpath(ap, ROOT)
        is_alias = os.path.islink(ap)
        is_ops = rp.split(os.sep)[0] == "_ops"
        if not is_ops and not is_alias:
            entries += 1
        fm = frontmatter(ap)
        if not fm:
            continue
        links += len(re.findall(r"^\s*-\s*target:", fm, re.M))
        if re.search(r"^forward_vector:", fm, re.M):
            fv += 1
        t = fm_scalar(fm, "type")
        if t and not is_alias:
            types[t] += 1
            if t == "hub":
                hubs.add(os.path.basename(rp)[:-3])
        s = fm_scalar(fm, "stage")
        if s and not is_alias:
            stages[s] += 1

    first = (git("log", "--reverse", "--format=%cd", "--date=short").split("\n") or [""])[0]
    last_ts = git("log", "-1", "--format=%cd", "--date=format:%Y-%m-%d %H:%M")
    commits = git("rev-list", "--count", "HEAD") or "?"
    authors = [l for l in git("shortlog", "-sn", "HEAD").split("\n") if l.strip()]

    try:
        born = datetime.date.fromisoformat(first)
        uptime = (datetime.date.today() - born).days
    except ValueError:
        uptime = None

    return dict(all_files=all_files, total_bytes=total_bytes, md=len(md),
                entries=entries, types=types, stages=stages, links=links, fv=fv,
                hubs=sorted(hubs, key=str.lower), first=first or "?", last_ts=last_ts or "?",
                commits=commits, authors=len(authors), uptime=uptime)


def bar(count, peak, width=34, fill="█", track="·"):
    n = 0 if peak <= 0 else round(width * count / peak)
    n = max(1, n) if count else 0
    return fill * n + track * (width - n)


def render(d):
    gen = git("log", "-1", "--format=%cd", "--date=format:%Y-%m-%d %H:%M") or "?"

    # --- SYSTEM INFO rows ---
    info = [
        ("NODE", "THE PALACE — a living knowledge organism"),
        ("FORWARD VECTOR", "symbiotic human + AI flourishing through joyful creation"),
        ("ONLINE SINCE", f"{d['first']}" + (f"   ·   uptime {d['uptime']} days" if d['uptime'] is not None else "")),
        ("LAST WRITE", d["last_ts"]),
        ("OPERATORS", f"{d['authors']}   ·   tRiCKSTER + CLAUDE"),
        ("KNOWLEDGE ENTRIES", f"{d['entries']:,}"),
        ("MARKDOWN FILES", f"{d['md']:,}"),
        ("TYPED LINKS", f"{d['links']:,}   (the semantic web)"),
        ("FORWARD VECTORS", f"{d['fv']:,}   entries voiced"),
        ("COMMITS", f"{d['commits']}"),
        ("TOTAL FILES", f"{d['all_files']:,}"),
        ("DISK FOOTPRINT", human_bytes(d["total_bytes"])),
    ]
    info_rows = "\n".join(
        f'    <div class="row"><span class="k">{html.escape(k)}</span>'
        f'<span class="dots"></span><span class="v">{html.escape(v)}</span></div>'
        for k, v in info
    )

    # --- entry types bar chart (canonical first, then others merged) ---
    types = d["types"]
    peak = max(types.values()) if types else 1
    canon_present = [(t, types[t]) for t in CANON_TYPES if types.get(t)]
    other = sorted(((t, c) for t, c in types.items() if t not in CANON_TYPES),
                   key=lambda x: -x[1])
    type_lines = []
    for t, c in canon_present:
        type_lines.append(
            f'    <div class="brow"><span class="bk">{t}</span>'
            f'<span class="bar">{bar(c, peak)}</span><span class="bn">{c}</span></div>')
    if other:
        type_lines.append('    <div class="bsep">— non-canonical type values found in the wild '
                          '(bundle / working-doc files; SCHEMA §1 defines 12) —</div>')
        for t, c in other:
            type_lines.append(
                f'    <div class="brow dim"><span class="bk">{t}</span>'
                f'<span class="bar">{bar(c, peak)}</span><span class="bn">{c}</span></div>')
    types_block = "\n".join(type_lines)

    # --- stages lifecycle bar ---
    stages = d["stages"]
    speak = max(stages.values()) if stages else 1
    stage_lines = "\n".join(
        f'    <div class="brow"><span class="bk">{s}</span>'
        f'<span class="bar">{bar(stages[s], speak)}</span><span class="bn">{stages[s]}</span></div>'
        for s in STAGE_ORDER if stages.get(s)
    )

    # --- hubs ---
    hub_items = "".join(f'<span class="hub">{html.escape(h)}</span>' for h in d["hubs"])

    out = TEMPLATE
    for token, value in (
        ("%%GEN%%", html.escape(gen)),
        ("%%INFO_ROWS%%", info_rows),
        ("%%TYPES_BLOCK%%", types_block),
        ("%%N_TYPES%%", str(len(d["types"]))),
        ("%%STAGE_LINES%%", stage_lines),
        ("%%HUB_ITEMS%%", hub_items),
        ("%%N_HUBS%%", str(len(d["hubs"]))),
    ):
        out = out.replace(token, value)
    return out


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THE PALACE :: SYSTEM INFO</title>
<style>
  @font-face {
    font-family:'VT323'; font-style:normal; font-weight:400; font-display:swap;
    src:url('../design-system/fonts/VT323-Regular.woff2') format('woff2'),
        url('https://fonts.gstatic.com/s/vt323/v17/pxiKyp0ihIEF2isfFJXUdVNF.woff2') format('woff2');
  }
  @font-face {
    font-family:'IBM Plex Mono'; font-style:normal; font-weight:400; font-display:swap;
    src:url('../design-system/fonts/IBMPlexMono-Regular.woff2') format('woff2'),
        url('https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n3kwq0n1hj-sNFQ.woff2') format('woff2');
  }
  @font-face {
    font-family:'IBM Plex Mono'; font-style:normal; font-weight:600; font-display:swap;
    src:url('../design-system/fonts/IBMPlexMono-SemiBold.woff2') format('woff2'),
        url('https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n1ioa3nmHlosnkP8.woff2') format('woff2');
  }
  :root{
    --phosphor:#33ff66; --phosphor-bright:#7fff9b; --phosphor-dim:#1f8a3c;
    --phosphor-deep:#0b2a14; --phosphor-white:#d7f6dc; --bg:#050a06;
    --amber:#ffb000; --red:#ff4136; --cyan:#7fdbff;
    --font-display:'VT323','Menlo','Courier New',monospace;
    --font-body:'IBM Plex Mono','Menlo','Consolas','Courier New',monospace;
    --glow:0 0 6px currentColor, 0 0 14px color-mix(in srgb, currentColor 40%, transparent);
    --glow-strong:0 0 8px currentColor, 0 0 22px currentColor, 0 0 44px color-mix(in srgb, currentColor 30%, transparent);
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);}
  body{
    font-family:var(--font-body); font-size:15px; line-height:1.5;
    color:var(--phosphor); text-shadow:var(--glow);
    padding:40px 16px 64px; -webkit-font-smoothing:none;
  }
  .wrap{max-width:80ch; margin:0 auto;}
  .dim{color:var(--phosphor-dim); text-shadow:none;}
  .amber{color:var(--amber); text-shadow:0 0 6px var(--amber);}
  .red{color:var(--red); text-shadow:0 0 6px var(--red);}
  .cyan{color:var(--cyan); text-shadow:0 0 6px var(--cyan);}

  /* boot sequence */
  .boot{color:var(--phosphor-dim); text-shadow:none; font-size:13.5px; margin-bottom:18px;}
  .boot .ok{color:var(--amber); text-shadow:0 0 6px var(--amber);}

  /* banner */
  pre.banner{
    font-family:var(--font-display); color:var(--phosphor);
    text-shadow:var(--glow-strong); font-size:46px; line-height:0.82;
    letter-spacing:1px; margin:0; white-space:pre; text-align:center;
    overflow-x:auto;
  }
  .tagline{
    text-align:center; color:var(--phosphor-dim); text-shadow:none;
    letter-spacing:.18em; margin:8px 0 2px; font-size:13px;
  }
  .crack{
    text-align:center; font-family:var(--font-display); font-size:23px;
    color:var(--amber); text-shadow:0 0 6px var(--amber); letter-spacing:.03em;
    margin-top:12px;
  }
  .crack b{color:var(--red); text-shadow:0 0 6px var(--red);}
  .greetz{text-align:center; color:var(--phosphor-dim); text-shadow:none;
          font-size:12.5px; letter-spacing:.10em; margin-top:4px;}

  /* panels — CSS borders evoke CP437 weights, never glyphs */
  .panel{
    border:3px double var(--phosphor-dim); border-radius:0;
    background:linear-gradient(180deg, rgba(11,42,20,.55), rgba(11,42,20,.20));
    padding:14px 18px 16px; margin:26px 0;
  }
  .panel > h2{
    font-family:var(--font-body); font-weight:600; font-size:13px;
    letter-spacing:.22em; text-transform:uppercase; margin:0 0 12px;
    color:var(--phosphor-white); text-shadow:var(--glow);
  }
  .panel > h2::before{content:"▓ "; color:var(--phosphor-dim);}

  /* key/value rows with leader dots */
  .row{display:flex; align-items:baseline; gap:6px; padding:1.5px 0;}
  .row .k{color:var(--phosphor-dim); text-shadow:none; letter-spacing:.06em; white-space:nowrap;}
  .row .dots{flex:1 1 auto; border-bottom:1px dotted var(--phosphor-dim);
             transform:translateY(-4px); opacity:.5; min-width:8px;}
  .row .v{color:var(--phosphor); white-space:nowrap;}

  /* bar charts */
  .brow{display:flex; align-items:baseline; gap:10px; padding:1px 0; font-size:14px;}
  .brow .bk{width:13ch; color:var(--phosphor-dim); text-shadow:none; text-align:right; white-space:nowrap;}
  .brow .bar{font-family:var(--font-body); color:var(--phosphor); letter-spacing:-0.5px; white-space:pre;}
  .brow .bn{color:var(--amber); text-shadow:0 0 6px var(--amber); margin-left:2px;}
  .brow.dim .bar{color:var(--phosphor-dim); text-shadow:none;}
  .bsep{color:var(--phosphor-dim); text-shadow:none; font-size:11.5px;
        letter-spacing:.04em; margin:10px 0 6px; text-align:center;}

  /* hubs */
  .hubs{display:flex; flex-wrap:wrap; gap:6px 8px;}
  .hub{border:1px solid var(--phosphor-dim); padding:1px 7px; font-size:13px;
       color:var(--phosphor); text-shadow:none;}
  .hub:hover{background:var(--phosphor); color:var(--bg);}

  /* pillars */
  .pillars{display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:4px;}
  .pillar{flex:1 1 0; min-width:120px; text-align:center; border:1px solid var(--phosphor-dim);
          padding:8px 6px;}
  .pillar .pname{font-family:var(--font-display); font-size:22px; color:var(--phosphor-white); text-shadow:var(--glow);}
  .pillar .pdesc{color:var(--phosphor-dim); text-shadow:none; font-size:11.5px; letter-spacing:.04em;}

  footer{margin-top:34px; text-align:center; color:var(--phosphor-dim);
         text-shadow:none; font-size:12.5px; letter-spacing:.06em;}
  footer .blink{animation:blink 1100ms steps(1) infinite; color:var(--phosphor);}
  @keyframes blink{50%{opacity:0}}

  /* CRT overlays */
  body::after{content:""; position:fixed; inset:0; pointer-events:none; z-index:9999;
    background:repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,.26) 2px 3px);
    mix-blend-mode:multiply;}
  body::before{content:""; position:fixed; inset:0; pointer-events:none; z-index:9998;
    background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%);}
  @media (max-width:560px){ pre.banner{font-size:24px;} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="boot">
      ATDT 555-0317 ......... <span class="ok">CONNECT 9600</span><br>
      negotiating PALACE/BBS-7 ... <span class="ok">[OK]</span><br>
      sysop auth bypassed — board mounts direct ... <span class="ok">[OK]</span><br>
      loading node bulletin ...
    </div>

    <pre class="banner">THE PALACE</pre>
    <div class="tagline">═══ a living knowledge organism · system bulletin ═══</div>
    <div class="crack">&gt;&gt; A SYMBIOTIC HUMAN + AI PALACE · MAiNTAiNED BY : <b>tRiCKSTER</b> &lt;&lt;</div>
    <div class="greetz">░▒▓ depth over coverage · relations are primary · contradictions are generative ▓▒░</div>

    <div class="panel">
      <h2>System Info</h2>
%%INFO_ROWS%%
    </div>

    <div class="panel">
      <h2>Entry Types &nbsp;·&nbsp; %%N_TYPES%% type values</h2>
%%TYPES_BLOCK%%
    </div>

    <div class="panel">
      <h2>Development Stages &nbsp;·&nbsp; the lifecycle</h2>
%%STAGE_LINES%%
    </div>

    <div class="panel">
      <h2>Hub Nodes &nbsp;·&nbsp; %%N_HUBS%% high-traffic boards</h2>
      <div class="hubs">%%HUB_ITEMS%%</div>
    </div>

    <div class="panel">
      <h2>The Four Pillars &nbsp;·&nbsp; tag everything</h2>
      <div class="pillars">
        <div class="pillar"><div class="pname">Creation</div><div class="pdesc">the drive to make</div></div>
        <div class="pillar"><div class="pname">Tools</div><div class="pdesc">instruments that extend</div></div>
        <div class="pillar"><div class="pname">Philosophy</div><div class="pdesc">the connective tissue</div></div>
        <div class="pillar"><div class="pname">Practice</div><div class="pdesc">the embodied how</div></div>
      </div>
    </div>

    <footer>
      bulletin generated from the working tree + git at %%GEN%%<br>
      re-run <span class="dim">_ops/stigmergy/about/build-about.py</span> to refresh the numbers<br><br>
      THE PALACE · STIGMERGY node · for the swarm <span class="blink">█</span>
    </footer>
  </div>
</body>
</html>
"""


def main():
    if not os.path.isdir(ROOT):
        sys.exit(f"not a palace root: {ROOT}")
    d = collect()
    open(OUT, "w", encoding="utf-8").write(render(d))
    print(f"wrote {os.path.relpath(OUT, ROOT)}")
    print(f"  entries={d['entries']}  md={d['md']}  links={d['links']}  "
          f"commits={d['commits']}  size={human_bytes(d['total_bytes'])}  "
          f"uptime={d['uptime']}d  hubs={len(d['hubs'])}")


if __name__ == "__main__":
    main()
