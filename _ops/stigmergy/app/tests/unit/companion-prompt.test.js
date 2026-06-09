// Unit tests for the Companion prompt builder. The prompt must ground the
// worker in the page + its neighborhood, carry the conversation + the user's
// message, and pin the discuss-only contract (no edits, JSON-only reply).

import { describe, it, expect } from 'vitest';
import { buildCompanionPrompt, buildTricksterPrompt } from '../../server/companion-prompt.js';

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

  it('adds a FOCUS block for a pinned passage, and omits it otherwise', () => {
    const withFocus = buildCompanionPrompt({ grounding, body: 'the flesh.', message: 'tighten this', focus: 'skill lives in the body schema' });
    expect(withFocus).toMatch(/FOCUS — the exact passage Loudon has pinned/);
    expect(withFocus).toMatch(/skill lives in the body schema/);
    const noFocus = buildCompanionPrompt({ grounding, body: 'x', message: 'hi' });
    expect(noFocus).not.toMatch(/FOCUS — the exact passage/);
  });

  it('offers the edit ops and the optional-edit JSON contract', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'hi' });
    // worker classifies discuss-vs-edit itself (Tier A, capable model)
    expect(p).toMatch(/DISCUSS, or to EDIT the\nentry in place/);
    expect(p).toMatch(/Do NOT touch any files yourself/);
    expect(p).toMatch(/"op":"append"/);
    expect(p).toMatch(/"op":"prepend"/);
    expect(p).toMatch(/"op":"rewrite"/);
    expect(p).toMatch(/"op":"graffiti"/);
    expect(p).toMatch(/"op":"set-vector"/);
    // exactly-one-occurrence discipline for rewrite
    expect(p).toMatch(/occur exactly once/);
    expect(p).toMatch(/Include "edit" only when you are editing/);
  });

  it('lets the forward vector be edited (set-vector, never silent) but no other frontmatter', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'change my forward vector' });
    expect(p).toMatch(/CAPABILITY BOUNDARY/);
    expect(p).toMatch(/set-vector/);
    expect(p).toMatch(/NEVER change it silently/);
    // every OTHER frontmatter field still cannot be edited
    expect(p).toMatch(/do NOT propose an edit op/);
  });

  it('instructs adaptive narration — quiet reply when an edit is clean', () => {
    const p = buildCompanionPrompt({ grounding, body: 'x', message: 'tighten this' });
    expect(p).toMatch(/NARRATION \(adaptive\)/);
    expect(p).toMatch(/keep "reply" QUIET/);
    expect(p).toMatch(/leave it\nempty/);
  });

  it('truncates a pathologically long body', () => {
    const huge = 'z'.repeat(20000);
    const p = buildCompanionPrompt({ grounding, body: huge, message: 'hi' });
    expect(p).toMatch(/\[truncated\]/);
  });
});

describe('buildTricksterPrompt (Stage 2 project Q&A)', () => {
  const ctx = {
    kind: 'trickster_request', request_id: 'req-1', project: 'Waveguide Synthesizer',
    ask: 'pick the excitation model', ground: 'two viable readings',
    rationale: 'plucked vs bowed change the whole voice',
    options: [{ id: 'a', label: 'plucked' }, { id: 'b', label: 'bowed', recommended: true }],
  };
  const projGrounding = {
    entry: { title: 'Waveguide Synthesizer', type: 'project', stage: 'growing', forward_vector: 'I want to sing through a tube.' },
    neighbors: [{ type: 'deepens', label: null, name: 'Karplus-Strong', resolved: true, forward_vector: 'I want to pluck.' }],
    floor: { forward_vector: 'flourishing' },
  };

  it('speaks as the project and carries its forward vector + the ask + options', () => {
    const p = buildCompanionPrompt({ context: ctx, grounding: projGrounding, message: 'what are you asking?' });
    expect(p).toMatch(/TRICKSTER deck/);
    expect(p).toMatch(/You ARE «Waveguide Synthesizer»/);
    expect(p).toMatch(/sing through a tube/);
    expect(p).toMatch(/Karplus-Strong/);
    expect(p).toMatch(/pick the excitation model/);
    expect(p).toMatch(/\[b\] bowed  \(steward leans here\)/);
    // read-only: no edit ops, no flag action
    expect(p).toMatch(/READ-ONLY/);
    expect(p).not.toMatch(/"op":"append"/);
    expect(p).not.toMatch(/"type":"flag"/);
  });

  it('grounds in the request alone when the project does not resolve to an entry', () => {
    const p = buildTricksterPrompt({ context: ctx, grounding: null, message: 'hi' });
    expect(p).toMatch(/does not resolve to/);
    expect(p).toMatch(/pick the excitation model/);
  });
});
