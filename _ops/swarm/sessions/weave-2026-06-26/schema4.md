## 4. The Typed Link Ontology

Links in YAML frontmatter are **curated and intentional** — the major neural tracts of the palace. Body text `[[wiki links]]` are casual and abundant. The distinction matters: frontmatter links are the semantic web; body links are the conversational fabric.

**Body-text link convention:** Any explicit mention of a known entry by its canonical title should use `[[wikilink]]` syntax in the body — this is especially important in structurally significant locations: Cross-Domain Resonance section headers, bold conceptual terms, and sentence-level references that name the connection explicitly. When a body-text `[[wikilink]]` appears in a structurally significant location, it should also have a corresponding YAML frontmatter link. Body mentions that are passing or historical do not require YAML registration, but should still use wikilink syntax so the Weave's Tier 1 audit can see them and make a deliberate inclusion/exclusion call.

Use only these relationship types:

| Link Type | Direction | Meaning | When to use |
|---|---|---|---|
| `connects-to` | symmetric | General proximity | Default. Use when the relationship is real but not yet named more precisely. With a `label`, this becomes a permanent named class — not a draft placeholder but a fully specified relationship carrying both topology and semantic register. |
| `mirrors` | symmetric | Deep structural identity across domains | When two things are the same pattern in different material. |
| `enables` | directed A→B | A is a precondition or generative force for B | When B could not exist or be understood without A. |
| `deepens` | directed A→B | A is a more developed articulation of B | When A extends or elaborates B (the more foundational idea) without replacing it. The source elaborates; the target is the ground. |
| `spawned` | directed A→B | A directly produced B as output | For traceable lineage: this session produced this entry. |
| `emerged-from` | directed A→B | A crystallized from B through synthesis | When A grew from B (the origin) but the relationship is diffuse, not direct. |
| `contradicts` | symmetric | Productive tension | Blake's contraries: both true, generative friction between them. |
| `couples-with` | symmetric | Mutual reinforcement, co-activation | Ideas always active together; Kuramoto-style coupling. |
| `exemplifies` | directed A→B | A is a concrete instance of the more general B | When an entry is a worked example or case of a principle, framework, or pattern (e.g. a Bridge → [[FOUR PILLARS]]). |
| `member-of` | directed A→B | A belongs to a named collection, family, or registry B | When an entry is a catalogued member of a set (e.g. a person → [[Source Library]]). |

**Directionality invariant.** For the lineage and taxonomy links, the source points *back toward its ground*: `deepens` → the more foundational idea it elaborates · `emerged-from` → the origin it grew from · `exemplifies` → the class it instances · `member-of` → the set it belongs to. Only `spawned` (origin → product) and `enables` (precondition → enabled) point *forward*. A collection/hub never emits `member-of` at its own members — membership is declared on the member side; the Map computes the hub's inbound degree. When unsure which way a directed link points, read it aloud as `source → type → target` and check the arrow; if it is still contestable, use `connects-to` + label rather than guess a directed type.

**The `label` field:** Each link object may carry an optional `label` — a single word or hyphenated phrase naming the relationship's specific register. The `type` handles topological traversal and ceremony linting; the `label` carries the semantic compression that makes a link generative rather than merely classificatory. A `mirrors` link may mirror in the register of `rhymes-with`, `echoes`, `refracts`, or `shadows` — these are not synonyms. A `contradicts` link may contradict in the register of `argues-with-love`, `mourns`, `refuses`, or `breaks-open`. Label vocabulary: lower-case, evocative over clinical, single word or hyphenated phrase. Suggested vocabulary per family lives in [[Resonant Link Labels]]. New labels never require ceremony.

**Adding a new link type** requires a Schema Ceremony. The link ontology is the palace's semantic vocabulary. Inflation cheapens all existing types. When in doubt, use `connects-to` and differentiate in a later Weave.

**Schema Ceremony rationale (2026-05-28, v1.8): added `exemplifies` + `member-of`.** The 2026-05-28 audit normalized all non-canonical frontmatter types to `connects-to` + `label`; the two most-used labels by a wide margin were `exemplifies` (50) and `member-of` (48) — ~4× any other. They carry **taxonomy** (instance-of, set-membership) that the prior eight types — resonance, causation, lineage, tension — could not express, and they are predominantly hub-directed (entries → [[FOUR PILLARS]], people → [[Source Library]]). Ratification describes existing reality rather than inventing vocabulary. Both are directed A→B with no forced reciprocal on the hub side (the Map computes inbound degree). Full rationale + cost: [[Schema Ceremony Proposal — exemplifies + member-of]].

**Schema Ceremony rationale (2026-06-05, v1.9): corrected `deepens` / `emerged-from` directionality wording.** The prior table wording was *reversed* relative to actual usage and the README: it read "B (target) is the more developed articulation" for `deepens` and "B crystallized from A" for `emerged-from`, but the dominant usage (174 `deepens` + 102 `emerged-from` edges) and the README examples ("the hyperdimensional prism deepens the four pillars"; "Symbiotic Skills emerged from the four pillars") both put the **source** as the derived/elaborating end and the **target** as the ground. Evidence: foundational primitives are repeated `deepens` *targets* — Spinoza Conatus alone receives `deepens` from Cooperation Yields Agency, Deleuze, Entry Conatus, Linear Predictive Coding. The contradiction had already produced 9 reciprocal-direction pairs (A deepens B *and* B deepens A) in the live graph, all resolved in this ceremony. The fix canonizes the dominant reading (minimal churn) and makes `spawned`/`emerged-from` a clean reciprocal pair consistent with §6. This describes existing reality rather than inventing it. No link type added or removed.

---

## 5. Schema Change Protocol (The Schema Ceremony)
