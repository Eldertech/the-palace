---
title: Map Build Ceremony
type: meta
pillars:
  - tools
  - practice
born: 2026-03
last_activated: 2026-06-16
activation_count: 8
stage: growing
version: 2
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
| **Postcondition** | A map file exists in `_ops/maps/` with a stamped filename. A one-line record is appended to `_ops/Map Log.md`. `last_activated` and `activation_count` are updated on this file and on `Palace Map.md`. |
| **Does not do** | Read entry bodies. Propose link changes. Modify existing entries (other than self-update). |
| **Produces** | An edge list (TSV default), bidirectional adjacency list, or JSON depending on scope and format request. |

---

## Modes

**Full Survey** — scans every `.md` file in the palace root. Builds the complete edge list. Used for: pre-swarm context loading, palace-wide Enchantment, JEWEL updates.

**Bounded Survey** — scans only entries whose frontmatter contains a matching `neighborhood:` or `cluster:` field. Used for: neighborhood swarm sessions, focused enchantment runs, partial map export for external tools.

Bounded surveys self-define: the ceremony does not need to be told where the bounds are. It reads them from the palace itself.

---

## Steps

**1. Orient**

Receive scope: `full`, `neighborhood:[name]`, or a list of entry filenames. Determine output format:
- `tsv` — default; lightest; one triple per line
- `adjacency` — human-readable; one node per line with bidirectional edges
- `json` — machine-readable; full schema with meta, nodes, edges, ghost taxonomy

**2. Scan**

Read frontmatter only from every entry in scope. **Never open entry bodies.** Collect:
- Entry ID (filename without `.md`) from **palace root** → these are the known nodes
- Entry ID from **`_ops/`** → these are known ops nodes (not mapped, but used for ghost classification)
- Entry type and neighborhood field
- All typed link targets from the `links:` array

Ops entries (`_ops/*.md`) are valid targets and are part of the palace. They are not mapped as nodes in the graph but must be recognized as existing entries during ghost detection.

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
- **Node registry** — all entries observed as sources or targets that exist in the palace root
- **Ghost manifest** — typed by category (see below)

### Ghost Taxonomy

Every target that does not exist as a palace root entry is a ghost. But not all ghosts are the same. Classify each one:

**`error_ghost`** — A target whose name matches an existing entry title under case-insensitive comparison. The entry exists; the link is broken. These require immediate correction.

Example: target `Four Pillars` when `FOUR PILLARS.md` exists → `error_ghost`.

**`ops_ghost`** — A target whose name matches an `_ops/` entry filename (without `.md`). The entry exists in ops; the link is valid but the ceremony's root scan made it invisible.

Example: target `Harvest Ceremony` when `_ops/Harvest Ceremony.md` exists → `ops_ghost`.

**`forward_ghost`** — A target with no match anywhere in the palace. The entry does not yet exist. This is forward tension made visible — the organism reaching toward something not yet written.

Example: target `Resonance and Damping` with no corresponding file → `forward_ghost`.

Report all three categories separately. Only `forward_ghosts` belong in the `ghost_nodes` field of the map output. `error_ghosts` should be flagged for immediate correction. `ops_ghosts` are informational — they confirm valid links, no action needed.

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
    "ghost_taxonomy": {
      "error_ghosts": [{"target": "Four Pillars", "resolves_to": "FOUR PILLARS"}],
      "ops_ghosts": ["Harvest Ceremony", "Weave Ceremony"],
      "forward_ghosts": ["Resonance and Damping", "Donella Meadows"]
    }
  },
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

**6. Place**

Write map file to `/Users/loudonstearns/Documents/The Palace/_ops/maps/` (create directory if absent):

- Full survey: `palace-map-full-YYYY-MM-DD.tsv` (or `.json`)
- Bounded: `palace-map-[neighborhood]-YYYY-MM-DD.tsv` (or `.json`)

**7. Register**

Append a one-line record to `_ops/Map Log.md` (create file if absent):

```
| YYYY-MM-DD | [scope] | [format] | [node_count] nodes | [edge_count] edges | [forward_ghost_count] forward ghosts | [forward_ghost_names] |
```

The final column stores the names of all `forward_ghost` nodes as a comma-separated list. This enables persistence tracking across map generations — a ghost that appears in three consecutive log entries is a deposit candidate.

Do not read the log to do this — append only.

**8. Self-Update**

Update `last_activated` (to today's date) and increment `activation_count` in:
- This file (`Map Build Ceremony.md`)
- `Palace Map.md`

This keeps the palace self-model current. The ceremony is not complete until these fields are written.

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
- Ghost persistence tracking: the Map Log now records forward ghost names. A ghost appearing in three consecutive entries is a deposit candidate. Should a ceremony step or a separate Spore Check variant surface these automatically?
- Should the ceremony produce a diff against the previous map — what edges were added, what ghost nodes appeared or resolved — making the palace's growth arc visible over time?
- Weighted maps: activation_count and energy fields could produce edge weights, making a weighted graph where well-traveled links appear stronger. Useful for swarm dispatch prioritization?
