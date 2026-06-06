import React from 'react';
import { parseLinks, hrefFor } from '../../lib/format.js';
import MermaidBlock from './MermaidBlock.jsx';
import EntryRefChips from '../EntryRefChips.jsx';
import { resolveRef } from '../../lib/entry-ref.js';

// Minimal markdown renderer for entry bodies. Intentionally scoped: the
// goal is "a reader can audit an entry" -- not Obsidian-parity rendering.
// Handles:
//   - HTML comments stripped (CLAUDE.md: invisible in renderers)
//   - Headings (# ## ### #### ##### ######)
//   - Bulleted lists (- ) and numbered lists (1. )
//   - Code fences (``` ... ```), rendered as dim <pre>
//   - Blockquotes (> )
//   - Inline: **bold**, *italic*, `code`, [[wikilink]], [md links](url),
//     bare urls (obsidian:// computer:// http(s):// file://)
//   - Tables: left as <pre> (acceptable in a terminal aesthetic)
//
// Wikilinks resolve via the parent-passed `index` (Map of name -> path).
// Unresolved wikilinks render dim with `??` prefix. The body is the
// conversational fabric (SCHEMA §4) -- distinct from TypedLinkPanel.

function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

// Split body into block-level chunks. A chunk is one of:
//   { kind: 'heading',  level, text }
//   { kind: 'code',     lang,  text }
//   { kind: 'list',     items: [text...], ordered }
//   { kind: 'quote',    text }
//   { kind: 'paragraph', text }
//   { kind: 'blank' }
function blocks(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code fence.
    const fence = line.match(/^```\s*(\w+)?\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // skip closing fence
      out.push({ kind: 'code', lang, text: buf.join('\n') });
      continue;
    }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (h) {
      out.push({ kind: 'heading', level: h[1].length, text: h[2] });
      i += 1;
      continue;
    }

    // Blockquote (single-line for simplicity).
    if (line.match(/^>\s?/)) {
      const buf = [line.replace(/^>\s?/, '')];
      i += 1;
      while (i < lines.length && lines[i].match(/^>\s?/)) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push({ kind: 'quote', text: buf.join('\n') });
      continue;
    }

    // List.
    if (line.match(/^\s*[-*]\s+/) || line.match(/^\s*\d+\.\s+/)) {
      const ordered = !!line.match(/^\s*\d+\.\s+/);
      const items = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s*\d+\.\s+(.*)$/)
          : lines[i].match(/^\s*[-*]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i += 1;
      }
      out.push({ kind: 'list', items, ordered });
      continue;
    }

    // Blank line.
    if (line.trim() === '') {
      out.push({ kind: 'blank' });
      i += 1;
      continue;
    }

    // Paragraph: gather contiguous non-blank, non-block-starting lines.
    const buf = [line];
    i += 1;
    while (i < lines.length) {
      const l2 = lines[i];
      if (l2.trim() === '') break;
      if (l2.match(/^```/) || l2.match(/^#{1,6}\s+/)
        || l2.match(/^>\s?/) || l2.match(/^\s*[-*]\s+/)
        || l2.match(/^\s*\d+\.\s+/)) break;
      buf.push(l2);
      i += 1;
    }
    out.push({ kind: 'paragraph', text: buf.join(' ') });
  }
  return out;
}

// Inline renderer. Emphasis (bold/italic) can span any "atomic" element
// (code spans, wikilinks, markdown/bare links) -- the author writes
// `*see the [[Foo]] post for details*` and expects the whole thing
// italicized. To make that work we tokenize atomics first into opaque
// placeholders, run emphasis on the placeholder-bearing text, then expand
// placeholders back to their React nodes.
//
// Placeholders use \x00..\x00 — a null-byte delimited slot that emphasis
// regexes (which only exclude `*` and `\n`) won't break.
function renderInline(text, ctx) {
  if (typeof text !== 'string' || text === '') return null;
  const { index, onNavigate, keyPrefix = '' } = ctx || {};

  // ── Tokenize atomics into placeholders ────────────────────────────────
  const atoms = [];
  let tokenized = '';
  let i = 0;
  while (i < text.length) {
    // Code span: `...`
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
    // Wikilink: [[name|display]]
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

  // ── Run emphasis on the tokenized text ────────────────────────────────
  // Captured content is recursively expanded so placeholders inside
  // emphasis resolve to their atoms.
  const emphNodes = formatEmphasis(
    tokenized,
    `${keyPrefix}-`,
    (innerText, innerKey) => expandPlaceholders(innerText, atoms, ctx, innerKey),
  );

  const out = [];
  emphNodes.forEach((en, ei) => {
    if (typeof en === 'string') {
      out.push(...expandPlaceholders(en, atoms, ctx, `${keyPrefix}-e${ei}`));
    } else {
      out.push(en);
    }
  });
  return out;
}

// Expand placeholders in a string back to their atomic React nodes,
// applying URL/link parsing to the surrounding plain text.
function expandPlaceholders(text, atoms, ctx, keyPrefix) {
  if (typeof text !== 'string' || text === '') return [];
  const out = [];
  const re = /\x00(\d+)\x00/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      pushTextWithLinks(text.slice(last, m.index), `${keyPrefix}-t${i}`, ctx, out);
    }
    const atom = atoms[parseInt(m[1], 10)];
    if (atom) out.push(renderAtom(atom, `${keyPrefix}-a${i}`, ctx));
    last = re.lastIndex;
    i += 1;
  }
  if (last < text.length) {
    pushTextWithLinks(text.slice(last), `${keyPrefix}-t${i}`, ctx, out);
  }
  return out;
}

