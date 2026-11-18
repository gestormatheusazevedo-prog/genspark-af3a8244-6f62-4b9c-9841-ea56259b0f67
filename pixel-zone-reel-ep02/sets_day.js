// Safe Zone 01 — the day that takes HP: the bedroom at 7:00, the car in traffic, the office (day → night).
// Three small dioramas, built once; each update() places the camera for its take and returns {}.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow } from './px.js';
import { mat, mesh, box } from './kit.js';
import { sky, particles, rain } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, clamp, lerp } from '/core/lib.js';
import { T } from './story.js';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function ptext(g, txt, x, y, font, col, align = 'left') { g.save(); g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'top'; g.fillText(txt, x, y); g.restore(); }
function harden(g, w, h) { const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); }
const vm = c => new THREE.MeshStandardMaterial({ color: c, roughness: .8, flatShading: true });
export function vhand(skin, sleeve, side = 1) {
  const g = new THREE.Group(), S = vm(skin), L = vm(sleeve);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.075, .065, .34).translate(0, 0, .2), L));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.08, .07, .03).translate(0, 0, .035), L));
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.066, .03, .07).translate(0, 0, -.03), S));
  for (let i = 0; i < 4; i++) g.add(new THREE.Mesh(new THREE.BoxGeometry(.014, .022, .04).translate(-.024 + i * .016, -.004, -.08), S));
  const th = new THREE.Mesh(new THREE.BoxGeometry(.018, .022, .045), S); th.position.set(side * .042, .006, -.045); th.rotation.y = side * .5; g.add(th); g.userData.thumb = th;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
const SKIN = '#c98d6a', BLUE = '#2753b8';

