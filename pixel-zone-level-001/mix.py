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
BPM = 72; BEAT = 60 / BPM; BAR = 4 * BEAT
def bt(b, beat=1): return (b - 1) * BAR + (beat - 1) * BEAT
rng = np.random.default_rng(11)

def mk(): return np.zeros((N, 2), np.float32)
music, fx, amb, vox = mk(), mk(), mk(), mk()

# ———————————————————————— SYNTH VOICES (numpy) ————————————————————————
def adsr(d, a=.01, dcy=.1, s=.7, r=.2):
    n = int(d * SR); e = np.ones(n) * s
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

# ———————————————————————— SCORE ————————————————————————
NM = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(n): return 12 * (int(n[-1]) + 1) + NM[n[0]] + (1 if '#' in n else -1 if 'b' in n[1:-1] else 0)
CH = {'Am': ['A2', 'E3', 'A3', 'C4', 'E4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4'], 'Em': ['E2', 'B2', 'E3', 'G3', 'B3'], 'Dm': ['D3', 'A3', 'D4', 'F4', 'A4']}
PROG = {   # bar → chord
    1: 'Am', 2: 'F', 3: 'C', 4: 'G', 5: 'Am', 6: 'F', 7: 'C', 8: 'G', 9: 'Am', 10: 'F', 11: 'C', 12: 'G', 13: 'Am',
    14: 'F', 15: 'F', 16: 'F', 17: 'C', 18: 'C', 19: 'G', 20: 'F', 21: 'C', 22: 'G', 23: 'Am', 24: 'F', 25: 'G', 26: 'F', 27: 'C', 28: 'C'}
# theme A (two bars, beats): melancholic, then the same notes over major chords become hopeful
THEME = [(1, 'E5', 1), (2, 'C5', 1), (3, 'D5', 1.5), (4.5, 'E5', .5), (5, 'C5', 1), (6, 'B4', 1), (7, 'G4', 2)]
THEME2 = [(1, 'A4', 1), (2, 'C5', 1), (3, 'E5', 1.5), (4.5, 'D5', .5), (5, 'C5', 1.5), (6.5, 'B4', .5), (7, 'C5', 2)]
pno = []
def phrase(bar0, th, vel=.55, oct=0, inst='piano', dst=None):
    for b, n, d in th:
        t = bt(bar0) + (b - 1) * BEAT
        (dst if dst is not None else pno).append((t, inst, m(n) + 12 * oct, d * BEAT * 1.05, vel, .1))
def lh(bar, vel=.36, pattern='whole'):
    c = CH[PROG[bar]]; t0 = bt(bar)
    if pattern == 'whole': pno.append((t0, 'piano', m(c[0]), BAR, vel, -.15)); pno.append((t0 + .02, 'piano', m(c[2]), BAR, vel * .8, -.1))
    else:
        for i in range(8): pno.append((t0 + i * BEAT / 2, 'piano', m(c[[0, 1, 2, 3, 2, 1, 2, 3][i]]), BEAT * .9, vel * (1 if i % 4 == 0 else .75), -.15))

# S1 (bars 1–3): sparse piano
pno.append((bt(1), 'piano', m('A2'), BAR * 1.2, .42, -.2)); pno.append((bt(1, 3), 'piano', m('E5'), 2.5, .3, .25))
lh(2, .32); lh(3, .32); phrase(2, THEME, .46)
# S2 (bars 4–6): piano + low synth pedal
for b in (4, 5, 6): lh(b, .34, 'arp' if b > 4 else 'whole')
phrase(4, THEME2, .48); phrase(6, THEME[:4], .44)
for b in (4, 5, 6): add(music, pad(m(CH[PROG[b]][0]), BAR + .3, .16), bt(b), 1, 0)
# S3 (bars 7–9): + soft arpeggio
for b in (7, 8, 9):
    lh(b, .34, 'arp'); c = CH[PROG[b]]
    for i in range(8): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .3, .1), bt(b) + i * BEAT / 2, 1, .35 if i % 2 else -.1)
    add(music, pad(m(c[0]) + 12, BAR + .3, .12), bt(b), 1, 0)
