#!/usr/bin/env python3
"""Writes index.html + compositions/ for the HyperFrames booking tutorial (pixelzone.pt, 3 steps).
Inputs: assets/shots/meta.json (live captures + tap boxes, 390x664 CSS viewport), assets/words.json (Whisper word times),
assets/sfx/peaks.json. Run from the project root: python3 tools/gen.py"""
import json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = lambda *a: os.path.join(ROOT, *a)
W, H, DUR, FPS = 1080, 1920, 30.5, 30
CY, MG = '#28e6ff', '#ff2dc8'
META = json.load(open(P('assets/shots/meta.json'))); WORDS = json.load(open(P('assets/words.json')))
VOICE = {'v0': 0.15, 'v1': 3.70, 'v2': 7.60, 'v3': 11.85, 'v4': 14.15, 'v5': 16.35, 'v6': 19.85, 'v7': 23.15, 'v8': 25.95}
def wt(k, i): return round(VOICE[k] + WORDS[k]['words'][i]['start'], 3)
WX, WY, WW, WH, S = 150, 380, 780, 710, 2.0          # phone window and screen scale (CSS px -> output px)
SCREEN_H = 664 * S
PHONE_END = 22.90

FONTS = """@font-face { font-family:'BarlowX'; src:url('assets/fonts/BarlowCondensed-ExtraBoldItalic.ttf') format('truetype'); font-weight:800; }
@font-face { font-family:'BarlowB'; src:url('assets/fonts/BarlowCondensed-BoldItalic.ttf') format('truetype'); font-weight:700; }"""

def center(box): return box['x'] + box['w'] / 2, box['y'] + box['h'] / 2
def top_for(cy): return max(WH - SCREEN_H, min(0, WH / 2 - cy * S))
def win(px, py, top): return WX + px * S, WY + top + py * S     # CSS point on a screen -> frame px

# ── screen states: (shot, start, top) and taps: (time, shot, box) ──
T_RES = wt('v1', 6); T_PS5 = wt('v2', 2); T_J2 = wt('v2', 3); T_DIA = wt('v2', 4); T_HORA = wt('v2', 6)
T_C1 = VOICE['v3'] - 0.12; T_2H = wt('v3', 5); T_6 = wt('v4', 0); T_C2 = VOICE['v5'] - 0.15
T_NOME = wt('v5', 2); T_TEL = wt('v5', 3); T_ENV = wt('v5', 5); T_AVISO = VOICE['v6'] + 0.10
m = lambda n: META[n]['tap']
TOP = {n: top_for(center(m(n))[1]) for n in META}
TOP['s3_form'] = top_for((META['s3_form']['marks']['nome']['y'] + META['s3_form']['marks']['tel']['y'] + 56) / 2)
TOP['s3_send'] = top_for(415); TOP['s3_name'] = TOP['s3_filled'] = TOP['s3_form']
SEQ = [('home', 0.0), ('s1_console', T_RES + 0.10), ('s1_players', T_PS5 + 0.10), ('s1_day', T_J2 + 0.10), ('s1_time', T_DIA + 0.10),
       ('s1_continue', T_HORA + 0.10), ('s2_duration', T_C1 + 0.10), ('s2_continue', T_6 + 1.15), ('s3_form', T_C2 + 0.10), ('s3_name', T_NOME + 0.10), ('s3_filled', T_TEL + 0.10), ('s3_send', T_ENV - 0.30)]
TAPS = [(T_RES, 'home', m('home'), 'pan'), (T_PS5, 's1_console', m('s1_console'), None), (T_J2, 's1_players', m('s1_players'), None),
        (T_DIA, 's1_day', m('s1_day'), None), (T_HORA, 's1_time', m('s1_time'), None), (T_C1, 's1_continue', m('s1_continue'), None),
        (T_2H, 's2_duration', m('s2_duration'), None), (T_C2, 's2_continue', m('s2_continue'), None),
        (T_NOME, 's3_form', META['s3_form']['marks']['nome'], None), (T_TEL, 's3_name', META['s3_form']['marks']['tel'], None),
        (T_ENV, 's3_send', m('s3_send'), None)]
