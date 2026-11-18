"""Pixel Zone — Level 002 "A Porta Que Ninguém Conhecia" (Reel cut): mystery pulse → chiptune at the reveal; the original foley re-timed; voices → out/mix.wav.
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

# —— the mystery (0–31): a cold minor pulse, bells, a heartbeat in the corridor; PRESS START builds; the flash cuts it ——
def bell(mm, d=1.2, v=.12):
    tt = t_(d); f = hzm(mm); x = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * f * 2.0 * tt)) * np.exp(-tt / .5)
    return (x * v).astype(np.float32)
MYS = ['Am', 'F', 'Am', 'G']
FLASH, REVEAL = 31.05, 34.0
for b in range(1, 16):   # 0–30
    c = CH[MYS[(b - 1) % 4]]; lv = .55 + .03 * b
    for i in range(4): add(music, tri(m(c[0]), BEAT * .7, .2 * lv), bt(b) + i * BEAT, 1, 0)
    add(music, bell(m(c[2]) + 12, 1.6, .06 * lv), bt(b), 1, -.3); add(music, bell(m(c[3]) + 12, 1.2, .045 * lv), bt(b, 3), 1, .3)
    if b >= 6:
        for i in range(8): add(music, hat(.035 * lv), bt(b) + i * BEAT / 2, 1, .3)
    if b >= 14:
        for i in range(16): add(music, pulse(m(c[1 + i % 3]) + 12, BEAT / 4 * .8, .03 + .01 * (b - 14), .125), bt(b) + i * BEAT / 4, 1, .4 if i % 2 else -.4)
tt = t_(2.4); add(music, (hp(noise(2.4), 1500) * (tt / 2.4) ** 2 * .25).astype(np.float32), FLASH - 2.4, 1, 0)
music[int(FLASH * SR):] = 0
# —— the reveal (34 →): bright chiptune; the hook on PLAYER 2 and on LEVEL UP ——
add(music, crash(.4), REVEAL, 1, 0)
for k in range(17):
    t0 = REVEAL + k * BAR
    if t0 >= DUR: break
    c = CH[PROG[k % 4]]; lvl = .85 + (.2 if 8 <= k < 14 else 0)
    for kk in (0, 2): add(music, kick(.6 * lvl), t0 + kk * BEAT, 1, 0)
    add(music, kick(.35 * lvl), t0 + 2.5 * BEAT, 1, 0)
    for kk in (1, 3): add(music, snare(.3 * lvl), t0 + kk * BEAT, 1, .05)
    for i in range(8): add(music, hat((.09 if i % 2 else .06) * lvl), t0 + i * BEAT / 2, 1, .35)
    for i in range(8): add(music, tri(m(c[0]) + (12 if i % 2 else 0), BEAT / 2 * .9, .3 * lvl), t0 + i * BEAT / 2, 1, 0)
    for i in range(16): add(music, pulse(m(c[1 + i % 3]) + 12, BEAT / 4 * .9, .05 * lvl, .125), t0 + i * BEAT / 4, 1, .4 if i % 2 else -.4)
def leadAt(t0, v=.13, oct=0):
    for bb, n, d in LEAD: add(music, pulse(m(n) + 12 * oct, d * BEAT * .95, v, .25, .006), t0 + bb * BEAT, 1, .1)
leadAt(50.0, .11); leadAt(61.6, .14); leadAt(65.6, .09, -1)
music[int((DUR - .5) * SR):] *= np.linspace(1, 0, len(music[int((DUR - .5) * SR):]))[:, None]
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
def stone_step(v):
    x = hp(noise(.09), 900) * env_exp(.09, .018) * .6; y = lp(noise(.06), 300) * env_exp(.06, .015) * .8; x[:len(y)] += y; return (x * v).astype(np.float32)
def thump1(f=55, v=.8): tt = t_(.4); return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / .1) * v).astype(np.float32)
for e in E:
    t, ty = e['t'], e['type']
    if ty == 'step': add(fx, (stone_step if e.get('surf') in ('stone', 'tile') else wood_step)(e.get('g', .5) * rng.uniform(.8, 1.1)), t, .55, rng.uniform(-.15, .2))
    elif ty == 'stop': add(fx, stone_step(.6), t, .5)
    elif ty == 'boot': add(fx, blip([60, 67, 72, 79], .05, .12, .25), t, .55); add(fx, shimmer(1.2, .3, 86), t + .1, .5)
    elif ty == 'chime': add(fx, blip([84, 91], .05, .08, .25), t, .4, .3)
    elif ty == 'cloth': add(fx, (bp(noise(.3), 800, 4000) * env_exp(.3, .1) * .4).astype(np.float32), t, .4)
    elif ty == 'doorCreak': add(fx, X.creak(.7).astype(np.float32), t, .45, .2)
    elif ty == 'bellShop': add(fx, bell2(), t, .45, .2)
    elif ty == 'shout':
        p = os.path.join(HERE, 'voices/crowd', e['id'] + '.wav')
        if os.path.exists(p): w, sr = sf.read(p, dtype='float32'); w = w.mean(1) if w.ndim > 1 else w; w = lp(soxr.resample(w, sr, SR), e.get('lp', 1400)).astype(np.float32); add(fx, w * .6, t, e.get('g', .3), e.get('pan', 0))
    elif ty == 'pads': add(amb, gamebed(2.0), t, .5)
    elif ty == 'heart': add(fx, heartB(.9), t, .3)
    elif ty == 'thrum': add(fx, (lp(np.sin(2 * np.pi * 45 * t_(1.6)) * env_exp(1.6, .6), 200) * .5).astype(np.float32), t, .6)
    elif ty == 'uiDiscover': add(fx, blip([76, 79, 83], .07, .12, .25), t, .5)
    elif ty == 'uiStart': add(fx, blip([72, 79], .1, .12, .25), t, .5)
    elif ty == 'click': add(fx, X.click(1.4, .6).astype(np.float32), t, .5)
    elif ty == 'flash': add(fx, X.whoosh(.5, .9).astype(np.float32), t - .3, .6); add(fx, thump1(50, .9), t, .7)
    elif ty == 'boom': add(fx, thump1(42, 1.0), t, .8)
    elif ty == 'goal': add(fx, crowd8(1.4, .35), t, .5)
    elif ty == 'visor': add(fx, blip([84, 88, 91], .05, .12, .25), t, .5)
    elif ty == 'button': add(fx, X.click(rng.uniform(1.5, 2.2), .25).astype(np.float32), t, .3 * e.get('g', .22) / .22, rng.uniform(-.5, .4))
    elif ty == 'handoff': add(fx, X.whoosh(.35, .5).astype(np.float32), t - .1, .35)
    elif ty == 'joined': add(fx, blip([72, 76, 79, 84], .07, .16, .25), t, .55)
    elif ty == 'plop': add(fx, plush(1.0), t, .6, .2)
    elif ty == 'sparkle': add(fx, shimmer(1.4, .45, 88), t, .7, .1)
    elif ty == 'cut': add(fx, (hp(noise(.08), 3000) * env_exp(.08, .02) * .25).astype(np.float32), t - .02, .25)
    elif ty == 'hudSound': add(fx, blip([79, 74], .08, .12, .5), t, .5)
    elif ty == 'quest': add(fx, blip([72, 76, 79, 84], .065, .15), t, .55)
    elif ty == 'uiStart2': add(fx, blip([72, 79, 84], .09, .14, .25), t, .55)
    elif ty == 'reveal': add(fx, shimmer(2.2, .45, 88), t, .7); add(fx, thump1(48, .8), t, .6)
    elif ty == 'p2': add(fx, blip([72, 76, 79, 84, 88], .065, .16, .25), t, .6)
    elif ty in ('achievement', 'achievement2'): add(fx, blip([72, 76, 79, 84, 88], .065, .18), t, .6); add(fx, shimmer(2.0, .3, 91), t + .2, .4)
    elif ty == 'levelup':
        add(fx, blip([60 + i * 2 + (i // 4) * 3 for i in range(12)], .045, .14, .25), t - .1, .6); add(fx, shimmer(2.2, .4, 90), t + .45, .6); add(fx, X.thump(.8, 55).astype(np.float32), t + .45, .5)
    elif ty == 'pop': add(fx, blip([84, 91], .05, .14), t, .5)
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
    elif e.get('muffled'): w = lp(w, 900).astype(np.float32); w = (w + np.concatenate([np.zeros(int(.06 * SR), np.float32), w[:-int(.06 * SR)]]) * .4).astype(np.float32)
    elif e.get('dlg'): w = lp(w, 7500).astype(np.float32); pan = .1 if e.get('who') == 'ELE' else 0
    w = compress(w, thr=.2, ratio=3).astype(np.float32); w = w / (np.sqrt(np.mean(w[np.abs(w) > .01] ** 2)) + 1e-9) * (.11 if e.get('ann') else .1)
    add(vox, w, e['t'], 1.0, pan)
    vo_spans.append((e['t'], e['t'] + len(w) / SR))
# ———————— mix ————————
duck = np.ones(N, np.float32)
for a, b in vo_spans:
    s, e_ = int((a - .1) * SR), int((b + .15) * SR); duck[max(0, s):e_] = np.minimum(duck[max(0, s):e_], .34)
k = int(.08 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same').astype(np.float32)
music *= duck[:, None] * .55
amb *= (.55 + .45 * duck)[:, None]
fx *= (.8 + .2 * duck)[:, None]
mix = music + fx + amb + vox * 1.9
mix = limit(mix, .95)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/mix.wav'), mix, SR)
for nm, x in (('music', music), ('fx', fx), ('amb', amb), ('vox', vox)): sf.write(os.path.join(HERE, f'out/stem_{nm}.wav'), x[:int(DUR * SR)], SR)
print('mix →', os.path.join(HERE, 'out/mix.wav'), f'{len(mix) / SR:.1f}s peak {np.abs(mix).max():.2f}')