phrase(7, THEME, .5); phrase(9, THEME2[:4], .48)
# S4 (bars 10–13): build montage — pulse, 16th arps, kick on 1 & 3
for b in (10, 11, 12, 13):
    c = CH[PROG[b]]; lh(b, .4, 'arp')
    for i in range(16): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .22, .11 + .02 * (b - 10)), bt(b) + i * BEAT / 4, 1, .4 if i % 2 else -.2)
    for k in (1, 3): add(music, kick(.5), bt(b, k), 1, 0)
    for k in range(8): add(music, tick(.08), bt(b) + k * BEAT / 2 + BEAT / 4, 1, .3)
    add(music, bass(m(c[0]), BAR * .95, .22), bt(b), 1, 0); add(music, pad(m(c[0]) + 12, BAR + .3, .14), bt(b), 1, 0)
phrase(10, THEME2, .52); phrase(12, THEME, .52)
# lights on (bar 13 beat 3): a swell into a held chord that dies away into the silence
add(music, pad(m('A3'), 5.5, .22), bt(13, 3), 1, -.2); add(music, pad(m('E4'), 5.5, .18), bt(13, 3), 1, .2)
pno.append((bt(13, 3), 'piano', m('A1'), 4, .5, 0)); pno.append((bt(13, 3), 'piano', m('A4'), 4, .4, .2)); pno.append((bt(13, 3), 'piano', m('C5'), 4, .36, .25))
# S5 (bars 14–16): silence 1 — only one far piano note, then nothing
pno.append((bt(15), 'piano', m('E5'), 3, .18, .3))
# S6 (bars 17–19): after the bell, the theme returns in C major, soft, under the dialogue
pno.append((bt(18), 'piano', m('C3'), BAR, .3, -.15)); pno.append((bt(18), 'piano', m('G3'), BAR, .25, -.1))
phrase(18, [(1, 'G4', 1), (2, 'C5', 1), (3, 'E5', 2)], .34)
lh(19, .32, 'arp')
add(music, pad(m('C3'), BAR * 2 + .3, .1), bt(18), 1, 0)
# PLAYER 1 JOINED (bar 19 beat 3): arpeggio enters
for i in range(4): add(music, arp(m(['G4', 'B4', 'D5', 'G5'][i]) + 12, .26, .13), bt(19, 3) + i * BEAT / 4, 1, .2)
# S7 (bars 20–22): full theme — piano + pad + arp + kick + bass
for b in (20, 21, 22):
    c = CH[PROG[b]]; lh(b, .42, 'arp')
    for i in range(16): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .22, .12), bt(b) + i * BEAT / 4, 1, .4 if i % 2 else -.2)
    for k in (1, 2, 3, 4): add(music, kick(.42 if k % 2 else .25), bt(b, k), 1, 0)
    for k in range(8): add(music, tick(.07), bt(b) + k * BEAT / 2 + BEAT / 4, 1, .3)
    add(music, bass(m(c[0]), BAR * .95, .26), bt(b), 1, 0); add(music, pad(m(c[0]) + 12, BAR + .3, .15), bt(b), 1, 0)
phrase(20, THEME2, .56); phrase(22, THEME2[:4], .54)
# S8 (bars 23–25): climax — lead doubles the melody an octave up
for b in (23, 24, 25):
    c = CH[PROG[b]]; lh(b, .46, 'arp')
    for i in range(16): add(music, arp(m(c[[2, 3, 4, 3][i % 4]]) + 12, .22, .13), bt(b) + i * BEAT / 4, 1, .4 if i % 2 else -.2)
    for k in (1, 3): add(music, kick(.42), bt(b, k), 1, 0)
    add(music, bass(m(c[0]), BAR * .95, .28), bt(b), 1, 0)
    for nn in c[1:4]: add(music, pad(m(nn) + 12, BAR + .4, .07), bt(b), 1, 0)
