#!/usr/bin/env node
// Closing Well — transcript reader (Phase 3 of the Closing Well Agent build).
//
// Two jobs, both mechanical:
//   1. RESOLVE  — find the current session's transcript .jsonl on disk.
//   2. DISTILL  — project that raw JSONL into a readable *arc* a cold reader can
//                 ingest cheaply: user/assistant text kept verbatim, tool calls
//                 collapsed to one-liners, tool-output noise stripped, thinking
//                 dropped by default.
//
// The distillation is a *projection, not a summary*. It strips noise; it never
// interprets. That is load-bearing: the Closing Well Agent must reconstruct the
// arc itself (the Phase 3 verify gate is "cold, from the transcript alone"). If
// this script summarized, it would be doing the Agent's job and the gate would
// be meaningless.
//
// Why RESOLVE is not "look under the worktree's project dir": a session's
// transcript lives where the session *process* started, mangled into
// ~/.claude/projects/<mangled-cwd>/<session-id>.jsonl — not where later Bash
// calls cd to. A session launched at the palace root but working in a worktree
// writes to the *root's* project dir. So the honest default is "newest .jsonl
// across ALL project dirs", with an explicit --file / --session override for
// when the caller knows better (the safe path — see NOTE on sidechains below).
//
// NOTE on sidechains: when the main loop spawns the Closing Well Agent, that
// subagent's turns may append to a fresh file. So RESOLVE is meant to be run by
// the *main loop* (whose transcript is newest at that moment); the resolved path
// is then passed explicitly to the Agent, which never re-resolves. Files whose
// records are entirely sidechain (isSidechain:true) are skipped by RESOLVE.
//
// Usage:
//   node transcript-reader.mjs --resolve
//   node transcript-reader.mjs --resolve --cwd "/path/to/session/start"
//   node transcript-reader.mjs --distill [--file <path> | --session <id>] [--out <path>] [--thinking] [--max-turns N]
//   node transcript-reader.mjs --distill                 # resolve + distill in one go
//
// Exit codes: 0 ok · 1 usage / not-found · 2 parse failure.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

// ---- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) { flags[key] = next; i++; }
    else flags[key] = true;
  }
}

function die(msg, code = 1) { console.error(`transcript-reader: ${msg}`); process.exit(code); }

// ---- resolve ---------------------------------------------------------------
// Return the newest .jsonl that has at least one non-sidechain user/assistant
// record. If --cwd is given, restrict to that cwd's mangled project dir first,
// falling back to the global scan only if nothing there.
function mangle(cwd) { return cwd.replace(/[/.]/g, '-'); }

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => {
      const full = path.join(dir, f);
      let mtime = 0;
      try { mtime = fs.statSync(full).mtimeMs; } catch { /* skip */ }
      return { full, mtime };
    });
}

function hasRealTurn(file) {
  // Is this a real *human* session, not a subagent's own transcript?
  //
  // A running subagent writes its own top-level .jsonl (from its POV it is not a
  // sidechain — isSidechain is false there too), so "newest .jsonl" alone can grab
  // it when a close fires mid-dispatch. The clean discriminator: a genuine session
  // has at least one user turn that a human initiated (origin.kind === 'human');
  // a subagent's user turns are agent-initiated and carry no such origin.
  try {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (const l of lines) {
      if (!l.trim()) continue;
      let o;
      try { o = JSON.parse(l); } catch { continue; }
      if (o.isSidechain === true) continue;
      if (o.type === 'user' && o.origin && o.origin.kind === 'human') return true;
    }
  } catch { /* unreadable */ }
  return false;
}

function resolveTranscript() {
  let candidates = [];
  if (typeof flags.cwd === 'string') {
    candidates = scanDir(path.join(PROJECTS_DIR, mangle(flags.cwd)));
  }
  if (candidates.length === 0) {
    // global scan across every project dir
    if (!fs.existsSync(PROJECTS_DIR)) die(`no projects dir at ${PROJECTS_DIR}`);
    for (const d of fs.readdirSync(PROJECTS_DIR)) {
      candidates.push(...scanDir(path.join(PROJECTS_DIR, d)));
    }
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  for (const c of candidates) {
    if (hasRealTurn(c.full)) return c.full;
  }
  return null;
}

function resolveBySession(id) {
  // Accept a full session id OR a prefix (the survey / task chips show short
  // 8-char ids). Exact match wins; otherwise a unique prefix match; ambiguous
  // prefixes error rather than guess.
  if (!fs.existsSync(PROJECTS_DIR)) die(`no projects dir at ${PROJECTS_DIR}`);
  const hits = [];
  for (const d of fs.readdirSync(PROJECTS_DIR)) {
    const dir = path.join(PROJECTS_DIR, d);
    const exact = path.join(dir, `${id}.jsonl`);
    if (fs.existsSync(exact)) return exact;
    let entries = [];
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const f of entries) {
      if (f.endsWith('.jsonl') && f.startsWith(id)) hits.push(path.join(dir, f));
    }
  }
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) die(`session prefix "${id}" is ambiguous (${hits.length} matches) — use a longer prefix`);
  return null;
}

