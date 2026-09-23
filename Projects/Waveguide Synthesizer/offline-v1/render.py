# Renders the audition WAVs and the spacetime picture from the shipped
# worklets (via run_worklet.mjs — the browser's own code, run headless).
import json, subprocess, zlib, struct, numpy as np
from scipy.io import wavfile
from measure import run, V1, V11, SR, SCR

def score(stiff_scale=1.0):
    P = lambda t, **m: {'t': t, 'msg': dict(type='params', **m)}
    K = lambda t, pos, mode: {'t': t, 'msg': {'type': 'pluck', 'position': pos, 'mode': mode}}
    base = dict(bright=0.55, bridge=0.985, nut=0.995)
    return [
        P(0.0, freq=196, stiff=0.0, **base),        K(0.02, 0.5, 'pluck'),    # 1 pluck, centre
        K(2.5, 0.9, 'pluck'),                                                  # 2 pluck near the bridge
        P(5.0, freq=196, stiff=0.5),                K(5.02, 0.13, 'strike'),  # 3 strike, some stiffness
        P(7.5, freq=110, stiff=1.0, bright=0.8, bridge=0.995, nut=0.998), K(7.52, 0.13, 'strike'),  # 4 full stiffness: bar/bell
        P(10.5, freq=440, stiff=0.75, **base),      K(10.52, 0.3, 'pluck'),   # 5 high, stiff
        P(13.0, freq=330, stiff=0.0),               K(13.02, 0.5, 'pluck'),   # 6 pluck then hand-damp
        {'t': 13.8, 'msg': {'type': 'damp', 'on': True}},
    ]

def fade_write(path, x):
    x = x.astype(np.float64)
    n = int(0.01 * SR); x[-n:] *= np.linspace(1, 0, n)
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))

if __name__ == '__main__':
    ev = score()
    a = run(V1, ev, 15.0, 'aud_v1'); b = run(V11, ev, 15.0, 'aud_v11')
    # Both at true level, no normalisation: the level difference is one of the findings.
    fade_write('audition-v1.1.wav', b)
    fade_write('audition-v1-as-shipped.wav', a)
    print(json.dumps({'v1_peak_dbfs': float(20*np.log10(np.abs(a).max())), 'v11_peak_dbfs': float(20*np.log10(np.abs(b).max()))}))

    # Spacetime: a narrow strike near the nut, watched at full audio rate for
    # three round trips. Time runs down; position along the string runs across
    # (nut left, bridge right). Left panel stiffness 0, right panel stiffness 1.
    panels = []
    for st in [0.0, 1.0]:
        sc = {'sampleRate': SR, 'seconds': 0.02, 'blockSize': 2, 'probeEvery': 2, 'probeSeconds': 0.016,
              'events': [{'t': 0, 'msg': {'type': 'params', 'freq': 196, 'bright': 0.9, 'bridge': 0.999, 'nut': 0.999, 'stiff': st}},
                         {'t': 0, 'msg': {'type': 'pluck', 'position': 0.13, 'mode': 'strike'}}]}
        json.dump(sc, open(f'{SCR}/st.json', 'w'))
        subprocess.run(['node', 'run_worklet.mjs', V11, f'{SCR}/st.json', f'{SCR}/st.f32', f'{SCR}/st_vis.f32'], check=True, capture_output=True)
        meta = json.load(open(f'{SCR}/st_vis.f32.json'))
        v = np.fromfile(f'{SCR}/st_vis.f32', dtype=np.float32).reshape(meta['frames'], meta['points'])
        panels.append(v[:368])
    m = max(np.abs(p).max() for p in panels)
    bg = np.array([11, 13, 16.]); pos = np.array([255, 122, 61.]); neg = np.array([138, 122, 208.])
    def colour(v):
        t = np.clip(v / m, -1, 1)[..., None] ** 1
        s = np.abs(t) ** 0.55
        return np.where(t >= 0, bg + (pos - bg) * s, bg + (neg - bg) * s)
    gap = np.tile(bg, (368, 12, 1))
    img = np.concatenate([np.repeat(colour(panels[0]), 2, axis=1), gap, np.repeat(colour(panels[1]), 2, axis=1)], axis=1)
    img = np.repeat(img, 2, axis=0).astype(np.uint8)
    h, w, _ = img.shape
    raw = b''.join(b'\x00' + img[y].tobytes() for y in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open('spacetime-strike-stiffness-0-vs-1.png', 'wb').write(png)
    print('png', w, h)
