import React, { useEffect, useMemo, useState } from 'react';
import { Banner, Box } from '../primitives.jsx';
import CommitCard from './CommitCard.jsx';
import CommitDiff from './CommitDiff.jsx';
import UncommittedBanner from './UncommittedBanner.jsx';
import GitStatePanel from './GitStatePanel.jsx';
import LogFilters from './LogFilters.jsx';
import { fetchLog, fetchUncommitted } from '../../adapters/log.js';
import { fetchEntries } from '../../adapters/entries.js';
import { filterCommits, groupByCampaign } from '../../lib/log-filter.js';
import { useCommitNavigation } from '../../lib/url-nav.js';

// LOG deck -- the git explorer. The retrospective surface; honest by
// construction because git is the work's record, not a projection of it.
//   - uncommitted-work banner at the top (the invisible dive made visible)
//   - filters (kind / author / pillar / entry / text / time)
//   - the commit stream as semantic cards, campaign threads collapsed
//   - clicking a commit opens its palace-aware diff
//
// Pillar filtering joins touched paths against the entries catalog, fetched
// once on mount (the same ~sub-second walk STATE uses).

function CampaignThread({ thread, onOpen, onFilterEntry }) {
  const [open, setOpen] = useState(false);
  if (!thread.campaign || thread.commits.length === 1) {
    return thread.commits.map((c) => (
      <CommitCard key={c.hash} commit={c} onOpen={onOpen} onFilterEntry={onFilterEntry} />
    ));
  }
  const head = thread.commits[0];
  return (
    <div data-testid="campaign-thread" data-campaign={thread.campaign} style={{
      border: '1px dashed var(--ansi-bright-yellow)', padding: 6, marginBottom: 8,
    }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: 'pointer', color: 'var(--ansi-bright-yellow)', textShadow: 'var(--glow)', fontSize: 12, marginBottom: 4 }}
      >
        {open ? '[-]' : '[+]'} campaign: {thread.campaign} ({thread.commits.length} commits)
      </div>
      {open
        ? thread.commits.map((c) => <CommitCard key={c.hash} commit={c} onOpen={onOpen} onFilterEntry={onFilterEntry} compact />)
        : <CommitCard commit={head} onOpen={onOpen} onFilterEntry={onFilterEntry} compact />}
    </div>
  );
}

// The LOG deck reads only the most recent N commits — a WINDOW, not the whole
// history (the repo has hundreds/thousands). The old "N/N commits" readout used
// this window size as the denominator, which read as "N of N total" — i.e. "this
// is all of history" — when it is really "the last N we loaded". Naming it here
// and surfacing it as "last N commits" makes the window honest.
const LOG_WINDOW = 200;

export default function LogDeck() {
  const [logState, setLogState] = useState({ kind: 'loading' });
  const [uncommitted, setUncommitted] = useState(null);
  const [pathPillars, setPathPillars] = useState(null);
  const [filter, setFilter] = useState({});
  // Bumped by every load() so the GIT STATE panel refetches worktree topology
  // on the same [R] RELOAD (and after a commit is recorded).
  const [gitNonce, setGitNonce] = useState(0);
  // URL drives the open commit: ?commit=<sha>. Browser back/forward
  // traverse the open/close history; deep-linked commit URLs land directly
  // on the diff view.
  const commitNav = useCommitNavigation();
  const openSha = commitNav.commit;
  const setOpenSha = commitNav.openCommit;

  const load = () => {
    setLogState({ kind: 'loading' });
    fetchLog({ limit: LOG_WINDOW }).then((r) => {
      if (r.ok) setLogState({ kind: 'ok', commits: r.commits ?? [], count: r.count ?? 0 });
      else setLogState({ kind: 'err', error: r.error });
    });
    fetchUncommitted().then((r) => { if (r.ok) setUncommitted(r); });
    setGitNonce((n) => n + 1);
  };

  useEffect(() => { load(); }, []);

  // Catalog for the pillar join (path → pillars). Best-effort; pillar filter
  // is disabled until it resolves.
  useEffect(() => {
    let cancelled = false;
    fetchEntries().then((r) => {
      if (cancelled || !r.ok) return;
      const map = new Map();
      for (const e of r.entries ?? []) {
        if (e.path && Array.isArray(e.pillars)) map.set(e.path, e.pillars);
      }
      setPathPillars(map);
    });
    return () => { cancelled = true; };
  }, []);

  const commits = logState.kind === 'ok' ? logState.commits : [];
  const filtered = useMemo(
    () => filterCommits(commits, filter, pathPillars),
    [commits, filter, pathPillars]
  );
  const threads = useMemo(() => groupByCampaign(filtered), [filtered]);

  if (openSha) {
    return (
      <div data-testid="log-deck">
        <CommitDiff
          sha={openSha}
          onBack={() => setOpenSha(null)}
          onGoBack={commitNav.goBack}
          onFilterEntry={(e) => { setFilter((f) => ({ ...f, entry: e })); setOpenSha(null); }}
        />
      </div>
    );
  }

  return (
    <div data-testid="log-deck">
      <div
        style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 10 }}
        title={logState.kind === 'ok' && logState.count >= LOG_WINDOW
          ? `the LOG shows the most recent ${LOG_WINDOW} commits — a window, not the full repo history`
          : undefined}
      >
        {logState.kind === 'ok'
          ? (logState.count >= LOG_WINDOW
              ? (filtered.length === logState.count
                  ? `last ${LOG_WINDOW} commits`
                  : `${filtered.length} of last ${LOG_WINDOW} commits`)
              : `${filtered.length}/${logState.count} commits`)
          : 'reading history...'}
        <span
          onClick={load}
          style={{ marginLeft: 12, cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)', border: '1px solid var(--phosphor-dim)', padding: '0 6px', fontSize: 11 }}
        >
          [R] RELOAD
        </span>
      </div>

      <GitStatePanel nonce={gitNonce} uncommittedCount={uncommitted?.total ?? 0} />

      {uncommitted ? <UncommittedBanner delta={uncommitted} onCommitted={load} /> : null}

      {logState.kind === 'err' ? (
        <div data-testid="log-error" style={{ color: 'var(--error)', textShadow: 'var(--glow)', border: '1px solid var(--error)', padding: 12 }}>
          could not read git history: {logState.error}
        </div>
      ) : logState.kind === 'loading' ? (
        <div data-testid="log-loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>reading git history...</div>
      ) : (
        <>
          <LogFilters
            commits={commits}
            filter={filter}
            onChange={setFilter}
            pillarsAvailable={pathPillars !== null}
          />
          <div data-testid="commit-stream">
            {threads.length === 0 ? (
              <Box tone="single"><div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontStyle: 'italic' }}>no commits match the filter.</div></Box>
            ) : (
              threads.map((t, i) => (
                <CampaignThread
                  key={t.campaign ?? t.commits[0]?.hash ?? i}
                  thread={t}
                  onOpen={(sha) => setOpenSha(sha)}
                  onFilterEntry={(e) => setFilter((f) => ({ ...f, entry: e }))}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
