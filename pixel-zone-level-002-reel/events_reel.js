// Sound events for the re-cut: the original film's foley (events_src.json, source time) moved to output time
// slot by slot, plus the new voices, cuts and HUD sounds. Exported to events.json for mix.py.
import { SLOTS, VO_OUT, H, XP } from './edit.js';
const SRC = (await (await fetch('events_src.json')).json()).ev;
const E = [];
const ev = (t, type, o = {}) => E.push({ t: +t.toFixed(3), type, ...o });
for (const s of SLOTS) for (const e of SRC) {
  if (e.type === 'vo') continue;
  if (e.t >= s.src && e.t < s.src + (s.b - s.a)) { const { t, type, ...rest } = e; ev(s.a + (t - s.src), type, rest); }
}
for (const s of SLOTS) if (s.a > 0) ev(s.a, 'cut');
ev(H.sound, 'hudSound'); ev(H.quest, 'quest'); ev(H.start, 'uiStart2'); ev(H.reveal, 'reveal'); ev(H.p2, 'p2'); ev(H.ach, 'achievement2'); ev(H.lvl, 'levelup'); ev(H.cta, 'pop');
for (const [t, n] of XP) ev(t, 'xp', { n });
for (const v of VO_OUT) ev(v.t, 'vo', { id: v.id, dlg: !!v.dlg, who: v.who || null, muffled: !!v.muffled });
export const EVENTS = E.map(e => { const o = { ...e }; for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return o; }).sort((a, b) => a.t - b.t);
