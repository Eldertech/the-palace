// artifact.js — pure render-side helpers for inline rich-content.
//
// The browser-side counterpart to the server's GET /api/file endpoint.
// Detects an artifact's render mode from its filename, builds the fetch URL,
// and normalizes the two payload conventions into one list. No DOM, no React —
// all pure so the unit tests can pin the behavior exactly.
//
// Render modes:
//   audio  — <audio> element
//   image  — <img> element
//   iframe — sandboxed <iframe> (HTML artifacts: sims, decks, players)
//   file   — anything else; the renderer falls back to an open-link

const AUDIO_EXT = new Set(['wav', 'mp3', 'ogg', 'm4a', 'flac']);
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']);
const HTML_EXT = new Set(['html', 'htm']);

// Lowercased extension without the dot. '' when there is no real extension
// (no dot, or a dotfile like ".gitignore" whose dot is leading).
export function extOf(path) {
  if (typeof path !== 'string') return '';
  const base = path.split(/[\\/]/).pop() || '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return '';
  return base.slice(dot + 1).toLowerCase();
}

export function detectArtifactType(path) {
  const ext = extOf(path);
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (IMAGE_EXT.has(ext)) return 'image';
  if (HTML_EXT.has(ext)) return 'iframe';
  return 'file';
}

// Build the GET /api/file URL for a palace-relative path.
export function fileUrl(path) {
  return '/api/file?path=' + encodeURIComponent(path);
}

// Normalize the payload's artifact convention into a list of {path, caption}.
// Accepts payload.artifacts ([{path, caption?}]) OR payload.artifact_path
// (string). `artifacts` wins if both are present. Returns [] when neither is
// present or the entries are malformed (no non-empty string path).
export function artifactsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.artifacts)) {
    return payload.artifacts
      .filter((a) => a && typeof a.path === 'string' && a.path.trim() !== '')
      .map((a) => ({ path: a.path, caption: typeof a.caption === 'string' ? a.caption : null }));
  }
  if (typeof payload.artifact_path === 'string' && payload.artifact_path.trim() !== '') {
    return [{ path: payload.artifact_path, caption: null }];
  }
  return [];
}

// Basename for the artifact's type label / alt text.
export function basenameOf(path) {
  if (typeof path !== 'string') return '';
  return path.split(/[\\/]/).pop() || path;
}
