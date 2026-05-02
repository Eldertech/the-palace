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

export function Box({ children, title, tone = 'double', style = {}, pad = true }) {
  const chars = tone === 'double'
    ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' }
    : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };
  return (
    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--phosphor)', textShadow: 'var(--glow)', ...style }}>
      <div style={{ whiteSpace: 'pre', lineHeight: 1.1 }}>
        {chars.tl}{title ? `═ ${title} ${chars.h.repeat(Math.max(0, 72 - title.length))}` : chars.h.repeat(76)}{chars.tr}
      </div>
      <div style={{
        padding: pad ? '6px 12px' : 0,
        borderLeft: `1px ${tone === 'double' ? 'double' : 'solid'} var(--phosphor-dim)`,
        borderRight: `1px ${tone === 'double' ? 'double' : 'solid'} var(--phosphor-dim)`,
        marginLeft: '2px', marginRight: '2px',
      }}>
        {children}
      </div>
      <div style={{ whiteSpace: 'pre', lineHeight: 1.1 }}>{chars.bl}{chars.h.repeat(76)}{chars.br}</div>
    </div>
  );
}

export function Rule({ double = false, children }) {
  const c = double ? '═' : '─';
  const inner = children
    ? `${c.repeat(2)} ${children} ${c.repeat(Math.max(0, 74 - String(children).length))}`
    : c.repeat(78);
  return (
    <div style={{
      whiteSpace: 'pre', color: 'var(--phosphor-dim)', textShadow: 'none',
      fontFamily: 'var(--font-mono)', lineHeight: 1,
    }}>{inner}</div>
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
