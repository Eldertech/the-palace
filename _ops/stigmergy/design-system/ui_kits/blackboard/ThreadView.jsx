// ThreadView.jsx — expanded trace with replies
function ThreadView({ trace, onReply, onBack, onPost, composing, composeValue, onComposeChange, onComposeSubmit }) {
  return (
    <div style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"var(--phosphor)" }}>
      <Rule double>THREAD · #{trace.id}</Rule>
      <div style={{marginTop:6, marginBottom:10, color:"var(--phosphor-dim)", textShadow:"none"}}>
        &lt;&lt; back to index · subj: <span style={{color:"var(--phosphor)",textShadow:"var(--glow)"}}>{trace.subject}</span>
      </div>

      {/* root post */}
      <Post post={{ author: trace.author, when: trace.when, body: trace.body, attachments: trace.attachments, id: trace.id }} depth={0} root />

      {trace.replies?.map((r, i) => (
        <Post key={i} post={r} depth={r.depth || 1} />
      ))}

      {composing ? (
        <div style={{marginTop:14}}>
          <Rule>reply composer · [enter] sends · [esc] abandons</Rule>
          <div style={{display:"flex", gap:8, alignItems:"flex-start", padding:"6px 0"}}>
            <span style={{color:"var(--phosphor-dim)",textShadow:"none"}}>&gt;</span>
            <textarea
              value={composeValue}
              onChange={e => onComposeChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onComposeSubmit(); }
                if (e.key === "Escape") onReply(false);
              }}
              autoFocus
              placeholder="type your reply, then ctrl-enter to post..."
              style={{
                flex:1, background:"transparent", border:"1px dashed var(--phosphor-dim)",
                color:"var(--phosphor)", textShadow:"var(--glow)",
                fontFamily:"var(--font-mono)", fontSize:14,
                outline:"none", padding:"8px", minHeight:"80px", resize:"vertical",
                caretColor:"var(--phosphor-white)", borderRadius:0,
              }}
            />
          </div>
          <div style={{display:"flex", gap:10}}>
            <Button hot="P" tone="primary" onClick={onComposeSubmit}>post reply</Button>
            <Button hot="X" tone="danger" onClick={() => onReply(false)}>cancel</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Post({ post, depth, root }) {
  const indent = " ".repeat(depth * 2);
  const quote = depth > 0 ? ">".repeat(depth) + " " : "";
  return (
    <div style={{margin:"10px 0", paddingLeft: depth * 18, borderLeft: depth > 0 ? "1px dashed var(--phosphor-dim)" : "none", marginLeft: depth > 0 ? 6 : 0 }}>
      <div style={{display:"flex", gap:12, color:"var(--phosphor-dim)", textShadow:"none", fontSize:12, marginBottom:4}}>
        <span style={{color:"var(--ansi-bright-cyan)", textShadow:"var(--glow)"}}>@{post.author}</span>
        <span>·</span>
        <span>{post.when}</span>
        {root ? <>
          <span>·</span>
          <span>#{post.id}</span>
        </> : null}
      </div>
      <div style={{whiteSpace:"pre-wrap", maxWidth:"78ch"}}>{post.body}</div>
      {post.attachments?.length ? (
        <div style={{marginTop:4, color:"var(--phosphor-dim)",textShadow:"none",fontSize:12}}>
          attached: {post.attachments.map((a,i) => <span key={i}>{i>0?" · ":""}<span style={{color:"var(--ansi-bright-cyan)"}}>{a}</span></span>)}
        </div>
      ) : null}
    </div>
  );
}

window.ThreadView = ThreadView;
