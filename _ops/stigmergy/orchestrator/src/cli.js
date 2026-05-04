#!/usr/bin/env node
// cli.js — the deterministic CLI surface the orchestrator skill calls.
//
// Commands:
//   palace-orch validate <manifest.json>
//   palace-orch validate-message <message-json> [--prior-board <path>] [--agent-id <id>]
//   palace-orch append <message-json> --target <persistent|session> [--session-path <path>] [--persistent-path <path>]
//   palace-orch register <agent-id> <home> --dir <agent-dir> [--registry <path>]
//   palace-orch register-check <agent-id> [--registry <path>]
//   palace-orch check-page <entry-name> <since-iso> [--palace-root <path>]
//   palace-orch health <usage-json>
//
// All commands print machine-readable JSON to stdout and use exit codes:
//   0 = ok / valid
//   1 = invalid (validation failure with errors[])
//   2 = usage / I/O error

import { argv, exit, stdout, stderr } from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadManifest } from './manifest.js';
import { validateForPosting } from './posting.js';
import { appendMessage, readJsonl } from './append.js';
import { registerAgent, readRegistry, checkUnique } from './registry.js';
import { checkPageChange } from './git.js';
import { buildHealthBlock } from './health.js';

const PALACE_ROOT_DEFAULT = resolve(new URL('.', import.meta.url).pathname, '../../../..');
const REGISTRY_DEFAULT = resolve(PALACE_ROOT_DEFAULT, '_ops/agents/permanent/REGISTRY.json');

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true;
        i += 1;
      } else {
        flags[key] = next;
        i += 2;
      }
    } else {
      positional.push(a);
      i += 1;
    }
  }
  return { positional, flags };
}

function emit(obj, code = 0) {
  stdout.write(JSON.stringify(obj, null, 2) + '\n');
  exit(code);
}

function parseJsonInput(input) {
  // Accept either a path-to-file or a JSON literal (starts with `{`).
  const trimmed = input.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  return JSON.parse(readFileSync(resolve(input), 'utf8'));
}

function cmdValidate(positional) {
  if (positional.length < 1) {
    stderr.write('usage: palace-orch validate <manifest.json>\n');
    exit(2);
  }
  const result = loadManifest(positional[0]);
  if (!result.valid) {
    emit({ valid: false, errors: result.errors, path: result.path }, 1);
  }
  emit({ valid: true, normalized: result.normalized, path: result.path }, 0);
}

function cmdValidateMessage(positional, flags) {
  if (positional.length < 1) {
    stderr.write('usage: palace-orch validate-message <message-json|path> [--prior-board <path>] [--agent-id <id>]\n');
    exit(2);
  }
  const message = parseJsonInput(positional[0]);
  const opts = {};
  if (flags['agent-id']) opts.agentId = flags['agent-id'];
  if (flags['prior-board']) opts.priorMessages = readJsonl(flags['prior-board']);
  const result = validateForPosting(message, opts);
  if (!result.valid) emit({ valid: false, errors: result.errors }, 1);
  emit({ valid: true }, 0);
}

function cmdAppend(positional, flags) {
  if (positional.length < 1) {
    stderr.write('usage: palace-orch append <message-json|path> --target <persistent|session> [--persistent-path <path>] [--session-path <path>]\n');
    exit(2);
  }
  const message = parseJsonInput(positional[0]);
  const target = flags['target'];
  if (!target) {
    stderr.write('palace-orch append: --target persistent|session is required\n');
    exit(2);
  }
  // Re-validate before append (defense in depth).
  const opts = {};
  if (flags['agent-id']) opts.agentId = flags['agent-id'];
  if (flags['prior-board']) opts.priorMessages = readJsonl(flags['prior-board']);
  const v = validateForPosting(message, opts);
  if (!v.valid) emit({ wrote: false, valid: false, errors: v.errors }, 1);

  let path;
  if (target === 'persistent') {
    path = flags['persistent-path']
      ? resolve(flags['persistent-path'])
      : resolve(PALACE_ROOT_DEFAULT, '_ops/swarm/persistent/blackboard.jsonl');
  } else if (target === 'session') {
    if (!flags['session-path']) {
      stderr.write('palace-orch append --target session requires --session-path\n');
      exit(2);
    }
    path = resolve(flags['session-path']);
  } else {
    stderr.write(`palace-orch append: unknown target "${target}"\n`);
    exit(2);
  }
  const out = appendMessage(path, message);
  emit({ wrote: true, valid: true, path: out.path }, 0);
}

