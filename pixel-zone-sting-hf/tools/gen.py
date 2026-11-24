#!/usr/bin/env python3
"""Pixel Zone sting "Dois players. Uma conexão." from the 12-frame motion breakdown (assets/img/board.png).

    python3 tools/gen.py intro    # opening: ends on frame 12 (passagem), transparent after the wipe -> reveals the video under it
    python3 tools/gen.py outro    # closing: ends and holds on frame 11 (logo)
Writes index.html + compositions/sting.html. Board timings: 01 0.00 · 02 0.10 · 03 0.20 · 04 0.30 · 05 0.40 · 06 0.50 ·
07 0.60 · 08 0.70 · 09 0.80 · 10 0.95 · 11 1.15 · 12 1.40 (s).
"""
import json, math, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = lambda *a: os.path.join(ROOT, *a)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'intro'
W, H = 1080, 1920
DUR = 1.80 if MODE == 'intro' else 2.70
CY, MG, INK, CREAM, GREY = '#00e5f5', '#ff0a9c', '#070a1c', '#f5f0e6', '#d8d8dc'
INFO = json.load(open(P('assets/img/logo_parts.json')))

# final logo placement: source logo crop scaled by K, wordmark centred on (540, 960)
K = 1.45
tx = (INFO['text']['x0'] + INFO['text']['x1']) / 2; ty = (INFO['text']['y0'] + INFO['text']['y1']) / 2
OX, OY = 540 - tx * K, 960 - ty * K
def slash_geom(name):
    pts = INFO['poly_' + name]; xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, y0 = min(xs), min(ys); w, h = max(xs) - x0, max(ys) - y0
    poly = ', '.join(f'{(px - x0) / w * 100:.2f}% {(py - y0) / h * 100:.2f}%' for px, py in pts)
    return dict(x=OX + x0 * K, y=OY + y0 * K, w=w * K, h=h * K, poly=poly, cx=OX + (x0 + w / 2) * K, cy=OY + (y0 + h / 2) * K)
SC, SM = slash_geom('c'), slash_geom('m')
WM = INFO['wordmark']; WMX, WMY, WMW, WMH = OX + WM['x0'] * K, OY + WM['y0'] * K, WM['w'] * K, WM['h'] * K

def slash_div(id_, g, col, extra=''):
    return (f'<div id="{id_}" style="position:absolute;left:{-g["w"] / 2:.1f}px;top:{-g["h"] / 2:.1f}px;width:{g["w"]:.1f}px;height:{g["h"]:.1f}px;'
            f'background:{col};clip-path:polygon({g["poly"]});{extra}"></div>')

def player(pid, g, col, lines_dir):
    """A slash with speed lines (behind it) and four ghost trails, centred on its wrapper's origin."""
    lines = ''
    for i, (dy, ln, th, op) in enumerate([(-0.30, 2.6, 0.10, 0.9), (-0.08, 3.4, 0.07, 0.8), (0.14, 2.2, 0.12, 0.85), (0.33, 3.0, 0.06, 0.7), (0.45, 1.6, 0.05, 0.6)]):
        Lw = g['w'] * ln
        x = -g['w'] * 0.15 - Lw if lines_dir < 0 else g['w'] * 0.15
        lines += (f'<div class="{pid}-ln" style="position:absolute;left:{x:.1f}px;top:{dy * g["h"] * 1.6 - g["h"] * th / 2:.1f}px;width:{Lw:.1f}px;'
                  f'height:{max(3, g["h"] * th):.1f}px;background:linear-gradient({90 if lines_dir < 0 else 270}deg, transparent, {col});opacity:{op};'
                  f'transform:skewX(-42deg);transform-origin:{"right" if lines_dir < 0 else "left"} center"></div>')
    trails = ''
    for i, op in enumerate([0.55, 0.38, 0.24, 0.12]):
        trails += f'<div class="{pid}-tr" data-i="{i + 1}" style="position:absolute;left:0;top:0;opacity:{op}">{slash_div(f"{pid}-tr{i}", g, col)}</div>'
    return (f'<div id="{pid}" style="position:absolute;left:0;top:0;width:0;height:0">'
            f'<div id="{pid}-lines" style="position:absolute;left:0;top:0;opacity:0">{lines}</div>'
            f'<div id="{pid}-trails" style="position:absolute;left:0;top:0;opacity:0">{trails}</div>'
            f'{slash_div(pid + "-s", g, col)}</div>')

