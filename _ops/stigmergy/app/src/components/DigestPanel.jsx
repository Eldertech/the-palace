import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box } from './primitives.jsx';
import {
  DIGEST_API_PATH, summarizeDigest, tierGroups, autoDecisions, isShadow,
} from '../lib/digest-view.js';
import { matchStats, matchStatsForRun, formatCopyForClaude } from '../lib/digest-verdicts.js';

// DigestPanel — renders the Automated Trickster (Stage E) escalation digest:
// the palace's aggregated voice, ranked by how far out of phase each pending
// request is. The digest JSON is produced by the trickster-auto engine and
// served through the existing /api/file route — this panel fetches, renders,
// and now captures verdicts (alignment-review layer). Fully DEFENSIVE: if the
// digest is missing or either endpoint errors, it degrades quietly and never
// throws, so it cannot break the TRICKSTER board it sits above.

const DIM = 'var(--phosphor-dim)';
const FG = 'var(--phosphor)';
const HOT = 'var(--ansi-bright-cyan)';
const WARN = 'var(--warn, #f5a623)';
const OK = 'var(--phosphor, #5cd65c)';

const VERDICT_VERB_ESCALATE = 'escalate';

// Human-register translations for the digest's wire fields — the "speak like a
// person, log like a protocol" rule (SCHEMA §9). The digest JSON (trickster-auto)
// carries protocol codes; Loudon should never read them raw. Unknown values
// fall through de-snaked rather than crashing, so a new code is legible, not
// jargon.
const TIER_HUMAN = {
  'BLOCKING AUDITION': 'paused — needs your ear',
  'BLOCKING STALL': 'paused — needs your call',
  'AUDITION (NON-BLOCKING)': 'needs your ear (not stuck)',
  'NON-BLOCKING': 'when you have a moment',
};
const RESOURCE_HUMAN = {
  audition_verification: 'listen + approve',
  sensory_audition_gate: 'needs your ear',
  directional_decision: 'which way?',
  architecture_decision: 'a design call',
};
function humanTier(label) {
  if (typeof label !== 'string') return '';
  return TIER_HUMAN[label.toUpperCase()] || label.toLowerCase();
}
function humanResource(r) {
  if (typeof r !== 'string' || !r) return '';
  return RESOURCE_HUMAN[r] || r.replace(/_/g, ' ');
}
function humanVerb(v) {
  if (v === 'auto-grant') return 'would approve';
  if (v === 'auto-deny') return 'would decline';
  return v;
}

// Composite key (run + request). The separator is a NUL — guaranteed never to
// appear in a timestamp or request id, so "ab"+"c" and "a"+"bc" can't collide.
// Written as the escape '\0' (not a raw NUL byte, which had made this whole
// source file register as binary to git).
function verdictKey(runId, requestId) {
  return (runId || '') + '\0' + (requestId || '');
}

// Generate a verdict id. Use crypto.randomUUID() when available; fall back to
// a millisecond + random suffix for older runtimes.
function newVerdictId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return 'v-' + crypto.randomUUID();
    }
  } catch (_) { /* fall through */ }
  return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Flatten the digest into a single ordered list of reviewable rows. Escalation
// rows come first (in tier+rank order); auto-decision rows come last.
function flatItems(digest) {
  if (!digest) return [];
  const groups = tierGroups(digest);
  const out = [];
  for (const g of groups) {
    for (const e of g.items) {
      out.push({
        rowKind: 'escalation',
        request_id: e.request_id,
        from: e.from,
        rule_id: e.rule_id,
        options: Array.isArray(e.options) ? e.options.slice() : [],
        proposed_verb: VERDICT_VERB_ESCALATE,
        canEscalate: false, // already escalated; can't differ-as-escalate
      });
    }
  }
  for (const d of autoDecisions(digest)) {
    out.push({
      rowKind: 'auto_decision',
      request_id: d.request_id,
      from: d.from,
      rule_id: d.rule_id,
      // Auto-decision rows don't carry the full options[]; only the chosen
      // option_id. Differing means picking ESCALATE or writing a note.
      options: [],
      proposed_verb: d.verb || 'auto-grant',
      canEscalate: true,
    });
  }
  return out;
}

