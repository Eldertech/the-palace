import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '../primitives.jsx';
import QueueItem from './QueueItem.jsx';
import { buildQueue, reconcileQueue, partitionQueue, laneCounts } from '../../lib/queue-model.js';
import { fetchLog } from '../../adapters/log.js';

// QueuePanel — the unified, honest, ranked queue (Phase 4).
//
// One ranked inbox of everything open, generalizing the per-board tabs into
// lanes. Items are built from the board messages (resource requests +
// handoff_ready posts) and RECONCILED against git: when a commit satisfies an
// item's stale_if, the item greys with "looks done -- clear it?". This is the
// prospective (QUEUE) -> retrospective (LOG) crossing, made visible.
//
// `messages` is the live board feed (App passes visibleMessages). The LOG
// commits drive reconciliation; we fetch them once on mount and on demand.
// `dismissed` ids are cleared locally (the human's "clear it?" click) -- the
// durable record remains git; this just tidies the live view.

export default function QueuePanel({ messages, onJumpEntry }) {
  const [commits, setCommits] = useState([]);
  const [laneFilter, setLaneFilter] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [showResolved, setShowResolved] = useState(true);

  const loadCommits = () => {
    fetchLog({ limit: 200 }).then((r) => { if (r.ok) setCommits(r.commits || []); });
  };
  useEffect(() => { loadCommits(); }, []);

  const items = useMemo(() => {
    const built = buildQueue(messages);
    const reconciled = reconcileQueue(built, commits);
    return reconciled.filter((it) => !dismissed.has(it.id));
  }, [messages, commits, dismissed]);

  const lanes = useMemo(() => laneCounts(items), [items]);
  const laneFiltered = laneFilter ? items.filter((i) => i.board === laneFilter) : items;
  const { open, resolved } = partitionQueue(laneFiltered);

  const clearItem = (item) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const jump = (pointer) => {
    if (pointer?.type === 'entry' && onJumpEntry) onJumpEntry(pointer.target);
  };

  return (
    <Box title="queue -- the ranked inbox" tone="double" style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8,
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12,
      }}>
        <span><strong style={{ color: 'var(--phosphor)' }}>{open.length}</strong> open</span>
        {resolved.length > 0 ? (
          <span><strong style={{ color: 'var(--phosphor-dim)' }}>{resolved.length}</strong> looks-done</span>
        ) : null}
        <span
          onClick={loadCommits}
          style={{ cursor: 'pointer', color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', textDecoration: 'underline' }}
          title="re-check git for resolving commits"
        >
          reconcile
        </span>

        {/* lanes: the six boards become filters, not tabs */}
        <span style={{ marginLeft: 8 }}>lanes:</span>
        <span
          data-testid="queue-lane-all"
          onClick={() => setLaneFilter(null)}
          style={{
            cursor: 'pointer', fontSize: 11, padding: '0 5px',
            background: laneFilter === null ? 'var(--phosphor)' : 'transparent',
            color: laneFilter === null ? 'var(--bg)' : 'var(--phosphor-dim)',
            border: '1px solid var(--phosphor-dim)',
          }}
        >all ({items.length})</span>
        {[...lanes.entries()].map(([board, n]) => (
          <span
            key={board}
            data-testid={`queue-lane-${board}`}
            onClick={() => setLaneFilter(board === laneFilter ? null : board)}
            style={{
              cursor: 'pointer', fontSize: 11, padding: '0 5px',
              background: laneFilter === board ? 'var(--phosphor)' : 'transparent',
              color: laneFilter === board ? 'var(--bg)' : 'var(--phosphor-dim)',
              border: '1px solid var(--phosphor-dim)',
            }}
          >{board.toLowerCase()} ({n})</span>
        ))}
      </div>

      {open.length === 0 && resolved.length === 0 ? (
        <div data-testid="queue-empty" style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontStyle: 'italic' }}>
          nothing open. the queue is quiet.
        </div>
      ) : null}

      <div data-testid="queue-open">
        {open.map((it) => (
          <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} />
        ))}
      </div>

      {resolved.length > 0 ? (
        <div style={{ marginTop: 6 }}>
          <div
            onClick={() => setShowResolved((s) => !s)}
            style={{ cursor: 'pointer', color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}
          >
            {showResolved ? '[-]' : '[+]'} {resolved.length} looks-done (git resolved)
          </div>
          {showResolved ? (
            <div data-testid="queue-resolved">
              {resolved.map((it) => (
                <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Box>
  );
}
