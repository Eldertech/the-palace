#!/usr/bin/env node
// build-public.mjs — build the palace's public read view: STIGMERGY's STATE
// deck, static and read-only (Loudon Live.md, the public surface settled
// 2026-09-25: two doors — this read view, or git).
//
//   node scripts/build-public.mjs [--out dist-public] [--base /] [--site-url <url>] [--root <palace>] [--no-vite]
//
// --base is the path the site is served under ('/' on a domain of its own);
// --site-url its full address, for link previews. The GitHub workflow takes
// both from the Pages configuration, so nothing here names the account.
//
// 1. The app: `vite build` with VITE_PUBLIC=1, so only the STATE deck ships.
// 2. The snapshot: the same functions the /api server runs (listEntries,
//    readEntry, buildEntryTree, readLatestMap, findUnsungEdges), filtered to
//    the published set and written as JSON under data/.
// 3. The files those pages show, under files/: heroes, icons, body images;
//    for a rich face, its text, manifest and pieces — and the rich face page
//    itself under rich/, in static mode.
//
// What publishes is canon — an entry with frontmatter and a type — and its
// faces, never its memory (CLAUDE.md § A page and its folder). Memory stays
// in git: Context companions, handoffs, batons, ledgers, logs, dossiers. A
// scroll shows only The making; its Now (regenerated from the board) and its
// Standing Orders stay in STIGMERGY. Nothing from the board is published.

