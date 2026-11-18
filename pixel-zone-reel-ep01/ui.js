// Game HUD over the film (1080×1920): XP bar, the like/comment/follow/share rules, XP pop-ups, arcade cards,
// achievement toast, LEVEL UP, the call to action, subtitles and the veteran's dialogue box.
// Everything stays inside the Reels safe zone: y 230–1440, right 230 px kept clear.
import { VO, T, XP, XPMAX, DUR } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
const CX = 470, SAFE_T = 236, SAFE_B = 1436, SAFE_R = 850;
let DURS = {}, LOGO = null;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const backE = (x, s = 2.2) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
const CYAN = '#2fe6ff', MAG = '#ff2fb4', GOLD = '#ffd23a', RED = '#ff3a4a', INK = '#0b0716';
const TX = [];

export async function overlayReady() {
  await Promise.all(['400 40px "Lilita One"', '600 40px Fredoka', '700 40px Fredoka'].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
  LOGO = new Image(); LOGO.src = 'refs/logo-pixel-zone.png'; await LOGO.decode();
}
export const voDur = id => DURS[id] || 2;

// —— pixel icons (8×8) ——
const ICONS = {
  heart: ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'],
  chat: ['.######.', '########', '##.#.#.#', '########', '.######.', '..##....', '.##.....', '........'],
  user: ['...##...', '..####..', '..####..', '...##...', '.######.', '########', '########', '........'],
  share: ['.....#..', '.....##.', '#######.', '#....##.', '#....#..', '#.......', '#######.', '........'],
  trophy: ['########', '#.####.#', '#.####.#', '.######.', '..####..', '...##...', '..####..', '.######.'],
  bulb: ['..####..', '.######.', '.######.', '.######.', '..####..', '..#..#..', '..####..', '...##...'],
  rew: ['...#...#', '..##..##', '.###.###', '########', '.###.###', '..##..##', '...#...#', '........'],
};
const ICOL = { heart: '#ff3a6a', chat: '#5ff3ff', user: '#7cff6a', share: '#ffd23a', trophy: '#ffd23a', bulb: '#fff36a', rew: '#ffffff' };
function icon(name, x, y, px, col = ICOL[name], a = 1) {
  const P = ICONS[name]; g.save(); g.globalAlpha *= a;
  g.fillStyle = INK; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if (P[j][i] === '#') g.fillRect(x + i * px + px * .4, y + j * px + px * .4, px, px);
  g.fillStyle = col; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if (P[j][i] === '#') g.fillRect(x + i * px, y + j * px, px, px);
  g.restore();
}
// chunky game text: dark outline, pixel drop shadow, optional glow
function gtext(str, x, y, size, col, o = {}) {
  g.save(); g.font = `400 ${size}px "Lilita One"`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (o.spacing) g.letterSpacing = o.spacing + 'px';
  const sh = Math.max(3, size * .08);
  g.fillStyle = INK; g.fillText(str, x + sh, y + sh);
  g.lineWidth = Math.max(6, size * .16); g.strokeStyle = INK; g.strokeText(str, x, y);
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * .5; }
  if (o.grad) { const gr = g.createLinearGradient(0, y - size / 2, 0, y + size / 2); gr.addColorStop(0, o.grad[0]); gr.addColorStop(1, o.grad[1]); g.fillStyle = gr; } else g.fillStyle = col;
  g.fillText(str, x, y); g.restore();
  g.save(); g.font = `400 ${size}px "Lilita One"`; if (o.spacing) g.letterSpacing = o.spacing + 'px'; const w = g.measureText(str).width; g.restore();
  return w;
}
function panel(x, y, w, h, fill = 'rgba(12,8,30,.86)', edge = CYAN) {
  g.save(); g.fillStyle = INK; g.fillRect(x + 6, y + 6, w, h); g.fillStyle = fill; g.fillRect(x, y, w, h);
  g.fillStyle = edge; g.fillRect(x, y, w, 4); g.fillRect(x, y + h - 4, w, 4); g.fillRect(x, y, 4, h); g.fillRect(x + w - 4, y, 4, h);
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 8, y + 8, w - 16, 3); g.restore();
}
const push = (id, text, x0, y0, x1, y1) => TX.push({ id, text, x0, y0, x1, y1 });

