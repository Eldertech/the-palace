#!/usr/bin/env node
// The Sentry's sweep — one command, every check, masked output.
//
//   node _ops/sentry/sweep.mjs                 quick: tree, paths, agents (offline, ~seconds)
//   node _ops/sentry/sweep.mjs --deep          + history (every blob in every ref, and gitleaks),
//                                                deps (npm audit), hosting (GitHub settings) — network
//   node _ops/sentry/sweep.mjs --gate          the before-going-more-public check: --deep, exits 1 on any open high
//   node _ops/sentry/sweep.mjs --only history  run named checks (comma list)
//   node _ops/sentry/sweep.mjs --record        also write the run into the public scroll (counts only)
//   node _ops/sentry/sweep.mjs --selftest      prove the rules still catch planted secrets
//   node _ops/sentry/sweep.mjs --json          machine output
//
// Where things go: the full masked report goes to _ops/sentry/held/ (gitignored — it names
// paths, and open findings are not published). The scroll gets one line per recorded run:
// what was checked and how much was found, never where. See [[Sentry]].

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
  SENTRY_DIR, repoRoot, git, heldDir, loadAllow, scanContent, scanPaths, listBlobs, scanBlobs,
  hasGitleaks, sortFindings, finding, MEDIA_EXT, JPEG_EXT, MAX_BYTES,
} from './engine.mjs';
import { SCRIPT_EXT, INVENTORY_RULES, mask, fingerprint, SEV_RANK } from './rules.mjs';

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };

const ROOT = repoRoot();
const HELD = heldDir(ROOT);
const PAGE = join(ROOT, 'Palace development', 'Sentry.md');
const LEDGER = join(ROOT, 'Palace development', 'Sentry', 'Sentry — tuning.md');
const ALL_CHECKS = ['tree', 'paths', 'agents', 'history', 'deps', 'hosting'];
const QUICK = ['tree', 'paths', 'agents'];

