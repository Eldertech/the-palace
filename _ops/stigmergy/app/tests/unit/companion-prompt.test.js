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

  it('injects the full frontmatter so it can comment on any field', () => {
    const fm = { title: 'Merleau-Ponty', type: 'person', stage: 'growing', born: '2026-05', links: [{ target: '[[Phenomenology]]', type: 'deepens' }] };
    const p = buildCompanionPrompt({ grounding, frontmatter: fm, body: 'x', message: 'what stage am I?' });
    expect(p).toMatch(/--- frontmatter ---/);
    expect(p).toMatch(/born: 2026-05/);
    expect(p).toMatch(/comment on ANY part of this entry/);
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

  it('offers the edit ops and the optional-edit JSON contract', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'hi' });
    // worker classifies discuss-vs-edit itself (Tier A, capable model)
    expect(p).toMatch(/DISCUSS, or to EDIT the\nentry in place/);
    expect(p).toMatch(/Do NOT touch any files yourself/);
    expect(p).toMatch(/"op":"append"/);
    expect(p).toMatch(/"op":"prepend"/);
    expect(p).toMatch(/"op":"rewrite"/);
    // exactly-one-occurrence discipline for rewrite
    expect(p).toMatch(/occur exactly once/);
    expect(p).toMatch(/Include "edit" only when you are editing/);
  });

  it('truncates a pathologically long body', () => {
    const huge = 'z'.repeat(20000);
    const p = buildCompanionPrompt({ grounding, body: huge, message: 'hi' });
    expect(p).toMatch(/\[truncated\]/);
  });
});
