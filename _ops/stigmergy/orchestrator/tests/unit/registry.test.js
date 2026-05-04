// registry.test.js — REGISTRY.json read/write/uniqueness check.

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  readRegistry,
  writeRegistry,
  registerAgent,
  deregisterAgent,
  checkUnique,
  findAgent,
} from '../../src/registry.js';

let tmp;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'palace-orch-registry-'));
});

describe('readRegistry', () => {
  it('returns empty registry when file does not exist', () => {
    const r = readRegistry(join(tmp, 'nope', 'REGISTRY.json'));
    expect(r.schema_version).toBe('1.0');
    expect(r.agents).toEqual([]);
  });

  it('reads an existing registry', () => {
    const path = join(tmp, 'REGISTRY.json');
    writeFileSync(path, JSON.stringify({
      schema_version: '1.0',
      agents: [{ agent_id: 'X', home: 'X', dir: '/X', registered_at: '2026-01-01T00:00:00Z' }],
    }));
    const r = readRegistry(path);
    expect(r.agents).toHaveLength(1);
    expect(r.agents[0].agent_id).toBe('X');
  });

  it('throws on malformed registry (missing agents array)', () => {
    const path = join(tmp, 'REGISTRY.json');
    writeFileSync(path, '{"schema_version": "1.0"}');
    expect(() => readRegistry(path)).toThrow(/malformed/);
  });
});

describe('registerAgent', () => {
  it('creates the registry on first registration', () => {
    const path = join(tmp, 'sub', 'REGISTRY.json');
    const result = registerAgent(path, { agent_id: 'X', home: 'X', dir: '/agents/X' });
    expect(result.created).toBe(true);
    expect(existsSync(path)).toBe(true);
    expect(result.registry.agents[0].agent_id).toBe('X');
  });

  it('is idempotent for the same agent_id+dir', () => {
    const path = join(tmp, 'REGISTRY.json');
    registerAgent(path, { agent_id: 'X', home: 'X', dir: '/agents/X' });
    const second = registerAgent(path, { agent_id: 'X', home: 'X', dir: '/agents/X' });
    expect(second.created).toBe(false);
    expect(second.registry.agents).toHaveLength(1);
  });

  it('throws on agent_id collision with different dir (Gap 7)', () => {
    const path = join(tmp, 'REGISTRY.json');
    registerAgent(path, { agent_id: 'X', home: 'X', dir: '/agents/X' });
    expect(() => registerAgent(path, { agent_id: 'X', home: 'X', dir: '/elsewhere/X' }))
      .toThrow(/already registered/);
  });

  it('throws on missing required fields', () => {
    const path = join(tmp, 'REGISTRY.json');
    expect(() => registerAgent(path, { agent_id: 'X' })).toThrow();
  });
});

describe('checkUnique', () => {
  it('returns ok for absent agent_id', () => {
    const r = checkUnique({ schema_version: '1.0', agents: [] }, 'X');
    expect(r.ok).toBe(true);
  });

  it('returns conflict for taken agent_id', () => {
    const reg = {
      schema_version: '1.0',
      agents: [{ agent_id: 'X', home: 'X', dir: '/X', registered_at: 't' }],
    };
    const r = checkUnique(reg, 'X');
    expect(r.ok).toBe(false);
    expect(r.conflict.agent_id).toBe('X');
  });

  it('treats same dir as ok (idempotent)', () => {
    const reg = {
      schema_version: '1.0',
      agents: [{ agent_id: 'X', home: 'X', dir: '/X', registered_at: 't' }],
    };
    expect(checkUnique(reg, 'X', '/X').ok).toBe(true);
    expect(checkUnique(reg, 'X', '/Y').ok).toBe(false);
  });
});

describe('deregisterAgent', () => {
  it('removes the agent and reports removed=true', () => {
    const path = join(tmp, 'REGISTRY.json');
    registerAgent(path, { agent_id: 'X', home: 'X', dir: '/X' });
    const r = deregisterAgent(path, 'X');
    expect(r.removed).toBe(true);
    expect(r.registry.agents).toEqual([]);
  });

  it('no-op when agent absent', () => {
    const path = join(tmp, 'REGISTRY.json');
    writeRegistry(path, { schema_version: '1.0', agents: [] });
    const r = deregisterAgent(path, 'nope');
    expect(r.removed).toBe(false);
  });
});

describe('findAgent', () => {
  it('returns the matching entry', () => {
    const reg = {
      schema_version: '1.0',
      agents: [{ agent_id: 'X', home: 'X', dir: '/X', registered_at: 't' }],
    };
    expect(findAgent(reg, 'X').dir).toBe('/X');
  });
  it('returns undefined for absent agent_id', () => {
    expect(findAgent({ schema_version: '1.0', agents: [] }, 'X')).toBeUndefined();
  });
});
