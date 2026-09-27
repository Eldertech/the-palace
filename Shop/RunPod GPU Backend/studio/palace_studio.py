#!/usr/bin/env python3
"""
Palace Studio — a tiny local web app for generating images on your RunPod
FLUX endpoint and keeping every result (with its prompt) on disk.

Run:
    export RUNPOD_API_KEY=your_key
    export RUNPOD_ENDPOINT_ID=iy3ybd7qjl2trj      # the palace-flux endpoint
    python3 palace_studio.py
    # then open http://localhost:8765

Config resolution (first that exists wins):
    1. env RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID
    2. a config.json next to this file:  {"api_key":"...","endpoint_id":"..."}
    3. Cowork session files /tmp/.rp_key and /tmp/flux_ep

Images + a metadata index are saved in ./images/ . Stdlib only — no pip install.
Your prompts go to the GPU verbatim; nothing rewrites them.
"""
import json, os, base64, time, threading, ssl, urllib.request, urllib.error
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

HERE = Path(__file__).parent
IMG = HERE / "images"; IMG.mkdir(exist_ok=True)
INDEX = IMG / "index.json"
PORT = int(os.environ.get("PALACE_STUDIO_PORT", "8765"))

def load_cfg():
    key = os.environ.get("RUNPOD_API_KEY")
    ep  = os.environ.get("RUNPOD_ENDPOINT_ID")
    cf = HERE / "config.json"
    if (not key or not ep) and cf.exists():
        c = json.loads(cf.read_text()); key = key or c.get("api_key"); ep = ep or c.get("endpoint_id")
    if not key and Path("/tmp/.rp_key").exists(): key = Path("/tmp/.rp_key").read_text().strip()
    if not ep and Path("/tmp/flux_ep").exists(): ep = Path("/tmp/flux_ep").read_text().strip()
    return key, ep

API_KEY, ENDPOINT = load_cfg()
ROOT = f"https://api.runpod.ai/v2/{ENDPOINT}" if ENDPOINT else None

def _ssl_ctx():
    # Prefer real verification (certifi if present, else system store).
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()
SSL_CTX = _ssl_ctx()
SSL_UNVERIFIED = ssl._create_unverified_context()

def rp(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{ROOT}/{path}", data=data, method=method)
    r.add_header("Authorization", f"Bearer {API_KEY}"); r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=60, context=SSL_CTX) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        # macOS Python often lacks CA roots -> cert verify fails. Fall back to an
        # unverified (still encrypted) context so the tool works out of the box.
        if isinstance(getattr(e, "reason", None), ssl.SSLError):
            with urllib.request.urlopen(r, timeout=60, context=SSL_UNVERIFIED) as resp:
                return json.loads(resp.read().decode())
        raise

def flux_workflow(prompt, w, h, seed, steps, guidance):
    return {
     "30":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"flux1-dev-fp8.safetensors"}},
     "27":{"class_type":"EmptySD3LatentImage","inputs":{"width":w,"height":h,"batch_size":1}},
     "6":{"class_type":"CLIPTextEncode","inputs":{"text":prompt,"clip":["30",1]}},
     "33":{"class_type":"CLIPTextEncode","inputs":{"text":"","clip":["30",1]}},
     "35":{"class_type":"FluxGuidance","inputs":{"conditioning":["6",0],"guidance":guidance}},
     "31":{"class_type":"KSampler","inputs":{"seed":seed,"steps":steps,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,"model":["30",0],"positive":["35",0],"negative":["33",0],"latent_image":["27",0]}},
     "8":{"class_type":"VAEDecode","inputs":{"samples":["31",0],"vae":["30",2]}},
     "9":{"class_type":"SaveImage","inputs":{"filename_prefix":"studio","images":["8",0]}},
    }

def read_index():
    return json.loads(INDEX.read_text()) if INDEX.exists() else []
def write_index(items):
    INDEX.write_text(json.dumps(items, indent=2))

