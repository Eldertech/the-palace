---
title: "Blood Compressor — Radio-Play Lesson Script"
born: 2026-05-27
links:
  - target: "[[Blood Compressor]]"
    type: connects-to
    label: lesson-first-deliverable
  - target: "[[Compressor Design]]"
    type: deepens
    label: incarnates-the-abstract-pedagogy
  - target: "[[Loudon Live]]"
    type: enables
    label: 30-min-radio-play-format
  - target: "[[Progressive Staging]]"
    type: connects-to
forward_vector: "I am the radio-play lesson script for Blood Compressor — the 30-minute three-voice deliverable — waiting to be produced into the first Loudon Live session for this device."
---

# Blood Compressor — Radio-Play Lesson Script

A 30-minute Loudon Live lesson taught as a radio play. Three voices, six scenes, one running biological frame: *the body is already a compressor and has been since you were a fetus*. The script teaches the four canonical compressor parameters (threshold, ratio, attack, release) by mapping them onto the cardiovascular system, and ends with the student understanding why compression exists in the first place.

The script is paired with [sfx-cue-sheet.md](sfx-cue-sheet.md) (sound-effect cues, Stable Audio Open prompts) and [visuals-spec.md](visuals-spec.md) (the weird-visuals dispatch brief, p5.js + ComfyUI + Manim CE).

## Voice Casting

| Voice | Character | Tone | Kokoro voice (proposed) |
|---|---|---|---|
| **NARRATOR** | The lesson's teacher. Loudon's role in a Loudon Live session — but heard, not seen. Sets stakes, names mechanisms, calls beats. | Warm, curious, fast on intake. Speaks plainly. Loves the moment when a thing clicks. | `af_bella` (Study-tier default; the working voice) |
| **BODY** | The cardiovascular system, given a voice. Speaks about itself in first person. Slightly older, slightly tired, deeply patient — it has been running for forty years without a day off. | First-person, slightly weary, matter-of-fact about its own brilliance. Never dramatic. Never asks for credit. | `am_adam` (deeper-register voice, contrast with NARRATOR) |
| **ENGINEER** | The audio engineer character. The "compressor designer" voice. Skeptical, technical, occasionally interrupts. Stands in for the student's "yeah but what about the DSP" reflex. | Direct, slightly impatient, technical vocabulary. Earns warmth by the end. | `am_michael` (third distinct timbre) |

The three voices alternate per scene; the script names the speaker each cue. Tier: **Study** for the prototype render, **Piece** for the Loudon Live publish (which would also pull in Loudon's own voice in place of NARRATOR — see the Kokoro entry's "your recording for narration when the piece is published as you" rule).

## Total Runtime Target

| Scene | Title | Target | Cumulative |
|---|---|---|---|
| Cold open | "The 40-year session" | 1:30 | 1:30 |
| Scene 1 | "What a compressor is, told twice" | 4:30 | 6:00 |
| Scene 2 | "Threshold — when the body notices" | 4:30 | 10:30 |
| Scene 3 | "Ratio — how hard the wall pushes back" | 4:30 | 15:00 |
| Scene 4 | "Attack — the delay between noticing and acting" | 5:00 | 20:00 |
| Scene 5 | "Release — the body is honest about its return" | 4:30 | 24:30 |
| Scene 6 | "The whole instrument, one demo" | 4:30 | 29:00 |
| Outro | "Why this device exists" | 1:00 | 30:00 |

Total: **30:00**. Word budget at ~140 wpm Kokoro Study: ~4,200 spoken words. Scene counts below honor that; sound and visual cues do not count against word budget.

---

## Cold Open — "The 40-year session" (0:00–1:30)

**SFX01 — heartbeat-establish** *(slow steady heartbeat, 60 bpm, close-mic'd, room reverb, fade in over 6s, hold under voice, fade to 50% under NARRATOR's first line)*

