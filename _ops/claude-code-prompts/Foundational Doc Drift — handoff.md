---
title: "Foundational Doc Drift — handoff"
born: 2026-06-09
genre: cross-surface paste-prompt
from: Cowork (foundational doc-drift assessment session)
to: Claude Code (Mac, palace root — full filesystem + normal git)
receiving_surface: "Claude Code on the Mac: delete + normal `git commit` (the Cowork lock-safe committer does NOT apply); no sandbox build limits"
forward_vector: "I carry the foundational-doc drift remediation across the Cowork→Claude Code boundary — install the linter, apply the canon edits, verify the loop closes — waiting to be picked up and archived once the work lands."
links:
  - target: "[[Handoff Ceremony]]"
    type: connects-to
    label: "produced-by"
  - target: "[[SCHEMA]]"
    type: connects-to
    label: "governs-the-edits"
session_thread: "Cowork drift-assessment session, 2026-06-09"
status: ready
---

# Foundational Doc Drift — Handoff

A Cowork session audited the palace's foundational layer (Tier 0–2 floor + all ceremony
specs + ops/standards machinery) for **doc drift** — places where one doc references a
rule, path, or structure that another doc (or reality) doesn't match. The seed was the
[[Deposit Ceremony]] not being bundle-aware while [[SCHEMA]] §8 pins bundle-routing to it.
The audit found ~30 instances tracing to six recurring mechanisms.

This handoff is **self-contained and executable**. It carries the full findings, the exact
edits, and the complete linter source. You are Mac-side Claude Code, so you have delete +
normal `git commit` (the Cowork lock-safe committer does NOT apply to you).

**Companion file:** `/Users/loudonstearns/Library/.../outputs/palace-foundational-doc-drift-assessment.md`
holds the original ranked report with rationale. It is a scratch artifact and may be gone;
everything needed is reproduced below.

---

## The six drift mechanisms

- **A — Unmanaged mirrors.** SCHEMA §5's Schema-Ceremony checklist only obligates updates to
  SCHEMA, CLAUDE, ROSETTA, Substrate Skill. README, SUBSTRATE, and Palace Ceremonies are
  also vocab copies but sit in no sync rule — so every schema change since v1.6 left them stale.
- **B — Copied facts.** Version numbers, token counts, type lists, typeface lists, commit
  procedure copied inline into many docs; each copy drifts. (This is the bundle-gap mechanism.)
- **C — Dangling pins.** A doc pins a rule to an upstream §section the upstream doesn't contain.
- **D — Path/case drift**, masked by the case-insensitive filesystem.
- **E — Stale snapshots** & completed-work-described-as-pending.
- **F — Trigger gaps** between CLAUDE.md's "complete" trigger table and the ceremony specs.

---

## Order of operations

1. **Install + run the linter** (Part 1). Get a baseline. It exits 1 with 3 errors today.
2. **Mechanism fixes** (Part 2) — these stop recurrence: SCHEMA §5 checklist, the wrong-case
   refs, the README/SUBSTRATE backfills.
3. **Per-file edits** (Part 3) — work file-by-file; each file's full edit list is grouped.
4. **Re-run the linter** (Part 4). The 3 errors should clear; the W1 bundle pin should clear
   once the Deposit fix lands.
5. **Commit** (Part 5). Use a Schema Ceremony commit for the SCHEMA/vocab changes.

Read each target file before editing — confirm line numbers, they will have shifted.

---

## Part 1 — Install the doc-drift linter

New non-canon tooling. Place it beside the existing `lint-link-directions.py`:
`_ops/swarm/lint-doc-drift.py`. Deterministic, no API calls, stdlib only.

