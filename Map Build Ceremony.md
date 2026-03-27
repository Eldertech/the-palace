---
title: Map Build Ceremony
type: meta
pillars:
  - tools
  - practice
born: 2026-03
last_activated: 2026-03
activation_count: 1
stage: seed
version: 1
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
---

# Map Build Ceremony

> The palace is a graph. The Map Build Ceremony makes that graph explicit — an edge list, a node registry, and a ghost node manifest, built from frontmatter alone and placed where every enchanted agent can load it.

**Trigger:** `"Let's build the map"` / `"Map build"` / `"Build a neighborhood map for [X]"`

---

## Contract

| | |
|---|---|
| **Precondition** | Palace is accessible via filesystem. At least 5 entries exist. |
| **Postcondition** | A map file exists in `/palace/maps/` with a stamped filename. A one-line record is appended to `Map Log.md`. |
| **Does not do** | Read entry bodies. Propose link changes. Modify existing entries. |
| **Produces** | An edge list (TSV default), adjacency list, or JSON depending on scope and format request. |

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
- `adjacency` — human-readable; one node per line with all targets
- `json` — machine-readable; full schema with meta, nodes, edges, ghost_nodes

**2. Scan**

Read frontmatter only from every entry in scope. **Never open entry bodies.** Collect:
- Entry ID (filename without `.md`)
- Entry type and neighborhood field
- All typed link targets from the `links:` array

This step is fast. Frontmatter is 20–40 lines per file. A 100-entry palace completes in seconds.

**3. Extract**

Parse typed links into triples: `(source, relation, target)`.

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
- **Node registry** — all entries observed as sources or targets
- **Ghost nodes** — any target referenced in a link whose filename does not exist in the palace. These are entries the graph has already named but the palace has not yet written.

Ghost nodes are not errors. They are forward tension made visible. They go in the map's `ghost_nodes` field.

**5. Format**

Write output in requested format.

TSV (default):
```
Striatum	drives	Hilaritas
Hilaritas	grounds	FourPillars
LateralAccess	enables	ObliquePortraitMethod
```

Adjacency list:
```
Striatum: drives:Hilaritas, seeds:Rhythm
Hilaritas: grounds:FourPillars, resonates:Spinoza
```

JSON:
```json
{
  "meta": {
    "generated": "2026-03-26",
    "scope": "full",
    "node_count": 47,
    "edge_count": 183,
    "ghost_nodes": ["Oscillator", "NeuralTiming", "Conatus"]
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
| YYYY-MM-DD | [scope] | [format] | [node_count] nodes | [edge_count] edges | [ghost_count] ghosts |
```

Do not read the log to do this — append only.

---

## Output Token Budget

For context loading guidance:

| Palace size | TSV size (est.) | JSON size (est.) | Tokens (est.) |
|---|---|---|---|
| 50 nodes, 4 avg links | ~8KB | ~15KB | ~2,000–4,000 |
| 100 nodes, 4 avg links | ~16KB | ~28KB | ~4,000–7,000 |
| 200 nodes, 4 avg links | ~32KB | ~55KB | ~8,000–14,000 |

TSV is recommended for Tier 1 agent context loading. JSON for programmatic use by coordinators and workers.

---

## Relationship to Other Ceremonies

**[[Harvest Ceremony]]** — the Map Build is a natural close step after a Harvest session when new entries have been deposited. A post-harvest map ensures agents launched after the session have current topology. Consider adding as an optional Harvest close step.

**[[Swarm Weave]]** — the coordinator loads the relevant map before dispatch. The map is how the coordinator builds its dispatch plan without reading entry bodies. The Map Build Ceremony produces the artifact the Swarm Weave loads.

**[[Palace Enchantment]]** — enchanted agents receive the map as Tier 1 context. The map tells them where they are in the organism before they read their first neighbor.

---

## Forward Vectors

- Should map generation be triggered automatically at Harvest close, making it a required step rather than a separate ceremony?
- Ghost node tracking across map generations: a ghost that persists through three map cycles becomes a deposit candidate. Can the Map Log record ghost persistence, making this trackable?
- Should the ceremony produce a diff against the previous map — what edges were added, what ghost nodes appeared or resolved — making the palace's growth arc visible over time?
- Weighted maps: activation_count and energy fields could produce edge weights, making a weighted graph where well-traveled links appear stronger. Useful for swarm dispatch prioritization?
