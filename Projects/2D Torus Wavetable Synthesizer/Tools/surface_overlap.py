#!/usr/bin/env python3
"""
surface_overlap.py
==================

Which surface pairs does the morph law actually matter for? For every pair in
the catalog: how much of their 2D lattice spectrum they share (overlap, 0 =
disjoint, 1 = same magnitudes), their phase-aware correlation, and the
predicted mid-morph level (a = 0.5) for a spatial height-map crossfade vs a
spectral c_mn crossfade, with both surfaces normalised to unit energy (DC out).

Disjoint pairs dip exactly -3 dB either way — the law is irrelevant and an
equal-power crossfade is the whole fix. Overlapping pairs with opposed phase
(negative corr) are where spatial morphing cancels and spectral morphing earns
its FFT.

Usage:  python3 surface_overlap.py        (run from Tools/)
"""
import sys
import numpy as np
sys.path.insert(0,'.')
from scan_surface import load_surface
names=['10_membrane','11_chladni_ghost','12_theta_surface','13_stiff_string','14_knot_shadow','15_penrose_lattice','16_kuramoto_bloom','17_matern_field','18_fisher_ridge']
F={n:np.fft.rfft2(load_surface(f'../Wavetables/{n}.wav')) for n in names}
for n in F: F[n][0,0]=0
def stats(a,b):
    A,B=F[a],F[b]
    pa,pb=np.abs(A)**2,np.abs(B)**2
    # normalise each to unit energy
    A=A/np.sqrt(pa.sum());B=B/np.sqrt(pb.sum())
    overlap=np.sum(np.abs(A)*np.abs(B))           # 1 = identical magnitude spectra, 0 = disjoint
    corr=np.real(np.sum(A*np.conj(B)))            # phase-aware
    sp=0.25*np.sum(np.abs(A+B)**2)                # spatial mid power (unit-energy ends)
    sc=np.sum((0.5*np.abs(A)+0.5*np.abs(B))**2)
    return overlap,corr,10*np.log10(sp),10*np.log10(sc)
for i,a in enumerate(names):
    for b in names[i+1:]:
        o,c,sp,sc=stats(a,b)
        print(f"{a[3:]:16s} {b[3:]:16s} overlap {o:.3f} corr {c:+.3f} spatial {sp:+.2f}dB spectral {sc:+.2f}dB")
