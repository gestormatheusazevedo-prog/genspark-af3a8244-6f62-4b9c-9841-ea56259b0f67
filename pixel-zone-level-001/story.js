// Timeline (seconds) — 72 BPM, 4/4: one beat = 0.8333 s, one bar = 3.3333 s. Cuts land on downbeats.
export const BPM = 72, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;   // bar(1) = 0
export const DUR = 93.0;
export const SHOTS = [
  { id: 'cityWide', a: 0, b: 5.0 },
  { id: 'cityTrack', a: 5.0, b: bar(4) },              // 10.0
  { id: 'door', a: bar(4), b: 14.5 },
  { id: 'bulb', a: 14.5, b: bar(7) },                 // 20.0
  { id: 'desk', a: bar(7), b: bar(10) },              // 30.0
  { id: 'build', a: bar(10), b: bar(14) },            // 43.33
  { id: 'alone', a: bar(14), b: bar(17) },            // 53.33
  { id: 'player1', a: bar(17), b: bar(20) },          // 63.33
  { id: 'full', a: bar(20), b: 67.5 },
  { id: 'tv', a: 67.5, b: 69.25 },
  { id: 'handoff', a: 69.25, b: bar(22, 3) },         // 71.67
  { id: 'fullB', a: bar(22, 3), b: bar(23) },         // 73.33
  { id: 'epiph', a: bar(23), b: bar(26) },            // 83.33
  { id: 'invite', a: bar(26), b: bar(27) },           // 86.67
  { id: 'logo', a: bar(27), b: DUR },
];
export const SET_OF = { cityWide: 'city', cityTrack: 'city', door: 'room', bulb: 'room', desk: 'room', build: 'room', alone: 'room', player1: 'room', full: 'room', tv: 'room', handoff: 'room', fullB: 'room', epiph: 'room', invite: 'room' };
export const T = {
  doorOpen: bar(4) + .15, bulbOn: 15.55, plan0: 20.6, holo: [bar(8, 3), bar(8, 4), bar(9, 1), bar(9, 2), bar(9, 3)],
  lightsOn: bar(13, 3),                                   // 41.67
  bell: bar(17), door2: bar(17) + .35, p1joined: bar(19, 3), give: 61.0,
  goal: 68.15, lag: bar(24), sparkle: bar(24) - .15, logo: bar(27),
};
// Construction pops in the build scene (one per beat, from bar 10 beat 2)
export const BUILD = ['rug', 'tvA', 'conA', 'tvB', 'conB', 'tvC', 'conC', 'bag0', 'bag1', 'bag2', 'bag3', 'bag4', 'bag5', 'ledL', 'ledR', 'sign', 'plant'].map((id, i) => ({ id, t: bar(10, 2) + i * BEAT * .75 }));
// Narration (t = start); durations in voices/dur.json
export const VO = [
  { id: 'n1', t: 4.25, sub: 'Há algum tempo, tive uma ideia.' },
  { id: 'n2', t: 6.85, sub: 'Criar um lugar onde jogar fosse apenas o começo.' },
  { id: 'n3', t: 11.2, sub: 'Não era um espaço enorme. Não tinha nada de extraordinário.' },
  { id: 'n4', t: 16.35, sub: 'Mas eu conseguia imaginar o que ele poderia ser.' },
  { id: 'n5', t: 21.1, sub: 'Comecei com o que tinha. Uma ideia, alguns planos e a vontade de fazer acontecer.' },
  { id: 'n6', t: 31.3, sub: 'Cada peça que chegava, cada detalhe que ficava pronto… fazia aquele sonho parecer um pouco mais real.' },
  { id: 'n7', t: 45.0, sub: 'Mas havia uma coisa que eu não podia construir sozinho.' },
  { id: 'n8', t: 49.7, sub: 'As histórias que aconteceriam aqui.' },
  { id: 'd1', t: 56.1, dlg: true, who: 'JOGADOR', sub: 'Dá pra jogar?' },
  { id: 'd2', t: 58.95, dlg: true, who: 'FUNDADOR', sub: 'Claro. Entra aí!' },
  { id: 'n9', t: 64.1, sub: 'E então começaram a chegar pessoas.' },
  { id: 'n10', t: 67.75, sub: 'Vieram jogar, competir, rir… e criar memórias.' },
  { id: 'n11', t: 73.9, sub: 'Foi aí que entendi.' },
  { id: 'n12', t: 75.9, sub: 'Eu não tinha criado apenas um lugar para jogar.' },
  { id: 'n13', t: 79.5, sub: 'Tinha criado um lugar para pertencer.' },
  { id: 'n14', t: 83.65, sub: 'E esta aventura… está só a começar.' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
