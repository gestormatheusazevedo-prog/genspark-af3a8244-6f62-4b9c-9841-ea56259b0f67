"""Pixel Zone — Level 001: score (piano + synth), foley, voice and mix → out/mix.wav (48 kHz stereo).
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
T_TOUCH = 47.9; T_REVEAL = 50.667
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

# ———————————————————————— SCORE (90 BPM: suspense → synthwave) ————————————————————————
NM = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n): return 12 * (int(n[-1]) + 1) + NM[n[0]] + (1 if '#' in n else -1 if 'b' in n[1:-1] else 0)
CH = {'Am': ['A2', 'E3', 'A3', 'C4', 'E4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'Dm': ['D3', 'A3', 'D4', 'F4', 'A4']}
PROG = ['Am', 'F', 'C', 'G']
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
# 0–21.3: rain, a low drone, isolated piano notes
add(music, drone(m('A1'), 22, .07), 0, 1, 0)
for t, n in ((2.0, 'E5'), (6.5, 'C5'), (9.8, 'B4'), (13.0, 'A4'), (18.2, 'E5')): pno.append((t, 'piano', m(n), 3.0, .3, .2))
# the boot sound cuts the drone; after it, a colder drone
add(music, drone(m('C2'), 12, .06), 21.3, 1, 0)
for t, n in ((22.6, 'G4'), (25.4, 'D#5'), (29.0, 'B4')): pno.append((t, 'piano', m(n), 2.6, .26, -.2))
# 32–48: corridor — pulse grows (8ths bass + glitches), the heartbeat events sit on top
for b in range(13, 19):
    t0 = bt(b); g = .08 + (b - 13) * .025
    for i in range(8): add(music, bass(m('A1'), BEAT / 2 * .8, g), t0 + i * BEAT / 2, 1, 0)
    for i in range(4): add(music, glitchb(.05 + (b - 13) * .015), t0 + i * BEAT + BEAT * .75, 1, rng.uniform(-.6, .6))
    add(music, pad(m('A2'), BAR + .3, .05 + (b - 13) * .015), t0, 1, 0)
# the riser into the flash
tt = t_(2.3); ris = (hp(noise(2.3), 800) * (tt / 2.3) ** 2 * .4 + np.sin(2 * np.pi * (200 + 900 * (tt / 2.3) ** 2) * tt) * (tt / 2.3) ** 2 * .2)
add(music, ris.astype(np.float32), T_TOUCH - .3, 1, 0)
# 50.67–61.33: synthwave explodes
def groove(b0, b1, lvl=1.0, melody=None, hats=True):
    for b in range(b0, b1):
        c = chord(b); t0 = bt(b)
        for k in (1, 3): add(music, kick(.55 * lvl), bt(b, k), 1, 0)
        for k in (2, 4): add(music, snare(.32 * lvl), bt(b, k), 1, .05)
        if hats:
            for i in range(8): add(music, tick(.09 * lvl), t0 + i * BEAT / 2, 1, .3)
        for i in range(8): add(music, bass(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .85, .26 * lvl), t0 + i * BEAT / 2, 1, 0)
        for i in range(16): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .2, .1 * lvl), t0 + i * BEAT / 4, 1, .4 if i % 2 else -.3)
        for nn in c[1:4]: add(music, pad(m(nn) + 12, BAR + .4, .06 * lvl), t0, 1, 0)
LEAD = [(1, 'E5', 1), (2, 'G5', .5), (2.5, 'A5', 1.5), (4, 'G5', 1), (5, 'E5', 1.5), (6.5, 'D5', .5), (7, 'C5', 1), (8, 'D5', 1),
        (9, 'E5', 1), (10, 'G5', .5), (10.5, 'A5', 1.5), (12, 'C6', 1), (13, 'B5', 1.5), (14.5, 'A5', .5), (15, 'G5', 2)]
def lead_line(b0, v=.1, oct=0):
    for bb, n, d in LEAD: add(music, lead(m(n) + 12 * oct, d * BEAT, v), bt(b0) + (bb - 1) * BEAT, 1, .15)
tt = t_(3.0); boom = (np.sin(2 * np.pi * (60 * np.exp(-tt / .4) + 35) * tt) * np.exp(-tt / .7) * .8 + lp(noise(3.0), 3000) * np.exp(-tt / .5) * .2)
add(music, boom.astype(np.float32), T_REVEAL, 1, 0)
groove(20, 24, 1.0); lead_line(20, .09); lead_line(22, .09)
# 61.33–74.67: relaxed groove under the dialogue (no hats, softer)
groove(24, 29, .55, hats=False)
# 74.67–85.33: climax — full groove + lead an octave up
groove(29, 33, 1.1); lead_line(29, .1); lead_line(31, .08, 1)
# 85.33–90.67: drop to pad + piano for the last line
add(music, pad(m('F3'), BAR * 2 + .5, .1), bt(33), 1, 0)
for t, n in ((bt(33), 'A4'), (bt(33, 3), 'C5'), (bt(34), 'E5'), (bt(34, 3), 'D5')): pno.append((t, 'piano', m(n), 1.6, .34, .1))
FIN = bt(35)
for nn, v in (('A1', .5), ('A2', .42), ('E3', .38), ('C4', .4), ('E4', .38), ('A4', .36)): pno.append((FIN, 'piano', m(nn), 5.5, v, 0))
add(music, pad(m('A3'), 5.5, .12), FIN, 1, 0); add(music, pad(m('E4'), 5.5, .1), FIN, 1, 0)
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

for e in E:
    t, ty = e['t'], e['type']
    if ty == 'step':
        f = stone_step if e.get('surf') in ('stone', 'tile') else wood_step; add(fx, f(e.get('g', .7) * rng.uniform(.8, 1.1)), t, .5, e.get('pan', 0) + rng.uniform(-.05, .05))
    elif ty == 'stop': add(fx, stone_step(.5), t, .4)
    elif ty == 'doorCreak': add(fx, X.creak(.7).astype(np.float32), t, .5 * e.get('g', 1), .35)
    elif ty == 'latch': add(fx, X.click(.8, .8).astype(np.float32), t, .35, .35)
    elif ty == 'cord': add(fx, X.click(.6, .9).astype(np.float32), t, .4)
    elif ty == 'bulbOn': add(fx, X.ding(.4).astype(np.float32), t, .25); add(fx, buzz(.5, .25), t, .4)
    elif ty == 'pencil': add(fx, scratch(e.get('d', .3)), t, .22, .25)
    elif ty == 'holo': add(fx, blip([84 + e['i'] * 2, 91 + e['i'] * 2], .05, .18), t, .4, .2); add(fx, X.pop(.5).astype(np.float32), t, .3)
    elif ty == 'pop':
        add(fx, X.pop(.6).astype(np.float32), t, .35, rng.uniform(-.3, .3)); mm = e.get('m')
        if mm == 'box': add(fx, X.thump(.6).astype(np.float32), t + .05, .5)
        elif mm == 'cloth': add(fx, plush_step(.8), t + .04, .55)
        elif mm == 'click': add(fx, X.click(1.2, .7).astype(np.float32), t + .04, .35)
        elif mm == 'tape': add(fx, tape(), t, .6)
    elif ty == 'xp': add(fx, blip([84, 88, 91], .045, .16), t, .55, .25)
    elif ty == 'lightsOn':
        add(fx, X.whoosh(.6, .8).astype(np.float32), t - .45, .5); add(fx, X.thump(.9, 55).astype(np.float32), t, .8); add(fx, shimmer(2.2, .4, 86), t, .8); add(fx, buzz(.8, .3), t, .5)
    elif ty == 'bell': add(fx, bell2(), t, .9, .4)
    elif ty == 'chime': add(fx, X.ding(.35).astype(np.float32), t, .25, .1)
    elif ty == 'handoff': add(fx, X.click(1.4, .5).astype(np.float32), t, .3)
    elif ty == 'joined': add(fx, blip([72, 76, 79, 84, 88], .065, .22), t, .9); add(fx, shimmer(1.2, .2, 88), t + .2, .6)
    elif ty == 'goal': add(fx, X.whoosh(.4, .7).astype(np.float32), t, .35); add(fx, blip([79, 84, 88, 91], .05, .14), t + .05, .5)
    elif ty == 'button': add(fx, X.click(rng.uniform(1.4, 2.2), .25).astype(np.float32), t + rng.uniform(0, .12), e.get('g', .25) * rng.uniform(.4, 1), rng.uniform(-.6, .4))
    elif ty == 'sparkle': add(fx, shimmer(1.5, .45, 88), t, .8, .1); add(fx, blip([88, 91, 96], .05, .12), t + .1, .5)
    elif ty == 'plush': add(fx, plush_step(.7), t, .5, .3)
    elif ty == 'achievement': add(fx, blip([79, 84, 88, 91, 96], .06, .2), t + .6, .55); add(fx, shimmer(2.5, .3, 91), t + .8, .5)
    elif ty == 'boot':
        add(fx, blip([69, 73, 76, 81, 85, 88], .08, .2), t, .7, .4); add(fx, shimmer(1.6, .3, 84), t + .45, .5, .4); add(fx, X.whoosh(.5, .5).astype(np.float32), t, .3, .4)
    elif ty == 'cloth': add(fx, (bp(noise(.25), 800, 4000) * env_exp(.25, .08) * .4).astype(np.float32), t, .35)
    elif ty == 'bellShop':
        for k, f in enumerate((2093, 2637, 3136)): tt = t_(1.0); add(fx, (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .35) * .2).astype(np.float32), t + k * .05, .5, .3)
    elif ty == 'pads': add(fx, (bp(noise(1.6), 1500, 5000) * (rng.random(int(1.6 * SR)) > .995) * 3).astype(np.float32), t, e.get('g', .25), .4)
    elif ty == 'heart':
        g = e.get('g', .5)
        for dt, v in ((0, 1), (.22, .65)): add(fx, X.thump(.9 * v, 48).astype(np.float32), t + dt, .6 * g)
    elif ty == 'thrum': tt = t_(1.8); add(fx, (np.sin(2 * np.pi * 42 * tt) * (1 + np.sin(2 * np.pi * 7 * tt)) * .5 * adsr(1.8, .3, .2, .8, .6) * .6).astype(np.float32), t, .8)
    elif ty == 'uiDiscover': add(fx, blip([76, 83, 88], .07, .2), t, .7, .1); add(fx, shimmer(1.0, .25, 90), t + .1, .5)
    elif ty == 'uiStart': add(fx, blip([84, 91], .09, .22), t, .7, -.1)
    elif ty == 'click': add(fx, X.click(.9, .9).astype(np.float32), t, .5, .2)
    elif ty == 'riser': pass
    elif ty == 'flash': add(fx, X.thump(1.0, 60).astype(np.float32), t, .9); add(fx, shimmer(2.5, .5, 86), t, .9)
    elif ty == 'boom': add(fx, X.whoosh(.6, .6).astype(np.float32), t - .1, .4)
    elif ty == 'visor': add(fx, glitchb(.35), t, .8); add(fx, blip([88, 76, 91], .04, .18), t + .05, .6, -.3)
    elif ty == 'plop': add(fx, plush_step(1.0), t, .7, -.3)
    elif ty == 'shout':
        w, sr = sf.read(os.path.join(HERE, 'voices/crowd', e['id'] + '.wav'), dtype='float32')
        w = soxr.resample(w, sr, SR).astype(np.float32); w = lp(w, e.get('lp', 4500)).astype(np.float32)
        add(fx, w / (np.abs(w).max() + 1e-9) * .5, t, e.get('g', .5) * .7, e.get('pan', 0))

# ———————————————————————— AMBIENCE BEDS ————————————————————————
def bed(t0, t1, gen, gain, fin=.6, fout=.8, pan=0):
    d = t1 - t0; x = gen(d); n = len(x); e = np.ones(n); a, b = int(fin * SR), int(fout * SR)
    e[:a] = np.linspace(0, 1, a); e[-b:] *= np.linspace(1, 0, b); add(amb, (x * e).astype(np.float32), t0, gain, pan)
rain = lambda d: lp(hp(noise(d), 700), 7000) * .3 + lp(noise(d), 300) * .15
bed(0, 21.6, rain, .38, .3, .5)
bed(21.3, 33.0, lambda d: lp(rain(d), 900), .25, .3, 1.0)                 # the rain heard from inside the shop
drops = np.zeros(N, np.float32)
for i in range(200): s0 = int(rng.uniform(0, 21) * SR); c = X.click(rng.uniform(1.5, 3), .3); drops[s0:s0 + len(c)] += c[:len(drops[s0:s0 + len(c)])] * rng.uniform(.05, .2)
add(amb, drops, 0, .5, .2)
hum = lambda d: (np.sin(2 * np.pi * 60 * t_(d)) * .5 + np.sin(2 * np.pi * 120 * t_(d)) * .3 + hp(lp(noise(d), 3000), 1500) * .05)
bed(21.3, 50.6, hum, .05, .5, .3)
bed(32.0, 50.3, lambda d: lp(X.brown(d), 200) * .6, .3, 1.0, .2)               # corridor pressure
def murmur(d):
    x = bp(noise(d), 250, 2200); xp = np.arange(0, d + 1, .25); mod = np.interp(t_(d), xp, rng.uniform(.4, 1, len(xp))); return x * mod * .5
bed(50.67, 90.3, murmur, .2, .6, 1.4)
bed(21.3, 32.0, lambda d: lp(murmur(d), 700), .08, 1.0, .6)                    # faint voices behind the walls
# ———————————————————————— VOICE ————————————————————————
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
vo_spans = []
for e in E:
    if e['type'] != 'vo': continue
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    w = soxr.resample(w, sr, SR).astype(np.float32)
    if e.get('dlg'): w = lp(w, 7000).astype(np.float32)
    if e.get('who') in ('LAGZILLA', '???'):
        q = np.round(w * 24) / 24; w = (.75 * w + .25 * q).astype(np.float32)                     # light bitcrush
        tt = t_(len(w) / SR)[:len(w)]; gate = 1 - .25 * (np.sin(2 * np.pi * 31 * tt) > .97); w = (w * gate).astype(np.float32)
    if e.get('muffled'): w = lp(w, 900).astype(np.float32); w = (w + np.concatenate([np.zeros(int(.06 * SR), np.float32), w[:-int(.06 * SR)]]) * .4).astype(np.float32)
    w = compress(w, thr=.2, ratio=3).astype(np.float32); w = w / (np.sqrt(np.mean(w ** 2)) + 1e-9) * .1
    add(vox, w, e['t'], .8 if e.get('muffled') else 1.0, -.2 if e.get('who') == 'LAGZILLA' else (.12 if e.get('who') == 'ELE' else 0))
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
