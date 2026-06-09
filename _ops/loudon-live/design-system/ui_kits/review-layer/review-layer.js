/* =====================================================================
 *  Review Layer — drop-in per-moment commenting surface
 *  Palace concept: [[Review Layer]].  One method (DOM-anchored), not the
 *  definition of the layer — for slides / video / image / sound, invent
 *  an anchoring that fits the format (see the entry).
 *
 *  Usage (single-file artifact):
 *    <script src="review-layer.js"></script>   // or paste this whole file
 *    <script>
 *      mountReviewLayer({
 *        project: 'wavetable-scanner',          // names the storage key + export
 *        round: 1,                              // bump each revision pass
 *        review: true,                          // false (or omit) ships clean
 *        moments: [
 *          { id:'concept', label:'Concept & framing', tag:'text',    sel:'.lead' },
 *          { id:'sound',   label:'Overall sound & mix', tag:'sound' },           // panel-only
 *          // GRANULARITY: one moment per natural section — NOT one per slider.
 *        ],
 *      });
 *    </script>
 *
 *  Styling reads Loudon Live design tokens (--accent, --bg, --fg-*, --border,
 *  --mono, --sans…) with safe fallbacks, so it also works outside the system.
 *  Export gives both shapes: JSON keyed per moment (individual responses) and
 *  a markdown digest ("Copy for Claude").
 * ===================================================================== */
