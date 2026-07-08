// manifest.js — load + validate orchestrator manifests.
//
// Implements the manifest from the Palace Orchestrator entry (Definitions of
// record) with the v0.1 amendments:
//   - Gap 1: `session_id` is nullable for `long_duration_background` mode;
//            permanent agents may carry `cycle_id` instead.
//   - Gap 2: `blackboard_session_path` is ignored when mode is
//            `long_duration_background` (may be null or omitted).
//   - Finding 11: `agent_id` defaults to `manifest.home` when absent or empty.
//   - Modes shipped in v0.1: `songline`, `long_duration_background`.
//
// The validator is pure: it never mutates the input. `loadManifest` returns
// a normalized copy with v0.1 defaults applied (agent_id defaulting to home).

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const SUPPORTED_MODES = new Set([
  'songline',
  'long_duration_background',
]);

const REQUIRED_TOP_LEVEL = ['home', 'mode', 'model', 'tool_registry', 'stopping_conditions'];

/**
 * Validate a manifest object. Pure function — does not mutate.
 *
 * Returns { valid: true, normalized } on success (normalized = manifest with
 * v0.1 defaults applied: agent_id defaulted to home if missing).
 *
 * Returns { valid: false, errors: [...] } on failure.
 *
 * @param {unknown} manifest
 */
