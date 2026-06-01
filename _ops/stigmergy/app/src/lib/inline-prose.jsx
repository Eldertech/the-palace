import React from 'react';

// Lightweight inline-prose renderer. Used wherever a palace body string
// needs **bold**, *italic*, [[wikilink]], and `code` rendered inline --
// QUEUE rationale blocks, card summaries, anywhere we surface authored
// text outside the full EntryBody renderer.
//
// Pipeline (mirrors EntryBody.jsx but smaller):
//   1. Tokenize atomic spans (code, wikilink) into \x00<id>\x00 placeholders
//      so emphasis regexes don't break across them.
//   2. Run emphasis passes (***bi***, **head *tail***, **bold**, *italic*).
//   3. Expand placeholders to React nodes.
//   4. Preserve paragraph breaks (\n\n) and single newlines.
//
// `ctx` is { index?, onNavigate? } -- when omitted, wikilinks render as
// dim text (no resolve, no click). Callers that need wikilink navigation
// pass the wikilink index.

export default function InlineProse({ text, ctx = {}, keyPrefix = 'ip' }) {
  if (typeof text !== 'string' || text === '') return null;
  // Split into paragraphs on blank lines; render each paragraph with
  // emphasis + atoms inline. Single newlines inside a paragraph are
  // preserved as <br/>.
  const paragraphs = text.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p
          key={`${keyPrefix}-p${pi}`}
          style={{
            margin: pi === 0 ? '0 0 8px' : '0 0 8px',
            lineHeight: 1.45,
          }}
        >
          {renderParagraph(para, ctx, `${keyPrefix}-p${pi}`)}
        </p>
      ))}
    </>
  );
}

function renderParagraph(text, ctx, keyPrefix) {
  // Tokenize code + wikilinks into placeholders.
  const atoms = [];
  let tokenized = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      const nl = text.indexOf('\n', i + 1);
      if (end !== -1 && (nl === -1 || end < nl)) {
        const id = atoms.length;
        atoms.push({ kind: 'code', value: text.slice(i + 1, end) });
        tokenized += `\x00${id}\x00`;
        i = end + 1;
        continue;
      }
    }
    if (text[i] === '[' && text[i + 1] === '[') {
      const end = text.indexOf(']]', i + 2);
      const nl = text.indexOf('\n', i + 2);
      if (end !== -1 && (nl === -1 || end < nl)) {
        const inside = text.slice(i + 2, end).trim();
        const pipe = inside.indexOf('|');
        const name = pipe === -1 ? inside : inside.slice(0, pipe).trim();
        const display = pipe === -1 ? name : inside.slice(pipe + 1).trim();
        if (name) {
          const id = atoms.length;
          atoms.push({ kind: 'wikilink', name, display });
          tokenized += `\x00${id}\x00`;
          i = end + 2;
          continue;
        }
      }
    }
    tokenized += text[i];
    i += 1;
  }

  // Run emphasis passes on the tokenized text.
  const emphNodes = formatEmphasis(
    tokenized,
    keyPrefix,
    (inner, innerKey) => expandPlaceholders(inner, atoms, ctx, innerKey),
  );

  // Expand any remaining string segments + preserve single newlines.
  const out = [];
  emphNodes.forEach((en, ei) => {
    if (typeof en === 'string') {
      out.push(...renderWithSoftBreaks(en, atoms, ctx, `${keyPrefix}-e${ei}`));
    } else {
      out.push(en);
    }
  });
  return out;
}

function renderWithSoftBreaks(text, atoms, ctx, keyPrefix) {
  const lines = text.split('\n');
  const out = [];
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`${keyPrefix}-br${li}`} />);
    out.push(...expandPlaceholders(line, atoms, ctx, `${keyPrefix}-l${li}`));
  });
  return out;
}

