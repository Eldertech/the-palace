import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  isRunSubject, normVersion, parseOwed, parseLatestLesson, bodyLead, listCeremonies, isCeremony,
  readCeremonyState, renderCeremonyNow, renderCeremonySection, materializeCeremonyScroll, materializeAnyScroll,
  CEREMONY_ORDERS_PLACEHOLDER,
} from '../../src/ceremony-scroll.js';
import { MARK, readStandingOrders, updateScrollText } from '../../src/scroll-file.js';

describe('run signatures', () => {
  test('each ceremony counts its own record, not tooling that shares a prefix', () => {
    expect(isRunSubject('Deposit Ceremony', 'deposit(D-2026-09-04-CROSSED): only what crossed')).toBe(true);
    expect(isRunSubject('Deposit Ceremony', 'Deposit — the retired subject still counts')).toBe(true);
    expect(isRunSubject('Deposit Ceremony', 'edit(Deposit Ceremony): v2.0')).toBe(false);
    expect(isRunSubject('Return Ceremony', 'return(2026-09-25): ten hours')).toBe(true);
    expect(isRunSubject('Closing Well', 'close well(2026-08-25): finish the backstage rows')).toBe(true);
    expect(isRunSubject('Closing Well', 'edit(close-2026-09-02): the counter-discipline gets its proof')).toBe(true);
    expect(isRunSubject('Closing Well', 'closing-well(gotchas): append trap 18')).toBe(false);
    expect(isRunSubject('Weave Ceremony', 'Weave — 2026-09-24 — part 1')).toBe(true);
    expect(isRunSubject('Walk Ceremony', 'Walk — 2026-10-01 — Kuramoto Coupling — metadata updates')).toBe(true);
  });

  test('Enrichment counts rich faces, not the face batch', () => {
    expect(isRunSubject('Enrichment', 'enrich(Kuramoto Coupling): the first rich face — study')).toBe(true);
    expect(isRunSubject('Enrichment', 'enrich(faces): 45 entries get a face')).toBe(false);
    expect(isRunSubject('Enrichment', 'enrich(Walk Ceremony): hero + icon — purpose: visual identity')).toBe(false);
  });

  test('an entry with no signature has no runs', () => {
    expect(isRunSubject('Kuramoto Coupling', 'deposit(x): y')).toBe(false);
  });
});

describe('ledger reading', () => {
  const LEDGER = [
    '# Foo — tuning', '',
    '## From the first run — 2026-09-01', '',
    '1. **A lesson that landed.** Forced: step 2 (`abc`).',
    '2. **An already-landed deposit reads as still-owed** without the column.',
    '3. **A debt.** Spec change owed: the card catches up.',
    '4. **An old debt.** Spec change still owed: Step 1c.',
    '5. **A paid debt.** Paid in v2.0; the spec change owed was made.',
    '', '## From the second run — 2026-09-20', '',
    '6. **The newest.** No spec change.',
  ].join('\n');

  test('owed means the ledgers\' phrase, not the word in passing, and paid clears it', () => {
    expect(parseOwed(LEDGER).map((o) => o.n)).toEqual(['3', '4']);
  });

  test('the latest lesson is the last heading and the last item', () => {
    expect(parseLatestLesson(LEDGER)).toEqual({ heading: 'From the second run — 2026-09-20', item: '6' });
  });

  test('normVersion reads a reformat as no change', () => {
    expect(normVersion(2)).toBe('2.0');
    expect(normVersion('"2.0"')).toBe('2.0');
    expect(normVersion('1.1')).toBe('1.1');
    expect(normVersion(undefined)).toBe(null);
  });

  test('bodyLead skips trailers', () => {
    expect(bodyLead('The first paragraph\nwraps here.\n\nSecond.\n\nPalace-Kind: edit\nPalace-Verify: verified')).toBe('The first paragraph wraps here.');
    expect(bodyLead('Palace-Kind: edit')).toBe('');
  });
});

