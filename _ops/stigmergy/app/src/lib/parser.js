// JSONL parsing — one JSON object per line, no array wrapper.
// Skips malformed lines with a console warning; never throws.
// Strips a UTF-8 BOM if present at the start of the file.

const BOM = '﻿';

export function parseJSONL(text) {
  if (typeof text !== 'string') {
    return { messages: [], skipped: [], warnings: [] };
  }
  let body = text;
  if (body.startsWith(BOM)) body = body.slice(1);
  const lines = body.split(/\r?\n/);
  const messages = [];
  const skipped = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw || raw.trim() === '') continue;
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        messages.push(obj);
      } else {
        skipped.push({ line: i + 1, reason: 'non-object JSON value', raw });
      }
    } catch (err) {
      skipped.push({ line: i + 1, reason: `JSON parse error: ${err.message}`, raw });
    }
  }
  return { messages, skipped };
}
