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
  const nL = vhand('#c98d6a', '#2753b8', 1), nR = vhand('#c98d6a', '#2753b8', -1);
  nL.position.set(-.1, -.005, .1); nL.rotation.y = .25; nR.position.set(.1, -.005, .1); nR.rotation.y = -.25; MAC.add(nL, nR);
  const vH = vhand('#b97a55', '#22212b', -1); vH.rotation.y = Math.PI / 2 + .2; MAC.add(vH); vH.visible = false;
  const macBg = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshStandardMaterial({ map: rug.material.map, roughness: 1 })); macBg.rotation.x = -Math.PI / 2; macBg.position.set(0, -.28, 0); MAC.add(macBg);
  const COMBO = [3, 1, 0, 1];   // which button lights, in order

  // —— cast ——
  const WK = makeChar('trab'), VT = makeChar('veterano'), P5 = makeChar('p5'), P3 = makeChar('p3'), P2 = makeChar('p2'), NV = makeChar('novato');
  const LAGZ = makeChar('lagzilla', { scale: .66 });
  const cast = [WK, VT, P5, P3, P2, NV, LAGZ]; cast.forEach(c => scene.add(c.root));
  const fill = new THREE.PointLight('#c8d0f0', 0, 5, 2); scene.add(fill);
  const sparkle = particles(70, (i, t, o) => { const k = t - T.lag, a = h2(i, 3, 1) * 6.283, sp = .5 + h2(i, 4, 1) * 1.2, r = Math.max(0, k) * sp; o.x = -.25 + Math.cos(a) * r * .8; o.z = -3.0 + Math.sin(a) * r * .4; o.y = .6 + Math.sin(h2(i, 5, 1) * 3) * r * .9 + .2; o.a = k > 0 && k < 1.1 ? (1 - k / 1.1) * (Math.floor(t * 12 + i) % 2 ? 1 : .4) : 0; o.s = .03; const c = i % 2 ? [.3, .9, 1] : [.75, .45, 1]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(sparkle);
  const hearts = particles(80, (i, t, o) => { const k = t - T.lvl, a = h2(i, 3, 2) * 6.283, sp = 1 + h2(i, 4, 2) * 1.6; o.x = .7 + Math.cos(a) * k * sp * .7; o.z = -1.8 + Math.sin(a) * k * sp * .5; o.y = 1.0 + k * 2.2 - k * k * 1.6 + h2(i, 6, 2) * .3; o.a = k > 0 && k < 2 ? 1 : 0; o.s = .035; const c = [[.3, 1, .45], [1, .25, .45], [.2, .95, 1], [1, .85, .2]][i % 4]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(hearts);
  const dust = particles(90, (i, t, o) => { o.x = -2.8 + h2(i, 1, 9) * 5.6 + Math.sin(t * .2 + i) * .15; o.y = .3 + ((h2(i, 2, 9) * 2.3 + t * .03) % 2.3); o.z = -3 + h2(i, 3, 9) * 6; o.a = .22; o.s = .016; o.r = 1; o.g = .9; o.b = .8; }, { soft: 1 }); scene.add(dust);
  const place = (ch, x, z, frame, cam, flip = false) => { ch.root.visible = true; ch.root.position.set(x, 0, z); ch.frame(frame); ch.face(cam, flip); ch.root.scale.setScalar(1); };
  const idle = (t, a = 'idle0', b = 'idle1', hz = 1.3, s = 0) => Math.floor(t * hz + s) % 2 ? b : a;
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
  const orbitP = lt => { const a = (-70 + 140 * eio(clamp(lt / 1.6))) * Math.PI / 180, R = 2.35; return [.6 + Math.sin(a) * R, 2.0 - .1 * Math.sin(lt * 3), -1.75 + Math.cos(a) * R]; };
  const CAM = {
    open: { p: track([[0, [1.9, 1.5, -4.6]], [2, [1.85, 1.48, -4.1]]]), l: () => [.2, 1.0, -.5], fov: 50 },
    hands: { p: track([[0, [-.57, 1.3, .96]], [2.5, [-.57, 1.16, .94]]]), l: () => [-.57, .3, .93], fov: 40, up: [0, 0, -1] },
    sofa: { p: track([[0, [.55, 2.75, .55]], [2.9, [.5, 2.6, .25]]]), l: () => [.5, .6, -1.9], fov: 44 },
    laugh: { p: track([[0, [.55, .98, -4.7]], [2, [.55, 1.0, -4.45]]]), l: () => [.55, 1.0, -1.8], fov: 26 },
    laughW: { p: track([[0, [-.9, 1.25, .4]], [1.5, [-.75, 1.22, .2]]]), l: () => [.75, .95, -1.85], fov: 40 },
    orbit: { p: orbitP, l: () => [.6, .95, -1.8], fov: 46 },
    logo: { p: track([[0, [-.85, 1.2, .2]], [2.8, [-.85, 1.22, -.15]]]), l: () => [-.85, 1.45, -3.5], fov: 44 },
    cta: { p: track([[0, [-.75, 1.25, -.15]], [1.7, [-.7, 1.28, -.5]]]), l: () => [-.6, 1.4, -3.5], fov: 40 },
    final: { p: track([[0, [-1.75, 1.62, 4.6]], [3.8, [-1.45, 1.58, 3.9]]]), l: track([[0, [.55, .95, -1.5]], [3.8, [.5, .98, -1.5]]]), fov: 50 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, Cm = CAM[id];
    cam.up.set(...(Cm.up || [0, 1, 0])); cam.position.set(...Cm.p(lt)); cam.lookAt(...Cm.l(lt)); cam.fov = Cm.fov; cam.updateProjectionMatrix();
    if (id === 'orbit') { const k = Math.max(0, 1 - lt / 1.0); cam.position.x += Math.sin(t * 71) * .02 * k; cam.position.y += Math.sin(t * 53) * .015 * k; }
    backW.visible = id !== 'laugh';
    for (const k of ['A', 'B']) { items['tv' + k].visible = items['con' + k].visible = id !== 'laugh'; }
    cast.forEach(c => c.root.visible = false); sparkle.visible = false; hearts.visible = false;
    grabHand.visible = false; MAC.visible = id === 'hands';
    // the safe zone switches on as the door opens
    const on = id === 'open' ? ss(seg(t, T.door + .05, T.door + .45)) : 1;
    neonLights(on, t);
    const wantLogo = id === 'logo' || id === 'cta'; logo.visible = wantLogo; logoGlow.material.opacity = wantLogo ? .55 * ss(seg(t, 33.1, 33.6)) : 0; logoL.intensity = wantLogo ? 3 * ss(seg(t, 33.1, 33.6)) : 0;
    for (const o of [poster, pFrame, pBar]) o.visible = !wantLogo; pL.visible = !wantLogo;
    freePad.visible = true; freePad.position.set(0, 0, 0);
    MATCH.mode = 'play'; MATCH.score = [Math.floor(t / 9) % 3, Math.floor(t / 7) % 3]; MATCH.clock = `${(Math.floor(t * 3) % 90) + 1}'`;
    let focus = null, aper = 200, door = 0, tilt = 0;
    const regulars = () => { sitOn(P3, 'A0', playB(t, .2), cam); sitOn(P2, 'A1', playB(t, .5), cam); };
    if (id === 'open') {          // POV from the hallway: the door swings in and the room lights up
      door = ss(seg(t, T.door - .1, T.door + .4)); sitOn(VT, 'V', playB(t), cam); sitOn(P5, 'B0', playB(t, .4), cam); regulars();
      focus = V3(.4, 1.0, -1.6); aper = 120; tilt = 6;
    } else if (id === 'hands') {   // macro: his hands on the pad, the buttons light up
      const step = Math.floor(t / .26), onB = [3, 1, 0, 2][((step % 4) + 4) % 4];
      BTN.forEach((b, i) => b.material.emissiveIntensity = i === onB ? 1.4 : .1); btnL.intensity = .12; btnL.color.copy(BTN[onB].material.color);
      nR.userData.thumb.rotation.x = Math.sin(t * 18) * .2;
      focus = V3(-.57, .32, .93); aper = 140;
    } else if (id === 'sofa') {    // from above: the friends make room for him; a high five
      const k = ss(seg(t, 25.0, 25.9));
      place(WK, lerp(1.6, SEAT.B1[0], k), lerp(-1.2, SEAT.B1[1] + .05, k), k < 1 ? idle(t, 'front', 'front1', 6) : t > 26.6 && t < 27.2 ? 'sitTalk1' : 'sitFrontPad', cam);
      sitOn(VT, 'V', t > 26.6 && t < 27.2 ? 'sitTalk1' : idle(t, 'sitFrontS', 'sitFront', 1.5), cam, true); sitOn(P5, 'B0', idle(t, 'sitFrontS', 'sitFrontPad', 1.2), cam); sitOn(P3, 'A1', idle(t, 'sitFrontPad', 'sitFrontS', 1.1), cam);
      focus = V3(.5, .7, -1.85); aper = 120;
    } else if (id === 'laugh') {   // close-up from the TV: he laughs for real
      sitOn(WK, 'B1', idle(t, 'laughF0', 'laughF1', 5), cam);
      focus = V3(.55, 1.05, -1.8); aper = 200;
    } else if (id === 'laughW') {
      sitOn(WK, 'B1', idle(t, 'cheer0', 'cheer1', 4), cam); sitOn(VT, 'V', idle(t, 'cheer1', 'cheer0', 4), cam); sitOn(P5, 'B0', idle(t, 'play0', 'play1', 3), cam);
      focus = WK.root.position.clone().setY(1.0); aper = 150;
    } else if (id === 'orbit') {   // HP MAX — the group, the room, the hearts
      const j = Math.floor(t * 5) % 2;
      place(WK, SEAT.B1[0], SEAT.B1[1] + .05, j ? 'jump1' : 'jump0', cam); place(VT, SEAT.V[0], SEAT.V[1] + .05, j ? 'jump0' : 'jump1', cam);
      sitOn(P5, 'B0', idle(t, 'cheer0', 'cheer1', 4), cam); sitOn(P3, 'A0', idle(t, 'cheer0', 'cheer1', 4, .5), cam); sitOn(P2, 'A1', idle(t, 'cheer1', 'cheer0', 4), cam);
      hearts.visible = true; hearts.userData.update(t);
      focus = V3(.6, 1.0, -1.8); aper = 120;
    } else if (id === 'logo' || id === 'cta') {   // the logo; Lagzilla pops in, then points at the call to action
      if (t > T.lag) { const s = Math.min(1, (t - T.lag) / .25); place(LAGZ, -.25, -3.0, id === 'logo' ? idle(t, 'front', 'front1', 2) : idle(t, 'wave1', 'wave2', 2.4), cam); LAGZ.root.scale.setScalar(Math.max(.01, s)); sparkle.visible = id === 'logo'; sparkle.userData.update(t); }
      focus = V3(-.6, 1.2, -3.0); aper = 90;
    } else if (id === 'final') {   // the whole room, from the door
      door = 1; sitOn(WK, 'B1', playB(t, .3), cam); sitOn(VT, 'V', playB(t, .6), cam); sitOn(P5, 'B0', playB(t), cam); regulars(); sitOn(NV, 'C0', idle(t, 'play0', 'play1', 3), cam, true);
      focus = V3(-.2, .9, -1.5); aper = 0; tilt = 10;
    }
    doorPivot.rotation.y = door * 1.55; hallL.intensity = 1.8 * door; hallL.visible = door > .01;
    for (const k of ['A', 'B', 'C']) screens[k].draw(t, k, null);
    tvLights.B.color.copy(screens.B.avg).lerp(new THREE.Color('#ffffff'), .35);
    const subj = [WK, LAGZ].find(c => c.root.visible) || WK; fill.position.copy(subj.root.position).add(V3(.4, 1.5, 1.5)); fill.intensity = 1.4;
    dust.userData.update(t);
    if (focus) { post.dof.focus = cam.position.distanceTo(focus); post.dof.aper = aper; post.dof.maxCoc = aper > 0 ? 18 : 0; }
    post.bloom.strength = .7; post.bloom.threshold = .78;
    if (id === 'hands') { post.bloom.threshold = .97; post.bloom.strength = .35; fill.intensity = 0; cyan2.intensity = .6; cyan1.intensity = 1.5; mag2.intensity = 1; }
    if (id === 'logo' || id === 'cta') { fill.intensity = .35; post.bloom.threshold = .9; post.bloom.strength = .5; }
    return { tilt, cold: id === 'open' ? 1 - on : 0 };
  }
  return { scene, update, items, LAGZ };
}

let _beam; function mats_beam() { return _beam ??= new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: .9 }); }
