// Unit tests for the ScheduleStrip presentational pieces — rendered to static
// markup, no fetch. The data-fetching default export is covered by the e2e
// (scheduler-strip.spec.js); here we pin the glanceable signals.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatAge, JobStateBadge, JobLine, SchedulerWarnings } from '../../src/components/stewards/ScheduleStrip.jsx';

describe('formatAge', () => {
  it('renders coarse, glanceable ages', () => {
    expect(formatAge(undefined)).toBe('—');
    expect(formatAge(0.4)).toBe('<1h ago');
    expect(formatAge(6)).toBe('6h ago');
    expect(formatAge(13 * 24)).toBe('13d ago');
  });
});

describe('JobStateBadge', () => {
  it('renders NOT INSTALLED loudly (the honest default state)', () => {
    const html = renderToStaticMarkup(React.createElement(JobStateBadge, { state: 'not_installed' }));
    expect(html).toContain('data-testid="scheduler-state-not_installed"');
    expect(html).toContain('NOT INSTALLED');
  });
  it('renders the scheduled state', () => {
    const html = renderToStaticMarkup(React.createElement(JobStateBadge, { state: 'scheduled' }));
    expect(html).toContain('data-testid="scheduler-state-scheduled"');
    expect(html.toLowerCase()).toContain('scheduled');
  });
});

describe('JobLine', () => {
  it('shows the title, state, cadence, and last-run age', () => {
    const job = {
      kind: 'steward-batch', primary: true, title: 'steward batch', state: 'scheduled',
      cadence: { human: '06:00 daily · every 2 days (guard)' },
      last_run: { age_hours: 6 },
      next_fire: '2026-06-23T06:00:00.000Z', next_fire_would_skip_guard: true,
    };
    const html = renderToStaticMarkup(React.createElement(JobLine, { job }));
    expect(html).toContain('data-testid="scheduler-job-steward-batch"');
    expect(html).toContain('steward batch');
    expect(html).toContain('06:00 daily');
    expect(html).toContain('6h ago');
    expect(html).toContain('guard may skip');
  });

  it('handles an un-run, un-scheduled job without throwing', () => {
    const job = { kind: 'shopkeeper-sweep', primary: false, title: 'shopkeeper sweep', state: 'not_installed', cadence: null, last_run: {}, next_fire: null };
    const html = renderToStaticMarkup(React.createElement(JobLine, { job }));
    expect(html).toContain('shopkeeper sweep');
    expect(html).toContain('cadence unknown');
    expect(html).toContain('last: —');
  });
});

describe('SchedulerWarnings', () => {
  it('renders nothing when there are no warnings', () => {
    expect(renderToStaticMarkup(React.createElement(SchedulerWarnings, { warnings: [] }))).toBe('');
  });
  it('renders each warning loudly with a non-emoji marker', () => {
    const html = renderToStaticMarkup(React.createElement(SchedulerWarnings, { warnings: ['NOT INSTALLED — no launchd job'] }));
    expect(html).toContain('data-testid="scheduler-warnings"');
    expect(html).toContain('!! NOT INSTALLED');
  });
});
