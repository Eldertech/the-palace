import React, { useRef, useState } from 'react';
import { Button } from '../primitives.jsx';
import PhosphorAudio from '../PhosphorAudio.jsx';
import { t } from '../../lib/lexicon.js';

// AuditionStrip — the inline audio evidence for an ear-check decision.
//
// Native <audio controls> per track (so per-track scrub still works) plus a
// PLAY ALL IN SEQUENCE button that walks them back-to-back for a continuous
// listen — ported from the standalone trickster.html sequencer. Runtime
// sequencing state lives in a ref (the standalone used plain closures) so the
// onended chain never sees stale React state; only the visible button label +
// status line are React state.
export default function AuditionStrip({ title, blurb, tracks }) {
  if (!tracks || tracks.length === 0) return null;
  const containerRef = useRef(null);
  const runRef = useRef({ playing: false, i: 0, current: null });
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState('');
  const n = tracks.length;
  const playLabel = `▶ ${t('trickster.audition.playAll')} ${n} ${t('trickster.audition.inSequence')}`;

  function stop() {
    const r = runRef.current;
    r.playing = false;
    if (r.current) {
      try { r.current.pause(); } catch (e) { /* ignore */ }
      r.current.onended = null;
    }
    setPlaying(false);
    setNow(t('trickster.audition.paused'));
  }

  function playAll() {
    if (runRef.current.playing) { stop(); return; }
    const auds = containerRef.current
      ? [...containerRef.current.querySelectorAll('audio')]
      : [];
    if (auds.length === 0) return;
    const r = runRef.current;
    r.playing = true;
    r.i = 0;
    setPlaying(true);
    const next = () => {
      if (!r.playing) return;
      if (r.i >= auds.length) {
        r.playing = false;
        setPlaying(false);
        setNow(`${t('trickster.audition.done')} ${auds.length}`);
        return;
      }
      const aud = auds[r.i];
      r.current = aud;
      const label = (tracks[r.i] && tracks[r.i].label) || '';
      setNow(`${t('trickster.audition.playing')} ${r.i + 1}/${auds.length} · ${label}`);
      try { aud.currentTime = 0; } catch (e) { /* ignore */ }
      aud.play().catch(() => {});
      aud.onended = () => { r.i += 1; next(); };
    };
    next();
  }

  return (
    <div data-testid="audition-strip" ref={containerRef} style={{
      border: '1px solid var(--phosphor-dim)', padding: '8px 10px', marginBottom: 8,
    }}>
      <div style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 6,
      }}>
        {title ? <b style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{title}</b> : null}
        {blurb ? <> — {blurb}</> : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <Button tone="default" onClick={playAll}>
          {playing ? t('trickster.audition.stop') : playLabel}
        </Button>
        <span data-testid="audition-now" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
        }}>{now || t('trickster.audition.hint')}</span>
      </div>

      {tracks.map((tr, i) => (
        <div
          key={tr.src || i}
          data-testid="audition-row"
          style={{
            display: 'flex', gap: 10, alignItems: 'center', padding: '3px 0',
          }}
        >
          <span style={{
            flex: '0 0 auto', minWidth: 132, maxWidth: 200,
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', marginRight: 6 }}>{tr.tag}</span>
            {tr.label}
          </span>
          {/* Reuse the phosphor-styled player (not the browser's grey default
              chrome). The hidden <audio> it renders is still what the play-all
              sequencer drives via querySelectorAll('audio'); each player's own
              listeners keep its controls in sync as the sequence advances.
              showOpenNative is off — static assets aren't /api/open-resolvable. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <PhosphorAudio src={tr.src} showOpenNative={false} testId={`audition-audio-${i}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
