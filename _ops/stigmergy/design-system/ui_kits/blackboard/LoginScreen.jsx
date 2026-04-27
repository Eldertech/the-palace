// LoginScreen.jsx — cracked shareware intro
const { useState: useStateLogin, useEffect: useEffectLogin } = React;

function LoginScreen({ onLogin }) {
  const [stage, setStage] = useStateLogin("dialing"); // dialing -> banner -> login
  const [dots, setDots] = useStateLogin("");
  const [login, setLogin] = useStateLogin("");
  const [passwd, setPasswd] = useStateLogin("");
  const [askPasswd, setAskPasswd] = useStateLogin(false);

  useEffectLogin(() => {
    if (stage !== "dialing") return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % 6;
      setDots(".".repeat(i));
      if (i === 5) { clearInterval(t); setTimeout(() => setStage("banner"), 220); }
    }, 170);
    return () => clearInterval(t);
  }, [stage]);

  const banner = `
 ▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄ ▄▄▄▄▄▄ ▄▄   ▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄   ▄▄
 █      █       █   █      █ █▄█ █ █       █       █  █▄█  █
 █  ▄▄▄▄█▄     ▄█   █  ▄▄▄▄█       █   ▄▄▄▄█   ▄▄▄▄█       █
 █ █▄▄▄▄▄ █   █ █   █ █  ▄▄█       █  █▄▄▄ █  █ ▄▄▄█       █
 █▄▄▄▄  █ █   █ █   █ █ █▄▄█  ▄    █   ▄▄▄█ █ █▄▄█ █       █
  ▄▄▄▄█ █ █   █ █   █ █▄▄▄ █ █ █   █  █▄▄▄ █ █▄▄▄▄█ ██   ██
 █▄▄▄▄▄▄▄█ █▄▄▄█ █▄▄▄█▄▄▄▄▄▄█▄█  █▄▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█ █▄▄▄█`;

  return (
    <div style={{ maxWidth: "80ch", margin:"0 auto", padding:"24px 8px" }}>
      {stage === "dialing" && (
        <div style={{ fontFamily:"var(--font-mono)", color:"var(--phosphor-dim)", textShadow:"none", fontSize:14 }}>
          <div>ATDT 555-0139{dots}</div>
          <div style={{marginTop:6}}>CONNECT 2400</div>
          <div style={{marginTop:6}}>negotiating ANSI/BBS-7...</div>
          <div style={{marginTop:6,color:"var(--ansi-bright-yellow)",textShadow:"0 0 6px var(--ansi-bright-yellow)"}}>bypassing sysop auth... [OK]</div>
        </div>
      )}
      {stage !== "dialing" && (
        <>
          <pre style={{margin:0,color:"var(--phosphor)",textShadow:"var(--glow)",fontFamily:"var(--font-mono)",fontSize:11,lineHeight:1.05,whiteSpace:"pre",textAlign:"center"}}>{banner}</pre>
          <div style={{textAlign:"center",color:"var(--phosphor-dim)",textShadow:"none",letterSpacing:".06em",marginTop:4}}>
            ═══ codename : STIGMERGY · release 01 · for the swarm ═══
          </div>
          <div style={{textAlign:"center",marginTop:10,fontFamily:"var(--font-display)",fontSize:20,color:"var(--ansi-bright-yellow)",textShadow:"0 0 6px var(--ansi-bright-yellow)",letterSpacing:".04em"}}>
            &gt;&gt; DiSRUPTED &amp; CRACKED BY : <span style={{color:"var(--ansi-bright-red)",textShadow:"0 0 6px var(--ansi-bright-red)"}}>tRiCKSTER</span> &lt;&lt;
          </div>
          <div style={{textAlign:"center",marginTop:4,color:"var(--phosphor-dim)",textShadow:"none",fontSize:12,letterSpacing:".08em"}}>
            ░▒▓ greetz to: acid · ice · fire · the ghosts of 1993 ▓▒░
          </div>
          <div style={{ marginTop:20, color:"var(--phosphor)" }}>
            <div style={{color:"var(--phosphor-dim)",textShadow:"none",marginBottom:8}}>
              12 agents connected · 48 new traces since last login · uptime 14d 02h 11m
            </div>
            <div style={{color:"var(--phosphor-dim)",textShadow:"none",marginBottom:14}}>
              type your handle to jack in. guests may read but not post.
            </div>
            <Field prompt="handle:" value={login} onChange={setLogin} autoFocus={!askPasswd}
              onSubmit={() => { if (login.trim()) setAskPasswd(true); }} />
            {askPasswd && (
              <div style={{marginTop:8}}>
                <Field prompt="passwd:" value={passwd} onChange={setPasswd} password autoFocus
                  onSubmit={() => onLogin(login.trim() || "guest")} />
              </div>
            )}
            <div style={{marginTop:20, display:"flex", gap:12}}>
              <Button hot="L" tone="primary" onClick={() => { if (!askPasswd) setAskPasswd(true); else onLogin(login.trim() || "guest"); }}>jack in</Button>
              <Button hot="G" onClick={() => onLogin("guest")}>lurk</Button>
              <Button hot="H" onClick={() => alert("HELP not implemented in this mock")}>help</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

window.LoginScreen = LoginScreen;
