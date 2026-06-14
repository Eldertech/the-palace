"""Minimal OSC 1.0 encode/decode — no dependency. Enough for the transport contract
(int32 'i', float32 'f', string 's'). The M4L device emits the same wire format via [udpsend]."""
import struct

def _padlen(n):  # OSC strings: null-terminated, padded to a 4-byte boundary (always ≥1 null)
    return (n // 4 + 1) * 4

def _padstr(s):
    b = s.encode("utf-8")
    return b + b"\x00" * (_padlen(len(b)) - len(b))

def encode(address, *args):
    typetag = ","
    body = b""
    for a in args:
        if isinstance(a, bool):
            typetag += "T" if a else "F"            # OSC booleans carry no bytes
        elif isinstance(a, int):
            typetag += "i"; body += struct.pack(">i", a)
        elif isinstance(a, float):
            typetag += "f"; body += struct.pack(">f", a)
        else:
            typetag += "s"; body += _padstr(str(a))
    return _padstr(address) + _padstr(typetag) + body

def decode(data):
    end = data.index(b"\x00"); address = data[:end].decode("utf-8")
    i = _padlen(len(address))
    if i >= len(data) or data[i:i+1] != b",":
        return {"address": address, "args": []}
    tend = data.index(b"\x00", i); typetag = data[i:tend].decode("utf-8")
    j = i + _padlen(len(typetag)); args = []
    for t in typetag[1:]:
        if t == "i":
            args.append(struct.unpack(">i", data[j:j+4])[0]); j += 4
        elif t == "f":
            args.append(struct.unpack(">f", data[j:j+4])[0]); j += 4
        elif t == "s":
            send = data.index(b"\x00", j); s = data[j:send].decode("utf-8")
            args.append(s); j += _padlen(len(s))
        elif t == "T": args.append(True)
        elif t == "F": args.append(False)
    return {"address": address, "args": args}