// ——————————————————————————— the bedroom, 7:00 ———————————————————————————
export async function buildHome() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0e18'); scene.fog = new THREE.FogExp2('#0a0e18', .03);
  const BZ = -1.6, RW = 1.9, WH = 2.6;
  const floorM = mat(woodPlanks(64, 64, { pw: 6, len: 40, seed: 5, cols: ['#1c140e', '#2a1e14', '#3a2a1c', '#4a3624'] }), { rough: .7 });
  const wallM = mat(plaster(64, 64, { seed: 9, wall: ['#2a3040', '#323a4c', '#3c4458', '#465066'], beams: [] }));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, .2, 4.4).translate(0, -.1, .4), floorM));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, WH, .2).translate(0, WH / 2, BZ - .1), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.2, WH, 4.4).translate(-RW - .1, WH / 2, .4), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.2, WH, 4.4).translate(RW + .1, WH / 2, .4), wallM));
  // window: grey dawn over the town, blinds half down
  const [wc, wg] = canvas(48, 40); const gr = wg.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, '#4a5878'); gr.addColorStop(1, '#a0a8b8'); wg.fillStyle = gr; wg.fillRect(0, 0, 48, 40);
  for (let b = 0; b < 7; b++) { const x = b * 7, hh = 10 + (h2(b, 5, 2) * 14 | 0); wg.fillStyle = '#2a3040'; wg.fillRect(x, 40 - hh, 7, hh); }
  for (let y = 0; y < 18; y += 3) { wg.fillStyle = '#c8ccd4'; wg.fillRect(0, y, 48, 2); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .85), new THREE.MeshBasicMaterial({ map: texOf(wc) })); win.position.set(.2, 1.65, BZ + .01); scene.add(win);
  const dawn = new THREE.DirectionalLight('#9ab0e0', .9); dawn.position.set(.5, 3, -4); dawn.target.position.set(.4, 0, .6); dawn.castShadow = true; dawn.shadow.mapSize.set(1024, 1024); Object.assign(dawn.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); scene.add(dawn, dawn.target);
  const hemi = new THREE.HemisphereLight('#5a6890', '#14141c', .7); scene.add(hemi);
  // bed with a grey duvet, nightstand with the digital alarm clock
  const deskM = mat(woodPlanks(32, 32, { pw: 32, len: 64, seed: 13, nails: false, cols: ['#2a1c12', '#3a2818', '#4e3620', '#62462c'] }));
  const bed = new THREE.Group(); bed.position.set(.4, 0, .2);
  bed.add(box(1.1, .32, 2.0, deskM)); const matt = box(1.04, .16, 1.95, vm('#8a90a8')); matt.position.y = .32; bed.add(matt);
  const pil = box(.7, .1, .35, vm('#c8ccd8')); pil.position.set(0, .48, -.75); bed.add(pil);
  scene.add(bed);
  const duvet = box(1.08, .1, 1.25, vm('#4a5478')); duvet.position.set(.4, .48, .62); scene.add(duvet);
  const ns = box(.45, .5, .4, deskM); ns.position.set(-.45, 0, -1.0); scene.add(ns);
  const [cc, cg] = canvas(40, 16); const clockT = texOf(cc);
  const drawClock = (t, on) => { cg.fillStyle = '#060608'; cg.fillRect(0, 0, 40, 16); if (on) ptext(cg, '07:00', 20, 2, 'bold 12px monospace', '#ff2a2a', 'center'); harden(cg, 40, 16); clockT.needsUpdate = true; };
  const clock = new THREE.Group(); clock.position.set(-.45, .5, -1.0);
  clock.add(new THREE.Mesh(new THREE.BoxGeometry(.24, .1, .1).translate(0, .05, 0), vm('#16161c')));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.2, .08), new THREE.MeshBasicMaterial({ map: clockT })); face.position.set(0, .05, .051); clock.add(face);
  const faceTop = new THREE.Mesh(new THREE.PlaneGeometry(.2, .08), new THREE.MeshBasicMaterial({ map: clockT })); faceTop.rotation.x = -Math.PI / 2; faceTop.rotation.z = Math.PI; faceTop.position.set(0, .101, 0); clock.add(faceTop);
  scene.add(clock);
  const clockL = new THREE.PointLight('#ff3030', 0, 1.2, 2); clockL.position.set(-.45, .7, -.85); scene.add(clockL);
  const hand = vhand(SKIN, BLUE, -1); hand.scale.setScalar(1.6); scene.add(hand);
  // a wall mirror (shot from inside it) and a lamp
  const W = makeChar('trab'); scene.add(W.root); W.shadowBlob.visible = false;
  const fill = new THREE.PointLight('#b8c4e8', 1.2, 4, 2); scene.add(fill);
  const CAM = {
    alarm: { p: track([[0, [.0, 2.75, -.2]], [2, [.0, 2.55, -.25]]]), l: () => [.0, .5, -.3], fov: 50, up: [0, 0, -1] },
    loop: { p: () => [.0, 2.75, -.2], l: () => [.0, .5, -.3], fov: 50, up: [0, 0, -1] },
    mirror: { p: track([[0, [.2, 1.6, 3.0]], [2, [.2, 1.6, 2.75]]]), l: () => [.2, 1.55, .6], fov: 32 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(...(C.up || [0, 1, 0])); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    const ring = id !== 'mirror' && (id === 'loop' || t < T.hit + .15);
    drawClock(t, ring ? Math.floor(t * 4) % 2 === 0 : true); clockL.intensity = ring ? 1.2 * (Math.floor(t * 4) % 2 === 0) : .3;
    hand.visible = id === 'alarm';
    if (id === 'alarm') {   // asleep under the duvet, seen from above; the hand comes out and slams the clock
      W.root.visible = true; W.frame(t < T.hit + .25 ? 'sleep' : 'tiredF'); W.root.rotation.set(-Math.PI / 2, 0, 0); W.root.position.set(.4, .6, 1.25); W.mesh.scale.x = 1;
      const a = ss(seg(t, .45, T.hit)), b = ss(seg(t, T.hit + .1, 1.6));
      hand.position.set(lerp(.05, -.42, a), lerp(.62, .66, a) - (t > T.hit - .05 && t < T.hit + .12 ? .05 : 0) + b * .05, lerp(-.75, -1.0, a)); hand.rotation.set(0, -Math.PI / 2 - .2, 0);
      clock.position.y = .5 - (t > T.hit && t < T.hit + .1 ? .015 : 0);
    } else if (id === 'loop') {
      W.root.visible = true; W.frame('sleep'); W.root.rotation.set(-Math.PI / 2, 0, 0); W.root.position.set(.4, .6, 1.25);
    } else {   // brushing his teeth at the mirror, eyes half shut
      W.root.rotation.set(0, 0, 0); W.root.visible = true; W.root.position.set(.2, 0, .6); W.frame(Math.floor(t * 6) % 2 ? 'brushF' : 'brushF1'); W.face(cam);
    }
    fill.position.set(.2, id === 'mirror' ? 1.6 : 1.9, id === 'mirror' ? 1.8 : -.1); fill.intensity = id === 'mirror' ? 1.4 : 2.4; hemi.intensity = id === 'mirror' ? .7 : 1.1;
    post.dof.focus = cam.position.distanceTo(id === 'mirror' ? new THREE.Vector3(.2, 1.55, .6) : new THREE.Vector3(-.2, .55, -.9)); post.dof.aper = id === 'mirror' ? 200 : 140; post.dof.maxCoc = 18;
    return { cold: 1, mirror: id === 'mirror' ? lt : null };
  }
  return { scene, update };
}

