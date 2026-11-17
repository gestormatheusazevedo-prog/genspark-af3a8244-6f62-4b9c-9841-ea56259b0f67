// 2D overlay (1080×1920): chapter card, mirror frame, narration subtitles, dialogue box, opening date, end card with the logo.
import { VO, T, SHOTS, DUR } from './story.js';

const cv = document.getElementById('ov'), g = cv.getContext('2d');
export const W = 1080, H = 1920;
let DURS = {}, LOGO = null;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const backE = (x, s = 2) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
const GOLD = '#e2c989', PAPER = '#f6f0e2';

export async function overlayReady() {
  await Promise.all(['500 40px Cinzel', '700 40px Cinzel', 'italic 500 40px "Cormorant Garamond"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"'].map(f => document.fonts.load(f)));
  DURS = await (await fetch('voices/dur.json')).json();
  LOGO = new Image(); LOGO.src = 'refs/logo-pixel-zone.png'; await LOGO.decode();
}
export const voDur = id => DURS[id] || 3;

function ornament(cx, y, w, a, col = GOLD) {
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.lineWidth = 1.5;
  for (const s of [-1, 1]) { const gr = g.createLinearGradient(cx, 0, cx + s * w, 0); gr.addColorStop(0, 'rgba(226,201,137,1)'); gr.addColorStop(1, 'rgba(226,201,137,0)'); g.strokeStyle = gr; g.beginPath(); g.moveTo(cx + s * 16, y); g.lineTo(cx + s * w, y); g.stroke(); g.beginPath(); g.arc(cx + s * 26, y, 2.5, 0, 7); g.fill(); }
  g.strokeStyle = col; g.beginPath(); g.moveTo(cx, y - 8); g.lineTo(cx + 8, y); g.lineTo(cx, y + 8); g.lineTo(cx - 8, y); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(cx, y - 3.5); g.lineTo(cx + 3.5, y); g.lineTo(cx, y + 3.5); g.lineTo(cx - 3.5, y); g.closePath(); g.fill(); g.restore();
}
function spaced(text, x, y, sp) { const ws = [...text].map(c => g.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let cx = x - tot / 2; [...text].forEach((c, i) => { g.fillText(c, cx + ws[i] / 2, y); cx += ws[i] + sp; }); return tot; }
function glowText(fn, col, blur) { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); fn(); }
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; } if (cur) lines.push(cur); return lines; }
const TX = [];   // texts visible this frame (for readcheck)

// —— chapter card over the opening close-up (top third, away from the subtitles) ——
const CARD = { a: .1, b: 3.95 };
function chapterCard(t) {
  if (t > CARD.b + .1) return;
  const a0 = ss(seg(t, CARD.a, CARD.a + .7)), a1 = ss(seg(t, CARD.a + .4, CARD.a + 1.1)), out = 1 - ss(seg(t, CARD.b - .5, CARD.b));
  const y0 = 420;
  g.save(); g.globalAlpha = .5 * Math.max(a0, a1) * out; const bg = g.createLinearGradient(0, y0 - 200, 0, y0 + 200); bg.addColorStop(0, 'rgba(4,6,16,0)'); bg.addColorStop(.5, 'rgba(4,6,16,.9)'); bg.addColorStop(1, 'rgba(4,6,16,0)'); g.fillStyle = bg; g.fillRect(0, y0 - 200, W, 400); g.restore();
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = a0 * out; g.fillStyle = '#d8c28e'; g.font = '500 44px Cinzel'; spaced('LEVEL  001', W / 2, y0 - 60, 14);
  ornament(W / 2, y0 - 10, 220 * (.4 + .6 * a0), a0 * out);
  g.globalAlpha = a1 * out; g.fillStyle = PAPER; g.font = 'italic 500 92px "Cormorant Garamond"';
  glowText(() => g.fillText('O Começo', W / 2, y0 + 70 - (1 - a1) * 12), 'rgba(255,200,140,.4)', 28);
  g.restore();
  if (out > .99 && t > CARD.a + .8) { TX.push({ id: 'card1', text: 'LEVEL 001', x0: 300, y0: y0 - 90, x1: 780, y1: y0 - 30 }); TX.push({ id: 'card2', text: 'O Começo', x0: 250, y0: y0 + 10, x1: 830, y1: y0 + 130 }); }
}

