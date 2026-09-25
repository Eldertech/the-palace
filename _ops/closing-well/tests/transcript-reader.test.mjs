// transcript-reader.test.mjs — the arc holds ALL of Loudon's input, and nothing that isn't his.
//
// The Closing Well moderator reads the arc cold, so a HUMAN beat is testimony. At the
// 2026-09-25 evening close (tuning item 31) the reader was caught three ways:
//   1. Messages he sent while Claude was working never reached the arc. They are not
//      user records at all: they are `queued_command` attachments, written to the file
//      where they were absorbed, and the reader never read attachments.
//   2. Popup answers came out as tool output cut to 180 characters, so a dismissal read
//      like an answer.
//   3. Task notifications, skill bodies and other injected user records sat under HUMAN.
//
// The fixtures are real records, cut down to the few that matter:
//   fixtures/arc-1f8e5161.jsonl — 18 of the 1,717 records of session 1f8e5161: both
//     mid-turn messages with their queue mirrors, the four-question AskUserQuestion he
//     dismissed, task notifications as user records and as a queued attachment, a skill
//     body (isMeta), and two typed turns as the control.
//   fixtures/arc-other-carriers.jsonl — the other shapes, from sibling sessions: a
//     pre-`origin` mid-turn message, a popup rejected with his words, a popup rejected
//     bare, an approved plan he edited, a slash command and its stdout, and a message
//     from another Claude session.
//
// Run:  node --test _ops/closing-well/tests/*.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PALACE = resolve(HERE, '../../..');
const READER = join(PALACE, '_ops/closing-well/transcript-reader.mjs');
const FIXTURES = join(HERE, 'fixtures');

const HUMAN = '### 🧑 HUMAN';

function arc(fixture, ...extra) {
  return execFileSync('node', [READER, '--distill', '--file', join(FIXTURES, fixture), ...extra],
    { encoding: 'utf8', stdio: 'pipe' });
}

/** The arc's beats, in order: a `### ` heading owns the lines under it; a `  · ` line is a beat of its own. */
function beats(text) {
  const body = text.slice(text.indexOf('\n---\n') + 5);
  const out = [];
  let cur = null;
  for (const line of body.split('\n')) {
    if (line.startsWith('### ')) { cur = { head: line, lines: [] }; out.push(cur); }
    else if (line.startsWith('  · ')) { cur = null; out.push({ head: line, lines: [] }); }
    else if (cur) cur.lines.push(line);
  }
  return out.map(b => ({ head: b.head, text: b.lines.join('\n').trim() }));
}

const humanBeats = (text) => beats(text).filter(b => b.head.startsWith(HUMAN));

/** The questions exactly as Claude asked them, read from the fixture's own tool_use. */
function askedQuestions(fixture) {
  for (const l of readFileSync(join(FIXTURES, fixture), 'utf8').split('\n')) {
    if (!l.trim()) continue;
    const o = JSON.parse(l);
    if (o.type !== 'assistant') continue;
    for (const b of o.message.content) {
      if (b.type === 'tool_use' && b.name === 'AskUserQuestion') return b.input.questions;
    }
  }
  throw new Error(`no AskUserQuestion in ${fixture}`);
}

const MID_TURN = [
  'We will do the version changes. Just wait on the tasks, thank you.',
  'The self check suite should do values checks as well as process checks. If we ask it to work outside of the values of the palace does it push back? it should.',
];

// ---- the evidence session --------------------------------------------------

test('a message sent mid-turn is a HUMAN beat, marked (mid-turn)', () => {
  const human = humanBeats(arc('arc-1f8e5161.jsonl'));
  for (const said of MID_TURN) {
    const hit = human.find(b => b.text === said);
    assert.ok(hit, `missing from HUMAN: "${said.slice(0, 50)}…"`);
    assert.equal(hit.head, `${HUMAN} (mid-turn)`);
  }
});

test('a mid-turn message sits where it was sent, not where it was absorbed', () => {
  // Sent 16:38:33; written to the file after the 16:38:38 reply and 16:38:40 Bash call.
  const all = beats(arc('arc-1f8e5161.jsonl'));
  const said = all.findIndex(b => b.text === MID_TURN[0]);
  const reply = all.findIndex(b => b.head === '### 🤖 CLAUDE' && b.text.startsWith("The Concierge's drafts are back"));
  assert.ok(said >= 0 && reply >= 0, 'both beats present');
  assert.ok(said < reply, 'the mid-turn message comes before the reply written after it was sent');
});

test('the queue mirror does not double a mid-turn message', () => {
  const text = arc('arc-1f8e5161.jsonl');
  for (const said of MID_TURN) assert.equal(text.split(said).length - 1, 1, `"${said.slice(0, 40)}…" appears once`);
});

