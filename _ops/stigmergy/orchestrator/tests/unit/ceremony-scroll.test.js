import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  parseRunLine, parseRuns, runLine, parseOrders, orderLine, appendLedgerLine,
  normVersion, parseOwed, parseLatestLesson, bodyLead, listCeremonies, isCeremony,
  readCeremonyState, renderCeremonyNow, renderCeremonySection, materializeCeremonyScroll, materializeAnyScroll,
  CEREMONY_ORDERS_PLACEHOLDER,
} from '../../src/ceremony-scroll.js';
import { MARK, readStandingOrders, updateScrollText } from '../../src/scroll-file.js';

describe('run lines', () => {
  test('a run line reads as date, version, what it ran on, and what it taught', () => {
    expect(parseRunLine('- run · 2026-09-25 · v1.1 · close-2026-09-25-ceremonies · taught item 31')).toEqual({
      date: '2026-09-25', version: '1.1', what: 'close-2026-09-25-ceremonies', outcome: 'taught item 31',
    });
    expect(parseRunLine('- run · 2026-04-01 · v2 · full · nothing new').version).toBe('2.0');
  });

  test('the four-field shape reads too, with nothing for what it ran on', () => {
    expect(parseRunLine('- run · 2026-09-25 · v1.1 · nothing new')).toEqual({ date: '2026-09-25', version: '1.1', what: '', outcome: 'nothing new' });
  });

  test('only a line that starts with the prefix is a run', () => {
    expect(parseRunLine('  - run · 2026-09-25 · v1.1 · nothing new')).toBe(null);
    expect(parseRunLine('31. **A run · 2026-09-25 · v1.1** taught this.')).toBe(null);
    expect(parseRunLine('- from Loudon · 2026-09-25 · Ask first. · owed')).toBe(null);
  });

  test('runLine writes what the parser reads, and keeps its own separator out of the what field', () => {
    const line = runLine({ date: '2026-09-25', version: '1.0', what: 'Palace Ceremonies · review', outcome: 'nothing new' });
    expect(line).toBe('- run · 2026-09-25 · v1.0 · Palace Ceremonies, review · nothing new');
    expect(parseRunLine(line).what).toBe('Palace Ceremonies, review');
  });

  test('keys come from the line, and a second identical line gets its own', () => {
    const runs = parseRuns(['# x', '- run · 2026-09-25 · v1.0 · nothing new', 'prose', '- run · 2026-09-25 · v1.0 · nothing new', '- run · 2026-09-26 · v1.0 · a · nothing new'].join('\n'));
    expect(runs.map((r) => r.index)).toEqual([1, 3, 4]);
    expect(runs[0].key).toMatch(/^run-[0-9a-f]{10}$/);
    expect(runs[1].key).toBe(`${runs[0].key}-2`);
    expect(new Set(runs.map((r) => r.key)).size).toBe(3);
    // the key survives a reorder (a union merge can interleave lines)
    const again = parseRuns('- run · 2026-09-26 · v1.0 · a · nothing new\n- run · 2026-09-25 · v1.0 · nothing new');
    expect(again.find((r) => r.date === '2026-09-26').key).toBe(runs[2].key);
  });
});

