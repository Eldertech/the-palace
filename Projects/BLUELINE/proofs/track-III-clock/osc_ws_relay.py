#!/usr/bin/env python3
"""
BLUELINE Track III — the OSC → WebSocket relay (Shop machinery).

Receives OSC over UDP (from the M4L device, or the transport simulator stand-in) and
rebroadcasts each message as JSON to all connected browser WebSocket clients. Also
serves the clock client at /. One small local hop:  M4L --OSC/UDP--> relay --WS/JSON--> browser.

Run (comfy venv has aiohttp):
  <comfy venv python> osc_ws_relay.py
Listens: OSC UDP on :9001, WS + client on http://127.0.0.1:8770
"""
import asyncio, json, os
from aiohttp import web
from osclib import decode

HERE = os.path.dirname(os.path.abspath(__file__))
PREVIZ = os.path.join(HERE, "..", "m0-previz")   # M0 previz client lives one folder over
M1 = os.path.join(HERE, "..", "m1-animatic")     # M1 animatic register player
M2 = os.path.join(HERE, "..", "m2-motion-comic") # M2 motion-comic register player
ANIM = os.path.join(HERE, "..", "animatic")      # the rendered-board animatic (real board PNGs on the clock)
OSC_PORT, HTTP_PORT = 9001, 8770
clients = set()

async def ws_handler(request):
    ws = web.WebSocketResponse(); await ws.prepare(request)
    clients.add(ws)
    try:
        async for _ in ws:   # we only broadcast; ignore inbound
            pass
    finally:
        clients.discard(ws)
    return ws

async def index(request):
    return web.FileResponse(os.path.join(HERE, "clock_client.html"))

async def previz(request):
    return web.FileResponse(os.path.join(PREVIZ, "previz.html"))

async def storyboard(request):
    return web.FileResponse(os.path.join(PREVIZ, "storyboard.json"))

async def m1(request):
    return web.FileResponse(os.path.join(M1, "m1-animatic.html"))

async def m2(request):
    return web.FileResponse(os.path.join(M2, "m2-motion-comic.html"))

async def animatic(request):
    return web.FileResponse(os.path.join(ANIM, "animatic.html"))

def broadcast(obj):
    data = json.dumps(obj)
    for ws in list(clients):
        if not ws.closed:
            asyncio.create_task(ws.send_str(data))

class OSCProto(asyncio.DatagramProtocol):
    def datagram_received(self, data, addr):
        try:
            msg = decode(data)
        except Exception:
            return
        broadcast(msg)

async def main():
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_get("/previz", previz)
    app.router.add_get("/storyboard.json", storyboard)
    app.router.add_get("/m1", m1)
    app.router.add_get("/m2", m2)
    app.router.add_get("/animatic", animatic)
    app.router.add_static("/boards", os.path.join(ANIM, "boards"))  # serves boards/NN.png to the animatic page
    app.router.add_get("/ws", ws_handler)
    runner = web.AppRunner(app); await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", HTTP_PORT).start()
    loop = asyncio.get_running_loop()
    await loop.create_datagram_endpoint(lambda: OSCProto(), local_addr=("127.0.0.1", OSC_PORT))
    print(f"relay up — clock http://127.0.0.1:{HTTP_PORT}/  ·  previz /previz  ·  m1 /m1  ·  m2 /m2  ·  animatic /animatic  ·  WS /ws  ·  OSC/UDP :{OSC_PORT}", flush=True)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
