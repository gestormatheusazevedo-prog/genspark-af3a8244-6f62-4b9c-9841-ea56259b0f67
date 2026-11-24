#!/usr/bin/env python3
"""Search and download openly licensed audio from Openverse (api.openverse.org), keeping the licence of every file.

  python3 openverse.py search "whoosh" [--n 10] [--source freesound] [--max-dur 5] [--any-license]
  python3 openverse.py get <id> [<id> ...] --out sfx/        # downloads + appends sfx/CREDITS.json and sfx/CREDITS.txt

Default filter: licences that allow commercial use (CC0, PDM, BY, BY-SA). Use --any-license to see everything.
"""
import argparse, json, os, sys, urllib.parse, urllib.request

API = 'https://api.openverse.org/v1/audio/'
UA = {'User-Agent': 'openverse-skill/1.0'}

def call(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return json.load(r)

def search(a):
    q = {'q': a.query, 'page_size': a.n}
    if not a.any_license: q['license_type'] = 'commercial'
    if a.source: q['source'] = a.source
    d = call(API + '?' + urllib.parse.urlencode(q))
    print(f"{d.get('result_count')} results for {a.query!r}")
    for r in d['results']:
        dur = (r.get('duration') or 0) / 1000
        if a.max_dur and dur and dur > a.max_dur: continue
        print(f"{r['id']}  {dur:5.1f}s  {r['license']:<6} {r['source']:<10} {r['title'][:50]}  ({r.get('creator') or '?'})")

def credit_line(r):
    lic = f"CC {r['license'].upper()} {r.get('license_version') or ''}".strip() if r['license'] not in ('cc0', 'pdm') else r['license'].upper()
    return f"\"{r['title']}\" by {r.get('creator') or 'unknown'} ({r.get('foreign_landing_url')}), {lic} ({r.get('license_url')})"

def get(a):
    os.makedirs(a.out, exist_ok=True)
    man_p = os.path.join(a.out, 'CREDITS.json')
    man = json.load(open(man_p)) if os.path.exists(man_p) else []
    for i in a.ids:
        r = call(API + i + '/')
        ext = os.path.splitext(urllib.parse.urlparse(r['url']).path)[1] or '.mp3'
        fn = f"{r['source']}_{i[:8]}{ext}"
        with urllib.request.urlopen(urllib.request.Request(r['url'], headers=UA), timeout=60) as src, open(os.path.join(a.out, fn), 'wb') as f:
            f.write(src.read())
        entry = {k: r.get(k) for k in ('id', 'title', 'creator', 'license', 'license_version', 'license_url',
                                       'foreign_landing_url', 'url', 'source', 'duration')}
        entry['file'] = fn; entry['attribution'] = credit_line(r)
        man = [m for m in man if m['id'] != i] + [entry]
        print('saved', fn, '|', entry['attribution'])
    json.dump(man, open(man_p, 'w'), ensure_ascii=False, indent=1)
    with open(os.path.join(a.out, 'CREDITS.txt'), 'w') as f:
        f.write('\n'.join(m['attribution'] for m in man) + '\n')

p = argparse.ArgumentParser(); sp = p.add_subparsers(dest='cmd', required=True)
s = sp.add_parser('search'); s.add_argument('query'); s.add_argument('--n', type=int, default=10)
s.add_argument('--source'); s.add_argument('--max-dur', type=float); s.add_argument('--any-license', action='store_true')
g = sp.add_parser('get'); g.add_argument('ids', nargs='+'); g.add_argument('--out', default='sfx')
a = p.parse_args(); search(a) if a.cmd == 'search' else get(a)
