# Palace Worktree — create an isolated checkout with the heavy state symlinked back

A standard process for spinning up a git **worktree** (its own branch, its own HEAD, its own
directory) that still has the gitignored machine state a fresh checkout lacks. Born 2026-06-16 after a
concurrent agent switched the shared working tree's branch out from under an in-progress session and a
commit landed on the wrong branch.

## Is this a common procedure?

Yes — two well-established practices, combined:

1. **Git worktrees** (`git worktree add`) are a standard git feature for working on multiple branches at
   once without stashing or cloning. Common wherever several lines of work (or several agents) run in
   parallel on one repo.
2. **Symlinking gitignored heavy/secret state into a worktree** is the standard companion practice. A
   fresh worktree contains only *tracked* files; anything gitignored — venvs, `node_modules`, model
   weights, `.env`/secrets, build caches — is absent. Teams routinely symlink the expensive-to-rebuild
   pieces back from a canonical checkout (especially in ML/monorepos, where re-downloading weights or
   re-installing a venv per worktree is the real cost).

What's palace-specific is only the *manifest* — exactly which paths, and the nuance that some gitignored
state (runtime pid/log dirs) must **not** be shared. That manifest is `symlinks.json`.

## The two failure modes this solves

- **Branch thrashing.** Multiple agents share the primary working tree and switch its branch
  continuously. A commit lands on whatever branch HEAD points to *at commit time*, not the branch you
  started on. An own-worktree has its own HEAD — immune. (See the memory `feedback_shared_worktree_branch_switch`.)
- **Missing tooling.** `_tools/` is gitignored (16 GB ComfyUI venv + weights), so a naïve worktree
  can't run any Shop/BLUELINE GPU work. Symlinking it back fixes that without a 16 GB re-download.

## File structure

```
_ops/worktree/
├── SKILL.md            ← this file (process + rationale)
├── symlinks.json       ← the manifest: exactly what to symlink, by profile, with why/size/secret flags
└── new-worktree.mjs    ← the script: create a worktree + apply the manifest; --remove tears down safely
```

## Create

```sh
node _ops/worktree/new-worktree.mjs --name feature/blueline --profile blueline
```

| Flag | Default | Meaning |
|---|---|---|
| `--name` | (required) | branch for the worktree (new unless it already exists) |
| `--profile` | `full` | which symlink set — see profiles below |
| `--base` | `main` | branch to fork from when creating a new branch |
| `--dir` | `../palace-<slug>` | where the worktree lives |
| `--memory` | off | also symlink `~/.claude` project memory so palace memories carry over |
| `--dry-run` | — | print the plan, change nothing |

**Profiles** (defined in `symlinks.json`; pick the smallest that fits the work):

| Profile | Symlinks | For |
|---|---|---|
| `docs` | *(none)* | pure markdown / canon / ceremony work — fastest, safest |
| `shop` | `_tools` · `.venvs` · `settings.local.json` | Shop tools + GPU + audio Specialists |
| `blueline` | `_tools` · RunPod `config.json` · `settings.local.json` | BLUELINE (local ComfyUI + cloud RunPod) |
| `stigmergy` | `node_modules` · `settings.local.json` | the STIGMERGY React app |
| `full` | all of the above | a worktree that does everything |

## What gets symlinked — and what must not

The authoritative list is `symlinks.json`. In short:

- **Symlinked (heavy/secret, not cheaply regenerable):** `_tools/` (16 G), `.venvs/` (1.1 G), `RunPod
  Images/studio/config.json` (secret), `_ops/stigmergy/app/node_modules` (237 M), `.claude/settings.local.json`.
- **Never symlinked (per-worktree runtime — sharing cross-wires running processes):**
  `_ops/stigmergy/.actuator*`, `Enrichment/.server.*`, and all regenerable caches (`__pycache__`,
  `_manim_media`, `.vite`, `.remotion`, generated media). They rebuild per worktree.
- **Free already:** every *tracked* file, including the `_`-import symlinks (`FOUR_PILLARS.md` →
  `FOUR PILLARS.md`) — git provides them in any worktree.

The symlinks point at the **canonical (primary) worktree**, which owns the real installs. `.gitignore`
uses slash-less patterns (`_tools`, `.venvs`, `**/node_modules`) so these *symlinks* are ignored in the
worktree, not just the real dirs in the owner — otherwise `git status` shows them as untracked and a
careless `git add -A` would commit a symlink to an absolute machine path.

## Memory continuity (the one thing outside the repo)

Auto-memory (`~/.claude/projects/<slug>/memory/`) is keyed to the worktree's **absolute path**, so a new
path starts with empty memory — you lose the accumulated palace memories. `CLAUDE.md` still loads (it's
tracked). Pass `--memory` to symlink the new slug's `memory/` to the canonical Palace memory, or run the
exact command the script prints. (Shared state: writes from either worktree land in the same files.)

## Teardown (safe by construction)

```sh
node _ops/worktree/new-worktree.mjs --name feature/blueline --remove [--delete-branch]
```

`--remove` **unlinks the borrowed symlinks first**, then runs `git worktree remove`. This matters: a
plain `rm -rf` / `git worktree remove --force` on a worktree containing a `_tools` symlink does *not*
delete the owner's 16 GB (rm unlinks a symlink, never traverses it) — but unlinking first means there's
zero chance of it and `git worktree remove` succeeds without `--force`. If you symlinked memory, the
script prints the `rm` to remove that link too.

## Ceremonies in a worktree

The palace ceremonies assume a single working tree; worktrees split that. The rule: **canon and
coordination always write to the owner (main); in-progress work lives where it lives.** Resolve the
owner with `git worktree list --porcelain` (first `worktree ` line) — the same lookup this script uses.

- **Deposit** — a deposit adds to canon, and canon is `main`. It always writes its entries, the
  `_ops/Deposit Archive.md` row, and its weave_flags to the **owner** and commits there
  (`git -C "<owner>" …`), regardless of which worktree the conversation ran in. See
  `_ops/Deposit Ceremony.md` § Where the Deposit Lands.
- **Coordination state** — the persistent blackboard (`_ops/swarm/persistent/blackboard.jsonl`) and
  `_ops/Deposit Archive.md` are tracked + append-only, so per-branch copies fragment and merge-conflict.
  **Always append to the owner's physical file**, never a worktree's branch copy. This keeps the
  stigmergic field one shared field and honors SCHEMA §9's one-write-path invariant (it satisfies it —
  no schema change).
- **Baton** — a baton continuing *feature work* lives in that worktree's bundle on its branch, and is
  invisible from every other worktree — so it **must** be announced on the owner's board, carrying its
  worktree coordinate (branch · dir · profile). A baton continuing *canon work* lives on the owner. See
  `_ops/Baton Ceremony.md` § Where the Baton Lives.

**Precondition for all of the above:** the owner worktree stays pinned to `main`. If it has been
switched off `main`, stop — a canon write landing on a feature branch is the exact stranding these
rules prevent.

## Manual fallback (no script)

```sh
OWNER="/Users/loudonstearns/Documents/The Palace"
git worktree add ../palace-blueline -b feature/blueline main
ln -s "$OWNER/_tools" ../palace-blueline/_tools
ln -s "$OWNER/.venvs" ../palace-blueline/.venvs
ln -s "$OWNER/RunPod Images/studio/config.json" "../palace-blueline/RunPod Images/studio/config.json"
# teardown: rm the symlinks, then `git worktree remove ../palace-blueline`
```

Keep the script's manifest the source of truth; the manual path is for when Node isn't handy.
