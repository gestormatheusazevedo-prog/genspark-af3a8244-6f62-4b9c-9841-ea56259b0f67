// Pixel Zone — tutorial: como reservar em pixelzone.pt (1080×1920). Real screenshots of the site (shots/, captured from
// pixelzone.pt on a phone viewport), a moving "camera" over them, tap ripples, the step tracker, Lagzilla's lines and the end card.
// Nothing was sent on the site: the walkthrough stops before "Enviar pedido de reserva".
const W = 1080, H = 1920, CSS = W / 390;            // 390 css px of the site = the full frame width
const cv = document.getElementById('ov'), g = cv.getContext('2d');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); }, eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const backE = (x, s = 2.2) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
const CYAN = '#2fe6ff', MAG = '#ff2fb4', GOLD = '#ffd23a', INK = '#0b0716';
const CX = 470, SAFE_B = 1436;

// —— the narration (Lagzilla) ——
export const VO = [
  { id: 'v1', t: 0.3, sub: 'Quer jogar no Pixel Zone? Eu te mostro como reservar em menos de um minuto.' },
  { id: 'v2', t: 5.5, sub: 'Entra em pixelzone.pt e toca em Reservar sessão.' },
  { id: 'v3', t: 8.9, sub: 'Etapa 1: escolhe a consola. PS5 ou Xbox.' },
  { id: 'v4', t: 13.8, sub: 'Quantos jogadores? Até 4 por estação.' },
  { id: 'v5', t: 17.3, sub: 'Escolhe o dia e um horário livre.' },
  { id: 'v6', t: 19.3, sub: 'E toca em Continuar.' },
  { id: 'v7', t: 20.9, sub: 'Etapa 2: a duração. 6 € por hora, por consola.' },
  { id: 'v8', t: 25.9, sub: 'Com 3 horas, ganhas um copo gamer de brinde.' },
  { id: 'v9', t: 29.0, sub: 'Se quiseres, junta uma bebida ou um combo.' },
  { id: 'v10', t: 31.8, sub: 'Etapa 3: o teu nome, o telefone, aceita a privacidade e envia o pedido.' },
  { id: 'v11', t: 36.9, sub: 'A equipa confirma o horário. O pagamento é feito no espaço.' },
  { id: 'v12', t: 41.2, sub: 'Na tua conta tens Início, Reservas, Torneios e Pedidos. Cria a conta grátis, ou reserva sem conta.' },
  { id: 'v13', t: 48.6, sub: 'Segunda a sábado, das 11h às 20h. Reserva já, pelo link na bio.' },
];
export const DUR = 55.0;
// —— shots: which screenshot, and a camera path (cy = page y at the frame centre, z = zoom) ——
// taps: [t, x, y] in page css px of that shot
const SHOTS = [
  { a: 0, b: 2.6, img: 'home', cam: [[0, 380, 1.0], [2.6, 360, 1.08]] },
  { a: 2.6, b: 5.5, img: 'home', cam: [[0, 300, 1.35], [2.9, 330, 1.5]] },
  { a: 5.5, b: 8.7, img: 'home', cam: [[0, 420, 1.2], [3.2, 470, 1.45]], taps: [[7.6, 195, 486]] },
  { a: 8.7, b: 11.2, img: 's1a', cam: [[0, 300, 1.0], [2.5, 330, 1.12]], step: 1 },
  { a: 11.2, b: 13.7, img: 's1a', cam: [[0, 520, 1.4], [2.5, 545, 1.55]], taps: [[12.4, 73, 553]], step: 1 },
  { a: 13.7, b: 17.2, img: 's1a', cam: [[0, 690, 1.35], [3.5, 715, 1.55]], taps: [[15.3, 149, 717]], step: 1 },
  { a: 17.2, b: 18.4, img: 's1a', cam: [[0, 800, 1.5], [1.2, 830, 1.6]], taps: [[17.75, 286, 836]], step: 1 },
  { a: 18.4, b: 19.3, img: 's1b', cam: [[0, 1010, 1.45], [.9, 1040, 1.55]], taps: [[18.8, 122, 1048]], step: 1 },
  { a: 19.3, b: 20.8, img: 's1c', cam: [[0, 1300, 1.0], [1.5, 1420, 1.15]], taps: [[20.25, 195, 1539]], step: 1 },
  { a: 20.8, b: 23.4, img: 's2a', cam: [[0, 330, 1.0], [2.6, 360, 1.12]], step: 2 },
  { a: 23.4, b: 25.8, img: 's2a', cam: [[0, 500, 1.6], [2.4, 505, 1.75]], taps: [[24.0, 195, 506]], step: 2 },
  { a: 25.8, b: 28.9, img: 's2a', cam: [[0, 760, 1.25], [3.1, 790, 1.4]], step: 2, glow: [24, 610, 342, 380] },
  { a: 28.9, b: 31.7, img: 's2a', cam: [[0, 1480, 1.3], [1.2, 1520, 1.45]], taps: [[30.3, 226, 1565]], step: 2, swap: [30.45, 's2b'] },
  { a: 31.7, b: 34.3, img: 's3', cam: [[0, 420, 1.15], [2.6, 520, 1.3]], taps: [[32.5, 195, 476], [33.3, 195, 564], [34.0, 27, 687]], step: 3 },
  { a: 34.3, b: 36.8, img: 's3', cam: [[0, 1050, 1.15], [2.5, 1150, 1.3]], step: 3, glow: [16, 1200, 358, 50] },
  { a: 36.8, b: 41.1, img: 's3', cam: [[0, 1260, 1.4], [4.3, 1290, 1.6]], step: 3 },
  { a: 41.1, b: 44.6, img: 'conta_view', cam: [[0, 330, 1.0], [1.6, 350, 1.0], [3.5, 520, 1.0]], glow: [8, 776, 374, 60], glowT: 43.0 },
  { a: 44.6, b: 48.4, img: 'conta', cam: [[0, 880, 1.25], [3.8, 960, 1.35]], glow: [30, 905, 330, 118] },
  { a: 48.4, b: DUR, img: null },
];
const TAPS = SHOTS.flatMap(s => (s.taps || []).map(([t, x, y]) => ({ t, x, y, s })));
const IMG = {}; let LOGO;
export async function load() {
  await Promise.all(['400 40px "Lilita One"', '700 40px Fredoka'].map(f => document.fonts.load(f)));
  for (const n of ['home', 's1a', 's1b', 's1c', 's2a', 's2b', 's3', 'conta', 'conta_view']) { const im = new Image(); im.src = `shots/${n}.png`; await im.decode(); IMG[n] = im; }
  LOGO = new Image(); LOGO.src = 'refs/logo-pixel-zone.png'; await LOGO.decode();
  window.DURS = await (await fetch('voices/dur.json')).json();
}
const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
function camAt(s, t) {
  const lt = t - s.a, k = s.cam; let i = 0; while (i < k.length - 2 && lt > k[i + 1][0]) i++;
  const [t0, y0, z0] = k[i], [t1, y1, z1] = k[i + 1], u = eio(seg(lt, t0, t1));
  return { cy: y0 + (y1 - y0) * u, z: z0 + (z1 - z0) * u };
}
// page → screen
let VIEW = { cy: 0, z: 1, cx: 195 };
const sx = x => W / 2 + (x - VIEW.cx) * CSS * VIEW.z, sy = y => H / 2 + (y - VIEW.cy) * CSS * VIEW.z;
function drawPage(s, t) {
  const name = s.swap && t >= s.swap[0] ? s.swap[1] : s.img, im = IMG[name], ph = im.height / 3;
  const c = camAt(s, t); const half = H / 2 / (CSS * c.z);
  c.cy = Math.min(Math.max(c.cy, half), Math.max(half, ph - half));
  // zoom towards the tapped/focused x: centre on the page, or slide toward the first tap of the shot
  const tx = s.taps ? s.taps[0][1] : 195, halfW = W / 2 / (CSS * c.z);
  const cx = Math.min(Math.max(195 + (tx - 195) * .3, halfW), 390 - halfW);
  VIEW = { cy: c.cy, z: c.z, cx: c.z > 1.001 ? cx : 195 };
  g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  const sc = CSS * c.z / 3; g.drawImage(im, sx(0), sy(0), im.width * sc, im.height * sc);
  // focus glow box
  if (s.glow) { const [x, y, w, h] = s.glow, k = ss(seg(t, s.glowT ?? s.a + .3, (s.glowT ?? s.a + .3) + .4)), p = .6 + .4 * Math.sin(t * 7);
    if (k > 0) { g.save(); g.globalAlpha = k; g.strokeStyle = GOLD; g.lineWidth = 8; g.shadowColor = GOLD; g.shadowBlur = 30 * p; g.beginPath(); g.roundRect(sx(x) - 10, sy(y) - 10, w * CSS * c.z + 20, h * CSS * c.z + 20, 24); g.stroke(); g.restore(); } }
}
function taps(t, s) {
  for (const tp of TAPS) { if (tp.s !== s) continue; const k = (t - tp.t);
    if (k > -.45 && k < .7) { const x = sx(tp.x), y = sy(tp.y);
      // the finger arrives, presses, the ripple spreads
      const arrive = ss(seg(k, -.45, 0)); g.save();
      if (k < .15) { g.globalAlpha = arrive; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x + (1 - arrive) * 80, y + (1 - arrive) * 120, 34 - (k > 0 ? 8 : 0), 0, 7); g.fill(); g.strokeStyle = CYAN; g.lineWidth = 6; g.stroke(); }
      if (k > 0) { const r = 30 + k * 220, a = 1 - k / .7; g.globalAlpha = a; g.strokeStyle = CYAN; g.lineWidth = 10 * a + 2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.strokeStyle = MAG; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r * .6, 0, 7); g.stroke(); }
      g.restore(); } }
}
// —— HUD pieces (the same look as the Reels) ——
function gtext(str, x, y, size, col, o = {}) {
  g.save(); g.font = `400 ${size}px "Lilita One"`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; if (o.spacing) g.letterSpacing = o.spacing + 'px';
  const sh = Math.max(3, size * .08); g.fillStyle = INK; g.fillText(str, x + sh, y + sh); g.lineWidth = Math.max(6, size * .16); g.strokeStyle = INK; g.strokeText(str, x, y);
  if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = size * .5; } g.fillStyle = col; g.fillText(str, x, y); g.restore();
}
function panel(x, y, w, h, fill = 'rgba(12,8,30,.88)', edge = CYAN) {
  g.save(); g.fillStyle = INK; g.fillRect(x + 6, y + 6, w, h); g.fillStyle = fill; g.fillRect(x, y, w, h);
  g.fillStyle = edge; g.fillRect(x, y, w, 4); g.fillRect(x, y + h - 4, w, 4); g.fillRect(x, y, 4, h); g.fillRect(x + w - 4, y, 4, h); g.restore();
}
const TX = []; const push = (id, text, x0, y0, x1, y1) => TX.push({ id, text, x0, y0, x1, y1 });
function stepBadge(t, s) {
  if (!s.step) return; const a = ss(seg(t, s.a, s.a + .25));
  const labels = ['ESCOLHA', 'PERSONALIZAÇÃO', 'CONFIRMAÇÃO'], x = 54, y = 250, w = 780, h = 96;
  g.save(); g.globalAlpha = a; panel(x, y, w, h, 'rgba(10,6,26,.88)', [CYAN, MAG, GOLD][s.step - 1]);
  gtext(`ETAPA ${s.step}/3`, x + 30, y + h / 2, 44, '#ffffff', { align: 'left' });
  gtext(labels[s.step - 1], x + w - 30, y + h / 2, 40, [CYAN, MAG, GOLD][s.step - 1], { align: 'right' });
  g.restore(); if (a > .99) push('step', `ETAPA ${s.step}/3 ${labels[s.step - 1]}`, x, y, x + w, y + h);
}
function wrap(text, maxW) { const ws = text.split(' '), L = []; let c = ''; for (const w of ws) { const n = c ? c + ' ' + w : w; if (g.measureText(n).width > maxW && c) { L.push(c); c = w; } else c = n; } if (c) L.push(c); return L; }
function dialog(t, v, i) {
  const d = (window.DURS || {})[v.id] || 2, nx = VO[i + 1], t1 = Math.min(v.t + d + .9, nx ? nx.t - .08 : DUR);
  const a = ss(seg(t, v.t - .12, v.t + .05)) * (1 - ss(seg(t, t1 - .12, t1))); if (a <= 0) return;
  g.save(); g.font = '700 50px Fredoka'; const lines = wrap(v.sub, 690); g.restore();
  const bw = 780, bh = 66 + lines.length * 58, x = CX - bw / 2, y = SAFE_B - bh - 16;
  g.save(); g.globalAlpha = a; panel(x, y, bw, bh, 'rgba(10,6,26,.92)', '#a066f0');
  g.fillStyle = '#a066f0'; g.fillRect(x + 30, y - 34, 220, 52); gtext('LAGZILLA', x + 140, y - 8, 36, '#ffffff');
  g.font = '700 50px Fredoka'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  let k = Math.floor(v.sub.length * clamp((t - v.t + .05) / (d * .8)));
  lines.forEach((L, j) => { g.fillText(L.slice(0, Math.max(0, k)), x + 40, y + 60 + j * 58); k -= L.length + 1; });
  g.restore(); if (a > .99) TX.push({ id: 'dlg_' + v.id, text: v.sub, x0: x, y0: y - 34, x1: x + bw, y1: y + bh, typing: true, t0: v.t });
}
function hook(t) {
  const a = ss(seg(t, .1, .35)) * (1 - ss(seg(t, 2.3, 2.6))); if (a <= 0) return;
  g.save(); g.globalAlpha = a; const s = backE(seg(t, .1, .4)); g.translate(CX, 560); g.scale(s, s);
  panel(-390, -130, 780, 260, 'rgba(10,6,26,.9)', MAG);
  gtext('COMO RESERVAR', 0, -45, 96, '#ffffff', { glow: 'rgba(255,47,180,.6)' }); gtext('PIXELZONE.PT', 0, 60, 74, CYAN, { glow: 'rgba(47,230,255,.6)' });
  g.restore(); if (a > .99) push('hook', 'COMO RESERVAR PIXELZONE.PT', CX - 390, 430, CX + 390, 690);
}
function pill(t, t0, y, top, bottom, id) {
  const a = ss(seg(t, t0, t0 + .3)); if (a <= 0) return; const s = backE(seg(t, t0, t0 + .3)), bob = Math.sin((t - t0) * 5) * 6;
  g.save(); g.globalAlpha = a; g.translate(CX, y + bob); g.scale(s, s);
  g.fillStyle = INK; g.fillRect(-340 + 8, -76 + 8, 680, 152); const gr = g.createLinearGradient(-340, 0, 340, 0); gr.addColorStop(0, MAG); gr.addColorStop(1, '#8a3aff'); g.fillStyle = gr; g.fillRect(-340, -76, 680, 152);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-328, -66, 656, 10); gtext(top, 0, -20, 62, '#ffffff'); g.font = '700 36px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(bottom, 0, 38);
  g.restore(); if (a > .99) push(id, top + ' ' + bottom, CX - 340, y - 76, CX + 340, y + 76);
}
function endCard(t) {
  const lt = t - 48.4; g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W / 2, 700, 50, W / 2, 700, 900); gr.addColorStop(0, 'rgba(120,40,200,.45)'); gr.addColorStop(1, 'rgba(5,6,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const a = ss(seg(lt, 0, .5)), s = 420 * (.94 + .06 * ss(seg(lt, 0, 6)));
  g.save(); g.globalAlpha = a; g.drawImage(LOGO, CX - s / 2, 520 - s / 2, s, s); g.restore();
  const b = ss(seg(lt, .4, .8));
  g.save(); g.globalAlpha = b; gtext('SEG–SÁB · 11H–20H', CX, 820, 66, '#ffffff'); g.font = '700 38px Fredoka'; g.textAlign = 'center'; g.fillStyle = '#c8c0e8';
  g.fillText('Dentro da Barbearia Barba Negra', CX, 900); g.fillText('Caldas da Rainha', CX, 950); g.restore();
  if (b > .99) push('info', 'SEG–SÁB 11H–20H Dentro da Barbearia Barba Negra Caldas da Rainha', 100, 820, 840, 1010);
  pill(t, 48.4 + 1.0, 1070, 'PIXELZONE.PT', 'RESERVA PELO LINK NA BIO', 'cta');
}
window.DUR = DUR;
window.render = t => {
  TX.length = 0; const s = shotAt(t);
  if (!s.img) endCard(t); else { drawPage(s, t); taps(t, s); stepBadge(t, s); }
  if (s.img && t > SHOTS[SHOTS.length - 2].a && false) {}
  hook(t);
  VO.forEach((v, i) => dialog(t, v, i));
  // a quick white flash on each page change
  for (const sh of SHOTS) if (sh.img && sh.a > 0 && SHOTS[SHOTS.indexOf(sh) - 1].img !== sh.img) { const k = 1 - seg(t, sh.a, sh.a + .18); if (t >= sh.a && k > 0) { g.fillStyle = `rgba(255,255,255,${k * .35})`; g.fillRect(0, 0, W, H); } }
};
window.TEXTS = () => TX.map(({ id, text, x0, y0, x1, y1 }) => ({ id, text, x0, y0, x1, y1 }));
window.CUES = () => VO.map((v, i) => ({ t0: v.t, t1: Math.min(v.t + (window.DURS[v.id] || 2) + .9, VO[i + 1] ? VO[i + 1].t - .08 : DUR), text: v.sub }));
// sound events: taps, page changes, the step chimes, the end jingle, the voices
const EV = [];
TAPS.forEach(tp => EV.push({ t: +tp.t.toFixed(3), type: 'tap' }));
SHOTS.forEach((sh, i) => { if (i && sh.img !== SHOTS[i - 1].img) EV.push({ t: sh.a, type: 'page' }); if (sh.step && (!SHOTS[i - 1] || SHOTS[i - 1].step !== sh.step)) EV.push({ t: sh.a + .05, type: 'step', n: sh.step }); });
EV.push({ t: .1, type: 'hook' }, { t: 48.4, type: 'end' }, { t: 49.4, type: 'pop' });
VO.forEach(v => EV.push({ t: v.t, type: 'vo', id: v.id }));
window.EV = EV.sort((a, b) => a.t - b.t);
await load();
window.READY = true;
