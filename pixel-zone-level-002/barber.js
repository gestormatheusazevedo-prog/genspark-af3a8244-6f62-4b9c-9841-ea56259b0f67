// Set 2 — Barbearia Barba Negra at night: warm and empty, chairs and mirrors; at the back a narrow corridor
// ends in a door that leaks cyan (left edge) and magenta (right edge) light. Scenes 3, 4, 5 and 9.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, woodPlanks, plaster, texOf, glow, blob } from './px.js';
import { mat, mesh, box } from './kit.js';
import { particles, beamCard, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, eio, clamp, lerp } from '/core/lib.js';
import { T } from './story.js';

const CYAN = '#2fe6ff', MAG = '#ff2fb4';
const W2 = 2.5, BZ = -4.0, CZ = -9.0, CW = .62, WH = 2.7;   // shop half-width, back wall z, corridor door z, corridor half-width, wall height

function checker(n) { const P = new PX(n, n), A = ramp(['#0c0c10', '#18181e', '#24242c']), B = ramp(['#b8b2a4', '#d6d0c2', '#ece6d8']); P.fill((x, y) => { const k = ((x >> 3) + (y >> 3)) % 2, v = .5 + (h2(x >> 3, y >> 3, 4) - .5) * .4 + ((x & 7) === 0 || (y & 7) === 0 ? -.35 : 0); return (k ? A : B)(v, x, y); }); return P.done(); }
function leather() { const P = new PX(16, 16), L = ramp(['#060608', '#101014', '#1c1c22', '#2e2e38']); P.fill((x, y) => L(.45 + (fbm(x * .4, y * .4, 2) - .5) * .5 + (y === 2 ? .3 : 0), x, y)); return P.done(); }