describe('a ceremony in a real repo', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const card = (v) => ['---', 'title: "Return Ceremony"', 'type: practice', 'stage: growing', v == null ? null : `version: ${v}`, '---', '', '# Return Ceremony', ''].filter((l) => l != null).join('\n');
  const commit = (msg, date) => { git('add', '-A'); execFileSync('git', ['commit', '-q', '-m', msg], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } }); };

  function palace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-ceremony-'));
    git('init', '-q');
    git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
    mkdirSync(path.join(root, '_ops/Return Ceremony'), { recursive: true });
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card(null));
    commit('add the card', '2026-09-01T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card('"1.0"'));
    writeFileSync(path.join(root, '_ops/Return Ceremony/Return Ceremony — tuning.md'), '# Return Ceremony — tuning\n\n## From the first return — 2026-09-02\n\n1. **A debt.** Spec change owed: a probe.\n');
    commit('edit(Return Ceremony): v1.0 — version, tuning ledger\n\nThe reason for 1.0.', '2026-09-02T10:00:00Z');
    writeFileSync(path.join(root, 'note.md'), 'x');
    commit('return(2026-09-03): a gap\n\nWhat the gap held.', '2026-09-03T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card(1));   // a reformat, not a change
    commit('edit(Return Ceremony): quote the version', '2026-09-04T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card('"1.1"'));
    commit('edit(Return Ceremony): v1.1 — a new probe', '2026-09-05T10:00:00Z');
    writeFileSync(path.join(root, 'note.md'), 'y');
    commit('return(2026-09-06): back again', '2026-09-06T10:00:00Z');
    writeFileSync(path.join(root, 'note.md'), 'z');
    commit('edit(Other): not a run', '2026-09-07T10:00:00Z');
    return root;
  }

  test('the ledger marks the ceremony; the list finds it', () => {
    palace();
    expect(isCeremony(root, 'Return Ceremony')).toBe(true);
    expect(listCeremonies(root)).toEqual([{ title: 'Return Ceremony', tuning: '_ops/Return Ceremony/Return Ceremony — tuning.md' }]);
  });

  test('state: the spec change is the last VALUE change, and runs are counted after it', () => {
    palace();
    const st = readCeremonyState(root, 'Return Ceremony');
    expect(st.version).toBe('1.1');
    expect(st.versions.map((c) => c.version)).toEqual(['1.0', '1.1']);   // the reformat is not a change
    expect(st.spec.subject).toBe('edit(Return Ceremony): v1.1 — a new probe');
    expect(st.runs.map((r) => r.subject)).toEqual(['return(2026-09-06): back again', 'return(2026-09-03): a gap']);
    expect(st.runs.map((r) => r.version)).toEqual(['1.1', '1.0']);
    expect(st.runs_since.map((r) => r.subject)).toEqual(['return(2026-09-06): back again']);
    expect(st.owed.map((o) => o.n)).toEqual(['1']);
    expect(st.runs[1].lead).toBe('What the gap held.');
  });

  test('the Now zone says the version, the runs since, and what is owed', () => {
    palace();
    const now = renderCeremonyNow(readCeremonyState(root, 'Return Ceremony'), { tsNow: '2026-09-08T00:00:00Z' });
    expect(now).toMatch(/\*\*Version:\*\* v1\.1 · the spec last changed 2026-09-05/);
    expect(now).toMatch(/\*\*Runs since the change:\*\* 1 record on 1 day/);
    expect(now).toMatch(/\*\*Owed in the ledger:\*\* 1 — item 1/);
    expect(now).toMatch(/Latest lesson:\*\* item 1, from the first return/);
  });

  test('an uncommitted version change is said, not counted', () => {
    palace();
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card('"1.2"'));
    const st = readCeremonyState(root, 'Return Ceremony');
    expect(st.spec.hash).toBe(null);
    expect(renderCeremonyNow(st, { tsNow: 'x' })).toMatch(/not committed yet/);
  });

  test('materialize writes the three zones, and a second pass adds only what is new', () => {
    palace();
    const r1 = materializeCeremonyScroll({ palaceRoot: root, home: 'Return Ceremony', tsNow: '2026-09-08T00:00:00Z' });
    expect(r1.created).toBe(true);
    const file = path.join(root, '_ops/Return Ceremony/Return Ceremony — scroll.md');
    const text = readFileSync(file, 'utf8');
    for (const m of Object.values(MARK)) expect(text).toContain(m);
    expect(text).toContain('label: scroll-for');
    expect(text).toContain('The card [[Return Ceremony]] stays the spec');
    expect(readStandingOrders(text)).toBe('');   // the ceremony placeholder reads as no orders
    expect(text).toContain(CEREMONY_ORDERS_PLACEHOLDER);
    expect(r1.added_sections).toBe(4);           // two runs, two version changes
    expect(text.indexOf('back again')).toBeLessThan(text.indexOf('a gap'));   // newest first

    writeFileSync(path.join(root, 'note.md'), 'w');
    commit('return(2026-09-09): a third', '2026-09-09T10:00:00Z');
    const r2 = materializeCeremonyScroll({ palaceRoot: root, home: 'Return Ceremony', tsNow: '2026-09-10T00:00:00Z' });
    expect(r2.created).toBe(false);
    expect(r2.added_sections).toBe(1);
    const after = readFileSync(file, 'utf8');
    expect(after.match(/scroll:entry id="commit-/g).length).toBe(3);
  });

  test('Standing Orders survive a regeneration', () => {
    palace();
    materializeCeremonyScroll({ palaceRoot: root, home: 'Return Ceremony' });
    const file = path.join(root, '_ops/Return Ceremony/Return Ceremony — scroll.md');
    const text = readFileSync(file, 'utf8');
    const s = text.indexOf(MARK.ordersStart) + MARK.ordersStart.length;
    const e = text.indexOf(MARK.ordersEnd);
    writeFileSync(file, `${text.slice(0, s)}\nAsk before adding a probe.\n${text.slice(e)}`);
    materializeCeremonyScroll({ palaceRoot: root, home: 'Return Ceremony' });
    expect(readStandingOrders(readFileSync(file, 'utf8'))).toBe('Ask before adding a probe.');
  });

  test('materializeAnyScroll sends a ceremony to the ceremony scroll and anything else to the page scroll', () => {
    palace();
    writeFileSync(path.join(root, 'Kuramoto Coupling.md'), '---\ntitle: "Kuramoto Coupling"\ntype: concept\nstage: mature\n---\n\n# Kuramoto Coupling\n');
    const c = materializeAnyScroll({ palaceRoot: root, home: 'Return Ceremony', dryRun: true });
    expect(c.text).toContain('The ceremony\'s front door');
    const p = materializeAnyScroll({ palaceRoot: root, home: 'Kuramoto Coupling', dryRun: true });
    expect(p.created).toBe(true);
  });
});

describe('sections', () => {
  test('a run, a record and a version change each render with their key', () => {
    const run = renderCeremonySection({ key: 'commit-abcdef12', hash: 'abcdef1234', ts: '2026-09-03T10:00:00Z', subject: 'return(2026-09-03): a gap', lead: 'Held.', version: '1.0' });
    expect(run).toContain('<!-- scroll:entry id="commit-abcdef12" -->');
    expect(run).toContain('a run under v1.0');
    const rec = renderCeremonySection({ key: 'record-x', ts: '2026-09-06', label: 'Harvest record — X', path: '_ops/Harvest Ceremony/Harvest — 2026-09-06 — X.md', version: '1.0' });
    expect(rec).toContain('[Harvest — 2026-09-06 — X.md](_ops/Harvest Ceremony/Harvest — 2026-09-06 — X.md)');
    const ver = renderCeremonySection({ kind: 'version', key: 'version-abc', hash: 'abcdef1234', ts: '2026-09-05T10:00:00Z', subject: 'edit(X): v1.1', version: '1.1', lead: '' });
    expect(ver).toContain('the spec moved to v1.1');
  });

  test('updateScrollText keeps an unmarked hand-made scroll untouched', () => {
    const r = updateScrollText('# a hand-made scroll', { nowText: 'x', newSections: [] });
    expect(r.applied).toBe(false);
  });
});
