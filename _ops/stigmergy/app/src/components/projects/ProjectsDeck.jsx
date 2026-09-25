import React, { useEffect, useState, useCallback } from 'react';
import { Box, Button, Tag } from '../primitives.jsx';
import { fetchProjects, enchantProject } from '../../adapters/projects.js';
import { advanceSteward, advanceAllStewards } from '../../adapters/stewards.js';
import { ageOf, rowSignal, groupProjects } from '../../lib/scroll-view.js';
import { slug, StatusDot, RunningTag } from './status.jsx';
import { usePalaceRef } from '../../lib/palace-ref.jsx';
import ScheduleStrip from '../stewards/ScheduleStrip.jsx';
import ScrollView from './ScrollView.jsx';

// The PROJECTS deck — every project on one screen, and one click into any of
// them. Replaces the STEWARDS roster (2026-09-23): the roster showed stewards
// and cycle counts; this shows PROJECTS and what each one is waiting for.
//
//   table   — every `type: project` entry, grouped: needs you · ready to
//             advance · stuck · tended · untended. The signal column is the
//             same rule the scroll's Now zone uses (server/projects.js →
//             computeNow), so the two never disagree.
//   scroll  — click a row: the project's scroll opens here (Now on top,
//             Standing Orders editable, open asks answerable inline, the
//             making trail with media). `?project=<home>` in the URL.
//
// Advancing fires a RUN (up to the manifest's max_iterations cycles) through
// the same lane as before; the row shows "running k/N" while it is live.
//
// A "no steward" row offers ENCHANT instead: one confirm, then the project gets
// its steward directory + registry line (POST /api/projects/enchant, the same
// act as `node enchant.js "<Title>"`), and the row moves up to tended.
//
// Two more boxes share the deck (2026-09-25). SERVICES: stewarded pages that
// are not projects, rendered with the project row. CEREMONIES: every entry with
// a tuning ledger — its version, when the spec last changed, how many runs it
// has had since, and what its ledger still owes. A ceremony's name opens its
// scroll the same way a project's does; it has no steward to advance.

const SIGNAL_COLOR = { ok: 'var(--phosphor)', warn: 'var(--warn)', err: 'var(--error)', dim: 'var(--phosphor-dim)' };

