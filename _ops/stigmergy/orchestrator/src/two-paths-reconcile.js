// two-paths-reconcile.js — Stage F, Phase 2: the reconciliation object.
//
// Both branches of a Two Paths run post a `branch_result` (a PROOF on the
// BRANCHES board when they finished an artifact, or a BROADCAST with
// status:"oversized" when the option didn't fit the cost box). This module
// gathers those posts for one fork into a single DETERMINISTIC reconciliation
// object that is the input to the Phase 3 choice card.
//
// On the §10.2 vocabulary (convergence / contradiction / orthogonality): Two
// Paths deliberately does NOT classify the two artifacts against each other —
// that judgment is exactly what Loudon makes from the finished work. So two
// completed branches reconcile as "orthogonality" (two independent builds the
// human chooses between); the engine never asserts one converged with or
// contradicts the other. The reconciler's real job is completeness bookkeeping:
// did both branches finish, did one fall back, is the fork ready to present?

/**
 * Pull this fork's branch_result payloads out of a board message list. A result
 * is any message whose payload.kind === 'branch_result' and whose
 * payload.request_id matches. Later posts for the same option_id win (a steward
 * may correct itself), keeping the reduction deterministic and order-stable.
 *
 * @param {Array<object>} messages — parsed board messages
 * @param {string} requestId
 * @returns {Array<{from, option_id, status, artifact_path, summary, reason}>}
 */
export function collectBranchResults(messages, requestId) {
  const byOption = new Map();
  for (const m of Array.isArray(messages) ? messages : []) {
    const p = m && m.payload;
    if (!p || typeof p !== 'object') continue;
    if (p.kind !== 'branch_result') continue;
    if (p.request_id !== requestId) continue;
    const option_id = typeof p.option_id === 'string' ? p.option_id : null;
    if (!option_id) continue;
    const hasArtifact = typeof p.artifact_path === 'string' && p.artifact_path.trim() !== '';
    const status = p.status === 'oversized' ? 'oversized' : (hasArtifact ? 'built' : 'incomplete');
    byOption.set(option_id, {
      from: typeof m.from === 'string' ? m.from : null,
      option_id,
      status,
      artifact_path: hasArtifact ? p.artifact_path : null,
      summary: typeof p.summary === 'string' && p.summary.trim() !== '' ? p.summary : null,
      reason: typeof p.reason === 'string' && p.reason.trim() !== '' ? p.reason : null,
    });
  }
  // Deterministic order: by option_id.
  return [...byOption.values()].sort((a, b) => a.option_id.localeCompare(b.option_id));
}

/**
 * Build the reconciliation object for one fork.
 *
 * @param {object} opts
 * @param {string} opts.requestId
 * @param {Array<object>} opts.messages — board messages to scan for branch_results
 * @param {Array<{id,label}>} [opts.expectedOptions] — the two options dispatched
 *        (from the Phase 1 plan); lets the reconciler name which branch is missing.
 * @returns {object} reconciliation object (deterministic for fixed inputs)
 */
export function reconcileTwoPaths({ requestId, messages, expectedOptions }) {
  const results = collectBranchResults(messages, requestId);
  const labelOf = new Map((expectedOptions || []).map((o) => [o.id, o.label]));

  const built = results
    .filter((r) => r.status === 'built')
    .map((r) => ({ option_id: r.option_id, label: labelOf.get(r.option_id) || null, artifact_path: r.artifact_path, summary: r.summary, from: r.from }));
  const fell_back = results
    .filter((r) => r.status === 'oversized')
    .map((r) => ({ option_id: r.option_id, label: labelOf.get(r.option_id) || null, reason: r.reason, from: r.from }));

  const seen = new Set(results.map((r) => r.option_id));
  const expectedIds = (expectedOptions || []).map((o) => o.id);
  const missing = expectedIds.length
    ? expectedIds.filter((id) => !seen.has(id))
    : []; // unknown expectation → cannot name missing branches
  const expectedCount = expectedIds.length || 2;
  const reportedCount = results.length;

  const notes = [];
  let status;
  if (fell_back.length > 0) {
    status = 'fell_back';
    for (const fb of fell_back) {
      notes.push(`branch ${fb.option_id} did not fit the cost box (${fb.reason || 'no reason given'}) → fork falls back to plain Stage E escalation.`);
    }
  } else if (built.length >= 2) {
    status = 'complete';
  } else {
    status = 'incomplete';
    if (expectedIds.length) {
      for (const id of missing) notes.push(`waiting on branch ${id}.`);
    } else {
      notes.push(`only ${reportedCount}/${expectedCount} branch results in — waiting.`);
    }
  }

  const ready_for_choice = status === 'complete' && built.length === 2;
  const relation = ready_for_choice ? 'orthogonality' : 'unknown';
  if (ready_for_choice) {
    notes.push('two finished paths — present both; Loudon picks. The engine does not rank them.');
  }

  return {
    stage: 'F',
    phase: 2,
    request_id: requestId,
    status,                 // 'complete' | 'incomplete' | 'fell_back'
    ready_for_choice,       // true ⇒ Phase 3 may build the choice card
    relation,               // 'orthogonality' (two builds, human chooses) | 'unknown'
    expected_count: expectedCount,
    reported_count: reportedCount,
    built,                  // [{option_id,label,artifact_path,summary,from}] — the choice card's options
    fell_back,              // [{option_id,label,reason,from}]
    missing,                // option ids still outstanding (when expectedOptions known)
    notes,
  };
}
