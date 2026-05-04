// manifest.test.js — unit tests for manifest schema (§3.1) + v0.1 amendments.
//
// Critical: Phase 1 schema MUST accept the live GSL pilot manifest exactly,
// because that file is the canonical example. Any schema change that rejects
// the live pilot's manifest is a regression.

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateManifest, loadManifest, SUPPORTED_MODES } from '../../src/manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, '..', 'fixtures', 'manifests');
const PILOT_MANIFEST = resolve(__dirname, '..', 'fixtures', 'pilot-state', 'manifest.json');

describe('validateManifest', () => {
  it('accepts a minimal valid songline manifest', () => {
    const result = loadManifest(resolve(FIXTURES, 'songline-cooperation.json'));
    expect(result.valid).toBe(true);
    expect(result.normalized.agent_id).toBe('Cooperation Yields Agency');
    expect(result.normalized.mode).toBe('songline');
  });

  it('accepts a permanent (long_duration_background) manifest with null session_id and cycle_id', () => {
    const result = loadManifest(resolve(FIXTURES, 'permanent-fixtures-test.json'));
    expect(result.valid).toBe(true);
    expect(result.normalized.session_id).toBeNull();
    expect(result.normalized.cycle_id).toBe('fixtures-cycle-2-2026-05-04');
  });

  it('accepts the live GSL pilot manifest exactly (canonical example, Phase 1 must not regress)', () => {
    const result = loadManifest(PILOT_MANIFEST);
    expect(result.valid).toBe(true);
    expect(result.normalized.agent_id).toBe('Generative Sample Libraries');
    expect(result.normalized.home).toBe('Generative Sample Libraries');
  });

  it('defaults agent_id to home when omitted (Finding 11)', () => {
    const result = loadManifest(resolve(FIXTURES, 'agent-id-defaulted.json'));
    expect(result.valid).toBe(true);
    expect(result.normalized.agent_id).toBe('Hilaritas Generator');
  });

  it('rejects manifest missing required home', () => {
    const result = loadManifest(resolve(FIXTURES, 'invalid-missing-home.json'));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'home')).toBe(true);
  });

  it('rejects unsupported mode', () => {
    const r = validateManifest({
      home: 'X',
      mode: 'parallel_weave',
      session_id: 'sx',
      model: { provider: 'anthropic', name: 'claude-sonnet-4-6', endpoint: 'x' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'mode')).toBe(true);
  });

  it('rejects songline mode missing session_id', () => {
    const r = validateManifest({
      home: 'X', mode: 'songline',
      model: { provider: 'anthropic', name: 'claude-sonnet-4-6', endpoint: 'x' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'session_id')).toBe(true);
  });

  it('allows long_duration_background mode with no session_id at all (Gap 1)', () => {
    const r = validateManifest({
      home: 'X', mode: 'long_duration_background',
      model: { provider: 'anthropic', name: 'claude-opus-4-7', endpoint: 'x' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    });
    expect(r.valid).toBe(true);
  });

  it('rejects model missing provider/name/endpoint', () => {
    const r = validateManifest({
      home: 'X', mode: 'songline', session_id: 'sx',
      model: { provider: 'anthropic' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'model.name')).toBe(true);
    expect(r.errors.some((e) => e.path === 'model.endpoint')).toBe(true);
  });

  it('rejects negative max_iterations', () => {
    const r = validateManifest({
      home: 'X', mode: 'songline', session_id: 'sx',
      model: { provider: 'anthropic', name: 'claude-sonnet-4-6', endpoint: 'x' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: -1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'stopping_conditions.max_iterations')).toBe(true);
  });

  it('rejects null and array manifest input', () => {
    expect(validateManifest(null).valid).toBe(false);
    expect(validateManifest([]).valid).toBe(false);
    expect(validateManifest('string').valid).toBe(false);
  });

  it('exposes the supported-modes set with songline + long_duration_background', () => {
    expect(SUPPORTED_MODES.has('songline')).toBe(true);
    expect(SUPPORTED_MODES.has('long_duration_background')).toBe(true);
  });

  it('does not mutate the input manifest when normalizing', () => {
    const raw = {
      home: 'X',
      session_id: 'sx',
      mode: 'songline',
      model: { provider: 'anthropic', name: 'claude-sonnet-4-6', endpoint: 'x' },
      tool_registry: ['read_palace'],
      stopping_conditions: { max_iterations: 1, stop_on: ['cycle_complete'] },
      blackboard_persistent_path: '_ops/swarm/persistent/blackboard.jsonl',
    };
    const r = validateManifest(raw);
    expect(r.valid).toBe(true);
    expect(raw.agent_id).toBeUndefined();
    expect(r.normalized.agent_id).toBe('X');
  });
});
