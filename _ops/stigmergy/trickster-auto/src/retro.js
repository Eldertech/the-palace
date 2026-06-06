// retro.js — the shadow-tuning scoreboard.
//
// Replays the CURRENT ruleset over the WHOLE board history and scores each
// would-be auto-decision against the decision Loudon actually made (his
// RESOURCE_GRANT/RESOURCE_DENY clicks — never the engine's own `decided_by:auto`
// posts). It answers the only question that earns `--live`: "when the engine
// would have auto-acted, how often did I agree — and did it ever propose a grant
// I'd have denied?"
//
// Pure core (`scoreBoard`) + a renderer + a CLI shim wired behind `cli.js
// --retro`. No writes, no posting — read-only over the board.

import { parseRequest } from './parse.js';
import { evaluate } from './evaluate.js';

// The default "earned --live" criterion, per-rule. Conservative on purpose:
// zero dangerous false-grants is non-negotiable; the rest are tunable.
export const DEFAULT_PROMOTION = {
  minDecided: 20,        // need enough of your decisions to trust the number
  maxDangerous: 0,       // never promote a rule that would grant something you denied
  minAgreementPct: 90,   // of the cases it auto-acted on, ≥90% you'd have granted (exact option or free-text)
};

const isAutoPost = (m) =>
  (m && m.payload && m.payload.decided_by === 'auto') || String((m && m.from) || '').includes('(auto)');

/**
 * Score the active ruleset against the board's human decisions.
 *
 * @param {object[]} board — parsed board messages
 * @param {object} ruleset — a loadRuleset() result
 * @param {object} [opts]
 * @param {object} [opts.promotion] — overrides for DEFAULT_PROMOTION
 * @returns {{ total:number, decided:number, criterion:object, rules:object[] }}
 */
export function scoreBoard(board, ruleset, opts = {}) {
  const criterion = { ...DEFAULT_PROMOTION, ...(opts.promotion || {}) };

  // 1. Human ground truth: a non-auto grant/deny correlated by `re`.
  const human = new Map();
  for (const m of board) {
    if (!m || (m.type !== 'RESOURCE_GRANT' && m.type !== 'RESOURCE_DENY')) continue;
    if (typeof m.re !== 'string' || m.re.trim() === '') continue;
    if (isAutoPost(m)) continue;
    human.set(m.re, {
      verb: m.type === 'RESOURCE_GRANT' ? 'grant' : 'deny',
      option_id: (m.payload && m.payload.option_id) ?? null,
      notes: (m.payload && m.payload.notes) ?? '',
    });
  }

  // 2. Requests, de-duplicated by request_id (last wins — supersession).
  const byId = new Map();
  for (const m of board) {
    if (!m || m.type !== 'RESOURCE_REQUEST') continue;
    const id = typeof m.request_id === 'string' ? m.request_id : (m.id || `__noid__${byId.size}`);
    byId.set(id, m);
  }

  // 3. Replay the engine and accumulate per firing rule.
  const rules = new Map();
  const ensure = (ruleId) => {
    if (!rules.has(ruleId)) {
      rules.set(ruleId, {
        ruleId, verb: null, fired: 0, decided: 0,
        granted: 0, denied: 0, exactOption: 0, notesMode: 0, optionDivergence: 0,
        dangerous: 0, mismatches: [],
      });
    }
    return rules.get(ruleId);
  };

  let decidedTotal = 0;
  for (const [id, msg] of byId) {
    const req = parseRequest(msg);
    const v = evaluate(req, ruleset, null); // null budget → never budget-downgraded in the retro
    const acc = ensure(v.ruleId);
    acc.verb = v.verb;
    acc.fired += 1;
    const h = human.get(id);
    if (!h) continue;
    acc.decided += 1; decidedTotal += 1;

    if (v.verb === 'auto-grant') {
      const eng = (v.grantOption && v.grantOption.id) || null;
      if (h.verb === 'deny') {
        acc.denied += 1; acc.dangerous += 1;
        acc.mismatches.push({ id, from: req.from, kind: 'ENGINE-GRANT_vs_HUMAN-DENY', engOption: eng, human: h });
      } else {
        acc.granted += 1;
        if (h.option_id && eng && String(h.option_id) === String(eng)) acc.exactOption += 1;
        else if (!h.option_id) acc.notesMode += 1; // you answered in free text — still a grant
        else { acc.optionDivergence += 1; acc.mismatches.push({ id, from: req.from, kind: 'OPTION-DIVERGENCE', engOption: eng, human: h }); }
      }
    } else if (v.verb === 'auto-deny') {
      if (h.verb === 'deny') acc.denied += 1;
      else { acc.granted += 1; acc.dangerous += 1; acc.mismatches.push({ id, from: req.from, kind: 'ENGINE-DENY_vs_HUMAN-GRANT', human: h }); }
    }
    // escalate: the engine deferred to you; nothing to score for a rule.
  }

  const perRule = [...rules.values()].map((r) => {
    const autoActing = r.verb === 'auto-grant' || r.verb === 'auto-deny';
    const scored = r.granted + r.denied; // decisions where the engine auto-acted AND you decided
    const agree = r.verb === 'auto-deny' ? r.denied : (r.exactOption + r.notesMode);
    const agreementPct = scored ? Math.round((100 * agree) / scored) : 0;
    const eligible = autoActing
      && r.decided >= criterion.minDecided
      && r.dangerous <= criterion.maxDangerous
      && agreementPct >= criterion.minAgreementPct;
    return { ...r, autoActing, scored, agreementPct, eligible };
  });

  return { total: byId.size, decided: decidedTotal, criterion, rules: perRule };
}

/** Render the scoreboard as plain text for the CLI. */
export function renderRetroText(report) {
  const lines = [];
  lines.push('=== shadow-tuning scoreboard — ruleset replayed over board history ===');
  lines.push(`requests: ${report.total}  |  with a human decision: ${report.decided}`);
  lines.push(`promotion criterion: ≥${report.criterion.minDecided} decided · ≤${report.criterion.maxDangerous} dangerous · ≥${report.criterion.minAgreementPct}% agreement`);
  lines.push('');
  for (const r of report.rules) {
    if (!r.autoActing) {
      lines.push(`• ${r.ruleId} [${r.verb}] — fired ${r.fired}× (deferred to you; not scored)`);
      continue;
    }
    const verdict = r.eligible ? 'ELIGIBLE for --live' : 'not yet eligible';
    lines.push(`• ${r.ruleId} [${r.verb}] — ${verdict}`);
    lines.push(`    fired ${r.fired}× · you decided ${r.decided} · agreement ${r.agreementPct}% · dangerous ${r.dangerous}`);
    lines.push(`    exact-option ${r.exactOption} · free-text grants ${r.notesMode} · option divergence ${r.optionDivergence}`);
    for (const m of r.mismatches) {
      const ho = m.human.option_id ? `=${m.human.option_id}` : (m.human.notes ? ` (notes)` : '');
      lines.push(`      ⚠ ${m.kind}: ${m.id} (${m.from}) engine→${m.engOption ?? '—'}  you→${m.human.verb}${ho}`);
    }
  }
  return lines.join('\n') + '\n';
}
