#!/usr/bin/env python3
"""ANIMATIC · Pixel Zone · "Dois players. Uma conexão." (provocação -> disputa -> conexão)

    python3 tools/animatic.py intro    # abertura: sobre o início do Reel; o espaço entre os traços revela o vídeo
    python3 tools/animatic.py outro    # encerramento: os traços recolhem o fim do vídeo e fixam a logo

Board (owner's 6 frames): 01 provocação 0.00 · 02 resposta 0.25 · 03 disputa 0.50 · 04 conexão 0.75 · 05 identidade 1.05 ·
06 passagem 1.35. Sound: cyan signal, magenta signal, one confirmation on the fit.
"""
import json, math, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = lambda *a: os.path.join(ROOT, *a)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'intro'
W, H = 1080, 1920
CY, MG, INK, WHITE = '#00e5f5', '#ff0a9c', '#04050c', '#f7f5f0'
STING_END = 1.62 if MODE == 'intro' else 2.45
DUR = {'intro': 4.60, 'outro': 2.45, 'logo': 2.40}[MODE]
INFO = json.load(open(P('assets/img/logo_parts.json')))

# brand diagonal (the slash slant, ~47 deg rising to the right) and its normal
ANG = math.atan2(58, 54)
U = (math.cos(ANG), -math.sin(ANG)); N = (math.sin(ANG), math.cos(ANG))
O = (540.0, 960.0)
def pt(base, a=0.0, b=0.0): return (base[0] + U[0] * a + N[0] * b, base[1] + U[1] * a + N[1] * b)
def band(center, half, length=3200, start=None):
    """Polygon (px) of a band along U. With start: from that point forward by `length`; else centred."""
    if start is None: a0, a1, c = -length / 2, length / 2, center
    else: a0, a1, c = 0, length, start
    pts = [pt(c, a0, -half), pt(c, a1, -half), pt(c, a1, half), pt(c, a0, half)]
    return 'polygon(' + ', '.join(f'{x:.1f}px {y:.1f}px' for x, y in pts) + ')'
def halfplane(edge_offset):
    """Everything on the -N side of a line along U through O + N*edge_offset."""
    c = pt(O, 0, edge_offset)
    pts = [pt(c, -3000, 0), pt(c, 3000, 0), pt(c, 3000, -4000), pt(c, -3000, -4000)]
    return 'polygon(' + ', '.join(f'{x:.1f}px {y:.1f}px' for x, y in pts) + ')'
def para(center, w, h):
    """A brand-slant parallelogram (like the slashes) centred on `center`."""
    sk = h * 54 / 58 / 2
    cx, cy = center
    pts = [(cx - w / 2 - sk, cy + h / 2), (cx - w / 2 + sk, cy - h / 2), (cx + w / 2 + sk, cy - h / 2), (cx + w / 2 - sk, cy + h / 2)]
    return 'polygon(' + ', '.join(f'{x:.1f}px {y:.1f}px' for x, y in pts) + ')'

# logo geometry (final identity frame): source crop scaled by K, wordmark centred on O
K = 1.45
tx = (INFO['text']['x0'] + INFO['text']['x1']) / 2; ty = (INFO['text']['y0'] + INFO['text']['y1']) / 2
OX, OY = O[0] - tx * K, O[1] - ty * K
def slash_geom(name):
    pts = INFO['poly_' + name]; xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, y0 = min(xs), min(ys); w, h = max(xs) - x0, max(ys) - y0
    poly = ', '.join(f'{(px - x0) / w * 100:.2f}% {(py - y0) / h * 100:.2f}%' for px, py in pts)
    return dict(w=w * K, h=h * K, poly=poly, cx=OX + (x0 + w / 2) * K, cy=OY + (y0 + h / 2) * K)
SC, SM = slash_geom('c'), slash_geom('m')
WM = INFO['wordmark']; WMX, WMY, WMW, WMH = OX + WM['x0'] * K, OY + WM['y0'] * K, WM['w'] * K, WM['h'] * K
FIT = 2.2   # scale of the logo group at the moment of the fit
CF = (O[0] + (SC['cx'] - O[0]) * FIT, O[1] + (SC['cy'] - O[1]) * FIT)
MF = (O[0] + (SM['cx'] - O[0]) * FIT, O[1] + (SM['cy'] - O[1]) * FIT)

