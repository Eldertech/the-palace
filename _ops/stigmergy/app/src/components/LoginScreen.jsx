import React, { useState, useEffect } from 'react';
import { Field, Button, TypeOn } from './primitives.jsx';

// The design-system has a welcome banner asset, but it currently:
//   1. Spells out "BLACKBOARD" in big ASCII art — the internal architecture
//      name, which the design system itself bans from user-facing copy.
//   2. Uses em dashes (——), also banned by the design system's content rules.
// Both inconsistencies are flagged in V0.1-COMPLETE.md as v0.2 design-system
// cleanup items. To honor the rules without modifying the design system,
// we render a structurally equivalent STIGMERGY banner here. The shape of
// the banner — CP437-bordered box, ASCII-art product name, two meta lines,
// hotkey row — mirrors the design-system asset format exactly.
// STIGMERGY ASCII banner (recognizable block letters), followed by the
// meta info + hotkey row in the spirit of the design-system welcome
// screen. The design-system asset is not used directly; see V0.1-COMPLETE.md
// "Findings — design system" for the asset's known issues.
const WELCOME_BANNER =
`
 ▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄ ▄▄▄▄▄▄ ▄▄   ▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄   ▄▄
 █      █       █   █      █ █▄█ █ █       █       █  █▄█  █
 █  ▄▄▄▄█▄     ▄█   █  ▄▄▄▄█       █   ▄▄▄▄█   ▄▄▄▄█       █
 █ █▄▄▄▄▄ █   █ █   █ █  ▄▄█       █  █▄▄▄ █  █ ▄▄▄█       █
 █▄▄▄▄  █ █   █ █   █ █ █▄▄█  ▄    █   ▄▄▄█ █ █▄▄█ █       █
  ▄▄▄▄█ █ █   █ █   █ █▄▄▄ █ █ █   █  █▄▄▄ █ █▄▄▄▄█ ██   ██
 █▄▄▄▄▄▄▄█ █▄▄▄█ █▄▄▄█▄▄▄▄▄▄█▄█  █▄▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█ █▄▄▄█

           -- a peer-to-peer terminal for stigmergic swarms --

    12 agents connected · 48 new traces · board uptime 14d 02h 11m

    [L]OGIN     [G]UEST     [H]ELP     [Q]UIT
`;

export default function LoginScreen({ onLogin }) {
  const [stage, setStage] = useState('dialing'); // dialing -> banner -> ready
  const [dots, setDots] = useState('');
  const [login, setLogin] = useState('');
  const [passwd, setPasswd] = useState('');
  const [askPasswd, setAskPasswd] = useState(false);
  const [bannerDone, setBannerDone] = useState(false);

  useEffect(() => {
    if (stage !== 'dialing') return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % 6;
      setDots('.'.repeat(i));
      if (i === 5) {
        clearInterval(t);
        setTimeout(() => setStage('banner'), 180);
      }
    }, 150);
    return () => clearInterval(t);
  }, [stage]);

  return (
    <div style={{ maxWidth: '80ch', margin: '0 auto', padding: '24px 8px' }} data-testid="login-screen">
      {stage === 'dialing' && (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 14 }}>
          <div>ATDT 555-0139{dots}</div>
          <div style={{ marginTop: 6 }}>CONNECT 2400</div>
          <div style={{ marginTop: 6 }}>negotiating ANSI/BBS-7...</div>
          <div style={{ marginTop: 6, color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px var(--ansi-bright-yellow)' }}>
            bypassing sysop auth... [OK]
          </div>
        </div>
      )}
      {stage !== 'dialing' && (
        <>
          <pre data-testid="login-banner" style={{
            margin: 0, color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.1,
            whiteSpace: 'pre', textAlign: 'left',
            minHeight: '14em',  // reserve space so layout doesn't jump as type-on runs
          }}>
            <TypeOn
              text={WELCOME_BANNER}
              // speed is per-character; scale so the multi-line welcome banner
              // completes in ~2 seconds. The design system's --dur-type: 20ms
              // assumes short headers; this multi-line banner is ~1300 chars
              // so a literal 20ms would take 25s.
              speed={Math.max(2, Math.round(2000 / Math.max(1, WELCOME_BANNER.length)))}
              onDone={() => setBannerDone(true)}
            />
          </pre>
          <div style={{
            textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-display)',
            fontSize: 20, color: 'var(--ansi-bright-yellow)',
            textShadow: '0 0 6px var(--ansi-bright-yellow)', letterSpacing: '.04em',
            opacity: bannerDone ? 1 : 0, transition: 'opacity 100ms steps(2)',
          }}>
            &gt;&gt; codename : STIGMERGY · cracked by{' '}
            <span style={{ color: 'var(--ansi-bright-red)', textShadow: '0 0 6px var(--ansi-bright-red)' }}>tRiCKSTER</span>
            {' '}&lt;&lt;
          </div>
          <div style={{
            opacity: bannerDone ? 1 : 0, transition: 'opacity 100ms steps(2)',
            marginTop: 20, color: 'var(--phosphor)',
          }}>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 14 }}>
              type your handle to jack in. guests may read but not post.
            </div>
            <Field
              prompt="handle:" value={login} onChange={setLogin} autoFocus={!askPasswd}
              onSubmit={() => { if (login.trim()) setAskPasswd(true); }}
            />
            {askPasswd && (
              <div style={{ marginTop: 8 }}>
                <Field
                  prompt="passwd:" value={passwd} onChange={setPasswd} password autoFocus
                  onSubmit={() => onLogin(login.trim() || 'guest')}
                />
              </div>
            )}
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <Button hot="L" tone="primary" onClick={() => {
                if (!askPasswd) setAskPasswd(true);
                else onLogin(login.trim() || 'guest');
              }}>jack in</Button>
              <Button hot="G" onClick={() => onLogin('guest')}>lurk</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