// True if the active element is a form input — used to gate the global keydown
// handler so a/d/j/k don't fire while a textarea has focus.
function isFormFocused() {
  const el = typeof document !== 'undefined' ? document.activeElement : null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

export default function DigestPanel() {
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | absent | error
  // Collapsed by default: this is the auto-trickster TUNING panel, not the
  // decision list. The decision cards lead the deck; this sits below, folded,
  // until you choose to review the robot's calls. (Restores the focus the deck
  // lost when the digest was first placed at the top.)
  const [open, setOpen] = useState(false);

  // Verdicts state. Defensive: a load error here NEVER blocks the digest.
  const [verdicts, setVerdicts] = useState([]);
  const [verdictsError, setVerdictsError] = useState(null);

  const loadDigest = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(DIGEST_API_PATH);
      if (res.status === 404) { setStatus('absent'); setDigest(null); return; }
      if (!res.ok) { setStatus('error'); return; }
      const data = await res.json();
      setDigest(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  const loadVerdicts = useCallback(async () => {
    try {
      const res = await fetch('/api/digest/verdicts');
      if (!res.ok) { setVerdictsError('unreachable'); return; }
      const data = await res.json();
      setVerdicts(Array.isArray(data.verdicts) ? data.verdicts : []);
      setVerdictsError(null);
    } catch {
      setVerdictsError('unreachable');
    }
  }, []);

  useEffect(() => { loadDigest(); loadVerdicts(); }, [loadDigest, loadVerdicts]);

  const items = useMemo(() => flatItems(digest), [digest]);
  const runId = digest && digest.generated_at;

  // Map (runId+requestId) → latest verdict for this run. Re-marks overwrite.
  const verdictsByKey = useMemo(() => {
    const map = new Map();
    for (const v of verdicts) {
      const k = verdictKey(v.run_generated_at, v.request_id);
      const prior = map.get(k);
      if (!prior || (typeof v.ts === 'string' && v.ts > (prior.ts || ''))) {
        map.set(k, v);
      }
    }
    return map;
  }, [verdicts]);

  // Verdict for THIS run's row.
  function verdictForRow(item) {
    return verdictsByKey.get(verdictKey(runId, item.request_id)) || null;
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const [focusIndex, setFocusIndex] = useState(0);
  const [differForKey, setDifferForKey] = useState(null); // verdictKey
  const [noteText, setNoteText] = useState('');
  const noteInputRef = useRef(null);

  useEffect(() => { if (focusIndex >= items.length) setFocusIndex(0); }, [items.length, focusIndex]);

  const submitVerdict = useCallback(async (item, agree, would_do, note) => {
    if (!runId) return;
    const record = {
      id: newVerdictId(),
      ts: new Date().toISOString(),
      run_generated_at: runId,
      request_id: item.request_id,
      rule_id: item.rule_id,
      from: item.from,
      proposed_verb: item.proposed_verb,
      agree,
      would_do: would_do || null,
      note: note || '',
    };
    // Optimistic update so the row immediately reflects the verdict.
    setVerdicts((prev) => prev.concat([record]));
    try {
      const res = await fetch('/api/digest/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) {
        // Roll back the optimistic insert and surface the error.
        setVerdicts((prev) => prev.filter((v) => v.id !== record.id));
        setVerdictsError('save failed');
        return;
      }
      setVerdictsError(null);
    } catch {
      setVerdicts((prev) => prev.filter((v) => v.id !== record.id));
      setVerdictsError('save failed');
    }
  }, [runId]);

  const onAgree = useCallback((item) => {
    submitVerdict(item, true, null, '');
    setDifferForKey(null);
    setNoteText('');
  }, [submitVerdict]);

  const onToggleDiffer = useCallback((item) => {
    const k = verdictKey(runId, item.request_id);
    setDifferForKey((cur) => (cur === k ? null : k));
    setNoteText('');
  }, [runId]);

  const onPickOption = useCallback((item, optionId) => {
    submitVerdict(item, false, optionId, noteText);
    setDifferForKey(null);
    setNoteText('');
  }, [submitVerdict, noteText]);

  const onConfirmDifferWithNote = useCallback((item) => {
    if (noteText.trim() === '') return; // require something to record
    submitVerdict(item, false, null, noteText);
    setDifferForKey(null);
    setNoteText('');
  }, [submitVerdict, noteText]);

  // Global keydown handler — j/k navigate, a agree, d differ, enter confirm
  // a pending differ-with-note. Gated by isFormFocused() so typing in the note
  // textarea does NOT fire row-level commands.
  useEffect(() => {
    function onKey(e) {
      if (isFormFocused()) {
        // Inside the note textarea: Enter (without Shift) confirms a note.
        if (e.key === 'Enter' && !e.shiftKey && differForKey !== null) {
          const idx = items.findIndex((it) => verdictKey(runId, it.request_id) === differForKey);
          if (idx >= 0) {
            e.preventDefault();
            onConfirmDifferWithNote(items[idx]);
          }
        }
        return;
      }
      if (items.length === 0) return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'a') {
        e.preventDefault();
        const item = items[focusIndex];
        if (item) onAgree(item);
      } else if (e.key === 'd') {
        e.preventDefault();
        const item = items[focusIndex];
        if (item) onToggleDiffer(item);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, focusIndex, runId, differForKey, onAgree, onToggleDiffer, onConfirmDifferWithNote]);

  // When entering differ mode, autofocus the note input so the user can type
  // immediately. Picking an option still works via click.
  useEffect(() => {
    if (differForKey !== null && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [differForKey]);

  const summary = summarizeDigest(digest);

  return (
    <Box title="auto-trickster — its calls, for you to tune (optional)" tone="double" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ color: DIM, fontSize: 12 }}>
          {status === 'ready' && summary && (
            <span>
              <strong style={{ color: FG }}>{summary.pending}</strong> waiting ·{' '}
              <strong style={{ color: WARN }}>{summary.escalate}</strong> need you ·{' '}
              <strong style={{ color: HOT }}>{summary.autoGrant}</strong> the robot would handle
              {summary.autoDeny ? <> · {summary.autoDeny} it would decline</> : null}
              {isShadow(digest) ? <span style={{ color: DIM }}> · proposals only (not yet acting)</span> : <span style={{ color: HOT }}> · acting live</span>}
            </span>
          )}
          {status === 'absent' && <span>nothing from the auto-trickster yet.</span>}
          {status === 'loading' && <span>loading digest…</span>}
          {status === 'error' && <span style={{ color: WARN }}>digest unavailable.</span>}
          {verdictsError && status === 'ready' && (
            <span style={{ color: WARN, marginLeft: 8 }} title={verdictsError}> · verdicts {verdictsError}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <CopyForClaudeButton verdicts={verdicts} runId={runId} />
          <button onClick={() => { loadDigest(); loadVerdicts(); }} style={linkBtn}>refresh</button>
          <button data-testid="digest-toggle" onClick={() => setOpen((o) => !o)} style={linkBtn}>{open ? 'hide' : 'show'}</button>
        </div>
      </div>

      {open && status === 'ready' && digest && (
        <div style={{ marginTop: 10 }}>
          <AlignmentReadout verdicts={verdicts} runId={runId} />
          {tierGroups(digest).map((g) => (
            <div key={g.tier} style={{ marginBottom: 10 }}>
              <div style={{ color: WARN, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {g.tier}. {humanTier(g.label)}
              </div>
              <div style={{ color: DIM, fontSize: 11, fontStyle: 'italic', marginBottom: 4 }}>{g.signature}</div>
              {g.items.map((e) => {
                const flatIdx = items.findIndex((it) => it.rowKind === 'escalation' && it.request_id === e.request_id);
                return (
                  <DigestRow
                    key={e.request_id}
                    rowKind="escalation"
                    rank={e.rank}
                    from={e.from}
                    headline={e.headline}
                    blocking={e.blocking}
                    requestId={e.request_id}
                    resource={e.resource}
                    options={Array.isArray(e.options) ? e.options : []}
                    canEscalate={false}
                    focused={flatIdx === focusIndex}
                    verdict={verdictForRow(items[flatIdx] || { request_id: e.request_id })}
                    isDiffer={differForKey === verdictKey(runId, e.request_id)}
                    noteText={noteText}
                    noteInputRef={noteInputRef}
                    setNoteText={setNoteText}
                    onAgree={() => onAgree(items[flatIdx])}
                    onToggleDiffer={() => onToggleDiffer(items[flatIdx])}
                    onPickOption={(opt) => onPickOption(items[flatIdx], opt)}
                    onConfirmDifferWithNote={() => onConfirmDifferWithNote(items[flatIdx])}
                  />
                );
              })}
            </div>
          ))}

          {autoDecisions(digest).length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px dashed var(--phosphor-dim)', paddingTop: 6 }}>
              <div style={{ color: DIM, fontSize: 11, textTransform: 'uppercase' }}>
                {isShadow(digest) ? 'the robot would handle these' : 'the robot handled these'}
              </div>
              {autoDecisions(digest).map((d) => {
                const flatIdx = items.findIndex((it) => it.rowKind === 'auto_decision' && it.request_id === d.request_id);
                return (
                  <DigestRow
                    key={d.request_id}
                    rowKind="auto_decision"
                    rank={null}
                    from={d.from}
                    headline={`${d.verb === 'auto-grant' ? 'grant' : 'deny'} → ${d.option_id || ''}`}
                    blocking={false}
                    requestId={d.request_id}
                    resource={null}
                    options={[]}
                    verb={d.verb}
                    canEscalate
                    focused={flatIdx === focusIndex}
                    verdict={verdictForRow(items[flatIdx] || { request_id: d.request_id })}
                    isDiffer={differForKey === verdictKey(runId, d.request_id)}
                    noteText={noteText}
                    noteInputRef={noteInputRef}
                    setNoteText={setNoteText}
                    onAgree={() => onAgree(items[flatIdx])}
                    onToggleDiffer={() => onToggleDiffer(items[flatIdx])}
                    onPickOption={(opt) => onPickOption(items[flatIdx], opt)}
                    onConfirmDifferWithNote={() => onConfirmDifferWithNote(items[flatIdx])}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </Box>
  );
}

function DigestRow({
  rowKind, rank, from, headline, blocking, requestId, resource, options,
  verb, canEscalate, focused, verdict, isDiffer, noteText, noteInputRef, setNoteText,
  onAgree, onToggleDiffer, onPickOption, onConfirmDifferWithNote,
}) {
  const rowBorder = focused ? `1px solid ${HOT}` : '1px solid transparent';
  return (
    <div
      data-row-kind={rowKind}
      data-request-id={requestId}
      data-focused={focused ? '1' : '0'}
      style={{ marginBottom: 4, fontSize: 12, border: rowBorder, padding: '2px 4px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {rank != null ? <span style={{ color: HOT }}>#{rank} </span> : null}
          {rowKind === 'auto_decision'
            ? <span style={{ color: verb === 'auto-grant' ? HOT : WARN }}>{humanVerb(verb)} </span>
            : null}
          <span style={{ color: DIM }}>[{from}]</span>{' '}
          <span style={{ color: FG }}>{headline}</span>
          {blocking ? <span style={{ color: WARN }}> · paused</span> : null}
          {/* Demoted facts — carrying the card's spine to the digest rows: the
              raw request-id is wire noise, not primary (it stays as the
              data-request-id attribute for row-finding). Show only the human
              register: what it's about, and the options on offer. */}
          {(resource || (rowKind === 'escalation' && options.length)) ? (
            <div style={{ color: DIM, fontSize: 11 }}>
              {[
                resource ? humanResource(resource) : null,
                rowKind === 'escalation' && options.length ? options.join(' / ') : null,
              ].filter(Boolean).join(' · ')}
            </div>
          ) : null}
        </div>
        <VerdictControls
          verdict={verdict}
          isDiffer={isDiffer}
          onAgree={onAgree}
          onToggleDiffer={onToggleDiffer}
        />
      </div>
      {isDiffer && (
        <div style={{ marginTop: 4, paddingLeft: 8, borderLeft: `1px solid ${DIM}` }}>
          <div style={{ color: DIM, fontSize: 11, marginBottom: 4 }}>differ → pick option, or note + enter</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => onPickOption(opt)} style={pickBtn}>{opt}</button>
            ))}
            {canEscalate && (
              <button onClick={() => onPickOption('escalate')} style={{ ...pickBtn, color: WARN, borderColor: WARN }}>
                ESCALATE
              </button>
            )}
          </div>
          <textarea
            ref={noteInputRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="optional one-line note (enter to confirm note-only differ)"
            rows={1}
            style={noteStyle}
          />
          <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
            <button onClick={onConfirmDifferWithNote} style={pickBtn} disabled={noteText.trim() === ''}>
              confirm note
            </button>
            <button onClick={onToggleDiffer} style={pickBtn}>cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VerdictControls({ verdict, isDiffer, onAgree, onToggleDiffer }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}>
      {verdict && (
        <span style={{ color: verdict.agree ? OK : WARN, fontSize: 11, marginRight: 4 }}>
          {verdict.agree
            ? '✓ agree'
            : (verdict.would_do ? `✗ differ → ${verdict.would_do}` : '✗ differ (note)')}
        </span>
      )}
      <button onClick={onAgree} style={{ ...vBtn, color: OK, borderColor: OK }} title="agree (a)">✓</button>
      <button
        onClick={onToggleDiffer}
        style={{ ...vBtn, color: WARN, borderColor: WARN, background: isDiffer ? WARN : 'transparent' }}
        title="differ (d)"
      >
        ✗
      </button>
    </div>
  );
}

function AlignmentReadout({ verdicts, runId }) {
  const overallStats = useMemo(() => matchStats(verdicts), [verdicts]);
  const runStats = useMemo(() => matchStatsForRun(verdicts, runId), [verdicts, runId]);
  if (overallStats.overall.marked === 0) {
    return (
      <div
        data-testid="alignment-readout"
        data-marked="0"
        style={{
          marginBottom: 10, padding: '4px 6px',
          border: `1px dashed ${DIM}`, color: DIM, fontSize: 11,
        }}
      >
        alignment — no verdicts yet · mark agree / differ to seed evidence
      </div>
    );
  }
  const ruleIds = Object.keys(overallStats.byRule).sort((a, b) => {
    const ar = overallStats.byRule[a];
    const br = overallStats.byRule[b];
    if (ar.promotionReady !== br.promotionReady) return ar.promotionReady ? -1 : 1;
    return br.marked - ar.marked;
  });
  return (
    <div
      data-testid="alignment-readout"
      data-marked={String(overallStats.overall.marked)}
      style={{
        marginBottom: 10, padding: '6px 8px',
        border: `1px solid ${DIM}`, fontSize: 12,
      }}
    >
      <div style={{ color: DIM, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        alignment readout
      </div>
      <div style={{ color: FG }}>
        all-time <strong>{overallStats.overall.agree}/{overallStats.overall.marked}</strong>{' '}
        ({pctText(overallStats.overall.rate)})
        {runStats.overall.marked > 0 && (
          <> · this run <strong>{runStats.overall.agree}/{runStats.overall.marked}</strong>{' '}
            ({pctText(runStats.overall.rate)})
          </>
        )}
      </div>
      <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 4em 4em 4em 5em', gap: '0 8px', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <span style={{ color: DIM }}>rule_id</span>
        <span style={{ color: DIM, textAlign: 'right' }}>marked</span>
        <span style={{ color: DIM, textAlign: 'right' }}>agree</span>
        <span style={{ color: DIM, textAlign: 'right' }}>rate</span>
        <span style={{ color: DIM }} />
        {ruleIds.map((ruleId) => {
          const s = overallStats.byRule[ruleId];
          // Defensive: re-assert audition can never be READY at the view
          // layer, independent of what stats says.
          const ready = s.promotionReady && ruleId !== 'HARD-GATE:audition';
          return (
            <React.Fragment key={ruleId}>
              <code data-testid="rule-row" data-rule-id={ruleId} data-ready={ready ? '1' : '0'} style={{ color: FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ruleId}>{ruleId}</code>
              <span style={{ color: FG, textAlign: 'right' }}>{s.marked}</span>
              <span style={{ color: s.agree === s.marked ? OK : FG, textAlign: 'right' }}>{s.agree}</span>
              <span style={{ color: FG, textAlign: 'right' }}>{pctText(s.rate)}</span>
              <span style={{ color: ready ? HOT : DIM, textAlign: 'left' }}>{ready ? '[READY]' : ''}</span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function pctText(rate) {
  if (typeof rate !== 'number' || Number.isNaN(rate)) return '—';
  return Math.round(rate * 100) + '%';
}

function CopyForClaudeButton({ verdicts, runId }) {
  const [state, setState] = useState('idle'); // idle | copied | error
  const onClick = useCallback(async () => {
    const text = formatCopyForClaude(verdicts, { runId });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: a hidden textarea + execCommand. Last-resort for old
        // browsers / non-secure contexts; the dev server is on localhost so
        // clipboard API normally works.
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, [verdicts, runId]);

  const label = state === 'copied' ? 'copied!' : state === 'error' ? 'copy failed' : 'copy for claude';
  const disabled = !verdicts || verdicts.length === 0;
  return (
    <button
      data-testid="copy-for-claude"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'no verdicts to export yet' : 'copy alignment bundle to clipboard'}
      style={{ ...linkBtn, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {label}
    </button>
  );
}

const linkBtn = {
  background: 'none', border: 'none', color: 'var(--ansi-bright-cyan)',
  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textDecoration: 'underline', padding: 0,
};

const vBtn = {
  background: 'transparent', border: '1px solid', color: 'inherit',
  fontFamily: 'var(--font-mono)', fontSize: 12, padding: '0 6px', cursor: 'pointer',
  lineHeight: '1.4', borderRadius: 0,
};

const pickBtn = {
  background: 'transparent', border: '1px solid var(--phosphor-dim)',
  color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: 11,
  padding: '1px 6px', cursor: 'pointer', borderRadius: 0,
};

const noteStyle = {
  width: '100%', background: 'transparent', border: '1px dashed var(--phosphor-dim)',
  color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: 12,
  padding: '2px 4px', outline: 'none', resize: 'vertical',
};
