"""Pixel Zone — Level 001 (roteiro revisto): score (piano + synth), foley, voice and mix → out/mix.wav (48 kHz stereo).
Reads events.json (exported from the page timeline), voices/*.wav + voices/dur.json, voices/crowd/*.wav.
Run with the library's Python:  "$LIB/.venv/bin/python" mix.py   (LIB = the Lemo-Opuscar library folder)"""
import os, sys, json
import numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or sys.exit('set LIB to the library folder')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio import sfx as X
from core.audio.sfx import SR, add, lp, hp, bp, noise, t_, env_exp, compress, limit, norm

S.seed(7)
EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']; E = EV['ev']
N = int(DUR * SR) + SR
BPM = 90; BEAT = 60 / BPM; BAR = 4 * BEAT
def bt(b, beat=1): return (b - 1) * BAR + (beat - 1) * BEAT
rng = np.random.default_rng(11)

def mk(): return np.zeros((N, 2), np.float32)
music, fx, amb, vox = mk(), mk(), mk(), mk()

# ———————————————————————— SYNTH VOICES (numpy) ————————————————————————
def adsr(d, a=.01, dcy=.1, s=.7, r=.2):
    n = int(round(d * SR)); e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(dcy * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nd: e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def hzm(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, d, det=0):
    tt = t_(d); return 2 * ((tt * f * (1 + det)) % 1) - 1
def pad(m, d, v=.5):
    x = sum(saw(hzm(m), d, dt) for dt in (-.004, 0, .005)) / 3 + .4 * sum(saw(hzm(m + 12), d, dt) for dt in (-.003, .003)) / 2
    x = lp(lp(x, 1400), 2200) * adsr(d, .9, .3, .85, 1.2) * v
    return x.astype(np.float32)
def arp(m, d=.32, v=.5):   # soft pulse pluck (chip flavour, rounded)
    tt = t_(d); f = hzm(m); x = np.sign(np.sin(2 * np.pi * f * tt)) * .6 + np.sin(2 * np.pi * f * tt) * .4
    return (lp(x, 3200) * np.exp(-tt / .12) * v).astype(np.float32)
def bass(m, d, v=.6):
    tt = t_(d); f = hzm(m); x = np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt) + .15 * np.sin(6 * np.pi * f * tt)
    return (x * adsr(d, .02, .2, .8, .25) * v).astype(np.float32)
def lead(m, d, v=.35):
    tt = t_(d); f = hzm(m) * (1 + .004 * np.sin(2 * np.pi * 5.2 * tt) * np.clip(tt / .4, 0, 1)); ph = np.cumsum(2 * np.pi * f / SR)
    x = .55 * np.sign(np.sin(ph)) + .45 * np.sin(ph)
    return (lp(x, 2600) * adsr(d, .03, .2, .7, .3) * v).astype(np.float32)
def kick(v=.8):
    tt = t_(.35); f = 48 + 90 * np.exp(-tt / .03); x = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-tt / .12)
    return (x * v).astype(np.float32)
def tick(v=.2):
    return (hp(noise(.05), 7000) * env_exp(.05, .012) * v).astype(np.float32)

