"""Pixel Zone — tutorial de reserva: a light chiptune bed, UI sounds for taps and steps, Lagzilla's voice → out/mix.wav.
Reads events.json (exported from the page timeline) and voices/*.wav + voices/dur.json.
Run with the library's Python:  LIB=<lemo-opuscar> "$LIB/.venv/bin/python" mix.py"""
import os, sys, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or sys.exit('set LIB to the library folder')
sys.path.insert(0, LIB)
from core.audio import sfx as X
from core.audio.sfx import SR, add, lp, hp, bp, noise, t_, env_exp, compress, limit

EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; E = EV['ev']
N = int(DUR * SR) + SR
BPM = 120; BEAT = 60 / BPM; BAR = 4 * BEAT
def bt(b, beat=1): return (b - 1) * BAR + (beat - 1) * BEAT
rng = np.random.default_rng(5)
def mk(): return np.zeros((N, 2), np.float32)
music, fx, amb, vox = mk(), mk(), mk(), mk()

# ———————— chip voices ————————
def hzm(m): return 440 * 2 ** ((m - 69) / 12)
NM = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n): return 12 * (int(n[-1]) + 1) + NM[n[0]] + (1 if '#' in n else 0)
def adsr(d, a=.005, dcy=.08, s=.6, r=.05):
    n = len(t_(d)); e = np.ones(n) * s; na, nd, nr = min(int(a * SR), n), int(dcy * SR), min(int(r * SR), n // 2)
    if na: e[:na] = np.linspace(0, 1, na)
    if nd: e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def pulse(mm, d, v=.2, duty=.25, vib=0):
    tt = t_(d); f = hzm(mm) * (1 + vib * np.sin(2 * np.pi * 6 * tt) * np.clip(tt / .2, 0, 1)); ph = np.cumsum(f / SR) % 1
    return (lp((ph < duty).astype(float) * 2 - 1, 6000) * adsr(d) * v).astype(np.float32)
def tri(mm, d, v=.35):
    tt = t_(d); ph = (tt * hzm(mm)) % 1; x = 4 * np.abs(ph - .5) - 1; x = np.round(x * 8) / 8
    return (x * adsr(d, .003, .05, .85, .03) * v).astype(np.float32)
def kick(v=.8):
    tt = t_(.25); f = 50 + 130 * np.exp(-tt / .025); x = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-tt / .09)
    return (x * v).astype(np.float32)
def snare(v=.4):
    tt = t_(.18); x = (np.round(rng.uniform(-1, 1, len(tt)) * 4) / 4) * np.exp(-tt / .05) * .8 + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / .03) * .4
    return (hp(x, 900) * v).astype(np.float32)
def hat(v=.1, d=.04): return (hp(noise(d), 8000) * env_exp(d, .01) * v).astype(np.float32)
def crash(v=.3): return (hp(noise(1.6), 4000) * env_exp(1.6, .5) * v).astype(np.float32)

CH = {'Am': ['A2', 'C4', 'E4', 'A4'], 'F': ['F2', 'A3', 'C4', 'F4'], 'C': ['C3', 'E4', 'G4', 'C5'], 'G': ['G2', 'B3', 'D4', 'G4']}
PROG = ['Am', 'F', 'C', 'G']
def chord(b): return CH[PROG[(b - 1) % 4]]
def groove(b, lvl=1.0, drums=True, arp=True, bassline=True):
    c = chord(b); t0 = bt(b)
    if drums:
        for k in (1, 3): add(music, kick(.6 * lvl), bt(b, k), 1, 0)
        add(music, kick(.35 * lvl), bt(b, 3) + BEAT / 2, 1, 0)
        for k in (2, 4): add(music, snare(.32 * lvl), bt(b, k), 1, .05)
        for i in range(8): add(music, hat((.09 if i % 2 else .06) * lvl), t0 + i * BEAT / 2, 1, .35)
    if bassline:
        for i in range(8): add(music, tri(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .9, .3 * lvl), t0 + i * BEAT / 2, 1, 0)
    if arp:
        for i in range(16): add(music, pulse(m(c[1 + i % 3]) + 12, BEAT / 4 * .9, .05 * lvl, .125), t0 + i * BEAT / 4, 1, .4 if i % 2 else -.4)
LEAD = [  # victory hook, 2 bars (beats, note, length)
    (0, 'E5', .5), (.5, 'A5', .5), (1, 'C6', .75), (2, 'B5', .5), (2.5, 'A5', .5), (3, 'G5', 1),
    (4, 'F5', .5), (4.5, 'A5', .5), (5, 'C6', .5), (5.5, 'E6', 1.5), (7, 'D6', .5), (7.5, 'C6', .5)]
def lead(b, v=.13, oct=0):
    for bb, n, d in LEAD: add(music, pulse(m(n) + 12 * oct, d * BEAT * .95, v, .25, .006), bt(b) + bb * BEAT, 1, .1)

