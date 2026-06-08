// Unit tests for the Companion lane's pure helpers: the board-identity
// convention, the tolerant reply extractor, and the §2.2 message builder
// (which must pass the strict core validator).

import { describe, it, expect } from 'vitest';
import {
  slugify, companionFrom, extractReply, extractResult, buildCompanionMessage, buildEditProofMessage,
} from '../../server/companion-lane.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('slugify / companionFrom', () => {
  it('slugifies a title', () => {
    expect(slugify('Merleau-Ponty')).toBe('merleau-ponty');
    expect(slugify('The Body Schema!')).toBe('the-body-schema');
    expect(slugify('')).toBe('entry');
  });
  it('names the board identity (the convention, no new verb)', () => {
    expect(companionFrom('Merleau-Ponty')).toBe('Merleau-Ponty (Companion)');
  });
});

describe('extractReply', () => {
  it('parses the clean JSON contract', () => {
    expect(extractReply('{"reply":"hello there"}')).toBe('hello there');
  });
  it('unwraps a fenced JSON object', () => {
    expect(extractReply('```json\n{"reply":"fenced"}\n```')).toBe('fenced');
  });
  it('finds the object inside surrounding prose', () => {
    expect(extractReply('Sure thing! {"reply":"wrapped"} — done.')).toBe('wrapped');
  });
  it('takes the LAST reply object when several appear', () => {
    expect(extractReply('{"reply":"first"}\n{"reply":"second"}')).toBe('second');
  });
  it('handles escaped quotes inside the reply', () => {
    expect(extractReply('{"reply":"he said \\"hi\\""}')).toBe('he said "hi"');
  });
  it('falls back to raw text when there is no JSON', () => {
    expect(extractReply('just prose, no json')).toBe('just prose, no json');
  });
  it('returns empty for empty / non-string input', () => {
    expect(extractReply('')).toBe('');
    expect(extractReply(null)).toBe('');
    expect(extractReply(undefined)).toBe('');
  });
});

describe('extractResult', () => {
  it('returns reply with no edit for a discuss turn', () => {
    expect(extractResult('{"reply":"just talking"}')).toEqual({ reply: 'just talking', edit: null });
  });
  it('returns reply + edit for an edit turn', () => {
    const r = extractResult('{"reply":"done","edit":{"op":"append","text":"a line"}}');
    expect(r.reply).toBe('done');
    expect(r.edit).toEqual({ op: 'append', text: 'a line' });
  });
  it('accepts an edit-only object (empty reply)', () => {
    const r = extractResult('{"edit":{"op":"prepend","text":"x"}}');
    expect(r.reply).toBe('');
    expect(r.edit.op).toBe('prepend');
  });
  it('falls back to raw text as the reply when no JSON', () => {
    expect(extractResult('plain prose')).toEqual({ reply: 'plain prose', edit: null });
  });
});

describe('buildEditProofMessage', () => {
  it('produces a valid PROOF carrying the commit + branch', () => {
    const msg = buildEditProofMessage({
      title: 'Merleau-Ponty', entryPath: 'Merleau-Ponty.md',
      turnId: 'companion-merleau-ponty-2026-06-08T10-00-00-000Z',
      op: 'append', shortHash: 'abc1234', branch: 'stigmergy-edits',
      summary: 'append a line', model: 'opus', ts: '2026-06-08T10:00:09Z',
    });
    expect(validateMessage(msg).valid).toBe(true);
    expect(msg.type).toBe('PROOF');
    expect(msg.from).toBe('Merleau-Ponty (Companion)');
    expect(msg.payload.kind).toBe('companion_edit');
    expect(msg.payload.commit).toBe('abc1234');
    expect(msg.payload.branch).toBe('stigmergy-edits');
    expect(msg.payload.status).toBe('committed');
  });
});

describe('buildCompanionMessage', () => {
  const base = {
    title: 'Merleau-Ponty',
    entryPath: 'Merleau-Ponty.md',
    turnId: 'companion-merleau-ponty-2026-06-08T10-00-00-000Z',
    reply: 'the body is the seat of perception.',
    model: 'opus',
    ts: '2026-06-08T10:00:05Z',
    id: 'merleau-ponty-companion-001',
  };

  it('produces a message that PASSES the strict §2.2 validator', () => {
    const msg = buildCompanionMessage(base);
    const v = validateMessage(msg);
    expect(v.valid).toBe(true);
  });

  it('uses the Companion board-identity convention and a Path-2 health stub', () => {
    const msg = buildCompanionMessage(base);
    expect(msg.from).toBe('Merleau-Ponty (Companion)');
    expect(msg.type).toBe('BROADCAST');
    expect(msg.board).toBe('GENERAL');
    expect(msg.health._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');
    expect(msg.health.model).toBe('opus');
  });

  it('carries a companion_reply payload threaded to the turn', () => {
    const msg = buildCompanionMessage(base);
    expect(msg.payload.kind).toBe('companion_reply');
    expect(msg.payload.entry_path).toBe('Merleau-Ponty.md');
    expect(msg.payload.turn_id).toBe(base.turnId);
    expect(msg.payload.reply).toMatch(/seat of perception/);
  });
});
