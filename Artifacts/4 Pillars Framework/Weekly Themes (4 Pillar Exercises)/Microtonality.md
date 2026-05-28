---
title: Microtonality
type: theme
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
energy: high
hook_quality: 8
beauty: 8
who_leads: shared
week_number: 25
difficulty: deep
philosopher: Harry Partch
links:
  - target: "[[Weekly Themes Database]]"
    type: connects-to
    label: member-of
  - target: "[[FOUR PILLARS]]"
    type: connects-to
    label: exemplifies
---

# Microtonality
## The Notes Between the Notes

**Difficulty:** Deep | **Philosopher:** Harry Partch

In 1930, Harry Partch smashed a piano. Not dramatically, not in protest — methodically. He needed to remove it from his life. Partch had spent years studying the relationship between acoustic reality and Western tuning systems, and he had reached a conclusion that made the standard piano physically painful to be near: it was irretrievably wrong. The twelve equal semitones of the piano — 12-TET, twelve-tone equal temperament — were a 16th-century compromise, a way to allow keyboard instruments to play in any key without retuning, at the cost of every interval except the octave being slightly out of tune. Partch had studied Ptolemy's ancient Greek tuning systems, had analyzed the harmonic series, had built instruments from scratch to play the intervals that acoustic reality actually contains. The piano's equal-tempered major third (400 cents) deviates from the pure major third of the harmonic series (386 cents) by 14 cents — a difference that trained ears consistently perceive as a kind of tension, a not-quite-right that 12-TET listeners have learned to accept as just intonation. Partch wanted to stop accepting. He built a 43-tone-per-octave scale derived entirely from the ratios of the harmonic series — just intonation taken to its logical extreme — and then built the instruments to play it: the Adapted Viola, the Chromelodeon, the Spoils of War (a percussion instrument made of hub caps, artisan glass, and artillery shell casings), the Quadrangularis Reversum. He composed operas, chamber music, theatrical works — all requiring instruments that no one else had built and could not be approximated on existing ones. Partch's life is the most radical case study in music history of a person who followed an acoustic premise all the way to its conclusion regardless of practical consequence. But Partch is not the only entry point into microtonality. The world's musical traditions contain tuning systems that 12-TET excludes: the maqam of Arabic and Turkish music (including quarter tones and smaller), the ragas of Indian classical music (with their microtonal ornaments and precise intonation of specific pitches within specific ragas), the gamelan of Bali and Java (each gamelan tuned to its own system, no two alike). 12-TET is not the standard of pitch — it is one answer to a question that has many answers. This week you will build three tracks in which microtonality is the compositional foundation, build a microtonal tuning system and interface, and read Partch and the philosophers who have thought about what it means to inherit a tuning system — to be born into a particular acoustic world — without having chosen it.

## The Four Pillars Integration

### Creation (Music Production)
**Assignment:** Build three tracks in which microtonality is not decoration but foundation — tuning systems that open harmonic and melodic space that 12-TET cannot reach.

**Track 1: Just Intonation Harmony**
- Build a track using pure intervals from the harmonic series: the perfect fifth (3/2), the pure major third (5/4), the pure minor third (6/5), the seventh harmonic (7/4 — slightly flat of the 12-TET minor seventh), the eleventh harmonic (11/8 — slightly sharp of the 12-TET tritone).
- Use a tunable synthesizer (or pitch-bend automation) to set these intervals precisely. The seventh harmonic (7/4) is approximately 969 cents above the root; the 12-TET minor seventh is 1000 cents. The difference is 31 cents — audible, characteristic, alien to ears trained on equal temperament.
- Build a chord progression or melodic line that uses the seventh harmonic deliberately. Notice the emotional quality: the 7/4 has a different color than the 12-TET minor seventh — more resonant, less tense, acoustically settled.
- Notice: does just intonation feel "in tune" or "out of tune"? What reference frame are you using to answer that question?

**Track 2: Non-Western Scale System**
- Choose one non-Western tuning system: Turkish maqam (specifically maqam Rast or maqam Hijaz), Indian raga (raga Bhairav or raga Yaman), or gamelan slendro or pelog scale.
- Study the precise intervals of your chosen system. Implement them using pitch-bend automation, a microtonal MIDI plugin (Scala, Xenharmonic MIDI), or a tunable synthesizer.
- Compose a melody entirely within the chosen system, without defaulting to 12-TET patterns.
- Research the cultural and emotional associations of your chosen system: what contexts is this scale used in? What moods or occasions does it mark?
- Notice: can you hear the logic of a tuning system you did not grow up with? What does it take to let a new set of intervals feel natural rather than wrong?

