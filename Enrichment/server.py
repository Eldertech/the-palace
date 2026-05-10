#!/usr/bin/env python3
"""
Enrichment Server — local-only review terminal for the Enrichment ceremony.

See [[Enrichment]] (Enrichment.md at palace root) for the ceremony spec.

Usage (from the palace root):
    python3 Enrichment/server.py            # run in foreground, Ctrl-C to stop
    python3 Enrichment/server.py start      # start in background, return immediately
    python3 Enrichment/server.py stop       # stop the background server
    python3 Enrichment/server.py status     # is it running? URL and card counts

Then open http://localhost:7878 in your browser.

Reads card folders under ./Enrichment/card-* (each containing a card.md +
artifact files), serves them as a vertical stack, and writes responses to
./Enrichment/inbox.md. That's it. Approached from the other side, deliberately
small — features get added when we miss them.

Standard library only. Python 3.8+.
"""

import atexit
import http.server
import json
import os
import re
import signal
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PORT = int(os.environ.get("ENRICHMENT_PORT", "7878"))

# Server lives at <Palace>/Enrichment/server.py — palace root is parent dir
PALACE_ROOT = Path(__file__).resolve().parent.parent
ENRICHMENT_DIR = PALACE_ROOT / "Enrichment"
INBOX_PATH = ENRICHMENT_DIR / "inbox.md"
PID_FILE = ENRICHMENT_DIR / ".server.pid"
LOG_FILE = ENRICHMENT_DIR / ".server.log"

# Worker (the headless `claude -p` supervisor fired on each submit)
WORKER_PROMPT_PATH = ENRICHMENT_DIR / "supervisor-prompt.md"
WORKER_PID_FILE = ENRICHMENT_DIR / ".worker.pid"
WORKER_LOG_FILE = ENRICHMENT_DIR / ".worker.log"
WORKER_STARTED_FILE = ENRICHMENT_DIR / ".worker.started"


# ---------------------------------------------------------------------------
# Card loading
# ---------------------------------------------------------------------------

def parse_frontmatter(text):
    """Tiny YAML-ish frontmatter parser. Returns (dict, body)."""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm_raw, body = parts[1], parts[2].lstrip("\n")
    fm = {}
    for line in fm_raw.strip().split("\n"):
        if ":" not in line:
            continue
        key, val = line.split(":", 1)
        key = key.strip()
        val = val.strip()
        # strip surrounding quotes if present
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        fm[key] = val
    return fm, body


def detect_artifact_type(filename):
    ext = Path(filename).suffix.lower()
    if ext in {".wav", ".mp3", ".ogg", ".m4a", ".flac"}:
        return "audio"
    if ext in {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}:
        return "image"
    if ext in {".html", ".htm"}:
        return "iframe"
    if ext in {".md", ".txt"}:
        return "text"
    return "file"


def count_pending_responses():
    """Count `## card-` headers in inbox.md — one per pending response block."""
    if not INBOX_PATH.exists():
        return 0
    try:
        text = INBOX_PATH.read_text(encoding="utf-8")
    except Exception:
        return 0
    return sum(1 for line in text.splitlines() if line.startswith("## card-"))


def load_cards():
    """Read all card-* folders, return list of card dicts in sorted order."""
    cards = []
    if not ENRICHMENT_DIR.exists():
        return cards
    for card_dir in sorted(ENRICHMENT_DIR.glob("card-*")):
        if not card_dir.is_dir():
            continue
        card_md = card_dir / "card.md"
        if not card_md.exists():
            continue
        try:
            fm, body = parse_frontmatter(card_md.read_text(encoding="utf-8"))
        except Exception as e:
            cards.append({"id": card_dir.name, "error": str(e)})
            continue

        # Skip tombstoned (archived) cards — set after deposit when the folder
        # cannot be deleted. The card stays inert until manual cleanup.
        if fm.get("archived", "").lower() in ("true", "yes", "1"):
            continue

        # Resolve artifact path. If frontmatter says artifact_path, use that;
        # otherwise pick the first non-card.md file in the dir.
        artifact = fm.get("artifact_path")
        if not artifact:
            for f in sorted(card_dir.iterdir()):
                if f.name == "card.md":
                    continue
                if f.is_file():
                    artifact = f.name
                    break

        artifact_type = fm.get("artifact_type") or (detect_artifact_type(artifact) if artifact else "none")
        artifact_url = f"/Enrichment/{card_dir.name}/{urllib.parse.quote(artifact)}" if artifact else None

        # If text-type, read the artifact body for inline rendering
        artifact_text = None
        if artifact and artifact_type == "text":
            try:
                artifact_text = (card_dir / artifact).read_text(encoding="utf-8")
            except Exception:
                artifact_text = None

        cards.append({
            "id": card_dir.name,
            "target_name": fm.get("target_name", ""),
            "target_path": fm.get("target_path", ""),
            "target_obsidian_uri": fm.get("target_obsidian_uri", ""),
            "purpose": fm.get("purpose", ""),
            "fv": fm.get("fv", ""),
            "summary": fm.get("summary", ""),
            "reasoning": fm.get("reasoning", ""),
            "created": fm.get("created", ""),
            "artifact_url": artifact_url,
            "artifact_type": artifact_type,
            "artifact_text": artifact_text,
            # Verbose-mode validator fields (v1 testing). Empty if the supervisor
            # did not run a validator pass on this card.
            "validator_verdict": fm.get("validator_verdict", ""),
            "validator_note": fm.get("validator_note", ""),
            "validator_iterations": fm.get("validator_iterations", ""),
            "body": body.strip(),
        })
    return cards


