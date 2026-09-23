# Measures the shipped worklets (v1 and v1.1) through the node harness.
import json, subprocess, numpy as np, sys
SR = 48000
SCR = '/tmp/claude-0/-home-user-the-palace/b3996551-199a-5348-a80b-4e991fc929b4/scratchpad'
V1 = '../study-v1-one-string/index.html'; V11 = '../study-v1.1-in-tune/index.html'
def run(html, events, seconds, tag='m'):
    sc = f'{SCR}/{tag}.json'; of = f'{SCR}/{tag}.f32'
    json.dump({'sampleRate': SR, 'seconds': seconds, 'events': events}, open(sc, 'w'))
    subprocess.run(['node', 'run_worklet.mjs', html, sc, of], check=True, capture_output=True)
    return np.fromfile(of, dtype=np.float32)
def spec(x):
    seg = x[int(0.02*SR):int(1.02*SR)]; N = 1 << 21
    S = np.abs(np.fft.rfft(seg*np.hanning(len(seg)), N)); f = np.fft.rfftfreq(N, 1/SR); return f, S
def peak_near(f, S, target, width):
    idx = np.where((f > target-width) & (f < target+width))[0]; i = idx[np.argmax(S[idx])]
    a,b,c = np.log(S[i-1:i+2]+1e-30); p = 0.5*(a-c)/(a-2*b+c); return (i+p)*SR/(2*(len(S)-1))
def track(x, f0req, hs):
    f, S = spec(x)
    f0 = peak_near(f, S, f0req, f0req*0.3)
    out = [f0]; prev = f0
    for h in hs[1:]:
        # follow the stretch: predict from the last found partial's spacing
        guess = out[-1] * h / hs[len(out)-1]
        out.append(peak_near(f, S, guess, f0*0.35))
    return np.array(out)
def cents(a, b): return 1200*np.log2(a/b)
def ev(freq, stiff, pos=0.5, mode='pluck', bright=0.55, bridge=0.985, nut=0.995):
    return [{'t':0,'msg':{'type':'params','freq':freq,'bright':bright,'bridge':bridge,'nut':nut,'stiff':stiff}},
            {'t':0.001,'msg':{'type':'pluck','position':pos,'mode':mode}}]
if __name__ == '__main__':
    print('TUNING (stiffness 0 and 0.6), cents off the slider value')
    rows = []
    for freq in [82.4, 110, 196, 330, 440, 660, 880]:
        r = [freq]
        for html in [V1, V11]:
            for st in [0.0, 0.6]:
                x = run(html, ev(freq, st, mode='strike', bright=0.8), 1.1)
                r.append(cents(track(x, freq, [1])[0], freq))
        rows.append(r); print('  %6.1f Hz  v1: %+6.1f %+6.1f   v1.1: %+6.1f %+6.1f' % tuple(r))
    json.dump(rows, open(f'{SCR}/tuning.json','w'))
    print('STRETCH at 196 Hz, cents of partial h above h*f0')
    hs = list(range(1, 21))
    st_rows = []
    for html, name in [(V1,'v1'), (V11,'v1.1')]:
        for st in [0.0, 0.25, 0.5, 0.75, 1.0]:
            if name == 'v1' and st > 0.7: continue
            x = run(html, ev(196, st, pos=0.13, mode='strike', bright=0.9, bridge=0.999, nut=0.999), 1.1)
            p = track(x, 196, hs)
            c = [cents(p[h-1], h*p[0]) for h in hs]
            st_rows.append([name, st] + [c[1], c[4], c[9], c[19]])
            print(f'  {name:4s} stiff={st:.2f}: h2 {c[1]:+6.1f}  h5 {c[4]:+6.1f}  h10 {c[9]:+6.1f}  h20 {c[19]:+6.1f}')
    json.dump(st_rows, open(f'{SCR}/stretch.json','w'))
    print('LEVEL, default patch, pluck center')
    for html, name in [(V1,'v1'), (V11,'v1.1')]:
        for mode in ['pluck','strike']:
            x = run(html, ev(196, 0.0, mode=mode), 3.0)
            print(f'  {name:4s} {mode:6s}: peak {20*np.log10(np.abs(x).max()):+.1f} dBFS  rms(0-1s) {20*np.log10(np.sqrt(np.mean(x[:SR]**2))):+.1f} dBFS  mean {x.mean():+.4f}  finite {np.isfinite(x).all()}')
