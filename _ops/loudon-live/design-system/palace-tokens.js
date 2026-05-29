/* ────────────────────────────────────────────────────────────────────────
   Loudon Live · palace-tokens.js — runtime design-token reader
   ────────────────────────────────────────────────────────────────────────
   The ONE bridge between the locked CSS tokens and any JS-driven visual
   (D3, Observable Plot, p5.js). It reads the *active skin's* values straight
   from the CSS custom properties defined in colors_and_type.css, so:

     • changing the <html class="skin-*"> swaps the whole palette, and
     • editing colors_and_type.css propagates to every chart on reload —
       nothing here or in any artifact hardcodes a hex value.

   This is the answer to "the design system may change": JS reads tokens at
   call time, never copies them. The only stale-risk is a hardcoded literal
   in an artifact — so don't write one; call palaceTokens() instead.

   Requires colors_and_type.css to be linked in the document. Exposes:
     palaceTokens(root?) → { bg, bgElev1, bgElev2, border, borderSoft,
                             fg1..fg4, accent, accentDim, info, success,
                             danger, mono, sans, serif, display, pixel,
                             ease, easeOut, series[] }
     palaceSeries(root?) → the derived 3-step ordered categorical ramp
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  // Lighten a hex toward white by amt∈[0,1]. Used to derive the bright end of
  // the ordered series ramp from the skin accent — keeps data colour on-palette
  // without adding a new locked token. (Unordered categorical needs a richer
  // palette; that's a candidate design-system addition, flagged not made.)
  function lighten(hex, amt) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return hex;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const up = v => Math.round(v + (255 - v) * amt).toString(16).padStart(2, '0');
    return '#' + up(r) + up(g) + up(b);
  }

  function palaceTokens(root) {
    const el = root || document.documentElement;
    const cs = getComputedStyle(el);
    const g = k => cs.getPropertyValue(k).trim();
    const accent = g('--accent') || '#e8b84a';
    const accentDim = g('--accent-dim') || '#7a6030';
    return {
      bg: g('--bg'), bgElev1: g('--bg-elev-1'), bgElev2: g('--bg-elev-2'),
      border: g('--border'), borderSoft: g('--border-soft'),
      fg1: g('--fg-1'), fg2: g('--fg-2'), fg3: g('--fg-3'), fg4: g('--fg-4'),
      accent, accentDim,
      info: g('--info') || '#4a8fff', success: g('--success') || '#00ff66', danger: g('--danger') || '#ff2a2a',
      mono: g('--mono') || 'ui-monospace, monospace',
      sans: g('--sans') || 'system-ui, sans-serif',
      serif: g('--serif') || 'Georgia, serif',
      display: g('--display') || 'sans-serif',
      pixel: g('--pixel') || 'monospace',
      ease: g('--ease') || 'cubic-bezier(.4, 0, .2, 1)',
      easeOut: g('--ease-out') || 'cubic-bezier(.2, .9, .2, 1)',
      // ordered ramp: dim → accent → light. Encodes magnitude as brightness.
      series: [accentDim, accent, lighten(accent, 0.38)]
    };
  }

  global.palaceTokens = palaceTokens;
  global.palaceSeries = root => palaceTokens(root).series;
})(typeof window !== 'undefined' ? window : this);