# ---------------------------------------------------------------------------
# Worker (headless claude -p supervisor)
# ---------------------------------------------------------------------------

def _pid_is_our_worker(pid):
    """Return True if `ps` confirms the PID's command line matches the
    spawn signature of an enrichment supervisor. Guards against PID reuse:
    when a dead worker's PID gets recycled by the OS, plain os.kill(pid, 0)
    reports the new process as alive even though it isn't ours. We check
    for both flags from our argv (`--permission-mode` and `bypassPermissions`)
    — that combination effectively never appears in unrelated processes,
    and matches independent of how the `claude` binary itself is named (it
    may show up as `node`, `claude`, or a shell wrapper depending on install).
    On any failure to determine, return False conservatively."""
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "command="],
            capture_output=True, text=True, timeout=2,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return False
    if result.returncode != 0:
        return False
    cmd = result.stdout
    return ("permission-mode" in cmd) and ("bypassPermissions" in cmd)


def _worker_alive():
    """Return (running: bool, pid: Optional[int]). Cleans stale PID files.
    Verifies the PID is actually a `claude` process — guards against PID
    reuse after a dead worker exits without cleanup."""
    if not WORKER_PID_FILE.exists():
        return False, None
    try:
        pid = int(WORKER_PID_FILE.read_text().strip())
    except (ValueError, OSError):
        return False, None
    # First a cheap existence probe
    try:
        os.kill(pid, 0)
    except OSError:
        try:
            WORKER_PID_FILE.unlink()
        except OSError:
            pass
        return False, None
    # Existence ≠ liveness; verify the process is actually our worker
    if not _pid_is_our_worker(pid):
        try:
            WORKER_PID_FILE.unlink()
        except OSError:
            pass
        return False, None
    return True, pid


def _fire_worker():
    """Spawn the supervisor in the background. Idempotent — does nothing if
    a worker is already alive. Returns (fired: bool, msg: str)."""
    running, pid = _worker_alive()
    if running:
        return False, f"already running (pid {pid})"
    if not WORKER_PROMPT_PATH.exists():
        return False, f"missing {WORKER_PROMPT_PATH.name}"

    try:
        prompt = WORKER_PROMPT_PATH.read_text(encoding="utf-8")
    except OSError as e:
        return False, f"could not read prompt: {e}"

    try:
        log_f = open(WORKER_LOG_FILE, "a")
    except OSError as e:
        return False, f"could not open log: {e}"

    log_f.write(f"\n--- worker fire {datetime.now().isoformat()} ---\n")
    log_f.flush()

    try:
        # --permission-mode bypassPermissions: required because headless
        # claude -p has no TTY to answer Write/Edit permission prompts.
        # The supervisor operates only inside the trusted palace ceremony
        # scope; git is the safety net for anything it gets wrong.
        proc = subprocess.Popen(
            ["claude", "-p", prompt, "--permission-mode", "bypassPermissions"],
            stdout=log_f, stderr=log_f, stdin=subprocess.DEVNULL,
            start_new_session=True, close_fds=True, cwd=str(PALACE_ROOT),
        )
    except FileNotFoundError:
        log_f.write("ERROR: `claude` CLI not found on PATH\n")
        log_f.close()
        return False, "claude CLI not found on PATH"
    except OSError as e:
        log_f.write(f"ERROR: spawn failed: {e}\n")
        log_f.close()
        return False, f"spawn failed: {e}"

    WORKER_PID_FILE.write_text(str(proc.pid))
    WORKER_STARTED_FILE.write_text(datetime.now().isoformat())

    # Daemon-thread cleanup: when the subprocess exits, remove the pid file
    # so the next fire isn't blocked by stale state. Without this, a worker
    # that exits without cleanup (e.g. permission stall, crash, completion)
    # leaves .worker.pid behind, and PID reuse can falsely report it alive.
    def _watch_and_cleanup(pid):
        try:
            proc.wait()
        except Exception:
            pass
        try:
            if WORKER_PID_FILE.exists():
                content = WORKER_PID_FILE.read_text().strip()
                if content == str(pid):
                    WORKER_PID_FILE.unlink()
        except OSError:
            pass
        try:
            log_f.write(f"\n--- worker exit pid {pid} at {datetime.now().isoformat()} ---\n")
            log_f.flush()
            log_f.close()
        except Exception:
            pass

    threading.Thread(target=_watch_and_cleanup, args=(proc.pid,), daemon=True).start()
    return True, f"fired (pid {proc.pid})"


