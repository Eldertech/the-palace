#!/usr/bin/env node
// Harmless stub Companion worker for lane/actuator tests. Stands in for a real
// `claude -p` Companion turn so the build/test path NEVER spawns a real agent.
//
// Like the real worker it writes its reply (the {"reply":...} contract) to
// STDOUT — the actuator redirects that to the per-turn transcript the lane reap
// reads. Must be invoked with `--permission-mode bypassPermissions` so the
// actuator's ps-liveness signature check recognizes it (scar #2). Flags:
//   --sleep <ms>   stay alive before exiting (default 250)
//   --reply <text> the reply string to emit (default a canned line)

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
}

const sleepMs = parseInt(flag('--sleep', '250'), 10);
const reply = flag('--reply', 'stub companion reply — discussing the passage.');

process.stdout.write(JSON.stringify({ reply }) + '\n');

setTimeout(() => process.exit(0), Number.isFinite(sleepMs) ? sleepMs : 250);
