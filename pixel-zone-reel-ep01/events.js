// Sound events (exported to events.json for mix.py): every visible action has a sound.
import { T, VO, XP } from './story.js';
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
// 1–2 — the loss
ev(0.0, 'lose'); ev(0.0, 'tvhum', { d: 4.0 });
// 3–5 — rewind, the door, everyone turns, the last controller
ev(T.rewind - .05, 'rewind'); ev(T.doorOpen, 'door');
for (const t of [4.95, 5.3, 5.65]) ev(t, 'step', { g: .5 });
ev(6.0, 'scratch'); ev(6.45, 'turn');
ev(T.grab, 'pick');
// 6–9 — the match, the veteran comes over, the tip, the combo
ev(8.0, 'game', { d: 10.0 });
ev(T.vetUp, 'cloth'); for (let t = 10.6; t < 11.5; t += .22) ev(t, 'step', { g: .45 }); ev(T.vetSit, 'plop');
ev(T.tip, 'ding');
ev(14.12, 'continue');
for (let i = 0; i < 6; i++) ev(T.combo + i * .28, 'btn', { n: [3, 1, 0, 1][i % 4] });
// 10–12 — the goal, the win, out the door with three friends
ev(T.goal, 'net'); ev(T.goal + .05, 'crowd8');
ev(T.win, 'win'); ev(T.win + .2, 'cheer', { g: .55 });
for (let t = 22.1; t < 23.9; t += .26) ev(t, 'step', { g: .4 });
ev(22.35, 'achievement');
// 13–15 — level up, the logo, Lagzilla, the call to action, play again
ev(T.lvl, 'levelup'); ev(26.1, 'neon'); ev(T.lag, 'sparkle'); ev(T.cta, 'pop'); ev(T.again, 'again');
// the XP pop-ups
for (const [t, n] of XP) ev(t, 'xp', { n });
for (const v of VO) ev(v.t, 'vo', { id: v.id, dlg: !!v.dlg, ann: !!v.ann, who: v.who || null });
export const EVENTS = E.sort((a, b) => a.t - b.t);