def _worker_log_tail(n=12):
    """Return the last n lines of the worker log, or [] if absent."""
    if not WORKER_LOG_FILE.exists():
        return []
    try:
        size = WORKER_LOG_FILE.stat().st_size
        with open(WORKER_LOG_FILE, "rb") as f:
            f.seek(max(0, size - 8192))
            data = f.read().decode("utf-8", errors="ignore")
        return data.splitlines()[-n:]
    except OSError:
        return []


def _worker_status_dict():
    running, pid = _worker_alive()
    started = None
    if WORKER_STARTED_FILE.exists():
        try:
            started = WORKER_STARTED_FILE.read_text().strip() or None
        except OSError:
            started = None
    return {
        "running": running,
        "pid": pid,
        "started_at": started,
        "log_tail": _worker_log_tail(8),
    }


# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------

class EnrichmentHandler(http.server.BaseHTTPRequestHandler):

    # quieter default logs
    def log_message(self, fmt, *args):
        sys.stderr.write(f"  · {self.address_string()} - {fmt % args}\n")

    # ---- routing ----
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            self._respond(200, "text/html; charset=utf-8", INDEX_HTML.encode("utf-8"))
            return

        if path == "/api/cards":
            data = json.dumps({
                "cards": load_cards(),
                "pending_responses": count_pending_responses(),
                "worker": _worker_status_dict(),
                "ts": datetime.now().isoformat(),
            })
            self._respond(200, "application/json", data.encode("utf-8"))
            return

        if path == "/api/worker-status":
            data = json.dumps({
                **_worker_status_dict(),
                "ts": datetime.now().isoformat(),
            })
            self._respond(200, "application/json", data.encode("utf-8"))
            return

        # Static file serving — only inside the palace, never above
        if path.startswith("/Enrichment/") or path.startswith("/Projects/") or path.startswith("/_ops/"):
            self._serve_file(path[1:])
            return

        self.send_error(404)

    def do_POST(self):
        if self.path == "/api/respond":
            length = int(self.headers.get("Content-Length", "0"))
            try:
                payload = json.loads(self.rfile.read(length))
            except json.JSONDecodeError:
                self.send_error(400, "bad JSON")
                return
            ok, msg = self._append_to_inbox(payload)
            worker_msg = None
            if ok:
                fired, worker_msg = _fire_worker()
            data = json.dumps({"ok": ok, "msg": msg, "worker": worker_msg})
            self._respond(200 if ok else 500, "application/json", data.encode("utf-8"))
            return

        if self.path == "/api/wake":
            # Manual fire (UI button or CLI). Useful if a worker died with the
            # inbox non-empty or the queue under five.
            fired, msg = _fire_worker()
            data = json.dumps({"fired": fired, "msg": msg, **_worker_status_dict()})
            self._respond(200, "application/json", data.encode("utf-8"))
            return

        self.send_error(404)

    # ---- helpers ----
    def _respond(self, status, ctype, body_bytes):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body_bytes)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body_bytes)

    def _serve_file(self, rel_path):
        rel_path = urllib.parse.unquote(rel_path)
        full = (PALACE_ROOT / rel_path).resolve()
        # safety: must be inside palace root
        try:
            full.relative_to(PALACE_ROOT)
        except ValueError:
            self.send_error(403)
            return
        if not full.exists() or not full.is_file():
            self.send_error(404)
            return
        ctype = self._guess_type(full.suffix.lower())
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(full.stat().st_size))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        with open(full, "rb") as f:
            while True:
                chunk = f.read(64 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)

    @staticmethod
    def _guess_type(ext):
        return {
            ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg",
            ".m4a": "audio/mp4", ".flac": "audio/flac",
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
            ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
            ".css": "text/css", ".js": "application/javascript",
            ".md": "text/markdown; charset=utf-8",
            ".txt": "text/plain; charset=utf-8",
            ".json": "application/json",
        }.get(ext, "application/octet-stream")

    def _append_to_inbox(self, payload):
        """Append a response block to inbox.md. Idempotent header init."""
        ts = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        card_id = str(payload.get("card_id", "unknown")).strip() or "unknown"
        target = str(payload.get("target_name", "")).strip()
        purpose = str(payload.get("purpose", "")).strip()
        text = str(payload.get("text", "")).strip()
        if not text:
            return False, "empty response"

        ENRICHMENT_DIR.mkdir(exist_ok=True)
        existing = ""
        if INBOX_PATH.exists():
            existing = INBOX_PATH.read_text(encoding="utf-8")
        if not existing.startswith("# Enrichment Inbox"):
            header = (
                "# Enrichment Inbox\n"
                "\n"
                "Loudon's responses to enrichment cards. Claude reads this file when "
                "running the Enrichment ceremony — each block below is one card's "
                "response. Lines are cleared as actions are performed. Do not reorder "
                "blocks; the dividing rule is `---` (three hyphens on their own line).\n"
                "\n"
            )
            existing = header + existing
        block = (
            f"## {card_id} — {target}\n"
            f"**received:** {ts}  ·  **purpose:** {purpose}\n"
            f"\n"
            f"{text}\n"
            f"\n"
            f"---\n"
            f"\n"
        )
        INBOX_PATH.write_text(existing + block, encoding="utf-8")
        return True, "appended"


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ENRICHMENT // The Palace</title>
<style>
  :root {
    --bg: #0f0f10;
    --bg-2: #14171a;
    --bg-3: #1a1a1d;
    --fg: #e8e8ea;
    --fg-dim: #9a9aa0;
    --fg-faint: #555;
    --border: #2a2a30;
    --gold: #f5d68b;
    --orange: #ff6f59;
    --teal: #6dd3c7;
    --magenta: #c576c5;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; min-height: 100vh; background: var(--bg); color: var(--fg);
    font-family: ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px; line-height: 1.55;
  }

  /* CP437-evoking double border via outline + border */
  .cp {
    border: 1px solid var(--border);
    outline: 1px solid var(--border);
    outline-offset: -4px;
    background: var(--bg-2);
  }
  .cp.gold { border-color: var(--gold); outline-color: var(--gold); }
  .cp.teal { border-color: var(--teal); outline-color: var(--teal); }
  .cp.orange { border-color: var(--orange); outline-color: var(--orange); }

  /* Status bar */
  header {
    position: sticky; top: 0; z-index: 50;
    background: var(--bg);
    border-bottom: 1px solid var(--gold);
    padding: 10px 18px;
    display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center;
  }
  header .brand { color: var(--gold); font-weight: 700; letter-spacing: 0.12em; }
  header .meta { color: var(--fg-dim); font-size: 12px; }
  header .meta .v { color: var(--gold); }
  header .meta .v.pending { color: var(--orange); }
  header button {
    background: transparent; border: 1px solid var(--gold); color: var(--gold);
    padding: 4px 10px; font-family: inherit; font-size: 12px; cursor: pointer;
    letter-spacing: 0.05em;
  }
  header button:hover { background: var(--gold); color: var(--bg); }

  main { padding: 20px 18px 80px; max-width: none; }

  /* Card */
  .card {
    margin: 0 auto 28px;
    padding: 0;
    max-width: 900px;
    background: var(--bg-2);
  }
  .card-head {
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
    display: grid; gap: 4px;
  }
  .card-head .row1 { display: flex; gap: 14px; align-items: baseline; flex-wrap: wrap; }
  .card-id { color: var(--fg-faint); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
  .card-target { color: var(--gold); font-size: 16px; font-weight: 700; }
  .card-target a { color: var(--gold); text-decoration: none; }
  .card-target a:hover { text-decoration: underline; }
  .card-purpose {
    color: var(--orange); font-size: 12px; font-style: italic;
    border-left: 2px solid var(--orange); padding: 2px 10px; margin-top: 4px;
    max-width: 78ch;
  }
  .card-fv {
    color: var(--teal); font-size: 12px; font-style: italic;
    border-left: 2px solid var(--teal); padding: 4px 10px; margin-top: 8px;
    max-width: 78ch;
  }
  .card-fv .lbl { color: var(--fg-dim); font-style: normal; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 2px; }
  .card-summary { color: var(--fg-dim); font-size: 12px; margin-top: 8px; max-width: 78ch; }
  .card-summary .lbl { color: var(--fg-faint); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 2px; }

  .card-artifact {
    background: var(--bg);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 16px 18px;
  }
  .card-artifact img { max-width: 100%; height: auto; display: block; border-radius: 2px; }
  .card-artifact audio { width: 100%; }
  .card-artifact iframe {
    width: 100%; height: 520px; border: 1px solid var(--border); background: var(--bg);
    border-radius: 0;
  }
  .card-artifact pre {
    background: var(--bg-3); border: 1px solid var(--border);
    padding: 12px 16px; max-height: 380px; overflow: auto;
    font-size: 12px; color: var(--fg); white-space: pre-wrap; word-break: break-word;
    max-width: 78ch; margin: 0;
  }

  .card-reasoning {
    padding: 10px 18px; color: var(--fg-dim); font-size: 12px;
    border-bottom: 1px solid var(--border); max-width: 78ch;
  }
  .card-reasoning .lbl { color: var(--fg-faint); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 4px; }

  .response {
    padding: 14px 18px;
  }
  .response .lbl { color: var(--gold); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
  .response .actions { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .response .actions button {
    background: transparent; border: 1px solid var(--border); color: var(--fg-dim);
    padding: 4px 10px; font-family: inherit; font-size: 11px; cursor: pointer;
    letter-spacing: 0.04em;
  }
  .response .actions button:hover { border-color: var(--gold); color: var(--gold); }
  .response .actions button.discard:hover { border-color: var(--orange); color: var(--orange); }
  .response textarea {
    width: 100%; min-height: 110px; resize: vertical;
    background: var(--bg-3); color: var(--fg); border: 1px solid var(--border);
    padding: 10px 12px; font-family: inherit; font-size: 13px; line-height: 1.5;
    max-width: 78ch;
  }
  .response textarea:focus { outline: none; border-color: var(--gold); }
  .response .submit-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .response .submit {
    background: var(--gold); color: var(--bg); border: none;
    padding: 8px 18px; font-family: inherit; font-weight: 700; font-size: 12px;
    cursor: pointer; letter-spacing: 0.06em;
  }
  .response .submit:hover { filter: brightness(1.1); }
  .response .submit:disabled { background: var(--bg-3); color: var(--fg-faint); cursor: default; }
  .response .ack { color: var(--teal); font-size: 11px; }

  .empty {
    max-width: 820px; margin: 60px auto; text-align: center; color: var(--fg-dim);
    border: 1px dashed var(--border); padding: 40px 20px;
  }
  .empty h2 { color: var(--gold); margin: 0 0 10px; letter-spacing: 0.1em; }
  .empty p { margin: 6px 0; }
  .empty code {
    background: var(--bg-3); border: 1px solid var(--border); padding: 2px 6px;
    color: var(--teal); font-size: 12px;
  }

  .submitted {
    opacity: 0.55;
    border-left: 4px solid var(--teal);
  }

  .toast {
    position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--bg); padding: 8px 16px;
    font-weight: 700; font-size: 12px; opacity: 0; transition: opacity 0.25s;
    pointer-events: none; z-index: 100; letter-spacing: 0.06em;
  }
  .toast.show { opacity: 1; }

  .ascii-divider {
    color: var(--fg-faint); text-align: center; letter-spacing: 0.1em;
    font-size: 11px; margin: 24px 0;
  }

  /* Worker indicator in header */
  .worker {
    color: var(--fg-dim); font-size: 12px; margin-left: 6px;
  }
  .worker .dot {
    display: inline-block; width: 7px; height: 7px; border-radius: 50%;
    background: var(--fg-faint); margin-right: 4px; vertical-align: middle;
  }
  .worker.active .dot { background: var(--teal); animation: pulse 1.6s ease-in-out infinite; }
  .worker.active .lbl { color: var(--teal); }
  @keyframes pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 1; }
  }

  /* Validator verbose strip on each card */
  .validator {
    padding: 8px 18px; border-top: 1px dashed var(--border);
    font-size: 11px; color: var(--fg-dim);
    display: flex; gap: 10px; align-items: flex-start;
    max-width: 78ch;
  }
  .validator .v-pass { color: var(--teal); font-weight: 700; letter-spacing: 0.06em; }
  .validator .v-revise { color: var(--orange); font-weight: 700; letter-spacing: 0.06em; }
  .validator .v-iter { color: var(--fg-faint); font-size: 10px; letter-spacing: 0.06em; }
  .validator .v-note { color: var(--fg-dim); font-style: italic; }
