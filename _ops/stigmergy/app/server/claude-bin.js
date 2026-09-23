// Which `claude` binary the lanes spawn.
//
// Resolution order (2026-09-23):
//   1. $CLAUDE_BIN — an explicit override (the heartbeat wrapper honours the same var).
//   2. ~/.local/bin/claude when it exists and is executable — the palace's pinned CLI
//      location: the heartbeat wrapper already puts that dir first on launchd's PATH,
//      and a shim there is how the Mac runs a newer CLI than Homebrew's when
//      `brew upgrade claude-code` is blocked (see _ops/heartbeat/README.md).
//   3. bare `claude` — whatever the server process's PATH resolves.
// The actuator's ps-liveness signature keys on the flag combination, not argv[0],
// so a wrapper path here does not break liveness detection.
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveClaudeBin(env = process.env) {
  if (env.CLAUDE_BIN) return env.CLAUDE_BIN;
  const pinned = join(env.HOME || homedir(), '.local', 'bin', 'claude');
  try { accessSync(pinned, constants.X_OK); return pinned; } catch { /* not pinned */ }
  return 'claude';
}
