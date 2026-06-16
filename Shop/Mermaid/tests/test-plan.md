---
title: test-plan
born: 2026-05-30
links:
  - { target: "[[Mermaid]]", type: connects-to, label: test-plan-for }
forward_vector: "I hold the Smoke / Capability / Style / Edge / Speed / Determinism probes for the Mermaid Specialist so each claim can be re-run and re-confirmed."
---

# Mermaid — Test Plan

> Phase E rollout. Mermaid is the Shop's text-defined diagram Specialist. The honest finding from Phase E: **`mmdc` (the CLI) is not globally installed on the canonical Mac**, but `npx -y -p @mermaid-js/mermaid-cli mmdc ...` works fine and is the recommended invocation pattern — no `npm install -g` step, no version drift, ~23 s first-run cold-cache cost (one-time per Node minor version).

Last run: **2026-05-30** — Smoke pass via `npx`. No `mmdc` on PATH; `npx` is the right invocation.

## Smoke

```sh
echo 'graph TD; A-->B; B-->C;' > /tmp/mermaid-smoke.mmd
npx -y -p @mermaid-js/mermaid-cli mmdc \
  -i /tmp/mermaid-smoke.mmd -o /tmp/mermaid-smoke.svg
```

- **Automated:** Pass = SVG exists, opens in a browser, the three labelled nodes A/B/C render with their two edges.
- **Last run (2026-05-30):** 12 KB SVG produced. First-run `npx` cost ~23 s (Mermaid CLI fetch + Puppeteer Chromium spin); subsequent runs much faster.

## Capability Probe

Mermaid's three Shop jobs:

| Job                                | Last run                                          |
|-------------------------------------|----------------------------------------------------|
| Topology / system flow (graph TD)  | Smoke covers it (2026-05-30) — OK                  |
| Sequence diagram                    | Kuramoto Round 1 phenomena-walk hand-walked it (informal, not formally exercised this round) |
| State machine                       | not exercised — claim unverified                  |

- **Last run (2026-05-30):** Smoke + one informal historical use.

## Style Probe

Mermaid ships with strong default styling (rounded corners, a fixed palette). The Maker's house pattern for Mermaid is a `--cssFile` argument pointing at a Loudon Live-derived CSS that overrides Mermaid's class selectors with the active skin's tokens. **This wrapper does not exist yet**; deferred to the next styled Mermaid job. Until then, Mermaid output is Layer-0 default → a deliberate deviation from the design system. Brief responses that route to Mermaid should name this until the wrapper lands.

- **Last run (2026-05-30):** Smoke is unstyled (default Mermaid); no house-defaults wrapper to test against.

## Edge Probe

- **Malformed syntax** (`graph TD; A->B`): `mmdc` exits non-zero with a parser error pointing at the line. ✓
- **Missing input file**: clean error, exits non-zero. ✓
- **Cycle in a `graph TD`**: renders fine — Mermaid doesn't refuse cycles, it lays them out. Behavioural, not a probe.

- **Last run (2026-05-30):** not formally exercised; behaviours follow Mermaid's documented contract.

## Speed Bench

Reference host: **mac**.

| Job                                   | Time          |
|----------------------------------------|---------------|
| `npx` first-run (CLI fetch + Chromium spin) | ~23 s    |
| Subsequent `mmdc` runs                | ~1–2 s        |

The Smoke's 23 s isn't Mermaid — it's `npx`'s warm-up. Once cached, Mermaid renders SVGs in a couple of seconds.

## Determinism (load-bearing)

Mermaid is deterministic given (same `.mmd` source, same Mermaid version, same theme/css). The output SVG embeds version strings and may include layout-pass timestamps depending on flags; strip with `--metadata false` or post-process if byte-identical output matters.

- **Reproducibility artifact:** the `.mmd` source + the Mermaid CLI version (`npx -p @mermaid-js/mermaid-cli mmdc --version`).
- **Last run (2026-05-30):** not formally byte-checked this round; SVG identical *by eye* across two Smoke runs. Byte-determinism check deferred to first Mermaid job that depends on reproducibility.
