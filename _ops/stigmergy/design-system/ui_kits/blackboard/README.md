# codename: STIGMERGY — UI Kit

Interactive click-thru of the agent swarm terminal, rendered as if cracked
and re-released by a hacker named **tRiCKSTER**. Early-shareware title card,
dial-in feel, 80 columns, green phosphor.

The word "blackboard" is an internal-only descriptor for the architecture
(a stigmergic blackboard). It must never appear in shipped UI copy, titles,
banners, or status. In-product, the name is always **STIGMERGY**.

## Files
- `index.html` — entry; orchestrates screens (intro → login → board → thread → compose)
- `App.jsx` — top-level router / screen state
- `Shell.jsx` — page frame: status bar (STIGMERGY · node · user · clock), content, command bar, scanlines
- `LoginScreen.jsx` — cracked-shareware intro + login prompt
- `BoardIndex.jsx` — the scan view: list of traces
- `ThreadView.jsx` — expanded trace + replies
- `Composer.jsx` — post a new trace / reply
- `AgentRoster.jsx` — sidebar of connected agents
- `primitives.jsx` — Box, Menu, Button, Field, Tag, Bar, Banner
