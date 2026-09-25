---
title: "Sentry — tuning"
born: 2026-09-25
links:
  - target: "[[Sentry]]"
    type: connects-to
    label: tuning-for
forward_vector: "I am the Sentry's record of what its watches taught it, numbered, each lesson tied to the spec change it forced, so a rule's shape has a reason you can read. Every watch leaves a line here. I name what a run taught about the Sentry, never what it found — findings are held, and this file is public."
---

# Sentry — tuning

What each watch taught the Sentry. Items are lessons about the spec — how it reads, what it trusts, where it
is blind — and never a finding: open findings are held locally, and this ledger is as public as the scroll
([[Sentry]] § Faces are public; findings are held). A run leaves one line at the end; a run that changed the
spec also leaves a numbered item naming the version it produced. Newest last.

## From the first watch — 2026-09-25 (hand-run, before the Sentry had a page)

The 2026-09-25 hosting assessment scanned the working tree for key formats and found none. It did not read history. Designing a pass over the full history — gitleaks, then a custom read of every blob — shaped the Sentry.

1. **A working-tree scan says nothing about history.** A file removed from the tree stays in every commit that held it, and a public repo publishes all of them. So the deep sweep reads every blob reachable from every ref, and marks each hit with whether a public ref can reach it. *(v1.0)*
2. **An established scanner reads `git log -p`, and `git log -p` skips merge commits.** Content that enters through a merge resolution is invisible to it. So the Sentry reads blobs as its own engine and runs gitleaks beside it for breadth; each covers the other's blind spot. *(v1.0)*
3. **Archives hide their insides from both engines by default.** gitleaks opens them only with `--max-archive-depth`; a raw blob read sees compressed bytes. So history sweeps run gitleaks at archive depth 3, and the Sentry reads the file names inside every zip and holds them to the same path rules as the tree. *(v1.0)*
4. **Structured data escapes its strings, and a rule anchored on quotes misses what is inside.** In JSON a `key = "…"` arrives as `key = \"…\"`. The format rules need no quotes and still catch real keys; the name-shaped rules do not. Decoding JSON before reading it is a spec change owed — v1.0 does not do it.
5. **A rule that floods its first run is narrowed before it lands.** The card-number rule matched 8,903 times on its first quick sweep: float arrays inside HTML pass the Luhn check by chance. ID and card numbers are now read only in prose-like files, and never inside a decimal. *(v1.0)*
6. **Everything tracked is public, not only the scroll.** Scroll, ledger, board, batons and commit bodies all reach GitHub. So open findings are held in the owner checkout's `_ops/sentry/held/`, a folder that ignores itself; a run line carries a scope and a bare count; `allow.json` carries hashes, never values or paths. *(v1.0)*
7. **A safety gate fails closed.** The palace's commit-msg hook fails open, which is right for a hook that only annotates. A push gate that failed open would let a worktree older than the Sentry push unscanned, silently ([[Tool Builder]]). So the gate refuses when it cannot run and names `git push --no-verify` as the way through. gitleaks missing is only a warning — the Sentry's own rules still read every blob. *(v1.0)*
8. **npm's severity is not the Sentry's.** Most of the palace's packages are local dev tooling, and npm rates a build-time advisory as if it shipped. The Sentry reads npm one step down — critical is high, high is medium — so the public gate fails on what can hurt a reader. *(v1.0)*
9. **A hook covers one machine.** The push gate lives in this Mac's shared `.git/hooks`; a push from any other surface never meets it. GitHub's own push protection meets every push, so the hosting check reads whether it is on. *(v1.0)*

## From the first run on main — 2026-09-25 (deep sweep of 34b1c52a)

10. **The deps check was narrower than GitHub's.** It read two npm lockfiles with dev dependencies left out; the moment Dependabot was switched on it reported advisories across every manifest, dev tooling included. The hosting check now reads Dependabot's open alerts too, weighted the way the npm check is — a runtime critical is high, a runtime high is medium, development is at most medium — so the gate fails on what can reach a reader and still names the rest. *(v1.1)*

- run · 2026-09-25 · v0 · hand-run history scan, before the Sentry had a page · taught items 1–9
- run · 2026-09-25 · v1.0 · deep sweep of 34b1c52a, 7 raised, held locally · nothing new
- run · 2026-09-25 · v1.1 · public-surface gate of 2b3922f1, 11 raised, held locally · nothing new