PAGE = """<!DOCTYPE html><html lang=en><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1"><title>Palace Studio</title>
<link rel=preconnect href="https://fonts.googleapis.com"><link rel=preconnect href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Cormorant:wght@400;600&family=Manrope:wght@400;600;700&family=JetBrains+Mono&display=swap" rel=stylesheet>
<style>
:root{--bg:#17181a;--panel:#1e2024;--line:#2b2e33;--ink:#e9e6e0;--mut:#9aa0a6;--amber:#e8a33d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Manrope',sans-serif}
header{padding:26px 5vw 18px;border-bottom:1px solid var(--line)}
h1{font-family:'Anton',sans-serif;font-weight:400;text-transform:uppercase;font-size:34px;margin:0;letter-spacing:.02em}
.tag{font-size:12px;color:var(--mut);margin-top:4px}
.composer{padding:22px 5vw;border-bottom:1px solid var(--line);background:var(--panel)}
textarea{width:100%;min-height:96px;background:#15161890;color:var(--ink);border:1px solid var(--line);border-radius:6px;
 padding:12px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.5;resize:vertical}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:12px}
label{font-size:12px;color:var(--mut);display:flex;flex-direction:column;gap:4px}
input,select{background:#151618;color:var(--ink);border:1px solid var(--line);border-radius:5px;padding:7px 9px;font-family:'JetBrains Mono',monospace;font-size:13px}
button{background:var(--amber);color:#1a1206;border:0;border-radius:6px;padding:11px 22px;font-family:'Manrope';font-weight:700;font-size:14px;cursor:pointer;text-transform:uppercase;letter-spacing:.04em}
button:disabled{opacity:.5;cursor:wait}
#status{font-size:13px;color:var(--mut);margin-left:6px}
.gallery{padding:26px 5vw;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:6px;overflow:hidden}
.card.pending{display:flex;align-items:center;justify-content:center;min-height:240px;color:var(--mut);font-size:13px;font-family:'JetBrains Mono',monospace}
.card img{width:100%;display:block;background:#000;cursor:pointer}
.cap{padding:11px 13px}
.cap .p{font-family:'Cormorant',serif;font-size:17px;line-height:1.35;max-height:7.5em;overflow:auto}
.cap .m{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--mut);margin-top:7px;border-top:1px solid var(--line);padding-top:7px}
footer{padding:24px 5vw;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.12em}
</style></head><body>
<header><h1>Palace Studio</h1><div class=tag id=epline></div></header>
<div class=composer>
 <textarea id=prompt placeholder="Type your prompt — sent to the GPU exactly as written."></textarea>
 <div class=row>
  <label>Width<input id=w type=number value=1024 step=64 style=width:90px></label>
  <label>Height<input id=h type=number value=1024 step=64 style=width:90px></label>
  <label>Seed (blank=random)<input id=seed type=number placeholder=random style=width:120px></label>
  <label>Steps<input id=steps type=number value=28 style=width:80px></label>
  <label>Guidance<input id=g type=number value=3.5 step=0.5 style=width:80px></label>
  <button id=go onclick=generate()>Generate</button><span id=status></span>
 </div>
</div>
<div class=gallery id=gallery></div>
<footer>Loudon Live · Autodidact Polymaths · images saved to ./images/</footer>
<script>
const $=id=>document.getElementById(id);
fetch('/api/config').then(r=>r.json()).then(c=>{$('epline').textContent='endpoint '+(c.endpoint||'NOT CONFIGURED')+(c.ok?'':' — set RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID')});
async function refresh(){const g=await (await fetch('/api/gallery')).json();render(g)}
function render(items){const G=$('gallery');G.innerHTML='';items.slice().reverse().forEach(it=>{
  const c=document.createElement('div');c.className='card';
  c.innerHTML=`<img src="/images/${it.file}" onclick="window.open('/images/${it.file}')"><div class=cap><div class=p>${escapeHtml(it.prompt)}</div><div class=m>${it.w}×${it.h} · seed ${it.seed} · ${it.when}</div></div>`;
  G.appendChild(c)})}
function escapeHtml(s){return (s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
async function generate(){
 const prompt=$('prompt').value.trim(); if(!prompt){return}
 $('go').disabled=true;$('status').textContent='submitting…';
 const body={prompt,w:+$('w').value,h:+$('h').value,seed:$('seed').value?+$('seed').value:0,steps:+$('steps').value,guidance:+$('g').value};
 const r=await (await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
 if(r.error){$('status').textContent='error: '+r.error;$('go').disabled=false;return}
 const id=r.job_id; $('status').textContent='queued — warming up the GPU (first run can take a few min)…';
 const t0=Date.now();
 const iv=setInterval(async()=>{
   const s=await (await fetch('/api/status?id='+id)).json();
   const secs=Math.round((Date.now()-t0)/1000);
   if(s.status==='COMPLETED'){clearInterval(iv);$('status').textContent='done in '+secs+'s';$('go').disabled=false;refresh()}
   else if(['FAILED','CANCELLED','TIMED_OUT'].includes(s.status)){clearInterval(iv);$('status').textContent=s.status+': '+(s.error||'');$('go').disabled=false}
   else{$('status').textContent=s.status.toLowerCase().replace('_',' ')+' — '+secs+'s'}
 },3000);
}
refresh();
</script></body></html>"""

