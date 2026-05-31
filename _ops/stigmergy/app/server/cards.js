// server/cards.js — read Enrichment card folders + append inbox responses.
//
// Phase 4.5 absorbs the Enrichment ceremony's card loop into STIGMERGY's
// QUEUE. This is the Node re-implementation of the parts of
// Enrichment/server.py that STIGMERGY now owns:
//   - load_cards()       -> readCards()        (read Enrichment/card-* folders)
//   - _append_to_inbox() -> appendInboxBlock() (write a response to inbox.md)
//
// The worker-fire itself is the Phase 2.5 actuator (server/actuator.js); this
// module only handles the card I/O. "Carry the lessons, not the language."

import { existsSync, readdirSync, readFileSync, statSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseFrontmatter } from '../src/lib/yaml-frontmatter.js';
import { normalizeCard, isArchived, sortCards } from '../src/lib/card-model.js';

const ENRICHMENT_REL = 'Enrichment';
const INBOX_REL = 'Enrichment/inbox.md';

// Matches Enrichment/server.py's inbox header EXACTLY so the existing
// supervisor worker (supervisor-prompt.md) parses STIGMERGY-written blocks the
// same way it parses Flask-written ones. The block envelope below also mirrors
// server.py (`## id — target`, a received/purpose line, the text, then a `---`
// rule). STIGMERGY carries the structured action+note as that text body, so a
// reader gets both the human envelope and a machine-parseable action line.
const INBOX_HEADER = `# Enrichment Inbox

Loudon's responses to enrichment cards. Claude reads this file when running the Enrichment ceremony — each block below is one card's response. Lines are cleared as actions are performed. Do not reorder blocks; the dividing rule is \`---\` (three hyphens on their own line).

`;

// The response actions QUEUE may write (mirrors the inbox block vocabulary).
export const CARD_ACTIONS = ['deposit', 'revise', 'discard', 'tweak-vector', 'graffiti', 'more-like-this'];

// Read all non-archived card folders under Enrichment/, sorted by card id.
// Returns { cards: [...], count }. Never throws; a malformed card folder is
// skipped with a console.warn so one bad card can't break the queue.
export function readCards(palaceRoot) {
  const root = resolve(palaceRoot, ENRICHMENT_REL);
  if (!existsSync(root)) return { cards: [], count: 0 };

  const cards = [];
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch (_) {
    return { cards: [], count: 0 };
  }

  for (const ent of entries) {
    if (!ent.isDirectory() || !/^card-/.test(ent.name)) continue;
    const cardDir = join(root, ent.name);
    const cardMd = join(cardDir, 'card.md');
    if (!existsSync(cardMd)) continue;

    let frontmatter;
    let body;
    try {
      ({ frontmatter, body } = parseFrontmatter(readFileSync(cardMd, 'utf8')));
    } catch (e) {
      console.warn(`[stigmergy] card ${ent.name}: parse error, skipped (${e.message})`);
      continue;
    }

    if (isArchived(frontmatter)) continue;

    // Resolve the artifact file: frontmatter wins; else first non-card.md file.
    let artifactFile = typeof frontmatter.artifact_path === 'string' && frontmatter.artifact_path.trim() !== ''
      ? frontmatter.artifact_path
      : null;
    if (!artifactFile) {
      try {
        for (const f of readdirSync(cardDir).sort()) {
          if (f === 'card.md') continue;
          if (statSync(join(cardDir, f)).isFile()) { artifactFile = f; break; }
        }
      } catch (_) { /* ignore */ }
    }

    // For text artifacts, read the inline body so the card renders in a <pre>.
    let artifactText = null;
    if (artifactFile && /\.(md|txt)$/i.test(artifactFile)) {
      try { artifactText = readFileSync(join(cardDir, artifactFile), 'utf8'); } catch (_) { artifactText = null; }
    }

    cards.push(normalizeCard({ id: ent.name, frontmatter, body, artifactFile, artifactText }));
  }

  const sorted = sortCards(cards);
  return { cards: sorted, count: sorted.length };
}

// Build one inbox block, matching server.py's envelope. `ts` is injected (the
// caller passes new Date().toISOString()) so this stays pure + testable.
export function inboxBlock({ cardId, action, note, targetName, purpose, ts }) {
  const stamp = (ts || '').replace('T', ' ').replace(/\..*$/, '');
  const textLines = [`action: ${action}`];
  if (note && note.trim() !== '') textLines.push(`note: ${note.trim()}`);
  return [
    `## ${cardId} — ${targetName || ''}`.trimEnd(),
    `**received:** ${stamp}  ·  **purpose:** ${purpose || ''}`.trimEnd(),
    '',
    textLines.join('\n'),
    '',
    '---',
    '',
    '',
  ].join('\n');
}

// Append a response block to Enrichment/inbox.md, seeding the header if the
// file is missing OR does not already start with the canonical header. Returns
// { ok, msg }. Never throws.
export function appendInboxBlock(palaceRoot, response) {
  const inboxPath = resolve(palaceRoot, INBOX_REL);
  if (!CARD_ACTIONS.includes(response.action)) {
    return { ok: false, msg: `unknown action: ${response.action}` };
  }
  try {
    const needsHeader = !existsSync(inboxPath)
      || !readFileSync(inboxPath, 'utf8').startsWith('# Enrichment Inbox');
    if (needsHeader) appendFileSync(inboxPath, INBOX_HEADER, 'utf8');
    appendFileSync(inboxPath, inboxBlock(response), 'utf8');
    return { ok: true, msg: `appended ${response.action} for ${response.cardId}` };
  } catch (e) {
    return { ok: false, msg: `inbox write failed: ${e.message}` };
  }
}
