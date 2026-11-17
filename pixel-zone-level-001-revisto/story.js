// Pixel Zone — Level 001: O Começo (roteiro revisto). Timeline in seconds; 90 BPM grid (bar = 2.667 s), cuts on beats.
export const BPM = 90, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;   // bar(1) = 0
export const DUR = 110.5;
export const SHOTS = [
  // 1 — Era só um corte de cabelo
  { id: 'clip', a: 0, b: 4.0 },
  { id: 'mirror', a: 4.0, b: bar(6) },                // 13.33
  // 2 — A oportunidade
  { id: 'talk', a: bar(6), b: bar(10) },              // 24.0
  { id: 'flash', a: bar(10), b: 28.0 },
  { id: 'nod', a: 28.0, b: bar(12) },                 // 29.33
  // 3 — Nasce uma parceria
  { id: 'pitchA', a: bar(12), b: bar(14) },           // 34.67
  { id: 'shake', a: bar(14), b: bar(17) },            // 42.67
  // 4 — Mas tinha um problema
  { id: 'night', a: bar(17), b: bar(18) },            // 45.33
  { id: 'phone', a: bar(18), b: 48.67 },
  { id: 'face', a: 48.67, b: bar(20, 3) },            // 52.0
  // 5 — Cada turno, um passo
  { id: 'pizza1', a: 52.0, b: 54.67 },
  { id: 'save', a: 54.67, b: 56.0 },
  { id: 'build1', a: 56.0, b: 58.67 },
  { id: 'pizza2', a: 58.67, b: 60.0 },
  { id: 'build2', a: 60.0, b: 62.67 },
  { id: 'pizza3', a: 62.67, b: 64.0 },
  { id: 'build3', a: 64.0, b: 65.33 },
  // 6 — A sala ganha vida
  { id: 'alive', a: 65.33, b: 77.33 },
  // 7 — 17 de agosto
  { id: 'opening', a: 77.33, b: 86.67 },
  // 8 — O verdadeiro significado
  { id: 'belong', a: 86.67, b: 91.0 },
  { id: 'cbIdea', a: 91.0, b: 92.6 },
  { id: 'cbEmpty', a: 92.6, b: 94.3 },
  { id: 'cbWork', a: 94.3, b: 95.9 },
  { id: 'cbFull', a: 95.9, b: 103.5 },
  { id: 'logo', a: 103.5, b: DUR },
];
export const SET_OF = {
  clip: 'barber', mirror: 'barber', talk: 'barber', nod: 'barber',
  flash: 'home', night: 'home', phone: 'home', face: 'home', save: 'home', cbIdea: 'home',
  pitchA: 'room', shake: 'room', build1: 'room', build2: 'room', build3: 'room', alive: 'room', opening: 'room', belong: 'room', cbEmpty: 'room', cbFull: 'room',
  pizza1: 'pizza', pizza2: 'pizza', pizza3: 'pizza', cbWork: 'pizza',
};
export const T = {
  enter: 30.0, holo0: 32.2, holo1: 36.4, shake: 38.6, silence: bar(17),
  lightsOn: bar(27), doorOpen: 78.2, date: 77.7, lag: 88.4, logo: 103.5,
};
export const BUILD = [];
// Narration (sub) and dialogue (dlg) — t = start; durations in voices/dur.json
export const VO = [
  { id: 'n1', t: 1.2, sub: 'Engraçado como algumas das maiores mudanças da nossa vida começam nos momentos mais comuns.' },
  { id: 'n1b', t: 8.4, sub: 'Naquele dia, eu só tinha ido cortar o cabelo.' },
  { id: 'l1', t: 13.7, dlg: true, who: 'LUCAS', sub: 'Estou à procura de alguém para alugar a sala lá atrás.' },
  { id: 'f1', t: 19.5, dlg: true, who: 'FUNDADOR', sub: 'Eu tenho uma ideia que pode funcionar ali.' },
  { id: 'n2', t: 24.8, sub: 'Era um projeto que eu já tinha na cabeça há algum tempo.' },
  { id: 'n3', t: 30.2, sub: 'Apresentei a ideia ao Lucas. E o que era apenas uma possibilidade começou a tornar-se real.' },
  { id: 'n4', t: 46.0, sub: 'Mas tinha um problema… eu não tinha dinheiro.' },
  { id: 'n5', t: 52.5, sub: 'Então continuei a trabalhar como garçom numa pizzaria. Cada turno era mais um passo. Cada equipamento comprado, uma parte daquele sonho a sair do papel.' },
  { id: 'n6', t: 67.4, sub: 'Até que, um dia, olhei para aquela sala… e percebi que aquilo que antes só existia na minha cabeça estava mesmo ali.' },
  { id: 'n7', t: 78.0, sub: 'No dia 17 de agosto, abrimos as portas. E finalmente outras pessoas começaram a viver aquele sonho comigo.' },
  { id: 'n8a', t: 91.15, sub: 'Começou com uma ideia.' },
  { id: 'n8b', t: 92.75, sub: 'Uma sala vazia.' },
  { id: 'n8c', t: 94.45, sub: 'E muito trabalho.' },
  { id: 'n8d', t: 96.3, sub: 'Hoje, cada pessoa que entra aqui faz parte de algo que eu nunca conseguiria construir sozinho.' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
