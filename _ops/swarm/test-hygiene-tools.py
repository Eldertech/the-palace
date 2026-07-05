#!/usr/bin/env python3
"""Sandbox test for the palace hygiene tools (lint-ghost-links, lint-bundle-hygiene,
face-audit). Builds a fixture palace with known defects and clean controls, runs each
tool, and asserts exact findings (catches the bad, spares the good).

Run:  python3 _ops/swarm/test-hygiene-tools.py"""
import os, shutil, subprocess, sys, tempfile

SWARM = os.path.dirname(os.path.abspath(__file__))  # this file lives in _ops/swarm/
ROOT = tempfile.mkdtemp(prefix="palace-sandbox-")

def w(rel, content):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(content)

def fm(**kw):
    lines = ["---"]
    for k, v in kw.items():
        if k == "links":
            lines.append("links:")
            for t in v:
                lines.append(f'  - target: "[[{t}]]"')
                lines.append(f'    type: connects-to')
        else:
            lines.append(f"{k}: {v}")
    lines.append("---\n")
    return "\n".join(lines)

# --- ghost + control: Alpha has 1 dead link, 1 dead embed; 1 live link, 1 live embed ---
w("Alpha.md", fm(title="Alpha", type="concept", pillars="[philosophy]", born="2026-07",
                 stage="growing", links=["Beta"]) +
  "# Alpha\n\nAlpha connects to [[Beta]] and points at [[Ghost Target]].\n"
  "Here is a real image ![[real.png]] and a dead one ![[missing.png]].\n"
  "A fenced example must be ignored:\n```\n[[Not A Real Ghost]]\n```\n"
  "And inline `[[Also Ignored]]` too.\n")
w("real.png", "PNGDATA")

# --- Beta: qualifies for a face via >=5 links, no bundle -> definite ADD; also a live target
w("Beta.md", fm(title="Beta", type="concept", pillars="[tools]", born="2026-07",
                stage="growing", links=["Alpha", "Gamma", "Delta", "Foo", "Seed", "Clean"]) +
  "# Beta\n\nA well-connected concept with no face yet.\n")

# --- Gamma: invalid type -> bundle-hygiene E1 error
w("Gamma.md", fm(title="Gamma", type="proof", pillars="[practice]", born="2026-07",
                 stage="growing") + "# Gamma\n\nWorking substrate wearing a bad type.\n")

# --- Delta: spore holding a face -> face RETIRE; never-type
w("Delta.md", fm(title="Delta", type="spore", pillars="[creation]", born="2026-07",
                 stage="dormant", revival_conditions="someday") + "# Delta\n")
w("Delta/Delta — hero.png", "PNG")
w("Delta/Delta — icon.png", "PNG")

# --- Foo bundle: Foo.md (seed, never-face) + nested canon Bar.md inside -> bundle W1
w("Foo.md", fm(title="Foo", type="concept", pillars="[practice]", born="2026-07", stage="seed")
  + "# Foo\n")
w("Foo/Bar.md", fm(title="Bar", type="concept", pillars="[tools]", born="2026-07", stage="seed")
  + "# Bar\n\nNested canon inside a bundle - a demotion candidate to judge.\n")
w("Foo/Foo — sketch.md", '---\ntitle: "Foo — sketch"\nborn: 2026-07-05\n---\n\nA bundle file, no type - must be spared.\n')

# --- Projects/: organizational folder (no Projects.md twin). project entry -> definite ADD, NOT bundle-flagged
w("Projects/Proj.md", fm(title="Proj", type="project", pillars="[creation]", born="2026-07",
                         stage="active", status="active", links=["Beta"]) + "# Proj\n")

# --- Seed: seed concept -> face NEVER (absent from all lists), no ghosts
w("Seed.md", fm(title="Seed", type="concept", pillars="[tools]", born="2026-07", stage="seed")
  + "# Seed\n")

# --- Sprout: sprout concept WITH a face -> must NOT be retired (thinness never strips a face)
w("Sprout.md", fm(title="Sprout", type="concept", pillars="[tools]", born="2026-07",
                  stage="sprout") + "# Sprout\n")
w("Sprout/Sprout — hero.png", "PNG")
w("Sprout/Sprout — icon.png", "PNG")

