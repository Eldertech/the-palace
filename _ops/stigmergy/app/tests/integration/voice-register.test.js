// voice-register.test.js — the drift backstop for the two-register tone rule.
//
// Static scan of every component .jsx file. Fails if any of the protocol-
// wire vocabulary leaks into a USER-VISIBLE string position. The wire layer
// (data-layer reads, comparisons, switch cases, imports) is untouched —
// only strings that would render to Loudon are flagged.
//
// See palace entry: Speak Like a Person, Log Like a Protocol.
// See lexicon:      src/lib/lexicon.js
//
// Updating the rule:
//   - When you intentionally surface a protocol term (e.g. inside a <code>
//     block as documentation), add an explicit exception below with a
//     comment naming WHY it's there.
//   - When you discover a new leak the existing patterns don't catch, add
//     a new VISIBLE_LEAK_PATTERN entry; the test will then fail until the
//     leak is moved into lexicon.js.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const COMPONENTS_DIR = join(APP_ROOT, 'src/components');

// ── Visible-leak patterns ────────────────────────────────────────────────
//
// Each entry catches one specific way the wire vocabulary tends to surface.
// The patterns target rendered text — JSX children, template literals
// composed of wire terms, capitalized wire enums used as labels.
const VISIBLE_LEAK_PATTERNS = [
  // Exact jargon phrases — flagged regardless of quoting context, because
  // the line-allow pass below already skips comments/imports/comparisons.
  // The phrase appearing anywhere else means it'll render to a human.
  { name: 'PENDING TRICKSTER DECISION heading', regex: /\bPENDING TRICKSTER DECISION\b/ },
  { name: 'TRICKSTER INBOX title',              regex: /\bTRICKSTER INBOX\b/ },
  { name: 'NO PENDING REQUESTS empty-state',    regex: /\bNO PENDING REQUESTS\b/ },
  { name: 'ALL AGENTS UNBLOCKED empty-state',   regex: /\bALL AGENTS UNBLOCKED\b/ },
  // 'blocking' / 'non-blocking' as quoted display labels (the wire schema
  // field name is fine; what's banned is rendering those literal words).
  { name: "'blocking' string label",            regex: /['"`]blocking['"`]\s*(?:,|\)|}|\]|\?|:)/ },
  { name: "'non-blocking' string label",        regex: /['"`]non-blocking['"`]/ },
  // BROADCAST / RESOURCE_REQUEST / etc. as visible strings — capitalized
  // protocol enums embedded inside template literals or JSX text.
  // Bare comparison uses (`type === 'BROADCAST'`) are NOT caught here
  // because the line-allow pass excludes them.
  { name: 'wire enum in template literal',      regex: /[`'][^`']*\$\{[^}]*\}\s*(?:BROADCAST|RESOURCE_REQUEST|RESOURCE_GRANT|RESOURCE_DENY)\b/ },
];

// Lines that are ALLOWED to mention protocol terms because they're
// data-layer reads, comparisons, or schema documentation. Matched
// against the trimmed line text BEFORE the leak-pattern scan.
//
// Each pattern is a regex that, if it matches the line, exempts it
// from leak detection on that pass. Be conservative — over-allowing
// silently lets jargon back into the UI.
const INTERNAL_LINE_ALLOW = [
  /^import\b/,                              // import statements
  /^\/\//,                                  // single-line comments
  /^\*\s|^\/\*|^\*\/|^\s*\*/,               // block-comment bodies
  /===\s*['"](?:TRICKSTER|GENERAL|WEAVE|CARDS|SYSTEM|BROADCAST|RESOURCE_REQUEST|RESOURCE_GRANT|RESOURCE_DENY|FLAG|PROOF|SESSION_INIT|SESSION_CLOSE|REPLY|QUERY)['"]/,
  /!==\s*['"](?:TRICKSTER|GENERAL|WEAVE|CARDS|SYSTEM|BROADCAST|RESOURCE_REQUEST|RESOURCE_GRANT|RESOURCE_DENY|FLAG|PROOF|SESSION_INIT|SESSION_CLOSE|REPLY|QUERY)['"]/,
  /case\s+['"](?:TRICKSTER|GENERAL|WEAVE|CARDS|SYSTEM|BROADCAST|RESOURCE_REQUEST|RESOURCE_GRANT|RESOURCE_DENY|FLAG|PROOF|SESSION_INIT|SESSION_CLOSE|REPLY|QUERY)['"]/,
  /^data-[\w-]+=/,                          // data-* attrs use raw values
  /msg\.(?:type|board|payload|health|re|id|ts|from|to)\b/,
  /payload\.(?:kind|content|message|rationale|conclusion|reason|target_entries|confidence|claim|options|granted)/,
];

function listJsxFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) { out.push(...listJsxFiles(p)); continue; }
    if (p.endsWith('.jsx') || p.endsWith('.js')) out.push(p);
  }
  return out;
}

function lineIsInternal(line) {
  const t = line.trim();
  for (const re of INTERNAL_LINE_ALLOW) if (re.test(t)) return true;
  return false;
}

describe('voice-register drift linter', () => {
  const files = listJsxFiles(COMPONENTS_DIR);

  it('every component file is scanned', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = relative(APP_ROOT, file);
    it(`no visible protocol-jargon leaks in ${rel}`, () => {
      const lines = readFileSync(file, 'utf8').split('\n');
      const violations = [];
      lines.forEach((line, i) => {
        if (lineIsInternal(line)) return;
        for (const pattern of VISIBLE_LEAK_PATTERNS) {
          if (pattern.regex.test(line)) {
            violations.push({ line: i + 1, pattern: pattern.name, text: line.trim() });
          }
        }
      });
      // Build a human-friendly message so the failing test points right at
      // the offending line — including a hint to use the lexicon.
      const msg = violations.length === 0 ? null : [
        ``,
        `${violations.length} visible protocol-jargon leak${violations.length === 1 ? '' : 's'} in ${rel}:`,
        ...violations.map(v => `  L${v.line}  [${v.pattern}]  ${v.text}`),
        ``,
        `Move the visible string into _ops/stigmergy/app/src/lib/lexicon.js`,
        `and reference it via t() / boardName() / typeName() / pauseShort() / pauseLong().`,
        `See palace entry: Speak Like a Person, Log Like a Protocol.`,
      ].join('\n');
      expect(violations, msg).toEqual([]);
    });
  }
});

// ── Dictionary self-check ────────────────────────────────────────────────
//
// The natural-register values in lexicon.js must not themselves carry the
// forbidden words — otherwise the migration is cosmetic, not actual.
describe('lexicon dictionary stays natural-register', () => {
  it('no entry value carries a wire-protocol term', async () => {
    const { _DICT_FOR_TESTING } = await import('../../src/lib/lexicon.js');
    const FORBIDDEN_IN_VALUES = /\bblocking\b|\bnon-blocking\b|\bRESOURCE_REQUEST\b|\bRESOURCE_GRANT\b|\bRESOURCE_DENY\b|\bBROADCAST\b|\bpayload\.|\bsession_id\b|\brequest_id\b/;
    const violations = [];
    for (const [key, value] of Object.entries(_DICT_FOR_TESTING)) {
      if (typeof value !== 'string') continue;
      if (FORBIDDEN_IN_VALUES.test(value)) violations.push(`${key} = ${JSON.stringify(value)}`);
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