// ——————————————————————————— the car, stuck in traffic in the rain ———————————————————————————
export async function buildCar() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#5a6270', .045);
  const SK = sky({ top: '#4a5262', mid: '#6a7282', hor: '#8a909c', moonI: 0 }); scene.add(SK.mesh);
  scene.add(new THREE.HemisphereLight('#8a94a8', '#2a2a30', 1.2));
  const sun = new THREE.DirectionalLight('#b8c0d0', .6); sun.position.set(-4, 8, 3); scene.add(sun);
  // road with lane marks; grey buildings both sides
  const asph = new THREE.MeshStandardMaterial({ color: '#2a2c32', roughness: .35, metalness: .2 });
  scene.add(mesh(new THREE.BoxGeometry(9, .1, 80).translate(0, -.05, -36), asph));
  for (let z = 0; z > -70; z -= 3) { const l = new THREE.Mesh(new THREE.BoxGeometry(.12, .01, 1.4), new THREE.MeshBasicMaterial({ color: '#c8c8c0' })); l.position.set(1.1, .01, z); scene.add(l); }
  const bm = (c) => mat(plaster(64, 64, { seed: 3 + c.length, wall: c, beams: [] }));
  const bW = [bm(['#5a5c62', '#6c6e74', '#80828a']), bm(['#6a6458', '#7c766a', '#90897c']), bm(['#4a5260', '#5a6272', '#6c7484'])];
  for (let i = 0; i < 18; i++) for (const s of [-1, 1]) { const h = 6 + h2(i, s + 2, 4) * 9, d = 4; const b = mesh(new THREE.BoxGeometry(4, h, d).translate(0, h / 2, 0), bW[(i + (s > 0)) % 3]); b.position.set(s * 7.2, 0, -4 - i * 4.4); scene.add(b);
    for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(.5, .6), new THREE.MeshStandardMaterial({ color: '#2a3040', emissive: '#ffd890', emissiveIntensity: h2(i, k, s + 5) > .7 ? .8 : 0 })); w.position.set(s * 5.19, 2 + (k % 3) * 2.2, -4 - i * 4.4 + (k > 2 ? 1 : -1)); w.rotation.y = -s * Math.PI / 2; scene.add(w); } }
  // the queue of cars ahead: boxes with red tail lights
  const carM = [vm('#3a3e48'), vm('#6a2a2a'), vm('#c8c8cc'), vm('#22304a')];
  const tails = [];
  for (let i = 0; i < 7; i++) for (const lane of [-1.3, 2.9]) {
    const g = new THREE.Group(); g.position.set(lane + (h2(i, lane | 0, 3) - .5) * .2, 0, -4.2 - i * 5.2);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.75, .7, 4.0).translate(0, .55, 0), carM[(i + (lane > 0)) % 4]));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, .5, 2.0).translate(0, 1.15, .2), carM[(i + 1) % 4]));
    for (const x of [-.65, .65]) { const tl = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .04), new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff1a1a', emissiveIntensity: 2.5 })); tl.position.set(x, .72, 2.01); g.add(tl); tails.push(tl); }
    scene.add(g);
    if (i < 3 && lane < 0) { const L = new THREE.PointLight('#ff2020', 1.5, 4, 2); L.position.set(g.position.x, .7, g.position.z + 2.5); scene.add(L); }
  }
  // our car: dashboard, wheel, A-pillars, roof, windscreen with rain drops; the driver sits at x = -.37
  const DX = -.37, dashM = vm('#141418'), trimM = vm('#22222a');
  const car = new THREE.Group(); scene.add(car);
  car.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, .3, .7).translate(0, .85, -.95), dashM));
  car.add(new THREE.Mesh(new THREE.BoxGeometry(1.7, .06, .5).translate(0, 1.55, -.55), trimM));
  for (const x of [-.85, .85]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.07, .8, .07), trimM); p.position.set(x, 1.2, -.95); p.rotation.x = .5; car.add(p); car.add(new THREE.Mesh(new THREE.BoxGeometry(.06, .55, 1.6).translate(x, .75, .1), trimM)); }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.19, .025, 6, 20), dashM); wheel.position.set(DX, 1.0, -.58); wheel.rotation.x = -.35; car.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .05, 10), trimM); hub.rotation.x = Math.PI / 2 - .35; hub.position.set(DX, 1.0, -.58); car.add(hub);
  for (const x of [DX, .37]) { const seat = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .5).translate(x, .45, .25), vm('#1e1e26')); car.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .1).translate(x, .85, .52), vm('#1e1e26')); car.add(back); }
  const [rc, rg] = canvas(96, 48); const rainT = texOf(rc);
  const drops = Array.from({ length: 70 }, (_, i) => [h2(i, 1, 9) * 96, h2(i, 2, 9) * 48, h2(i, 3, 9)]);
  const drawRain = t => { rg.clearRect(0, 0, 96, 48); for (const [x, y, s] of drops) { const yy = (y + t * (2 + s * 6)) % 48; rg.fillStyle = 'rgba(210,225,255,.55)'; rg.fillRect(x | 0, yy | 0, 1, 1 + (s > .7)); } rainT.needsUpdate = true; };
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.75, .8), new THREE.MeshBasicMaterial({ map: rainT, transparent: true, depthWrite: false })); glass.position.set(0, 1.25, -.93); glass.rotation.x = -.5; car.add(glass);
  const wiper = new THREE.Mesh(new THREE.BoxGeometry(.6, .015, .015), dashM); car.add(wiper);
  const R = rain(900, [-6, 0, -30, 6, 10, 2], { speed: 14, len: .5, opacity: .25 }); scene.add(R);
  const W = makeChar('trab'); scene.add(W.root);
  const fill = new THREE.PointLight('#c0c8e0', 1.4, 3, 2); scene.add(fill);
  const CAM = {
    drive: { p: track([[0, [DX, 1.22, .3]], [2, [DX, 1.22, .22]]]), l: () => [DX + .1, 1.0, -8], fov: 52 },
    wheel: { p: track([[0, [-1.85, 1.15, .25]], [2, [-1.7, 1.13, .2]]]), l: () => [DX, 1.05, .05], fov: 48 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    drawRain(t); R.userData.update(t, [0, -6]);
    const wa = Math.sin(t * 3.2) * .9; wiper.position.set(DX + Math.sin(wa) * .3, 1.0 + Math.cos(wa) * .3 * .5, -.83); wiper.rotation.z = -wa - Math.PI / 2;
    tails.forEach((tl, i) => tl.material.emissiveIntensity = 2.5 + (Math.sin(t * 2 + i) > .6 ? 1.5 : 0));
    W.root.visible = id === 'wheel';
    if (id === 'wheel') { W.root.position.set(DX, .12, .15); W.frame(t > 6.7 ? 'slump1' : 'slump'); W.face(cam, true); }
    fill.position.set(DX + .5, 1.6, .3); fill.intensity = id === 'wheel' ? 1.6 : .4;
    post.dof.focus = id === 'drive' ? 6 : cam.position.distanceTo(new THREE.Vector3(DX, 1.1, .1)); post.dof.aper = id === 'drive' ? 60 : 200; post.dof.maxCoc = 16;
    return { cold: 1 };
  }
  return { scene, update };
}

