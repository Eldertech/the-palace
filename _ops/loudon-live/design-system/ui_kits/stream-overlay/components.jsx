/* Stream Overlay · components. Each piece is a small, self-contained layer
   that sits on the .scene stage. App.jsx composes them. */

function ScreenShareBackground() {
  // mock IDE-style screen-share — the user's screen content during a build
  const K = (s) => <span className="k">{s}</span>;
  const C = (s) => <span className="c">{s}</span>;
  const S = (s) => <span className="s">{s}</span>;
  return (
    <div className="bg-screen">
      <div className="placeholder">
        <div className="ide-bar">
          <span>● ● ●</span>
          <span style={{ marginLeft: 14 }}>shepard.py — stage-1</span>
        </div>
        <pre className="ide-body">
{C('# ── stage 1: a single sliding partial ──')}{'\n'}
{K('def')} shepard(t, n_partials={S('6')}, period={S('1.0')}):{'\n'}
{'    '}out = {S('0.0')}{'\n'}
{'    '}{K('for')} k {K('in')} range(n_partials):{'\n'}
{'        '}oct_shift = (t/period + k) % n_partials{'\n'}
{'        '}freq = base_hz * {S('2')} ** oct_shift{'\n'}
{'        '}gain = hann(oct_shift / n_partials){'\n'}
{'        '}out += gain * np.sin({S('2')}*np.pi*freq*t){'\n'}
{'    '}{K('return')} out{'\n'}
{'\n'}
{C('# wrap_period = 1.0 sec · partials = 6 · centre = 2 kHz')}
        </pre>
      </div>
    </div>
  );
}

function LiveTag({ stream, elapsed }) {
  return (
    <div className="live-tag">
      <span className="dot"></span>
      <span>LIVE <span className="accent">· STREAM {stream}</span></span>
      <span style={{ color: 'var(--fg-3)' }}>· {elapsed}</span>
    </div>
  );
}

function TopicStrap({ today }) {
  return (
    <div className="topic-strap">
      <span className="accent">TODAY · </span>{today}
    </div>
  );
}

function CamFrame() {
  return (
    <div className="cam-frame">
      <div className="placeholder"></div>
      <div className="live-dot"></div>
      <div className="cam-tag">cam · 1080p</div>
    </div>
  );
}

function LowerThird({ label, value }) {
  return (
    <div className="lower-third">
      <div className="lt-label">{label}</div>
      <div className="lt-value">{value}</div>
    </div>
  );
}

function Watermark() {
  return (
    <div className="watermark">
      LOUD’N <span className="accent">LIVE</span>
    </div>
  );
}

function ChatColumn() {
  const messages = [
    { name: 'avo_caz', tone: 'alt-a', text: "wait that's wild — the whole spectrum is just walking up forever?" },
    { name: 'p_helix', tone: '',      text: 'is the hann window in log-freq space or linear?' },
    { name: 'loudon',  tone: '',      text: 'log. that\'s the whole trick — equal weighting per octave.' },
    { name: 'nik_t',   tone: 'alt-b', text: 'do you ever shape the window non-symmetric? curious what asymmetry does to the illusion' },
    { name: 'avo_caz', tone: 'alt-a', text: 'try a longer wrap period — like 4s' },
    { name: 'rhei__',  tone: 'alt-c', text: 'first stream! this is exactly what i needed today' },
    { name: 'p_helix', tone: '',      text: 'is the patch on github yet?' },
    { name: 'loudon',  tone: '',      text: 'after the stream — wrap_period_v2.py' },
  ];
  return (
    <div className="chat-col">
      <div className="chat-head"><span className="accent">●</span> live chat · 87 watching</div>
      {messages.map((m, i) => (
        <div className="chat-msg" key={i}>
          <span className={'chat-name ' + (m.tone || '')}>{m.name}</span>
          {m.text}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ScreenShareBackground, LiveTag, TopicStrap, CamFrame, LowerThird, Watermark, ChatColumn });