export function buildBarber() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#0a0810', .03); scene.background = new THREE.Color('#040306');
  const floorM = mat(checker(96), { rough: .45 });
  const wallM = mat(plaster(96, 96, { seed: 52, wall: ['#2a1c18', '#3e2a22', '#56392c', '#6a4836'], beam: ['#120a08', '#1e120c', '#2a1a12'], beams: [{ t: 'h', y: 70 }, { t: 'h', y: 93 }] }));
  const corM = mat(plaster(96, 96, { seed: 57, wall: ['#14121c', '#1e1a28', '#2a2436', '#363046'] }));
  scene.add(mesh(new THREE.BoxGeometry(W2 * 2 + .4, .2, 8.4).translate(0, -.1, -.2), floorM));
  scene.add(mesh(new THREE.BoxGeometry(CW * 2 + .2, .2, 5.4).translate(0, -.1, (BZ + CZ) / 2), floorM));
  const wall = (w, h, d, x, y, z, m = wallM) => { const o = mesh(new THREE.BoxGeometry(w, h, d).translate(x, y, z), m); scene.add(o); return o; };
  wall(.2, WH, 8.4, -W2 - .1, WH / 2, -.2); const rightW = wall(.2, WH, 8.4, W2 + .1, WH / 2, -.2);
  wall(W2 - CW, WH, .2, -(W2 + CW) / 2, WH / 2, BZ - .1); wall(W2 - CW, WH, .2, (W2 + CW) / 2, WH / 2, BZ - .1);
  const corL = wall(.2, WH, 5.2, -CW - .1, WH / 2, (BZ + CZ) / 2, corM), corR = wall(.2, WH, 5.2, CW + .1, WH / 2, (BZ + CZ) / 2, corM);
  wall(CW * 2 + .4, WH, .2, 0, WH / 2, CZ - .9, corM);
  // mirrors + chairs along the left wall
  const mirrorM = new THREE.MeshStandardMaterial({ color: '#2a3a4a', roughness: .08, metalness: .9, emissive: '#1a2a3a', emissiveIntensity: .35 });
  const frameM = new THREE.MeshStandardMaterial({ color: '#8a6a2a', roughness: .4, metalness: .7 });
  const chairM = new THREE.MeshStandardMaterial({ map: texOf(leather()), roughness: .5 }), chromeM = new THREE.MeshStandardMaterial({ color: '#b8bcc4', metalness: .9, roughness: .25 });
  const lamps = [];
  for (const z of [-2.6, -.6, 1.4]) {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.2, .95), frameM); fr.position.set(-W2 + .02, 1.55, z); scene.add(fr);
    const mi = new THREE.Mesh(new THREE.PlaneGeometry(.82, 1.06), mirrorM); mi.rotation.y = Math.PI / 2; mi.position.set(-W2 + .06, 1.55, z); scene.add(mi);
    const ch = new THREE.Group(); ch.position.set(-1.55, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .1, 12).translate(0, .05, 0), chromeM), post = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .35).translate(0, .27, 0), chromeM);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(.55, .14, .55).translate(0, .5, 0), chairM), back_ = new THREE.Mesh(new THREE.BoxGeometry(.12, .7, .55).translate(.24, .9, 0), chairM), head = new THREE.Mesh(new THREE.BoxGeometry(.1, .16, .3).translate(.24, 1.36, 0), chairM);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .08).translate(0, .72, -.26), chromeM), armR = armL.clone(); armR.position.z = .52;
    [base, post, seat, back_, head, armL, armR].forEach(m => { m.castShadow = m.receiveShadow = true; ch.add(m); }); scene.add(ch);
    const shelf = box(.3, .04, .9, mats_wood(), { cast: false }); shelf.position.set(-W2 + .17, .95, z); scene.add(shelf);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .16, 8).translate(0, .08, 0), new THREE.MeshStandardMaterial({ color: ['#2a7a5a', '#8a2a2a', '#c8a040'][i], roughness: .3, transparent: true, opacity: .9 })); b.position.set(-W2 + .17, .97, z - .25 + i * .25); scene.add(b); }
    const pend = new THREE.Mesh(new THREE.ConeGeometry(.16, .16, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1410', emissive: '#ffc070', emissiveIntensity: 1.6, side: THREE.DoubleSide })); pend.position.set(-1.4, 2.25, z); scene.add(pend);
    const L = new THREE.PointLight('#ffb25e', 3.2, 5, 1.6); L.position.set(-1.4, 2.05, z + .1); scene.add(L);
    const g = glow('#ffc890', .7, .9); g.position.set(-1.4, 2.2, z); scene.add(g); lamps.push({ L, g, pend });
  }
  lamps[1].L.castShadow = true; lamps[1].L.shadow.mapSize.set(512, 512); lamps[1].L.shadow.bias = -.004;
  // waiting bench + coat stand on the right
  const bench = box(.5, .45, 2.2, mats_wood()); bench.position.set(W2 - .35, 0, .2); scene.add(bench);
  // barber pole by the corridor
  const poleC = document.createElement('canvas'); poleC.width = 8; poleC.height = 32; const pg = poleC.getContext('2d'); for (let y = 0; y < 32; y++) for (let x = 0; x < 8; x++) { const k = ((x + y) >> 2) % 3; pg.fillStyle = ['#e8e2d6', '#c0261f', '#2a4ab0'][k]; pg.fillRect(x, y, 1, 1); }
  const poleT = texOf(poleC); poleT.wrapS = poleT.wrapT = THREE.RepeatWrapping;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .9, 12), new THREE.MeshStandardMaterial({ map: poleT, emissive: '#ffffff', emissiveMap: poleT, emissiveIntensity: .5 })); pole.position.set(W2 - .2, 1.5, BZ + .3); scene.add(pole);
  // wall sign inside: BARBA NEGRA
  const signC = document.createElement('canvas'); signC.width = 96; signC.height = 18; const sg = signC.getContext('2d'); sg.fillStyle = '#120c08'; sg.fillRect(0, 0, 96, 18); sg.fillStyle = '#d8b060'; sg.font = 'bold 10px monospace'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('BARBA NEGRA', 48, 9.5);
  const signT = texOf(signC); const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .38), new THREE.MeshStandardMaterial({ map: signT, emissive: '#ffffff', emissiveMap: signT, emissiveIntensity: .7 })); sign.position.set(-1.45, 2.42, BZ + .02); scene.add(sign);

  // —— the corridor door: wood, with light leaking at its edges and through the keyhole ——
  const doorM = mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 61, nails: false, cols: ['#140c08', '#22160e', '#322016', '#44301e'] }));
  const pivot = new THREE.Group(); pivot.position.set(-.5, 0, CZ + .02); scene.add(pivot);
  const leaf = mesh(new THREE.BoxGeometry(1.0, 2.1, .06).translate(.5, 1.05, 0), doorM); pivot.add(leaf);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.12, .03, .05), new THREE.MeshStandardMaterial({ color: '#c8c0b0', metalness: .9, roughness: .25 })); handle.position.set(.86, 1.0, .06); pivot.add(handle);
  const keyhole = new THREE.Mesh(new THREE.PlaneGeometry(.02, .04), new THREE.MeshBasicMaterial({ color: '#8ff8ff' })); keyhole.position.set(.88, .92, .035); pivot.add(keyhole);
  const edgeM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const edgeL = new THREE.Mesh(new THREE.PlaneGeometry(.035, 2.1), edgeM(CYAN)); edgeL.position.set(-.51, 1.05, CZ + .05); scene.add(edgeL);
  const edgeR = new THREE.Mesh(new THREE.PlaneGeometry(.035, 2.1), edgeM(MAG)); edgeR.position.set(.51, 1.05, CZ + .05); scene.add(edgeR);
  const edgeB = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .03), edgeM('#b07aff')); edgeB.position.set(0, .02, CZ + .05); scene.add(edgeB);
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.ShaderMaterial({ uniforms: { k: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec2 vUv; uniform float k; void main(){ vec3 c = mix(vec3(.18,.9,1.), vec3(1.,.2,.7), smoothstep(.2,.8,vUv.x)); gl_FragColor = vec4(c * k * (.6 + .4 * vUv.y), 1.); }' }));
  beyond.position.set(0, 1.1, CZ - .6); scene.add(beyond);
  const cyanL = new THREE.PointLight(CYAN, 0, 6, 1.4); cyanL.position.set(-.35, 1.1, CZ + .35); cyanL.castShadow = true; cyanL.shadow.mapSize.set(512, 512); cyanL.shadow.bias = -.004; scene.add(cyanL);
  const magL = new THREE.PointLight(MAG, 0, 6, 1.4); magL.position.set(.35, 1.1, CZ + .35); scene.add(magL);
  const gL = glow(CYAN, 1.2, 1), gR = glow(MAG, 1.2, 1); gL.position.set(-.5, 1.05, CZ + .12); gR.position.set(.5, 1.05, CZ + .12); scene.add(gL, gR);
  const beams = [beamCard(3.4, .08, 1.0, CYAN, { k: .35 }), beamCard(3.4, .08, 1.0, MAG, { k: .35 })]; beams.forEach(b => scene.add(b));
  const corLight = new THREE.PointLight('#7a6aff', 0, 7, 1.5); corLight.position.set(0, 2.4, BZ - 2.2); scene.add(corLight);   // the faint pulse seen from the shop
  const motes = particles(120, (i, t, o) => { o.x = -.55 + h2(i, 1, 4) * 1.1 + Math.sin(t * .3 + i) * .05; o.y = .2 + ((h2(i, 2, 4) * 2.2 + t * .05) % 2.2); o.z = CZ + .2 + h2(i, 3, 4) * 4.2; o.a = .5; o.s = .014; const c = i % 2 ? [.3, .95, 1] : [1, .4, .8]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 1 }); scene.add(motes);
  const sparks = particles(60, (i, t, o) => { const k = (t * .5 + h2(i, 5, 2)) % 1; o.x = -.6 + h2(i, 6, 2) * 1.2; o.y = .4 + k * 1.6; o.z = CZ + .3 + h2(i, 7, 2) * .6; o.a = (1 - k) * (Math.floor(t * 10 + i) % 2 ? 1 : .4); o.s = .02; const c = i % 2 ? [.4, 1, 1] : [1, .5, .9]; o.r = c[0]; o.g = c[1]; o.b = c[2]; }, { soft: 0 }); scene.add(sparks);

  const hero = makeChar('hero'), LAGZ = makeChar('lagzilla', { scale: .66 });
  scene.add(hero.root, LAGZ.root);
  const fill = new THREE.PointLight('#b8c4f0', 1.4, 5, 2); scene.add(fill);
  const hemi = new THREE.HemisphereLight('#4a3a4a', '#0a0608', .75); scene.add(hemi);

  const CAM = {
    barber: { p: track([[0, [1.4, 4.6, 6.6]], [5.33, [.9, 4.0, 3.4]], [10.67, [.5, 3.5, 1.0]]]), l: track([[0, [-.3, .7, 0]], [5.33, [-.4, .8, -2.2]], [10.67, [0, .9, -4.8]]]), fov: 36 },
    corridor: { p: track([[0, [.3, 2.5, -2.4]], [10.67, [.2, 2.2, -5.4]]]), l: track([[0, [0, .9, -8.0]], [10.67, [0, .95, -9.0]]]), fov: 34 },
    start: { p: track([[0, [.45, 2.3, -5.6]], [5.2, [.4, 1.95, -6.5]], [8, [.38, 1.6, -7.4]]]), l: track([[0, [.05, 1.0, -9.0]], [5.2, [.15, 1.0, -9.0]], [8, [.3, 1.0, -9.0]]]), fov: 34 },
    secret: { p: track([[0, [.25, 2.0, -6.0]], [5.33, [.6, 3.6, .2]]]), l: track([[0, [0, .8, -9.0]], [5.33, [0, .8, -8.6]]]), fov: 36 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id, C = CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    hero.root.visible = LAGZ.root.visible = false;
    // the heartbeat pulse of the door (72 bpm double beat), stronger as he gets closer
    const hb = t => { const p = (t * 1.2) % 1; return Math.exp(-p * 9) + .6 * Math.exp(-Math.max(0, p - .22) * 9) * (p > .22); };
    let pulse = .35 + .65 * hb(t), open = 0, near = 0;
    if (id === 'barber') {
      const k1 = seg(t, T.enter, 24.1), k2 = seg(t, 26.4, 31.4);
      const z = k2 > 0 ? lerp(-1.5, BZ - .5, ss(k2)) : lerp(3.2, -1.5, ss(k1)), x = k2 > 0 ? lerp(.35, 0, ss(k2)) : .35;
      const walking = (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1);
      hero.root.visible = true; hero.root.position.set(x, 0, z); hero.frame(walking ? (k2 > 0 ? ['backW0', 'back', 'backW1', 'back'] : ['backW0', 'back', 'backW1', 'back'])[Math.floor(t * 7) % 4] : (t > T.laugh && t < 28.6 ? 'lookBack' : 'back')); hero.face(cam);
      near = .25; post.dof.focus = cam.position.distanceTo(hero.root.position.clone().setY(1)); post.dof.aper = 300; post.dof.maxCoc = 18;
    } else if (id === 'corridor') {
      const k = seg(t, 32.2, 36.8), z = lerp(BZ - .6, CZ + 1.1, ss(k));
      hero.root.visible = true; hero.root.position.set(.05, 0, z); hero.frame(k > 0 && k < 1 ? ['backW0', 'back', 'backW1', 'back'][Math.floor(t * 5) % 4] : 'back'); hero.face(cam);
      near = .5 + .5 * ss(seg(t, 32, 42)); post.dof.focus = cam.position.distanceTo(new THREE.Vector3(0, 1, CZ)); post.dof.aper = 260; post.dof.maxCoc = 16;
      if (t > T.voice - .2 && t < T.voice + 1.8) pulse *= 1.5;
    } else if (id === 'start') {
      hero.root.visible = true; hero.root.position.set(-.3, 0, CZ + .55); hero.frame(t < 45 ? 'idle0' : t < T.touch ? (Math.floor(t * 2) % 2 ? 'handle' : 'handle1') : 'reach'); hero.face(cam);
      near = 1; pulse = .6 + .5 * hb(t) + 1.2 * ss(seg(t, 46.5, T.touch)); open = ss(seg(t, T.touch, T.touch + .5)) * .25;
      post.dof.focus = cam.position.distanceTo(new THREE.Vector3(.36, 1.0, CZ)); post.dof.aper = 220; post.dof.maxCoc = 20;
    } else if (id === 'secret') {
      open = 1; near = 1; pulse = 1.3;
      LAGZ.root.visible = true; LAGZ.root.position.set(0, 0, CZ + .15); LAGZ.frame(t < 86.4 ? 'front' : Math.floor(t * 3.2) % 2 ? 'wave0' : 'wave1'); LAGZ.face(cam);
      post.dof.focus = cam.position.distanceTo(LAGZ.root.position.clone().setY(.6)); post.dof.aper = 300; post.dof.maxCoc = 16;
    }
    // door: shiver on the beat, light leaking
    const shake = id === 'corridor' || id === 'start' ? (Math.sin(t * 73) * .004 + Math.sin(t * 51) * .003) * pulse : 0;
    pivot.position.x = -.5 + shake; pivot.rotation.y = -open * 1.6;
    const k = pulse * (id === 'barber' ? .55 : 1);
    edgeL.material.opacity = edgeR.material.opacity = Math.min(1, .5 * k + .2) * (1 - open); gL.visible = gR.visible = open < .5; edgeB.material.opacity = .6 * k * (1 - open);
    beyond.material.uniforms.k.value = .3 + .22 * open + .15 * k;
    cyanL.intensity = (3.2 * k * (1 - open) + 1.1 * open) * Math.max(near, .6); magL.intensity = (1.6 * k * (1 - open) + .9 * open) * Math.max(near, .6); gL.material.opacity = gR.material.opacity = Math.min(1, .8 * k);
    corLight.intensity = id === 'barber' ? 1.6 * pulse : id === 'corridor' ? 1.4 : .6;
    keyhole.material.color.set(CYAN).multiplyScalar(.6 + .9 * k);
    for (const [b, x] of [[beams[0], -.5], [beams[1], .5]]) { b.visible = id !== 'barber'; if (b.visible) { b.userData.aim(new THREE.Vector3(x, 1.05, CZ + .05), new THREE.Vector3(x * .25, -.05, 1).normalize(), cam); b.material.uniforms.k.value = .22 * k + .3 * open; } }
    for (const L of lamps) { const f = flick(t * .3, L.pend.position.z); L.L.intensity = 3.2 * f * (id === 'barber' ? 1 : .35); L.g.material.opacity = .9 * f; }
    motes.userData.update(t); sparks.userData.update(t); sparks.visible = id === 'start' || id === 'secret';
    const subj = id === 'secret' ? LAGZ : hero; fill.position.copy(subj.root.position).add(new THREE.Vector3(.2, 1.6, 1.4)); fill.intensity = id === 'barber' ? 1.2 : 1.6;
    hemi.intensity = id === 'barber' ? .8 : .7;
    post.bloom.strength = id === 'secret' ? .45 : .6 + .3 * near; post.bloom.threshold = id === 'secret' ? .85 : .72;
    return {};
  }
  return { scene, update, hero };
}
let _w; function mats_wood() { return _w ??= mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 63, nails: false, cols: ['#1a100a', '#2a1a10', '#3c2618', '#4e3420'] })); }
