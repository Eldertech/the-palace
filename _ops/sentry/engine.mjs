// The Sentry's engine — reads content (a file on disk or a git blob) against the rules
// and returns findings. Shared by the sweep (sweep.mjs) and the push gate (pre-push.mjs).
//
// A finding never carries a raw value: `masked` is for eyes, `fp` is for allow.json.

import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SECRET_RULES, PLACEHOLDER, BINARY_SAFE, PII_RULES, EMAIL_IGNORE, PII_TEXT_EXT, luhn,
  INJECT_RULES, INJECT_TEXT_EXT, PATH_RULES, mask, fingerprint, SEV_RANK,
} from './rules.mjs';

export const SENTRY_DIR = dirname(fileURLToPath(import.meta.url));
export const MAX_BYTES = 32 * 1024 * 1024;
// Media the text rules can't read. JPEGs are still opened, for GPS in their EXIF.
export const MEDIA_EXT = /\.(png|gif|webp|wav|aiff?|flac|mp3|ogg|m4a|mp4|mov|webm|ttf|otf|woff2?|npy|npz|pt|pth|safetensors|ckpt|glb|gltf|ply|obj|fbx|blend1?|bin|exr|hdr|psd|ai|sqlite|db|pdf)$/i;
export const JPEG_EXT = /\.(jpe?g)$/i;

export function repoRoot(cwd = process.cwd()) {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd, encoding: 'utf8' }).trim();
}

export function git(root, args, opts = {}) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30, ...opts });
}

// Open findings live in the OWNER checkout, never a worktree (worktrees hold only tracked
// files and are thrown away), in a folder that ignores itself — so no branch's .gitignore,
// and no `git add -A` in the shared tree, can ever sweep them into a commit.
export function heldDir(root) {
  const owner = dirname(git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim());
  const dir = join(owner, '_ops', 'sentry', 'held');
  mkdirSync(dir, { recursive: true });
  const gi = join(dir, '.gitignore');
  if (!existsSync(gi)) writeFileSync(gi, '# The Sentry\'s held findings — local only, never tracked.\n*\n');
  return dir;
}

export function loadAllow() {
  const p = join(SENTRY_DIR, 'allow.json');
  const a = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  return {
    fp: new Set((a.findings || []).map(e => e.fp)),
    vfp: new Set((a.values || []).map(e => e.vfp)),
    gitleaks: new Set((a.gitleaks || []).map(e => e.fp)),
    skip: (a.skip || []).map(s => ({ families: new Set(s.families), prefix: s.prefix })),
    mustStayIgnored: a.must_stay_ignored || [],
  };
}

// Mask anything credential- or contact-shaped in a context line, not only the matched value.
function scrub(line) {
  return line
    .replace(/[A-Za-z0-9_\-+\/=]{20,}/g, m => mask(m))
    .replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, m => mask(m))
    .replace(/\d[\d\s().\-]{8,}\d/g, m => mask(m));
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return pos => { let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo + 1; };
}

