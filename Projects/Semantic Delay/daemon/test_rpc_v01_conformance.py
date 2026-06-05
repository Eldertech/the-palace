"""
Semantic Delay — RPC v0.1 conformance test (Stage 1)
====================================================

Drives the *whole* RPC v0.1 call surface through the reference DaemonClient
against a freshly-launched stub daemon, on a private temp socket, and asserts
the wire contract holds. Stdlib + pytest-free: runnable as a plain script.

Why this exists, and why now: the home entry's cross-cutting decision says
"Daemon RPC is the stable contract. Version from v0.1. Don't let VST work and
Python work drift." A spec without an executable check drifts the moment Stage
1.5 wires the real model in — the easiest way to silently break the contract is
to change a field name or a blob-length invariant while chasing model output.
This test pins the contract so any Stage 1.5 / Stage 2 change that violates v0.1
fails loudly here first. It is path-independent: standalone-first, model-now, and
prompt-pipeline all consume this same socket, so all three benefit.

Run:
    python test_rpc_v01_conformance.py
Exit 0 = contract holds. Non-zero = a v0.1 violation, printed.
"""

from __future__ import annotations

import os
import struct
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from client import DaemonClient, DaemonError  # noqa: E402

PROTOCOL_VERSION = "0.1"


def _short(v, limit: int = 80) -> str:
    """Compact repr — summarize large bytes/strings instead of dumping them."""
    if isinstance(v, (bytes, bytearray)):
        return f"<{len(v)} bytes>"
    r = repr(v)
    return r if len(r) <= limit else r[:limit] + f"...({len(r)} chars)"


def _f32le_silence(n_samples: int) -> bytes:
    """n_samples of mono float32 little-endian zeros — a valid v0.1 PCM blob."""
    return struct.pack("<" + "f" * n_samples, *([0.0] * n_samples))


def _wait_for_socket(sock_path: Path, timeout_s: float = 10.0) -> None:
    """Wait until the socket accepts a connection (daemon bound + listening)."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if sock_path.exists():
            try:
                with DaemonClient(sock_path) as c:
                    c.hello()
                return
            except (ConnectionError, OSError, DaemonError):
                pass
        time.sleep(0.1)
    raise TimeoutError(f"daemon did not come up on {sock_path} within {timeout_s}s")


def _wait_model_loaded(sock_path: Path, timeout_s: float = 10.0) -> None:
    """Honor spec §6: E_MODEL_NOT_LOADED is non-fatal; retry until a hello
    confirms model.loaded == true before issuing convert."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            with DaemonClient(sock_path) as c:
                if c.hello().get("model", {}).get("loaded") is True:
                    return
        except (ConnectionError, OSError, DaemonError):
            pass
        time.sleep(0.05)
    raise TimeoutError(f"daemon model not loaded on {sock_path} within {timeout_s}s")


class Checks:
    def __init__(self) -> None:
        self.passed = 0
        self.failures: list[str] = []

    def ok(self, cond: bool, label: str) -> None:
        if cond:
            self.passed += 1
            print(f"  PASS  {label}")
        else:
            self.failures.append(label)
            print(f"  FAIL  {label}")

    def eq(self, got, want, label: str) -> None:
        # Keep value reprs short — large blobs (e.g. PCM bytes) must never be
        # dumped into a label, or the log explodes to hundreds of KB per line.
        self.ok(got == want, f"{label} (got {_short(got)}, want {_short(want)})")


