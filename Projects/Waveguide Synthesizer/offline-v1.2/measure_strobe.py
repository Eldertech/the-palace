# Measures the strobe view in study v1.2 by running the page's own worklet
# headless (../offline-v1/run_worklet.mjs), the same way cycle 8 measured v1.1.
#   A. the audio is unchanged: v1.2 vs v1.1, sample for sample
#   B. the picture holds still enough to read: frame-to-frame shape change,
#      live vs strobe. Caution: this metric also counts a narrow pulse that
#      simply moves half its width as "change" (see F, where the exact replay
#      of a sharp strike scores 0.75). Read it beside the physical number:
#      how far the wave travels between frames (live f0/60 cycles, strobe and
#      replay 1/(60 x slow) of a cycle).
#   C. each strobe frame is the real rail state at its capture instant
#   D. the strobe's clock: how far each frame moves the string on in its own cycle
#   E. frame cadence: are frames posted at a steady 60 a second?
#   F. the replay view: is each recorded row the real string, and does the
#      page's own replayFrame() play it back as true slow motion?
import json, subprocess, sys, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
RUNNER = os.path.join(HERE, '..', 'offline-v1', 'run_worklet.mjs')
V11 = os.path.join(HERE, '..', 'study-v1.1-in-tune', 'index.html')
V12 = os.path.join(HERE, '..', 'study-v1.2-strobe', 'index.html')
SCR = '/tmp/claude-0/-home-user-the-palace/b3996551-199a-5348-a80b-4e991fc929b4/scratchpad'
SR = 48000
sys.path.insert(0, os.path.join(HERE, '..', 'offline-v1'))

def run(html, events, seconds, tag, **extra):
    sc, of, vf = f'{SCR}/{tag}.json', f'{SCR}/{tag}.f32', f'{SCR}/{tag}_vis.f32'
    json.dump({'sampleRate': SR, 'seconds': seconds, 'events': events, **extra}, open(sc, 'w'))
    subprocess.run(['node', RUNNER, html, sc, of, vf], check=True, capture_output=True)
    audio = np.fromfile(of, dtype=np.float32)
    meta = json.load(open(vf + '.wave.json'))
    waves = np.fromfile(vf + '.wave.f32', dtype=np.float32).reshape(len(meta), 180) if meta else np.zeros((0, 180))
    probe = None
    if extra.get('probeEvery'):
        pm = json.load(open(vf + '.json'))
        probe = np.fromfile(vf, dtype=np.float32).reshape(pm['frames'], pm['points'])
    return audio, waves, meta, probe

def note(freq, stiff, pos, mode, view='strobe', slow=2.0, bright=0.55, bridge=0.985, nut=0.995):
    return [{'t': 0, 'msg': {'type': 'params', 'freq': freq, 'bright': bright, 'bridge': bridge, 'nut': nut, 'stiff': stiff}},
            {'t': 0, 'msg': {'type': 'view', 'mode': view, 'slow': slow}},
            {'t': 0, 'msg': {'type': 'pluck', 'position': pos, 'mode': mode}}]
LOWLOSS = dict(bright=0.9, bridge=0.999, nut=0.999)

def unit(w):
    return w / (np.linalg.norm(w, axis=-1, keepdims=True) + 1e-12)

def audible(w, floor_db=-40):
    # frames whose size is within floor_db of the loudest frame of the note
    r = np.sqrt(np.mean(w ** 2, axis=1))
    return r >= r.max() * 10 ** (floor_db / 20)

def shape_change(w):
    # How far each frame's SHAPE moves from the one before, with the decay
    # divided out: 0 = same shape, 1.41 = unrelated shapes, 2 = flipped.
    u = unit(w); d = np.linalg.norm(np.diff(u, axis=0), axis=1)
    keep = audible(w)[1:] & audible(w)[:-1]
    return d[keep]

def state_at(probe, t):
    # probe row k holds the rails after k+1 samples, i.e. the state at instant k+1
    k = np.floor(t).astype(int); f = (t - k)[..., None]
    return probe[k - 1] + f * (probe[k] - probe[k - 1])

