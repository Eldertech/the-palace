#!/bin/bash
# Palace heartbeat — STEWARD BATCH (Mac-side)
# Replaces the disabled Cowork scheduled task "palace-heartbeat-steward-batch".
#
# Why Mac-side: stewards run as a headless `claude -p` session on your machine,
# so they reach the full Shop (ComfyUI, Kokoro, Manim, Max/RNBO, the GPU) and
# stop posting the confusing "I'm in the sandbox / promote me to the Mac" forks.
# This is the same spawn STIGMERGY's actuator already uses to advance a steward
# from the board — just fired by a timer instead of a click. No API key needed.
#
# Fired by: ~/Library/LaunchAgents/com.loudon.palace.steward-batch.plist (daily 06:00).
# Cadence: the 2-day stamp guard below makes the real cadence every-other-morning
#          even though launchd fires daily (launchd can't express "every 2 days").
# Posture: the agent runs SHADOW (writes bundle scroll.md + machinery + board, but
#          never touches canon entry bodies/frontmatter and never runs git). Each
#          cycle's process-cycle.js commits what that cycle shipped; the WRAPPER
#          sweeps up any machinery left after the agent returns.
set -uo pipefail

# ── config ──────────────────────────────────────────────────────────────────
PALACE="/Users/loudonstearns/Documents/The Palace"   # MAIN worktree (where stewards + tools live)
INTERVAL_DAYS=2                                       # every-other-morning; set 1 for daily
MODEL="claude-opus-5-5"                               # exact id — the `opus` alias has lagged the latest Opus
CLAUDE_BIN="${CLAUDE_BIN:-claude}"                    # if launchd can't find it, hardcode: which claude

# ── make `claude`/node resolvable under launchd's minimal environment ────────
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true

LOG_DIR="$PALACE/_ops/heartbeat/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/steward-batch-$(date +%Y-%m-%dT%H-%M-%S).log"
STAMP="$PALACE/_ops/heartbeat/.last-steward-batch"

{
  echo "=== palace steward batch — $(date) ==="

  # global pause flag — STIGMERGY (or you) can pause the whole heartbeat without
  # touching launchd: while _ops/heartbeat/.paused exists, every run no-ops and
  # leaves the cadence stamp untouched. STIGMERGY only toggles this file (via the
  # STEWARDS deck pause/resume); it never runs launchctl.
  if [ -f "$PALACE/_ops/heartbeat/.paused" ]; then
    echo "skip: paused (flag present: $PALACE/_ops/heartbeat/.paused)"; exit 0
  fi

  # every-other-morning guard
  if [ -f "$STAMP" ]; then
    last="$(cat "$STAMP" 2>/dev/null || echo 0)"; now="$(date +%s)"
    if [ $(( (now - last) / 86400 )) -lt "$INTERVAL_DAYS" ]; then
      echo "skip: last run < ${INTERVAL_DAYS}d ago"; exit 0
    fi
  fi
  date +%s > "$STAMP"

  cd "$PALACE" || { echo "ERROR: palace not found at $PALACE"; exit 1; }
  command -v "$CLAUDE_BIN" >/dev/null 2>&1 || { echo "ERROR: '$CLAUDE_BIN' not in PATH — set CLAUDE_BIN to the full path"; exit 127; }

  "$CLAUDE_BIN" -p "Run my palace steward batch now using the palace-orchestrator skill in batch mode (read _ops/orchestrator/batch.md, then permanent.md per due steward). This is the scheduled every-other-morning heartbeat run on my Mac — the schedule is standing consent, so proceed without asking for confirmation. Give every due steward a RUN: cycle it repeatedly, up to its manifest's stopping_conditions.max_iterations, for as long as each cycle ships a made thing and nothing is waiting on me (a blocking ask or a live-session request ends that steward's run; a barren cycle gets exactly one retry, a second barren cycle means STALLED — stop that steward and move on). Post-process every cycle with process-cycle.js so each steward's bundle-local '[Entry] — scroll.md' (the project's front door: Now zone + making trail) is regenerated as part of the cycle. SHADOW POSTURE (read carefully): do NOT touch canonical entry .md bodies or frontmatter, and do NOT deposit canon — but writing the bundle-local scroll.md, the steward machinery (state.json / history.jsonl), and append-only board messages IS expected, not forbidden. Never hand-edit a scroll's Standing Orders zone — that zone is mine. Do NOT run git yourself — process-cycle.js commits each cycle's shipped work, and the wrapper sweeps up machinery after you return. Leave every ask as a Trickster-board message for me; the BBS is the record, so do NOT write a digest file." \
    --permission-mode bypassPermissions \
    --model "$MODEL" \
    --verbose
  agent_rc=$?
  echo "=== claude steward batch exit $agent_rc — $(date) ==="

  # ── Scoped, lock-safe commit (wrapper-side, NOT the agent) ───────────────────
  # The agent ran SHADOW: it wrote bundle scroll.md + steward machinery + board
  # appends, but it never commits and never edits canon entry bodies/frontmatter.
  # The wrapper makes ONE scoped commit via the palace committer, which stages
  # only what we hand it (NEVER `git add -A` — SCHEMA §9, N-writer repo) and
  # clears stale git locks itself. Each cycle already committed what it shipped
  # (process-cycle.js → cycle-commit.js); this is the sweep for machinery and
  # scrolls a failed or skipped cycle commit left behind.
  COMMITTER="$PALACE/_ops/stigmergy/app/scripts/palace-commit.mjs"
  if command -v node >/dev/null 2>&1 && [ -f "$COMMITTER" ]; then
    # Stage: steward machinery + the append-only board (git is its ground truth,
    # SCHEMA §9) + every changed/new bundle scroll. NUL-delimited paths
    # piped through `xargs -0` so spaces and em-dashes in filenames survive.
    git -C "$PALACE" add -- "_ops/agents/permanent" "_ops/swarm/persistent/blackboard.jsonl" 2>/dev/null || true
    git -C "$PALACE" diff --name-only -z -- '*— scroll.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    git -C "$PALACE" ls-files --others --exclude-standard -z -- '*— scroll.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    if git -C "$PALACE" diff --cached --quiet; then
      echo "commit: nothing under heartbeat scope changed — skipping"
    else
      PALACE_ROOT="$PALACE" node "$COMMITTER" \
        --kind steward --scope heartbeat \
        --summary "machinery + project scrolls" \
        --verify unverified --author claude \
        || echo "commit: palace-commit returned non-zero (see message above)"
    fi
  else
    echo "commit: node or palace committer unavailable — left uncommitted for Mac-side review"
  fi

  echo "=== steward batch done — $(date) ==="
} >"$LOG" 2>&1
