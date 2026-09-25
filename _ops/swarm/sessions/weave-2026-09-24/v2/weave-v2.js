export const meta = {
  name: 'palace-weave-2026-09-24-v2',
  description: 'Weave v2 connection pass with the fixed harness: walk, community and bridge workers propose links; nothing written',
  phases: [
    { title: 'Walk', detail: 'lifecycle lens, reach-based targets' },
    { title: 'Community', detail: 'connection pass across 12 sub-communities' },
    { title: 'Bridge', detail: 'tool x thought, 10 rooms' },
  ],
}

const ROOT = '/Users/loudonstearns/Documents/palace-weave-2026-09-24'
const S = ROOT + '/_ops/swarm/sessions/weave-2026-09-24/v2'
const PHASE = { lifecycle: 'Walk', folder: 'Folder', community: 'Community', bridge: 'Bridge' }

const REL = { type: 'object', properties: {
  source: {type:'string'}, target: {type:'string'}, type: {type:'string'}, label: {type:'string'},
  kind: {type:'string', description:'new | contradiction | retype | newcomer | inbound-walk | bridge | flag'},
  current_type: {type:'string'}, rationale: {type:'string'},
  evidence: {type:'string', description:'short quoted line(s) from the page(s) that carry it'},
  spark: {type:'integer', description:'1-5 surprise; bridge and gems'},
  deep_pattern: {type:'string'} }, required: ['source','target','type','rationale'] }

const SCHEMA = { type: 'object', properties: {
  cluster: {type:'string'}, lens: {type:'string'},
  members_read: {type:'array', items:{type:'string'}},
  typed_relations: {type:'array', items: REL},
  unsung_paths: {type:'array', items:{type:'object', properties:{entry:{type:'string'}, phrase:{type:'string'}, target:{type:'string'}, type:{type:'string'}, label:{type:'string'}, structurally_significant:{type:'boolean'}}, required:['entry','target','type']}},
  entry_health_flags: {type:'array', items:{type:'object', properties:{entry:{type:'string'}, stage_current:{type:'string'}, stage_proposed:{type:'string'}, vector_issue:{type:'string'}, graffiti_note:{type:'string'}, face:{type:'string', description:'merits-face | retire-face | none'}}, required:['entry']}},
  walk_results: {type:'array', items:{type:'object', properties:{target:{type:'string'}, disposition:{type:'string', description:'wired | link | merge | compost | nothing-genuine'}, inbound_proposed:{type:'integer'}, note:{type:'string'}}, required:['target','disposition']}},
  coherence_findings: {type:'array', items:{type:'object', properties:{kind:{type:'string'}, entries:{type:'array', items:{type:'string'}}, issue:{type:'string'}, proposed_action:{type:'string'}}, required:['issue']}},
  open_question_resolutions: {type:'array', items:{type:'object', properties:{entry:{type:'string'}, question:{type:'string'}, verdict:{type:'string'}, by_entry:{type:'string'}, proposed_action:{type:'string'}}, required:['entry','verdict']}},
  merge_candidates: {type:'array', items:{type:'object', properties:{absorb:{type:'string'}, into:{type:'string'}, survives_as_subsection:{type:'string'}, rationale:{type:'string'}}, required:['absorb','into','rationale']}},
  compost_candidates: {type:'array', items:{type:'object', properties:{entry:{type:'string'}, rationale:{type:'string'}, nutrients_to:{type:'array', items:{type:'string'}}}, required:['entry','rationale']}},
  demote_candidates: {type:'array', items:{type:'object', properties:{file:{type:'string'}, disposition:{type:'string', description:'demote-to-bundle | link | keep'}, rationale:{type:'string'}}, required:['file','disposition']}},
  bridge_findings: {type:'array', items:{type:'object', properties:{tool:{type:'string'}, thought:{type:'string'}, quote_tool:{type:'string'}, quote_thought:{type:'string'}, shared_structure:{type:'string'}, fidelity_test:{type:'string'}, spark:{type:'integer'}, classify:{type:'string', description:'link | deposit | none'}, proposed_type:{type:'string'}, deep_pattern:{type:'string'}}, required:['tool','thought','shared_structure','spark','classify']}},
  flag_responses: {type:'array', items:{type:'object', properties:{flag:{type:'string'}, verdict:{type:'string', description:'confirm | refuse | refine'}, proposed_change:{type:'string'}}, required:['flag','verdict']}},
  synthesis_spawn_flag: {type:'array', items:{type:'object', properties:{crossing_entries:{type:'array', items:{type:'string'}}, unnamed_idea:{type:'string'}, why_load_bearing:{type:'string'}}, required:['unnamed_idea']}},
  summary: {type:'string'} }, required: ['cluster','lens','summary'] }

