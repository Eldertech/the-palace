# Loudon Eval — human visual evaluation, posted to STIGMERGY

A **robust · easy · repeatable · low-cost** loop for getting Loudon's eye on a set of
generated images and having his judgment land on the STIGMERGY board as data — no
clipboard, no cloud, no GPU. Built because metrics mislead (a ResNet18 ruler once
inverted a verdict; the human eye caught the overfit immediately) — human + metric
together is the trustworthy channel.

## The one command

```bash
node _ops/loudon-eval/eval-server.mjs --dir <folder-with-images+manifest> [--port 8211] [--app http://localhost:5173]
```

Then Loudon opens `http://127.0.0.1:<port>/`, rates, clicks **Send to STIGMERGY** → the
rating is on the board. The agent reads it back. Done.

**Requires the STIGMERGY app running on :5173** (Loudon's normal surface) — that app's
strict validator + sanctioned write path do the work, so this server stays tiny.

## How it works (why it's robust)

- The server serves the harness (`rate.html`) + the task's `rating_manifest.json` + its
  images **same-origin**, so the browser Send has no CORS.
- On Send it wraps the ratings in a §2.2 `human_eval` BROADCAST and **forwards it
  server-to-server** to `POST /api/persistent`. No browser CORS; the app validates and
  appends. **One sanctioned write path, validated by reuse — no re-implementation.**
- Touches none of the STIGMERGY app. (The app already runs background appenders, so a
  second appender is how the system already works.)

## The message it posts (the `human_eval` board convention)

`BROADCAST` from `TRICKSTER` (the human node) on board `FLAGS`:

```json
{
  "schema_version": "1.0", "id": "human-eval-<task>-<ms>", "ts": "<ISO8601 Z>",
  "session_id": "human-eval-<date>", "from": "TRICKSTER", "to": "*",
  "type": "BROADCAST", "board": "FLAGS",
  "health": { "context_pct": 0, "stop_reason": "human_eval", "iteration": 1, "tokens_this_call": 0, "model": "human", "score": "green" },
  "payload": { "kind": "human_eval", "task": "<task>", "groups": { "<group>": { "<criterion>": <value>, "note": "" } }, "overall": { ... } }
}
```

**Validator gotcha:** the strict server validator requires the four Path-1 `health`
fields (`context_pct`, `stop_reason`, `iteration`, `tokens_this_call`) and **`iteration`
must be ≥ 1**. For a human the honest stub is zeros everywhere + `iteration: 1`.

## Reading a rating back (agent side)

```bash
curl -s http://localhost:5173/api/persistent | python3 -c "
import sys,json
he=[m for m in json.load(sys.stdin)['messages'] if (m.get('payload') or {}).get('kind')=='human_eval' and m['payload'].get('task')=='<task>']
print(json.dumps(he[-1]['payload'], indent=2)) if he else print('no rating yet')"
```

Take the **latest** `human_eval` for the task (by `ts`) — that's Loudon's authoritative read.

## The manifest (per task — the only thing you author each time)

Drop a `rating_manifest.json` next to the images. Shape:

```json
{
  "task": "<id>", "title": "...", "instructions": "<html>",
  "criteria": [ { "key": "identity", "label": "...", "type": "scale", "max": 5 },
                { "key": "offchar",  "label": "...", "type": "flag" } ],
  "perGroupNote": true,
  "groups": [ { "id": "<g>", "label": "...", "images": ["a.png", "b.png", "c.png", "d.png"] } ],
  "overall": [ { "key": "ranking", "label": "...", "type": "rank", "options": ["g1","g2"] },
               { "key": "usable",  "label": "...", "type": "choice", "options": ["g1","g2","none"] },
               { "key": "note",    "label": "...", "type": "text" } ]
}
```

Criterion types: `scale` (1–max buttons), `flag` (checkbox per image). Overall types:
`rank` (click best→worst), `choice` (radio), `text`. Example: `Projects/BLUELINE/proofs/track-II-lora/grade/rating_manifest.json`.

## Files

- `eval-server.mjs` — the serve-and-forward server (Node, no deps).
- `rate.html` — the reusable rating harness (Loudon Live skin). Serves for any manifest.
