# BLUELINE Mannequin Solution — Research & Proof Report
Date: 2026-06-26  
Blender: 5.1.2 (macOS)

## Options Table

| Candidate | Free | Scriptable Headless | Bundled | Reproducible | Verdict |
|-----------|------|---------------------|---------|--------------|---------|
| **Custom FK armature (Rigify proportions)** | Yes | YES | YES (pure bpy) | YES | **WINNER** |
| Rigify full rig generation | Yes | No — operator not available headless | Bundled | No | Skip |
| Human Base Meshes addon | Yes | Unknown — no rig | Bundled | No | Skip |
| OPii Rig (Gumroad) | Yes | Unknown | Download | No | Skip |
| Mr Mannequins Tools | Free | Unknown | Download | No | Skip |
| MB-Lab | Free | Partial | Download | No | Skip |
| Mixamo | Free | No — login + manual FBX | Browser | No | Skip |
| Auto-Rig Pro | Paid | Yes | Download | Yes | Skip (paid) |

## Winner: Custom FK Armature from Rigify Human-Metarig Proportions

Zero downloads. Zero addons. Pure bpy. Works with --factory-startup.

26 bones named exactly as the Rigify human metarig (thigh.L, shin.L, upper_arm.L, forearm.L, etc).
Bone head/tail coords extracted from /Applications/Blender.app/Contents/Resources/5.1/scripts/addons_core/rigify/metarigs/human.py.
1.98m figure, human proportions, FK only.

## Install Steps
None. Only needs Blender 5.1+ and pose_mannequin.py.

## Pose API
```python
POSE_EXAMPLE = {
    "upper_arm.L":  (-150, 0, -20),  # X=-150 lifts arm above shoulder
    "thigh.L":      (-45,  5,  -8),  # knee forward crouch
    "shin.L":       ( 80,  2,  -5),  # shin bends back
}
```
Bone dict -> (rx_deg, ry_deg, rz_deg) XYZ Euler in local bone frame.

## Rotation Calibration (empirically verified)
- upper_arm X=-150 raises hand to z=1.70 (above shoulder level at 1.58)
- upper_arm Z negative = arm splays outward; Z positive = inward
- thigh X negative = knee swings forward; shin X positive = shin bends back
- spine.006 X positive = head tilts forward; negative = head back/up
- For knee crouch: shin_X ≈ -(thigh_X * 1.8)

## Known Limits
1. Arm rest is diagonal (not straight sideways) — extreme poses like overhead need X ~ -150
2. Skin mesh uses per-bone cylinders; joint gaps visible but acceptable for ControlNet
3. FK only — no IK; set thigh + shin angles manually for crouch
4. Camera is hardcoded per pose label in add_camera(); extend for custom cams
5. Ground always at z=-0.01; remove for aerial poses

## File List
```
mannequin-solution/
├── pose_mannequin.py      ← master reusable recipe script
├── report.md              ← this file
└── renders/
    ├── pose_A/  ink_plate.png  depth_plate.png  openpose.png
    ├── pose_B/  ink_plate.png  depth_plate.png  openpose.png
    └── pose_C/  ink_plate.png  depth_plate.png  openpose.png
```

## Next Step
Add --pose-json CLI argument accepting arbitrary JSON pose dict so any BLUELINE session can drive poses without editing the script. Architecture already in place — one additional argparse + dict parse.
