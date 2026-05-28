"""
Semantic Delay — Inference Daemon (Stage 1 skeleton)
=====================================================

Protocol: RPC v0.1 — see ./RPC-v0.1.md

This file is the *runnable skeleton* of the daemon: transport, framing,
dispatcher, prompt-wav registry, lifecycle. **Model wiring is deliberately
stubbed**; `convert` returns the input audio unchanged with `rtf=0.0` so the
plugin/standalone work at Stage 2 can integrate against a real socket *before*
the SoulX-Singer-SVC build is in the loop.

To complete Stage 1 → Stage 1.5:
  - Replace `_InferenceWorker._convert_stub()` with a call into
    `cli.inference_svc.process()`-equivalent code (build_model once at startup,
    feed prompt_wav + prompt_f0 + target_wav + target_f0).
  - Replace `_extract_f0_stub()` with the bundled RMVPE call from
    `Soul-AILab/SoulX-Singer-Preprocess`.
  - Plumb the `auto_shift` / `pitch_shift` / `n_steps` / `cfg` options through
    to the model.

Run:
    python semantic_delay_daemon.py

The skeleton uses only the Python stdlib so it runs in the palace env without
pulling in PyTorch. The Stage 1.5 patch will add torch + soulxsinger imports.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import signal
import socket
import struct
import sys
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from queue import Queue, Empty
from typing import Any, Awaitable, Callable, Dict, List, Optional

# ----------------------------------------------------------------------------
# Constants — see RPC-v0.1.md §2
# ----------------------------------------------------------------------------

PROTOCOL_VERSION = "0.1"
BUILD_ID = "semantic-delay-daemon 0.1.0-skeleton"
MAX_FRAME_BYTES = 64 * 1024 * 1024  # 64 MiB

KIND_REQUEST_HEADER = 0x01
KIND_REQUEST_BLOB = 0x02
KIND_RESPONSE_HEADER = 0x10
KIND_RESPONSE_BLOB = 0x11
KIND_PROGRESS = 0x20
KIND_ERROR = 0x30
KIND_PING = 0x40
KIND_PONG = 0x41

MODEL_SAMPLE_RATE = 24000  # SoulX-Singer / F5-TTS convention

DEFAULT_RUNTIME_DIR = Path(f"/tmp/semantic-delay-{os.getuid()}")
DEFAULT_SOCK_PATH = DEFAULT_RUNTIME_DIR / "daemon.sock"
DEFAULT_PID_PATH = DEFAULT_RUNTIME_DIR / "daemon.pid"
DEFAULT_PROMPTS_DIR = Path.home() / ".local" / "share" / "semantic-delay" / "prompts"

log = logging.getLogger("semantic-delay-daemon")


# ----------------------------------------------------------------------------
# Framing
# ----------------------------------------------------------------------------


class FrameError(Exception):
    """Raised on malformed wire data — fatal for the connection."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class Frame:
    kind: int
    payload: bytes  # raw bytes; JSON-decoded by the dispatcher for header kinds


async def read_frame(reader: asyncio.StreamReader) -> Frame:
    """Read one length-prefixed frame; raise FrameError on malformed input."""
    prefix = await reader.readexactly(4)
    (length,) = struct.unpack(">I", prefix)
    if length < 1:
        raise FrameError("E_FRAME_MALFORMED", "frame length < 1 (missing KIND)")
    if length > MAX_FRAME_BYTES:
        raise FrameError(
            "E_FRAME_TOO_LARGE",
            f"frame length {length} exceeds max {MAX_FRAME_BYTES}",
        )
    body = await reader.readexactly(length)
    kind = body[0]
    payload = bytes(body[1:])
    return Frame(kind=kind, payload=payload)


async def write_frame(writer: asyncio.StreamWriter, kind: int, payload: bytes) -> None:
    """Write a single length-prefixed frame."""
    if len(payload) + 1 > MAX_FRAME_BYTES:
        raise FrameError(
            "E_FRAME_TOO_LARGE",
            f"outgoing frame {len(payload) + 1} exceeds max {MAX_FRAME_BYTES}",
        )
    writer.write(struct.pack(">I", len(payload) + 1) + bytes([kind]) + payload)
    await writer.drain()