function contextOf(text, start, end, value) {
  const ls = text.lastIndexOf('\n', start) + 1;
  let le = text.indexOf('\n', end); if (le === -1) le = text.length;
  const a = Math.max(ls, start - 70), b = Math.min(le, end + 70);
  return scrub(text.slice(a, b).split(value).join(mask(value))).replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function isBinary(buf) { return buf.subarray(0, 8000).includes(0); }

function skipped(allow, family, path) {
  return allow.skip.some(s => s.families.has(family) && path.startsWith(s.prefix));
}

// families: any of 'secret', 'pii', 'inject'. piiLevel 'all' | 'high' (history/push read only ssn/card).
export function scanContent(path, buf, { families = ['secret', 'pii', 'inject'], piiLevel = 'all', allow } = {}) {
  const out = [];
  // An archive's insides are opaque to the text rules, but its file names are not: hold them to the path rules.
  if (/\.zip$/i.test(path)) out.push(...scanPaths(zipMembers(buf).map(m => `${path}!${m}`), allow));
  if (JPEG_EXT.test(path)) {
    if (families.includes('pii') && jpegHasGps(buf)) out.push(finding('pii', 'exif-gps', 'high', path, 0, '(GPS in EXIF)', 'photo carries location metadata', allow, 'gps'));
    return out;
  }
  const binary = isBinary(buf);
  const text = binary ? buf.toString('latin1') : buf.toString('utf8');
  const lineOf = lineIndex(text);

  if (families.includes('secret') && !skipped(allow, 'secret', path)) {
    for (const r of SECRET_RULES) {
      if (binary && !BINARY_SAFE.has(r.id)) continue;
      for (const m of text.matchAll(r.re)) {
        const value = r.group ? m[r.group] : m[0];
        const start = m.index, end = m.index + m[0].length;
        const ctx = contextOf(text, start, end, value);
        // A format rule is downgraded only when the VALUE is a placeholder; a name rule when the line is.
        const lineText = text.slice(text.lastIndexOf('\n', start) + 1, (text.indexOf('\n', end) + 1 || text.length + 1) - 1);
        const placeholder = r.group ? PLACEHOLDER.test(lineText) : PLACEHOLDER.test(value);
        out.push(finding('secret', r.id, placeholder ? 'info' : r.sev, path, lineOf(start), value, ctx, allow));
      }
    }
    // anthropic-loose duplicates anthropic-key on the same span; keep the specific one
    dedupeSpans(out);
  }

  if (!binary && families.includes('pii') && PII_TEXT_EXT.test(path) && !skipped(allow, 'pii', path)) {
    for (const r of PII_RULES) {
      if (piiLevel === 'high' && r.sev !== 'high') continue;
      if (r.ext && !r.ext.test(path)) continue;
      for (const m of text.matchAll(r.re)) {
        const value = m[0];
        if (r.id === 'email' && EMAIL_IGNORE.test(value)) continue;
        if (r.luhn && !luhn(value)) continue;
        out.push(finding('pii', r.id, r.sev, path, lineOf(m.index), value, contextOf(text, m.index, m.index + value.length, value), allow));
      }
    }
  }

  if (!binary && families.includes('inject') && INJECT_TEXT_EXT.test(path) && !skipped(allow, 'inject', path)) {
    for (const r of INJECT_RULES) {
      for (const m of text.matchAll(r.re)) {
        const value = m[0];
        const shown = /^[​-‍⁠‪-‮⁦-⁩]+$|^[\u{E0000}-\u{E007F}]+$/u.test(value)
          ? `${[...value].length} invisible char(s) U+${value.codePointAt(0).toString(16).toUpperCase()}` : value;
        out.push(finding('inject', r.id, r.sev, path, lineOf(m.index), value,
          contextOf(text, m.index, m.index + value.length, value).replace(value, `⟦${shown}⟧`), allow, null, shown));
      }
    }
  }
  return out;
}

function dedupeSpans(list) {
  const seen = new Set();
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    const key = `${f.path}:${f.line}:${f.masked}`;
    if (seen.has(key)) { list.splice(i--, 1); continue; }
    seen.add(key);
  }
}

export function finding(family, rule, sev, path, line, value, context, allow, fpValue = null, shown = null) {
  const fp = fingerprint(rule, path, fpValue ?? value);
  const vfp = fingerprint(rule, '*', fpValue ?? value);
  const allowed = !!allow && (allow.fp.has(fp) || allow.vfp.has(vfp));
  return { family, rule, sev, path, line, masked: shown ?? mask(value), fp, vfp, allowed, context };
}

export function scanPaths(paths, allow) {
  const out = [];
  for (const p of paths) {
    for (const r of PATH_RULES) {
      if (r.re.test(p) && !(r.except && r.except.test(p))) {
        out.push(finding('path', r.id, r.sev, p, 0, p, 'file of a kind that should not be tracked', allow, null, p.split('/').pop()));
      }
    }
  }
  return out;
}

// The file names in a zip's central directory (stored uncompressed, so no unzip is needed).
export function zipMembers(buf) {
  const names = [];
  for (let i = buf.indexOf('PK\x01\x02', 0, 'latin1'); i >= 0 && i + 46 <= buf.length; i = buf.indexOf('PK\x01\x02', i + 4, 'latin1')) {
    const n = buf.readUInt16LE(i + 28);
    if (i + 46 + n <= buf.length) names.push(buf.toString('utf8', i + 46, i + 46 + n));
  }
  return names;
}