# ———————————————————————— SCORE (90 BPM): warm piano → curiosity → swell → silence → montage beat → piano + synth → the peak ————————————————————————
NM = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n): return 12 * (int(n[-1]) + 1) + NM[n[0]] + (1 if '#' in n else -1 if 'b' in n[1:-1] else 0)
CH = {'Am': ['A2', 'E3', 'A3', 'C4', 'E4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'Dm': ['D3', 'A3', 'D4', 'F4', 'A4']}
PROG = ['C', 'G', 'Am', 'F']
def chord(b): return CH[PROG[(b - 1) % 4]]
pno = []
def snare(v=.5):
    tt = t_(.22); x = hp(noise(.22), 1500) * np.exp(-tt / .06) * .7 + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .04) * .5
    return (x * v).astype(np.float32)
def drone(m0, d, v=.2):
    tt = t_(d); f = hzm(m0); x = sum(np.sin(2 * np.pi * f * k * tt * (1 + .002 * j)) / k for k, j in ((1, 0), (2, 1), (3, -1)))
    return (lp(x, 600) * adsr(d, 2.0, .5, .9, 2.0) * v).astype(np.float32)
def glitchb(v=.2):
    d = .18; tt = t_(d); x = np.sign(np.sin(2 * np.pi * rng.uniform(300, 1200) * tt)) * (rng.random(len(tt)) > .5)
    return (hp(x, 800) * np.exp(-tt / .05) * v).astype(np.float32)
def piano_bar(b, v=.22, pat=(0, 2, 3, 4, 3, 2), step=None):   # broken chord in eighths
    c = chord(b); step = step or BEAT / 2
    for i, k in enumerate(pat): pno.append((bt(b) + i * step, 'piano', m(c[k]), 1.4, v * (1 if i == 0 else .75), .1))
def groove(b0, b1, lvl=1.0, hats=True, kick_only=False):
    for b in range(b0, b1):
        c = chord(b); t0 = bt(b)
        for k in (1, 3): add(music, kick(.55 * lvl), bt(b, k), 1, 0)
        if kick_only: continue
        for k in (2, 4): add(music, snare(.3 * lvl), bt(b, k), 1, .05)
        if hats:
            for i in range(8): add(music, tick(.08 * lvl), t0 + i * BEAT / 2, 1, .3)
        for i in range(8): add(music, bass(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .85, .24 * lvl), t0 + i * BEAT / 2, 1, 0)
        for i in range(16): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .2, .09 * lvl), t0 + i * BEAT / 4, 1, .4 if i % 2 else -.3)
        for nn in c[1:4]: add(music, pad(m(nn) + 12, BAR + .4, .06 * lvl), t0, 1, 0)
LEAD = [(1, 'E5', 1), (2, 'G5', .5), (2.5, 'C6', 1.5), (4, 'B5', 1), (5, 'G5', 1.5), (6.5, 'A5', .5), (7, 'C6', 1), (8, 'B5', 1),
        (9, 'A5', 1), (10, 'C6', .5), (10.5, 'E6', 1.5), (12, 'D6', 1), (13, 'C6', 1.5), (14.5, 'A5', .5), (15, 'C6', 2)]
def lead_line(b0, v=.1, oct=0):
    for bb, n, d in LEAD: add(music, lead(m(n) + 12 * oct, d * BEAT, v), bt(b0) + (bb - 1) * BEAT, 1, .15)
# 1–2 (0–24): warm piano, a soft pad; a curious pluck when he says he has an idea
add(music, pad(m('C3'), 24, .045), 0, 1, 0)
for b in range(1, 10): piano_bar(b, .38 if b < 6 else .3)
for i, n in enumerate(('E5', 'G5', 'C6', 'D6', 'E6')): add(music, arp(m(n), .3, .09), 19.6 + i * BEAT / 2, 1, .3)
# flashback (24–28): shimmering arpeggio of curiosity
for i in range(24): add(music, arp(m(['C5', 'E5', 'G5', 'B5'][i % 4]) + (12 if i >= 12 else 0), .22, .07), 24.0 + i * BEAT / 4, 1, .3 if i % 2 else -.3)
add(music, pad(m('E3'), 4.4, .06), 24.0, 1, 0)
# 3 (29.33–42.67): it starts to become real — pulse bass, kick, piano chords, swell … then silence
for b in range(12, 17):
    lv = .5 + (b - 12) * .14
    piano_bar(b, .1 * lv + .04, pat=(0, 2, 4, 2, 3, 4, 3, 2), step=BEAT / 2)
    for i in range(8): add(music, bass(m(chord(b)[0]), BEAT / 2 * .8, .08 * lv), bt(b) + i * BEAT / 2, 1, 0)
    if b >= 13: add(music, kick(.25 * lv), bt(b, 1), 1, 0); add(music, kick(.18 * lv), bt(b, 3), 1, 0)
    for nn in chord(b)[1:4]: add(music, pad(m(nn) + 12, BAR + .3, .03 * lv), bt(b), 1, 0)