function expandPlaceholders(text, atoms, ctx, keyPrefix) {
  if (typeof text !== 'string' || text === '') return [];
  const out = [];
  const re = /\x00(\d+)\x00/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={`${keyPrefix}-t${i}`}>{text.slice(last, m.index)}</span>);
    const atom = atoms[parseInt(m[1], 10)];
    if (atom) out.push(renderAtom(atom, `${keyPrefix}-a${i}`, ctx));
    last = re.lastIndex;
    i += 1;
  }
  if (last < text.length) out.push(<span key={`${keyPrefix}-t${i}`}>{text.slice(last)}</span>);
  return out;
}

function renderAtom(atom, key, ctx) {
  const { index, onNavigate } = ctx || {};
  if (atom.kind === 'code') {
    return (
      <code key={key} style={{
        background: 'var(--phosphor-deep)',
        color: 'var(--phosphor-bright)',
        textShadow: 'var(--glow)',
        padding: '0 4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.95em',
      }}>{atom.value}</code>
    );
  }
  if (atom.kind === 'wikilink') {
    const resolved = index?.get?.(atom.name) ?? null;
    const known = resolved !== null;
    return (
      <span
        key={key}
        data-testid="body-wikilink"
        data-resolved={known ? 'true' : 'false'}
        onClick={() => { if (known && onNavigate) onNavigate(resolved); }}
        style={{
          color: known ? 'var(--link)' : 'var(--phosphor-dim)',
          textShadow: known ? 'var(--glow)' : 'none',
          cursor: known && onNavigate ? 'pointer' : 'default',
          borderBottom: known ? '1px dashed currentColor' : '1px dotted currentColor',
        }}
        title={known ? atom.name : `${atom.name} (unresolved)`}
      >{atom.display}</span>
    );
  }
  return null;
}

// ── Emphasis: same four-pass strategy as EntryBody ──────────────────────────
function formatEmphasis(text, keyPrefix, renderChildren) {
  let nodes = [text];
  let counter = 0;
  const renderInner = typeof renderChildren === 'function'
    ? renderChildren
    : (inner) => inner;

  // ***bold-italic***
  nodes = splitByPattern(nodes, /\*\*\*([^*\n]+?)\*\*\*/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-bi${counter}`;
    return (
      <strong key={k} style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)' }}>
        <em style={{ fontStyle: 'italic' }}>{renderInner(match, `${k}-c`)}</em>
      </strong>
    );
  });

  // **head *tail***
  nodes = splitByPattern(nodes, /\*\*([^*\n]*?)\*([^*\n]+?)\*\*\*/g, (_g1, _i, _full, groups) => {
    counter += 1;
    const k = `${keyPrefix}-bbi${counter}`;
    return (
      <strong key={k} style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)' }}>
        {renderInner(groups[0], `${k}-h`)}
        <em style={{ fontStyle: 'italic' }}>{renderInner(groups[1], `${k}-t`)}</em>
      </strong>
    );
  });

  // **bold** (allow single * inside)
  nodes = splitByPattern(nodes, /\*\*((?:[^*\n]|\*(?!\*))+?)\*\*/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-b${counter}`;
    return (
      <strong key={k} style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)' }}>
        {renderInner(match, `${k}-c`)}
      </strong>
    );
  });

  // *italic*
  nodes = splitByPattern(nodes, /(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-i${counter}`;
    return (
      <em key={k} style={{ color: 'var(--phosphor-bright, var(--phosphor))', fontStyle: 'italic' }}>
        {renderInner(match, `${k}-c`)}
      </em>
    );
  });

  return nodes;
}

function splitByPattern(items, pattern, nodeFor) {
  const out = [];
  for (const item of items) {
    if (typeof item !== 'string') { out.push(item); continue; }
    pattern.lastIndex = 0;
    let last = 0;
    let m;
    let i = 0;
    while ((m = pattern.exec(item)) !== null) {
      if (m.index > last) out.push(item.slice(last, m.index));
      out.push(nodeFor(m[1], i, m[0], m.slice(1)));
      last = pattern.lastIndex;
      i += 1;
      if (pattern.lastIndex === m.index) pattern.lastIndex += 1;
    }
    if (last < item.length) out.push(item.slice(last));
  }
  return out;
}
