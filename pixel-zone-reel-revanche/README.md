# Pixel Zone · "Seu próximo adversário já tá online"

20 s Reel, 1080×1920, 30 fps. Built from the supplied keyframes (`frames/`) and sprite sheets (`sprites/`). No new footage.

`python3 tools/tts.py` generates the narration into `voices/` (edge-tts, texts and timings in `lines.json`). `python3 build.py` composites the motion, synthesises the score and SFX, and writes `pixel-zone-reel-revanche.mp4` plus `poster.jpg`. Needs numpy, Pillow and ffmpeg.

| Tempo | Motion | Som |
|---|---|---|
| 0–3 s | Fade-in, `PLAYER 1` acende, `PLAYER 2` pisca, alerta "!" | bip de menu, blips |
| 3–6 s | Chat chega com tremor, glitch só em "revanche" | vibração, pop, glitch |
| 6–10 s | Lagzilla entra de lado (push), punch na provocação, zoom na cara, clique | **a batida para**, impacto, "bwip", riser |
| 10–15 s | Onda de pixels, card `PLAYER 2 · A ENTRAR… → PRONTO`, transição em pixels para as fotos, zoom de profundidade, preço | drop + arpejo, **som de confirmação** |
| 15–20 s | REVANCHE, cursor desliza para RESERVAR HORÁRIO, botão fica selecionado + anel de clique | hover ticks, confirmação final |

## Narração

| Entra | Voz | Fala |
|---|---|---|
| 0.3 s | Narrador | Cadê o player dois? |
| 3.95 s | Amigo (filtro de chat) | Se eu perder, quero revanche. |
| 7.3 s | Lagzilla (grave, mais lento) | Já tá negociando a derrota? |
| 11.3 s | Narrador | Seis euros a hora por consola. Até quatro jogadores. |
| 15.25 s | Narrador | Manda pra quem vai pedir revanche. |
| 18.3 s | Narrador | Reserva no link da bio. |

A música abaixa automaticamente sob as falas.