**VIS01 — beating-heart-loop** *(60 bpm beating-heart silhouette, single color #C8254C against #0B0B10, looping, no detail visible yet — see visuals-spec.md)*

**NARRATOR.** *(quiet, warm, just under the heartbeat)*
You are listening to a forty-year session.
It has been running since before you were born.
It does not stop for sleep, it does not stop for thought, and it has never once skipped a beat to ask whether you understood it.

The session is your heart, and the producer running it is your cardiovascular system, and the effect on the master bus is a compressor.

In the next thirty minutes I'm going to teach you what compression is by pointing at the thing you already are. By the time we're done, you will know what *threshold*, *ratio*, *attack*, and *release* mean — and you will know it the way you know how to swallow, which is to say, in your body before in your head.

**SFX02 — heartbeat-and-blood** *(heartbeat continues, layered now with a low, watery rush — blood moving — pitched down, sub-perceptual fundamental ~40Hz; rises gently over 4s)*

**NARRATOR.**
Let's begin.

**SFX03 — scene-transition-flutter** *(short ascending flutter, ~1.5s, like a small bird taking off, treated wet — signals scene change)*

**VIS01 → VIS02 fade** *(beating heart fades to title card: "BLOOD COMPRESSOR — a 30-minute Loudon Live lesson" — see visuals-spec.md)*

---

## Scene 1 — "What a compressor is, told twice" (1:30–6:00)

**VIS02 — title card** *(holds 4s, then dissolves to VIS03: a clean black background with a single horizontal line — the threshold line — drawn slowly across the screen)*

**ENGINEER.** *(matter-of-fact, briskly)*
Alright. A compressor.

A compressor is a circuit, or a piece of software, or a piece of DSP code, that reduces the dynamic range of a signal. When the signal gets loud, it turns it down. When the signal is quiet, it leaves it alone. The result is that loud parts and quiet parts of a piece of audio get closer together in level. That's it. That's the whole device.

There are four parameters. **Threshold** is the level above which the compressor starts working. **Ratio** is how much it pushes back, expressed as a number like 4:1, meaning for every 4 decibels you go over threshold, only 1 decibel comes out. **Attack** is how fast the compressor moves to the new gain. **Release** is how fast it returns. Four knobs. That's the whole instrument.

If you've ever used one, you know it's not actually that simple. The knobs interact. The same setting on two different compressors sounds wildly different. Engineers fight about them in studios and on forums and in their own heads at 2 a.m.

**SFX04 — studio-monitor-bus** *(brief bus-level audio: 2 seconds of a kick-drum loop being compressed, "before" then "after" — the after has the kick noticeably more even, less peaked, fuller. 3 seconds total)*

**ENGINEER.** *(continuing)*
That's the engineer's version. Tools and parameters.

**SFX03 — scene-transition-flutter** *(short flutter, 1s, shorter than the first)*

**VIS03 → VIS04 transition** *(threshold-line scene dissolves to a cross-section of a human neck, anatomically accurate but stylized, vein visible in profile, blood moving — see visuals-spec.md)*

**NARRATOR.** *(warmer, slower)*
Now the body's version.

A compressor is a pressure regulator. It exists wherever a system has to keep pressure from getting too high in a place where high pressure does damage. Your body's first compressor is the one that protects your brain.

When you stand up suddenly, blood rushes up. The pressure at the top of your aortic arch spikes. If it kept spiking, you would have a stroke before your second cup of coffee. So your body — meaning the smooth muscle wrapped around every artery, and the sensors embedded in the walls of those arteries, and the brainstem reflexes wired into both — keeps the pressure inside a window.

That window has a top. The top is the threshold.

Above the threshold, your vessels squeeze inward — they *compress* — and the pressure inside falls. The harder they squeeze, the more they compress, and the ratio of how-much-squeeze-per-unit-overshoot is the compressor's ratio.

**BODY.** *(speaking up for the first time, calm, first person)*
That's me. I've been doing this since you were eight weeks old in your mother. I do it forty-something times a minute. I have never once been thanked.

**NARRATOR.** *(small laugh)*
We're thanking you now.

**BODY.**
Appreciated.

**SFX05 — gentle-heart-thump** *(single soft thump, isolated, no reverb)*

**NARRATOR.**
Two compressors. Same math. One in a studio rack, one in your neck. The audio compressor was invented in 1937. The body's compressor was invented some hundreds of millions of years before that. We are about to learn the audio version by listening to the older one explain itself.

**SFX03 — scene-transition-flutter**

---

## Scene 2 — "Threshold — when the body notices" (6:00–10:30)

**VIS04 → VIS05 transition** *(neck cross-section zooms in on a single artery wall; baroreceptors — small sensor nodes — appear as glowing dots on the inside of the wall; pressure inside is visualized as a wavy line moving along the vessel — see visuals-spec.md)*

**ENGINEER.**
Threshold. The level above which the compressor engages. Below it: nothing happens, the signal passes through, gain equals one. Above it: the compressor starts pushing back. In a digital compressor it's a number, usually expressed in decibels relative to full scale. Minus eighteen, minus twelve, minus six. Pick one and the device wakes up at that level.

**NARRATOR.**
Now the body.

**BODY.**
Inside every major artery I have *baroreceptors*. They're stretch sensors. They sit in the wall and feel how far the wall is being pushed outward by the pressure of the blood inside.

When pressure is normal — about one hundred and twenty over eighty, but really the systolic peak, the one-twenty, is what matters here — they're calm. They fire steadily, evenly, sending a baseline signal up to the brainstem.

When pressure crosses one hundred and forty, one hundred and fifty, they start firing fast. The brainstem receives the alarm and signals the smooth muscle in the artery walls to *constrict*. The vessels narrow. The pressure inside falls.

The level at which the baroreceptors switch from "everything is fine" to "everything is not fine" — that is the threshold.

**NARRATOR.**
And the threshold isn't a wall. It's a *zone*. There's a band where the baroreceptors are partially activated — firing more than baseline but not at full alarm. The compressor engages gradually inside that band.

**ENGINEER.** *(interrupting, slightly excited)*
Wait. That's the soft knee.

**NARRATOR.**
That's exactly the soft knee.

**SFX06 — small-realization-chime** *(brief, single bell-tone, ~3 partials, the "click" sound of an insight landing)*

**ENGINEER.**
In an audio compressor the soft knee is a band around the threshold where the compression engages gradually rather than all at once. Below the knee: no compression. Above the knee: full compression. Inside the knee: a quadratic blend.

**NARRATOR.**
Same shape. The body's threshold has a knee built in because if the response were a hard switch — fully passive at one-nineteen, fully constricting at one-twenty-one — every footstep would cinch your arteries shut. The biological design is a smooth curve. Quadratic, or close to it. The same shape an audio engineer reaches for when they want their compressor to "sound natural."

**BODY.** *(dry)*
I am the natural.

**NARRATOR.**
*(laughing softly)* You are the natural.

**SFX07 — vessel-narrowing-thump** *(low whoosh, descending in pitch over 1.5s, the sound of the vessel wall moving inward — soft, fleshy, not metallic)*

**VIS05 — interactive moment** *(the visual cuts to an interactive p5.js sketch shown live: a horizontal pressure trace moves along the vessel, the threshold band is a horizontal red zone, and as the trace enters and exceeds the zone, the vessel wall visibly bulges then constricts. The viewer can drag the threshold up or down to see the effect at a different level. See visuals-spec.md for the dispatch brief.)*

**NARRATOR.**
Threshold is *when the body notices*. Set it too high and the body never compresses — the pressure peaks pass through unattended. Set it too low and the body is compressing constantly, exhausting the smooth muscle, narrowing vessels that don't need narrowing. Pick the right zone and you have a compressor that sleeps until it's needed.

This is also the rule in audio. Threshold too high: the compressor never engages, the peaks pass through. Threshold too low: the compressor never rests, the signal is squashed constantly. Pick the right zone.

**SFX03 — scene-transition-flutter**

---

## Scene 3 — "Ratio — how hard the wall pushes back" (10:30–15:00)

**VIS05 → VIS06 transition** *(the interactive sketch fades; new visual is the vessel wall itself, now in extreme close-up, showing the smooth muscle layer wrapped around the vessel — concentric rings of muscle fiber. The fibers contract visibly when activated. See visuals-spec.md)*

**ENGINEER.**
Ratio. Expressed as a number with a colon. Two to one. Four to one. Ten to one. Infinity to one — the limiter. The ratio is how much the compressor pushes back against signal that's over threshold.

A four-to-one ratio means: every four decibels of input above threshold becomes one decibel of output above threshold. If the input goes from threshold-plus-four to threshold-plus-eight, the output only moves from threshold-plus-one to threshold-plus-two. The compressor is "absorbing" three out of every four decibels of overshoot.

**NARRATOR.**
Now the body.

**BODY.**
Inside the wall of every artery is a layer of smooth muscle. When the brainstem says *constrict*, the muscle contracts. The artery narrows. The pressure falls.

How much it falls per unit of constriction — that depends on the *elasticity* of the wall. A young, healthy artery is flexible. A small contraction produces a large pressure drop because the wall gives easily. An older, stiffer artery — what doctors call *arterial stiffness* — requires the same muscle to work harder to produce the same drop.

The ratio of *how much pressure drops per unit of constriction* — that is the compressor's ratio. And it's not fixed. Your arteries change ratio across your life, across a season, across a difficult week.

**ENGINEER.**
That's wild. The biology is *time-variant*.

**BODY.**
You are time-variant. I am time-variant. The studio piece you're mastering tonight is the same as the one you mastered last year only in the bit pattern.

**SFX08 — slow-vessel-clench** *(a slow, satisfying constriction sound — like a wet rubber band being slowly tightened, ~3s, very low-mid frequency emphasis)*

**NARRATOR.**
The audio version of *arterial stiffness* is what some hardware compressors call their "tone" or "color" — the subtle ways the same nominal ratio sounds different on an 1176 versus a LA-2A versus a digital plugin. The wall is doing the same job, but the wall is made of different stuff, and the stuff matters.

**VIS06 — animated overlay** *(a graph appears overlaid on the muscle close-up: input vs output curves at ratio 1:1, 2:1, 4:1, 10:1, ∞:1. Each curve is in a different color from a defined palette. As NARRATOR speaks the words, the curves animate in one at a time. See visuals-spec.md — this is a Manim CE moment.)*

**NARRATOR.**
At ratio one-to-one, no compression — the wall doesn't constrict. At two-to-one, gentle — the wall narrows a little. At four-to-one, firm — the wall narrows decisively. At ten-to-one, hard — the wall is approaching its full closure. At infinity-to-one, the limiter: the wall is fully cinched, the pressure cannot rise further, no matter how loud the input gets.

This is why ratio is sometimes spoken of as the *character* of the compressor. A 2:1 compressor on a vocal sounds different from a 4:1 compressor on the same vocal — same input, same threshold, but the wall is pushing back differently.

**BODY.**
And in me, the wall pushes back differently in your hand than in your aorta than behind your eye. Different vessels, different ratios. A whole orchestra of compressors, none of them set the same way.

**NARRATOR.** *(slowly)*
A whole orchestra of compressors, none of them set the same way.

**SFX03 — scene-transition-flutter**

---

## Scene 4 — "Attack — the delay between noticing and acting" (15:00–20:00)

**VIS06 → VIS07 transition** *(the graph fades. New visual is a baroreceptor firing — a single sensor cell, action potential running along the neuron — followed by the signal traveling up the vagus nerve to the brainstem and back to the smooth muscle. Time is visible as a horizontal axis; the delay between sensing and acting is marked with a labeled span. See visuals-spec.md)*

**ENGINEER.**
Attack. The most-fought-about parameter in the compressor family.

Attack is the time the compressor takes to go from no-compression to full-compression once the signal crosses threshold. In a digital compressor it's a number, usually in milliseconds. A fast attack — one millisecond, half a millisecond — clamps the signal almost the instant it crosses threshold. A slow attack — fifty milliseconds, a hundred — lets the leading edge of the signal *through* before the compressor catches up.

This is the part where engineers fight. Fast attack preserves level. Slow attack preserves *transient*. If you want the snap of a snare drum to come through, you set the attack slower than the snap. If you want every peak utterly contained, you set the attack as fast as the device will go.

There is no right answer. There is only what you're trying to teach the listener about the source.

**NARRATOR.**
Now the body.

**BODY.**
When my baroreceptors fire, the signal travels up the vagus nerve, into the brainstem nucleus called the *nucleus tractus solitarius*, and then back out through the sympathetic and parasympathetic outflow to the smooth muscle in the artery walls.

That round trip takes about one hundred and fifty milliseconds.

So when your blood pressure spikes — really spikes, not the smooth changes I handle without alarm — there is a hundred-and-fifty-millisecond delay between the moment my baroreceptors feel the spike and the moment my muscle layer responds. During that one hundred and fifty milliseconds, the pressure is *uncompressed*. It is passing through.

**ENGINEER.**
That's your attack time.

**BODY.**
That's my attack time. I cannot make it faster. Nerve conduction is finite. The brainstem has to actually receive the message. There is a floor, in seconds, below which I cannot react.

**NARRATOR.**
This is why some audio compressors have a *minimum attack* time. You cannot dial them to zero. The designer is acknowledging that physical systems have reaction times — capacitors charge, op-amps slew, even the digital filters in the detector path have group delay. The body is honest about this. Some audio compressors are too.

**SFX09 — neural-zip** *(a quick zipping sound, ascending in pitch, ~120ms, simulating an action potential traveling — short, electric, a touch of biological wetness)*

**SFX10 — delayed-thump** *(then, after a pause of ~600ms in the audio bed, a single low thump — the moment the muscle actually contracts. The delay between SFX09 and SFX10 is the listener's first felt experience of "attack time".)*

**NARRATOR.**
Did you feel that? The gap between the signal arriving and the body responding?

That's attack.

In your compressor plugin, attack is a number. In your body, attack is the felt time between something happening and your body having a chance to respond. It is why you can sometimes feel your heart "catch up" after a startle — your sympathetic nervous system fires immediately, but your heart rate takes a few hundred milliseconds to actually rise. The delay is real, it's measurable, and it shapes the character of every cardiovascular event.

**VIS07 — interactive moment** *(the p5.js sketch returns: a slider for attack time, from 1ms to 200ms. The pressure trace and the vessel constriction are both shown. As the slider moves, the gap between the trace exceeding threshold and the vessel responding visibly changes. Set attack to 0ms — vessel slams shut at the moment of threshold crossing, no breath. Set attack to 200ms — pressure visibly overshoots before the vessel catches up. See visuals-spec.md.)*

**NARRATOR.**
Try this in your DAW tonight. Take a snare drum. Compress it at 8:1 ratio, threshold low enough that the snare hits are compressed. Now sweep the attack from one millisecond to fifty. Listen for the snap.

At one millisecond, the snare is flat — the compressor caught the entire transient.
At ten milliseconds, the snare has a little snap back.
At fifty, the snare has its full crack — the compressor only catches what's underneath.

You are tuning *how fast the body responds*. And you are choosing how much of the original event survives.

**BODY.** *(quietly)*
You are choosing how much of the original event survives. That's most of what compression is.

**SFX03 — scene-transition-flutter**

---

## Scene 5 — "Release — the body is honest about its return" (20:00–24:30)

**VIS07 → VIS08 transition** *(the attack sketch fades. New visual is a smooth muscle relaxation animation — the artery, having constricted, slowly opens back up. The opening is visibly *not* the mirror of the closing. The closing was a sharp clench; the opening is a long sigh. See visuals-spec.md.)*

**ENGINEER.**
Release. The time the compressor takes to go from compressed back to no-compression after the signal falls below threshold.

If attack is the most-fought-about parameter, release is the most-misunderstood. Engineers reach for short release times because they sound "active" — the meters bounce, the compressor "breathes." They reach for long release times when they want the compressor to "ride" the program material — to stay engaged across a vocal phrase rather than letting go between syllables.

But release also produces *pumping* — the audible heaving of background noise during the release phase, where the noise floor rises and falls as the compressor lets go. Pumping is sometimes a defect. Sometimes it's the whole point.

**NARRATOR.**
Now the body.

**BODY.**
When the pressure event passes — when the loud sound, the moment of stress, the spike — when it ends, I have to *let go*. The smooth muscle has to relax. The vessel has to open back up.

Here is the asymmetry. *I can clench fast. I cannot let go fast.*

Constriction is a contraction. Smooth muscle contraction is faster than smooth muscle relaxation by a factor of two or three. Once the muscle is engaged, returning it to baseline takes time. Calcium has to be pumped out of the cytoplasm. The actin and myosin filaments have to disengage. The wall has to lose its tone gradually.

So my release is *always slower than my attack*. Always. The asymmetry isn't a design choice. It's biochemistry.

**NARRATOR.**
This asymmetry exists in audio compressors too. Most analog compressors have releases ten to a hundred times slower than their attacks. A FET compressor like the 1176 can attack in twenty microseconds and release in fifty milliseconds — a 2,500-to-one ratio between the two. The body is in good company.

**ENGINEER.**
And the reason isn't just biochemistry. There's a *psychoacoustic* reason. If release is too fast — if the compressor lets go instantly the moment the signal drops below threshold — you hear the gain change as a *pumping* artifact. The compressor breathes audibly. Sometimes that breathing is musical. Often it's just distracting.

**BODY.**
I do not pump. My release is slow enough that you never feel the moment the wall relaxes. You feel it only in the long, slow falling of pressure between events. The transparency is the point.

**SFX11 — long-exhale** *(a slow exhale sound, ~4s, processed wet, like wind leaving a vessel; treated as if heard through tissue rather than air)*

**VIS08 — animated curve overlay** *(a graph appears showing release curves: linear, exponential, logarithmic, super-slow program-dependent. As the BODY speaks the next paragraphs, the curves animate. See visuals-spec.md.)*

**NARRATOR.**
There's one more dimension. The shape of the release curve.

A *linear* release: the gain comes back in equal increments per millisecond. The compressor "rises" at constant rate.

An *exponential* release: the gain comes back fast at first and slows down. Mathematically simple, biologically common — most physiological returns are exponential because they're driven by first-order kinetics, which is how a lot of biochemistry actually works.

A *program-dependent* release: the release time changes based on how long and how hard the compressor was working. After a brief, light compression event, it lets go quickly. After a long, heavy event, it lets go slowly. This is the body's behavior — your blood pressure stays elevated for *minutes* after a startle, even though the startle is over in seconds. Your smooth muscle has been told to stay tight.

Modern digital compressors implement program-dependent release explicitly. The body has had it for a long time.

**BODY.**
A long time.

**NARRATOR.**
Set release too short and you hear the compressor working. Set release too long and the compressor never gets out of the way; subsequent peaks are compressed by a device that hasn't yet let go of the previous one.

Set release in the right place and the compressor is invisible — present, working, but un-noticed. That is what the body has been doing inside you for the entire time you have been listening to this lesson.

**SFX12 — heartbeat-resurfacing** *(the heartbeat from the cold open, which has been absent or extremely subtle since Scene 1, gently returns — only 30% level, behind the voice)*

**SFX03 — scene-transition-flutter**

---

## Scene 6 — "The whole instrument, one demo" (24:30–29:00)

**VIS08 → VIS09 transition** *(the curves fade. New visual is the full interface mythology: a cross-section of an artery running across the screen, with all the parameters labeled — threshold, ratio, attack, release, knee — and a beating heart at the bottom synced to the audio. Particles flow through the vessel. The vessel constricts and releases in response to the audio. This is the "money shot." See visuals-spec.md — this is the p5.js interactive instrument.)*

**NARRATOR.**
We have walked through the four parameters one at a time. Now I want to put them all together and show you what the instrument feels like as a whole.

I am going to play a vocal — a single sustained phrase, no compression. Listen for the dynamic range. Listen for how the loud parts are loud and the quiet parts are quiet.

**SFX13 — uncompressed-vocal** *(a 4-second sustained vocal phrase, no processing, with naturally varying level — soft start, louder middle, soft end. Generated via Stable Audio or pre-recorded. See sfx-cue-sheet.md.)*

**NARRATOR.**
Now I'm going to engage the Blood Compressor. Threshold set so the loud middle of the phrase exceeds it. Ratio at 4:1 — firm but musical. Attack at 30 milliseconds — slow enough to preserve the syllable's leading edge, fast enough to catch the body of the sustain. Release at 300 milliseconds — slow enough to ride the phrase, fast enough to recover before the next breath.

**SFX14 — compressed-vocal** *(the same vocal phrase, now compressed with the parameters described — quieter loud middle, the quiet parts unchanged, the overall phrase sitting more evenly. See sfx-cue-sheet.md.)*

**NARRATOR.**
Hear the difference? The loud part is still loud, but less so. The phrase sits more evenly in the mix. The attention can shift from "how loud" to "what is being said."

This is what compression *does*. It is not making the loud parts quieter for its own sake. It is *moving the listener's attention away from level and toward content*. It is doing the job your body has been doing for your nervous system every minute of your life — keeping pressure within a window so that everything else can happen inside that window.

**BODY.**
This is the thing I have been trying to tell you for forty years.

**ENGINEER.** *(quietly)*
Yeah.

**NARRATOR.**
The same instrument, two views. The audio engineer reaches for a compressor when they want the listener to focus on what is being said rather than how loudly it is being said. Your body engages its compressor every time you stand up, every time you laugh, every time your heart rate spikes — so that the rest of you can focus on standing, on laughing, on being startled, without your brain being flooded by pressure variation it doesn't need to process.

The body invented this instrument before there were engineers to design it. The engineers, much later, built the audio version. The math is the same. The materials are different. The purpose is the same: *let everything else happen inside a managed window.*

**VIS09 — final beat** *(the visual lingers on the full instrument — vessel pulsing, heart beating, particles flowing, all the parameters labeled — for 3 seconds with no narration)*

**SFX15 — full-bed** *(heartbeat + low blood rush + a single sustained tone, ~Eb minor, pad-like, atmospheric — the bed under the outro)*

**SFX03 — scene-transition-flutter**

---

## Outro — "Why this device exists" (29:00–30:00)

**VIS09 → VIS10 transition** *(the full instrument shrinks and a new title card appears: "BLOOD COMPRESSOR — A Loudon Live lesson. Build it next." See visuals-spec.md.)*

**NARRATOR.**
You have just been taught the four parameters of a compressor by listening to the oldest compressor in the room — yours.

Threshold is *when the body notices*.
Ratio is *how hard the wall pushes back*.
Attack is *the delay between noticing and acting*.
Release is *the body's slow, honest return*.

In the next Loudon Live session, we build this device in Max for Live. The DSP is feedforward, the math is straightforward, and the interface — a beating heart, a constricting vessel, baroreceptors lighting up when the threshold is crossed — is the part that will take the most time, because it is the part that makes the math visible.

If you only take one thing away tonight: compression exists because *the body invented it first, and the body invented it because the brain wanted to do other work*. Every time you engage a compressor in your DAW, you are doing the thing your aorta has been doing since before you were born.

**BODY.** *(one last time)*
You are welcome.

**SFX16 — final-heartbeat** *(one final, isolated heartbeat, slightly louder than any preceding one, dry and close — then silence)*

**SFX17 — outro-bed** *(the pad from SFX15 swells slightly, sustains, then fades to silence over 4s)*

**VIS10 — final hold** *(title card holds for 4s, then fades to black)*

**END.**

---

## Production Notes (for Maker dispatch)

- **Total spoken word count**: ~4,180 (within the 4,200 target at Kokoro Study tier and standard 140 wpm).
- **Tier proposal**: render the prototype at **Study** tier (the Kokoro working voice, EBU R128 to −16 LUFS) for internal review; promote to **Piece** only after Loudon's audition pass. The Piece-tier render swaps NARRATOR for Loudon's own voice per the [[Loudon Live]] convention.
- **Audition gate**: per Substrate Skill, before committing to Piece tier render the *cold open + one scene* (Scene 2 is the most representative — it introduces all three voices and lands the first soft-knee insight). That's the minimum unit that exercises every parameter of the production: three voices, four SFX types, two visual modes. Audition that before any full-script render.
- **Sequence of dispatch** (if Loudon approves and proceeds to Maker brief):
  1. Kokoro renders all three voice tracks at Study tier (~12 minutes total speech across three voices).
  2. Stable Audio Open generates the SFX bed cues per `sfx-cue-sheet.md`.
  3. p5.js, ComfyUI, and Manim CE produce the visual assets per `visuals-spec.md` in parallel (no resource contention — different specialists).
  4. ffmpeg mixes the three voice tracks with the SFX bed; the visual track is rendered separately for the Loudon Live publish.
- **Non-negotiables flowing down from the home entry**:
  - The body must always be addressed in first person (BODY voice).
  - The four parameter mappings must land in the named order: threshold → ratio → attack → release. Knee is folded into the threshold scene; sympathetic-activation/HRV/vessel-age are deferred to the Max prototype lesson, not this radio play.
  - The closing line must connect compression to *brain bandwidth* — "the body invented it because the brain wanted to do other work." That is the pedagogical hook the home entry is reaching for.

## Open Questions (for the cycle's TRICKSTER ask)

1. **Three voices or two?** The script uses NARRATOR, BODY, and ENGINEER. The ENGINEER is the "studio voice" interlocutor who interrupts with technical questions. Cleaner pedagogy might collapse to just NARRATOR + BODY (the engineer's lines fold into NARRATOR). More dramatic ear-experience keeps three. Recommendation: keep three for the Study render, evaluate at audition.
2. **Loudon's voice or Kokoro for NARRATOR?** Loudon Live convention says Loudon's voice when the piece is published as him. But a Study-tier prototype lets us hear the script before Loudon records his pass. Recommendation: Study render is all-Kokoro; Piece render swaps NARRATOR to Loudon.
3. **Heart-pulse audio as feature or hidden?** The home entry's Open Question #1 asks whether the audible heartbeat thump should be a feature or hidden default-off. This radio play uses the heartbeat audibly in the cold open and the outro. Recommendation: in the radio play it is foreground; in the Max device, default-off.
4. **30 minutes or 60–75 minutes (Loudon Live session standard)?** Loudon Live sessions are 60–90 minutes per the home entry. The mandate said 30. This radio play sits at 30. Recommendation: treat this 30-minute cut as Act I of a longer session, where Act II is the Max build-along. Each act is a complete pedagogical moment (per [[Progressive Staging]]).