def rays():
    """Burst wedges from the frame edge towards the centre (frames 09-10)."""
    out, cols = [], ['#ffffff', CY, MG, '#ffffff', MG, CY]
    n = 22
    for i in range(n):
        a = (i + 0.5) / n * 2 * math.pi + (0.08 if i % 2 else -0.05)
        r0 = 560 + (i % 3) * 70; r1 = 1500; half = 0.045 + (i % 4) * 0.012
        p = lambda r, ang: (540 + r * math.cos(ang), 960 + r * math.sin(ang))
        tip = p(r0, a); b1 = p(r1, a - half); b2 = p(r1, a + half)
        out.append(f'<polygon points="{tip[0]:.0f},{tip[1]:.0f} {b1[0]:.0f},{b1[1]:.0f} {b2[0]:.0f},{b2[1]:.0f}" fill="{cols[i % len(cols)]}"/>')
    return ''.join(out)

def halftone(id_, col, corner, size=520, op=0.0):
    pos = {'br': f'right:-40px;bottom:-40px', 'tl': f'left:-40px;top:-40px', 'tr': 'right:-40px;top:-40px', 'bl': 'left:-40px;bottom:-40px'}[corner]
    grad = {'br': 'to top left', 'tl': 'to bottom right', 'tr': 'to bottom left', 'bl': 'to top right'}[corner]
    return (f'<div id="{id_}" style="position:absolute;{pos};width:{size}px;height:{size}px;opacity:{op};'
            f'background-image:radial-gradient(circle, {col} 0 5px, transparent 5.5px);background-size:18px 18px;'
            f'-webkit-mask-image:linear-gradient({grad}, #000 0%, transparent 70%);mask-image:linear-gradient({grad}, #000 0%, transparent 70%)"></div>')

