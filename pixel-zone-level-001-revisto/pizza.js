// Set — the pizzeria at night (a generic place, no real name): wood-fired oven, the pass, checked tablecloths,
// customers, the founder as a waiter. Scene 5 (montage) and the callback "E muito trabalho".
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, clamp, lerp } from '/core/lib.js';

const BZ = -3.0, RW = 3.0, WH = 2.9;
function tiles(n) { const P = new PX(n, n), A = ramp(['#5a2a1a', '#7a3a22', '#9a4c2c', '#b0603a']); P.fill((x, y) => { const g = (x & 7) === 0 || (y & 7) === 0; return A(g ? .1 : .45 + (h2(x >> 3, y >> 3, 6) - .5) * .5, x, y); }); return P.done(); }
function bricks(n, seed) { const P = new PX(n, n), F = ramp(['#4a1a12', '#6a2a1a', '#8a3a24', '#a64c30']); P.fill((x, y) => { const row = y >> 2, off = (row % 2) * 4, m = (y & 3) === 3 || ((x + off) & 7) === 7; return m ? hex('#c8b8a0') : F(.4 + (h2((x + off) >> 3, row, seed) - .5) * .6, x, y); }); return P.done(); }
function checkCloth() { const P = new PX(16, 16); P.fill((x, y) => (((x >> 2) + (y >> 2)) % 2) ? hex('#c8282a') : hex('#f0e8dc')); return P.done(); }

