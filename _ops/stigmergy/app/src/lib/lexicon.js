// lexicon.js — natural-register surface strings for the STIGMERGY UI.
//
// Loudon never reads protocol jargon at the BBS surface. The wire-layer
// code may still compare against `m.board === 'TRICKSTER'` and friends —
// that's the data layer — but any visible string a human will read comes
// from this file.
//
// Why this exists: the 2026-06-05 Trickster four-card session forced the
// two-register rule into the wild for the first time. The companion palace
// entry [[Speak Like a Person, Log Like a Protocol]] is the canonical
// translation key; this file is the executable version of that key.
//
// Keys are dot-namespaced. Lookups fall through to the key itself if
// missing, so a typo or unsurfaced term is obvious in dev rather than
// crashing the page.

const DICT = {
  // ── Boards ─────────────────────────────────────────────────────
  // Wire enum values (TRICKSTER, GENERAL, WEAVE, CARDS, SYSTEM) are
  // internal. Loudon sees the natural-register name.
  'board.label':            'channel',
  'board.trickster':        'Trickster',
  'board.general':          'General',
  'board.weave':            'Weave',
  'board.cards':            'Cards',
  'board.system':           'System',

  // ── Trickster inbox surface ────────────────────────────────────
  'trickster.inbox.title':      'Trickster · pending decisions',
  'trickster.inbox.empty':      'No decisions waiting · every steward is continuing on its own.',
  'trickster.pending.heading':  '? a steward is asking',

  // ── Pause states (wire: payload.blocking true/false) ───────────
  'pause.short':                'parked',
  'pause.long.paused':          'the steward stopped working until you answer',
  'pause.long.continuing':      'steward still working — answer when convenient',
  'pause.field.label':          'while waiting',

  // ── Message types (wire: msg.type) ─────────────────────────────
  // These appear in the message-row metadata header. The wire types
  // (BROADCAST, RESOURCE_REQUEST, etc.) never get displayed.
  'type.label':             'kind',
  'type.broadcast':         'update',
  'type.request':           'asks',
  'type.grant':             'reply: yes',
  'type.deny':              'reply: no',
  'type.flag':              'flag',
  'type.proof':             'proof',
  'type.session_init':      'session opened',
  'type.session_close':     'session closed',

  // ── Field labels (wire: payload.* and health.*) ────────────────
  // Used in the metadata key:value rows the inbox renders.
  'field.from':             'from',
  'field.ts':               'when',
  'field.resource':         'about',
  'field.status':           'doing',
  'field.health':           'shape',
  'field.session':          'thread',
  'field.rationale':        'reasoning',
  'field.intent':           'intent',
};

/** Translate a key into its natural-register surface string. Unknown keys
 *  return the key itself so missing translations are visible without
 *  crashing. A `fallback` may be supplied for a graceful default. */
export function t(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
  return fallback ?? key;
}

/** Translate a wire pause state (payload.blocking) into the short label
 *  the inbox metadata row uses. */
export function pauseShort(blocking) {
  return blocking ? t('pause.short') : t('field.status', 'continuing');
}

/** Translate a wire pause state into the long, prose-style sentence the
 *  card header surfaces. */
export function pauseLong(blocking) {
  return blocking ? t('pause.long.paused') : t('pause.long.continuing');
}

/** Translate a wire board enum value into its display name. Falls through
 *  to the raw enum if no mapping exists, which catches new boards visibly. */
export function boardName(boardEnum) {
  if (typeof boardEnum !== 'string') return '';
  return t(`board.${boardEnum.toLowerCase()}`, boardEnum);
}

/** Translate a wire message-type enum into its display name. Falls
 *  through to the raw enum if no mapping exists. */
export function typeName(typeEnum) {
  if (typeof typeEnum !== 'string') return '';
  return t(`type.${typeEnum.toLowerCase()}`, typeEnum);
}

/** Exposed for the drift-linter test (vitest reads this to assert the
 *  dictionary doesn't carry forbidden wire vocabulary in its VALUES). */
export const _DICT_FOR_TESTING = DICT;
