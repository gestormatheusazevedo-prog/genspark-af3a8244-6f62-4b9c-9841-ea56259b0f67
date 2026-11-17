// Sound events (exported to events.json for mix.py): every visible action has a sound.
import { T, VO } from './story.js';
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
// 1–2 — the barbershop: clippers buzzing, low chatter, the founder's chair
ev(0.0, 'clipper', { d: 4.2, g: .9 }); ev(4.0, 'clipper', { d: 9.0, g: .45 }); ev(13.33, 'clipper', { d: 2.4, g: .3 });
ev(0.0, 'murmur', { d: 24.0, g: .35 });
ev(16.6, 'cloth'); ev(22.2, 'cloth');
// flashback: keyboard taps, computer hum
for (let t = 24.2; t < 27.8; t += .13 + (Math.sin(t * 37) + 1) * .05) ev(t, 'key', { g: .5 });
ev(24.0, 'whoosh', { g: .5 }); ev(28.0, 'whoosh', { g: .35 });
// 3 — the empty room: steps on laminate, echo; the hologram; the handshake
for (let t = 29.6; t < 31.8; t += .34) ev(t, 'step', { surf: 'wood', g: .6 });
ev(T.holo0, 'holo'); ev(T.holo0 + .9, 'holo', { g: .6 }); ev(T.holo0 + 1.8, 'holo', { g: .5 });
ev(T.shake, 'clap', { g: .6 });
// 4 — night: the phone, the clock
ev(42.9, 'tick', { d: 9.2 }); ev(45.4, 'phoneTap'); ev(46.4, 'bankSad');
// 5 — montage: restaurant, saving, building
ev(52.0, 'restaurant', { d: 2.67 }); ev(58.67, 'restaurant', { d: 1.33 }); ev(62.67, 'restaurant', { d: 1.33 });
for (let t = 52.15; t < 54.6; t += .3) ev(t, 'step', { surf: 'tile', g: .5 });
ev(59.2, 'plates'); ev(63.1, 'ovenFire');
ev(54.9, 'coins'); ev(55.3, 'coins', { g: .7 }); ev(55.6, 'paper');
ev(56.6, 'box'); ev(57.6, 'click'); ev(60.4, 'drill'); ev(61.6, 'thud', { g: .6 }); ev(64.2, 'box', { g: .7 }); ev(64.8, 'plop', { g: .6 });
// 6 — the room comes alive
ev(66.2, 'click', { g: .6 }); ev(T.lightsOn, 'lightsOn'); ev(T.lightsOn + .1, 'hum', { d: 8 });
for (let t = 71.0; t < 72.8; t += .4) ev(t, 'step', { surf: 'wood', g: .45 });
// 7 — opening day
ev(T.doorOpen, 'door'); for (let t = 78.6; t < 81.4; t += .27) ev(t, 'step', { surf: 'wood', g: .45 });
ev(79.4, 'laugh', { g: .5 }); ev(81.8, 'buttons', { d: 5 }); ev(83.4, 'cheer', { g: .45 }); ev(85.8, 'laugh', { g: .4 });
// 8 — Lagzilla, the callbacks
ev(T.lag, 'sparkle'); ev(91.0, 'whoosh', { g: .3 }); ev(92.6, 'whoosh', { g: .3 }); ev(94.3, 'whoosh', { g: .3 }); ev(95.9, 'whoosh', { g: .3 });
ev(96.4, 'buttons', { d: 6 }); ev(99.0, 'laugh', { g: .35 });
ev(T.logo + 2.6, 'achievement');
for (const v of VO) ev(v.t, 'vo', { id: v.id, dlg: !!v.dlg, who: v.who || null });
export const EVENTS = E.sort((a, b) => a.t - b.t);
