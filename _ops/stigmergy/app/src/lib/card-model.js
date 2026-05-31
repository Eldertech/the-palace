// card-model.js — pure parsing/normalization for enrichment cards (Phase 4.5).
//
// QUEUE absorbs the Enrichment ceremony's card model as a RENDER-ONLY item
// type (Loudon's call: get it in front of him before any autonomous action --
// no deposit/revise/discard worker-fire yet). The card folders live at
// Enrichment/card-* on disk; the server reads them and hands the raw
// frontmatter+body here. This mirrors Enrichment/server.py:load_cards but is
// pure JS so it is unit-testable against fixture strings.
//
// A card folder contains a card.md (frontmatter + body) plus one artifact file.
// The card.md frontmatter carries: target_name, target_path,
// target_obsidian_uri, purpose, fv, summary, reasoning, created,
// artifact_path, artifact_type, and the verbose-mode validator fields
// (validator_verdict, validator_note, validator_iterations), plus `archived`.

// Detect artifact type from a filename extension (mirrors server.py).
export function detectArtifactType(filename) {
  if (typeof filename !== 'string') return 'none';
  const ext = (filename.match(/\.[^.]+$/)?.[0] || '').toLowerCase();
  if (['.wav', '.mp3', '.ogg', '.m4a', '.flac'].includes(ext)) return 'audio';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
  if (['.html', '.htm'].includes(ext)) return 'iframe';
  if (['.md', '.txt'].includes(ext)) return 'text';
  return 'file';
}

// Truthy-ish check for the `archived` frontmatter flag.
export function isArchived(fm) {
  const v = (fm?.archived ?? '').toString().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1';
}

// Normalize one card's parsed frontmatter + body + folder name into the card
// object the UI renders. `artifactFile` is the resolved artifact filename
// (the server picks the first non-card.md file when frontmatter omits it).
// `artifactText` is the inline text body for text-type artifacts (optional).
export function normalizeCard({ id, frontmatter = {}, body = '', artifactFile = null, artifactText = null }) {
  const fm = frontmatter || {};
  const artifact = (typeof fm.artifact_path === 'string' && fm.artifact_path.trim() !== '')
    ? fm.artifact_path
    : artifactFile;
  const artifactType = (typeof fm.artifact_type === 'string' && fm.artifact_type.trim() !== '')
    ? fm.artifact_type
    : (artifact ? detectArtifactType(artifact) : 'none');

  // Palace-relative URL the /api/file route can serve (image/audio/iframe).
  const artifactUrl = artifact
    ? `/api/file?path=${encodeURIComponent(`Enrichment/${id}/${artifact}`)}`
    : null;

  return {
    id,
    kind: 'enrichment_card',
    target_name: str(fm.target_name),
    target_path: str(fm.target_path),
    target_obsidian_uri: str(fm.target_obsidian_uri),
    purpose: str(fm.purpose),
    fv: str(fm.fv),
    summary: str(fm.summary),
    reasoning: str(fm.reasoning),
    created: str(fm.created),
    artifact,
    artifact_type: artifactType,
    artifact_url: artifactUrl,
    artifact_text: artifactType === 'text' ? (artifactText ?? null) : null,
    validator_verdict: str(fm.validator_verdict),
    validator_note: str(fm.validator_note),
    validator_iterations: str(fm.validator_iterations),
    body: (body || '').trim(),
  };
}

// Sort cards by folder name (card-NNN) so the queue order is stable + readable,
// matching the Flask server's sorted(glob('card-*')) order.
export function sortCards(cards) {
  return [...(cards ?? [])].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
}

// Map a validator verdict to a tone token for the UI strip.
export function verdictTone(verdict) {
  const v = (verdict || '').toLowerCase();
  if (v === 'pass') return 'var(--phosphor)';
  if (v.startsWith('revise')) return 'var(--warn)';
  if (v === 'kill') return 'var(--error)';
  return 'var(--phosphor-dim)';
}

function str(v) {
  return typeof v === 'string' ? v : (v == null ? '' : String(v));
}
