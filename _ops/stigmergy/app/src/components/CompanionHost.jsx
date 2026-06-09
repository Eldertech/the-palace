import React from 'react';
import EntryAgentWindow from './state/EntryAgentWindow.jsx';
import { resolveContext } from '../lib/companion-context.js';

// CompanionHost — the App-level mount for the Companion window (Stage 0).
//
// The window used to be owned by EntryReader, so it only existed on STATE while
// an entry was open. Lifting it here makes the companion a single, persistent
// collaborator available on EVERY deck: the host resolves the grounding context
// from where the user is (the active deck + the current entry selection) and
// hands it to the window. Off → not mounted → the app reads exactly as before.
//
// open/close + the current selection are owned by App (the launcher is global).
// Later stages widen `resolveContext` (LOG commit, TRICKSTER request); the host
// itself does not change.
export default function CompanionHost({ open, deck, entryPath, tricksterRequests, onClose }) {
  if (!open) return null;
  const context = resolveContext({ deck, entryPath, tricksterRequests });
  return <EntryAgentWindow context={context} onClose={onClose} />;
}