phrase(23, THEME, .58); phrase(25, THEME2[:5], .58)
LD = []; phrase(23, THEME, .5, 1, 'lead', LD); phrase(25, THEME2[:5], .5, 1, 'lead', LD)
for t, _, mm, d, v, p in LD: add(music, lead(mm, d, .07), t, 1, .15)
# S9 (bar 26): piano alone under the last line; silence 2; then the final chord with the logo
pno.append((bt(26), 'piano', m('F2'), BAR * .8, .34, -.15)); phrase(26, [(1, 'A4', 1), (2, 'C5', 1), (3, 'F5', 2)], .36)
FIN = bt(27)
for nn, v in (('C2', .5), ('C3', .44), ('G3', .4), ('E4', .4), ('C5', .44), ('G5', .3)): pno.append((FIN, 'piano', m(nn), 5.2, v, 0))
add(music, pad(m('C4'), 5.0, .12), FIN, 1, 0)
print('rendering piano…', flush=True)
music += S.render(pno, dur=N / SR, master=False)[:N]
music = S.room(music, size=.5, mix=.2).astype(np.float32)

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
        f = stone_step if e.get('surf') == 'stone' else wood_step; add(fx, f(e.get('g', .7) * rng.uniform(.8, 1.1)), t, .5, e.get('pan', 0) + rng.uniform(-.05, .05))
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
    elif ty == 'shout':
        w, sr = sf.read(os.path.join(HERE, 'voices/crowd', e['id'] + '.wav'), dtype='float32')
        w = soxr.resample(w, sr, SR).astype(np.float32); w = lp(w, 4500).astype(np.float32)
        add(fx, w / (np.abs(w).max() + 1e-9) * .5, t, e.get('g', .5) * .7, e.get('pan', 0))

# ———————————————————————— AMBIENCE BEDS ————————————————————————
def bed(t0, t1, gen, gain, fin=.6, fout=.8, pan=0):
    d = t1 - t0; x = gen(d); n = len(x); e = np.ones(n); a, b = int(fin * SR), int(fout * SR)
    e[:a] = np.linspace(0, 1, a); e[-b:] *= np.linspace(1, 0, b); add(amb, (x * e).astype(np.float32), t0, gain, pan)
rain = lambda d: lp(hp(noise(d), 700), 7000) * .3 + lp(noise(d), 300) * .15
bed(0, 11.0, rain, .38, .2, 1.4)                                    # rain J-cut into the door
drops = np.zeros(N, np.float32)
for i in range(120): s = int(rng.uniform(0, 10) * SR); c = X.click(rng.uniform(1.5, 3), .3); drops[s:s + len(c)] += c[:len(drops[s:s + len(c)])] * rng.uniform(.05, .2)
add(amb, drops, 0, .5, .2)
room = lambda d: lp(X.brown(d), 260) * .5
bed(10.0, 43.5, room, .35, .4, .4)
hum = lambda d: (np.sin(2 * np.pi * 60 * t_(d)) * .5 + np.sin(2 * np.pi * 120 * t_(d)) * .3 + np.sin(2 * np.pi * 180 * t_(d)) * .15 + hp(lp(noise(d), 3000), 1500) * .06)
bed(T_ON := bt(13, 3), 86.6, hum, .06, .5, .5)
bed(bt(14), bt(17) + .4, hum, .05, 1.5, .8)                         # louder in the silence (L-cut over the bell)
def murmur(d):
    x = bp(noise(d), 250, 2200); xp = np.arange(0, d + 1, .25); mod = np.interp(t_(d), xp, rng.uniform(.4, 1, len(xp))); return x * mod * .5
bed(62.9, 86.4, murmur, .2, .9, 1.4)                                 # J-cut: the crowd starts before the cut
# ———————————————————————— VOICE ————————————————————————
DURS = json.load(open(os.path.join(HERE, 'voices/dur.json')))
vo_spans = []
for e in E:
    if e['type'] != 'vo': continue
    w, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'), dtype='float32')
    w = soxr.resample(w, sr, SR).astype(np.float32)
    if e.get('dlg'): w = lp(w, 7000).astype(np.float32)
    w = compress(w, thr=.2, ratio=3).astype(np.float32); w = w / (np.sqrt(np.mean(w ** 2)) + 1e-9) * .1
    add(vox, w, e['t'], 1.0, .25 if e['id'] == 'd1' else (-.15 if e['id'] == 'd2' else 0))
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
