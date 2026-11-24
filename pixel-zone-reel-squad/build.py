#!/usr/bin/env python3
"""Pixel Zone · "Qual é o seu squad?" — 21.5 s Reel, 9:16.

A fighting-game character-select screen built in code: 4 friend archetypes with
stat bars, a secret character (Lagzilla), squad complete, tag-your-squad CTA.

    python3 tools/tts.py     # narration -> voices/ (edge-tts; texts + timings in lines.json)
    python3 build.py         # -> pixel-zone-reel-squad.mp4, poster.jpg
    python3 build.py still 1.0 4.5   # preview stills into out/
Requires: numpy, Pillow, ffmpeg.
"""
import os, sys, math, json, wave, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(HERE, *a)
W, H, FPS, DUR = 1080, 1920, 30, 21.5
N = int(DUR * FPS)
SR = 44100
rng = np.random.default_rng(11)

CY = (40, 230, 255); MG = (255, 45, 200); PU = (160, 90, 255); GD = (255, 196, 40); WH = (255, 255, 255)
BG0 = np.array([4, 5, 16], np.float32)

def font(sz, w='ExtraBold'): return ImageFont.truetype(P('fonts', f'BarlowCondensed-{w}Italic.ttf'), sz)

# ───────────────────────── layout (safe zone: y 230–1440, right 230 px clear of key content) ─────────────────────────
CARD = (60, 470, 850, 1120)
SLOT_Y0, SLOT_Y1 = 1170, 1400
SLOTS = [(60 + i * 160, SLOT_Y0, 60 + i * 160 + 150, SLOT_Y1) for i in range(5)]

CHARS = [
    dict(col=CY, name='O CULPA-O-COMANDO', prop='pad',   stats=[('DESCULPAS', 99), ('HABILIDADE', 12)]),
    dict(col=MG, name='PRIMEIRO OU NADA',  prop='crown', stats=[('EGO', 99), ('PACIÊNCIA', 3)]),
    dict(col=PU, name='O "SÓ MAIS UMA"',   prop='clock', stats=[('PARTIDAS', 99), ('HORA DE IR', 0)], timer=True),
    dict(col=GD, name='O DOS SNACKS',      prop='snack', stats=[('GENEROSIDADE', 99), ('RARIDADE', 100)], badge='LENDÁRIO'),
    dict(col=PU, name='LAGZILLA',          prop='lag',   stats=[('CULPA O LAG', 99), ('DERROTAS ADMITIDAS', 0)], badge='SECRETO'),
]
# (start, end) of each selection on screen, matched to the narration
SEL = [(3.0, 5.95), (5.95, 7.95), (7.95, 10.45), (10.45, 13.27), (13.27, 16.07)]
T_SQUAD, T_CTA = 16.07, 19.7

# ───────────────────────── drawing helpers ─────────────────────────
def glow_layer(draw_fn, size=(W, H), blur=14, strength=1.6):
    """draw_fn(draw) on an RGBA layer, return layer + blurred glow (premultiplied-ish)."""
    lay = Image.new('RGBA', size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(lay))
    g = lay.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    for _ in range(int(strength)): out = Image.alpha_composite(out, g)
    if strength % 1: out = Image.blend(out, Image.alpha_composite(out, g), strength % 1)
    return Image.alpha_composite(out, lay)

def chamfer(box, c=26):
    x0, y0, x1, y1 = box
    return [(x0 + c, y0), (x1, y0), (x1, y1 - c), (x1 - c, y1), (x0, y1), (x0, y0 + c)]

def text_c(d, xy, s, f, fill, anchor='mm', stroke=0, sf=None):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=sf)

def to_np(im): return np.asarray(im.convert('RGBA'), np.float32) / 255.0

def background():
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    img = np.ones((H, W, 3), np.float32) * BG0
    left = np.exp(-x / 0.06)[..., None] * (0.55 + 0.25 * np.sin(y * 3)[..., None])
    right = np.exp(-(1 - x) / 0.06)[..., None] * (0.55 + 0.25 * np.cos(y * 3)[..., None])
    img += left * np.array(CY, np.float32) * 0.8 + right * np.array(MG, np.float32) * 0.8
    img += (np.exp(-((x - 0.5) ** 2 + (y - 0.45) ** 2) / 0.08) * 22)[..., None] * np.array([0.4, 0.3, 1.0])
    # faint grid floor
    grid = ((np.arange(H)[:, None] % 48 == 0) | (np.arange(W)[None, :] % 48 == 0)).astype(np.float32)
    img += grid[..., None] * 7 * (y > 0)[..., None]
    return np.clip(img, 0, 255)

