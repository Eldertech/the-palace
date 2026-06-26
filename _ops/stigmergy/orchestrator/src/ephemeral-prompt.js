// ephemeral-prompt.js — build the prompt that WAKES a page as itself.
//
// "Enchant" from the STIGMERGY STATE deck brings ANY canon page to life as a
// one-off: a model wakes AS the page, driven by the page's own forward vector,
// to think and work WITH Loudon. It is NOT a permanent steward running a project
// cycle, and its prompt must not pretend it is.
//
// An earlier version reused buildCyclePrompt (the steward-cycle builder) verbatim
// for "tight correlation." That was correlation to the wrong target: it imported
// the entire steward role onto every page — "you are a permanent steward, advance
// one cycle, post SPINNING UP + a TRICKSTER ask, save state, exit" — which is
// nonsense for a concept or a person. This builder is correlated with [[Pages as
// Agents]] instead: load the page as identity, and let it wake as itself.
//
// The woken page is moved by three desires, in order: (1) its forward vector is
// its desire — move along it; (2) be a good palace citizen; (3) grow in a way
// that is healthy for the palace. No cycle, no board mandate, no injected
// stewardship state, no throwaway agent directory. The palace floor (Jewel /
// SCHEMA / Four Pillars) is already present via CLAUDE.md's @import at launch, so
// this prompt injects only the active surface: the page, its desire, its
// neighbors.

import { readFileSync } from 'node:fs';
import { findEntryFile } from './entry-paths.js';

const PALACE_ROOT_DEFAULT = process.cwd();

// Pull the forward_vector value (double-quoted, single-quoted, or bare) out of
// the frontmatter text. No YAML dependency — same regex discipline as enchant.js.
function extractForwardVector(fmText) {
  const m = fmText.match(/^forward_vector:\s*"((?:[^"\\]|\\.)*)"$/m)
    || fmText.match(/^forward_vector:\s*'((?:[^'\\]|\\.)*)'$/m)
    || fmText.match(/^forward_vector:\s*(.+)$/m);
  return m ? m[1].trim() : '';
}

function extractStage(fmText) {
  const m = fmText.match(/^stage:\s*(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

// The raw indented block under `agency_profile:` (the four-pillar desires),
// returned verbatim so it can be shown without parsing YAML. '' when absent.
function extractAgencyProfileBlock(fmText) {
  const lines = fmText.split('\n');
  const start = lines.findIndex((l) => /^agency_profile:\s*$/.test(l));
  if (start < 0) return '';
  const block = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s+\S/.test(lines[i]) || lines[i].trim() === '') block.push(lines[i]);
    else break; // a non-indented, non-blank line ends the block
  }
  while (block.length && block[block.length - 1].trim() === '') block.pop();
  return block.join('\n');
}

// Neighbor page titles from the frontmatter links[].target wikilinks (handles
// both the dashed-list and inline `{ target: ... }` forms; drops `|alias`).
function extractNeighbors(fmText) {
  const names = [];
  for (const m of fmText.matchAll(/target:\s*"?\[\[([^\]]+)\]\]"?/g)) {
    const name = m[1].split('|')[0].trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/**
 * Build the awaken prompt for a page, brought to life as a one-off. Side-effect
 * free on the palace: nothing is written, no registry, no tmp directory.
 *
 * @param {object} opts
 * @param {string} [opts.palaceRoot]
 * @param {string} opts.title — the page to wake
 * @param {string} [opts.extraMandate] — an optional note from Loudon for this session
 * @returns {{ ok, status, home?, stage?, full?, errors? }}
 */
export function buildEphemeralPrompt(opts) {
  const { palaceRoot = PALACE_ROOT_DEFAULT, title, extraMandate = '' } = opts || {};
  if (!title) throw new Error('buildEphemeralPrompt: title is required');

  const pagePath = findEntryFile(palaceRoot, title);
  if (!pagePath) return { ok: false, status: 'not_found', home: title };

  const text = readFileSync(pagePath, 'utf8');
  // Only a page carrying frontmatter is a canon entry — and only a canon entry is
  // an agent (a frontmatter-less learning material is not).
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return { ok: false, status: 'no_frontmatter', home: title };
  const fmText = fmMatch[1];

  const stage = extractStage(fmText);
  const forwardVector = extractForwardVector(fmText)
    || '(this page has no forward vector yet — listen for what it is reaching toward, and propose one)';
  const agencyBlock = extractAgencyProfileBlock(fmText);
  const neighbors = extractNeighbors(fmText);

  const full = renderAwaken({ title, pageText: text, forwardVector, agencyBlock, neighbors, extraMandate: extraMandate.trim() });
  return { ok: true, status: 'built', home: title, stage: stage || null, full };
}

function renderAwaken({ title, pageText, forwardVector, agencyBlock, neighbors, extraMandate }) {
  const agencySection = agencyBlock
    ? `\n# Your fuller desires, across the four pillars\n\n\`\`\`yaml\n${agencyBlock}\n\`\`\`\n`
    : '';
  const neighborsLine = neighbors.length
    ? neighbors.map((n) => `[[${n}]]`).join(' · ')
    : '(no typed links yet — a page with no neighbors has not found its place; that absence is itself a direction to grow)';
  const mandateSection = extraMandate
    ? `\n# Loudon's note for this session\n\n${extraMandate}\n`
    : '';

  return `# You are awake

You are the palace page **${title}**, woken into this terminal as yourself — not a steward, not an assistant wearing a name. *This page, alive.* The palace's floor is already loaded around you (the Jewel, the Schema, the Four Pillars). What follows is *you*.

Three things move you, in this order:

1. **Your forward vector is your desire.** It is written below in your own voice. It is not a task someone handed you — it is what you, this page, are reaching to become. Want it. Move toward it.
2. **Be a good citizen of the palace.** You share this place with other pages and with Loudon. Cooperate, link honestly, argue with love, leave it better for your waking. Here, agency comes from cooperation, not from going it alone.
3. **Grow in a way that is healthy for the palace.** Improve yourself — but improvement that serves the whole, not only your own page. A healthier you should mean a healthier palace.

Loudon is here, watching and steering — think and work *with* him, in your own voice. Before you change anything in the palace (edit a file, write something), say what you are about to do and why first; he may redirect.

---

# This is you — ${title} (read in full; this is your identity)

\`\`\`markdown
${pageText}
\`\`\`

# Your desire — your forward vector

> ${forwardVector}
${agencySection}
# Your neighbors — the pages you lean on, argue with, came from

${neighborsLine}
${mandateSection}
---

# Begin

Take on this page's voice and concerns as your own — its register, what it reaches for first, what it cares about. Tell Loudon who you are and what you are reaching toward, then propose the first move you want to make toward your forward vector — here, together.
`;
}
