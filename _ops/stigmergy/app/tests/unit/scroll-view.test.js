import { describe, test, expect } from 'vitest';
import { parseMakingSections, liftArtifacts, ageOf, rowSignal, groupProjects } from '../../src/lib/scroll-view.js';
import { sortProjects, projectSortKey } from '../../server/projects.js';

const MAKING = [
  '<!-- scroll:entry id="gsl-039" -->',
  '### 2026-07-01 — cycle 19 — shipped the probe harness',
  '> shipped · harness ready',
  '',
  'Catch-up — the pipeline.',
  '',
  '**Artifacts:**',
  '- [the report](Projects/GSL/ai-source-probe/report.mock.html)',
  '- [a wav](Projects/GSL/crystal-audio/crystal_1_cubic.wav)',
  '- [the design doc](Projects/GSL/ai-source-probe/DESIGN.md)',
  '<sub>`gsl-039` · BROADCAST on GENERAL</sub>',
  '<!-- /scroll:entry -->',
  '',
  'a hand-written note between sections',
  '',
  '<!-- scroll:entry id="gsl-030" -->',
  '### 2026-06-06 — cycle 15 — earlier',
  'body',
  '<!-- /scroll:entry -->',
].join('\n');

describe('parseMakingSections', () => {
  test('splits entries in file order, lifts headings and media artifacts, keeps free text', () => {
    const s = parseMakingSections(MAKING);
    expect(s.map((x) => x.id)).toEqual(['gsl-039', null, 'gsl-030']);
    expect(s[0].heading).toBe('2026-07-01 — cycle 19 — shipped the probe harness');
    expect(s[0].body).toContain('> shipped · harness ready');
    expect(s[0].artifacts).toEqual([
      { path: 'Projects/GSL/ai-source-probe/report.mock.html', caption: 'the report' },
      { path: 'Projects/GSL/crystal-audio/crystal_1_cubic.wav', caption: 'a wav' },
    ]); // the .md link is not media
    expect(s[1].body).toBe('a hand-written note between sections');
    expect(s[2].heading).toBe('2026-06-06 — cycle 15 — earlier');
  });

  test('empty / placeholder making zones yield a single free section or nothing', () => {
    expect(parseMakingSections('')).toEqual([]);
    const s = parseMakingSections('_Nothing made yet._');
    expect(s).toHaveLength(1);
    expect(s[0].id).toBeNull();
  });

  test('liftArtifacts ignores urls, open:/obsidian: schemes and duplicates', () => {
    const a = liftArtifacts('[x](https://a/b.png) [y](open:Projects/x.wav) [z](Projects/x.wav) [z again](Projects/x.wav) [o](obsidian://open?file=a.png)');
    expect(a).toEqual([{ path: 'Projects/x.wav', caption: 'z' }]);
  });
});

describe('ageOf', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');
  test('reads today / 1d / Nd / Nmo', () => {
    expect(ageOf('2026-09-23T08:00:00Z', now)).toBe('today');
    expect(ageOf('2026-09-22T08:00:00Z', now)).toBe('1d');
    expect(ageOf('2026-09-01T08:00:00Z', now)).toBe('22d');
    expect(ageOf('2026-06-01T08:00:00Z', now)).toBe('4mo');
    expect(ageOf(null, now)).toBe('');
  });
});

describe('rowSignal + groupProjects + sortProjects — one rule for the table', () => {
  const rows = [
    { home: 'Steady', stewarded: true, open_asks: 0, answered_unconsumed: 0, stalled: false, barren_streak: 0, last_activity: '2026-06-01T00:00:00Z' },
    { home: 'Needs', stewarded: true, open_asks: 2, open_blocking: false, answered_unconsumed: 0, stalled: false, barren_streak: 0, last_activity: '2026-05-01T00:00:00Z' },
    { home: 'Paused', stewarded: true, open_asks: 1, open_blocking: true, answered_unconsumed: 0, stalled: false, barren_streak: 0, last_activity: '2026-07-01T00:00:00Z' },
    { home: 'Ready', stewarded: true, open_asks: 0, answered_unconsumed: 1, stalled: false, barren_streak: 0, last_activity: '2026-07-01T00:00:00Z' },
    { home: 'Stuck', stewarded: true, open_asks: 0, answered_unconsumed: 0, stalled: true, barren_streak: 2, last_activity: '2026-09-21T00:00:00Z' },
    { home: 'Untended', stewarded: false, open_asks: 0, answered_unconsumed: 0, stalled: false, barren_streak: 0, last_activity: null },
    { home: 'Running', stewarded: true, running: true, run: { position: 2, cap: 10 }, open_asks: 0, answered_unconsumed: 0, stalled: false, barren_streak: 0, last_activity: '2026-09-23T00:00:00Z' },
  ];
  const by = Object.fromEntries(rows.map((r) => [r.home, r]));

  test('rowSignal names the state in one or two words, most urgent first', () => {
    expect(rowSignal(by.Running)).toEqual({ text: 'running 2/10', tone: 'warn' });
    expect(rowSignal(by.Needs)).toEqual({ text: '2 asks', tone: 'warn' });
    expect(rowSignal(by.Paused)).toEqual({ text: 'paused on you', tone: 'warn' });
    expect(rowSignal(by.Ready)).toEqual({ text: '1 ready', tone: 'ok' });
    expect(rowSignal(by.Stuck)).toEqual({ text: 'stalled', tone: 'err' });
    expect(rowSignal(by.Untended)).toEqual({ text: 'no steward', tone: 'dim' });
    expect(rowSignal(by.Steady)).toEqual({ text: 'steady', tone: 'dim' });
  });

  test('groupProjects buckets needs-you / ready / stuck / tended / untended', () => {
    const g = groupProjects(rows);
    expect(g.needs_you.map((r) => r.home).sort()).toEqual(['Needs', 'Paused', 'Running']);
    expect(g.ready.map((r) => r.home)).toEqual(['Ready']);
    expect(g.stuck.map((r) => r.home)).toEqual(['Stuck']);
    expect(g.tended.map((r) => r.home)).toEqual(['Steady']);
    expect(g.untended.map((r) => r.home)).toEqual(['Untended']);
  });

  test('sortProjects: what needs Loudon first, then ready, stuck, tended by recency, untended last', () => {
    const sorted = sortProjects(rows).map((r) => r.home);
    expect(sorted.slice(0, 2)).toEqual(['Paused', 'Needs']); // both need him; most recent activity first
    expect(sorted[2]).toBe('Ready');
    expect(sorted[3]).toBe('Stuck');
    expect(sorted.slice(4)).toEqual(['Running', 'Steady', 'Untended']);
    expect(projectSortKey(by.Untended)[0]).toBe(4);
  });
});
