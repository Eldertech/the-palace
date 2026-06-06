#!/usr/bin/env node
// Stub steward worker. Stands in for a real
//   `claude -p <cycle-prompt> --output-format stream-json --verbose`
// run so the build/test path NEVER spawns a real autonomous agent.
//
// It emits a Claude Code stream-json transcript to STDOUT -- which the steward
// lane redirects to the per-cycle transcript file -- then exits. The
// orchestrator's processCycle parses that transcript exactly as it would a real
// claude run: each line is an `assistant` record whose text carries a fenced
// ```json``` §2.2 message (with NO health block -- processCycle injects it).
//
// MUST be invoked with `--permission-mode bypassPermissions` in its argv so the
// actuator's ps-liveness check (which greps for that signature) recognizes it
// as "our worker" -- exactly the scar the lane relies on.
//
// Flags:
//   --sleep <ms>     stay alive before emitting + exiting (default 0)
//   --from <name>    the emitted message's `from` / page title (default "Stub Steward")
//   --msg-id <id>    the emitted message id (default stub-msg-<ts>-<rand>)
//   --emit <mode>    message | none   (default message)

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : def;
}

const sleepMs = parseInt(flag('--sleep', '0'), 10) || 0;
const from = flag('--from', 'Stub Steward');
const msgId = flag('--msg-id', `stub-msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`);
const emit = flag('--emit', 'message');

function emitTranscript() {
  if (emit === 'none') return;
  // One valid §2.2 BROADCAST to GENERAL. No `health` -- processCycle stamps the
  // Path-2 stub. ISO-8601-with-tz ts (toISOString -> "...Z").
  const message = {
    schema_version: '1.0',
    id: msgId,
    ts: new Date().toISOString(),
    session_id: 'permanent-stewardship-stub',
    from,
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    payload: { subject: 'stub cycle', content: 'stub steward cycle ran; grants consumed by the reaper' },
  };
  const text = `Catch-up: a stub steward cycle ran.\n\n\`\`\`json\n${JSON.stringify(message)}\n\`\`\`\n`;
  const record = {
    type: 'assistant',
    message: { content: [{ type: 'text', text }], usage: { input_tokens: 12, output_tokens: 24 } },
  };
  process.stdout.write(JSON.stringify(record) + '\n');
}

setTimeout(() => { emitTranscript(); process.exit(0); }, sleepMs);