def encode_json(obj: Dict[str, Any]) -> bytes:
    return json.dumps(obj, separators=(",", ":")).encode("utf-8")


def decode_json(payload: bytes) -> Dict[str, Any]:
    try:
        return json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise FrameError("E_FRAME_MALFORMED", f"bad JSON: {e}")


# ----------------------------------------------------------------------------
# Prompt-wav registry — see RPC-v0.1.md §3.3 / §3.4
# ----------------------------------------------------------------------------


@dataclass
class PromptEntry:
    id: str
    label: str
    wav_path: Path  # raw float32 PCM at MODEL_SAMPLE_RATE after preprocessing
    f0_path: Path  # cached .npy of F0 contour at MODEL_SAMPLE_RATE
    duration_sec: float
    sample_rate: int = MODEL_SAMPLE_RATE


class PromptRegistry:
    """In-memory + on-disk registry of reference singer wavs and cached F0.

    Stage 1 skeleton stores metadata only; Stage 1.5 fills in F0 extraction
    via RMVPE and persists both the resampled wav and the .npy contour.
    """

    def __init__(self, prompts_dir: Path):
        self.prompts_dir = prompts_dir
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
        self._entries: Dict[str, PromptEntry] = {}
        self._lock = threading.Lock()

    def scan_disk(self) -> None:
        """Populate from any prompt + f0 pairs already on disk."""
        for wav in self.prompts_dir.glob("*.wav"):
            f0 = wav.with_suffix(".f0.npy")
            if not f0.exists():
                continue
            prompt_id = wav.stem
            self._entries[prompt_id] = PromptEntry(
                id=prompt_id,
                label=prompt_id,
                wav_path=wav,
                f0_path=f0,
                duration_sec=0.0,  # filled by Stage 1.5 from wav header
            )
        log.info("prompt registry: scanned %d entries from %s",
                 len(self._entries), self.prompts_dir)

    def list(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [
                {
                    "id": e.id,
                    "label": e.label,
                    "duration_sec": e.duration_sec,
                    "f0_cached": e.f0_path.exists(),
                    "source_path": str(e.wav_path.relative_to(self.prompts_dir.parent))
                    if self.prompts_dir.parent in e.wav_path.parents
                    else str(e.wav_path),
                }
                for e in self._entries.values()
            ]

    def get(self, prompt_id: str) -> Optional[PromptEntry]:
        with self._lock:
            return self._entries.get(prompt_id)

    def register(
        self,
        prompt_id: str,
        label: str,
        pcm_bytes: bytes,
        sample_rate: int,
    ) -> PromptEntry:
        """Stage 1 skeleton: write the raw bytes to disk, defer F0 to Stage 1.5.

        Stage 1.5 will: resample to MODEL_SAMPLE_RATE, run RMVPE for F0,
        save .f0.npy beside the .wav.
        """
        wav_path = self.prompts_dir / f"{prompt_id}.wav"
        f0_path = self.prompts_dir / f"{prompt_id}.f0.npy"
        # Stage 1.5 TODO: write a proper RIFF/WAV header and resampled PCM.
        # Skeleton writes raw bytes verbatim so the registry shape is
        # exercisable end-to-end without DSP libs.
        wav_path.write_bytes(pcm_bytes)
        # Stage 1.5 TODO: real F0 extraction via RMVPE.
        f0_path.write_bytes(b"")  # placeholder

        entry = PromptEntry(
            id=prompt_id,
            label=label,
            wav_path=wav_path,
            f0_path=f0_path,
            # Stage 1.5: fill from real audio metadata.
            duration_sec=len(pcm_bytes) / (sample_rate * 4),  # float32 mono
            sample_rate=sample_rate,
        )
        with self._lock:
            self._entries[prompt_id] = entry
        return entry


# ----------------------------------------------------------------------------
# Inference worker — single thread owns the GPU/MPS context
# ----------------------------------------------------------------------------


@dataclass
class ConvertJob:
    prompt_id: str
    audio_in: bytes  # float32 mono LE
    input_sr: int
    output_sr: int
    options: Dict[str, Any]
    future: "asyncio.Future[Any]"
    loop: asyncio.AbstractEventLoop


class _InferenceWorker(threading.Thread):
    """Owns the model and the GPU context. Stage 1 skeleton stubs inference."""

    def __init__(self, registry: PromptRegistry):
        super().__init__(name="semantic-delay-inference", daemon=True)
        self.registry = registry
        self.queue: "Queue[Optional[ConvertJob]]" = Queue()
        self.model_loaded = threading.Event()
        self._stopping = threading.Event()

    def stop(self) -> None:
        self._stopping.set()
        self.queue.put(None)

    def run(self) -> None:
        log.info("inference worker: starting model load (stubbed)")
        # Stage 1.5 TODO:
        #   - import torch; from soulxsinger.models.soulxsinger_svc import SoulXSingerSVC
        #   - apply MPS patches (float() cast on F0; vocoder to CPU; PYTORCH_ENABLE_MPS_FALLBACK)
        #   - load config + checkpoint as in cli/inference_svc.py
        #   - keep model in scope on `self.model`
        time.sleep(0.1)  # simulate the latency of `build_model(...)`
        self.model_loaded.set()
        log.info("inference worker: model loaded (skeleton); ready for jobs")

        while not self._stopping.is_set():
            try:
                job = self.queue.get(timeout=0.5)
            except Empty:
                continue
            if job is None:
                break
            try:
                result = self._convert_stub(job)
                job.loop.call_soon_threadsafe(job.future.set_result, result)
            except FrameError as fe:
                # Structured error from the worker (e.g. E_PROMPT_UNKNOWN).
                # Preserve the code; do not re-wrap as E_INFERENCE.
                job.loop.call_soon_threadsafe(job.future.set_exception, fe)
            except Exception as e:
                log.exception("inference failed for prompt_id=%s", job.prompt_id)
                job.loop.call_soon_threadsafe(
                    job.future.set_exception,
                    FrameError("E_INFERENCE", str(e)),
                )

    def _convert_stub(self, job: ConvertJob) -> Dict[str, Any]:
        """Stage 1 stub. Returns input bytes unchanged, as if RTF=0.

        Stage 1.5 will replace this with:
          1. resample(job.audio_in, job.input_sr -> MODEL_SAMPLE_RATE)
          2. RMVPE(target_pcm) -> target_f0
          3. load prompt_pcm + prompt_f0 from registry
          4. model.infer(pt_wav, gt_wav, pt_f0, gt_f0, auto_shift, pitch_shift, n_steps, cfg)
          5. resample(generated, MODEL_SAMPLE_RATE -> job.output_sr)
          6. return float32 LE bytes + applied_pitch_shift + timing
        """
        t0 = time.monotonic()
        prompt = self.registry.get(job.prompt_id)
        if prompt is None:
            raise FrameError("E_PROMPT_UNKNOWN", f"no such prompt: {job.prompt_id}")
        # Pass-through stub.
        audio_out = job.audio_in
        wall_ms = int((time.monotonic() - t0) * 1000)
        input_sec = len(job.audio_in) / (job.input_sr * 4)
        rtf = (wall_ms / 1000.0) / max(input_sec, 1e-6)
        return {
            "audio_out": audio_out,
            "output_sample_rate": job.output_sr,
            "applied_pitch_shift": int(job.options.get("pitch_shift", 0)),
            "wall_clock_ms": wall_ms,
            "rtf": round(rtf, 3),
        }


# ----------------------------------------------------------------------------
# Connection handler — one task per TCP/AF_UNIX connection
# ----------------------------------------------------------------------------


class Daemon:
    def __init__(
        self,
        sock_path: Path,
        pid_path: Path,
        prompts_dir: Path,
    ):
        self.sock_path = sock_path
        self.pid_path = pid_path
        self.registry = PromptRegistry(prompts_dir)
        self.worker = _InferenceWorker(self.registry)
        self.server: Optional[asyncio.AbstractServer] = None
        self._shutdown_event: Optional[asyncio.Event] = None

    # -- lifecycle --

    def _claim_pidfile(self) -> None:
        self.pid_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        if self.pid_path.exists():
            try:
                existing = int(self.pid_path.read_text().strip())
                os.kill(existing, 0)
                raise RuntimeError(
                    f"daemon already running as pid {existing}; "
                    f"refusing to start"
                )
            except ProcessLookupError:
                log.warning("removing stale pidfile %s", self.pid_path)
                self.pid_path.unlink(missing_ok=True)
            except ValueError:
                self.pid_path.unlink(missing_ok=True)
        self.pid_path.write_text(str(os.getpid()))

    def _release_pidfile(self) -> None:
        try:
            self.pid_path.unlink(missing_ok=True)
        except OSError:
            pass

    def _unlink_stale_sock(self) -> None:
        if self.sock_path.exists():
            try:
                # Test if it's a live listening socket by trying to connect.
                s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
                try:
                    s.connect(str(self.sock_path))
                    s.close()
                    raise RuntimeError(
                        f"a process is already listening on {self.sock_path}"
                    )
                except (ConnectionRefusedError, FileNotFoundError):
                    pass
                finally:
                    try:
                        s.close()
                    except OSError:
                        pass
            except OSError:
                pass
            self.sock_path.unlink(missing_ok=True)

    async def start(self) -> None:
        self._shutdown_event = asyncio.Event()
        self._claim_pidfile()
        self._unlink_stale_sock()
        self.registry.scan_disk()
        self.worker.start()

        self.server = await asyncio.start_unix_server(
            self._handle_connection, path=str(self.sock_path)
        )
        os.chmod(self.sock_path, 0o600)
        log.info("listening on %s", self.sock_path)

        # Signal handlers are best-effort: asyncio only installs them on the
        # main thread of the main interpreter. When the daemon runs embedded
        # in a test harness or another asyncio task, we silently skip — the
        # caller drives shutdown via request_shutdown() directly.
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, lambda: self.request_shutdown("signal"))
            except (NotImplementedError, ValueError, RuntimeError):
                # NotImplementedError: not supported on this platform.
                # ValueError/RuntimeError: not on main thread.
                pass

    def request_shutdown(self, reason: str) -> None:
        log.info("shutdown requested (%s)", reason)
        if self._shutdown_event is not None:
            self._shutdown_event.set()

    async def serve_until_shutdown(self) -> None:
        assert self._shutdown_event is not None
        await self._shutdown_event.wait()
        await self._teardown()

    async def _teardown(self) -> None:
        log.info("teardown: closing server")
        if self.server is not None:
            self.server.close()
            await self.server.wait_closed()
        self.worker.stop()
        self.worker.join(timeout=5.0)
        try:
            self.sock_path.unlink(missing_ok=True)
        except OSError:
            pass
        self._release_pidfile()
        log.info("teardown: complete")

    # -- per-connection dispatcher --

    async def _handle_connection(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        peer = id(writer)
        log.info("[%s] connection opened", peer)
        try:
            while True:
                try:
                    frame = await read_frame(reader)
                except asyncio.IncompleteReadError:
                    log.info("[%s] client closed", peer)
                    return
                except FrameError as e:
                    await self._send_error(writer, request_id=None, code=e.code, message=e.message)
                    return  # fatal framing errors close the connection

                if frame.kind == KIND_PING:
                    await write_frame(writer, KIND_PONG, b"")
                    continue
                if frame.kind != KIND_REQUEST_HEADER:
                    await self._send_error(
                        writer,
                        request_id=None,
                        code="E_FRAME_MALFORMED",
                        message=f"expected REQUEST_HEADER, got KIND={frame.kind:#x}",
                    )
                    return

                header = decode_json(frame.payload)
                req_id = header.get("id")
                method = header.get("method")
                try:
                    handler = self._dispatch.get(method)
                    if handler is None:
                        await self._send_error(
                            writer,
                            request_id=req_id,
                            code="E_METHOD_UNKNOWN",
                            message=f"unknown method: {method!r}",
                        )
                        continue
                    await handler(self, reader, writer, header)
                except FrameError as e:
                    await self._send_error(writer, request_id=req_id, code=e.code, message=e.message)
        except Exception:
            log.exception("[%s] handler crashed", peer)
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except OSError:
                pass

    async def _send_error(
        self,
        writer: asyncio.StreamWriter,
        request_id: Optional[str],
        code: str,
        message: str,
    ) -> None:
        try:
            await write_frame(
                writer,
                KIND_ERROR,
                encode_json({"ok": False, "id": request_id, "code": code, "message": message}),
            )
        except OSError:
            pass

    # -- method handlers --

    async def _handle_hello(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        header: Dict[str, Any],
    ) -> None:
        client_pv = header.get("protocol_version")
        if client_pv != PROTOCOL_VERSION:
            raise FrameError(
                "E_PROTOCOL_MISMATCH",
                f"daemon speaks {PROTOCOL_VERSION}, client speaks {client_pv!r}",
            )
        body = {
            "ok": True,
            "id": header.get("id"),
            "protocol_version": PROTOCOL_VERSION,
            "model": {
                "name": "SoulX-Singer-SVC",
                "sr": MODEL_SAMPLE_RATE,
                "loaded": self.worker.model_loaded.is_set(),
                "device": "mps",
            },
            "prompt_count": len(self.registry.list()),
            "build": BUILD_ID,
        }
        await write_frame(writer, KIND_RESPONSE_HEADER, encode_json(body))

    async def _handle_prompts_list(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        header: Dict[str, Any],
    ) -> None:
        body = {"ok": True, "id": header.get("id"), "prompts": self.registry.list()}
        await write_frame(writer, KIND_RESPONSE_HEADER, encode_json(body))

    async def _handle_prompts_register(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        header: Dict[str, Any],
    ) -> None:
        prompt_id = header.get("prompt_id")
        label = header.get("label", prompt_id)
        inp = header.get("input") or {}
        if not isinstance(prompt_id, str) or not prompt_id:
            raise FrameError("E_AUDIO_FORMAT", "prompt_id is required")
        try:
            sr = int(inp["sample_rate"])
            byte_length = int(inp["byte_length"])
            encoding = inp.get("encoding", "pcm_f32le")
            channels = int(inp.get("channels", 1))
        except (KeyError, TypeError, ValueError) as e:
            raise FrameError("E_AUDIO_FORMAT", f"bad input descriptor: {e}")
        if encoding != "pcm_f32le" or channels != 1:
            raise FrameError(
                "E_AUDIO_FORMAT",
                f"v0.1 supports pcm_f32le mono only; got {encoding} ch={channels}",
            )
        blob = await self._read_blob(reader, byte_length)
        entry = self.registry.register(prompt_id, label, blob, sr)
        body = {
            "ok": True,
            "id": header.get("id"),
            "prompt_id": entry.id,
            "duration_sec": entry.duration_sec,
            "f0_cached": entry.f0_path.exists() and entry.f0_path.stat().st_size > 0,
            "stored_at": str(entry.wav_path),
        }
        await write_frame(writer, KIND_RESPONSE_HEADER, encode_json(body))

    async def _handle_convert(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        header: Dict[str, Any],
    ) -> None:
        if not self.worker.model_loaded.is_set():
            raise FrameError("E_MODEL_NOT_LOADED", "model still loading; retry shortly")
        prompt_id = header.get("prompt_id")
        if not isinstance(prompt_id, str):
            raise FrameError("E_AUDIO_FORMAT", "prompt_id is required")
        inp = header.get("input") or {}
        opts = header.get("options") or {}
        try:
            in_sr = int(inp["sample_rate"])
            byte_length = int(inp["byte_length"])
            encoding = inp.get("encoding", "pcm_f32le")
            channels = int(inp.get("channels", 1))
        except (KeyError, TypeError, ValueError) as e:
            raise FrameError("E_AUDIO_FORMAT", f"bad input descriptor: {e}")
        if encoding != "pcm_f32le" or channels != 1:
            raise FrameError(
                "E_AUDIO_FORMAT",
                f"v0.1 supports pcm_f32le mono only; got {encoding} ch={channels}",
            )
        out_sr = int(opts.get("output_sample_rate") or in_sr)

        audio_in = await self._read_blob(reader, byte_length)

        loop = asyncio.get_running_loop()
        future: "asyncio.Future[Any]" = loop.create_future()
        job = ConvertJob(
            prompt_id=prompt_id,
            audio_in=audio_in,
            input_sr=in_sr,
            output_sr=out_sr,
            options=opts,
            future=future,
            loop=loop,
        )
        self.worker.queue.put(job)
        result = await future

        out_bytes: bytes = result["audio_out"]
        body = {
            "ok": True,
            "id": header.get("id"),
            "output": {
                "sample_rate": result["output_sample_rate"],
                "channels": 1,
                "encoding": "pcm_f32le",
                "byte_length": len(out_bytes),
            },
            "applied_pitch_shift": result["applied_pitch_shift"],
            "rtf": result["rtf"],
            "wall_clock_ms": result["wall_clock_ms"],
        }
        await write_frame(writer, KIND_RESPONSE_HEADER, encode_json(body))
        await write_frame(writer, KIND_RESPONSE_BLOB, out_bytes)

    async def _handle_shutdown(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
        header: Dict[str, Any],
    ) -> None:
        body = {"ok": True, "id": header.get("id")}
        await write_frame(writer, KIND_RESPONSE_HEADER, encode_json(body))
        self.request_shutdown("shutdown method")

    async def _read_blob(self, reader: asyncio.StreamReader, expected_len: int) -> bytes:
        frame = await read_frame(reader)
        if frame.kind != KIND_REQUEST_BLOB:
            raise FrameError(
                "E_FRAME_MALFORMED",
                f"expected REQUEST_BLOB, got KIND={frame.kind:#x}",
            )
        if len(frame.payload) != expected_len:
            raise FrameError(
                "E_FRAME_MALFORMED",
                f"blob length {len(frame.payload)} != declared {expected_len}",
            )
        return frame.payload

    # Method dispatch table — populated below the class because Python won't
    # bind unbound methods to the class dict in a way that's easy to call via
    # `handler(self, …)`. The simplest correct shape is module-level functions
    # that take the daemon as first arg; we use bound methods stored under
    # the string method name.
    _dispatch: Dict[str, Callable[..., Awaitable[None]]] = {}


# Bind handlers to the method-name dispatch table.
Daemon._dispatch = {
    "hello": Daemon._handle_hello,
    "prompts.list": Daemon._handle_prompts_list,
    "prompts.register": Daemon._handle_prompts_register,
    "convert": Daemon._handle_convert,
    "shutdown": Daemon._handle_shutdown,
}


# ----------------------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------------------


def _parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Semantic Delay inference daemon")
    p.add_argument("--sock", type=Path, default=DEFAULT_SOCK_PATH,
                   help=f"Unix socket path (default {DEFAULT_SOCK_PATH})")
    p.add_argument("--pidfile", type=Path, default=DEFAULT_PID_PATH,
                   help=f"PID file path (default {DEFAULT_PID_PATH})")
    p.add_argument("--prompts-dir", type=Path, default=DEFAULT_PROMPTS_DIR,
                   help=f"Prompt-wav storage directory (default {DEFAULT_PROMPTS_DIR})")
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


async def _amain(args: argparse.Namespace) -> int:
    logging.basicConfig(
        level=args.log_level.upper(),
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
    )
    daemon = Daemon(
        sock_path=args.sock,
        pid_path=args.pidfile,
        prompts_dir=args.prompts_dir,
    )
    await daemon.start()
    await daemon.serve_until_shutdown()
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    args = _parse_args(argv)
    try:
        return asyncio.run(_amain(args))
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(main())