HOME_PAN = wt('v1', 2)        # the camera scrolls to RESERVAR SESSÃO while "pixelzone.pt" is said

def phone():
    imgs, js = '', []
    for i, (n, st) in enumerate(SEQ):
        en = SEQ[i + 1][1] if i + 1 < len(SEQ) else PHONE_END
        top = 0 if n == 'home' else TOP[n]
        imgs += (f'\n      <img id="sc-{n}" class="clip" src="assets/shots/{n}.png" data-start="{st:.3f}" data-duration="{en - st:.3f}" '
                 f'style="position:absolute;left:0;top:{top:.1f}px;width:{WW}px;height:{SCREEN_H:.0f}px">')
        if n != 'home':
            js.append(f'tl.fromTo("#sc-{n}", {{scale:1.02, filter:"brightness(1.25)"}}, {{scale:1, filter:"brightness(1)", duration:0.25, ease:"expo.out"}}, {st:.3f});')
    js.append(f'tl.fromTo("#ph-all", {{y:140}}, {{y:0, duration:0.7, ease:"expo.out"}}, 0);')
    js.append(f'tl.fromTo("#sc-home", {{y:0}}, {{y:{TOP["home"]:.1f}, duration:0.7, ease:"power2.inOut"}}, {HOME_PAN:.3f});')
    # finger
    js.append(f'tl.fromTo("#finger", {{opacity:0}}, {{opacity:1, duration:0.2}}, {HOME_PAN + 0.4:.3f});')
    prev = None
    for t, n, box, _ in TAPS:
        cx, cy = center(box); top = TOP[n]
        if box['w'] > 200: cx = box['x'] + box['w'] * 0.78
        fx, fy = win(cx, cy, top)
        arrive = 0.32 if prev is None or abs(fx - prev[0]) + abs(fy - prev[1]) > 60 else 0.2
        js.append(f'tl.to("#finger", {{x:{fx - 36:.0f}, y:{fy - 36:.0f}, duration:{arrive}, ease:"power2.inOut"}}, {t - arrive - 0.06:.3f});')
        js.append(f'tl.to("#finger-dot", {{scale:0.78, duration:0.07, ease:"power2.in", yoyo:true, repeat:1}}, {t - 0.07:.3f});')
        prev = (fx, fy)
    js.append(f'tl.to("#finger", {{opacity:0, duration:0.15}}, {PHONE_END - 0.4:.3f});')
    # circled details
    h1 = META['s2_duration']['marks']['h1']; av = META['s3_send']['marks']['aviso']
    marks = ''
    for mid, box, n, t in (('mk1', h1, 's2_duration', T_6), ('mk2', av, 's3_send', T_AVISO)):
        x0, y0 = win(box['x'] - 10, box['y'] - 12, TOP[n]); x1, y1 = win(box['x'] + box['w'] + 10, box['y'] + box['h'] + 12, TOP[n])
        rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
        dur = (SEQ[[s for s, _ in SEQ].index(n) + 1][1] if n != 's3_send' else PHONE_END) - t
        marks += (f'\n    <svg id="{mid}" class="clip" data-start="{t:.3f}" data-duration="{dur:.3f}" width="{W}" height="{H}" '
                  f'style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none"><ellipse id="{mid}-e" cx="{x0 + rx:.0f}" cy="{y0 + ry:.0f}" '
                  f'rx="{rx:.0f}" ry="{ry:.0f}" fill="none" stroke="{MG}" stroke-width="7" pathLength="100" stroke-dasharray="100" '
                  f'style="filter:drop-shadow(0 0 8px {MG})" transform="rotate(-3 {x0 + rx:.0f} {y0 + ry:.0f})"/></svg>')
        js.append(f'tl.fromTo("#{mid}-e", {{strokeDashoffset:100}}, {{strokeDashoffset:0, duration:0.35, ease:"power2.out"}}, {t:.3f});')
    js.append(f'tl.to("#ph-all", {{y:1200, filter:"blur(14px)", duration:0.3, ease:"power3.in"}}, {PHONE_END - 0.3:.3f});')
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    #ph-win {{ position:absolute; left:{WX}px; top:{WY}px; width:{WW}px; height:{WH}px; border-radius:46px; overflow:hidden; background:#05060f; }}
    #ph-bezel {{ position:absolute; left:{WX - 12}px; top:{WY - 12}px; width:{WW + 24}px; height:{WH + 24}px; border-radius:58px;
                border:12px solid #15172b; box-shadow:0 0 0 2px #2a2d4a, 0 0 26px rgba(40,230,255,0.35), 0 30px 60px rgba(0,0,0,0.6); }}
  </style>
  <div id="root" data-composition-id="phone" data-width="{W}" data-height="{H}" data-layout-allow-overlap data-layout-allow-overflow>
    <div id="ph-all" style="position:absolute;inset:0">
      <div id="ph-win">{imgs}
      </div>
      <div id="ph-bezel"></div>{marks}
      <div id="finger" style="position:absolute;left:0;top:0;width:72px;height:72px;opacity:0">
        <div id="finger-dot" style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.78);border:4px solid #0a0b18;box-shadow:0 4px 14px rgba(0,0,0,0.6)"></div>
      </div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join('    ' + j for j in js)}
    window.__timelines["phone"] = tl;
  </script>