def slash(id_, g, col, extra=''):
    return (f'<div id="{id_}" style="position:absolute;left:{-g["w"] / 2:.1f}px;top:{-g["h"] / 2:.1f}px;width:{g["w"]:.1f}px;height:{g["h"]:.1f}px;'
            f'background:{col};clip-path:polygon({g["poly"]});{extra}"></div>')

def player(pid, g, col):
    deg = -math.degrees(ANG)
    lines = ''.join(
        f'<div style="position:absolute;left:{-g["w"] * (0.4 + ln):.1f}px;top:{dy * g["h"]:.1f}px;width:{g["w"] * ln:.1f}px;height:{max(3, g["h"] * th):.1f}px;'
        f'background:linear-gradient(90deg, transparent, {col});opacity:{op}"></div>'
        for dy, ln, th, op in [(-0.34, 2.8, 0.09, 0.9), (-0.12, 3.6, 0.06, 0.8), (0.10, 2.4, 0.11, 0.85), (0.30, 3.2, 0.05, 0.7)])
    return (f'<div id="{pid}" style="position:absolute;left:0;top:0;width:0;height:0;opacity:0">'
            f'<div id="{pid}-lines" style="position:absolute;left:0;top:0;opacity:0"><div id="{pid}-rot" style="position:absolute;left:0;top:0">{lines}</div></div>'
            f'{slash(pid + "-s", g, col)}</div>')

def ghosts(pid, g, col):
    return ''.join(f'<div id="{pid}-g{i}" style="position:absolute;left:0;top:0;width:0;height:0;opacity:0">{slash(f"{pid}-g{i}s", g, col)}</div>' for i in range(3))

def dots(id_, col, x, y, size):
    return (f'<div id="{id_}" style="position:absolute;left:{x}px;top:{y}px;width:{size}px;height:{size}px;opacity:0;'
            f'background-image:radial-gradient(circle, {col} 0 5px, transparent 5.6px);background-size:18px 18px;'
            f'-webkit-mask-image:radial-gradient(circle at center, #000 0%, transparent 70%);mask-image:radial-gradient(circle at center, #000 0%, transparent 70%)"></div>')

def pixels():
    out, cols = [], [CY, MG, WHITE, CY, MG]
    for i in range(26):
        a = i / 26 * 2 * math.pi + (i % 3) * 0.13
        s = 16 + (i % 4) * 8
        out.append((f'px{i}', math.cos(a), math.sin(a), s, cols[i % len(cols)], 380 + (i % 5) * 90))
    html = ''.join(f'<div id="{n}" style="position:absolute;left:{O[0] - s / 2:.0f}px;top:{O[1] - s / 2:.0f}px;width:{s}px;height:{s}px;background:{c};opacity:0"></div>'
                   for n, _, _, s, c, _ in out)
    return html, out

def rays():
    out, cols = [], ['#ffffff', CY, MG, '#ffffff', MG, CY]
    n = 22
    for i in range(n):
        a = (i + 0.5) / n * 2 * math.pi + (0.08 if i % 2 else -0.05)
        r0 = 560 + (i % 3) * 70; r1 = 1500; half = 0.045 + (i % 4) * 0.012
        p = lambda r, ang: (O[0] + r * math.cos(ang), O[1] + r * math.sin(ang))
        tip = p(r0, a); b1 = p(r1, a - half); b2 = p(r1, a + half)
        out.append(f'<polygon points="{tip[0]:.0f},{tip[1]:.0f} {b1[0]:.0f},{b1[1]:.0f} {b2[0]:.0f},{b2[1]:.0f}" fill="{cols[i % len(cols)]}"/>')
    return ''.join(out)

