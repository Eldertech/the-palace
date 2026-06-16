// Smoke tests for the host-capability check. Three assertions, taken straight
// from SHOP-BUILD-SESSION-2026-05-30.md Phase C:
//   - Manim is unreachable on `sandbox` and resolves to Matplotlib.
//   - p5.js is reachable on both mac and sandbox.
//   - Midjourney needs `cloud` (so it is unreachable from mac when no key).
//
// Run: node --test Artifacts/Shop/host-capability-check.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, detectHost, loadManifest, HOST_CLASSES } from './host-capability-check.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(HERE, 'host-capability.json');
const manifest = loadManifest(MANIFEST);

// Hermetic: stash any cloud env vars set in the live shell so the Midjourney
// test sees a clean no-key world. Restored at the end of each test.
// (The cached HF token at ~/.cache/huggingface/token is a SEPARATE FLUX
// reachability signal — tests that need a clean FLUX world should also use
// `host: 'sandbox'` to bypass it, since the file is mac-local.)
const cloudEnv = [
  'SHOP_CLOUD_AVAILABLE',
  'MIDJOURNEY_TOKEN', 'MIDJOURNEY_API_KEY', 'MIDJOURNEY_SESSION',
  'HF_TOKEN', 'HUGGINGFACE_TOKEN', 'HUGGING_FACE_HUB_TOKEN',
];
function withCleanCloud(fn) {
  const saved = Object.fromEntries(cloudEnv.map((k) => [k, process.env[k]]));
  cloudEnv.forEach((k) => { delete process.env[k]; });
  try { return fn(); }
  finally { cloudEnv.forEach((k) => { if (saved[k] !== undefined) process.env[k] = saved[k]; }); }
}

test('manifest declares the three host classes', () => {
  assert.deepEqual(Object.keys(manifest.host_classes).sort(), [...HOST_CLASSES].sort());
});

test('Manim CE on sandbox: unreachable, fallback is Matplotlib', () => {
  const r = check('Manim CE', { host: 'sandbox', manifest });
  assert.equal(r.reachable, false);
  assert.equal(r.fallback, 'Matplotlib');
  assert.match(r.note, /not reachable from host 'sandbox'/);
});

test('Manim CE on mac: reachable', () => {
  const r = check('Manim CE', { host: 'mac', manifest });
  assert.equal(r.reachable, true);
  assert.equal(r.via, 'mac');
});

test('p5.js is reachable on both mac and sandbox', () => {
  for (const host of ['mac', 'sandbox']) {
    const r = check('p5.js', { host, manifest });
    assert.equal(r.reachable, true, `p5.js should be reachable on ${host}`);
  }
});

test('Midjourney is deprecated; fallback now points to FLUX (Hugging Face)', () => {
  withCleanCloud(() => {
    const r = check('Midjourney', { host: 'mac', manifest });
    assert.equal(r.reachable, false);
    assert.equal(r.fallback, 'FLUX (Hugging Face)');
    assert.match(r.note, /cloud-only Specialist/);
  });
});

test('FLUX (Hugging Face) is unreachable from sandbox with no credential', () => {
  // Use sandbox host so the mac-local ~/.cache/huggingface/token file
  // check doesn't accidentally make it reachable in the live shell.
  withCleanCloud(() => {
    const r = check('FLUX (Hugging Face)', { host: 'sandbox', manifest });
    assert.equal(r.reachable, false);
    assert.equal(r.fallback, 'ComfyUI');
    assert.match(r.note, /cloud-only Specialist/);
  });
});

test('FLUX (Hugging Face) becomes reachable when HF_TOKEN is set', () => {
  withCleanCloud(() => {
    process.env.HF_TOKEN = 'hf_dummy_for_test';
    const r = check('FLUX (Hugging Face)', { host: 'sandbox', manifest });
    assert.equal(r.reachable, true);
    assert.equal(r.via, 'cloud');
  });
});

test('FLUX (Hugging Face) becomes reachable when SHOP_CLOUD_AVAILABLE=1', () => {
  withCleanCloud(() => {
    process.env.SHOP_CLOUD_AVAILABLE = '1';
    const r = check('FLUX (Hugging Face)', { host: 'sandbox', manifest });
    assert.equal(r.reachable, true);
    assert.equal(r.via, 'cloud');
  });
});

test('Unknown specialist surfaces a clean error, not a crash', () => {
  const r = check('Imaginary Smith', { host: 'mac', manifest });
  assert.equal(r.reachable, false);
  assert.match(r.note, /not in the host-capability manifest/);
});

test('detectHost honors SHOP_HOST_CLASS override', () => {
  const saved = process.env.SHOP_HOST_CLASS;
  try {
    process.env.SHOP_HOST_CLASS = 'sandbox';
    assert.equal(detectHost(), 'sandbox');
    process.env.SHOP_HOST_CLASS = 'mac';
    assert.equal(detectHost(), 'mac');
  } finally {
    if (saved === undefined) delete process.env.SHOP_HOST_CLASS;
    else process.env.SHOP_HOST_CLASS = saved;
  }
});