</template>'''
    os.makedirs(P('compositions'), exist_ok=True); open(P('compositions/phone.html'), 'w').write(html)

HEADS = [(0.0, 'RESERVAR EM <b id="hd-3p" style="display:inline-block">3 PASSOS</b>'), (3.60, '<b>PIXELZONE.PT</b>'), (7.50, 'PASSO 1 · <b>ESCOLHE</b>'),
         (11.75, 'PASSO 2 · <b>DURAÇÃO</b>'), (16.25, 'PASSO 3 · <b>CONFIRMA</b>'), (19.75, 'PAGAMENTO <b>NO ESPAÇO</b>')]
def heads():
    items, js = '', []
    for i, (t, txt) in enumerate(HEADS):
        en = HEADS[i + 1][0] if i + 1 < len(HEADS) else PHONE_END
        items += f'\n    <div id="hd{i}" class="clip hd" data-start="{t:.2f}" data-duration="{en - t:.2f}"><span id="hd{i}-t" style="display:inline-block">{txt}</span></div>'
        if i == 0: js.append(f'tl.fromTo("#hd-3p", {{opacity:0, scale:1.6}}, {{opacity:1, scale:1, duration:0.3, ease:"back.out(2)"}}, {wt("v0", 5):.3f});')
        if i: js.append(f'tl.fromTo("#hd{i}-t", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.15, ease:"power4.out"}}, {t:.2f});')
        js.append(f'tl.to("#hd{i}-t", {{opacity:0, filter:"blur(8px)", duration:0.12, ease:"power2.in"}}, {en - 0.12:.2f});')
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .hd {{ position:absolute; left:0; width:{W}px; top:276px; text-align:center; font:800 82px BarlowX; color:#fff; letter-spacing:-1px; }}
    .hd b {{ color:{CY}; text-shadow:0 0 16px {CY}; }}
  </style>
  <div id="root" data-composition-id="heads" data-width="{W}" data-height="{H}">{items}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join('    ' + j for j in js)}
    window.__timelines["heads"] = tl;
  </script>
</template>'''
    open(P('compositions/heads.html'), 'w').write(html)

