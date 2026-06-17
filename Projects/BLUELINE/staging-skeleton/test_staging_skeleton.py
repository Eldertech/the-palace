"""Regression guard: the Python reference reproduces staging-skeleton.fixtures.json.
Run:  python test_staging_skeleton.py"""
import json, os, sys
import staging_skeleton as S

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = json.load(open(os.path.join(HERE, "staging-skeleton.fixtures.json")))

def close(a, b, tol=1e-9):
    if isinstance(a, bool) or isinstance(b, bool): return a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)): return abs(a-b) <= tol
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(close(x, y, tol) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(close(a[k], b[k], tol) for k in a)
    return a == b

fails = 0
for c in DOC["cases"]:
    kp = c["keypoints"]
    got_auth = S.staging_frame(kp, c["authored_facing"])
    got_est  = S.staging_frame(kp, None)
    got_fac  = S.facing_from_keypoints(kp)
    for label, got, exp in (("frame_authored", got_auth, c["frame_authored"]),
                             ("frame_estimated", got_est, c["frame_estimated"])):
        if not close(got, exp):
            fails += 1; print(f"FAIL {c['name']} {label}\n  got {got}\n  exp {exp}")
    if not close(got_fac, c["facing_estimate"]):
        fails += 1; print(f"FAIL {c['name']} facing_estimate got {got_fac} exp {c['facing_estimate']}")

print(f"PY {'PASS' if fails==0 else 'FAIL'} — {len(DOC['cases'])} cases, {fails} mismatch(es)")
sys.exit(1 if fails else 0)
