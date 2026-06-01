import React from 'react';
import { parseLinks, hrefFor } from '../../lib/format.js';
import MermaidBlock from './MermaidBlock.jsx';

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

// Inline renderer. Walks the text and emits React nodes for wikilinks,
// markdown links, code spans, bold, italic. Order matters: code spans
// first (they swallow other syntax), then wikilinks, then bold/italic,
// then links/URLs via parseLinks.
function renderInline(text, { index, onNavigate, keyPrefix = '' }) {
  if (typeof text !== 'string' || text === '') return null;

  // Step 1: split on code spans.
  const spanRe = /`([^`\n]+)`/g;
  const codeParts = [];
  let lastIdx = 0;
  let m;
  while ((m = spanRe.exec(text)) !== null) {
    if (m.index > lastIdx) codeParts.push({ kind: 'text', value: text.slice(lastIdx, m.index) });
    codeParts.push({ kind: 'code', value: m[1] });
    lastIdx = spanRe.lastIndex;
  }
  if (lastIdx < text.length) codeParts.push({ kind: 'text', value: text.slice(lastIdx) });

  const nodes = [];
  codeParts.forEach((p, ci) => {
    if (p.kind === 'code') {
      nodes.push(
        <code key={`${keyPrefix}c${ci}`} style={{
          background: 'var(--phosphor-deep)',
          color: 'var(--phosphor-bright)',
          textShadow: 'var(--glow)',
          padding: '0 4px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.95em',
        }}>{p.value}</code>
      );
      return;
    }
    // Step 2: wikilinks.
    const wlRe = /\[\[([^\]\n]+?)\]\]/g;
    const subParts = [];
    let li = 0;
    let wm;
    while ((wm = wlRe.exec(p.value)) !== null) {
      if (wm.index > li) subParts.push({ kind: 'mdtext', value: p.value.slice(li, wm.index) });
      const inside = wm[1].trim();
      const pipe = inside.indexOf('|');
      const name = pipe === -1 ? inside : inside.slice(0, pipe).trim();
      const display = pipe === -1 ? name : inside.slice(pipe + 1).trim();
      subParts.push({ kind: 'wikilink', name, display });
      li = wlRe.lastIndex;
    }
    if (li < p.value.length) subParts.push({ kind: 'mdtext', value: p.value.slice(li) });

    subParts.forEach((sp, si) => {
      if (sp.kind === 'wikilink') {
        const resolved = index?.get?.(sp.name) ?? null;
        const known = resolved !== null;
        nodes.push(
          <span
            key={`${keyPrefix}c${ci}-w${si}`}
            data-testid="body-wikilink"
            data-resolved={known ? 'true' : 'false'}
            onClick={() => { if (known && onNavigate) onNavigate(resolved); }}
            style={{
              color: known ? 'var(--link)' : 'var(--phosphor-dim)',
              textShadow: known ? 'var(--glow)' : 'none',
              cursor: known && onNavigate ? 'pointer' : 'default',
              borderBottom: known ? '1px dashed currentColor' : '1px dotted currentColor',
            }}
            title={known ? sp.name : `${sp.name} (unresolved)`}
          >{sp.display}</span>
        );
      } else {
        // Step 3: bold/italic on plain text, then link parsing.
        const value = sp.value;
        // Bold first (**...**) so it doesn't get eaten by italic.
        const formatted = formatEmphasis(value, `${keyPrefix}c${ci}-s${si}`);
        formatted.forEach((node, fi) => {
          if (typeof node === 'string') {
            // Final pass: markdown/bare URLs become <a>.
            const linkParts = parseLinks(node);
            linkParts.forEach((lp, lpi) => {
              if (lp.type === 'link') {
                nodes.push(
                  <a
                    key={`${keyPrefix}c${ci}-s${si}-f${fi}-l${lpi}`}
                    href={hrefFor(lp.url)}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      color: 'var(--link)', textShadow: 'var(--glow)',
                      textDecoration: 'none', borderBottom: '1px dashed currentColor',
                    }}
                  >{lp.text}</a>
                );
              } else {
                nodes.push(<span key={`${keyPrefix}c${ci}-s${si}-f${fi}-t${lpi}`}>{lp.value}</span>);
              }
            });
          } else {
            nodes.push(node);
          }
        });
      }
    });
  });
  return nodes;
}

// Split text on **bold** and *italic*. Returns a mix of strings and JSX
// nodes (caller passes strings through link parsing).
function formatEmphasis(text, keyPrefix) {
  const out = [];
  let rest = text;
  // **bold**
  const boldRe = /\*\*([^*\n]+?)\*\*/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = boldRe.exec(rest)) !== null) {
    if (m.index > last) out.push(rest.slice(last, m.index));
    out.push(
      <strong key={`${keyPrefix}-b${i}`} style={{
        color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
      }}>{m[1]}</strong>
    );
    last = boldRe.lastIndex;
    i += 1;
  }
  if (last < rest.length) out.push(rest.slice(last));
  return out;
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

export default function EntryBody({ body, index, onNavigate }) {
  if (typeof body !== 'string' || body.trim() === '') {
    return (
      <div data-testid="entry-body" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
        (no body)
      </div>
    );
  }
  const clean = stripHtmlComments(body);
  const blocksList = blocks(clean);
  const ctx = { index, onNavigate };
  return (
    <div data-testid="entry-body">
      {blocksList.map((b, j) => renderBlock(b, ctx, `b${j}`))}
    </div>
  );
}
