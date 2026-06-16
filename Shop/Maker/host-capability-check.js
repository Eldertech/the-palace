// Host Capability Check — the Maker's pre-dispatch reachability lookup.
//
// Reads the manifest at Shop/Maker/host-capability.json and answers
// `check(specialist)` for the dispatching host. The lesson encoded here is the
// 2026-05-10 Manim failure: a perfect brief and a perfect Specialist still
// die at install time when the dispatching host can't run the wrapped tool.
// Spend the intake on real work, not on a tool the host can never reach.
//
// See: Shop/Maker.md § Host Capability Check, Shop/Maker/host-capability.json.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MANIFEST = path.join(HERE, 'host-capability.json');

export const HOST_CLASSES = Object.freeze(['mac', 'sandbox', 'cloud', 'runpod']);

export function loadManifest(manifestPath = DEFAULT_MANIFEST) {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed.host_classes || !parsed.specialists) {
    throw new Error(`host-capability manifest at ${manifestPath} missing required keys`);
  }
  return parsed;
}

// The dispatching host is *always* mac or sandbox — the machine doing the
// dispatching. `cloud` is a service location reached *from* a host, never the
// host itself. An explicit override (option or SHOP_HOST_CLASS env) wins.
export function detectHost(options = {}) {
  const override = options.override ?? process.env.SHOP_HOST_CLASS;
  if (override) {
    if (override !== 'mac' && override !== 'sandbox') {
      throw new Error(`SHOP_HOST_CLASS=${override} invalid; dispatching host must be 'mac' or 'sandbox'`);
    }
    return override;
  }
  if (process.platform === 'darwin' && process.arch === 'arm64') return 'mac';
  return 'sandbox';
}

// Presence-of-credential check for Specialists whose hosts include 'cloud'.
// Cheap on purpose: the manifest doesn't (yet) declare *which* env var each
// cloud Specialist needs, so we accept any of a small known set plus a
// blanket SHOP_CLOUD_AVAILABLE=1 override for sessions where Loudon has
// confirmed the cloud half is live.
//
// 'FLUX (Hugging Face)' also accepts the cached huggingface token at
// ~/.cache/huggingface/token — the path `huggingface-cli login` writes to.
// The file check is host-gated: only consulted when the dispatching host is
// 'mac' (the file lives on Loudon's local machine). When simulating
// `host: 'sandbox'` the file lookup is skipped — otherwise running the
// sandbox-simulation tests on the real Mac would falsely report reachable.
function cloudKeyAvailable(specialist, host) {
  if (process.env.SHOP_CLOUD_AVAILABLE === '1') return true;
  const knownEnv = {
    'Midjourney':          ['MIDJOURNEY_TOKEN', 'MIDJOURNEY_API_KEY', 'MIDJOURNEY_SESSION'],
    'FLUX (Hugging Face)': ['HF_TOKEN', 'HUGGINGFACE_TOKEN', 'HUGGING_FACE_HUB_TOKEN'],
  };
  const envs = knownEnv[specialist] ?? [];
  if (envs.some((k) => process.env[k] && process.env[k].length > 0)) return true;
  // File-based fallback for HF, mac only.
  if (specialist === 'FLUX (Hugging Face)' && host === 'mac') {
    const tokenFile = path.join(os.homedir(), '.cache', 'huggingface', 'token');
    try {
      const stat = fs.statSync(tokenFile);
      if (stat.isFile() && stat.size > 0) return true;
    } catch { /* not present — fall through */ }
  }
  return false;
}

export function check(specialist, options = {}) {
  const manifest = options.manifest ?? loadManifest(options.manifestPath);
  const host = options.host ?? detectHost(options);
  const spec = manifest.specialists[specialist];
  if (!spec) {
    return {
      reachable: false,
      host,
      specialist,
      fallback: null,
      fallback_note: null,
      note: `Specialist '${specialist}' is not in the host-capability manifest. Add it before dispatching.`,
    };
  }
  const hosts = spec.hosts ?? [];
  const localReachable = hosts.includes(host);
  const cloudReachable = hosts.includes('cloud') && cloudKeyAvailable(specialist, host);
  if (localReachable || cloudReachable) {
    return {
      reachable: true,
      host,
      specialist,
      via: cloudReachable && !localReachable ? 'cloud' : host,
      fallback: spec.fallback ?? null,
      fallback_note: spec.fallback_note ?? null,
      note: null,
    };
  }
  // Not reachable. Surface the fallback so the Maker can substitute or stop.
  const reason = hosts.includes('cloud') && !cloudKeyAvailable(specialist, host)
    ? `cloud-only Specialist; no credential present (set SHOP_CLOUD_AVAILABLE=1 or a known env var to confirm)`
    : `not reachable from host '${host}' (allowed hosts: ${hosts.join(', ') || 'none'})`;
  return {
    reachable: false,
    host,
    specialist,
    fallback: spec.fallback ?? null,
    fallback_note: spec.fallback_note ?? null,
    note: reason,
  };
}

// Tiny CLI for ad-hoc operator use:
//   node host-capability-check.js Manim\ CE
//   SHOP_HOST_CLASS=sandbox node host-capability-check.js Manim\ CE
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const specialist = process.argv.slice(2).join(' ').trim();
  if (!specialist) {
    console.error('Usage: node host-capability-check.js <Specialist Name>');
    process.exit(2);
  }
  const result = check(specialist);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.reachable ? 0 : 1);
}
