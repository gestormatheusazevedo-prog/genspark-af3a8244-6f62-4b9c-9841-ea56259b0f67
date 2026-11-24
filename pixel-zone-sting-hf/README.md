# Pixel Zone · vinheta "Dois players. Uma conexão." — ANIMATIC

Animatic (ritmo e transições reais, acabamento provisório) para aprovar o movimento antes do acabamento.
Vertical 1080x1920, 60 fps.

- `animatic-abertura.mp4` (4,6 s): vinheta de 1,6 s sobre o início do Reel do squad; o espaço entre os traços revela o vídeo, que continua.
- `animatic-encerramento.mp4` (2,45 s): sobre o fim do tutorial; os traços recolhem o vídeo e fixam a logo.
- `*-lento.mp4`: as mesmas a 0,4x, para ver cada movimento.

| Tempo | Momento | Movimento | Som |
|---|---|---|---|
| 0,00 | Provocação | o ciano atravessa a diagonal da marca num corte rápido, deixando um recorte preto no vídeo; pontilhado só na arrancada | sinal ciano (agudo) |
| 0,09–0,31 | Resposta | o magenta aparece atrasado no canto, some e arranca por trás, acelera e alcança o ciano; recorte branco | sinal magenta (grave) |
| 0,45 · 0,57 | Disputa | duas trocas secas (0,045 s) com micro-pausas, rastros curtos; câmera aproxima a cada troca; o fundo vira preto com recortes magenta e ciano | estalo de cada player |
| 0,67–0,75 | Encontro | os dois deslizam para a diagonal da marca e encaixam | **confirmação** (duas notas + impacto + sub) |
| 0,75–0,89 | Expansão | o encaixe dispara uma forma branca que ocupa a tela; a máscara preta abre por cima revelando PIXEL ZONE gigante; pixels e pontilhado só aqui | |
| 0,88–1,05 | Identidade | o nome encolhe até a logo, os traços assumem as posições acima e abaixo; cunhas ciano e magenta nos cantos | |
| 1,35–1,6 | Passagem | abertura: o espaço entre os traços abre e revela o vídeo; os traços viram as bordas e saem. Encerramento: fixa a logo | whoosh |

Gerar: `python3 tools/animatic.py intro|outro`, depois o render do HyperFrames com `--fps 60`.
Sons: Earshot (todos aprovados no `earshot sfx check`). Logo: barras redesenhadas em vetor a partir da logo real; nome ampliado da logo real.

Pendente para o acabamento (depois da aprovação do ritmo): contraste do primeiro recorte preto sobre vídeos escuros,
desenho final do pontilhado/pixels, curva exata das trocas e versão 16:9 se for preciso.