def sting():
    # player centre positions per board frame (frame px) and scale relative to the final logo slash
    C = {0.00: (130, 1060, 0.9), 0.10: (640, 900, 3.2), 0.20: (720, 830, 3.0), 0.30: (770, 860, 2.8), 0.40: (520, 1040, 2.6),
         0.50: (390, 770, 1.7), 0.60: (560, 770, 1.6), 0.70: (SC['cx'], SC['cy'] - 70, 1.35)}
    M = {0.00: (880, 740, 0.9), 0.10: (880, 740, 0.9), 0.20: (430, 1090, 2.7), 0.30: (580, 1060, 2.8), 0.40: (760, 830, 3.0),
         0.50: (720, 1150, 1.7), 0.60: (520, 1150, 1.6), 0.70: (SM['cx'], SM['cy'] + 70, 1.35)}
    js = []
    def path(pid, keys):
        ts = sorted(keys)
        x, y, s = keys[ts[0]]
        js.append(f'tl.set("#{pid}", {{x:{x:.1f}, y:{y:.1f}, scale:{s}}}, 0);')
        for a, b in zip(ts, ts[1:]):
            x, y, s = keys[b]
            ease = {0.10: 'power4.in', 0.50: 'power4.out', 0.60: 'power2.inOut', 0.70: 'power3.out'}.get(b, 'none')
            if b in (0.50,):          # hard cut to the dark ground at 0.45: arrive already braking
                js.append(f'tl.set("#{pid}", {{x:{x - (90 if pid == "pc" else -90):.1f}, y:{y:.1f}, scale:{s}}}, 0.45);')
                js.append(f'tl.to("#{pid}", {{x:{x:.1f}, duration:0.05, ease:"power4.out"}}, 0.45);')
            elif pid == 'pm' and b == 0.20:   # M answers from off-screen left
                js.append(f'tl.set("#{pid}", {{x:-260, y:{y + 60:.1f}, scale:{s}}}, {a:.2f});')
                js.append(f'tl.to("#{pid}", {{x:{x:.1f}, y:{y:.1f}, duration:0.10, ease:"power3.out"}}, {a:.2f});')
            else:
                js.append(f'tl.to("#{pid}", {{x:{x:.1f}, y:{y:.1f}, scale:{s}, duration:0.10, ease:"{ease}"}}, {a:.2f});')
    path('pc', C); path('pm', M)
    # speed lines while racing (02-05), trails while braking/returning (06-07)
    js += [f'tl.set("#pc-lines", {{opacity:1}}, 0.04);', f'tl.fromTo("#pc-lines", {{scaleX:0.2}}, {{scaleX:1, duration:0.08, ease:"power2.out"}}, 0.04);',
           f'tl.set("#pm-lines", {{opacity:1}}, 0.12);', f'tl.fromTo("#pm-lines", {{scaleX:0.2}}, {{scaleX:1, duration:0.08, ease:"power2.out"}}, 0.12);',
           'tl.set(["#pc-lines", "#pm-lines"], {opacity:0}, 0.45);',
           'tl.set(["#pc-trails", "#pm-trails"], {opacity:1}, 0.45);', 'tl.set(["#pc-trails", "#pm-trails"], {opacity:0}, 0.66);']
    for pid, sgn in (('pc', -1), ('pm', 1)):
        for i in range(4):
            js.append(f'tl.fromTo("#{pid}-tr{i}", {{x:{sgn * (i + 1) * 60}}}, {{x:{sgn * (i + 1) * 22}, duration:0.20, ease:"power3.out"}}, 0.45);')
    # cream diagonal band (03-05) and halftone corners
    js += ['tl.set("#band", {rotation:-14, scaleY:0}, 0);', 'tl.to("#band", {scaleY:1, duration:0.05, ease:"power3.out"}, 0.10);', 'tl.set("#band", {scaleY:0}, 0.45);',
           'tl.set("#ht-c", {opacity:0.85}, 0);', 'tl.set("#ht-c", {opacity:0}, 0.10);', 'tl.set("#ht-c2", {opacity:0.9}, 0.10);', 'tl.set("#ht-c2", {opacity:0}, 0.45);',
           'tl.set("#ht-m", {opacity:0.9}, 0.20);', 'tl.set("#ht-m", {opacity:0}, 0.45);', 'tl.set("#ht-m2", {opacity:0.85}, 0.45);', 'tl.set("#ht-m2", {opacity:0}, 0.72);',
           'tl.set("#ht-c3", {opacity:0.8}, 0.95);']
    # return arcs (07) and the meeting flare (08)
    js += ['tl.fromTo(["#arc-c", "#arc-m"], {strokeDashoffset:100, opacity:1}, {strokeDashoffset:0, duration:0.12, ease:"power2.out"}, 0.50);',
           'tl.to(["#arc-c", "#arc-m"], {opacity:0, duration:0.06}, 0.64);',
           'tl.fromTo("#flare", {scaleX:0, opacity:1}, {scaleX:1, opacity:1, duration:0.07, ease:"power3.out"}, 0.62);',
           'tl.to("#flare", {scaleX:0.3, opacity:0, duration:0.05, ease:"power2.in"}, 0.70);']
    # impact (09): players become the logo; huge cropped wordmark, rays, flash, shake
    js += ['tl.set(["#pc", "#pm"], {opacity:0}, 0.72);',
           'tl.set("#logo", {opacity:1}, 0.72);',
           'tl.fromTo("#logo", {scale:2.9}, {scale:2.25, duration:0.08, ease:"expo.out"}, 0.72);',
           'tl.to("#logo", {scale:1, duration:0.16, ease:"expo.out"}, 0.80);',
           'tl.fromTo("#rays", {scale:1.35, opacity:1}, {scale:1, opacity:1, duration:0.10, ease:"expo.out"}, 0.72);',
           'tl.to("#rays", {scale:1.7, opacity:0, duration:0.22, ease:"power2.in"}, 0.93);',
           'tl.fromTo("#flash", {opacity:0.75}, {opacity:0, duration:0.10, ease:"power2.out"}, 0.72);']
    for k, (dx, dy) in enumerate([(-14, 9), (12, -10), (-8, 6), (6, -4), (-3, 2), (0, 0)]):
        js.append(f'tl.set("#shake", {{x:{dx}, y:{dy}}}, {0.72 + k * 0.022:.3f});')
    # the slashes inside the logo settle last (follow-through)
    js += ['tl.fromTo("#lg-c", {y:-26}, {y:0, duration:0.20, ease:"back.out(2.2)"}, 0.95);',
           'tl.fromTo("#lg-m", {y:26}, {y:0, duration:0.20, ease:"back.out(2.2)"}, 0.95);']
    passage = ''
    if MODE == 'intro':
        # 12 · passagem: a light panel with a cyan and a magenta corner sweeps across; the ground goes transparent behind it
        js += ['tl.set("#pass", {x:1500}, 0);', 'tl.to("#pass", {x:0, duration:0.14, ease:"power3.in"}, 1.40);',
               'tl.set(["#ground", "#shake"], {opacity:0}, 1.54);',
               'tl.to("#pass", {x:-1700, duration:0.20, ease:"power3.out"}, 1.56);']
        passage = (f'<div id="pass" style="position:absolute;left:-300px;top:-200px;width:1680px;height:2320px">'
                   f'<div style="position:absolute;inset:0;background:{GREY};clip-path:polygon(18% 0,100% 0,82% 100%,0 100%)"></div>'
                   f'<div style="position:absolute;left:18%;top:0;width:520px;height:620px;background:{CY};clip-path:polygon(0 0,100% 0,0 100%)"></div>'
                   f'<div style="position:absolute;right:18%;bottom:0;width:520px;height:620px;background:{MG};clip-path:polygon(100% 0,100% 100%,0 100%)"></div></div>')
    logo = (f'<div id="logo" style="position:absolute;left:0;top:0;width:{W}px;height:{H}px;opacity:0;transform-origin:540px 960px">'
            f'<img src="assets/img/wordmark.png" style="position:absolute;left:{WMX:.1f}px;top:{WMY:.1f}px;width:{WMW:.1f}px;height:{WMH:.1f}px">'
            f'<div id="lg-c" style="position:absolute;left:{SC["cx"]:.1f}px;top:{SC["cy"]:.1f}px">{slash_div("lg-c-s", SC, CY)}</div>'
            f'<div id="lg-m" style="position:absolute;left:{SM["cx"]:.1f}px;top:{SM["cy"]:.1f}px">{slash_div("lg-m-s", SM, MG)}</div></div>')
    html = f'''<template>
  <style>
    #root {{ position:absolute; inset:0; overflow:hidden; }}
  </style>
  <div id="root" data-composition-id="sting" data-width="{W}" data-height="{H}" data-layout-allow-overlap data-layout-allow-overflow>
    <div id="ground" style="position:absolute;inset:0;background:{INK}"></div>
    <div id="shake" style="position:absolute;inset:0">
      {halftone('ht-c', CY, 'br', 560)}{halftone('ht-c2', CY, 'tl', 520)}{halftone('ht-m', MG, 'br', 560)}{halftone('ht-m2', MG, 'bl', 600)}{halftone('ht-c3', CY, 'tr', 460)}
      <div id="band" style="position:absolute;left:-400px;top:560px;width:1880px;height:820px;background:{CREAM};"></div>
      <svg width="{W}" height="{H}" style="position:absolute;left:0;top:0;overflow:visible">
        <path id="arc-c" d="M 60 640 Q 420 560 760 700" fill="none" stroke="{CY}" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="100" opacity="0"/>
        <path id="arc-m" d="M 1020 1080 Q 900 1300 520 1250" fill="none" stroke="{MG}" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="100" opacity="0"/>
      </svg>
      <div id="flare" style="position:absolute;left:140px;top:955px;width:800px;height:10px;border-radius:5px;opacity:0;
           background:radial-gradient(ellipse at center, #fff 0 30%, rgba(255,255,255,0.6) 55%, transparent 75%);box-shadow:0 0 26px 6px rgba(255,255,255,0.55)"></div>
      <svg id="rays" width="{W}" height="{H}" style="position:absolute;left:0;top:0;opacity:0;transform-origin:540px 960px;overflow:visible">{rays()}</svg>
      {player('pc', SC, CY, -1)}
      {player('pm', SM, MG, -1)}
      {logo}
      <div id="flash" style="position:absolute;inset:0;background:#fff;opacity:0"></div>
    </div>
    {passage}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.set("#rays", {{opacity:0}}, 0);
    {chr(10).join('    ' + re.sub(r'^(tl\.fromTo\([^{]*\{[^}]*\}, \{)', r'\1immediateRender:false, ', j) for j in js)}
    tl.set({{}}, {{}}, {DUR - 0.001:.3f});
    window.__timelines["sting"] = tl;
  </script>
</template>'''
    os.makedirs(P('compositions'), exist_ok=True); open(P('compositions/sting.html'), 'w').write(html)

