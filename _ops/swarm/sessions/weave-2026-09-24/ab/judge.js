export const meta = {
  name: 'weave-ab-blind-judge',
  description: 'Blind judge: for each of 10 rooms, verify 3 anonymised workers\' sampled proposals against the palace and rank them',
  phases: [{ title: 'Judge', detail: 'one elder judge per room; arms are X/Y/Z, never named' }],
}

const ROOT = '/Users/loudonstearns/Documents/palace-weave-2026-09-24'
const J = ROOT + '/_ops/swarm/sessions/weave-2026-09-24/ab/judge'

const VERDICT = { type: 'object', properties: {
  room: { type: 'string' },
  items: { type: 'array', items: { type: 'object', properties: {
    item_id: { type: 'string' },
    verdict: { type: 'string', description: 'valid | exists-already | wrong-direction | wrong-type | not-an-entry | evidence-not-in-page | forced-or-passing | schema-violation' },
    stand_behind: { type: 'boolean', description: 'you would write this into the palace as proposed' },
    note: { type: 'string' } }, required: ['item_id', 'verdict', 'stand_behind'] } },
  ranking: { type: 'array', items: { type: 'string' }, description: 'X/Y/Z best first — whose proposals would you rather sign' },
  ranking_reason: { type: 'string' },
  best_find: { type: 'string', description: 'item_id of the single best proposal in the room, if any' } },
  required: ['room', 'items', 'ranking', 'ranking_reason'] }

const results = await pipeline(args, (room) => agent(
`You are a blind judge in a small experiment about the palace's weave workers. First GROW UP: read ${ROOT}/ELDER.md, then ${ROOT}/SCHEMA.md, then ${ROOT}/SCHEMA — Reference.md (§3, §8). You write nothing.

Three workers — labelled only X, Y and Z — each audited the SAME room of the palace and proposed changes. Their proposals were sampled (up to 8 each): ${J}/${room}/X.json, ${J}/${room}/Y.json, ${J}/${room}/Z.json. You do not know how the workers differ, and must not guess — judge each item on its merits.

For EVERY sampled item, check it against the actual palace files under ${ROOT} (find entries with Glob **/*.md; read frontmatter and the relevant body lines):
- exists-already: the link (either direction, any type expressing the same relation) is already in frontmatter
- wrong-direction / wrong-type: under SCHEMA §4 (lineage and taxonomy links point back to their ground; only spawned and enables point forward; a hub never emits member-of)
- not-an-entry: source or target is a bundle file, a ghost, or not a palace entry
- evidence-not-in-page: the quoted line or claimed body mention is not actually there
- forced-or-passing: technically true but not a relation worth a permanent typed link
- schema-violation: e.g. a stage move that breaks SCHEMA §1/§2 (a person's stage tracks palace citizenship, not dossier richness), a merge that would destroy a distinct idea
- valid: none of the above
Also mark stand_behind: would you, as an elder, write it into the palace as proposed?

Then rank X, Y, Z (best first) by whose proposals you would rather sign, with one plain sentence of reason. Name the single best find in the room by item_id. Return room="${room}".`,
  { label: `judge:${room}`, phase: 'Judge', schema: VERDICT, agentType: 'palace-reader' }))

return results.map(r => r ? { room: r.room, n: r.items.length, ranking: r.ranking } : null)