(function (global) {
  function injectStyles() {
    if (document.getElementById('rv-styles')) return;
    const css = `
    .rv-pin{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;
      font-family:var(--mono,'JetBrains Mono',monospace);font-size:11px;line-height:1;
      color:var(--fg-3,#8a8a99);background:transparent;border:1px solid var(--border,#4a4a5e);
      border-radius:3px;width:17px;height:17px;margin-left:6px;vertical-align:middle;
      transition:color .12s,border-color .12s;user-select:none}
    .rv-pin:hover{color:var(--accent,#e8b84a);border-color:var(--accent,#e8b84a)}
    .rv-pin.filled{color:var(--bg,#0a0a0f);background:var(--accent,#e8b84a);border-color:var(--accent,#e8b84a)}
    #rv-panel{position:fixed;top:0;right:0;height:100vh;width:326px;z-index:2147483600;
      display:flex;flex-direction:column;
      background:color-mix(in srgb, var(--bg-elev-2,#16161d) 94%, transparent);
      border-left:1px solid var(--border,#4a4a5e);box-shadow:-8px 0 28px rgba(0,0,0,.4);
      transform:translateX(0);transition:transform .22s ease}
    #rv-panel.collapsed{transform:translateX(326px)}
    #rv-panel .rv-head{padding:14px 14px 10px;border-bottom:1px solid var(--border-soft,#2a2a36)}
    #rv-panel .rv-title{font-family:var(--mono,monospace);text-transform:uppercase;
      letter-spacing:.08em;font-size:11px;color:var(--accent,#e8b84a)}
    #rv-panel .rv-sub{font-family:var(--mono,monospace);font-size:10px;color:var(--fg-3,#8a8a99);
      margin-top:4px;letter-spacing:.03em}
    #rv-panel .rv-body{flex:1;overflow-y:auto;padding:6px 12px 12px}
    #rv-panel .rv-row{padding:9px 0 7px;border-bottom:1px solid var(--border-soft,#2a2a36)}
    #rv-panel .rv-row label{display:flex;align-items:baseline;justify-content:space-between;gap:8px;
      font-family:var(--sans,'Manrope',system-ui,sans-serif);font-weight:500;font-size:12.5px;
      color:var(--fg-1,#ececf2);cursor:pointer}
    #rv-panel .rv-row .tag{font-family:var(--mono,monospace);font-size:9px;text-transform:uppercase;
      letter-spacing:.06em;color:var(--fg-3,#8a8a99);border:1px solid var(--border-soft,#2a2a36);
      border-radius:2px;padding:1px 4px;white-space:nowrap}
    #rv-panel textarea{width:100%;margin-top:6px;background:var(--bg,#0a0a0f);color:var(--fg-1,#ececf2);
      border:1px solid var(--border,#4a4a5e);border-radius:var(--r-sm,3px);
      font-family:var(--mono,monospace);font-size:11.5px;line-height:1.45;padding:6px 7px;
      resize:vertical;min-height:0;height:30px;transition:height .12s,border-color .12s;box-sizing:border-box}
    #rv-panel textarea:focus{outline:none;border-color:var(--accent,#e8b84a);height:64px}
    #rv-panel textarea.has{height:56px;border-color:var(--accent,#e8b84a)}
    #rv-panel .rv-foot{padding:10px 12px;border-top:1px solid var(--border-soft,#2a2a36);
      display:flex;flex-wrap:wrap;gap:6px}
    #rv-panel .rv-foot button{font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:.04em;
      text-transform:uppercase;cursor:pointer;border:1px solid var(--border,#4a4a5e);
      background:var(--bg-elev-1,#101017);color:var(--fg-2,#c4c4d0);padding:6px 9px;border-radius:var(--r-sm,3px)}
    #rv-panel .rv-foot button.primary{background:var(--accent,#e8b84a);color:var(--bg,#0a0a0f);
      border-color:var(--accent,#e8b84a);font-weight:500}
    #rv-panel .rv-foot button:hover{border-color:var(--accent,#e8b84a)}
    #rv-tab{position:fixed;top:14px;right:14px;z-index:2147483601;font-family:var(--mono,monospace);
      font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;cursor:pointer;padding:6px 10px;
      border-radius:var(--r-sm,3px);border:1px solid var(--border,#4a4a5e);
      background:var(--bg-elev-1,#101017);color:var(--fg-2,#c4c4d0)}
    #rv-tab:hover{border-color:var(--accent,#e8b84a);color:var(--accent,#e8b84a)}
    #rv-toast{position:fixed;bottom:18px;right:18px;z-index:2147483602;font-family:var(--mono,monospace);
      font-size:11px;background:var(--accent,#e8b84a);color:var(--bg,#0a0a0f);padding:8px 12px;
      border-radius:var(--r-sm,3px);opacity:0;transition:opacity .2s;pointer-events:none}
    #rv-toast.show{opacity:1}`;
    const s = document.createElement('style'); s.id = 'rv-styles'; s.textContent = css;
    document.head.appendChild(s);
  }

  function mountReviewLayer(opts) {
    opts = opts || {};
    if (opts.review === false) return;            // shipped clean — mount nothing
    const project = opts.project || 'artifact';
    const round = opts.round || 1;
    const moments = opts.moments || [];
    const KEY = (opts.storageKey || ('review-' + project)) + '-r' + round;
    if (!moments.length) { console.warn('[review-layer] no moments given'); return; }

    injectStyles();

    let store = {};
    try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
    const count = () => Object.values(store).filter(v => v && v.trim()).length;

    const panel = document.createElement('div'); panel.id = 'rv-panel';
    panel.innerHTML =
      `<div class="rv-head"><div class="rv-title">Review · Round ${round}</div>
         <div class="rv-sub" id="rv-sub"></div></div>
       <div class="rv-body" id="rv-body"></div>
       <div class="rv-foot">
         <button class="primary" id="rv-copy">Copy for Claude</button>
         <button id="rv-json">Download .json</button>
         <button id="rv-md">Download .md</button>
         <button id="rv-hide">Hide</button>
         <button id="rv-clear">Clear all</button>
       </div>`;
    document.body.appendChild(panel);
    const tab = document.createElement('div'); tab.id = 'rv-tab'; tab.textContent = '◇ Review';
    document.body.appendChild(tab);
    const toast = document.createElement('div'); toast.id = 'rv-toast'; document.body.appendChild(toast);
    const body = panel.querySelector('#rv-body'), sub = panel.querySelector('#rv-sub');
    const flash = (m) => { toast.textContent = m; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1400); };
    const refreshSub = () => { sub.textContent = `${count()} of ${moments.length} moments noted`; };

    const areas = {}, pins = {};
    function syncPin(id) { const p = pins[id]; if (!p) return; const has = (store[id] || '').trim(); p.textContent = has ? '◆' : '◇'; p.classList.toggle('filled', !!has); }
    function openTo(id) { panel.classList.remove('collapsed'); const ta = areas[id]; if (ta) { ta.scrollIntoView({ block: 'center' }); ta.focus(); } }

    moments.forEach(m => {
      const row = document.createElement('div'); row.className = 'rv-row';
      row.innerHTML = `<label>${m.label}${m.tag ? `<span class="tag">${m.tag}</span>` : ''}</label>`;
      const ta = document.createElement('textarea'); ta.placeholder = 'note for next round…'; ta.value = store[m.id] || '';
      if (ta.value.trim()) ta.classList.add('has');
      ta.addEventListener('input', () => { store[m.id] = ta.value; ta.classList.toggle('has', !!ta.value.trim()); save(); syncPin(m.id); refreshSub(); });
      row.appendChild(ta); body.appendChild(row); areas[m.id] = ta;

      if (m.sel) {
        const el = document.querySelector(m.sel);
        if (el) {
          const pin = document.createElement('span'); pin.className = 'rv-pin'; pin.title = 'Comment on this'; pin.textContent = '◇';
          pin.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openTo(m.id); });
          el.appendChild(pin); pins[m.id] = pin; syncPin(m.id);
        }
      }
    });

    function buildJSON() {
      return {
        project, round, exported: new Date().toISOString(),
        responses: moments
          .map(m => ({ id: m.id, label: m.label, tag: m.tag || null, note: (store[m.id] || '').trim() }))
          .filter(r => r.note),
      };
    }
    function buildMarkdown() {
      const d = new Date().toISOString().slice(0, 10);
      let md = `# ${project} — Round ${round} review notes\n_${count()} of ${moments.length} moments · ${d}_\n`;
      let any = false;
      moments.forEach(m => { const v = (store[m.id] || '').trim(); if (v) { any = true; md += `\n## ${m.label}\n${v}\n`; } });
      if (!any) md += `\n_(no notes yet)_\n`;
      return md;
    }
    function download(name, text, type) {
      const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
    }

    panel.querySelector('#rv-copy').addEventListener('click', async () => {
      const md = buildMarkdown();
      try { await navigator.clipboard.writeText(md); flash('Copied — paste to Claude'); return; } catch (e) {}
      const t = document.createElement('textarea'); t.value = md; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); flash('Copied — paste to Claude'); } catch (e) { flash('Copy blocked — use Download'); }
      t.remove();
    });
    panel.querySelector('#rv-json').addEventListener('click', () => { download(`${project}-review-r${round}.json`, JSON.stringify(buildJSON(), null, 2), 'application/json'); flash('Downloaded .json'); });
    panel.querySelector('#rv-md').addEventListener('click', () => { download(`${project}-review-r${round}.md`, buildMarkdown(), 'text/markdown'); flash('Downloaded .md'); });
    panel.querySelector('#rv-clear').addEventListener('click', () => {
      if (!confirm('Clear all notes for this round?')) return;
      store = {}; save(); moments.forEach(m => { areas[m.id].value = ''; areas[m.id].classList.remove('has'); syncPin(m.id); }); refreshSub();
    });
    panel.querySelector('#rv-hide').addEventListener('click', () => panel.classList.add('collapsed'));
    tab.addEventListener('click', () => panel.classList.toggle('collapsed'));
    refreshSub();
  }

  global.mountReviewLayer = mountReviewLayer;
})(typeof window !== 'undefined' ? window : this);
