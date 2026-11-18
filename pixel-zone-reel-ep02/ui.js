// Game HUD over the film (1080×1920): XP bar, the like/comment/follow/share rules, XP pop-ups, arcade cards,
// achievement toast, LEVEL UP, the call to action, subtitles and the veteran's dialogue box.
// Everything stays inside the Reels safe zone: y 230–1440, right 230 px kept clear.
import { VO, T, XP, XPMAX, DUR, HP, hpAt } from './story.js';

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
  shield: ['########', '#.####.#', '#.####.#', '#.####.#', '.#.##.#.', '.#.##.#.', '..#..#..', '...##...'],
  warn: ['...##...', '..####..', '..#..#..', '.##..##.', '.######.', '###..###', '########', '........'],
  rew: ['...#...#', '..##..##', '.###.###', '########', '.###.###', '..##..##', '...#...#', '........'],
};
const ICOL = { shield: '#5fff8a', warn: '#ff3a4a', heart: '#ff3a6a', chat: '#5ff3ff', user: '#7cff6a', share: '#ffd23a', trophy: '#ffd23a', bulb: '#fff36a', rew: '#ffffff' };
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
  const x = 54, y = 466, w = 780, h = 120;
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
// —— HP: the day takes it, the Pixel Zone gives it back ——
function hpBar(t) {
  const a = ss(seg(t, .05, .4)); if (a <= 0) return;
  const v = hpAt(t, ss), low = v <= 26 && t < T.door, x = 54, y = 358, w = 780, h = 92;
  let sx = 0; for (const [t0, d] of HP) if (d < 0 && t > t0 && t < t0 + .35) sx = Math.sin((t - t0) * 90) * 12 * (1 - (t - t0) / .35);
  const edge = low ? (Math.floor(t * 4) % 2 ? RED : '#6a1018') : v >= 100 && t > T.door ? '#5fff8a' : '#ff6a8a';
  g.save(); g.globalAlpha = a; g.translate(sx, 0); panel(x, y, w, h, 'rgba(10,6,26,.82)', edge);
  icon('heart', x + 24, y + 22, 6, low && Math.floor(t * 4) % 2 ? '#ffffff' : '#ff3a6a');
  gtext('HP', x + 108, y + 46, 40, '#ffffff');
  const bx = x + 150, by = y + 30, bw = w - 300, bh = 32, k = clamp(v / 100), segs = 20, sw = bw / segs, col = v > 50 ? '#5fff8a' : v > 26 ? GOLD : RED;
  g.fillStyle = INK; g.fillRect(bx - 4, by - 4, bw + 8, bh + 8); g.fillStyle = '#2a0e18'; g.fillRect(bx, by, bw, bh);
  for (let i = 0; i < segs; i++) { const f = clamp(k * segs - i); if (f <= 0) break; g.fillStyle = col; g.fillRect(bx + i * sw + 2, by + 2, (sw - 4) * f, bh - 4); }
  gtext(`${Math.round(v)}/100`, x + w - 74, y + 46, 38, col);
  g.restore();
  if (a > .99) push('hp', 'HP', x, y, x + w, y + h);
}
function card(t, t0, t1, fn) { const a = ss(seg(t, t0, t0 + .12)) * (1 - ss(seg(t, t1 - .2, t1))); if (a > 0) { g.save(); g.globalAlpha = a; fn(a, t - t0); g.restore(); } return a; }
const CY = 720;
function dmgCard(t, t0, t1, n, label, id) {
  const heal = n > 0, col = heal ? '#5fff8a' : RED;
  if (card(t, t0, t1, (a, lt) => { const s = 1 + .7 * (1 - backE(seg(lt, 0, .22))), sx = !heal && lt < .35 ? Math.sin(lt * 90) * 14 * (1 - lt / .35) : 0;
    g.translate(CX + sx, CY - (heal ? ss(seg(lt, 0, 1.2)) * 30 : 0)); g.scale(s, s);
    gtext(`${heal ? '+' : '−'}${Math.abs(n)} HP`, 0, 0, 150, col, { grad: heal ? ['#c8ffd8', '#2ad86a'] : ['#ff9a9a', '#e01a2a'], glow: heal ? 'rgba(80,255,140,.7)' : 'rgba(255,40,60,.7)', spacing: 3 });
    gtext(label, 0, 112, 60, '#ffffff'); }) > .99) push(id, `${heal ? '+' : '-'}${Math.abs(n)} HP ${label}`, 110, CY - 90, 830, CY + 150);
}
function cards(t) {
  dmgCard(t, 1.15, 3.6, -10, '07:00', 'd1');
  dmgCard(t, 6.15, 8.0, -20, 'TRÂNSITO', 'd2');
  dmgCard(t, 10.55, 12.1, -30, 'O CHEFE', 'd3');
  dmgCard(t, 14.3, 15.2, -25, 'URGENTE', 'd4');
  if (card(t, 15.15, 20.55, (a, lt) => { const on = Math.floor(lt * 3) % 2 === 0; panel(CX - 300, CY - 72, 600, 144, on ? 'rgba(60,4,12,.9)' : 'rgba(26,4,8,.9)', RED); icon('warn', CX - 270, CY - 38, 9); gtext('LOW HP', CX + 50, CY, 92, on ? RED : '#ff9aa4', { glow: 'rgba(255,40,60,.6)' }); }) > .99) push('low', 'LOW HP', CX - 300, CY - 72, CX + 300, CY + 72);
  if (card(t, T.door + .05, 22.55, (a, lt) => { const s = backE(seg(lt, 0, .3)); g.translate(CX, CY); g.scale(s, s); rays(lt, '#5fff8a'); panel(-380, -95, 760, 190, 'rgba(4,26,12,.88)', '#5fff8a'); icon('shield', -350, -40, 10); gtext('SAFE ZONE', 50, -28, 92, '#5fff8a', { glow: 'rgba(80,255,140,.7)' }); gtext('ENCONTRADA', 50, 50, 50, '#ffffff'); }) > .99) push('safe', 'SAFE ZONE ENCONTRADA', CX - 380, CY - 95, CX + 380, CY + 95);
  dmgCard(t, 24.55, 26.0, 30, 'COMANDO', 'h1');
  dmgCard(t, 27.45, 28.9, 25, 'AMIGOS', 'h2');
  dmgCard(t, 30.95, 31.75, 30, 'RISADA', 'h3');
  if (card(t, T.lvl, 33.2, (a, lt) => { const s = 1 + .7 * (1 - backE(seg(lt, 0, .3))); g.translate(CX, CY); g.scale(s, s); rays(lt, CYAN); gtext('HP MÁXIMO', 0, -40, 96, '#5fff8a', { glow: 'rgba(80,255,140,.7)' }); gtext('LEVEL UP!', 0, 70, 120, CYAN, { grad: ['#ffffff', '#2fe6ff'], glow: 'rgba(47,230,255,.9)', spacing: 4 }); }) > .99) push('lvl', 'HP MÁXIMO LEVEL UP!', 110, CY - 110, 830, CY + 140);
  if (card(t, T.cta, 41.3, (a, lt) => { const s = backE(seg(lt, 0, .3)), bob = Math.sin(lt * 5) * 6; g.translate(CX, 1010 + bob); g.scale(s, s);
    g.fillStyle = INK; g.fillRect(-330 + 8, -70 + 8, 660, 140); const gr = g.createLinearGradient(-330, 0, 330, 0); gr.addColorStop(0, MAG); gr.addColorStop(1, '#8a3aff'); g.fillStyle = gr; g.fillRect(-330, -70, 660, 140);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-318, -60, 636, 10); gtext('RESERVA', 0, -18, 62, '#ffffff'); g.font = '700 34px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText('PELO LINK NA BIO', 0, 36);
    if (Math.floor(lt * 2.5) % 2 === 0) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-16, 96); g.lineTo(16, 96); g.lineTo(0, 118); g.fill(); } }) > .99) push('cta', 'RESERVA PELO LINK NA BIO', CX - 330, 940, CX + 330, 1080);
}
function mirrorFrame(lt) {
  const k = .86 + .03 * ss(seg(lt, 0, 2)), w = W * k, h = H * .8 * k, x = (W - w) / 2, y = (H - h) / 2 + 40;
  g.save(); g.fillStyle = 'rgba(200,205,215,.9)'; g.beginPath(); g.rect(0, 0, W, H); g.roundRect(x + w, y, -w, h, 40); g.fill('evenodd');
  g.strokeStyle = '#6a6e78'; g.lineWidth = 14; g.beginPath(); g.roundRect(x, y, w, h, 40); g.stroke();
  g.globalAlpha = .12; const gl = g.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.42, 'rgba(255,255,255,1)'); gl.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h); g.restore();
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
// —— screen effects: damage flashes, the low-HP heartbeat, the heal glow ——
function fx(t, info) {
  for (const [t0, d] of HP) { const k = (t - t0) / .3; if (k > 0 && k < 1) { g.fillStyle = d < 0 ? `rgba(255,30,50,${(1 - k) * .3})` : `rgba(80,255,140,${(1 - k) * .22})`; g.fillRect(0, 0, W, H); } }
  if (hpAt(t) <= 26 && t < T.door) {   // heartbeat, 72 bpm
    const p = (t * 1.2) % 1, beat = Math.exp(-p * 9) + .6 * Math.exp(-Math.max(0, p - .22) * 9) * (p > .22);
    const gr = g.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .7); gr.addColorStop(0, 'rgba(255,0,30,0)'); gr.addColorStop(1, `rgba(200,0,30,${.25 + .35 * beat})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  const flash = 1 - seg(t, T.door + .05, T.door + .3); if (t > T.door && flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * .6})`; g.fillRect(0, 0, W, H); }
  const lv = 1 - seg(t, T.lvl, T.lvl + .25); if (t > T.lvl && lv > 0) { g.fillStyle = `rgba(255,255,255,${lv * .5})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t, shot, info = {}) {
  g.clearRect(0, 0, W, H); TX.length = 0;
  if (info.mirror != null) mirrorFrame(info.mirror);
  fx(t, info);
  xpBar(t); hpBar(t);
  if (shot.id === 'loop') return;
  rules(t); popups(t); cards(t);
  for (const v of VO) { if (v.ann || v.hide) continue; if (v.dlg) dialog(t, v); else subtitle(t, v); }
}
export function texts(t) { return TX.map(({ id, text, x0, y0, x1, y1 }) => ({ id, text, x0, y0, x1, y1 })); }
export function cues() { return VO.filter(v => !v.ann).map(v => ({ t0: +(v.t - .1).toFixed(2), t1: +(v.dlg ? v.t + voDur(v.id) + .6 : v.hide ? v.t + voDur(v.id) + .25 : subEnd(v)).toFixed(2), text: v.dlg ? '— ' + v.sub : v.sub })); }