def caps():
    groups = []
    for k in ('v1', 'v2', 'v3', 'v4', 'v5', 'v6'):
        cur = []
        for w in WORDS[k]['words']:
            cur.append(w)
            if len(cur) == 3 or w['text'][-1] in '.?:!,': groups.append((k, cur)); cur = []
        if cur: groups.append((k, cur))
    items, js, prev = '', [], 0.0
    for gi, (k, g) in enumerate(groups):
        a = VOICE[k] + g[0]['start']; b = VOICE[k] + g[-1]['end']
        nxt = groups[gi + 1] if gi + 1 < len(groups) else None
        b2 = min(b + 0.25, (VOICE[nxt[0]] + nxt[1][0]['start']) if nxt else b + 0.4)
        a = max(a - 0.05, prev); dur = max(0.35, b2 - a); prev = a + dur
        txt = ' '.join(w['text'] for w in g).upper().rstrip(',')
        items += f'\n    <div id="cp{gi}" class="clip cp" data-start="{a:.2f}" data-duration="{dur:.2f}">{txt}</div>'
        js.append(f'tl.fromTo("#cp{gi}", {{opacity:0}}, {{opacity:1, duration:0.06}}, {a:.2f});')
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .cp {{ position:absolute; left:0; width:{W}px; top:1128px; text-align:center; font:800 66px BarlowX; color:#fff; text-shadow:0 4px 0 #000, 0 0 14px rgba(0,0,0,0.9); }}
  </style>
  <div id="root" data-composition-id="caps" data-width="{W}" data-height="{H}">{items}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    {chr(10).join('    ' + j for j in js)}
    window.__timelines["caps"] = tl;
  </script>
</template>'''
    open(P('compositions/caps.html'), 'w').write(html)

def cta():
    c0 = PHONE_END
    l = lambda t: round(t - c0, 3)
    v7w = [VOICE['v7'] + w['start'] for w in WORDS['v7']['words']]; v8w = [VOICE['v8'] + w['start'] for w in WORDS['v8']['words']]
    html = f'''<template>
  <style>{FONTS}
    #root {{ position:absolute; inset:0; }}
    .ct {{ position:absolute; left:0; width:{W}px; text-align:center; font-family:BarlowX; font-weight:800; line-height:1; }}
  </style>
  <div id="root" data-composition-id="cta" data-width="{W}" data-height="{H}" data-layout-allow-overlap>
    <img src="assets/img/lounge_puffs.png" style="position:absolute;left:-60px;top:1200px;width:1200px;height:720px;object-fit:cover;opacity:0.45;-webkit-mask-image:linear-gradient(transparent 0,#000 240px);mask-image:linear-gradient(transparent 0,#000 240px)">
    <img id="ct-logo" src="assets/img/logo_alpha.png" style="position:absolute;left:320px;top:290px;width:440px">
    <div id="ct-days" class="ct" style="top:520px;font-size:150px;color:#fff">SEG–SÁB</div>
    <div id="ct-hours" class="ct" style="top:680px;font-size:150px;color:{CY};text-shadow:0 0 18px {CY}">11H–20H</div>
    <div id="ct-link" class="ct" style="top:880px;font-size:92px;color:{MG};text-shadow:0 0 14px {MG}">RESERVA PELO LINK NA BIO</div>
    <div id="ct-steps" class="ct" style="top:1010px;font:700 66px BarlowB;color:#fff">São só 3 passos.</div>
    <img id="ct-lz" src="assets/img/lagzilla.png" style="position:absolute;left:330px;top:1160px;height:860px">
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#ct-logo", {{opacity:0, filter:"blur(8px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.2, ease:"power4.out"}}, 0.05);
    tl.fromTo("#ct-days", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.13, ease:"power4.out"}}, {l(v7w[0]):.3f});
    tl.fromTo("#ct-hours", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.13, ease:"power4.out"}}, {l(v7w[3]):.3f});
    tl.fromTo("#ct-link", {{opacity:0, scale:1.15}}, {{opacity:1, scale:1, duration:0.3, ease:"back.out(1.8)"}}, {l(v8w[0]):.3f});
    tl.fromTo("#ct-steps", {{opacity:0, filter:"blur(6px)"}}, {{opacity:1, filter:"blur(0px)", duration:0.15, ease:"power4.out"}}, {l(v8w[5]):.3f});
    tl.fromTo("#ct-lz", {{y:520}}, {{y:0, duration:0.8, ease:"expo.out"}}, 0.25);
    window.__timelines["cta"] = tl;
  </script>
