// live-tail.js — EventSource adapter with reconnect + exponential backoff.
//
// API:
//   subscribeLive({ target, onMessage, onStateChange }) → closeFn
//
//   target:        'persistent' | { session: id }
//   onMessage:     (parsedMessage) => void   — called per incoming SSE message
//   onStateChange: (state) => void
//     state: 'connecting' | 'connected' | 'reconnecting' | 'offline'
//
//   Returns a function that closes the connection and stops reconnecting.
//
// Reconnect strategy:
//   - Start at 1s, double on each consecutive failure, cap at 30s.
//   - Reset to 1s on a successful open.
//   - Does not reconnect after the caller calls the close function.
//
// Last-Event-ID:
//   Browsers send Last-Event-ID automatically on EventSource reconnect using
//   the same URL. We rely on that native behavior — no manual header injection.
//
// Error handling:
//   - event.data JSON parse failures are logged and skipped; they never throw.

const MIN_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

function urlFor(target) {
  if (target === 'persistent') {
    return '/api/persistent/stream';
  }
  if (target && typeof target === 'object' && target.session) {
    return '/api/sessions/' + encodeURIComponent(target.session) + '/stream';
  }
  throw new Error(`subscribeLive: invalid target ${JSON.stringify(target)}`);
}

export function subscribeLive({ target, onMessage, onStateChange }) {
  let closed = false;
  let es = null;
  let delayMs = MIN_DELAY_MS;
  let retryTimer = null;
  let lastState = null;

  function setState(state) {
    if (state !== lastState) {
      lastState = state;
      onStateChange(state);
    }
  }

  function connect() {
    if (closed) return;

    setState('connecting');
    const url = urlFor(target);
    es = new EventSource(url);

    es.onopen = () => {
      if (closed) {
        es.close();
        return;
      }
      delayMs = MIN_DELAY_MS; // reset backoff on successful open
      setState('connected');
    };

    es.addEventListener('message', (event) => {
      if (closed) return;
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (err) {
        console.warn('[live-tail] JSON parse failed, skipping frame:', err.message, event.data);
        return;
      }
      onMessage(parsed);
    });

    es.onerror = () => {
      if (closed) return;
      es.close();
      es = null;

      setState('reconnecting');
      const delay = delayMs;
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS);

      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (!closed) connect();
      }, delay);
    };
  }

  connect();

  // Return the close function.
  return function close() {
    closed = true;
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (es !== null) {
      es.close();
      es = null;
    }
    setState('offline');
  };
}