def build():
    js = []
    J = js.append
    # ── players path ───────────────────────────────────────────────────────────
    C0 = pt((700, 820), -1500, 0)                      # cyan comes from far bottom-left along the diagonal
    C1 = (700, 820)                                    # 01 cyan parks: the dare
    M_glint = (930, 470)                               # magenta's late glint, top right
    M0 = pt((560, 1070), -1500, 0)
    M1 = (560, 1070)                                   # 02 magenta has caught up, beside/below
    C2, M2 = pt(C1, 70, 0), pt(M1, 70, 0)              # racing glide
    C3, M3 = (590, 1060), (790, 780)                   # swap 1: magenta ahead
    C4, M4 = (800, 770), (570, 1070)                   # swap 2: cyan back ahead
    J(f'tl.set("#pc", {{x:{C0[0]:.0f}, y:{C0[1]:.0f}, scale:3.4, opacity:1}}, 0);')
    J(f'tl.to("#pc", {{x:{C1[0]}, y:{C1[1]}, duration:0.13, ease:"expo.out"}}, 0.0);')           # quick cut across
    J('tl.set("#pc-lines", {opacity:1}, 0);'); J('tl.to("#pc-lines", {opacity:0, duration:0.06}, 0.12);')
    J(f'tl.set("#pm", {{x:{M_glint[0]}, y:{M_glint[1]}, scale:0.9, opacity:1}}, 0.09);')
    J('tl.fromTo("#pm-s", {scaleX:0.2}, {scaleX:1, duration:0.06, ease:"power3.out"}, 0.09);')
    J(f'tl.set("#pm", {{x:{M0[0]:.0f}, y:{M0[1]:.0f}, scale:3.2}}, 0.16);')                         # warps behind
    J(f'tl.to("#pm", {{x:{M1[0]}, y:{M1[1]}, duration:0.15, ease:"power2.in"}}, 0.16);')           # late, accelerating
    J('tl.set("#pm-lines", {opacity:1}, 0.16);'); J('tl.to("#pm-lines", {opacity:0, duration:0.08}, 0.32);')
    J(f'tl.to("#pc", {{x:{C2[0]:.0f}, y:{C2[1]:.0f}, duration:0.12, ease:"none"}}, 0.31);')
    J(f'tl.to("#pm", {{x:{M2[0]:.0f}, y:{M2[1]:.0f}, duration:0.12, ease:"none"}}, 0.31);')
    for t, (cc, mm), (cprev, mprev) in ((0.45, (C3, M3), (C2, M2)), (0.57, (C4, M4), (C3, M3))):   # two dry swaps
        J(f'tl.to("#pc", {{x:{cc[0]}, y:{cc[1]}, duration:0.045, ease:"power4.out"}}, {t});')
        J(f'tl.to("#pm", {{x:{mm[0]}, y:{mm[1]}, duration:0.045, ease:"power4.out"}}, {t});')
        for pid, a, b in (('pc', cprev, cc), ('pm', mprev, mm)):
            for i, f in enumerate((0.25, 0.5, 0.75)):
                gx, gy = a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
                J(f'tl.set("#{pid}-g{i}", {{x:{gx:.0f}, y:{gy:.0f}, scale:{3.4 if pid == "pc" else 3.2}, opacity:{0.18 + 0.18 * i:.2f}}}, {t + 0.02:.3f});')
                J(f'tl.to("#{pid}-g{i}", {{opacity:0, duration:0.09, ease:"power2.out"}}, {t + 0.045:.3f});')
    # the fit: both slide onto the brand diagonal and lock in at 0.75
    J(f'tl.to("#pc", {{x:{CF[0]:.1f}, y:{CF[1]:.1f}, scale:{FIT}, duration:0.08, ease:"power3.in"}}, 0.67);')
    J(f'tl.to("#pm", {{x:{MF[0]:.1f}, y:{MF[1]:.1f}, scale:{FIT}, duration:0.08, ease:"power3.in"}}, 0.67);')
    J('tl.set(["#pc", "#pm"], {opacity:0}, 0.88);')
    # ── camera: quick push-ins on the swaps, reset on the fit ───────────────────
    J('tl.set("#cam", {scale:1, transformOrigin:"540px 960px"}, 0);')
    J('tl.to("#cam", {scale:1.05, duration:0.05, ease:"power3.out"}, 0.13);')
    J('tl.to("#cam", {scale:1.10, duration:0.05, ease:"power3.out"}, 0.45);')
    J('tl.to("#cam", {scale:1.16, duration:0.05, ease:"power3.out"}, 0.57);')
    J('tl.to("#cam", {scale:1, duration:0.06, ease:"power3.in"}, 0.69);')
    # ── the ground: video, then cuts in black, white, cyan, magenta ─────────────
    J(f'tl.fromTo("#cut-black1", {{clipPath:"{band(None, 190, 1, C0)}"}}, {{clipPath:"{band(None, 190, 3400, C0)}", duration:0.13, ease:"expo.out"}}, 0.0);')
    J(f'tl.fromTo("#cut-white", {{clipPath:"{band(None, 230, 1, M0)}"}}, {{clipPath:"{band(None, 230, 3400, M0)}", duration:0.15, ease:"power2.in"}}, 0.16);')
    J(f'tl.fromTo("#cut-black2", {{clipPath:"{halfplane(-1400)}"}}, {{clipPath:"{halfplane(330)}", duration:0.06, ease:"power3.out"}}, 0.40);')
    J(f'tl.fromTo("#cut-magenta", {{clipPath:"{band((0, 0), 26, 1, pt(O, -1700, 430))}"}}, {{clipPath:"{band((0, 0), 26, 3400, pt(O, -1700, 430))}", duration:0.05, ease:"power3.out"}}, 0.45);')
    J('tl.set("#cut-black3", {opacity:1}, 0.57);')
    J(f'tl.fromTo("#cut-black3", {{clipPath:"{halfplane(330)}"}}, {{clipPath:"{halfplane(2200)}", duration:0.06, ease:"power3.out"}}, 0.57);')
    J(f'tl.fromTo("#cut-cyan", {{clipPath:"{band((0, 0), 20, 1, pt(O, -1700, -520))}"}}, {{clipPath:"{band((0, 0), 20, 3400, pt(O, -1700, -520))}", duration:0.05, ease:"power3.out"}}, 0.57);')
    J('tl.to(["#cut-cyan", "#cut-magenta"], {opacity:0, duration:0.04}, 0.69);')
    # texture only on acceleration and impact
    J('tl.fromTo("#dt-c", {opacity:0.95}, {opacity:0, duration:0.14, ease:"power2.in"}, 0.0);')
    J('tl.fromTo("#dt-m", {opacity:0.95}, {opacity:0, duration:0.16, ease:"power2.in"}, 0.17);')
    # ── the fit: white expansion, then the reveal mask opens onto the name ──────
    J('tl.set("#expand", {opacity:1}, 0.75);'); J('tl.set("#reveal", {opacity:1}, 0.80);')
    J(f'tl.fromTo("#expand", {{clipPath:"{para(O, 30, 30)}"}}, {{clipPath:"{para(O, 3200, 3400)}", duration:0.07, ease:"expo.in"}}, 0.75);')
    J('tl.set("#expand", {opacity:0}, 0.92);')
    J(f'tl.fromTo("#reveal", {{clipPath:"{para(O, 20, 20)}"}}, {{clipPath:"{para(O, 3200, 3400)}", duration:0.09, ease:"expo.in"}}, 0.80);')
    J(f'tl.set("#logo", {{scale:{FIT}, transformOrigin:"540px 960px"}}, 0);')
    J('tl.to("#logo", {scale:1, duration:0.2, ease:"expo.out"}, 0.88);')
    J('tl.fromTo("#rays", {scale:1.35, opacity:1}, {scale:1, opacity:1, duration:0.12, ease:"expo.out"}, 0.80);')
    J('tl.to("#rays", {scale:1.7, opacity:0, duration:0.22, ease:"power2.in"}, 0.95);')
    J('tl.fromTo(["#dt-i1", "#dt-i2"], {opacity:0.95}, {opacity:0, duration:0.30, ease:"power2.in"}, 0.80);')
    _, pxs = pixels()
    for n, dx, dy, s, c, r in pxs:
        J(f'tl.fromTo("#{n}", {{x:0, y:0, opacity:1}}, {{x:{dx * r:.0f}, y:{dy * r:.0f}, opacity:0, duration:0.26, ease:"expo.out"}}, 0.76);')
    J('tl.fromTo("#wedge-c", {x:-500, y:-500}, {x:0, y:0, duration:0.16, ease:"expo.out"}, 0.92);')
    J('tl.fromTo("#wedge-m", {x:500, y:500}, {x:0, y:0, duration:0.16, ease:"expo.out"}, 0.92);')
    for k, (dx, dy) in enumerate([(-12, 8), (10, -9), (-6, 5), (4, -3), (0, 0)]):
        J(f'tl.set("#shake", {{x:{dx}, y:{dy}}}, {0.80 + k * 0.022:.3f});')
    # ── passage ─────────────────────────────────────────────────────────────────
    if MODE == 'intro':
        # the space between the strokes opens onto the video; the strokes become its edges and leave
        J(f'tl.fromTo("#open", {{clipPath:"{band(O, 1)}"}}, {{clipPath:"{band(O, 1700)}", duration:0.24, ease:"power2.inOut"}}, 1.35);')
        J(f'tl.set(["#lg-c", "#lg-m"], {{opacity:0}}, 1.35);')
        J(f'tl.set("#tc", {{x:{SC["cx"]:.1f}, y:{SC["cy"]:.1f}}}, 0);'); J(f'tl.set("#tm", {{x:{SM["cx"]:.1f}, y:{SM["cy"]:.1f}}}, 0);')
        J(f'tl.set(["#tc", "#tm"], {{opacity:1}}, 1.35);')
        J(f'tl.to("#tc", {{x:{SC["cx"] - N[0] * 1300:.0f}, y:{SC["cy"] - N[1] * 1300:.0f}, scale:5, duration:0.26, ease:"power3.in"}}, 1.35);')
        J(f'tl.to("#tm", {{x:{SM["cx"] + N[0] * 1300:.0f}, y:{SM["cy"] + N[1] * 1300:.0f}, scale:5, duration:0.26, ease:"power3.in"}}, 1.35);')
        J('tl.to("#wedge-c", {x:-600, y:-600, duration:0.2, ease:"power3.in"}, 1.38);')
        J('tl.to("#wedge-m", {x:600, y:600, duration:0.2, ease:"power3.in"}, 1.38);')
    js_text = '\n    '.join(re.sub(r'^(tl\.fromTo\([^{]*\{[^}]*\}, \{)', r'\1immediateRender:false, ', j) for j in js)

    # ── markup ──────────────────────────────────────────────────────────────────
    if MODE == 'intro':
        plate_in = '<img id="plate-in" src="assets/plates/squad_first.png" style="position:absolute;left:0;top:0;width:1080px;height:1920px">'
        plate_out = (f'<div id="open" style="position:absolute;inset:0;clip-path:{band(O, 1)}">'
                     f'<video id="plate-out" class="clip" src="assets/plates/squad.mp4" data-start="1.35" data-duration="{DUR - 1.35:.2f}" data-media-start="0" '
                     f'data-has-audio="true" playsinline style="position:absolute;left:0;top:0;width:1080px;height:1920px"></video></div>')
        travellers = (f'<div id="tc" style="position:absolute;left:0;top:0;width:0;height:0;opacity:0">{slash("tc-s", SC, CY)}</div>'
                      f'<div id="tm" style="position:absolute;left:0;top:0;width:0;height:0;opacity:0">{slash("tm-s", SM, MG)}</div>')
    elif MODE == 'logo':
        plate_in = plate_out = travellers = ''          # the logo on its own: no video under it
    else:
        plate_in = ('<video id="plate-in" class="clip" src="assets/plates/tutorial.mp4" data-start="0" data-duration="0.80" data-media-start="27.45" muted playsinline '
                    'style="position:absolute;left:0;top:0;width:1080px;height:1920px"></video>')
        plate_out = travellers = ''
    pxhtml, _ = pixels()
    logo = (f'<div id="logo" style="position:absolute;left:0;top:0;width:{W}px;height:{H}px">'
            f'<img src="assets/img/wordmark.png" style="position:absolute;left:{WMX:.1f}px;top:{WMY:.1f}px;width:{WMW:.1f}px;height:{WMH:.1f}px">'
            f'<div id="lg-c" style="position:absolute;left:{SC["cx"]:.1f}px;top:{SC["cy"]:.1f}px">{slash("lg-c-s", SC, CY)}</div>'
            f'<div id="lg-m" style="position:absolute;left:{SM["cx"]:.1f}px;top:{SM["cy"]:.1f}px">{slash("lg-m-s", SM, MG)}</div></div>')
    html = f'''<template>
  <style>
    #root {{ position:absolute; inset:0; overflow:hidden; }}
    .full {{ position:absolute; inset:0; }}
  </style>
  <div id="root" data-composition-id="sting" data-width="{W}" data-height="{H}" data-layout-allow-overlap data-layout-allow-overflow data-layout-allow-occlusion>
    <div id="shake" class="full">
      <div id="cam" class="full">
        {plate_in}
        <div id="cut-black1" class="full" style="background:{INK};clip-path:{band(None, 190, 1, C0)}"></div>
        <div id="cut-white" class="full" style="background:{WHITE};clip-path:{band(None, 230, 1, M0)}"></div>
        <div id="cut-black2" class="full" style="background:{INK};clip-path:{halfplane(-1400)}"></div>
        <div id="cut-magenta" class="full" style="background:{MG};clip-path:{band((0, 0), 26, 1, pt(O, -1700, 430))}"></div>
        <div id="cut-black3" class="full" style="background:{INK};opacity:0;clip-path:{halfplane(330)}"></div>
        <div id="cut-cyan" class="full" style="background:{CY};clip-path:{band((0, 0), 20, 1, pt(O, -1700, -520))}"></div>
        {dots('dt-c', CY, -80, 1200, 640)}{dots('dt-m', MG, -60, 1330, 620)}
        {ghosts('pc', SC, CY)}{ghosts('pm', SM, MG)}
        {player('pc', SC, CY)}
        {player('pm', SM, MG)}
      </div>
      <div id="expand" class="full" style="background:{WHITE};opacity:0;clip-path:{para(O, 30, 30)}"></div>
      <div id="reveal" class="full" style="opacity:0;clip-path:{para(O, 20, 20)}">
        <div class="full" style="background:{INK}"></div>
        <svg id="rays" width="{W}" height="{H}" style="position:absolute;left:0;top:0;opacity:0;overflow:visible">{rays()}</svg>
        {dots('dt-i1', CY, 640, -60, 520)}{dots('dt-i2', MG, -80, 1460, 560)}
        <div id="wedge-c" style="position:absolute;left:0;top:0;width:430px;height:430px;background:{CY};clip-path:polygon(0 0,100% 0,0 100%)"></div>
        <div id="wedge-m" style="position:absolute;right:0;bottom:0;width:430px;height:430px;background:{MG};clip-path:polygon(100% 0,100% 100%,0 100%)"></div>
        {logo}
        {pxhtml}
      </div>
    </div>
    {plate_out}
    {travellers}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.set("#rays", {{opacity:0}}, 0);
    {js_text}
    tl.set({{}}, {{}}, {DUR - 0.001:.3f});
    window.__timelines["sting"] = tl;
  </script>
</template>'''
    # the player rotation for speed lines: set once (no CSS transform on tweened nodes)
    html = html.replace('tl.set("#rays", {opacity:0}, 0);', f'tl.set("#rays", {{opacity:0}}, 0); tl.set(["#pc-rot", "#pm-rot"], {{rotation:{-math.degrees(ANG):.1f}}}, 0);')
    os.makedirs(P('compositions'), exist_ok=True); open(P('compositions/sting.html'), 'w').write(html)

