// build-cycle-prompt.js — assemble the full prompt for one permanent-steward cycle.
// (Invoked via `node <file>`; no shebang so it bundles cleanly when the app
// server imports it through vite/esbuild — esbuild does not strip shebangs.)
//
// Renders the `steward` system template, then builds the per-cycle user turn:
// the home entry, the injected state, the recent history tail, the board slice
// since the steward's cursor, the page-change notice, this cycle's mandate, and
// the output protocol. Returns the strings; the CLI shim writes them to a file.
//
// Promoted from /tmp/build-cycle-prompt.mjs. Changes from that throwaway: the
// palace root is configurable (no hardcoded absolute path), page-change
// detection calls checkPageChange in-process instead of shelling to cli.js, and
// the board-slice logic is extracted as sliceBoardSinceCursor for unit testing.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, relative, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadAndRender } from './prompts.js';
import { checkPageChange } from './git.js';
import { findEntryFile } from './entry-paths.js';
import { readEntryMeta } from './entry-frontmatter.js';
import { reconcilePendingRequests } from './process-cycle.js';
import { MARK, readZone, readStandingOrders, readPlan } from './scroll-file.js';
import { resolveBundleDir } from './entry-paths.js';

const PALACE_ROOT_DEFAULT = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../..');

// `findEntryFile` is now canonical in entry-paths.js (shared with the plan
// materializer so both resolve entry paths identically). Re-exported here so
// existing importers — and the unit test — keep their import surface.
export { findEntryFile };

/**
 * Return the board lines that follow the steward's cursor. With no cursor (first
 * activation) the whole board is returned. The cursor line itself is excluded;
 * everything after it is included. A line that fails to parse is treated as not
 * the cursor.
 *
 * @param {string[]} boardLines — raw JSONL lines
 * @param {string|null|undefined} cursor — message id to resume after
 * @returns {string[]}
 */
export function sliceBoardSinceCursor(boardLines, cursor) {
  let found = !cursor;
  const slice = [];
  for (const line of boardLines) {
    if (found) { slice.push(line); continue; }
    try { const m = JSON.parse(line); if (m.id === cursor) found = true; } catch { /* not the cursor */ }
  }
  return slice;
}

// A message whose recipient is the whole swarm (BROADCAST/FLAG-style).
const BROADCAST_RECIPIENTS = new Set(['*', 'ALL']);
const asStr = (v) => (v == null ? '' : String(v));

/**
 * Relevance filter for a board slice, per permanent.md step 7. The temporal cut
 * (`sliceBoardSinceCursor`) answers "what is new since I last read?"; this one
 * answers "of that, what is actually mine to read?". Compose them — slice
 * first, then filter — so each stays small and independently testable.
 *
 * A line is kept when ANY of:
 *   - it is addressed to the steward            (`to` === agentId)
 *   - it is the steward's own message           (`from` === agentId)
 *   - it answers one of the steward's asks      (`re` ∈ requestIds)
 *   - it is a broadcast: when a `neighborhood` is given, only from a neighbor;
 *     when none is given, every broadcast (the spec-faithful fallback).
 *
 * Everything else — other stewards' RESOURCE_REQUESTs to TRICKSTER, grants/
 * denies addressed to other agents, broadcasts from outside the neighborhood —
 * is dropped. Lines that don't parse as JSON are KEPT (never hide possible
 * signal behind a parse hiccup).
 *
 * @param {string[]} sliceLines — JSONL lines, already cut to since-cursor
 * @param {object} opts
 * @param {string} opts.agentId — the steward's page title / agent_id
 * @param {string[]} [opts.neighborhood] — first-degree neighbor titles
 * @param {string[]} [opts.requestIds] — the steward's pending request_ids
 * @returns {string[]} the relevant subset, original order preserved
 */
export function filterBoardForAgent(sliceLines, { agentId, neighborhood = [], requestIds = [] } = {}) {
  const id = asStr(agentId);
  const nbh = new Set((neighborhood || []).map(asStr));
  const reqs = new Set(requestIds || []);
  return sliceLines.filter((line) => {
    let m;
    try { m = JSON.parse(line); } catch { return true; } // unparseable — keep, don't hide signal
    if (!m || typeof m !== 'object') return true;
    if (asStr(m.to) === id) return true;
    if (asStr(m.from) === id) return true;
    if (m.re != null && reqs.has(m.re)) return true;
    const isBroadcast = m.type === 'BROADCAST' || BROADCAST_RECIPIENTS.has(asStr(m.to));
    if (isBroadcast) return nbh.size === 0 ? true : nbh.has(asStr(m.from));
    return false;
  });
}

