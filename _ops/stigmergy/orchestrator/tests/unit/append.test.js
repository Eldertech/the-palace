// append.test.js — atomic append, final-newline preservation, concurrent writes.

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendMessage, readJsonl } from '../../src/append.js';

let tmp;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'palace-orch-append-'));
});

describe('appendMessage', () => {
  it('creates the file and writes a single newline-terminated line', () => {
    const path = join(tmp, 'board.jsonl');
    const msg = { id: 'a', x: 1 };
    const out = appendMessage(path, msg);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toBe(JSON.stringify(msg) + '\n');
    expect(out.wrote).toBe(JSON.stringify(msg));
  });

  it('appends a second line preserving prior content', () => {
    const path = join(tmp, 'board.jsonl');
    appendMessage(path, { id: 'a' });
    appendMessage(path, { id: 'b' });
    const lines = readFileSync(path, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).id).toBe('a');
    expect(JSON.parse(lines[1]).id).toBe('b');
  });

  it('repairs a missing final newline before appending (final-newline invariant)', () => {
    const path = join(tmp, 'board.jsonl');
    writeFileSync(path, '{"id":"a"}', 'utf8'); // no trailing newline (simulates a crash)
    appendMessage(path, { id: 'b' });
    const text = readFileSync(path, 'utf8');
    expect(text).toBe('{"id":"a"}\n{"id":"b"}\n');
  });

  it('creates intermediate parent directories', () => {
    const path = join(tmp, 'sub', 'dir', 'board.jsonl');
    appendMessage(path, { id: 'a' });
    expect(existsSync(path)).toBe(true);
  });
});

describe('readJsonl', () => {
  it('returns empty array for missing file', () => {
    expect(readJsonl(join(tmp, 'nope.jsonl'))).toEqual([]);
  });

  it('parses a file with mixed empty lines correctly', () => {
    const path = join(tmp, 'board.jsonl');
    writeFileSync(path, '{"id":"a"}\n\n{"id":"b"}\n', 'utf8');
    const out = readJsonl(path);
    expect(out).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('throws on malformed lines with line number context', () => {
    const path = join(tmp, 'board.jsonl');
    writeFileSync(path, '{"id":"a"}\n{not-json}\n', 'utf8');
    expect(() => readJsonl(path)).toThrow(/line 2/);
  });
});

describe('appendMessage + readJsonl round-trip', () => {
  it('serially appends 10 messages and round-trips them in order', () => {
    const path = join(tmp, 'board.jsonl');
    for (let i = 0; i < 10; i++) {
      appendMessage(path, { id: `msg-${i}`, n: i });
    }
    const out = readJsonl(path);
    expect(out.length).toBe(10);
    expect(out.map((m) => m.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