def root():
    pk = json.load(open(P('assets/sfx/peaks.json')))
    hits = [('cy_sig', 0.04, 0.75), ('mg_sig', 0.24, 0.75), ('cy_snap', 0.57, 0.55), ('mg_snap', 0.45, 0.55),
            ('success_fifth', 0.75, 0.85), ('confirm_hit', 0.75, 0.8), ('confirm_sub', 0.75, 0.7)]
    if MODE == 'intro': hits.append(('pass2', 1.47, 0.5))
    audio, lanes = [], []
    for n, (f, ev, vol) in enumerate(hits):
        st = max(0.0, ev + 1 / 60 - pk[f]['peak']); dur = min(pk[f]['dur'], DUR - st)
        ln = next((i for i, e in enumerate(lanes) if e <= st), None)
        if ln is None: lanes.append(st + dur); ln = len(lanes) - 1
        else: lanes[ln] = st + dur
        audio.append(f'<audio id="sfx{n}" class="clip" src="assets/sfx/{f}.wav" data-start="{st:.3f}" data-duration="{dur:.3f}" data-volume="{vol}" '
                     f'data-track-index="{10 + ln}" data-audio-group="sfx"></audio>')
    html = f'''<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      html, body {{ width:{W}px; height:{H}px; overflow:hidden; background:{INK}; }}
      #root {{ position:relative; width:100%; height:100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}" data-fps="60">
      <div id="sting" data-composition-id="sting" data-composition-src="compositions/sting.html" data-start="0" data-duration="{DUR}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}"></div>
      {(chr(10) + '      ').join(audio)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>'''
    open(P('index.html'), 'w').write(html)

if __name__ == '__main__':
    build(); root(); print('animatic', MODE, 'dur', DUR)
