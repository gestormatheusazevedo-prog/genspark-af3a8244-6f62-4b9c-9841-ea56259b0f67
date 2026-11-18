"""Pixel Zone · Side Quest 01 — "Player 2 Entrou": chiptune score (120 BPM, one bar per take), game foley, voices → out/mix.wav.
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

# 1 (0–2): the defeat jingle
for i, n in enumerate(['G4', 'F#4', 'F4', 'E4']): add(music, pulse(m(n), .26 if i < 3 else .9, .14, .5, .01 if i == 3 else 0), .25 + i * .27, 1, 0)
add(music, tri(m('E2'), 1.1, .35), 1.06, 1, 0)
# 2 (2–4): nothing but the TV
# 3 (4–6): the rewind, then a curious little groove … that stops dead at 6.0 when everyone turns
for b in (3,): groove(b, .45, drums=False); [add(music, hat(.05), bt(b) + i * BEAT / 2, 1, .3) for i in range(4, 8)]
music[int(6.0 * SR):int(6.0 * SR) + 1] = 0
# 5–6 (8–12): a tense pulse
for b in (5, 6):
    for i in range(8): add(music, tri(m('A2'), BEAT / 2 * .8, .22), bt(b) + i * BEAT / 2, 1, 0)
    for i in range(4): add(music, pulse(m(['E5', 'A4', 'C5', 'A4'][i]), BEAT * .3, .04, .125), bt(b) + i * BEAT, 1, .3)
# 7 (12–14): the tip — soft pad of pulses, a sparkle
for nn in ('A3', 'C4', 'E4', 'B4'): add(music, pulse(m(nn), BAR * .95, .03, .5), bt(7), 1, 0)
for i in range(8): add(music, pulse(m(['E6', 'B5', 'C6', 'A5'][i % 4]), .18, .035, .125), bt(7) + i * BEAT / 2, 1, .4)
# 8 (14–16): build — the combo; a snare roll and a riser
for i in range(8): add(music, tri(m('G2'), BEAT / 2 * .8, .25), bt(8) + i * BEAT / 2, 1, 0)
for i in range(16): add(music, snare(.08 + .22 * i / 16), bt(8, 3) + i * BEAT / 8, 1, 0)
tt = t_(2.0); ris = hp(noise(2.0), 1500) * (tt / 2.0) ** 2 * .22; add(music, ris.astype(np.float32), bt(8), 1, 0)
# 9 (16–18): round 2 — the beat comes back
groove(9, .85)
# 10 (18–20): the goal — crash, full groove
add(music, crash(.35), 18.55, 1, 0); groove(10, 1.0)
# 11–12 (20–24): YOU WIN — the victory hook
groove(11, 1.1); groove(12, 1.05); lead(11, .14)
# 13 (24–26): level up
groove(13, 1.0); add(music, crash(.25), bt(13), 1, 0)
# 14–15 (26–30): the call to action — lighter, hook an octave down
groove(14, .75, drums=True, arp=True); groove(15, .75); lead(14, .09, -1)
# 16–17 (30–34): play again — the hook once more, ends on the bar so it loops
groove(16, .9); groove(17, .9); lead(16, .11)
music = music[:N]
music[int((DUR - .02) * SR):] = 0

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
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'lose': add(fx, buzzer(), t, .8)
    elif ty == 'tvhum': add(amb, (np.sin(2 * np.pi * 60 * t_(e['d'])) * .2 + lp(noise(e['d']), 200) * .1).astype(np.float32) * adsr(e['d'], .2, .1, 1, .6).astype(np.float32), t, .4)
    elif ty == 'rewind': add(fx, rewind(), t, .8)
    elif ty == 'door': add(fx, X.creak(.7).astype(np.float32), t, .4, .35); add(fx, bell2(), t + .1, .45, .4)
    elif ty == 'step': add(fx, wood_step(e.get('g', .6) * rng.uniform(.8, 1.1)), t, .55, rng.uniform(-.15, .25))
    elif ty == 'scratch': add(fx, scratch(), t, .8)
    elif ty == 'turn': add(fx, X.whoosh(.35, .5).astype(np.float32), t - .1, .35); add(fx, (bp(noise(.25), 800, 4000) * env_exp(.25, .08) * .4).astype(np.float32), t, .35)
    elif ty == 'pick': add(fx, X.click(1.6, .6).astype(np.float32), t, .6, .1); add(fx, X.click(1.1, .4).astype(np.float32), t + .06, .4, .1)
    elif ty == 'game': add(amb, gamebed(e['d']), t, .8, 0)
    elif ty == 'cloth': add(fx, (bp(noise(.3), 800, 4000) * env_exp(.3, .1) * .4).astype(np.float32), t, .4)
    elif ty == 'plop': add(fx, plush(1.0), t, .7, .2)
    elif ty == 'ding': add(fx, blip([88, 93], .09, .16), t, .7, .1); add(fx, shimmer(1.0, .25, 90), t + .1, .5)
    elif ty == 'continue': add(fx, blip([72, 76, 79, 76, 79, 84], .07, .14, .25), t, .55)
    elif ty == 'btn': n = [79, 76, 72, 83][e['n']]; add(fx, X.click(2.0, .3).astype(np.float32), t, .4, .2); add(fx, blip([n], .06, .1, .25), t, .5, .2)
    elif ty == 'net': add(fx, (bp(noise(.5), 1000, 6000) * env_exp(.5, .15) * .6).astype(np.float32), t, .6)
    elif ty == 'crowd8': add(fx, crowd8(1.8, .45), t, .7)
    elif ty == 'win': add(fx, blip([72, 76, 79, 84, 79, 84, 88], .08, .16, .25), t, .55); add(fx, shimmer(1.6, .3, 88), t + .3, .5)
    elif ty == 'cheer': add(fx, (bp(noise(1.6), 300, 3000) * adsr(1.6, .1, .3, .6, .6) * .45).astype(np.float32), t, e.get('g', .5))
    elif ty == 'achievement': add(fx, blip([72, 76, 79, 84, 88], .065, .18), t, .65); add(fx, shimmer(2.0, .3, 91), t + .2, .45)
    elif ty == 'levelup':
        add(fx, blip([60 + i * 2 + (i // 4) * 3 for i in range(12)], .045, .14, .25), t - .1, .6); add(fx, shimmer(2.2, .4, 90), t + .45, .6); add(fx, X.thump(.8, 55).astype(np.float32), t + .45, .5)
    elif ty == 'neon': add(fx, (np.sin(2 * np.pi * 120 * t_(.6)) * .3 * env_exp(.6, .3)).astype(np.float32), t, .4); add(fx, X.thump(.6, 60).astype(np.float32), t, .4)
    elif ty == 'sparkle': add(fx, shimmer(1.4, .45, 88), t, .8, .1); add(fx, blip([88, 91, 96], .05, .12), t + .1, .5)
    elif ty == 'pop': add(fx, blip([84, 91], .05, .14), t, .5)
    elif ty == 'again': add(fx, blip([76, 72, 76, 84], .1, .12, .25), t, .5)
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
