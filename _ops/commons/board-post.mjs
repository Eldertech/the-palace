// Commons board bridge — validate (and optionally append) a §9 message through
// the CANONICAL STIGMERGY validator + appender, single-sourced to the OWNER tree.
//
// This is the node half of "Python speaks validated §9". Python (board.py) resolves
// the owner tree (via git --git-common-dir) and hands us the core dir + board path,
// so a run from any worktree validates against the ONE owner-tree validator and
// appends to the ONE owner-tree board — never a per-branch copy.
//
// Contract:
//   stdin      : the message as JSON.
//   args       : --core-dir <owner>/_ops/stigmergy/core   (required)
//                --board-path <owner>/.../blackboard.jsonl (required unless --validate-only)
//                --validate-only | --post   (default --post)
//   stdout     : exactly one JSON line — {ok:true,wrote,path} | {ok:true,validated:true}
//                | {ok:false,errors:[...]}
//   exit code  : 0 on any *validation outcome* (valid or invalid);
//                non-zero ONLY on infra failure (bad args, import failure, unreadable
//                stdin) so the caller can tell "invalid message" from "node/infra broken".
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const PAYLOAD_CAP = 2048; // keep every write inside appendFileSync's atomic (<PIPE_BUF) regime

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
const has = (name) => process.argv.includes(name);

async function main() {
  const coreDir = arg('--core-dir');
  const boardPath = arg('--board-path');
  const validateOnly = has('--validate-only');
  if (!coreDir) throw new Error('missing --core-dir');
  if (!validateOnly && !boardPath) throw new Error('missing --board-path (required unless --validate-only)');

  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  let msg;
  try {
    msg = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (e) {
    throw new Error('stdin is not valid JSON: ' + e.message);
  }

  // Payload-size guard (a real improvement over the old hand-rolled lease's unbounded append).
  const payloadLen = Buffer.byteLength(JSON.stringify(msg.payload ?? {}));
  if (payloadLen > PAYLOAD_CAP) {
    process.stdout.write(JSON.stringify({
      ok: false,
      errors: [{ path: 'payload', message: `payload ${payloadLen}B exceeds ${PAYLOAD_CAP}B Commons cap (keep board writes atomic)` }],
    }) + '\n');
    return;
  }

  const base = pathToFileURL(coreDir.replace(/\/?$/, '/'));
  const { validateForPosting } = await import(new URL('schema/posting.js', base).href);
  const { appendMessage } = await import(new URL('blackboard/jsonl.js', base).href);

  const result = validateForPosting(msg, {});
  if (!result.valid) {
    process.stdout.write(JSON.stringify({ ok: false, errors: result.errors }) + '\n');
    return;
  }
  if (validateOnly) {
    process.stdout.write(JSON.stringify({ ok: true, validated: true }) + '\n');
    return;
  }
  const { wrote, path } = appendMessage(boardPath, msg);
  process.stdout.write(JSON.stringify({ ok: true, wrote, path }) + '\n');
}

main().catch((e) => {
  process.stderr.write(String((e && e.stack) || e) + '\n');
  process.exit(3);
});
