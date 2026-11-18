"""Pixel Zone · Safe Zone 01 — "O Dia Dele": a cold minor pulse for the day, bright chiptune for the safe zone; foley; voices → out/mix.wav.
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

# —— the grey day (0–20.6): a cold, sparse minor pulse that tightens with every hit ——
def bell(mm, d=1.2, v=.12):
    tt = t_(d); f = hzm(mm); x = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * f * 2.0 * tt)) * np.exp(-tt / .5)
    return (x * v).astype(np.float32)
DAY = ['Am', 'F', 'Am', 'G']
for b in range(1, 11):   # 0–20
    c = CH[DAY[(b - 1) % 4]]; lv = .5 + .05 * b
    for i in range(4): add(music, tri(m(c[0]), BEAT * .7, .18 * lv), bt(b) + i * BEAT, 1, 0)
    add(music, bell(m(c[2]) + 12, 1.6, .05 * lv), bt(b), 1, -.3); add(music, bell(m(c[3]) + 12, 1.2, .035 * lv), bt(b, 3), 1, .3)
    if b >= 5:
        for i in range(8): add(music, hat(.035 * lv), bt(b) + i * BEAT / 2, 1, .3)
    if b >= 8:
        for i in range(8): add(music, pulse(m(c[1]), BEAT / 2 * .4, .025, .125), bt(b) + i * BEAT / 2, 1, -.3)
music[:int(20.6 * SR)] *= 2.0
# low-HP: the music thins to the heartbeat (bars 8–10), then a riser into the door
SAFE = 20.6
tt = t_(1.6); ris = hp(noise(1.6), 1500) * (tt / 1.6) ** 2 * .25; add(music, ris.astype(np.float32), SAFE - 1.6, 1, 0)
music[int(SAFE * SR):] = 0
# —— the safe zone (20.6 →): major, bright chiptune; the victory hook on HP MAX ——
add(music, crash(.35), SAFE, 1, 0)
s0 = SAFE
for k in range(10):   # ten bars of groove from the door
    t0 = s0 + k * BAR; c = CH[PROG[k % 4]]; lvl = .8 + (.25 if k >= 5 else 0)
    for kk in (0, 2): add(music, kick(.6 * lvl), t0 + kk * BEAT, 1, 0)
    add(music, kick(.35 * lvl), t0 + 2.5 * BEAT, 1, 0)
    for kk in (1, 3): add(music, snare(.3 * lvl), t0 + kk * BEAT, 1, .05)
    for i in range(8): add(music, hat((.09 if i % 2 else .06) * lvl), t0 + i * BEAT / 2, 1, .35)
    for i in range(8): add(music, tri(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .9, .3 * lvl), t0 + i * BEAT / 2, 1, 0)
    for i in range(16): add(music, pulse(m(c[1 + i % 3]) + 12, BEAT / 4 * .9, .05 * lvl, .125), t0 + i * BEAT / 4, 1, .4 if i % 2 else -.4)
def leadAt(t0, v=.13, oct=0):
    for bb, n, d in LEAD: add(music, pulse(m(n) + 12 * oct, d * BEAT * .95, v, .25, .006), t0 + bb * BEAT, 1, .1)
leadAt(s0 + 2 * BAR, .1); leadAt(31.6, .14); leadAt(s0 + 8 * BAR, .1, -1)
music[int((DUR - .35) * SR):] *= np.linspace(1, 0, len(music[int((DUR - .35) * SR):]))[:, None]
music = music[:N]

# ———————— foley ————————
def blip(notes, d=.07, v=.25, duty=.5):
    return np.concatenate([pulse(n, d, v, duty) for n in notes]).astype(np.float32)
def wood_step(v): x = lp(noise(.12), 900) * env_exp(.12, .03) + .5 * np.sin(2 * np.pi * 140 * t_(.12)) * env_exp(.12, .04); return (x * v * .8).astype(np.float32)
def plush(v): return (lp(noise(.2), 400) * env_exp(.2, .07) * v).astype(np.float32)
def shimmer(d=1.4, v=.25, base=84):
    tt = t_(d); x = np.zeros_like(tt)
    for i in range(10): f = hzm(base + rng.integers(0, 14)); st = rng.uniform(0, d * .5); x += np.sin(2 * np.pi * f * tt) * np.exp(-np.clip(tt - st, 0, None) / .35) * (tt > st)
    return (x / 10 * v).astype(np.float32)
def bell2():
    out = np.zeros(int(1.8 * SR))
    for st, n in ((0, 76), (.45, 72)):
        tt = t_(1.8 - st); f = hzm(n); x = (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / .2)) * np.exp(-tt / .7)
        s0 = int(st * SR); out[s0:s0 + len(x)] += x
    return (out * .35).astype(np.float32)
def buzzer():
    tt = t_(.7); x = np.sign(np.sin(2 * np.pi * 110 * tt)) * .5 + np.sign(np.sin(2 * np.pi * 116 * tt)) * .5
    return (lp(x, 3000) * adsr(.7, .005, .05, .9, .1) * .35).astype(np.float32)
def rewind():
    d = .6; tt = t_(d); f = 2400 - 1800 * tt / d; x = np.sign(np.sin(np.cumsum(2 * np.pi * (f + 400 * np.sin(2 * np.pi * 23 * tt)) / SR))) * .3 + hp(noise(d), 2000) * .4
    return (bp(x, 400, 7000) * adsr(d, .01, .1, .9, .1) * .5).astype(np.float32)
def scratch():
    d = .35; tt = t_(d); f = 900 * np.exp(-tt / .12) + 80; x = np.sign(np.sin(np.cumsum(2 * np.pi * f / SR))) * .5 + bp(noise(d), 800, 5000) * .6
    return (x * env_exp(d, .15) * .5).astype(np.float32)
def gamebed(d):   # the match on the TV: 8-bit kicks of the ball, a low chip crowd
    y = lp(bp(noise(d), 300, 1800), 1400) * .05; k = 0
    while k < d - .3:
        s0 = int(k * SR); b = blip([rng.integers(72, 84)], .05, .1, .25); y[s0:s0 + len(b)] += b[:len(y[s0:s0 + len(b)])]; k += rng.uniform(.25, .7)
    return y.astype(np.float32)
def crowd8(d=1.6, v=.4):
    x = bp(noise(d), 400, 3000); x = np.round(x * 6) / 6
    return (x * adsr(d, .05, .3, .6, .6) * v).astype(np.float32)
def alarmS(d):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 1900 * tt)) * ((tt * 8) % 1 < .5)
    return (lp(x, 6000) * .25).astype(np.float32)
def horn(v=.5):
    tt = t_(.6); x = np.sign(np.sin(2 * np.pi * 420 * tt)) * .5 + np.sign(np.sin(2 * np.pi * 520 * tt)) * .5
    return (lp(x, 2500) * adsr(.6, .01, .05, .9, .08) * v * .4).astype(np.float32)
def engine(d): tt = t_(d); return (lp(np.sin(2 * np.pi * 38 * tt) + .4 * np.sign(np.sin(2 * np.pi * 76 * tt)), 300) * .12).astype(np.float32)
def rainB(d, br=4000): return (bp(noise(d), 800, br) * .08).astype(np.float32)
def heartB(d):
    y = np.zeros(int(d * SR), np.float32); k = 0.0
    while k < d - .3:
        for off, v in ((0, 1), (.22, .65)):
            tt = t_(.18); x = np.sin(2 * np.pi * (55 + 25 * np.exp(-tt / .03)) * tt) * np.exp(-tt / .06) * v * .7; s0 = int((k + off) * SR); y[s0:s0 + len(x)] += x[:len(y[s0:s0 + len(x)])]
        k += 60 / 72
    return y
def dmg(n):
    tt = t_(.4); f = 300 * np.exp(-tt / .12) + 60; x = np.sign(np.sin(np.cumsum(2 * np.pi * f / SR))) * np.exp(-tt / .15)
    return (lp(x, 4000) * .3).astype(np.float32)
def heal(n): return blip([72, 76, 79, 84, 88][:3 + (n >= 30)], .06, .14, .25)
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'alarm': add(fx, alarmS(e['d']), t, .4, -.2)
    elif ty == 'slam': add(fx, X.thump(.9, 60).astype(np.float32), t, .8); add(fx, X.click(1.2, .8).astype(np.float32), t, .5)
    elif ty == 'brush': add(fx, (bp(noise(e['d']), 2000, 7000) * (np.sin(2 * np.pi * 7 * t_(e['d'])) > 0) * .12).astype(np.float32), t, .6)
    elif ty == 'tap': add(amb, (bp(noise(e['d']), 1000, 5000) * .05).astype(np.float32), t, .35)
    elif ty == 'rainCar': add(amb, rainB(e['d'], 3000), t, .55)
    elif ty == 'rainStreet': add(amb, rainB(e['d'], 6000), t, .6)
    elif ty == 'engine': add(amb, engine(e['d']), t, .9)
    elif ty == 'horn': add(fx, horn(e.get('g', 1)), t, .7, .2)
    elif ty == 'officeAmb': add(amb, (lp(bp(noise(e['d']), 300, 2000), 1500) * .05).astype(np.float32), t, 1.0)
    elif ty == 'point': add(fx, X.whoosh(.3, .5).astype(np.float32), t - .1, .35)
    elif ty == 'paper': add(fx, (bp(noise(.3), 1200, 6000) * env_exp(.3, .1) * .4).astype(np.float32), t, .5, .1)
    elif ty == 'key': add(fx, (hp(noise(.04), 2000) * env_exp(.04, .008) * e.get('g', .5)).astype(np.float32), t, .5, -.1)
    elif ty == 'urgent': add(fx, blip([84, 79, 84, 79], .09, .15, .5), t, .6)
    elif ty == 'nightHum': add(amb, (np.sin(2 * np.pi * 60 * t_(e['d'])) * .08).astype(np.float32), t, 1.0)
    elif ty == 'heart': add(fx, heartB(e['d']), t, .9)
    elif ty == 'step': add(fx, wood_step(e.get('g', .6) * rng.uniform(.8, 1.1)), t, .5, rng.uniform(-.15, .2))
    elif ty == 'shopBell': add(fx, bell2(), t, .45, .2)
    elif ty == 'broom': add(fx, (bp(noise(e['d']), 1500, 6000) * (np.sin(2 * np.pi * 2.5 * t_(e['d'])) > .2) * .12).astype(np.float32), t, .5, -.3)
    elif ty == 'doorOpen': add(fx, X.creak(.6).astype(np.float32), t, .4, .2)
    elif ty == 'safe': add(fx, blip([72, 79, 84, 91], .07, .18, .25), t, .7); add(fx, shimmer(2.0, .45, 88), t + .1, .7)
    elif ty == 'room': add(amb, gamebed(e['d']), t, .8)
    elif ty == 'btn': n = [79, 76, 72, 83][e['n']]; add(fx, X.click(2.0, .3).astype(np.float32), t, .4, .2); add(fx, blip([n], .06, .1, .25), t, .5, .2)
    elif ty == 'plop': add(fx, plush(1.0), t, .7, .2)
    elif ty == 'clap': add(fx, (lp(noise(.12), 3000) * env_exp(.12, .03) * .7).astype(np.float32), t, .7)
    elif ty == 'laugh': w = (bp(noise(1.0), 400, 2500) * (np.sin(2 * np.pi * 5 * t_(1.0)) > 0) * env_exp(1.0, .5)).astype(np.float32); add(fx, w * .3, t, e.get('g', .5), rng.uniform(-.3, .3))
    elif ty == 'cheer': add(fx, (bp(noise(1.6), 300, 3000) * adsr(1.6, .1, .3, .6, .6) * .45).astype(np.float32), t, e.get('g', .5))
    elif ty == 'levelup':
        add(fx, blip([60 + i * 2 + (i // 4) * 3 for i in range(12)], .045, .14, .25), t - .1, .6); add(fx, shimmer(2.2, .4, 90), t + .45, .6); add(fx, X.thump(.8, 55).astype(np.float32), t + .45, .5)
    elif ty == 'neon': add(fx, (np.sin(2 * np.pi * 120 * t_(.6)) * .3 * env_exp(.6, .3)).astype(np.float32), t, .4); add(fx, X.thump(.6, 60).astype(np.float32), t, .4)
    elif ty == 'sparkle': add(fx, shimmer(1.4, .45, 88), t, .8, .1); add(fx, blip([88, 91, 96], .05, .12), t + .1, .5)
    elif ty == 'pop': add(fx, blip([84, 91], .05, .14), t, .5)
    elif ty == 'dmg': add(fx, dmg(e['n']), t, .8)
    elif ty == 'heal': add(fx, heal(e['n']), t, .6)
    elif ty == 'xp': n = e['n']; base = 84 if n < 25 else 86 if n < 50 else 88 if n < 100 else 91; add(fx, blip([base, base + 7], .05, .11, .25), t, .45, rng.uniform(-.3, .3))

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
