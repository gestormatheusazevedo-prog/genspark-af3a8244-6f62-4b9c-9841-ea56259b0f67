// Sound events (exported to events.json for mix.py): every visible action has a sound.
import { T, BUILD, BEAT, bar, VO } from './story.js';
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
// city: footsteps on wet stone (the walk cycle lands a foot every 0.25 s)
for (let t = .1; t < 9.4; t += .25) ev(t, 'step', { surf: 'stone', g: t < 5 ? .35 : .8 });
ev(9.55, 'stop', { surf: 'stone' });
// door scene
ev(T.doorOpen, 'doorCreak'); ev(T.doorOpen + .05, 'latch');
for (let t = 10.95; t < 12.7; t += .25) ev(t, 'step', { surf: 'wood', g: .7 });
ev(15.25, 'cord'); ev(T.bulbOn, 'bulbOn');
// desk: pencil strokes, miniatures rising
for (let t = T.plan0; t < 26.2; t += .38) ev(t, 'pencil', { d: .3 });
T.holo.forEach((t, i) => ev(t, 'holo', { i }));
// build montage: a pop + a material sound + XP chime per item; the switch-on
const MAT = { rug: 'cloth', tvA: 'box', conA: 'click', tvB: 'box', conB: 'click', tvC: 'box', conC: 'click', bag0: 'cloth', bag1: 'cloth', bag2: 'cloth', bag3: 'cloth', bag4: 'cloth', bag5: 'cloth', ledL: 'tape', ledR: 'tape', sign: 'click', plant: 'cloth' };
BUILD.forEach((b, i) => { ev(b.t, 'pop', { m: MAT[b.id], i }); ev(b.t + .08, 'xp', { i }); });
ev(T.lightsOn, 'lightsOn');
// alone → first player
ev(T.bell, 'bell'); ev(T.door2, 'doorCreak'); ev(T.door2 + .05, 'latch');
for (let t = 54.55; t < 55.9; t += .25) ev(t, 'step', { surf: 'wood', g: .6, pan: .4 });
for (let t = 54.95; t < 56.2; t += .25) ev(t, 'step', { surf: 'wood', g: .55, pan: -.1 });
for (const v of VO) if (v.dlg) ev(v.t - .3, 'chime');
ev(T.give, 'handoff'); ev(T.p1joined, 'joined');
// the full room
ev(65.4, 'shout', { id: 'c4', g: .5, pan: -.4 }); ev(T.goal + .1, 'shout', { id: 'c1', g: .75, pan: .1 }); ev(70.95, 'shout', { id: 'c2', g: .45, pan: -.5 }); ev(72.2, 'shout', { id: 'c3', g: .4, pan: .35 });
ev(T.goal, 'goal');
ev(70.3, 'handoff');
for (let t = 63.4; t < 86.5; t += .29) ev(t, 'button', { g: .25 });
ev(T.sparkle, 'sparkle');
for (let t = 83.4; t < 85.2; t += .2) ev(t, 'plush');
ev(84.4, 'doorCreak', { g: .5 });
ev(T.logo + .15, 'achievement');
for (const v of VO) ev(v.t, 'vo', { id: v.id, dlg: !!v.dlg });
export const EVENTS = E;
