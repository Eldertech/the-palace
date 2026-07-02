/* Session Artifact · components.
   Loaded as a Babel-transpiled module. Components are written to window so
   App.jsx can use them. Style-object names are uniquely prefixed (sa*) per
   project conventions; most components rely on styles.css class names. */

function SessionHeader({ stageLabel, title, titleEm, subtitle, meta }) {
  return (
    <header className="session-header">
      {stageLabel && <div className="stage-label">{stageLabel}</div>}
      <h1>{title} {titleEm && <em>{titleEm}</em>}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {meta && <div className="meta">{meta}</div>}
    </header>
  );
}

function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

function Pillquote({ children }) {
  return <div className="pillquote">{children}</div>;
}

function EscherSplit({ canvas, identity, beats }) {
  return (
    <div className="escher-split">
      <div className="escher-canvas">{canvas}</div>
      <div className="escher-text">
        {identity && <div className="identity">{identity}</div>}
        {(beats || []).map((b, i) => (
          <div className="beat" key={i}>
            <div className="beat-title">{b.title}</div>
            <p>{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CanvasWrap({ children, caption }) {
  return (
    <div className="canvas-wrap">
      {children}
      {caption && <div className="canvas-caption">{caption}</div>}
    </div>
  );
}

function ParamTag({ children }) {
  return <span className="param-tag">{children}</span>;
}

function BuildStep({ n, title, detail, params }) {
  return (
    <div className="step-card">
      <div className="step-num">{n}</div>
      <div>
        <div className="step-title">{title}</div>
        <p className="step-detail">{detail}</p>
        {params && params.length > 0 && (
          <div className="step-params">
            {params.map((p, i) => <ParamTag key={i}>{p}</ParamTag>)}
          </div>
        )}
      </div>
    </div>
  );
}

function BuildSteps({ steps }) {
  return (
    <div className="build-steps">
      {steps.map((s, i) => <BuildStep key={i} n={i + 1} {...s} />)}
    </div>
  );
}

function TuningCard({ title, value, note }) {
  return (
    <div className="tuning-card">
      <div className="tuning-title">{title}</div>
      <div className="tuning-value">{value}</div>
      <div className="tuning-note">{note}</div>
    </div>
  );
}

function TuningGrid({ items }) {
  return (
    <div className="tuning-grid">
      {items.map((it, i) => <TuningCard key={i} {...it} />)}
    </div>
  );
}

function CalloutQuote({ children }) {
  return <div className="callout-quote">{children}</div>;
}

function CalloutChange({ label, children }) {
  return (
    <div className="callout-change">
      {label && <strong>{label} · </strong>}{children}
    </div>
  );
}

function SessionFooter({ left, right }) {
  return (
    <div className="session-footer">
      <span className="sig-mono">{left}{right ? <> <em>·</em> {right}</> : null}</span>
      <span className="wordmark">LOUD’N <span className="accent">LIVE</span></span>
    </div>
  );
}

Object.assign(window, {
  SessionHeader, SectionLabel, Pillquote, EscherSplit,
  CanvasWrap, ParamTag, BuildStep, BuildSteps,
  TuningCard, TuningGrid, CalloutQuote, CalloutChange, SessionFooter,
});
