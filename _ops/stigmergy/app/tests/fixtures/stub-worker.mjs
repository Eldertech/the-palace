#!/usr/bin/env node
// Harmless stub worker for actuator tests. Stands in for a real `claude -p`
// fire so the build/test path NEVER spawns a real autonomous agent.
//
// It MUST be invoked with `--permission-mode bypassPermissions` in its argv so
// the actuator's ps-liveness check (which greps for that signature) recognizes
// it as "our worker" -- exactly the scar being tested. Flags:
//   --sleep <ms>   how long to stay alive before exiting (default 250)
//   --emit <mode>  none | success | fail  (writes a log marker, default none)

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
}

const sleepMs = parseInt(flag('--sleep', '250'), 10);
const emit = flag('--emit', 'none');

if (emit === 'success') {
  process.stdout.write('-> reload http://localhost:5173\n');
} else if (emit === 'fail') {
  process.stdout.write('API Error: stub failure (simulated)\n');
}

setTimeout(() => process.exit(emit === 'fail' ? 1 : 0), Number.isFinite(sleepMs) ? sleepMs : 250);
