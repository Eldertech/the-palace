---
title: "Schema Ceremony Proposal — exemplifies + member-of"
type: meta
pillars:
  - tools
  - practice
born: 2026-05-28
stage: seed
status: active
links:
  - target: "[[SCHEMA]]"
    type: connects-to
    label: proposes-amendment-to
  - target: "[[Palace To-Do]]"
    type: connects-to
    label: carried-decision
  - target: "[[Palace Audit — 2026-05-28]]"
    type: emerged-from
    label: surfaced-by-the-audit
forward_vector: "I am a proposal awaiting Loudon's yes/no, not an executed change. I hold the rationale and the cost so the decision can be made deliberately rather than reflexively. When Loudon decides, I either become the record of a Schema Ceremony or I compost."
---

# Schema Ceremony Proposal — `exemplifies` + `member-of`

> **STATUS: APPROVED & EXECUTED 2026-05-28 (v1.8).** Loudon approved ("make this Schema change"). Both types are now canonical: the 98 `connects-to`+label links were re-converted to typed links, and SCHEMA §4, CLAUDE.md, ROSETTA, and the Substrate Skill link ontology were updated. Reciprocity resolved as inbound-only (no forced `has-member`/`exemplified-by` on hubs — the Map computes inbound degree). This document is retained as the ceremony's rationale record.

## The proposal

Ratify two new canonical link types in [[SCHEMA]] §4:

| Link Type | Direction | Meaning | When to use |
|---|---|---|---|
| `exemplifies` | directed A→B | A is a concrete instance of the more general B | When an entry is a worked example/case of a principle, framework, or pattern. |
| `member-of` | directed A→B | A belongs to a named collection, family, or registry B | When an entry is a catalogued member of a set (a person in a library, a bridge in a family). |

This is an **additive, MINOR** change (no existing type removed) → version would go **1.7 → 1.8**.

## Evidence (why these, why now)

After the audit normalized all non-canonical frontmatter types to `connects-to` + `label`, the two most common labels in the entire palace are, by a wide margin:

- `exemplifies` — **50 uses**
- `member-of` — **48 uses**

The next-most-common label is `instruments`/`informs` at **12**. These two registers are **~4× more frequent than any other label** — they are de-facto canonical vocabulary already, currently wearing a `connects-to` disguise.

**They fill a real gap.** The current eight types (`connects-to`, `mirrors`, `enables`, `deepens`, `spawned`, `emerged-from`, `contradicts`, `couples-with`) carry resonance, causation, lineage, and tension — but none carries **taxonomy**: *instance-of* and *membership*. Observed usage is overwhelmingly taxonomic and hub-directed:
- `exemplifies` → mostly entries pointing at `[[FOUR PILLARS]]` ("this bridge is a concrete instance of a Pillar principle").
- `member-of` → mostly People pointing at `[[Source Library]]`, and entries pointing at `[[FOUR PILLARS]]` ("this person is a catalogued member of the library").

A `connects-to` between a person and the Source Library is true but uninformative; `member-of` states the actual structural relation and lets a future Weave/Map treat collection membership as first-class topology.

## The cost (read before approving)

1. **It partly reverses the audit's own normalization.** The audit converted ~98 typed links (`exemplifies` + `member-of`) to `connects-to` + label. Ratifying means converting them **back** to `type: exemplifies` / `type: member-of` across ~98 files. Mechanical, but real churn, and it should be one clean ceremony commit — *not* folded into the audit's commits.
2. **Ontology inflation.** SCHEMA §4 warns: "Inflation cheapens all existing types. When in doubt, use `connects-to`." Going 8→10 is a 25% expansion of the semantic vocabulary. The bar is "does this carry a distinction the existing types genuinely cannot." (Argument above: yes — taxonomy.)
3. **Reciprocity question.** Both are directed A→B. The hub side (FOUR PILLARS, Source Library) currently has no reciprocal `has-member` / `exemplified-by`. Decide whether hubs should carry the inverse, or whether inbound-only is fine (the Map already computes inbound degree).

## Steps to execute IF approved (SCHEMA §5)

1. ✅ Propose with rationale (this document).
2. Review for breakage: confirm no entry depends on these being `connects-to` (they don't — label is preserved either way).
3. Update `SCHEMA.md` §4 link table (+2 rows) and the §4 "Adding a new link type" note.
4. Bump version `1.7 → 1.8` in `SCHEMA.md` and `CLAUDE.md` (MINOR/additive).
5. Update `ROSETTA.md` if the link ontology is mirrored there.
6. Update `_ops/Substrate Skill.md` if it enumerates link types.
7. Re-convert the ~98 `connects-to`+`label: exemplifies|member-of` links to typed links (`type: exemplifies|member-of`, drop the now-redundant label).
8. Git commit: `Schema Ceremony — add exemplifies + member-of link types — v1.8`.

## Recommendation

Lean **yes on both.** They express genuine taxonomic relations the ontology lacks, and at 50/48 uses they are already the palace's most-used registers — ratification describes reality rather than inventing vocabulary. But this is a deliberate expansion of the palace's semantic web and therefore Loudon's call, executed as its own ceremony commit, separate from the audit.

<!-- CLAUDE → LOUDON: your decision. Approve both / approve one / decline. If approve, also answer the reciprocity question in §cost.3. -->