tt = t_(2.4); ris = (hp(noise(2.4), 900) * (tt / 2.4) ** 2 * .14 + np.sin(2 * np.pi * (220 + 700 * (tt / 2.4) ** 2) * tt) * (tt / 2.4) ** 2 * .07)
add(music, ris.astype(np.float32), 40.25, 1, 0)
SIL = bt(17); music[int(SIL * SR):] = 0   # (everything above stops dead on the cut)
# 4 (42.67–52): silence; one low note when the balance shows 0,00 €
pno.append((46.3, 'piano', m('A1'), 4.0, .32, 0)); pno.append((46.3, 'piano', m('E2'), 4.0, .2, 0))
add(music, drone(m('A1'), 6.0, .05), 46.0, 1, 0)
# 5 (52–65.33): the restaurant noise turns into a beat that grows with every shift
add(music, kick(.45), 52.0, 1, 0); add(music, kick(.4), 52.67, 1, 0)
groove(21, 22, .45, hats=False); groove(22, 23, .6, hats=True); groove(23, 24, .75); groove(24, 25, .9)
tt = t_(1.6); ris2 = hp(noise(1.6), 1200) * (tt / 1.6) ** 2 * .35; add(music, ris2.astype(np.float32), 63.8, 1, 0)
# 6 (65.33–77.33): the room comes alive — piano + synth melody opens when the lights come on
for b in range(25, 27): piano_bar(b, .2)
add(music, pad(m('C3'), 4.0, .08), bt(25, 3), 1, 0)
for b in range(27, 30): piano_bar(b, .22); [add(music, pad(m(nn) + 12, BAR + .4, .07), bt(b), 1, 0) for nn in chord(b)[1:4]]
lead_line(27, .07)
groove(28, 30, .55, hats=False)
# 7 (77.33–86.67): opening day — the groove grows
groove(30, 34, .85); lead_line(30, .08); lead_line(32, .08)
# 8 (86.67–103.5): the peak — when he watches them play; a breath on the callbacks; the last swell on "Hoje…"
groove(34, 35, 1.1); lead_line(34, .1, 1)
for t, n in ((91.0, 'C5'), (92.6, 'A4'), (94.3, 'F4')): pno.append((t, 'piano', m(n), 1.8, .3, .1)); pno.append((t, 'piano', m(n) - 12, 1.8, .2, -.1))
add(music, pad(m('F3'), 5.0, .08), 91.0, 1, 0)
groove(37, 39, 1.15); lead_line(37, .1, 1)
for b in (37, 38): piano_bar(b, .2)
FIN = 103.5
for nn, v in (('C2', .5), ('C3', .42), ('G3', .38), ('E4', .4), ('G4', .38), ('C5', .36)): pno.append((FIN, 'piano', m(nn), 6.5, v, 0))
add(music, pad(m('C4'), 6.5, .12), FIN, 1, 0); add(music, pad(m('G4'), 6.5, .1), FIN, 1, 0)
music[int((FIN - .05) * SR):int(FIN * SR)] *= np.linspace(1, 0, int(FIN * SR) - int((FIN - .05) * SR))[:, None]
print('rendering piano…', flush=True)
music += S.render(pno, dur=N / SR, master=False)[:N]
music = S.room(music, size=.5, mix=.18).astype(np.float32)

# ———————————————————————— FOLEY ————————————————————————
def stone_step(v):
    x = hp(noise(.09), 900) * env_exp(.09, .018) * .6; y = lp(noise(.06), 300) * env_exp(.06, .015) * .8; x[:len(y)] += y; return (x * v).astype(np.float32)