// ——————————————————————————— the office: day, then night ———————————————————————————
export async function buildOffice() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1a1e26'); scene.fog = new THREE.FogExp2('#1a1e26', .03);
  const carpet = mat((() => { const P = new PX(64, 64), F = ramp(['#30343c', '#3a3e48', '#444854']); P.fill((x, y) => F(.5 + (h2(x, y, 3) - .5) * .5 + ((x + y) % 8 === 0 ? -.2 : 0), x, y)); return P.done(); })(), { rough: 1 });
  const wallM = mat(plaster(64, 64, { seed: 12, wall: ['#8a8e96', '#9a9ea6', '#aaaeb6', '#babec6'], beams: [] }));
  scene.add(mesh(new THREE.BoxGeometry(8, .2, 9).translate(0, -.1, 0), carpet));
  scene.add(mesh(new THREE.BoxGeometry(8, 3, .2).translate(0, 1.5, -3.6), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.2, 3, 9).translate(-3.6, 1.5, 0), wallM));
  // big window on the back wall: grey day → dark night
  const winM = new THREE.MeshBasicMaterial({ color: '#a8b4c8' }); const winP = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.5), winM); winP.position.set(.6, 1.75, -3.49); scene.add(winP);
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.5, .06), vm('#3a3e46')); m.position.set(-1.7 + i * .92, 1.75, -3.47); scene.add(m); }
  const ceilL = []; for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.2], [1.5, 1.2]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, .03, .3), new THREE.MeshStandardMaterial({ color: '#ddd', emissive: '#e8f0ff', emissiveIntensity: 1.2 })); p.position.set(x, 2.95, z); scene.add(p); const L = new THREE.PointLight('#e8f0ff', 2.2, 6, 1.5); L.position.set(x, 2.7, z); scene.add(L); ceilL.push([p, L]); }
  ceilL[0][1].castShadow = true;
  const hemi = new THREE.HemisphereLight('#c8d0e0', '#30343c', .9); scene.add(hemi);
  // desks in two rows, each with a monitor; his desk is the near one in the middle
  const deskM = vm('#c8c4bc'), legM = vm('#3a3a40');
  const monitors = [];
  const desk = (x, z, own = false) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, .05, .75).translate(0, .74, 0), deskM));
    for (const [a, b] of [[-.65, -.33], [.65, -.33], [-.65, .33], [.65, .33]]) g.add(new THREE.Mesh(new THREE.BoxGeometry(.04, .74, .04).translate(a, .37, b), legM));
    const panelM = new THREE.Mesh(new THREE.BoxGeometry(1.4, .4, .04).translate(0, .97, -.38), vm('#5a6070')); g.add(panelM); g.userData.panel = panelM;
    const [c, gg] = canvas(96, 60); const tx = texOf(c);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.62, .39), new THREE.MeshBasicMaterial({ map: tx })); scr.position.set(0, 1.1, -.18); g.add(scr);
    const bez = new THREE.Mesh(new THREE.BoxGeometry(.66, .43, .03), vm('#101014')); bez.position.set(0, 1.1, -.2); g.add(bez);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .02, .13).translate(0, .775, .1), vm('#202024')));
    if (!own) { gg.fillStyle = '#2a4a8a'; gg.fillRect(0, 0, 96, 60); for (let i = 0; i < 6; i++) { gg.fillStyle = '#c8d8f0'; gg.fillRect(8, 8 + i * 8, 40 + (i * 13) % 40, 3); } tx.needsUpdate = true; }
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    scene.add(g); monitors.push({ scr, own, c, gg, tx }); return { g, c, gg, tx, scr };
  };
  for (const x of [-2.2, 2.2]) desk(x, -1.6); desk(-2.2, .6);
  const my = desk(0, .6, true);
  const chair = new THREE.Group(); chair.position.set(0, 0, 1.35); chair.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .07, .5).translate(0, .48, 0), vm('#16161c')), new THREE.Mesh(new THREE.BoxGeometry(.5, .6, .06).translate(0, .82, .25), vm('#16161c'))); scene.add(chair);
  // paper stacks that grow on his desk
  const stacks = [[-.48, .05], [-.32, .2], [.42, .12]].map(([x, z], i) => { const s = new THREE.Mesh(new THREE.BoxGeometry(.21, 1, .29).translate(0, .5, 0), vm(i % 2 ? '#f0ece0' : '#e4e0d4')); s.position.set(x, .765, .6 + z); s.castShadow = true; scene.add(s); return s; });
  const monL = new THREE.PointLight('#8ab0ff', 1.2, 3, 1.6); monL.position.set(0, 1.15, .9); scene.add(monL);
  function drawMine(t) {
    const g = my.gg; g.fillStyle = '#e8ecf2'; g.fillRect(0, 0, 96, 60); g.fillStyle = '#2a4a8a'; g.fillRect(0, 0, 96, 9); ptext(g, 'CAIXA DE ENTRADA', 3, 1, 'bold 6px monospace', '#ffffff');
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#dde2ea' : '#f4f6f9'; g.fillRect(0, 10 + i * 8, 96, 8); g.fillStyle = '#3a4050'; g.fillRect(3, 12 + i * 8, 22, 2); g.fillRect(30, 12 + i * 8, 40 + (i * 9) % 20, 2); }
    g.fillStyle = '#1a1e28'; g.fillRect(0, 52, 96, 8); ptext(g, '18:00', 93, 52, 'bold 7px monospace', '#ffd84a', 'right');
    if (t > T.urgent) { const on = Math.floor((t - T.urgent) * 5) % 2 === 0 || t > T.urgent + 1; g.fillStyle = '#0a0a10'; g.fillRect(14, 17, 70, 26); g.fillStyle = on ? '#e02a2a' : '#901a1a'; g.fillRect(12, 15, 70, 26); ptext(g, 'URGENTE!', 47, 18, 'bold 11px monospace', '#ffffff', 'center'); ptext(g, 'PARA ONTEM', 47, 31, 'bold 7px monospace', '#ffd0d0', 'center'); }
    harden(g, 96, 60); my.tx.needsUpdate = true;
  }
  const W = makeChar('trab'), B = makeChar('chefe'); scene.add(W.root, B.root); B.mesh.material.color.set('#3a3a46');
  const fill = new THREE.PointLight('#d8e0f0', 1.2, 4, 2); scene.add(fill);
  const CAM = {
    boss: { p: track([[0, [-2.1, 1.6, 4.9]], [2, [-1.95, 1.58, 4.6]]]), l: () => [-.1, 1.0, 1.0], fov: 38 },
    papers: { p: track([[0, [.5, .7, -.6]], [2, [.48, .72, -.5]]]), l: () => [.05, 1.35, 1.3], fov: 54 },
    screen: { p: track([[0, [0, 1.11, 1.55]], [2, [0, 1.11, 1.4]]]), l: () => [0, 1.1, .42], fov: 36 },
    night: { p: track([[0, [2.6, 2.3, 4.2]], [2.5, [2.3, 2.1, 3.8]]]), l: () => [0, .9, .7], fov: 44 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    const night = id === 'night';
    winM.color.set(night ? '#0e1426' : id === 'screen' ? '#c87a4a' : '#a8b4c8');
    for (const [p, L] of ceilL) { p.material.emissiveIntensity = night ? 0 : 1.2; L.intensity = night ? 0 : 2.2; }
    hemi.intensity = night ? .12 : .9; monL.intensity = night ? 2.2 : 1.0;
    drawMine(id === 'screen' || night ? t : 0);
    // the stacks grow through the afternoon
    const k = id === 'boss' ? .05 : id === 'papers' ? .05 + .35 * ss(seg(t, 10.1, 11.8)) : .4;
    stacks.forEach((s, i) => s.scale.y = Math.max(.01, k * (1 - i * .2)));
    W.root.visible = id !== 'screen'; B.root.visible = id === 'boss'; my.g.userData.panel.visible = id !== 'papers';
    W.root.position.set(0, .1, 1.3);
    if (id === 'boss') { W.frame(t < 8.6 ? 'type0' : 'sitSadF'); W.face(cam, t < 8.6); B.root.position.set(-1.3, 0, 3.15); B.frame(t < 8.35 ? 'idle0' : 'point'); B.face(cam, false); }
    else if (id === 'papers') { W.frame(Math.floor(t * 1.2) % 3 ? 'sitSadF' : 'sitSadF1'); W.face(cam); }
    else if (night) { W.frame(Math.floor(t * 3) % 2 ? 'type0' : 'type1'); W.face(cam, true); }
    fill.position.copy(W.root.position).add(new THREE.Vector3(.4, 1.5, 1.4)); fill.intensity = night ? .25 : 1.2;
    if (id === 'boss') { fill.intensity = .9; }
    const focus = id === 'screen' ? new THREE.Vector3(0, 1.1, .42) : W.root.position.clone().setY(1.0);
    post.dof.focus = cam.position.distanceTo(focus); post.dof.aper = id === 'screen' ? 80 : 200; post.dof.maxCoc = 18;
    if (id === 'screen') { post.bloom.threshold = .96; post.bloom.strength = .3; }
    return { cold: 1, low: night ? 1 : 0 };
  }
  return { scene, update };
}
