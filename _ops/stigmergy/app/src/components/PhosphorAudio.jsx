import React, { useEffect, useRef, useState } from 'react';

// Phosphor-themed audio player.
//
// Replaces the browser's default <audio controls> chrome (white/grey,
// breaks the BBS surface) with a phosphor control strip: a text
// [PLAY]/[PAUSE] button, a phosphor scrubber, a monospace time display,
// and an "open externally" link for the native app handoff. The actual
// <audio> element is hidden and driven programmatically.
//
// Accessibility notes:
//   - Keyboard: spacebar / enter toggles play; left/right arrows seek
//     by 5s when the slider is focused.
//   - The slider has aria-label "playback position"; the play button
//     toggles its aria-pressed.

// showOpenNative: render the "↗ open in native app" chip. Default true (the
// ArtifactSlot path, where src is /api/file?path=<palace-relative> and the
// chip's /api/open resolves a real file). Pass false for statically-served
// assets (e.g. /trickster-assets/...) whose URL is not a palace-relative path
// the open endpoint can resolve — there the chip would be a dead control.
export default function PhosphorAudio({ src, testId = 'phosphor-audio', showOpenNative = true }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return undefined;
    const onLoaded = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : null);
      setReady(true);
    };
    const onTime = () => setCurrentTime(el.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onError = () => setError('could not load audio');
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [src]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => setError('play blocked'));
    } else {
      el.pause();
    }
  }

  function seek(t) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(t, duration || 0));
  }

  function handleKey(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seek(currentTime + 5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seek(currentTime - 5);
    }
  }

  const progress = duration && duration > 0 ? currentTime / duration : 0;
  const total = duration ? formatTime(duration) : '--:--';
  const elapsed = formatTime(currentTime);

  return (
    <div
      data-testid={testId}
      data-playing={playing ? 'true' : 'false'}
      onKeyDown={handleKey}
      style={{
        display: 'grid',
        gridTemplateColumns: showOpenNative ? 'auto 1fr auto auto' : 'auto 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '6px 10px',
        background: 'var(--phosphor-deep)',
        border: '1px solid var(--phosphor-dim)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
      }}
    >
      <button
        data-testid={`${testId}-toggle`}
        onClick={toggle}
        aria-pressed={playing}
        disabled={!ready && !error}
        style={{
          background: 'transparent',
          color: 'var(--phosphor)',
          textShadow: 'var(--glow)',
          border: '1px solid var(--phosphor)',
          padding: '2px 10px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          cursor: ready ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          minWidth: 64,
          opacity: ready ? 1 : 0.5,
        }}
      >
        {error ? 'error' : playing ? '|| pause' : '> play'}
      </button>

      <input
        type="range"
        data-testid={`${testId}-scrubber`}
        min={0}
        max={duration || 1}
        step={0.01}
        value={currentTime}
        onChange={(e) => seek(parseFloat(e.target.value))}
        aria-label="playback position"
        disabled={!ready}
        style={{
          width: '100%',
          accentColor: 'var(--phosphor, #33ff33)',
          cursor: ready ? 'pointer' : 'not-allowed',
        }}
      />

      <div
        data-testid={`${testId}-time`}
        style={{
          color: 'var(--phosphor-dim)',
          textShadow: 'none',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {elapsed} / {total}
      </div>

      {showOpenNative ? (
        <a
          href={`/api/open?path=${encodeURIComponent(extractPath(src))}`}
          title="open in native app"
          data-testid={`${testId}-open-native`}
          onClick={(e) => {
            // Suppress browser navigation: GET /api/open returns 204; we
            // do not want the BBS surface to "go" anywhere.
            e.preventDefault();
            fetch(`/api/open?path=${encodeURIComponent(extractPath(src))}`)
              .catch(() => {});
          }}
          style={{
            color: 'var(--phosphor-dim)',
            textShadow: 'none',
            textDecoration: 'none',
            fontSize: 11,
            padding: '2px 6px',
            border: '1px solid var(--phosphor-dim)',
            cursor: 'pointer',
          }}
        >
          ↗
        </a>
      ) : null}

      {/* The actual audio element, hidden, driven by the controls above. */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </div>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--';
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// `src` for ArtifactSlot is `/api/file?path=<encoded>`. Extract the path
// for the native-open link (which uses /api/open?path=). Falls back to the
// src itself when no `path=` is present.
function extractPath(src) {
  if (typeof src !== 'string') return '';
  const q = src.indexOf('?');
  if (q === -1) return src;
  const params = new URLSearchParams(src.slice(q + 1));
  return params.get('path') || src;
}