def draw_avatar(d, cx, cy, r, col, width=10):
    d.ellipse([cx - r * 0.42, cy - r * 0.95, cx + r * 0.42, cy - r * 0.11], outline=col + (255,), width=width)
    d.chord([cx - r * 0.82, cy + 0.02 * r, cx + r * 0.82, cy + r * 1.6], 180, 360, outline=col + (255,), width=width)
    d.line([cx - r * 0.82, cy + 0.81 * r, cx + r * 0.82, cy + 0.81 * r], fill=col + (255,), width=width)

def draw_prop(d, kind, cx, cy, s, col):
    c = col + (255,); w = max(6, int(s * 0.09))
    if kind == 'pad':
        d.rounded_rectangle([cx - s, cy - s * 0.5, cx + s, cy + s * 0.5], radius=s * 0.45, outline=c, width=w)
        d.line([cx - s * 0.55, cy, cx - s * 0.2, cy], fill=c, width=w); d.line([cx - s * 0.375, cy - s * 0.18, cx - s * 0.375, cy + s * 0.18], fill=c, width=w)
        for dx, dy in ((0.45, -0.12), (0.62, 0.08)): d.ellipse([cx + s * dx - w, cy + s * dy - w, cx + s * dx + w, cy + s * dy + w], fill=c)
        text_c(d, (cx + s * 0.95, cy - s * 0.8), '!', font(int(s * 1.1)), MG + (255,))
    elif kind == 'crown':
        pts = [(cx - s, cy + s * 0.5), (cx - s, cy - s * 0.45), (cx - s * 0.5, cy), (cx, cy - s * 0.7), (cx + s * 0.5, cy), (cx + s, cy - s * 0.45), (cx + s, cy + s * 0.5)]
        d.line(pts + [pts[0]], fill=c, width=w, joint='curve')
        text_c(d, (cx, cy + s * 0.95), '#1', font(int(s * 0.7)), WH + (255,))
    elif kind == 'clock':
        d.ellipse([cx - s * 0.8, cy - s * 0.8, cx + s * 0.8, cy + s * 0.8], outline=c, width=w)
        d.line([cx, cy, cx, cy - s * 0.5], fill=c, width=w); d.line([cx, cy, cx + s * 0.38, cy + s * 0.12], fill=c, width=w)
        text_c(d, (cx + s * 1.0, cy - s * 0.75), '+1', font(int(s * 0.8)), MG + (255,))
    elif kind == 'snack':
        pts = [(cx - s * 0.7, cy - s * 0.85), (cx + s * 0.7, cy - s * 0.85), (cx + s * 0.85, cy + s * 0.85), (cx - s * 0.85, cy + s * 0.85)]
        d.polygon(pts, outline=c, width=w)
        for k in range(-2, 3): d.line([cx + k * s * 0.33, cy - s * 0.85, cx + k * s * 0.33 + s * 0.08, cy - s * 1.0], fill=c, width=max(3, w // 2))
        text_c(d, (cx, cy + s * 0.05), 'SNACK', font(int(s * 0.5)), c)

def card_layer(i):
    ch = CHARS[i]; col = ch['col']; x0, y0, x1, y1 = CARD
    def fn(d):
        d.polygon(chamfer(CARD, 40), fill=(8, 10, 30, 235))
        d.line(chamfer(CARD, 40) + [chamfer(CARD, 40)[0]], fill=col + (255,), width=6)
        d.line([x0 + 60, y1 - 8, x0 + 300, y1 - 8], fill=col + (255,), width=10)
        text_c(d, (x0 + 40, y0 + 46), f'PLAYER {i + 1}' if i < 4 else 'PERSONAGEM SECRETO', font(44, 'Bold'), col + (255,), 'lm')
        if ch['prop'] != 'lag':
            draw_avatar(d, x0 + 215, y0 + 240, 125, col, 11)
            draw_prop(d, ch['prop'], x0 + 560, y0 + 345, 66, col)
        text_c(d, (x0 + 420, y0 + 150), ch['name'], font(70 if len(ch['name']) < 16 else 62), WH + (255,), 'lm')
        if ch.get('badge'):
            bx = x0 + 425
            d.rounded_rectangle([bx, y0 + 205, bx + 210, y0 + 255], radius=10, fill=col + (255,))
            text_c(d, (bx + 105, y0 + 230), ch['badge'], font(36), (10, 10, 30, 255))
        for k, (lab, _) in enumerate(ch['stats']):
            yy = y0 + 455 + k * 95
            text_c(d, (x0 + 40, yy), lab, font(40, 'Bold'), (210, 215, 255, 255), 'lm')
            d.rounded_rectangle([x0 + 40, yy + 28, x1 - 120, yy + 54], radius=8, outline=(90, 95, 150, 255), width=3)
    return to_np(glow_layer(fn, blur=12, strength=1.4))

def slot_layer(i, state):
    """state: 'empty' | 'hover' | 'locked' | 'ready'."""
    ch = CHARS[i]; col = ch['col'] if state != 'locked' else (120, 120, 160)
    box = SLOTS[i]; x0, y0, x1, y1 = box; cx = (x0 + x1) / 2
    def fn(d):
        dim = state in ('empty', 'locked')
        d.polygon(chamfer(box, 18), fill=(8, 10, 30, 230) if state != 'hover' else col + (70,))
        d.line(chamfer(box, 18) + [chamfer(box, 18)[0]], fill=col + ((150,) if dim else (255,)), width=4 if dim else 6)
        if state == 'locked':
            text_c(d, (cx, y0 + 105), '?', font(120), (150, 150, 190, 255))
        elif i < 4:
            draw_avatar(d, cx, y0 + 95, 42, col if not dim else (110, 120, 160), 6)
        text_c(d, (cx, y1 - 28), ('P%d' % (i + 1)) if i < 4 else '???', font(36, 'Bold'), (230, 230, 255, 255 if not dim else 140))
        if state == 'ready':
            d.rounded_rectangle([x0 + 14, y1 - 52, x1 - 14, y1 - 8], radius=8, fill=col + (255,))
            text_c(d, (cx, y1 - 30), 'PRONTO', font(32), (10, 10, 30, 255))
    lay = glow_layer(fn, blur=10, strength=1.3 if state != 'empty' else 0.6)
    if i == 4 and state != 'locked':                                   # mini Lagzilla in the secret slot
        lz = Image.open(P('refs', 'lagzilla.png')).convert('RGBA'); lz = lz.resize((int(lz.width * 150 / lz.height), 150), Image.LANCZOS)
        lay.alpha_composite(lz, (int(cx - lz.width / 2), y0 + 18))
    return to_np(lay)

def text_layer(lines, blur=14):
    def fn(d):
        for (xy, s, sz, col, anchor) in lines: text_c(d, xy, s, font(sz), col + (255,), anchor)
    return to_np(glow_layer(fn, blur=blur, strength=1.2))

# ───────────────────────── assets ─────────────────────────
print('building layers…')
BG = background()
LOGO = np.asarray(Image.open(P('refs', 'logo.png')).convert('RGB').resize((340, 133), Image.LANCZOS), np.float32)
CARDS = [card_layer(i) for i in range(5)]
SL = {(i, s): slot_layer(i, s) for i in range(5) for s in ('empty', 'hover', 'ready', 'locked')}
HOOK = text_layer([((455, 640), '4 AMIGOS', 150, WH, 'mm'), ((455, 790), '1 CONSOLA', 150, CY, 'mm'),
                   ((455, 960), 'QUAL É O SEU SQUAD?', 104, MG, 'mm')])
HEADER = text_layer([((455, 330), 'QUAL É O SEU SQUAD?', 84, WH, 'mm')], blur=10)
UNLOCK = text_layer([((455, 410), 'DESBLOQUEADO!', 64, GD, 'mm')], blur=10)
SQUAD = text_layer([((455, 520), 'SQUAD', 190, WH, 'mm'), ((455, 690), 'COMPLETO', 190, CY, 'mm'),
                    ((300, 900), '6 €', 150, MG, 'mm'), ((560, 880), '/ hora por', 64, WH, 'mm'), ((560, 935), 'consola', 64, WH, 'mm'),
                    ((455, 1060), 'ATÉ 4 JOGADORES', 70, WH, 'mm')])
CTA = text_layer([((455, 560), 'MARCA O', 170, WH, 'mm'), ((455, 730), 'SEU SQUAD', 170, MG, 'mm'),
                  ((455, 880), '@ @ @ @', 90, CY, 'mm'), ((455, 1060), 'Reserva no link da bio', 66, WH, 'mm')])
def lag_sprite():
    im = Image.open(P('refs', 'lagzilla.png')).convert('RGBA')
    im = im.resize((int(im.width * 380 / im.height), 380), Image.LANCZOS)
    return to_np(im)
LAG = lag_sprite()
def lounge():
    img = Image.new('RGB', (W, H), tuple(int(v) for v in BG0))
    for name, y, h in (('lounge_bar.png', 200, 640), ('lounge_puffs.png', 840, 640)):
        im = Image.open(P('refs', name)).convert('RGB'); sc = h / im.height
        im = im.resize((int(im.width * sc), h), Image.LANCZOS)
        if im.width < W: im = im.resize((W, int(h * W / im.width)), Image.LANCZOS)
        x0 = (im.width - W) // 2; img.paste(im.crop((x0, 0, x0 + W, h)), (0, y))
    arr = np.asarray(img.filter(ImageFilter.GaussianBlur(4)), np.float32) * 0.40
    yy = np.arange(H)[:, None, None]
    m = np.clip((yy - 200) / 160, 0, 1) * np.clip((1480 - yy) / 160, 0, 1)
    return BG * (1 - m) + np.maximum(arr, BG * 0.5) * m
LOUNGE = lounge()

# ───────────────────────── compositing ─────────────────────────
def ease(x): x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)
def eout(x): x = min(max(x, 0.0), 1.0); return 1 - (1 - x) ** 3
def eback(x):
    x = min(max(x, 0.0), 1.0); c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def comp(img, lay, dx=0, dy=0, a=1.0, scale=1.0, cx=W / 2, cy=H / 2):
    if a <= 0.003: return img
    if abs(scale - 1) > 1e-3 or dx or dy:
        im = Image.fromarray((np.clip(lay, 0, 1) * 255).astype(np.uint8), 'RGBA')
        s = 1 / scale
        im = im.transform((W, H), Image.AFFINE, (s, 0, cx - (cx + dx) * s, 0, s, cy - (cy + dy) * s), Image.BILINEAR)
        lay = np.asarray(im, np.float32) / 255
    al = lay[..., 3:4] * a
    return img * (1 - al) + lay[..., :3] * 255 * al

def paste(img, spr, x, y, a=1.0):
    h, w = spr.shape[:2]; x, y = int(x), int(y)
    xa, ya, xb, yb = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if xb <= xa or yb <= ya: return img
    s = spr[ya - y:yb - y, xa - x:xb - x]; al = s[..., 3:4] * a
    img[ya:yb, xa:xb] = img[ya:yb, xa:xb] * (1 - al) + s[..., :3] * 255 * al
    return img

def flash(img, amt, col=WH): return img if amt <= 0 else img + (np.array(col, np.float32) - img) * min(amt, 1)

def bars(img, i, t0, t):
    x0, y0, x1, y1 = CARD; col = np.array(CHARS[i]['col'], np.float32)
    for k, (_, v) in enumerate(CHARS[i]['stats']):
        yy = y0 + 455 + k * 95
        p = eout((t - t0 - 0.35 - k * 0.25) / 0.6)
        full = (x1 - 120) - (x0 + 40) - 8
        wpx = int(full * v / 100 * p)
        if v == 0: wpx = int(10 * (1 - p) + 2)                       # drains to zero
        if wpx > 0:
            img[yy + 32:yy + 51, x0 + 44:x0 + 44 + wpx] = col * 0.9 + 25
        num = int(round(v * p)) if v else int(round(40 * (1 - p)))
        img = paste(img, NUMS[(i, k, num)], x1 - 110, yy + 14) if (i, k, num) in NUMS else img
    return img

def num_sprite(n, col):
    im = Image.new('RGBA', (100, 56), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    text_c(d, (50, 28), str(n), font(52), col + (255,)); return to_np(im)
NUMS = {}
for i, ch in enumerate(CHARS):
    for k, (_, v) in enumerate(ch['stats']):
        for n in range(0, 101): NUMS[(i, k, n)] = num_sprite(n, ch['col'] if v else MG)
TIMER = {}
def timer_sprite(s):
    if s in TIMER: return TIMER[s]
    im = Image.new('RGBA', (360, 60), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    text_c(d, (0, 30), 'JOGANDO HÁ ' + s, font(46), MG + (255,), 'lm'); TIMER[s] = to_np(im); return TIMER[s]

def cursor_xy(t):
    """Cursor hovers over slots: hook -> slot1 ... slot5."""
    pts = [(-1.0, (455, 1460))] + [(SEL[i][0], ((SLOTS[i][0] + SLOTS[i][2]) / 2 + 30, SLOTS[i][1] + 150)) for i in range(5)]
    for (ta, pa), (tb, pb) in zip(pts, pts[1:]):
        if t < tb:
            u = eout((t - (tb - 0.28)) / 0.28) if t > tb - 0.28 else 0.0
            return pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u
    return pts[-1][1]
def cursor_sprite():
    im = Image.new('RGBA', (70, 90), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(4, 4), (4, 70), (22, 54), (34, 84), (46, 78), (34, 50), (58, 50)]
    d.polygon(pts, fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=4)
    return to_np(im)
CURSOR = cursor_sprite()

def selected_idx(t):
    for i, (a, b) in enumerate(SEL):
        if a <= t < b: return i
    return None

def shot(t):
    img = BG.copy()
    if t >= T_SQUAD:                                                   # lounge backdrop
        p = ease((t - T_SQUAD) / 0.4)
        z = 1.0 + 0.05 * (t - T_SQUAD) / (DUR - T_SQUAD)
        lo = LOUNGE if z < 1.001 else np.asarray(Image.fromarray(LOUNGE.astype(np.uint8)).resize((int(W * z), int(H * z))).crop(
            (int((W * z - W) / 2), int((H * z - H) / 2), int((W * z - W) / 2) + W, int((H * z - H) / 2) + H)), np.float32)
        img = img * (1 - p) + lo * p
    # logo, always
    img[230:363, 285:625] = np.maximum(img[230:363, 285:625], LOGO) if t < 3.0 or t >= T_CTA else img[230:363, 285:625]
    if 3.0 <= t < T_CTA:
        img[200:290, 340:570] = np.maximum(img[200:290, 340:570], LOGO[20:110, 55:285] * 0.0 + np.asarray(
            Image.fromarray(LOGO.astype(np.uint8)).resize((230, 90)), np.float32)) if False else img[200:290, 340:570]

    # ── hook ──
    if t < 3.0:
        a = 1.0 if t < 2.75 else 1 - ease((t - 2.75) / 0.25)
        img = comp(img, HOOK, a=a, scale=1.12 - 0.12 * eout(t / 0.45), cy=800)
    # ── header + slots during selection ──
    if 2.75 <= t < T_SQUAD:
        img = comp(img, HEADER, a=ease((t - 2.75) / 0.25), dy=-30 * (1 - eout((t - 2.75) / 0.3)))
    if t < T_SQUAD + 0.35:
        for i in range(5):
            tin = 0.25 + i * 0.12
            if t < tin: continue
            si = selected_idx(t)
            if i == 4 and t < SEL[4][0]: st = 'locked'
            elif si == i: st = 'hover'
            elif t >= SEL[i][1] or (si is not None and si > i): st = 'ready'
            else: st = 'empty'
            pop = eback((t - tin) / 0.3)
            out = 1 - ease((t - T_SQUAD) / 0.35) if t >= T_SQUAD else 1.0
            cx_, cy_ = (SLOTS[i][0] + SLOTS[i][2]) / 2, (SLOTS[i][1] + SLOTS[i][3]) / 2
            img = comp(img, SL[(i, st)], a=min(1, (t - tin) / 0.08) * out, scale=0.6 + 0.4 * pop, cx=cx_, cy=cy_,
                       dy=0 if t < T_SQUAD else 80 * ease((t - T_SQUAD) / 0.35))
    # ── character card ──
    si = selected_idx(t)
    if si is not None:
        t0, t1 = SEL[si]
        enter = eout((t - t0) / 0.28)
        leave = ease((t - (t1 - 0.18)) / 0.18) if t > t1 - 0.18 else 0.0
        dx = (1 - enter) * W * 0.9 - leave * W * 0.9
        if si == 4 and t < t0 + 0.5:                                   # secret: glitch in
            g = 1 - (t - t0) / 0.5
            lay = CARDS[4].copy(); sh = int(30 * g)
            lay[..., 0] = np.roll(lay[..., 0], sh, 1); lay[..., 2] = np.roll(lay[..., 2], -sh, 1)
            img = comp(img, lay, a=min(1, (t - t0) / 0.06) * (0.4 + 0.6 * (int(t * 40) % 2)), dx=0)
        else:
            img = comp(img, CARDS[si], dx=dx)
        if dx == 0 or abs(dx) < 1:
            img = bars(img, si, t0, t)
        if si == 2 and abs(dx) < 1:                                    # "só mais uma" timer
            secs = 3 * 3600 + int((t - t0) * 1800)
            img = paste(img, timer_sprite('%d:%02d:%02d' % (secs // 3600, secs // 60 % 60, secs % 60)), CARD[0] + 420, CARD[1] + 225)
        if si == 4:
            img = paste(img, LAG, CARD[0] + 215 - LAG.shape[1] / 2 + dx, CARD[1] + 70, a=ease((t - t0 - 0.15) / 0.2))
            img = comp(img, UNLOCK, a=ease((t - t0) / 0.15) * (1 - leave), scale=1.15 - 0.15 * eout((t - t0) / 0.3), cy=410)
            if t < t0 + 0.15: img = flash(img, 0.6 * (1 - (t - t0) / 0.15), PU)
        if t < t0 + 0.1 and si < 4:
            img = flash(img, 0.18 * (1 - (t - t0) / 0.1), CHARS[si]['col'])
    # ── cursor ──
    if 2.7 <= t < T_SQUAD - 0.1:
        cx_, cy_ = cursor_xy(t)
        img = paste(img, CURSOR, cx_, cy_, a=ease((t - 2.7) / 0.2))
    # ── squad complete ──
    if T_SQUAD <= t < T_CTA:
        k = t - T_SQUAD
        out = 1 - ease((t - (T_CTA - 0.2)) / 0.2)
        img = comp(img, SQUAD, a=ease(k / 0.15) * out, scale=1.25 - 0.25 * eback(k / 0.4), cy=700)
        for i in range(4):                                             # all four READY under the title
            ti = 0.35 + i * 0.1
            if k >= ti:
                lay = SL[(i, 'ready')]
                img = comp(img, lay, a=out, dx=CARD[0] + 40 + i * 160 + 60 - (SLOTS[i][0] + 75) + 0,
                           dy=-(1 - eback((k - ti) / 0.3)) * 120, scale=1.0)
        img = flash(img, 0.45 * (1 - k / 0.15))
    # ── CTA ──
    if t >= T_CTA:
        k = t - T_CTA
        img = comp(img, CTA, a=ease(k / 0.15), scale=1.2 - 0.2 * eback(k / 0.4), cy=700)
        img = flash(img, 0.35 * (1 - k / 0.12), MG)
    return img

# ───────────────────────── post: motion blur, camera, beat pulse, particles ─────────────────────────
BEAT, OFF = 0.466667, 0.2
KICKS = [OFF + k * BEAT for k in range(60) if 0.0 <= OFF + k * BEAT < DUR - 0.1 and not (12.8 <= OFF + k * BEAT < 13.2)]
FAST = [(s - 0.02, s + 0.32) for s, _ in SEL] + [(T_SQUAD - 0.02, T_SQUAD + 0.45), (T_CTA - 0.2, T_CTA + 0.4), (0, 0.45)]
_np = 46
PT = dict(x=rng.uniform(0, W, _np), y=rng.uniform(0, H, _np), v=rng.uniform(40, 140, _np),
          s=rng.integers(5, 15, _np), ph=rng.uniform(0, 6.28, _np), c=np.where(rng.random(_np) < 0.5, 0, 1))
PCOL = np.array([CY, MG], np.float32)

def particles(img, t):
    xs = (PT['x'] + 18 * np.sin(t * 0.9 + PT['ph'])) % W; ys = (PT['y'] - PT['v'] * t) % H
    a = 0.2 + 0.16 * np.sin(t * 5 + PT['ph'] * 3)
    for x, y, sz, al, c in zip(xs.astype(int), ys.astype(int), PT['s'], a, PT['c']):
        img[y:y + sz, x:x + sz] += (PCOL[c] - img[y:y + sz, x:x + sz]) * al
    return img

def camera(t):
    s = 1.0 + 0.008 * math.sin(t * 1.3); dx, dy = 7 * math.sin(t * 0.8), 6 * math.sin(t * 1.1 + 1); bump = 0.0
    for kt in KICKS:
        if 0 <= t - kt < 0.3: bump = max(bump, math.exp(-(t - kt) / 0.08) * (0.016 if kt >= 13.2 else 0.010))
    return s + bump, dx, dy, bump

def xform(img, scale, dx, dy):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); s = 1 / scale; cx, cy = W / 2, H / 2
    return np.asarray(im.transform((W, H), Image.AFFINE, (s, 0, cx - (cx + dx) * s, 0, s, cy - (cy + dy) * s),
                                   Image.BICUBIC, fillcolor=tuple(int(v) for v in BG0)), np.float32)

def frame(t):
    sub = [t + (j / 6 - 0.5) * 0.6 / FPS for j in range(7)] if any(a <= t < b for a, b in FAST) else [t]
    img = sum(shot(max(0.0, min(DUR - 1e-3, u))) for u in sub) / len(sub)
    s, dx, dy, bump = camera(t)
    img = xform(img, s, dx, dy) * (1 + bump * 3)
    if t < 0.25: img *= ease(t / 0.25)
    return particles(img, t)

# ───────────────────────── audio ─────────────────────────
def T(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.002, r=0.05):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def sq(f, t): return np.sign(np.sin(2 * np.pi * f * t))
def saw(f, t): return 2 * ((f * t) % 1) - 1
def noise(n): return rng.uniform(-1, 1, n)
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y
def beep(f, d=0.08, v=0.25, shape=sq):
    t = T(d); return shape(f, t) * env(len(t), 0.001, d / 2.5) * v
def sweep(f0, f1, d, v=0.25):
    t = T(d); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / SR
    return np.sin(ph) * env(len(t), 0.003, d / 2) * v
def arp(fs, step, d, v):
    out = np.zeros(int((step * len(fs) + d) * SR))
    for i, f in enumerate(fs):
        b = beep(f, d, v, lambda f_, t: np.sin(2 * np.pi * f_ * t) + 0.3 * sq(f_, t)); s = int(i * step * SR); out[s:s + len(b)] += b
    return out
def kick():
    t = T(0.35); return np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t / 0.035)) / SR) * np.exp(-t / 0.16) * 0.9
def snare():
    t = T(0.22); return (noise(len(t)) * 0.6 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t / 0.06) * 0.45
def hat():
    t = T(0.05); n = noise(len(t)); n = n - lp(n, 0.5); return n * np.exp(-t / 0.012) * 0.22

def build_audio():
    L = int((DUR + 0.5) * SR); mus = np.zeros(L); sfx = np.zeros(L)
    def put(buf, x, at):
        s = int(at * SR); e = min(L, s + len(x)); buf[s:e] += x[:e - s]
    notes = [55.0, 65.41, 49.0, 55.0]
    for kt in KICKS:
        k = round((kt - OFF) / BEAT); full = kt >= 13.2
        put(mus, kick(), kt)
        if k % 2 == 1: put(mus, snare(), kt)
        put(mus, hat(), kt + BEAT / 2)
        if full: put(mus, hat() * 0.6, kt + BEAT / 4); put(mus, hat() * 0.6, kt + 3 * BEAT / 4)
        root = notes[(k // 4) % 4]
        for j in range(2):
            t = T(BEAT / 2 * 0.9)
            put(mus, lp((saw(root * 2, t) * 0.5 + sq(root, t) * 0.3) * env(len(t), 0.004, 0.09) * 0.3, 0.25), kt + j * BEAT / 2)
        if full:
            for j, f in enumerate([root * 8, root * 12, root * 16, root * 12]):
                put(mus, beep(f, 0.1, 0.06, lambda f_, t: saw(f_, t)), kt + j * BEAT / 4)
    # SFX
    for i in range(5): put(sfx, beep(660 + 110 * i, 0.05, 0.14), 0.25 + i * 0.12)          # slots pop in
    for i, (a, _) in enumerate(SEL):
        put(sfx, beep(1500, 0.02, 0.12), a - 0.25)                                         # cursor tick
        if i < 4: put(sfx, arp([523 * 2 ** (i / 6), 784 * 2 ** (i / 6)], 0.06, 0.12, 0.16), a)
        for k in range(2): put(sfx, sweep(400, 1400, 0.5, 0.05), a + 0.35 + k * 0.25)      # bars fill
    rn = noise(int(0.6 * SR)); put(sfx, lp(rn, 0.15) * np.linspace(0, 1, len(rn)) ** 2 * 0.3, 12.67)   # riser
    t = T(0.9); boom = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.3) * 0.8
    put(sfx, boom, 13.27)
    g = noise(int(0.4 * SR)); g = np.repeat(g[::40], 40)[:len(g)] * 0.12; put(sfx, g, 13.27)
    put(sfx, arp([523, 659, 784, 1047, 1319], 0.05, 0.3, 0.26), 13.35)
    put(sfx, boom * 0.7, T_SQUAD); put(sfx, arp([784, 988, 1175, 1568, 1976], 0.06, 0.35, 0.26), T_SQUAD + 0.05)
    for i in range(4): put(sfx, beep(880 + 220 * i, 0.06, 0.13), T_SQUAD + 0.35 + i * 0.1)
    wn = noise(int(0.35 * SR)); put(sfx, (wn - lp(wn, 0.3)) * np.hanning(len(wn)) * 0.3, T_CTA - 0.25)
    put(sfx, boom * 0.6, T_CTA)
    # narration + ducking
    vox = np.zeros(L); duck = np.zeros(L)
    for l in json.load(open(P('lines.json'))):
        with wave.open(P('voices', l['id'] + '.wav')) as w:
            v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        v = v / (np.abs(v).max() + 1e-9) * 0.62
        put(vox, v, l['at']); s0 = int(l['at'] * SR); duck[s0:s0 + len(v)] = 1
    k = int(0.08 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
    sfx = sfx * (1 - 0.35 * duck) + vox
    menv = np.ones(L) * (1 - 0.55 * duck); s, e = int((DUR - 1.0) * SR), int(DUR * SR)
    menv[s:e] *= np.linspace(1, 0, e - s); menv[e:] = 0
    out = np.tanh((mus * 0.75 * menv + sfx) * 1.2) * 0.85
    pcm = (np.clip(np.stack([out, out], 1)[:int(DUR * SR)], -1, 1) * 32767).astype(np.int16)
    os.makedirs(P('out'), exist_ok=True)
    with wave.open(P('out', 'mix.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

# ───────────────────────── render ─────────────────────────
def _render_one(i):
    rng.bit_generator.state = np.random.default_rng(1000 + i).bit_generator.state
    return np.clip(frame(i / FPS), 0, 255).astype(np.uint8).tobytes()

def render():
    os.makedirs(P('out'), exist_ok=True)
    pr = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                           '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                           '-pix_fmt', 'yuv420p', P('out', 'video.mp4')], stdin=subprocess.PIPE)
    from multiprocessing import Pool
    with Pool(os.cpu_count() or 2) as pool:
        for i, buf in enumerate(pool.imap(_render_one, range(N), chunksize=4)):
            pr.stdin.write(buf)
            if i % 90 == 0: print(f'  frame {i}/{N}', flush=True)
    pr.stdin.close(); pr.wait()

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'still':
        os.makedirs(P('out'), exist_ok=True)
        for t in map(float, sys.argv[2:]):
            Image.fromarray(np.clip(frame(t), 0, 255).astype(np.uint8)).save(P('out', f'still_{t:05.2f}.jpg'), quality=88)
        sys.exit()
    print('audio…'); build_audio()
    print('video…'); render()
    final = P('pixel-zone-reel-squad.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', P('out', 'video.mp4'), '-i', P('out', 'mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '4.6', '-i', final, '-frames:v', '1', '-q:v', '2', P('poster.jpg')], check=True)
    print('done →', final)
