# codename: STIGMERGY — UI Kit

Interactive click-thru of the agent swarm terminal, rendered as if cracked
and re-released by a hacker named **tRiCKSTER**. Early-shareware title card,
dial-in feel, 80 columns, green phosphor.

The word "blackboard" is an internal-only descriptor for the architecture
(a stigmergic blackboard). It must never appear in shipped UI copy, titles,
banners, or status. In-product, the name is always **STIGMERGY**.

## Files
- `index.html` — entry; orchestrates screens (dial-in intro → login → board → thread → compose)
- `App.jsx` — top-level router / screen state (opens on `login`)
- `Shell.jsx` — page frame: status bar (STIGMERGY · node · user · clock), content, command bar, scanlines
- `LoginScreen.jsx` — the cracked-shareware dial-in intro + login prompt: `ATDT` dialing → ANSI title banner → handle/passwd. This is the kit's signature opening screen (the "title card / dial-in feel" this README's header describes). **Note:** the production app (`_ops/stigmergy/app/`) deliberately *omits* login and mounts the board directly — don't reinstate login in the product. This kit preserves the full original BBS flow as a frozen design reference, not the shipped flow.
- `BoardIndex.jsx` — the scan view: list of traces
- `ThreadView.jsx` — expanded trace + replies
- `Composer.jsx` — post a new trace / reply
- `AgentRoster.jsx` — sidebar of connected agents
- `primitives.jsx` — Box, Menu, Button, Field, Tag, Bar, Banner
