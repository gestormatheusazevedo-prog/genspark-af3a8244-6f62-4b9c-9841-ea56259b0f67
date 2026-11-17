"""Subtitle cues for the .srt, from the same data that drives the overlay (events.json VO times, voices/dur.json, lines.json text)."""
import json, os, sys
H = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [e for e in json.load(open(os.path.join(H, 'events.json')))['ev'] if e['type'] == 'vo']
D = json.load(open(os.path.join(H, 'voices/dur.json'))); TXT = {l['id']: l['text'] for l in json.load(open(os.path.join(H, 'lines.json')))}
cues = []
for e in ev:
    d = D[e['id']]
    if e.get('dlg'): cues.append({'t0': round(e['t'] - .3, 2), 't1': round(e['t'] + max(d + 1.5, 2.6), 2), 'text': '— ' + TXT[e['id']]})
    else: cues.append({'t0': round(e['t'] - .35, 2), 't1': round(e['t'] + max(d + .6, 1.8), 2), 'text': TXT[e['id']]})
json.dump(cues, open(os.path.join(H, 'out/cues.json'), 'w'), ensure_ascii=False, indent=1)
print(len(cues), 'cues')
