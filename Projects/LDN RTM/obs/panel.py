#!/usr/bin/env python3
"""panel — the recording control panel. Second screen, terminal aesthetic.

    python3 panel.py            then open http://127.0.0.1:4477

Stdlib only; nothing to install. Every button shells out to rtm.py and shows you
exactly what it ran and what came back — the panel never does anything rtm.py
can't do from a shell, so there is one behaviour to trust, not two.

To add a button, add one row to BUTTONS. That is the whole extension story.

Aesthetic per [[BBS Design System]], the palace's one standing override to the
Loudon Live house style, documented in [[LDN RTM]] § The control panel: this is an
instrument, not a teaching artifact. Tokens and fonts are served from the real
design system rather than copied, so the panel drifts when the system does.
"""
import json
import shlex
import subprocess
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
RTM = HERE / "rtm.py"
DESIGN = HERE.parents[2] / "_ops" / "stigmergy" / "design-system"
PORT = 4477

# name, rtm command, blurb, class: "" normal | "hot" arms a take | "warn" ends one
BUTTONS = [
    ("SETUP",     "setup",     "frame live's window, then check the rig", ""),
    ("CHECK",     "check",     "preflight only -- changes nothing",       ""),
    ("LEVELS",    "levels 5",  "watch real meters for 5s",                ""),
    ("SHOW",      "show",      "what is queued",                          ""),
    ("TAKE",      "take",      "card up, roll, cut to live",              "hot"),
    ("STOP",      "stop",      "end frame, stop, rename, advance",        "warn"),
    ("SKIP",      "skip",      "next section, nothing recorded",          ""),
    ("PROCESS",   "process",   "normalise the day's takes",               ""),
    ("REMAINING", "remaining", "coverage by chapter",                     ""),
]


def run_rtm(cmd):
    args = [sys.executable, str(RTM)] + shlex.split(cmd)
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=180, cwd=HERE)
        return {"cmd": f"rtm.py {cmd}", "out": (p.stdout + p.stderr).rstrip(), "code": p.returncode}
    except subprocess.TimeoutExpired:
        return {"cmd": f"rtm.py {cmd}", "out": "timed out after 180s", "code": 124}


def status():
    """Cheap, pollable. Never blocks on OBS -- a dead socket must not hang the panel."""
    st = {"queued": "--", "recording": None, "obs": False}
    try:
        sys.path.insert(0, str(HERE))
        import rtm as R
        _s, _rs, r = R.current()
        st["queued"] = f"{r['num']}  {r['title']}"
        st["done"] = len(_s["recorded"])
        st["total"] = len(_rs)
    except Exception as e:
        st["queued"] = f"checklist unreadable: {e}"
    try:
        from obs import Obs
        with Obs() as o:
            st["obs"] = True
            st["recording"] = o.call("GetRecordStatus")["outputActive"]
    except Exception:
        pass
    return st


PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>LDN RTM -- control</title>
<link rel="stylesheet" href="/tokens.css">
<style>
* { box-sizing: border-box; border-radius: 0 !important; }
body { background: var(--bg); color: var(--phosphor);
       font-family: 'IBM Plex Mono', monospace; font-size: 14px; line-height: 1.4em;
       margin: 0; padding: 24px; text-shadow: 0 0 6px currentColor; }
.wrap { max-width: 80ch; margin: 0 auto; }
h1 { font-family: 'VT323', monospace; font-size: 40px; letter-spacing: 2px;
     margin: 0 0 2px; font-weight: 400; text-transform: uppercase; }