**Track 3: Invented Tuning**
- Invent your own tuning system. Constraints: it must be logically derived (from ratios, from equal divisions of the octave other than 12, from a set of harmonic series partials) — not arbitrary.
- Options: 19-TET (19 equal steps per octave — has a very pure minor third), 31-TET (31 equal steps — very pure major third, close to meantone tuning), 7-limit just intonation (all intervals derived from primes 2, 3, 5, and 7).
- Name the intervals of your system. Identify which intervals in 12-TET each most closely corresponds to, and where your system diverges.
- Compose a 2-minute piece entirely in your invented system.
- Notice: how does a constraint — having defined the system — feel different from the infinite freedom of no tuning rule? Does the constraint enable creativity or limit it?

**Technical Focus:**
- Cents: the logarithmic unit of pitch measurement. 100 cents = one semitone; 1200 cents = one octave. All microtonal intervals can be expressed in cents. Pure major third = 386 cents; 12-TET major third = 400 cents. 14-cent difference.
- Pitch bend in MIDI: standard MIDI pitch bend covers ±2 semitones (200 cents) at maximum. For microtonal work, this range is usually extended to ±12 semitones (1200 cents) to enable full scale implementations. Most soft synths support this.
- Scala: a free software tool for defining, analyzing, and converting tuning systems. Used by microtonal composers worldwide. Can export tuning tables for hardware and software synthesizers.
- Xenharmonic MIDI plugins: several plugins (MTS-ESP, Oddsound) allow any DAW to use arbitrary tuning systems by retuning MIDI notes at the plugin level. Highly recommended for Track 2 and Track 3.

### Tools (Build With AI)

**Concept:** A microtonal keyboard interface — a browser-based instrument that allows you to define a custom tuning system (as a set of cent values for each scale degree) and play it on a visual keyboard, with a spectrum display showing the harmonic series of any played note alongside the intervals of your defined scale, so you can see which scale degrees align with the harmonic series and which deviate.

**Start here:** Ask an AI: *"Help me build a browser-based microtonal keyboard. I want to define a tuning system as a list of cent values for 12 scale degrees (default: 0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100 — standard 12-TET). Display these as a visual keyboard. When I play a note, show: (1) a spectrum display with the first 16 harmonics of the played fundamental marked as vertical lines, (2) lines marking where my scale degrees fall in the spectrum. I want to immediately see which scale degrees are harmonically aligned (close to a harmonic partial) and which are not. Add preset buttons for: 12-TET, Pythagorean tuning, 5-limit just intonation, and quarter-tone (24-TET). Add a text field where I can enter custom cent values."*

Use this tool while composing Track 1. Load the 5-limit just intonation preset and play the same major chord you know from 12-TET. Watch and hear the difference. Load the Pythagorean preset. Now play your Track 3 custom tuning and observe how it aligns with (or departs from) the harmonic series. This is Partch's method — acoustic reasoning made visible.

### Philosophy (Tuning as Worldview)
**Reading:** Harry Partch — *Genesis of a Music* (1949/1974), Chapters 1–4 (the historical and theoretical foundation); and Adriana Cavarero — *For More Than One Voice* (2005), the chapter on the voice as bodily resonance

**Key Context:**
Partch's central claim is not that just intonation is better than equal temperament — it is that equal temperament is a *historical choice* that has been naturalized into an apparent acoustic fact. Most Western listeners experience 12-TET as "in tune" and just intonation as "slightly off." Partch argues that this is the opposite of the acoustic truth: just intonation *is* the acoustic reality of the harmonic series; 12-TET is a deliberate, motivated deviation from it, accepted for practical reasons (keyboard transposability) and then forgotten as a choice.

**The Philosophical Claim:**
Tuning systems are inherited worldviews. To grow up in a culture means to inherit its pitch alphabet — to learn which intervals feel stable and which feel tense, which combinations feel "consonant" and which "dissonant." These judgments feel natural because they are learned so early and so thoroughly that they seem to be facts about sound rather than facts about culture. Partch's life's work was to un-learn his inherited tuning — to hear the harmonic series freshly, as if for the first time — and to rebuild a music on that fresh hearing.

