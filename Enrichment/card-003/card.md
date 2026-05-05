---
target_name: "Piano String Inharmonicity"
target_path: "Projects/Piano String Inharmonicity.md"
purpose: "showing the concept made tangible"
fv: "I want to become an interactive teaching artifact — the HTML version that the inline comment imagines, where the inharmonicity formula is not just displayed but playable."
summary: "Type: concept. Stage: growing. The entry holds the formula fₙ = n·f₀·√(1+B·n²) but has no visual that makes the formula's behavior visible at a glance. Its forward vector explicitly asks for an audible proof that makes the formula unforgettable; this card offers a first visual proof, a step shy of the full interactive."
reasoning: "An interactive HTML synth is the right north star but too large for a 60-minute artifact. A static SVG is the cheaper, durable lower bound: three rows of partials at three values of B, with ghost lines marking where the harmonic series would have been. The eye follows the drift right-and-up in a single glance — high partials, more stiffness, more sharpness. This is the kind of figure that could live near the formula in the entry's body and stop a reader from skimming past the equation."
created: "2026-05-05"
artifact_path: "stretched-partials.svg"
artifact_type: "image"
---

A static-but-readable diagram of the inharmonicity formula's effect: three rows of partials for f₀ = 220 Hz (A3), n = 1..12, with B ∈ {0, 0.0004, 0.001}. Ghost lines on rows 2 and 3 mark where each partial *would* have been at B = 0, so the drift is visible without needing to compare rows. The number to read out: at n = 12 with B = 0.001, the partial sits 184 Hz sharp of its harmonic position. That number is the lesson.