def run() -> int:
    chk = Checks()
    tmp = Path(tempfile.mkdtemp(prefix="semantic-delay-test-"))
    sock_path = tmp / "daemon.sock"
    pidfile = tmp / "daemon.pid"
    prompts_dir = tmp / "prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)

    proc = subprocess.Popen(
        [
            sys.executable,
            str(HERE / "semantic_delay_daemon.py"),
            "--sock", str(sock_path),
            "--pidfile", str(pidfile),
            "--prompts-dir", str(prompts_dir),
            "--log-level", "WARNING",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    try:
        _wait_for_socket(sock_path)

        # 1 — hello negotiates v0.1 and reports model + prompt_count fields.
        with DaemonClient(sock_path) as c:
            h = c.hello()
            chk.eq(h.get("ok"), True, "hello.ok")
            chk.eq(h.get("protocol_version"), PROTOCOL_VERSION, "hello.protocol_version")
            chk.ok("model" in h and "sr" in h["model"], "hello.model.sr present")
            chk.eq(h["model"].get("sr"), 24000, "hello.model.sr == 24000 (F5-TTS rate)")
            chk.ok("prompt_count" in h, "hello.prompt_count present")
            chk.ok("build" in h, "hello.build present")

        # 2 — prompts.register roundtrips, then prompts.list reflects it.
        with DaemonClient(sock_path) as c:
            pcm = _f32le_silence(44100)  # 1.0 s @ 44.1k mono f32
            reg = c.prompts_register("spirit.test.v1", "Test Spirit", pcm, 44100)
            chk.eq(reg.get("ok"), True, "prompts.register.ok")
            chk.eq(reg.get("prompt_id"), "spirit.test.v1", "prompts.register echoes prompt_id")
            chk.ok("f0_cached" in reg, "prompts.register.f0_cached present")

            lst = c.prompts_list()
            chk.eq(lst.get("ok"), True, "prompts.list.ok")
            ids = {p.get("id") for p in lst.get("prompts", [])}
            chk.ok("spirit.test.v1" in ids, "prompts.list includes registered prompt")

        # 3 — convert against a registered prompt: blob-length invariant +
        #     stub passthrough (RTF 0 until Stage 1.5 wires the model).
        #     Per spec §6, convert before load returns the non-fatal
        #     E_MODEL_NOT_LOADED; the caller retries after hello confirms
        #     model.loaded == true. We exercise that retry discipline.
        _wait_model_loaded(sock_path)
        with DaemonClient(sock_path) as c:
            c.prompts_register("spirit.cv.v1", "Convert Spirit", _f32le_silence(48000), 48000)
            in_pcm = _f32le_silence(48000)  # 1.0 s @ 48k
            res = c.convert("spirit.cv.v1", in_pcm, 48000)
            chk.eq(len(res.audio_out), len(in_pcm),
                   "convert RESPONSE_BLOB length matches declared byte_length")
            chk.eq(res.sample_rate, 48000,
                   "convert output sample_rate defaults to input rate")
            chk.eq(res.audio_out, in_pcm,
                   "stub convert is bit-exact passthrough (RTF 0 contract)")
            chk.eq(res.rtf, 0.0, "stub convert rtf == 0.0")

        # 4 — error contract: unknown method is NON-fatal (connection survives),
        #     unknown prompt is NON-fatal too.
        with DaemonClient(sock_path) as c:
            c._send_header({"method": "no.such.method", "id": "bad-1"})
            try:
                c._recv_header()
                chk.ok(False, "unknown method raises DaemonError")
            except DaemonError as e:
                chk.eq(e.code, "E_METHOD_UNKNOWN", "unknown method -> E_METHOD_UNKNOWN")
            # connection should still be usable (non-fatal): a hello must work.
            try:
                h2 = c.hello()
                chk.eq(h2.get("ok"), True, "connection survives non-fatal E_METHOD_UNKNOWN")
            except (DaemonError, ConnectionError, OSError):
                chk.ok(False, "connection survives non-fatal E_METHOD_UNKNOWN")

        with DaemonClient(sock_path) as c:
            try:
                c.convert("spirit.does.not.exist.v9", _f32le_silence(1000), 48000)
                chk.ok(False, "convert on unknown prompt raises DaemonError")
            except DaemonError as e:
                chk.eq(e.code, "E_PROMPT_UNKNOWN", "unknown prompt -> E_PROMPT_UNKNOWN")

        # 5 — graceful shutdown replies ok before exit.
        with DaemonClient(sock_path) as c:
            sd = c.shutdown()
            chk.eq(sd.get("ok"), True, "shutdown.ok")

    finally:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()

    print()
    print(f"  {chk.passed} checks passed, {len(chk.failures)} failed")
    if chk.failures:
        print("  v0.1 CONTRACT VIOLATIONS:")
        for f in chk.failures:
            print(f"    - {f}")
        return 1
    print("  RPC v0.1 contract holds.")
    return 0


if __name__ == "__main__":
    sys.exit(run())
