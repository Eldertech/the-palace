"""
Semantic Delay — Reference client (Stage 1 skeleton)
=====================================================

Stdlib-only synchronous client for the daemon's RPC v0.1 surface. The Stage 2
standalone instrument can import `DaemonClient` directly. The eventual VST
re-implements the same framing in C++; this file is the executable spec.
"""

from __future__ import annotations

import json
import socket
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

PROTOCOL_VERSION = "0.1"
MAX_FRAME_BYTES = 64 * 1024 * 1024

KIND_REQUEST_HEADER = 0x01
KIND_REQUEST_BLOB = 0x02
KIND_RESPONSE_HEADER = 0x10
KIND_RESPONSE_BLOB = 0x11
KIND_PROGRESS = 0x20
KIND_ERROR = 0x30
KIND_PING = 0x40
KIND_PONG = 0x41


class DaemonError(RuntimeError):
    def __init__(self, code: str, message: str, request_id: Optional[str] = None):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.request_id = request_id


@dataclass
class ConvertResult:
    audio_out: bytes
    sample_rate: int
    applied_pitch_shift: int
    rtf: float
    wall_clock_ms: int


class DaemonClient:
    """Synchronous Unix-socket client. Hold one instance per worker thread."""

    def __init__(self, sock_path: Path):
        self.sock_path = Path(sock_path)
        self.sock: Optional[socket.socket] = None

    # -- connection --

    def connect(self) -> None:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.connect(str(self.sock_path))
        self.sock = s

    def close(self) -> None:
        if self.sock is not None:
            try:
                self.sock.close()
            except OSError:
                pass
            self.sock = None

    def __enter__(self) -> "DaemonClient":
        self.connect()
        return self

    def __exit__(self, *exc: Any) -> None:
        self.close()

    # -- framing --

    def _recv_exact(self, n: int) -> bytes:
        assert self.sock is not None
        out = bytearray()
        while len(out) < n:
            chunk = self.sock.recv(n - len(out))
            if not chunk:
                raise ConnectionError("daemon closed connection")
            out.extend(chunk)
        return bytes(out)

    def _send_frame(self, kind: int, payload: bytes) -> None:
        assert self.sock is not None
        if len(payload) + 1 > MAX_FRAME_BYTES:
            raise DaemonError("E_FRAME_TOO_LARGE", f"client frame {len(payload)+1} > {MAX_FRAME_BYTES}")
        self.sock.sendall(struct.pack(">I", len(payload) + 1) + bytes([kind]) + payload)

    def _recv_frame(self) -> Tuple[int, bytes]:
        prefix = self._recv_exact(4)
        (length,) = struct.unpack(">I", prefix)
        body = self._recv_exact(length)
        return body[0], bytes(body[1:])

    def _send_header(self, obj: Dict[str, Any]) -> None:
        self._send_frame(KIND_REQUEST_HEADER, json.dumps(obj, separators=(",", ":")).encode("utf-8"))

    def _recv_header(self) -> Dict[str, Any]:
        kind, payload = self._recv_frame()
        if kind == KIND_ERROR:
            obj = json.loads(payload.decode("utf-8"))
            raise DaemonError(obj.get("code", "E_UNKNOWN"), obj.get("message", ""), obj.get("id"))
        if kind != KIND_RESPONSE_HEADER:
            raise DaemonError("E_FRAME_MALFORMED", f"expected RESPONSE_HEADER, got KIND={kind:#x}")
        return json.loads(payload.decode("utf-8"))

    def _recv_blob(self, expected: int) -> bytes:
        kind, payload = self._recv_frame()
        if kind != KIND_RESPONSE_BLOB:
            raise DaemonError("E_FRAME_MALFORMED", f"expected RESPONSE_BLOB, got KIND={kind:#x}")
        if len(payload) != expected:
            raise DaemonError("E_FRAME_MALFORMED", f"blob len {len(payload)} != declared {expected}")
        return payload

    # -- public API --

    def hello(self) -> Dict[str, Any]:
        self._send_header({"method": "hello", "id": "h-1", "protocol_version": PROTOCOL_VERSION})
        return self._recv_header()

    def prompts_list(self) -> Dict[str, Any]:
        self._send_header({"method": "prompts.list", "id": "pl-1"})
        return self._recv_header()

    def prompts_register(
        self,
        prompt_id: str,
        label: str,
        pcm: bytes,
        sample_rate: int,
    ) -> Dict[str, Any]:
        self._send_header({
            "method": "prompts.register",
            "id": "pr-1",
            "prompt_id": prompt_id,
            "label": label,
            "input": {
                "sample_rate": sample_rate,
                "channels": 1,
                "encoding": "pcm_f32le",
                "byte_length": len(pcm),
            },
        })
        self._send_frame(KIND_REQUEST_BLOB, pcm)
        return self._recv_header()

    def convert(
        self,
        prompt_id: str,
        pcm: bytes,
        sample_rate: int,
        *,
        n_steps: int = 32,
        cfg: float = 3.0,
        auto_shift: bool = True,
        pitch_shift: int = 0,
        output_sample_rate: Optional[int] = None,
    ) -> ConvertResult:
        self._send_header({
            "method": "convert",
            "id": "c-1",
            "prompt_id": prompt_id,
            "input": {
                "sample_rate": sample_rate,
                "channels": 1,
                "encoding": "pcm_f32le",
                "byte_length": len(pcm),
            },
            "options": {
                "n_steps": n_steps,
                "cfg": cfg,
                "auto_shift": auto_shift,
                "pitch_shift": pitch_shift,
                "output_sample_rate": output_sample_rate,
            },
        })
        self._send_frame(KIND_REQUEST_BLOB, pcm)
        header = self._recv_header()
        out_meta = header["output"]
        audio_out = self._recv_blob(int(out_meta["byte_length"]))
        return ConvertResult(
            audio_out=audio_out,
            sample_rate=int(out_meta["sample_rate"]),
            applied_pitch_shift=int(header.get("applied_pitch_shift", 0)),
            rtf=float(header.get("rtf", 0.0)),
            wall_clock_ms=int(header.get("wall_clock_ms", 0)),
        )

    def shutdown(self) -> Dict[str, Any]:
        self._send_header({"method": "shutdown", "id": "x-1"})
        return self._recv_header()
