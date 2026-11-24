#!/usr/bin/env python3
"""Pixel Zone · "Seu próximo adversário já tá online" — 20 s Reel, 9:16.

Composites the supplied keyframes (frames/) and sprite sheets (sprites/) into a
motion-design cut, synthesises the score + SFX, and muxes the final MP4.

    python3 build.py            # -> pixel-zone-reel-revanche.mp4, poster.jpg
Requires: python3 with numpy + Pillow, ffmpeg.
"""
import os, subprocess, math, wave, json
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, DUR = 1080, 1920, 30, 20.0
N = int(DUR * FPS)
K = W / 941.0                      # design coords (941-wide frames) -> output px
SR = 44100
rng = np.random.default_rng(7)

def P(*a): return os.path.join(HERE, *a)

# ───────────────────────── assets ─────────────────────────
def plate(name):
    im = Image.open(P('frames', name)).convert('RGB').resize((W, H), Image.LANCZOS)
    return np.asarray(im, np.float32)

def sprite(sheet, box, scale):
    im = Image.open(P('sprites', sheet)).convert('RGBA').crop(box)
    bb = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    im = im.crop(bb)
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    return np.asarray(im, np.float32) / 255.0

def clean_move_plate():
    """16b with its baked cursor painted out (all features there are horizontal)."""
    a = np.asarray(Image.open(P('frames', '16b_move.png')).convert('RGB')).copy()
    x0, x1, y0, y1, off = 503, 582, 782, 876, 82
    a[y0:y1, x0:x1] = a[y0:y1, x0 - off:x1 - off]
    return a

def selected_plate(base):
    """RESERVAR HORÁRIO in its pressed state: cyan fill, navy lettering."""
    a = base.astype(np.float32).copy()
    y0, y1 = 868, 1026
    for y in range(y0, y1):
        row = a[y]
        border = (row[:, 1] > 150) & (row[:, 2] > 150) & (row[:, 0] < 140)
        xs = np.where(border[60:900])[0] + 60
        if len(xs) < 2: continue
        l, r = xs.min(), xs.max()
        if r - l < 300: continue
        seg = row[l:r + 1]
        t = np.clip((seg[:, 0] - 70) / 140.0, 0, 1)[:, None]     # white text -> 1
        g = (y - y0) / (y1 - y0)
        cyan = np.array([40 + 30 * (1 - g), 235, 250], np.float32)
        navy = np.array([8, 14, 40], np.float32)
        a[y, l:r + 1] = cyan * (1 - t) + navy * t
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    glow = im.filter(ImageFilter.GaussianBlur(18))
    out = np.maximum(np.asarray(im, np.float32), np.asarray(glow, np.float32) * 0.9)
    m = np.zeros(out.shape[:2], bool); m[840:1060, 40:900] = True
    res = a.copy(); res[m] = out[m]
    return res

print('loading plates…')
F = {n: plate(n) for n in ['01.png', '02.png', '03.png', '04.png', '05.png', '06a_clean.png', '06.png',
                          '07.png', '08.png', '09.png', '10.png', '11.png', '12.png', '13.png', '14.png',
                          '15.png', '16.png', '16b_move.png']}
cm = clean_move_plate()
up = lambda arr: np.asarray(Image.fromarray(arr.astype(np.uint8)).resize((W, H), Image.LANCZOS), np.float32)
F['16c'] = up(cm)
F['16d'] = up(selected_plate(cm))

S = {
    'cur_w':  sprite('cta.png', (360, 470, 500, 640), 0.60 * K),
    'cur_c':  sprite('cta.png', (660, 470, 820, 640), 0.60 * K),
    'ring':   sprite('cta.png', (980, 480, 1200, 690), 0.9 * K),
    'p2_wait': sprite('cards.png', (580, 20, 960, 480), 0.62 * K),
    'p2_ok':  sprite('cards.png', (1000, 20, 1390, 480), 0.62 * K),
    'trail':  sprite('panels.png', (790, 800, 1500, 990), 0.9 * K),
}