// —— the mirror: a black frame that the camera travels through ——
function mirrorFrame(lt) {
  if (lt < 0 || lt > 4.2) return;
  const k = ss(seg(lt, .2, 4.0)), sc = .78 + .62 * k, w = W * sc, h = H * sc, x = (W - w) / 2, y = (H - h) / 2;
  g.save(); g.fillStyle = '#0a0a0c'; g.beginPath(); g.rect(0, 0, W, H); g.rect(x + w, y, -w, h); g.fill('evenodd');
  g.strokeStyle = 'rgba(60,60,70,.9)'; g.lineWidth = 10; g.strokeRect(x - 5, y - 5, w + 10, h + 10);
  g.globalAlpha = .18 * (1 - k); const gl = g.createLinearGradient(x, y, x + w, y + h); gl.addColorStop(0, 'rgba(255,255,255,.0)'); gl.addColorStop(.45, 'rgba(255,255,255,.9)'); gl.addColorStop(.55, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(x, y, w, h);
  g.restore();
}

// —— 17 DE AGOSTO: the opening day ——
function dateCard(t) {
  const t0 = T.date, t1 = t0 + 3.9; if (t < t0 || t > t1) return;
  const a = ss(seg(t, t0, t0 + .5)) * (1 - ss(seg(t, t1 - .5, t1))), y = 420;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = a * .55;
  const bg = g.createLinearGradient(0, y - 170, 0, y + 170); bg.addColorStop(0, 'rgba(4,6,16,0)'); bg.addColorStop(.5, 'rgba(4,6,16,.92)'); bg.addColorStop(1, 'rgba(4,6,16,0)'); g.fillStyle = bg; g.fillRect(0, y - 170, W, 340);
  g.globalAlpha = a; g.font = '700 96px Cinzel'; g.fillStyle = PAPER; glowText(() => spaced('17 · 08 · 2026', W / 2, y - 20, 6), 'rgba(47,230,255,.6)', 26);
  g.font = '500 40px Cinzel'; g.fillStyle = '#ff9ae0'; glowText(() => spaced('INAUGURAÇÃO', W / 2, y + 62, 14), 'rgba(255,47,180,.6)', 18);
  g.restore();
  if (a > .99) TX.push({ id: 'date', text: '17 · 08 · 2026 INAUGURAÇÃO', x0: 100, y0: y - 90, x1: W - 100, y1: y + 95 });
}

// —— narration subtitles: italic serif, centred, lower third, soft band ——
function subtitle(t, v) {
  const d = voDur(v.id), t0 = v.t - .35, t1 = v.t + Math.max(d + .6, 1.8);
  const a = ss(seg(t, t0, t0 + .3)) * (1 - ss(seg(t, t1 - .3, t1)));
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = 'italic 500 58px "Cormorant Garamond"';
  const lines = wrap(v.sub, 900), lh = 66, yb = H - 420, ytop = yb - (lines.length - 1) * lh;
  const sh = g.createLinearGradient(0, ytop - 90, 0, yb + 50); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.5, 'rgba(0,0,0,.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(0, ytop - 90, W, yb - ytop + 140);
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = PAPER;
  lines.forEach((L, i) => g.fillText(L, W / 2, ytop + i * lh));
  g.restore();
}

// —— dialogue box (dark plate, thin gold frame, name plate, typed text, blinking caret) ——
function dialog(t, v) {
  const d = voDur(v.id), t0 = v.t - .3, t1 = v.t + Math.max(d + 1.5, 2.6, v.sub.length / 15 + 2.1);
  const a = ss(seg(t, t0, t0 + .25)) * (1 - ss(seg(t, t1 - .25, t1)));
  if (a <= 0) return;
  const bw = 940, bh = 230, x = (W - bw) / 2, y = H - bh - 360 + (1 - a) * 14;
  g.save(); g.globalAlpha = a;
  const bgr = g.createLinearGradient(0, y, 0, y + bh); bgr.addColorStop(0, 'rgba(14,16,34,.88)'); bgr.addColorStop(1, 'rgba(6,6,18,.92)'); g.fillStyle = bgr; g.fillRect(x, y, bw, bh);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 2; g.strokeRect(x + .5, y + .5, bw - 1, bh - 1);
  g.strokeStyle = 'rgba(214,190,130,.35)'; g.lineWidth = 1; g.strokeRect(x + 7.5, y + 7.5, bw - 15, bh - 15);
  for (const [cx, cy] of [[x, y], [x + bw, y], [x, y + bh], [x + bw, y + bh]]) { g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx, cy - 7); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 7); g.lineTo(cx - 7, cy); g.fill(); }
  g.font = '500 32px Cinzel'; const nw = g.measureText(v.who).width + 60;
  g.fillStyle = 'rgba(10,12,24,.96)'; g.fillRect(x + 36, y - 28, nw, 54); g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.5; g.strokeRect(x + 36.5, y - 27.5, nw - 1, 53);
  g.fillStyle = '#e8d5a4'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(v.who, x + 66, y - 1);
  g.font = '500 60px "Cormorant Garamond"'; g.fillStyle = '#f4efe4';
  const n = v.sub.length, shown = Math.floor(n * clamp((t - v.t + .05) / (d * .9)));
  const lines = wrap(v.sub, bw - 140); if (lines.length > 1 && !v.muffled) { let k = shown; lines.forEach((L, i) => { const s2 = L.slice(0, Math.max(0, k)); k -= L.length + 1; g.fillText(s2, x + 70, y + 92 + i * 66); }); }
  else if (v.muffled) { g.fillStyle = '#9ff4ff'; g.font = 'italic 500 60px "Cormorant Garamond"'; const str = v.sub.slice(0, shown); let cx = x + 70; for (const ch of str) { g.fillText(ch, cx, y + 118 + Math.sin(t * 6 + cx * .05) * 3); cx += g.measureText(ch).width; } }
  else g.fillText(v.sub.slice(0, shown), x + 70, y + 118);
  if (shown >= n && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = GOLD; const tx = x + bw - 56, ty = y + bh - 40; g.beginPath(); g.moveTo(tx - 10, ty - 6); g.lineTo(tx + 10, ty - 6); g.lineTo(tx, ty + 7); g.fill(); }
  g.restore();
  if (a > .99) TX.push({ id: 'dlg_' + v.id, text: v.sub, x0: x, y0: y, x1: x + bw, y1: y + bh, typing: true, t0: v.t });
}

