// Pixel characters for "Pixel Zone — Level 001": the founder, Lagzilla, the first player and the crowd.
// Each drawing is a parameter object (pose table); drawings are packed into one atlas per character and shown as lit billboards.
import * as THREE from 'three';
import { PX, ramp, hex, mixc, texOf, billboard, blob } from './px.js';

export const SPX = 1 / 32;      // character pixel → metres (64 px = 2 m)
export const FW = 44, FH = 66;   // frame size
const INK = hex('#1b1218');
const R = (cols) => ramp(cols, .22);

// —— Palettes ——
const SKIN = {
  med: R(['#7a4a34', '#a8694a', '#c98d6a', '#e2ad88', '#f2c9a6']),
  light: R(['#9a6450', '#c98a6c', '#e7b293', '#f8d4b8']),
  tan: R(['#6a3f2a', '#94593c', '#b97a55', '#d69c74']),
  dark: R(['#3a2118', '#5a3424', '#7b4a32', '#9a6244']),
};
const CLOTH = {
  black: R(['#0c0b10', '#16151c', '#22212b', '#33323e', '#4a4958']),
  jog: R(['#0b0a0f', '#14131a', '#1f1e27', '#2c2b36']),
  white: R(['#8e939e', '#b9bec8', '#dde1e8', '#f6f8fb']),
  orange: R(['#6b2a10', '#a8441a', '#d9692a', '#f39246', '#ffb46e']),
  denim: R(['#141c33', '#22305a', '#34497e', '#4b66a3']),
  red: R(['#4a0e14', '#7d1820', '#b02a2c', '#d84a3a']),
  green: R(['#0f2a1e', '#1b4a32', '#2b6e48', '#46946a']),
  grey: R(['#2a2a33', '#43434f', '#60606e', '#80808e']),
  blue: R(['#0d1d48', '#183482', '#2753b8', '#4277dc']),
  yellow: R(['#5a4210', '#8f6a18', '#c99a26', '#ecc34a']),
  cream: R(['#6e665a', '#9c9282', '#c8bea8', '#e8dfc8']),
  teal: R(['#0b2f33', '#14525a', '#1f7a80', '#35a3a3']),
  jacket: R(['#0a0d14', '#141a26', '#202a3c', '#2f3c54', '#435272']),
};
const HAIR = {
  black: R(['#08070a', '#141016', '#221a1e', '#33272a']),
  brown: R(['#1e120c', '#3a2416', '#5a3a22', '#7a5434']),
  blond: R(['#5a4420', '#8a6c34', '#b8964e', '#dcc07a']),
  auburn: R(['#2e0f0a', '#5a1e12', '#86301c', '#b04a2a']),
};
const SILVER = R(['#5a5e68', '#9aa0ac', '#d4d9e2', '#ffffff']);
const BOX = R(['#4a3016', '#7a5428', '#a87a42', '#cfa364']);
const PAD = R(['#121218', '#24242e', '#3a3a48', '#5a5a6a']);

// —— Small drawing helpers ——
function stamp(P, x, y, r, col) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + .5) P.set(x + i, y + j, typeof col === 'function' ? col(x + i, y + j) : col); }
function limb(P, x0, y0, x1, y1, r, col) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5)); for (let k = 0; k <= n; k++) { const u = k / n; stamp(P, Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u), r, col); } }
const rad = d => d * Math.PI / 180;
// arm from shoulder: a1 = upper-arm angle from straight down (+ = forward/right), a2 = elbow bend (+ = forearm further forward)
function arm(P, sx, sy, a1, a2, sk, sl, o = {}) {
  const L1 = o.L1 ?? 9, L2 = o.L2 ?? 8, ex = sx + Math.sin(rad(a1)) * L1, ey = sy + Math.cos(rad(a1)) * L1, b = a1 + a2, hx = ex + Math.sin(rad(b)) * L2, hy = ey + Math.cos(rad(b)) * L2;
  const sleeveK = o.sleeve ?? .45;   // share of the upper arm covered by the sleeve (1 = long sleeve)
  const mx = sx + (ex - sx) * sleeveK, my = sy + (ey - sy) * sleeveK;
  limb(P, sx, sy, ex, ey, 1, (x, y) => sk(.55 - (o.far ? .25 : 0), x, y));
  limb(P, ex, ey, hx, hy, 1, (x, y) => (o.longSleeve ? sl : sk)(.6 - (o.far ? .25 : 0), x, y));
  limb(P, sx, sy, mx, my, 1.4, (x, y) => sl(.55 - (o.far ? .25 : 0) + (x < sx ? -.1 : .05), x, y));
  if (o.longSleeve) limb(P, sx, sy, ex, ey, 1.4, (x, y) => sl(.5 - (o.far ? .25 : 0), x, y));
  if (o.tattoo && !o.far) { const tx = Math.round(ex + (hx - ex) * .45), ty = Math.round(ey + (hy - ey) * .45); P.set(tx, ty, sk(.08, 0, 0)); P.set(tx + 1, ty, sk(.08, 0, 0)); P.set(tx, ty + 1, sk(.12, 0, 0)); }
  stamp(P, Math.round(hx), Math.round(hy), 1, (x, y) => sk(.7 - (o.far ? .25 : 0), x, y));
  return [Math.round(hx), Math.round(hy)];
}