</style>
</head>
<body>

<header>
  <div class="brand">▣ ENRICHMENT &nbsp;//&nbsp; The Palace</div>
  <div class="meta">
    <span class="v" id="card-count">…</span> cards
    <span id="pending-wrap" style="display:none;"> · <span class="v pending" id="pending-count">0</span> awaiting Claude</span>
    <span class="worker" id="worker-status" title="claude -p worker"><span class="dot"></span><span class="lbl">worker idle</span></span>
    · port <span class="v" id="port-num">7878</span>
  </div>
  <button id="reload-btn" title="reload queue from disk">↻ reload</button>
</header>

<main id="cards"></main>

<div class="toast" id="toast">submitted</div>

<script>
const cardsEl = document.getElementById('cards');
const countEl = document.getElementById('card-count');
const portEl  = document.getElementById('port-num');
const toast   = document.getElementById('toast');

portEl.textContent = window.location.port || '80';

function showToast(msg, kind){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

function escapeHTML(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function obsidianURI(targetPath){
  // Build obsidian URI from path within palace
  // path looks like "Projects/Crystal Synthesizer.md"
  if (!targetPath) return null;
  const vault = "The Palace";
  const file = targetPath.replace(/\.md$/, '');
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`;
}

function renderArtifact(card){
  const t = card.artifact_type;
  const url = card.artifact_url;
  if (!url) return '<div style="color:#555;font-style:italic;">no artifact</div>';
  if (t === 'audio')  return `<audio controls preload="none" src="${url}"></audio>`;
  if (t === 'image')  return `<img loading="lazy" src="${url}" alt="${escapeHTML(card.target_name)}">`;
  if (t === 'iframe') return `<iframe loading="lazy" src="${url}" sandbox="allow-scripts allow-same-origin"></iframe>`;
  if (t === 'text')   return `<pre>${escapeHTML(card.artifact_text || '')}</pre>`;
  return `<a href="${url}" target="_blank" style="color:var(--teal)">↗ open file</a>`;
}

// Verbose-mode validator strip — shown on every card during v1 testing.
// Hidden later once calibration is proven.
function renderValidator(card){
  const v = (card.validator_verdict || '').trim();
  if (!v) return '';
  const cls = v.startsWith('revise') ? 'v-revise' : 'v-pass';
  const verdictText = v;  // raw value, e.g. 'pass' or 'revise-then-shipped'
  const iter = (card.validator_iterations || '').toString().trim();
  const iterLabel = iter && iter !== '0' ? ` · iter ${iter}` : '';
  const note = (card.validator_note || '').trim();
  return `
    <div class="validator">
      <span class="${cls}">validator: ${escapeHTML(verdictText)}</span>
      <span class="v-iter">${escapeHTML(iterLabel)}</span>
      ${note ? `<span class="v-note">${escapeHTML(note)}</span>` : ''}
    </div>
  `;
}

function renderCard(card){
  const obsURI = card.target_obsidian_uri || obsidianURI(card.target_path);
  const targetHTML = obsURI
    ? `<a href="${obsURI}" title="open in Obsidian">${escapeHTML(card.target_name)}</a>`
    : escapeHTML(card.target_name);
  const fileHref = card.target_path ? `/${encodeURI(card.target_path)}` : null;

  return `
    <article class="card cp gold" data-id="${escapeHTML(card.id)}">
      <div class="card-head">
        <div class="row1">
          <span class="card-id">${escapeHTML(card.id)}</span>
          <span class="card-target">${targetHTML}</span>
          ${fileHref ? `<a href="${fileHref}" target="_blank" style="color:var(--fg-faint);font-size:11px;">view file</a>` : ''}
        </div>
        ${card.purpose ? `<div class="card-purpose">purpose · ${escapeHTML(card.purpose)}</div>` : ''}
        ${card.fv ? `<div class="card-fv"><span class="lbl">forward vector</span>${escapeHTML(card.fv)}</div>` : ''}
        ${card.summary ? `<div class="card-summary"><span class="lbl">where this entry stands</span>${escapeHTML(card.summary)}</div>` : ''}
      </div>

      <div class="card-artifact">
        ${renderArtifact(card)}
      </div>

      ${card.reasoning ? `<div class="card-reasoning"><span class="lbl">why this artifact, right now</span>${escapeHTML(card.reasoning)}</div>` : ''}

      ${renderValidator(card)}

      <div class="response">
        <div class="lbl">your response</div>
        <div class="actions">
          <button data-tag="deposit">deposit</button>
          <button data-tag="revise">revise</button>
          <button data-tag="more like this">more like this</button>
          <button data-tag="forward-vector">vector tweak</button>
          <button data-tag="palace to-do">to-do</button>
          <button data-tag="graffiti">graffiti</button>
          <button data-tag="larger revision">bigger revision</button>
          <button data-tag="discard" class="discard">discard</button>
        </div>
        <textarea placeholder="prose works fine. tap a label above to prepend an action; or write freely."></textarea>
        <div class="submit-row">
          <button class="submit">▶ send</button>
          <span class="ack" id="ack-${escapeHTML(card.id)}"></span>
        </div>
      </div>
    </article>
  `;
}

let CARDS = [];

async function loadCards(){
  cardsEl.innerHTML = '<div class="empty"><h2>loading queue…</h2></div>';
  try {
    const r = await fetch('/api/cards');
    const data = await r.json();
    CARDS = data.cards || [];
    const pending = data.pending_responses || 0;
    const pendingWrap = document.getElementById('pending-wrap');
    const pendingCount = document.getElementById('pending-count');
    if (pending > 0) {
      pendingWrap.style.display = '';
      pendingCount.textContent = pending;
    } else {
      pendingWrap.style.display = 'none';
    }
    render();
  } catch(e) {
    cardsEl.innerHTML = `<div class="empty"><h2>server error</h2><p>${escapeHTML(e.message)}</p></div>`;
  }
}

function render(){
  countEl.textContent = CARDS.length;
  if (CARDS.length === 0) {
    cardsEl.innerHTML = `
      <div class="empty">
        <h2>queue is empty</h2>
        <p>No card folders found in <code>Enrichment/</code>.</p>
        <p>When Claude generates enrichment cards, they will appear here.</p>
        <p>Trigger a session by saying <code>let's enrich</code> in a Claude Code window opened at the palace root.</p>
      </div>
    `;
    return;
  }
  cardsEl.innerHTML = CARDS.map(renderCard).join('<div class="ascii-divider">— · —</div>');
  attachHandlers();
}

function attachHandlers(){
  document.querySelectorAll('.card').forEach(cardEl => {
    const id = cardEl.dataset.id;
    const ta = cardEl.querySelector('textarea');
    const submit = cardEl.querySelector('.submit');
    const ack = cardEl.querySelector('.ack');
    // Restore from localStorage
    const saved = localStorage.getItem('enrich-' + id);
    if (saved) ta.value = saved;
    ta.addEventListener('input', () => localStorage.setItem('enrich-' + id, ta.value));
    cardEl.querySelectorAll('.actions button').forEach(b => {
      b.addEventListener('click', () => {
        const tag = b.dataset.tag;
        const existing = ta.value;
        // strip any leading "<word>:" to replace it
        const stripped = existing.replace(/^[a-z][a-z\-\s]{0,20}:\s*/i, '');
        ta.value = `${tag}: ${stripped}`;
        ta.focus();
        ta.dispatchEvent(new Event('input'));
      });
    });
    submit.addEventListener('click', async () => {
      const text = ta.value.trim();
      if (!text) { showToast('write something first'); return; }
      submit.disabled = true;
      const card = CARDS.find(c => c.id === id);
      try {
        const r = await fetch('/api/respond', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            card_id: id,
            target_name: card.target_name,
            purpose: card.purpose,
            text: text,
          }),
        });
        const d = await r.json();
        if (d.ok) {
          ack.textContent = '✓ sent — Claude will act on this in the next session';
          cardEl.classList.add('submitted');
          localStorage.removeItem('enrich-' + id);
          showToast('submitted');
        } else {
          ack.textContent = '✗ ' + (d.msg || 'error');
          submit.disabled = false;
        }
      } catch(e) {
        ack.textContent = '✗ ' + e.message;
        submit.disabled = false;
      }
    });
  });
}

document.getElementById('reload-btn').addEventListener('click', loadCards);
loadCards();

// ---- Worker status polling ----
// Polls /api/worker-status every few seconds. When the worker transitions
// from active → idle, automatically reloads the queue so revised/fresh
// cards appear without the user having to click reload.
const workerEl = document.getElementById('worker-status');
const workerLbl = workerEl.querySelector('.lbl');
let lastWorkerActive = false;
let workerPollMs = 2500;
let workerStartedTs = null;

async function pollWorker(){
  try {
    const r = await fetch('/api/worker-status');
    const d = await r.json();
    const active = !!d.running;
    if (active) {
      workerEl.classList.add('active');
      const startedAt = d.started_at ? new Date(d.started_at).getTime() : null;
      if (startedAt) {
        const secs = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        workerLbl.textContent = `worker active · ${secs}s`;
      } else {
        workerLbl.textContent = 'worker active';
      }
    } else {
      workerEl.classList.remove('active');
      workerLbl.textContent = 'worker idle';
    }
    // Active→idle transition: reload the queue so any new/revised cards appear
    if (lastWorkerActive && !active) {
      loadCards();
    }
    lastWorkerActive = active;
  } catch(e) {
    workerLbl.textContent = 'worker ?';
  }
}
pollWorker();
setInterval(pollWorker, workerPollMs);
</script>

</body>
</html>"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Daemon control: start / stop / status / run
# ---------------------------------------------------------------------------

def _is_running():
    """Return (running: bool, pid: Optional[int]). Cleans stale PID files."""
    if not PID_FILE.exists():
        return False, None
    try:
        pid = int(PID_FILE.read_text().strip())
    except (ValueError, OSError):
        return False, None
    try:
        os.kill(pid, 0)  # signal 0 = existence probe, sends nothing
    except OSError:
        # stale PID file — process is gone
        try:
            PID_FILE.unlink()
        except OSError:
            pass
        return False, None
    return True, pid


def _probe_http(timeout=0.5):
    """Return server JSON if reachable, else None."""
    try:
        r = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/api/cards", timeout=timeout)
        return json.loads(r.read())
    except Exception:
        return None


def cmd_start():
    """Start in background, return immediately. Idempotent."""
    ENRICHMENT_DIR.mkdir(exist_ok=True)
    running, pid = _is_running()
    if running:
        print(f"  · already running (pid {pid})")
        print(f"  · http://localhost:{PORT}")
        return 0

    log_f = open(LOG_FILE, "a")
    log_f.write(f"\n--- start {datetime.now().isoformat()} ---\n")
    log_f.flush()
    proc = subprocess.Popen(
        [sys.executable, str(Path(__file__).resolve()), "_run"],
        stdout=log_f, stderr=log_f, stdin=subprocess.DEVNULL,
        start_new_session=True, close_fds=True, cwd=str(PALACE_ROOT),
    )

    # Wait briefly for the server to come up (probe HTTP)
    for _ in range(30):
        time.sleep(0.1)
        if _probe_http(timeout=0.3) is not None:
            print(f"  · started (pid {proc.pid})")
            print(f"  · http://localhost:{PORT}")
            return 0
        # also fail fast if the child died
        if proc.poll() is not None:
            print(f"  ✗ server exited immediately. last log:")
            try:
                tail = LOG_FILE.read_text().splitlines()[-12:]
                for line in tail:
                    print(f"    {line}")
            except Exception:
                pass
            return 1

    print(f"  ✗ server didn't respond within 3s — check {LOG_FILE}")
    return 1


def cmd_stop():
    """Stop the background server. Idempotent."""
    running, pid = _is_running()
    if not running:
        print("  · not running")
        return 0
    try:
        os.kill(pid, signal.SIGTERM)
    except OSError as e:
        print(f"  ✗ SIGTERM failed: {e}")
        return 1
    # wait for shutdown
    for _ in range(30):
        time.sleep(0.1)
        try:
            os.kill(pid, 0)
        except OSError:
            break
    else:
        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass
    try:
        PID_FILE.unlink()
    except OSError:
        pass
    print(f"  · stopped (pid {pid})")
    return 0


def cmd_status():
    """Report state, with card and inbox counts if reachable."""
    running, pid = _is_running()
    if not running:
        print("  · server not running")
    else:
        print(f"  · server running (pid {pid})")
        print(f"  · http://localhost:{PORT}")
        data = _probe_http(timeout=1.0)
        if data is None:
            print("  ! pid alive but http probe failed")
        else:
            n_cards = len(data.get("cards", []))
            n_pending = data.get("pending_responses", 0)
            print(f"  · {n_cards} cards in queue · {n_pending} responses awaiting Claude")

    w_running, w_pid = _worker_alive()
    if w_running:
        started = ""
        if WORKER_STARTED_FILE.exists():
            try:
                started = WORKER_STARTED_FILE.read_text().strip()
            except OSError:
                pass
        print(f"  · worker running (pid {w_pid}){' · started ' + started if started else ''}")
    else:
        print("  · worker idle")
    return 0


def cmd_wake():
    """Manually fire a worker. Useful if a previous worker died with the
    inbox non-empty or the queue under five."""
    fired, msg = _fire_worker()
    if fired:
        print(f"  · {msg}")
        return 0
    print(f"  · not fired: {msg}")
    return 1


def _serve_forever():
    """The actual blocking server loop. Writes PID, cleans up on exit."""
    os.chdir(PALACE_ROOT)
    ENRICHMENT_DIR.mkdir(exist_ok=True)

    # Write PID file; clean up on any exit (atexit + signal handlers)
    PID_FILE.write_text(str(os.getpid()))
    def _cleanup_pid():
        try:
            if PID_FILE.exists() and PID_FILE.read_text().strip() == str(os.getpid()):
                PID_FILE.unlink()
        except Exception:
            pass
    atexit.register(_cleanup_pid)
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda *a: sys.exit(0))

    print(f"┌──────────────────────────────────────────────")
    print(f"│ ENRICHMENT // server (pid {os.getpid()})")
    print(f"├──────────────────────────────────────────────")
    print(f"│ palace root  : {PALACE_ROOT}")
    print(f"│ queue dir    : {ENRICHMENT_DIR}")
    print(f"│ inbox        : {INBOX_PATH}")
    print(f"│ url          : http://localhost:{PORT}")
    print(f"└──────────────────────────────────────────────")
    print(f"  Ctrl-C to stop.")

    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), EnrichmentHandler) as srv:
            srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  · stopped.")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"\n  ✗ port {PORT} is already in use.")
            print(f"    Either another server is running (try `stop`), or set ENRICHMENT_PORT to a different port.")
        else:
            raise


def main():
    cmd = sys.argv[1].lower() if len(sys.argv) > 1 else "_default"
    if cmd in ("start",):
        sys.exit(cmd_start())
    if cmd in ("stop",):
        sys.exit(cmd_stop())
    if cmd in ("status",):
        sys.exit(cmd_status())
    if cmd in ("restart",):
        cmd_stop()
        time.sleep(0.2)
        sys.exit(cmd_start())
    if cmd in ("wake",):
        sys.exit(cmd_wake())
    if cmd in ("_run", "run", "_default"):
        _serve_forever()
        return
    print(f"usage: {sys.argv[0]} [start|stop|status|restart|wake|run]")
    sys.exit(2)


if __name__ == "__main__":
    main()