# a light, friendly groove all the way through (quieter under the voice), a little lift on each step
for k in range(int(DUR / BAR) + 1):
    t0 = k * BAR
    if t0 >= DUR - .5: break
    c = CH[PROG[k % 4]]; lvl = .55 if t0 < 48.4 else .8
    for kk in (0, 2): add(music, kick(.45 * lvl), t0 + kk * BEAT, 1, 0)
    for kk in (1, 3): add(music, snare(.2 * lvl), t0 + kk * BEAT, 1, .05)
    for i in range(8): add(music, hat((.07 if i % 2 else .05) * lvl), t0 + i * BEAT / 2, 1, .35)
    for i in range(8): add(music, tri(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .9, .24 * lvl), t0 + i * BEAT / 2, 1, 0)
    for i in range(8): add(music, pulse(m(c[1 + i % 3]) + 12, BEAT / 2 * .8, .035 * lvl, .125), t0 + i * BEAT / 2, 1, .4 if i % 2 else -.4)
for bb, n, d in LEAD: add(music, pulse(m(n), d * BEAT * .95, .1, .25, .006), 48.4 + 1.0 + bb * BEAT, 1, .1)
music = music[:N]
music[int((DUR - .6) * SR):] *= np.linspace(1, 0, len(music[int((DUR - .6) * SR):]))[:, None]
def blip(notes, d=.07, v=.25, duty=.5): return np.concatenate([pulse(n, d, v, duty) for n in notes]).astype(np.float32)
def shimmer(d=1.4, v=.25, base=84):
    tt = t_(d); x = np.zeros_like(tt)
    for i in range(10): f = hzm(base + rng.integers(0, 14)); st = rng.uniform(0, d * .5); x += np.sin(2 * np.pi * f * tt) * np.exp(-np.clip(tt - st, 0, None) / .35) * (tt > st)
    return (x / 10 * v).astype(np.float32)
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'tap': add(fx, X.click(1.8, .5).astype(np.float32), t, .5, .1); add(fx, blip([84], .04, .1, .25), t, .4)
    elif ty == 'page': add(fx, X.whoosh(.3, .4).astype(np.float32), t - .15, .3)
    elif ty == 'step': add(fx, blip([72, 76, 79] if e['n'] < 3 else [72, 76, 79, 84], .06, .14, .25), t, .55)
    elif ty == 'hook': add(fx, blip([72, 79, 84, 91], .06, .15, .25), t, .55); add(fx, shimmer(1.6, .35, 88), t + .2, .5)
    elif ty == 'end': add(fx, shimmer(2.0, .4, 88), t, .6); add(fx, X.thump(.7, 55).astype(np.float32), t, .5)
    elif ty == 'pop': add(fx, blip([84, 91], .05, .14), t, .5)

# ———————— voices ————————
vo_spans = []
for e in E:
    if e['type'] != 'vo': continue
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    if w.ndim > 1: w = w.mean(1)
    w = soxr.resample(w, sr, SR).astype(np.float32)
    pan = 0.0
    if e.get('ann'):   # the arcade announcer: bigger, a bit of grit, an echo
        w = np.tanh(w * 2.2).astype(np.float32) * .8; d = int(.16 * SR); w = np.concatenate([w, np.zeros(int(.5 * SR), np.float32)]); ec = np.zeros_like(w); ec[d:] = w[:-d] * .35; ec[2 * d:] += w[:-2 * d] * .15; w = (w + ec).astype(np.float32)
    elif e.get('dlg'): w = lp(w, 7000).astype(np.float32); pan = .15
    w = compress(w, thr=.2, ratio=3).astype(np.float32); w = w / (np.sqrt(np.mean(w[np.abs(w) > .01] ** 2)) + 1e-9) * (.11 if e.get('ann') else .1)
    add(vox, w, e['t'], 1.0, pan)
    vo_spans.append((e['t'], e['t'] + len(w) / SR))
# ———————— mix ————————
duck = np.ones(N, np.float32)
for a, b in vo_spans:
    s, e_ = int((a - .1) * SR), int((b + .15) * SR); duck[max(0, s):e_] = np.minimum(duck[max(0, s):e_], .34)
k = int(.08 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same').astype(np.float32)
music *= duck[:, None] * .78
amb *= (.55 + .45 * duck)[:, None]
fx *= (.8 + .2 * duck)[:, None]
mix = music + fx + amb + vox * 1.9
mix = limit(mix, .95)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR)
for nm, x in (('music', music), ('fx', fx), ('amb', amb), ('vox', vox)): sf.write(os.path.join(HERE, f'out/stem_{nm}.wav'), x[:int(DUR * SR)], SR)
print('mix →', os.path.join(HERE, 'out/mix.wav'), f'{len(mix) / SR:.1f}s peak {np.abs(mix).max():.2f}')