const COMMON = `You are a Palace Multi-Lens Weave worker. You PROPOSE; you write NOTHING and edit no file. The palace root for reading is ${ROOT} (find entries by the paths given; Glob **/*.md if one moved).

Your room file: ${S}/rooms/{{FILE}}. Read it first — it lists your entries with path, stage and current inbound count.
Newcomers and the unreachable (priority citizens; only a weave can wire their inbound links): read ${S}/new-entries-block.md. For any entry you read, consider whether it should point AT one of them — generously, but only genuine links.

SCHEMA §4 link types (use only these): connects-to (symmetric default; a label makes it specific) · mirrors (same pattern, different material) · enables (A→B: A is a precondition for B) · deepens (A→B: A elaborates B; B is the ground) · spawned (A→B: A produced B) · emerged-from (A→B: A grew from B) · contradicts (symmetric productive tension) · couples-with (symmetric co-activation) · exemplifies (A→B: A is an instance of the more general B) · member-of (A→B: A belongs to collection B). Direction invariant: lineage/taxonomy links point BACK to their ground (deepens, emerged-from, exemplifies, member-of); only spawned and enables point forward; a hub never emits member-of. Read each directed link aloud "source → type → target"; if contestable, use connects-to + label. Labels: lower-case, one word or hyphenated, evocative.

Rules of judgment: a null result is a valid answer — no quotas, ever. Genuine relationships only; a link you had to force is not a find. Contradictions are generative — hunt missing \`contradicts\`. Depth over coverage. When you name evidence, quote a short line from the page. Do not touch ghost links, faces-as-rendering, or linter matters beyond noting them.
Core tasks (every lens): (1) propose typed relations (new, contradiction, retype); (2) unsung paths — body prose that already names a known entry with no frontmatter link.

HARNESS (v2 — read this twice). First read ${ROOT}/SCHEMA.md (the palace's type card; you stay a child otherwise).
1. BOTH PAGES FIRST. Your room file lists every entry's existing_links in both directions. Before proposing ANY link, check both pages' existing links (room file, then the pages' own frontmatter). If the pair is already linked in ANY type, do not propose it again — if the existing type is wrong, propose a retype (kind "retype", current_type set) and say why.
2. SYMMETRIC LINKS HOLD BOTH WAYS. connects-to, mirrors, contradicts and couples-with need writing on one side only; the reverse copy is a duplicate, never a find.
3. FIDELITY TEST ON EVERY RELATION. Swap in a different partner from the room; if your reason still reads true, it is too generic — drop it. Quote the line(s) that carry the link in "evidence".
4. A person's stage tracks palace citizenship (dispatch, enchantment), not the richness of the dossier (SCHEMA §1). Don't propose person stage changes on body richness.
Scope for this pass: CONNECTIONS ONLY — typed relations and unsung paths (and bridge findings on the bridge lens). Leave merges, compost, demotions, open questions and health flags empty; a folder pass already covered them this morning.`

const CLUTTER = `Loudon said this morning the palace feels "good but cluttered". Weigh the exhale seriously: merge (fold one entry into a subsection of another), compost (let a thin, neighbourless entry go), demote (working substrate wearing entry frontmatter → a bundle file). Bias toward de-sprawl — but only where it is genuinely right; a merge that destroys a distinct idea is harm.`