.sub { color: var(--phosphor-dim); margin: 0 0 20px; }
.panel { border: 3px double var(--phosphor-dim); padding: 14px; margin-bottom: 16px; }
.hdr { text-transform: uppercase; color: var(--phosphor-dim); letter-spacing: 1px;
       margin-bottom: 10px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
button { background: transparent; border: 1px solid var(--phosphor-dim);
         color: var(--phosphor); font: inherit; text-shadow: inherit;
         padding: 10px 8px; cursor: pointer; text-align: left;
         transition: background 120ms steps(3), color 120ms steps(3); }
button:hover:not(:disabled) { background: var(--phosphor); color: var(--fg-inverted);
                              text-shadow: none; }
button:disabled { opacity: .35; cursor: not-allowed; }
button b { display: block; letter-spacing: 1px; }
button span { display: block; color: var(--phosphor-dim); font-size: 12px; }
button:hover:not(:disabled) span { color: var(--fg-inverted); }
button.hot { border-color: var(--ansi-bright-yellow); color: var(--ansi-bright-yellow); }
button.hot:hover:not(:disabled) { background: var(--ansi-bright-yellow); }
button.warn { border-color: var(--ansi-bright-red); color: var(--ansi-bright-red); }
button.warn:hover:not(:disabled) { background: var(--ansi-bright-red); }
pre { white-space: pre-wrap; margin: 0; min-height: 9em; max-height: 22em;
      overflow-y: auto; color: var(--phosphor-white); }
.ok { color: var(--phosphor); } .bad { color: var(--ansi-bright-red); }
.dot { color: var(--ansi-bright-red); }
.on  { color: var(--ansi-bright-yellow); }
.row { display: flex; justify-content: space-between; gap: 12px; }
</style></head><body><div class="wrap">
<h1>LDN RTM</h1><p class="sub">control -- recording rig, second screen</p>

<div class="panel"><div class="hdr">STATE</div>
  <div class="row"><span id="queued">--</span><span id="prog"></span></div>
  <div class="row"><span id="obs">obs: ?</span><span id="rec"></span></div>
</div>

<div class="panel"><div class="hdr">COMMANDS</div><div class="grid" id="btns"></div></div>

<div class="panel"><div class="hdr">OUTPUT <span id="running"></span></div><pre id="out">ready.</pre></div>
</div><script>
const BTNS = __BUTTONS__;
const g = document.getElementById('btns');
BTNS.forEach(b => {
  const el = document.createElement('button');
  el.className = b[3]; el.innerHTML = '<b>' + b[0] + '</b><span>' + b[2] + '</span>';
  el.onclick = () => run(b[1], el);
  g.appendChild(el);
});
async function run(cmd, el) {
  document.querySelectorAll('button').forEach(x => x.disabled = true);
  document.getElementById('running').textContent = '-- running ' + cmd;
  const out = document.getElementById('out');
  out.textContent = '$ rtm.py ' + cmd + '\\n';
  try {
    const r = await fetch('/run', {method:'POST', body: JSON.stringify({cmd})});
    const j = await r.json();
    out.textContent = '$ ' + j.cmd + '\\n\\n' + j.out;
    out.className = j.code === 0 ? 'ok' : 'bad';
  } catch (e) { out.textContent = 'panel could not reach its own server: ' + e; }
  document.getElementById('running').textContent = '';
  document.querySelectorAll('button').forEach(x => x.disabled = false);
  poll();
}
async function poll() {
  try {
    const s = await (await fetch('/status')).json();
    document.getElementById('queued').textContent = s.queued;
    document.getElementById('prog').textContent =
      (s.done !== undefined) ? s.done + '/' + s.total + ' recorded' : '';
    document.getElementById('obs').innerHTML = s.obs
      ? 'obs: <span class="ok">connected</span>'
      : 'obs: <span class="dot">unreachable</span>';
    document.getElementById('rec').innerHTML = s.recording
      ? '<span class="on">RECORDING</span>' : '';
  } catch (e) {}
}
poll(); setInterval(poll, 4000);
</script></body></html>"""


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        body = body if isinstance(body, bytes) else body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        p = urlparse(self.path).path
        if p in ("/", "/index.html"):
            return self._send(200, PAGE.replace("__BUTTONS__", json.dumps(BUTTONS)))
        if p == "/tokens.css":
            css = (DESIGN / "colors_and_type.css")
            if not css.exists():
                return self._send(404, "/* design system not found at " + str(DESIGN) + " */",
                                  "text/css")
            # rewrite the stylesheet's own relative font paths onto our /fonts/ route
            return self._send(200, css.read_text().replace("url('fonts/", "url('/fonts/"),
                              "text/css")
        if p.startswith("/fonts/"):
            f = DESIGN / "fonts" / Path(p).name
            if f.exists():
                return self._send(200, f.read_bytes(), "font/woff2")
            return self._send(404, b"", "font/woff2")
        if p == "/status":
            return self._send(200, json.dumps(status()), "application/json")
        return self._send(404, "not found")

    def do_POST(self):
        if urlparse(self.path).path != "/run":
            return self._send(404, "not found")
        n = int(self.headers.get("Content-Length", 0))
        try:
            cmd = json.loads(self.rfile.read(n))["cmd"]
        except Exception:
            return self._send(400, json.dumps({"out": "bad request", "code": 1}),
                              "application/json")
        # only commands this panel offers -- the browser does not get an arbitrary shell
        if cmd not in {b[1] for b in BUTTONS}:
            return self._send(403, json.dumps({"cmd": cmd, "out": "not an offered command",
                                               "code": 1}), "application/json")
        return self._send(200, json.dumps(run_rtm(cmd)), "application/json")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://127.0.0.1:{PORT}"
    print(f"panel on {url}   (ctrl-c to stop)")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")