**Cavarero's Parallel Claim:**
Adriana Cavarero argues that philosophy has always privileged the *content* of speech (the logos, the argument) over the *voice* that carries it — the bodily resonance, the timbre, the acoustic singularity of each human voice. Tuning systems are acoustic cultures: they determine which body-sounds are recognized as musical, which are heard as "in tune." A non-Western tuning system, heard through a 12-TET-trained ear, sounds "out of tune" not because it is acoustically inferior but because the listener's culture has not learned to hear its resonance as correct.

**Discussion Questions:**
- Is it possible to truly un-learn an inherited tuning system — to hear just intonation as "more in tune" rather than "differently tuned" after years of 12-TET conditioning? What would the process involve?
- Partch's instruments are not portable, require special performers, and cannot perform anyone else's music. He achieved absolute acoustic integrity at the cost of complete practical isolation. Is this a valid artistic choice? What does it tell us about the relationship between principle and practicality?
- The maqam tradition maintains hundreds of specific tuning systems, each with cultural, emotional, and formal associations accumulated over centuries. What is the relationship between a tuning system and the culture that developed it? Can a non-Arabic composer use maqam responsibly?

### Practice (Creative Wellbeing)
**Daily Practice:** Listen for intonation in the world

For one week, listen to naturally resonant sounds — instruments that are not forced into 12-TET: the human voice singing freely, a bowed string instrument in tune with itself, a brass player playing an open harmonic, a glass ringing after being struck.

**The Exercise:**
When you hear these sounds, notice whether they sound "in tune" relative to a 12-TET reference pitch you might be internally supplying. The harmonic series is everywhere in the acoustic world; 12-TET is only in instruments designed to enforce it. The world naturally produces just intonation.

**Weekly Reflection:**
"What do I inherit that I have not chosen? What acoustic, cultural, or conceptual systems feel like facts when they are actually historically specific choices? And what would I have to build — what instruments would I have to construct — to follow a different path to its conclusion?"

## Cross-Domain Resonance

### Microtonality ↔ Color Perception
The visual spectrum is continuous; the color words of any language divide it into discrete named categories. Different languages draw the boundaries differently: Russian has separate basic terms for light blue and dark blue; English has one word for both. Someone raised speaking Russian will perceive the boundary between two blues more sharply than an English speaker — not because their visual system is different, but because their language has made a categorical distinction where English has not. 12-TET is a set of color words for pitch: it has made 12 categories in a continuous acoustic spectrum. Microtonality asks: where else could we draw the lines?

### Microtonality ↔ Measurement Systems
The metric system and the imperial system are both valid ways to divide the continuous reality of physical length. Neither is more "natural" — both are historically specific. But growing up in one system makes the other feel awkward and wrong: a foot feels like something, a meter feels arbitrary (or vice versa). 12-TET is the imperial system of pitch: arbitrary in origin, naturalized through cultural saturation, difficult to think outside.

### Microtonality ↔ Grammar and Language
Linguistic relativity (the Sapir–Whorf hypothesis) suggests that the language you speak shapes the categories through which you perceive reality. Different languages have different numbers of tense categories, different markers for spatial relationships, different ways of encoding whether information is witnessed or hearsay. A tuning system is the grammar of acoustic space: it determines which pitch relationships are "the same" and which are "different," which transitions feel stable and which feel tense. To learn a new tuning system is to learn a new acoustic grammar.

## Teaching Notes

### Common Student Insights
- "I played a 7/4 seventh for the first time and it felt *settled* in a way that the 12-TET minor seventh doesn't. I've been hearing that minor seventh as 'nearly resolved' my whole life. The 7/4 *is* resolved. They're not the same interval."
- "Trying to compose in maqam Hijaz was genuinely difficult — not because the intervals are wrong, but because I kept defaulting to 12-TET melodic patterns. I didn't realize how deeply I'd internalized those patterns until they kept coming out of my hands."
- "Partch's story made me realize that I've never questioned the piano's tuning. It's just... the piano. But it's a specific historical choice with specific tradeoffs. That feels important."

### Common Struggles
- **The "out of tune" problem:** Students' first experience of just intonation is often disorientation — it sounds slightly wrong because they have been trained on 12-TET. The key reframe is: "this is not out of tune relative to 12-TET; 12-TET is out of tune relative to the harmonic series." This reframe is cognitive and requires time.
- **Technical implementation:** Getting precise microtonal intervals into a DAW requires either pitch-bend automation, a microtonal plugin, or a soft synth with tuning table support. Students need specific technical guidance on their chosen DAW before the creative work can begin.
- **Cultural sensitivity in Track 2:** Using a non-Western tuning system for one week is an introduction, not mastery. Students need to approach this with curiosity and respect, acknowledging that they are learning the surface of a tradition that represents centuries of development.