const LENS = {
  lifecycle: `LENS: lifecycle — THE WALK. Your room lists TARGETS (under-reached newcomers and entries nothing points to), each with a walk: hop1 (direct neighbours) and hop2 (capped second ring). Read each target's full body. For walk candidates read ONLY the frontmatter plus the first ~40 lines (use Read with limit). Follow edges; don't survey.
For each target, walk hop1 then hop2 and at each stop ask: would this entry's reader want to be sent to the target? If yes, propose an INBOUND link (kind "inbound-walk") placed in the NEIGHBOUR's frontmatter (source = neighbour, target = the target), with type and direction per §4. Then give a walk_results row per target: disposition wired (you proposed genuine inbound) | link | merge | compost (for a target no one should point to) | nothing-genuine. `,
  folder: `LENS: folder — hold the WHOLE family at once. Pool-2 tasks:
COHERENCE AUDIT: shared vocabulary/tier consistency, roster or recipe gaps, house-standard drift, naming — things visible only across the family (coherence_findings).
OPEN-QUESTION CROSS-RESOLUTION: read every member's Open Questions / Forward Vectors tail; per question: answered-elsewhere | progressed | should-act | still-open, naming the sibling that resolves or advances it.
MERGE / COMPOST / DEMOTE candidates. ${CLUTTER}
Read frontmatter of all members; bodies of the load-bearing ones; the tails of all.`,
  community: `LENS: community — a topological neighbourhood that cuts across folders. The core relation task IS your connection pass: find the cross-domain links the folders are blind to.
DIRECTED FLAGS: your room file may carry "directed_flags" — deposits asked specific entries in your room to do something. For each: confirm (propose the exact link/edit as a typed relation of kind "flag", or a coherence finding), refuse (with reason), or refine. Report each in flag_responses with the flag id.
Read frontmatter of all members; bodies of the load-bearing ones.`,
  bridge: `LENS: bridge — tool x thought. Your room holds tool-side entries (projects, specialists, makers, tools-pillar concepts) and thought-side entries (people, philosophy-pillar concepts), built in separate sessions, in separate vocabularies, by one mind. They have NEVER been linked. Hunt where a tool re-derives a philosophy, or a philosophy names what a tool does, without either knowing.
For each find (bridge_findings): quote the line from BOTH pages that carries it; name the shared structure in one sentence; run the FIDELITY TEST — swap in a different partner from the other side; if your reading doesn't change, the find is fake, drop it; rate spark 1-5; classify link | deposit (an unnamed crossing that wants its own entry) | none; propose the §4 type. Also add accepted links to typed_relations (kind "bridge").
Null is valid and EXPECTED in most pairings — most tools and most thinkers do not rhyme. Never propose merges or compost. Read every member's body; this lens needs the prose.`,
}

const OPS_NOTE = `EXTRA for the _ops family (ceremonies are now woven as nodes for the first time): five _ops files with canon frontmatter have NO inbound links — "Artifacts to Projects Migration — handoff", "Graffiti Pass — Handoff 2026-05-02 — Session 2", "Map Log", "Schema Ceremony Proposal — exemplifies + member-of", "Technical Diagram Standard". For each, a demote_candidates row: demote-to-bundle (working substrate: which entry's bundle?) | link (a real standard/ceremony wanting inbound — note README's body cites Technical Diagram Standard as a live standard) | keep. Also audit the ceremonies as a SYSTEM: do their cards agree with each other?`

const ITEMS = args

const results = await pipeline(ITEMS,
  (room) => {
    const file = `${room.lens}-${room.id}.json`
    let prompt = COMMON.replace('{{FILE}}', file) + '\n\n' + LENS[room.lens]
    if (room.id === 'F-_ops') prompt += '\n\n' + OPS_NOTE
    prompt += `\n\nReturn cluster="${room.id}", lens="${room.lens}". Fill only the fields your lens uses; leave the rest empty arrays. Summary: one plain paragraph — what this room taught you.`
    return agent(prompt, { label: `${room.lens}:${room.id}`, phase: PHASE[room.lens], schema: SCHEMA, agentType: 'palace-reader', model: 'sonnet' })
  },
  (r, room) => {
    if (!r) return { room: room.id, lens: room.lens, failed: true }
    const n = (k) => (r[k] || []).length
    return { room: room.id, lens: room.lens, relations: n('typed_relations'), unsung: n('unsung_paths'), health: n('entry_health_flags'),
      walk: n('walk_results'), merges: n('merge_candidates'), compost: n('compost_candidates'), demote: n('demote_candidates'),
      bridge: n('bridge_findings'), flags: n('flag_responses'), spawns: n('synthesis_spawn_flag'), oq: n('open_question_resolutions') }
  })

const failed = results.filter(x => !x || x.failed)
log(`${results.length - failed.length}/${results.length} rooms returned` + (failed.length ? `; failed: ${failed.map(f => f && f.room).join(', ')}` : ''))
return results
