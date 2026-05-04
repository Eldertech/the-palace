// registry.js — REGISTRY.json read/write/check for permanent agent uniqueness.
//
// Closes Gap 7: agent_id uniqueness check on permanent-agent spawn.
// Registry lives at `_ops/agents/permanent/REGISTRY.json` and is the single
// source of truth for which permanent agents exist.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REGISTRY_SCHEMA_VERSION = '1.0';

/**
 * Default empty registry shape.
 */
function emptyRegistry() {
  return { schema_version: REGISTRY_SCHEMA_VERSION, agents: [] };
}

/**
 * Read the registry from disk. Returns the empty registry if the file does not
 * exist (first-time spawn).
 *
 * @param {string} path
 * @returns {{ schema_version: string, agents: Array<{agent_id, home, dir, registered_at}> }}
 */
export function readRegistry(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) {
    return emptyRegistry();
  }
  const text = readFileSync(abs, 'utf8');
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.agents)) {
    throw new Error(`REGISTRY.json at ${abs} is malformed (missing "agents" array)`);
  }
  if (!parsed.schema_version) {
    parsed.schema_version = REGISTRY_SCHEMA_VERSION;
  }
  return parsed;
}

/**
 * Write the registry to disk, creating parent directories if needed.
 *
 * @param {string} path
 * @param {object} registry
 */
export function writeRegistry(path, registry) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(registry, null, 2) + '\n', 'utf8');
}

/**
 * Look up an agent by agent_id. Returns undefined if not present.
 *
 * @param {object} registry
 * @param {string} agentId
 */
export function findAgent(registry, agentId) {
  return registry.agents.find((a) => a.agent_id === agentId);
}

/**
 * Check whether an agent_id is unique against the registry. If `dir` is also
 * provided, the existing entry is allowed to match if its `dir` is the same
 * (idempotent re-registration of the same agent directory).
 *
 * @returns {{ ok: true } | { ok: false, conflict: object }}
 */
export function checkUnique(registry, agentId, dir) {
  const existing = findAgent(registry, agentId);
  if (!existing) return { ok: true };
  if (dir && existing.dir === dir) return { ok: true };
  return { ok: false, conflict: existing };
}

/**
 * Register a new permanent agent. Throws if the agent_id is already taken by
 * a different directory. Idempotent if the same agent_id+dir is re-registered.
 *
 * @param {string} registryPath
 * @param {{ agent_id: string, home: string, dir: string }} entry
 * @returns {{ created: boolean, registry: object }}
 */
export function registerAgent(registryPath, entry) {
  if (!entry || !entry.agent_id || !entry.home || !entry.dir) {
    throw new Error('registerAgent requires { agent_id, home, dir }');
  }
  const registry = readRegistry(registryPath);
  const check = checkUnique(registry, entry.agent_id, entry.dir);
  if (!check.ok) {
    const c = check.conflict;
    throw new Error(
      `agent_id "${entry.agent_id}" is already registered at "${c.dir}" (registered ${c.registered_at}).`
      + ` Refusing to register a different directory ("${entry.dir}") under the same agent_id.`
    );
  }
  const existing = findAgent(registry, entry.agent_id);
  if (existing) {
    return { created: false, registry };
  }
  registry.agents.push({
    agent_id: entry.agent_id,
    home: entry.home,
    dir: entry.dir,
    registered_at: new Date().toISOString(),
  });
  writeRegistry(registryPath, registry);
  return { created: true, registry };
}

/**
 * Deregister an agent by agent_id. No-op if absent.
 */
export function deregisterAgent(registryPath, agentId) {
  const registry = readRegistry(registryPath);
  const before = registry.agents.length;
  registry.agents = registry.agents.filter((a) => a.agent_id !== agentId);
  const removed = before !== registry.agents.length;
  if (removed) writeRegistry(registryPath, registry);
  return { removed, registry };
}