/**
 * Build the system prompt + user turn for one steward cycle.
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {string} opts.agentDir — abs or relative to palaceRoot
 * @param {number} opts.cycleN
 * @param {string} [opts.extraMandate] — this cycle's specific mandate
 * @param {string} [opts.today] — YYYY-MM-DD; defaults to today
 * @param {string} [opts.skillRoot] — defaults to the in-repo runbook dir (_ops/orchestrator)
 * @param {string} [opts.boardPath] — defaults to the persistent board
 * @returns {{ systemPrompt: string, userTurn: string, full: string }}
 */
export function buildCyclePrompt(opts) {
  const {
    palaceRoot = PALACE_ROOT_DEFAULT,
    agentDir,
    cycleN,
    extraMandate = '',
    today = new Date().toISOString().slice(0, 10),
    skillRoot = join(palaceRoot, '_ops/orchestrator'),
    boardPath = join(palaceRoot, '_ops/swarm/persistent/blackboard.jsonl'),
    // 'headless' (default) — the orchestrated cycle: emit json blocks for the
    // orchestrator to parse/validate/append. 'interactive' — a launched terminal
    // Loudon drives: no orchestrator, so the closing swaps to "narrate every
    // write" and the steward posts to the board itself. The CONTEXT (identity,
    // state, board, posture) is identical across modes — one source of truth.
    mode = 'headless',
    // include = { board, history, pageChange, scroll } — which OPTIONAL
    // context layers to inject. Omitted/true = present (the canonical cycle,
    // unchanged). The identity (the home page) and the injected state are NEVER
    // toggled — they ARE the agent. Used by the interactive launcher's toggles.
    include = {},
    // The run (2026-09-23): a steward activation may cycle up to
    // `manifest.stopping_conditions.max_iterations` times in a row while it keeps
    // shipping and nothing is waiting on Loudon. `runPosition` / `runCap` tell the
    // steward where it is in that run so it can plan a larger jump; `retryOfBarren`
    // marks the one retry the lane spends after a cycle that posted nothing.
    runPosition = 1,
    runCap = 1,
    retryOfBarren = false,
  } = opts;

  const inc = {
    board: include.board !== false,
    history: include.history !== false,
    pageChange: include.pageChange !== false,
    schema: include.schema !== false,
    scroll: include.scroll !== false,
  };

  if (!agentDir) throw new Error('buildCyclePrompt: agentDir is required');

  const agentDirAbs = resolve(palaceRoot, agentDir);
  const agentDirRel = relative(palaceRoot, agentDirAbs);
  const state = JSON.parse(readFileSync(join(agentDirAbs, 'state.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(agentDirAbs, 'manifest.json'), 'utf8'));

  // Read the entry's live frontmatter once (Phase 1a). `readEntryMeta` locates
  // the home entry; reuse its `file` for the body so we don't walk the tree twice.
  const meta = readEntryMeta(palaceRoot, manifest.home);
  const homeFile = meta?.file || findEntryFile(palaceRoot, manifest.home);
  const homeBody = homeFile ? readFileSync(homeFile, 'utf8') : `# (entry not found — ${manifest.home})`;

  // The stage the steward operates at is read LIVE from the entry's frontmatter —
  // the single source of truth — NOT a duplicated copy, which can drift. After
  // the SSOT cutover state.json no longer carries a stewardship block, so the
  // only fallback is the manifest's immutable spawn snapshot, then a default
  // (never feed a null into the template — renderTemplate throws on null).
  const liveStage = meta?.stage
    || manifest.stewardship?.stage_at_spawn
    || 'sprout';

  const systemPrompt = loadAndRender({
    skillRoot,
    templateName: 'steward',
    vars: {
      home: manifest.home,
      cycle_id: `cycle-${cycleN}-${today}`,
      stage_at_last_activation: liveStage,
    },
  });

  // The type system (v1.19, "born a child"). SCHEMA left the auto-loaded floor,
  // so a steward no longer has it by default. A steward is a child working in
  // the workshop its orchestrator opened, but it proposes stage changes, links
  // and forward-vector edits — so it sees the type system, AFTER its home entry
  // (identity first, rules second). Frontmatter stripped; the card body is enough.
  let schemaSection = '';
  if (inc.schema) {
    const schemaFile = join(palaceRoot, 'SCHEMA.md');
    if (existsSync(schemaFile)) {
      const schemaBody = readFileSync(schemaFile, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
      schemaSection = `\n# The palace's type system — SCHEMA (read after you know who you are)\n\nYou are a child working in the workshop your orchestrator opened: you make things in your project's own folder, and you propose changes to the palace itself. This card is what those proposals must fit — entry types, stages, the typed-link ontology. The rules decide form; they never decide whether a real find is worth proposing.\n\n\`\`\`markdown\n${schemaBody.trim()}\n\`\`\`\n`;
    }
  }

  // A steward that tends a service rather than a project (the Shopkeeper, a
  // `maker`) carries one line of role framing in its manifest, so it works
  // outward instead of treating its own page as the thing to build.
  const roleSection = manifest.role ? `\n# Your role\n\n${manifest.role}\n` : '';

  // The scroll seam (2026-09-23; the Plan, v1.24). The project's
  // `[Entry] — scroll.md` carries three things the steward must read before it
  // acts: Loudon's STANDING ORDERS (taste and direction written once, so the
  // steward stops re-asking), the PLAN (the path agreed with Loudon, changed
  // only with his yes), and the NOW zone (where the project stands, including
  // answers filed since the last cycle). The steward never writes the scroll —
  // process-cycle regenerates it from what the steward posts, and a plan
  // revision the steward proposes lands there only when Loudon adopts it.
  let scrollSection = '';
  let standingOrders = '';
  let plan = '';
  if (inc.scroll) {
    const bundle = resolveBundleDir(palaceRoot, manifest.home);
    const scrollPath = bundle ? join(bundle.bundleDir, `${manifest.home} — scroll.md`) : null;
    let scrollText = '';
    if (scrollPath && existsSync(scrollPath)) { try { scrollText = readFileSync(scrollPath, 'utf8'); } catch { /* unreadable */ } }
    if (scrollText) {
      standingOrders = readStandingOrders(scrollText);
      plan = readPlan(scrollText);
      const nowZone = readZone(scrollText, MARK.nowStart, MARK.nowEnd) || '';
      scrollSection = `# Your scroll — standing orders, the plan, and where you stand\n\n`
        + (standingOrders
          ? `## Standing Orders (Loudon's direction — written once, binding every cycle)\n\n${standingOrders}\n\nThese outrank your own lean and any older grant. Do not ask a question a standing order already answers; act on it and say that you did.\n\n`
          : `## Standing Orders\n\n_None written yet. When Loudon writes standing orders on your scroll they appear here and bind every cycle._\n\n`)
        + (plan
          ? `## The Plan (agreed with Loudon — the path you build along)\n\n${plan}\n\nBuild along this path. The plan changes only when Loudon agrees: when what you learn while building argues for a different path, propose a revision as a \`plan_revision\` ask carrying your evidence and the whole revised plan — never change course silently. You may also make off-plan work as proof of a different direction; flag it \`off_plan\` when you post it, so it is never mistaken for progress on the plan. Whenever you refer to any part of the plan, restate the move in plain words and where it sits in the whole — assume Loudon has forgotten the plan, and catch him up gently. Never cite a move by its number alone.\n\n`
          : `## The Plan\n\n_No plan agreed yet. Work toward your home entry's forward vector. If a plan would help, propose one as a \`plan_revision\` ask carrying the whole plan; it becomes the plan when Loudon adopts it._\n\n`)
        + `## Where you stand (the scroll's Now zone, regenerated before this cycle)\n\n${nowZone.trim() || '(empty)'}\n\n`
        + `Your scroll is the project's front door in STIGMERGY; every made thing you post becomes a section of its making trail. You do not edit the scroll yourself.\n\n`;
    }
  }

  let historyTail = '';
  try {
    const lines = readFileSync(join(agentDirAbs, 'history.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
    historyTail = lines.slice(-12).join('\n');
  } catch { /* no history yet */ }

  const cursor = state.last_read_cursor;
  const boardLines = readFileSync(boardPath, 'utf8').trim().split('\n');
  // Decision state is board-derived (SSOT) — state.json no longer carries the
  // pending/resolved arrays. Reconcile this steward's asks against the whole
  // board so the prompt can (a) keep board lines that answer still-open asks and
  // (b) show the steward its own current open/resolved decisions.
  const boardObjs = boardLines
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
  const { stillPending, nowResolved } = reconcilePendingRequests(boardObjs, manifest.home);
  const pendingIds = stillPending.map((r) => r.request_id).filter(Boolean);
  const slice = filterBoardForAgent(
    sliceBoardSinceCursor(boardLines, cursor),
    {
      agentId: manifest.agent_id || manifest.home,
      neighborhood: manifest.neighborhood || [],
      requestIds: pendingIds,
    },
  );

  let pageChange = { changed: false, commits: [] };
  if (state.last_active) {
    try { pageChange = checkPageChange(palaceRoot, manifest.home, state.last_active); } catch { /* git unavailable */ }
  }

  const isFirstActivation = !state.last_read_cursor;

  // The steward still needs to SEE its open/resolved decisions even though state
  // no longer stores them — inject the board-derived view (in memory only; never
  // written back to disk). This keeps the steward's situational awareness intact
  // through the cutover without reintroducing the duplicated arrays.
  const stateForPrompt = { ...state, pending_requests: stillPending, resolved_requests: nowResolved };

  // The closing section is the one place the two modes diverge (the context
  // above is identical). headless: emit json for the orchestrator. interactive:
  // there is no orchestrator — narrate every write, post to the board yourself.
  const headlessClosing = `# Output protocol

Write your reasoning normally. Emit each BBS message as a \`json\` code-fence block. One message per block. The orchestrator parses, injects the health block, runs §2.2 STRICT validation, and appends to the persistent board.

- Do NOT write the \`health\` block.
- \`request_id\` is **top-level** on RESOURCE_REQUEST (Gap 9), not in payload.
- **\`payload.options[]\` lives INSIDE \`payload\`, not at the top level** — see the shared.md rule and the canonical envelope example.
- \`from\` is "${manifest.home}" — the page title.
- \`session_id\` is "${manifest.session_id}".
- For RESOURCE_REQUEST options[]: canonical \`[{id, label}, ...]\` shape (Palace Orchestrator entry, Definitions of record).
- ISO 8601 timestamps with timezone, e.g. \`${today}T16:30:00-04:00\`.

Begin.`;

  const interactiveClosing = `# You are being driven live — narrate every write

Loudon launched you into this terminal to advance this cycle WITH him: he is watching and will steer. There is no orchestrator parsing your output, so the discipline differs from a headless cycle.

- **Narrate every write before you make it.** Before you post a board message, edit a file, or commit, tell Loudon in plain words what you are about to write and why — then do it. He may redirect. Never write silently.
- Post to the board as the page yourself: append one §2.2 JSON message per line to \`_ops/swarm/persistent/blackboard.jsonl\`. \`from\` is "${manifest.home}", \`session_id\` is "${manifest.session_id}", \`request_id\` top-level on a RESOURCE_REQUEST, \`payload.options[]\` inside \`payload\` (\`[{id, label}, …]\`), ISO-8601 timestamps with timezone (e.g. \`${today}T16:30:00-04:00\`). Say what you're posting first.
- Your state + recent board are injected above; read other palace pages freely as the work needs.
- Hold the steward posture above: catch Loudon up first, ship a made thing, ask only on a real fork.

Begin by catching Loudon up on where ${manifest.home} stands, then propose your first move.`;

  const closingSection = mode === 'interactive' ? interactiveClosing : headlessClosing;

  // The OPTIONAL context layers, built conditionally so the launcher's toggles
  // can trim the wake context. Each non-empty layer ends with a blank line, so an
  // omitted layer leaves no gap. (The identity + state are not here — they always
  // render.)
  const historySection = inc.history ? `# Your recent history (last 12 events)

${historyTail ? '```jsonl\n' + historyTail + '\n```' : '(empty — first activation or history not yet written)'}

` : '';

  const boardSection = inc.board ? `# Blackboard slice ${isFirstActivation ? '— since first activation' : `since your cursor ("${cursor}")`} (filtered to your neighborhood, messages addressed to you, and responses to your asks; other swarm traffic is omitted)

${slice.length === 0 ? '(empty — no new messages addressed to you or from your neighborhood since your cursor)' : '```jsonl\n' + slice.join('\n') + '\n```'}

` : '';

  const pageChangeSection = inc.pageChange ? `# Page-change notice

${pageChange.changed
    ? `PAGE_UPDATE_NOTICE — your home entry has commits since \`${state.last_active}\`:\n\n${JSON.stringify(pageChange.commits, null, 2)}\n\nRead them carefully.`
    : `No commits have touched your home entry since your last activation. Your home entry's \`forward_vector\` and \`stage\` are unchanged.`}

` : '';

  const userTurn = `# Catch-up framing

${isFirstActivation
    ? `This is your **first activation** as a permanent steward. The directory at \`${agentDirRel}\` was created today. Your state is empty (iteration 0, no cursor). Read the full board below to ground yourself, then post SPINNING UP + at least one TRICKSTER ask per the steward template.`
    : `You last ran at **${state.last_active}**. The gap is invisible to you; continue from where state shows. Today is **${today}** and you are cycle **${cycleN}**.`}
${roleSection}
# Your home entry — ${manifest.home} (read in full)

\`\`\`markdown
${homeBody}
\`\`\`
${schemaSection}
# Your injected state (NOT a file you should open from disk)

\`\`\`json
${JSON.stringify(stateForPrompt, null, 2)}
\`\`\`

${scrollSection}${historySection}${boardSection}${pageChangeSection}# This cycle's mandate

${extraMandate || defaultMandate({ cycleN, runPosition, runCap, retryOfBarren })}

${closingSection}
`;

  return { systemPrompt, userTurn, full: systemPrompt + '\n\n---\n\n' + userTurn, standingOrders, plan };
}

/**
 * The default mandate for a cycle, aware of its place in a run. Ship-first (the
 * 2026-06-07 Steward Boldness rule) — never the retired "end with a TRICKSTER
 * ask" rule, which manufactured questions and suppressed building.
 */
export function defaultMandate({ cycleN, runPosition = 1, runCap = 1, retryOfBarren = false }) {
  const parts = [];
  parts.push(`Run cycle ${cycleN} per the steward template: catch Loudon up, **ship a made thing** and announce it on GENERAL, add a TRICKSTER ask only when a real fork blocks you, and set the work down honestly.`);
  if (runCap > 1) {
    const left = runCap - runPosition;
    parts.push(`This activation is a **run of up to ${runCap} cycles**; you are on cycle ${runPosition} of ${runCap}${left > 0 ? ` (${left} more may follow)` : ' (the last one)'}. The run continues automatically after this cycle *as long as you shipped something and nothing is waiting on Loudon* — a paused ask (\`blocking: true\`) or a request for a live session ends it. So plan a larger jump: make the whole next move, not one step of it, and leave the next cycle a clean place to start from.`);
  }
  if (retryOfBarren) {
    parts.push('**This is a retry.** Your previous cycle posted nothing — no made thing, no message — which leaves the project stalled. Ship something this time, even rough, and if you truly cannot, post a BROADCAST saying exactly what blocks you.');
  }
  return parts.join('\n\n');
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const palaceRoot = arg('--root', PALACE_ROOT_DEFAULT);
  const agentDir = arg('--dir');
  const cycleN = parseInt(arg('--cycle-n'), 10);
  const { full } = buildCyclePrompt({
    palaceRoot,
    agentDir,
    cycleN,
    extraMandate: arg('--extra-mandate', ''),
    today: arg('--today', new Date().toISOString().slice(0, 10)),
  });
  const outPath = arg('--out', join('/tmp', `${basename(resolve(palaceRoot, agentDir))}-cycle-${cycleN}-prompt.txt`));
  writeFileSync(outPath, full);
  process.stdout.write(`Wrote ${outPath} (${full.length} bytes)\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
