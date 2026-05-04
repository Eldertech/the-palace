// full-cycle.test.js — integration test simulating one runAgentCycle.md cycle.
//
// We do NOT dispatch a real subagent here (that's Phase 4/5 smoke-test
// territory). We compose the deterministic helpers exactly as the skill
// workflow would, with a canned subagent response stitched in, and verify
// the full pipeline:
//
//   manifest -> validate -> registry-check -> page-check -> render prompt
//   -> [canned subagent response with two §2.2 messages] -> health-build
//   -> validate-for-posting -> atomic-append -> state-update.

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest, loadManifest } from '../../src/manifest.js';
import { registerAgent, readRegistry, checkUnique } from '../../src/registry.js';
import { validateForPosting } from '../../src/posting.js';
import { appendMessage, readJsonl } from '../../src/append.js';
import { buildHealthBlock } from '../../src/health.js';
import { loadAndRender } from '../../src/prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PALACE_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const SKILL_ROOT = resolve(PALACE_ROOT, '.claude', 'skills', 'palace-orchestrator');
const FIXTURE_MANIFEST = resolve(__dirname, '..', 'fixtures', 'manifests', 'permanent-fixtures-test.json');

let tmp;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'palace-orch-cycle-'));
});

function freshState() {
  return {
    iteration: 1,
    last_active: '2026-05-04T08:00:00Z',
    last_read_cursor: 'msg-014',
    health: {
      context_pct: 0.45,
      avg_output_tokens_last_5: null,
      duplicate_flags: 0,
      posting_discipline_violations: 0,
      max_tokens_hits: 0,
      score: 'green',
    },
    stewardship: {
      stage_at_last_activation: 'growing',
      vector_at_last_activation: 'I will become a chat-driven generator of multisampled instruments — Claude conducts the interview, draws audio from any source, and renders a playable sample library in any open sampler format requested.',
      vector_changed_since_last: false,
      stage_changed_since_last: false,
      page_updates_observed_since_last: [],
    },
    pending_requests: [],
    resolved_requests: [],
  };
}

function cannedSubagentResponse() {
  // Simulates what a permanent steward subagent would return: two messages,
  // one BROADCAST (catch-up) and one RESOURCE_REQUEST (asking about the next
  // cycle's deliverable). Health blocks intentionally absent — the
  // orchestrator fills them in.
  return [
    {
      schema_version: '1.0',
      id: 'fixtures-cycle2-broadcast',
      ts: '2026-05-04T18:50:00Z',
      session_id: 'fixtures-cycle-2-2026-05-04',
      from: 'fixtures-stewards-test',
      to: '*',
      type: 'BROADCAST',
      board: 'GENERAL',
      payload: {
        content:
          'SPINNING UP. HOME: Generative Sample Libraries (fixtures snapshot). Neighborhood loaded: Talking Keyboard, Generative Wavetable Libraries, Modes of Collaboration, Substrate Skill, Project Stewardship System. Last activation 2026-05-04T08:00:00Z; resuming from cursor msg-014.',
      },
    },
    {
      schema_version: '1.0',
      id: 'fixtures-cycle2-request',
      ts: '2026-05-04T18:50:30Z',
      session_id: 'fixtures-cycle-2-2026-05-04',
      from: 'fixtures-stewards-test',
      to: 'TRICKSTER',
      type: 'RESOURCE_REQUEST',
      board: 'TRICKSTER',
      request_id: 'fixtures-cycle2-req-001',
      payload: {
        rationale:
          'Generative Sample Libraries — chat-driven multisampled instrument generator. Phase 1 (Talking Keyboard) shipped 2026-05-02. Phase 2 Interview skill is sketched at _ops/sample-libraries/skills/interview/. This fixtures cycle is a smoke-test for the orchestrator skill, asking: should I draft the Phase 3 promotion criteria now, or should the Phase 2 skill prove out on a second instrument first?',
        resource: 'directional_decision',
        blocking: false,
      },
    },
  ];
}