// —— Human: one drawer for the founder, the first player and the crowd ——
// spec: {skin, hair, style:'fade'|'curly'|'long'|'cap'|'hood', beard, top, topKind:'tee'|'hoodie'|'jersey', pants, shoes, chain, bag, tattoo, h (height px), stripe}
// pose: {view:'side'|'back'|'front', step:0..3|-1, bob, aF:[a1,a2], aB:[a1,a2], sit, kneel, prop, blink, smile, look, cross}
function drawHuman(P, E, s, p) {
  const sk = SKIN[s.skin], top = CLOTH[s.top], pants = CLOTH[s.pants], shoes = CLOTH[s.shoes], hair = HAIR[s.hair];
  const H = s.h ?? 58, k = H / 58;       // proportions scale with height
  const foot = 64, view = p.view ?? 'side', cx = 21;
  const sitY = p.sit ? 15 : 0, kneelY = p.kneel ? 11 : 0, by = (p.bob || 0);
  const hipY = Math.round(foot - 24 * k) + sitY + kneelY + by, shY = Math.round(foot - 41 * k) + sitY + kneelY + by, headC = Math.round(foot - 50.5 * k) + sitY + kneelY + by;
  const hr = Math.round(6.4 * k);
  const L = {};
  // ——— legs ———
  const leg = (x0, y0, x1, y1, x2, y2, shade) => {
    limb(P, x0, y0, x1, y1, 2, (x, y) => pants(shade + (x < x0 ? -.1 : 0), x, y));
    limb(P, x1, y1, x2, y2 - 2, 2, (x, y) => pants(shade - .05, x, y));
    for (let i = -2; i <= 3; i++) for (let j = -2; j <= 0; j++) P.set(x2 + i, y2 + j, shoes(j === 0 ? .25 : .75 - (i < -1 ? .2 : 0), x2 + i, y2 + j));
    P.set(x2 + 3, y2 - 2, shoes(.5, 0, 0));
  };
  if (p.sit && view !== 'back') {           // seated, side: thighs forward, shins down
    leg(cx - 1, hipY, cx + 9, hipY + 1, cx + 10, foot - 1, .35);
    leg(cx + 2, hipY, cx + 12, hipY, cx + 13, foot - 1, .6);
  } else if (p.kneel) {                     // one knee down, installing something
    leg(cx - 2, hipY, cx - 4, foot - 3, cx - 10, foot - 1, .35);
    leg(cx + 2, hipY, cx + 8, hipY + 4, cx + 9, foot - 1, .6);
  } else if (!p.sit) {
    const st = p.step ?? -1;
    const kx = view === 'side' ? [[-1, 0, 1, 0], [-4, 3, 1, 0], [-1, 0, 1, 0], [3, -4, 1, 0]] : null;
    const W = [[[-6, -6], [5, 5]], [[-1, -1], [1, 0]], [[5, 5], [-6, -6]], [[1, 0], [-1, -1]]];
    let a, b;
    if (view === 'side' && st >= 0) { [a, b] = W[st]; }
    else { a = [-3, -3]; b = [3, 3]; if (view === 'side') { a = [-2, -2]; b = [2, 2]; } }
    const kneeY = Math.round((hipY + foot) / 2);
    leg(cx - 2, hipY, cx - 2 + a[0] * .6, kneeY, cx - 2 + a[1], foot - 1 - (st === 1 || st === 3 ? 1 : 0) * 0, .35);
    leg(cx + 2, hipY, cx + 2 + b[0] * .6, kneeY, cx + 2 + b[1], foot - 1, .62);
  }
  // ——— far arm (behind the torso) ———
  const shF = [cx + 5, shY + 2], shB = [cx - 5, shY + 2];
  const sleeve = s.topKind === 'tee' || s.topKind === 'jersey' ? .45 : 1, longSleeve = s.topKind === 'hoodie' || s.topKind === 'jacket' || s.topKind === 'sweater';
  if (view === 'side' && p.aB) L.handB = arm(P, shB[0] + 2, shB[1], p.aB[0], p.aB[1], sk, top, { far: true, sleeve, longSleeve });
  // ——— backpack (worn) ———
  if (s.bag && view !== 'back') { for (let y = shY + 2; y < shY + 16; y++) for (let x = cx - 10; x < cx - 4; x++) P.set(x, y, CLOTH.black(.45 + (x === cx - 10 ? -.2 : 0) + (y === shY + 2 ? .2 : 0), x, y)); }
  // ——— torso ———
  const tw = Math.round(7 * k), bot = hipY + (s.topKind === 'hoodie' ? 2 : 1);
  P.poly([[cx - tw, shY], [cx + tw, shY], [cx + tw - 1, bot], [cx - tw + 1, bot]], (x, y) => {
    const u = (x - (cx - tw)) / (2 * tw); let v = .55 + (view === 'back' ? -.05 : 0) - Math.abs(u - .62) * .5 + (y < shY + 2 ? .15 : 0);
    if (s.stripe && y === shY + 8) v = .95;
    return top(v, x, y);
  });
  // waistband / pants top
  for (let x = cx - tw + 1; x <= cx + tw - 1; x++) P.set(x, hipY + 1, pants(.2, x, 0));
  if (s.topKind === 'hoodie' && view !== 'back') { P.rect(cx - 3, hipY - 6, 7, 3, top(.3, 0, 0)); P.rect(cx - 3, hipY - 6, 7, 1, top(.2, 0, 0)); }   // kangaroo pocket
  if (s.topKind === 'jacket' && view !== 'back') { for (let y = shY + 1; y < hipY; y++) P.set(cx + 1, y, hex('#5a6478')); P.rect(cx - 3, shY, 2, 3, top(.75, 0, 0)); P.rect(cx + 3, shY, 2, 3, top(.75, 0, 0)); P.rect(cx - 1, shY + 1, 4, 2, CLOTH.grey(.3, 0, 0)); }
  if (s.topKind === 'jersey' && view !== 'back') { P.rect(cx - tw + 1, shY + 5, 2 * tw - 1, 2, CLOTH.white(.85, 0, 0)); }
  if (s.chain && view !== 'back') {        // silver chain + cross
    for (let i = -3; i <= 3; i++) { const yy = shY + 1 + Math.round(Math.abs(i) < 2 ? 3 : 4 - Math.abs(i) * .6); P.set(cx + 1 + i, yy, SILVER(.75, 0, 0)); }
    const px = cx + 1, py = shY + 6; P.set(px, py, SILVER(.7, 0, 0)); P.set(px, py + 1, SILVER(.85, 0, 0)); P.set(px, py + 2, SILVER(.55, 0, 0)); P.set(px + 1, py + 1, SILVER(.5, 0, 0));
    E && E.set(px, py + 1, [90, 95, 110]);
  }
  if (s.bag && view === 'back') { for (let y = shY + 2; y < shY + 17; y++) for (let x = cx - 6; x < cx + 6; x++) P.set(x, y, CLOTH.black(.5 + (y === shY + 2 ? .25 : 0) - (x === cx - 6 ? .2 : 0), x, y)); }
  if (s.collar && view !== 'back') { const wc = CLOTH.white(.9, 0, 0); for (const dx of [-3, -2, 2, 3]) P.set(cx + 1 + dx, shY, wc); P.set(cx - 1, shY + 1, wc); P.set(cx + 3, shY + 1, wc); }
  if (s.print && view !== 'back') { const wc = CLOTH.white(.85, 0, 0); for (let i = -4; i <= 4; i++) { if (i % 3 !== 2) P.set(cx + 1 + i, shY + 6, wc); if ((i + 9) % 2 === 0) P.set(cx + 1 + i, shY + 8, wc); } P.set(cx, shY + 10, wc); P.set(cx + 2, shY + 10, wc); }
  if (s.apron && view !== 'back') { const AP = CLOTH.red; P.poly([[cx - tw + 1, hipY - 7], [cx + tw - 1, hipY - 7], [cx + tw + (p.sit ? 6 : 0), hipY + 10], [cx - tw, hipY + 10]], (x, y) => AP(.55 + (y === hipY - 7 ? .2 : 0) - (x < cx - tw + 2 ? .15 : 0), x, y)); P.line(cx - 3, shY + 1, cx - 2, hipY - 7, AP(.45, 0, 0)); P.line(cx + 4, shY + 1, cx + 3, hipY - 7, AP(.45, 0, 0)); }
  if (p.cape) { const CP = CLOTH.white, f = view === 'front';
    P.poly(f ? [[cx - tw - 1, shY - 1], [cx + tw + 1, shY - 1], [cx + tw + 7, foot - 9], [cx - tw - 7, foot - 9]] : [[cx - tw - 1, shY - 1], [cx + tw + 1, shY - 1], [cx + 15, foot - 11], [cx - tw - 3, foot - 11]], (x, y) => CP(.62 + ((x * 2 + (y >> 2)) % 7 === 0 ? -.18 : 0) - (y > foot - 13 ? .1 : 0), x, y));
    for (let x = cx - 3; x <= cx + 4; x++) P.set(x, shY - 1, CP(.95, 0, 0)); }
  // ——— neck + head ———
  P.rect(cx - 1, shY - 3, 4, 4, sk(.4, 0, 0));
  const hx = cx + (view === 'side' ? 1 : 0) + (p.look ? 1 : 0), hy = headC;
  if (view === 'back') {
    P.ellipse(hx, hy, hr, hr + .6, (x, y, dx, dy) => sk(.45 - dy * .2, x, y));
    P.ellipse(hx, hy - .5, hr + .3, hr + .2, (x, y, dx, dy) => (s.style === 'fade' && dy > .45) ? mixc(hair(.35, x, y), sk(.35, x, y), .35) : hair(.5 - dy * .2 + (dx < -.3 ? -.12 : 0) + ((x + y) % 3 === 0 && dy < -.2 ? .15 : 0), x, y));
    P.set(hx - hr, hy, sk(.35, 0, 0)); P.set(hx + hr, hy, sk(.35, 0, 0));   // ears
    if (s.style === 'long') for (let y = hy; y < hy + 10; y++) for (let x = hx - hr; x <= hx + hr; x++) P.set(x, y, hair(.4, x, y));
    if (s.style === 'hood' || s.topKind === 'hoodie') { for (let x = hx - hr; x <= hx + hr; x++) P.set(x, hy + hr, top(.4, x, 0)); }
  } else {
    // face
    P.ellipse(hx, hy, hr, hr + .6, (x, y, dx, dy) => sk(.62 - dx * (view === 'side' ? .18 : 0) - dy * .25 + (dx < -.6 ? -.15 : 0), x, y));
    if (view === 'side') { P.set(hx + hr, hy + 1, sk(.5, 0, 0)); P.set(hx + hr, hy, sk(.62, 0, 0)); }   // nose
    // hair styles
    if (s.style === 'fade') {
      for (let x = hx - hr; x <= hx + hr - 1; x++) for (let y = hy - hr - 1; y <= hy - hr + 2 + (x < hx - 2 ? 1 : 0); y++) P.set(x, y, hair(.55 + ((x + y) % 3 === 0 ? .2 : 0), x, y));
      for (let y = hy - hr + 2; y < hy + 2; y++) { P.set(hx - hr, y, mixc(hair(.4, 0, y), sk(.4, 0, y), .5)); P.set(hx - hr + 1, y, mixc(hair(.3, 0, y), sk(.45, 0, y), .7)); }
    } else if (s.style === 'curly') {
      for (let x = hx - hr - 1; x <= hx + hr; x++) for (let y = hy - hr - 2; y <= hy - hr + 2; y++) P.set(x, y, hair(.35 + (((x >> 1) + (y >> 1)) % 2) * .3, x, y));
      for (let y = hy - hr; y < hy + 2; y++) P.set(hx - hr - 1, y, hair(.35, 0, y));
    } else if (s.style === 'long') {
      for (let x = hx - hr - 1; x <= hx + hr; x++) for (let y = hy - hr - 1; y <= hy - hr + 2; y++) P.set(x, y, hair(.55, x, y));
      for (let y = hy - hr; y < hy + 9; y++) for (let x = hx - hr - 1; x < hx - hr + 3; x++) P.set(x, y, hair(.45 - (y - hy) * .02, x, y));
    } else if (s.style === 'cap') {
      for (let x = hx - hr - 1; x <= hx + hr; x++) for (let y = hy - hr - 1; y <= hy - hr + 2; y++) P.set(x, y, CLOTH[s.capCol || 'blue'](.6 + (y === hy - hr - 1 ? .2 : 0), x, y));
      P.rect(hx + 1, hy - hr + 2, hr + 3, 1, CLOTH[s.capCol || 'blue'](.3, 0, 0));
    } else if (s.style === 'hood') {
      P.ellipse(hx - 1, hy - 1, hr + 1.5, hr + 1.5, (x, y, dx, dy) => top(.5 - dy * .2 - dx * .1, x, y));
      P.ellipse(hx + 1.5, hy + .5, hr - 1, hr - .5, (x, y, dx, dy) => sk(.6 - dy * .2, x, y));
      for (let x = hx - 1; x <= hx + 3; x++) P.set(x, hy - hr + 2, hair(.5, x, 0));
    }
    if (s.beard === 2) { const bx = view === 'side' ? hx + 2 : hx;
      for (let y = hy + 2; y <= hy + hr + 1; y++) { const w = y <= hy + 3 ? 4 : y >= hy + hr ? 3 : 4; for (let x = bx - w; x <= bx + w; x++) { if (view === 'side' && x < hx - 2) continue; if (y === hy + 2 && Math.abs(x - bx) < 3 && Math.abs(x - bx) > 0 && view !== 'side') continue; P.set(x, y, hair(.42 + ((x + y) % 3 === 0 ? .12 : 0), x, y)); } }
      if (view === 'side') for (let y = hy; y <= hy + 2; y++) P.set(hx - 2, y, hair(.4, 0, y)); else for (const sx of [-1, 1]) for (let y = hy; y <= hy + 2; y++) P.set(hx + sx * (hr - 1), y, hair(.38, 0, y)); }
    // beard: moustache + goatee + jaw shadow
    if (s.beard) {
      const bx = view === 'side' ? hx + 2 : hx;
      for (let y = hy + 2; y <= hy + hr; y++) for (let x = bx - 3; x <= bx + 3; x++) { const d = Math.abs(x - bx); if ((y === hy + 2 && d <= 2) || (y >= hy + 4 && d <= 2 - (y === hy + hr ? 1 : 0)) || (y >= hy + 3 && d === 3 && (x + y) % 2 === 0)) P.set(x, y, hair(.45 + (d < 2 ? .1 : 0), x, y)); }
      if (view === 'side') for (let y = hy + 1; y <= hy + hr - 1; y++) { P.set(hx - 3, y, mixc(hair(.4, 0, y), sk(.45, 0, y), .55)); }
    }
    // eyes, brows, mouth
    const ey = hy - 1, exs = view === 'side' ? [hx + 3, hx - 1] : [hx - 2, hx + 2];
    for (const ex of exs) {
      if (p.blink) P.set(ex, ey, sk(.25, 0, 0));
      else { P.set(ex, ey, INK); P.set(ex, ey - 1, INK); if (s.eye) P.set(ex, ey, hex(s.eye)); }
      P.set(ex - (p.sad ? 1 : 0), ey - 3, hair(.3, 0, 0)); P.set(ex + 1 - (p.sad ? 0 : 0), ey - 3 + (p.frown ? 1 : 0), hair(.3, 0, 0));
    }
    if (p.tired) for (const ex of exs) { P.set(ex, ey + 1, sk(.2, 0, 0)); P.set(ex + 1, ey + 1, sk(.25, 0, 0)); }
    const mx = view === 'side' ? hx + 2 : hx, my = hy + 3;
    if (p.brush) { P.rect(mx + 1, my, 7, 1, hex('#3ab0ff')); P.rect(mx + 7, my - 1, 2, 3, CLOTH.white(.95, 0, 0)); }
    if (p.laugh) { P.rect(mx - 1, my, 4, 3, hex('#3a1418')); P.rect(mx - 1, my, 4, 1, CLOTH.white(.95, 0, 0)); }
    else if (p.smile) { P.set(mx - 1, my, INK); P.set(mx, my + 1, INK); P.set(mx + 1, my + 1, INK); P.set(mx + 2, my, INK); }
    else if (p.open) { P.rect(mx, my, 2, 2, hex('#3a1418')); }
    else if (p.sad) { P.set(mx, my + 1, INK); P.set(mx + 1, my + 1, INK); P.set(mx - 1, my + 2, INK); P.set(mx + 2, my + 2, INK); }
    else if (!s.beard) { P.set(mx, my + 1, sk(.25, 0, 0)); P.set(mx + 1, my + 1, sk(.25, 0, 0)); }
  }
  // ——— near arm (+ prop) ———
  const aF = p.aF ?? [8, -6];
  if (p.cape) { /* arms under the cape */ }
  else if (p.cross && view !== 'back') {          // arms crossed over the chest (the board pose)
    limb(P, cx - 5, shY + 3, cx + 6, shY + 8, 1.5, (x, y) => sk(.55, x, y)); limb(P, cx + 6, shY + 4, cx - 4, shY + 9, 1.5, (x, y) => sk(.65, x, y));
    limb(P, cx + 5, shY + 1, cx + 7, shY + 4, 1.5, (x, y) => top(.55, x, y)); P.set(cx + 3, shY + 9, sk(.1, 0, 0)); P.set(cx + 4, shY + 9, sk(.1, 0, 0));
  } else if (view === 'back') {
    if (p.aB) L.handB = arm(P, shB[0], shB[1], -p.aB[0] * .3, 0, sk, top, { sleeve, longSleeve });
    L.handF = arm(P, shF[0], shF[1], (aF[0]) * .3, 0, sk, top, { sleeve, longSleeve });
  } else if (view === 'front' && p.both) {
    const w = p.w || 0;
    L.handB = arm(P, cx - tw + 1, shY + 2, -150 - w * 12, 30, sk, top, { sleeve, longSleeve });
    L.handF = arm(P, cx + tw - 1, shY + 2, 150 + w * 12, -30, sk, top, { sleeve, longSleeve, tattoo: s.tattoo });
} else if (view === 'front') {
    L.handB = arm(P, cx - tw + 1, shY + 2, -10, 4, sk, top, { sleeve, longSleeve, tattoo: s.tattoo });
    L.handF = p.raise ? arm(P, cx + tw - 1, shY + 2, 152 + (p.rw || 0) * 8, -112, sk, top, { sleeve, longSleeve, tattoo: s.tattoo }) : arm(P, cx + tw - 1, shY + 2, p.wave ? 150 + (p.w || 0) * 15 : 10, p.wave ? -30 : -4, sk, top, { sleeve, longSleeve, tattoo: s.tattoo });
  } else L.handF = arm(P, shF[0], shF[1], aF[0], aF[1], sk, top, { sleeve, longSleeve, tattoo: s.tattoo });
  // ——— props in the near hand ———
  if (p.prop === 'box') { const [x, y] = L.handF; for (let j = -9; j <= 0; j++) for (let i = -10; i <= 2; i++) P.set(x + i, y + j + 1, BOX(.55 + (j === -9 ? .3 : 0) + (i === -10 ? -.2 : 0) + (i === -4 && j < -6 ? -.3 : 0), x + i, y + j)); }
  if (p.prop === 'pad') { const [x, y] = L.handF; P.rect(x - 2, y - 1, 5, 3, PAD(.5, 0, 0)); P.set(x + 1, y - 1, hex('#5ff3ff')); E && E.set(x + 1, y - 1, hex('#5ff3ff')); }
  if (p.prop === 'pencil') { const [x, y] = L.handF; P.line(x, y, x + 2, y + 3, CLOTH.yellow(.8, 0, 0)); }
  if (p.prop === 'tool') { const [x, y] = L.handF; P.line(x, y, x + 4, y + 1, SILVER(.6, 0, 0)); }
  if (p.prop === 'clipper' && L.handF) { const [x, y] = L.handF; P.rect(x - 1, y - 5, 3, 6, hex('#1a1a20')); P.rect(x - 1, y - 6, 3, 1, SILVER(.8, 0, 0)); P.set(x, y - 3, hex('#3a3a46')); }
  if (p.prop === 'phone' && L.handF) { const [x, y] = L.handF; P.rect(x - 1, y - 5, 4, 6, hex('#101014')); P.rect(x, y - 4, 2, 4, hex('#6aa8ff')); for (let j = -4; j < 0; j++) { E && E.set(x, y + j, hex('#6aa8ff')); E && E.set(x + 1, y + j, hex('#6aa8ff')); } }
  if (p.prop === 'pizza' && L.handF) { const [x, y] = L.handF; for (let i = -7; i <= 7; i++) P.set(x + i, y - 1, SILVER(.55 + (i === -7 ? -.2 : 0), 0, 0)); for (let i = -6; i <= 6; i++) { P.set(x + i, y - 2, hex(Math.abs(i) > 4 ? '#b8702e' : '#f0b848')); if (Math.abs(i) < 6) P.set(x + i, y - 3, hex(Math.abs(i) > 4 ? '#c88038' : (i % 3 === 0 ? '#c0302a' : '#f6c85a'))); } }
  if (p.prop === 'plates' && L.handF) { const [x, y] = L.handF; for (let j = 0; j < 4; j++) for (let i = -4; i <= 4; i++) P.set(x + i, y - 1 - j, CLOTH.white(j % 2 ? .7 : .95, 0, 0)); }
  if (p.prop === 'padGive') { const [x, y] = L.handF; P.rect(x, y - 2, 5, 3, PAD(.5, 0, 0)); P.set(x + 3, y - 2, hex('#ff5fd2')); E && E.set(x + 3, y - 2, hex('#ff5fd2')); }
}

