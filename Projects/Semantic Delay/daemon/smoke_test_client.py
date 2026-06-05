"""
Semantic Delay — Daemon RPC v0.1 smoke-test client
===================================================

Stage 1 verification harness. Exercises the *whole* RPC contract against a
live daemon over the real AF_UNIX socket: hello, prompts.register,
prompts.list, a convert round-trip (pass-through stub), and three error
paths (E_PROTOCOL_MISMATCH, E_METHOD_UNKNOWN, E_PROMPT_UNKNOWN). It proves
the contract end-to-end *before* the SoulX-Singer-SVC model is in the loop,
so every downstream branch (standalone instrument, real model, prompt
pipeline) plugs into a socket that is known-good.

Stdlib only — matches the daemon skeleton, runs without PyTorch.

Usage:
    # terminal 1
    python semantic_delay_daemon.py --sock /tmp/sd-test.sock \
        --pidfile /tmp/sd-test.pid --prompts-dir /tmp/sd-test-prompts
    # terminal 2
    python smoke_test_client.py --sock /tmp/sd-test.sock

Or run self-contained (spawns its own daemon, runs, tears down):
    python smoke_test_client.py --self

Exit code 0 = every assertion passed. Non-zero = first failure printed.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import struct
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# Wire constants mirror RPC-v0.1.md §2 and the daemon.
KIND_REQUEST_HEADER = 0x01
KIND_REQUEST_BLOB = 0x02
KIND_RESPONSE_HEADER = 0x10
KIND_RESPONSE_BLOB = 0x11
KIND_ERROR = 0x30
KIND_PING = 0x40
KIND_PONG = 0x41


class SmokeFailure(AssertionError):
    pass


def send_frame(sock: socket.socket, kind: int, payload: bytes) -> None:
    body = bytes([kind]) + payload
    sock.sendall(struct.pack(">I", len(body)) + body)


def _recv_exactly(sock: socket.socket, n: int) -> bytes:
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise SmokeFailure(f"connection closed mid-frame ({len(buf)}/{n} bytes)")
        buf.extend(chunk)
    return bytes(buf)


def recv_frame(sock: socket.socket) -> tuple[int, bytes]:
    (length,) = struct.unpack(">I", _recv_exactly(sock, 4))
    body = _recv_exactly(sock, length)
    return body[0], bytes(body[1:])


def send_header(sock: socket.socket, obj: dict) -> None:
    send_frame(sock, KIND_REQUEST_HEADER, json.dumps(obj).encode("utf-8"))


def recv_json(sock: socket.socket) -> tuple[int, dict]:
    kind, payload = recv_frame(sock)
    return kind, json.loads(payload.decode("utf-8"))


def connect(sock_path: str) -> socket.socket:
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(sock_path)
    return s


# ---- individual checks -----------------------------------------------------


def check_ping(sock_path: str) -> None:
    s = connect(sock_path)
    try:
        send_frame(s, KIND_PING, b"")
        kind, _ = recv_frame(s)
        if kind != KIND_PONG:
            raise SmokeFailure(f"ping: expected PONG (0x41), got {kind:#x}")
    finally:
        s.close()
    print("  [ok] ping -> pong")


def check_hello_ok(sock_path: str) -> None:
    s = connect(sock_path)
    try:
        send_header(s, {"method": "hello", "id": "h-001", "protocol_version": "0.1"})
        kind, body = recv_json(s)
        if kind != KIND_RESPONSE_HEADER:
            raise SmokeFailure(f"hello: expected RESPONSE_HEADER, got {kind:#x}")
        for key in ("ok", "protocol_version", "model", "prompt_count", "build"):
            if key not in body:
                raise SmokeFailure(f"hello response missing '{key}': {body}")
        if body["protocol_version"] != "0.1":
            raise SmokeFailure(f"hello: wrong protocol_version {body['protocol_version']}")
        if body["id"] != "h-001":
            raise SmokeFailure(f"hello: id not echoed ({body['id']})")
    finally:
        s.close()
    print(f"  [ok] hello -> protocol 0.1, model.loaded={body['model'].get('loaded')}, build={body['build']}")


def check_hello_protocol_mismatch(sock_path: str) -> None:
    s = connect(sock_path)
    try:
        send_header(s, {"method": "hello", "id": "h-bad", "protocol_version": "9.9"})
        kind, body = recv_json(s)
        if kind != KIND_ERROR:
            raise SmokeFailure(f"hello mismatch: expected ERROR (0x30), got {kind:#x}")
        if body.get("code") != "E_PROTOCOL_MISMATCH":
            raise SmokeFailure(f"hello mismatch: wrong code {body.get('code')}")
    finally:
        s.close()
    print("  [ok] hello protocol_version=9.9 -> E_PROTOCOL_MISMATCH (fatal, connection closed)")


def check_unknown_method(sock_path: str) -> None:
    s = connect(sock_path)
    try:
        send_header(s, {"method": "hello", "id": "h-1", "protocol_version": "0.1"})
        recv_json(s)  # drain hello
        send_header(s, {"method": "no.such.method", "id": "x-1"})
        kind, body = recv_json(s)
        if kind != KIND_ERROR or body.get("code") != "E_METHOD_UNKNOWN":
            raise SmokeFailure(f"unknown method: expected E_METHOD_UNKNOWN, got {kind:#x} {body}")
        # Non-fatal: connection should still be alive for another call.
        send_header(s, {"method": "prompts.list", "id": "pl-after"})
        kind2, body2 = recv_json(s)
        if kind2 != KIND_RESPONSE_HEADER or not body2.get("ok"):
            raise SmokeFailure("unknown method should be non-fatal; connection died")
    finally:
        s.close()
    print("  [ok] unknown method -> E_METHOD_UNKNOWN (non-fatal, connection survives)")


def check_register_and_list(sock_path: str) -> str:
    s = connect(sock_path)
    prompt_id = "spirit.huehuecoyotl.v1"
    sr = 24000
    # 1.0s of float32 mono silence as a stand-in reference singer wav.
    pcm = b"\x00\x00\x00\x00" * sr
    try:
        send_header(
            s,
            {
                "method": "prompts.register",
                "id": "pr-1",
                "prompt_id": prompt_id,
                "label": "Huehuecoyotl",
                "input": {
                    "sample_rate": sr,
                    "channels": 1,
                    "encoding": "pcm_f32le",
                    "byte_length": len(pcm),
                },
            },
        )
        send_frame(s, KIND_REQUEST_BLOB, pcm)
        kind, body = recv_json(s)
        if kind != KIND_RESPONSE_HEADER or not body.get("ok"):
            raise SmokeFailure(f"register failed: {kind:#x} {body}")
        if body.get("prompt_id") != prompt_id:
            raise SmokeFailure(f"register: wrong prompt_id {body.get('prompt_id')}")

        send_header(s, {"method": "prompts.list", "id": "pl-1"})
        kind, body = recv_json(s)
        ids = [p["id"] for p in body.get("prompts", [])]
        if prompt_id not in ids:
            raise SmokeFailure(f"registered prompt missing from list: {ids}")
    finally:
        s.close()
    print(f"  [ok] prompts.register + prompts.list -> '{prompt_id}' present")
    return prompt_id


def check_convert_roundtrip(sock_path: str, prompt_id: str) -> None:
    s = connect(sock_path)
    sr = 48000
    # 0.5s of a 1.0 ramp so we can verify the pass-through returns it unchanged.
    n = sr // 2
    pcm = b"".join(struct.pack("<f", (i % 100) / 100.0) for i in range(n))
    try:
        send_header(s, {"method": "hello", "id": "h-c", "protocol_version": "0.1"})
        recv_json(s)
        send_header(
            s,
            {
                "method": "convert",
                "id": "c-1",
                "prompt_id": prompt_id,
                "input": {
                    "sample_rate": sr,
                    "channels": 1,
                    "encoding": "pcm_f32le",
                    "byte_length": len(pcm),
                },
                "options": {"n_steps": 32, "cfg": 3.0, "auto_shift": True, "pitch_shift": 0},
            },
        )
        send_frame(s, KIND_REQUEST_BLOB, pcm)
        kind, body = recv_json(s)
        if kind != KIND_RESPONSE_HEADER or not body.get("ok"):
            raise SmokeFailure(f"convert header failed: {kind:#x} {body}")
        out_len = body["output"]["byte_length"]
        kind, blob = recv_frame(s)
        if kind != KIND_RESPONSE_BLOB:
            raise SmokeFailure(f"convert: expected RESPONSE_BLOB, got {kind:#x}")
        if len(blob) != out_len:
            raise SmokeFailure(f"convert: blob {len(blob)} != declared {out_len}")
        if blob != pcm:
            raise SmokeFailure("convert pass-through stub must return input bytes unchanged")
    finally:
        s.close()
    print(
        f"  [ok] convert round-trip -> {len(blob)} bytes returned, rtf={body.get('rtf')}, "
        f"wall_clock_ms={body.get('wall_clock_ms')} (pass-through identity verified)"
    )


def check_convert_unknown_prompt(sock_path: str) -> None:
    s = connect(sock_path)
    sr = 24000
    pcm = b"\x00\x00\x00\x00" * 100
    try:
        send_header(s, {"method": "hello", "id": "h-u", "protocol_version": "0.1"})
        recv_json(s)
        send_header(
            s,
            {
                "method": "convert",
                "id": "c-u",
                "prompt_id": "spirit.nobody.v0",
                "input": {
                    "sample_rate": sr,
                    "channels": 1,
                    "encoding": "pcm_f32le",
                    "byte_length": len(pcm),
                },
                "options": {},
            },
        )
        send_frame(s, KIND_REQUEST_BLOB, pcm)
        kind, body = recv_json(s)
        if kind != KIND_ERROR or body.get("code") != "E_PROMPT_UNKNOWN":
            raise SmokeFailure(f"convert unknown prompt: expected E_PROMPT_UNKNOWN, got {kind:#x} {body}")
    finally:
        s.close()
    print("  [ok] convert with unknown prompt_id -> E_PROMPT_UNKNOWN (non-fatal)")


def run_all(sock_path: str) -> int:
    print(f"smoke test against {sock_path}")
    check_ping(sock_path)
    check_hello_ok(sock_path)
    prompt_id = check_register_and_list(sock_path)
    check_convert_roundtrip(sock_path, prompt_id)
    check_convert_unknown_prompt(sock_path)
    check_unknown_method(sock_path)
    check_hello_protocol_mismatch(sock_path)
    print("ALL CHECKS PASSED")
    return 0


def _wait_for_socket(sock_path: str, timeout: float = 10.0) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if Path(sock_path).exists():
            try:
                s = connect(sock_path)
                s.close()
                return
            except OSError:
                pass
        time.sleep(0.05)
    raise SmokeFailure(f"daemon socket {sock_path} did not come up within {timeout}s")


def run_self_contained() -> int:
    here = Path(__file__).resolve().parent
    daemon_py = here / "semantic_delay_daemon.py"
    if not daemon_py.exists():
        raise SmokeFailure(f"daemon source not found beside this test: {daemon_py}")
    tmp = Path(tempfile.mkdtemp(prefix="sd-smoke-"))
    sock = tmp / "daemon.sock"
    pid = tmp / "daemon.pid"
    prompts = tmp / "prompts"
    proc = subprocess.Popen(
        [sys.executable, str(daemon_py), "--sock", str(sock),
         "--pidfile", str(pid), "--prompts-dir", str(prompts), "--log-level", "WARNING"]
    )
    try:
        _wait_for_socket(str(sock))
        rc = run_all(str(sock))
        # Graceful shutdown via the RPC method.
        s = connect(str(sock))
        send_header(s, {"method": "shutdown", "id": "x-1"})
        recv_json(s)
        s.close()
        try:
            proc.wait(timeout=5.0)
        except subprocess.TimeoutExpired:
            proc.terminate()
        return rc
    finally:
        if proc.poll() is None:
            proc.terminate()


def main() -> int:
    p = argparse.ArgumentParser(description="Semantic Delay daemon RPC v0.1 smoke test")
    p.add_argument("--sock", default=None, help="path to a running daemon's socket")
    p.add_argument("--self", action="store_true", dest="self_contained",
                   help="spawn a daemon, run, tear down")
    args = p.parse_args()
    try:
        if args.self_contained or not args.sock:
            return run_self_contained()
        return run_all(args.sock)
    except SmokeFailure as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
