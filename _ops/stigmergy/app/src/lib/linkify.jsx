import React from 'react';
import { parseLinks, hrefFor } from './format.js';

// Linkify — render a string with markdown links [text](url) and bare URLs as
// <a> tags, in the BBS link register (cyan, glow, underline).
//
// One shared copy. This is the "Phase 6 convergence" the TricksterCard /
// TricksterInbox comments promised: the two surfaces each carried a byte-
// identical local copy; TricksterInbox is retired and TricksterCard now imports
// this. MessageList keeps its own copy for now (independent lineage) — fold it
// in here if it ever diverges.
export default function Linkify({ text }) {
  const parts = parseLinks(text);
  return parts.map((p, i) =>
    p.type === 'text'
      ? <React.Fragment key={i}>{p.value}</React.Fragment>
      : (
        <a
          key={i}
          href={hrefFor(p.url)}
          style={{
            color: 'var(--ansi-bright-cyan)',
            textShadow: 'var(--glow)',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {p.text}
        </a>
      )
  );
}
