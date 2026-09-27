#!/bin/bash
# Force-stop Palace Studio and park the GPU endpoint, in case the main window
# was closed without a clean shutdown.
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PALACE_STUDIO_PORT:-8765}"
PIDFILE="$DIR/.studio.pid"

echo "Stopping Palace Studio…"
[ -f "$PIDFILE" ] && { kill "$(cat "$PIDFILE")" 2>/dev/null; rm -f "$PIDFILE"; }
# belt and suspenders: kill anything still bound to the port
PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null)
[ -n "$PIDS" ] && kill $PIDS 2>/dev/null

# park the endpoint
IFS=$'\t' read -r RP_KEY RP_EP <<<"$(python3 - "$DIR" <<'PY'
import json,os,sys
d=sys.argv[1]; cf=os.path.join(d,"config.json")
key=os.environ.get("RUNPOD_API_KEY"); ep=os.environ.get("RUNPOD_ENDPOINT_ID")
if (not key or not ep) and os.path.exists(cf):
    try:
        c=json.load(open(cf)); key=key or c.get("api_key"); ep=ep or c.get("endpoint_id")
    except Exception: pass
print((key or "")+"\t"+(ep or ""))
PY
)"
if [ -n "$RP_KEY" ] && [ -n "$RP_EP" ]; then
  echo "Parking GPU endpoint $RP_EP (0 workers)…"
  curl -s -o /dev/null -X PATCH "https://rest.runpod.io/v1/endpoints/$RP_EP" \
    -H "Authorization: Bearer $RP_KEY" -H "Content-Type: application/json" \
    -d '{"workersMin":0,"workersMax":0}'
fi
echo "Stopped. Safe to close."
