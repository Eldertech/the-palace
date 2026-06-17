// Cross-language parity: the JS mirror reproduces the Python-generated golden fixtures EXACTLY.
// This is the real "both speak one skeleton" guarantee. Run:  node test_staging_skeleton.js
const fs = require("fs"), path = require("path");
const S = require("./staging_skeleton.js");
const DOC = JSON.parse(fs.readFileSync(path.join(__dirname, "staging-skeleton.fixtures.json"), "utf8"));

function close(a, b, tol = 1e-9) {
  if (typeof a === "boolean" || typeof b === "boolean") return a === b;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= tol;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => close(x, b[i], tol));
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => k in b && close(a[k], b[k], tol));
  }
  return a === b;
}

let fails = 0;
for (const c of DOC.cases) {
  const kp = c.keypoints;
  const checks = [
    ["frame_authored", S.stagingFrame(kp, c.authored_facing), c.frame_authored],
    ["frame_estimated", S.stagingFrame(kp, null), c.frame_estimated],
    ["facing_estimate", S.facingFromKeypoints(kp), c.facing_estimate],
  ];
  for (const [label, got, exp] of checks) {
    if (!close(got, exp)) { fails++; console.log(`FAIL ${c.name} ${label}\n  got ${JSON.stringify(got)}\n  exp ${JSON.stringify(exp)}`); }
  }
}
console.log(`JS ${fails === 0 ? "PASS" : "FAIL"} — ${DOC.cases.length} cases, ${fails} mismatch(es)`);
process.exit(fails ? 1 : 0);
