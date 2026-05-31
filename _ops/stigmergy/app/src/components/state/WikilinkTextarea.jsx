import React, { useEffect, useMemo, useRef, useState } from 'react';
import { wikilinkSuggestions } from '../../lib/entry-edit.js';

// A textarea that pops a wikilink autocomplete list when the caret is inside
// an open `[[ ... ]]`. Picking a suggestion completes the link with `]]`.
// Plain textarea + popup matches the BBS aesthetic; no markdown editor lib.
//
// Props:
//   value         -- the current text
//   onChange(v)   -- called on text change
//   index         -- Map(name -> path) for autocomplete (StateDeck's index)
//   rows          -- textarea rows (default 24)
//   placeholder   -- placeholder text
//   testId        -- data-testid for the root

export default function WikilinkTextarea({ value, onChange, index, rows = 24, placeholder, testId }) {
  const ref = useRef(null);
  const [caret, setCaret] = useState(0);
  const [selected, setSelected] = useState(0);

  const suggestions = useMemo(
    () => wikilinkSuggestions(value || '', caret, index, 8),
    [value, caret, index],
  );

  useEffect(() => { setSelected(0); }, [suggestions.prefix]);

  function handleChange(e) {
    onChange(e.target.value);
    setCaret(e.target.selectionStart);
  }
  function handleKeyUp(e) {
    setCaret(e.target.selectionStart);
  }
  function handleClick(e) {
    setCaret(e.target.selectionStart);
  }

  function applyCandidate(name) {
    if (!suggestions.active) return;
    const before = (value || '').slice(0, suggestions.start);
    const after = (value || '').slice(suggestions.end);
    // After `[[` we replace prefix with `name]]` and place caret after the `]]`.
    const insertion = `${name}]]`;
    const next = `${before}${insertion}${after}`;
    onChange(next);
    const newCaret = (before + insertion).length;
    setCaret(newCaret);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(newCaret, newCaret);
      }
    });
  }

  function handleKeyDown(e) {
    if (!suggestions.active || suggestions.candidates.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (s + 1) % suggestions.candidates.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => (s - 1 + suggestions.candidates.length) % suggestions.candidates.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      applyCandidate(suggestions.candidates[selected]);
    } else if (e.key === 'Escape') {
      // Best-effort: insert ]] to close, dismissing the popup naturally.
      e.preventDefault();
      applyCandidate(suggestions.prefix);
    }
  }

  return (
    <div data-testid={testId} style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        data-testid={testId ? `${testId}-input` : undefined}
        value={value || ''}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--bg, #000)',
          color: 'var(--phosphor)',
          textShadow: 'var(--glow)',
          border: '1px solid var(--phosphor-dim)',
          padding: 12,
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: 14,
          lineHeight: 1.5,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
      {suggestions.active && suggestions.candidates.length > 0 ? (
        <div
          data-testid={testId ? `${testId}-popup` : undefined}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 2,
            background: 'var(--bg, #000)',
            border: '1px solid var(--phosphor)',
            boxShadow: '0 0 0 1px var(--bg, #000), 0 0 12px var(--phosphor-dim)',
            padding: 4,
            zIndex: 10,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 13,
            maxHeight: 240,
            overflowY: 'auto',
            minWidth: 240,
          }}
        >
          <div style={{ color: 'var(--phosphor-dim)', padding: '2px 6px', fontSize: 11 }}>
            [[{suggestions.prefix}_]]  ·  ↑↓ Enter to select  ·  Esc to dismiss
          </div>
          {suggestions.candidates.map((name, i) => (
            <div
              key={name}
              data-testid={testId ? `${testId}-candidate-${i}` : undefined}
              onClick={() => applyCandidate(name)}
              onMouseEnter={() => setSelected(i)}
              style={{
                padding: '2px 6px',
                cursor: 'pointer',
                background: i === selected ? 'var(--phosphor-dim)' : 'transparent',
                color: i === selected ? 'var(--bg, #000)' : 'var(--phosphor)',
                textShadow: i === selected ? 'none' : 'var(--glow)',
              }}
            >
              {name}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