### The Breakthrough Moment
When a student tunes a major third to 5/4 (just intonation) and then returns to the 12-TET major third and hears — for the first time, sharply and clearly — the 14-cent deviation. The equal-tempered third no longer sounds "in tune." It sounds like what it is: a deliberate compromise. The student's acoustic world has shifted irreversibly.

## Extensions & Variations

### For Advanced Students
- Study Partch's *Delusion of the Fury* (1969): a full theatrical work in his 43-tone system. Read the score notes for instrument descriptions. Consider what it means to build an entire orchestral apparatus from scratch to follow an acoustic principle.
- Explore Arabic maqam theory: specifically the notation system for quarter-tones, the emotional associations (ethos) of different maqamat, and the rules of melodic movement within a maqam (which are not the same as Western scales). Study with recordings.
- Implement a 31-TET scale in a soft synth using Scala or an MTS-ESP plugin. Compose a short piece that uses 31-TET's particularly pure major third (approximately 387 cents, compared to 386 cents just) to demonstrate that equal temperament does not have to be 12-TET — it can approximate just intonation more accurately with more divisions.

### For Beginners
- Sing a major third against a tuned drone. Let the third "lock in" — find the beating-free point where the interval resonates without wavering. You are now singing just intonation. Now play the 12-TET major third. Compare. You have just heard the difference between the natural harmonic series and the tempered keyboard.
- Listen to La Monte Young's *The Well-Tuned Piano* (1973–present): a piano retuned to a just intonation system that Young has been refining for fifty years. The piece is up to 6 hours long in some performances. Listen to 20 minutes. Hear what a different tuning does to familiar piano timbres.
- Listen to a piece of Indian classical music (a raga performance, not a fusion piece). Listen specifically for the microtonal inflections in the melodic ornaments — the way a singer or sitar player approaches a specific pitch from above or below. These are not mistakes; they are structural and stylistically specific. You are hearing a precision that 12-TET notation cannot represent.

## Resources

**Music to Study:**
- Harry Partch - *Delusion of the Fury* (1969) (his final large work — theatrical, full instrumentation, 43 tones per octave)
- La Monte Young - *The Well-Tuned Piano* (1973–present) (just intonation piano — the tuning system as the composition)
- Ravi Shankar - *Chappaqua Suite* (1965) (sitar and orchestra — microtonal precision in the Indian classical context)
- Maqam Hijaz recordings — search specifically for Turkish classical or Arabic maqam performances, not fusion

**Musical Reading:**
- Harry Partch - *Genesis of a Music* (1949/1974) (the complete statement of his system — long, dense, essential)
- Marc Sabat & Wolfgang von Schweinitz - "The Extended Helmholtz-Ellis JI Pitch Notation" (notation systems for just intonation — a practical problem that reveals theoretical depth)

**Philosophical Reading:**
- Harry Partch - *Genesis of a Music*, Introduction and Chapter 1 (start here — a sharp, polemical statement of the problem)
- Adriana Cavarero - *For More Than One Voice* (2005) (philosophy of the voice as bodily resonance — connects tuning to embodiment and cultural identity)
- Harry Olson - *Music, Physics and Engineering* (1967) (the acoustics textbook that gives Partch's claims their scientific foundation)

**Further Exploration:**
- The history of equal temperament: when was 12-TET adopted, why, and who objected? The transition from meantone tuning to equal temperament in the 18th century was contested and gradual.
- The xenharmonic wiki: a community resource for microtonal composers, with tuning tables, instrument information, and composition resources
- Johnny Reinhard and the American Festival of Microtonal Music: the primary contemporary institution for microtonal performance in the United States

## Success Metrics (By Our Definition)

**Not:** "Can you use microtonal intervals in a track?"
**But:**
- Can you hear the difference between a 12-TET major third and a just-intonation major third? Can you identify which is "more resonant"?
- Do you understand 12-TET as a historical choice — with specific tradeoffs and specific reasons — rather than as the natural acoustic standard?
- Can you implement a non-standard tuning system technically (via pitch bend, Scala, or MTS-ESP) and compose within it?
- Have you found the "inherited tuning system" problem — accepting a historically specific system as a natural fact — operating in at least two non-musical domains this week?

If yes to these: **the resonance succeeded**.

---

*"The first step is to hear the ocean. The second step is to hear the ocean and know that you have always been inside it."* — after Harry Partch
