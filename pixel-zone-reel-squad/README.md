# Pixel Zone · "Qual é o seu squad?"

Reel de 21,5 s, 1080×1920, 30 fps. É uma tela de seleção de personagens feita em código: 4 tipos de amigo com barras de atributo, o Lagzilla como personagem secreto, o "squad completo" sobre a foto do lounge e o CTA para marcar o squad.

`python3 tools/tts.py` gera a narração (edge-tts; textos e tempos em `lines.json`). `python3 build.py` monta o vídeo. Precisa de numpy, Pillow e ffmpeg. A fonte é a Barlow Condensed (OFL, `fonts/OFL.txt`).

Gancho: "4 amigos. 1 consola. Qual é o seu squad?" (ig-reel: 50.6 OK, 2,9 s).

| Tempo | Tela | Narração |
|---|---|---|
| 0–3 s | 4 AMIGOS / 1 CONSOLA / QUAL É O SEU SQUAD? + slots | 4 amigos. 1 consola. Qual é o seu squad? |
| 3–6 s | P1 · O CULPA-O-COMANDO · Desculpas 99 · Habilidade 12 | Player 1 perdeu? A culpa é do comando. |
| 6–8 s | P2 · PRIMEIRO OU NADA · Ego 99 · Paciência 3 | O 2 só joga se for o primeiro. |
| 8–10,5 s | P3 · O "SÓ MAIS UMA" · Jogando há 3:00:00 | O 3 tá no "só mais uma" há três horas. |
| 10,5–13,3 s | P4 · O DOS SNACKS · Lendário | O 4 paga os snacks. Segura esse. |
| 13,3–16 s | DESBLOQUEADO! Lagzilla · Culpa o lag 99 | Desbloqueado: Lagzilla, que culpa o lag. |
| 16–19,7 s | SQUAD COMPLETO · 6 € / hora por consola · até 4 jogadores | Squad completo, 6 euros a hora por consola. |
| 19,7–21,5 s | MARCA O SEU SQUAD · Reserva no link da bio | Marca o seu squad. |