// ---- distill ---------------------------------------------------------------
function asText(content) {
  // content may be a string or an array of blocks; return plain string parts.
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(b => (b && b.type === 'text' ? b.text : ''))
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function oneLine(s, n = 200) {
  return String(s).replace(/\s+/g, ' ').trim().slice(0, n);
}

// Does this tool call mutate palace state (a spine event) or just navigate/read?
// Spine: file writes, git commits/merges, dispatches, deposits, batons. Navigation:
// Read/Grep/Glob/LS, read-only Bash (git log/status/diff, ls/cat/grep/find/wc).
const MUTATE_BASH = /(git\s+(commit|merge|rebase|push|add|reset|stash|cherry-pick)\b|mkdir\b|\bmv\b|\brm\b|\bcp\b|>>|\s>\s|\btee\b|commit\.mjs|new-worktree)/;
function isSpineCall(name, text) {
  if (['Write', 'Edit', 'NotebookEdit', 'Agent', 'Task'].includes(name)) return true;
  if (/deposit|baton|spawn_task|create_event|send_/i.test(name)) return true;
  if (name === 'Bash') return MUTATE_BASH.test(text);
  return false; // Read, Grep, Glob, LS, WebFetch, mcp reads, everything else
}
// A tool result is spine if it errored or carries commit/deposit/ceremony evidence.
const SPINE_RESULT = /(committed:|deposit\(|baton\(|Schema Ceremony|✗|error|fatal|denied|failed)/i;

function summarizeToolInput(name, input) {
  if (!input || typeof input !== 'object') return '';
  // Pull the most identifying field per common tool, else a compact json head.
  const pick = (k) => (input[k] != null ? oneLine(input[k], 160) : null);
  const first =
    pick('command') || pick('file_path') || pick('path') || pick('pattern') ||
    pick('query') || pick('prompt') || pick('description') || pick('url') ||
    pick('old_string') || null;
  if (first) return first;
  try { return oneLine(JSON.stringify(input), 160); } catch { return ''; }
}

function distill(file, opts) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { die(`cannot read ${file}: ${e.message}`, 2); }
  const lines = raw.split('\n').filter(l => l.trim());

  const beats = [];
  let meta = { sessionId: null, cwd: null, branches: new Set(), firstTs: null, lastTs: null, models: new Set() };
  let userTurns = 0, asstTurns = 0, toolCalls = 0;

  for (const l of lines) {
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    if (o.isSidechain === true) continue; // subagent noise — not the session arc
    const t = o.type;
    if (t !== 'user' && t !== 'assistant') continue;

    if (o.sessionId && !meta.sessionId) meta.sessionId = o.sessionId;
    if (o.cwd && !meta.cwd) meta.cwd = o.cwd;
    if (o.gitBranch) meta.branches.add(o.gitBranch);
    if (o.timestamp) { if (!meta.firstTs) meta.firstTs = o.timestamp; meta.lastTs = o.timestamp; }

    const msg = (o.message && typeof o.message === 'object') ? o.message : {};
    if (msg.model) meta.models.add(msg.model);
    const content = msg.content;

    if (t === 'user') {
      // A user record can be a real human turn OR a tool_result carrier.
      const blocks = Array.isArray(content) ? content : null;
      const toolResults = blocks ? blocks.filter(b => b && b.type === 'tool_result') : [];
      const humanText = asText(content);
      if (humanText.trim()) {
        userTurns++;
        beats.push({ role: 'HUMAN', text: humanText.trim() });
      } else if (toolResults.length) {
        for (const tr of toolResults) {
          const body = typeof tr.content === 'string' ? tr.content : asText(tr.content);
          const tag = tr.is_error ? 'tool ✗' : 'tool ✓';
          const spine = tr.is_error || SPINE_RESULT.test(body);
          beats.push({ role: 'RESULT', text: `[${tag}] ${oneLine(body, 180)}`, spine });
        }
      }
    } else { // assistant
      asstTurns++;
      const blocks = Array.isArray(content) ? content : [];
      for (const b of blocks) {
        if (!b || typeof b !== 'object') continue;
        if (b.type === 'text' && b.text && b.text.trim()) {
          beats.push({ role: 'CLAUDE', text: b.text.trim() });
        } else if (b.type === 'thinking' && opts.thinking && b.thinking) {
          beats.push({ role: 'think', text: oneLine(b.thinking, 400) });
        } else if (b.type === 'tool_use') {
          toolCalls++;
          const text = `${b.name}(${summarizeToolInput(b.name, b.input)})`;
          beats.push({ role: 'call', text, spine: isSpineCall(b.name, text) });
        }
      }
    }
  }

  let navDropped = 0;
  if (opts.spine) {
    // Keep the spine (human turns, Claude text, mutation/dispatch calls, error/commit
    // results); collapse runs of navigation noise (reads, greps, routine ✓ results)
    // into a single compact marker so the arc's shape stays legible.
    const kept = [];
    let run = 0;
    const flush = () => { if (run) { kept.push({ role: 'DROP', n: run }); navDropped += run; run = 0; } };
    for (const b of beats) {
      const isNav = (b.role === 'call' || b.role === 'RESULT') && !b.spine;
      if (isNav) { run++; continue; }
      flush();
      kept.push(b);
    }
    flush();
    beats.length = 0;
    beats.push(...kept);
  }

  if (opts.maxTurns && beats.length > opts.maxTurns) {
    // keep head and tail — the arc's opening and its close matter most
    const head = Math.ceil(opts.maxTurns * 0.6);
    const tail = opts.maxTurns - head;
    const dropped = beats.length - opts.maxTurns;
    beats.splice(head, dropped, { role: 'ELIDED', text: `… ${dropped} interior beats elided (--max-turns) …` });
  }

  return { meta, beats, stats: { userTurns, asstTurns, toolCalls, lines: lines.length, navDropped } };
}

function render({ meta, beats, stats }, file) {
  const out = [];
  out.push('# Session arc — distilled transcript');
  out.push('');
  out.push('> Mechanical projection of the raw session transcript (Closing Well —');
  out.push('> transcript-reader). Text kept verbatim; tool calls collapsed to');
  out.push('> one-liners; tool output truncated; thinking dropped unless --thinking.');
  out.push('> **This is not a summary — reconstruct the arc yourself.**');
  out.push('');
  out.push(`- source: \`${file}\``);
  out.push(`- session: \`${meta.sessionId || '?'}\``);
  out.push(`- cwd at start: \`${meta.cwd || '?'}\``);
  out.push(`- branches touched: ${[...meta.branches].map(b => '`' + b + '`').join(', ') || '?'}`);
  out.push(`- models: ${[...meta.models].join(', ') || '?'}`);
  out.push(`- span: ${meta.firstTs || '?'} → ${meta.lastTs || '?'}`);
  out.push(`- turns: ${stats.userTurns} human · ${stats.asstTurns} assistant · ${stats.toolCalls} tool calls · ${stats.lines} records`);
  if (stats.navDropped) out.push(`- spine mode: ${stats.navDropped} navigation beats dropped (reads/greps/routine results)`);
  out.push('');
  out.push('---');
  out.push('');
  for (const b of beats) {
    if (b.role === 'HUMAN') { out.push(`### 🧑 HUMAN`); out.push(b.text); out.push(''); }
    else if (b.role === 'CLAUDE') { out.push(`### 🤖 CLAUDE`); out.push(b.text); out.push(''); }
    else if (b.role === 'call') { out.push(`  · call → ${b.text}`); }
    else if (b.role === 'RESULT') { out.push(`  · ${b.text}`); }
    else if (b.role === 'think') { out.push(`  · (thinking) ${b.text}`); }
    else if (b.role === 'DROP') { out.push(`  · … ${b.n} navigation beat${b.n === 1 ? '' : 's'} (reads/greps/routine results) …`); }
    else if (b.role === 'ELIDED') { out.push(''); out.push(`**${b.text}**`); out.push(''); }
  }
  out.push('');
  return out.join('\n');
}

// ---- main ------------------------------------------------------------------
const doResolve = flags.resolve || (!flags.distill && !flags.resolve);
const doDistill = !!flags.distill;

let file = null;
if (typeof flags.file === 'string') file = flags.file;
else if (typeof flags.session === 'string') file = resolveBySession(flags.session);
else file = resolveTranscript();

if (!file) die('could not resolve a session transcript (try --file or --session)');
if (!fs.existsSync(file)) die(`transcript not found: ${file}`);

if (doDistill) {
  const opts = {
    thinking: !!flags.thinking,
    spine: !!flags.spine,
    maxTurns: flags['max-turns'] ? parseInt(flags['max-turns'], 10) : 0,
  };
  const distilled = distill(file, opts);
  const text = render(distilled, file);
  if (typeof flags.out === 'string') {
    fs.writeFileSync(flags.out, text);
    console.log(flags.out);
  } else {
    process.stdout.write(text);
  }
} else {
  // resolve only
  console.log(file);
}
