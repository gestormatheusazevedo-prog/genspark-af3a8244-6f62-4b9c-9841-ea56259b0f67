#!/usr/bin/env python3
"""Writes index.html and compositions/*.html for the HyperFrames "Qual é o seu squad?" Reel.
Timing comes from the narration (assets/voice, assets/words.json) and assets/sfx/peaks.json.
Run from the project root:  python3 tools/gen.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
W, H, DUR, FPS = 1080, 1920, 24.0, 30
CY, MG, PU, GD = '#28e6ff', '#ff2dc8', '#a05aff', '#ffc428'

VOICE = {'v0': 0.20, 'v1': 3.15, 'v2': 6.05, 'v3': 8.05, 'v4': 10.60, 'v5': 13.55, 'v6': 17.25, 'v7': 21.00}
# scenes: id, start, end
SCENES = [('hook', 0.0, 3.05), ('p1', 3.05, 5.95), ('p2', 5.95, 7.95), ('p3', 7.95, 10.50), ('p4', 10.50, 13.40),
          ('sec', 13.40, 17.10), ('squad', 17.10, 20.85), ('cta', 20.85, DUR)]
SEL = {s: a for s, a, _ in SCENES}
UNLOCK = 13.40
OV0, OV1 = 2.20, 17.60          # slots overlay window
CHARS = [
    dict(id='p1', col=CY, n='PLAYER 1', name='O CULPA-O-COMANDO', prop='pad', stats=[('DESCULPAS', 99), ('HABILIDADE', 12)]),
    dict(id='p2', col=MG, n='PLAYER 2', name='PRIMEIRO OU NADA', prop='crown', stats=[('EGO', 99), ('PACIÊNCIA', 3)]),
    dict(id='p3', col=PU, n='PLAYER 3', name='O “SÓ MAIS UMA”', prop='clock', stats=[('PARTIDAS', 99), ('HORA DE IR', 0)], timer=True),
    dict(id='p4', col=GD, n='PLAYER 4', name='O DOS SNACKS', prop='snack', stats=[('GENEROSIDADE', 99), ('RARIDADE', 100)], badge='LENDÁRIO'),
    dict(id='sec', col=PU, n='PERSONAGEM SECRETO', name='LAGZILLA', prop='lag', stats=[('CULPA O LAG', 99), ('DERROTAS ADMITIDAS', 0)], badge='SECRETO'),
]
SLOT_W, SLOT_H, SLOT_Y, GAP = 168, 175, 925, 15
SLOT_X = [90 + i * (SLOT_W + GAP) for i in range(5)]
CARD = dict(x=90, y=390, w=900, h=510)

FONTS = """
@font-face { font-family: 'BarlowX'; src: url('assets/fonts/BarlowCondensed-ExtraBoldItalic.ttf') format('truetype'); font-weight: 800; }
@font-face { font-family: 'BarlowB'; src: url('assets/fonts/BarlowCondensed-BoldItalic.ttf') format('truetype'); font-weight: 700; }
"""
CHAMF = lambda c: f"polygon({c}px 0, 100% 0, 100% calc(100% - {c}px), calc(100% - {c}px) 100%, 0 100%, 0 {c}px)"

def avatar_svg(col, size, extra=''):
    return f'''<svg viewBox="0 0 200 200" width="{size}" height="{size}" style="overflow:visible;filter:drop-shadow(0 0 9px {col})">
  <circle cx="100" cy="62" r="40" fill="none" stroke="{col}" stroke-width="10"/>
  <path d="M28 178 C28 120 172 120 172 178 Z" fill="none" stroke="{col}" stroke-width="10" stroke-linejoin="round"/>{extra}
</svg>'''

def prop_svg(kind, col):
    s = f'fill="none" stroke="{col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"'
    t = lambda x, y, txt, c, sz: f'<text x="{x}" y="{y}" fill="{c}" font-family="BarlowX" font-size="{sz}" text-anchor="middle">{txt}</text>'
    body = {
        'pad': f'<rect x="10" y="40" width="160" height="84" rx="42" {s}/><path d="M48 70v24M36 82h24" {s}/><circle cx="122" cy="76" r="6" fill="{col}"/><circle cx="140" cy="92" r="6" fill="{col}"/>' + t(178, 44, '!', MG, 70),
        'crown': f'<path d="M14 120 L14 46 L56 86 L90 26 L124 86 L166 46 L166 120 Z" {s}/>' + t(90, 172, '#1', '#fff', 52),
        'clock': f'<circle cx="88" cy="88" r="66" {s}/><path d="M88 88 V46 M88 88 L118 98" {s}/>' + t(170, 40, '+1', MG, 56),
        'snack': f'<path d="M30 20 H150 L166 160 H14 Z" {s}/><path d="M40 20 l8 -14 M70 20 l8 -14 M100 20 l8 -14 M130 20 l8 -14" {s}/>' + t(90, 108, 'SNACK', col, 40),
    }[kind]
    return f'<svg viewBox="0 0 180 180" width="150" height="150" style="overflow:visible;filter:drop-shadow(0 0 8px {col})">{body}</svg>'

def write(path, html):
    os.makedirs(os.path.dirname(P(path)), exist_ok=True)
    open(P(path), 'w').write(html)

# ───────────────────────── card scenes ─────────────────────────
def card_scene(i, ch):
    sid = ch['id']; start = SEL[sid]; end = [b for s, a, b in SCENES if s == sid][0]; dur = round(end - start, 3)
    col = ch['col']
    sx, sy = SLOT_X[i] + SLOT_W / 2, SLOT_Y + SLOT_H / 2
    cx, cy = CARD['x'] + CARD['w'] / 2, CARD['y'] + CARD['h'] / 2
    secret = sid == 'sec'
    portrait = (f'<img id="{sid}-lag" src="assets/img/lagzilla.png" style="position:absolute;left:70px;top:62px;height:268px">' if secret
                else f'<div id="{sid}-av" style="position:absolute;left:40px;top:60px">{avatar_svg(col, 290)}</div>'
                     f'<div id="{sid}-prop" style="position:absolute;left:700px;top:175px">{prop_svg(ch["prop"], col)}</div>')
    badge = (f'<div id="{sid}-badge" style="position:absolute;left:380px;top:190px;padding:6px 22px;background:{col};color:#0a0a1e;'
             f'font:800 40px BarlowX;letter-spacing:1px">{ch["badge"]}</div>') if ch.get('badge') else ''
    timer = (f'<div id="{sid}-timer" style="position:absolute;left:380px;top:192px;font:800 44px BarlowX;color:{MG}">JOGANDO HÁ <span id="{sid}-clock">3:00:00</span></div>'
             if ch.get('timer') else '')
    bars = ''
    for k, (lab, v) in enumerate(ch['stats']):
        y = 340 + k * 80
        bars += f'''
      <div style="position:absolute;left:48px;top:{y}px;font:700 40px BarlowB;color:#d6d9ff">{lab}</div>
      <div style="position:absolute;left:48px;top:{y + 48}px;width:700px;height:22px;border:3px solid #5a5f96;border-radius:6px"></div>
      <div id="{sid}-bar{k}" style="position:absolute;left:53px;top:{y + 53}px;width:{690 * max(v, 2) / 100:.0f}px;height:12px;background:{col};border-radius:3px;box-shadow:0 0 12px {col}"></div>
      <div id="{sid}-num{k}" style="position:absolute;left:770px;top:{y + 18}px;width:90px;text-align:right;font:800 58px BarlowX;color:{col if v else MG}">{v}</div>'''
    name_left = 380
    stamp = (f'<div id="sec-stamp" class="clip" data-start="0.12" data-duration="{dur - 0.12:.2f}" style="position:absolute;left:0;width:1080px;top:296px;text-align:center;'
             f'font:800 84px BarlowX;color:{GD};text-shadow:0 0 18px {GD}">DESBLOQUEADO!</div>') if secret else ''
    flood = (f'<div id="sec-flood" class="clip" data-start="0" data-duration="0.6" style="position:absolute;inset:0;background:{PU}"></div>') if secret else ''
    js_bars = ''
    for k, (lab, v) in enumerate(ch['stats']):
        t0 = 0.45 + k * 0.25
        if v:
            js_bars += f'''
      tl.fromTo("#{sid}-bar{k}", {{scaleX: 0}}, {{scaleX: 1, duration: 0.6, ease: "power2.out"}}, {t0});
      (function(){{ const o={{n:0}}, el=document.querySelector("#{sid}-num{k}");
        tl.fromTo(o, {{n:0}}, {{n:{v}, duration:0.6, ease:"power2.out", onUpdate:()=>{{el.textContent=Math.round(o.n)}}}}, {t0}); }})();'''
        else:
            js_bars += f'''
      tl.fromTo("#{sid}-bar{k}", {{scaleX: 6}}, {{scaleX: 1, duration: 0.6, ease: "power2.in"}}, {t0});
      (function(){{ const o={{n:40}}, el=document.querySelector("#{sid}-num{k}");
        tl.fromTo(o, {{n:40}}, {{n:0, duration:0.6, ease:"power2.in", onUpdate:()=>{{el.textContent=Math.round(o.n)}}}}, {t0}); }})();'''
    js_timer = (f'''
      (function(){{ const o={{s:10800}}, el=document.querySelector("#{sid}-clock");
        tl.fromTo(o, {{s:10800}}, {{s:10800+{int(dur*1800)}, duration:{dur}, ease:"none", onUpdate:()=>{{const s=Math.floor(o.s);
          el.textContent=Math.floor(s/3600)+":"+String(Math.floor(s/60)%60).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}}}}, 0); }})();'''
                if ch.get('timer') else '')
    enter = ('tl.fromTo("#%s-card", {x:%.1f, y:%.1f, scaleX:%.4f, scaleY:%.4f, opacity:0.6, filter:"blur(12px)"}, '
             '{x:0, y:0, scaleX:1, scaleY:1, opacity:1, filter:"blur(0px)", duration:0.4, ease:"expo.out"}, 0);'
             % (sid, sx - cx, sy - cy, SLOT_W / CARD['w'], SLOT_H / CARD['h']))
    if secret:
        enter = ('tl.fromTo("#sec-card", {scale:1.18, opacity:0, filter:"blur(14px)"}, {scale:1, opacity:1, filter:"blur(0px)", duration:0.45, ease:"back.out(1.6)"}, 0.08);'
                 'tl.fromTo("#sec-flood", {opacity:0.85}, {opacity:0, duration:0.4, ease:"power2.inOut"}, 0);'
                 'tl.fromTo("#sec-lag", {y:40, opacity:0}, {y:0, opacity:1, duration:0.5, ease:"expo.out"}, 0.2);'
                 'tl.fromTo("#sec-stampin", {scale:1.6, opacity:0}, {scale:1, opacity:1, duration:0.3, ease:"back.out(2)"}, 0.12);')
        stamp = stamp.replace('>DESBLOQUEADO!<', '><span id="sec-stampin" style="display:inline-block">DESBLOQUEADO!</span><')
    exit_ = ('tl.to("#%s-card", {x:-1150, filter:"blur(10px)", duration:0.18, ease:"power3.in"}, %.2f);'
             % (sid, dur - 0.2)) if sid not in ('sec',) else ''
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    #{sid}-card {{ position:absolute; left:{CARD['x']}px; top:{CARD['y']}px; width:{CARD['w']}px; height:{CARD['h']}px; }}
    #{sid}-frame {{ position:absolute; inset:0; background:{col}; clip-path:{CHAMF(40)}; filter:drop-shadow(0 0 18px {col}); }}
    #{sid}-fill {{ position:absolute; inset:6px; background:#090b20; clip-path:{CHAMF(37)}; }}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="{W}" data-height="{H}" data-layout-allow-overlap>
    {flood}
    {stamp}
    <div id="{sid}-card">
      <div id="{sid}-frame"></div><div id="{sid}-fill"></div>
      <div style="position:absolute;left:44px;top:22px;font:700 42px BarlowB;color:{col}">{ch['n']}</div>
      {portrait}
      <div style="position:absolute;left:{name_left}px;top:92px;width:500px;font:800 66px BarlowX;color:#fff;white-space:nowrap">{ch['name']}</div>
      {badge}{timer}{bars}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {enter}{js_bars}{js_timer}
    {exit_}
    window.__timelines["{sid}"] = tl;
  </script>
</template>
'''
    write(f'compositions/{sid}.html', html)

# ───────────────────────── hook ─────────────────────────
def hook_scene():
    w = json.load(open(P('assets/words.json')))['v0']; v = VOICE['v0']
    t1 = v + w[2]['start']; t2 = v + w[4]['start']
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .hk {{ position:absolute; left:0; width:1080px; text-align:center; font-family:BarlowX; font-weight:800; letter-spacing:-2px; line-height:1; }}
  </style>
  <div id="root" data-composition-id="hook" data-width="{W}" data-height="{H}">
    <div id="hk-a" class="hk" style="top:300px;font-size:210px;color:#fff">4 AMIGOS</div>
    <div id="hk-b" class="hk" style="top:505px;font-size:210px;color:{CY};text-shadow:0 0 18px {CY}">1 CONSOLA</div>
    <div id="hk-c" class="hk" style="top:730px;font-size:104px;color:{MG};text-shadow:0 0 16px {MG}">
      <span class="w">QUAL</span> <span class="w">É</span> <span class="w">O</span> <span class="w">SEU</span> <span class="w">SQUAD?</span></div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#hk-a", {{opacity:1}}, {{opacity:1, duration:0.01}}, 0);
    tl.fromTo("#hk-b", {{opacity:0, filter:"blur(8px)", scale:1.08}}, {{opacity:1, filter:"blur(0px)", scale:1, duration:0.18, ease:"power4.out"}}, {t1:.2f});
    gsap.utils.toArray("#hk-c .w").forEach((el, i) =>
      tl.fromTo(el, {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.13, ease:"power4.out"}}, {t2:.2f} + i * 0.08));
    tl.to(["#hk-a", "#hk-b"], {{opacity:0, filter:"blur(8px)", duration:0.18, ease:"power3.in", stagger:0.04}}, 2.70);
    tl.to("#hk-c", {{y:-450, scale:0.81, duration:0.32, ease:"power3.inOut"}}, 2.70);
    tl.to("#hk-c", {{color:"#ffffff", textShadow:"0 0 0px #ff2dc8", duration:0.32}}, 2.70);
    window.__timelines["hook"] = tl;
  </script>
</template>
'''
    write('compositions/hook.html', html)

# ───────────────────────── slots overlay ─────────────────────────
def slots_overlay():
    loc = lambda t: round(t - OV0, 3)
    slots = ''
    for i, ch in enumerate(CHARS):
        col = ch['col']; x = SLOT_X[i]
        inner = (f'<div id="sl{i}-q" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 130px BarlowX;color:#8c8fb8">?</div>'
                 f'<img id="sl{i}-lz" src="assets/img/lagzilla.png" style="position:absolute;left:34px;top:10px;height:150px;opacity:0">') if i == 4 else \
                (f'<div id="sl{i}-av" style="position:absolute;left:34px;top:14px;opacity:0.45">{avatar_svg(col, 100)}</div>')
        tag = 'P%d' % (i + 1) if i < 4 else '???'
        slots += f'''
    <div id="sl{i}" style="position:absolute;left:{x}px;top:{SLOT_Y}px;width:{SLOT_W}px;height:{SLOT_H}px">
      <div id="sl{i}-fr" style="position:absolute;inset:0;background:{col if i < 4 else '#6e7099'};clip-path:{CHAMF(18)};opacity:0.55"></div>
      <div id="sl{i}-bg" style="position:absolute;inset:4px;background:#090b20;clip-path:{CHAMF(17)}"></div>
      <div id="sl{i}-hot" style="position:absolute;inset:4px;background:{col};clip-path:{CHAMF(17)};opacity:0"></div>
      {inner}
      <div id="sl{i}-lab" style="position:absolute;left:0;right:0;bottom:12px;text-align:center;font:700 34px BarlowB;color:#e6e8ff">{tag}</div>
      <div id="sl{i}-ok" style="position:absolute;left:12px;right:12px;bottom:8px;height:42px;background:{col};color:#0a0a1e;text-align:center;font:800 34px/42px BarlowX;opacity:0">PRONTO</div>
    </div>'''
    js = []
    # pop in
    for i in range(5):
        js.append(f'tl.fromTo("#sl{i}", {{scale:0.4, opacity:0}}, {{scale:1, opacity:1, duration:0.3, ease:"back.out(1.8)"}}, {loc(2.30) + i * 0.06:.3f});')
    js.append(f'tl.fromTo("#ov-head", {{opacity:0}}, {{opacity:1, duration:0.02}}, {loc(3.03):.3f});')
    # cursor path + clicks
    order = ['p1', 'p2', 'p3', 'p4', 'sec']
    clicks = [SEL[s] - 0.05 for s in order]; clicks[4] = 12.90
    js.append(f'tl.fromTo("#ov-cur", {{opacity:0, x:{540 - 20}, y:1260}}, {{opacity:1, duration:0.2}}, {loc(2.75):.3f});')
    for i, tc in enumerate(clicks):
        x = SLOT_X[i] + SLOT_W * 0.62; y = SLOT_Y + SLOT_H * 0.62
        js.append(f'tl.to("#ov-cur", {{x:{x:.0f}, y:{y:.0f}, duration:0.28, ease:"power2.inOut"}}, {loc(tc - 0.3):.3f});')
        js.append(f'tl.to("#sl{i}", {{scale:0.92, duration:0.06, ease:"power2.in", yoyo:true, repeat:1}}, {loc(tc):.3f});')
        js.append(f'tl.to("#ov-cur", {{scale:0.85, duration:0.06, yoyo:true, repeat:1}}, {loc(tc):.3f});')
        on = SEL[order[i]]
        js.append(f'tl.to("#sl{i}-hot", {{opacity:0.35, duration:0.12}}, {loc(on):.3f});')
        js.append(f'tl.to("#sl{i}-fr", {{opacity:1, duration:0.12}}, {loc(on):.3f});')
        if i < 4:
            js.append(f'tl.to("#sl{i}-av", {{opacity:1, duration:0.12}}, {loc(on):.3f});')
        nxt = SEL[order[i + 1]] if i < 4 else None
        if nxt:
            js.append(f'tl.to("#sl{i}-hot", {{opacity:0, duration:0.12}}, {loc(nxt):.3f});')
            js.append(f'tl.fromTo("#sl{i}-ok", {{opacity:0, scale:1.3}}, {{opacity:1, scale:1, duration:0.25, ease:"back.out(2)"}}, {loc(nxt):.3f});')
            js.append(f'tl.to("#sl{i}-lab", {{opacity:0, duration:0.1}}, {loc(nxt):.3f});')
    # secret slot: glitch, then Lagzilla
    js.append(f'tl.to("#sl4-q", {{x:10, duration:0.04, yoyo:true, repeat:9, ease:"none"}}, {loc(12.95):.3f});')
    js.append(f'tl.to("#sl4-q", {{opacity:0, duration:0.05}}, {loc(UNLOCK):.3f});')
    js.append(f'tl.fromTo("#sl4-lz", {{opacity:0, scale:1.3}}, {{opacity:1, scale:1, duration:0.3, ease:"back.out(2)"}}, {loc(UNLOCK):.3f});')
    # the held breath before the unlock: whole overlay + world dip
    js.append(f'tl.to("#ov-dip", {{opacity:0.4, duration:0.3, ease:"power2.in"}}, {loc(12.95):.3f});')
    js.append(f'tl.to("#ov-dip", {{opacity:0, duration:0.08}}, {loc(UNLOCK):.3f});')
    js.append(f'tl.to("#ov-cur", {{opacity:0, duration:0.15}}, {loc(UNLOCK + 0.2):.3f});')
    js.append(f'tl.to("#ov-head", {{opacity:0, filter:"blur(8px)", duration:0.12}}, {loc(UNLOCK - 0.02):.3f});')
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
  </style>
  <div id="root" data-composition-id="slots" data-width="{W}" data-height="{H}" data-layout-allow-overlap>
    <div id="ov-head" style="position:absolute;left:0;width:1080px;top:290px;text-align:center;font:800 84px BarlowX;color:#fff">QUAL É O SEU SQUAD?</div>
    {slots}
    <svg id="ov-cur" viewBox="0 0 60 80" width="60" height="80" style="position:absolute;left:0;top:0;overflow:visible">
      <path d="M4 4 L4 64 L20 50 L31 76 L42 71 L31 46 L54 46 Z" fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round"/></svg>
    <div id="ov-dip" style="position:absolute;inset:0;background:#000;opacity:0"></div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join('    ' + j for j in js)}
    window.__timelines["slots"] = tl;
  </script>
</template>
'''
    write('compositions/slots.html', html)

# ───────────────────────── squad + cta ─────────────────────────
def squad_scene():
    chips = ''.join(f'<div id="sq-chip{i}" style="position:absolute;left:{105 + i * 225}px;top:1000px;width:195px;height:70px;background:{c};'
                    f'clip-path:{CHAMF(14)};color:#0a0a1e;text-align:center;font:800 44px/70px BarlowX">P{i + 1} PRONTO</div>'
                    for i, c in enumerate([CY, MG, PU, GD]))
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    #sq-world {{ position:absolute; inset:0; }}
    .sq {{ position:absolute; left:0; width:1080px; text-align:center; font-family:BarlowX; font-weight:800; line-height:1; }}
  </style>
  <div id="root" data-composition-id="squad" data-width="{W}" data-height="{H}" data-layout-allow-overlap>
    <div id="sq-world">
      <img src="assets/img/lounge_bar.png" style="position:absolute;left:-80px;top:0;width:1240px;height:1000px;object-fit:cover">
      <img src="assets/img/lounge_puffs.png" style="position:absolute;left:-80px;top:920px;width:1240px;height:1000px;object-fit:cover;-webkit-mask-image:linear-gradient(transparent 0, #000 160px);mask-image:linear-gradient(transparent 0, #000 160px)">
      <div style="position:absolute;inset:0;background:linear-gradient(rgba(5,6,15,0.92) 0%, rgba(5,6,15,0.55) 18%, rgba(5,6,15,0.55) 62%, rgba(5,6,15,0.85) 80%, rgba(5,6,15,0.7) 100%)"></div>
    </div>
    <div class="sq" style="top:340px;font-size:200px;color:#fff"><span id="sq-w1" style="display:inline-block">SQUAD</span></div>
    <div class="sq" style="top:540px;font-size:200px;color:{CY};text-shadow:0 0 18px {CY}"><span id="sq-w2" style="display:inline-block">COMPLETO</span></div>
    <div id="sq-price" class="sq" style="top:780px;font-size:96px;color:#fff"><span style="color:{MG};font-size:150px">6 €</span> / hora por consola</div>
    <div id="sq-max" class="sq" style="top:1120px;font:700 64px BarlowB;color:#fff">até 4 jogadores</div>
    {chips}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#sq-world", {{clipPath:"inset(390px 90px 1020px 90px)", scale:1.12}}, {{clipPath:"inset(0px 0px 0px 0px)", scale:1, duration:0.65, ease:"power2.inOut"}}, 0);
    tl.fromTo("#sq-w1", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.13, ease:"power4.out"}}, 0.20);
    tl.fromTo("#sq-w2", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.13, ease:"power4.out"}}, 0.62);
    tl.fromTo("#sq-price", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.18, ease:"power4.out"}}, 1.40);
    [0,1,2,3].forEach(i => tl.fromTo("#sq-chip"+i, {{scale:0.3, opacity:0}}, {{scale:1, opacity:1, duration:0.3, ease:"back.out(1.8)"}}, 0.85 + i*0.08));
    tl.fromTo("#sq-max", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.18, ease:"power4.out"}}, 2.20);
    window.__timelines["squad"] = tl;
  </script>
</template>
'''
    write('compositions/squad.html', html)

def cta_scene():
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .ct {{ position:absolute; left:0; width:1080px; text-align:center; font-family:BarlowX; font-weight:800; line-height:1; }}
  </style>
  <div id="root" data-composition-id="cta" data-width="{W}" data-height="{H}">
    <div id="ct-all" style="position:absolute;inset:0">
      <img id="ct-logo" src="assets/img/logo_alpha.png" style="position:absolute;left:320px;top:300px;width:440px">
      <div class="ct" style="top:540px;font-size:190px;color:#fff">MARCA O</div>
      <div class="ct" style="top:740px;font-size:190px;color:{MG};text-shadow:0 0 18px {MG}">SEU SQUAD</div>
      <div id="ct-bio" class="ct" style="top:1010px;font:700 64px BarlowB;color:#fff">Reserva no link da bio</div>
    </div>
    <img id="ct-lz" src="assets/img/lagzilla.png" style="position:absolute;left:300px;top:1180px;height:900px">
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#ct-all", {{y:700, filter:"blur(16px)"}}, {{y:0, filter:"blur(0px)", duration:0.3, ease:"expo.out"}}, 0);
    tl.fromTo("#ct-bio", {{opacity:0}}, {{opacity:1, duration:0.2}}, 0.9);
    tl.fromTo("#ct-lz", {{y:500}}, {{y:0, duration:0.7, ease:"expo.out"}}, 0.35);
    window.__timelines["cta"] = tl;
  </script>
</template>
'''
    write('compositions/cta.html', html)

# ───────────────────────── captions ─────────────────────────
def captions():
    words = json.load(open(P('assets/words.json')))
    C0, C1 = 3.05, 17.10
    groups = []
    for k in ('v1', 'v2', 'v3', 'v4', 'v5'):
        cur = []
        for w in words[k]:
            cur.append(w)
            if len(cur) == 3 or w['text'][-1] in '.?:!,':
                groups.append((k, cur)); cur = []
        if cur: groups.append((k, cur))
    items, js, prev_end = '', [], 0.0
    for gi, (k, g) in enumerate(groups):
        a = VOICE[k] + g[0]['start'] - C0; b = VOICE[k] + g[-1]['end'] - C0
        nxt = groups[gi + 1] if gi + 1 < len(groups) else None
        b2 = min(b + 0.25, (VOICE[nxt[0]] + nxt[1][0]['start'] - C0) if nxt else b + 0.4)
        a = max(0.1, a - 0.05, prev_end); dur = max(0.35, b2 - a); prev_end = a + dur
        txt = ' '.join(w['text'] for w in g).upper()
        if txt in ('DESBLOQUEADO:',): continue          # the stamp already says it
        items += f'\n    <div id="cap{gi}" class="clip cap" data-start="{a:.2f}" data-duration="{dur:.2f}">{txt}</div>'
        js.append(f'tl.fromTo("#cap{gi} ", {{opacity:0}}, {{opacity:1, duration:0.06}}, {a:.2f});')
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .cap {{ position:absolute; left:0; width:1080px; top:1145px; text-align:center; font:800 70px BarlowX; color:#fff;
           text-shadow:0 4px 0 #000, 0 0 14px rgba(0,0,0,0.9); }}
  </style>
  <div id="root" data-composition-id="caps" data-width="{W}" data-height="{H}">{items}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join('    ' + j for j in js)}
    window.__timelines["caps"] = tl;
  </script>
</template>
'''
    write('compositions/caps.html', html)

# ───────────────────────── root + audio ─────────────────────────
def root():
    peaks = json.load(open(P('assets/sfx/peaks.json')))
    sfx = []  # (file, event_time, volume)
    sfx.append(('pop_a', 2.30, 0.7))
    order = ['p1', 'p2', 'p3', 'p4']
    whs = ['whoosh_a', 'whoosh_b', 'whoosh_c', 'whoosh_a']
    for i, s in enumerate(order):
        sfx.append(('click_a' if i % 2 == 0 else 'click_b', SEL[s] - 0.05, 0.8))
        sfx.append((whs[i], SEL[s] + 0.08, 0.55))
    sfx.append(('click_a', 12.90, 0.8))
    sfx.append(('glitch', 12.98, 0.5))
    sfx.append(('riser', UNLOCK, 0.6))
    sfx.append(('impact', UNLOCK, 0.9))
    sfx.append(('world', 17.10 + 0.3, 0.7))
    for i in range(4): sfx.append(('pop_a' if i % 2 == 0 else 'pop_b', 17.10 + 0.85 + i * 0.08 + 0.1, 0.55))
    sfx.append(('world_b', 20.85 + 0.12, 0.7))
    # lay sfx on lanes so overlapping clips get their own lane
    lanes_end = []; audio = []
    for n, (f, ev, vol) in enumerate(sfx):
        st = max(0.0, ev + 1 / FPS - peaks[f]['peak']); en = st + peaks[f]['dur']
        lane = next((i for i, e in enumerate(lanes_end) if e <= st), None)
        if lane is None: lanes_end.append(en); lane = len(lanes_end) - 1
        else: lanes_end[lane] = en
        audio.append(f'<audio id="sfx{n}" class="clip" src="assets/sfx/{f}.wav" data-start="{st:.3f}" data-duration="{peaks[f]["dur"]:.3f}" data-volume="{vol}" data-track-index="{20 + lane}" data-audio-group="sfx"></audio>')
    vox = []
    import subprocess
    vdur = {}
    for k, t in VOICE.items():
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', P('assets/voice', k + '.wav')]))
        vdur[k] = d
        vox.append(f'<audio id="vo{k[1]}" class="clip" src="assets/voice/{k}.wav" data-start="{t:.2f}" data-duration="{d:.3f}" data-volume="1" data-track-index="10" data-audio-group="voiceover"></audio>')
    # music: volume lane (duck under voice, hold back before the unlock) + lowpass that opens on the unlock
    pts = []
    def base(t): return 0.42 if t < UNLOCK else 0.55
    pts.append((0.0, base(0)))
    for k, t in VOICE.items():
        a, b = t - 0.12, t + vdur[k] + 0.15
        if a < 12.9 < b or a < UNLOCK < b: pass
        pts += [(a, base(a)), (a + 0.12, 0.26), (b - 0.1, 0.26), (b + 0.1, base(b))]
    pts += [(12.85, 0.42), (13.30, 0.12), (UNLOCK, 0.12), (UNLOCK + 0.02, 0.6)]
    pts = sorted({round(t, 3): v for t, v in pts if 0 <= t <= DUR}.items())
    # keep the voice duck that overlaps the unlock consistent
    fixed = []
    for t, v in pts:
        if 12.85 < t < UNLOCK: v = min(v, 0.42 - (t - 12.85) / (UNLOCK - 12.85) * 0.30)
        fixed.append({'t': t, 'v': round(v, 3)})
    lp = [{'t': 0, 'v': 2400}, {'t': 12.85, 'v': 2400}, {'t': 13.35, 'v': 450}, {'t': UNLOCK, 'v': 450}, {'t': UNLOCK + 0.03, 'v': 18000}]
    auto = json.dumps({'version': 1, 'lanes': [{'target': 'volume', 'points': fixed}, {'target': 'fx.lp.frequency', 'points': lp}]}).replace('"', '&quot;')
    fx = json.dumps({'version': 1, 'nodes': [{'type': 'lowpass', 'id': 'lp', 'label': 'Lobby filter (opens on the unlock)', 'params': {'frequency': 2400}},
                                              {'type': 'limiter', 'id': 'lim', 'params': {'limit': -1}}]}).replace('"', '&quot;')
    music = (f'<audio id="music" class="clip" src="assets/music/circuit_synthwave.mp3" data-start="0" data-duration="{DUR}" data-media-start="17.595" '
             f'data-volume="1" data-fade-in="0.05" data-fade-out="1.0" data-track-index="11" data-fx-chain="{fx}" data-automation="{auto}"></audio>')
    hosts = []
    z = {'hook': 5, 'p1': 5, 'p2': 5, 'p3': 5, 'p4': 5, 'sec': 5, 'squad': 8, 'cta': 9}
    for sid, a, b in SCENES:
        hosts.append(f'<div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{a}" data-duration="{round(b - a, 3)}" '
                     f'data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index:{z[sid]}"></div>')
    hosts.append(f'<div id="slots" data-composition-id="slots" data-composition-src="compositions/slots.html" data-start="{OV0}" data-duration="{round(OV1 - OV0, 3)}" '
                 f'data-track-index="2" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index:6"></div>')
    hosts.append(f'<div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="3.05" data-duration="14.05" '
                 f'data-track-index="3" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index:7"></div>')
    html = f'''<!doctype html>
<html lang="pt">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>{FONTS}
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      html, body {{ width:{W}px; height:{H}px; overflow:hidden; background:#05060f; }}
      #root {{ position:relative; width:100%; height:100%; }}
      #bg {{ position:absolute; inset:0; z-index:0;
        background:
          linear-gradient(90deg, rgba(40,230,255,0.55) 0px, rgba(40,230,255,0.12) 60px, rgba(40,230,255,0) 140px),
          linear-gradient(270deg, rgba(255,45,200,0.55) 0px, rgba(255,45,200,0.12) 60px, rgba(255,45,200,0) 140px),
          #05060f; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="bg"></div>
      <img id="bg-room" src="assets/img/lounge_puffs.png" style="position:absolute;left:-60px;top:1270px;width:1200px;height:650px;object-fit:cover;opacity:0.38;z-index:1;-webkit-mask-image:linear-gradient(transparent 0, #000 220px);mask-image:linear-gradient(transparent 0, #000 220px)">
      {(chr(10) + '      ').join(hosts)}
      {(chr(10) + '      ').join(vox)}
      {music}
      {(chr(10) + '      ').join(audio)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
'''
    write('index.html', html)

if __name__ == '__main__':
    hook_scene(); slots_overlay(); captions(); squad_scene(); cta_scene()
    for i, ch in enumerate(CHARS): card_scene(i, ch)
    root()
    print('written: index.html + compositions/', sorted(os.listdir(P('compositions'))))
