import React, { useEffect, useState } from 'react';
import { Box, Button } from '../primitives.jsx';
import banner from '../../public/banner.txt?raw';
import welcome from '../../public/welcome.md?raw';

// The read view's front door: the design system's cracked-shareware dial-in
// (_ops/stigmergy/design-system/ui_kits/blackboard/LoginScreen.jsx) turned to
// face a visitor. It dials, drops the banner, and speaks the welcome — the
// Seed Jewel, lightly adapted for people (src/public/welcome.md, Loudon's to
// rewrite). No handle, no passwd: guests may read but not post. LURK enters
// the palace (TOPOLOGY, by pillar); GIT is the other door, the whole house.

// Paragraphs, with **bold** kept — the welcome is plain prose.
function prose(text) {
  return text.trim().split(/\n\s*\n/).map((para, i) => (
    <p key={i} style={{ margin: '0 0 1em' }}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (
        part.startsWith('**') && part.endsWith('**')
          ? <b key={j} style={{ color: 'var(--phosphor-white)' }}>{part.slice(2, -2)}</b>
          : <React.Fragment key={j}>{part}</React.Fragment>
      ))}
    </p>
  ));
}

export default function PublicWelcome({ meta, repo, onEnter }) {
  const [stage, setStage] = useState('dialing'); // dialing -> banner
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (stage !== 'dialing') return undefined;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % 6;
      setDots('.'.repeat(i));
      if (i === 5) { clearInterval(t); setTimeout(() => setStage('banner'), 220); }
    }, 170);
    return () => clearInterval(t);
  }, [stage]);

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (stage === 'dialing') { setStage('banner'); return; } // any key skips the dial
      if (e.key === 'Enter' || e.key === 'l' || e.key === 'L') { e.preventDefault(); onEnter(); }
      else if ((e.key === 'g' || e.key === 'G') && repo) window.open(repo, '_blank', 'noopener');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, onEnter, repo]);

  const dim = { color: 'var(--phosphor-dim)', textShadow: 'none' };
  const stats = meta ? [
    `${meta.counts?.entries ?? '?'} entries`,
    meta.counts?.links ? `${meta.counts.links} typed links` : null,
    meta.day ? `snapshot ${meta.day}` : null,
  ].filter(Boolean).join(' · ') : 'reading the board';

  return (
    <div data-testid="public-welcome" style={{ maxWidth: '80ch', margin: '0 auto', padding: '24px 0 40px', width: '100%' }}>
      {stage === 'dialing' ? (
        <div style={{ ...dim, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
          <div>ATDT THE-PALACE{dots}</div>
          <div style={{ marginTop: 6 }}>CONNECT 2400</div>
          <div style={{ marginTop: 6 }}>negotiating ANSI/BBS-7...</div>
          <div style={{ marginTop: 6, color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px var(--ansi-bright-yellow)' }}>
            guest access · read only [OK]
          </div>
        </div>
      ) : (
        <>
          <pre
            aria-label="The Palace"
            style={{
              margin: 0, color: 'var(--phosphor)', textShadow: 'var(--glow)',
              fontFamily: 'var(--font-mono)', lineHeight: 1.05, whiteSpace: 'pre',
              textAlign: 'center', overflow: 'hidden',
              // 77 columns: full size on a desktop, scaled to fit a phone.
              fontSize: 'clamp(4px, 1.7vw, 11px)',
            }}
          >{banner.replace(/\n+$/, '')}</pre>
          <div style={{ ...dim, textAlign: 'center', letterSpacing: '.06em', marginTop: 6, fontSize: 12 }}>
            ═══ the palace · loudon stearns · a read view ═══
          </div>
          <div style={{
            textAlign: 'center', marginTop: 10, fontFamily: 'var(--font-display)', fontSize: 20,
            color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px var(--ansi-bright-yellow)', letterSpacing: '.04em',
          }}>
            &gt;&gt; SYSOP : <span style={{ color: 'var(--ansi-bright-red)', textShadow: '0 0 6px var(--ansi-bright-red)' }}>tRiCKSTER</span> · aka loudon stearns &lt;&lt;
          </div>
          <div style={{ ...dim, textAlign: 'center', marginTop: 4, fontSize: 12, letterSpacing: '.08em' }}>
            ░▒▓ greetz to: acid · ice · fire · the ghosts of 1993 ▓▒░
          </div>

          <div style={{ ...dim, marginTop: 22, fontSize: 12 }}>{stats}</div>
          <div style={{ marginTop: 10 }}>
            <Box title="WELCOME">
              <div data-testid="public-welcome-text" style={{ color: 'var(--phosphor)', fontSize: 14, lineHeight: 1.6 }}>
                {prose(welcome)}
              </div>
            </Box>
          </div>

          <div style={{ ...dim, marginTop: 14, fontSize: 12 }}>
            guests may read but not post. inside: [F] cycles a page's faces · text · rich · scroll.
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button hot="L" tone="primary" onClick={onEnter}>lurk · enter the palace</Button>
            {repo ? <Button hot="G" onClick={() => window.open(repo, '_blank', 'noopener')}>git · the whole house</Button> : null}
          </div>
        </>
      )}
    </div>
  );
}