export function validateManifest(manifest) {
  const errors = [];

  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { valid: false, errors: [{ path: '', message: 'manifest must be a plain object' }] };
  }

  // Required top-level fields.
  for (const field of REQUIRED_TOP_LEVEL) {
    if (!(field in manifest) || manifest[field] === null || manifest[field] === undefined) {
      errors.push({ path: field, message: `required field "${field}" is missing` });
    }
  }

  // home: non-empty string
  if ('home' in manifest && manifest.home !== null && manifest.home !== undefined) {
    if (typeof manifest.home !== 'string' || manifest.home.trim() === '') {
      errors.push({ path: 'home', message: '"home" must be a non-empty string (the page title)' });
    }
  }

  // mode enum
  if ('mode' in manifest && manifest.mode !== null && manifest.mode !== undefined) {
    if (typeof manifest.mode !== 'string' || !SUPPORTED_MODES.has(manifest.mode)) {
      errors.push({
        path: 'mode',
        message: `mode must be one of: ${[...SUPPORTED_MODES].join(', ')}; got "${manifest.mode}"`,
      });
    }
  }

  // agent_id is optional in input — defaults to home (Finding 11). If present, must be non-empty string.
  if ('agent_id' in manifest && manifest.agent_id !== null && manifest.agent_id !== undefined) {
    if (typeof manifest.agent_id !== 'string' || manifest.agent_id.trim() === '') {
      errors.push({ path: 'agent_id', message: '"agent_id" when present must be a non-empty string' });
    }
  }

  // model: object with provider, name, endpoint
  if ('model' in manifest && manifest.model !== null && manifest.model !== undefined) {
    const m = manifest.model;
    if (typeof m !== 'object' || Array.isArray(m)) {
      errors.push({ path: 'model', message: '"model" must be a plain object with provider, name, endpoint' });
    } else {
      for (const k of ['provider', 'name', 'endpoint']) {
        if (typeof m[k] !== 'string' || m[k].trim() === '') {
          errors.push({ path: `model.${k}`, message: `"model.${k}" must be a non-empty string` });
        }
      }
    }
  }

  // tool_registry: array of strings
  if ('tool_registry' in manifest && manifest.tool_registry !== null && manifest.tool_registry !== undefined) {
    if (!Array.isArray(manifest.tool_registry)) {
      errors.push({ path: 'tool_registry', message: '"tool_registry" must be an array of strings' });
    } else {
      manifest.tool_registry.forEach((t, i) => {
        if (typeof t !== 'string' || t.trim() === '') {
          errors.push({ path: `tool_registry[${i}]`, message: 'tool name must be a non-empty string' });
        }
      });
    }
  }

  // stopping_conditions: object with max_iterations + stop_on
  if ('stopping_conditions' in manifest && manifest.stopping_conditions !== null && manifest.stopping_conditions !== undefined) {
    const sc = manifest.stopping_conditions;
    if (typeof sc !== 'object' || Array.isArray(sc)) {
      errors.push({ path: 'stopping_conditions', message: '"stopping_conditions" must be a plain object' });
    } else {
      if (typeof sc.max_iterations !== 'number' || !Number.isInteger(sc.max_iterations) || sc.max_iterations < 1) {
        errors.push({ path: 'stopping_conditions.max_iterations', message: 'must be a positive integer' });
      }
      if (!Array.isArray(sc.stop_on)) {
        errors.push({ path: 'stopping_conditions.stop_on', message: 'must be an array of stop-condition names' });
      }
    }
  }

  // session_id: required for songline; nullable for long_duration_background (Gap 1).
  // For songline, must be a non-empty string. For permanent, may be null/missing
  // when cycle_id is present.
  const mode = manifest.mode;
  if (mode === 'songline') {
    if (manifest.session_id === null || manifest.session_id === undefined) {
      errors.push({ path: 'session_id', message: 'songline manifests require "session_id"' });
    } else if (typeof manifest.session_id !== 'string' || manifest.session_id.trim() === '') {
      errors.push({ path: 'session_id', message: '"session_id" must be a non-empty string for songline mode' });
    }
  } else if (mode === 'long_duration_background') {
    // session_id may be null, missing, or a string
    if ('session_id' in manifest && manifest.session_id !== null && manifest.session_id !== undefined) {
      if (typeof manifest.session_id !== 'string' || manifest.session_id.trim() === '') {
        errors.push({ path: 'session_id', message: '"session_id" when present must be a non-empty string' });
      }
    }
    // cycle_id is optional but if present must be a non-empty string
    if ('cycle_id' in manifest && manifest.cycle_id !== null && manifest.cycle_id !== undefined) {
      if (typeof manifest.cycle_id !== 'string' || manifest.cycle_id.trim() === '') {
        errors.push({ path: 'cycle_id', message: '"cycle_id" when present must be a non-empty string' });
      }
    }
  }

  // blackboard_persistent_path: required non-empty string
  if (!('blackboard_persistent_path' in manifest)
      || manifest.blackboard_persistent_path === null
      || manifest.blackboard_persistent_path === undefined) {
    errors.push({
      path: 'blackboard_persistent_path',
      message: 'required field "blackboard_persistent_path" is missing',
    });
  } else if (typeof manifest.blackboard_persistent_path !== 'string' || manifest.blackboard_persistent_path.trim() === '') {
    errors.push({
      path: 'blackboard_persistent_path',
      message: '"blackboard_persistent_path" must be a non-empty string',
    });
  }

  // blackboard_session_path: ignored for long_duration_background (Gap 2);
  // for songline, if present it must be either null or a non-empty string.
  if ('blackboard_session_path' in manifest
      && manifest.blackboard_session_path !== null
      && manifest.blackboard_session_path !== undefined) {
    if (typeof manifest.blackboard_session_path !== 'string' || manifest.blackboard_session_path.trim() === '') {
      errors.push({
        path: 'blackboard_session_path',
        message: '"blackboard_session_path" when present must be a non-empty string',
      });
    }
  }

  // neighborhood: optional. May be a string OR an array of strings.
  if ('neighborhood' in manifest && manifest.neighborhood !== null && manifest.neighborhood !== undefined) {
    const n = manifest.neighborhood;
    if (typeof n === 'string') {
      // ok — single neighborhood label
    } else if (Array.isArray(n)) {
      n.forEach((entry, i) => {
        if (typeof entry !== 'string' || entry.trim() === '') {
          errors.push({ path: `neighborhood[${i}]`, message: 'neighborhood entry must be a non-empty string' });
        }
      });
    } else {
      errors.push({ path: 'neighborhood', message: '"neighborhood" must be a string or array of strings' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build normalized copy with v0.1 defaults applied.
  const normalized = { ...manifest };
  if (!normalized.agent_id || (typeof normalized.agent_id === 'string' && normalized.agent_id.trim() === '')) {
    normalized.agent_id = manifest.home;
  }
  return { valid: true, normalized };
}

/**
 * Load a manifest from the filesystem and validate it.
 *
 * @param {string} path — absolute or cwd-relative path
 * @returns {{ valid: true, normalized, raw, path } | { valid: false, errors, raw, path }}
 */
export function loadManifest(path) {
  const abs = resolve(path);
  const text = readFileSync(abs, 'utf8');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { valid: false, errors: [{ path: '', message: `manifest is not valid JSON: ${e.message}` }], raw: null, path: abs };
  }
  const result = validateManifest(raw);
  if (!result.valid) {
    return { valid: false, errors: result.errors, raw, path: abs };
  }
  return { valid: true, normalized: result.normalized, raw, path: abs };
}
