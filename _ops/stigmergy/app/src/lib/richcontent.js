// richcontent.js — pure helpers for the v0.4 renderable content types:
//   - table       (payload.table)        → structured grid
//   - equations   (payload.equations[])  → dual-channel math (symbolic + worded)
//   - choice      (payload.kind:"choice")→ A/B or ranked pick over options
//
// All normalizers are pure and total: they accept whatever is on the (opaque)
// payload and return a clean shape or null/[] — never throw — so a malformed
// card degrades to "render nothing extra" rather than crashing the board.

// ── Table ────────────────────────────────────────────────────────────────────

// Normalize payload.table → { caption, columns: string[], rows: string[][] }.
// Returns null when absent or malformed (no columns, or no rows).
export function tableFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const t = payload.table;
  if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
  if (!Array.isArray(t.columns) || t.columns.length === 0) return null;
  if (!Array.isArray(t.rows)) return null;

  const columns = t.columns.map((c) => (c == null ? '' : String(c)));
  const width = columns.length;
  const rows = t.rows
    .filter((r) => Array.isArray(r))
    .map((r) => {
      const cells = r.map((c) => (c == null ? '' : String(c)));
      // Pad/truncate each row to the column count so the grid stays rectangular.
      if (cells.length < width) return [...cells, ...Array(width - cells.length).fill('')];
      return cells.slice(0, width);
    });
  if (rows.length === 0) return null;

  const caption = typeof t.caption === 'string' && t.caption.trim() !== '' ? t.caption : null;
  return { caption, columns, rows };
}

// ── Equations (dual-channel math) ────────────────────────────────────────────

// Normalize payload.equations[] → [{ label, symbolic, worded, where: [{sym,def}] }].
// Each entry needs at least one of symbolic/worded. The "show equations twice"
// rule lives in the DATA: an author supplies both the symbolic form and the
// worded form (operators kept in both); this helper just validates/cleans.
export function equationsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (!Array.isArray(payload.equations)) return [];
  const out = [];
  for (const e of payload.equations) {
    if (!e || typeof e !== 'object') continue;
    const symbolic = typeof e.symbolic === 'string' && e.symbolic.trim() !== '' ? e.symbolic : null;
    const worded = typeof e.worded === 'string' && e.worded.trim() !== '' ? e.worded : null;
    if (!symbolic && !worded) continue;
    const label = typeof e.label === 'string' && e.label.trim() !== '' ? e.label : null;
    const where = Array.isArray(e.where)
      ? e.where
          .filter((w) => w && typeof w === 'object' && typeof w.sym === 'string' && typeof w.def === 'string')
          .map((w) => ({ sym: w.sym, def: w.def }))
      : [];
    out.push({ label, symbolic, worded, where });
  }
  return out;
}

// ── Choice (A/B or ranked pick) ──────────────────────────────────────────────

// Normalize a choice card → { prompt, mode: 'pick'|'rank', options: [{id,label,artifact_path,caption}] }.
// Triggered by payload.kind === 'choice' with a non-empty options[]. Returns
// null otherwise.
export function choiceFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.kind !== 'choice') return null;
  if (!Array.isArray(payload.options)) return null;

  const options = payload.options
    .filter((o) => o && typeof o === 'object'
      && typeof o.id === 'string' && o.id.trim() !== ''
      && typeof o.label === 'string' && o.label.trim() !== '')
    .map((o) => ({
      id: o.id,
      label: o.label,
      artifact_path: typeof o.artifact_path === 'string' && o.artifact_path.trim() !== '' ? o.artifact_path : null,
      caption: typeof o.caption === 'string' && o.caption.trim() !== '' ? o.caption : null,
    }));
  if (options.length === 0) return null;

  const mode = payload.choice_mode === 'rank' ? 'rank' : 'pick';
  const prompt = typeof payload.prompt === 'string' && payload.prompt.trim() !== '' ? payload.prompt : null;
  return { prompt, mode, options };
}

function generateId() {
  return 'choice-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Build a §2.2-conformant REPLY recording a choice response. `card` is the
// source choice message. Provide either `choice` (a single option id, pick mode)
// or `ranking` (an ordered array of option ids, rank mode). Optional `notes`.
// Mirrors response-builder.js's human-decision conventions so the strict
// server validator accepts it.
export function buildChoiceResponse({ card, choice, ranking, notes }) {
  const payload = { kind: 'choice_response' };
  if (Array.isArray(ranking) && ranking.length > 0) payload.ranking = ranking;
  else if (choice != null && choice !== '') payload.choice = choice;
  if (typeof notes === 'string' && notes.trim() !== '') payload.notes = notes.trim();

  const msg = {
    schema_version: '1.0',
    id: generateId(),
    ts: new Date().toISOString(),
    session_id: (card && typeof card.session_id === 'string' && card.session_id) || 'trickster-choice',
    from: 'TRICKSTER',
    to: (card && typeof card.from === 'string' && card.from) || '*',
    type: 'REPLY',
    board: (card && typeof card.board === 'string' && card.board) || 'GENERAL',
    health: {
      context_pct: 0,
      stop_reason: 'human_decision',
      iteration: 1,
      tokens_this_call: 0,
      model: 'loudon-trickster',
      score: 'green',
    },
    payload,
  };
  const re = card && (card.id || card.request_id);
  if (typeof re === 'string' && re.trim() !== '') msg.re = re;
  return msg;
}
