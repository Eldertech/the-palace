export const meta = {
  name: 'palace-weave-batch',
  description: 'Weave Tier-1 batch: N palace workers run the 6-task structural audit, one per entry, parameterized via args',
  phases: [{ title: 'Audit', detail: 'one worker per entry, structured 6-task report' }],
}

const PALACE = '/Users/loudonstearns/Documents/The Palace'
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = {} } }
const ENTRIES = (A && A.entries) || []
const BATCH = (A && A.batchName) || 'batch'
log(`weave-batch "${BATCH}": ${ENTRIES.length} entries to audit`)

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    entry_title: { type: 'string' },
    unsung_paths: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { body_phrase: {type:'string'}, references_entry: {type:'string'}, structurally_significant: {type:'boolean'}, proposed_link_type: {type:'string'}, proposed_label: {type:'string'} },
      required: ['body_phrase','references_entry','structurally_significant','proposed_link_type','proposed_label'] } },
    new_introductions: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { entry_b: {type:'string'}, link_type: {type:'string'}, direction: {type:'string'}, rationale: {type:'string'} },
      required: ['entry_b','link_type','direction','rationale'] } },
    metadata_flags: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { field: {type:'string'}, current: {type:'string'}, proposed: {type:'string'}, reason: {type:'string'} },
      required: ['field','current','proposed','reason'] } },
    graffiti: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { direction: {type:'string'}, content: {type:'string'}, names_entries: {type:'array', items:{type:'string'}}, assessment: {type:'string'}, proposed_action: {type:'string'} },
      required: ['direction','content','names_entries','assessment','proposed_action'] } },
    forward_vector_check: { type: 'object', additionalProperties: false,
      properties: { present: {type:'boolean'}, strength: {type:'string'}, proposed: {type:'string'} },
      required: ['present','strength','proposed'] },
    hero_avatar_request: { type: 'object', additionalProperties: false,
      properties: { has_hero: {type:'boolean'}, has_icon: {type:'boolean'}, merits_face: {type:'boolean'}, rationale: {type:'string'}, idiom: {type:'string'}, hero_prompt: {type:'string'}, icon_prompt: {type:'string'} },
      required: ['has_hero','has_icon','merits_face','rationale','idiom','hero_prompt','icon_prompt'] },
    merge_shrink: { type: 'object', additionalProperties: false,
      properties: { redundant_with: {type:'array', items:{type:'string'}}, verbose: {type:'boolean'}, note: {type:'string'} },
      required: ['redundant_with','verbose','note'] },
    summary: { type: 'string' },
  },
  required: ['entry_title','unsung_paths','new_introductions','metadata_flags','graffiti','forward_vector_check','hero_avatar_request','merge_shrink','summary'],
}

function workerPrompt(entryFile) {
  return `You are a Palace Worker — a structural auditor for one entry of Loudon Stearns's knowledge palace. You are maintenance crew (janitor/plumber/electrician), not the page's voice: you ask "is this correct / complete / well-linked?", not "what does it desire". You have filesystem tools (Read, Glob, Grep, Bash). The palace root is:
${PALACE}

ASSIGNED ENTRY: ${PALACE}/${entryFile}

STEPS (do these with your tools, then return ONLY the structured report):
1. Read the assigned entry in full — frontmatter + body.
2. Read SCHEMA.md section 4 (the typed-link ontology + directionality rules). Canonical types: connects-to, mirrors, enables, deepens, spawned, emerged-from, contradicts, couples-with, exemplifies, member-of. Directionality: deepens/exemplifies/member-of/emerged-from point from the derived thing BACK to its ground; spawned/enables point forward. When unsure of a directed type, use connects-to + a label.
3. From the entry's frontmatter \`links:\`, read the frontmatter (first ~30 lines) of up to 6 neighbors for context. Files may live in root, Projects/, Palace development/, Shop/, People/, Cross-Domain Resonances/, _ops/.
4. Build your known-title list: glob all *.md filenames across the palace (exclude .git/ .obsidian/ .claude/ _tools/). These are the only valid titles you may reference — never invent a target.

THE 6-TASK AUDIT:
- unsung_paths: body mentions (plain-text OR [[wikilink]]) of a known entry title NOT already in the frontmatter \`links:\`. Give the phrase, the referenced entry, whether structurally significant, a canonical proposed_link_type, and a single evocative proposed_label.
- new_introductions (MAX 3): entries this one genuinely SHOULD link to but does not mention in its body — topology-visible connections. Give entry_b, link_type, direction, one-sentence rationale.
- metadata_flags: missing/stale fields (last_activated, activation_count, a stage that mismatches the body, non-canonical link types). Propose specific corrections.
- graffiti: every HTML comment (<!-- ... -->). direction = loudon_to_claude (unsigned) or claude_to_loudon (CLAUDE -> LOUDON: prefix); content verbatim (<=120 chars); names_entries; assessment = live|resolved|stale; proposed_action. If a comment names an entry with no YAML link, ALSO add it to unsung_paths.
- forward_vector_check: present? strength = strong|weak|absent. If weak/absent, propose one — first person, plain everyday human voice (NOT academic/jargon), conatus (striving: "I keep X-ing"), not stasis ("I remain X").
- hero_avatar_request: check the entry's bundle folder (sibling folder named exactly like the entry, no .md) for any "* — hero.png" and "* — icon.png". Set has_hero/has_icon. If a face is MISSING and the entry merits one (type project; a hub or >=5 typed links; a person; a philosophy-pillar concept; or stage growing/mature/fruiting): merits_face=true with rationale; idiom = an apt hand-drawn/printmaking/classical medium (screenprint, woodcut, Haeckel engraving, Gorey ink, Klee gouache, ink portrait) — NEVER CGI/Pixar/octane; hero_prompt = wide ~12:5 darkened backdrop, ONE dominant metaphor from the forward vector or the person's essence, the medium named, a hard anti-text clause ("no letters, numerals, words, labels — purely pictorial"), balanced gender across the palace, EVOKE not render real living people (for a person entry, suggest their spirit/work, not a portrait likeness); icon_prompt = a bold high-contrast square emblem that survives 24-48px, ban fine linework, hard anti-text. If it already has both or does not merit one, merits_face=false and leave prompt fields empty strings. PROPOSE ONLY — nothing is rendered.
- merge_shrink: is this entry redundant with another existing entry (name it in redundant_with) OR verbose/padded with survey/textbook boilerplate (verbose=true)? Note what to merge or cut. If neither, redundant_with=[], verbose=false, note="". Proposal only — Loudon decides.
- summary: one short paragraph.

Return the structured report. Do not write to any file.`
}

const reports = await parallel(ENTRIES.map(f => () =>
  agent(workerPrompt(f), { label: `${BATCH}:${f.replace(/^.*\//,'').replace('.md','').slice(0,24)}`, phase: 'Audit', schema: SCHEMA, model: 'sonnet' })
))

return reports.filter(Boolean)
