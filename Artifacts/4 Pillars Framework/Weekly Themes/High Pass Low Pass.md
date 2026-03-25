---
title: High Pass Low Pass
type: concept
pillars:
  - creation
  - tools
  - philosophy
  - practice
born: 2026-03
stage: mature
last_activated: 2026-03
activation_count: 1
confidence: established
energy: very high
hook_quality: 10
beauty: 9
who_leads: shared
links:
  - target: "[[Weekly Themes Database]]"
    type: connects-to
  - target: "[[Lao Tzu]]"
    type: deepens
  - target: "[[FOUR PILLARS]]"
    type: exemplifies
---

# High Pass Low Pass
## What You Remove Defines What Remains

**Week 4 Theme** | **Difficulty:** Fundamental | **Philosopher:** Lao Tzu

A high-pass filter removes lows. A low-pass filter removes highs. But filtering isn't about what you cut—it's about revealing what was always there. Lao Tzu wrote: *"We shape clay into a pot, but it is the emptiness inside that holds whatever we want."* The cut is the point. What remains is what you chose to keep.

## The Four Pillars Integration

### Creation (Music Production)
**Assignment:** Create three tracks using only filters—no additive processing.

**Track 1: Subtractive Reveal**
- Start with white noise (contains all frequencies)
- Using only filters, carve out a melody, bassline, and rhythm
- No synthesis, no samples—just filtering noise
- Notice: You're not adding—you're revealing what was always there

**Track 2: The Missing Frequencies**
- Make a full arrangement (drums, bass, melody, pads)
- Then: high-pass everything above 200Hz
- What remains? What do you miss?
- Repeat: low-pass everything below 4kHz
- Notice: How does absence define presence?

**Track 3: Filter as Composition**
- One static sound source (drone, held note, or loop)
- Compose by automating filters only
- Filter cutoff, resonance, and type are your only variables
- Notice: Can you create movement, tension, and release through subtraction alone?

**Technical Focus:**
- Filter types (Butterworth, Chebyshev, Linkwitz-Riley)
- Filter slopes (6dB/oct, 12dB/oct, 24dB/oct, 48dB/oct)
- Resonance and self-oscillation
- Series vs. parallel filtering
- The relationship between filter frequency and musical pitch

### Tools (Max/MSP Technology)
**Build:** Negative space visualizer

**The Concept:**
A patch that shows what you're removing, not what you're keeping. Most spectrum analyzers show you what's there. This one shows you what's absent.

**The Patch:**
```
[adc~]  ← Input signal
    |
[fft~]  ← Frequency analysis
    |
    ├─[cartopol~]  ← Convert to magnitude
    |      |
    |  [!- 1.]  ← Invert (1 - magnitude = absence)
    |      |
    |  [clip~ 0. 1.]
    |      |
    └─[matrix~]  ← Visual display
         |
    [jit.pwindow]  ← Show the absence, not the presence

Visualization options:
- Black = frequencies present
- White = frequencies absent
- Result: See the sculpture, not the clay
```

**The Practice:**
1. Play a full mix through the patch
2. Watch the absence visualization
3. Sweep a hi-pass filter up
4. The white areas grow (more absence)
5. Ask: What did I choose to keep?

**The Insight:**
Lao Tzu: *"Thirty spokes share the wheel's hub; it is the center hole that makes it useful."* The filter's usefulness is in what it removes, not what it passes.

### Philosophy (Taoist Practice)
**Reading:** Lao Tzu - *Tao Te Ching* (Chapters 11, 28, and 48)

**Key Quotes:**
> "We shape clay into a pot, but it is the emptiness inside that holds whatever we want." —Chapter 11

> "In the pursuit of learning, every day something is acquired. In the pursuit of Tao, every day something is dropped." —Chapter 48

> "The Tao is like a bellows: empty, yet infinitely capable. The more you use it, the more it produces." —Chapter 5

**Applied to Filtering:**
Western approach to music production: "What should I add?"
Taoist approach: "What should I remove?"

The beginner adds:
- More layers
- More effects
- More automation
- More, more, more

The expert removes:
- Muddy frequencies
- Unnecessary elements
- Complexity that obscures
- Everything that isn't essential

Lao Tzu teaches **wu wei** (effortless action). Not laziness—perfectly calibrated minimum. In mixing: no frequency is there unless it *needs* to be there.

**The Practice of Removal:**
1. Make a busy mix (10+ elements, lots of overlap)
2. Hi-pass each element to minimum necessary low end
3. Low-pass each element to maximum useful high end
4. What's left? Only what's essential
5. Lao Tzu: This is wu wei—everything working, nothing wasted

**Discussion Questions:**
- When does "more" become "mud"?
- Can you describe your mix by what's NOT there?
- What would it mean to mix by subtraction, not addition?

### Practice (Creative Wellbeing)
**Daily Practice:** The subtraction journal

**The Practice:**
Each morning, write:
1. **What I will NOT do today:** (3 things)
2. **What space this creates:** (for each item)
3. **What I will do with that space:** (one intentional thing)

**Example:**
1. **Will not:** Check Instagram before 10am, start 3 new projects, work past 6pm
2. **Space created:** 30 minutes in morning, focused energy, evening family time
3. **Will do:** Morning walk, finish current track, cook dinner with Emily

