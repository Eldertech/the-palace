# Palace Heartbeat — Mac-side routines

The steward batch's launchd job replaces the Cowork **scheduled task** (now disabled)
that used to fire it; the Shopkeeper runs inside the batch as an ordinary steward. The reason for the move:
Cowork's scheduled tasks run in the **Linux sandbox**, which has no GPU/Max/native
tools — so GPU-bound stewards kept posting confusing "I'm in the sandbox, hand me
to the Mac" forks into your Trickster inbox. Running the same headless
`claude -p` cycle **on the Mac** puts the stewards where the Shop's tools actually
live, and the confusion disappears at the source. No Anthropic API key is needed —
this is your local Claude Code CLI on a timer (the same spawn STIGMERGY's actuator
already uses to advance a steward from the board).

## Files

| File | Role |
|---|---|
| `run-steward-batch.sh` | Wrapper: gives every *due* steward a **run** (up to its manifest `max_iterations` cycles, stopping on a blocking ask, a session request, or a stall) via the orchestrator skill (batch mode), then makes one scoped, text-only commit (machinery + `[Entry] — scroll.md` + board). See **Posture** below. |
| `launchd/com.loudon.palace.steward-batch.plist` | Timer: daily 06:00 (→ every-other-morning via the wrapper's guard). |
| `logs/` | Per-run logs + launchd stdout/stderr. |
| `.last-steward-batch` | Stamp file the 2-day cadence guard reads/writes. |

## Which `claude` fires

The wrapper and STIGMERGY's lanes (`_ops/stigmergy/app/server/claude-bin.js`) resolve the
binary the same way: `$CLAUDE_BIN` if set, else `~/.local/bin/claude` if present, else bare
`claude`. On 2026-09-23 the Homebrew CLI (2.1.236) was too old for `claude-opus-5-5` (needs
≥ 2.1.280) and `brew upgrade claude-code` was blocked on the Xcode license, so for one evening
a shim at `~/.local/bin/claude` exec'd the CLI the Claude desktop app bundles
(`~/Library/Application Support/Claude/claude-code/<version>/…`). Resolved the same night by
switching casks — the plain `claude-code` cask lags; `claude-code@latest` tracks the current
release — and the shim was deleted. If the pin ever bites again, that shim is the stopgap:
a one-line script that execs the newest bundled version, removed once Homebrew catches up.

## Cadence note

launchd can't express "every 2 days," so each plist fires **daily** and each
wrapper holds a 2-day **stamp guard** that no-ops on the off day — net effect is
every-other-morning, matching the old Cowork cadence. Change `INTERVAL_DAYS` at the
top of a wrapper (1 = daily), or the plist `Hour`/`Minute` to move the time. If the
Mac is asleep at the scheduled minute, launchd runs the job at next wake.

## Posture — shadow agent, wrapper commits

The batch runs the agent in a **shadow posture** and lets the *wrapper* commit:

- **The agent never edits canon and never runs git.** It does not touch a
  project entry's `.md` body or frontmatter, and it does not deposit. It *does*
  write its normal cycle output: the bundle-local `[Entry] — scroll.md`
  read-model, the steward machinery (`state.json` / `history.jsonl`), and
  append-only Trickster-board messages. This is the Bundle-Local Stewardship
  cycle (Bundle-Local Stewardship — Production Plan) — "shadow" means
  *touches no canon*, not *writes nothing*.
- **The wrapper makes one scoped, lock-safe commit** after the agent returns,
  via the palace committer (`_ops/stigmergy/app/scripts/palace-commit.mjs`),
  which stages only the paths the wrapper names — **never `git add -A`**
  (SCHEMA §9, N-writer repo) — and clears stale git locks itself. The
  steward-batch commits steward machinery + the board + every changed
  `[Entry] — scroll.md`.
- **Text-only (decided 2026-06-09).** Rendered media — `.wav` / `.png` /
  `.svg` / `.html` a steward produces — is **left
  uncommitted** on purpose. It still renders on the Trickster card from disk;
  review it there and commit it on approval. This keeps the repo from
  accreting binaries tied to proposals that may be rejected. To change it,
  widen the wrapper's pathspec to include media extensions.

This replaces the old "do NOT commit, leave the tree for Loudon" rule — a
Cowork-era holdover. That constraint existed because the Cowork sandbox could
not delete files, so a raw commit stranded lockfiles; Mac-side, commits are
normal. Leaving 19 stewards' `scroll.md` + machinery churning uncommitted every
other morning would only bury the signal (the actual asks) under a growing
pile of machinery diffs.

### The review digest is separate

The human-readable "Steward Batch Review" digest
(`_ops/stigmergy/trickster-auto/heartbeat-latest.md`) is produced by the
**Automated Trickster** (`trickster-auto`), *not* by the batch. The
steward batch deliberately writes no digest file — the BBS is its record (see
`batch.md` Step 4). If you want the digest regenerated on the same cadence,
that is a third job to add here; today it is run separately.

## Install (run on the Mac, in Terminal)

```sh
cd "/Users/loudonstearns/Documents/The Palace"

# 0) one-time: clear the stale lock left by the Cowork rollback, or git writes on main will fail
rm -f .git/index.lock

# 1) make the wrapper executable
chmod +x _ops/heartbeat/run-steward-batch.sh

# 2) confirm the CLI is found in a LOGIN shell (this is what launchd uses)
zsh -lc 'command -v claude' || echo "claude not on login PATH — see Troubleshooting"

# 3) copy the plists into LaunchAgents and load them
cp _ops/heartbeat/launchd/com.loudon.palace.*.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.loudon.palace.steward-batch.plist
```

(Older macOS: use `launchctl load -w ~/Library/LaunchAgents/com.loudon.palace.steward-batch.plist` instead of `bootstrap`.)

### Optional — wake the Mac so it can fire unattended at dawn
```sh
sudo pmset repeat wakeorpoweron MTWRFSU 05:58:00
```

## Test now (don't wait for 06:00)

Run a wrapper by hand and watch the log. (Temporarily set `INTERVAL_DAYS=0`-style
testing by deleting the stamp file first, since you just rolled back today.)
```sh
rm -f _ops/heartbeat/.last-steward-batch
_ops/heartbeat/run-steward-batch.sh &
tail -f _ops/heartbeat/logs/steward-batch-*.log
```
Or kick the launchd job directly:
```sh
launchctl kickstart -k gui/$(id -u)/com.loudon.palace.steward-batch
```

## Pause (soft) vs. uninstall (hard)

Two different levers — reach for the soft one first.

**Soft pause — keep it installed, just skip runs.** Drop a `.paused` flag in this
directory and the wrappers no-op on every fire (and leave the cadence stamp
untouched), until you remove it:
```sh
touch _ops/heartbeat/.paused      # pause the whole heartbeat
rm   _ops/heartbeat/.paused       # resume
```
The flag is gitignored runtime state, per-machine. The **STIGMERGY STEWARDS deck**
exposes the same lever as a *pause heartbeat / resume heartbeat* button (it writes
this exact file — it never calls `launchctl`), alongside a truthful read of the
scheduler's state (installed? · cadence · last run · next fire · the digest with
its age). See [[STIGMERGY v2.0 — Consolidation & Primary Interface]].

**Hard uninstall — unload the launchd jobs entirely:**
```sh
launchctl bootout gui/$(id -u)/com.loudon.palace.steward-batch
# then optionally remove ~/Library/LaunchAgents/com.loudon.palace.*.plist
```

The old Cowork tasks are **disabled**, not deleted. To remove them for good, delete
their folders:
`~/Documents/Claude/Scheduled/palace-heartbeat-steward-batch/` and
`~/Documents/Claude/Scheduled/shopkeeper-discovery-sweep/`.

## Troubleshooting

- **`claude` not found when launchd runs it** — launchd uses a login shell, which
  sources `~/.zprofile`/`~/.zlogin` but **not** `~/.zshrc`. If your PATH (nvm,
  Homebrew, npm-global) is set only in `~/.zshrc`, either move the PATH export to
  `~/.zprofile`, or set `CLAUDE_BIN` to the absolute path at the top of each wrapper
  (find it with `which claude`).
- **Nothing happened at 06:00** — the Mac was asleep and not set to wake (see pmset
  above), or the 2-day guard skipped (check the newest `logs/*.log`).
- **Model string** — the steward batch pins the exact id `claude-opus-5-5` (the `opus`
  alias has lagged the latest Opus). Bump `MODEL=` when a newer Opus ships.
