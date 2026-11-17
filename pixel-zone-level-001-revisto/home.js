// Set — the founder's room at night: desk with the computer and the Pixel Zone plans, the bed, the window, the clock,
// the phone with the empty balance, the savings jar. Scenes 2 (flashback), 4 (no money), 5 (saving) and the callback.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, clamp, lerp } from '/core/lib.js';

const BZ = -1.6, RW = 1.9, WH = 2.6;
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
// crisp pixel text: draw then threshold the alpha
function ptext(g, txt, x, y, font, col, align = 'left') { g.save(); g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'top'; g.fillText(txt, x, y); g.restore(); }
function harden(g, w, h) { const d = g.getImageData(0, 0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0; g.putImageData(d, 0, 0); }

export async function buildHome() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#05060c'); scene.fog = new THREE.FogExp2('#06070e', .03);
  const floorM = mat(woodPlanks(64, 64, { pw: 6, len: 40, seed: 5, cols: ['#1c140e', '#2a1e14', '#3a2a1c', '#4a3624'] }), { rough: .7 });
  const wallM = mat(plaster(64, 64, { seed: 9, wall: ['#161a26', '#1c2030', '#232838', '#2a3042'], beams: [] }));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, .2, 4.4).translate(0, -.1, .4), floorM));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, WH, .2).translate(0, WH / 2, BZ - .1), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.2, WH, 4.4).translate(-RW - .1, WH / 2, .4), wallM));
  scene.add(mesh(new THREE.BoxGeometry(.2, WH, 4.4).translate(RW + .1, WH / 2, .4), wallM));
  // window with the town at night
  const [wc, wg] = canvas(48, 40); wg.fillStyle = '#0a1230'; wg.fillRect(0, 0, 48, 40); for (let i = 0; i < 40; i++) { wg.fillStyle = '#e8eeff'; if (h2(i, 3, 1) > .8) wg.fillRect((h2(i, 1, 1) * 48) | 0, (h2(i, 2, 1) * 14) | 0, 1, 1); }
  for (let b = 0; b < 7; b++) { const x = b * 7, hh = 10 + (h2(b, 5, 2) * 14 | 0); wg.fillStyle = '#05070f'; wg.fillRect(x, 40 - hh, 7, hh); for (let j = 0; j < 6; j++) if (h2(b, j, 7) > .6) { wg.fillStyle = '#ffc870'; wg.fillRect(x + 1 + (j % 2) * 3, 40 - hh + 2 + (j >> 1) * 3, 2, 1); } }
  wg.fillStyle = '#f4f0dc'; wg.fillRect(36, 5, 4, 4);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .85), new THREE.MeshBasicMaterial({ map: texOf(wc) })); win.position.set(.75, 1.65, BZ + .01); scene.add(win);
  const wf = new THREE.MeshStandardMaterial({ color: '#2a2a32' }); for (const [w, h, x, y] of [[1.08, .05, .75, 2.1], [1.08, .05, .75, 1.2], [.05, .9, .23, 1.65], [.05, .9, 1.27, 1.65], [.03, .85, .75, 1.65]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .05), wf); b.position.set(x, y, BZ + .03); scene.add(b); }
  const moon = new THREE.DirectionalLight('#6a84d8', .6); moon.position.set(1.5, 3, -4); moon.target.position.set(.6, 0, .6); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); scene.add(moon, moon.target);
  const hemi = new THREE.HemisphereLight('#2a3260', '#0a0a10', .5); scene.add(hemi);
  // wall clock (ticking)
  const [cc, cg] = canvas(32, 32); const clockT = texOf(cc);
  const drawClock = t => { cg.clearRect(0, 0, 32, 32); cg.fillStyle = '#16161c'; cg.beginPath(); cg.arc(16, 16, 16, 0, 7); cg.fill(); cg.fillStyle = '#d8d4c8'; cg.beginPath(); cg.arc(16, 16, 13, 0, 7); cg.fill(); cg.fillStyle = '#222';
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; cg.fillRect(Math.round(16 + Math.sin(a) * 11), Math.round(16 - Math.cos(a) * 11), 1, 1); }
    const hand = (a, l, w, c) => { cg.strokeStyle = c; cg.lineWidth = w; cg.beginPath(); cg.moveTo(16, 16); cg.lineTo(16 + Math.sin(a) * l, 16 - Math.cos(a) * l); cg.stroke(); };
    hand(-.5, 6, 2, '#111'); hand(6.0, 9, 1.5, '#111'); hand(Math.floor(t) / 60 * 6.283, 11, 1, '#c0302a'); clockT.needsUpdate = true; };
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), new THREE.MeshStandardMaterial({ map: clockT, transparent: true })); clock.position.set(-.35, 2.05, BZ + .02); scene.add(clock);
  // desk with the computer (left, against the back wall)
  const deskM = mat(woodPlanks(32, 32, { pw: 32, len: 64, seed: 13, nails: false, cols: ['#2a1c12', '#3a2818', '#4e3620', '#62462c'] }));
  const desk = new THREE.Group(); desk.position.set(-1.15, 0, BZ + .45);
  const top = box(1.3, .05, .7, deskM); top.position.y = .74; desk.add(top);
  for (const [x, z] of [[-.6, -.3], [.6, -.3], [-.6, .3], [.6, .3]]) { const l = box(.05, .74, .05, deskM); l.position.set(x, 0, z); desk.add(l); }
  const [mc, mg] = canvas(96, 60); const monT = texOf(mc);
  const mon = new THREE.Mesh(new THREE.PlaneGeometry(.78, .49), new THREE.MeshBasicMaterial({ map: monT })); mon.position.set(0, 1.12, -.22); desk.add(mon);
  const bez = new THREE.Mesh(new THREE.BoxGeometry(.84, .55, .03), new THREE.MeshStandardMaterial({ color: '#0c0c10' })); bez.position.set(0, 1.12, -.24); desk.add(bez);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .06), new THREE.MeshStandardMaterial({ color: '#0c0c10' })); stand.position.set(0, .9, -.25); desk.add(stand);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(.45, .02, .14), new THREE.MeshStandardMaterial({ color: '#16161c' })); kb.position.set(0, .775, .05); desk.add(kb);
  // the savings jar
  const [jc, jg] = canvas(32, 16); jg.fillStyle = '#e8dcc0'; jg.fillRect(0, 0, 32, 16); ptext(jg, 'PIXEL', 16, 1, 'bold 7px monospace', '#3a1a6a', 'center'); ptext(jg, 'ZONE', 16, 8, 'bold 7px monospace', '#c0207a', 'center');
  const jar = new THREE.Group(); jar.position.set(.48, .765, .05);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .24, 18, 1, true).translate(0, .12, 0), new THREE.MeshStandardMaterial({ color: '#cfe8f0', transparent: true, opacity: .35, roughness: .1, side: THREE.DoubleSide, depthWrite: false })); jar.add(glass);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .03, 18).translate(0, .25, 0), new THREE.MeshStandardMaterial({ color: '#8a6a2a', metalness: .6, roughness: .4 })); jar.add(lid);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(.092, .092, .08, 18, 1, true, -Math.PI * .4, Math.PI * .8).translate(0, .1, 0), new THREE.MeshStandardMaterial({ map: texOf(jc) })); jar.add(label);
  const fillM = new THREE.MeshStandardMaterial({ color: '#8aa870', roughness: .8 }); const fillJ = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, 1, 16).translate(0, .5, 0), fillM); jar.add(fillJ);
  const coins = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(.018, .018, .005, 10) : new THREE.BoxGeometry(.07, .003, .035), new THREE.MeshStandardMaterial({ color: i % 2 ? '#d8b040' : '#7aa86a', metalness: i % 2 ? .8 : 0, roughness: .35 })); jar.add(c); coins.push(c); }
  desk.add(jar);
  const lampL = new THREE.PointLight('#ffc884', 0, 3, 1.6); lampL.position.set(-.45, 1.25, .15); desk.add(lampL);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(.08, .1, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1a1a', emissive: '#ffd890', emissiveIntensity: 1.2, side: THREE.DoubleSide })); lampHead.position.set(-.5, 1.18, -.1); lampHead.rotation.z = .5; desk.add(lampHead);
  scene.add(desk);
  const monL = new THREE.PointLight('#7ac8ff', 1.6, 3, 1.6); monL.position.set(-1.15, 1.1, BZ + .6); scene.add(monL);
  const chair = new THREE.Group(); chair.position.set(-1.15, 0, BZ + 1.15); { const m = new THREE.MeshStandardMaterial({ color: '#16161c' }); const seat = new THREE.Mesh(new THREE.BoxGeometry(.45, .06, .45).translate(0, .46, 0), m); const bk = new THREE.Mesh(new THREE.BoxGeometry(.45, .5, .05).translate(0, .75, .2), m); const st = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .46).translate(0, .23, 0), m); chair.add(seat, bk, st); } scene.add(chair);
  // bed (right)
  const bedM = new THREE.MeshStandardMaterial({ color: '#2a3048', roughness: .9 }), sheetM = new THREE.MeshStandardMaterial({ color: '#8a90a8', roughness: .9 });
  const bed = new THREE.Group(); bed.position.set(1.15, 0, .2);
  const frame = box(1.05, .32, 2.0, deskM); bed.add(frame); const matt = box(1.0, .16, 1.95, sheetM); matt.position.y = .32; bed.add(matt);
  const duvet = box(1.02, .08, 1.3, bedM); duvet.position.set(0, .48, .32); bed.add(duvet); const pil = box(.7, .1, .35, sheetM); pil.position.set(0, .48, -.75); bed.add(pil);
  scene.add(bed);
  // the phone (a real object: it is the subject of the close-up)
  const [pc, pg] = canvas(72, 144); const phoneT = texOf(pc);
  const phone = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(.075, .15, .008), new THREE.MeshStandardMaterial({ color: '#0e0e12', roughness: .3, metalness: .4 })); phone.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.068, .14), new THREE.MeshBasicMaterial({ map: phoneT })); scr.position.z = .0045; phone.add(scr);
  scene.add(phone);
  const phoneL = new THREE.PointLight('#6aa8ff', 0, 2.2, 1.6); scene.add(phoneL);
  function drawPhone(t, k) {   // a made-up banking app: SALDO DISPONÍVEL 0,00 €
    pg.fillStyle = '#0b1020'; pg.fillRect(0, 0, 72, 144);
    pg.fillStyle = '#16203a'; pg.fillRect(0, 0, 72, 22); ptext(pg, '23:47', 4, 3, '7px monospace', '#9aa8c8'); pg.fillStyle = '#6aa8ff'; pg.fillRect(58, 4, 9, 5);
    ptext(pg, 'A MINHA CONTA', 36, 12, 'bold 7px monospace', '#c8d4f0', 'center');
    ptext(pg, 'SALDO', 36, 34, 'bold 8px monospace', '#8a9ac0', 'center'); ptext(pg, 'DISPONÍVEL', 36, 44, 'bold 8px monospace', '#8a9ac0', 'center');
    const blink = k > .3 ? 1 : Math.floor(t * 4) % 2;
    if (blink) ptext(pg, '0,00 €', 36, 60, 'bold 17px monospace', '#ff5a5a', 'center');
    pg.fillStyle = '#26304a'; pg.fillRect(6, 88, 60, 1);
    for (let i = 0; i < 4; i++) { pg.fillStyle = '#1a2440'; pg.fillRect(6, 94 + i * 11, 60, 8); pg.fillStyle = '#4a5a80'; pg.fillRect(9, 97 + i * 11, 24, 2); pg.fillStyle = '#c05050'; pg.fillRect(52, 97 + i * 11, 11, 2); }
    harden(pg, 72, 144); phoneT.needsUpdate = true;
  }
  // the plans on the monitor: the room drawn line by line, three stations, bags, the cloud, PIXEL ZONE
  function drawMon(t, k) {
    mg.fillStyle = '#0a0f1e'; mg.fillRect(0, 0, 96, 60); mg.fillStyle = '#16203a'; mg.fillRect(0, 0, 96, 7); ptext(mg, 'pixel_zone_plano.png', 3, 0, '6px monospace', '#8aa0d0');
    mg.strokeStyle = '#2a3a60'; for (let x = 4; x < 92; x += 6) { mg.fillStyle = '#121a30'; mg.fillRect(x, 9, 1, 48); }
    const P = (x, y, w, h, c) => { mg.fillStyle = c; mg.fillRect(x, y, w, h); };
    const s = clamp(k);
    P(8, 12, Math.round(78 * clamp(s * 3)), 1, '#9fe8ff'); P(8, 12, 1, Math.round(42 * clamp(s * 3 - .3)), '#9fe8ff'); P(85, 12, 1, Math.round(42 * clamp(s * 3 - .6)), '#9fe8ff'); P(8, 54, Math.round(78 * clamp(s * 3 - .9)), 1, '#9fe8ff');
    if (s > .4) { P(14, 15, 14, 3, '#5ff3ff'); P(40, 15, 14, 3, '#5ff3ff'); P(66, 15, 14, 3, '#5ff3ff'); }
    if (s > .55) for (const [x, y, c] of [[18, 26, '#3a6aff'], [30, 26, '#ff4a4a'], [46, 26, '#ff4a4a'], [58, 26, '#3a6aff'], [24, 36, '#3a6aff'], [52, 36, '#3a6aff']]) P(x, y, 5, 4, c);
    if (s > .7) { P(9, 13, 76, 1, '#ff2fb4'); P(30, 40, 26, 8, '#cfefff'); P(32, 42, 22, 4, '#7ad8ff'); }
    if (s > .85) ptext(mg, 'PIXEL ZONE', 48, 47, 'bold 7px monospace', '#ff9ae0', 'center');
    if (Math.floor(t * 3) % 2) P(8 + Math.round(78 * clamp(s * 1.2)), 50, 1, 4, '#ffffff');
    harden(mg, 96, 60); monT.needsUpdate = true;
  }
  const F = makeChar('founder'); scene.add(F.root);
  const fill = new THREE.PointLight('#a8b8f0', .8, 4, 2); scene.add(fill);
  const PH = new THREE.Vector3(1.0, .93, .78);   // phone held in front of him (bed edge)
  const CAM = {
    flash: { p: track([[0, [.55, 1.6, 1.75]], [4, [.3, 1.52, 1.4]]]), l: track([[0, [-1.15, 1.05, -1.2]], [4, [-1.15, 1.08, -1.2]]]), fov: 38 },
    cbIdea: { p: track([[0, [.15, 1.5, 1.15]], [1.6, [.05, 1.48, 1.0]]]), l: track([[0, [-1.15, 1.06, -1.2]], [1.6, [-1.15, 1.08, -1.2]]]), fov: 38 },
    night: { p: track([[0, [-1.0, 1.6, 3.6]], [2.67, [-.8, 1.5, 3.2]]]), l: track([[0, [.8, .8, .3]], [2.67, [.85, .8, .35]]]), fov: 40 },
    phone: { p: track([[0, [1.0, 1.06, 1.18]], [3.33, [1.0, 1.0, 1.05]]]), l: track([[0, [1.0, .93, .78]], [3.33, [1.0, .93, .78]]]), fov: 30 },
    face: { p: track([[0, [1.0, 1.25, 4.4]], [3.33, [1.0, 1.2, 4.0]]]), l: track([[0, [1.0, 1.0, .55]], [3.33, [1.0, 1.0, .55]]]), fov: 30 },
    save: { p: track([[0, [-.55, 1.0, -.25]], [1.33, [-.6, .98, -.35]]]), l: track([[0, [-.67, .86, -1.1]], [1.33, [-.67, .86, -1.1]]]), fov: 34 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    drawClock(t);
    const atDesk = id === 'flash' || id === 'cbIdea';
    // the plans draw themselves over the flashback
    drawMon(t, atDesk ? (id === 'flash' ? seg(t, 24.2, 27.6) : 1) : 1);
    F.root.visible = id !== 'save' && id !== 'phone';
    if (atDesk) { F.root.position.set(-1.15, .05, BZ + 1.05); F.frame(Math.floor(t * 5) % 2 ? 'type1' : 'type0'); F.face(cam, true); }
    else { F.root.position.set(1.0, .2, .55); F.frame(id === 'face' ? (Math.floor(lt * .9) % 3 === 2 ? 'sadSit1' : 'sadSit') : Math.floor(t * .8) % 4 === 0 ? 'phone1' : 'phone0'); F.face(cam, id === 'night'); }
    // phone object
    phone.visible = id === 'phone'; phone.position.copy(PH); phone.lookAt(cam.position);
    drawPhone(t, seg(t, 46.2, 46.8));
    const night = id === 'night' || id === 'phone' || id === 'face';
    phoneL.intensity = night ? 2.6 : 0; phoneL.position.set(1.0, .9, id === 'face' ? 1.0 : .8);
    monL.intensity = atDesk ? 2.4 : night ? .25 : .5;
    lampL.intensity = atDesk ? 1.4 : id === 'save' ? 2.2 : 0; lampHead.material.emissiveIntensity = lampL.intensity > 0 ? 1.2 : 0;
    moon.intensity = night ? .55 : .3; hemi.intensity = night ? .35 : .5;
    fill.position.copy(F.root.position).add(new THREE.Vector3(.3, 1.4, 1.2)); fill.intensity = id === 'face' ? .3 : .8;
    // the jar: coins and notes drop in on the beat
    const fillK = id === 'save' ? .03 + .05 * ss(seg(t, 54.8, 55.9)) : .1;
    fillJ.scale.y = fillK; fillJ.visible = id === 'save' || atDesk;
    coins.forEach((c, i) => { const t0 = 54.75 + i * .2, k = seg(t, t0, t0 + .35); c.visible = id === 'save' && k > 0; c.position.set((h2(i, 1, 4) - .5) * .06, .5 - .45 * k * k + (k >= 1 ? .0 : 0), (h2(i, 2, 4) - .5) * .06); if (k >= 1) c.position.y = fillK + .01 + i * .003; c.rotation.set(t * 4 + i, i, t * 3); });
    const focus = id === 'phone' ? PH : id === 'save' ? new THREE.Vector3(-.67, .9, -1.1) : atDesk ? new THREE.Vector3(-1.15, 1.1, BZ + .25) : F.root.position.clone().setY(.95);
    post.dof.focus = cam.position.distanceTo(focus); post.dof.aper = id === 'phone' ? 120 : 260; post.dof.maxCoc = 18;
    post.bloom.strength = id === 'phone' ? .5 : .6; post.bloom.threshold = .8;
    if (id === 'flash' || id === 'cbIdea') { post.vig.uniforms.sat.value = .75; post.vig.uniforms.warm.value = .18; post.vig.uniforms.amt.value = .9; }
    return {};
  }
  return { scene, update };
}