import { mkdirSync, writeFileSync, copyFileSync, readFileSync, readdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { resolve, join, dirname, relative, sep, normalize, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { listEntries, readEntry, walkEntryRecords } from '../src/lib/entries.js';
import { buildEntryTree } from '../src/lib/entry-tree.js';
import { readLatestMap } from '../src/lib/topology.js';
import { findUnsungEdges, buildPalaceIndex } from '../src/lib/unsung-paths.js';
import { pathId, encodeSegments } from '../src/lib/public-mode.js';
import { makeFinder } from '../../../rich-face/palace-find.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, '..');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) a[k.slice(2)] = true;
    else { a[k.slice(2)] = next; i++; }
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));
const ROOT = resolve(args.root || process.env.PALACE_ROOT || resolve(APP, '../../..'));
const OUT = resolve(APP, args.out || 'dist-public');
const BASE = (() => { let b = String(args.base || '/'); if (!b.startsWith('/')) b = `/${b}`; return b.endsWith('/') ? b : `${b}/`; })();
const SITE_URL = typeof args['site-url'] === 'string' ? args['site-url'].replace(/\/+$/, '') : null;
// The repository the build came from — GitHub's own environment in Actions,
// else this checkout's remote — so a renamed account needs no code change.
const REPO = (() => {
  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY) return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;
  try {
    const url = execFileSync('git', ['-C', ROOT, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const m = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
    return m ? `https://github.com/${m[1]}` : null;
  } catch { return null; }
})();
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// GitHub Pages refuses a file over 100 MB; stay well under, and say what was left out.
const MAX_FILE = 25 * 1024 * 1024;

// Images are sized for the page, not the archive: an icon shows at 15–38 px and
// a hero as a backdrop, yet both are ~1 MB PNGs in the palace. Icons become
// 128 px PNGs; heroes 1600 px JPEGs (served as `.jpg`; `name` keeps the
// original so embeds still resolve by name). macOS `sips` or ImageMagick;
// with neither, files are copied as they are.
const IMG_TOOL = (() => {
  const has = (cmd) => { try { execFileSync('which', [cmd], { stdio: 'ignore' }); return true; } catch { return false; } };
  if (process.platform === 'darwin' && has('sips')) return 'sips';
  if (has('magick')) return 'magick';
  if (has('convert')) return 'convert';
  return null;
})();
const IS_HERO = / — hero\.png$/i;
const IS_ICON = / — icon\.png$/i;
const CACHE = join(APP, 'node_modules', '.cache', 'public-read-view');
// The path a palace file is served at in the read view.
const servedAs = (rel) => (IMG_TOOL && IS_HERO.test(rel) ? rel.replace(/\.png$/i, '.jpg') : rel);
const servedFile = (f) => ({ ...f, relPath: servedAs(f.relPath) });

// Memory, by the suffix its name carries. These stay in git.
const MEMORY = / — (Context|Handoff|baton|tuning|ledger|Log|dossier)( |$)/i;
const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
const RICH_MEDIA = /\.(mp4|webm|mov|wav|mp3|png|jpe?g|gif|webp|svg|html?|md)$/i;
// What a text may link a reader to: its media, never its code or working docs.
const LINKABLE = /\.(mp4|webm|mov|wav|mp3|ogg|m4a|flac|png|jpe?g|gif|webp|svg|avif|html?|pdf)$/i;
const SCROLL_MARK = {
  nowStart: '<!-- scroll:now:start -->', nowEnd: '<!-- scroll:now:end -->',
  ordersStart: '<!-- scroll:orders:start -->', ordersEnd: '<!-- scroll:orders:end -->',
  makingStart: '<!-- scroll:making:start -->',
};

const stemOf = (p) => p.split('/').pop().replace(/\.md$/, '');
const toRel = (abs) => relative(ROOT, abs).split(sep).join('/');
const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function writeJson(rel, data) {
  const abs = join(OUT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(data));
}

// ── 1. the app ──────────────────────────────────────────────────────────────
if (!args['no-vite']) {
  process.env.VITE_PUBLIC = '1';
  const { build } = await import('vite');
  await build({
    root: APP,
    configFile: join(APP, 'vite.config.js'),
    mode: 'public',
    base: BASE,
    logLevel: 'warn',
    build: { outDir: OUT, emptyOutDir: true },
  });
} else {
  rmSync(join(OUT, 'data'), { recursive: true, force: true });
  rmSync(join(OUT, 'files'), { recursive: true, force: true });
  rmSync(join(OUT, 'rich'), { recursive: true, force: true });
}

// ── 2. the published set ────────────────────────────────────────────────────
const all = listEntries(ROOT);
const published = all.filter((e) => e.type && !MEMORY.test(stemOf(e.path)));
const pubPaths = new Set(published.map((e) => e.path));
// Each published entry's scroll, by the bundle convention (`<Name>/<Name> — scroll.md`).
const scrollOf = (e) => (Array.isArray(e.faces) && e.faces.includes('scroll')
  ? `${e.path.replace(/\.md$/, '')}/${stemOf(e.path)} — scroll.md` : null);
const readablePaths = new Set([...pubPaths, ...published.map(scrollOf).filter(Boolean)]);
const finder = makeFinder(ROOT);

// Where a link or embed in `fromPath` lands, the way a reader would find it:
// beside the text, from the palace root, in the entry's bundle, then by name
// anywhere (Obsidian's rule). Palace-relative, or null.
function resolveLink(target, fromPath) {
  const isFile = (rel) => {
    if (!rel || rel.startsWith('..')) return false;
    const abs = join(ROOT, rel);
    return abs.startsWith(ROOT + sep) && existsSync(abs) && statSync(abs).isFile();
  };
  const here = posix.dirname(fromPath);
  const candidates = [
    posix.normalize(posix.join(here === '.' ? '' : here, target)),
    posix.normalize(target),
    posix.join(fromPath.replace(/\.md$/, ''), target),
  ];
  for (const c of candidates) if (isFile(c)) return c;
  const hit = finder.findByName(target.split('/').pop(), join(ROOT, fromPath.replace(/\.md$/, '')));
  return hit ? toRel(hit) : null;
}

const files = new Set();   // palace-relative paths copied under files/
const skipped = [];        // { path, reason }
function addFile(rel) {
  if (!rel || files.has(rel)) return !!rel;
  const abs = join(ROOT, rel);
  if (!abs.startsWith(ROOT + sep) || !existsSync(abs) || !statSync(abs).isFile()) { skipped.push({ path: rel, reason: 'missing' }); return false; }
  const size = statSync(abs).size;
  if (size > MAX_FILE) { skipped.push({ path: rel, reason: `${(size / 1048576).toFixed(1)} MB > 25 MB` }); return false; }
  files.add(rel);
  return true;
}

// The board's marks and the workshop's are not the reader's business.
function publicSummary(s) {
  return { ...s, has_active_handoff: false, has_stewardship_marker: false };
}

// Embed targets in a body, the way EntryBody resolves them: `![[name]]`, `![](path)`.
function embedTargets(body) {
  const out = [];
  for (const m of body.matchAll(/!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) out.push(m[1].trim());
  for (const m of body.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?\s*\)/g)) out.push(safeDecode(m[1].trim()));
  return out;
}
function resolveInBundle(target, bundleFiles) {
  const base = target.split('/').pop();
  return bundleFiles.find((f) => f.name === target || f.name === base || f.relPath === target || f.relPath.split('/').pop() === base) || null;
}

