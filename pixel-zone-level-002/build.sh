#!/bin/sh
# Pixel Zone — Level 002: A Porta Que Ninguém Conhecia — one command from source to film.
# Needs the Lemo-Opuscar library with the core + voice tiers (setup.sh deps voice), network for edge-tts,
# and ffmpeg 7+ on PATH for the master. Software WebGL (no GPU): LEMO_ANGLE=swiftshader.
set -e
LIB=/root/lemo-opuscar
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/mix.py"
# 1. voice (edge-tts through the HTTPS proxy when one is set) + speech check
"$PY" "$HERE/tools/tts_proxy.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$HERE/tools/tts_proxy.py" "$HERE/crowd.json" "$HERE/voices/crowd"
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang pt --model large-v3
# 2. timeline → events, reading-time check
node core/render/events.mjs "$HERE" --size 1080x1920 --q textonly=1
node core/render/readcheck.mjs "$HERE" --size 1080x1920 --q textonly=1 --step 0.05
# 3. picture (ss = supersampling; 1 is enough for pixel art, 1.5 for smoother edges)
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --q "ss=${SS:-1}" --out "$HERE/out/video.mp4"
# 4. score + foley + voice → mix; subtitles
"$PY" "$HERE/mix.py"
python3 "$HERE/tools/cues.py" && "$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/pixel-zone-level-002.srt"
# 5. master (−14 LUFS), poster
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/pixel-zone-level-002.mp4" 24 0
ffmpeg -y -loglevel error -ss 79.5 -i "$HERE/pixel-zone-level-002.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done → $HERE/pixel-zone-level-002.mp4"