// Minimal JPEG EXIF walk: is there a GPS IFD (tag 0x8825) with a latitude in it?
export function jpegHasGps(buf) {
  if (buf.length < 4 || buf[0] !== 0xFF || buf[1] !== 0xD8) return false;
  let i = 2;
  while (i + 4 < buf.length && buf[i] === 0xFF) {
    const marker = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (marker === 0xE1 && buf.toString('latin1', i + 4, i + 10) === 'Exif\0\0') {
      const t = i + 10, le = buf.toString('latin1', t, t + 2) === 'II';
      const u16 = o => le ? buf.readUInt16LE(t + o) : buf.readUInt16BE(t + o);
      const u32 = o => le ? buf.readUInt32LE(t + o) : buf.readUInt32BE(t + o);
      try {
        const ifd0 = u32(4), n = u16(ifd0);
        for (let k = 0; k < n; k++) {
          const e = ifd0 + 2 + k * 12;
          if (u16(e) === 0x8825) {
            const gps = u32(e + 8), gn = u16(gps);
            for (let g = 0; g < gn; g++) if (u16(gps + 2 + g * 12) === 0x0002) return true;
          }
        }
      } catch { return false; }
      return false;
    }
    if (marker === 0xDA) break; // start of scan — no more metadata
    i += 2 + len;
  }
  return false;
}

// Stream blobs out of `git cat-file --batch` without holding them all in memory.
export async function* catBlobs(root, oids) {
  const p = spawn('git', ['cat-file', '--batch'], { cwd: root, stdio: ['pipe', 'pipe', 'inherit'] });
  p.stdin.on('error', () => {});
  p.stdin.end(oids.join('\n') + (oids.length ? '\n' : ''));
  let chunks = [], have = 0, want = null, oid = null;
  const take = n => {
    const all = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, have);
    const head = all.subarray(0, n), rest = all.subarray(n);
    chunks = rest.length ? [rest] : []; have = rest.length;
    return head;
  };
  for await (const chunk of p.stdout) {
    chunks.push(chunk); have += chunk.length;
    for (;;) {
      if (want === null) {
        const all = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, have);
        chunks = [all];
        const nl = all.indexOf(10);
        if (nl < 0) break;
        const header = take(nl + 1).toString('utf8').trim().split(' ');
        if (header[1] === 'missing') continue;
        oid = header[0]; want = Number(header[2]);
      }
      if (have < want + 1) break;
      const data = take(want + 1).subarray(0, want);
      yield { oid, data };
      want = null;
    }
  }
}

// Objects (with a path) reachable from `revArgs` — e.g. ['--all'] or ['B', '^A'].
export function listBlobs(root, revArgs) {
  const out = execFileSync('git', ['rev-list', '--objects', ...revArgs], { cwd: root, maxBuffer: 1 << 30 });
  const paths = new Map();
  for (const line of out.toString('utf8').split('\n')) {
    const sp = line.indexOf(' ');
    if (sp > 0 && !paths.has(line.slice(0, sp))) paths.set(line.slice(0, sp), line.slice(sp + 1));
  }
  if (!paths.size) return [];
  const chk = execFileSync('git', ['cat-file', '--batch-check=%(objecttype) %(objectname) %(objectsize)'],
    { cwd: root, input: [...paths.keys()].join('\n') + '\n', maxBuffer: 1 << 30 }).toString('utf8');
  const blobs = [];
  for (const line of chk.split('\n')) {
    const [type, oid, size] = line.split(' ');
    if (type === 'blob') blobs.push({ oid, path: paths.get(oid), size: Number(size) });
  }
  return blobs;
}

export async function scanBlobs(root, blobs, opts) {
  const findings = [], skippedLarge = [];
  const wanted = [];
  for (const b of blobs) {
    if (MEDIA_EXT.test(b.path)) continue;
    if (b.size > MAX_BYTES) { skippedLarge.push(b); continue; }
    wanted.push(b);
  }
  const pathOf = new Map(wanted.map(b => [b.oid, b.path]));
  for await (const { oid, data } of catBlobs(root, wanted.map(b => b.oid))) {
    for (const f of scanContent(pathOf.get(oid), data, opts)) { f.blob = oid; findings.push(f); }
  }
  return { findings, scanned: wanted.length, skippedLarge };
}

export function hasGitleaks() {
  try { return execFileSync('gitleaks', ['version'], { encoding: 'utf8' }).trim(); } catch { return null; }
}

export function sortFindings(list) {
  return list.sort((a, b) => (SEV_RANK[b.sev] - SEV_RANK[a.sev]) || a.path.localeCompare(b.path) || a.line - b.line);
}