function pushTextWithLinks(text, keyPrefix, ctx, out) {
  const parts = parseLinks(text);
  parts.forEach((lp, lpi) => {
    if (lp.type === 'link') {
      out.push(
        <a
          key={`${keyPrefix}-l${lpi}`}
          href={hrefFor(lp.url)}
          target="_blank" rel="noopener noreferrer"
          style={{
            color: 'var(--link)', textShadow: 'var(--glow)',
            textDecoration: 'none', borderBottom: '1px dashed currentColor',
          }}
        >{lp.text}</a>
      );
    } else {
      out.push(<span key={`${keyPrefix}-s${lpi}`}>{lp.value}</span>);
    }
  });
}

function renderAtom(atom, key, ctx) {
  const { index, refIndex, onNavigate } = ctx || {};
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
    // The name span is untouched (keeps its testid + in-deck click). The
    // [OBS]/[BUN] chips ride alongside it as siblings, resolved against the
    // richer refIndex; onOpen navigates in-deck to the entry's STATE view.
    const ref = resolveRef(refIndex, atom.name);
    return (
      <React.Fragment key={key}>
        <span
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
        <EntryRefChips resolved={ref} onOpen={onNavigate} />
      </React.Fragment>
    );
  }
  return null;
}


// Split text on **bold**, *italic*, ***bold-italic***, and the palace-
// specific `**word *trail***` (bold-around-italic-at-end) pattern. Returns
// a mix of strings and JSX nodes (caller passes strings through link
// parsing).
//
// The passes run in order, each splitting the surviving string segments:
//   1. ***foo*** -> <strong><em>foo</em></strong>
//   2. **word *trail*** -> <strong>word <em>trail</em></strong>   (palace idiom)
//   3. **bold** (relaxed: single `*` allowed inside, e.g. `**.git/*.lock**`)
//   4. *italic* (open/close asterisks adjacent to non-whitespace)
//
// Unmatched single asterisks pass through as literal characters -- the
// palace uses `*` as glyph (a glob, a multiplication symbol, a footnote).
function formatEmphasis(text, keyPrefix, renderChildren) {
  let nodes = [text];
  let counter = 0;
  // Default: emit captured content as a plain string node. The caller
  // (renderInline) overrides this with renderWikilinksAndLinks so wikilinks
  // inside bold/italic still resolve.
  const renderInner = typeof renderChildren === 'function'
    ? renderChildren
    : (inner) => inner;

  // Pass 1: ***foo*** -> bold+italic.
  nodes = splitStringsByPattern(nodes, /\*\*\*([^*\n]+?)\*\*\*/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-bi${counter}`;
    return (
      <strong key={k} style={{
        color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
      }}>
        <em style={{ fontStyle: 'italic' }}>{renderInner(match, `${k}-c`)}</em>
      </strong>
    );
  });

  // Pass 2: **head *tail*** -> bold(head)+italic(tail). Palace idiom.
  nodes = splitStringsByPattern(nodes, /\*\*([^*\n]*?)\*([^*\n]+?)\*\*\*/g, (_g1, _i, _full, groups) => {
    counter += 1;
    const head = groups[0];
    const tail = groups[1];
    const k = `${keyPrefix}-bbi${counter}`;
    return (
      <strong key={k} style={{
        color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
      }}>
        {renderInner(head, `${k}-h`)}
        <em style={{ fontStyle: 'italic' }}>{renderInner(tail, `${k}-t`)}</em>
      </strong>
    );
  });

  // Pass 3: **bold** with single `*` allowed inside (e.g. `**.git/*.lock**`).
  nodes = splitStringsByPattern(nodes, /\*\*((?:[^*\n]|\*(?!\*))+?)\*\*/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-b${counter}`;
    return (
      <strong key={k} style={{
        color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
      }}>{renderInner(match, `${k}-c`)}</strong>
    );
  });

  // Pass 4: *italic*. Open/close asterisks must be adjacent to non-whitespace
  // and not part of `**`. Unmatched single `*` pass through literally.
  nodes = splitStringsByPattern(nodes, /(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, (match) => {
    counter += 1;
    const k = `${keyPrefix}-i${counter}`;
    return (
      <em key={k} style={{
        color: 'var(--phosphor-bright, var(--phosphor))', fontStyle: 'italic',
      }}>{renderInner(match, `${k}-c`)}</em>
    );
  });

  return nodes;
}

// Walk an array of (string | node) and split each string by the pattern,
// invoking nodeFor(captureGroup1, index, fullMatch, allGroups) to build a
// replacement node for each hit. Non-string elements pass through.
function splitStringsByPattern(items, pattern, nodeFor) {
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
      if (pattern.lastIndex === m.index) pattern.lastIndex += 1; // safety
    }
    if (last < item.length) out.push(item.slice(last));
  }
  return out;
}

// (legacy helper kept for any external import — unused now)
function splitOnPattern(text, pattern, nodeFor) {
  return splitStringsByPattern([text], pattern, (g, i, _full) => nodeFor(g, i));
}

function renderBlock(block, ctx, key) {
  switch (block.kind) {
    case 'heading': {
      const fs = [28, 24, 20, 17, 15, 13][block.level - 1] ?? 13;
      return (
        <div
          key={key}
          data-testid={`heading-h${block.level}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: fs,
            color: 'var(--phosphor-white)', textShadow: 'var(--glow-strong)',
            textTransform: 'uppercase', letterSpacing: '.02em',
            margin: block.level === 1 ? '24px 0 8px' : '18px 0 6px',
          }}
        >
          {renderInline(block.text, { ...ctx, keyPrefix: `${key}-` })}
        </div>
      );
    }
    case 'code':
      // `mermaid` fences render as phosphor-themed SVG (lazy-loaded).
      // Other code fences stay as the dim <pre> register.
      if (block.lang === 'mermaid') {
        return <MermaidBlock key={key} source={block.text} />;
      }
      return (
        <pre
          key={key}
          data-testid="code-block"
          data-lang={block.lang}
          style={{
            border: '1px solid var(--phosphor-dim)',
            background: 'var(--phosphor-deep)',
            color: 'var(--phosphor-bright)', textShadow: 'var(--glow)',
            padding: '8px 12px', margin: '12px 0',
            overflowX: 'auto', fontSize: 12, lineHeight: 1.4,
            maxWidth: '100%',
          }}
        >
          <code>{block.text}</code>
        </pre>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          key={key}
          data-testid={block.ordered ? 'list-ol' : 'list-ul'}
          style={{ margin: '8px 0 12px', paddingLeft: 22, maxWidth: '78ch' }}
        >
          {block.items.map((it, j) => (
            <li
              key={`${key}-i${j}`}
              style={{ marginBottom: 4, color: 'var(--phosphor)', textShadow: 'var(--glow)' }}
            >
              {renderInline(it, { ...ctx, keyPrefix: `${key}-i${j}-` })}
            </li>
          ))}
        </Tag>
      );
    }
    case 'quote':
      return (
        <blockquote
          key={key}
          data-testid="blockquote"
          style={{
            borderLeft: '3px double var(--phosphor-dim)',
            margin: '10px 0', padding: '4px 12px',
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontStyle: 'italic', maxWidth: '78ch',
          }}
        >
          {renderInline(block.text, { ...ctx, keyPrefix: `${key}-` })}
        </blockquote>
      );
    case 'paragraph':
      return (
        <p key={key} style={{
          margin: '0 0 12px', maxWidth: '78ch',
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
          lineHeight: 1.5,
        }}>
          {renderInline(block.text, { ...ctx, keyPrefix: `${key}-` })}
        </p>
      );
    case 'blank':
      return null;
    default:
      return null;
  }
}

export default function EntryBody({ body, index, refIndex, onNavigate }) {
  if (typeof body !== 'string' || body.trim() === '') {
    return (
      <div data-testid="entry-body" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
        (no body)
      </div>
    );
  }
  const clean = stripHtmlComments(body);
  const blocksList = blocks(clean);
  const ctx = { index, refIndex, onNavigate };
  return (
    <div data-testid="entry-body">
      {blocksList.map((b, j) => renderBlock(b, ctx, `b${j}`))}
    </div>
  );
}