// —— end card: logo, tagline, LEVEL 001 COMPLETE ——
function endCard(t) {
  const a0 = ss(seg(t, T.logo, T.logo + .25)); if (a0 <= 0) return;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const out = 1 - ss(seg(t, DUR - .7, DUR - .05)), la = ss(seg(t, T.logo + .4, T.logo + 1.4)) * out, s = 600 * (.96 + .04 * ss(seg(t, T.logo, T.logo + 6)));
  g.save(); g.globalAlpha = la; g.drawImage(LOGO, W / 2 - s / 2, 740 - s / 2, s, s); g.restore();
  const b = ss(seg(t, T.logo + 1.2, T.logo + 1.8)) * out, c = ss(seg(t, T.logo + 2.6, T.logo + 3.1)) * out;
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = b; g.font = 'italic 500 70px "Cormorant Garamond"'; g.fillStyle = PAPER; glowText(() => g.fillText('Não é só jogar. É pertencer.', W / 2, 1150), 'rgba(255,160,220,.35)', 18);
  ornament(W / 2, 1240, 200, b * .8);
  g.globalAlpha = c; g.font = '700 54px Cinzel'; const gr = g.createLinearGradient(0, 1300, 0, 1360); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#9ff4ff'); g.fillStyle = gr;
  glowText(() => spaced('LEVEL 001 COMPLETE', W / 2, 1330, 6), 'rgba(47,230,255,.7)', 24);
  g.restore();
  if (b > .99) TX.push({ id: 'tag', text: 'Não é só jogar. É pertencer.', x0: 100, y0: 1100, x1: 980, y1: 1200 });
  if (c > .99) TX.push({ id: 'complete', text: 'LEVEL 001 COMPLETE', x0: 120, y0: 1290, x1: 960, y1: 1370 });
}

// —— fades between sets ——
const FADES = [[42.667, .45, .6], [65.333, .0, .0]];
function blackout(t) {
  let a = 0;
  for (const [c, o, i] of FADES) { if (t < c && t > c - o) a = Math.max(a, ss((t - (c - o)) / o)); if (t >= c && t < c + i) a = Math.max(a, 1 - ss((t - c) / i)); }
  a = Math.max(a, ss(seg(t, T.logo - .5, T.logo)) * (t < T.logo + .3 ? 1 : 0));
  if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, W, H); }
}

export function drawOverlay(t, shot, info = {}) {
  g.clearRect(0, 0, W, H); TX.length = 0;
  if (shot.id === 'logo') { endCard(t); return; }
  if (info.mirror != null) mirrorFrame(info.mirror);
  chapterCard(t); dateCard(t);
  for (const v of VO) { if (v.dlg) dialog(t, v); else subtitle(t, v); }
  blackout(t);
  if (t > T.logo - .6) endCard(t);
}
export function texts(t) { return TX.map(({ id, text, x0, y0, x1, y1 }) => ({ id, text, x0, y0, x1, y1 })); }
// subtitle cues (for the .srt): narration lines with their on-screen spans, dialogue lines too
export function cues() { return VO.map(v => ({ t0: +(v.t - .35).toFixed(2), t1: +(v.t + Math.max(voDur(v.id) + .6, 1.8)).toFixed(2), text: v.dlg ? `${v.who === 'JOGADOR' ? '— ' : '— '}${v.sub}` : v.sub })); }