def wood_step(v): x = lp(noise(.12), 900) * env_exp(.12, .03) + .5 * np.sin(2 * np.pi * 140 * t_(.12)) * env_exp(.12, .04); return (x * v * .8).astype(np.float32)
def plush_step(v): x = lp(noise(.14), 400) * env_exp(.14, .05); return (x * v).astype(np.float32)
def scratch(d): x = bp(noise(d), 2500, 7000) * (.6 + .4 * np.sin(2 * np.pi * 9 * t_(d))) * env_exp(d, d * .6); return x.astype(np.float32)
def blip(notes, d=.07, v=.25):
    out = []
    for n in notes: tt = t_(d); out.append(np.sign(np.sin(2 * np.pi * hzm(n) * tt)) * np.exp(-tt / .06) * v)
    return lp(np.concatenate(out), 5000).astype(np.float32)
def shimmer(d=1.4, v=.25, base=84):
    tt = t_(d); x = np.zeros_like(tt)
    for i in range(10): f = hzm(base + rng.integers(0, 14)); st = rng.uniform(0, d * .5); x += np.sin(2 * np.pi * f * tt) * np.exp(-np.clip(tt - st, 0, None) / .35) * (tt > st)
    return (x / 10 * v).astype(np.float32)
def bell2():   # ding-dong door chime
    out = np.zeros(int(1.8 * SR))
    for st, n in ((0, 76), (.45, 72)):
        tt = t_(1.8 - st); f = hzm(n); x = (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / .2)) * np.exp(-tt / .7)
        s0 = int(st * SR); out[s0:s0 + len(x)] += x
    return (out * .35).astype(np.float32)
def buzz(d=.35, v=.2): tt = t_(d); return ((np.sin(2 * np.pi * 120 * tt) + .5 * np.sin(2 * np.pi * 240 * tt)) * np.exp(-tt / .12) * v).astype(np.float32)
def tape(): return (bp(noise(.3), 1800, 6000) * (rng.random(int(.3 * SR)) > .3) * env_exp(.3, .12) * .5).astype(np.float32)

def clipper(d, v):
    tt = t_(d); x = (np.sign(np.sin(2 * np.pi * 118 * tt)) * .4 + np.sin(2 * np.pi * 236 * tt) * .4 + hp(noise(d), 3000) * .15) * (1 + .15 * np.sin(2 * np.pi * 3.1 * tt))
    e = np.ones_like(tt); a = int(.05 * SR); e[:a] = np.linspace(0, 1, a); e[-a:] = np.linspace(1, 0, a)
    return (bp(x, 150, 5000) * e * v).astype(np.float32)
