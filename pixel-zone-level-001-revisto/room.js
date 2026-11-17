// Set 2 — the room: empty and cold, then planned, built, lit cyan (left) and magenta (right), then full of people.
// One diorama for scenes 2–9; what is visible and which lights are on are functions of t.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow, blob } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, eio, eo, clamp, lerp, back } from '/core/lib.js';
import { T, BEAT, bar } from './story.js';

const CYAN = '#2fe6ff', MAG = '#ff2fb4';
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
      R(0, 0, 64, 40, '#17702e'); for (let i = 0; i < 64; i += 8) R(i, 0, 4, 40, '#1b7d33'); R(31, 0, 1, 40, '#d8ffd8'); R(0, 0, 64, 1, '#d8ffd8'); R(0, 39, 64, 1, '#d8ffd8'); R(0, 14, 2, 12, '#ffffff'); R(62, 14, 2, 12, '#ffffff');
      const k = t * 1.3, bx = 32 + Math.sin(k) * 24 + (goalT != null ? clamp((t - goalT + 1) / 1) * 18 : 0), by = 20 + Math.sin(k * 1.7) * 9 * (goalT != null && t > goalT - .4 ? .2 : 1);
      for (let i = 0; i < 5; i++) { R(10 + i * 10 + Math.sin(k + i) * 4, 8 + (i * 7) % 24, 2, 3, '#ff3a3a'); R(14 + i * 10 + Math.cos(k * 1.2 + i) * 4, 12 + (i * 11) % 22, 2, 3, '#3a7aff'); }
      R(Math.min(61, bx), by, 2, 2, '#ffffff');
      if (goalT != null && t > goalT && t < goalT + 1.6) { const on = Math.floor((t - goalT) * 6) % 2 === 0; R(8, 12, 48, 16, on ? '#ffde3a' : '#ff3ab4'); g.fillStyle = '#100820'; g.font = 'bold 13px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GOL!', 32, 21); avg.set(on ? '#c8a830' : '#c03090'); }
      else avg.set('#2a6a32');
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

  // —— the desk corner (right wall, front) ——
  const deskM = mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 23, nails: false, cols: ['#3a2416', '#5a3a22', '#7a5230', '#946a40'] }));
  const desk = new THREE.Group(); desk.position.set(2.5, 0, 1.4);
  const top = box(.7, .05, 1.3, deskM); top.position.y = .74; desk.add(top);
  for (const [x, z] of [[-.3, -.6], [.3, -.6], [-.3, .6], [.3, .6]]) { const l = box(.05, .74, .05, deskM); l.position.set(x, 0, z); desk.add(l); }
  const nbC = notebookCanvas(), nbT = texOf(nbC); const nb = new THREE.Mesh(new THREE.PlaneGeometry(.46, .33), new THREE.MeshStandardMaterial({ map: nbT, roughness: .9 })); nb.rotation.x = -Math.PI / 2; nb.rotation.z = Math.PI / 2; nb.position.set(-.08, .797, .05); desk.add(nb);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(.09, .12, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1a1a', emissive: '#ffd890', emissiveIntensity: 0, side: THREE.DoubleSide })); lampHead.position.set(.22, 1.12, -.58); lampHead.rotation.z = .5; desk.add(lampHead);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .4), new THREE.MeshStandardMaterial({ color: '#222' })); lampArm.position.set(.26, .95, -.58); desk.add(lampArm);
  scene.add(desk);
  const deskL = new THREE.PointLight('#ffc884', 0, 4.5, 1.6); deskL.position.set(2.45, 1.08, .95); deskL.castShadow = true; deskL.shadow.mapSize.set(512, 512); deskL.shadow.bias = -.004; scene.add(deskL);
  const deskG = glow('#ffd29a', .6, 1); deskG.position.set(2.62, 1.08, .95); scene.add(deskG);
  const chair = new THREE.Group(); chair.position.set(1.95, 0, 1.4); const seatM = new THREE.MeshStandardMaterial({ color: '#1c1c24', roughness: .7 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.45, .06, .45).translate(0, .46, 0), seatM); seat.castShadow = true; chair.add(seat);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .46).translate(0, .23, 0), seatM); chair.add(stem); scene.add(chair);
  // holograms rising from the plan (scene 3)
  const holoM = new THREE.MeshBasicMaterial({ color: '#4ff0ff', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false });
  const holos = [];
  const addHolo = (geo, x, z) => { const m = new THREE.Mesh(geo, holoM.clone()); m.position.set(2.42 + x, .78, 1.45 + z); scene.add(m); holos.push(m); return m; };
  addHolo(new THREE.BoxGeometry(.06, .035, .008), -.12, -.1); addHolo(new THREE.BoxGeometry(.06, .035, .008), -.12, .03); addHolo(new THREE.BoxGeometry(.008, .035, .06), .0, -.16);
  addHolo(new THREE.SphereGeometry(.018, 8, 6), -.04, -.07); addHolo(new THREE.SphereGeometry(.018, 8, 6), -.04, .06);
  const holoL = new THREE.PointLight(CYAN, 0, 1.6, 1.5); holoL.position.set(2.4, .95, 1.45); scene.add(holoL);
  const holoSpark = particles(40, (i, t, o) => { const k = (t * .4 + i * .13) % 1; o.x = 2.3 + h2(i, 1, 2) * .3; o.z = 1.3 + h2(i, 2, 2) * .3; o.y = .78 + k * .35; o.a = (1 - k) * .8; o.s = .012; o.r = .3; o.g = .95; o.b = 1; }, { soft: 0 }); scene.add(holoSpark);

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
  const extraBag = new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10).scale(1, .55, 1).translate(0, .2, 0), bagMat.r); extraBag.position.set(.2, 0, .3); extraBag.castShadow = extraBag.receiveShadow = true; scene.add(extraBag);
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

  // —— the room before (from the photos): white walls and ceiling, cold downlights, the glass-door fridge, the water heater,
  //    a TV leaning on the wall, a scooter, flattened boxes, an old chair, a black curtain over the side door ——
  const whiteWallM = mat(plaster(96, 96, { seed: 44, wall: ['#b8b8b4', '#c8c8c4', '#d6d6d2', '#e2e2de'], beams: [] }));
  const whiteCeilM = new THREE.MeshStandardMaterial({ color: '#d8d8d4', roughness: 1, side: THREE.DoubleSide });
  const blackCeilM = ceil.material;
  const wallMeshes = []; scene.traverse(o => { if (o.isMesh && o.material === wallM) wallMeshes.push(o); });
  const EMPTY = new THREE.Group(); scene.add(EMPTY);
  const fridge = new THREE.Group(); fridge.position.set(-.6, 0, BACKZ + .35);
  fridge.add(mesh(new THREE.BoxGeometry(.6, 1.75, .6).translate(0, .875, 0), new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: .4 })));
  const fGlass = new THREE.Mesh(new THREE.PlaneGeometry(.48, 1.5), new THREE.MeshStandardMaterial({ color: '#c8d8e0', emissive: '#8aa0b0', emissiveIntensity: .25, roughness: .1, metalness: .3 })); fGlass.position.set(0, .95, .305); fridge.add(fGlass);
  for (let i = 0; i < 5; i++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(.46, .015, .02), new THREE.MeshStandardMaterial({ color: '#a8885a' })); sh.position.set(0, .45 + i * .28, .31); fridge.add(sh); }
  EMPTY.add(fridge);
  const heater = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .55, 14), new THREE.MeshStandardMaterial({ color: '#eeeeea', roughness: .5 })); heater.position.set(.9, 2.15, BACKZ + .22); EMPTY.add(heater);
  const leanTV = new THREE.Mesh(new THREE.BoxGeometry(1.25, .74, .05), new THREE.MeshStandardMaterial({ color: '#08080a', roughness: .3, metalness: .4 })); leanTV.position.set(-2.95, .42, .4); leanTV.rotation.set(0, Math.PI / 2, .08); EMPTY.add(leanTV);
  const scooter = new THREE.Group(); scooter.position.set(-.1, 0, BACKZ + .9); scooter.rotation.y = .5;
  { const sm = new THREE.MeshStandardMaterial({ color: '#202024', roughness: .5 }); scooter.add(mesh(new THREE.BoxGeometry(.14, .05, .75).translate(0, .1, 0), sm)); scooter.add(mesh(new THREE.CylinderGeometry(.015, .015, 1.0).translate(0, .6, -.36), sm)); scooter.add(mesh(new THREE.BoxGeometry(.42, .03, .03).translate(0, 1.1, -.36), sm));
    for (const z of [-.36, .36]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .05, 12), sm); w.rotation.z = Math.PI / 2; w.position.set(0, .1, z); scooter.add(w); } }
  EMPTY.add(scooter);
  const cardM = new THREE.MeshStandardMaterial({ color: '#a8804e', roughness: .9 });
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.0 - i * .1, .02, .6), cardM); c.position.set(.35 + i * .04, .2 + i * .1, BACKZ + .25); c.rotation.x = -1.2; EMPTY.add(c); }
  const oldChair = new THREE.Group(); oldChair.position.set(2.7, 0, 1.6); oldChair.rotation.y = -Math.PI / 2; { const wm = mat(woodPlanks(16, 16, { pw: 16, len: 32, seed: 3, nails: false, cols: ['#3a2414', '#523420', '#6a462a'] })); oldChair.add(mesh(new THREE.BoxGeometry(.42, .04, .42).translate(0, .46, 0), wm)); oldChair.add(mesh(new THREE.BoxGeometry(.42, .5, .04).translate(0, .72, -.2), wm)); for (const [a, b] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) oldChair.add(mesh(new THREE.BoxGeometry(.035, .46, .035).translate(a, .23, b), wm)); }
  EMPTY.add(oldChair);
  const coldL = []; for (const [x, z] of [[-1.2, -1.5], [1.0, -1.5], [-1.2, 1.2], [1.0, 1.2]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(.08, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' })); d.rotation.x = Math.PI / 2; d.position.set(x, CEIL - .01, z); EMPTY.add(d); const L = new THREE.PointLight('#f4f6ff', 2.4, 6, 1.4); L.position.set(x, CEIL - .2, z); EMPTY.add(L); coldL.push(L); }
  coldL[0].castShadow = true; coldL[0].shadow.mapSize.set(512, 512); coldL[0].shadow.bias = -.004;
  // —— what makes it Pixel Zone (visibility per stage) ——
  const Z = { rug: items.rug, tvA: items.tvA, conA: items.conA, tvB: items.tvB, conB: items.conB, tvC: items.tvC, conC: items.conC,
    bags: [0, 1, 2, 3, 4, 5].map(i => items['bag' + i]).concat([extraBag]), ledL: items.ledL, ledR: items.ledR, ledB, cloud, counter, poster: [poster, pFrame, pBar] };
  // the hologram of the future room (scene 3): the same objects, drawn as cyan light
  const holoMat = new THREE.MeshBasicMaterial({ color: '#4ff0ff', transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: false });
  const holoEdge = new THREE.MeshBasicMaterial({ color: '#9ff8ff', transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true });
  const HOLO = [];
  for (const o of [Z.tvA, Z.conA, Z.tvB, Z.conB, Z.tvC, Z.conC, ...Z.bags, Z.counter, Z.cloud, Z.rug]) {
    const g = new THREE.Group(); const c = o.clone(true); c.traverse(m => { if (m.isMesh || m.isInstancedMesh) { m.material = m === c && m.isInstancedMesh ? holoMat : holoMat; m.castShadow = m.receiveShadow = false; } }); g.add(c);
    if (!o.isInstancedMesh) { const c2 = o.clone(true); c2.traverse(m => { if (m.isMesh) { m.material = holoEdge; m.castShadow = false; } }); g.add(c2); }
    g.visible = false; scene.add(g); HOLO.push(g);
  }
  const holoGlowL = new THREE.PointLight('#4ff0ff', 0, 8, 1.3); holoGlowL.position.set(-.4, 1.6, -1.0); scene.add(holoGlowL);
  const holoDust = particles(160, (i, t, o) => { const k = (t * .25 + h2(i, 4, 6)) % 1; o.x = -2.6 + h2(i, 1, 6) * 5.2; o.z = -3.2 + h2(i, 2, 6) * 4.6; o.y = .1 + k * 2.6; o.a = Math.sin(k * 3.14) * .8; o.s = .014; o.r = .4; o.g = .95; o.b = 1; }, { soft: 0 }); scene.add(holoDust);

  // —— cast ——
  const F = makeChar('founder'), LU = makeChar('lucas'), C = makeChar('client'), P1 = makeChar('p1'), P2 = makeChar('p2'), P3 = makeChar('p3'), P4 = makeChar('p4'), P5 = makeChar('p5');
  const LAGZ = makeChar('lagzilla', { scale: .66 });
  const cast = [F, LU, C, P1, P2, P3, P4, P5, LAGZ]; cast.forEach(c => scene.add(c.root));
  const fill = new THREE.PointLight('#c8d0f0', 0, 5, 2); scene.add(fill);
  const LZP = new THREE.Vector3(1.9, 0, .55), FP = new THREE.Vector3(1.3, 0, .2);   // where the founder watches from, Lagzilla beside him
  const sparkle = particles(70, (i, t, o) => { const k = t - T.lag, a = h2(i, 3, 1) * 6.283, sp = .5 + h2(i, 4, 1) * 1.2, r = Math.max(0, k) * sp; o.x = LZP.x + Math.cos(a) * r * .8; o.z = LZP.z + Math.sin(a) * r * .4; o.y = .6 + Math.sin(h2(i, 5, 1) * 3) * r * .9 + .2; o.a = k > 0 && k < 1.1 ? (1 - k / 1.1) * (Math.floor(t * 12 + i) % 2 ? 1 : .4) : 0; o.s = .03; const c = i % 2 ? [.3, .9, 1] : [.75, .45, 1]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(sparkle);
  const dust = particles(90, (i, t, o) => { o.x = -2.8 + h2(i, 1, 9) * 5.6 + Math.sin(t * .2 + i) * .15; o.y = .3 + ((h2(i, 2, 9) * 2.3 + t * .03) % 2.3); o.z = -3 + h2(i, 3, 9) * 6; o.a = .22; o.s = .016; o.r = 1; o.g = .9; o.b = .8; }, { soft: 1 }); scene.add(dust);
  // hide the Level 001/002 leftovers
  for (const o of [desk, chair, bulb, bulbG, cord, hall, holoSpark, ...holos]) o.visible = false; bulbL.intensity = 0; bulbL.visible = false; deskL.visible = false; holoL.visible = false;

  // —— helpers ——
  const place = (ch, x, z, frame, cam, flip = false) => { ch.root.visible = true; ch.root.position.set(x, 0, z); ch.frame(frame); ch.face(cam, flip); };
  const idle = (t, a = 'idle0', b = 'idle1', hz = 1.3, s = 0) => Math.floor(t * hz + s) % 2 ? b : a;
  const walk = (t, f = 7) => 'w' + (Math.floor(t * f) % 4);
  const SEAT = { A0: [-2.25, -1.85], A1: [-1.35, -1.85], B0: [-.35, -1.85], B1: [.55, -1.85], C0: [-1.7, -.05], C1: [-1.7, .95] };
  const sitOn = (ch, k, frame, cam, flip = false) => { const [x, z] = SEAT[k]; place(ch, x, z + .05, frame, cam, flip); };
  // stage of the room: 0 empty · 1 first console · 2 TVs + black walls · 3 bags, rug, strip · 4 everything (lights off) · 5 alive
  function stage(st, t) {
    const black = st >= 2;
    for (const m of wallMeshes) m.material = black ? wallM : whiteWallM;
    ceil.material = black ? blackCeilM : whiteCeilM;
    EMPTY.visible = st === 0; for (const L of coldL) L.visible = st === 0;
    const vis = (o, v) => { if (Array.isArray(o)) o.forEach(q => q.visible = v); else o.visible = v; };
    vis(Z.conB, st >= 1); vis(Z.tvB, st >= 2); vis(Z.tvA, st >= 2); vis(Z.conA, st >= 2); vis(Z.tvC, st >= 3); vis(Z.conC, st >= 3);
    Z.bags.forEach((b, i) => b.visible = st >= 4 || (st === 3 && i < 4)); vis(Z.rug, st >= 3); vis(Z.ledL, st >= 3); vis(Z.ledR, st >= 3); vis(Z.ledB, st >= 3);
    vis(Z.cloud, st >= 4); vis(Z.counter, st >= 4); vis(Z.poster, st >= 4);
    // the build stages keep a little of the old room: the fridge stays by the wall until the end
    if (st >= 1 && st <= 3) { EMPTY.visible = true; for (const o of EMPTY.children) o.visible = o === fridge || o === heater || (st === 1 && (o === scooter || o === leanTV)); for (const L of coldL) L.visible = false; }
  }
  function neonLights(on, t) {
    const fl = 1 + .03 * Math.sin(t * 11.3);
    cyan1.intensity = 6 * on * fl; cyan2.intensity = 4 * on; mag1.intensity = 5 * on * fl; mag2.intensity = 4 * on;
    for (const L of [cyan1, cyan2, mag1, mag2]) L.visible = L.intensity > .01;
    Z.ledL.material.emissiveIntensity = Z.ledR.material.emissiveIntensity = Z.ledB.material.emissiveIntensity = 3.5 * on;
    glows.forEach(g => g.material.opacity = .85 * on);
    Z.cloud.material.color.setScalar(.08 + (.84 + .08 * Math.sin(t * 1.3)) * on);
    for (const k of ['A', 'B', 'C']) { const L = tvLights[k]; L.visible = on > .5 && Z['tv' + k].visible; L.intensity = 3.2 * on; }
  }
  // —— cameras ——
  const CB = { p: [-1.75, 1.62, 4.6], l: [.55, .95, -1.5], fov: 50 };   // the callback frame: identical empty / full
  const CAM = {
    pitchA: { p: track([[0, CB.p], [5.33, [-1.6, 1.6, 4.3]]]), l: track([[0, CB.l], [5.33, [.5, .98, -1.5]]]), fov: 50 },
    shake: { p: track([[0, [.3, 1.75, 6.2]], [8, [.2, 1.6, 5.2]]]), l: track([[0, [.15, 1.15, -.6]], [8, [.15, 1.1, -.4]]]), fov: 40 },
    build1: { p: track([[0, [1.6, 1.7, 1.8]], [2.67, [1.4, 1.65, 1.4]]]), l: track([[0, [.2, .8, -3.0]], [2.67, [.2, .8, -3.0]]]), fov: 42 },
    build2: { p: track([[0, [.3, 1.7, 2.2]], [2.67, [-.1, 1.65, 1.9]]]), l: track([[0, [-1.8, 1.25, -3.2]], [2.67, [-1.8, 1.3, -3.2]]]), fov: 42 },
    build3: { p: track([[0, [1.6, 1.7, 3.0]], [1.33, [1.4, 1.7, 2.8]]]), l: track([[0, [-.6, .8, -1.2]], [1.33, [-.7, .8, -1.2]]]), fov: 44 },
    alive: { p: track([[0, [1.0, 1.5, 2.6]], [4.0, [.8, 1.5, 2.8]], [7.0, [-.4, 1.6, 3.2]], [12, CB.p]]), l: track([[0, [-.6, 1.0, -1.5]], [4.0, [-.6, 1.1, -1.6]], [7.0, [.2, 1.25, -1.6]], [12, CB.l]]), fov: 46 },
    opening: { p: track([[0, [-1.4, 1.75, 3.9]], [9.33, [-1.0, 1.65, 3.3]]]), l: track([[0, [1.0, 1.2, -1.8]], [9.33, [.5, 1.05, -1.2]]]), fov: 48 },
    belong: { p: track([[0, [-.6, 1.6, 4.8]], [4.33, [-.1, 1.5, 3.9]]]), l: track([[0, [1.1, 1.0, .1]], [4.33, [1.05, 1.0, .2]]]), fov: 36 },
    cbEmpty: { p: track([[0, CB.p], [1.7, CB.p]]), l: track([[0, CB.l], [1.7, CB.l]]), fov: 50 },
    cbFull: { p: track([[0, CB.p], [2.5, CB.p], [7.6, [-.4, 1.5, 3.8]]]), l: track([[0, CB.l], [2.5, CB.l], [7.6, [1.0, 1.0, .1]]]), fov: 50 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, Cm = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...Cm.p(lt)); cam.lookAt(...Cm.l(lt)); cam.fov = Cm.fov; cam.updateProjectionMatrix();
    backW.visible = true;
    cast.forEach(c => c.root.visible = false); sparkle.visible = false;
    HOLO.forEach(h => h.visible = false); holoDust.visible = false; holoGlowL.intensity = 0;
    const st = { pitchA: 0, shake: 0, cbEmpty: 0, build1: 1, build2: 2, build3: 3, alive: t < T.lightsOn ? 4 : 5 }[id] ?? 5;
    stage(st, t);
    const on = st === 5 ? (id === 'alive' ? ss(seg(t, T.lightsOn, T.lightsOn + .35)) * (t < T.lightsOn + .5 ? (Math.floor(t * 20) % 3 ? 1 : .35) : 1) : 1) : 0;
    neonLights(on, t);
    // work light while building (bare bulb feel), cold daylight when empty
    const work = st >= 1 && st <= 4 ? 1 : 0;
    bulb.visible = cord.visible = bulbG.visible = !!work; bulbL.visible = !!work; bulbL.intensity = 6 * work * (.95 + .05 * Math.sin(t * 13)); bulbM.emissiveIntensity = 2.2 * work; bulbG.material.opacity = .9 * work;
    hemi.intensity = st === 0 ? 1.1 : work ? .9 : .6; hemi.color.set(st === 0 ? '#e8ecf4' : work ? '#c8b8a0' : '#3a3a8a');
    moon.intensity = st === 0 ? .2 : .25;
    let focus = null, aper = 220, door = 0;
    if (id === 'pitchA') {   // they come in through the side door and look around the empty room
      const k = seg(t, T.enter, 33.2);
      const fx = lerp(DOORX, .4, ss(k)), fz = lerp(BACKZ + .4, -1.3, ss(k));
      place(F, fx, fz, k > 0 && k < 1 ? walk(t) : (Math.floor(t * 1.2) % 2 ? 'present0' : 'present1'), cam, k > 0 && k < 1);
      place(LU, lerp(DOORX, 1.25, ss(seg(t, T.enter + .6, 33.8))), lerp(BACKZ + .4, -1.9, ss(seg(t, T.enter + .6, 33.8))), seg(t, T.enter + .6, 33.8) < 1 ? walk(t + .2) : 'idle0', cam, true);
      door = t < 33.5 ? ss(seg(t, 29.3, 29.9)) : 1 - ss(seg(t, 33.5, 34.3));
      focus = F.root.position.clone().setY(1.0); aper = 0;
    } else if (id === 'shake') {   // the hologram of the future Pixel Zone, then the handshake
      place(F, -.25, .2, t < T.shake - .4 ? (Math.floor(t * 1.4) % 2 ? 'present0' : 'present1') : (Math.floor(t * 2) % 2 ? 'shake0' : 'shake1'), cam, false);
      place(LU, .62, .2, t < T.shake - .4 ? idle(t, 'idle0', 'talk1', .9) : (Math.floor(t * 2) % 2 ? 'shake0' : 'shake1'), cam, true);
      HOLO.forEach((h, i) => { const k = seg(t, T.holo0 + i * .18, T.holo0 + i * .18 + .35); h.visible = k > 0 && t < 42.4; h.scale.setScalar(Math.max(.001, Math.round(k * 5) / 5)); });
      holoDust.visible = true; holoDust.userData.update(t); holoGlowL.intensity = 1.6 * ss(seg(t, T.holo0, T.holo0 + 1.5));
      holoMat.opacity = .14 + .04 * Math.sin(t * 9); EMPTY.visible = true;
      focus = new THREE.Vector3(.2, 1.1, .2); aper = 260;
    } else if (id === 'build1') {   // first console on the first shelf
      place(F, .35, -2.75, idle(t, 'kneel0', 'kneel1', 2.2), cam, true); focus = F.root.position.clone().setY(.7);
    } else if (id === 'build2') {   // the TV goes up on the black wall
      place(F, -1.8, -2.75, t < 61.2 ? 'lift' : idle(t, 'smile', 'idle0', 1), cam, false); F.face(cam, false); focus = F.root.position.clone().setY(1.1);
    } else if (id === 'build3') {   // bags and the LED strip arrive
      const x = lerp(.9, -.7, seg(lt, 0, 1.33)); place(F, x, -.3, 'carry' + (Math.floor(t * 7) % 4), cam, true); focus = F.root.position.clone().setY(1.0);
    } else if (id === 'alive') {   // last bag placed, lights on, he steps back and looks
      if (t < 67.6) place(F, -.3 + .2 * ss(seg(t, 65.4, 66.6)), -.9, t < 66.6 ? 'carry' + (Math.floor(t * 7) % 4) : 'kneel0', cam, true);
      else if (t < T.lightsOn + .8) place(F, -.1, -.9, idle(t, 'idle0', 'lookBack', .8), cam, false);
      else { const k = seg(t, T.lightsOn + .8, 72.6); place(F, lerp(-.1, .9, ss(k)), lerp(-.9, -.2, ss(k)), k > 0 && k < 1 ? 'backW' + (Math.floor(t * 5) % 2) : (Math.floor(t * .8) % 2 ? 'proud1' : 'proud'), cam, false); }
      focus = F.root.position.clone().setY(1.0); aper = 160;
    } else if (id === 'opening' || id === 'belong' || id === 'cbFull') {   // 17 de agosto: the door opens, they come in and play
      const arrive = [[P1, 'A0', 78.5], [P2, 'A1', 79.0], [C, 'B0', 79.5], [P3, 'B1', 80.0], [P4, 'C0', 80.6], [P5, 'C1', 81.2]];
      for (const [ch, k, t0] of arrive) {
        const [sx, sz] = SEAT[k], tt = id === 'opening' ? t : 999, w = seg(tt, t0, t0 + 2.0);
        if (tt < t0) continue;
        if (w < 1) place(ch, lerp(DOORX, sx + .3, w), lerp(BACKZ + .4, sz + .45, w), walk(t + t0), cam, sx + .3 < DOORX);
        else { const back = cam.position.z > sz; sitOn(ch, k, back ? idle(t, 'playBack0', 'playBack1', 3 + t0 % 1) : idle(t, 'play0', 'play1', 3), cam, k.startsWith('C') ? false : false); }
      }
      if (id === 'opening') door = t < 84 ? ss(seg(t, T.doorOpen, T.doorOpen + .5)) : 1 - ss(seg(t, 84, 85));
      place(F, FP.x, FP.z, idle(t, 'smile', 'smileBlink', .7), cam, true);
      if (id !== 'opening') place(LU, 2.0, -2.3, idle(t, 'smile', 'idle0', .6), cam, true);
      if (id !== 'opening' && (id === 'cbFull' || t > T.lag)) { place(LAGZ, LZP.x, LZP.z, idle(t, 'front', 'front1', 1.2), cam); if (id === 'belong') { sparkle.visible = true; sparkle.userData.update(t); LAGZ.root.scale.setScalar(Math.max(.01, Math.min(1, (t - T.lag) / .25))); } else LAGZ.root.scale.setScalar(1); }
      if (id === 'cbFull' && lt > 4) F.frame(idle(t, 'frontS', 'smile', .5));
      focus = id === 'opening' ? new THREE.Vector3(-.6, .6, -1.4) : F.root.position.clone().setY(1.0); aper = id === 'opening' ? 0 : 200;
    }
    // doors
    doorPivot.rotation.y = -door * 1.6; hallL.intensity = 1.6 * door; hallL.visible = door > .01;
    for (const k of ['A', 'B', 'C']) screens[k].draw(t, on > .5 ? k : 'off', k === 'B' ? 83.4 : null);
    const subj = F.root.visible ? F : LU; fill.position.copy(subj.root.position).add(new THREE.Vector3(.4, 1.5, 1.5)); fill.intensity = st === 0 ? .6 : 1.5;
    dust.userData.update(t);
    if (focus) { post.dof.focus = cam.position.distanceTo(focus); post.dof.aper = aper; post.dof.maxCoc = aper > 0 ? 18 : 0; }
    post.bloom.strength = st === 0 ? .3 : .7; post.bloom.threshold = st === 0 ? .95 : .78;
    if (st === 0) { post.vig.uniforms.sat.value = .85; post.vig.uniforms.warm.value = -.02; }
    return { tilt: ['cbEmpty', 'cbFull', 'pitchA', 'opening'].includes(id) ? 0 : 10 };
  }
  return { scene, update, items, F, LAGZ };
}


const XPN = { rug: 10, tvA: 50, conA: 25, tvB: 50, conB: 25, tvC: 50, conC: 25, bag0: 10, bag1: 10, bag2: 10, bag3: 10, bag4: 10, bag5: 10, ledL: 30, ledR: 30, sign: 100, plant: 5 };
let _beam; function mats_beam() { return _beam ??= new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: .9 }); }

// the plan on the notebook: grid paper, the room outline, three stations, six bags, drawn over time
function drawPlan(c, t) {
  const g = c.getContext('2d'), W = c.width, H = c.height; g.imageSmoothingEnabled = false;
  g.fillStyle = '#e9e2cf'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#c9d6e6'; for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
  g.fillStyle = '#b8b0a0'; g.fillRect(W / 2, 0, 1, H);
  const k = clamp((t - T.plan0) / 5.5), ink = '#1f2a55';
  const segs = [[6, 6, 66, 6], [66, 6, 66, 46], [66, 46, 6, 46], [6, 46, 6, 6]];
  const total = 4; let left = k * 9;
  g.fillStyle = ink; let tip = [6, 6];
  for (const [x0, y0, x1, y1] of segs) { const u = clamp(left); left -= 1; const n = Math.round(Math.hypot(x1 - x0, y1 - y0) * u); for (let i = 0; i <= n; i++) { const a = i / Math.max(1, Math.hypot(x1 - x0, y1 - y0)); g.fillRect(Math.round(x0 + (x1 - x0) * a), Math.round(y0 + (y1 - y0) * a), 1, 1); } if (u > 0) tip = [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]; }
  const sta = [[12, 8, 14, 3], [30, 8, 14, 3], [8, 22, 3, 12]];
  sta.forEach(([x, y, w, h], i) => { if (left - i * .5 > 0) { g.fillStyle = '#2a7ad0'; g.fillRect(x, y, w, h); tip = [x + w, y + h]; } });
  left -= 1.6;
  [[14, 16], [22, 16], [32, 16], [40, 16], [16, 26], [16, 33]].forEach(([x, y], i) => { if (left - i * .25 > 0) { g.fillStyle = i % 2 ? '#2a50c0' : '#c03040'; g.fillRect(x - 2, y - 1, 4, 3); g.fillRect(x - 1, y - 2, 2, 5); tip = [x + 1, y + 1]; } });
  left -= 1.6;
  if (left > 0) { g.fillStyle = '#d02a90'; g.fillRect(52, 6, 8, 1); g.fillRect(56, 2, 1, 4); g.fillStyle = ink; g.font = 'bold 7px monospace'; g.fillText('PZ', 46, 30); tip = [56, 30]; }
  // the drawing hand: pencil tip on the line, hand up and to the right (only while drawing, before the camera tilts away)
  if (t < 25.0 && t > T.plan0 - .4) { const [x, y] = [Math.round(tip[0] + Math.sin(t * 9) * .6), Math.round(tip[1])];
    g.fillStyle = '#1a1a1a'; g.fillRect(x, y, 1, 1); g.fillStyle = '#e6c24a'; for (let i = 1; i < 9; i++) g.fillRect(x + i, y - Math.round(i * .7), 1, 2);
    g.fillStyle = '#a8694a'; g.fillRect(x + 7, y - 10, 9, 7); g.fillStyle = '#c98d6a'; g.fillRect(x + 8, y - 10, 7, 5); g.fillStyle = '#16151c'; g.fillRect(x + 15, y - 12, 12, 11);
    g.fillStyle = '#5a3424'; g.fillRect(x + 10, y - 5, 4, 1); }
}
