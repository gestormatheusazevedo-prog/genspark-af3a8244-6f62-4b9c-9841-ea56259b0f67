# Pixel Zone · "Qual é o seu squad?" (HyperFrames)

Remake do Reel do squad em HyperFrames: 24 s, 1080x1920, 30 fps. Arquivo final: `pixel-zone-reel-squad-hf.mp4`.

- Cenas: `compositions/*.html`, geradas por `python3 tools/gen.py` (tempos a partir da narração e de `assets/words.json`).
- Narração: edge-tts (pt-BR-AntonioNeural), conferida com Whisper (faster-whisper small).
- Efeitos: Earshot (`assets/sfx`, banco de motion design, todos aprovados no `earshot sfx check`).
- Música: Openverse/Freesound, "Circuit Synthwave" por Doctor_Dreamchip, CC0 (`assets/music/CREDITS.txt`).
- Fonte: Barlow Condensed (OFL). GSAP local em `assets/vendor` (a rede bloqueia o CDN).

Render: `node <skills>/hyperframes/scripts/plugin-cli.mjs render -q delivery -o pixel-zone-reel-squad-hf.mp4`
(com `PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium`). Ver `SPEC.md` e `REVIEW.md`.