def keytap(v): x = hp(noise(.04), 2000) * env_exp(.04, .008); return (x * v).astype(np.float32)
def tickc(v=.3): x = hp(noise(.03), 3000) * env_exp(.03, .006) + .5 * np.sin(2 * np.pi * 2400 * t_(.03)) * env_exp(.03, .005); return (x * v).astype(np.float32)
def coin(v): tt = t_(.4); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / .12) for f in (3100, 4200, 5600)) / 3; return (x * v).astype(np.float32)
def plates(v): tt = t_(.5); x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / .1) for f in (1800, 2700, 3900)) / 3 + hp(noise(.5), 2000) * env_exp(.5, .05); return (x * v).astype(np.float32)
def fireCr(d): x = (hp(noise(d), 1500) * (rng.random(int(d * SR)) > .992) * 4 + lp(noise(d), 400) * .3); return x.astype(np.float32)
def drill(d=1.0): tt = t_(d); x = np.sign(np.sin(2 * np.pi * (180 + 40 * np.sin(2 * np.pi * 3 * tt)) * tt)) * .4 + hp(noise(d), 2000) * .2; return (bp(x, 200, 4000) * adsr(d, .05, .1, .9, .1) * .5).astype(np.float32)
def rest(d):
    x = bp(noise(d), 250, 2400); xp = np.arange(0, d + 1, .2); mod = np.interp(t_(d), xp, rng.uniform(.4, 1, len(xp))); y = x * mod * .5
    for i in range(int(d * 3)): s0 = int(rng.uniform(0, d - .5) * SR); c = plates(rng.uniform(.05, .15)); y[s0:s0 + len(c)] += c[:len(y[s0:s0 + len(c)])]
    return y.astype(np.float32)
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'step':
        f = stone_step if e.get('surf') in ('stone', 'tile') else wood_step; add(fx, f(e.get('g', .7) * rng.uniform(.8, 1.1)), t, .5, rng.uniform(-.1, .1))
    elif ty == 'clipper': add(fx, clipper(e['d'], .18), t, e.get('g', 1), -.1)
    elif ty == 'murmur': add(amb, (lp(bp(noise(e['d']), 250, 2200), 1800) * .12).astype(np.float32), t, e.get('g', .3))
    elif ty == 'cloth': add(fx, (bp(noise(.25), 800, 4000) * env_exp(.25, .08) * .4).astype(np.float32), t, .35)
    elif ty == 'key': add(fx, keytap(rng.uniform(.4, .8)), t, e.get('g', .5), -.2)
    elif ty == 'whoosh': add(fx, X.whoosh(.5, .7).astype(np.float32), t - .25, e.get('g', .4))
    elif ty == 'holo': add(fx, blip([84, 91, 96], .05, .16), t, .5 * e.get('g', 1), .2); add(fx, shimmer(1.4, .25, 86), t, .5 * e.get('g', 1))
    elif ty == 'clap': add(fx, (lp(noise(.12), 3000) * env_exp(.12, .03) * .6).astype(np.float32), t, e.get('g', .6))
    elif ty == 'tick':
        for k in range(int(e['d'])): add(fx, tickc(.35), t + k, .6, .3)
    elif ty == 'phoneTap': add(fx, X.click(1.6, .4).astype(np.float32), t, .4, .1)
    elif ty == 'bankSad': add(fx, blip([67, 63], .12, .14), t, .5, .1)
    elif ty == 'restaurant': add(amb, rest(e['d']), t, .55)
    elif ty == 'plates': add(fx, plates(.5), t, .6, .1)
    elif ty == 'ovenFire': add(amb, fireCr(1.4), t, .5, .3)
    elif ty == 'coins':
        for k in range(3): add(fx, coin(.4), t + k * .07, .5 * e.get('g', 1), .1)
    elif ty == 'paper': add(fx, (bp(noise(.3), 1200, 6000) * env_exp(.3, .1) * .4).astype(np.float32), t, .4)
    elif ty == 'box': add(fx, X.thump(.6).astype(np.float32), t, .5 * e.get('g', 1))
    elif ty == 'click': add(fx, X.click(.9, .9).astype(np.float32), t, .5 * e.get('g', 1), .2)
    elif ty == 'drill': add(fx, drill(1.0), t, .5, -.2)
    elif ty == 'thud': add(fx, X.thump(.8, 50).astype(np.float32), t, .6 * e.get('g', 1))
    elif ty == 'plop': add(fx, plush_step(1.0), t, .6 * e.get('g', 1), -.3)
    elif ty == 'lightsOn':
        add(fx, X.whoosh(.6, .8).astype(np.float32), t - .45, .5); add(fx, X.thump(.9, 55).astype(np.float32), t, .8); add(fx, shimmer(2.2, .4, 86), t, .8); add(fx, buzz(.8, .3), t, .5)
    elif ty == 'hum': add(amb, (np.sin(2 * np.pi * 60 * t_(e['d'])) * .3 * adsr(e['d'], .3, .1, 1, 1)).astype(np.float32), t, .05)
    elif ty == 'door': add(fx, X.creak(.7).astype(np.float32), t, .4, .35); add(fx, bell2(), t + .1, .5, .4)
    elif ty == 'laugh':
        w = (bp(noise(1.2), 400, 2500) * (np.sin(2 * np.pi * 5 * t_(1.2)) > 0) * env_exp(1.2, .5)).astype(np.float32); add(fx, w * .25, t, e.get('g', .4), rng.uniform(-.4, .4))
    elif ty == 'buttons':
        for k in range(int(e['d'] * 7)): add(fx, X.click(rng.uniform(1.4, 2.2), .25).astype(np.float32), t + k / 7 + rng.uniform(0, .1), .2 * rng.uniform(.4, 1), rng.uniform(-.6, .4))
    elif ty == 'cheer': add(fx, (bp(noise(1.4), 300, 3000) * adsr(1.4, .1, .3, .6, .6) * .4).astype(np.float32), t, e.get('g', .4))
    elif ty == 'sparkle': add(fx, shimmer(1.5, .45, 88), t, .8, .1); add(fx, blip([88, 91, 96], .05, .12), t + .1, .5)
    elif ty == 'achievement': add(fx, blip([72, 76, 79, 84, 88], .065, .2), t, .7); add(fx, shimmer(2.5, .3, 91), t + .2, .5)

