// Tests for faces.js — the order, cycle and rich link behind the face switch.

import { describe, it, expect } from 'vitest';
import { FACE_ORDER, orderFaces, nextFace, richHref } from '../../src/lib/faces.js';

describe('orderFaces', () => {
  it('puts the faces in a fixed order with the text always first', () => {
    expect(FACE_ORDER).toEqual(['text', 'rich', 'scroll']);
    expect(orderFaces(['scroll', 'rich'])).toEqual(['text', 'rich', 'scroll']);
    expect(orderFaces(['scroll'])).toEqual(['text', 'scroll']);
  });

  it('drops unknown faces and survives junk', () => {
    expect(orderFaces(['text', 'ledger', 'rich'])).toEqual(['text', 'rich']);
    expect(orderFaces(null)).toEqual(['text']);
    expect(orderFaces('rich')).toEqual(['text']);
  });
});

describe('nextFace', () => {
  it('cycles through the faces the entry has, wrapping', () => {
    const faces = ['text', 'rich', 'scroll'];
    expect(nextFace(faces, 'text')).toBe('rich');
    expect(nextFace(faces, 'rich')).toBe('scroll');
    expect(nextFace(faces, 'scroll')).toBe('text');
    expect(nextFace(['text', 'scroll'], 'text')).toBe('scroll');
  });

  it('stays on the text when it is the only face', () => {
    expect(nextFace(['text'], 'text')).toBe('text');
  });
});

describe('richHref', () => {
  it('names the entry by its file stem under the app base', () => {
    expect(richHref('Kuramoto Coupling.md')).toBe('/rich/?entry=Kuramoto%20Coupling');
    expect(richHref('Projects/Foo Bar.md', '/the-palace/')).toBe('/the-palace/rich/?entry=Foo%20Bar');
    expect(richHref('Saturation ↔ Richness.md', '/x')).toBe('/x/rich/?entry=Saturation%20%E2%86%94%20Richness');
  });
});
