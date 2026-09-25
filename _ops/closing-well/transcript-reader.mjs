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
  if (typeof input.plan === 'string') return oneLine(input.plan.split('\n')[0], 160); // ExitPlanMode: its title
  try { return oneLine(JSON.stringify(input), 160); } catch { return ''; }
}

// ---- whose voice -----------------------------------------------------------
// A HUMAN beat is testimony: the moderator reads the arc cold and builds findings
// on what the human said. So HUMAN must hold everything they typed or clicked, and
// nothing a machine put in their seat. Their words arrive by three carriers:
//   1. a user record — a typed turn;
//   2. a `queued_command` attachment — a message sent while Claude was working,
//      absorbed mid-turn. It carries the time it was sent but is written where it
//      was absorbed, a few records later (its queue-operation records only mirror it);
//   3. a tool_result that answers a popup — AskUserQuestion, ExitPlanMode, or a
//      permission prompt rejected, bare or with words.
// And these user records are not theirs: task notifications, messages from other
// sessions (origin 'peer'), scheduled and SDK launches (turnOrigin 'sdk'), meta
// injections (skill bodies, "Continue from where you left off", image notes),
// local-command output, the compaction summary, <system-reminder> blocks. Those
// become ⚙ one-liners, never HUMAN.

const REMINDER = /<system-reminder>[\s\S]*?<\/system-reminder>/g;
function stripReminders(s) { return String(s).replace(REMINDER, '').trim(); }

// Returns a label if a machine wrote this user record, null if the human did.
// Positive evidence only: a record with no marks either way (older transcripts,
// before `origin` existed) stays HUMAN.
function machineVoice(o, text) {
  const origin = o.origin && o.origin.kind;
  if (origin === 'human') return null;
  if (origin) return origin;                        // task-notification, peer, coordinator…
  if (o.turnOrigin && o.turnOrigin !== 'human') return o.turnOrigin; // sdk: a scheduled/scripted launch
  if (o.isCompactSummary) return 'compaction summary';
  if (o.isMeta) return 'meta';
  if (text.startsWith('<task-notification>')) return 'task-notification';
  if (/^<local-command-(stdout|stderr|caveat)>/.test(text)) return 'local command output';
  return null;
}

function machineLine(kind, text) {
  if (kind === 'task-notification') {
    const tag = (t) => { const m = text.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)); return m ? m[1].trim() : null; };
    const summary = tag('summary');
    if (summary) return oneLine(summary, 240);
  }
  const peer = /<cross-session-message\b([^>]*)>([\s\S]*?)(?:<\/cross-session-message>|$)/.exec(text);
  if (peer) {
    const from = /from-name="([^"]*)"/.exec(peer[1]);
    return oneLine(`${from ? `"${from[1]}" — ` : ''}${peer[2]}`, 240);
  }
  return oneLine(text, 240);
}

// A typed turn, cleaned only of what the harness wrapped around it.
function humanWords(text, blocks) {
  let t = text;
  const cmd = /<command-name>([\s\S]*?)<\/command-name>/.exec(t);
  if (cmd) {
    const args = /<command-args>([\s\S]*?)<\/command-args>/.exec(t);
    t = [cmd[1].trim(), args ? args[1].trim() : ''].filter(Boolean).join(' ');
  }
  const images = blocks ? blocks.filter(b => b && b.type === 'image').length : 0;
  if (images) t += `\n[+${images} image${images === 1 ? '' : 's'}]`;
  return t;
}