def root():
    pk = json.load(open(P('assets/sfx/peaks.json')))
    hits = [('wh1', 0.10, 0.7), ('wh2', 0.20, 0.6), ('flick', 0.40, 0.6), ('brake', 0.50, 0.55), ('swish', 0.62, 0.5),
            ('snatch', 0.72, 0.45), ('impact', 0.72, 0.95), ('sub', 0.72, 0.8)]
    if MODE == 'intro': hits.append(('pass', 1.47, 0.7))
    audio, lanes = [], []
    for n, (f, ev, vol) in enumerate(hits):
        st = max(0.0, ev + 1 / 60 - pk[f]['peak']); dur = min(pk[f]['dur'], DUR - st)
        ln = next((i for i, e in enumerate(lanes) if e <= st), None)
        if ln is None: lanes.append(st + dur); ln = len(lanes) - 1
        else: lanes[ln] = st + dur
        audio.append(f'<audio id="sfx{n}" class="clip" src="assets/sfx/{f}.wav" data-start="{st:.3f}" data-duration="{dur:.3f}" data-volume="{vol}" '
                     f'data-fade-out="{0.25 if f == "impact" else 0.02}" data-track-index="{10 + ln}" data-audio-group="sfx"></audio>')
    bg = 'transparent' if MODE == 'intro' else INK
    html = f'''<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      html, body {{ width:{W}px; height:{H}px; overflow:hidden; background:{bg}; }}
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
    sting(); root(); print('mode', MODE, 'duration', DUR)
