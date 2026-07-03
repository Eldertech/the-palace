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
# Posture: the agent runs SHADOW (writes bundle plan.md + machinery + board, but
#          never touches canon entry bodies/frontmatter and never commits); the
#          WRAPPER makes one scoped, text-only commit after the agent returns.
set -uo pipefail

# ── config ──────────────────────────────────────────────────────────────────
PALACE="/Users/loudonstearns/Documents/The Palace"   # MAIN worktree (where stewards + tools live)
INTERVAL_DAYS=2                                       # every-other-morning; set 1 for daily
MODEL="opus"                                          # richer voice over many cycles; pin to claude-opus-4-7 if you prefer
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

  "$CLAUDE_BIN" -p "Run my palace steward batch now using the palace-orchestrator skill in batch mode (read .claude/skills/palace-orchestrator/batch.md, then permanent.md per due steward). This is the scheduled every-other-morning heartbeat run on my Mac — the schedule is standing consent, so proceed without asking for confirmation. Cycle every due steward once, and materialize each due steward's bundle-local '[Entry] — plan.md' read-model via process-cycle.js as part of the cycle. SHADOW POSTURE (read carefully): do NOT touch canonical entry .md bodies or frontmatter, and do NOT deposit canon — but writing the bundle-local plan.md, the steward machinery (state.json / history.jsonl), and append-only board messages IS expected, not forbidden. Do NOT commit and do NOT run git yourself — the wrapper makes one scoped commit after you return. Leave every ask as a Trickster-board message for me; the BBS is the record, so do NOT write a digest file." \
    --permission-mode bypassPermissions \
    --model "$MODEL" \
    --verbose
  agent_rc=$?
  echo "=== claude steward batch exit $agent_rc — $(date) ==="

  # ── Scoped, lock-safe commit (wrapper-side, NOT the agent) ───────────────────
  # The agent ran SHADOW: it wrote bundle plan.md + steward machinery + board
  # appends, but it never commits and never edits canon entry bodies/frontmatter.
  # The wrapper makes ONE scoped commit via the palace committer, which stages
  # only what we hand it (NEVER `git add -A` — SCHEMA §9, N-writer repo) and
  # clears stale git locks itself. Text-only by decision (2026-06-09): rendered
  # media (.wav/.png/.svg/.html) is left UNcommitted for review on the Trickster
  # card and committed on approval — only text state lands here.
  COMMITTER="$PALACE/_ops/stigmergy/app/scripts/palace-commit.mjs"
  if command -v node >/dev/null 2>&1 && [ -f "$COMMITTER" ]; then
    # Stage: steward machinery + the append-only board (git is its ground truth,
    # SCHEMA §9) + every changed/new bundle plan read-model. NUL-delimited paths
    # piped through `xargs -0` so spaces and em-dashes in filenames survive.
    git -C "$PALACE" add -- "_ops/agents/permanent" "_ops/swarm/persistent/blackboard.jsonl" 2>/dev/null || true
    git -C "$PALACE" diff --name-only -z -- '*— plan.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    git -C "$PALACE" ls-files --others --exclude-standard -z -- '*— plan.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    if git -C "$PALACE" diff --cached --quiet; then
      echo "commit: nothing under heartbeat scope changed — skipping"
    else
      PALACE_ROOT="$PALACE" node "$COMMITTER" \
        --kind steward --scope heartbeat \
        --summary "machinery + bundle plan read-models" \
        --verify unverified --author claude \
        || echo "commit: palace-commit returned non-zero (see message above)"
    fi
  else
    echo "commit: node or palace committer unavailable — left uncommitted for Mac-side review"
  fi

  echo "=== steward batch done — $(date) ==="
} >"$LOG" 2>&1
