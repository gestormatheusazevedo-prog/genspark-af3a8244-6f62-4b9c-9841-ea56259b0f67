#!/bin/sh
# Pixel Zone · Side Quest 01 — "Player 2 Entrou" — one command from source to film.
# Needs the Lemo-Opuscar library with the core + voice tiers, network for edge-tts, ffmpeg 7+ on PATH for the master.
# Software WebGL (no GPU): LEMO_ANGLE=swiftshader.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
# 1. voices (Lagzilla pt-BR, the veteran pt-PT, the arcade announcer en-US) + speech check
"$PY" "$HERE/tools/tts_proxy.py" "$HERE/lines.json" "$HERE/voices"
# 2. timeline → events, reading-time check
node core/render/events.mjs "$HERE" --size 1080x1920 --q textonly=1
node core/render/readcheck.mjs "$HERE" --size 1080x1920 --q textonly=1 --step 0.05 || true
# 3. picture
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --q "ss=${SS:-1}" --out "$HERE/out/video.mp4"
# 4. chiptune score + foley + voices → mix; subtitles
LIB="$LIB" "$PY" "$HERE/mix.py"
python3 "$HERE/tools/cues.py" && "$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/pixel-zone-reel-ep01.srt"
# 5. master (−14 LUFS), poster
ffmpeg -y -loglevel error -i "$HERE/out/mix.wav" -af "alimiter=limit=0.5:attack=3:release=60:level=disabled,volume=4dB" -ar 48000 "$HERE/out/mix_lim.wav"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix_lim.wav" "$HERE/pixel-zone-reel-ep01.mp4" 24 0
ffmpeg -y -loglevel error -ss 20.6 -i "$HERE/pixel-zone-reel-ep01.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done → $HERE/pixel-zone-reel-ep01.mp4"