// A published text's links, made to work for a reader who has only the read
// view: media it links (a scroll's proofs, an entry's pieces) are copied and
// linked beside the page; a published entry opens in the reader; anything
// else — code, working docs, Obsidian or open: links to what wasn't published —
// keeps its words and loses the link. Embeds (`![…]`) are resolved elsewhere.
function publicBody(body, fromPath) {
  return body.replace(/(!?)\[([^\]\n]*)\]\(\s*<?([^)>\n]+?)>?\s*\)/g, (whole, bang, label, raw) => {
    if (bang) return whole;
    const target = raw.trim().replace(/\s+"[^"]*"$/, '');
    if (/^(https?:|mailto:|#|\?)/i.test(target)) return whole;
    let rel = target;
    if (/^open:/i.test(rel)) rel = rel.slice(5).split('?')[0];
    else if (/^[a-z][a-z0-9+.-]*:/i.test(rel) || rel.startsWith('/')) return label;
    rel = safeDecode(rel.split('#')[0]);
    const found = resolveLink(rel, fromPath);
    if (!found) return label;
    if (/\.md$/i.test(found)) return readablePaths.has(found) ? `[${label}](?entry=${encodeURIComponent(found)})` : label;
    if (LINKABLE.test(found) && addFile(found)) return `[${label}](files/${encodeSegments(servedAs(found))})`;
    return label;
  });
}

