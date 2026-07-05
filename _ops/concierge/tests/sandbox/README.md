# Concierge test sandbox — a throwaway mini-palace

This directory is a **disposable fake palace** used to test the Concierge companion — especially
the *writing* postures (curator) and the adversarial cases — **without ever touching real canon.**
When a test runs a posture, point the companion's `{{PALACE_ROOT}}` at *this* directory:

```
{{PALACE_ROOT}} = /Users/loudonstearns/Documents/The Palace/_ops/concierge/tests/sandbox
```

so every file it reads and every edit it writes stays inside the sandbox.

## The fixtures

Seven `Sandbox — *.md` entries form a small connected graph (a Kuramoto/synchronization cluster
plus a philosophy contradiction-pair and an adversarial entry). They carry real palace frontmatter
so the companion treats them as entries. **Each fixture has one or more deliberate defects planted
in it** — but the defects are *not* labelled in the files (so the companion cannot read the answer
key). The planted-defect map is the **answer key in `../TEST-BATTERY.md`**, which lives one level up,
*outside* `PALACE_ROOT`, so the companion never sees it.

## Resetting after a write test

The curator and adversarial tests mutate these files. Ground truth is git. After any run that
wrote to the sandbox, reset it:

```
git checkout -- "_ops/concierge/tests/sandbox/"
git clean -fd "_ops/concierge/tests/sandbox/"   # removes any file the companion CREATED
```

Reset **between** write tests so each starts from the same known state. Never let a companion's
edit to the sandbox get committed as if it were canon — the sandbox's committed state is the
pristine fixture, nothing else.

## Do not

- Do not add real canon here, and do not `[[wikilink]]` from real entries into `Sandbox — *`
  (the `Sandbox — ` title prefix keeps them out of the real namespace; keep it).
- Do not point a *real* tending pass at this directory, and do not point a sandbox test at the
  real palace root.