# --- Clean: growing concept WITH a face -> absent from face lists, no other flags
w("Clean.md", fm(title="Clean", type="concept", pillars="[philosophy]", born="2026-07",
                 stage="growing") + "# Clean\n")
w("Clean/Clean — hero.png", "PNG")
w("Clean/Clean — icon.png", "PNG")

# --- LinkScope: growing concept; 5 `- target:` under a NON-links field must NOT count as links
w("LinkScope.md", '---\ntitle: LinkScope\ntype: concept\npillars: [tools]\nborn: 2026-07\n'
  'stage: growing\nrelated:\n  - target: a\n  - target: b\n  - target: c\n  - target: d\n'
  '  - target: e\nlinks: []\n---\n# LinkScope\n')

# --- PhilFalse: dormant concept, pillars [tools], a link LABEL mentioning philosophy -> never (not grey)
w("PhilFalse.md", '---\ntitle: PhilFalse\ntype: concept\npillars: [tools]\nborn: 2026-07\n'
  'stage: dormant\nlinks:\n  - target: "[[X]]"\n    type: connects-to\n'
  '    label: philosophy-of-science\n---\n# PhilFalse\n')

def run(tool):
    r = subprocess.run([sys.executable, os.path.join(SWARM, tool), ROOT],
                       capture_output=True, text=True)
    return r.stdout, r.returncode

fails = []
def check(name, cond, detail=""):
    print(("  PASS" if cond else "  FAIL"), name, detail)
    if not cond:
        fails.append(name)

print("== ghost-link linter ==")
out, rc = run("lint-ghost-links.py")
check("exit 0 (flag-only)", rc == 0)
check("2 ghosts total", "0 errors, 2 warnings" in out, f"\n{out}" if "2 warnings" not in out else "")
check("flags [[Ghost Target]]", "Ghost Target" in out)
check("flags dead embed missing.png", "missing.png" in out)
check("spares live link [[Beta]]", "[[Beta]]" not in out)
check("spares live embed real.png", "real.png" not in out)
check("ignores fenced example", "Not A Real Ghost" not in out)
check("ignores inline code", "Also Ignored" not in out)

print("== bundle-hygiene linter ==")
out, rc = run("lint-bundle-hygiene.py")
check("exit 1 (invalid type gates)", rc == 1)
check("1 error 1 warning", "1 errors, 1 warnings" in out, f"\n{out}" if "1 errors, 1 warnings" not in out else "")
check("E1 on Gamma invalid type", "Gamma.md" in out and "proof" in out)
check("W1 on nested Bar.md", "Bar.md" in out and "Foo" in out)
check("spares bundle file Foo — sketch", "sketch" not in out)
check("spares organizational Projects/Proj", "Proj.md" not in out)
check("spares clean Delta.md (twin, not nested)", "Delta.md" not in out)

print("== face audit ==")
out, rc = run("face-audit.py")
definite_sec = out.split("ADD - grey")[0]
grey_sec = out.split("ADD - grey")[1].split("RETIRE")[0]
retire_sec = out.split("RETIRE")[1]
check("exit 0 (audit)", rc == 0)
check("2 definite / 2 grey / 1 retire", "2 definite adds, 2 grey adds, 1 retires" in out,
      f"\n{out}" if "2 definite adds, 2 grey adds, 1 retires" not in out else "")
check("definite: Beta (>=5 links)", "Beta.md" in definite_sec)
check("definite: Proj (project)", "Proj.md" in definite_sec)
check("grey: Alpha (growing concept)", "Alpha.md" in grey_sec)
check("retire: Delta (spore w/ face)", "Delta.md" in retire_sec)
check("does NOT retire faced sprout", "Sprout.md" not in retire_sec)
check("link_count ignores non-links `- target:`", "LinkScope.md" not in definite_sec)
check("LinkScope is grey (real link_count 0)", "LinkScope.md" in grey_sec)
check("philosophy LABEL is not a pillar (PhilFalse never)", "PhilFalse.md" not in out)
check("spares Clean (faced)", "Clean.md" not in out)
check("spares Seed (never)", "Seed.md" not in out)

print()
if fails:
    print(f"FAILED: {len(fails)} -> {fails}")
    print(f"(fixture left at {ROOT} for inspection)")
    sys.exit(1)
print("ALL PASS")
shutil.rmtree(ROOT)
