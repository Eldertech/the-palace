#!/usr/bin/env node
// The Sentry's gate — git pre-push logic. Reads what is about to leave for the remote,
// blocks the push if it carries a credential or a file that must never be public.
//
// Called by the pre-push shim (install-hooks.mjs) with git's arguments ($1 remote name,
// $2 url) and git's stdin (one line per ref: <local ref> <local sha> <remote ref> <remote sha>).
//
// Blocks on HIGH only: a real-format key, a private key, a .env / settings.local.json / key
// file / data export, an SSN or card number in prose, a GPS-tagged photo, invisible
// Unicode smuggling. Everything else is printed as a warning and the push goes on.
//
// Override once, knowingly:   git push --no-verify
// Accept a false positive:     add its fp to _ops/sentry/allow.json with a reason.
//
// It fails CLOSED ([[Tool Builder]]: fail-closed on safety). If the gate cannot run, the push
// is refused and the message names the way through — `git push --no-verify` — so a bug here
// costs a deliberate keystroke, never a silent unchecked push. gitleaks missing is not
// "cannot run": the Sentry's own rules still read every blob, so that is only a warning.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { repoRoot, heldDir, loadAllow, listBlobs, scanBlobs, scanPaths, hasGitleaks, sortFindings } from './engine.mjs';
import { fingerprint } from './rules.mjs';

const ZERO = /^0+$/;
const remote = process.argv[2] || 'origin';

async function main() {
  const root = repoRoot();
  const allow = loadAllow();
  const lines = readFileSync(0, 'utf8').split('\n').map(l => l.trim().split(/\s+/)).filter(p => p.length === 4);
  const ranges = [];
  for (const [, localSha, remoteRef, remoteSha] of lines) {
    if (ZERO.test(localSha)) continue; // deleting a remote branch sends nothing
    ranges.push(ZERO.test(remoteSha)
      ? { label: remoteRef, rev: [localSha, '--not', `--remotes=${remote}`] } // new branch: what the remote lacks
      : { label: remoteRef, rev: [localSha, `^${remoteSha}`] });
  }
  if (!ranges.length) return;
  if (!hasGitleaks()) console.error('sentry: gitleaks is not installed — checking with the Sentry rules alone (brew install gitleaks for its ~150 more)');

  const findings = [];
  for (const r of ranges) {
    const blobs = listBlobs(root, r.rev);
    const { findings: f } = await scanBlobs(root, blobs, { families: ['secret', 'pii', 'inject'], piiLevel: 'all', allow });
    findings.push(...f);
    findings.push(...scanPaths([...new Set(blobs.map(b => b.path))], allow));
    findings.push(...gitleaksRange(root, r.rev, allow));
  }
  const open = sortFindings(findings.filter(f => !f.allowed && f.sev !== 'info'));
  const high = open.filter(f => f.sev === 'high');
  const warn = open.filter(f => f.sev !== 'high');

  if (warn.length) {
    console.error(`sentry: ${warn.length} thing(s) worth a look in this push (not blocking):`);
    for (const f of warn.slice(0, 12)) console.error(`  ${f.sev.padEnd(6)} ${f.family}/${f.rule}  ${f.path}${f.line ? ':' + f.line : ''}  ${f.masked}  fp ${f.fp}`);
    if (warn.length > 12) console.error(`  … ${warn.length - 12} more`);
  }
  logRun(root, ranges, high.length, warn.length);
  if (high.length) {
    console.error(`\nsentry: PUSH BLOCKED — ${high.length} finding(s) that must not reach ${remote}:`);
    for (const f of high) console.error(`  HIGH   ${f.family}/${f.rule}  ${f.path}${f.line ? ':' + f.line : ''}  ${f.masked}  fp ${f.fp}`);
    console.error(`\n  Remove it from the commits (amend or rebase — it is not public yet), then push again.`);
    console.error(`  A false positive? Add its fp to _ops/sentry/allow.json with a reason.`);
    console.error(`  Certain and in a hurry? git push --no-verify skips the gate once.`);
    process.exitCode = 1;
  }
}

function gitleaksRange(root, rev, allow) {
  if (!hasGitleaks()) return [];
  const dir = mkdtempSync(join(tmpdir(), 'sentry-gate-'));
  try {
    const rp = join(dir, 'r.json');
    execFileSync('gitleaks', ['git', `--log-opts=${rev.join(' ')}`, '--redact=100', '--report-format', 'json', '--report-path', rp,
      '--no-banner', '--exit-code', '0', '--log-level', 'error', root], { stdio: 'ignore' });
    return JSON.parse(readFileSync(rp, 'utf8')).map(g => {
      const fp = fingerprint('gitleaks', g.RuleID, g.Fingerprint);
      return { family: 'secret', rule: `gitleaks:${g.RuleID}`, sev: /generic/.test(g.RuleID) ? 'medium' : 'high', path: g.File,
        line: g.StartLine, masked: '(redacted)', fp, allowed: allow.gitleaks.has(fp) };
    });
  } catch { return []; }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

function logRun(root, ranges, high, warn) {
  try {
    appendFileSync(join(heldDir(root), 'gate.log'), `${new Date().toISOString()}\t${remote}\t${ranges.map(r => r.label).join(',')}\thigh=${high}\twarn=${warn}\n`);
  } catch { /* the log is a convenience */ }
}

main().catch(e => {
  console.error(`sentry: PUSH REFUSED — the gate hit an error and could not check this push: ${e.message}`);
  console.error('sentry: fix the gate, or push once unchecked with `git push --no-verify` and run `node _ops/sentry/sweep.mjs` after.');
  process.exitCode = 1;
});