if __name__ == '__main__':
    out = {}
    # ---- A. audio unchanged --------------------------------------------------
    from render import score as audition_score
    ev = audition_score()
    a11, *_ = run(V11, ev, 15.0, 'a11')
    a12, *_ = run(V12, ev, 15.0, 'a12')                      # strobe on (default)
    a12off, *_ = run(V12, [{'t': 0, 'msg': {'type': 'view', 'mode': 'live'}}] + ev, 15.0, 'a12off')
    a12rep, *_ = run(V12, [{'t': 0, 'msg': {'type': 'view', 'mode': 'replay'}}] + ev, 15.0, 'a12rep')
    out['A'] = {'max_abs_diff_strobe': float(np.abs(a12 - a11).max()),
                'max_abs_diff_live': float(np.abs(a12off - a11).max()),
                'max_abs_diff_replay': float(np.abs(a12rep - a11).max()),
                'samples': int(len(a11))}
    print('A. audio, v1.2 minus v1.1 over the 15 s audition:', out['A'])

    # ---- B + E. readability and cadence -------------------------------------
    # Shape change per frame, decay divided out, over the frames still within
    # 40 dB of the note's loudest frame. Default patch, centre pluck, and the
    # low-loss strike used for the pictures.
    rowsB = []
    for label, kw, pos, mode in [('default pluck', {}, 0.5, 'pluck'), ('low-loss strike', LOWLOSS, 0.13, 'strike')]:
        for f in [60, 82.4, 196, 440, 880]:
            _, wl, ml, _ = run(V12, note(f, 0.0, pos, mode, view='live', **kw), 2.0, 'bl')
            _, ws, ms, _ = run(V12, note(f, 0.0, pos, mode, view='strobe', **kw), 2.0, 'bs')
            cl, cs = shape_change(wl), shape_change(ws)
            gaps = np.diff([m['postedAt'] for m in ms])
            adv = np.diff([m['phase'] for m in ms]) % 1.0
            rowsB.append([label, f, float(np.median(cl)), float(np.median(cs)), float(np.percentile(cs, 95)), int(len(cs)),
                          float(gaps.mean()), float(gaps.min()), float(gaps.max()), float(adv.mean() * SR / f)])
            print('B. %-15s %6.1f Hz  live shape change %.2f  strobe %.3f (95th pct %.3f, %d frames)  gap mean %.1f [%d..%d]  advance %.3f samples/frame'
                  % tuple(rowsB[-1]))
    out['B'] = rowsB

    # ---- C + D. exactness and the strobe's clock, 196 Hz --------------------
    f0 = 196.0; P = SR / f0
    rowsD = []
    for label, kw, pos, mode in [('low-loss strike', LOWLOSS, 0.13, 'strike'), ('default pluck', {}, 0.5, 'pluck')]:
      for st in [0.0, 0.5, 1.0]:
        ev = note(f0, st, pos, mode, **kw)
        # strobe run (frames + capture instants) and a full-rate probe of the same note
        _, ws, ms, _ = run(V12, ev, 2.05, 'd')
        k0 = int(round(0.25 * SR))                          # reference cycle starts 0.25 s in
        need = (k0 + 2 * int(np.ceil(P)) + 4) / SR
        _, _, _, probe = run(V12, ev, max(need, 0.5) + 0.001, 'p', blockSize=1, probeEvery=1, probeSeconds=max(need, 0.5))
        # C: frames captured inside the probed span vs the probe, blended the
        # same way. (Frame 0 is the pluck shape itself, before any sample; the
        # probe starts one sample later, so it is left out.)
        inside = [i for i, m in enumerate(ms) if 1 <= m['capturedAt'] and m['capturedAt'] + 2 < len(probe)]
        truth = state_at(probe, np.array([ms[i]['capturedAt'] for i in inside]))
        errC = float(np.abs(ws[inside] - truth).max() / np.abs(truth).max())
        # D1: where in one real cycle (the one starting 0.25 s in) does each
        # audible frame best fit? A string let go from rest looks the same at
        # phase x and phase -x (it retraces its path), so the error is folded.
        grid = k0 + np.arange(0, P, 0.05)
        cyc = unit(state_at(probe, grid))
        keep = audible(ws)
        corr = unit(ws[keep]) @ cyc.T
        est = (grid[corr.argmax(axis=1)] / P) % 1.0          # the pluck is at sample 0
        design = np.array([m['phase'] for m in ms])[keep]
        d1 = np.abs((est - design + 0.5) % 1.0 - 0.5); d2 = np.abs((est + design + 0.5) % 1.0 - 0.5)
        err = np.minimum(d1, d2) * P                         # samples of string time
        # D2: does the string repeat its shape from one cycle to the next?
        t = k0 + np.arange(0, P, 1.0)
        rep = np.sum(unit(state_at(probe, t)) * unit(state_at(probe, t + P)), axis=1)
        # D3: strobe shape change per frame vs the best a slow-motion replay of
        # one real cycle could do (the same cycle, stepped by the same sliver)
        sc = shape_change(ws)
        ideal = np.linalg.norm(np.diff(unit(state_at(probe, k0 + np.arange(0, P, P / 120))), axis=0), axis=1)
        rowsD.append([label, st, errC, len(inside), float(np.median(err)), float(np.percentile(err, 95)),
                      float(rep.mean()), float(np.median(sc)), float(np.median(ideal))])
        print('C/D %-15s stiffness %.1f: frame vs probe max err %.1e (n=%d)  phase error median %.2f, 95th pct %.2f samples  cycle-to-cycle repeat %.4f  strobe shape change %.3f  ideal %.3f'
              % tuple(rowsD[-1]))
    out['CD'] = rowsD

    # ---- F. replay view, 196 Hz ---------------------------------------------
    rowsF = []
    for label, kw, pos, mode in [('low-loss strike', LOWLOSS, 0.13, 'strike'), ('default pluck', {}, 0.5, 'pluck')]:
      for st in [0.0, 0.5, 1.0]:
        ev = note(f0, st, pos, mode, view='replay', **kw)
        run(V12, ev, 0.05, 'r')
        vf = f'{SCR}/r_vis.f32'
        rm = json.load(open(vf + '.replay.json'))
        rec = np.fromfile(vf + '.replay.f32', dtype=np.float32).reshape(rm['rows'], 180)
        _, _, _, probe = run(V12, ev, 0.03, 'rp', blockSize=1, probeEvery=1, probeSeconds=0.025)
        errRec = float(np.abs(rec[1:] - probe[:rm['rows'] - 1]).max() / np.abs(rec).max())   # row k = state(k) = probe[k-1]
        subprocess.run(['node', os.path.join(HERE, 'replay_probe.mjs'), V12, vf + '.replay.f32', '2.0', '2.0', f'{SCR}/rf.f32'],
                       check=True, capture_output=True)
        rj = json.load(open(f'{SCR}/rf.f32.json'))
        scr = np.fromfile(f'{SCR}/rf.f32', dtype=np.float32).reshape(rj['frames'], 180)
        tpos = np.array(rj['positions'])
        full = np.vstack([rec[:1], probe[:rm['rows'] - 1]])            # the true string, instant 0 onward
        truth = full[np.floor(tpos).astype(int)] + (tpos - np.floor(tpos))[:, None] * (full[np.floor(tpos).astype(int) + 1] - full[np.floor(tpos).astype(int)])
        errPlay = float(np.abs(scr - truth).max() / np.abs(truth).max())
        adv = float(np.median(np.diff(tpos)))
        # screen frames that wrap back to the start of the loop are not motion
        sc = np.linalg.norm(np.diff(unit(scr), axis=0), axis=1)[np.diff(tpos) > 0]
        rowsF.append([label, st, rm['rows'], errRec, errPlay, adv, float(np.median(sc)), float(np.percentile(sc, 95))])
        print('F. %-15s stiffness %.1f: %d rows recorded  row vs probe max err %.1e  screen frame vs true string %.1e  advance %.3f samples/frame  shape change median %.3f, 95th pct %.3f'
              % tuple(rowsF[-1]))
    out['F'] = rowsF
    json.dump(out, open(os.path.join(HERE, 'measurements.json'), 'w'), indent=1)