function cmdRegister(positional, flags) {
  if (positional.length < 2) {
    stderr.write('usage: palace-orch register <agent-id> <home> --dir <agent-dir> [--registry <path>]\n');
    exit(2);
  }
  const [agentId, home] = positional;
  if (!flags['dir']) {
    stderr.write('palace-orch register: --dir <agent-dir> is required\n');
    exit(2);
  }
  const registryPath = flags['registry'] ? resolve(flags['registry']) : REGISTRY_DEFAULT;
  try {
    const result = registerAgent(registryPath, { agent_id: agentId, home, dir: flags['dir'] });
    emit({ registered: result.created, agent_id: agentId, registry: registryPath }, 0);
  } catch (e) {
    emit({ registered: false, error: e.message, registry: registryPath }, 1);
  }
}

function cmdRegisterCheck(positional, flags) {
  if (positional.length < 1) {
    stderr.write('usage: palace-orch register-check <agent-id> [--dir <agent-dir>] [--registry <path>]\n');
    exit(2);
  }
  const agentId = positional[0];
  const registryPath = flags['registry'] ? resolve(flags['registry']) : REGISTRY_DEFAULT;
  const dir = flags['dir'];
  const registry = readRegistry(registryPath);
  const result = checkUnique(registry, agentId, dir);
  if (!result.ok) {
    emit({ ok: false, conflict: result.conflict, registry: registryPath }, 1);
  }
  emit({ ok: true, agent_id: agentId, registry: registryPath }, 0);
}

function cmdCheckPage(positional, flags) {
  if (positional.length < 2) {
    stderr.write('usage: palace-orch check-page <entry-name> <since-iso> [--palace-root <path>]\n');
    exit(2);
  }
  const [entry, since] = positional;
  const root = flags['palace-root'] ? resolve(flags['palace-root']) : PALACE_ROOT_DEFAULT;
  const result = checkPageChange(root, entry, since);
  emit(result, 0);
}

function cmdHealth(positional) {
  if (positional.length < 1) {
    stderr.write('usage: palace-orch health <usage-json|path>\n');
    exit(2);
  }
  const usage = parseJsonInput(positional[0]);
  const block = buildHealthBlock(usage);
  emit({ health: block }, 0);
}

const COMMANDS = {
  validate: cmdValidate,
  'validate-message': cmdValidateMessage,
  append: cmdAppend,
  register: cmdRegister,
  'register-check': cmdRegisterCheck,
  'check-page': cmdCheckPage,
  health: cmdHealth,
};

function main() {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    stdout.write([
      'palace-orch — deterministic helpers for the Palace Orchestrator skill',
      '',
      'Commands:',
      '  validate <manifest.json>                                 Validate a manifest against §3.1 + v0.1 amendments',
      '  validate-message <msg.json> [--prior-board <path>] [--agent-id <id>]',
      '                                                           Validate an outgoing message against §2.2 + posting discipline §3.4',
      '  append <msg.json> --target <persistent|session> [--persistent-path <path>] [--session-path <path>]',
      '                                                           Append a validated message to a blackboard file',
      '  register <agent-id> <home> --dir <agent-dir> [--registry <path>]',
      '                                                           Register a permanent agent (Gap 7 uniqueness check)',
      '  register-check <agent-id> [--dir <agent-dir>] [--registry <path>]',
      '                                                           Check whether agent_id is taken without registering',
      '  check-page <entry-name> <since-iso> [--palace-root <path>]',
      '                                                           Detect git changes to a palace entry since a timestamp',
      '  health <usage.json>                                      Build an approximate §2.2 health block from Agent-tool usage',
      '',
    ].join('\n'));
    exit(0);
  }
  const cmd = args[0];
  const handler = COMMANDS[cmd];
  if (!handler) {
    stderr.write(`palace-orch: unknown command "${cmd}". Run 'palace-orch --help' for usage.\n`);
    exit(2);
  }
  const { positional, flags } = parseArgs(args.slice(1));
  handler(positional, flags);
}

main();
