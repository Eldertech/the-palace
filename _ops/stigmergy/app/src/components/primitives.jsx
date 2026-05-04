import React, { useState, useEffect, useRef } from 'react';

export function Banner({ children, strong, dim, as = 'div', style = {} }) {
  const color = dim ? 'var(--phosphor-dim)' : strong ? 'var(--phosphor-white)' : 'var(--phosphor)';
  const glow = dim ? 'none' : strong ? 'var(--glow-strong)' : 'var(--glow)';
  const Tag = as;
  return (
    <Tag style={{
      fontFamily: 'var(--font-display)', color, textShadow: glow,
      textTransform: 'uppercase', letterSpacing: '.02em', ...style,
    }}>{children}</Tag>
  );
}

// Single rendering mode for the entire app: CSS borders styled to evoke CP437
// double/single line weights. Replaces the prior character-cell box-drawing
// (`╔═╗ ║ ╚═╝` / `┌─┐ │ └─┘`), which was fixed at 78ch and overflowed dynamic
// columns (e.g. when the AGENTS sidebar narrowed the main reading area below
// 78 monospace chars). CSS borders scale to the container; visual register of
// double vs single line weight is preserved as `3px double` vs `1px solid`.
//
// The design system README still mandates character-cell borders. That rule
// is on the v0.2 design-system cleanup ticket; this app is the source of
// truth for the unified rendering until that ticket lands.
const ruleBorder = (double) =>
  double ? '3px double var(--phosphor-dim)' : '1px solid var(--phosphor-dim)';

export function Rule({ double = false, children }) {
  const lineStyle = { flex: 1, borderTop: ruleBorder(double), alignSelf: 'center' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      color: 'var(--phosphor-dim)', textShadow: 'none',
      fontFamily: 'var(--font-mono)', lineHeight: 1, margin: '4px 0',
    }}>
      {children ? (
        <>
          <span style={{ ...lineStyle, flex: '0 0 16px' }} />
          <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
          <span style={lineStyle} />
        </>
      ) : (
        <span style={lineStyle} />
      )}
    </div>
  );
}

export function Box({ children, title, tone = 'double', style = {}, pad = true }) {
  const double = tone === 'double';
  const sideBorder = double ? '3px double var(--phosphor-dim)' : '1px solid var(--phosphor-dim)';
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', color: 'var(--phosphor)', textShadow: 'var(--glow)',
      borderTop: sideBorder, borderBottom: sideBorder,
      borderLeft: sideBorder, borderRight: sideBorder,
      ...style,
    }}>
      {title ? (
        <div style={{
          padding: '2px 12px',
          borderBottom: sideBorder,
          color: 'var(--phosphor-dim)', textShadow: 'none',
          fontFamily: 'var(--font-mono)', lineHeight: 1.2,
        }}>
          {title}
        </div>
      ) : null}
      <div style={{ padding: pad ? '6px 12px' : 0 }}>
        {children}
      </div>
    </div>
  );
}

export function Button({ children, hot, tone = 'default', onClick, disabled }) {
  const toneMap = {
    default: { color: 'var(--phosphor)', border: 'var(--phosphor-dim)' },
    primary: { color: 'var(--phosphor-white)', border: 'var(--phosphor)' },
    warn: { color: 'var(--warn)', border: 'var(--warn)' },
    danger: { color: 'var(--error)', border: 'var(--error)' },
  }[tone];
  const [hover, setHover] = useState(false);
  const inverted = hover && !disabled;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: inverted ? toneMap.color : 'transparent',
        color: inverted ? 'var(--bg)' : disabled ? 'var(--fg3)' : toneMap.color,
        border: `2px solid ${disabled ? 'var(--fg3)' : toneMap.border}`,
        textShadow: inverted || disabled ? 'none' : 'var(--glow)',
        fontFamily: 'var(--font-mono)', fontSize: 13,
        padding: '3px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase', letterSpacing: '.04em',
        borderRadius: 0, outline: 'none', appearance: 'none',
        WebkitAppearance: 'none', MozAppearance: 'none',
      }}
    >
      {hot ? <>[<b style={{ color: inverted ? 'var(--bg)' : 'var(--phosphor-white)', textShadow: inverted ? 'none' : 'var(--glow)' }}>{hot}</b>]&nbsp;</> : null}
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'default' }) {
  const colors = {
    default: 'var(--phosphor-dim)',
    unread: 'var(--unread)',
    ok: 'var(--phosphor)',
    err: 'var(--error)',
    link: 'var(--link)',
  };
  const c = colors[tone];
  return (
    <span style={{
      border: `1px solid ${c}`, color: c, padding: '0 6px', fontSize: 11,
      fontFamily: 'var(--font-mono)', letterSpacing: '.05em', textTransform: 'uppercase',
      textShadow: tone === 'default' ? 'none' : 'var(--glow)',
    }}>{children}</span>
  );
}

export function Field({ prompt = '>', value, onChange, onSubmit, placeholder, password, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>{prompt}</span>
      <input
        ref={ref}
        type={password ? 'password' : 'text'}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) onSubmit(value); }}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          borderBottom: '1px dashed var(--phosphor-dim)',
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
          fontFamily: 'var(--font-mono)', fontSize: 14,
          outline: 'none', padding: '2px 0', caretColor: 'var(--phosphor-white)',
        }}
      />
    </div>
  );
}

export function Cursor() {
  return (
    <span style={{
      display: 'inline-block', width: '10px', height: '1em', verticalAlign: '-2px',
      background: 'var(--phosphor-white)', animation: 'bbs-blink 1.1s steps(1) infinite',
    }} />
  );
}

export function TypeOn({ text, speed = 18, onDone, className, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) { onDone?.(); return; }
    const t = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(t);
  }, [n, text, speed, onDone]);
  return <span className={className} style={style}>{text.slice(0, n)}</span>;
}
