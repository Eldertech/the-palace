#!/bin/bash
# Palace heartbeat — COMMONS REAPER SWEEP (Mac-side)
#
# Surfaces suspected LEAKED shared-service resources (RunPod pods whose owner agent
# has gone silent past the liveness TTL and whose age is past the boot grace) for
# human review. This job is REPORT-ONLY by design: it runs `commons reap --cross-slug`,
# which FLAGs candidates to the FLAGS board and terminates NOTHING. Cross-slug
# termination is disabled in code until liveness-heartbeat coverage is proven
# (see _ops/commons/reaper.py CROSS_SLUG_FORCE_ENABLED).
#
# Per-agent SELF cleanup (`commons reap --self --force`) is safe and belongs at agent
# startup, not here — an agent clears its OWN prior-run leaks before booting a new pod.
#
# Fired by: ~/Library/LaunchAgents/com.loudon.palace.commons-reaper-sweep.plist (daily).
set -uo pipefail

PALACE="/Users/loudonstearns/Documents/The Palace"

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true

LOG_DIR="$PALACE/_ops/heartbeat/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/commons-reaper-sweep-$(date +%Y-%m-%dT%H-%M-%S).log"

{
  echo "=== commons reaper sweep (report-only) — $(date) ==="
  # honor the same global pause flag the other heartbeat jobs use
  if [ -f "$PALACE/_ops/heartbeat/.paused" ]; then
    echo "paused (.paused present) — skipping."
    exit 0
  fi
  cd "$PALACE/_ops" && python3 -m commons reap --cross-slug
  echo "=== done — $(date) ==="
} >"$LOG" 2>&1
