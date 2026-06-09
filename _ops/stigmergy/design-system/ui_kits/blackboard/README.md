# codename: STIGMERGY — UI Kit

Interactive click-thru of the agent swarm terminal, rendered as if cracked
and re-released by a hacker named **tRiCKSTER**. Early-shareware title card,
dial-in feel, 80 columns, green phosphor.

The word "blackboard" is an internal-only descriptor for the architecture
(a stigmergic blackboard). It must never appear in shipped UI copy, titles,
banners, or status. In-product, the name is always **STIGMERGY**.

## Files
- `index.html` — entry; orchestrates screens (intro → board → thread → compose). The board mounts directly — there is no login step.
- `App.jsx` — top-level router / screen state
- `Shell.jsx` — page frame: status bar (STIGMERGY · node · user · clock), content, command bar, scanlines
- `LoginScreen.jsx` — **legacy / not in the active flow.** A cracked-shareware intro + login prompt from an earlier design; login was removed and must not be reinstated. Kept only as a reference asset.
- `BoardIndex.jsx` — the scan view: list of traces
- `ThreadView.jsx` — expanded trace + replies
- `Composer.jsx` — post a new trace / reply
- `AgentRoster.jsx` — sidebar of connected agents
- `primitives.jsx` — Box, Menu, Button, Field, Tag, Bar, Banner