class H(BaseHTTPRequestHandler):
    def _send(self, code, ctype, data):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
    def log_message(self, *a): pass
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self._send(200, "text/html; charset=utf-8", PAGE.encode())
        elif u.path == "/api/config":
            self._send(200, "application/json", json.dumps({"endpoint":ENDPOINT,"ok":bool(API_KEY and ENDPOINT)}).encode())
        elif u.path == "/api/gallery":
            self._send(200, "application/json", json.dumps(read_index()).encode())
        elif u.path == "/api/status":
            jid = parse_qs(u.query).get("id",[None])[0]
            try:
                s = rp("GET", f"status/{jid}")
            except Exception as e:
                self._send(200,"application/json",json.dumps({"status":"ERROR","error":str(e)}).encode()); return
            if s.get("status") == "COMPLETED":
                imgs = (s.get("output") or {}).get("images", [])
                if imgs:
                    meta = JOBS.get(jid, {})
                    fn = f"{int(time.time())}_{jid[:8]}.png"
                    (IMG/fn).write_bytes(base64.b64decode(imgs[0]["data"]))
                    idx = read_index(); idx.append({"file":fn,"prompt":meta.get("prompt",""),"w":meta.get("w"),"h":meta.get("h"),
                        "seed":meta.get("seed"),"when":time.strftime("%Y-%m-%d %H:%M")}); write_index(idx)
            self._send(200, "application/json", json.dumps({"status":s.get("status"),"error":s.get("error")}).encode())
        elif u.path.startswith("/images/"):
            f = IMG / os.path.basename(u.path)
            if f.exists(): self._send(200, "image/png", f.read_bytes())
            else: self._send(404, "text/plain", b"not found")
        else:
            self._send(404, "text/plain", b"not found")
    def do_POST(self):
        if urlparse(self.path).path == "/api/generate":
            n = int(self.headers.get("Content-Length",0)); body = json.loads(self.rfile.read(n) or b"{}")
            if not (API_KEY and ENDPOINT):
                self._send(200,"application/json",json.dumps({"error":"endpoint/key not configured"}).encode()); return
            seed = body.get("seed") or int.from_bytes(os.urandom(3),"big")
            w=int(body.get("w",1024)); h=int(body.get("h",1024)); steps=int(body.get("steps",28)); g=float(body.get("guidance",3.5))
            wf = flux_workflow(body["prompt"], w, h, seed, steps, g)
            try:
                r = rp("POST","run",{"input":{"workflow":wf}})
            except Exception as e:
                self._send(200,"application/json",json.dumps({"error":str(e)}).encode()); return
            JOBS[r["id"]] = {"prompt":body["prompt"],"w":w,"h":h,"seed":seed}
            self._send(200,"application/json",json.dumps({"job_id":r["id"]}).encode())
        else:
            self._send(404,"text/plain",b"not found")

JOBS = {}

if __name__ == "__main__":
    print(f"Palace Studio — endpoint {ENDPOINT or 'NOT SET'} | key {'ok' if API_KEY else 'MISSING'}")
    print(f"Open http://localhost:{PORT}   (Ctrl-C to stop). Images save to {IMG}")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