**Why This Connects:**
Lao Tzu: *"To attain knowledge, add things every day. To attain wisdom, subtract things every day."*

High-pass filter: Remove low frequencies → Create space for clarity
Low-pass filter: Remove high frequencies → Create space for warmth
Subtraction journal: Remove distractions → Create space for intention

**Weekly Reflection:**
"What did I choose to cut this week? What did that reveal?"

Count the cuts, not the additions. Track what you removed from:
- Your schedule
- Your projects
- Your mixes
- Your attention

**The Taoist Goal:** Arrive at simplicity not through deprivation, but through skillful removal of the unnecessary.

## Cross-Domain Resonance

### Filtering ↔ Sculpture
Michelangelo (possibly apocryphal): *"The sculpture is already complete within the marble block, before I start my work. It is already there, I just have to chisel away the superfluous material."*

High-pass the marble: Remove everything that isn't David.

**The Method:**
- Sculptor: Sees final form, removes everything else
- Producer: Hears final mix, filters everything else
- Writer: Knows the point, cuts everything else
- Designer: Understands the function, removes decoration

Lao Tzu calls this *fan* (returning). Not creating, but revealing what was always there.

### High Pass ↔ Low Pass ↔ Personality Types
**High-pass thinking:**
- Cuts the rumble, keeps the clarity
- Detail-oriented, analytical
- Sees the trees (misses the forest)
- Risk: Over-bright, fatiguing

**Low-pass thinking:**
- Cuts the harshness, keeps the warmth
- Big-picture, intuitive
- Sees the forest (misses the trees)
- Risk: Dull, muddy

**Balanced:**
- Knows what to cut from where
- Can zoom in (high-pass detail) and out (low-pass overview)
- This is *zhongyong* (the Doctrine of the Mean)—Confucian balance through Taoist subtraction

### Filter Cutoff ↔ Attention Threshold
**In mixing:**
- Set high-pass too low: Mud
- Set high-pass too high: Thin
- Set it right: Clear

**In life:**
- Attention threshold too low: Everything seems important (overwhelm)
- Attention threshold too high: Nothing seems important (apathy)
- Set it right: Only what matters gets through

Lao Tzu: *"The Tao is like a well: used but never used up."* Your attention is like that—if you filter out the noise, it never depletes.

## Teaching Notes

### Common Student Insights
- "I always thought EQ was about boost. Now I see it's about cut."
- "The white noise track taught me I'm adding too much."
- "Subtracting from my schedule made me more productive than adding more work hours."

### Common Struggles
- **Additive bias:** "If it's not loud enough, turn it up" (instead of: turn everything else down)
- **Fear of cutting:** "What if I need those frequencies?" (Taoist response: then you'll add them back)
- **All or nothing:** High-passing at extreme settings (nuance is the practice)

### The Breakthrough Moment
When a student says: *"I spent an hour trying to make the kick sound better. Then I just hi-passed the bass and suddenly the kick was perfect."*

That's wu wei. The kick was always perfect. The mud was hiding it.

## Extensions & Variations

### For Advanced Students
- Make a track using only one oscillator and filters (pure subtractive synthesis)
- Analyze a favorite mix: what's been cut? (Harder to hear than what's boosted)
- Build a Max patch that auto-removes the most present frequency band (forces constant subtraction)

### For Beginners
- Take an existing mix, duplicate it, high-pass everything +100Hz. Compare.
- Make a beat from filtered noise (no drums, just noise + filters)
- Practice the subtraction journal for 30 days

### Integration with Other Themes
- Connects to "Sidechain Compression" (removal creates space for dialogue)
- Connects to "The Mix as Architecture" (what you remove defines the structure)
- Connects to "Saturation and Harmonic Distortion" (opposite approach—addition through generation)

## Resources

**Music to Study:**
- Alva Noto - "Xerrox" series (filtering as primary compositional tool)
- Autechre - "Gantz Graf" (aggressive filtering, movement through subtraction)
- Ryuichi Sakamoto - "async" (space defined by absence)

**Musical Reading:**
- David Gibson - *The Art of Mixing* (Chapter on EQ philosophy)
- Bob Katz - *Mastering Audio* (Section on subtractive vs. additive EQ)

**Philosophical Reading:**
- Lao Tzu - *Tao Te Ching*, complete (Stephen Mitchell translation recommended)
- Alan Watts - *Tao: The Watercourse Way* (Western explanation of Taoist principles)
- Chuang Tzu - *The Inner Chapters* (Section on "The Useless Tree")

**Further Exploration:**
- Filter topology and design (Moog ladder, state variable, comb filters)
- Subtractive synthesis history (minimoog, ARP, Roland)
- Taoist aesthetics in art and design (wabi-sabi, ma, negative space)

## Success Metrics (By Our Definition)

**Not:** "Did I use filters correctly?"
**But:**
- Can you describe a mix by what's NOT there?
- Do you default to cutting before boosting?
- Are you practicing subtraction in other areas of life?
- Do you understand removal as revelation, not deprivation?

If yes to these: **the theme succeeded**, regardless of the final sound.

---

*The empty pot holds water. The empty room holds presence. The filtered mix holds clarity. Wu wei: Do less, achieve more. Cut wisely. What remains is what you chose.*
