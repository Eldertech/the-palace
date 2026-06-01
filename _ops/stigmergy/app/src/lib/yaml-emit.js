// Palace YAML emitter.
//
// js-yaml.dump round-trips technically valid YAML but does not preserve the
// palace's stylistic conventions: it reorders keys, inlines arrays it should
// not, and quote-decorates inconsistently. STATE's editor reads frontmatter
// (yaml-frontmatter.js) and must write it back idiomatically -- a save must
// not produce a noisy diff just because js-yaml chose a different style.
//
// This emitter writes palace-idiomatic YAML:
//   - canonical top-level field order (SCHEMA §3 strong fields first)
//   - block-style `links` with one object per item, fields target/type/label
//   - inline-flow `pillars` and `tags` (short symbolic arrays)
//   - quote strings only when needed (special chars, wikilink targets,
//     leading/trailing whitespace, colon, etc.)
//   - empty/null scalar fields rendered as bare `key:` (no value)
//
// Pure: no fs, no js-yaml. Round-trip tested against fixtures.
//
// Round-trip contract: for any palace .md frontmatter object F,
// parseFrontmatter(emitYaml(F)).frontmatter is deep-equal to F (modulo the
// type-coercion js-yaml does on bare scalars -- numeric strings, bool-likes).

// Canonical order for fields the palace recognizes. Unknown keys are appended
// in insertion order after the known set. The order applies recursively to
// nested objects, which is why link-object fields (target, type, label)
// appear here even though they only show up inside `links[]` items.
export const CANONICAL_ORDER = [
  'target',
  'title',
  'type',
  'label',
  'status',
  'project',
  'pillars',
  'born',
  'last_activated',
  'activation_count',
  'stage',
  'version',
  'confidence',
  'energy',
  'hook_quality',
  'beauty',
  'who_leads',
  'date',
  'recovered',
  'adopted',
  'last_tested',
  'last_gotcha',
  'license',
  'tool',
  'tool_version',
  'medium',
  'author',
  'year',
  'born_year',
  'domains',
  'revival_conditions',
  'tags',
  'agency_profile',
  'links',
  'summary',
  'forward_vector',
  'session_thread',
];

// Fields that should always be rendered as inline/flow arrays when short.
// `pillars` and `tags` are stylistic; everything else uses block style.
const INLINE_ARRAY_FIELDS = new Set(['pillars', 'tags', 'domains']);

// Fields that, when scalar strings, prefer double-quotes (forward_vector is
// always quoted in the palace; status, session_thread are commonly quoted).
const ALWAYS_QUOTE = new Set(['forward_vector', 'session_thread', 'summary']);

// ── Public API ───────────────────────────────────────────────────────────────

// Emit a YAML document body (without the --- fences) from an object.
// Returns a string ending in a single newline.
//
// `options.styleHints` is a `{ field: 'inline' | 'block' }` map. When the
// composer reads the on-disk YAML it detects the array style each top-level
// field used and passes it here -- so a save that does not touch `pillars`
// emits it in the same style it came in, and the unified diff stays signal-
// only. Without hints, the default rule (INLINE_ARRAY_FIELDS) applies.
export function emitYaml(obj, options = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
  const lines = [];
  const styleHints = options.styleHints || {};
  for (const key of orderedKeys(obj)) {
    emitField(lines, key, obj[key], 0, styleHints);
  }
  if (lines.length === 0) return '';
  return lines.join('\n') + '\n';
}

// Emit a full .md file body: --- + YAML + --- + blank line + body.
//
// The palace convention is one blank line between the close fence and the
// body's first content -- parseFrontmatter's `\s*` consumes any leading
// whitespace in the body, so the round-trip contract is "the parsed body
// goes back in cleanly and the emitter restores the blank-line separator."
// Bodies passed in with leading whitespace are normalized.
export function emitEntryFile(frontmatter, body, options = {}) {
  const yaml = emitYaml(frontmatter, options);
  const bodyText = typeof body === 'string' ? body.replace(/^\s+/, '') : '';
  if (!yaml) return bodyText;
  return `---\n${yaml}---\n\n${bodyText}`;
}

// ── Internals ────────────────────────────────────────────────────────────────

function orderedKeys(obj) {
  const known = CANONICAL_ORDER.filter((k) => k in obj);
  const knownSet = new Set(known);
  const rest = Object.keys(obj).filter((k) => !knownSet.has(k));
  return [...known, ...rest];
}

