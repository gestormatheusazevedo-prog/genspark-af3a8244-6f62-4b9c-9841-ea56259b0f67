// Pixel Zone · Side Quest 01 — "Player 2 Entrou". 120 BPM: one bar = 2 s = one take.
export const BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;   // bar(1) = 0
export const DUR = 34;
export const SHOTS = [
  { id: 'tv1', a: 0, b: 2 },        // 1  YOU LOSE · 5–0
  { id: 'face', a: 2, b: 4 },       // 2  contrapicado, cara de derrota
  { id: 'door', a: 4, b: 6 },       // 3  ◀◀ 10 MIN ANTES — a porta abre
  { id: 'ots', a: 6, b: 8 },        // 4  por cima do ombro: todos olham
  { id: 'top', a: 8, b: 10 },       // 5  zenital: o último comando
  { id: 'sofa', a: 10, b: 12 },     // 6  lateral: alguém senta do lado
  { id: 'two', a: 12, b: 14 },      // 7  frontal a dois: "Segura o botão assim, ó."
  { id: 'hands', a: 14, b: 16 },    // 8  macro das mãos: TRY AGAIN
  { id: 'crane', a: 16, b: 18 },    // 9  por trás, grua: mesmo jogo, mesma TV
  { id: 'goal', a: 18, b: 20 },     // 10 GOOOL
  { id: 'orbit', a: 20, b: 22 },    // 11 YOU WIN — a sala explode
  { id: 'exit', a: 22, b: 24 },     // 12 sai com 3 amigos
  { id: 'lvl', a: 24, b: 26 },      // 13 LEVEL UP
  { id: 'logo', a: 26, b: 30 },     // 14 logo + Lagzilla: reserva pelo link na bio
  { id: 'final', a: 30, b: DUR },   // 15 PLAY AGAIN? (loop)
];
export const T = { doorOpen: 4.15, rewind: 4.0, grab: 8.7, vetUp: 10.2, vetSit: 11.6, tip: 12.3, combo: 14.4, goal: 18.55, win: 20.1, exit: 22.0, lvl: 24.35, lag: 26.6, cta: 27.4, again: 30.4 };
// Narration (Lagzilla, sub), dialogue (dlg) and the arcade announcer (ann: shown as the big cards, not subtitled)
export const VO = [
  { id: 'a1', t: 0.1, ann: true },
  { id: 'z1', t: 0.95, sub: '5 a 0 no Pixel Zone.' },
  { id: 'z2', t: 4.15, sub: 'Entrou sozinho.' },
  { id: 'z3', t: 6.1, sub: '0 amigos aqui dentro.' },
  { id: 'z4', t: 8.1, sub: 'Pegou o único comando que sobrou.' },
  { id: 'z5', t: 10.0, sub: 'Aí alguém sentou do lado dele.' },
  { id: 'v1', t: 12.15, dlg: true, who: 'VETERANO', sub: 'Segura o botão assim, ó.' },
  { id: 'a2', t: 14.15, ann: true },
  { id: 'z7', t: 16.1, sub: 'Mesmo jogo, mesma TV.' },
  { id: 'z8', t: 18.2, sub: 'Gol no último minuto.' },
  { id: 'a3', t: 20.15, ann: true },
  { id: 'z10', t: 22.05, sub: 'Entrou sozinho. Saiu com 3 amigos.' },
  { id: 'z11', t: 25.55, sub: 'Se quer viver isso, vem conhecer o Pixel Zone.' },
  { id: 'z12', t: 28.75, sub: 'Reserva pelo link na bio.', hide: true },
  { id: 'z13', t: 30.5, sub: 'No Pixel Zone, ninguém perde sozinho.' },
];
// XP pop-ups (the like / comment / follow / share mechanic, drawn in the HUD): [t, xp, icon, label]
export const XP = [
  [2.6, 10, 'heart', 'CURTIDA'], [5.2, 10, 'heart', 'CURTIDA'], [7.4, 25, 'chat', 'COMENTÁRIO'], [11.2, 50, 'user', 'NOVO SEGUIDOR'],
  [13.2, 10, 'heart', 'CURTIDA'], [15.3, 25, 'chat', 'COMENTÁRIO'], [17.2, 100, 'share', 'PARTILHA'],
  [20.5, 10, 'heart', 'CURTIDA'], [20.85, 50, 'user', 'NOVO SEGUIDOR'], [21.2, 100, 'share', 'PARTILHA'],
  [22.5, 500, 'trophy', 'PRIMEIRO SQUAD'],
];
export const XPMAX = 1000;
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
