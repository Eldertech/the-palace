// Pure parsers for raw `git log` output.
//
// The git adapter (server/git.js) spawns git with carefully chosen format
// strings and hands the raw stdout here. Keeping the parsing pure makes it
// unit-testable against fixture strings without spawning git.
//
// Delimiters: we format with ASCII control chars that never appear in commit
// text -- %x1f (unit separator) between fields, %x1e (record separator)
// between commits. This survives multi-line bodies, which a newline-delimited
// format cannot.

export const FIELD_SEP = '\x1f';
export const RECORD_SEP = '\x1e';

// Git quotes paths containing "unusual" characters (spaces, commas, non-ASCII)
// in C-style double quotes with backslash escapes -- so a real palace path like
// `Palace development/Two Batons, One Board.md` shows up from --numstat and
// --porcelain as `"Palace development/Two Batons, One Board.md"`. Undo that so
// downstream code sees the literal path. Paths without special chars pass
// through untouched.
export function dequotePath(p) {
  if (typeof p !== 'string') return p;
  if (!(p.startsWith('"') && p.endsWith('"'))) return p;
  const inner = p.slice(1, -1);
  const bytes = [];
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch !== '\\') { pushUtf8(bytes, ch); continue; }
    const next = inner[i + 1];
    if (next === undefined) { bytes.push(0x5c); break; }
    if (next >= '0' && next <= '7') {
      const m = inner.slice(i + 1, i + 4).match(/^[0-7]{1,3}/);
      if (m) { bytes.push(parseInt(m[0], 8) & 0xff); i += m[0].length; continue; }
    }
    const map = { n: 0x0a, t: 0x09, r: 0x0d, '"': 0x22, '\\': 0x5c };
    if (next in map) { bytes.push(map[next]); i += 1; continue; }
    pushUtf8(bytes, next); i += 1;
  }
  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(bytes));
  } catch (_) {
    return inner;
  }
}

function pushUtf8(bytes, ch) {
  const code = ch.codePointAt(0);
  if (code < 0x80) { bytes.push(code); return; }
  for (const b of new TextEncoder().encode(ch)) bytes.push(b);
}

// The git format string the adapter uses for the metadata pass. Field order:
//   hash, author-name, author-email, author-date-ISO, subject, body
export const LOG_FORMAT =
  ['%H', '%an', '%ae', '%aI', '%s', '%b'].join('%x1f') + '%x1e';

// Parse the metadata-pass output into commit objects (without numstat).
export function parseLogMeta(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  const records = raw.split(RECORD_SEP);
  const out = [];
  for (const rec of records) {
    const trimmed = rec.replace(/^\r?\n/, '');
    if (trimmed.trim() === '') continue;
    const fields = trimmed.split(FIELD_SEP);
    if (fields.length < 5) continue;
    const [hash, authorName, authorEmail, authorDate, subject, ...rest] = fields;
    const body = rest.join(FIELD_SEP); // body is the last field; rejoin if it held a stray sep
    out.push({
      hash: hash.trim(),
      shortHash: hash.trim().slice(0, 7),
      authorName,
      authorEmail,
      authorDate,
      subject,
      body: (body ?? '').replace(/^\r?\n/, ''),
    });
  }
  return out;
}

// Parse the numstat-pass output. The adapter formats each record as
// `%x1e%H` followed by numstat lines (`added\tdeleted\tpath`). Binary files
// show `-\t-\tpath`. Returns a Map: hash -> { files: [{path, added, deleted,
// binary}], added, deleted }.
export function parseNumstat(raw) {
  const map = new Map();
  if (typeof raw !== 'string' || raw.trim() === '') return map;
  const records = raw.split(RECORD_SEP);
  for (const rec of records) {
    if (rec.trim() === '') continue;
    const lines = rec.split(/\r?\n/).filter((l) => l !== '');
    if (lines.length === 0) continue;
    const hash = lines[0].trim();
    if (!hash) continue;
    const files = [];
    let added = 0;
    let deleted = 0;
    for (let i = 1; i < lines.length; i += 1) {
      const m = lines[i].match(/^(-|\d+)\t(-|\d+)\t(.+)$/);
      if (!m) continue;
      const binary = m[1] === '-' || m[2] === '-';
      const a = binary ? 0 : parseInt(m[1], 10);
      const d = binary ? 0 : parseInt(m[2], 10);
      // Handle rename form `old => new` inside the path; keep the new path.
      let path = m[3];
      const renameBrace = path.match(/^(.*)\{(.+) => (.+)\}(.*)$/);
      if (renameBrace) {
        path = `${renameBrace[1]}${renameBrace[3]}${renameBrace[4]}`;
      } else if (path.includes(' => ')) {
        path = path.split(' => ').pop();
      }
      path = dequotePath(path);
      files.push({ path, added: a, deleted: d, binary });
      added += a;
      deleted += d;
    }
    map.set(hash, { files, added, deleted });
  }
  return map;
}

// Parse `git status --porcelain=v1` output into a structured working-tree
// delta. Returns { staged: [...], unstaged: [...], untracked: [...] } where
// each entry is { path, status }.
export function parsePorcelain(raw) {
  const out = { staged: [], unstaged: [], untracked: [] };
  if (typeof raw !== 'string' || raw.trim() === '') return out;
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (line.length < 4) continue;
    const x = line[0]; // staged status
    const y = line[1]; // unstaged status
    const path = dequotePath(line.slice(3));
    if (x === '?' && y === '?') {
      out.untracked.push({ path, status: '??' });
      continue;
    }
    if (x !== ' ' && x !== '?') out.staged.push({ path, status: x });
    if (y !== ' ' && y !== '?') out.unstaged.push({ path, status: y });
  }
  return out;
}
