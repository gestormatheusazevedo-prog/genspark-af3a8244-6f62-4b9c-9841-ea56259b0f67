// Level 002 — "A Porta Que Ninguém Conhecia", re-cut as a Reel: a new angle every 2 s.
// The sets still play the original timeline (story.js, "source time"); this file maps output time → source time
// and picks a camera for every slot. Dead time between runs is cut out.
// slot: [out start, source start, duration, camera]   camera: orig | close | low | high | side | ots
const RUNS = [
  [[0, 37.1, 2, 'orig']],                                                   // hook: the door, the voice behind it
  [[2, 2.0, 2, 'orig'], [4, 4.0, 2, 'high'], [6, 6.0, 2, 'low'], [8, 8.0, 2, 'close']],   // the town falls asleep (n1)
  [[10, 13.6, 2, 'orig'], [12, 15.6, 2, 'close'], [14, 17.6, 2, 'low']],    // the impossible sound (h1)
  [[16, 23.0, 2, 'orig'], [18, 25.0, 2, 'close'], [20, 27.0, 2, 'high']],   // the barbershop (h2)
  [[22, 32.4, 2, 'ots'], [24, 34.4, 2, 'low']],                            // the corridor, the heartbeat
  [[26, 43.0, 2, 'orig'], [28, 45.0, 2, 'close'], [30, 47.0, 2, 'low'], [32, 49.0, 2, 'orig']],   // PRESS START, the flash (h3)
  [[34, 52.6, 2, 'orig']],                                                  // the reveal (h4)
  [[36, 62.2, 2, 'orig'], [38, 64.2, 2, 'close'], [40, 66.2, 2, 'side'], [42, 68.2, 2, 'orig'], [44, 70.2, 2, 'close'], [46, 72.2, 2, 'low'], [48, 74.2, 2, 'orig']],   // Lagzilla (l1, h5, l2)
  [[50, 77.0, 2, 'orig'], [52, 79.0, 2, 'close']],                          // PLAYER 2 CONNECTED
  [[54, 81.4, 2, 'orig'], [56, 83.4, 2, 'high']],                           // Bem-vindo ao Pixel Zone (l3)
  [[58, 85.4, 2, 'orig'], [60, 87.4, 2, 'close'], [62, 89.4, 1.4, 'orig']],   // the secret (n2)
  [[63.4, 79.6, 2.2, 'side'], [65.6, 81.8, 3.0, 'orig']],                   // call to action, over the duo
];
export const SLOTS = RUNS.flat().map(([a, src, d, cam]) => ({ a, b: a + d, src, cam }));
export const DUR = SLOTS[SLOTS.length - 1].b;   // 68.6
export const slotAt = t => SLOTS.find(s => t >= s.a && t < s.b) || SLOTS[SLOTS.length - 1];
export const srcTime = t => { const s = slotAt(t); return s.src + (t - s.a); };
// voices at output times (ids from voices/): the original lines + Lagzilla's call to action
export const VO_OUT = [
  { id: 'l0', t: 0.2, dlg: true, who: '???', sub: 'Ainda tem lugar pra mais um…', muffled: true },
  { id: 'n1', t: 3.5, sub: 'Toda cidade guarda segredos. Alguns estão escondidos à vista de todos.' },
  { id: 'h1', t: 12.5, dlg: true, who: 'ELE', sub: 'Espera… que som foi esse?' },
  { id: 'h2', t: 17.4, dlg: true, who: 'ELE', sub: 'Olá? Tem alguém aí?' },
  { id: 'h3', t: 32.2, dlg: true, who: 'ELE', sub: 'Que lugar é este?' },
  { id: 'h4', t: 35.0, dlg: true, who: 'ELE', sub: 'Uau…' },
  { id: 'l1', t: 36.5, dlg: true, who: 'LAGZILLA', sub: 'Até que enfim. Achei que você ia ficar aí fora pra sempre.' },
  { id: 'h5', t: 43.4, dlg: true, who: 'ELE', sub: 'Tu… falas?' },
  { id: 'l2', t: 46.3, dlg: true, who: 'LAGZILLA', sub: 'E jogo melhor que você. Quer descobrir?' },
  { id: 'l3', t: 54.2, dlg: true, who: 'LAGZILLA', sub: 'Bem-vindo ao Pixel Zone.' },
  { id: 'n2', t: 58.2, sub: 'Alguns lugares não se encontram. Descobrem-se.' },
  { id: 'c1', t: 63.5, dlg: true, who: 'LAGZILLA', sub: 'Se quer viver isso, vem conhecer o Pixel Zone.' },
  { id: 'c2', t: 66.6, dlg: true, who: 'LAGZILLA', sub: 'Reserva pelo link na bio.', hide: true },
];
// HUD beats (output time)
export const H = { sound: 10.75, quest: 16.2, start: 26.3, flash: 31.05, reveal: 34.0, p2: 50.3, ach: 58.3, lvl: 61.6, cta: 63.4 };
export const XP = [
  [3.0, 10, 'heart', 'CURTIDA'], [7.4, 25, 'chat', 'COMENTÁRIO'], [13.6, 10, 'heart', 'CURTIDA'], [19.8, 50, 'user', 'NOVO SEGUIDOR'],
  [24.6, 10, 'heart', 'CURTIDA'], [29.0, 25, 'chat', 'COMENTÁRIO'], [35.4, 100, 'share', 'PARTILHA'], [41.0, 10, 'heart', 'CURTIDA'],
  [45.2, 50, 'user', 'NOVO SEGUIDOR'], [51.2, 100, 'share', 'PARTILHA'], [55.6, 25, 'chat', 'COMENTÁRIO'], [58.6, 500, 'trophy', 'PORTA SECRETA'],
];
export const XPMAX = 1000;
