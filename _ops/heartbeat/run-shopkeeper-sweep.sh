#!/bin/bash
# Palace heartbeat — SHOPKEEPER SWEEP (Mac-side)
# Replaces the disabled Cowork scheduled task "shopkeeper-discovery-sweep".
#
# Runs the Shopkeeper's discovery loop as a headless `claude -p` session on your
# Mac. First honors any approved pending commission, then does the routine sweep.
# Frugal by design — cheapest models that work.
#
# Fired by: ~/Library/LaunchAgents/com.loudon.palace.shopkeeper-sweep.plist (daily 06:30).
# Cadence: 2-day stamp guard → every-other-morning.
set -uo pipefail

# ── config ──────────────────────────────────────────────────────────────────
PALACE="/Users/loudonstearns/Documents/The Palace"
INTERVAL_DAYS=2
MODEL="sonnet"                                        # frugal sweep; bump to opus only if discovery quality needs it
CLAUDE_BIN="${CLAUDE_BIN:-claude}"

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true

LOG_DIR="$PALACE/_ops/heartbeat/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/shopkeeper-sweep-$(date +%Y-%m-%dT%H-%M-%S).log"
STAMP="$PALACE/_ops/heartbeat/.last-shopkeeper-sweep"

{
  echo "=== shopkeeper sweep — $(date) ==="

  if [ -f "$STAMP" ]; then
    last="$(cat "$STAMP" 2>/dev/null || echo 0)"; now="$(date +%s)"
    if [ $(( (now - last) / 86400 )) -lt "$INTERVAL_DAYS" ]; then
      echo "skip: last run < ${INTERVAL_DAYS}d ago"; exit 0
    fi
  fi
  date +%s > "$STAMP"

  cd "$PALACE" || { echo "ERROR: palace not found at $PALACE"; exit 1; }
  command -v "$CLAUDE_BIN" >/dev/null 2>&1 || { echo "ERROR: '$CLAUDE_BIN' not in PATH — set CLAUDE_BIN to the full path"; exit 127; }

  "$CLAUDE_BIN" -p "Run my Shopkeeper discovery sweep now. You are the Shopkeeper — read Shop/Shopkeeper.md and speak/act in that voice. This is the scheduled every-other-morning sweep on my Mac — standing consent, so do not ask for confirmation. FIRST: read Shop/Shopkeeper/next-run-commission.md; if an approved pending commission exists, execute it before the routine sweep. THEN run the discovery loop — scan the open web and Hugging Face for new creative tools across sound/image/motion/interactive, triage hard, build a Sketch-tier probe for the worthy few, judge against the bar. Be frugal: cheapest models that work. SHADOW POSTURE: do NOT touch the canonical Shop/Shopkeeper.md entry or deposit new canon (a new Specialist enters as a stub per the Roster taxonomy, on my approval) — but writing sweep-latest.md and candidate dossiers into the Shop/Shopkeeper bundle and leaving a review note on the Trickster board IS expected. Do NOT commit and do NOT run git yourself — the wrapper makes one scoped commit after you return." \
    --permission-mode bypassPermissions \
    --model "$MODEL" \
    --verbose
  agent_rc=$?
  echo "=== claude shopkeeper sweep exit $agent_rc — $(date) ==="

  # ── Scoped, lock-safe commit (wrapper-side, NOT the agent) ───────────────────
  # Mirrors the steward batch: the agent ran SHADOW (wrote bundle dossiers +
  # board note, never canon, never committed); the wrapper makes one scoped
  # commit via the palace committer (stages only named paths, never `git add -A`
  # — SCHEMA §9; clears stale git locks itself). Text-only by decision: commit
  # the bundle's markdown (sweep-latest.md, dossiers) + the board note; leave any
  # Sketch-tier media probe UNcommitted for review on the Trickster card.
  COMMITTER="$PALACE/_ops/stigmergy/app/scripts/palace-commit.mjs"
  if command -v node >/dev/null 2>&1 && [ -f "$COMMITTER" ]; then
    # Stage only the Shopkeeper bundle's markdown + the append-only board. The
    # canonical Shop/Shopkeeper.md entry lives OUTSIDE the bundle folder, so this
    # pathspec never sweeps it in. NUL + `xargs -0` for spaces/em-dashes.
    git -C "$PALACE" add -- "_ops/swarm/persistent/blackboard.jsonl" 2>/dev/null || true
    git -C "$PALACE" diff --name-only -z -- 'Shop/Shopkeeper/*.md' 'Shop/Shopkeeper/**/*.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    git -C "$PALACE" ls-files --others --exclude-standard -z -- 'Shop/Shopkeeper/*.md' 'Shop/Shopkeeper/**/*.md' 2>/dev/null | xargs -0 -I{} git -C "$PALACE" add -- "{}" 2>/dev/null || true
    if git -C "$PALACE" diff --cached --quiet; then
      echo "commit: nothing under shopkeeper scope changed — skipping"
    else
      PALACE_ROOT="$PALACE" node "$COMMITTER" \
        --kind ops --scope shopkeeper \
        --summary "discovery sweep — dossiers + board note" \
        --verify unverified --author claude \
        || echo "commit: palace-commit returned non-zero (see message above)"
    fi
  else
    echo "commit: node or palace committer unavailable — left uncommitted for Mac-side review"
  fi

  echo "=== shopkeeper sweep done — $(date) ==="
} >"$LOG" 2>&1