// —— Lagzilla: turquoise plush, purple hoodie, blue LED shutter visor, purple spikes, two little teeth ——
const LZ = {
  fur: R(['#0b3c44', '#11606a', '#178590', '#22a6a8', '#45c6bf']),
  hood: R(['#24103f', '#3a1a6a', '#5326a0', '#6f3cc8', '#8c5ae0']),
  spike: R(['#3a1466', '#5a22a0', '#7c38d0', '#a066f0']),
  visor: R(['#0a1a8a', '#1840f0', '#4a7cff', '#a8c4ff']),
  tooth: R(['#bdb6a2', '#e8e2cf', '#fffaf0']),
};
// p: {view:'side'|'front'|'back', step, bob, wave, w, blink}
function drawLag(P, E, p) {
  const view = p.view ?? 'side', by = p.bob || 0, cx = 21, foot = 64;
  const st = p.step ?? -1, sx = st < 0 ? [0, 0] : [[-3, 3], [-1, 1], [3, -3], [1, -1]][st];
  // tail (side/back) behind the body, curling to the left
  if (view !== 'front') {
    const tx0 = view === 'side' ? cx - 6 : cx, ty0 = foot - 12;
    for (let i = 0; i < 12; i++) { const x = tx0 - (view === 'side' ? i : 0), y = ty0 + i * .55 + (view === 'back' ? i * .2 : 0), r = Math.max(1, 3.2 - i * .2); stamp(P, Math.round(x), Math.round(y), Math.round(r), (xx, yy) => LZ.fur(.55 - (yy - y) * .08, xx, yy)); if (i % 3 === 1) P.set(Math.round(x), Math.round(y - r), LZ.spike(.75, 0, 0)); }
  }
  if (p.sit) { // seated on a bag: body lower, stubby legs forward
    const S0 = 9;
    for (const [lx, sh] of [[cx - 2, .45], [cx + 4, .7]]) { for (let y = foot - 9; y < foot - 2; y++) for (let x = lx; x < lx + 9; x++) P.set(x, y, LZ.fur(sh + (y === foot - 9 ? .1 : 0), x, y)); P.set(lx + 9, foot - 4, LZ.tooth(.9, 0, 0)); P.set(lx + 9, foot - 6, LZ.tooth(.9, 0, 0)); }
    p = { ...p, _dy: S0 };
  }
  // legs + feet with white claws
  if (!p.sit) for (const [lx, sh, dx] of [[cx - 5, .4, sx[0]], [cx + 2, .7, sx[1]]]) {
    for (let y = foot - 12; y < foot - 2; y++) for (let x = lx + dx; x < lx + dx + 6; x++) P.set(x, y, LZ.fur(sh - (x === lx + dx ? .15 : 0) + ((x + y) % 5 === 0 ? -.08 : 0), x, y));
    for (let x = lx + dx - 1; x < lx + dx + 8; x++) for (let y = foot - 3; y < foot; y++) P.set(x, y, LZ.fur(sh - .1 + (y === foot - 3 ? .1 : 0), x, y));
    if (view !== 'back') for (const c of view === 'side' ? [lx + dx + 5, lx + dx + 7] : [lx + dx, lx + dx + 3, lx + dx + 6]) { P.set(c, foot - 1, LZ.tooth(.9, 0, 0)); P.set(c, foot - 2, LZ.tooth(.6, 0, 0)); }
  }
  // hoodie body (round, big)
  const top = 30 + by + (p._dy || 0), bot = foot - 10 + (p._dy ? 4 : 0);
  P.ellipse(cx, (top + bot) / 2 + 1, 10, (bot - top) / 2 + 1, (x, y, dx, dy) => LZ.hood(.58 - dx * .25 - dy * .25 + ((x + 2 * y) % 7 === 0 ? -.06 : 0), x, y));
  for (let x = cx - 10; x <= cx + 10; x++) P.set(x, bot, LZ.hood(.2, x, 0));   // ribbed hem
  if (view !== 'back') {
    // glowing chest letters (a dotted violet band = "LAGZILLA" at this size) + pocket + drawstrings
    for (let x = cx - 7; x <= cx + 7; x++) if (x % 2 === 0 || (x * 7) % 5 === 0) { const c = hex(x % 3 ? '#c9a0ff' : '#e6d0ff'); P.set(x + (view === 'side' ? 1 : 0), top + 9, c); E && E.set(x + (view === 'side' ? 1 : 0), top + 9, c); }
    P.rect(cx - 5 + (view === 'side' ? 2 : 0), bot - 7, 10, 4, LZ.hood(.32, 0, 0)); P.rect(cx - 5 + (view === 'side' ? 2 : 0), bot - 7, 10, 1, LZ.hood(.2, 0, 0));
    P.set(cx - 2 + (view === 'side' ? 2 : 0), top + 3, LZ.hood(.9, 0, 0)); P.set(cx - 2 + (view === 'side' ? 2 : 0), top + 4, LZ.hood(.9, 0, 0)); P.set(cx + 2 + (view === 'side' ? 2 : 0), top + 3, LZ.hood(.9, 0, 0)); P.set(cx + 2 + (view === 'side' ? 2 : 0), top + 4, LZ.hood(.9, 0, 0));
  } else {
    // spikes down the back, through the hood
    for (let i = 0; i < 6; i++) stamp(P, cx, top + 2 + i * 4, 2 - (i > 3 ? 1 : 0), (x, y) => LZ.spike(.7 - (y - top) * .005, x, y));
  }
  // head
  const hx = cx + (view === 'side' ? 2 : 0), hy = top - 10;
  P.ellipse(hx, hy, 11.5, 11.5, (x, y, dx, dy) => LZ.fur(.62 - dx * (view === 'side' ? .15 : .05) - dy * .3 + ((x * 3 + y * 5) % 9 === 0 ? -.08 : 0), x, y));
  // hood collar around the neck
  for (let x = hx - 9; x <= hx + 8; x++) for (let y = top - 1; y <= top + 1; y++) P.set(x, y, LZ.hood(.45 + (y === top - 1 ? .15 : 0), x, y));
  // spikes on top of the head
  for (const [ox, r] of view === 'side' ? [[-6, 2], [-2, 3], [3, 2]] : [[-4, 2], [0, 3], [4, 2]]) stamp(P, hx + ox, hy - 11 - (r > 2 ? 1 : 0), r, (x, y) => LZ.spike(.72 - (y - hy + 12) * .04, x, y));
  if (view === 'back') return;
  if (view === 'side') {   // snout pushing right, teeth below it, visor across the eyes
    P.ellipse(hx + 8, hy + 3, 6, 5, (x, y, dx, dy) => LZ.fur(.62 - dy * .3, x, y));
    P.set(hx + 13, hy + 1, LZ.fur(.2, 0, 0)); P.set(hx + 12, hy + 1, LZ.fur(.25, 0, 0));    // nostril
    for (let x = hx + 3; x <= hx + 12; x++) P.set(x, hy + 7, LZ.fur(.25, 0, 0));          // mouth line
    for (const tx of [hx + 6, hx + 10]) { P.set(tx, hy + 8, LZ.tooth(.95, 0, 0)); P.set(tx, hy + 9, LZ.tooth(.7, 0, 0)); }
    for (let y = hy - 4; y <= hy - 1; y++) for (let x = hx - 3; x <= hx + 11; x++) { const c = y === hy - 4 ? LZ.visor(.3, x, y) : (y % 2 === 0 ? LZ.visor(.95, x, y) : LZ.visor(.55, x, y)); P.set(x, y, c); if (y > hy - 4) E && E.set(x, y, c); }
    P.rect(hx - 5, hy - 3, 2, 2, LZ.visor(.2, 0, 0));   // strap
  } else {                 // front: snout centred, visor across, two teeth
    P.ellipse(hx, hy + 5, 7, 4.5, (x, y, dx, dy) => LZ.fur(.66 - dy * .3, x, y));
    P.set(hx - 2, hy + 3, LZ.fur(.2, 0, 0)); P.set(hx + 2, hy + 3, LZ.fur(.2, 0, 0));
    for (let x = hx - 6; x <= hx + 6; x++) P.set(x, hy + 8, LZ.fur(.25, 0, 0));
    if (p.smile) { P.set(hx - 6, hy + 7, LZ.fur(.25, 0, 0)); P.set(hx + 6, hy + 7, LZ.fur(.25, 0, 0)); }
    for (const tx of [hx - 4, hx + 4]) { P.set(tx, hy + 9, LZ.tooth(.95, 0, 0)); P.set(tx, hy + 10, LZ.tooth(.7, 0, 0)); }
    for (let y = hy - 4; y <= hy - 1; y++) for (let x = hx - 10; x <= hx + 10; x++) { const c = y === hy - 4 ? LZ.visor(.3, x, y) : (y % 2 === 0 ? LZ.visor(.95, x, y) : LZ.visor(.55, x, y)); if (Math.abs(x - hx) < 1 && y > hy - 3) continue; P.set(x, y, c); if (y > hy - 4) E && E.set(x, y, c); }
  }
  // arms (short plush) — side: one near arm; front: two, the right one can beckon
  const pawC = (x, y) => LZ.fur(.6, x, y);
  if (view === 'side') {
    const rx = p.offer ? 9 : p.pad ? 5 : p.reach ? 4 : 0, ry = p.offer ? 7 : p.pad ? 3 : p.reach ? 4 : 0;
    limb(P, cx + 7, top + 5, cx + 10 + rx, top + 13 - ry, 2, (x, y) => LZ.hood(.6, x, y)); stamp(P, cx + 10 + rx, top + 15 - ry, 2, pawC);
    if (p.pad || p.offer) { const px = cx + 11 + rx - (p.offer ? 0 : 2), py = top + 12 - ry + (p.w ? 1 : 0); P.rect(px - 3, py, 7, 3, PAD(.45, 0, 0)); P.rect(px - 3, py, 7, 1, PAD(.7, 0, 0)); const c = hex(p.offer ? '#ff5fd2' : '#5ff3ff'); P.set(px + 2, py + 1, c); E && E.set(px + 2, py + 1, c); }
  }
  else {
    limb(P, cx - 9, top + 5, cx - 12, top + 13, 2, (x, y) => LZ.hood(.45, x, y)); stamp(P, cx - 12, top + 15, 2, pawC);
    if (p.wave) { const w = p.w || 0, ex = cx + 13, ey = top - 1 - w; limb(P, cx + 9, top + 5, ex, ey + 3, 2, (x, y) => LZ.hood(.62, x, y)); stamp(P, ex + (w ? -1 : 1), ey, 2, pawC); }
    else { limb(P, cx + 9, top + 5, cx + 12, top + 13, 2, (x, y) => LZ.hood(.62, x, y)); stamp(P, cx + 12, top + 15, 2, pawC); }
  }
}

