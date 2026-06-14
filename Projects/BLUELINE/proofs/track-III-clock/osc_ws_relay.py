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
    app.router.add_get("/ws", ws_handler)
    runner = web.AppRunner(app); await runner.setup()
    await web.TCPSite(runner, "127.0.0.1", HTTP_PORT).start()
    loop = asyncio.get_running_loop()
    await loop.create_datagram_endpoint(lambda: OSCProto(), local_addr=("127.0.0.1", OSC_PORT))
    print(f"relay up — client+WS http://127.0.0.1:{HTTP_PORT}  ·  OSC/UDP :{OSC_PORT}", flush=True)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
