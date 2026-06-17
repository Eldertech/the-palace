// staging_skeleton — ONE skeleton for BLUELINE (JS mirror of staging_skeleton.py).
//
// The author-facing STAGING FRAME (shoulder-shoulder-pelvis triangle, chest-facing tick, L/R handedness)
// is a PURE FUNCTION of canonical COCO-18 OpenPose keypoints. We never invent a keypoint the ControlNet
// wasn't trained on: the frame is a DERIVED VIEW; the emit to the render is canonical OpenPose
// (OPENPOSE_LIMBS / OPENPOSE_COLORS), untouched. Validated against staging-skeleton.fixtures.json — this
// file must reproduce frame_* and facing_estimate EXACTLY (same r4 rounding) as the Python reference.
//
// Use in the browser:  <script src="staging_skeleton.js"></script>  ->  window.StagingSkeleton
// Use in Node:         const S = require('./staging_skeleton.js')
(function (root, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = mod;
  if (typeof globalThis !== "undefined") globalThis.StagingSkeleton = mod;
})(this, function () {
  "use strict";

  const IDX = {nose:0,neck:1,r_sho:2,r_elb:3,r_wri:4,l_sho:5,l_elb:6,l_wri:7,
               r_hip:8,r_kne:9,r_ank:10,l_hip:11,l_kne:12,l_ank:13,r_eye:14,l_eye:15,r_ear:16,l_ear:17};

  const OPENPOSE_LIMBS = [[1,2],[1,5],[2,3],[3,4],[5,6],[6,7],[1,8],[8,9],[9,10],
                          [1,11],[11,12],[12,13],[1,0],[0,14],[14,16],[0,15],[15,17]];
  const OPENPOSE_COLORS = [[255,0,0],[255,85,0],[255,170,0],[255,255,0],[170,255,0],[85,255,0],[0,255,0],
                           [0,255,85],[0,255,170],[0,255,255],[0,170,255],[0,85,255],[0,0,255],[85,0,255],
                           [170,0,255],[255,0,255],[255,0,170],[255,0,85]];

  const R_SIDE = [2,3,4,8,9,10];     // char RIGHT -> green
  const L_SIDE = [5,6,7,11,12,13];   // char LEFT  -> coral
  function lrSide(idx){ return R_SIDE.indexOf(idx)>=0 ? "R" : (L_SIDE.indexOf(idx)>=0 ? "L" : "C"); }

  const FRONT_SHOULDER_RATIO = 0.42; // mannequin-calibrated front shoulder span (see .py)

  // identical rounding to the Python r4: sign * floor(|x|*1e4 + 0.5)/1e4
  const r4 = x => (x>=0?1:-1) * Math.floor(Math.abs(x)*1e4 + 0.5) / 1e4;

  function p(kp, i){ const v = (i in kp) ? kp[i] : kp[String(i)]; return [ +v[0], +v[1] ]; }
  const mid = (a,b) => [ (a[0]+b[0])/2, (a[1]+b[1])/2 ];
  const sub = (a,b) => [ a[0]-b[0], a[1]-b[1] ];
  function norm(v){ const d = Math.hypot(v[0],v[1]) || 1; return [ v[0]/d, v[1]/d ]; }
  const r4p = q => [ r4(q[0]), r4(q[1]) ];

  // ESTIMATE chest yaw in [-1..+1] from a 2D/projected skeleton (front/back ambiguous; for the diff, not
  // authoring). Mirror of facing_from_keypoints.
  function facingFromKeypoints(kp){
    const rs = p(kp,2), ls = p(kp,5);
    const pelvis = mid(p(kp,8), p(kp,11));
    const neck = p(kp,1);
    const scale = Math.hypot.apply(null, sub(neck, pelvis)) || 1;
    const span = (ls[0]-rs[0]) / scale;
    const frontality = Math.max(0, Math.min(1, Math.abs(span)/FRONT_SHOULDER_RATIO));
    const magv = 1 - frontality;
    const nose = p(kp,0), shMid = mid(rs, ls);
    const yawDir = (nose[0]-shMid[0]) / scale;
    const s = yawDir >= 0 ? 1 : -1;
    return r4(Math.max(-1, Math.min(1, s*magv)));
  }

  // Derive the author-facing staging frame from canonical COCO-18 keypoints. `facing` is AUTHORED when
  // given (animatic / board record), else ESTIMATED. Mirror of staging_frame.
  function stagingFrame(kp, facing){
    const rs = p(kp,2), ls = p(kp,5);
    const pelvis = mid(p(kp,8), p(kp,11));        // DERIVED mid-hip (the apex COCO-18 lacks)
    const neck = p(kp,1);
    const shMid = mid(rs, ls);
    let src = "authored";
    if (facing === undefined || facing === null){ facing = facingFromKeypoints(kp); src = "estimated"; }
    const f = Math.max(-1, Math.min(1, +facing));
    const tick = [ f, Math.sqrt(Math.max(0, 1 - f*f)) ];   // chest-normal, image space (+y down) — M2's convention
    const nose = p(kp,0);
    const earMid = mid(p(kp,16), p(kp,17));
    const head = norm(sub(nose, earMid));
    return {
      shoulder_R: r4p(rs), shoulder_L: r4p(ls),
      pelvis: r4p(pelvis), pelvis_derived: true,
      neck: r4p(neck), shoulder_mid: r4p(shMid),
      triangle: [ r4p(rs), r4p(ls), r4p(pelvis) ],
      facing: r4(f), facing_source: src,
      facing_tick: [ r4(tick[0]), r4(tick[1]) ],
      head: r4p(nose), head_facing: [ r4(head[0]), r4(head[1]) ],
      lr: { R: R_SIDE.slice(), L: L_SIDE.slice() },
    };
  }

  return { IDX, OPENPOSE_LIMBS, OPENPOSE_COLORS, R_SIDE, L_SIDE, FRONT_SHOULDER_RATIO,
           lrSide, r4, facingFromKeypoints, stagingFrame };
});
