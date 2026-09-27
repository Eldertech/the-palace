---
title: Map Build Ceremony
type: meta
pillars:
  - tools
  - practice
born: 2026-03
stage: growing
version: "2.4"
links:
  - target: "[[Palace Ceremonies]]"
    type: connects-to
  - target: "[[Swarm Weave]]"
    type: enables
  - target: "[[Palace Map]]"
    type: spawned
  - target: "[[Enchanted Worker]]"
    type: enables
  - target: "[[Harvest Ceremony]]"
    type: connects-to
  - target: "[[Palace Enchantment]]"
    type: connects-to
---

# Map Build Ceremony

![[Map Build Ceremony — hero.png]]

> The palace is a graph. The Map Build Ceremony makes that graph explicit — an edge list, a node registry, and a typed ghost manifest, built from frontmatter alone and placed where every enchanted agent can load it.

**Trigger:** `"Let's build the map"` / `"Map build"` / `"Build a neighborhood map for [X]"`

---

## Contract

| | |
|---|---|
| **Precondition** | Palace is accessible via filesystem. At least 5 entries exist. |
| **Postcondition** | A map file exists in `_ops/maps/` with a stamped filename; its `meta` carries the node, edge and ghost counts and names every forward ghost. The run's line is appended to [[Map Build Ceremony — tuning]], carrying the version and the counts, and the body of the commit that carries it says what the run taught the ceremony ("nothing" is a legal answer). |
| **Does not do** | Read entry bodies. Propose link changes. Modify existing entries. |
| **Produces** | An edge list (TSV default), bidirectional adjacency list, or JSON depending on scope and format request. |

---

## Modes

**Full Survey** — reads the frontmatter of every `.md` in the palace. Builds the complete edge list. Used for: pre-swarm context loading, palace-wide Enchantment, JEWEL updates.

**Bounded Survey** — scans only entries whose frontmatter contains a matching `neighborhood:` or `cluster:` field. Used for: neighborhood swarm sessions, focused enchantment runs, partial map export for external tools.

Bounded surveys self-define: the ceremony does not need to be told where the bounds are. It reads them from the palace itself.

---

## Steps

**1. Orient**

Open with the tail read of [[Map Build Ceremony — tuning]] ([[SCHEMA — Reference]] §6). Those are this build's first candidates for a spec change.

Receive scope: `full`, `neighborhood:[name]`, or a list of entry filenames. Determine output format:
- `tsv` — default; lightest; one triple per line
- `adjacency` — human-readable; one node per line with bidirectional edges
- `json` — machine-readable; full schema with meta, nodes, edges, ghost taxonomy

**2. Scan**

Read frontmatter only from every entry in scope. **Never open entry bodies.** Collect:
- Entry ID (filename without `.md`) of every file whose frontmatter carries a canon `type` ([[SCHEMA]] §1) → the nodes, `_ops/` ceremony cards included (directly in `_ops/` or one folder down), outside the machinery and vendored folders the builder skips
- Entry ID of every other `.md` — bundle files, materials, `_ops/` cards without a canon type → a file target (not mapped, used for ghost classification)
- Entry type and neighborhood field
- All typed link targets from the `links:` array

Frontmatter is read as YAML, the way [[STIGMERGY]] reads it, so the map and PULSE agree on what is canon. A file whose frontmatter will not parse is not a node; the map names it in `meta.yaml_errors`, so it gets fixed rather than silently dropped.

This step is fast. Frontmatter is 20–40 lines per file. A 100-entry palace completes in seconds.

**3. Extract**

Before parsing links, **filter out any target that begins with `http://` or `https://`**. External URLs are not palace nodes and must not appear as ghost entries.

Parse remaining typed links into triples: `(source, relation, target)`.

For each `links:` entry in a file's YAML:
```yaml
links:
  - target: "[[Hilaritas]]"
    type: drives
```
Produces: `Striatum  drives  Hilaritas`

**4. Compile**

Build:
- **Edge list** — all `(source, relation, target)` triples
- **Node registry** — every canon entry found in Step 2
- **Ghost manifest** — typed by category (see below)

### Ghost Taxonomy

Every target that is not a node is a ghost. But not all ghosts are the same. Classify each one:

**`error_ghost`** — A target whose name matches an existing entry title under case-insensitive comparison. The entry exists; the link is broken. These require immediate correction.

Example: target `Four Pillars` when `FOUR PILLARS.md` exists → `error_ghost`.

**`file_ghost`** — A target whose name matches a file in the palace that is not a node: a bundle file, a frontmatter-less material, an `_ops/` card without a canon type. The file exists; the link is valid.

Example: target `SCHEMA — Context` when `SCHEMA/SCHEMA — Context.md` exists → `file_ghost`.

**`forward_ghost`** — A target with no match anywhere in the palace. The entry does not yet exist. This is forward tension made visible — the organism reaching toward something not yet written.

Example: target `Resonance and Damping` with no corresponding file → `forward_ghost`.

