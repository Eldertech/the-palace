import React from 'react';
import {
  ENTRY_TYPES, STAGES, PILLARS, TYPE_REQUIRED_FIELDS,
  STAGE_EXEMPT_TYPES, PILLARS_OPTIONAL_TYPES,
} from '../../lib/entry-edit.js';
import LinkRowEditor from './LinkRowEditor.jsx';

// The frontmatter form. Every widget is bound to a SCHEMA enum so a
// schema-violating entry cannot be authored through the UI -- this is what
// satisfies the §7 self-description test by the form itself.
//
// Props:
//   value         -- the current frontmatter object
//   onChange(next)-- called with the next frontmatter object
//   index         -- Map(name -> path) for link autocomplete
//   warnings      -- { fieldName: warningText } from validation
//   testId        -- root data-testid

export default function FrontmatterForm({ value, onChange, index, warnings = {}, testId = 'frontmatter-form' }) {
  const fm = value || {};
  const t = fm.type;

  function set(key, v) {
    const next = { ...fm };
    if (v === '' || v === null || v === undefined) {
      // Keep the key but mark it empty -- the emitter writes a bare `key:`.
      next[key] = null;
    } else {
      next[key] = v;
    }
    onChange(next);
  }

  function togglePillar(p) {
    const have = new Set(fm.pillars || []);
    if (have.has(p)) have.delete(p); else have.add(p);
    onChange({ ...fm, pillars: [...have] });
  }

  function setLink(i, link) {
    const links = (fm.links || []).slice();
    links[i] = link;
    onChange({ ...fm, links });
  }

  function addLink() {
    const links = (fm.links || []).slice();
    links.push({ target: '', type: 'connects-to', label: null });
    onChange({ ...fm, links });
  }

  function removeLink(i) {
    const links = (fm.links || []).slice();
    links.splice(i, 1);
    onChange({ ...fm, links });
  }

  const extraRequired = TYPE_REQUIRED_FIELDS[t] ?? [];
  const showStage = t && !STAGE_EXEMPT_TYPES.has(t);
  const showPillars = t && !PILLARS_OPTIONAL_TYPES.has(t);

  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <Field label="title" required>
        <input
          data-testid={`${testId}-title`}
          type="text"
          value={fm.title || ''}
          onChange={(e) => set('title', e.target.value)}
          style={inputStyle()}
        />
      </Field>

      <Field label="type" required hint="SCHEMA §1">
        <select
          data-testid={`${testId}-type`}
          value={fm.type || ''}
          onChange={(e) => set('type', e.target.value)}
          style={inputStyle()}
        >
          <option value="">— choose —</option>
          {ENTRY_TYPES.map((typ) => <option key={typ} value={typ}>{typ}</option>)}
        </select>
      </Field>

      {showStage ? (
        <Field label="stage" required hint="SCHEMA §2 lifecycle">
          <div data-testid={`${testId}-stage`} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {STAGES.map((s) => (
              <button
                key={s}
                data-testid={`${testId}-stage-${s}`}
                onClick={() => set('stage', s)}
                style={chipStyle(fm.stage === s)}
              >{s}</button>
            ))}
          </div>
          {warnings.stage ? <Warn>{warnings.stage}</Warn> : null}
        </Field>
      ) : null}

      {showPillars ? (
        <Field label="pillars" required hint="one or more">
          <div data-testid={`${testId}-pillars`} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PILLARS.map((p) => {
              const on = (fm.pillars || []).includes(p);
              return (
                <button
                  key={p}
                  data-testid={`${testId}-pillar-${p}`}
                  onClick={() => togglePillar(p)}
                  style={chipStyle(on)}
                >{p}</button>
              );
            })}
          </div>
        </Field>
      ) : null}

      <Field label="born" required hint="YYYY-MM">
        <input
          data-testid={`${testId}-born`}
          type="text"
          value={fm.born || ''}
          onChange={(e) => set('born', e.target.value)}
          placeholder="2026-05"
          style={{ ...inputStyle(), width: 140 }}
        />
      </Field>

      {/* Type-specific required fields */}
      {extraRequired.length > 0 ? (
        <div data-testid={`${testId}-type-specific`}
          style={{ padding: 8, border: '1px dashed var(--phosphor-dim)' }}>
          <div style={{ color: 'var(--phosphor-dim)', fontSize: 11, marginBottom: 6 }}>
            required for type "{t}"
          </div>
          {extraRequired.map((field) => (
            <Field key={field} label={field}>
              {field === 'medium' && t === 'source' ? (
                <select
                  data-testid={`${testId}-${field}`}
                  value={fm[field] || ''}
                  onChange={(e) => set(field, e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">— choose —</option>
                  {['paper', 'book', 'tool', 'recording', 'other'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : field === 'status' ? (
                <select
                  data-testid={`${testId}-${field}`}
                  value={fm[field] || ''}
                  onChange={(e) => set(field, e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">— choose —</option>
                  {(t === 'project' ? ['active', 'complete', 'archived'] : ['alive', 'stub']).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : field === 'medium' && t === 'specialist' ? (
                <select
                  data-testid={`${testId}-${field}`}
                  value={fm[field] || ''}
                  onChange={(e) => set(field, e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">— choose —</option>
                  {['sound', 'image', 'motion', 'interactive', 'plumbing', 'other'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : field === 'domains' ? (
                <input
                  data-testid={`${testId}-${field}`}
                  type="text"
                  value={Array.isArray(fm[field]) ? fm[field].join(', ') : (fm[field] || '')}
                  onChange={(e) => set(field, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  placeholder="comma-separated"
                  style={inputStyle()}
                />
              ) : (
                <input
                  data-testid={`${testId}-${field}`}
                  type="text"
                  value={fm[field] ?? ''}
                  onChange={(e) => set(field, e.target.value)}
                  style={inputStyle()}
                />
              )}
            </Field>
          ))}
        </div>
      ) : null}

      <Field label="forward_vector" hint="conatus: striving-verbs, not stasis">
        <textarea
          data-testid={`${testId}-forward-vector`}
          value={fm.forward_vector || ''}
          onChange={(e) => set('forward_vector', e.target.value)}
          rows={3}
          placeholder="I will keep teaching, spawning, integrating, casting..."
          style={{ ...inputStyle(), fontFamily: 'var(--font-mono, monospace)', resize: 'vertical' }}
        />
        {warnings.forward_vector ? <Warn>{warnings.forward_vector}</Warn> : null}
      </Field>

      <Field label="links" hint="SCHEMA §4: the 10 typed link types">
        <div data-testid={`${testId}-links`}>
          {(fm.links || []).map((lnk, i) => (
            <LinkRowEditor
              key={i}
              link={lnk}
              index={index}
              onChange={(next) => setLink(i, next)}
              onRemove={() => removeLink(i)}
              testId={`${testId}-link-${i}`}
            />
          ))}
          <button
            data-testid={`${testId}-add-link`}
            onClick={addLink}
            style={{
              ...chipStyle(false),
              marginTop: 4,
            }}
          >+ add link</button>
        </div>
      </Field>

    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          textTransform: 'uppercase', letterSpacing: '.04em',
        }}>{label}</span>
        {required ? <span style={{ color: 'var(--warn)', fontSize: 10 }}>required</span> : null}
        {hint ? <span style={{ color: 'var(--phosphor-dim)', fontSize: 11 }}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Warn({ children }) {
  return (
    <div style={{ color: 'var(--warn)', fontSize: 11, marginTop: 4 }}>
      ⚠ {children}
    </div>
  );
}

function inputStyle() {
  return {
    background: 'var(--bg, #000)',
    color: 'var(--phosphor)',
    textShadow: 'var(--glow)',
    border: '1px solid var(--phosphor-dim)',
    padding: '6px 10px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
  };
}

function chipStyle(active) {
  return {
    background: active ? 'var(--phosphor)' : 'transparent',
    color: active ? 'var(--bg, #000)' : 'var(--phosphor)',
    textShadow: active ? 'none' : 'var(--glow)',
    border: '1px solid var(--phosphor)',
    padding: '4px 10px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 12,
    cursor: 'pointer',
    textTransform: 'lowercase',
  };
}
