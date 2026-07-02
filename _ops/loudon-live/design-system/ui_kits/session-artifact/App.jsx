/* Session Artifact · App.
   Demo content recreates the Shepard-Tone-Stage-1 pattern from
   The Palace/Artifacts/Shepard Tone Synthesizer/session-1-interactive.html */

function App() {
  return (
    <article className="session">
      <SessionHeader
        stageLabel="Stage 1 · the illusion"
        title="The infinite"
        titleEm="staircase"
        subtitle="A Shepard tone, built from the ground up. We layer octaves, fade their edges, and listen as the spectrum walks forever without going anywhere."
        meta="Loudon Live · Stream 003 · 60–75 minutes · no Max required"
      />

      <section>
        <SectionLabel>The escher split</SectionLabel>
        <EscherSplit
          canvas={<img src="../../assets/logo-lissajous.svg" alt="Lissajous trace" />}
          identity={"You hear a staircase that never reaches the top. You see a figure that always returns to where it began. Both are illusions of motion through bounded space."}
          beats={[
            { title: 'beat 1 · the staircase', body: 'Penrose stairs are a 2D projection of a 3D thing that cannot exist. Your eye tracks the up-step and refuses to integrate the global geometry.' },
            { title: 'beat 2 · the tone', body: 'Shepard tones are a frequency-domain projection of pitch that cannot exist. Your ear tracks the rising partial and refuses to integrate the global spectrum.' },
            { title: 'beat 3 · the move', body: 'Build it. The illusion only teaches when you can turn it on and off — and watch your own perception flip with the switch.' },
          ]}
        />
      </section>

      <section>
        <SectionLabel>The mechanism</SectionLabel>
        <h2>How a stack of fading octaves sounds infinite</h2>
        <p>A Shepard tone is a sum of pure tones spaced one octave apart, each one weighted by a bell-shaped envelope across the audible spectrum. As all the partials slide upward in lockstep, the lowest ones fade in from inaudibility and the highest fade out into nothing. No partial is doing anything strange — but the whole sum sounds like it's climbing forever.</p>
        <Pillquote>The illusion only teaches when you can turn it on and off — and watch your own perception flip with the switch.</Pillquote>
        <CanvasWrap caption="six partials, one octave apart, weighted by a hann window across log-frequency space">
          <img src="../../assets/generators/spectral-bands.svg" alt="Spectrogram of layered partials" />
        </CanvasWrap>
      </section>

      <section>
        <SectionLabel>The build · progressive staging</SectionLabel>
        <h2>Four parameters, additive complexity</h2>
        <BuildSteps steps={[
          {
            title: 'A single sliding partial',
            detail: 'One oscillator. We set a starting frequency and a glide rate. Listen — it goes up. Then it goes too high to hear. Stage 1 of Stage 1.',
            params: ['f₀ = 110 Hz', 'glide = +1 oct/sec'],
          },
          {
            title: 'Stack the octaves',
            detail: 'Duplicate the oscillator across six octaves. They all slide together. The spectrum is a comb walking up-frequency. Already it feels wrong — there are no edges.',
            params: ['n = 6', 'spacing = 12 st'],
          },
          {
            title: 'Weight the edges',
            detail: 'A Hann window across log-frequency: lowest partials are inaudible, highest are inaudible, middle is loud. The walk is now an illusion. Top partials dissolve as bottom partials re-enter.',
            params: ['window = hann', 'centre = 2 kHz', 'span = 6 oct'],
          },
          {
            title: 'Anti-alias and loop',
            detail: 'The top of the spectrum must not click as a partial crosses Nyquist. We fade it out before it clips. The build wraps: f₀ resets to f₀ × 2 on each octave-cycle.',
            params: ['nyquist = 22.05 kHz', 'wrap_period = 1 sec'],
          },
        ]} />
      </section>

      <section>
        <SectionLabel>Tuning ranges</SectionLabel>
        <h2>Settings that earn their keep</h2>
        <TuningGrid items={[
          { title: 'wrap period', value: '0.6 – 2.0 s', note: 'Faster than 0.6s and you hear the seam.' },
          { title: 'window centre', value: '1.2 – 3.0 kHz', note: 'Move it to bias the perceived octave register.' },
          { title: 'partial count', value: '4 – 8', note: 'Below 4 sounds thin · above 8 muddies the seam.' },
        ]} />
        <CalloutQuote>This audio example doesn't follow the rules of metric modulation that is in the document, try again!</CalloutQuote>
        <CalloutChange label="change">Wrap period nudged from a fixed 1.0 s to a slider — listeners hear the seam emerge as it shortens.</CalloutChange>
      </section>

      <SessionFooter left="Loud'n Live" />
      <div className="session-stage-trailer">
        <span className="stage-label">Stage 1 · the illusion</span>
      </div>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