function emitField(lines, key, value, depth, styleHints = {}) {
  const indent = ' '.repeat(depth * 2);
  if (value === undefined) return;

  if (value === null || value === '') {
    lines.push(`${indent}${key}:`);
    return;
  }

  if (Array.isArray(value)) {
    emitArray(lines, key, value, depth, styleHints);
    return;
  }

  if (typeof value === 'object') {
    lines.push(`${indent}${key}:`);
    for (const childKey of orderedKeys(value)) {
      emitField(lines, childKey, value[childKey], depth + 1, styleHints);
    }
    return;
  }

  lines.push(`${indent}${key}: ${formatScalar(value, key)}`);
}

function emitArray(lines, key, arr, depth, styleHints = {}) {
  const indent = ' '.repeat(depth * 2);

  if (arr.length === 0) {
    lines.push(`${indent}${key}: []`);
    return;
  }

  // Style precedence: explicit on-disk style (the hint) wins over the
  // INLINE_ARRAY_FIELDS default. Nested arrays (depth > 0) ignore hints,
  // since the hint scan only catches column-0 fields.
  const hinted = depth === 0 ? styleHints[key] : null;
  const wantsInline = hinted === 'inline'
    || (hinted == null && INLINE_ARRAY_FIELDS.has(key));
  const wantsBlock = hinted === 'block';

  if (wantsInline && !wantsBlock && arr.every(isSimpleScalar)) {
    const items = arr.map((v) => formatScalar(v, null)).join(', ');
    lines.push(`${indent}${key}: [${items}]`);
    return;
  }

  // Block style. Arrays of objects render as `- key: value` blocks; arrays
  // of scalars render as `- value`.
  lines.push(`${indent}${key}:`);
  const itemIndent = ' '.repeat(depth * 2 + 2);
  for (const item of arr) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const objKeys = orderedKeys(item);
      if (objKeys.length === 0) {
        lines.push(`${itemIndent}- {}`);
        continue;
      }
      const [firstKey, ...restKeys] = objKeys;
      lines.push(`${itemIndent}- ${firstKey}: ${formatScalar(item[firstKey], firstKey)}`);
      const continuationIndent = ' '.repeat(depth * 2 + 4);
      for (const k of restKeys) {
        const v = item[k];
        if (v === undefined) continue;
        if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
          // Nested non-scalar inside a link-style object -- preserve depth.
          const buf = [];
          emitField(buf, k, v, depth + 2);
          for (const line of buf) lines.push(line);
          continue;
        }
        if (v === null || v === '') {
          lines.push(`${continuationIndent}${k}:`);
          continue;
        }
        lines.push(`${continuationIndent}${k}: ${formatScalar(v, k)}`);
      }
    } else {
      lines.push(`${itemIndent}- ${formatScalar(item, null)}`);
    }
  }
}

function isSimpleScalar(v) {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v);
}

// Format a scalar value for emission. `key` is the field name when known
// (so we can apply per-field quoting rules like ALWAYS_QUOTE for
// forward_vector).
export function formatScalar(value, key) {
  if (value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const s = String(value);
  if (s === '') return '""';

  if (key && ALWAYS_QUOTE.has(key)) return doubleQuote(s);

  if (needsQuoting(s)) return doubleQuote(s);
  return s;
}

// Decide whether a bare string needs to be quoted. Conservative: quotes
// anything that could trip the YAML parser (colons, leading sigils,
// wikilink brackets, leading/trailing whitespace, or that looks like a
// non-string scalar to YAML).
function needsQuoting(s) {
  if (/^\s|\s$/.test(s)) return true;
  if (/[:#&*!|>%@`]/.test(s)) return true;
  // YAML reserved scalars (would re-parse as bool/null on round-trip).
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(s)) return true;
  // Pure-number-like strings -- "2026", "1.6" -- get quoted to round-trip
  // as strings. Bare integers/floats stay unquoted only when they came in
  // as numbers (see formatScalar).
  if (/^-?\d+(\.\d+)?$/.test(s)) return true;
  // Wikilink targets -- "[[Foo]]" -- start with `[` and must be quoted.
  if (s.startsWith('[') || s.startsWith('{')) return true;
  if (s.startsWith('- ') || s.startsWith('? ') || s.startsWith(': ')) return true;
  if (s.startsWith('"') || s.startsWith("'")) return true;
  if (s.includes('\n')) return true;
  return false;
}

function doubleQuote(s) {
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}