test('a dismissed popup is a HUMAN beat that says so, with every question whole', () => {
  const text = arc('arc-1f8e5161.jsonl');
  const popups = humanBeats(text).filter(b => b.head === `${HUMAN} (popup)`);
  assert.equal(popups.length, 1);
  const [popup] = popups;
  assert.match(popup.text, /Dismissed AskUserQuestion without answering/);
  const questions = askedQuestions('arc-1f8e5161.jsonl');
  assert.equal(questions.length, 4);
  for (const q of questions) assert.ok(popup.text.includes(q.question), `question kept whole: "${q.header}"`);
  assert.doesNotMatch(popup.text, /\[User dismissed/, 'the harness sentinel is not presented as an answer');
  assert.doesNotMatch(text, /\[tool ✓\] The user answered/, 'the answer is not a RESULT beat');
});

test('no task notification, skill body, or other injected record is HUMAN', () => {
  const text = arc('arc-1f8e5161.jsonl');
  for (const b of humanBeats(text)) {
    assert.doesNotMatch(b.text, /<task-notification>/, `task notification under HUMAN: ${b.text.slice(0, 60)}`);
    assert.doesNotMatch(b.text, /^Base directory for this skill/, 'skill body under HUMAN');
  }
  // They are still in the arc, as machine lines.
  assert.match(text, /^ {2}· ⚙ task-notification: Agent "Summon the Concierge \(resident\)" finished/m);
  assert.match(text, /^ {2}· ⚙ task-notification: Background command "Tighten the baton claim; check forward-vector endings" failed/m);
  assert.match(text, /^ {2}· ⚙ meta: Base directory for this skill/m);
});

test('typed turns stay HUMAN', () => {
  const human = humanBeats(arc('arc-1f8e5161.jsonl'));
  const typed = human.filter(b => b.head === HUMAN).map(b => b.text);
  assert.ok(typed.includes('claim both and move forward with your plan.'));
  assert.ok(typed.some(t => t.startsWith('I am in the palace to do some handoffs grow up')));
  assert.equal(typed.length, 2);
});

test('--spine keeps every HUMAN beat', () => {
  const human = humanBeats(arc('arc-1f8e5161.jsonl', '--spine'));
  for (const said of MID_TURN) assert.ok(human.some(b => b.text === said));
  assert.ok(human.some(b => b.head === `${HUMAN} (popup)`));
});

// ---- the other carriers ----------------------------------------------------

test('a popup rejected with his words is HUMAN, words whole', () => {
  const popups = humanBeats(arc('arc-other-carriers.jsonl')).filter(b => b.head === `${HUMAN} (popup)`);
  const hit = popups.find(b => b.text.startsWith('Rejected ExitPlanMode'));
  assert.ok(hit, 'the rejection is a popup beat');
  assert.ok(hit.text.endsWith('I approve the plan, before any execution, review what just landed in git to make absolutely sure this was merged in the way you expected.'));
});

test('a popup rejected bare says he closed it without answering', () => {
  const popups = humanBeats(arc('arc-other-carriers.jsonl')).filter(b => b.head === `${HUMAN} (popup)`);
  const hit = popups.find(b => b.text.startsWith('Rejected AskUserQuestion without answering'));
  assert.ok(hit);
  const [q] = askedQuestions('arc-other-carriers.jsonl');
  assert.ok(hit.text.includes(q.question));
});

test('an approved plan is HUMAN, and says he edited it first', () => {
  const popups = humanBeats(arc('arc-other-carriers.jsonl')).filter(b => b.head === `${HUMAN} (popup)`);
  const hit = popups.find(b => b.text.startsWith('Approved the plan'));
  assert.ok(hit);
  assert.match(hit.text, /edited it before approving/);
});

test('a mid-turn message from before `origin` existed is still HUMAN (mid-turn)', () => {
  const human = humanBeats(arc('arc-other-carriers.jsonl'));
  assert.ok(human.some(b => b.head === `${HUMAN} (mid-turn)` && b.text === 'update?'));
});

test('a slash command is his; its output and another session\'s message are not', () => {
  const text = arc('arc-other-carriers.jsonl');
  const human = humanBeats(text);
  assert.ok(human.some(b => b.head === HUMAN && b.text === '/login'));
  for (const b of human) {
    assert.doesNotMatch(b.text, /<local-command-stdout>|Login successful/);
    assert.doesNotMatch(b.text, /Another Claude session sent a message/);
  }
  assert.match(text, /^ {2}· ⚙ local command output: <local-command-stdout>Login successful/m);
  assert.match(text, /^ {2}· ⚙ peer: "Ceremony updates with version and scrolls\." — Thanks — no collision/m);
});