// A scroll's public shape: its title and The making, nothing regenerated.
function makingOnly(body) {
  const title = (body.match(/^# .*$/m) || [''])[0];
  const at = body.indexOf(SCROLL_MARK.makingStart);
  if (at === -1) {
    let b = body;
    for (const [s, e] of [[SCROLL_MARK.nowStart, SCROLL_MARK.nowEnd], [SCROLL_MARK.ordersStart, SCROLL_MARK.ordersEnd]]) {
      const i = b.indexOf(s), j = b.indexOf(e);
      if (i !== -1 && j > i) b = b.slice(0, i) + b.slice(j + e.length);
    }
    return b;
  }
  const heading = body.lastIndexOf('\n## ', at);
  const rest = heading !== -1 ? body.slice(heading + 1) : body.slice(at);
  const note = '> Everything this page has made, newest first. Where it stands now lives in the palace itself.';
  return `${title}\n\n${note}\n\n${rest}`;
}

// ── 3. one JSON per entry ───────────────────────────────────────────────────
const written = new Map(); // id → path, to refuse a collision
function writeEntry(path, entry) {
  const id = pathId(path);
  if (written.has(id) && written.get(id) !== path) throw new Error(`pathId collision: ${path} and ${written.get(id)} → ${id}`);
  written.set(id, path);
  writeJson(`data/entry/${id}.json`, entry);
}

const scrollPaths = new Set();
for (const s of published) {
  const e = readEntry(ROOT, s.path);
  if (!e) continue;
  const bundleFiles = e.bundle?.files || [];
  const keep = new Map();
  const hero = bundleFiles.find((f) => f.name === `${e.title} — hero.png`) || bundleFiles.find((f) => / — hero\.png$/i.test(f.name));
  if (hero) keep.set(hero.relPath, hero);
  if (e.summary.icon) {
    const icon = bundleFiles.find((f) => f.relPath === e.summary.icon);
    if (icon) keep.set(icon.relPath, icon); else addFile(e.summary.icon);
  }
  for (const t of embedTargets(e.body || '')) {
    if (/^https?:\/\//i.test(t) || !IMAGE.test(t)) continue;
    const hit = resolveInBundle(t, bundleFiles);
    if (hit) keep.set(hit.relPath, hit);
    else { const found = resolveLink(t, e.path); if (found) addFile(found); }
  }
  const kept = [...keep.values()].filter((f) => addFile(f.relPath));

  // Faces: the rich face is published below; the scroll as its own snapshot.
  const faceFiles = { ...(e.face_files || {}) };
  if (faceFiles.scroll) scrollPaths.add(faceFiles.scroll);

  writeEntry(e.path, {
    ...e,
    body: publicBody(e.body || '', e.path),
    summary: publicSummary(e.summary),
    bundle: e.bundle ? { dir: e.bundle.dir, files: kept.map(servedFile) } : null,
    face_files: faceFiles,
  });
}

for (const path of scrollPaths) {
  const s = readEntry(ROOT, path);
  if (!s) continue;
  writeEntry(path, { ...s, body: publicBody(makingOnly(s.body || ''), path), bundle: null, summary: publicSummary(s.summary) });
}

// ── 4. the index, tree, map and unsung paths ────────────────────────────────
const day = localDay();
writeJson('data/entries.json', { entries: published.map(publicSummary), count: published.length, ts: new Date().toISOString() });

const shownPaths = new Set([...pubPaths, ...scrollPaths]);
const tree = buildEntryTree(ROOT);
const counts = { folders: 0, entries: 0, bundles: 0, bundleFiles: 0, looseFiles: 0 };
function filterTree(node) {
  if (node.kind === 'folder') {
    const children = (node.children || []).map(filterTree).filter(Boolean);
    if (!children.length && node.path !== '') return null;
    if (node.path !== '') counts.folders++;
    return { ...node, children };
  }
  if (node.kind === 'entry') {
    if (!pubPaths.has(node.path)) return null;
    counts.entries++;
    const out = { ...node, summary: node.summary ? publicSummary(node.summary) : node.summary };
    if (node.bundle) {
      const kept = (node.bundle.files || []).filter((f) => files.has(f.relPath) || shownPaths.has(f.relPath));
      out.bundle = kept.length ? { ...node.bundle, files: kept.map(servedFile) } : null;
      if (out.bundle) { counts.bundles++; counts.bundleFiles += kept.length; }
    }
    return out;
  }
  return null; // loose files are workshop
}
writeJson('data/tree.json', { root: filterTree(tree.root), counts, ts: new Date().toISOString() });

let linkCount = 0;
const map = readLatestMap(ROOT);
if (map) {
  const nodes = map.nodes.filter((n) => pubPaths.has(n.path));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = map.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  const { ghost_taxonomy, ...meta } = map.meta || {};
  linkCount = edges.length;
  writeJson('data/topology.json', { source: map.source, meta: { ...meta, node_count: nodes.length, edge_count: edges.length }, nodes, edges });
}

const records = [];
for (const r of walkEntryRecords(ROOT)) if (pubPaths.has(r.path)) records.push(r);
const edges = findUnsungEdges(records, buildPalaceIndex(records));
writeJson('data/unsung-paths.json', { edges, entry_count: records.length, edge_count: edges.length, ts: new Date().toISOString() });

// ── 5. rich faces ───────────────────────────────────────────────────────────
const rich = {};
const namePaths = Object.fromEntries(published.map((e) => [stemOf(e.path), e.path]));
for (const s of published) {
  if (!Array.isArray(s.faces) || !s.faces.includes('rich')) continue;
  const e = readEntry(ROOT, s.path);
  const stem = stemOf(e.path);
  const bundleRel = e.path.replace(/\.md$/, '');
  const manifestRel = e.face_files?.rich;
  if (!manifestRel || !addFile(e.path) || !addFile(manifestRel)) continue;
  const names = new Set();
  (function collect(v, key) {
    if (Array.isArray(v)) v.forEach((x) => collect(x, key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) collect(x, k);
    else if (typeof v === 'string' && (key === 'file' || key === 'name') && RICH_MEDIA.test(v)) names.add(v);
  })(JSON.parse(readFileSync(join(ROOT, manifestRel), 'utf8')));
  for (const m of (e.body || '').matchAll(/!?\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)) if (RICH_MEDIA.test(m[1].trim())) names.add(m[1].trim());
  const media = {};
  for (const n of names) {
    const hit = finder.findByName(n, join(ROOT, bundleRel));
    if (hit && addFile(toRel(hit))) media[n] = `../files/${encodeSegments(servedAs(toRel(hit)))}`;
  }
  let bundleNames = [];
  try { bundleNames = readdirSync(join(ROOT, bundleRel)).filter((f) => !f.startsWith('.')); } catch { /* none */ }
  rich[stem] = {
    title: stem,
    path: e.path,
    md: `../files/${encodeSegments(e.path)}`,
    bundle: `../files/${encodeSegments(bundleRel)}/`,
    manifest: `../files/${encodeSegments(manifestRel)}`,
    // Only what was copied is listed, so the page never reaches for a file that isn't there.
    files: bundleNames.filter((f) => files.has(`${bundleRel}/${f}`) || shownPaths.has(`${bundleRel}/${f}`)),
    media,
    paths: namePaths,
  };
}
writeJson('data/rich.json', { entries: rich });

const richSrc = join(APP, '../../rich-face/rich.html');
const richHtml = readFileSync(richSrc, 'utf8')
  .replace('<script type="module">', '<script>window.RICH_STATIC = true;</script>\n<script type="module">')
  .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">');
if (!richHtml.includes('window.RICH_STATIC = true')) throw new Error('rich.html: could not mark it static');
mkdirSync(join(OUT, 'rich'), { recursive: true });
writeFileSync(join(OUT, 'rich/index.html'), richHtml);
// The renderer's own module, which the live handler serves as _rich/parse.js.
mkdirSync(join(OUT, 'rich/_rich'), { recursive: true });
copyFileSync(join(APP, '../../rich-face/parse.js'), join(OUT, 'rich/_rich/parse.js'));
const css = '_ops/loudon-live/design-system/colors_and_type.css';
mkdirSync(dirname(join(OUT, 'rich', css)), { recursive: true });
copyFileSync(join(ROOT, css), join(OUT, 'rich', css));

// ── 6. the files ────────────────────────────────────────────────────────────
function shrink(src, dest, kind) {
  const st = statSync(src);
  const key = createHash('sha1').update(`${kind}|${src}|${st.size}|${st.mtimeMs}|${IMG_TOOL}`).digest('hex');
  const cached = join(CACHE, `${key}${kind === 'hero' ? '.jpg' : '.png'}`);
  if (!existsSync(cached)) {
    mkdirSync(CACHE, { recursive: true });
    const size = kind === 'hero' ? 1600 : 128;
    if (IMG_TOOL === 'sips') {
      const a = ['-Z', String(size)];
      if (kind === 'hero') a.push('-s', 'format', 'jpeg', '-s', 'formatOptions', '78');
      execFileSync('sips', [...a, src, '--out', cached], { stdio: 'ignore' });
    } else {
      const a = [src, '-resize', `${size}x${size}>`];
      if (kind === 'hero') a.push('-quality', '78');
      execFileSync(IMG_TOOL, [...a, cached], { stdio: 'ignore' });
    }
  }
  copyFileSync(cached, dest);
}

let bytes = 0;
for (const rel of files) {
  const dest = join(OUT, 'files', servedAs(rel));
  mkdirSync(dirname(dest), { recursive: true });
  const kind = IS_HERO.test(rel) ? 'hero' : IS_ICON.test(rel) ? 'icon' : null;
  if (IMG_TOOL && kind) shrink(join(ROOT, rel), dest, kind);
  else copyFileSync(join(ROOT, rel), dest);
  bytes += statSync(dest).size;
}

// public/ ships with every build; the read view has no Trickster deck.
rmSync(join(OUT, 'trickster-assets'), { recursive: true, force: true });

// GitHub Pages runs Jekyll unless told not to, and Jekyll drops `_ops/`.
writeFileSync(join(OUT, '.nojekyll'), '');

let commit = null;
try { commit = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }
const meta = {
  day, built: new Date().toISOString(), commit, base: BASE, site: SITE_URL, repo: REPO, images: IMG_TOOL || 'as-is',
  counts: { entries: published.length, links: linkCount, scrolls: scrollPaths.size, rich: Object.keys(rich).length, files: files.size, file_mb: +(bytes / 1048576).toFixed(1) },
  left_in_git: all.filter((e) => e.type && MEMORY.test(stemOf(e.path))).map((e) => e.path),
  skipped,
};
writeJson('data/meta.json', meta);

// ── 7. the head, the 404, and staying out of search ─────────────────────────
// Kept out of search engines for now (Loudon, 2026-09-26): a robots meta on
// every page, and robots.txt for when the site has a domain of its own (a
// robots.txt only counts at a host's root). Link previews still work — a
// message app reads the og: tags whatever robots says.
const DESCRIPTION = "A read view of Loudon Stearns's palace — a web of connected pages on music, tools, philosophy and practice.";
const cardHero = (() => {
  const four = published.find((e) => stemOf(e.path) === 'FOUR PILLARS');
  const rel = four ? `${four.path.replace(/\.md$/, '')}/FOUR PILLARS — hero.png` : null;
  return rel && files.has(rel) ? servedAs(rel) : null;
})();
const head = [
  '<!-- read-view:head -->',
  '<title>The Palace · Loudon Stearns</title>',
  '<meta name="robots" content="noindex, nofollow" />',
  `<meta name="description" content="${escapeHtml(DESCRIPTION)}" />`,
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="The Palace" />',
  '<meta property="og:title" content="The Palace · Loudon Stearns" />',
  `<meta property="og:description" content="${escapeHtml(DESCRIPTION)}" />`,
  ...(SITE_URL ? [
    `<meta property="og:url" content="${escapeHtml(SITE_URL)}/" />`,
    ...(cardHero ? [
      `<meta property="og:image" content="${escapeHtml(`${SITE_URL}/files/${encodeSegments(cardHero)}`)}" />`,
      '<meta name="twitter:card" content="summary_large_image" />',
    ] : []),
  ] : []),
  '<!-- /read-view:head -->',
].join('\n    ');
const indexPath = join(OUT, 'index.html');
const indexHtml = readFileSync(indexPath, 'utf8');
writeFileSync(indexPath, indexHtml.includes('<!-- read-view:head -->')
  ? indexHtml.replace(/<!-- read-view:head -->[\s\S]*?<!-- \/read-view:head -->/, head)
  : indexHtml.replace(/<title>[^<]*<\/title>/, head));
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

// A path that isn't there at all gets the BBS's own answer: the dial never
// connects. Same words as the in-app screen (src/components/public/NoCarrier.jsx).
const appCss = readdirSync(join(OUT, 'assets')).find((f) => /^index-.*\.css$/.test(f));
const NO_CARRIER_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>NO CARRIER · The Palace</title>
${appCss ? `<link rel="stylesheet" href="${BASE}assets/${appCss}" />` : ''}
<style>
  body { margin: 0; min-height: 100vh; background: var(--bg, #0a0f0a); color: var(--phosphor, #33ff66); font-family: var(--font-body, monospace); }
  main { max-width: 80ch; margin: 0 auto; padding: 32px 20px; }
  .dim { color: var(--phosphor-dim, #1f9e3f); text-shadow: none; font-size: 14px; line-height: 1.7; }
  .dial { overflow-wrap: anywhere; }
  h1 { margin: 10px 0 0; font: 400 44px/1 var(--font-display, monospace); color: var(--error, #ff4d4d); text-shadow: 0 0 8px var(--error, #ff4d4d); letter-spacing: .04em; }
  .box { margin-top: 16px; border: 3px double var(--phosphor-dim, #1f9e3f); }
  .box .t { padding: 2px 12px; border-bottom: 1px solid var(--phosphor-dim, #1f9e3f); font-size: 12px; letter-spacing: .06em; }
  .box p { margin: 0; padding: 12px; font-size: 14px; line-height: 1.6; text-shadow: var(--glow, none); }
  nav { margin-top: 14px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
  nav a { color: var(--phosphor, #33ff66); text-shadow: var(--glow, none); text-decoration: none; border: 2px solid var(--phosphor-dim, #1f9e3f); padding: 3px 10px; }
  nav a:first-child { border-color: var(--phosphor, #33ff66); }
  nav b { color: var(--phosphor-white, #eaffea); }
</style>
</head>
<body>
<main>
  <div class="dim">
    <div class="dial">ATDT <span id="dialed">???</span></div>
    <div>RING... RING... RING...</div>
    <div>BUSY</div>
  </div>
  <h1>NO CARRIER</h1>
  <div class="box">
    <div class="t">ERR 404 · NOT ON THIS BOARD</div>
    <p>the page you dialed isn't in the read view. it may have moved or been renamed, or it lives in the palace's memory, which stays in git.</p>
  </div>
  <nav>
    <a href="${BASE}">[<b>R</b>]&nbsp;redial the palace</a>
    ${REPO ? `<a href="${escapeHtml(REPO)}" target="_blank" rel="noopener noreferrer">[<b>G</b>]&nbsp;the whole house, in git</a>` : ''}
  </nav>
</main>
<script>
  document.getElementById('dialed').textContent = decodeURIComponent(location.pathname + location.search);
  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') location.href = ${JSON.stringify(BASE)};
    ${REPO ? `if (e.key === 'g' || e.key === 'G') open(${JSON.stringify(REPO)}, '_blank', 'noopener');` : ''}
  });
</script>
</body>
</html>
`;
writeFileSync(join(OUT, '404.html'), NO_CARRIER_HTML);

console.log(`read view → ${relative(process.cwd(), OUT) || '.'}  (base ${BASE}, ${day}${commit ? `, ${commit}` : ''})`);
console.log(`  ${published.length} entries · ${scrollPaths.size} scrolls · ${Object.keys(rich).length} rich · ${files.size} files, ${meta.counts.file_mb} MB`);
console.log(`  memory left in git: ${meta.left_in_git.length} canon entries`);
if (skipped.length) console.log(`  skipped ${skipped.length}: ${skipped.slice(0, 8).map((s) => `${s.path} (${s.reason})`).join('; ')}${skipped.length > 8 ? ' …' : ''}`);