# ───────────────────────── image ops ─────────────────────────
def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def eout(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3

def xform(img, scale=1.0, cx=W / 2, cy=H / 2, dx=0.0, dy=0.0):
    if abs(scale - 1) < 1e-4 and abs(dx) < 0.01 and abs(dy) < 0.01: return img
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    s = 1.0 / scale
    # output (x,y) -> input ((x-dx-cx)/scale+cx, ...)
    coeffs = (s, 0, cx - (cx + dx) * s, 0, s, cy - (cy + dy) * s)
    return np.asarray(im.transform((W, H), Image.AFFINE, coeffs, Image.BICUBIC, fillcolor=(3, 4, 12)), np.float32)

def over(img, spr, x, y, alpha=1.0, scale=1.0):
    """Composite RGBA sprite (0..1) centred at (x,y) output px."""
    if alpha <= 0: return img
    if abs(scale - 1) > 1e-3:
        im = Image.fromarray((spr * 255).astype(np.uint8), 'RGBA')
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
        spr = np.asarray(im, np.float32) / 255
    h, w = spr.shape[:2]
    x0, y0 = int(x - w / 2), int(y - h / 2)
    sx0, sy0 = max(0, -x0), max(0, -y0)
    x0c, y0c = max(0, x0), max(0, y0)
    x1c, y1c = min(W, x0 + w), min(H, y0 + h)
    if x1c <= x0c or y1c <= y0c: return img
    s = spr[sy0:sy0 + (y1c - y0c), sx0:sx0 + (x1c - x0c)]
    a = s[..., 3:4] * alpha
    img = img.copy()
    img[y0c:y1c, x0c:x1c] = img[y0c:y1c, x0c:x1c] * (1 - a) + s[..., :3] * 255 * a
    return img

def over_tip(img, spr, tx, ty, alpha=1.0):
    """Place a cursor sprite by its arrow tip (top-left of sprite)."""
    h, w = spr.shape[:2]
    return over(img, spr, tx + w / 2 - 4, ty + h / 2 - 4, alpha)

def mix(a, b, t): return a * (1 - t) + b * t
def flash(img, amt, col=(255, 255, 255)): return img if amt <= 0 else img + (np.array(col, np.float32) - img) * min(amt, 1)
def fade(img, amt): return img * (1 - min(max(amt, 0), 1))

BLK = 36
_cells = rng.random((H // BLK + 1, W // BLK + 1))
def pixel_mask(t, seed_shift=0.0, dirx=0.0):
    g = (_cells + seed_shift) % 1.0
    if dirx:
        xs = np.linspace(0, 1, g.shape[1])[None, :]
        g = g * 0.55 + (xs if dirx > 0 else 1 - xs) * 0.45
    m = (g < t).astype(np.float32)
    return np.kron(m, np.ones((BLK, BLK), np.float32))[:H, :W, None]

def pixel_wipe(a, b, t, **k):
    if t <= 0: return a
    if t >= 1: return b
    m = pixel_mask(t, **k)
    edge = pixel_mask(min(1, t + 0.08), **k) - m                  # glowing front
    out = a * (1 - m) + b * m
    col = np.array([255, 40, 200], np.float32) if t > 0.5 else np.array([30, 230, 255], np.float32)
    return out * (1 - edge * 0.85) + col * edge * 0.85

def rgb_glitch(img, y0, y1, x0, x1, amt):
    if amt <= 0: return img
    img = img.copy()
    band = img[y0:y1, x0:x1]
    sh = int(14 * amt)
    band[..., 0] = np.roll(band[..., 0], sh, axis=1)
    band[..., 2] = np.roll(band[..., 2], -sh, axis=1)
    for _ in range(int(5 * amt) + 1):                              # torn slices
        a = rng.integers(y0, y1 - 8); b = a + rng.integers(4, 16)
        band[a - y0:b - y0] = np.roll(band[a - y0:b - y0], int(rng.integers(-25, 25) * amt), axis=1)
    img[y0:y1, x0:x1] = band
    return img

def shake(t, t0, dur, amp):
    if not (t0 <= t < t0 + dur): return 0.0, 0.0
    k = 1 - (t - t0) / dur
    return amp * k * math.sin(t * 97), amp * k * math.cos(t * 83)

# ───────────────────────── timeline ─────────────────────────
def shot(t):
    D = lambda v: v * K           # design px -> output px
    # 0–3 s · CADÊ O PLAYER 2?
    if t < 0.6:
        img = xform(F['01.png'], 1.06 - 0.06 * eout(t / 0.6))
        return fade(img, 1 - ease(t / 0.35))
    if t < 1.3:
        return flash(mix(F['01.png'], F['02.png'], ease((t - 0.6) / 0.15)), 0.35 * (1 - (t - 0.6) / 0.15))
    if t < 2.3:
        on = int((t - 1.3) / 0.12) % 2 == 0 if t < 1.9 else True       # P2 slot blinks
        return F['03.png'] if on else F['02.png']
    if t < 3.0:
        dx, dy = shake(t, 2.3, 0.25, 10)
        return mix(F['03.png'], xform(F['04.png'], 1.0, dx=dx, dy=dy), ease((t - 2.3) / 0.1))
    # 3–6 s · chat
    if t < 3.9:
        dx, dy = shake(t, 3.15, 0.4, 9)                                 # phone buzz
        p = eout((t - 3.0) / 0.3)
        img = xform(F['05.png'], 0.88 + 0.12 * p, dx=dx, dy=dy)
        if p < 1:                                                       # zoom-through
            img = mix(xform(F['04.png'], 1.0 + 0.35 * p, cy=H * 0.55), img, ease((t - 3.0) / 0.2))
        return img
    if t < 6.0:
        base = F['06a_clean.png'] if t < 4.5 else F['06.png']
        img = mix(F['05.png'], base, ease((t - 3.9) / 0.15)) if t < 4.05 else base
        img = xform(img, 1.0 + 0.02 * ease((t - 3.9) / 2.1))
        for g0, g1 in ((4.5, 4.85), (5.35, 5.55)):
            if g0 <= t < g1:
                img = rgb_glitch(img, int(D(1205)), int(D(1295)), int(D(620)), int(D(840)), 1.0 - 0.6 * (t - g0) / (g1 - g0))
        return img
    # 6–10 s · Lagzilla
    if t < 7.2:
        p = eout((t - 6.0) / 0.32)                                     # push in from the left
        if p < 1:
            a = xform(F['06.png'], 1.02, dx=W * p)
            b = xform(F['07.png'], 1.0, dx=-W * (1 - p))
            img = np.where(np.arange(W)[None, :, None] < W * p, b, a)
        else:
            img = xform(F['07.png'], 1.0 + 0.05 * (t - 6.32), cx=D(200), cy=D(1100))
        return img
    if t < 8.4:                                                         # headline punch (beat drops out)
        s = 1.10 - 0.10 * eout((t - 7.2) / 0.22)
        dx, dy = shake(t, 7.2, 0.2, 14)
        return flash(xform(F['08.png'], s, dx=dx, dy=dy), 0.6 * (1 - (t - 7.2) / 0.1))
    if t < 9.2:                                                         # eyebrow
        s = 1.0 + 0.07 * eout((t - 8.4) / 0.5)
        img = xform(F['09.png'], s, cx=D(470), cy=D(760))
        return mix(xform(F['08.png'], s, cx=D(470), cy=D(760)), img, ease((t - 8.4) / 0.12))
    if t < 10.0:                                                        # presses the button
        s = 1.07 - 0.02 * ease((t - 9.2) / 0.8)
        img = xform(F['10.png'], s, cx=D(470), cy=D(760))
        img = mix(xform(F['09.png'], s, cx=D(470), cy=D(760)), img, ease((t - 9.2) / 0.1))
        if t >= 9.6:
            dx, dy = shake(t, 9.6, 0.15, 6)
            img = xform(img, 1.0, dx=dx, dy=dy)
            img = flash(img, 0.25 * (1 - (t - 9.6) / 0.15), (40, 230, 255))
        return img
    # 10–15 s · pixel wave, P2 joins, lounge
    if t < 11.1:
        dx, dy = shake(t, 10.0, 0.35, 16)
        img = xform(F['11.png'], 1.0 + 0.03 * (t - 10.0), dx=dx, dy=dy)
        img = flash(img, 0.7 * (1 - (t - 10.0) / 0.12), (255, 60, 210))
        img = over(img, S['trail'], D(470) + (1 - eout((t - 10.0) / 0.5)) * -W, D(1450), alpha=0.9)
        if t >= 10.25:                                                  # second slot lights up
            card = S['p2_wait'] if t < 10.7 else S['p2_ok']
            sc = 1 + 0.35 * (1 - eout((t - (10.25 if t < 10.7 else 10.7)) / 0.18))
            img = over(img, card, D(700), D(900), alpha=ease((t - 10.25) / 0.08), scale=sc)
            if t >= 10.7:
                img = flash(img, 0.35 * (1 - (t - 10.7) / 0.15), (255, 60, 210))
        return img
    if t < 12.4:
        z = 1.0 + 0.08 * ((t - 11.1) / 1.3)
        a = xform(F['11.png'], 1.033)
        a = over(a, S['p2_ok'], D(700), D(900))
        b = xform(F['12.png'], z, cy=D(1050))
        return pixel_wipe(a, b, (t - 11.1) / 0.45, dirx=1)
    if t < 13.7:
        a = xform(F['12.png'], 1.08 + 0.05 * (t - 12.4), cy=D(1050))
        b = xform(F['13.png'], 1.05 - 0.04 * ease((t - 12.4) / 1.3))
        return pixel_wipe(a, b, (t - 12.4) / 0.4, seed_shift=0.37, dirx=-1)
    if t < 15.0:
        s = 1.01 - 0.01 * (t - 13.7) / 1.3
        a = xform(F['13.png'], s); b = xform(F['14.png'], s)
        return mix(a, b, ease((t - 13.7) / 0.25))
    # 15–20 s · REVANCHE → RESERVAR HORÁRIO
    if t < 16.2:
        p = eout((t - 15.0) / 0.35)
        img = xform(F['15.png'], 1.04 - 0.04 * eout((t - 15.0) / 0.9), cy=D(1500), dy=H * (1 - p))
        if p < 1:                                                       # whip up
            out = xform(F['14.png'], 1.0, dy=-H * p)
            img = np.where(np.arange(H)[:, None, None] < H * (1 - p), out, img)
        return flash(img, 0.3 * (1 - abs(t - 15.12) / 0.12))
    if t < 17.0:
        b = xform(F['16.png'], 1.03 - 0.03 * eout((t - 16.2) / 0.4))
        b = mix(b, F['16c'], ease((t - 16.85) / 0.15))                  # hand over to the drawn cursor
        if t >= 16.85: b = over_tip(b, S['cur_w'], D(733) - D(4), D(717) - D(4), alpha=ease((t - 16.85) / 0.15))
        return pixel_wipe(F['15.png'], b, (t - 16.2) / 0.35, seed_shift=0.71)
    # cursor curves from REVANCHE down onto RESERVAR HORÁRIO, then clicks
    t0, tArr, tClick = 17.0, 17.75, 17.9
    P0, P1, P2 = (D(733), D(717)), (D(760), D(880)), (D(600), D(948))
    u = ease((t - t0) / (tArr - t0)) ** 0.9
    cx_ = (1 - u) ** 2 * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0]
    cy_ = (1 - u) ** 2 * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1]
    end = P2
    if t < tClick:
        img = F['16c'].copy()
        if t >= tArr - 0.15:                                           # hover glow before the click
            img = mix(img, F['16d'], 0.12 * ease((t - (tArr - 0.15)) / 0.15))
        cur = S['cur_c'] if t >= tArr - 0.15 else S['cur_w']
        return over_tip(img, cur, cx_ - D(4), cy_ - D(4))
    # clicked
    k = (t - tClick)
    img = F['16d'] if k > 0.06 else F['16c']
    sbtn = 1.0 - 0.02 * math.sin(min(k / 0.18, 1) * math.pi)
    img = xform(img, sbtn, cx=D(475), cy=D(945))
    img = flash(img, 0.12 * (1 - k / 0.12), (40, 230, 255))
    rs = 0.6 + 1.6 * eout(k / 0.5)
    img = over(img, S['ring'], end[0], end[1], alpha=max(0, 1 - k / 0.55), scale=rs)
    img = over_tip(img, S['cur_c'], end[0] - D(4) + D(2) * (k < 0.1), end[1] - D(4) + D(3) * (k < 0.1))
    if t > DUR - 0.2:
        img = fade(img, (t - (DUR - 0.2)) / 0.2 * 0.6)
    return img

BEAT, OFF = 0.466667, 0.2
KICKS = [OFF + k * BEAT for k in range(44) if 0.6 <= OFF + k * BEAT < DUR - 0.1 and not (7.2 <= OFF + k * BEAT < 10.0 - 1e-3)]
_np = 46
PT = dict(x=rng.uniform(0, W, _np), y=rng.uniform(0, H, _np), v=rng.uniform(40, 140, _np),
          s=rng.integers(5, 15, _np), ph=rng.uniform(0, 6.28, _np),
          c=np.where(rng.random(_np) < 0.5, 0, 1))
PCOL = np.array([[40, 230, 255], [255, 50, 200]], np.float32)

def particles(img, t):
    img = img.copy()
    xs = (PT['x'] + 18 * np.sin(t * 0.9 + PT['ph'])) % W
    ys = (PT['y'] - PT['v'] * t) % H
    a = 0.22 + 0.18 * np.sin(t * 5 + PT['ph'] * 3)
    for x, y, sz, al, c in zip(xs.astype(int), ys.astype(int), PT['s'], a, PT['c']):
        x1, y1 = min(W, x + sz), min(H, y + sz)
        img[y:y1, x:x1] = img[y:y1, x:x1] + (PCOL[c] - img[y:y1, x:x1]) * al
    return img

def camera(t):
    """Never-still camera: slow float + a push on every kick."""
    s = 1.0 + 0.008 * math.sin(t * 1.3)
    dx, dy = 7 * math.sin(t * 0.8), 6 * math.sin(t * 1.1 + 1)
    bump = 0.0
    for kt in KICKS:
        if 0 <= t - kt < 0.3:
            bump = max(bump, math.exp(-(t - kt) / 0.08) * (0.018 if kt >= 10.0 else 0.011))
    return s + bump, dx, dy, bump

FAST = [(2.98, 3.3), (5.98, 6.32), (7.18, 7.42), (9.98, 10.35), (14.98, 15.4), (17.0, 17.78)]

def frame(t):
    if any(a <= t < b for a, b in FAST):                               # motion blur where things move fast
        sub = [t + (j / 8 - 0.5) * 0.6 / FPS for j in range(9)]
    else:
        sub = [t]
    img = sum(shot(max(0.0, min(DUR - 1e-3, u))) for u in sub) / len(sub)
    s, dx, dy, bump = camera(t)
    img = xform(img, s, dx=dx, dy=dy)
    img = img * (1 + bump * 3)
    if t > 0.3: img = particles(img, t)
    return img

# ───────────────────────── audio ─────────────────────────
def T(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.002, r=0.05):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def sq(f, t): return np.sign(np.sin(2 * np.pi * f * t))
def saw(f, t): return 2 * ((f * t) % 1) - 1
def noise(n): return rng.uniform(-1, 1, n)
def lp(x, a): # one-pole low-pass
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y

def beep(f, d=0.08, v=0.25, shape=sq):
    t = T(d); return shape(f, t) * env(len(t), 0.001, d / 2.5) * v
def sweep(f0, f1, d, v=0.25, shape=np.sin):
    t = T(d); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / SR
    return shape(ph) * env(len(t), 0.003, d / 2) * v
def chord(fs, d, v):
    return sum(beep(f, d, v / len(fs), lambda f_, t: np.sin(2 * np.pi * f_ * t) + 0.3 * sq(f_ * 2, t)) for f in fs)
def arp(fs, step, d, v, shape=sq):
    out = np.zeros(int((step * len(fs) + d) * SR))
    for i, f in enumerate(fs):
        b = beep(f, d, v, shape); s = int(i * step * SR); out[s:s + len(b)] += b
    return out

def kick():
    t = T(0.35); f = 45 + 110 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * 0.9
def snare():
    t = T(0.22); n = noise(len(t))
    return (n * 0.6 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t / 0.06) * 0.45
def hat():
    t = T(0.05); n = noise(len(t)); n = n - lp(n, 0.5)
    return n * np.exp(-t / 0.012) * 0.22

def build_audio():
    L = int((DUR + 0.5) * SR)
    mus = np.zeros(L); sfx = np.zeros(L)
    def put(buf, x, at):
        s = int(at * SR); e = min(L, s + len(x)); buf[s:e] += x[:e - s]
    notes = [55.0, 55.0, 65.41, 49.0]                       # A1 A1 C2 G1 — one chord per bar
    for k in range(0, 44):
        tb = OFF + k * BEAT
        if tb >= DUR - 0.1: break
        if 7.2 <= tb < 10.0 - 1e-3: continue               # the beat stops for Lagzilla
        if tb < 0.6: continue
        full = tb >= 10.0
        put(mus, kick(), tb)
        if k % 2 == 1: put(mus, snare(), tb)
        put(mus, hat(), tb + BEAT / 2)
        if full: put(mus, hat() * 0.6, tb + BEAT / 4); put(mus, hat() * 0.6, tb + 3 * BEAT / 4)
        root = notes[(k // 4) % 4]
        for j in range(2):                                   # off-beat saw bass
            t = T(BEAT / 2 * 0.9)
            b = (saw(root * 2, t) * 0.5 + sq(root, t) * 0.3) * env(len(t), 0.004, 0.09) * 0.32
            put(mus, lp(b, 0.25), tb + j * BEAT / 2)
        if full:                                             # lead arp after the drop
            seq = [root * 8, root * 12, root * 16, root * 12]
            for j, f in enumerate(seq):
                put(mus, beep(f, 0.1, 0.07, lambda f_, t: saw(f_, t)), tb + j * BEAT / 4)
    # pad under the pause so it doesn't go dead
    t = T(2.8); pad = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate([110, 130.8, 164.8]))
    pad *= np.minimum(1, t / 0.3) * np.minimum(1, (2.8 - t) / 0.2) * 0.05
    put(mus, pad, 7.2)

    # SFX
    put(sfx, beep(880, 0.08, 0.22), 0.08)
    put(sfx, beep(880, 0.06, 0.2) , 0.6); put(sfx, beep(1320, 0.12, 0.22), 0.67)
    for b in (1.3, 1.54, 1.78): put(sfx, beep(660, 0.05, 0.16), b)
    put(sfx, chord([988, 1319], 0.18, 0.3), 2.3)
    t = T(0.42); buzz = (saw(150, t) * 0.6 + sq(75, t) * 0.4) * (np.sin(2 * np.pi * 9 * t) > -0.2) * 0.22
    buzz *= np.minimum(1, (0.42 - t) / 0.04)
    put(sfx, lp(buzz, 0.3), 3.0)
    put(sfx, sweep(500, 1400, 0.12, 0.22), 3.9)
    for g0, d in ((4.5, 0.35), (5.35, 0.2)):
        n = noise(int(d * SR)); n = np.repeat(n[::40], 40)[:len(n)] * 0.09
        n *= (np.sin(np.arange(len(n)) / SR * 2 * np.pi * 23) > 0)
        put(sfx, n, g0)
    wn = noise(int(0.45 * SR)); put(sfx, lp(wn, 0.08) * np.hanning(len(wn)) * 0.7, 5.85)
    t = T(0.9); boom = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.3) * 0.8
    put(sfx, boom + lp(noise(len(t)), 0.2) * np.exp(-t / 0.05) * 0.3, 7.2)
    put(sfx, sweep(300, 900, 0.18, 0.16), 9.0)              # eyebrow "bwip" (after the line)
    put(sfx, beep(2000, 0.02, 0.3, lambda f, t: noise(len(t))), 9.6)
    put(sfx, beep(1500, 0.03, 0.15), 9.6)
    rn = noise(int(0.8 * SR)); rs = lp(rn, 0.15) * np.linspace(0, 1, len(rn)) ** 2 * 0.35
    put(sfx, rs + sweep(200, 1600, 0.8, 0.08, lambda p: saw(1, p / (2 * np.pi))), 9.2)
    put(sfx, boom * 0.8, 10.0)
    put(sfx, arp([1047, 1319, 1568, 2093, 2637, 3136], 0.035, 0.08, 0.12), 10.0)
    put(sfx, beep(660, 0.05, 0.12), 10.25)
    put(sfx, arp([784, 988, 1175, 1568], 0.06, 0.18, 0.2, lambda f, t: np.sin(2 * np.pi * f * t) + 0.3 * sq(f, t)), 10.7)
    for ts in (2.95, 11.1, 12.4, 14.92, 16.2):
        wn = noise(int(0.3 * SR)); put(sfx, (wn - lp(wn, 0.3)) * np.hanning(len(wn)) * 0.25, ts)
    put(sfx, beep(1200, 0.025, 0.14), 16.55)
    put(sfx, beep(1000, 0.025, 0.12), 17.35)
    put(sfx, beep(1500, 0.025, 0.16), 17.9)
    put(sfx, beep(2000, 0.02, 0.3, lambda f, t: noise(len(t))), 18.1)
    put(sfx, arp([523, 659, 784, 1047, 1319], 0.055, 0.35, 0.28, lambda f, t: np.sin(2 * np.pi * f * t) + 0.25 * sq(f, t)), 18.12)

    # narration (voices/ from tools/tts.py; timings in lines.json)
    vox = np.zeros(L); duck = np.zeros(L)
    for l in json.load(open(P('lines.json'))):
        with wave.open(P('voices', l['id'] + '.wav')) as w:
            v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        v = v / (np.abs(v).max() + 1e-9) * 0.62
        if l['id'].startswith('f'):                          # friend: chat/phone colour
            v = lp(v - lp(v, 0.06), 0.5) * 1.6
        if l['id'].startswith('l'):                          # Lagzilla: a little slap-back room
            d = int(0.07 * SR); v = v + np.concatenate([np.zeros(d), v[:-d]]) * 0.25
        put(vox, v, l['at'])
        s0 = int(l['at'] * SR); duck[s0:s0 + len(v)] = 1
    k = int(0.08 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
    sfx = sfx * (1 - 0.35 * duck) + vox

    mus_env = np.ones(L) * (1 - 0.55 * duck)
    s, e = int((DUR - 1.2) * SR), int(DUR * SR)
    mus_env[s:e] *= np.linspace(1, 0, e - s); mus_env[e:] = 0
    out = mus * 0.75 * mus_env + sfx
    out = np.tanh(out * 1.2) * 0.85
    st = np.stack([out, out], 1)
    st[:, 0] += np.roll(sfx, 220) * 0.0                       # mono-safe
    pcm = (np.clip(st[:int(DUR * SR)], -1, 1) * 32767).astype(np.int16)
    os.makedirs(P('out'), exist_ok=True)
    with wave.open(P('out', 'mix.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

# ───────────────────────── render ─────────────────────────
def _render_one(i):
    np.random.seed(i); rng.bit_generator.state = np.random.default_rng(1000 + i).bit_generator.state
    return np.clip(frame(i / FPS), 0, 255).astype(np.uint8).tobytes()

def render():
    os.makedirs(P('out'), exist_ok=True)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
           '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
           '-pix_fmt', 'yuv420p', P('out', 'video.mp4')]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    from multiprocessing import Pool
    with Pool(os.cpu_count() or 2) as pool:
        for i, buf in enumerate(pool.imap(_render_one, range(N), chunksize=4)):
            pr.stdin.write(buf)
            if i % 60 == 0: print(f'  frame {i}/{N}', flush=True)
    pr.stdin.close(); pr.wait()

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'still':
        for t in map(float, sys.argv[2:]):
            Image.fromarray(np.clip(frame(t), 0, 255).astype(np.uint8)).save(P('out', f'still_{t:05.2f}.jpg'), quality=88)
        sys.exit()
    print("audio…"); build_audio()
    print('video…'); render()
    final = P('pixel-zone-reel-revanche.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', P('out', 'video.mp4'), '-i', P('out', 'mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '13.0', '-i', final, '-frames:v', '1', '-q:v', '2',
                    P('poster.jpg')], check=True)
    print('done →', final)
