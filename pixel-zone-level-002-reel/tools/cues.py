"""Subtitle cues for the .srt, from the same data that drives the overlay (events.json VO times, voices/dur.json, lines.json text).
The arcade announcer lines (YOU LOSE / TRY AGAIN / YOU WIN) are on screen as cards and are subtitled too."""
import json, os
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = json.load(open(os.path.join(H, 'events.json'))); ev = [e for e in EV['ev'] if e['type'] == 'vo']
D = json.load(open(os.path.join(H, 'voices/dur.json'))); TXT = {l['id']: l['text'] for l in json.load(open(os.path.join(H, 'lines.json')))}
subs = [e for e in ev if not e.get('ann') and not e.get('dlg')]
cues = []
for e in ev:
    d = D[e['id']]
    if e.get('ann'): t1 = e['t'] + d + .2
    elif e.get('dlg'): t1 = e['t'] + d + .6
    else:
        i = subs.index(e); nx = subs[i + 1] if i + 1 < len(subs) else None
        t1 = max(e['t'] + d + .25, min(nx['t'] - .12, e['t'] + d + 1.6) if nx else EV['dur'])
    cues.append({'t0': round(e['t'] - .1, 2), 't1': round(t1, 2), 'text': ('— ' if e.get('dlg') else '') + TXT[e['id']]})
json.dump(cues, open(os.path.join(H, 'out/cues.json'), 'w'), ensure_ascii=False, indent=1)
print(len(cues), 'cues')