export async function buildPizza() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0a0606'); scene.fog = new THREE.FogExp2('#1a0e08', .03);
  const floorM = mat(tiles(64), { rough: .6 });
  const wallM = mat(plaster(64, 64, { seed: 33, wall: ['#a8906a', '#bca47c', '#ccb68e', '#dac69e'], beams: [] }));
  const brickM = mat(bricks(64, 4));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, .2, 6.6).translate(0, -.1, 0), floorM));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, WH - 1.0, .2).translate(0, 1.0 + (WH - 1.0) / 2, BZ - .1), wallM));
  scene.add(mesh(new THREE.BoxGeometry(RW * 2 + .4, 1.0, .2).translate(0, .5, BZ - .1), brickM));
  for (const s of [-1, 1]) { scene.add(mesh(new THREE.BoxGeometry(.2, WH - 1.0, 6.6).translate(s * (RW + .1), 1.0 + (WH - 1.0) / 2, 0), wallM)); scene.add(mesh(new THREE.BoxGeometry(.2, 1.0, 6.6).translate(s * (RW + .1), .5, 0), brickM)); }
  // the wood-fired oven: brick dome, glowing mouth, fire
  const oven = new THREE.Group(); oven.position.set(1.6, 0, BZ + .75);
  const base = mesh(new THREE.BoxGeometry(1.5, .9, 1.2).translate(0, .45, 0), brickM); oven.add(base);
  const dome = mesh(new THREE.SphereGeometry(.78, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .85, .8).translate(0, .9, 0), brickM); oven.add(dome);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(.28, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#ff8a2a' })); mouth.position.set(0, .92, .63); oven.add(mouth);
  const chim = mesh(new THREE.BoxGeometry(.25, 1.2, .25).translate(0, 2.0, -.3), brickM); oven.add(chim);
  scene.add(oven);
  const fireL = new THREE.PointLight('#ff8a3a', 4, 6, 1.5); fireL.position.set(1.6, 1.1, BZ + 1.6); fireL.castShadow = true; fireL.shadow.mapSize.set(512, 512); fireL.shadow.bias = -.004; scene.add(fireL);
  const fireG = glow('#ffa040', 1.6, .9); fireG.position.set(1.6, 1.0, BZ + 1.42); scene.add(fireG);
  const fire = particles(60, (i, t, o) => { const k = (t * 1.3 + h2(i, 1, 3)) % 1; o.x = 1.6 + (h2(i, 2, 3) - .5) * .4 * (1 - k); o.y = .95 + k * .3; o.z = BZ + 1.35; o.a = (1 - k); o.s = .03; o.r = 1; o.g = .5 + (1 - k) * .4; o.b = .1; }, { soft: 0 }); scene.add(fire);
  // the pass (counter) with pizzas, a bell; chalk menu board
  const woodM = mat(woodPlanks(32, 32, { pw: 32, len: 64, seed: 17, nails: false, cols: ['#3a2414', '#523420', '#6a462a', '#82583a'] }));
  const pass = mesh(new THREE.BoxGeometry(2.6, 1.0, .55).translate(.3, .5, BZ + 1.95), woodM); scene.add(pass);
  const passTop = box(2.7, .05, .62, new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: .4 })); passTop.position.set(.3, 1.0, BZ + 1.95); scene.add(passTop);
  const pizzaM = new THREE.MeshStandardMaterial({ map: texOf((() => { const P = new PX(16, 16); P.fill((x, y) => { const r = Math.hypot(x - 7.5, y - 7.5); if (r > 7.5) return null; if (r > 6.2) return hex('#b8702e'); if (h2(x >> 1, y >> 1, 4) > .82) return hex('#b02a24'); return hex(h2(x, y, 2) > .7 ? '#f6d070' : '#f0b848'); }); return P.done(); })()), transparent: true, alphaTest: .5 });
  for (const x of [-.4, .4, 1.1]) { const p = new THREE.Mesh(new THREE.CircleGeometry(.17, 16), pizzaM); p.rotation.x = -Math.PI / 2; p.position.set(x, 1.03, BZ + 1.95); scene.add(p); }
  const board = (() => { const c = document.createElement('canvas'); c.width = 48; c.height = 36; const g = c.getContext('2d'); g.fillStyle = '#1a1e1a'; g.fillRect(0, 0, 48, 36); g.fillStyle = '#e8e4d8'; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText('PIZZAS', 24, 9); g.fillStyle = '#b8b4a8'; for (let i = 0; i < 5; i++) { g.fillRect(5, 14 + i * 4, 24 - (i % 2) * 6, 1); g.fillRect(38, 14 + i * 4, 6, 1); } return texOf(c); })();
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .82), new THREE.MeshStandardMaterial({ map: board, roughness: .9 })); menu.position.set(-1.4, 1.9, BZ + .01); scene.add(menu);
  const menuF = new THREE.Mesh(new THREE.BoxGeometry(1.18, .9, .03), woodM); menuF.position.set(-1.4, 1.9, BZ); scene.add(menuF);
  // tables with checked cloths, chairs, customers
  const clothM = new THREE.MeshStandardMaterial({ map: texOf(checkCloth()), roughness: .9 });
  const TABLES = [[-1.9, -.7], [.1, .5], [-1.5, 1.8], [2.0, 1.4]];
  const cast = []; const KINDS = ['p1', 'p2', 'p3', 'client', 'p4', 'p5'];
  TABLES.forEach(([x, z], i) => {
    const tb = new THREE.Group(); tb.position.set(x, 0, z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(.85, .04, .85).translate(0, .74, 0), clothM); top.castShadow = top.receiveShadow = true; tb.add(top);
    const drape = new THREE.Mesh(new THREE.BoxGeometry(.9, .22, .9).translate(0, .64, 0), clothM); tb.add(drape);
    const leg = box(.08, .62, .08, woodM); tb.add(leg);
    const p = new THREE.Mesh(new THREE.CircleGeometry(.15, 14), pizzaM); p.rotation.x = -Math.PI / 2; p.position.set(.12, .765, 0); tb.add(p);
    const candle = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffcc6a' })); candle.position.set(-.25, .8, -.2); tb.add(candle);
    scene.add(tb);
    for (const s of [-1, 1]) { const ch = box(.38, .45, .38, woodM); ch.position.set(x + s * .62, 0, z); scene.add(ch); const bk = box(.05, .5, .38, woodM); bk.position.set(x + s * .8, .45, z); scene.add(bk); }
    if (i !== 1) { const c = makeChar(KINDS[i % KINDS.length]); scene.add(c.root); cast.push({ c, x: x - .62, z, flip: false }); if (i === 0 || i === 3) { const c2 = makeChar(KINDS[(i + 3) % KINDS.length]); scene.add(c2.root); cast.push({ c: c2, x: x + .62, z, flip: true }); } }
    else { const c = makeChar('p5'); scene.add(c.root); cast.push({ c, x: x + .62, z, flip: true }); }
  });
  // warm pendants
  const lamps = [];
  for (const [x, z] of [[-1.9, -.7], [.1, .5], [-1.5, 1.8], [2.0, 1.4]]) { const sh = new THREE.Mesh(new THREE.ConeGeometry(.2, .18, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#2a1a10', emissive: '#ffb860', emissiveIntensity: 1.4, side: THREE.DoubleSide })); sh.position.set(x, 2.2, z); scene.add(sh);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, WH - 2.2), new THREE.MeshBasicMaterial({ color: '#111' })); cord.position.set(x, (WH + 2.2) / 2, z); scene.add(cord);
    const L = new THREE.PointLight('#ffb468', 2.6, 4, 1.6); L.position.set(x, 2.0, z); scene.add(L); lamps.push(L); }
  lamps[1].castShadow = true; lamps[1].shadow.mapSize.set(512, 512); lamps[1].shadow.bias = -.004;
  const hemi = new THREE.HemisphereLight('#8a6a4a', '#1a0e08', .7); scene.add(hemi);
  const F = makeChar('founderW'); scene.add(F.root);
  const fill = new THREE.PointLight('#ffd8b0', 1.2, 4, 2); scene.add(fill);
  const CAM = {
    pizza1: { p: track([[0, [1.4, 1.7, 5.4]], [2.67, [-.4, 1.6, 5.3]]]), l: track([[0, [1.2, 1.0, .9]], [2.67, [-.6, 1.0, .9]]]), fov: 36 },
    cbWork: { p: track([[0, [1.2, 1.7, 5.4]], [1.6, [.2, 1.6, 5.3]]]), l: track([[0, [1.0, 1.0, .9]], [1.6, [0, 1.0, .9]]]), fov: 36 },
    pizza2: { p: track([[0, [-1.2, 1.55, 4.6]], [1.33, [-1.05, 1.5, 4.3]]]), l: track([[0, [.2, .95, .9]], [1.33, [.2, .95, .9]]]), fov: 34 },
    pizza3: { p: track([[0, [-1.0, 1.5, 1.0]], [1.33, [-.85, 1.45, .8]]]), l: track([[0, [1.2, 1.15, -1.3]], [1.33, [1.2, 1.15, -1.3]]]), fov: 36 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    for (const q of cast) { q.c.root.position.set(q.x, .12, q.z); q.c.frame(Math.floor(t * .9 + q.x) % 3 === 0 ? 'smile' : 'sitSide'); q.c.face(cam, q.flip); }
    if (id === 'pizza1' || id === 'cbWork') {   // carrying a pizza across the room, right to left
      const x = lerp(1.9, -.9, seg(lt, 0, id === 'cbWork' ? 1.6 : 2.67)); F.root.position.set(x, 0, .95); F.frame(['tray0', 'tray1', 'tray2', 'tray3'][Math.floor(t * 7) % 4]); F.face(cam, true);
    } else if (id === 'pizza2') { F.root.position.set(.05, 0, 1.35); F.frame(Math.floor(t * 3) % 2 ? 'plates1' : 'plates0'); F.face(cam, true); }
    else { F.root.position.set(1.0, 0, -.55); F.frame(lt < .6 ? 'reach' : 'trayStand'); F.face(cam, true); }
    const f = flick(t * 2, 3); fireL.intensity = 3.6 + 1.4 * f; fireG.material.opacity = .7 + .3 * f; mouth.material.color.set('#ff8a2a').multiplyScalar(.85 + .3 * f);
    fire.userData.update(t);
    fill.position.copy(F.root.position).add(new THREE.Vector3(.3, 1.5, 1.4));
    post.dof.focus = cam.position.distanceTo(F.root.position.clone().setY(1.0)); post.dof.aper = 260; post.dof.maxCoc = 18;
    post.bloom.strength = .55; post.bloom.threshold = .8; post.vig.uniforms.warm.value = .14;
    return { tilt: 10 };
  }
  return { scene, update };
}
