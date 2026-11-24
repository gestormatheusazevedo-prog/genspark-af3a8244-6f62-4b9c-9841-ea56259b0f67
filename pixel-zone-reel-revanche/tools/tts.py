"""Generate voices/<id>.wav (44.1 kHz mono) for every line in lines.json with edge-tts.
Usage: python3 tools/tts.py   (needs: pip install edge-tts; uses HTTPS_PROXY if set)"""
import asyncio, json, os, subprocess
import edge_tts
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
px = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
async def one(l):
    mp3 = os.path.join(HERE, 'voices', l['id'] + '.mp3'); wav = mp3[:-4] + '.wav'
    await edge_tts.Communicate(l['text'], l['voice'], rate=l['rate'], pitch=l['pitch'], proxy=px).save(mp3)
    # trim leading/trailing silence
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                    '-ar', '44100', '-ac', '1', wav], check=True)
    os.remove(mp3)
async def main():
    for l in json.load(open(os.path.join(HERE, 'lines.json'))): await one(l)
asyncio.run(main())