# ———————————————————————— AMBIENCE BEDS ————————————————————————
def bed(t0, t1, gen, gain, fin=.6, fout=.8, pan=0):
    d = t1 - t0; x = gen(d); n = len(x); e = np.ones(n); a, b = int(fin * SR), int(fout * SR)
    e[:a] = np.linspace(0, 1, a); e[-b:] *= np.linspace(1, 0, b); add(amb, (x * e).astype(np.float32), t0, gain, pan)
bed(0, 28.0, lambda d: lp(noise(d), 500) * .06 + hp(lp(noise(d), 3000), 1500) * .02, .5, .3, .4)        # barbershop room tone
bed(42.67, 52.0, lambda d: lp(noise(d), 300) * .05, .4, .5, .3)                                             # the quiet room at night
bed(29.33, 42.6, lambda d: lp(noise(d), 600) * .04, .5, .5, .1)                                              # empty room tone
def murmur(d):
    x = bp(noise(d), 250, 2200); xp = np.arange(0, d + 1, .25); mod = np.interp(t_(d), xp, rng.uniform(.4, 1, len(xp))); return x * mod * .5
bed(78.5, 103.4, murmur, .14, 1.0, .8)
# ———————————————————————— VOICE ————————————————————————
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
vo_spans = []
for e in E:
    if e['type'] != 'vo': continue
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    w = soxr.resample(w, sr, SR).astype(np.float32)
    if e.get('dlg'): w = lp(w, 7000).astype(np.float32)
    if False:
        q = np.round(w * 24) / 24; w = (.75 * w + .25 * q).astype(np.float32)                     # light bitcrush
        tt = t_(len(w) / SR)[:len(w)]; gate = 1 - .25 * (np.sin(2 * np.pi * 31 * tt) > .97); w = (w * gate).astype(np.float32)
    if e.get('muffled'): w = lp(w, 900).astype(np.float32); w = (w + np.concatenate([np.zeros(int(.06 * SR), np.float32), w[:-int(.06 * SR)]]) * .4).astype(np.float32)
    w = compress(w, thr=.2, ratio=3).astype(np.float32); w = w / (np.sqrt(np.mean(w ** 2)) + 1e-9) * .1
    add(vox, w, e['t'], 1.0, -.15 if e.get('who') == 'LUCAS' else 0)
    vo_spans.append((e['t'], e['t'] + len(w) / SR))
# ———————————————————————— MIX ————————————————————————
duck = np.ones(N, np.float32)
for a, b in vo_spans:
    s, e_ = int((a - .15) * SR), int((b + .25) * SR); duck[max(0, s):e_] = np.minimum(duck[max(0, s):e_], .26)
k = int(.12 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same').astype(np.float32)
music *= duck[:, None] * 1.5
amb *= (.5 + .5 * duck)[:, None]
fx *= (.75 + .25 * duck)[:, None]
mix = music + fx + amb + vox * 1.9
mix[int(DUR * SR):] = 0
mix = limit(mix, .95)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR)
for nm, x in (('music', music), ('fx', fx), ('amb', amb), ('vox', vox)): sf.write(os.path.join(HERE, f'out/stem_{nm}.wav'), x[:int(DUR * SR)], SR)
print('mix →', os.path.join(HERE, 'out/mix.wav'), f'{len(mix) / SR:.1f}s peak {np.abs(mix).max():.2f}')