```bash
# from palace root
cat > "_ops/swarm/lint-doc-drift.py" << 'LINTER_EOF'
#!/usr/bin/env python3
"""
Doc-Drift Linter - the Weave's checkable postcondition for foundational-doc consistency.

Companion to lint-link-directions.py. Where that linter checks the *graph* (typed-link
directionality), this one checks the *prose*: the recurring ways foundational docs drift
out of sync with each other and with the filesystem. Mechanical, deterministic, no API
calls, reads markdown directly. Exit code 0 = clean (no errors), 1 = errors found.

The six drift mechanisms (see Palace Foundational Doc Drift Assessment, 2026-06-09):
  A  unmanaged mirrors        D  path/case drift (case-insensitive-FS masked)
  B  copied facts             E  stale snapshots
  C  dangling pins            F  trigger gaps

Checks implemented:
  ERRORS (high confidence - fail the build):
  E1  Case-colliding files  - two DISTINCT real files (different inodes) differing only by
                              case. On a case-insensitive volume two spellings of ONE file
                              share an inode and are NOT a collision - those are filtered out.
  E3  Wrong-case reference   - a referenced filename whose case doesn't match the real file
                              (a case-insensitive match exists). The FS resolves it; the
                              reference still misleads agents about the canonical name.

  WARNINGS (lower confidence - review, don't necessarily block):
  W0  Broken path reference - a backtick-quoted CONCRETE path (no placeholder / command /
                              glob markers) resolving to neither a file nor a directory.
  W1  Dangling section pin  - a "[[Doc]] section" reference whose target file has no heading
                              matching those words.
  W2  Trigger coverage gap  - a **Trigger:** phrase in a ceremony spec not present in
                              CLAUDE.md's trigger table. Bracketed slots are stripped before
                              comparison ("revive [entry]" -> "revive").

Usage: python3 _ops/swarm/lint-doc-drift.py [palace-root]
       (defaults to the palace root two levels above this script)
"""
from __future__ import annotations
import os, re, sys
from collections import defaultdict

# Skipped when INDEXING the filesystem (these hold no referenceable palace artifacts).
# Note: Archive/ is intentionally NOT skipped here - docs legitimately reference archived
# files, so they must be in the index. Archive/working docs are excluded from the SCAN set
# instead (see TRANSIENT_MARKERS / foundational_scan_set).
SKIP_DIRS = {".git", ".obsidian", ".claude", "node_modules", ".venvs", "_tools",
             "venv", "__pycache__"}
REF_EXTS = (".md", ".py", ".jsonl", ".json", ".css", ".js", ".jsx", ".html",
            ".svg", ".tex", ".mjs", ".sh", ".yaml", ".yml")
# Markers that mean a backtick token is a template/command/glob, not a concrete path.
PLACEHOLDER_CHARS = set("[]<>{}|*")
PLACEHOLDER_STRS = ("...", "…", "  ")
COMMAND_WORDS = ("grep", "ls ", "cd ", "rm ", "mv ", "cp ", "node ", "python", "git ",
                 "cat ", "echo ", "find ", "ls-", "--", "<date>", "YYYY")
PLACEHOLDER_STEMS = {"foo", "entry", "entryname", "theme", "ceremony name", "slug",
                     "any-entry", "entry name", "x"}

PALACE_DEFAULT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))


def walk(root):
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            ap = os.path.join(dp, fn)
            yield ap, os.path.relpath(ap, root), False  # file
        yield dp, os.path.relpath(dp, root), True        # dir


def build_index(root):
    files = set(); dirs = set()
    lower_file = defaultdict(list)        # lower(relpath) -> [(relpath, inode), ...]
    basenames_lower = defaultdict(list)   # lower(basename) -> [relpath, ...]
    for ap, rp, is_dir in walk(root):
        if is_dir:
            dirs.add(rp.rstrip("/") + "/")
            continue
        files.add(rp)
        try:
            ino = os.stat(ap).st_ino
        except OSError:
            ino = -1
        lower_file[rp.lower()].append((rp, ino))
        basenames_lower[os.path.basename(rp).lower()].append(rp)
    return files, dirs, lower_file, basenames_lower


def check_case_collisions(lower_file):
    """E1 - distinct inodes that differ only by case (genuine collision, not one file)."""
    out = []
    for lp, entries in sorted(lower_file.items()):
        inodes = {ino for _, ino in entries if ino >= 0}
        names = sorted({rp for rp, _ in entries})
        if len(names) > 1 and len(inodes) > 1:
            out.append("E1  case-colliding distinct files (edit to one diverges from the other): "
                       + "  vs  ".join(names))
    return out


PATH_RE = re.compile(r"`([^`\n]+?)`")


def is_concrete_path(tok):
    t = tok.strip()
    if not t or t.startswith(("http", "[[", "$", "//", "@", ".", "/")):
        return False          # leading "." kills bare-extension fragments (`.md`, `.svg`)
    if "://" in t:
        return False          # protocol URIs (obsidian://, file://, computer:///)
    if any(c in PLACEHOLDER_CHARS for c in t):
        return False
    if any(s in t for s in PLACEHOLDER_STRS):
        return False
    low = t.lower()
    if any(w in low for w in COMMAND_WORDS):
        return False
    stem = os.path.splitext(os.path.basename(t.rstrip("/")))[0].lower()
    if stem in PLACEHOLDER_STEMS:
        return False
    # placeholder example words appearing anywhere in the token (README's `Foo - handoff.md`,
    # SCHEMA's `Foo - source - borges.md`)
    if re.search(r"\b(foo|borges|entryname|nnn|yyyy|slug)\b", low):
        return False
    # must be a dir-ish path or a real-extension file
    return t.endswith("/") or ("/" in t and low.endswith(REF_EXTS)) or low.endswith(REF_EXTS)


def check_path_refs(root, files, dirs, basenames_lower, scan):
    """E3 wrong-case (ERROR) + W0 broken concrete path (WARN). Resolves refs both
    palace-root-relative AND relative to the citing doc's own directory."""
    errs, warns = [], []
    for rp in scan:
        docdir = os.path.dirname(rp)
        try:
            text = open(os.path.join(root, rp), encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for m in PATH_RE.finditer(text):
            raw = m.group(1)
            if not is_concrete_path(raw):
                continue
            ref = raw.strip().lstrip("./")
            # candidate resolutions: as-given (root-relative) and doc-relative
            cands = {ref}
            if docdir:
                cands.add(os.path.normpath(os.path.join(docdir, ref)))
            if ref.endswith("/"):
                norm = {c.rstrip("/") + "/" for c in cands}
                if norm & dirs:
                    continue
                ci = [d for d in dirs if d.lower() in {c.lower() for c in norm}]
                if ci:
                    errs.append(f"E3  wrong-case dir ref in {rp}:  `{raw}`  ->  {ci[0]}")
                else:
                    warns.append(f"W0  broken dir ref in {rp}:  `{raw}`  (no such directory)")
                continue
            if cands & files:
                continue
            base = os.path.basename(ref)
            ci_base = basenames_lower.get(base.lower(), [])
            if ci_base:
                if not any(os.path.basename(r) == base for r in ci_base):
                    errs.append(f"E3  wrong-case ref in {rp}:  `{raw}`  ->  real file is  {ci_base[0]}")
            else:
                rel_ci = [r for r in files if r.lower() in {c.lower() for c in cands}]
                if rel_ci:
                    errs.append(f"E3  wrong-case ref in {rp}:  `{raw}`  ->  real file is  {rel_ci[0]}")
                else:
                    warns.append(f"W0  broken path ref in {rp}:  `{raw}`  (no such file)")
    return errs, warns


HEADING_RE = re.compile(r"^#{1,6}\s+(.*\S)\s*$", re.M)
PIN_RE = re.compile(r"\[\[([^\]]+?)\]\]\s*§\s*([A-Za-z0-9][^.,;:\n)]{2,40})")


def resolve_wikilink(name, basenames_lower):
    name = name.split("|")[0].split("#")[0].strip()
    return basenames_lower.get((name + ".md").lower(), [])


def check_section_pins(root, basenames_lower, scan):
    warns = []
    cache = {}
    for rp in scan:
        try:
            text = open(os.path.join(root, rp), encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for m in PIN_RE.finditer(text):
            doc, section = m.group(1), m.group(2).strip()
            targets = resolve_wikilink(doc, basenames_lower)
            if not targets:
                continue
            tgt = os.path.join(root, targets[0])
            if tgt not in cache:
                try:
                    ttext = open(tgt, encoding="utf-8", errors="ignore").read()
                except OSError:
                    ttext = ""
                cache[tgt] = [h.lower() for h in HEADING_RE.findall(ttext)]
            words = [w for w in re.findall(r"[A-Za-z]+", section.lower()) if len(w) > 2]
            if not words:
                continue
            if not any(any(w in h for w in words) for h in cache[tgt]):
                warns.append(f"W1  dangling section pin in {rp}:  [[{doc}]] §{section}  "
                             f"(no matching heading in {targets[0]})")
    return warns


def strip_slots(phrase):
    """'revive [entry name]' -> 'revive' ; collapse whitespace."""
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", phrase)).strip()


def check_trigger_coverage(root, basenames_lower):
    warns = []
    claude = basenames_lower.get("claude.md", [])
    if not claude:
        return warns
    ctext = open(os.path.join(root, claude[0]), encoding="utf-8", errors="ignore").read()
    m = re.search(r"Ceremony Triggers(.+?)(?:\n##\s|\Z)", ctext, re.S)
    table = m.group(1) if m else ctext
    claude_triggers = {strip_slots(q.lower()) for q in re.findall(r'"([^"]+)"', table)}
    claude_triggers |= {strip_slots(q.lower()) for q in re.findall(r"[“”]([^“”]+)[“”]", table)}
    claude_triggers.discard("")

    for ap, rp, is_dir in walk(root):
        if is_dir or not rp.lower().endswith(".md"):
            continue
        if "ceremony" not in os.path.basename(rp).lower():
            continue
        try:
            text = open(ap, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        for tm in re.finditer(r"\*\*Trigger:?\*\*\s*(.+)", text):
            for a, b in re.findall(r'"([^"]+)"|[“”]([^“”]+)[“”]', tm.group(1)):
                phrase = strip_slots((a or b).lower())
                if not phrase:
                    continue
                if not any(phrase in ct or ct in phrase for ct in claude_triggers):
                    warns.append(f"W2  trigger not in CLAUDE.md table:  \"{phrase}\"  (defined in {rp})")
    return warns


# Transient/working docs are EXPECTED to reference moved/archived/example paths; excluding
# them from path checks keeps the signal on the canonical spec layer. (Case checks still
# run everywhere via E3 since a wrong-case canonical name is wrong wherever it appears.)
TRANSIENT_MARKERS = ("handoff", "audit", "to-do", "graffiti", "archive", "log",
                     "migration", "working doc", "staging", "assessment", "proposal",
                     "deposit archive", "map ")


def is_transient(rp):
    low = os.path.basename(rp).lower()
    return any(mk in low for mk in TRANSIENT_MARKERS)


def foundational_scan_set(files, include_transient=False):
    out = []
    for rp in files:
        if not rp.lower().endswith(".md"):
            continue
        parts = rp.split(os.sep)
        is_floor = len(parts) == 1
        is_ops = parts[0] == "_ops" and (len(parts) == 2 or "design-system" in rp)
        if not (is_floor or is_ops):
            continue
        if not include_transient and is_transient(rp):
            continue
        out.append(rp)
    return out


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else PALACE_DEFAULT)
    if not os.path.isdir(root):
        sys.exit(f"not a directory: {root}")

    files, dirs, lower_file, basenames_lower = build_index(root)
    scan = foundational_scan_set(files)

    errors, warns = [], []
    errors += check_case_collisions(lower_file)
    e, w = check_path_refs(root, files, dirs, basenames_lower, scan)
    errors += e; warns += w
    warns += check_section_pins(root, basenames_lower, scan)
    warns += check_trigger_coverage(root, basenames_lower)

    errors = sorted(set(errors)); warns = sorted(set(warns))

    print(f"doc-drift lint - root: {root}")
    print(f"  scanned {len(scan)} foundational docs, indexed {len(files)} files, {len(dirs)} dirs\n")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for x in errors:
            print("  " + x)
        print()
    if warns:
        print(f"WARNINGS ({len(warns)}):")
        for x in warns:
            print("  " + x)
        print()
    if not errors and not warns:
        print("clean - no drift detected.")
    print(f"summary: {len(errors)} errors, {len(warns)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
LINTER_EOF
chmod +x "_ops/swarm/lint-doc-drift.py"
python3 "_ops/swarm/lint-doc-drift.py" .
```

**Expected baseline before any fixes:** `3 errors, ~34 warnings`, exit 1. The 3 errors are the
wrong-case refs (Part 3, CLAUDE.md + Self-Model Update). The standout warning is
`W1 dangling section pin in SCHEMA.md: [[Deposit Ceremony]] §Filing structure` — the linter
independently rediscovers the seed finding. After the Deposit fix (Part 3) that W1 clears.

> **Note on the embedded heredoc:** it is single-quoted (`'LINTER_EOF'`), so the shell does no
> interpolation and the body is written verbatim. The script body contains a few literal UTF-8
> glyphs (section sign §, em-dash —, curly quotes) inside comments/strings; in a UTF-8 terminal
> they transfer fine. After writing, run `python3 -c "import ast; ast.parse(open('_ops/swarm/lint-doc-drift.py').read())"`
> to confirm it parses before trusting the run.

### Wire it into the Weave (after install)
The Weave already owns "fixing mis-located and mis-linked items." Add to the Weave Ceremony's
postcondition / completion signal a line: *"`_ops/swarm/lint-doc-drift.py` exits 0 on errors
(warnings reviewed)."* This makes doc-consistency a checkable postcondition, the same way
`lint-link-directions.py` checks link directionality.

---

## Part 2 — Mechanism fixes (do these first; they stop recurrence)

### 2.1 SCHEMA §5 — fold the orphaned mirrors into the Schema-Ceremony checklist
This is the single highest-leverage fix (mechanism A). Current steps name only SCHEMA, CLAUDE,
ROSETTA, Substrate Skill. Apply:

```diff
 1. Propose the change with documented rationale
 2. Review against existing entries: does this break or orphan anything?
 3. Update SCHEMA.md
 4. Update CLAUDE.md version field (increment MAJOR if breaking change, MINOR if additive)
-5. Update ROSETTA if affected
-6. Update `_ops/Substrate Skill.md` if affected
-7. Git commit with message: `Schema Ceremony — [what changed] — v[new version]`
+5. Propagate to the secondary mirrors — every file that restates the changed vocabulary
+   inline must be updated in the same ceremony, or it becomes a stale spec. The mirror set:
+   ROSETTA (type/link/ceremony cards), `README - The Palace Guide` (entry-type + link-ontology
+   + stage tables), SUBSTRATE (architecture + type list), `_ops/Substrate Skill.md`, and — for
+   ceremony add/remove only — `_ops/Palace Ceremonies` and CLAUDE.md's trigger table. Update
+   each the change touches; if none, say so explicitly.
+6. Git commit with message: `Schema Ceremony — [what changed] — v[new version]`
```
And the postcondition:
```diff
-**Postcondition:** SCHEMA.md, CLAUDE.md, ROSETTA.md, and `_ops/Substrate Skill.md` are internally consistent. Git commit made with Schema Ceremony message.
+**Postcondition:** SCHEMA.md, CLAUDE.md, ROSETTA.md, README, SUBSTRATE, `_ops/Substrate Skill.md`,
+and (for ceremony changes) `_ops/Palace Ceremonies` are internally consistent — verified by
+`_ops/swarm/lint-doc-drift.py` exiting clean on errors. Git commit made with Schema Ceremony message.
```

### 2.2 Adopt "cite, don't copy" + tag the kept mirrors
For each canonical fact-class, one owning file; everywhere else links instead of restating.
Where an inline list is kept for readability, tag it `<!-- mirror of SCHEMA §1 — keep in sync -->`
so the linter can later diff it.

| Fact class | Single source of truth |
|---|---|
| Entry-type vocabulary | SCHEMA §1 |
| Link ontology | SCHEMA §4 |
| Stage vocabulary | SCHEMA §2 |
| Schema version number | SCHEMA history (never write "v1.x" inline elsewhere) |
| Ceremony trigger map | CLAUDE.md trigger table |
| Filing / artifact routing | one Filing Protocol block (SCHEMA §8 + Deposit §Filing) |
| Commit mechanism (Cowork vs Mac) | CLAUDE.md §Committing from Cowork |
| Design grammar (typefaces, skins) | loudon-live design-system SKILL/CSS |

---

## Part 3 — Per-file edits (grouped for file-by-file execution)

Severity: **[H]** high (misleads an agent) · **[M]** medium · **[L]** low. Read each file first;
line numbers will have shifted.

### CLAUDE.md
- **[H]** Key Vocabulary: `specialist`/`maker` cited as **"v1.3 Schema Ceremony (2026-05-09)"** →
  change to **v1.6** (SCHEMA §3.2 is authoritative; no v1.3 exists). Same fix in ROSETTA.
- **[H]** Artifact Aesthetic — Default: typeface grammar lists 4 (Anton, Cormorant, Manrope,
  JetBrains Mono). Design system defines **5** — add **Silkscreen** (register/pixel face).
- **[M]** "Where to Find Depth": `(Substrate.md)` → `(SUBSTRATE.md)`; `(Four Pillars.md)` →
  `(FOUR PILLARS.md)`. *(These two are linter E3 errors.)*
- **[M]** Directory Structure block: `_ops/` skeleton omits real machinery. Add the live
  top-level subdirs: `cowork-git/`, `stigmergy/`, `heartbeat/`, `agents/`, `swarm/`,
  `loudon-live/`, `maps/`, `sample-libraries/`, `scratch/`. Note that `Enrichment.md` lives in
  the **root** (with its bundle), unlike other ceremony specs in `_ops/`.
- **[M]** Token claim "≈19K tokens": reconcile with JEWEL (which says ≈16K). Pick one measured
  figure, put it in both. *(Estimate during audit suggested ~26K actual; verify with a real
  tokenizer before committing a number.)*
- **[L/F]** Trigger table (self-described "complete"): add **"time to revive [entry]"** (Revival
  spec defines it); add a row or note for the **Ceremony Reader** (triggers live only in Palace
  Ceremonies); confirm bare word **"handoff"** is present.

### SCHEMA.md
- **[H]** §5 checklist + postcondition — apply **Part 2.1** above.
- **[H]** §6 "Operational Card + Context Split": rule says **"Both files live flat in the palace
  root"** — WRONG. Verified: ceremony Context files live in **`_ops/`** (e.g.
  `_ops/Deposit Ceremony — Context.md`). Change to "both files live flat in `_ops/`." *(Note: the
  separate SCHEMA §8 migration note about ENTRY context files like `Jewel — Context.md` living in
  the root is accurate — don't touch that one.)*
- **[M]** §6 "Currently split" lists Deposit, Harvest, Weave — add **Handoff**
  (`_ops/Handoff Ceremony — Context.md` exists).
- **[L]** §5 steps: add updating **`_ops/Palace Ceremonies`** when a ceremony is added/removed.

### ROSETTA.md
- **[H]** "v1.3" → **"v1.6"** (matches CLAUDE.md fix).
- **[M]** §5 Schema-Ceremony row: protocol + postcondition omit **`_ops/Substrate Skill.md`** —
  add it (and README/SUBSTRATE per 2.1).
- **[M]** §5 ceremony reference card lists 8 ceremonies — add **Handoff**, **Map Build**,
  **Enrichment** rows (or a footer pointing to CLAUDE.md's table for informal ones).
- **[M]** §5 Self-Model Update row: `Substrate.md` → `SUBSTRATE.md` (both occurrences).

### README - The Palace Guide.md  (the most-stale mirror — mechanism A)
- **[H]** Link ontology table lists 8 types — add **`exemplifies`** and **`member-of`** (added v1.8;
  match SCHEMA §4 wording).
- **[H]** Entry-types table lists 8 — add **`practice`**, **`person`**, **`specialist`**, **`maker`**.
- **[L]** `deepens` row carries pre-v1.9 ambiguous wording → use SCHEMA §4 v1.9 text: *"A is a more
  developed articulation of B (the source elaborates; the target is the ground)."*
- **[L]** `emerged-from` row: remove **"(specific to projects)"** (now used on concepts).
- **[L]** Development Stages: add a note that **`foundational`** is a reserved stage for palace
  meta-entries (README's own frontmatter uses it).

### SUBSTRATE.md
- **[H]** §Architecture root-folder type list missing **`practice`, `person`, `specialist`, `maker`**
  — add them.
- **[M]** §Architecture folder snapshot dated 2026-03-25 and stale (missing Shop/, People/,
  Projects/, Enrichment/, bundles). Either regenerate, or replace with: *"current folder listing:
  run `ls` on the palace root; canonical folder spec is [[CLAUDE.md]] §Directory Structure."*
- **[M]** §Token Economy split threshold says "~10KB, consider splitting" — reconcile with SCHEMA
  §6's "~8KB, split." Defer to SCHEMA: change to ~8KB imperative.

### JEWEL.md
- **[H]** Token figure (≈16K) — reconcile with CLAUDE.md (see above).
- **[H]** Tier table places **ROSETTA** in Tier 1 (implying auto-load) but it has no `@import` line
  and never loads. Either add `See @ROSETTA.md` to CLAUDE.md's @import block, or move ROSETTA to
  Tier 3 in JEWEL's table. (Pick one; they must agree.)
- **[M/E]** Forward Vectors lists "Build the tiered loading into CLAUDE.md" as open — it shipped
  2026-06-07 via the `_`-symlinks. Strike it. Update the inline comment near it accordingly.

### _ops/Substrate Skill.md
- **[H]** §Ceremony File Conventions: same "live flat in the palace root" error as SCHEMA §6 →
  change to `_ops/`.
- **[M]** "Currently split" lists only Deposit → expand to Deposit, Harvest, Weave, Handoff.

### _ops/Self-Model Update Ceremony.md
- **[H]** Replace every prose `Substrate.md` with **`SUBSTRATE.md`** (many occurrences; linter E3).
  Confirm wikilinks read `[[SUBSTRATE]]`.

### _ops/Deposit Ceremony.md  (the seed — clears the linter W1 pin)
- **[H]** Step 6 "Plant" / Filing structure: add the bundle fork. After the existing
  `Artifacts/[Theme]/` line, add: *"If an artifact is owned by exactly one entry, route it to that
  entry's bundle (`[Entry]/`) per [[SCHEMA]] §8; only cross-entry artifacts go to
  `Artifacts/[Theme]/`."* This makes the ceremony match what SCHEMA §8 already pins to it.
- **[M]** Step 4 deposit-map "Entry type" bullet lists 6 types → list all 12 (SCHEMA §1) or replace
  with "see SCHEMA §1 for the current type vocabulary."
- **[M]** Step 7b commit step: add the Cowork/Mac conditional (see ceremony-wide fix below).

### Ceremony-wide — commit mechanism (mechanism A/B)
Every ceremony with a commit step (Deposit, Harvest, Weave, Walk, Spore Check, Revival,
Self-Model Update, + SCHEMA §5) says bare `git commit` with no Cowork/Mac distinction, while
CLAUDE.md mandates the lock-safe committer from Cowork. **[H]** Add a one-line conditional to each
(or a shared callout in Palace Ceremonies that they cite): *"From Cowork: use
`_ops/cowork-git/commit.mjs`. From Mac-side Claude Code: normal `git commit`."*

### _ops/Revival Ceremony.md
- **[M]** §The Closed Loop lifecycle diagram draws `composting` as one-way → deletion, but the
  Ceremony Contract precondition allows reviving a `composting` entry. Reconcile: add a Revival
  arrow back from composting, OR drop `stage: composting` from the precondition. (Cross-check Spore
  Check + Weave composting-confirmation logic.)
- **[M/F]** Register the **"time to revive [entry]"** trigger in CLAUDE.md + Palace Ceremonies, or
  remove it from the contract if vestigial.

### _ops/Handoff Ceremony.md
- **[M/F]** Ceremony Contract has **no `**Trigger:**` line** — add
  `**Trigger:** "handoff" / "hand this off" / "draft a handoff"`. Add bare **"handoff"** to Palace
  Ceremonies' trigger column.
- *(Note: this ceremony is the positive example for bundles — it already writes to
  `[Entry]/[Entry] — handoff.md` correctly. Don't "fix" its bundle handling.)*

### _ops/Weave Ceremony.md
- **[L]** Sub-steps run 3a → 3c → 3b. Renumber to 3a → 3b → 3c.
- **[L]** §6.5 uses `python3 _ops/swarm/build-map-<date>.py` — no canonical `build-map.py` exists;
  only date-stamped versions. Either add a stable `build-map.py` wrapper/symlink to the newest, or
  change the step to "run the most recent `build-map-YYYY-MM-DD.py`."
- **[L]** Add a one-line routing note: session-level artifacts → `_ops/swarm/sessions/`; per-entry
  artifacts → the entry's bundle (per SCHEMA §8).

### _ops/Palace Ceremonies.md
- **[L/F]** Add bare **"handoff"** trigger; reconcile the trigger set with CLAUDE.md's table; this
  file should be in the Schema-Ceremony update set (2.1).

### Design system layer
- **[H]** `_ops/loudon-live/design-system/SKILL.md`: skin names `skin-teal-patch | skin-dusk-tape |
  skin-bone-synth` are deprecated aliases → canonical
  `skin-graphite | skin-amber-lab | skin-crt | skin-strobe | skin-cobalt-grid | skin-drafting`.
- **[H]** `Palace development/BBS Design System.md`: §Borders still specifies CP437 box-drawing
  chars (`╔═╗ ║ ╚═╝` / `┌─┐ │ └─┘`). Locked rule is **CSS borders only** (evoking CP437 weights) —
  match the stigmergy SKILL.
- **[H]** Remove `LoginScreen` as an active component from all three: `BBS Design System.md`,
  `_ops/stigmergy/design-system/SKILL.md`, and the ui_kit `blackboard/README.md`. The board mounts
  directly; login was removed and must not be reinstated.
- **[L]** `_ops/stigmergy/design-system/SKILL.md` frontmatter: drop "codename Stigmergy" framing —
  STIGMERGY is the canonical product name now.

### Standards layer
- **[M]** `_ops/Technical Diagram Standard.md`: §Discoverability lists 4 "future" hooks all already
  done → convert to past/confirmed. §Open Questions example-file location already answered (they live
  in the standard's bundle) → mark resolved. §Filing protocol vs practice: note that standard-owned
  teaching examples live in the standard's bundle while entry diagrams go to `Artifacts/[Theme]/`.
  §Toolchain "available in every palace Claude environment" is false in the Cowork sandbox (no TeX
  Live) → add "Mac-side only" caveat.
- **[L]** `_ops/Mermaid Diagram Standard.md`: intro says it + Image Embedding form "the complete
  visual language" — there are now three standards. Update framing.

---

## Part 4 — Verify

```bash
python3 "_ops/swarm/lint-doc-drift.py" .
```
Targets after fixes: **0 errors**. The 3 E3 wrong-case errors clear once CLAUDE.md + Self-Model
Update are fixed. The `W1 [[Deposit Ceremony]] §Filing structure` warning clears once the Deposit
filing fork (Part 3) adds wording the pin can match. Remaining W0 warnings are a review
list (some are genuine — e.g. Image Embedding Standard example `.svg` paths, `The Shop.md → Shop.md`
— some are prose examples in non-foundational entries); triage, don't necessarily zero them.

---

## Part 5 — Commit plan

Group into a few coherent commits:
1. `Add doc-drift linter — _ops/swarm/lint-doc-drift.py` (Part 1).
2. `Schema Ceremony — fold README/SUBSTRATE/Palace Ceremonies into update checklist; backfill
   link+entry types to README/SUBSTRATE — v[next]` (Parts 2.1, README + SUBSTRATE + ROSETTA + SCHEMA
   vocab edits — this IS a Schema Ceremony; follow its own (now-amended) checklist).
3. `Fix foundational doc drift — wrong-case refs, path/location errors, stale specs` (the CLAUDE.md/
   JEWEL/ceremony path + version + token + trigger fixes).
4. `Fix design-system + standards drift — skin names, CSS borders, remove LoginScreen, tri-standard
   framing`.
You have normal `git commit` Mac-side; the Cowork lock-safe committer does not apply to you.

---

## Corrections & caveats (carried honestly from the audit)

- **RETRACTED:** an earlier audit draft claimed `SUBSTRATE.md` and `Substrate.md` were two separate
  files (a divergence hazard). Verification showed they share **inode 107422** — one file under two
  spellings on a case-insensitive volume. **Nothing to delete.** The only issue is wrong-case
  *references*, handled above.
- The "~26K actual tokens" figure for the Tier 0–2 floor was a chars/4 estimate, not a tokenizer
  count. Measure before committing any specific number into JEWEL/CLAUDE.
- The bundle gap is narrower than first feared: **Handoff already implements bundles correctly**;
  only Deposit (and a clarifying note in Weave) needed changes — do not retrofit every file-writing
  ceremony.
- Full ranked findings with per-item rationale: the Cowork outputs file
  `palace-foundational-doc-drift-assessment.md` (scratch; may be gone — this handoff reproduces the
  actionable content).
```
