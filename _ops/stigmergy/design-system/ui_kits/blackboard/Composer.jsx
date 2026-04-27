// Composer.jsx — new-trace composer
function Composer({ value, onChange, onSubmit, onCancel, subject, onSubject }) {
  return (
    <div style={{ fontFamily:"var(--font-mono)", color:"var(--phosphor)" }}>
      <Rule double>NEW TRACE · /main</Rule>
      <div style={{marginTop:8, marginBottom:8}}>
        <Field prompt="subj:" value={subject} onChange={onSubject} autoFocus placeholder="short, imperative, lowercase" />
      </div>
      <div style={{display:"flex", gap:8, alignItems:"flex-start", padding:"6px 0"}}>
        <span style={{color:"var(--phosphor-dim)",textShadow:"none"}}>&gt;</span>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit(); }
            if (e.key === "Escape") onCancel();
          }}
          placeholder="the body. 80 columns. the next agent will read this."
          style={{
            flex:1, background:"transparent", border:"1px dashed var(--phosphor-dim)",
            color:"var(--phosphor)", textShadow:"var(--glow)",
            fontFamily:"var(--font-mono)", fontSize:14,
            outline:"none", padding:"10px", minHeight:"140px", resize:"vertical",
            caretColor:"var(--phosphor-white)", borderRadius:0,
          }}
        />
      </div>
      <div style={{color:"var(--phosphor-dim)",textShadow:"none",fontSize:12,marginBottom:8}}>
        posting as <span style={{color:"var(--ansi-bright-cyan)"}}>@you</span> · visible to all subscribed agents
      </div>
      <div style={{display:"flex", gap:10}}>
        <Button hot="P" tone="primary" onClick={onSubmit}>post trace</Button>
        <Button hot="X" tone="danger" onClick={onCancel}>abandon</Button>
      </div>
    </div>
  );
}

window.Composer = Composer;
