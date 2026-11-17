// Timeline (seconds) — 90 BPM, 4/4: one beat = 0.6667 s, one bar = 2.6667 s. Cuts land on downbeats.
export const BPM = 90, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;   // bar(1) = 0
export const DUR = 96.5;
export const SHOTS = [
  { id: 'cityWide', a: 0, b: bar(5) },                // 10.67  — the town falls asleep
  { id: 'street', a: bar(5), b: bar(9) },             // 21.33  — an impossible sound
  { id: 'barber', a: bar(9), b: bar(13) },            // 32.0   — the barbershop
  { id: 'corridor', a: bar(13), b: bar(17) },         // 42.67  — the unknown door
  { id: 'start', a: bar(17), b: bar(20) },            // 50.67  — press start
  { id: 'reveal', a: bar(20), b: bar(24) },           // 61.33  — welcome to Pixel Zone
  { id: 'guardian', a: bar(24), b: bar(27, 3) },      // 69.33
  { id: 'react', a: bar(27, 3), b: bar(29) },         // 74.67
  { id: 'handoff', a: bar(29), b: bar(30, 3) },       // 78.67  — player 2 connected
  { id: 'duo', a: bar(30, 3), b: bar(33) },           // 85.33
  { id: 'secret', a: bar(33), b: bar(35) },           // 90.67  — the secret revealed
  { id: 'logo', a: bar(35), b: DUR },
];
export const SET_OF = { cityWide: 'city', street: 'city', barber: 'barber', corridor: 'barber', start: 'barber', secret: 'barber', reveal: 'room', guardian: 'room', react: 'room', handoff: 'room', duo: 'room' };
export const T = {
  boot: 14.25, turn: 15.0, glow: 14.4,
  enter: bar(9) + .2, laugh: 27.6,
  heart: bar(13), voice: 37.2,
  ui1: bar(17) + .6, ui2: bar(17) + 1.6, touch: 47.9, flash: 48.05,
  reveal: bar(20), visor: bar(24) + .5, p2: bar(30), logo: bar(35),
};
// Narration (sub) and dialogue (dlg) — t = start; durations in voices/dur.json
export const VO = [
  { id: 'n1', t: 3.5, sub: 'Toda cidade guarda segredos. Alguns estão escondidos à vista de todos.' },
  { id: 'h1', t: 16.1, dlg: true, who: 'ELE', sub: 'Espera… que som foi esse?' },
  { id: 'h2', t: 24.4, dlg: true, who: 'ELE', sub: 'Olá? Tem alguém aí?' },
  { id: 'l0', t: 37.3, dlg: true, who: '???', sub: 'Ainda tem lugar pra mais um…', muffled: true },
  { id: 'h3', t: 49.2, dlg: true, who: 'ELE', sub: 'Que lugar é este?' },
  { id: 'h4', t: 53.6, dlg: true, who: 'ELE', sub: 'Uau…' },
  { id: 'l1', t: 62.7, dlg: true, who: 'LAGZILLA', sub: 'Até que enfim. Achei que você ia ficar aí fora pra sempre.' },
  { id: 'h5', t: 69.6, dlg: true, who: 'ELE', sub: 'Tu… falas?' },
  { id: 'l2', t: 72.5, dlg: true, who: 'LAGZILLA', sub: 'E jogo melhor que você. Quer descobrir?' },
  { id: 'l3', t: 81.6, dlg: true, who: 'LAGZILLA', sub: 'Bem-vindo ao Pixel Zone.' },
  { id: 'n2', t: 85.6, sub: 'Alguns lugares não se encontram. Descobrem-se.' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const BUILD = [];
