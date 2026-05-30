import React from 'react';
import { Banner, Box } from '../primitives.jsx';

// LOG deck placeholder. The full git explorer is v1.0 Phase 2.
// Shown here so the three-deck navigation is honest about what
// already works and what doesn't.

export default function LogDeckStub() {
  return (
    <div data-testid="log-deck-stub">
      <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>
        log -- the git record
      </Banner>
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 12 }}>
        past -- what happened. browseable in v1.0 phase 2.
      </div>
      <Box title="COMING NEXT  --  V1.0 PHASE 2" tone="single">
        <ul style={{ margin: 0, paddingLeft: 22, color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
          <li>commit stream as semantic cards (kind / scope / trailers).</li>
          <li>palace-aware diff: frontmatter as field-level changes.</li>
          <li>filters: per-entry timeline, by kind, by author, by pillar.</li>
          <li>uncommitted-work banner -- the invisible dive made visible.</li>
        </ul>
        <div style={{ marginTop: 10, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12 }}>
          for now, use <code style={{ color: 'var(--phosphor)' }}>git log</code> in a terminal,
          or browse on github.
        </div>
      </Box>
    </div>
  );
}
