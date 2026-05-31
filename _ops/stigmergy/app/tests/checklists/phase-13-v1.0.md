# v1.0 Phase 2.5 — The Actuator · Visual Validator Checklist

Applies to screenshots in `screenshots/phase-13-v1.0/`:
- `actuator-idle.png` — the QUEUE deck with the actuator panel idle
- `actuator-fired.png` — the actuator after firing a worker (stub-backed; log streaming)

## What this phase delivers

The keystone of the v1.0 consolidation (Revision 2 §3): **the board becomes an actuator**. STIGMERGY's Node server now carries a port of the Enrichment `_fire_worker` mechanism, exposed as a guarded "fire a `claude -p` worker" primitive at the top of the QUEUE deck. The hard-won robustness scars are carried over: `bypassPermissions` (no-TTY), `ps`-based liveness (existence != liveness, survives pid reuse), exit cleanup of the pid file, single-global-worker refusal.

The visual surface is intentionally minimal here (Phase 4.5 wires real card actions through this same actuator): a status line, a guarded prompt + fire control, and a streaming log tail.

## Items to verify

Return `pass` / `fail: <reason>` / `n/a` per item with a one-line citation.

### Actuator panel — idle (`actuator-idle.png`)

1. **The actuator panel renders at the top of the QUEUE deck**, inside a `1px solid` bordered box titled `ACTUATOR -- fire a claude -p worker`. No em dashes (`--` only).
2. **The status line shows an idle state** — a hollow dot (`○`) with `idle` (or a `last fire: ok/failed` verdict if a prior fire happened), in dim phosphor (idle) / phosphor (ok) / amber (in-flight) / red (failed).
3. **A prompt input is present**, single-line, with a dashed underline and a `worker prompt...` placeholder.
4. **A `[F] FIRE` control is present**, bordered, uppercase, phosphor.
5. **When idle, an empty-log note reads `no worker log yet -- fire one to begin.`** in dim phosphor (or a log tail if a prior fire left one).

### Actuator panel — fired (`actuator-fired.png`)

6. **After firing, the status line shows the worker alive** — a filled dot (`●`) with `WORKER ALIVE` in amber, and a `pid <n>` readout. (If the shot was taken just after the stub exited, an `ok` verdict is acceptable -- the fire/reap cycle is fast.)
7. **The log tail streams** — a bordered `<pre>` showing the `--- worker fire <iso> ---` header line (and possibly a `-> reload` success marker), in dim phosphor monospace on terminal black.
8. **The prompt input is disabled while a worker is alive** (dimmed) -- the single-global-worker guard made visible. (n/a if the shot caught the post-exit idle state.)
9. **A feedback line may show `fired (pid <n>)`** in phosphor beneath the controls. (n/a if not captured.)

### Locked aesthetic (regression)

10. **No emoji** -- the only glyphs are ASCII (`○`, `●`, `[F]`, `--`). No rounded corners. No em dashes.
11. **CP437-evoked borders**: the panel box is `1px solid`; the log `<pre>` has a `1px solid` border. No character-cell box-drawing.
12. **Phosphor palette holds** -- green primary, amber for the alive/in-flight state, red only for a failed fire. No SaaS blue, no sans-serif.

### The spell

13. **Does the actuator read as a phosphor BBS terminal that can fire a headless agent?** A control surface, terse and legible, not a SaaS form. Call out anything that feels modern/off.

## Return format

```
N. pass — <one-line citation>
N. fail: <reason> — fix: <suggested change>
N. n/a — <why not applicable>
```

End with:
- `OVERALL: pass` — every item passed (or was n/a)
- `OVERALL: fail (<count> items)` — at least one item failed