describe('full-cycle integration', () => {
  it('composes the helpers end-to-end without dispatching a subagent', () => {
    // STEP 1: validate manifest.
    const m = loadManifest(FIXTURE_MANIFEST);
    expect(m.valid).toBe(true);
    const manifest = m.normalized;

    // STEP 2: registry uniqueness check (in a tmp registry to avoid touching
    // the real REGISTRY.json).
    const tmpRegistry = join(tmp, 'REGISTRY.json');
    const reg = readRegistry(tmpRegistry);
    const checkBefore = checkUnique(reg, manifest.agent_id);
    expect(checkBefore.ok).toBe(true);
    const r = registerAgent(tmpRegistry, {
      agent_id: manifest.agent_id,
      home: manifest.home,
      dir: '/tmp/fake-agent-dir',
    });
    expect(r.created).toBe(true);

    // STEP 3 & 4: page-check + vector drift — skipped here; the integration
    // test focuses on the dispatch-and-write half. The git layer is
    // covered in tests/unit/git.test.js.

    // STEP 5: render the steward template.
    const state = freshState();
    const prompt = loadAndRender({
      skillRoot: SKILL_ROOT,
      templateName: 'steward',
      vars: {
        home: manifest.home,
        cycle_id: manifest.cycle_id,
        stage_at_last_activation: state.stewardship.stage_at_last_activation,
      },
    });
    expect(prompt).toMatch(/Generative Sample Libraries/);
    expect(prompt).toMatch(/growing/);
    expect(prompt).toMatch(/Plain first-person voice/i);

    // STEP 6: build the user-turn context (skipped — it's plain text composition).

    // STEP 7-8: simulate the subagent response.
    const messages = cannedSubagentResponse();
    expect(messages).toHaveLength(2);

    // STEP 9: orchestrator builds the health block from Agent-tool usage
    // and injects it into every message.
    const usage = { total_tokens: 4500, model: manifest.model.name, iteration: state.iteration + 1 };
    const health = buildHealthBlock(usage);
    expect(health.score).toBe('green');
    expect(health._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');
    for (const msg of messages) {
      msg.health = health;
    }

    // STEP 10: validate every outgoing message.
    const blackboardPath = join(tmp, 'blackboard.jsonl');
    const priorMessages = readJsonl(blackboardPath); // empty
    for (const msg of messages) {
      const result = validateForPosting(msg, {
        priorMessages,
        agentId: manifest.agent_id,
      });
      if (!result.valid) {
        throw new Error(`validation failed for ${msg.id}: ${JSON.stringify(result.errors)}`);
      }
      expect(result.valid).toBe(true);
      // Each newly-posted message should be in the prior list for the next iteration's
      // duplicate-FLAG and SPINNING UP checks.
      priorMessages.push(msg);
    }

    // STEP 11: atomic append.
    for (const msg of messages) {
      const r = appendMessage(blackboardPath, msg);
      expect(r.path).toBe(blackboardPath);
    }

    // VERIFY: the file has both messages, in order.
    const persisted = readJsonl(blackboardPath);
    expect(persisted).toHaveLength(2);
    expect(persisted[0].id).toBe('fixtures-cycle2-broadcast');
    expect(persisted[1].id).toBe('fixtures-cycle2-request');
    expect(persisted[1].request_id).toBe('fixtures-cycle2-req-001'); // Gap 9: top-level
    expect(persisted[0].health.score).toBe('green');
    expect(persisted[0].health._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');

    // STEP 12: state update (verify the shape we'd write back).
    const updated = {
      ...state,
      iteration: state.iteration + 1,
      last_active: '2026-05-04T18:51:00Z',
      last_read_cursor: 'fixtures-cycle2-request',
      pending_requests: [{
        request_id: 'fixtures-cycle2-req-001',
        resource: 'directional_decision',
        blocking: false,
        posted_at: '2026-05-04T18:50:30Z',
      }],
    };
    expect(updated.iteration).toBe(2);
    expect(updated.pending_requests[0].request_id).toBe('fixtures-cycle2-req-001');
  });

  it('rejects the cycle when the subagent emits a RESOURCE_REQUEST without top-level request_id (Gap 9)', () => {
    const m = loadManifest(FIXTURE_MANIFEST);
    expect(m.valid).toBe(true);
    const manifest = m.normalized;

    const usage = { total_tokens: 1000, model: manifest.model.name };
    const health = buildHealthBlock(usage);

    // Bad message — request_id only inside payload (the historical bug
    // surfaced in Stage A as Gap 9).
    const bad = {
      schema_version: '1.0',
      id: 'bad-cycle',
      ts: '2026-05-04T18:55:00Z',
      session_id: 'fixtures-cycle-2-2026-05-04',
      from: manifest.agent_id,
      to: 'TRICKSTER',
      type: 'RESOURCE_REQUEST',
      board: 'TRICKSTER',
      payload: { request_id: 'inside-payload-INVALID', rationale: 'bad' },
      health,
    };

    const result = validateForPosting(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'request_id')).toBe(true);

    // Append should NOT happen — verify the file was never created.
    const blackboardPath = join(tmp, 'blackboard.jsonl');
    expect(existsSync(blackboardPath)).toBe(false);
  });

  it('detects a SPINNING UP discipline violation when a permanent agent posts FLAG before BROADCAST', () => {
    const m = loadManifest(FIXTURE_MANIFEST);
    const manifest = m.normalized;
    const usage = { total_tokens: 1000, model: manifest.model.name };
    const health = buildHealthBlock(usage);

    const offender = {
      schema_version: '1.0',
      id: 'cycle2-flag',
      ts: '2026-05-04T18:55:00Z',
      session_id: 'fixtures-cycle-2-2026-05-04',
      from: manifest.agent_id,
      to: '*',
      type: 'FLAG',
      board: 'FLAGS',
      payload: { claim: 'X', target_entries: ['Y'], confidence: 'high' },
      health,
    };

    const result = validateForPosting(offender, { priorMessages: [], agentId: manifest.agent_id });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /SPINNING UP|first message/.test(e.message))).toBe(true);
  });

  it('honors songline manifest correctly through render and validation', () => {
    const songlineManifestPath = resolve(__dirname, '..', 'fixtures', 'manifests', 'songline-cooperation.json');
    const m = loadManifest(songlineManifestPath);
    expect(m.valid).toBe(true);
    const manifest = m.normalized;

    // Render the songline template.
    const prompt = loadAndRender({
      skillRoot: SKILL_ROOT,
      templateName: 'songline',
      vars: {
        home: manifest.home,
        session_id: manifest.session_id,
        path_description: 'Cooperation Yields Agency -> Kuramoto Coupling -> Hilaritas Generator',
        step_number: 1,
        step_total: 3,
        next_agent_id: 'Kuramoto Coupling',
      },
    });
    expect(prompt).toMatch(/songline-2026-05-04-001/);
    expect(prompt).toMatch(/pheromone[- ]?trail/i);

    // Verify a SPINNING UP arrival message validates clean.
    const usage = { total_tokens: 600, model: manifest.model.name };
    const health = buildHealthBlock(usage);
    const arrival = {
      schema_version: '1.0',
      id: 'coop-arrival',
      ts: '2026-05-04T19:00:00Z',
      session_id: manifest.session_id,
      from: manifest.agent_id,
      to: '*',
      type: 'BROADCAST',
      board: 'GENERAL',
      payload: { content: 'COOPERATION YIELDS AGENCY online. Neighborhood loaded.' },
      health,
    };
    const r = validateForPosting(arrival, { priorMessages: [], agentId: manifest.agent_id });
    expect(r.valid).toBe(true);
  });
});
