// Unit tests for the Companion prompt builder. The prompt must ground the
// worker in the page + its neighborhood, carry the conversation + the user's
// message, and pin the discuss-only contract (no edits, JSON-only reply).

import { describe, it, expect } from 'vitest';
import { buildCompanionPrompt } from '../../server/companion-prompt.js';

const grounding = {
  entry: {
    title: 'Merleau-Ponty', type: 'person', stage: 'growing',
    pillars: ['philosophy'],
    forward_vector: 'I want to put the lived body back into the loop.',
  },
  neighbors: [
    { type: 'deepens', label: 'grounds', name: 'Phenomenology', resolved: true, forward_vector: 'I want to describe experience before theory.' },
    { type: 'connects-to', label: null, name: 'A Ghost Node', resolved: false, forward_vector: null },
  ],
  floor: { forward_vector: 'symbiotic human and AI flourishing through joyful creation' },
};

describe('buildCompanionPrompt', () => {
  it('speaks AS the entry in Companion mode', () => {
    const p = buildCompanionPrompt({ grounding, body: '# Body\nthe flesh.', message: 'what is the body schema?' });
    expect(p).toMatch(/You ARE the palace entry «Merleau-Ponty»/);
    expect(p).toMatch(/COMPANION mode/);
  });

  it('injects the entry body and its forward vector', () => {
    const p = buildCompanionPrompt({ grounding, body: '# Body\nthe flesh is the medium.', message: 'hi' });
    expect(p).toMatch(/the flesh is the medium/);
    expect(p).toMatch(/lived body back into the loop/);
  });

  it('lists the typed-link neighborhood with relations + vectors + ghost flag', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'hi' });
    expect(p).toMatch(/deepens \(grounds\) → Phenomenology/);
    expect(p).toMatch(/before theory/);
    expect(p).toMatch(/A Ghost Node \[ghost: not yet an entry\]/);
  });

  it('carries the conversation history and the latest message', () => {
    const p = buildCompanionPrompt({
      grounding, body: 'x', message: 'and now?',
      history: [{ role: 'user', text: 'first q' }, { role: 'companion', text: 'first a' }],
    });
    expect(p).toMatch(/Loudon: first q/);
    expect(p).toMatch(/You: first a/);
    expect(p).toMatch(/LOUDON'S MESSAGE ==\nand now\?/);
  });

  it('pins the discuss-only contract and the JSON output shape', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'hi' });
    expect(p).toMatch(/DISCUSS-ONLY turn: do NOT edit, write/);
    expect(p).toMatch(/\{"reply":"<your reply, markdown allowed>"\}/);
  });

  it('truncates a pathologically long body', () => {
    const huge = 'z'.repeat(20000);
    const p = buildCompanionPrompt({ grounding, body: huge, message: 'hi' });
    expect(p).toMatch(/\[truncated\]/);
  });
});
