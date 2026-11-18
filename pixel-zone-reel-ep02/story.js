// Pixel Zone · Safe Zone 01 — "O Dia Dele". 120 BPM; a new angle every ~2 s. The day takes HP; the Pixel Zone gives it back.
export const BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4;
export const bar = (n, beat = 1) => (n - 1) * BAR + (beat - 1) * BEAT;
export const DUR = 41.6;
export const SHOTS = [
  { id: 'alarm', a: 0, b: 2 },        // 1  zenital: o despertador, 07:00
  { id: 'mirror', a: 2, b: 4 },       // 2  frontal ao espelho
  { id: 'drive', a: 4, b: 6 },        // 3  POV do condutor: trânsito parado
  { id: 'wheel', a: 6, b: 8 },        // 4  lateral: testa no volante
  { id: 'boss', a: 8, b: 10 },        // 5  por cima do ombro do chefe
  { id: 'papers', a: 10, b: 12 },     // 6  contrapicado: a pilha de papéis
  { id: 'screen', a: 12, b: 14 },     // 7  close do monitor: 18:00, URGENTE
  { id: 'night', a: 14, b: 16.5 },    // 8  escritório vazio à noite: LOW HP
  { id: 'street', a: 16.5, b: 18.5 }, // 9  a fachada da Barba Negra à noite
  { id: 'shop', a: 18.5, b: 20.5 },   // 10 steadicam: a barbearia, o Lucas acena, a porta do fundo
  { id: 'open', a: 20.5, b: 22.5 },   // 11 POV: a porta abre — SAFE ZONE
  { id: 'hands', a: 22.5, b: 25 },    // 12 macro das mãos: +30
  { id: 'sofa', a: 25, b: 27.9 },     // 13 picado: os amigos abrem espaço: +25
  { id: 'laugh', a: 27.9, b: 29.9 },  // 14 close: a risada
  { id: 'laughW', a: 29.9, b: 31.4 }, // 14b três quartos: +30
  { id: 'orbit', a: 31.4, b: 33.0 },  // 15 órbita: HP MÁXIMO, LEVEL UP
  { id: 'logo', a: 33.0, b: 35.8 },   // 16 logo + Lagzilla
  { id: 'cta', a: 35.8, b: 37.5 },    // 17 reserva pelo link na bio
  { id: 'final', a: 37.5, b: 41.3 },  // 18 plano geral a partir da porta
  { id: 'loop', a: 41.3, b: DUR },    // corte seco para o despertador (loop)
];
export const SET_OF = { alarm: 'home', mirror: 'home', loop: 'home', drive: 'car', wheel: 'car', boss: 'office', papers: 'office', screen: 'office', night: 'office', street: 'city', shop: 'barber' };
export const T = { hit: .95, urgent: 12.5, low: 14.5, door: 20.6, lvl: 31.6, lag: 33.4, cta: 35.8, enter: 99, laugh: 99, voice: 99, touch: 99, turn: 99, glow: 99 };
// HP changes: [t, delta, label]
export const HP = [[1.15, -10, '07:00'], [6.2, -20, 'TRÂNSITO'], [10.6, -30, 'O CHEFE'], [14.35, -25, 'URGENTE'], [24.6, 30, 'COMANDO'], [27.5, 25, 'AMIGOS'], [31.0, 30, 'RISADA']];
export const hpAt = (t, ease = x => x) => { let v = 100; for (const [t0, d] of HP) v += d * ease(Math.min(1, Math.max(0, (t - t0) / .35))); return v; };
export const VO = [
  { id: 'z1', t: 0.1, sub: 'Sete da manhã.' },
  { id: 'a1', t: 1.1, ann: true },
  { id: 'z2', t: 4.1, sub: 'Trânsito parado. Menos 20.' },
  { id: 'z3', t: 8.0, sub: 'O chefe chamou na sala. Menos 30.' },
  { id: 'z4', t: 11.25, sub: 'E-mail urgente às 6 da tarde. Menos 25.' },
  { id: 'z5', t: 14.9, sub: 'Sobrou 15 HP.' },
  { id: 'z6', t: 16.6, sub: 'Aí ele abriu a porta lá do fundo da barbearia.' },
  { id: 'a2', t: 20.65, ann: true },
  { id: 'z8', t: 22.55, sub: 'Comando na mão. Mais 30.' },
  { id: 'z9', t: 25.05, sub: 'Os amigos de sempre. Mais 25.' },
  { id: 'z10', t: 27.95, sub: 'Uma risada que ele nem lembrava que tinha. Mais 30.' },
  { id: 'z11', t: 31.5, sub: '100 HP de novo.' },
  { id: 'z12', t: 32.95, sub: 'Se quer viver isso, vem conhecer o Pixel Zone.' },
  { id: 'z13', t: 35.85, sub: 'Reserva pelo link na bio.', hide: true },
  { id: 'z14', t: 37.5, sub: 'Todo dia você perde HP. Aqui você recupera.' },
];
export const XP = [
  [3.0, 10, 'heart', 'CURTIDA'], [7.2, 10, 'heart', 'CURTIDA'], [12.8, 25, 'chat', 'COMENTÁRIO'], [17.4, 50, 'user', 'NOVO SEGUIDOR'],
  [23.6, 10, 'heart', 'CURTIDA'], [26.2, 100, 'share', 'PARTILHA'], [29.0, 50, 'user', 'NOVO SEGUIDOR'], [30.2, 25, 'chat', 'COMENTÁRIO'],
];
export const XPMAX = 1000;
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
