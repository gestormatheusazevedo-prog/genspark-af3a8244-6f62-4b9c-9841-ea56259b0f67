// Set 2 — the room: empty and cold, then planned, built, lit cyan (left) and magenta (right), then full of people.
// One diorama for scenes 2–9; what is visible and which lights are on are functions of t.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow, blob } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, eio, eo, clamp, lerp, back } from '/core/lib.js';
import { T, BUILD, BEAT, bar } from './story.js';

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

  // —— cast ——
  const F = makeChar('hero'), C = makeChar('client'), P1 = makeChar('p1'), P2 = makeChar('p2'), P3 = makeChar('p3'), P4 = makeChar('p4'), P5 = makeChar('p5');
  const LAGZ = makeChar('lagzilla', { scale: .66 });
  const cast = [F, C, P1, P2, P3, P4, P5, LAGZ]; cast.forEach(c => scene.add(c.root));
  const fill = new THREE.PointLight('#a8b8f0', 0, 5, 2); scene.add(fill);
  const sparkle = particles(70, (i, t, o) => { const k = t - T.sparkle, a = h2(i, 3, 1) * 6.283, sp = .5 + h2(i, 4, 1) * 1.2, r = Math.max(0, k) * sp; o.x = .62 + Math.cos(a) * r * .8; o.z = .55 + Math.sin(a) * r * .4; o.y = .6 + Math.sin(h2(i, 5, 1) * 3) * r * .9 + .2; o.a = k > 0 && k < 1.1 ? (1 - k / 1.1) * (Math.floor(t * 12 + i) % 2 ? 1 : .4) : 0; o.s = .03; const c = i % 2 ? [.3, .9, 1] : [.75, .45, 1]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 });
  scene.add(sparkle);
  const dust = particles(90, (i, t, o) => { o.x = -2.8 + h2(i, 1, 9) * 5.6 + Math.sin(t * .2 + i) * .15; o.y = .3 + ((h2(i, 2, 9) * 2.3 + t * .03) % 2.3); o.z = -3 + h2(i, 3, 9) * 6; o.a = .22; o.s = .016; o.r = 1; o.g = .9; o.b = .8; }, { soft: 1 }); scene.add(dust);

  // —— helpers ——
  const _v = new THREE.Vector3();
  const place = (ch, x, z, frame, cam, flip = false) => { ch.root.visible = true; ch.root.position.set(x, 0, z); ch.frame(frame); ch.face(cam, flip); };
  const hideAll = () => cast.forEach(c => c.root.visible = false);
  const step4 = (t, f = 8, pre = 'w') => pre + (Math.floor(t * f) % 4);
  const idle = (t, a = 'idle0', b = 'idle1', hz = 1.3, s = 0) => Math.floor(t * hz + s) % 2 ? b : a;
  const SEAT = { A0: [-2.25, -1.85], A1: [-1.35, -1.85], B0: [-.35, -1.85], B1: [.55, -1.85], C0: [-1.7, -.05], C1: [-1.7, .95] };
  const seatY = .2;   // a seated sprite sinks into the bag a little
  const sitOn = (ch, k, frame, cam, flip = false) => { const [x, z] = SEAT[k]; place(ch, x, z + (frame.startsWith('play') && !frame.includes('Back') ? 0 : .05), frame, cam, flip); ch.root.position.y = 0; };
  let built = 0;   // 0..1 per item handled below
  const XP = [];
  // what is visible in each shot, and the light state
  function setBuild(t, shotId) {
    const pre = ['door', 'bulb', 'desk'].includes(shotId);
    XP.length = 0;
    for (const b of BUILD) {
      const o = items[b.id]; if (!o) continue;
      if (pre) { o.visible = false; continue; }
      if (shotId === 'build') {
        const k = t - b.t; o.visible = k >= 0; const sc = k >= 0 ? Math.max(.001, back(clamp(k / .28), 2.2)) : .001;
        const stepped = Math.round(sc * 6) / 6;   // stop-motion pop, stepped
        o.scale.copy(o.userData.base).multiplyScalar(Math.max(.001, stepped));
        if (k >= 0 && k < 1.1) XP.push({ id: b.id, k, obj: o });
      } else { o.visible = true; o.scale.copy(o.userData.base); }
    }
  }
  function lightsState(t, shotId) {
    const pre = ['door', 'bulb', 'desk'].includes(shotId);
    const on = pre ? 0 : (shotId === 'build' ? ss(seg(t, T.lightsOn, T.lightsOn + .35)) * (t < T.lightsOn + .5 ? (Math.floor(t * 20) % 3 ? 1 : .35) : 1) : 1);
    const fl = 1 + .03 * Math.sin(t * 11.3);
    cyan1.intensity = 6 * on * fl; cyan2.intensity = 4 * on; mag1.intensity = 5 * on * fl; mag2.intensity = 4 * on;
    ledL.material.emissiveIntensity = ledR.material.emissiveIntensity = 3.5 * on; ledB.material.emissiveIntensity = 3.5 * on;
    glows.forEach(g => g.material.opacity = .85 * on);
    signM.color.setScalar(.28 + .9 * on); signG.material.opacity = .55 * on;
    for (const L of [cyan1, cyan2, mag1, mag2]) L.visible = L.intensity > .01;
    return on;
  }

  // —— cameras per shot (Level 002) ——
  const CAM = {
    // two set-ups with a cut on bar 22: through the doorway from the corridor, then the wide room from the front-left (counter, TV wall, cloud)
    reveal: { p: lt => lt < 5.333 ? track([[0, [.25, 1.45, .45]], [5.333, [.45, 1.45, .05]]])(lt) : track([[5.333, [-1.3, 1.75, 2.9]], [10.67, [-1.8, 1.7, 4.2]]])(lt),
      l: lt => lt < 5.333 ? track([[0, [1.85, 1.35, -3.2]], [5.333, [1.62, 1.25, -2.7]]])(lt) : track([[5.333, [2.0, 1.3, -.45]], [10.67, [1.95, 1.3, -.4]]])(lt), get fov() { return 50; } },
    guardian: { p: track([[0, [1.4, 2.6, 4.4]], [4.0, [.7, 2.2, 3.7]], [8.0, [-.1, 1.8, 3.0]]]), l: track([[0, [-1.3, .7, .6]], [4.0, [-1.5, .65, .8]], [8.0, [-1.65, .6, .95]]]), fov: 36 },
    react: { p: track([[0, [1.6, 2.2, 3.8]], [5.33, [1.45, 2.1, 3.5]]]), l: track([[0, [-.9, .95, .55]], [5.33, [-.95, .95, .6]]]), fov: 38 },
    handoff: { p: track([[0, [.5, 2.1, 3.8]], [4.0, [.3, 2.0, 3.5]]]), l: track([[0, [-1.35, .65, .6]], [4.0, [-1.4, .65, .55]]]), fov: 36 },
    duo: { p: track([[0, [.6, 2.0, 3.7]], [2.6, [.2, 1.95, 4.1]], [6.67, [-1.8, 1.75, 4.7]]]), l: track([[0, [-1.7, .65, .45]], [2.6, [-.6, .9, .1]], [6.67, [2.1, 1.2, -.2]]]), fov: 44 },
  };
  const LZW = new THREE.Vector3();
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, Cm = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...Cm.p(lt)); cam.fov = Cm.fov; cam.updateProjectionMatrix();
    if (false) { const k = seg(t, 54.6, 57.4), hx = lerp(DOORX, 1.25, ss(k)), hz = lerp(BACKZ + .35, -1.9, ss(k)), w = ss(seg(lt, 3.5, 6.5)), L = Cm.l(lt); cam.lookAt(lerp(hx, L[0], w), lerp(.8, L[1], w), lerp(hz, L[2], w)); } else cam.lookAt(...Cm.l(lt));
    setBuild(t, id); const neon = lightsState(t, id);
    hideAll(); holos.forEach(h => h.visible = false); holoSpark.visible = false; holoL.intensity = 0; sparkle.visible = false;
    desk.visible = chair.visible = false; backW.visible = cam.position.y < WALLH + .1 || cam.position.z > BACKZ + .05;
    let door = 0, focusOn = null, aper = 360;
    const goal = (t > 57.2 && t < 58.6) || (t > 80.0 && t < 81.2);
    // the room is already alive
    sitOn(P1, 'A0', goal ? 'cheerBack' : idle(t, 'playBack0', 'playBack1', 3.1), cam);
    sitOn(P2, 'A1', idle(t, 'playBack0', 'playBack1', 2.7, .5), cam);
    sitOn(C, 'B0', goal ? idle(t, 'cheerBack', 'playBack1', 4) : idle(t, 'playBack0', 'playBack1', 3.3, .2), cam);
    sitOn(P3, 'B1', goal ? 'cheerBack' : idle(t, 'playBack0', 'playBack1', 2.9, .7), cam);
    place(P5, -.9, -2.55, goal ? 'cheer0' : idle(t, 'smile', 'smileBlink', .8), cam, true); P5.root.position.y = 0;
    if (P5.root.visible && goal) P5.frame('cheer0');
    // Lagzilla on the blue bag at the side station; turns to talk
    const lzTalk = (t > 62.3 && t < 69.0) || (t > 72.2 && t < 76.4) || (t > 81.3 && t < 83.4);
    const lzFr = id === 'handoff' && t < 77.3 ? 'offer' : lzTalk ? idle(t, 'sit0', 'sitLook', 2.2) : idle(t, 'sit0', 'sit1', 3.0);
    place(LAGZ, -1.7, .95, lzFr, cam, !(lzTalk || (id === 'handoff' && t < 77.3)));
    LAGZ.mesh.material.emissiveIntensity = t < T.visor ? .4 : t < T.visor + .25 ? (Math.floor(t * 30) % 2 ? 2.2 : .5) : 1.4;
    // the protagonist
    if (id === 'reveal') {
      door = 1 - ss(seg(t, 58.0, 59.0));
      const k = seg(t, 51.3, 53.9), x = lerp(DOORX, 1.6, ss(k)), z = lerp(BACKZ + .35, -2.55, ss(k));
      const behind = cam.position.z < z;
      place(F, x, z, k > 0 && k < 1 ? (behind ? ['backW0', 'back', 'backW1', 'back'][Math.floor(t * 6) % 4] : step4(t)) : (behind ? 'back' : (t > 53.4 && t < 55 ? 'frontO' : 'frontO')), cam, !behind && k > 0 && k < 1);
      focusOn = lt < 5.333 ? F.root.position.clone().setY(1.2) : new THREE.Vector3(1.6, 1.0, -.8); aper = lt < 5.333 ? 110 : 0;
    } else if (id === 'guardian') {
      place(F, -.55, .5, idle(t, 'idle0', 'blink', .7), cam, true);
      LAGZ.root.getWorldPosition(LZW); focusOn = LZW.clone().setY(.55); aper = 260 + lt * 15;
    } else if (id === 'react') {
      place(F, -.55, .5, t < 71.4 ? 'frontO' : idle(t, 'frontS', 'idle0', .6), cam, false);
      focusOn = F.root.position.clone().setY(1.0).lerp(new THREE.Vector3(-1.7, .6, .95), .35); aper = 260;
    } else if (id === 'handoff') {
      if (t < 77.3) place(F, -1.05, .95, t < 75.8 ? 'idle0' : 'take', cam, true);
      else sitOn(F, 'C0', idle(t, 'play0', 'play1', 3.2), cam, true);
      focusOn = new THREE.Vector3(-1.4, .7, .9); aper = 240;
    } else if (id === 'duo') {
      sitOn(F, 'C0', goal ? 'cheer0' : idle(t, 'play0', 'play1', 3.4), cam, true);
      focusOn = new THREE.Vector3(-1.7, .6, .45).lerp(new THREE.Vector3(-.6, .4, -1.2), ss(seg(t, 81.5, 85))); aper = t < 82 ? 260 : 0;
    }
    doorPivot.rotation.y = -door * 1.75; hallL.intensity = 1.5 * door; hallL.visible = door > .01; hall.material.color.set('#2a1640').multiplyScalar(.4 + .6 * door);
    bulbM.emissiveIntensity = 0; bulbL.intensity = 0; bulbL.visible = false; bulbG.material.opacity = 0;
    deskL.intensity = 0; deskL.visible = false; deskG.material.opacity = 0; lampHead.material.emissiveIntensity = 0;
    moon.intensity = .2; hemi.intensity = .6;
    for (const k of ['A', 'B', 'C']) {
      screens[k].draw(t, k, k === 'B' ? 57.3 : k === 'C' ? null : null);
      const L = tvLights[k]; L.color.copy(screens[k].avg); L.intensity = 3.2; L.visible = true;
    }
    cloud.material.color.setScalar(.92 + .08 * Math.sin(t * 1.3));
    ceil.visible = cam.position.y < CEIL - .02 && cam.position.z < 3.7;
    const hero = (id === 'guardian' || id === 'handoff') ? LAGZ : F; fill.position.copy(hero.root.position).add(new THREE.Vector3(.4, 1.5, 1.5)); fill.intensity = 1.8;
    dust.userData.update(t);
    if (focusOn) { post.dof.focus = cam.position.distanceTo(focusOn); post.dof.aper = aper; post.dof.maxCoc = aper > 0 ? 20 : 0; }
    post.bloom.strength = .8; post.bloom.threshold = .75;
    return { neon };
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
