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
// When --edit-text is given, the stub also proposes an edit (the M1c edit path);
// --edit-op selects which op (default 'append'); otherwise it is a discuss-only turn.
const editText = flag('--edit-text', null);
const editOp = flag('--edit-op', 'append');
// When --action flag is given, the stub proposes a to-do capture (Stage 1): the
// `action` channel, distinct from `edit`. Todo fields are overridable.
const actionType = flag('--action', null);

let out;
if (actionType === 'flag') {
  out = {
    reply,
    action: {
      type: 'flag',
      todo: {
        title: flag('--todo-title', 'make the log filters clearer'),
        detail: flag('--todo-detail', 'the filter row is hard to scan at a glance.'),
        area: flag('--todo-area', 'log'),
        severity: flag('--todo-severity', 'minor'),
      },
    },
  };
} else if (actionType === 'regen') {
  // The hero/avatar regen (entry kind): the worker distilled art direction and
  // emits a regen_visual action. Fields overridable for targeting tests.
  out = {
    reply,
    action: {
      type: 'regen_visual',
      target: flag('--regen-target', 'both'),
      idiom: flag('--regen-idiom', 'test woodcut'),
      hero_prompt: flag('--regen-hero', 'a bold woodcut banner'),
      icon_prompt: flag('--regen-icon', 'a bold woodcut emblem'),
      note: flag('--regen-note', 'bolder, brighter'),
    },
  };
} else if (editText) {
  out = { reply, edit: { op: editOp, text: editText } };
} else {
  out = { reply };
}
process.stdout.write(JSON.stringify(out) + '\n');

setTimeout(() => process.exit(0), Number.isFinite(sleepMs) ? sleepMs : 250);