Report all three categories separately. Only forward ghosts are entries not yet written. `error_ghosts` should be flagged for immediate correction. `file_ghosts` are informational — they confirm valid links, no action needed.

**5. Format**

Write output in requested format.

TSV (default):
```
source	relation	target
Striatum	drives	Hilaritas
Hilaritas	grounds	FOUR PILLARS
LateralAccess	enables	ObliquePortraitMethod
```

Adjacency list (default — outgoing only):
```
Striatum: drives:Hilaritas, seeds:Rhythm
Hilaritas: grounds:FOUR PILLARS, resonates:Spinoza
```

Adjacency list (bidirectional — use when agents need self-location):
```
Striatum: out[drives:Hilaritas, seeds:Rhythm] in[deepens:FOUR PILLARS]
Hilaritas: out[grounds:FOUR PILLARS, resonates:Spinoza] in[drives:Striatum]
```

The default outgoing-only format is the most token-efficient (~half the size of bidirectional) and sufficient for most uses. Use the bidirectional format when spawned agents need to answer "who points at me?" without scanning the full edge list — primarily for swarm self-location and hub detection.

JSON:
```json
{
  "meta": {
    "generated": "2026-03-27",
    "scope": "full",
    "node_count": 94,
    "edge_count": 544,
    "yaml_errors": [],
    "ghost_taxonomy": {
      "error_ghosts": [{"source": "Hilaritas Generator", "target": "Four Pillars", "resolves_to": "FOUR PILLARS"}],
      "file_ghosts": ["SCHEMA — Context"],
      "forward_ghosts": [{"target": "Resonance and Damping", "sources": ["Differential Equations"]}]
    }
  },
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

Each JSON node carries `use` and `last_used` — how the entry is being used, computed from git by `_ops/swarm/entry-use.py`: days its page was edited, days its bundle was edited, and entries that formed a link to it, all-time and over the last 90 days ([[SCHEMA — Reference]] §3). The builder computes them; nothing is read from frontmatter.

**6. Place**

Write map file to `/Users/loudonstearns/Documents/The Palace/_ops/maps/` (create directory if absent):

- Full survey: `palace-map-full-YYYY-MM-DD.tsv` (or `.json`)
- Bounded: `palace-map-[neighborhood]-YYYY-MM-DD.tsv` (or `.json`)

**7. Register**

Append the run's line to the end of [[Map Build Ceremony — tuning]] (SCHEMA — Reference §6), with the counts in the slot for what it ran on:

```
- run · YYYY-MM-DD · v<version> · <scope>, <N> nodes, <E> edges, <G> forward ghosts · nothing new
```

(`taught item N` in place of `nothing new` when the run changed the ceremony.) The forward ghosts themselves are named in the map file's `meta.ghost_taxonomy`, so tracking persistence is a read of the last three maps in `_ops/maps/`: a ghost present in all three is a deposit candidate.

Append only — the opening tail read is the only read of the ledger this ceremony makes.

---

## Output Token Budget

For context loading guidance:

| Palace size | TSV size (est.) | Adjacency (outgoing) | Adjacency (bidirectional) | JSON size (est.) |
|---|---|---|---|---|
| 50 nodes, 4 avg links | ~8KB | ~5KB | ~9KB | ~15KB |
| 100 nodes, 4 avg links | ~16KB | ~9KB | ~18KB | ~28KB |
| 200 nodes, 4 avg links | ~32KB | ~18KB | ~36KB | ~55KB |

The outgoing adjacency list is recommended for Tier 1 agent context loading — human-readable, and slightly smaller than TSV. Use bidirectional adjacency when spawned agents need hub/self-location awareness. JSON for programmatic use by coordinators and workers.

---

## Relationship to Other Ceremonies

**[[Harvest Ceremony]]** — the Map Build is a natural close step after a Harvest session when new entries have been deposited. A post-harvest map ensures agents launched after the session have current topology. Consider adding as an optional Harvest close step.

**[[Swarm Weave]]** — the coordinator loads the relevant map before dispatch. The map is how the coordinator builds its dispatch plan without reading entry bodies. The Map Build Ceremony produces the artifact the Swarm Weave loads.

**[[Palace Enchantment]]** — enchanted agents receive the map as Tier 1 context. The map tells them where they are in the organism before they read their first neighbor.

---

## Forward Vectors

- Should map generation be triggered automatically at Harvest close, making it a required step rather than a separate ceremony?
- Ghost persistence tracking: each map file names its forward ghosts in `meta.ghost_taxonomy`. A ghost appearing in three consecutive maps is a deposit candidate. Should a ceremony step or a separate Spore Check variant surface these automatically?
- Should the ceremony produce a diff against the previous map — what edges were added, what ghost nodes appeared or resolved — making the palace's growth arc visible over time?
- Weighted maps: nodes now carry `use` (page, bundle and link activity from git), which could weight edges so well-traveled links appear stronger. Useful for swarm dispatch prioritization?

---

*The version and what each build taught the ceremony: [[Map Build Ceremony — tuning]].*