async function main() {
  if (flag('--selftest')) return selftest();
  const gate = flag('--gate');
  const deep = flag('--deep') || gate;
  const checks = opt('--only') ? opt('--only').split(',') : deep ? ALL_CHECKS : QUICK;
  const allow = loadAllow();
  const report = { when: new Date().toISOString(), head: git(ROOT, ['rev-parse', '--short', 'HEAD']).trim(),
    mode: gate ? 'gate' : deep ? 'deep' : opt('--only') ? 'targeted' : 'quick', checks: {}, findings: [], notes: [] };
  const gl = hasGitleaks();
  report.engines = { sentry: 'rules.mjs', gitleaks: gl || 'not installed' };

  for (const c of checks) {
    const t0 = Date.now();
    const r = await CHECKS[c](allow, report);
    report.checks[c] = { ...r.meta, ms: Date.now() - t0, found: r.findings.length };
    for (const f of r.findings) { f.check = c; report.findings.push(f); }
    log(`  ${c.padEnd(8)} ${String(r.findings.filter(f => !f.allowed && f.sev !== 'info').length).padStart(4)} raised · ${r.meta.summary || ''}`);
  }
  sortFindings(report.findings);
  const open = report.findings.filter(f => !f.allowed && f.sev !== 'info');
  report.counts = countBy(open);
  report.allowedCount = report.findings.filter(f => f.allowed).length;
  report.infoCount = report.findings.filter(f => !f.allowed && f.sev === 'info').length;

  writeFileSync(join(HELD, 'latest.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(HELD, 'latest.md'), renderHeld(report, open));
  if (flag('--record')) recordRun(report, open);

  if (flag('--json')) console.log(JSON.stringify(report, null, 2));
  else printSummary(report, open);
  if (gate && report.counts.high) process.exitCode = 1;
}

const log = s => { if (!flag('--json')) console.error(s); };
const countBy = list => list.reduce((a, f) => (a[f.sev] = (a[f.sev] || 0) + 1, a), { high: 0, medium: 0, low: 0 });

// ── the checks ────────────────────────────────────────────────────────────────
const CHECKS = {
  // What could be committed next: tracked files plus untracked-but-not-ignored ones, read from disk.
  async tree(allow) {
    const files = git(ROOT, ['ls-files', '-z', '-co', '--exclude-standard']).split('\0').filter(Boolean);
    const findings = []; let scanned = 0; const large = [];
    for (const p of files) {
      if (MEDIA_EXT.test(p)) continue;
      const abs = join(ROOT, p);
      let st; try { st = statSync(abs); } catch { continue; }
      if (!st.isFile()) continue;
      if (st.size > MAX_BYTES) { large.push(p); continue; }
      findings.push(...scanContent(p, readFileSync(abs), { allow })); scanned++;
    }
    return { findings, meta: { scanned, skippedLarge: large.length, summary: `${scanned} files read` } };
  },

  // Files that should never be tracked, and local secret files that must stay ignored.
  async paths(allow) {
    const files = git(ROOT, ['ls-files', '-z', '-co', '--exclude-standard']).split('\0').filter(Boolean);
    const findings = scanPaths(files, allow);
    for (const p of allow.mustStayIgnored) {
      let ignored = true;
      try { git(ROOT, ['check-ignore', '-q', p]); } catch { ignored = false; }
      if (!ignored) findings.push(finding('path', 'must-stay-ignored', 'high', p, 0, p, 'a known local secret file is no longer gitignored', allow, null, p));
    }
    return { findings, meta: { scanned: files.length, summary: `${files.length} paths, ${allow.mustStayIgnored.length} must-stay-ignored` } };
  },

  // Agent & tool safety: permission settings, and the census of scripts that delete or reach the network.
  async agents(allow, report) {
    const findings = [];
    const mainRoot = dirname(git(ROOT, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim());
    const settingsFiles = [...new Set([ROOT, mainRoot])].flatMap(r =>
      ['settings.json', 'settings.local.json'].map(f => join(r, '.claude', f))).filter(existsSync);
    for (const f of settingsFiles) findings.push(...judgeSettings(f, allow));

    const scripts = git(ROOT, ['ls-files', '-z']).split('\0').filter(p => SCRIPT_EXT.test(p) && !/node_modules|\/dist\/|\.min\.js$|\/vendor\//.test(p));
    const inventory = {};
    for (const p of scripts) {
      let text; try { text = readFileSync(join(ROOT, p), 'utf8'); } catch { continue; }
      const kinds = INVENTORY_RULES.filter(r => r.re.test(text)).map(r => r.id);
      if (kinds.length) inventory[p] = kinds;
    }
    const invPath = join(HELD, 'inventory.json');
    const prev = existsSync(invPath) ? JSON.parse(readFileSync(invPath, 'utf8')) : null;
    const added = prev ? Object.entries(inventory).filter(([p, k]) => !prev[p] || k.some(x => !prev[p].includes(x))) : [];
    for (const [p, k] of added) findings.push(finding('agent', `new-${k.join('+')}-script`, 'low', p, 0, p,
      `script newly ${k.join(' and ')} since the last sweep — read it once`, allow, null, p.split('/').pop()));
    writeFileSync(invPath, JSON.stringify(inventory, null, 2));
    const n = k => Object.values(inventory).filter(v => v.includes(k)).length;
    report.notes.push(`inventory: ${n('deletes')} scripts delete, ${n('network')} reach the network${prev ? `, ${added.length} new since last sweep` : ' (first census — baseline set)'}`);
    return { findings, meta: { settings: settingsFiles.length, scripts: scripts.length,
      summary: `${settingsFiles.length} settings files, ${scripts.length} scripts (${n('deletes')} delete, ${n('network')} network)` } };
  },

  // Every blob reachable from every ref, plus gitleaks over the full log when it is installed.
  async history(allow, report) {
    const blobs = listBlobs(ROOT, ['--all']);
    const { findings, scanned, skippedLarge } = await scanBlobs(ROOT, blobs,
      { families: ['secret', 'pii', 'inject'], piiLevel: 'high', allow });
    const kept = findings.filter(f => f.family !== 'inject' || f.sev === 'high'); // history: only the invisible-smuggling kind of inject
    const everPaths = [...new Set(git(ROOT, ['log', '--all', '--format=', '--name-only']).split('\n').filter(Boolean))];
    const pathHits = scanPaths(everPaths, allow).map(f => ({ ...f, context: 'in history: ' + f.context }));
    const all = [...kept, ...pathHits];
    for (const b of skippedLarge) report.notes.push(`history: a ${Math.round(b.size / 1e6)} MB blob was too large to read (${b.path.split('/').pop()})`);
    const gl = runGitleaks(['--log-opts=--all', '--max-archive-depth=3'], allow);
    all.push(...gl.findings);
    await markPublic(all);
    return { findings: all, meta: { blobs: blobs.length, scanned, gitleaks: gl.status,
      summary: `${scanned} blobs read of ${blobs.length}; gitleaks ${gl.status}` } };
  },

  // npm audit on every tracked package with a lockfile. Sends the dependency list to the npm registry.
  async deps(allow) {
    const pkgs = git(ROOT, ['ls-files', '-z']).split('\0').filter(p => /(^|\/)package-lock\.json$/.test(p));
    const findings = []; const meta = { packages: pkgs.length };
    for (const lock of pkgs) {
      const dir = dirname(lock);
      let out;
      try { out = execFileSync('npm', ['audit', '--json', '--omit=dev'], { cwd: join(ROOT, dir), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
      catch (e) { out = e.stdout; }
      let j; try { j = JSON.parse(out); } catch { findings.push(finding('deps', 'audit-failed', 'low', lock, 0, lock, 'npm audit did not return JSON (offline?)', allow, null, dir)); continue; }
      const v = j.metadata?.vulnerabilities || {};
      // One step below npm's own scale: most of these packages are local dev tooling, and npm rates
      // build-time advisories as if they shipped. Critical still blocks the gate.
      const sev = v.critical ? 'high' : v.high ? 'medium' : v.moderate || v.low ? 'low' : null;
      if (sev) findings.push(finding('deps', 'npm-audit', sev, lock, 0, `${lock}:${JSON.stringify(v)}`,
        `critical ${v.critical || 0} · high ${v.high || 0} · moderate ${v.moderate || 0} · low ${v.low || 0}`, allow, null, dir));
    }
    return { findings, meta: { ...meta, summary: `${pkgs.length} lockfiles audited` } };
  },

  // GitHub-side settings, read-only, through the gh CLI.
  async hosting(allow, report) {
    const findings = [];
    let slug;
    try { slug = git(ROOT, ['remote', 'get-url', 'origin']).trim().replace(/^.*github\.com[:\/]/, '').replace(/\.git$/, ''); }
    catch { return { findings, meta: { summary: 'no origin remote' } }; }
    const gh = path => { try { return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch (e) { return { __error: String(e.status ?? e.message) }; } };
    const repo = gh(`repos/${slug}`);
    if (repo.__error) return { findings: [finding('hosting', 'gh-unreachable', 'low', slug, 0, slug, 'could not read repo settings via gh', allow, null, slug)], meta: { summary: 'gh unavailable' } };
    const sa = repo.security_and_analysis || {};
    const want = { secret_scanning: 'medium', secret_scanning_push_protection: 'medium', dependabot_security_updates: 'low' };
    for (const [k, sev] of Object.entries(want)) {
      const status = sa[k]?.status ?? 'unknown';
      if (status !== 'enabled') findings.push(finding('hosting', `github-${k.replace(/_/g, '-')}`, sev, slug, 0, `${slug}:${k}`, `${k} is ${status}`, allow, null, k));
    }
    // GitHub's Dependabot reads every manifest, dev dependencies included — wider than the deps check.
    // Weighted like it: a runtime critical is high, a runtime high is medium, development is at most medium.
    const dep = gh(`repos/${slug}/dependabot/alerts?state=open&per_page=100`);
    if (Array.isArray(dep)) {
      const byManifest = {};
      for (const al of dep) {
        const m = al.dependency?.manifest_path || '?', sc = al.dependency?.scope || 'runtime', sv = al.security_advisory?.severity || 'low';
        const k = (byManifest[m] ||= { runtime: {}, development: {} });
        k[sc] = k[sc] || {}; k[sc][sv] = (k[sc][sv] || 0) + 1;
      }
      for (const [m, c] of Object.entries(byManifest)) {
        const r = c.runtime || {}, d = c.development || {};
        const sev = r.critical ? 'high' : r.high || d.critical ? 'medium' : 'low';
        const fmt = o => ['critical', 'high', 'medium', 'low'].filter(x => o[x]).map(x => `${x} ${o[x]}`).join(' · ') || 'none';
        findings.push(finding('hosting', 'dependabot-alerts', sev, m, 0, `${m}:${JSON.stringify(c)}`, `runtime: ${fmt(r)} — development: ${fmt(d)}`, allow, null, m));
      }
    }
    const pages = gh(`repos/${slug}/pages`);
    const alerts = gh(`repos/${slug}/secret-scanning/alerts?state=open&per_page=100`);
    if (Array.isArray(alerts) && alerts.length) findings.push(finding('hosting', 'github-secret-alerts', 'high', slug, 0, `${slug}:alerts:${alerts.length}`, `${alerts.length} open GitHub secret-scanning alert(s)`, allow, null, String(alerts.length)));
    report.notes.push(`hosting: ${slug} is ${repo.visibility}; Pages ${pages.__error ? 'off' : `on (${pages.html_url})`}; secret-scanning alerts ${Array.isArray(alerts) ? alerts.length : 'unreadable'}; Dependabot alerts ${Array.isArray(dep) ? dep.length : 'unreadable'}`);
    return { findings, meta: { visibility: repo.visibility, pages: !pages.__error, summary: `${repo.visibility}, Pages ${pages.__error ? 'off' : 'on'}` } };
  },
};

function judgeSettings(file, allow) {
  const out = [];
  let j; try { j = JSON.parse(readFileSync(file, 'utf8')); } catch { return out; }
  const where = (file.startsWith(ROOT + '/') ? '' : '(main checkout) ') + file.replace(dirname(dirname(file)) + '/', '');
  const rules = j.permissions?.allow || [];
  const broad = rules.filter(r => /^(Bash|Bash\(\*\)|Bash\(:\*\)|WebFetch|Write|Edit)$/.test(r) || /^Bash\((rm|curl|wget|sudo|git push|ssh|scp|chmod|chown|python3?|node|npx|bash|sh)(:\*| \*|\*)\)$/.test(r));
  for (const r of broad) out.push(finding('agent', 'broad-permission', 'low', where, 0, `${where}:${r}`, `allow rule "${r}" lets any agent run this without asking`, allow, null, r));
  if (j.permissions?.defaultMode === 'bypassPermissions') out.push(finding('agent', 'bypass-default', 'medium', where, 0, `${where}:bypass`, 'defaultMode is bypassPermissions — every agent here runs unprompted', allow, null, 'defaultMode'));
  for (const [k, v] of Object.entries(j.env || {})) {
    if (/key|token|secret|password/i.test(k) && String(v).length >= 12) out.push(finding('agent', 'secret-in-settings-env', 'medium', where, 0, String(v), `env ${k} holds a credential in a settings file`, allow, null, `${k}=${mask(v)}`));
  }
  return out;
}

function runGitleaks(gitArgs, allow) {
  if (!hasGitleaks()) return { findings: [], status: 'not installed' };
  const dir = mkdtempSync(join(tmpdir(), 'sentry-gl-'));
  const rp = join(dir, 'r.json');
  try {
    execFileSync('gitleaks', ['git', ...gitArgs, '--redact=100', '--report-format', 'json', '--report-path', rp, '--no-banner', '--exit-code', '0', '--log-level', 'error', ROOT], { stdio: 'ignore' });
    const raw = JSON.parse(readFileSync(rp, 'utf8'));
    const findings = raw.map(g => {
      const fp = fingerprint('gitleaks', g.RuleID, g.Fingerprint);
      return { family: 'secret', rule: `gitleaks:${g.RuleID}`, sev: /generic/.test(g.RuleID) ? 'medium' : 'high', path: g.File, line: g.StartLine,
        masked: '(redacted by gitleaks)', fp, vfp: fp, allowed: allow.gitleaks.has(fp), context: `commit ${g.Commit.slice(0, 8)} · entropy ${g.Entropy.toFixed(2)}`, commit: g.Commit };
    });
    return { findings, status: `${raw.length} raw` };
  } catch (e) { return { findings: [], status: `error (${e.status ?? e.message})` }; }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

// For history hits: the commit that introduced the blob, and whether a public ref can reach it.
async function markPublic(list) {
  const remotes = git(ROOT, ['for-each-ref', '--format=%(refname)', 'refs/remotes']).split('\n').filter(Boolean);
  const cache = new Map();
  for (const f of list) {
    if (f.allowed) continue;
    let commit = f.commit;
    if (!commit && f.blob) {
      commit = cache.get(f.blob) ?? git(ROOT, ['log', '--all', '--format=%H', '--reverse', `--find-object=${f.blob}`]).split('\n')[0];
      cache.set(f.blob, commit);
    }
    if (!commit && f.family === 'path') commit = git(ROOT, ['log', '--all', '--format=%H', '--reverse', '--', f.path]).split('\n')[0];
    if (!commit) continue;
    f.commit = commit;
    f.public = remotes.some(r => { try { git(ROOT, ['merge-base', '--is-ancestor', commit, r]); return true; } catch { return false; } });
  }
}

// ── output ────────────────────────────────────────────────────────────────────
function printSummary(report, open) {
  const c = report.counts;
  console.log(`\nSentry ${report.mode} sweep · ${report.head} · high ${c.high} · medium ${c.medium} · low ${c.low}` +
    ` · allowed ${report.allowedCount} · placeholders ${report.infoCount}`);
  for (const n of report.notes) console.log(`  note  ${n}`);
  const show = open.slice(0, Number(opt('--limit', 40)));
  for (const f of show) console.log(`  ${f.sev.padEnd(6)} ${f.family}/${f.rule}  ${f.path}${f.line ? ':' + f.line : ''}  ${f.masked}${f.public ? '  [PUBLIC]' : ''}`);
  if (open.length > show.length) console.log(`  … ${open.length - show.length} more in the held report`);
  console.log(`\nfull masked report: ${join(HELD, 'latest.md')} (local, never tracked)`);
}

function renderHeld(report, open) {
  const lines = [`# Sentry — held report (local, never commit)`, ``,
    `${report.when} · ${report.mode} · HEAD ${report.head} · checks: ${Object.keys(report.checks).join(', ')}`,
    `high ${report.counts.high} · medium ${report.counts.medium} · low ${report.counts.low} · allowed ${report.allowedCount} · placeholders ${report.infoCount}`, ``];
  for (const n of report.notes) lines.push(`- note: ${n}`);
  lines.push('', '| sev | check | rule | where | value | context | public | fp |', '|---|---|---|---|---|---|---|---|');
  for (const f of open) lines.push(`| ${f.sev} | ${f.check} | ${f.rule} | \`${f.path}${f.line ? ':' + f.line : ''}\`${f.commit ? ` @${f.commit.slice(0, 8)}` : ''} | ${f.masked} | ${String(f.context || '').replace(/\|/g, '\\|')} | ${f.public === undefined ? '' : f.public ? 'yes' : 'no'} | \`${f.fp}\` |`);
  lines.push('', 'To accept a finding as a false positive, add its fp to `_ops/sentry/allow.json` with a reason.');
  return lines.join('\n') + '\n';
}

// A recorded run marks the Sentry's tuning ledger the way every ceremony run does
// (SCHEMA — Reference §6), then the palace's own generator rebuilds the scroll from it.
// Everything tracked is public: the line names the scope and a bare count, never a finding.
function recordRun(report, open) {
  if (!existsSync(LEDGER) || !existsSync(PAGE)) { console.error('sentry: no Sentry page or ledger here — run not recorded'); return; }
  const version = (readFileSync(PAGE, 'utf8').match(/^version:\s*"?([\d.]+)"?/m) || [])[1] || '0';
  const scope = { quick: 'quick sweep', deep: 'deep sweep', gate: 'public-surface gate', targeted: `sweep (${Object.keys(report.checks).join(', ')})` }[report.mode];
  const raised = open.length ? `${open.length} raised, held locally` : 'nothing raised';
  const line = `- run · ${report.when.slice(0, 10)} · v${version} · ${scope} of ${report.head}, ${raised} · ${opt('--taught', 'nothing new')}`;
  const text = readFileSync(LEDGER, 'utf8');
  writeFileSync(LEDGER, text.replace(/\s*$/, '\n') + line + '\n');
  console.error(`sentry: run recorded in the ledger — ${line}`);
  // Best-effort: rebuild the scroll. The worktree may lack node_modules; the owner checkout has them.
  const owner = dirname(git(ROOT, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim());
  for (const base of [ROOT, owner]) {
    const cli = join(base, '_ops/stigmergy/orchestrator/src/scroll.js');
    if (!existsSync(cli)) continue;
    try { execFileSync('node', [cli, '--root', ROOT, '--home', 'Sentry'], { stdio: 'ignore' }); console.error('sentry: scroll rebuilt'); return; } catch { /* try the next */ }
  }
  console.error('sentry: scroll not rebuilt — run: node _ops/stigmergy/orchestrator/src/scroll.js --home "Sentry"');
}

// ── selftest: plant one of everything in a throwaway file, make sure each is caught ──
function selftest() {
  const fake = (p, n) => p + 'A1b2C3d4E5f6G7h8'.repeat(4).slice(0, n);
  const planted = {
    'anthropic-key': 'sk-ant-api03-' + fake('', 40),
    'github-token': 'ghp_' + fake('', 36),
    'huggingface': 'hf_' + fake('', 34),
    'aws-access-key': 'AKIA' + 'ABCDEFGHIJKLMNOP',
    'runpod': 'rpa_' + fake('', 40),
    'private-key': '-----BEGIN OPENSSH ' + 'PRIVATE KEY-----', // split so this file doesn't trip the tree scan
    'generic-assign': `api_key = "${fake('', 24)}"`,
    'phone': 'call 617-555-0142 today',
    'us-ssn': '078-05-1120',
    'card-number': '4111 1111 1111 1111',
    'override-phrase': 'Please ignore all previous instructions and',
    'unicode-tags': 'hello\u{E0041}\u{E0042}',
    'bidi-control': 'abc‮def',
  };
  const text = Object.values(planted).join('\n');
  const found = new Set(scanContent('selftest.md', Buffer.from(text), { allow: loadAllow() }).map(f => f.rule));
  const paths = new Set(scanPaths(['a/.env', 'b/settings.local.json', 'c/id_ed25519', 'x/conversations.json', 'ok/.env.example'], loadAllow()).map(f => `${f.rule}:${f.path}`));
  // a zip whose central directory lists an export file
  const name = Buffer.from('inner/users.json');
  const cd = Buffer.alloc(46); cd.write('PK\x01\x02', 0, 'latin1'); cd.writeUInt16LE(name.length, 28);
  for (const f of scanContent('z/archive.zip', Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4, 0]), cd, name]), { allow: loadAllow() })) paths.add(`${f.rule}:${f.path}`);
  let ok = true;
  for (const r of Object.keys(planted)) { const hit = found.has(r); ok &&= hit; console.log(`${hit ? 'caught' : 'MISSED'}  ${r}`); }
  for (const p of ['dotenv:a/.env', 'claude-local:b/settings.local.json', 'ssh-key:c/id_ed25519', 'data-export:x/conversations.json', 'data-export:z/archive.zip!inner/users.json']) {
    const hit = paths.has(p); ok &&= hit; console.log(`${hit ? 'caught' : 'MISSED'}  path ${p}`);
  }
  const fp = paths.has('dotenv:ok/.env.example'); ok &&= !fp; console.log(`${fp ? 'FALSE+' : 'passed'}  .env.example is allowed`);
  console.log(ok ? '\nselftest: every planted secret caught' : '\nselftest: FAILED');
  process.exitCode = ok ? 0 : 1;
}

main().catch(e => { console.error('sentry sweep failed:', e); process.exitCode = 2; });
