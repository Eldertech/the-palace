#!/bin/bash
# Palace Studio launcher — double-click to run.
# Turns on the web app, enables the RunPod GPU endpoint, opens Chrome, tracks
# status, and on quit (close this window or Ctrl-C) shuts the app down AND parks
# the GPU endpoint so nothing is left billing.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/palace_studio.py"
PORT="${PALACE_STUDIO_PORT:-8765}"
URL="http://localhost:$PORT"
PIDFILE="$DIR/.studio.pid"

# --- resolve RunPod creds (env or config.json) so we can park the endpoint ---
creds() { python3 - "$DIR" <<'PY'
import json,os,sys
d=sys.argv[1]; cf=os.path.join(d,"config.json")
key=os.environ.get("RUNPOD_API_KEY"); ep=os.environ.get("RUNPOD_ENDPOINT_ID")
if (not key or not ep) and os.path.exists(cf):
    try:
        c=json.load(open(cf)); key=key or c.get("api_key"); ep=ep or c.get("endpoint_id")
    except Exception: pass
print((key or "")+"\t"+(ep or ""))
PY
}
IFS=$'\t' read -r RP_KEY RP_EP <<<"$(creds)"

set_workers() { # $1 = max workers
  [ -n "$RP_KEY" ] && [ -n "$RP_EP" ] || return 0
  curl -s -o /dev/null -X PATCH "https://rest.runpod.io/v1/endpoints/$RP_EP" \
    -H "Authorization: Bearer $RP_KEY" -H "Content-Type: application/json" \
    -d "{\"workersMin\":0,\"workersMax\":$1}"
}

cleanup() {
  trap - INT TERM HUP EXIT          # disarm to avoid re-entry
  echo
  echo "Shutting down Palace Studio…"
  [ -f "$PIDFILE" ] && { kill "$(cat "$PIDFILE")" 2>/dev/null; rm -f "$PIDFILE"; }
  if [ -n "$RP_KEY" ] && [ -n "$RP_EP" ]; then
    echo "Parking the GPU endpoint (0 workers — no charges at rest)…"; set_workers 0
  fi
  echo "Done. You can close this window."
  exit 0
}
trap cleanup INT TERM HUP EXIT

clear
echo "╔══════════════════════════════════════════╗"
echo "║            P A L A C E   S T U D I O       ║"
echo "╚══════════════════════════════════════════╝"

# already running? just focus Chrome.
if curl -s -o /dev/null --max-time 2 "$URL/api/config"; then
  echo "Already running — opening Chrome at $URL"
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"
  trap - INT TERM HUP EXIT; exit 0
fi

if [ -n "$RP_KEY" ] && [ -n "$RP_EP" ]; then
  echo "• Enabling RunPod endpoint …"; set_workers 1
else
  echo "• (No RunPod creds found — set RUNPOD_API_KEY/RUNPOD_ENDPOINT_ID or make config.json"
  echo "   to let this launcher manage the GPU endpoint.)"
fi

echo "• Starting the web app…"
python3 "$APP" >"$DIR/.studio.log" 2>&1 &
echo $! > "$PIDFILE"

printf "• Waiting for the server to come up"
UP=0
for i in $(seq 1 40); do
  if curl -s -o /dev/null --max-time 2 "$URL/api/config"; then UP=1; break; fi
  printf "."; sleep 1
done
echo
if [ "$UP" != 1 ]; then
  echo "!! Server did not start. Last log lines:"; tail -n 20 "$DIR/.studio.log"
  cleanup
fi

echo "• Palace Studio is UP → $URL"
open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"
echo
echo "────────────────────────────────────────────"
echo "  RUNNING.  Keep this window open."
echo "  Close it (or press Ctrl-C) to STOP the app"
echo "  and PARK the GPU endpoint (no charges)."
echo "────────────────────────────────────────────"

# stay alive while the server lives; reflect status
while kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; do sleep 2; done
echo "Server process ended."
cleanup