const REJECTED = "The user doesn't want to proceed with this tool use.";
const DISMISSED = /^\[User dismissed\b/;

function askedList(questions, answers, notes) {
  return questions.map(q => {
    const head = q.header ? `**${q.header}** — ${q.question}` : q.question;
    if (!answers) return `- ${head}`;
    const a = answers[q.question];
    const note = notes && notes[q.question] && notes[q.question].notes;
    const said = a == null || DISMISSED.test(a) ? 'dismissed without answering' : a;
    return `- ${head}\n  → ${said}${note ? `\n  → note: ${note}` : ''}`;
  }).join('\n');
}

// If this tool_result is the human answering a popup, return their answer as text.
function popupAnswer(call, tr, body, result) {
  const name = call && call.name;
  const input = (call && call.input) || {};
  if (tr.is_error && body.startsWith(REJECTED)) {
    const said = /the user said:\n([\s\S]*)$/.exec(body);
    if (name === 'AskUserQuestion') {
      const asked = askedList(input.questions || [], null);
      return said
        ? `Rejected AskUserQuestion and said:\n${said[1].trim()}\n\nIt had asked:\n${asked}`
        : `Rejected AskUserQuestion without answering:\n${asked}`;
    }
    const what = name ? `${name}(${summarizeToolInput(name, input)})` : 'a tool call';
    return said ? `Rejected ${what} and said:\n${said[1].trim()}` : `Rejected ${what} without comment.`;
  }
  if (tr.is_error) return null;
  if (name === 'AskUserQuestion') {
    const answers = result && typeof result === 'object' && result.answers;
    if (!answers) return `Answered AskUserQuestion:\n${body}`; // unknown shape: keep it whole
    const questions = Array.isArray(result.questions) ? result.questions : (input.questions || []);
    const unasked = Object.keys(answers).filter(q => !questions.some(x => x.question === q));
    const all = [...questions, ...unasked.map(question => ({ question }))];
    const dismissedAll = all.length > 0 && all.every(q => DISMISSED.test(answers[q.question] || ''));
    return dismissedAll
      ? `Dismissed AskUserQuestion without answering:\n${askedList(all, null)}`
      : `Answered AskUserQuestion:\n${askedList(all, answers, result.annotations)}`;
  }
  if (name === 'ExitPlanMode' && body.startsWith('User has approved')) {
    const title = summarizeToolInput(name, (result && result.plan) ? result : input);
    const edited = result && result.planWasEdited ? ', having edited it before approving' : '';
    const where = result && result.filePath ? ` (the approved text: ${result.filePath})` : '';
    return `Approved the plan "${title}"${edited}${where}.`;
  }
  return null;
}

function distill(file, opts) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { die(`cannot read ${file}: ${e.message}`, 2); }
  const lines = raw.split('\n').filter(l => l.trim());

  const beats = [];
  let meta = { sessionId: null, cwd: null, branches: new Set(), firstTs: null, lastTs: null, models: new Set() };
  let userTurns = 0, midTurns = 0, popups = 0, machineNotes = 0, asstTurns = 0, toolCalls = 0;
  const calls = new Map(); // tool_use id → { name, input }, so a result knows what it answers

  for (const l of lines) {
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    if (o.isSidechain === true) continue; // subagent noise — not the session arc
    const t = o.type;
    const ts = o.timestamp;

    if (t === 'attachment') {
      const a = o.attachment;
      if (!a || a.type !== 'queued_command') continue;
      const text = stripReminders(typeof a.prompt === 'string' ? a.prompt : asText(a.prompt));
      if (!text) continue;
      const sent = a.timestamp || ts;
      const human = a.commandMode === 'prompt' && !a.isMeta && (!a.origin || a.origin.kind === 'human');
      if (human) {
        midTurns++;
        beats.push({ role: 'HUMAN', tag: 'mid-turn', text, ts: sent, float: true });
      } else {
        machineNotes++;
        const kind = (a.origin && a.origin.kind) || a.commandMode || 'queued'; // peer, task-notification…
        beats.push({ role: 'MACHINE', text: `${kind}: ${machineLine(kind, text)}`, ts: sent, float: true });
      }
      continue;
    }
    if (t !== 'user' && t !== 'assistant') continue;

    if (o.sessionId && !meta.sessionId) meta.sessionId = o.sessionId;
    if (o.cwd && !meta.cwd) meta.cwd = o.cwd;
    if (o.gitBranch) meta.branches.add(o.gitBranch);
    if (ts) { if (!meta.firstTs) meta.firstTs = ts; meta.lastTs = ts; }

    const msg = (o.message && typeof o.message === 'object') ? o.message : {};
    if (msg.model) meta.models.add(msg.model);
    const content = msg.content;

    if (t === 'user') {
      // A user record can be a typed turn, a machine's injection, or a tool_result
      // carrier — and a tool_result can be the human answering a popup.
      const blocks = Array.isArray(content) ? content : null;
      const toolResults = blocks ? blocks.filter(b => b && b.type === 'tool_result') : [];
      for (const tr of toolResults) {
        const body = typeof tr.content === 'string' ? tr.content : asText(tr.content);
        const answer = popupAnswer(calls.get(tr.tool_use_id), tr, body, o.toolUseResult);
        if (answer) {
          popups++;
          beats.push({ role: 'HUMAN', tag: 'popup', text: answer, ts });
          continue;
        }
        const tag = tr.is_error ? 'tool ✗' : 'tool ✓';
        const spine = tr.is_error || SPINE_RESULT.test(body);
        beats.push({ role: 'RESULT', text: `[${tag}] ${oneLine(body, 180)}`, spine, ts });
      }
      const text = stripReminders(asText(content));
      if (!text) continue;
      const kind = machineVoice(o, text);
      if (kind) {
        machineNotes++;
        beats.push({ role: 'MACHINE', text: `${kind}: ${machineLine(kind, text)}`, ts });
      } else {
        userTurns++;
        beats.push({ role: 'HUMAN', text: humanWords(text, blocks), ts });
      }
    } else { // assistant
      asstTurns++;
      const blocks = Array.isArray(content) ? content : [];
      for (const b of blocks) {
        if (!b || typeof b !== 'object') continue;
        if (b.type === 'text' && b.text && b.text.trim()) {
          beats.push({ role: 'CLAUDE', text: b.text.trim(), ts });
        } else if (b.type === 'thinking' && opts.thinking && b.thinking) {
          beats.push({ role: 'think', text: oneLine(b.thinking, 400), ts });
        } else if (b.type === 'tool_use') {
          toolCalls++;
          calls.set(b.id, { name: b.name, input: b.input });
          const text = `${b.name}(${summarizeToolInput(b.name, b.input)})`;
          beats.push({ role: 'call', text, spine: isSpineCall(b.name, text), ts });
        }
      }
    }
  }

  // A queued message is written where it was absorbed, after the work it arrived
  // during. Seat it back at the moment it was sent: before the first beat stamped
  // later. Every other beat keeps its file order.
  const floats = beats.filter(b => b.float).sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  if (floats.length) {
    const seated = beats.filter(b => !b.float);
    for (const f of floats) {
      const at = f.ts ? seated.findIndex(b => !b.float && b.ts && b.ts > f.ts) : -1;
      seated.splice(at < 0 ? seated.length : at, 0, f);
    }
    beats.length = 0;
    beats.push(...seated);
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

  return { meta, beats, stats: { userTurns, midTurns, popups, machineNotes, asstTurns, toolCalls, lines: lines.length, navDropped } };
}

function render({ meta, beats, stats }, file) {
  const out = [];
  out.push('# Session arc — distilled transcript');
  out.push('');
  out.push('> Mechanical projection of the raw session transcript (Closing Well —');
  out.push('> transcript-reader). Text kept verbatim; tool calls collapsed to');
  out.push('> one-liners; tool output truncated; thinking dropped unless --thinking.');
  out.push('> HUMAN is everything the human typed or clicked: turns, messages sent');
  out.push('> (mid-turn) while Claude worked, and (popup) answers. ⚙ lines are user');
  out.push('> records a machine wrote — notifications, injections — never theirs.');
  out.push('> **This is not a summary — reconstruct the arc yourself.**');
  out.push('');
  out.push(`- source: \`${file}\``);
  out.push(`- session: \`${meta.sessionId || '?'}\``);
  out.push(`- cwd at start: \`${meta.cwd || '?'}\``);
  out.push(`- branches touched: ${[...meta.branches].map(b => '`' + b + '`').join(', ') || '?'}`);
  out.push(`- models: ${[...meta.models].join(', ') || '?'}`);
  out.push(`- span: ${meta.firstTs || '?'} → ${meta.lastTs || '?'}`);
  out.push(`- turns: ${stats.userTurns} human (+${stats.midTurns} mid-turn, ${stats.popups} popup) · ${stats.asstTurns} assistant · ${stats.toolCalls} tool calls · ${stats.machineNotes} ⚙ machine notes · ${stats.lines} records`);
  if (stats.navDropped) out.push(`- spine mode: ${stats.navDropped} navigation beats dropped (reads/greps/routine results)`);
  out.push('');
  out.push('---');
  out.push('');
  for (const b of beats) {
    if (b.role === 'HUMAN') { out.push(`### 🧑 HUMAN${b.tag ? ` (${b.tag})` : ''}`); out.push(b.text); out.push(''); }
    else if (b.role === 'MACHINE') { out.push(`  · ⚙ ${b.text}`); }
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
