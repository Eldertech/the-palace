/* ────────────────────────────────────────────────────────────────────────
   Loudon Live · Observable Plot house defaults
   ────────────────────────────────────────────────────────────────────────
   Bakes the ACTIVE skin into every Plot.plot() call so analytical charts sit
   inside the locked grammar without re-specifying palette/type per panel.

   Reads tokens at call time via palaceTokens() (palace-tokens.js) — it does
   NOT hold its own copy of the palette, so a colors_and_type.css edit or a
   <html class="skin-*"> change propagates with no edit here. Load order:
     colors_and_type.css → d3 → plot.umd.min.js → palace-tokens.js → this file
   (Plot's UMD externalises d3, so d3 must precede Plot.)

   Usage:
     const fig = palacePlot({
       width: 440, height: 230,
       y: { domain: [0,1], label: "↑ R", grid: true },
       marks: [ Plot.lineY(data, { x:"t", y:"R", stroke: palaceTokens().accent }) ]
     });

   Injects: transparent background (chrome owns the ground), fg-3 text colour,
   the locked mono face (charts want ONE mono face for all numerals), and a
   token-coloured Plot.frame(). Caller still owns data colour (use
   palaceTokens().accent / .accentDim / palaceSeries()) and, if an exact grid
   token is needed, an explicit Plot.gridY({ stroke: palaceTokens().borderSoft }).
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  function palacePlot(spec) {
    if (!global.Plot || typeof global.Plot.plot !== 'function') {
      throw new Error('palacePlot: Observable Plot not loaded (load d3 THEN plot.umd.min.js).');
    }
    if (typeof global.palaceTokens !== 'function') {
      throw new Error('palacePlot: palace-tokens.js must load first (and colors_and_type.css must be linked).');
    }
    const t = global.palaceTokens();
    const marks = [global.Plot.frame({ stroke: t.border }), ...(spec.marks || [])];
    return global.Plot.plot(Object.assign({}, spec, {
      style: Object.assign(
        { background: 'transparent', color: t.fg3, fontFamily: t.mono, fontSize: '10px' },
        spec.style || {}
      ),
      marks: marks
    }));
  }
  global.palacePlot = palacePlot;
})(typeof window !== 'undefined' ? window : this);