// —— Characters and their drawing tables ——
export const SPECS = {
  founder: { skin: 'med', hair: 'black', style: 'fade', beard: 1, top: 'black', topKind: 'tee', pants: 'jog', shoes: 'white', chain: 1, tattoo: 1, h: 58, eye: '#5d8a5a' },
  client: { skin: 'light', hair: 'brown', style: 'curly', top: 'orange', topKind: 'hoodie', pants: 'denim', shoes: 'white', h: 55 },
  p1: { skin: 'tan', hair: 'black', style: 'cap', top: 'red', topKind: 'jersey', pants: 'denim', shoes: 'black', h: 56 },
  p2: { skin: 'light', hair: 'auburn', style: 'long', top: 'green', topKind: 'hoodie', pants: 'jog', shoes: 'white', h: 53 },
  p3: { skin: 'dark', hair: 'black', style: 'curly', top: 'yellow', topKind: 'tee', pants: 'grey', shoes: 'white', h: 57 },
  p4: { skin: 'light', hair: 'blond', style: 'hood', top: 'grey', topKind: 'hoodie', pants: 'denim', shoes: 'black', h: 52 },   // the shy newcomer
  p5: { skin: 'med', hair: 'brown', style: 'fade', top: 'blue', topKind: 'jersey', pants: 'jog', shoes: 'white', h: 57, stripe: 1 },
  hero: { skin: 'light', hair: 'brown', style: 'fade', top: 'jacket', topKind: 'jacket', pants: 'black', shoes: 'grey', h: 57, eye: '#4a6a8a' },
  lucas: { skin: 'light', hair: 'black', style: 'fade', beard: 2, top: 'black', topKind: 'sweater', print: 1, pants: 'black', shoes: 'black', h: 59, eye: '#3a2418' },
  trab: { skin: 'med', hair: 'brown', style: 'fade', top: 'blue', topKind: 'sweater', collar: 1, pants: 'grey', shoes: 'black', h: 57 },
  chefe: { skin: 'light', hair: 'black', style: 'fade', top: 'jacket', topKind: 'jacket', pants: 'black', shoes: 'black', h: 60 },
  novato: { skin: 'light', hair: 'blond', style: 'hood', top: 'grey', topKind: 'hoodie', pants: 'denim', shoes: 'white', h: 53, bag: 1 },
  veterano: { skin: 'tan', hair: 'black', style: 'cap', capCol: 'red', beard: 1, top: 'black', topKind: 'tee', pants: 'jog', shoes: 'white', h: 57, chain: 1 },
  founderW: { skin: 'med', hair: 'black', style: 'fade', beard: 1, top: 'black', topKind: 'tee', pants: 'jog', shoes: 'white', chain: 1, tattoo: 1, h: 58, eye: '#5d8a5a', apron: 1 },
};
const HUMAN = {
  idle0: { aF: [6, -4], aB: [-6, 4] }, idle1: { aF: [6, -4], aB: [-6, 4], bob: 1 }, blink: { aF: [6, -4], aB: [-6, 4], blink: 1 },
  w0: { step: 0, aF: [-22, 10], aB: [20, -10] }, w1: { step: 1, aF: [0, -2], aB: [0, 2], bob: -1 }, w2: { step: 2, aF: [22, -10], aB: [-20, 10] }, w3: { step: 3, aF: [0, -2], aB: [0, 2], bob: -1 },
  reach: { aF: [70, -10], aB: [-6, 4] }, reach1: { aF: [82, -18], aB: [-6, 4], look: 1 },
  carry0: { step: 0, aF: [40, -60], aB: [30, -40], prop: 'box' }, carry1: { step: 1, aF: [40, -60], aB: [30, -40], prop: 'box', bob: -1 }, carry2: { step: 2, aF: [40, -60], aB: [30, -40], prop: 'box' }, carry3: { step: 3, aF: [40, -60], aB: [30, -40], prop: 'box', bob: -1 },
  kneel0: { kneel: 1, aF: [70, 10], aB: [40, 10], prop: 'tool' }, kneel1: { kneel: 1, aF: [85, -5], aB: [40, 10], prop: 'tool' },
  lift: { aF: [120, -10], aB: [110, -10], look: 1 },
  draw0: { sit: 1, aF: [60, 10], aB: [50, 0], prop: 'pencil' }, draw1: { sit: 1, aF: [66, 16], aB: [50, 0], prop: 'pencil' }, drawThink: { sit: 1, aF: [150, -150], aB: [50, 0], look: 1 },
  sitBack: { view: 'back', sit: 1, aF: [10, 0], aB: [10, 0] }, sitBack1: { view: 'back', sit: 1, aF: [10, 0], aB: [10, 0], bob: 1 },
  sitSide: { sit: 1, aF: [40, -40], aB: [30, -30] }, standUp: { aF: [20, -10], aB: [-10, 4], look: 1 },
  welcome: { aF: [95, -20], aB: [-14, 6], smile: 1 }, welcome1: { aF: [100, -30], aB: [-14, 6], smile: 1 },
  smile: { aF: [6, -4], aB: [-6, 4], smile: 1 }, smileBlink: { aF: [6, -4], aB: [-6, 4], smile: 1, blink: 1 },
  proud: { cross: 1, smile: 1 }, proud1: { cross: 1, smile: 1, bob: 1 },
  play0: { sit: 1, aF: [55, -50], aB: [45, -45], prop: 'pad' }, play1: { sit: 1, aF: [58, -55], aB: [45, -45], prop: 'pad', bob: 1 },
  cheer0: { sit: 1, aF: [165, -10], aB: [160, 10], open: 1 }, cheer1: { sit: 1, aF: [170, -20], aB: [165, 20], open: 1, bob: -1 },
  playBack0: { view: 'back', sit: 1, aF: [30, 0], aB: [30, 0] }, playBack1: { view: 'back', sit: 1, aF: [32, 0], aB: [30, 0], bob: 1 },
  cheerBack: { view: 'back', sit: 1, aF: [170, 0], aB: [170, 0] },
  give: { aF: [75, -5], aB: [-6, 4], prop: 'padGive', smile: 1 }, take: { aF: [70, 0], aB: [-6, 4], prop: 'padGive' }, takeShy: { aF: [55, 10], aB: [-6, 4] },
  stand: { aF: [8, -2], aB: [-8, 2] }, front: { view: 'front' }, front1: { view: 'front', bob: 1 },
  back: { view: 'back', aF: [4, 0], aB: [4, 0] }, frontO: { view: 'front', open: 1 }, frontS: { view: 'front', smile: 1 }, lookBack: { aF: [-6, 4], aB: [6, -4], look: 1, open: 1 },
  capeSide: { sit: 1, cape: 1 }, capeSide1: { sit: 1, cape: 1, blink: 1 }, capeTalk: { sit: 1, cape: 1, open: 1, look: 1 }, capeFront: { view: 'front', sit: 1, cape: 1 }, capeFrontB: { view: 'front', sit: 1, cape: 1, blink: 1 }, capeFrontO: { view: 'front', sit: 1, cape: 1, open: 1 }, capeFrontS: { view: 'front', sit: 1, cape: 1, smile: 1 },
  cut0: { aF: [115, -45], aB: [50, -40], prop: 'clipper' }, cut1: { aF: [122, -55], aB: [55, -40], prop: 'clipper' }, cutF0: { view: 'front', raise: 1, prop: 'clipper' }, cutF1: { view: 'front', raise: 1, rw: 1, prop: 'clipper', blink: 1 }, cutTalk: { aF: [110, -45], aB: [-6, 4], prop: 'clipper', open: 1, look: 1 },
  talk0: { aF: [45, -35], aB: [-6, 4], open: 1 }, talk1: { aF: [55, -45], aB: [-6, 4] }, point: { aF: [95, -8], aB: [-6, 4], open: 1 },
  present0: { aF: [115, -25], aB: [40, -20], open: 1 }, present1: { aF: [125, -35], aB: [45, -25], smile: 1 },
  shake0: { aF: [78, -12], aB: [-6, 4], smile: 1 }, shake1: { aF: [72, -6], aB: [-6, 4], smile: 1 },
  phone0: { sit: 1, aF: [62, -82], aB: [48, -72], prop: 'phone', sad: 1 }, phone1: { sit: 1, aF: [62, -82], aB: [48, -72], prop: 'phone', sad: 1, blink: 1 },
  sadFront: { view: 'front', sad: 1 }, sadFront1: { view: 'front', sad: 1, blink: 1 }, sadSit: { view: 'front', sit: 1, sad: 1 }, sadSit1: { view: 'front', sit: 1, sad: 1, blink: 1 },
  type0: { sit: 1, aF: [80, -25], aB: [75, -25] }, type1: { sit: 1, aF: [86, -32], aB: [72, -22], look: 1 },
  tray0: { step: 0, aF: [100, -70], aB: [20, -10], prop: 'pizza' }, tray1: { step: 1, aF: [100, -70], aB: [0, 2], prop: 'pizza', bob: -1 }, tray2: { step: 2, aF: [100, -70], aB: [-20, 10], prop: 'pizza' }, tray3: { step: 3, aF: [100, -70], aB: [0, 2], prop: 'pizza', bob: -1 },
  trayStand: { aF: [100, -70], aB: [-6, 4], prop: 'pizza', smile: 1 }, plates0: { aF: [65, -30], aB: [55, -30], prop: 'plates' }, plates1: { aF: [70, -35], aB: [55, -30], prop: 'plates', bob: 1 },
  sleep: { view: 'front', blink: 1 }, tiredF: { view: 'front', tired: 1, sad: 1 }, tiredB: { view: 'front', tired: 1, blink: 1 }, brushF: { view: 'front', tired: 1, brush: 1 }, brushF1: { view: 'front', tired: 1, brush: 1, bob: 1 },
  slump: { sit: 1, aF: [80, -10], aB: [70, -10], sad: 1, tired: 1 }, slump1: { sit: 1, aF: [80, -10], aB: [70, -10], blink: 1, tired: 1, bob: 1 },
  sitSadF: { view: 'front', sit: 1, sad: 1, tired: 1 }, sitSadF1: { view: 'front', sit: 1, sad: 1, tired: 1, blink: 1 },
  laughF0: { view: 'front', sit: 1, laugh: 1, prop: 'pad' }, laughF1: { view: 'front', sit: 1, laugh: 1, prop: 'pad', bob: 1 },
  waveH0: { view: 'front', wave: 1, w: 0, smile: 1 }, waveH1: { view: 'front', wave: 1, w: 1, smile: 1 },
  sitFront: { view: 'front', sit: 1 }, sitFrontB: { view: 'front', sit: 1, blink: 1 }, sitFrontPad: { view: 'front', sit: 1, prop: 'pad' }, sitFrontO: { view: 'front', sit: 1, open: 1, prop: 'pad' }, sitFrontS: { view: 'front', sit: 1, smile: 1, prop: 'pad' },
  sitTalk: { sit: 1, aF: [70, -30], aB: [45, -45], open: 1, look: 1 }, sitTalk1: { sit: 1, aF: [78, -40], aB: [45, -45], smile: 1 },
  jump0: { view: 'front', both: 1, open: 1, bob: -2 }, jump1: { view: 'front', both: 1, w: 1, smile: 1 },
  exit0: { view: 'back', aF: [10, 0], aB: [-10, 0], bob: -1 }, exit1: { view: 'back', aF: [-10, 0], aB: [10, 0] },
  handle: { aF: [72, 4], aB: [-6, 4] }, handle1: { aF: [78, 2], aB: [-6, 4], blink: 1 }, backW0: { view: 'back', aF: [10, 0], aB: [-10, 0], bob: -1 }, backW1: { view: 'back', aF: [-10, 0], aB: [10, 0] },
};
const LAG = {
  idle0: {}, idle1: { bob: 1 }, w0: { step: 0 }, w1: { step: 1, bob: -1 }, w2: { step: 2 }, w3: { step: 3, bob: -1 },
  front: { view: 'front', smile: 1 }, front1: { view: 'front', smile: 1, bob: 1 }, wave0: { view: 'front', wave: 1, w: 0, smile: 1 }, wave1: { view: 'front', wave: 1, w: 1, smile: 1 },
  back: { view: 'back' }, reach: { reach: 1 },
  sit0: { sit: 1, pad: 1 }, sit1: { sit: 1, pad: 1, w: 1, bob: 1 }, sitLook: { sit: 1, pad: 1, bob: -1 }, offer: { sit: 1, offer: 1 }, sitFront: { view: 'front', sit: 1, smile: 1 },
  wave2: { view: 'front', wave: 1, w: 0, smile: 1, bob: 1 },
};

