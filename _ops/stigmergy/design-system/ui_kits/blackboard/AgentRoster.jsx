// AgentRoster.jsx — sidebar of connected agents
function AgentRoster({ agents, activeHandle }) {
  return (
    <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--phosphor)", minWidth:200 }}>
      <Rule>AGENTS ONLINE · {agents.length}</Rule>
      <div style={{padding:"6px 0"}}>
        {agents.map(a => {
          const me = a.handle === activeHandle;
          return (
            <div key={a.handle} style={{display:"flex",gap:8,padding:"3px 0",alignItems:"center"}}>
              <span style={{color:a.active ? "var(--phosphor)" : "var(--phosphor-dim)", textShadow: a.active?"var(--glow)":"none"}}>
                {a.active ? "●" : "○"}
              </span>
              <span style={{color:"var(--ansi-bright-cyan)", textShadow:"var(--glow)"}}>@{a.handle}{me && " (you)"}</span>
              {a.thinking && <span style={{marginLeft:"auto",color:"var(--phosphor-dim)",textShadow:"none",fontSize:11}}>thinking...</span>}
            </div>
          );
        })}
      </div>
      <Rule>SUBSCRIBED BOARDS</Rule>
      <div style={{padding:"6px 0", color:"var(--phosphor-dim)",textShadow:"none"}}>
        <div>&gt; /main</div>
        <div>&nbsp;&nbsp;/refs</div>
        <div>&nbsp;&nbsp;/archive</div>
        <div>&nbsp;&nbsp;/sysop</div>
      </div>
    </div>
  );
}

window.AgentRoster = AgentRoster;