// —— XP: the running total and the level ——
function xpAt(t) {
  let v = 0; for (const [t0, n] of XP) v += n * ss(seg(t, t0 + .55, t0 + .95));
  if (t > T.lvl) v = Math.max(v, XPMAX * ss(seg(t, T.lvl - .3, T.lvl + .15)));
  return v;
}
function xpBar(t) {
  const a = ss(seg(t, .05, .4)); if (a <= 0) return;
  const lv2 = t > T.lvl + .45, x = 54, y = 244, w = 780, h = 104;
  g.save(); g.globalAlpha = a;
  panel(x, y, w, h, 'rgba(10,6,26,.82)', lv2 ? GOLD : CYAN);
  g.save(); g.beginPath(); g.arc(x + 54, y + 52, 38, 0, 7); g.clip(); g.drawImage(LOGO, x + 16, y + 14, 76, 76); g.restore();
  gtext('PIXEL ZONE', x + 112, y + 32, 34, '#ffffff', { align: 'left', spacing: 1 });
  const lvTxt = lv2 ? 'LV 2' : 'LV 1', pulse = lv2 ? 1 + .25 * Math.max(0, 1 - (t - T.lvl - .45) / .5) : 1;
  g.save(); g.translate(x + w - 96, y + 32); g.scale(pulse, pulse); gtext(lvTxt, 0, 0, 34, lv2 ? GOLD : CYAN); g.restore();
  // bar
  const bx = x + 112, by = y + 58, bw = w - 140, bh = 30, v = lv2 ? (t - T.lvl - .45) * 12 : xpAt(t), k = clamp(v / XPMAX);
  g.fillStyle = INK; g.fillRect(bx - 4, by - 4, bw + 8, bh + 8); g.fillStyle = '#1c1238'; g.fillRect(bx, by, bw, bh);
  const segs = 24, sw = bw / segs;
  for (let i = 0; i < segs; i++) { const f = clamp(k * segs - i); if (f <= 0) break; const c = i / segs; g.fillStyle = lv2 ? GOLD : `hsl(${190 + c * 120},100%,${58 + 6 * Math.sin(t * 6 + i)}%)`; g.fillRect(bx + i * sw + 2, by + 2, (sw - 4) * f, bh - 4); }
  g.font = '700 22px Fredoka'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(`XP ${Math.round(v)} / ${XPMAX}`, bx + bw - 8, by + bh / 2 + 1);
  g.restore();
  if (a > .99) push('xpbar', 'PIXEL ZONE ' + lvTxt, x, y, x + w, y + h);
}
// —— the rules: what a like / comment / follow / share is worth ——
function rules(t) {
  const t0 = .35, t1 = 4.0, a = ss(seg(t, t0, t0 + .3)) * (1 - ss(seg(t, t1 - .3, t1))); if (a <= 0) return;
  const x = 54, y = 368, w = 780, h = 120;
  g.save(); g.globalAlpha = a; panel(x, y - (1 - a) * 20, w, h, 'rgba(10,6,26,.8)', MAG);
  const items = [['heart', '+10'], ['chat', '+25'], ['user', '+50'], ['share', '+100']];
  items.forEach(([ic, n], i) => { const ix = x + 26 + i * 192, k = ss(seg(t, t0 + .15 + i * .12, t0 + .4 + i * .12)); g.save(); g.globalAlpha = a * k; icon(ic, ix, y + 26, 6); gtext(n, ix + 98, y + 50, 40, '#ffffff'); g.restore(); });
  g.font = '700 23px Fredoka'; g.textAlign = 'center'; g.fillStyle = '#ffb8ec'; g.fillText('CURTIR · COMENTAR · SEGUIR · PARTILHAR = XP', x + w / 2, y + h - 18);
  g.restore();
  if (a > .99) push('rules', '+10 +25 +50 +100 CURTIR COMENTAR SEGUIR PARTILHAR XP', x, y, x + w, y + h);
}
// —— pop-ups: +XP rising into the bar ——
function popups(t) {
  XP.forEach(([t0, n, ic, label], i) => {
    const k = (t - t0) / 1.15; if (k < 0 || k > 1) return;
    const x = 160 + ((i * 197) % 520), y = 760 - 360 * ss(k) , a = ss(seg(k, 0, .12)) * (1 - ss(seg(k, .75, 1))), s = backE(seg(k, 0, .2));
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
    icon(ic, -94, -22, 5.5); gtext(`+${n} XP`, 40, -4, 46, ICOL[ic]); g.font = '700 22px Fredoka'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(label, 40, 34);
    g.restore();
  });
}
// —— big arcade cards ——
function card(t, t0, t1, fn) { const a = ss(seg(t, t0, t0 + .12)) * (1 - ss(seg(t, t1 - .2, t1))); if (a > 0) { g.save(); g.globalAlpha = a; fn(a, t - t0); g.restore(); } return a; }
const CY = 660;
function cards(t) {
  // 1 YOU LOSE · 5–0
  if (card(t, .1, 2.7, (a, lt) => { const s = 1 + .6 * (1 - backE(seg(lt, 0, .25))), sx = lt < .4 ? Math.sin(lt * 80) * 10 * (1 - lt / .4) : 0;
    g.translate(CX + sx, CY); g.scale(s, s); gtext('YOU LOSE', 0, 0, 150, RED, { grad: ['#ff8a8a', '#e01a2a'], glow: 'rgba(255,40,60,.7)', spacing: 4 }); }) > .99) push('lose', 'YOU LOSE', 120, CY - 80, 820, CY + 80);
  // 3 ◀◀ 10 MIN ANTES
  if (card(t, T.rewind, 5.95, (a, lt) => { const j = lt < .5 ? Math.round(Math.sin(lt * 90) * 8) : 0; icon('rew', 96 + j, CY - 40, 10); g.save(); g.globalAlpha *= .6; gtext('10 MIN ANTES', 206 + j + 4, CY, 80, MAG, { align: 'left' }); g.restore(); gtext('10 MIN ANTES', 206 + j, CY, 80, '#ffffff', { align: 'left' }); }) > .99) push('rew', '10 MIN ANTES', 90, CY - 50, 760, CY + 50);
  // 4 AMIGOS: 0
  if (card(t, 6.3, 8.0, (a, lt) => { panel(CX - 270, CY - 70, 540, 140, 'rgba(10,6,26,.85)', RED); icon('user', CX - 240, CY - 36, 9, '#9a9ab0'); gtext('AMIGOS:', CX + 10, CY, 60, '#ffffff'); gtext('0', CX + 195, CY, 76, RED); }) > .99) push('am0', 'AMIGOS: 0', CX - 230, CY - 70, CX + 230, CY + 70);
  // 7 DICA DESBLOQUEADA
  if (card(t, T.tip - .15, 14.1, (a, lt) => { const s = backE(seg(lt, 0, .25)); g.translate(CX, CY); g.scale(s, s); panel(-330, -64, 660, 128, 'rgba(26,20,4,.88)', GOLD); icon('bulb', -300, -36, 9); gtext('NOVA DICA!', 40, 2, 64, GOLD); }) > .99) push('tip', 'NOVA DICA!', CX - 330, CY - 64, CX + 330, CY + 64);
  // 8 TRY AGAIN · ROUND 2
  if (card(t, 14.1, 16.05, (a, lt) => { const s = 1 + .5 * (1 - backE(seg(lt, 0, .22))); g.translate(CX, CY); g.scale(s, s); gtext('TRY AGAIN', 0, 0, 128, CYAN, { grad: ['#c8fbff', '#2fc6ff'], glow: 'rgba(47,230,255,.7)', spacing: 3 }); }) > .99) push('again', 'TRY AGAIN', 120, CY - 70, 820, CY + 70);
  // 10 GOOOL! 90'
  if (card(t, T.goal - .05, 20.08, (a, lt) => { const s = 1 + .8 * (1 - backE(seg(lt, 0, .25))), on = Math.floor(lt * 8) % 2; g.translate(CX, CY); g.rotate(-.05); g.scale(s, s); gtext('GOOOL!', 0, 0, 170, on ? GOLD : MAG, { glow: on ? 'rgba(255,210,58,.8)' : 'rgba(255,47,180,.8)', spacing: 4 }); }) > .99) push('gol', 'GOOOL!', 110, CY - 100, 830, CY + 100);
  // 11 YOU WIN
  if (card(t, T.win - .05, 22.08, (a, lt) => { const s = 1 + .6 * (1 - backE(seg(lt, 0, .25))); g.translate(CX, CY); g.scale(s, s); rays(lt, GOLD); gtext('YOU WIN', 0, 0, 160, GOLD, { grad: ['#fff6b0', '#ffb81a'], glow: 'rgba(255,210,58,.8)', spacing: 4 }); }) > .99) push('win', 'YOU WIN', 130, CY - 90, 810, CY + 90);
  // 12 achievement toast + AMIGOS: 3
  if (card(t, 22.1, 24.45, (a, lt) => { const x = 54 - (1 - backE(seg(lt, 0, .3))) * 600, y = 372; panel(x, y, 780, 150, 'rgba(26,18,4,.9)', GOLD); icon('trophy', x + 26, y + 42, 9); gtext('CONQUISTA', x + 128, y + 44, 38, GOLD, { align: 'left' }); gtext('PRIMEIRO SQUAD', x + 128, y + 100, 52, '#ffffff', { align: 'left' }); }) > .99) push('ach', 'CONQUISTA PRIMEIRO SQUAD', 54, 372, 834, 522);
  // 13 LEVEL UP!
  if (card(t, T.lvl + .05, 26.5, (a, lt) => { const s = 1 + .7 * (1 - backE(seg(lt, 0, .3))); g.translate(CX, CY + 40); g.scale(s, s); rays(lt, CYAN); gtext('LEVEL UP!', 0, 0, 150, CYAN, { grad: ['#ffffff', '#2fe6ff'], glow: 'rgba(47,230,255,.9)', spacing: 4 }); }) > .99) push('lvl', 'LEVEL UP!', 110, CY - 50, 830, CY + 130);
  // 14 RESERVA · LINK NA BIO
  if (card(t, T.cta, DUR, (a, lt) => { const s = backE(seg(lt, 0, .3)), bob = Math.sin(lt * 5) * 6; g.translate(CX, 1010 + bob); g.scale(s, s);
    g.fillStyle = INK; g.fillRect(-330 + 8, -70 + 8, 660, 140); const gr = g.createLinearGradient(-330, 0, 330, 0); gr.addColorStop(0, MAG); gr.addColorStop(1, '#8a3aff'); g.fillStyle = gr; g.fillRect(-330, -70, 660, 140);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-318, -60, 636, 10); gtext('RESERVA', 0, -18, 62, '#ffffff'); g.font = '700 34px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText('PELO LINK NA BIO', 0, 36);
    if (Math.floor(lt * 2.5) % 2 === 0) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-16, 96); g.lineTo(16, 96); g.lineTo(0, 118); g.fill(); } }) > .99) push('cta', 'RESERVA PELO LINK NA BIO', CX - 330, 940, CX + 330, 1080);
}
function rays(lt, col) { g.save(); g.globalAlpha *= .35; g.fillStyle = col; g.rotate(lt * .8); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -520); g.lineTo(40, -520); g.fill(); } g.restore(); }
// —— subtitles (Lagzilla): rounded game font, outlined, inside the safe zone ——
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
const SUBS = VO.filter(v => !v.ann && !v.dlg && !v.hide);
function subEnd(v) { const d = voDur(v.id), i = SUBS.indexOf(v), nx = SUBS[i + 1]; return Math.max(v.t + d + .25, nx ? Math.min(nx.t - .12, v.t + d + 1.6) : DUR); }
function subtitle(t, v) {
  const d = voDur(v.id), t0 = v.t - .1, t1 = subEnd(v);
  const a = ss(seg(t, t0, t0 + .12)) * (1 - ss(seg(t, t1 - .15, t1))); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.font = '700 56px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  const lines = wrap(v.sub, 720), lh = 66, yb = SAFE_B - 40, ytop = yb - (lines.length - 1) * lh;
  lines.forEach((L, i) => { const y = ytop + i * lh; g.lineWidth = 12; g.strokeStyle = INK; g.strokeText(L, CX, y); g.fillStyle = '#ffffff'; g.fillText(L, CX, y); });
  g.restore();
  if (a > .99) push('sub_' + v.id, v.sub, CX - 380, ytop - 56, CX + 380, yb + 14);
}
// —— dialogue box (the veteran) ——
function dialog(t, v) {
  const d = voDur(v.id), t0 = v.t - .15, t1 = v.t + Math.max(d + .6, 2.0);
  const a = ss(seg(t, t0, t0 + .15)) * (1 - ss(seg(t, t1 - .15, t1))); if (a <= 0) return;
  const bw = 760, bh = 170, x = CX - bw / 2, y = SAFE_B - bh - 20;
  g.save(); g.globalAlpha = a; panel(x, y, bw, bh, 'rgba(10,6,26,.9)', '#ff5a4a');
  g.fillStyle = '#ff5a4a'; g.fillRect(x + 30, y - 34, 250, 52); gtext(v.who, x + 155, y - 8, 36, '#ffffff');
  g.font = '700 54px Fredoka'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  const n = v.sub.length, shown = Math.floor(n * clamp((t - v.t + .05) / (d * .85))); g.fillText(v.sub.slice(0, shown), x + 40, y + bh / 2 + 6);
  if (shown >= n && Math.floor(t * 3) % 2 === 0) { g.fillStyle = '#ff5a4a'; g.beginPath(); g.moveTo(x + bw - 52, y + bh - 40); g.lineTo(x + bw - 28, y + bh - 40); g.lineTo(x + bw - 40, y + bh - 26); g.fill(); }
  g.restore();
  if (a > .99) TX.push({ id: 'dlg_' + v.id, text: v.sub, x0: x, y0: y - 34, x1: x + bw, y1: y + bh, typing: true, t0: v.t });
}
// —— screen effects: VHS rewind, flashback scanlines, flashes ——
function fx(t) {
  if (t > T.rewind && t < 10) {   // the flashback: light scanlines; the rewind itself tears the picture
    const k = t < T.rewind + .55 ? 1 : 0;
    g.save(); g.globalAlpha = .1 + .25 * k; g.fillStyle = '#000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
    if (k) { for (let i = 0; i < 7; i++) { const y = ((t * 3100 + i * 337) % H) | 0, hgt = 20 + (i * 13) % 60; g.save(); g.globalAlpha = .35; g.fillStyle = i % 2 ? '#ffffff' : '#7a6aff'; g.fillRect(0, y, W, hgt * .2); g.globalAlpha = .18; g.fillStyle = '#2fe6ff'; g.fillRect(-20, y + hgt * .3, W, hgt * .5); g.restore(); } }
  }
  const flash = Math.max(1 - seg(t, T.goal, T.goal + .25), 1 - seg(t, T.lvl + .1, T.lvl + .35), 1 - seg(t, T.win, T.win + .15)) * (t > T.goal ? 1 : 0);
  if (flash > 0 && flash < 1) { g.fillStyle = `rgba(255,255,255,${flash * .55})`; g.fillRect(0, 0, W, H); }
  if (t < .12) { g.fillStyle = `rgba(255,40,60,${(1 - t / .12) * .35})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t, shot, info = {}) {
  g.clearRect(0, 0, W, H); TX.length = 0;
  fx(t);
  xpBar(t); rules(t); popups(t); cards(t);
  for (const v of VO) { if (v.ann || v.hide) continue; if (v.dlg) dialog(t, v); else subtitle(t, v); }
}
export function texts(t) { return TX.map(({ id, text, x0, y0, x1, y1 }) => ({ id, text, x0, y0, x1, y1 })); }
export function cues() { return VO.filter(v => !v.ann).map(v => ({ t0: +(v.t - .1).toFixed(2), t1: +(v.dlg ? v.t + voDur(v.id) + .6 : v.hide ? v.t + voDur(v.id) + .25 : subEnd(v)).toFixed(2), text: v.dlg ? '— ' + v.sub : v.sub })); }