function SignalCell({ row }) {
  const s = rowSignal(row);
  return (
    <span
      data-testid={`project-signal-${slug(row.home)}`}
      data-signal={s.text}
      style={{ color: SIGNAL_COLOR[s.tone], textShadow: s.tone === 'dim' ? 'none' : 'var(--glow)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}
    >{s.text}</span>
  );
}

const CEREMONY_COLS = 'minmax(180px, 2fr) 56px 90px 90px minmax(140px, 1.6fr) 90px';

export function CeremonyRow({ row, onOpen, onOpenEntry }) {
  const sid = slug(row.home);
  const dim = { color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'nowrap' };
  const unrun = row.spec_changed && row.spec_changed.hash && row.runs_since === 0;
  return (
    <div data-testid={`ceremony-row-${sid}`} style={{ display: 'grid', gridTemplateColumns: CEREMONY_COLS, gap: 10, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--fg4, rgba(31,138,60,.25))' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span
          data-testid={`ceremony-open-${sid}`}
          onClick={() => onOpen(row.home)}
          style={{ color: 'var(--link)', textShadow: 'var(--glow)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={`${row.home} — open the scroll`}
        >{row.home}</span>
        {onOpenEntry && row.path ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpenEntry(row.path); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpenEntry(row.path); } }}
            title={`read the card — ${row.path}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1, letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 3px', border: '1px solid currentColor', color: 'var(--phosphor)', textShadow: 'var(--glow)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
          >card</span>
        ) : null}
      </span>
      <span style={{ ...dim, color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{row.version ? `v${row.version}` : '—'}</span>
      <span style={dim} title={row.spec_changed ? row.spec_changed.subject || '' : ''}>{row.spec_changed && row.spec_changed.ts ? ageOf(row.spec_changed.ts) : '—'}</span>
      <span data-testid={`ceremony-runs-${sid}`} style={{ ...dim, color: unrun ? 'var(--phosphor-dim)' : 'var(--phosphor)' }}>
        {unrun ? 'not yet run' : `${row.runs_since} since`}
      </span>
      <span style={{ ...dim, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.last_run ? row.last_run.subject || '' : ''}>
        {row.last_run ? `${ageOf(row.last_run.ts)} · ${row.last_run.subject}` : 'no run recorded'}
      </span>
      <span data-testid={`ceremony-owed-${sid}`} style={{ ...dim, color: row.owed.length ? 'var(--warn)' : 'var(--phosphor-dim)', textShadow: row.owed.length ? 'var(--glow)' : 'none' }}>
        {row.owed.length ? `${row.owed.length} owed` : 'nothing owed'}
      </span>
    </div>
  );
}

function GroupHeading({ children, n }) {
  if (!n) return null;
  return (
    <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', padding: '8px 0 2px', borderBottom: '1px dashed var(--phosphor-dim)' }}>
      {children} · {n}
    </div>
  );
}

export function ProjectRow({ row, onOpen, onOpenEntry, onAdvance, canAdvance, confirming, onConfirm, onCancel, busy, onEnchant, confirmingEnchant, onConfirmEnchant }) {
  const sid = slug(row.home);
  const dim = { color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'nowrap' };
  return (
    <div
      data-testid={`project-row-${sid}`}
      data-running={row.running ? 'true' : 'false'}
      style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) 70px 90px minmax(120px, 1.4fr) 110px auto', gap: 10, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--fg4, rgba(31,138,60,.25))' }}
    >
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span
          data-testid={`project-open-${sid}`}
          onClick={() => onOpen(row.home)}
          style={{ color: 'var(--link)', textShadow: 'var(--glow)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={`${row.stands || row.home} — open the scroll`}
        >{row.home}</span>
        {onOpenEntry && row.path ? (
          <span
            data-testid={`project-entry-${sid}`}
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpenEntry(row.path); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onOpenEntry(row.path); } }}
            title={`read the entry — ${row.path}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1, letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 3px', border: '1px solid currentColor', color: 'var(--phosphor)', textShadow: 'var(--glow)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
          >entry</span>
        ) : null}
      </span>
      <span style={dim}>{row.stage || '—'}</span>
      <span style={dim}>{row.stewarded ? `cyc ${row.iteration ?? 0}` : '—'}{row.stewarded && row.health ? <Tag tone={row.health === 'green' ? 'ok' : row.health === 'red' ? 'err' : 'default'}>{row.health}</Tag> : null}</span>
      <span style={{ ...dim, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.last_shipped ? row.last_shipped.headline || '' : ''}>
        {row.last_shipped ? `${ageOf(row.last_shipped.ts)} · ${row.last_shipped.headline || row.last_shipped.id}` : (row.last_activity ? `${ageOf(row.last_activity)} · (no shipped thing on the board)` : 'nothing yet')}
      </span>
      {row.running ? <RunningTag name={row.home} /> : <SignalCell row={row} />}
      <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {row.stewarded ? (confirming ? (
          <>
            <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>run up to {row.run_cap} cycles?</span>
            <span data-testid={`steward-confirm-${sid}`}><Button tone="primary" disabled={busy} onClick={() => onConfirm(row.home)}>confirm</Button></span>
            <Button tone="default" disabled={busy} onClick={onCancel}>cancel</Button>
          </>
        ) : (
          <span data-testid={`steward-advance-${sid}`}><Button tone="default" disabled={!canAdvance} onClick={() => onAdvance(row.home)}>advance</Button></span>
        )) : (confirmingEnchant ? (
          <>
            <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>give {row.home} a steward?</span>
            <span data-testid={`project-enchant-confirm-${sid}`}><Button tone="primary" disabled={busy} onClick={() => onConfirmEnchant(row.home)}>confirm</Button></span>
            <Button tone="default" disabled={busy} onClick={onCancel}>cancel</Button>
          </>
        ) : (
          <span data-testid={`project-enchant-${sid}`}><Button tone="default" disabled={busy || !onEnchant} onClick={() => onEnchant && onEnchant(row.home)}>enchant</Button></span>
        ))}
      </span>
    </div>
  );
}

export default function ProjectsDeck({ messages = [], onConfirmed, project = null, onOpenProject, onCloseProject }) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const palace = usePalaceRef();
  const openEntry = palace?.openEntryInState || null;

  const refresh = useCallback(async () => {
    const r = await fetchProjects();
    if (r.ok) setData(r);
    else setData((prev) => prev ?? { projects: [], worker: {}, error: r.error });
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [refresh]);

  // A feedback line belongs to the screen it was earned on: clear it when the
  // view changes (deck <-> a project's scroll), so "Murmuration has a steward
  // now" never sits over another project's scroll.
  useEffect(() => { setFeedback(null); setPending(null); }, [project]);

  const rows = data?.projects ?? [];
  const services = data?.services ?? [];
  const ceremonies = data?.ceremonies ?? [];
  const worker = data?.worker ?? {};
  const running = !!worker.running;
  const readyRows = rows.filter((r) => r.stewarded && r.answered_unconsumed > 0);

  async function doAdvance(name) {
    setBusy(true); setFeedback(null); setPending(null);
    const r = await advanceSteward(name);
    if (r.ok && r.fired) setFeedback({ tone: 'ok', text: `advancing ${name} -> cycle ${r.cycle_n}${r.run ? ` (a run of up to ${r.run.cap})` : ''}` });
    else if (r.status === 409 || r.busy) setFeedback({ tone: 'warn', text: 'a steward cycle is already running' });
    else if (r.status === 404) setFeedback({ tone: 'err', text: `no steward registered for "${name}"` });
    else setFeedback({ tone: 'err', text: r.error || r.msg || `advance failed (${r.status ?? '?'})` });
    setBusy(false); refresh();
  }

  async function doEnchant(name) {
    setBusy(true); setFeedback(null); setPending(null);
    const r = await enchantProject(name);
    if (r.ok && r.result === 'enchanted') setFeedback({ tone: 'ok', text: `${name} has a steward now (${r.slug}) — advance it when you're ready` });
    else if (r.ok && r.result === 'already_enchanted') setFeedback({ tone: 'dim', text: `${name} already has a steward (${r.slug})` });
    else if (r.status === 404) setFeedback({ tone: 'err', text: `no project entry found for "${name}"` });
    else setFeedback({ tone: 'err', text: r.error || (r.errors ? r.errors.join('; ') : `enchant failed (${r.status ?? '?'})`) });
    setBusy(false); refresh();
  }

  async function doAdvanceAll() {
    setBusy(true); setFeedback(null); setPending(null);
    const r = await advanceAllStewards();
    if (r.ok && Array.isArray(r.queued) && r.queued.length) setFeedback({ tone: 'ok', text: `advancing ${r.queued.length} steward(s): ${r.queued.join(', ')}` });
    else if (r.status === 409 || r.busy) setFeedback({ tone: 'warn', text: 'a steward cycle is already running' });
    else if (r.ok) setFeedback({ tone: 'dim', text: 'no stewards have answers waiting' });
    else setFeedback({ tone: 'err', text: r.error || r.msg || `advance-all failed (${r.status ?? '?'})` });
    setBusy(false); refresh();
  }

  const fbColor = { ok: 'var(--phosphor)', warn: 'var(--warn)', err: 'var(--error)', dim: 'var(--phosphor-dim)' };

  if (project) {
    const ceremony = ceremonies.find((r) => r.home === project) || null;
    const row = rows.find((r) => r.home === project) || services.find((r) => r.home === project) || ceremony;
    return (
      <div data-testid="projects-screen" style={{ width: '100%' }}>
        <ScrollView
          home={project}
          row={row}
          worker={worker}
          messages={messages}
          onConfirmed={onConfirmed}
          onBack={onCloseProject}
          onAdvance={ceremony ? undefined : () => doAdvance(project)}
          canAdvance={!ceremony && !!row && row.stewarded && !running && !busy}
          onEnchant={ceremony ? undefined : () => doEnchant(project)}
          canEnchant={!ceremony && !!row && !row.stewarded && !busy}
          feedback={feedback}
        />
      </div>
    );
  }

  const groups = groupProjects(rows);
  const renderGroup = (label, list) => list.map((row) => (
    <ProjectRow
      key={row.home}
      row={row}
      onOpen={onOpenProject}
      onOpenEntry={openEntry}
      onAdvance={(n) => setPending(n)}
      canAdvance={row.stewarded && !running && !busy}
      confirming={pending === row.home}
      onConfirm={doAdvance}
      onCancel={() => setPending(null)}
      busy={busy}
      onEnchant={(n) => setPending(`enchant:${n}`)}
      confirmingEnchant={pending === `enchant:${row.home}`}
      onConfirmEnchant={doEnchant}
    />
  ));

  return (
    <div data-testid="projects-screen" style={{ width: '100%' }}>
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 10, fontSize: 13 }}>
        {rows.length} projects &middot; {groups.needs_you.length} need you &middot; {readyRows.length} ready to advance &middot; {groups.stuck.length} stalled &middot; {groups.untended.length} without a steward{ceremonies.length ? <> &middot; {ceremonies.length} ceremonies</> : null}.
        {data?.stubbed ? <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', marginLeft: 10 }}>&middot; stub worker (no live cycle)</span> : null}
      </div>

      <ScheduleStrip />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <Button hot="P" tone="primary" disabled={running || busy || readyRows.length === 0} onClick={doAdvanceAll}>
          <span data-testid="advance-all">advance all ready ({readyRows.length})</span>
        </Button>
        <StatusDot running={running} lastFire={worker.lastFire} />
        {running && worker.current ? (
          <span data-testid="batch-progress" style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 12 }}>
            advancing {worker.current}{worker.current_run ? ` · cycle ${worker.current_run.cycle_n} (${worker.current_run.position}/${worker.current_run.cap} of the run)` : ''}{worker.batch && worker.batch.total > 0 ? ` · ${worker.batch.done}/${worker.batch.total} (${worker.batch.remaining} queued)` : ''}
          </span>
        ) : null}
      </div>

      {feedback ? (
        <div style={{ color: fbColor[feedback.tone], textShadow: feedback.tone === 'dim' ? 'none' : 'var(--glow)', fontSize: 12, marginBottom: 8 }}>{feedback.text}</div>
      ) : null}

      <Box title="PROJECTS  --  click a name to open its scroll · press P to advance all ready" tone="single">
        {rows.length === 0 ? (
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
            {data?.error ? `failed to load projects: ${data.error}` : (data ? 'no project entries found.' : 'loading…')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) 70px 90px minmax(120px, 1.4fr) 110px auto', gap: 10, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 0' }}>
              <span>project</span><span>stage</span><span>steward</span><span>last shipped</span><span>signal</span><span />
            </div>
            <GroupHeading n={groups.needs_you.length}>needs you</GroupHeading>
            {renderGroup('needs_you', groups.needs_you)}
            <GroupHeading n={groups.ready.length}>ready to advance</GroupHeading>
            {renderGroup('ready', groups.ready)}
            <GroupHeading n={groups.stuck.length}>stalled</GroupHeading>
            {renderGroup('stuck', groups.stuck)}
            <GroupHeading n={groups.tended.length}>tended</GroupHeading>
            {renderGroup('tended', groups.tended)}
            <GroupHeading n={groups.untended.length}>no steward</GroupHeading>
            {renderGroup('untended', groups.untended)}
          </div>
        )}
      </Box>

      {services.length ? (
        <div style={{ marginTop: 10 }} data-testid="services-box">
          <Box title="SERVICES  --  stewarded pages that are not projects" tone="single">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {services.map((row) => (
                <ProjectRow
                  key={row.home}
                  row={row}
                  onOpen={onOpenProject}
                  onOpenEntry={openEntry}
                  onAdvance={(n) => setPending(n)}
                  canAdvance={row.stewarded && !running && !busy}
                  confirming={pending === row.home}
                  onConfirm={doAdvance}
                  onCancel={() => setPending(null)}
                  busy={busy}
                />
              ))}
            </div>
          </Box>
        </div>
      ) : null}

      {ceremonies.length ? (
        <div style={{ marginTop: 10 }} data-testid="ceremonies-box">
          <Box title="CEREMONIES  --  the version each runs under, and whether it has run since it changed" tone="single">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: CEREMONY_COLS, gap: 10, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 0' }}>
                <span>ceremony</span><span>version</span><span>changed</span><span>runs</span><span>last run</span><span>ledger</span>
              </div>
              {ceremonies.map((row) => (
                <CeremonyRow key={row.home} row={row} onOpen={onOpenProject} onOpenEntry={openEntry} />
              ))}
            </div>
          </Box>
        </div>
      ) : null}

      {(worker.logTail?.length || worker.last_cycle) ? (
        <div style={{ marginTop: 10 }}>
          <Box title="LANE  --  worker log" tone="single">
            {worker.last_cycle ? (
              <div style={{ color: worker.last_cycle.ok ? 'var(--phosphor)' : 'var(--error)', textShadow: 'var(--glow)', fontSize: 12, marginBottom: 6 }}>
                last cycle: {worker.last_cycle.ok ? 'ok' : 'FAILED'}
                {worker.last_cycle.name ? ` · ${worker.last_cycle.name}` : ''}
                {worker.last_cycle.posted_ids ? ` · posted ${worker.last_cycle.posted_ids.length}` : ''}
                {worker.last_cycle.run ? ` · run ${worker.last_cycle.run.position}/${worker.last_cycle.run.cap}${worker.last_cycle.run.stopped_because ? ` · ended: ${worker.last_cycle.run.stopped_because.replace(/_/g, ' ')}` : ' · continuing'}` : ''}
                {worker.last_cycle.error ? ` · ${worker.last_cycle.error}` : ''}
              </div>
            ) : null}
            {worker.logTail?.length ? (
              <pre style={{ margin: 0, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{worker.logTail.join('\n')}</pre>
            ) : null}
          </Box>
        </div>
      ) : null}
    </div>
  );
}
