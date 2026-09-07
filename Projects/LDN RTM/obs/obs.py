#!/usr/bin/env python3
"""obs — a thin obs-websocket v5 client for the LDN RTM rig.

Deliberately small: connect, call, screenshot. The protocol is the source of truth
(obs-websocket docs/generated/protocol.md); this file only removes the boilerplate.

Authentication is expected to be OFF — the server binds localhost, and keeping a
password out of the workflow keeps it out of transcripts and scripts.
"""
import base64
import json
from pathlib import Path

import websocket

URL = "ws://127.0.0.1:4455"


class ObsError(RuntimeError):
    pass


class Obs:
    def __init__(self, url=URL, timeout=8):
        try:
            self.ws = websocket.create_connection(url, timeout=timeout)
        except Exception as e:
            raise ObsError(f"cannot reach OBS at {url} — is it running with the "
                           f"WebSocket server enabled? ({e})")
        hello = json.loads(self.ws.recv())
        if hello["d"].get("authentication"):
            raise ObsError("OBS requires a WebSocket password. Turn off "
                           "'Enable Authentication' in Tools → WebSocket Server Settings.")
        self.ws.send(json.dumps({"op": 1, "d": {"rpcVersion": 1}}))
        json.loads(self.ws.recv())
        self._n = 0

    def call(self, request_type, data=None, tolerate=False):
        self._n += 1
        rid = str(self._n)
        self.ws.send(json.dumps({"op": 6, "d": {"requestType": request_type,
                                                "requestId": rid,
                                                "requestData": data or {}}}))
        while True:
            m = json.loads(self.ws.recv())
            if m["op"] == 7 and m["d"]["requestId"] == rid:
                st = m["d"]["requestStatus"]
                if not st["result"]:
                    if tolerate:
                        return None
                    raise ObsError(f"{request_type} failed: "
                                   f"{st.get('comment') or st.get('code')}")
                return m["d"].get("responseData") or {}

    def screenshot(self, source, path, width=1920, height=1080):
        r = self.call("GetSourceScreenshot", {
            "sourceName": source, "imageFormat": "png",
            "imageWidth": width, "imageHeight": height})
        Path(path).write_bytes(base64.b64decode(r["imageData"].split(",", 1)[1]))
        return path

    def item_id(self, scene, source):
        for it in self.call("GetSceneItemList", {"sceneName": scene})["sceneItems"]:
            if it["sourceName"] == source:
                return it["sceneItemId"]
        raise ObsError(f"no source {source!r} in scene {scene!r}")

    def transform(self, scene, source):
        return self.call("GetSceneItemTransform",
                         {"sceneName": scene,
                          "sceneItemId": self.item_id(scene, source)})["sceneItemTransform"]

    def set_transform(self, scene, source, **tf):
        return self.call("SetSceneItemTransform",
                         {"sceneName": scene, "sceneItemId": self.item_id(scene, source),
                          "sceneItemTransform": tf})

    def meters(self, seconds=4.0):
        """Peak dBFS per input, watched live -- post-fader AND pre-fader.

        `inputLevelsMul` gives three floats per channel: [0] magnitude, [1] peak,
        [2] **input peak, which is PRE-fader**. Taking max() across them silently
        reports the pre-fader tap, so OBS's own volume slider appears to do nothing
        (found 2026-09-02, by Loudon moving a fader and seeing no change).

        `rec` is what actually lands in the file; `inp` is what arrives at the wire.
        The gap between them is the fader, and the two failures they separate are
        different: no signal at all, versus signal thrown away by an OBS slider.
        """
        import math
        import time as _t
        ws = websocket.create_connection(URL, timeout=6)
        json.loads(ws.recv())
        # eventSubscriptions = InputVolumeMeters (1 << 16), nothing else
        ws.send(json.dumps({"op": 1, "d": {"rpcVersion": 1, "eventSubscriptions": 1 << 16}}))
        json.loads(ws.recv())
        peaks, end = {}, _t.time() + seconds
        while _t.time() < end:
            try:
                m = json.loads(ws.recv())
            except Exception:
                break
            if m.get("op") != 5 or m["d"].get("eventType") != "InputVolumeMeters":
                continue
            for inp in m["d"]["eventData"]["inputs"]:
                cur = peaks.setdefault(inp["inputName"], {"rec": 0.0, "inp": 0.0})
                for ch in inp.get("inputLevelsMul", []):
                    if len(ch) >= 3:
                        cur["rec"] = max(cur["rec"], ch[1])
                        cur["inp"] = max(cur["inp"], ch[2])
        ws.close()
        db = lambda v: 20 * math.log10(v) if v > 0 else -120.0
        return {n: {"rec": db(v["rec"]), "inp": db(v["inp"])} for n, v in peaks.items()}

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()
