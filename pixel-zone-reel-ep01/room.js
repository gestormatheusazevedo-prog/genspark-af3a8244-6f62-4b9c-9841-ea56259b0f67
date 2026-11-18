// Set 2 — the room: empty and cold, then planned, built, lit cyan (left) and magenta (right), then full of people.
// One diorama for scenes 2–9; what is visible and which lights are on are functions of t.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow, blob } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, eio, eo, clamp, lerp, back } from '/core/lib.js';
import { T } from './story.js';

const CYAN = '#2fe6ff', MAG = '#ff2fb4';
export const MATCH = { mode: 'play', score: [0, 0], clock: "89'" };
const DOORX = 1.9, BACKZ = -3.5, WALLH = 3.0, CEIL = 2.98;

// —— pixel-art screens (64×40), drawn every frame ——
function screen(kind) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 40; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const tex = texOf(c); const avg = new THREE.Color();
  function draw(t, mode, goalT) {
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
    if (mode === 'off') { R(0, 0, 64, 40, '#06070a'); avg.set('#000000'); }
    else if (mode === 'menu') {
      R(0, 0, 64, 40, '#0b0a24'); for (let i = 0; i < 6; i++) R(0, 26 + i * 2, 64, 1, i % 2 ? '#2a1450' : '#1a0d36');
      R(14, 8, 36, 2, CYAN); R(14, 12, 36, 2, MAG); R(20, 17, 24, 1, '#7c6cff');
      if (Math.floor(t * 1.6) % 2) { R(22, 30, 20, 3, '#ffffff'); }
      avg.set('#3a2a8a');
    } else if (kind === 'race') {
      R(0, 0, 64, 16, '#3a1a6a'); R(0, 16, 64, 24, '#1c3a2a'); const s = (t * 30) % 8;
      for (let y = 16; y < 40; y++) { const w = 6 + (y - 16) * 1.6; R(32 - w / 2, y, w, 1, '#2a2a33'); if (((y + s) | 0) % 8 < 3) R(31, y, 2, 1, '#ffd84a'); }
      R(27 + Math.sin(t * 2) * 6, 31, 9, 5, '#ff3a3a'); R(28 + Math.sin(t * 2) * 6, 30, 7, 2, '#ffd0d0'); R(26, 6, 12, 4, '#ffb030');
      avg.set('#5a3a5a');
    } else if (kind === 'ball') {
      const M = MATCH, txt = (str, x, y, px, col) => { g.fillStyle = col; g.font = `bold ${px}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, x, y); };
      R(0, 0, 64, 40, '#17702e'); for (let i = 0; i < 64; i += 8) R(i, 0, 4, 40, '#1b7d33'); R(31, 0, 1, 40, '#d8ffd8'); R(0, 0, 64, 1, '#d8ffd8'); R(0, 39, 64, 1, '#d8ffd8'); R(0, 14, 2, 12, '#ffffff'); R(62, 14, 2, 12, '#ffffff');
      if (M.mode === 'lose') {
        R(0, 0, 64, 40, 'rgba(10,4,20,.82)'); txt('5-0', 32, 18, 17, '#ff4a5a'); txt('FIM', 32, 33, 7, '#ffffff'); avg.set('#5a1a3a');
      } else if (M.mode === 'again') {
        R(0, 0, 64, 40, '#0b0a24'); for (let i = 0; i < 6; i++) R(0, 28 + i * 2, 64, 1, i % 2 ? '#2a1450' : '#1a0d36');
        txt('PLAY', 32, 11, 11, CYAN); if (Math.floor(t * 2.5) % 2 === 0) txt('AGAIN?', 32, 24, 11, MAG); avg.set('#3a2a8a');
      } else {
        const k = t * 1.3, gk = goalT != null ? clamp((t - goalT + 1) / 1) : 0, bx = 32 + Math.sin(k) * 24 * (1 - gk) + gk * 29, by = 20 + Math.sin(k * 1.7) * 9 * (1 - gk);
        for (let i = 0; i < 5; i++) { R(10 + i * 10 + Math.sin(k + i) * 4, 8 + (i * 7) % 24, 2, 3, '#ff3a3a'); R(14 + i * 10 + Math.cos(k * 1.2 + i) * 4, 12 + (i * 11) % 22, 2, 3, '#3a7aff'); }
        R(Math.min(61, bx), by, 2, 2, '#ffffff');
        R(16, 0, 32, 7, '#0a0a14'); txt(`${M.score[0]}-${M.score[1]}`, 25, 4, 6, '#ffffff'); txt(M.clock, 40, 4, 5, '#ffd84a');
        if (goalT != null && t > goalT && t < goalT + 1.4) { const on = Math.floor((t - goalT) * 6) % 2 === 0; R(6, 12, 52, 17, on ? '#ffde3a' : '#ff3ab4'); txt('GOL!', 32, 21, 13, '#100820'); avg.set(on ? '#c8a830' : '#c03090'); }
        else avg.set('#2a6a32');
      }
    } else if (kind === 'fight') {
      R(0, 0, 64, 40, '#2a1438'); R(0, 30, 64, 10, '#4a2a1a'); for (let i = 0; i < 64; i += 6) R(i, 30, 3, 1, '#6a3a22');
      R(4, 3, 24, 3, '#3a0a0a'); R(4, 3, 24 * (.4 + .5 * Math.abs(Math.sin(t * .7))), 3, '#ffd23a'); R(36, 3, 24, 3, '#3a0a0a'); R(36, 3, 24 * (.3 + .5 * Math.abs(Math.cos(t * .6))), 3, '#ffd23a');
      const a = Math.floor(t * 6) % 4, x1 = 20 + Math.sin(t * 1.4) * 4, x2 = 40 - Math.sin(t * 1.4) * 4;
      R(x1, 16, 5, 14, '#3ad0ff'); R(x1 + 1, 12, 4, 4, '#ffd0b0'); if (a < 2) R(x1 + 5, 19, 6, 2, '#3ad0ff');
      R(x2, 16, 5, 14, '#ff3a8a'); R(x2, 12, 4, 4, '#ffd0b0'); if (a >= 2) R(x2 - 6, 19, 6, 2, '#ff3a8a');
      avg.set('#4a2a6a');
    }
    tex.needsUpdate = true;
  }
  return { c, tex, draw, avg };
}
// the user's logo, pixelated to the scene's density
function logoTex(img) {
  const N = 48, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N); for (let i = 0; i < d.data.length; i += 4) { const r = (i / 4 % N - N / 2 + .5), q = (Math.floor(i / 4 / N) - N / 2 + .5); if (r * r + q * q > (N / 2) * (N / 2)) d.data[i + 3] = 0; }
  g.putImageData(d, 0, 0); return texOf(c);
}
function fabric(cols, seed) {
  const P = new PX(32, 32), F = ramp(cols, .3);
  P.fill((x, y) => F(.5 + (fbm(x * .2, y * .2, seed) - .5) * .5 + ((x + y) % 4 === 0 ? -.06 : 0), x, y)); return P.done();
}
function notebookCanvas() {
  const c = document.createElement('canvas'); c.width = 72; c.height = 52; return c;
}

export async function buildRoom() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#0a0c18', .02);
  scene.background = new THREE.Color('#05060b');
  const img = new Image(); img.src = 'refs/logo-pixel-zone.png'; await img.decode();

  // —— shell: floor, three walls (front and ceiling cut away) ——
  const floorM = mat(woodPlanks(96, 96, { pw: 6, len: 48, seed: 12, cols: ['#22170f', '#33241a', '#443224', '#55402e', '#664e38'] }), { rough: .55 });
  const wallM = mat(plaster(96, 96, { seed: 41, wall: ['#08080b', '#0d0d12', '#121218', '#17171e'], beams: [{ t: 'h', y: 93 }] }));
  scene.add(mesh(new THREE.BoxGeometry(6.4, .2, 7.4).translate(0, -.1, 0), floorM));
  const backW = new THREE.Group();
  // back wall with the door opening
  const bw = (x0, x1, y0, y1) => { const m = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, .2).translate((x0 + x1) / 2, (y0 + y1) / 2, BACKZ - .1), wallM); backW.add(m); };
  bw(-3.2, DOORX - .5, 0, WALLH); bw(DOORX + .5, 3.2, 0, WALLH); bw(DOORX - .5, DOORX + .5, 2.1, WALLH);
  scene.add(backW);
  const sideW = (x) => { const m = mesh(new THREE.BoxGeometry(.2, WALLH, 7.4).translate(x, WALLH / 2, 0), wallM); scene.add(m); return m; };
  sideW(-3.1); const rightW = sideW(3.1);
  // hallway behind the door: warm light that floods in when the door opens
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ color: '#ffcf8a' })); hall.position.set(DOORX, 1.05, BACKZ - 1.4); scene.add(hall);
  const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshStandardMaterial({ color: '#3a2a1c', roughness: .8 })); hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(DOORX, .001, BACKZ - .75); scene.add(hallFloor);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2), new THREE.MeshStandardMaterial({ color: '#6a5a48', side: THREE.DoubleSide })); w.rotation.y = Math.PI / 2; w.position.set(DOORX + s * .6, 1.1, BACKZ - .75); scene.add(w); }
  const hallL = new THREE.PointLight('#ffb468', 0, 9, 1.4); hallL.position.set(DOORX, 1.9, BACKZ - .9); hallL.castShadow = true; hallL.shadow.mapSize.set(512, 512); hallL.shadow.bias = -.005; scene.add(hallL);
  const doorPivot = new THREE.Group(); doorPivot.position.set(DOORX - .5, 0, BACKZ + .02);
  const doorM = mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 19, nails: false, cols: ['#2a1a12', '#46301f', '#5e4029', '#775235'] }));
  const leaf = mesh(new THREE.BoxGeometry(1.0, 2.08, .06).translate(.5, 1.04, 0), doorM); doorPivot.add(leaf);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#c8b070', metalness: .8, roughness: .3 })); knob.position.set(.88, 1.0, .06); doorPivot.add(knob);
  scene.add(doorPivot);
  // window on the right wall (moonlight)
  const winM = new THREE.MeshBasicMaterial({ color: '#4a6aa8' }); const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .9), winM); win.rotation.y = -Math.PI / 2; win.position.set(2.99, 1.65, .1); 
  const winBar = box(.04, .9, .04, mats_beam(), { cast: false }); winBar.position.set(2.98, 1.2, .1); 
  const moon = new THREE.DirectionalLight('#6a5ad8', .7); moon.position.set(9, 6, 1.5); moon.target.position.set(0, 0, 0); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); moon.shadow.bias = -.001; scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight('#3a3a8a', '#140c18', .55); scene.add(hemi);

  // —— the bare bulb ——
  const bulbPos = new THREE.Vector3(.2, 2.35, -.8);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, WALLH - bulbPos.y + .4), new THREE.MeshBasicMaterial({ color: '#111' })); cord.position.set(bulbPos.x, (WALLH + .4 + bulbPos.y) / 2, bulbPos.z); scene.add(cord);
  const bulbM = new THREE.MeshStandardMaterial({ color: '#3a3020', emissive: '#ffd48a', emissiveIntensity: 0 }); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), bulbM); bulb.position.copy(bulbPos); scene.add(bulb);
  const bulbL = new THREE.PointLight('#ffc27a', 0, 11, 1.3); bulbL.position.copy(bulbPos).add(new THREE.Vector3(0, -.12, .2)); bulbL.castShadow = true; bulbL.shadow.mapSize.set(768, 768); bulbL.shadow.bias = -.004; scene.add(bulbL);
  const bulbG = glow('#ffc890', 1.1, 1); bulbG.position.copy(bulbPos); scene.add(bulbG);

  // —— build items ——
  const items = {};
  const add = (id, obj) => { obj.userData.base = obj.scale.clone(); scene.add(obj); items[id] = obj; return obj; };
  // —— the real Pixel Zone: black shaggy rug, wall TVs on floating shelves, red/blue bags, cloud ceiling, pink LED strip, the counter ——
  const rugT = (() => { const P = new PX(96, 96), F = ramp(['#050506', '#0b0b0e', '#121216', '#1a1a20'], .6); P.fill((x, y) => F(.35 + (fbm(x * .3, y * .3, 8) - .5) * .5 + (h2(x, y, 4) - .5) * .35, x, y)); return P.done(); })();
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.1), new THREE.MeshStandardMaterial({ map: texOf(rugT), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-.75, .008, -.75); rug.receiveShadow = true;
  add('rug', rug);
  const screens = { A: screen('race'), B: screen('ball'), C: screen('fight') };
  const tvM = new THREE.MeshStandardMaterial({ color: '#0e0e12', roughness: .4, metalness: .3 });
  const shelfM = new THREE.MeshStandardMaterial({ color: '#141418', roughness: .6 });
  const whiteM = new THREE.MeshStandardMaterial({ color: '#e8eaf0', roughness: .45 });
  const tvLights = {};
  const station = (k, x, z, ry) => {
    const tv = new THREE.Group(); tv.position.set(x, 0, z); tv.rotation.y = ry;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.26, .76, .06), tvM); frame.position.set(0, 1.45, .05); frame.castShadow = true; tv.add(frame);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.18, .69), new THREE.MeshBasicMaterial({ map: screens[k].tex, toneMapped: true })); scr.position.set(0, 1.45, .085); tv.add(scr);
    // floating black shelf under the TV: a white console standing up, white controllers, a little figure (no brand marks)
    const con = new THREE.Group(); con.position.set(x, 0, z); con.rotation.y = ry;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(.95, .045, .3).translate(0, .66, .16), shelfM); sh.castShadow = sh.receiveShadow = true; con.add(sh);
    const cs = new THREE.Mesh(new THREE.BoxGeometry(.13, .3, .26).translate(.3, .833, .16), whiteM); cs.castShadow = true; con.add(cs);
    const vent = new THREE.Mesh(new THREE.CircleGeometry(.045, 10), new THREE.MeshStandardMaterial({ color: '#1a1a1e' })); vent.rotation.x = -Math.PI / 2; vent.position.set(.3, .984, .16); con.add(vent);
    for (const cx of [-.32, -.14]) { const pad = new THREE.Mesh(new THREE.BoxGeometry(.13, .035, .08).translate(cx, .7, .16), whiteM); pad.castShadow = true; con.add(pad); }
    const fig = new THREE.Mesh(new THREE.BoxGeometry(.05, .1, .05).translate(.05, .733, .14), new THREE.MeshStandardMaterial({ color: k === 'B' ? '#3a8aff' : '#3aa86a', roughness: .5 })); con.add(fig);
    const L = new THREE.PointLight('#ffffff', 0, 4.5, 1.6); L.position.set(x + Math.sin(ry) * .9, 1.4, z + Math.cos(ry) * .9); scene.add(L); tvLights[k] = L;
    add('tv' + k, tv); add('con' + k, con); return { scr };
  };
  station('A', -1.8, BACKZ + .02, 0); station('B', .1, BACKZ + .02, 0); station('C', -2.98, .45, Math.PI / 2);
  // framed poster between the TVs, warm picture light above it
  const posterT = (() => { const P = new PX(20, 30), F = ramp(['#120a2a', '#2a1660', '#4a2a9a', '#7a4ad8', '#c08aff']); P.fill((x, y) => { const sil = Math.abs(x - 10) < 3 + (y > 14 ? (y - 14) * .35 : 0) && y > 8 && Math.hypot(x - 10, y - 9) > 2.4 - (y > 9 ? 9 : 0); if (sil) return hex('#08060e'); return F(.15 + (1 - y / 30) * .6 + (fbm(x * .4, y * .3, 6) - .5) * .5, x, y); }); return texOf(P.done()); })();
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(.42, .62), new THREE.MeshStandardMaterial({ map: posterT, roughness: .7 })); poster.position.set(-.85, 1.98, BACKZ + .03); scene.add(poster);
  const pFrame = new THREE.Mesh(new THREE.BoxGeometry(.46, .66, .02), new THREE.MeshStandardMaterial({ color: '#0a0a0c' })); pFrame.position.set(-.85, 1.98, BACKZ + .015); scene.add(pFrame);
  const pBar = new THREE.Mesh(new THREE.BoxGeometry(.3, .025, .05), new THREE.MeshStandardMaterial({ color: '#222', emissive: '#ffc070', emissiveIntensity: 2.5 })); pBar.position.set(-.85, 2.36, BACKZ + .05); scene.add(pBar);
  const pL = new THREE.SpotLight('#ffbf70', 2.2, 1.6, .7, .6, 1.5); pL.position.set(-.85, 2.34, BACKZ + .12); pL.target.position.set(-.85, 1.8, BACKZ); scene.add(pL, pL.target);
  const bagMat = { r: new THREE.MeshStandardMaterial({ map: texOf(fabric(['#4a0806', '#8a1408', '#c8240e', '#f04018'], 3)), roughness: .85 }), b: new THREE.MeshStandardMaterial({ map: texOf(fabric(['#080e3a', '#10206e', '#1a32a8', '#2a4ad8'], 5)), roughness: .85 }) };
  const BAGS = [[-2.25, -1.85, 'b'], [-1.35, -1.85, 'r'], [-.35, -1.85, 'r'], [.55, -1.85, 'b'], [-1.7, -.05, 'b'], [-1.7, .95, 'b']];
  BAGS.forEach(([x, z, c], i) => { const g = new THREE.SphereGeometry(.42, 14, 10); g.scale(1, .55, 1); g.translate(0, .2, 0); const m = new THREE.Mesh(g, bagMat[c]); m.castShadow = m.receiveShadow = true; m.position.set(x, 0, z); add('bag' + i, m); });
  const extraBag = new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10).scale(1, .55, 1).translate(0, .2, 0), bagMat.r); extraBag.position.set(1.15, 0, -1.75); extraBag.castShadow = extraBag.receiveShadow = true; scene.add(extraBag);
  // ceiling + the pink LED strip that runs round the room under it
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 7.4), new THREE.MeshStandardMaterial({ color: '#050508', roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL, 0); scene.add(ceil);
  const ledMat = (col) => new THREE.MeshStandardMaterial({ color: '#111', emissive: col, emissiveIntensity: 0 });
  const LEDY = CEIL - .1;
  const ledL = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, 7.2), ledMat(MAG)); ledL.position.set(-2.98, LEDY, 0); add('ledL', ledL);
  const ledR = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, 7.2), ledMat(MAG)); ledR.position.set(2.98, LEDY, 0); add('ledR', ledR);
  const ledB = new THREE.Mesh(new THREE.BoxGeometry(6.0, .035, .035), ledMat(MAG)); ledB.position.set(0, LEDY, BACKZ + .05); scene.add(ledB);
  // the cloud: hundreds of lumpy pieces hanging from the ceiling, lit from inside (white, cyan, blue; purple and pink at the rim)
  const CLX = -.45, CLZ = -.75, CRX = 2.3, CRZ = 2.55, NCL = 1500;
  const blobG = new THREE.IcosahedronGeometry(1, 1); blobG.scale(1, .62, 1);
  { const n = blobG.attributes.position.count, cols = new Float32Array(n * 3), pos = blobG.attributes.position;
    for (let f = 0; f < n; f += 3) { const y = (pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3; const sh = (y < 0 ? 1 : .55) * (.6 + .4 * h2(f, 7, 3)); for (let j = 0; j < 3; j++) cols.set([sh, sh, sh], (f + j) * 3); }
    blobG.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
  const cloud = new THREE.InstancedMesh(blobG, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: true }), NCL);
  { const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pp = new THREE.Vector3(), C = new THREE.Color(), E = new THREE.Euler();
    const pal = [['#5a3ab0', 0], ['#3a62f0', .3], ['#4ad0ff', .4], ['#a8e8ff', .5], ['#e6f6ff', .6]];
    for (let i = 0; i < NCL; i++) {
      const a = h2(i, 1, 7) * 6.283, r = Math.sqrt(h2(i, 2, 7)) * (1 + .12 * Math.sin(a * 5 + 1.3));
      const x = CLX + Math.cos(a) * r * CRX, z = CLZ + Math.sin(a) * r * CRZ;
      const s = (.08 + h2(i, 3, 7) * .13) * (1.15 - r * .35);
      const y = CEIL - .14 - h2(i, 4, 7) * .26 * (1.1 - r * .7);
      Pp.set(x, y, z); E.set(0, h2(i, 6, 7) * 6.28, 0); Q.setFromEuler(E); S.set(s, s, s); M.compose(Pp, Q, S); cloud.setMatrixAt(i, M);
      let v = fbm(x * .55 + 3, z * .55, 3) + (h2(i, 5, 7) - .5) * .25; let col = pal[0][0]; for (const [c, th] of pal) if (v > th) col = c;
      C.set(col); if (r > .86) C.lerp(new THREE.Color('#ff4fb8'), (r - .86) / .2); cloud.setColorAt(i, C);
    }
    cloud.instanceMatrix.needsUpdate = true; cloud.instanceColor.needsUpdate = true; }
  scene.add(cloud);
  // —— the counter (right wall): grey concrete front with the PIXEL ZONE letters, wood top, warm strip under the lip ——
  const counter = new THREE.Group();
  const concM = mat(plaster(48, 32, { seed: 77, wall: ['#26262a', '#303036', '#3a3a40', '#46464c'], beams: [] }));
  const body = mesh(new THREE.BoxGeometry(.55, 1.04, 2.5).translate(2.62, .52, .2), concM); counter.add(body);
  const topM = mat(woodPlanks(32, 64, { pw: 32, len: 64, seed: 31, nails: false, cols: ['#6a4a30', '#86603e', '#a07850', '#b88e60'] }));
  const ctop = mesh(new THREE.BoxGeometry(.72, .045, 2.6).translate(2.56, 1.06, .2), topM); counter.add(ctop);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, 2.2), new THREE.MeshStandardMaterial({ color: '#222', emissive: '#ffb45a', emissiveIntensity: 3 })); lip.position.set(2.31, 1.02, .2); counter.add(lip);
  const letT = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 24; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.font = 'bold 17px "Arial Black", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('PIXEL', 4, 13); g.fillText('ZONE', 70, 13);
    g.fillStyle = '#3aa0ff'; g.fillRect(62, 1, 3, 11); g.fillStyle = '#ff3a4a'; g.fillRect(60, 13, 3, 10);
    const d = g.getImageData(0, 0, 128, 24); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; g.putImageData(d, 0, 0); return texOf(c); })();
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .28), new THREE.MeshStandardMaterial({ map: letT, transparent: true, alphaTest: .5, emissive: '#ffffff', emissiveMap: letT, emissiveIntensity: .35, roughness: .6 }));
  letters.rotation.y = -Math.PI / 2; letters.position.set(2.336, .66, .2); counter.add(letters);
  const warmL = new THREE.PointLight('#ffb060', 1.4, 1.6, 1.6); warmL.position.set(2.1, .98, .2); counter.add(warmL);
  // on the counter: laptop, desk fan, a basket of snacks, a menu board
  const lapB = new THREE.Mesh(new THREE.BoxGeometry(.24, .015, .32).translate(2.55, 1.09, -.6), new THREE.MeshStandardMaterial({ color: '#2a2a30' })); counter.add(lapB);
  const lapS = new THREE.Mesh(new THREE.PlaneGeometry(.3, .2), new THREE.MeshBasicMaterial({ color: '#5a7ad8' })); lapS.rotation.y = -Math.PI / 2 + .0; lapS.rotation.z = 0; lapS.position.set(2.66, 1.2, -.6); counter.add(lapS);
  const fanM = new THREE.MeshStandardMaterial({ color: '#e8e4ee', roughness: .5 });
  const fanH = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .05, 16), fanM); fanH.rotation.z = Math.PI / 2; fanH.position.set(2.55, 1.38, .65); counter.add(fanH);
  const fanS = new THREE.Mesh(new THREE.CylinderGeometry(.015, .05, .3, 8).translate(0, .15, 0), fanM); fanS.position.set(2.58, 1.08, .65); counter.add(fanS);
  const bask = new THREE.Mesh(new THREE.BoxGeometry(.2, .14, .26).translate(2.55, 1.15, .1), new THREE.MeshStandardMaterial({ color: '#e0601a', roughness: .8 })); counter.add(bask);
  const menu = new THREE.Mesh(new THREE.BoxGeometry(.03, .26, .2).translate(2.72, 1.21, 1.2), new THREE.MeshStandardMaterial({ color: '#0e0e12', emissive: '#3a4aa0', emissiveIntensity: .5 })); counter.add(menu);
  counter.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(counter);
  const signM = new THREE.MeshBasicMaterial({ map: logoTex(img), transparent: true, alphaTest: .4, color: new THREE.Color(.3, .3, .3) });
  const signG = glow('#c04aff', 1.3, .0);
  // light: cool white-blue from inside the cloud, pink from the strip at the walls
  const cyan1 = new THREE.PointLight('#9fdcff', 0, 9, 1.3); cyan1.position.set(-.6, CEIL - .45, -1.6); cyan1.castShadow = true; cyan1.shadow.mapSize.set(512, 512); cyan1.shadow.bias = -.004;
  const cyan2 = new THREE.PointLight('#7fb8ff', 0, 7, 1.4); cyan2.position.set(-.4, CEIL - .45, .6);
  const mag1 = new THREE.PointLight(MAG, 0, 9, 1.3); mag1.position.set(2.55, LEDY - .2, -1.6); mag1.castShadow = true; mag1.shadow.mapSize.set(512, 512); mag1.shadow.bias = -.004;
  const mag2 = new THREE.PointLight(MAG, 0, 7, 1.4); mag2.position.set(-2.55, LEDY - .2, 0);
  scene.add(cyan1, cyan2, mag1, mag2);
  const glows = [[-2.95, LEDY, -2], [-2.95, LEDY, 0], [-2.95, LEDY, 2], [-1.5, LEDY, BACKZ + .1], [1, LEDY, BACKZ + .1]].map(p => { const s = glow(MAG, 1.3, 0); s.position.set(...p); scene.add(s); return s; })
    .concat([[2.95, LEDY, -2], [2.95, LEDY, 0], [2.95, LEDY, 2]].map(p => { const s = glow(MAG, 1.3, 0); s.position.set(...p); scene.add(s); s.userData.m = 1; return s; }));

  // —— Side Quest 01 additions ——
  for (const o of [bulb, bulbG, cord]) o.visible = false; bulbL.intensity = 0; bulbL.visible = false;
  // the one free controller is the near one on TV B's shelf; the other is already in a player's hands
  const conB = items.conB, padsB = conB.children.filter(o => o.isMesh && o.geometry.parameters && Math.abs(o.geometry.parameters.width - .13) < 1e-3 && Math.abs(o.geometry.parameters.height - .035) < 1e-3);
  if (padsB[1]) padsB[1].visible = false;
  const freePad = padsB[0];
  // big neon logo on the back wall (replaces the framed poster for the call to action)
  const logoC = document.createElement('canvas'); logoC.width = logoC.height = 128; { const g = logoC.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, 128, 128); }
  const logoM = new THREE.MeshBasicMaterial({ map: texOf(logoC), transparent: true, alphaTest: .3, toneMapped: false });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), logoM); logo.position.set(-.85, 1.98, BACKZ + .04); logo.visible = false; scene.add(logo);
  const logoGlow = glow('#a050ff', 2.2, 0); logoGlow.position.set(-.85, 1.98, BACKZ + .1); scene.add(logoGlow);
  const logoL = new THREE.PointLight('#b070ff', 0, 4, 1.5); logoL.position.set(-.85, 1.9, BACKZ + .6); scene.add(logoL);

  // —— voxel hands (top-down inserts) ——
  const vm = c => new THREE.MeshStandardMaterial({ color: c, roughness: .8, flatShading: true });
  function vhand(skin, sleeve, side = 1) {
    const g = new THREE.Group(), S = vm(skin), L = vm(sleeve);
    const sl = new THREE.Mesh(new THREE.BoxGeometry(.075, .065, .34).translate(0, 0, .2), L); g.add(sl);
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(.08, .07, .03).translate(0, 0, .035), L); g.add(cuff);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(.066, .03, .07).translate(0, 0, -.03), S); g.add(palm);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.014, .022, .04).translate(-.024 + i * .016, -.004, -.08), S); g.add(f); }
    const th = new THREE.Mesh(new THREE.BoxGeometry(.018, .022, .045), S); th.position.set(side * .042, .006, -.045); th.rotation.y = side * .5; g.add(th); g.userData.thumb = th;
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  const grabHand = vhand('#e7b293', '#60606e', 1); scene.add(grabHand);
  // the macro insert: a big controller with four face buttons, held by the newcomer; the veteran's thumb shows the combo
  const MAC = new THREE.Group(); MAC.position.set(-.6, .3, .9); scene.add(MAC);
  const padW = vm('#9a9ca8'), padD = vm('#1a1a22');
  MAC.add(new THREE.Mesh(new THREE.BoxGeometry(.26, .035, .11), padW));
  for (const s of [-1, 1]) { const grip = new THREE.Mesh(new THREE.BoxGeometry(.07, .035, .09).translate(s * .1, 0, .06), padW); MAC.add(grip); }
  const dpad = new THREE.Group(); dpad.position.set(-.075, .02, -.005); dpad.add(new THREE.Mesh(new THREE.BoxGeometry(.045, .012, .014), padD), new THREE.Mesh(new THREE.BoxGeometry(.014, .012, .045), padD)); MAC.add(dpad);
  for (const [x, z] of [[-.035, .035], [.035, .035]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, .02, 10), padD); st.position.set(x, .025, z); MAC.add(st); }
  const BTN = [['#3aff6a', 0, .026], ['#ff3a4a', .026, 0], ['#3a8aff', -.026, 0], ['#ffd23a', 0, -.026]].map(([c, dx, dz]) => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .15, roughness: .4 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .016, 10), m); b.position.set(.08 + dx, .022, -.005 + dz); MAC.add(b); return b; });
  const btnL = new THREE.PointLight('#ffffff', 0, .5, 2); btnL.position.set(.08, .1, 0); MAC.add(btnL);
  const nL = vhand('#e7b293', '#60606e', 1), nR = vhand('#e7b293', '#60606e', -1);
  nL.position.set(-.1, -.005, .1); nL.rotation.y = .25; nR.position.set(.1, -.005, .1); nR.rotation.y = -.25; MAC.add(nL, nR);
  const vH = vhand('#b97a55', '#22212b', -1); vH.rotation.y = Math.PI / 2 + .2; MAC.add(vH);
  const macBg = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshStandardMaterial({ map: rug.material.map, roughness: 1 })); macBg.rotation.x = -Math.PI / 2; macBg.position.set(0, -.28, 0); MAC.add(macBg);
  const COMBO = [3, 1, 0, 1];   // which button lights, in order

  // —— cast ——
  const NV = makeChar('novato'), VT = makeChar('veterano'), P5 = makeChar('p5'), P3 = makeChar('p3'), P2 = makeChar('p2'), CL = makeChar('client');
  const LAGZ = makeChar('lagzilla', { scale: .66 });
  const cast = [NV, VT, P5, P3, P2, CL, LAGZ]; cast.forEach(c => scene.add(c.root));
  const fill = new THREE.PointLight('#c8d0f0', 0, 5, 2); scene.add(fill);
  const sparkle = particles(70, (i, t, o) => { const k = t - T.lag, a = h2(i, 3, 1) * 6.283, sp = .5 + h2(i, 4, 1) * 1.2, r = Math.max(0, k) * sp; o.x = -.25 + Math.cos(a) * r * .8; o.z = -3.0 + Math.sin(a) * r * .4; o.y = .6 + Math.sin(h2(i, 5, 1) * 3) * r * .9 + .2; o.a = k > 0 && k < 1.1 ? (1 - k / 1.1) * (Math.floor(t * 12 + i) % 2 ? 1 : .4) : 0; o.s = .03; const c = i % 2 ? [.3, .9, 1] : [.75, .45, 1]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(sparkle);
  const confetti = particles(140, (i, t, o) => { const k = t - T.win, a = h2(i, 3, 2) * 6.283, sp = 1 + h2(i, 4, 2) * 1.6; o.x = .7 + Math.cos(a) * k * sp * .7; o.z = -1.8 + Math.sin(a) * k * sp * .5; o.y = 1.0 + k * 2.2 - k * k * 1.6 + h2(i, 6, 2) * .3; o.a = k > 0 && k < 2 ? 1 : 0; o.s = .03; const c = [[.2, .95, 1], [1, .2, .7], [1, .85, .2], [.6, .4, 1]][i % 4]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(confetti);
  const dust = particles(90, (i, t, o) => { o.x = -2.8 + h2(i, 1, 9) * 5.6 + Math.sin(t * .2 + i) * .15; o.y = .3 + ((h2(i, 2, 9) * 2.3 + t * .03) % 2.3); o.z = -3 + h2(i, 3, 9) * 6; o.a = .22; o.s = .016; o.r = 1; o.g = .9; o.b = .8; }, { soft: 1 }); scene.add(dust);

  // —— helpers ——
  const place = (ch, x, z, frame, cam, flip = false) => { ch.root.visible = true; ch.root.position.set(x, 0, z); ch.frame(frame); ch.face(cam, flip); ch.root.scale.setScalar(1); };
  const idle = (t, a = 'idle0', b = 'idle1', hz = 1.3, s = 0) => Math.floor(t * hz + s) % 2 ? b : a;
  const walk = (t, f = 7) => 'w' + (Math.floor(t * f) % 4);
  const SEAT = { A0: [-2.25, -1.85], A1: [-1.35, -1.85], B0: [-.35, -1.85], B1: [.55, -1.85], V: [1.15, -1.75], C0: [-1.7, -.05], C1: [-1.7, .95] };
  const sitOn = (ch, k, frame, cam, flip = false) => { const [x, z] = SEAT[k]; place(ch, x, z + .05, frame, cam, flip); };
  const playB = (t, s = 0) => idle(t, 'playBack0', 'playBack1', 3 + s, s);
  function neonLights(on, t) {
    const fl = 1 + .03 * Math.sin(t * 11.3);
    cyan1.intensity = 6 * on * fl; cyan2.intensity = 4 * on; mag1.intensity = 5 * on * fl; mag2.intensity = 4 * on;
    for (const L of [cyan1, cyan2, mag1, mag2]) L.visible = L.intensity > .01;
    items.ledL.material.emissiveIntensity = items.ledR.material.emissiveIntensity = ledB.material.emissiveIntensity = 3.5 * on;
    glows.forEach(g => g.material.opacity = .85 * on);
    cloud.material.color.setScalar(.08 + (.84 + .08 * Math.sin(t * 1.3)) * on);
    for (const k of ['A', 'B', 'C']) { const L = tvLights[k]; L.visible = on > .5; L.intensity = 3.2 * on; }
  }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // —— cameras: one per take (2 s), positions in metres ——
  const orbitP = lt => { const a = (-75 + 150 * eio(clamp(lt / 2))) * Math.PI / 180, R = 2.35; return [.6 + Math.sin(a) * R, 2.05 - .15 * Math.sin(lt * 3), -1.75 + Math.cos(a) * R]; };
  const CAM = {
    tv1: { p: track([[0, [.1, 1.42, -.25]], [.35, [.1, 1.42, -.85]], [2, [.1, 1.42, -1.05]]]), l: () => [.1, 1.42, -3.42], fov: 38 },
    face: { p: track([[0, [2.45, .62, -3.05]], [2, [2.3, .66, -2.95]]]), l: () => [.55, 1.05, -1.82], fov: 40 },
    door: { p: track([[0, [-.75, 1.15, -.85]], [2, [-.6, 1.12, -1.05]]]), l: () => [1.75, 1.1, -3.4], fov: 42 },
    ots: { p: track([[0, [-.95, 1.62, -.15]], [2, [-.85, 1.6, -.3]]]), l: () => [1.25, 1.02, -3.3], fov: 52 },
    top: { p: track([[0, [-.12, 1.95, -3.22]], [2, [-.14, 1.75, -3.22]]]), l: () => [-.14, .69, -3.26], fov: 44, up: [0, 0, -1] },
    sofa: { p: track([[0, [2.75, 1.3, -.35]], [2, [2.75, 1.32, -.05]]]), l: track([[0, [-.6, .85, -2.1]], [2, [-.6, .85, -1.95]]]), fov: 36 },
    two: { p: track([[0, [.85, .98, -4.95]], [2, [.85, 1.0, -4.75]]]), l: () => [.85, .92, -1.8], fov: 36 },
    hands: { p: track([[0, [-.57, 1.3, .96]], [2, [-.57, 1.18, .94]]]), l: () => [-.57, .3, .93], fov: 40, up: [0, 0, -1] },
    crane: { p: track([[0, [.85, 1.05, -.25]], [2, [.75, 2.15, .25]]]), l: track([[0, [.2, 1.3, -3.4]], [2, [.2, 1.0, -3.0]]]), fov: 44 },
    goal: { p: track([[0, [.1, 1.42, -1.15]], [2, [.1, 1.42, -1.35]]]), l: track([[0, [-1.8, 1.45, -3.42]], [.3, [.1, 1.43, -3.42]], [2, [.1, 1.43, -3.42]]]), fov: 40 },
    orbit: { p: orbitP, l: () => [.6, .95, -1.8], fov: 46 },
    exit: { p: track([[0, [-1.15, 1.3, -.3]], [2, [-1.0, 1.28, -.5]]]), l: () => [1.75, 1.1, -3.4], fov: 46 },
    lvl: { p: track([[0, [-1.75, 1.62, 4.6]], [2, [-1.6, 1.6, 4.2]]]), l: track([[0, [.55, .95, -1.5]], [2, [.5, .98, -1.5]]]), fov: 50 },
    logo: { p: track([[0, [-.85, 1.2, .2]], [4, [-.85, 1.22, -.2]]]), l: () => [-.85, 1.45, -3.5], fov: 44 },
    final: { p: track([[0, [.55, 1.6, 1.5]], [4, [.12, 1.43, -1.15]]]), l: track([[0, [.1, 1.2, -3.42]], [4, [.1, 1.42, -3.42]]]), fov: 42 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, Cm = CAM[id];
    const up = Cm.up || [0, 1, 0]; cam.up.set(...up); cam.position.set(...Cm.p(lt)); cam.lookAt(...Cm.l(lt)); cam.fov = Cm.fov; cam.updateProjectionMatrix();
    if (id === 'orbit' || (id === 'goal' && t > T.goal)) { const k = id === 'orbit' ? Math.max(0, 1 - lt / 1.2) : Math.max(0, 1 - (t - T.goal) / .8); cam.position.x += Math.sin(t * 71) * .025 * k; cam.position.y += Math.sin(t * 53) * .02 * k; }
    backW.visible = id !== 'two';
    for (const k of ['A', 'B']) { items['tv' + k].visible = items['con' + k].visible = id !== 'two'; }
    cast.forEach(c => c.root.visible = false); sparkle.visible = false; confetti.visible = false;
    grabHand.visible = false; MAC.visible = id === 'hands';
    neonLights(1, t);
    const wantLogo = id === 'logo'; logo.visible = wantLogo; logoGlow.material.opacity = wantLogo ? .55 * ss(seg(t, 26.1, 26.6)) : 0; logoL.intensity = wantLogo ? 3 * ss(seg(t, 26.1, 26.6)) : 0;
    for (const o of [poster, pFrame, pBar]) o.visible = !wantLogo; pL.visible = !wantLogo;
    freePad.visible = t < T.grab; freePad.position.set(0, 0, 0);
    let focus = null, aper = 200, door = 0, tilt = 0;
    // the match on TV B
    MATCH.mode = t < 2.2 ? 'lose' : t >= T.again ? 'again' : 'play';
    MATCH.score = t >= T.goal ? [1, 0] : [0, 0]; MATCH.clock = t >= T.goal - .2 ? "90'" : "89'";
    if (t > 4 && t < 14) { MATCH.score = [0, Math.min(5, Math.floor((t - 4) / 2))]; MATCH.clock = `${10 + Math.floor((t - 4) * 8)}'`; }
    const seatedRegulars = (cam) => { sitOn(P3, 'A0', playB(t, .2), cam); sitOn(P2, 'A1', playB(t, .5), cam); };
    if (id === 'tv1') {
      sitOn(P5, 'B0', 'playBack0', cam); sitOn(NV, 'B1', 'playBack0', cam);
      focus = V3(.1, 1.42, -3.42); aper = 120;
    } else if (id === 'face') {
      sitOn(NV, 'B1', idle(t, 'sadSit', 'sadSit1', .8), cam);
      focus = V3(.55, 1.15, -1.82); aper = 260;
    } else if (id === 'door') {   // ◀◀ 10 minutes earlier: the door opens, he stands in the light
      door = ss(seg(t, T.doorOpen, T.doorOpen + .55));
      const k = seg(t, 4.9, 5.9); place(NV, lerp(1.9, 1.7, ss(k)), lerp(-3.35, -3.0, ss(k)), k > 0 && k < 1 ? idle(t, 'front', 'front1', 6) : 'front', cam);
      focus = NV.root.position.clone().setY(1.1); aper = 160;
    } else if (id === 'ots') {    // everyone turns to look at him
      door = 1; const turned = t > 6.45;
      sitOn(VT, 'A1', turned ? 'lookBack' : playB(t, .5), cam); sitOn(P5, 'B0', turned ? 'lookBack' : playB(t), cam); sitOn(P3, 'A0', turned ? 'lookBack' : playB(t, .2), cam);
      place(NV, 1.65, -2.9, idle(t, 'front', 'blink', .7), cam);
      focus = NV.root.position.clone().setY(1.1); aper = 150;
    } else if (id === 'top') {    // the only controller left; his hand takes it
      grabHand.visible = true; const a = ss(seg(t, 8.25, T.grab)), b = ss(seg(t, T.grab + .2, 9.7));
      grabHand.position.set(lerp(-.18, -.2, a), lerp(.8, .735, a) + b * .25, lerp(-2.78, -3.25, a) + b * .5); grabHand.rotation.set(0, 0, 0);
      grabHand.userData.thumb.rotation.y = .5 - a * .4;
      if (t >= T.grab) { const hp = grabHand.position; freePad.visible = true; freePad.position.set(hp.x - conB.position.x + .32, hp.y - .7 - .035, hp.z - conB.position.z - .16 - .05); }
      focus = V3(-.2, .7, -3.26); aper = 90;
    } else if (id === 'sofa') {   // he sits at the end; at the back, the veteran gets up and comes over
      sitOn(P5, 'B0', idle(t, 'play0', 'play1', 3), cam); sitOn(NV, 'B1', idle(t, 'play0', 'play1', 2.4, .3), cam);
      const k = seg(t, T.vetUp, T.vetSit);
      if (t < T.vetUp) sitOn(VT, 'A1', idle(t, 'play0', 'play1', 3), cam);
      else if (k < 1) { const x = lerp(-1.35, SEAT.V[0], ss(k)), z = -1.85 - Math.sin(k * Math.PI) * .6 + (SEAT.V[1] + 1.85) * k; place(VT, x, z, idle(t, 'front', 'front1', 7), cam); }
      else sitOn(VT, 'V', 'sitTalk1', cam);
      sitOn(P3, 'A0', idle(t, 'play0', 'play1', 3, .4), cam);
      focus = NV.root.position.clone().setY(.9); aper = 150; tilt = 8;
    } else if (id === 'two') {    // two-shot from the TV: "Segura o botão assim, ó."
      const talking = t > 12.15 && t < 13.8;
      sitOn(NV, 'B1', idle(t, 'sitFrontPad', t > 13.6 ? 'sitFrontS' : 'sitFrontB', .9), cam); sitOn(VT, 'V', talking ? idle(t, 'sitFrontO', 'sitFrontPad', 7) : 'sitFrontS', cam);
      focus = V3(.85, .95, -1.8); aper = 220;
    } else if (id === 'hands') {  // macro: the combo, button by button
      const step = Math.floor((t - T.combo) / .28), on = t > T.combo ? COMBO[((step % 4) + 4) % 4] : -1;
      BTN.forEach((b, i) => b.material.emissiveIntensity = i === on ? 1.4 : .1); btnL.intensity = on >= 0 ? .12 : 0; if (on >= 0) btnL.color.copy(BTN[on].material.color);
      const tgt = on >= 0 ? BTN[on].position : BTN[3].position, k = ss(seg(t, 14.0, T.combo));
      vH.position.set(lerp(.3, tgt.x + .045, k), .05 - (on >= 0 && (t - T.combo) % .28 < .1 ? .018 : 0), lerp(.02, tgt.z + .01, k));
      focus = V3(-.58, .32, .9); aper = 140;
    } else if (id === 'crane') {  // the rematch, from behind
      sitOn(P5, 'B0', playB(t), cam); sitOn(NV, 'B1', playB(t, .3), cam); sitOn(VT, 'V', idle(t, 'playBack0', 'cheerBack', 1.2), cam);
      seatedRegulars(cam);
      focus = V3(.2, 1.3, -3.4); aper = 0; tilt = 10;
    } else if (id === 'goal') {
      sitOn(P5, 'B0', 'playBack1', cam); sitOn(NV, 'B1', t > T.goal ? 'cheerBack' : playB(t), cam);
      focus = V3(.1, 1.42, -3.42); aper = 100;
    } else if (id === 'orbit') {  // YOU WIN — the room explodes
      const j = Math.floor(t * 5) % 2;
      place(NV, SEAT.B1[0], SEAT.B1[1] + .05, j ? 'jump1' : 'jump0', cam); place(VT, SEAT.V[0], SEAT.V[1] + .05, j ? 'jump0' : 'jump1', cam);
      sitOn(P5, 'B0', idle(t, 'cheer0', 'cheer1', 4), cam); sitOn(P3, 'A0', idle(t, 'cheer0', 'cheer1', 4, .5), cam); sitOn(P2, 'A1', idle(t, 'cheer1', 'cheer0', 4), cam);
      confetti.visible = true; confetti.userData.update(t);
      focus = V3(.6, 1.0, -1.8); aper = 120;
    } else if (id === 'exit') {   // he leaves with three friends
      door = 1;
      const grp = [[NV, 1.45, -2.85, 22.0], [VT, 1.85, -2.7, 22.2], [P5, 1.15, -2.6, 22.4], [P3, 1.6, -2.45, 22.6]];
      for (const [ch, x0, z0, t0] of grp) { const k = seg(t, t0, t0 + 1.5); if (k >= 1) continue; place(ch, lerp(x0, 1.9, ss(k)), lerp(z0, -4.3, k), idle(t + t0, 'exit0', 'exit1', 6), cam); }
      focus = V3(1.4, 1.0, -2.9); aper = 140;
    } else if (id === 'lvl') {
      seatedRegulars(cam); sitOn(CL, 'B0', playB(t, .1), cam); sitOn(P5, 'B1', playB(t, .7), cam);
      focus = V3(-.6, .9, -1.6); aper = 0; tilt = 10;
    } else if (id === 'logo') {   // the logo lights up; Lagzilla pops in and points at the call to action
      if (t > T.lag) { const s = Math.min(1, (t - T.lag) / .25); place(LAGZ, -.25, -3.0, t < T.cta ? idle(t, 'front', 'front1', 2) : idle(t, 'wave1', 'wave2', 2.4), cam); LAGZ.root.scale.setScalar(Math.max(.01, s)); sparkle.visible = true; sparkle.userData.update(t); }
      focus = V3(-.6, 1.2, -3.0); aper = 90; fill.intensity = .5;
    } else if (id === 'final') {  // the room plays on; the TV asks PLAY AGAIN?
      sitOn(P5, 'B0', playB(t), cam); sitOn(NV, 'B1', t < 31.6 ? idle(t, 'cheerBack', 'playBack1', 2) : playB(t, .3), cam); sitOn(VT, 'V', playB(t, .6), cam);
      seatedRegulars(cam);
      focus = V3(.1, 1.4, -3.42); aper = lt < 2 ? 0 : 90; tilt = lt < 2 ? 10 : 0;
    }
    doorPivot.rotation.y = door * 1.55; hallL.intensity = 1.8 * door; hallL.visible = door > .01;
    for (const k of ['A', 'B', 'C']) screens[k].draw(t, k, k === 'B' ? T.goal : null);
    tvLights.B.color.copy(screens.B.avg).lerp(new THREE.Color('#ffffff'), .35);
    if (id === 'face') { tvLights.B.color.set('#5a8cff'); tvLights.B.intensity = 5; }
    const subj = [NV, VT, LAGZ].find(c => c.root.visible) || NV; fill.position.copy(subj.root.position).add(V3(.4, 1.5, 1.5)); fill.intensity = id === 'door' || id === 'exit' ? .3 : 1.4;
    if (id === 'face') { fill.color.set('#4a7aff'); fill.intensity = 1.8; } else fill.color.set('#c8d0f0');
    dust.userData.update(t);
    if (focus) { post.dof.focus = cam.position.distanceTo(focus); post.dof.aper = aper; post.dof.maxCoc = aper > 0 ? 18 : 0; }
    post.bloom.strength = .7; post.bloom.threshold = .78;
    if (id === 'hands') { post.bloom.threshold = .97; post.bloom.strength = .35; fill.intensity = 0; cyan2.intensity = .6; cyan1.intensity = 1.5; mag2.intensity = 1; }
    if (id === 'face') { mag1.intensity *= .3; mag2.intensity *= .3; }
    if (id === 'logo') { fill.intensity = .35; post.bloom.threshold = .9; post.bloom.strength = .5; }
    if (id === 'face') { post.vig.uniforms.sat.value = .85; post.vig.uniforms.warm.value = -.08; }
    return { tilt };
  }
  return { scene, update, items, NV, LAGZ };
}

let _beam; function mats_beam() { return _beam ??= new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: .9 }); }