describe('orders from Loudon', () => {
  test('an order is his words on one line, owed until a run says otherwise', () => {
    expect(orderLine('2026-09-25', '  Ask before adding\na probe.  ')).toBe('- from Loudon · 2026-09-25 · Ask before adding a probe. · owed');
    const orders = parseOrders([
      '- from Loudon · 2026-09-25 · Ask before adding a probe. · owed',
      '- from Loudon · 2026-09-26 · Keep it short · even the card. · paid in item 32',
    ].join('\n'));
    expect(orders).toEqual([
      { date: '2026-09-25', text: 'Ask before adding a probe.', status: 'owed', owed: true },
      { date: '2026-09-26', text: 'Keep it short · even the card.', status: 'paid in item 32', owed: false },
    ]);
  });

  test('a union merge that keeps both forms of a paid line reads as paid', () => {
    const orders = parseOrders([
      '- from Loudon · 2026-09-25 · Ask first. · paid in item 32',
      '- from Loudon · 2026-09-25 · Ask first. · owed',
    ].join('\n'));
    expect(orders).toEqual([{ date: '2026-09-25', text: 'Ask first.', status: 'paid in item 32', owed: false }]);
  });

  test('the owed grep of the tail read finds an order line', () => {
    expect(/\bowed\b/i.test(orderLine('2026-09-25', 'x'))).toBe(true);
  });

  describe('appendLedgerLine', () => {
    let dir;
    afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = null; });
    const ledger = (text) => { dir = mkdtempSync(path.join(tmpdir(), 'ledger-')); const p = path.join(dir, 'X — tuning.md'); writeFileSync(p, text); return p; };

    test('after a list item it joins the list; after prose it opens one', () => {
      const a = ledger('31. **An item.** Spec change owed.\n');
      appendLedgerLine(a, '- run · 2026-09-25 · v1.1 · nothing new');
      expect(readFileSync(a, 'utf8')).toBe('31. **An item.** Spec change owed.\n- run · 2026-09-25 · v1.1 · nothing new\n');
      const b = ledger('No items yet.');
      appendLedgerLine(b, '- run · 2026-09-25 · v1.0 · nothing new');
      expect(readFileSync(b, 'utf8')).toBe('No items yet.\n\n- run · 2026-09-25 · v1.0 · nothing new\n');
      const c = ledger('No items yet.\n\n');
      appendLedgerLine(c, '- run · 2026-09-25 · v1.0 · nothing new');
      expect(readFileSync(c, 'utf8')).toBe('No items yet.\n\n- run · 2026-09-25 · v1.0 · nothing new\n');
    });
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
  const LEDGER = () => path.join(root, '_ops/Return Ceremony/Return Ceremony — tuning.md');
  const commit = (msg, date) => { git('add', '-A'); execFileSync('git', ['commit', '-q', '-m', msg], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } }); };

  function palace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-ceremony-'));
    git('init', '-q');
    git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
    mkdirSync(path.join(root, '_ops/Return Ceremony'), { recursive: true });
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card(null));
    commit('add the card', '2026-09-01T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card('"1.0"'));
    writeFileSync(LEDGER(), '# Return Ceremony — tuning\n\n## From the first return — 2026-09-02\n\n1. **A debt.** Spec change owed: a probe.\n');
    commit('edit(Return Ceremony): v1.0 — version, tuning ledger\n\nThe reason for 1.0.', '2026-09-02T10:00:00Z');
    appendLedgerLine(LEDGER(), '- run · 2026-09-03 · v1.0 · a gap · taught item 1');
    commit('return(2026-09-03): a gap\n\nWhat the gap held.', '2026-09-03T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card(1));   // a reformat, not a change
    commit('edit(Return Ceremony): quote the version', '2026-09-04T10:00:00Z');
    writeFileSync(path.join(root, '_ops/Return Ceremony.md'), card('"1.1"'));
    commit('edit(Return Ceremony): v1.1 — a new probe', '2026-09-05T10:00:00Z');
    appendLedgerLine(LEDGER(), '- run · 2026-09-06 · v1.1 · back again · nothing new');
    commit('return(2026-09-06): back again', '2026-09-06T10:00:00Z');
    writeFileSync(path.join(root, 'note.md'), 'z');
    commit('return(2026-09-07): a commit subject alone is not a run', '2026-09-07T10:00:00Z');
    return root;
  }

  test('the ledger marks the ceremony; the list finds it', () => {
    palace();
    expect(isCeremony(root, 'Return Ceremony')).toBe(true);
    expect(listCeremonies(root)).toEqual([{ title: 'Return Ceremony', tuning: '_ops/Return Ceremony/Return Ceremony — tuning.md' }]);
  });

  test('state: the spec change is the last VALUE change, and runs are the ledger\'s run lines', () => {
    palace();
    const st = readCeremonyState(root, 'Return Ceremony');
    expect(st.version).toBe('1.1');
    expect(st.versions.map((c) => c.version)).toEqual(['1.0', '1.1']);   // the reformat is not a change
    expect(st.spec.subject).toBe('edit(Return Ceremony): v1.1 — a new probe');
    expect(st.runs.map((r) => r.what)).toEqual(['back again', 'a gap']);   // newest first; the bare commit is not counted
    expect(st.runs.map((r) => r.version)).toEqual(['1.1', '1.0']);
    expect(st.runs_since.map((r) => r.what)).toEqual(['back again']);
    expect(st.last_run.outcome).toBe('nothing new');
    expect(st.owed.map((o) => o.n)).toEqual(['1']);
    expect(st.versions[0].lead).toBe('The reason for 1.0.');
  });

  test('a run line counts the moment it is written, committed or not', () => {
    palace();
    appendLedgerLine(LEDGER(), '- run · 2026-09-08 · v1.1 · uncommitted · nothing new');
    expect(readCeremonyState(root, 'Return Ceremony').runs_since.map((r) => r.what)).toEqual(['uncommitted', 'back again']);
  });

  test('an owed order from Loudon shows in Now until a run pays it', () => {
    palace();
    appendLedgerLine(LEDGER(), orderLine('2026-09-08', 'Ask before adding a probe.'));
    const st = readCeremonyState(root, 'Return Ceremony');
    const now = renderCeremonyNow(st, { tsNow: 'x' });
    expect(now).toMatch(/\*\*Owed in the ledger:\*\* 2 — item 1 and 1 order from Loudon/);
    expect(now).toContain('- **From Loudon, 2026-09-08.** Ask before adding a probe.');
    const text = readFileSync(LEDGER(), 'utf8').replace('Ask before adding a probe. · owed', 'Ask before adding a probe. · paid in item 2');
    writeFileSync(LEDGER(), text);
    expect(renderCeremonyNow(readCeremonyState(root, 'Return Ceremony'), { tsNow: 'x' })).not.toContain('From Loudon');
  });

  test('the Now zone says the version, the runs since, and what is owed', () => {
    palace();
    const now = renderCeremonyNow(readCeremonyState(root, 'Return Ceremony'), { tsNow: '2026-09-08T00:00:00Z' });
    expect(now).toMatch(/\*\*Version:\*\* v1\.1 · the spec last changed 2026-09-05/);
    expect(now).toMatch(/\*\*Runs since the change:\*\* 1 run on 1 day/);
    expect(now).toMatch(/\*\*Last run:\*\* 2026-09-06 — back again · nothing new \(under v1\.1\)/);
    expect(now).toMatch(/\*\*Owed in the ledger:\*\* 1 — item 1/);
    expect(now).toMatch(/Latest lesson:\*\* item 1, from the first return/);
  });

  test('an uncommitted version change is said as such', () => {
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
    for (const m of Object.values(MARK)) {
      // A ceremony has no Plan zone — its plan is its tuning ledger's owed lines.
      if (m === MARK.planStart || m === MARK.planEnd) expect(text).not.toContain(m);
      else expect(text).toContain(m);
    }
    expect(text).toContain('label: scroll-for');
    expect(text).toContain('The card [[Return Ceremony]] stays the spec');
    expect(readStandingOrders(text)).toBe('');   // the ceremony placeholder reads as no orders
    expect(text).toContain(CEREMONY_ORDERS_PLACEHOLDER);
    expect(r1.added_sections).toBe(4);           // two runs, two version changes
    const order = ['back again', 'the spec moved to v1.1', 'a gap', 'the spec moved to v1.0'].map((t) => text.indexOf(t));
    expect(order).toEqual([...order].sort((a, b) => a - b));   // newest first, each run after the change it ran under

    appendLedgerLine(LEDGER(), '- run · 2026-09-09 · v1.1 · a third · nothing new');
    const r2 = materializeCeremonyScroll({ palaceRoot: root, home: 'Return Ceremony', tsNow: '2026-09-10T00:00:00Z' });
    expect(r2.created).toBe(false);
    expect(r2.added_sections).toBe(1);
    const after = readFileSync(file, 'utf8');
    expect(after.match(/scroll:entry id="run-/g).length).toBe(3);
    expect(after).toContain('Now shows it as owed until a run acts on it');   // the ceremony placeholder
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
  test('a run and a version change each render with their key', () => {
    const [r] = parseRuns('- run · 2026-09-03 · v1.0 · a gap · taught item 1');
    const run = renderCeremonySection({ ...r, kind: 'run' });
    expect(run).toContain(`<!-- scroll:entry id="${r.key}" -->`);
    expect(run).toContain('### 2026-09-03 — a gap');
    expect(run).toContain('taught item 1');
    expect(run).toContain('a run under v1.0');
    const ver = renderCeremonySection({ kind: 'version', key: 'version-abc', hash: 'abcdef1234', ts: '2026-09-05T10:00:00Z', subject: 'edit(X): v1.1', version: '1.1', lead: '' });
    expect(ver).toContain('the spec moved to v1.1');
  });

  test('updateScrollText keeps an unmarked hand-made scroll untouched', () => {
    const r = updateScrollText('# a hand-made scroll', { nowText: 'x', newSections: [] });
    expect(r.applied).toBe(false);
  });
});
