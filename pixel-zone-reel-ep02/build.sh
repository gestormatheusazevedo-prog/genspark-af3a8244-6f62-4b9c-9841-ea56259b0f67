#!/bin/sh
# Pixel Zone · Safe Zone 01 — "O Dia Dele" — one command from source to film (see ../pixel-zone-reel-ep01/build.sh for the requirements).
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
PY="$LIB/.venv/bin/python"
cd "$LIB"
"$PY" "$HERE/tools/tts_proxy.py" "$HERE/lines.json" "$HERE/voices"
node core/render/events.mjs "$HERE" --size 1080x1920 --q textonly=1
node core/render/readcheck.mjs "$HERE" --size 1080x1920 --q textonly=1 --step 0.05 || true
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --q "ss=${SS:-1}" --out "$HERE/out/video.mp4"
LIB="$LIB" "$PY" "$HERE/mix.py"
python3 "$HERE/tools/cues.py" && "$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/pixel-zone-reel-ep02.srt"
ffmpeg -y -loglevel error -i "$HERE/out/mix.wav" -af "alimiter=limit=0.5:attack=3:release=60:level=disabled,volume=4dB" -ar 48000 "$HERE/out/mix_lim.wav"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix_lim.wav" "$HERE/pixel-zone-reel-ep02.mp4" 24 0
ffmpeg -y -loglevel error -ss 32.2 -i "$HERE/pixel-zone-reel-ep02.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done → $HERE/pixel-zone-reel-ep02.mp4"