</template>'''
    open(P('compositions/cta.html'), 'w').write(html)

def root():
    peaks = json.load(open(P('assets/sfx/peaks.json')))
    sfx = [('whoosh_c', 3.62, 0.45)]
    for i, (t, *_ ) in enumerate(TAPS): sfx.append((['tap_a', 'tap_b', 'tap_c'][i % 3], t, 0.9))
    sfx += [('whoosh_a', 7.50, 0.45), ('whoosh_b', 11.75, 0.45), ('whoosh_c', 16.25, 0.45), ('pop', T_6 + 0.35, 0.6),
            ('pop', T_AVISO + 0.35, 0.6), ('world', PHONE_END - 0.1, 0.6)]
    lanes, audio = [], []
    for n, (f, ev, vol) in enumerate(sfx):
        st = max(0.0, ev + 1 / FPS - peaks[f]['peak']); en = st + peaks[f]['dur']
        ln = next((i for i, e in enumerate(lanes) if e <= st), None)
        if ln is None: lanes.append(en); ln = len(lanes) - 1
        else: lanes[ln] = en
        audio.append(f'<audio id="sfx{n}" class="clip" src="assets/sfx/{f}.wav" data-start="{st:.3f}" data-duration="{peaks[f]["dur"]:.3f}" data-volume="{vol * 1.25:.2f}" data-track-index="{20 + ln}" data-audio-group="sfx"></audio>')
    vox, pts = [], [(0.0, 0.34)]
    for k, t in VOICE.items():
        d = WORDS[k]['dur']
        vox.append(f'<audio id="vo{k[1]}" class="clip" src="assets/voice/{k}.wav" data-start="{t:.2f}" data-duration="{d:.3f}" data-volume="1.25" data-track-index="10" data-audio-group="voiceover"></audio>')
        pts += [(t - 0.15, 0.34), (t - 0.02, 0.15), (t + d - 0.05, 0.15), (t + d + 0.2, 0.34)]
    pts = sorted(dict((round(a, 3), v) for a, v in pts if 0 <= a <= DUR).items())
    clean = []
    for t, v in pts:   # between two close lines stay ducked
        clean.append({'t': t, 'v': v})
    auto = json.dumps({'version': 1, 'lanes': [{'target': 'volume', 'points': clean}]}).replace('"', '&quot;')
    fx = json.dumps({'version': 1, 'nodes': [{'type': 'limiter', 'id': 'lim', 'params': {'limit': -1}}]}).replace('"', '&quot;')
    music = (f'<audio id="music" class="clip" src="assets/music/cyberpunk_beat.mp3" data-start="0" data-duration="{DUR}" data-volume="1.25" '
             f'data-fade-in="0.4" data-fade-out="1.5" data-track-index="11" data-fx-chain="{fx}" data-automation="{auto}"></audio>')
    hosts = [
        f'<div id="phone" data-composition-id="phone" data-composition-src="compositions/phone.html" data-start="0" data-duration="{PHONE_END}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index:5"></div>',
        f'<div id="cta" data-composition-id="cta" data-composition-src="compositions/cta.html" data-start="{PHONE_END}" data-duration="{DUR - PHONE_END:.2f}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index:5"></div>',
        f'<div id="heads" data-composition-id="heads" data-composition-src="compositions/heads.html" data-start="0" data-duration="{PHONE_END}" data-track-index="2" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index:6"></div>',
        f'<div id="caps" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="{PHONE_END}" data-track-index="3" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index:7"></div>']
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
      #bg {{ position:absolute; inset:0; z-index:0; background:
          linear-gradient(90deg, rgba(40,230,255,0.55) 0px, rgba(40,230,255,0.12) 60px, rgba(40,230,255,0) 140px),
          linear-gradient(270deg, rgba(255,45,200,0.55) 0px, rgba(255,45,200,0.12) 60px, rgba(255,45,200,0) 140px), #05060f; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
      <div id="bg"></div>
      <img id="bg-room" src="assets/img/lounge_puffs.png" style="position:absolute;left:-60px;top:1270px;width:1200px;height:650px;object-fit:cover;opacity:0.32;z-index:1;-webkit-mask-image:linear-gradient(transparent 0,#000 220px);mask-image:linear-gradient(transparent 0,#000 220px)">
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
</html>'''
    open(P('index.html'), 'w').write(html)

if __name__ == '__main__':
    phone(); heads(); caps(); cta(); root()
    print('taps:', [(round(t, 2), n) for t, n, *_ in TAPS]); print('screens:', [(n, round(t, 2)) for n, t in SEQ])
