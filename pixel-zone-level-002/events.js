// Sound events (exported to events.json for mix.py): every visible action has a sound.
import { T, BEAT, bar, VO } from './story.js';
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
// the town: footsteps on wet stone (a foot every 0.29 s), windows clicking off
for (let t = .15; t < 14.2; t += .286) ev(t, 'step', { surf: 'stone', g: t < 8 ? .3 : .75 });
ev(14.3, 'stop', { surf: 'stone' });
ev(T.boot, 'boot'); ev(T.turn, 'cloth');
for (let t = 18.65; t < 20.8; t += .3) ev(t, 'step', { surf: 'stone', g: .6 });
ev(21.0, 'doorCreak', { g: .6 }); ev(21.05, 'bellShop');
// the barbershop
for (let t = 21.6; t < 24.1; t += .32) ev(t, 'step', { surf: 'tile', g: .65 });
for (let t = 26.5; t < 31.4; t += .34) ev(t, 'step', { surf: 'tile', g: .6 });
ev(T.laugh, 'shout', { id: 'c1', g: .32, lp: 1400, pan: .3 }); ev(T.laugh + .7, 'shout', { id: 'c2', g: .26, lp: 1400, pan: .4 });
ev(29.4, 'pads', { g: .25 });
// corridor: heartbeat pulse, steps
for (let t = 32.25; t < 36.8; t += .42) ev(t, 'step', { surf: 'wood', g: .55 });
for (let t = bar(13); t < T.touch; t += 60 / 72) ev(t, 'heart', { g: Math.min(1, .35 + (t - 32) / 16) });
ev(T.voice - .1, 'thrum');
// press start
ev(T.ui1, 'uiDiscover'); ev(T.ui2, 'uiStart'); ev(T.touch - .05, 'click'); ev(T.touch, 'riser'); ev(T.flash, 'flash');
// the reveal and the room
ev(T.reveal, 'boom');
for (let t = 54.6; t < 57.4; t += .3) ev(t, 'step', { surf: 'wood', g: .5 });
ev(57.3, 'goal'); ev(57.45, 'shout', { id: 'c4', g: .55, pan: -.2 }); ev(60.0, 'shout', { id: 'c5', g: .4, pan: .4 });
ev(T.visor, 'visor');
for (let t = 50.8; t < 90.5; t += .27) ev(t, 'button', { g: .22 });
ev(75.8, 'handoff'); ev(T.p2, 'joined'); ev(77.35, 'plop');
ev(80.1, 'shout', { id: 'c1', g: .5, pan: -.3 }); ev(80.6, 'shout', { id: 'c3', g: .45, pan: .3 }); ev(83.3, 'shout', { id: 'c2', g: .4, pan: .2 });
for (const v of VO) if (v.dlg) ev(v.t - .3, 'chime');
ev(86.5, 'sparkle');
ev(T.logo + .15, 'achievement');
for (const v of VO) ev(v.t, 'vo', { id: v.id, dlg: !!v.dlg, who: v.who || '', muffled: !!v.muffled });
export const EVENTS = E;
