import React, { useMemo, useRef, useState } from 'react';
import { LINK_TYPES } from '../../lib/entry-edit.js';
import { stripWikiBrackets } from '../../lib/yaml-frontmatter.js';

// One repeatable typed-link row: target autocomplete + type dropdown + label.
// The target field shows live autocomplete against the wikilink index so
// dangling links become impossible to author through the form.
//
// Props:
//   link            -- { target, type, label } (label may be null)
//   index           -- Map(name -> path) for target autocomplete
//   onChange(next)  -- called with the updated link object
//   onRemove()      -- called when the user removes this row
//   testId          -- data-testid prefix for the row

export default function LinkRowEditor({ link, index, onChange, onRemove, testId }) {
  const inputRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState(0);

  // Palace links are commonly stored bracketed -- target: "[[Foo]]" -- but
  // the wikilink index keys are bare names. Strip brackets before matching.
  const bareTarget = useMemo(() => stripWikiBrackets(link.target || ''), [link.target]);

  const candidates = useMemo(() => {
    if (!index || !index.keys) return [];
    const q = bareTarget.toLowerCase();
    const out = [];
    for (const name of index.keys()) {
      if (q === '' || name.toLowerCase().includes(q)) {
        out.push(name);
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [index, bareTarget]);

  function setField(key, value) {
    onChange({ ...link, [key]: value });
  }

  function apply(name) {
    // Wikilink-pick writes the canonical bracketed form so the link round-
    // trips as a wikilink, matching how palace entries are linked on disk.
    // A user wanting a free-text target can still type one bare and skip
    // the autocomplete -- the lookup ignores bare-text targets.
    setField('target', `[[${name}]]`);
    setShowPopup(false);
    requestAnimationFrame(() => { if (inputRef.current) inputRef.current.focus(); });
  }

  function onTargetKeyDown(e) {
    if (!showPopup || candidates.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setSelected((s) => (s + 1) % candidates.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setSelected((s) => (s - 1 + candidates.length) % candidates.length);
    } else if (e.key === 'Enter') {
      e.preventDefault(); apply(candidates[selected]);
    } else if (e.key === 'Escape') {
      e.preventDefault(); setShowPopup(false);
    }
  }

  // A target is "known" when its bare name resolves to a palace entry.
  // Empty targets are not flagged unknown (those are just incomplete rows).
  // Non-wikilink free-text targets (e.g. "three.js (external)") are not
  // expected to resolve and should not be flagged unknown either -- the
  // index lookup tells us only whether a palace entry with this name
  // exists, and absence is meaningful only when the user is reaching for
  // a wikilink (the canonical bracketed form, or the autocomplete popup
  // matched a candidate). For Stage A we flag only when the target IS
  // bracketed AND no entry resolves -- that is the "dangling wikilink"
  // condition the form is meant to make impossible.
  const looksBracketed = (link.target || '').trim().startsWith('[[');
  const known = !bareTarget
    || !looksBracketed
    || (index && index.has && index.has(bareTarget));

  return (
    <div data-testid={testId} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 180px minmax(0, 160px) 28px',
      gap: 6,
      alignItems: 'start',
      marginBottom: 4,
    }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          data-testid={testId ? `${testId}-target` : undefined}
          type="text"
          value={link.target || ''}
          onChange={(e) => { setField('target', e.target.value); setShowPopup(true); setSelected(0); }}
          onFocus={() => setShowPopup(true)}
          onBlur={() => { setTimeout(() => setShowPopup(false), 120); }}
          onKeyDown={onTargetKeyDown}
          placeholder="target entry"
          style={inputStyle(known ? 'phosphor' : 'phosphor-dim')}
        />
        {showPopup && candidates.length > 0 ? (
          <div style={popupStyle()}>
            {candidates.map((name, i) => (
              <div
                key={name}
                onMouseDown={(e) => { e.preventDefault(); apply(name); }}
                onMouseEnter={() => setSelected(i)}
                style={{
                  padding: '2px 6px',
                  cursor: 'pointer',
                  background: i === selected ? 'var(--phosphor-dim)' : 'transparent',
                  color: i === selected ? 'var(--bg, #000)' : 'var(--phosphor)',
                  textShadow: i === selected ? 'none' : 'var(--glow)',
                  fontSize: 13,
                }}
              >
                {name}
              </div>
            ))}
          </div>
        ) : null}
        {!known && link.target ? (
          <div data-testid={testId ? `${testId}-target-unknown` : undefined}
            style={{ color: 'var(--warn)', fontSize: 10, marginTop: 2 }}>
            no entry by that name
          </div>
        ) : null}
      </div>
      <select
        data-testid={testId ? `${testId}-type` : undefined}
        value={link.type || 'connects-to'}
        onChange={(e) => setField('type', e.target.value)}
        style={inputStyle('phosphor')}
      >
        {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input
        data-testid={testId ? `${testId}-label` : undefined}
        type="text"
        value={link.label || ''}
        onChange={(e) => setField('label', e.target.value || null)}
        placeholder="label (optional)"
        style={inputStyle('phosphor-dim')}
      />
      <button
        data-testid={testId ? `${testId}-remove` : undefined}
        onClick={onRemove}
        title="remove this link"
        style={{
          background: 'transparent',
          color: 'var(--phosphor-dim)',
          border: '1px solid var(--phosphor-dim)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 14,
          height: 28,
        }}
      >×</button>
    </div>
  );
}

function inputStyle(color) {
  return {
    width: '100%',
    background: 'var(--bg, #000)',
    color: `var(--${color})`,
    textShadow: color === 'phosphor' ? 'var(--glow)' : 'none',
    border: '1px solid var(--phosphor-dim)',
    padding: '4px 8px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 13,
    boxSizing: 'border-box',
    height: 28,
  };
}

function popupStyle() {
  return {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 2,
    background: 'var(--bg, #000)',
    border: '1px solid var(--phosphor)',
    padding: 4,
    zIndex: 10,
    minWidth: '100%',
    maxHeight: 200,
    overflowY: 'auto',
    fontFamily: 'var(--font-mono, monospace)',
  };
}