function atlas(table, draw) {
  const names = Object.keys(table), n = names.length;
  const P = new PX(FW * n, FH), E = new PX(FW * n, FH);
  names.forEach((k, i) => {
    const p1 = new PX(FW, FH), e1 = new PX(FW, FH);
    draw(p1, e1, table[k]); p1.outline(.3, [24, 14, 30]);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = p1.get(x, y); if (c) P.set(i * FW + x, y, c); const e = e1.get(x, y); if (e) E.set(i * FW + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n, canvas: P.c };
}

// makeChar('founder' | 'client' | 'p1'..'p5' | 'lagzilla', {scale})
export function makeChar(kind, o = {}) {
  const isLag = kind === 'lagzilla';
  const A = isLag ? atlas(LAG, drawLag) : atlas(HUMAN, (P, E, p) => drawHuman(P, E, SPECS[kind], p));
  const sc = o.scale ?? 1;
  const mesh = billboard(A.tex, FW * SPX * sc, FH * SPX * sc, { em: A.em, emCol: '#ffffff', emI: isLag ? 2.6 : 1.2 });
  const root = new THREE.Group(); root.add(mesh); root.userData.char = kind;
  const sh = blob(.36 * sc, .5); sh.position.y = .012; root.add(sh);
  return {
    root, mesh, atlas: A, shadowBlob: sh, kind,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(kind + ': no frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    // world position of a point in the drawing (pixel coordinates in the frame)
    at(px, py, flip = false) { const v = new THREE.Vector3((px - FW / 2) * SPX * sc * (flip ? -1 : 1), (FH - py) * SPX * sc, .05); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.add(root.position); },
    height: FH * SPX * sc,
  };
}
export { drawHuman, drawLag, HUMAN, LAG, atlas };
