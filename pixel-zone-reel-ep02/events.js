// Sound events (exported to events.json for mix.py): every visible action has a sound.
import { T, VO, XP, HP } from './story.js';
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
// the day
ev(0.0, 'alarm', { d: T.hit + .05 }); ev(T.hit, 'slam');
ev(2.0, 'brush', { d: 2.0 }); ev(2.0, 'tap', { d: 2.0 });
ev(4.0, 'rainCar', { d: 4.0 }); ev(4.0, 'engine', { d: 4.0 }); ev(4.6, 'horn'); ev(6.75, 'horn', { g: .8 }); ev(7.3, 'horn', { g: .5 });
ev(8.0, 'officeAmb', { d: 6.0 }); ev(8.35, 'point'); ev(10.1, 'paper'); ev(10.6, 'paper'); ev(11.1, 'paper');
for (let t = 12.0; t < 12.5; t += .09) ev(t, 'key', { g: .5 });
ev(T.urgent, 'urgent'); ev(14.0, 'nightHum', { d: 2.5 });
for (let t = 14.2; t < 15.8; t += .18) ev(t, 'key', { g: .35 });
ev(T.low, 'heart', { d: 6.0 });
// the street, the barbershop
ev(16.5, 'rainStreet', { d: 2.0 }); for (let t = 16.6; t < 18.2; t += .3) ev(t, 'step', { surf: 'stone', g: .5 }); ev(18.2, 'shopBell');
for (let t = 18.6; t < 20.4; t += .3) ev(t, 'step', { surf: 'tile', g: .45 }); ev(18.9, 'broom', { d: 1.4 });
ev(T.door - .1, 'doorOpen'); ev(T.door + .05, 'safe');
// the safe zone
ev(20.6, 'room', { d: 20.7 });
for (let i = 0; i < 9; i++) ev(22.7 + i * .26, 'btn', { n: [3, 1, 0, 2][i % 4] });
ev(25.0, 'plop'); ev(26.75, 'clap'); ev(28.0, 'laugh', { g: .6 }); ev(29.0, 'laugh', { g: .5 }); ev(30.0, 'cheer', { g: .5 });
ev(T.lvl, 'levelup'); ev(33.1, 'neon'); ev(T.lag, 'sparkle'); ev(T.cta, 'pop');
ev(41.3, 'alarm', { d: .3 });
for (const [t, d] of HP) ev(t, d < 0 ? 'dmg' : 'heal', { n: d });
for (const [t, n] of XP) ev(t, 'xp', { n });
for (const v of VO) ev(v.t, 'vo', { id: v.id, ann: !!v.ann, dlg: !!v.dlg });
export const EVENTS = E.sort((a, b) => a.t - b.t);
