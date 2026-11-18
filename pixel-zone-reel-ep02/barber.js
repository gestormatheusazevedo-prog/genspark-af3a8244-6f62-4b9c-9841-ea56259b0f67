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
const W2 = 2.5, BZ = -4.0, CZ = -9.0, CW = .62, WH = 2.9;   // shop half-width, back wall z, corridor door z, corridor half-width, wall height

function checker(n) { const P = new PX(n, n), A = ramp(['#0c0c10', '#18181e', '#24242c']), B = ramp(['#b8b2a4', '#d6d0c2', '#ece6d8']); P.fill((x, y) => { const k = ((x >> 3) + (y >> 3)) % 2, v = .5 + (h2(x >> 3, y >> 3, 4) - .5) * .4 + ((x & 7) === 0 || (y & 7) === 0 ? -.35 : 0); return (k ? A : B)(v, x, y); }); return P.done(); }
function brick(n, seed) { const P = new PX(n, n), F = ramp(['#5a5c62', '#70737a', '#868990', '#9c9fa6']); P.fill((x, y) => { const row = y >> 2, off = (row % 2) * 4, mortar = (y & 3) === 3 || ((x + off) & 7) === 7; return F(mortar ? .9 : .35 + (h2((x + off) >> 3, row, seed) - .5) * .45 + (fbm(x * .2, y * .2, seed) - .5) * .3, x, y); }); return P.done(); }
function stoneDark(w, h, seed) { const P = new PX(w, h), F = ramp(['#060608', '#0e0e12', '#1a1a20', '#2a2a32']); P.fill((x, y) => F(.35 + (fbm(x * .5, y * .5, seed) - .5) * .9, x, y)); return P.done(); }
function leather() { const P = new PX(16, 16), L = ramp(['#060608', '#101014', '#1c1c22', '#2e2e38']); P.fill((x, y) => L(.45 + (fbm(x * .4, y * .4, 2) - .5) * .5 + (y === 2 ? .3 : 0), x, y)); return P.done(); }

export async function buildBarber() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#0a0810', .03); scene.background = new THREE.Color('#040306');
  const floorM = mat(checker(96), { rough: .45 });
  const wallM = mat(plaster(96, 96, { seed: 52, wall: ['#2a1c18', '#3e2a22', '#56392c', '#6a4836'], beam: ['#120a08', '#1e120c', '#2a1a12'], beams: [{ t: 'h', y: 70 }, { t: 'h', y: 93 }] }));
  const corM = mat(plaster(96, 96, { seed: 57, wall: ['#14121c', '#1e1a28', '#2a2436', '#363046'] }));
  scene.add(mesh(new THREE.BoxGeometry(W2 * 2 + .4, .2, 8.4).translate(0, -.1, -.2), floorM));
  scene.add(mesh(new THREE.BoxGeometry(CW * 2 + .2, .2, 5.4).translate(0, -.1, (BZ + CZ) / 2), floorM));
  const wall = (w, h, d, x, y, z, m = wallM) => { const o = mesh(new THREE.BoxGeometry(w, h, d).translate(x, y, z), m); scene.add(o); return o; };
  // —— Barba Negra as it is: checker floor, grey brick walls, black ceiling with downlights, stations on the left (white backwash sinks,
  //    black chairs, black shelves, the big clock, black dome pendants), bar at the back right under a string of bulbs,
  //    chesterfield sofa, trunk table on a cowhide, black barrels and stools on the right; the lit logo above the bar ——
  const brickM = mat(brick(96, 96, 21));
  wall(.2, WH, 8.4, -W2 - .1, WH / 2, -.2, brickM); const rightW = wall(.2, WH, 8.4, W2 + .1, WH / 2, -.2, brickM);
  wall(W2 - CW, WH, .2, -(W2 + CW) / 2, WH / 2, BZ - .1, brickM); wall(W2 - CW, WH, .2, (W2 + CW) / 2, WH / 2, BZ - .1, darkM());
  const corL = wall(.2, WH, 5.2, -CW - .1, WH / 2, (BZ + CZ) / 2, corM), corR = wall(.2, WH, 5.2, CW + .1, WH / 2, (BZ + CZ) / 2, corM);
  wall(CW * 2 + .4, WH, .2, 0, WH / 2, CZ - .9, corM);
  // black ceiling with a white soffit band, round downlights and square panels (dimmed: the shop is closed)
  const ceilM = new THREE.MeshStandardMaterial({ color: '#060608', roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2 + .4, 8.6), ceilM); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WH, -.2); scene.add(ceil);
  const ceilC = new THREE.Mesh(new THREE.PlaneGeometry(CW * 2 + .4, 5.4), ceilM); ceilC.rotation.x = Math.PI / 2; ceilC.position.set(0, WH, (BZ + CZ) / 2); scene.add(ceilC);
  const soffM = new THREE.MeshStandardMaterial({ color: '#d8d6d0', roughness: .8 });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .22, 8.4), soffM); b.position.set(s * (W2 - .03), WH - .11, -.2); scene.add(b); }
  const dlM = new THREE.MeshStandardMaterial({ color: '#222', emissive: '#e8f0ff', emissiveIntensity: .35 });
  for (const [x, z] of [[-1.2, 2.4], [1.2, 2.4], [-1.2, .2], [1.2, .2], [-1.2, -2.0], [1.2, -2.0], [0, 1.3], [0, -1.0]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(.09, 12), dlM); d.rotation.x = Math.PI / 2; d.position.set(x, WH - .005, z); scene.add(d); }
  const panelM = new THREE.MeshStandardMaterial({ color: '#333', emissive: '#dfe8ff', emissiveIntensity: .18 });
  for (const z of [1.3, -1.0]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), panelM); p.rotation.x = Math.PI / 2; p.position.set(-1.0, WH - .006, z); scene.add(p); }
  // stations on the left wall
  const chairM = new THREE.MeshStandardMaterial({ map: texOf(leather()), roughness: .5 }), ironM = new THREE.MeshStandardMaterial({ color: '#141418', metalness: .6, roughness: .45 });
  const sinkM = new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: .25 }), cabM = new THREE.MeshStandardMaterial({ color: '#0e0e12', roughness: .5 });
  const lamps = [];
  for (const z of [-2.6, -.6, 1.4]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(.6, .8, .9).translate(-W2 + .3, .4, z), cabM); cab.castShadow = cab.receiveShadow = true; scene.add(cab);
    const sink = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .55).translate(-W2 + .38, .9, z), sinkM); sink.castShadow = true; scene.add(sink);
    const bowl = new THREE.Mesh(new THREE.BoxGeometry(.34, .02, .4).translate(-W2 + .4, 1.0, z), new THREE.MeshStandardMaterial({ color: '#c8c8c6' })); scene.add(bowl);
    // black shelving with products against the wall, between stations
    const sh = new THREE.Group(); sh.position.set(-W2 + .14, 0, z + .95);
    for (const y of [1.15, 1.5, 1.85]) { const s = new THREE.Mesh(new THREE.BoxGeometry(.26, .03, .6).translate(0, y, 0), cabM); sh.add(s); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .1 + h2(i, y * 10, 3) * .08, 6).translate(0, y + .07, -.22 + i * .15), new THREE.MeshStandardMaterial({ color: ['#e8e2d0', '#2a2a30', '#c8a040', '#3a7a5a', '#a02a2a'][(i + Math.round(y * 10)) % 5], roughness: .4 })); sh.add(b); } }
    scene.add(sh);
    // vintage black barber chair, back to the sink, facing the room
    const ch = new THREE.Group(); ch.position.set(-1.45, 0, z);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.26, .3, .08, 12).translate(0, .04, 0), ironM), post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .34).translate(0, .25, 0), ironM);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(.58, .16, .58).translate(0, .5, 0), chairM), back_ = new THREE.Mesh(new THREE.BoxGeometry(.12, .8, .56).translate(-.26, .95, 0), chairM);
    const top_ = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .12, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).translate(-.26, 1.35, 0), chairM);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(.5, .07, .08).translate(0, .74, -.28), ironM), armR = armL.clone(); armR.position.z = .56;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.18, .04, .4).translate(.42, .18, 0), ironM);
    [base, post, seat, back_, top_, armL, armR, foot].forEach(m => { m.castShadow = m.receiveShadow = true; ch.add(m); }); scene.add(ch);
    // black dome pendant over each chair
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .5), ironM); cord.position.set(-1.3, WH - .25, z); scene.add(cord);
    const pend = new THREE.Mesh(new THREE.SphereGeometry(.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#16161a', emissive: '#ffc070', emissiveIntensity: 0, side: THREE.DoubleSide, roughness: .5 })); pend.position.set(-1.3, WH - .62, z); scene.add(pend);
    const bulbIn = new THREE.Mesh(new THREE.CircleGeometry(.17, 14), new THREE.MeshBasicMaterial({ color: '#ffd29a' })); bulbIn.rotation.x = Math.PI / 2; bulbIn.position.set(-1.3, WH - .63, z); scene.add(bulbIn);
    const L = new THREE.PointLight('#ffc888', 3.2, 5, 1.6); L.position.set(-1.3, WH - .8, z); scene.add(L);
    const g = glow('#ffc890', .7, .9); g.position.set(-1.3, WH - .68, z); scene.add(g); lamps.push({ L, g, pend });
  }
  lamps[1].L.castShadow = true; lamps[1].L.shadow.mapSize.set(512, 512); lamps[1].L.shadow.bias = -.004;
  // the big wall clock (roman numerals)
  const clk = (() => { const c = document.createElement('canvas'); c.width = c.height = 40; const g = c.getContext('2d'); g.fillStyle = '#0c0c0e'; g.beginPath(); g.arc(20, 20, 20, 0, 7); g.fill(); g.fillStyle = '#d6d2c8'; g.beginPath(); g.arc(20, 20, 17, 0, 7); g.fill(); g.fillStyle = '#111';
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(Math.round(20 + Math.sin(a) * 13) - 1, Math.round(20 - Math.cos(a) * 13) - 1, 2, 3); }
    g.fillRect(19, 9, 2, 12); g.save(); g.translate(20, 20); g.rotate(2.2); g.fillRect(-1, -8, 2, 8); g.restore(); return texOf(c); })();
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshStandardMaterial({ map: clk, roughness: .6 })); clock.rotation.y = Math.PI / 2; clock.position.set(-W2 + .02, 2.05, -1.6); scene.add(clock);
  // bar on the back wall (right of the corridor): textured black front, stools, bottle shelves, a string of bare bulbs
  const barFrontM = mat(stoneDark(48, 32, 9));
  const bar = mesh(new THREE.BoxGeometry(1.65, 1.05, .5).translate(1.6, .525, BZ + .5), barFrontM); scene.add(bar);
  const barTop = box(1.75, .05, .58, cabM); barTop.position.set(1.6, 1.05, BZ + .5); scene.add(barTop);
  const woodM = mats_wood();
  for (const x of [1.0, 1.55, 2.1]) { const st = new THREE.Group(); st.position.set(x, 0, BZ + 1.05); const seatS = new THREE.Mesh(new THREE.BoxGeometry(.3, .04, .3).translate(0, .72, 0), woodM); st.add(seatS); for (const [a, b] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.035, .72, .035).translate(a, .36, b), woodM); st.add(l); } st.traverse(o => o.castShadow = true); scene.add(st); }
  const shelfGlow = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#7ad8ff', emissiveIntensity: .8 });
  for (const y of [1.45, 1.8]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, .025, .2), shelfGlow); s.position.set(1.6, y, BZ + .1); scene.add(s);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .035, .2 + h2(i, y * 10, 5) * .1, 6).translate(0, .12, 0), new THREE.MeshStandardMaterial({ color: ['#c8a040', '#2a5a3a', '#e8e0d0', '#8a2a2a', '#3a2a1a'][i % 5], roughness: .2, emissive: '#2a2010', emissiveIntensity: .3 })); b.position.set(1.0 + i * .15, y + .01, BZ + .1); scene.add(b); } }
  // two framed shirts above the shelves (the shop's own: red 09 and yellow 06)
  const shirt = (bg, fg, num) => { const c = document.createElement('canvas'); c.width = 20; c.height = 24; const g = c.getContext('2d'); g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, 20, 24); g.fillStyle = bg; g.fillRect(5, 3, 10, 19); g.fillRect(2, 3, 16, 5); g.fillStyle = fg; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText(num, 10, 18); return texOf(c); };
  for (const [x, t] of [[1.2, shirt('#a82020', '#f0f0f0', '09')], [1.95, shirt('#f0d020', '#103a40', '06')]]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.5, .6), new THREE.MeshStandardMaterial({ map: t, roughness: .5 })); f.position.set(x, 2.3, BZ + .03); scene.add(f); }
  const bulbs = [];
  for (let i = 0; i < 9; i++) { const x = .85 + i * .19, len = .3 + h2(i, 2, 8) * .35; const c = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, len), ironM); c.position.set(x, WH - len / 2, BZ + .75); scene.add(c);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), new THREE.MeshStandardMaterial({ color: '#3a2a10', emissive: '#ffc070', emissiveIntensity: 2.4 })); b.position.set(x, WH - len - .03, BZ + .75); scene.add(b); bulbs.push(b); }
  const barL = new THREE.PointLight('#ffb460', 2.6, 4, 1.6); barL.position.set(1.6, 2.0, BZ + .9); scene.add(barL);
  // the lit Barba Negra sign, on the dark wall left of the bar
  const logoImg = new Image(); logoImg.src = 'refs/logo-barba-negra-px.png'; await logoImg.decode();
  const logoT = texOf((() => { const c = document.createElement('canvas'); c.width = logoImg.width; c.height = logoImg.height; c.getContext('2d').drawImage(logoImg, 0, 0); return c; })());
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6 * logoImg.height / logoImg.width), new THREE.MeshStandardMaterial({ map: logoT, transparent: true, alphaTest: .5, emissive: '#ffffff', emissiveMap: logoT, emissiveIntensity: .22 }));
  logo.position.set(1.6, 2.38, BZ + .9); scene.add(logo);
  const logoG = glow('#e8f0ff', .5, .12); logoG.position.set(1.6, 2.38, BZ + .86); scene.add(logoG);
  logo.position.set(.98, 2.0, BZ + .03); logoG.position.set(.98, 2.0, BZ + .08);
  // right side: wall letters + logo, black vertical slats, chesterfield sofa, trunk table on a cowhide, barrels and stools
  const wm = (() => { const c = document.createElement('canvas'); c.width = 96; c.height = 32; const g = c.getContext('2d'); g.drawImage(logoImg, 0, 2, 22, 28); g.fillStyle = '#121214'; g.font = 'bold 12px Georgia, serif'; g.textBaseline = 'top'; g.fillText('BARBA', 26, 2); g.fillText('NEGRA', 26, 14); g.font = 'italic 7px Georgia, serif'; g.fillText('Barbearia', 52, 25); return texOf(c); })();
  const wmM = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .4), new THREE.MeshStandardMaterial({ map: wm, transparent: true, alphaTest: .4, roughness: .7 })); wmM.rotation.y = -Math.PI / 2; wmM.position.set(W2 - .02, 1.9, .5); scene.add(wmM);
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.04, WH - .25, .06), cabM); s.position.set(W2 - .04, (WH - .25) / 2, -1.6 - i * .2); scene.add(s); }
  const sofaM = new THREE.MeshStandardMaterial({ map: texOf(leather()), roughness: .4 });
  const sofa = new THREE.Group(); sofa.position.set(W2 - .45, 0, .45);
  for (const [w, h, d, x, y, z] of [[.75, .4, 1.9, 0, .2, 0], [.22, .55, 1.9, .27, .62, 0], [.7, .58, .2, 0, .32, -1.0], [.7, .58, .2, 0, .32, 1.0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(x, y, z), sofaM); m.castShadow = m.receiveShadow = true; sofa.add(m); }
  scene.add(sofa);
  const hideT = (() => { const P = new PX(32, 24), F = ramp(['#0a0806', '#1e140c', '#3a2818', '#d0c4b0']); P.fill((x, y) => { const d = Math.hypot((x - 16) / 15, (y - 12) / 11) + (fbm(x * .3, y * .3, 4) - .5) * .5; if (d > 1) return null; return F(fbm(x * .2, y * .25, 11) > .62 ? .95 : .3 + (fbm(x * .5, y * .5, 2) - .5) * .4, x, y); }); return texOf(P.done()); })();
  const hide = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshStandardMaterial({ map: hideT, transparent: true, alphaTest: .5, roughness: 1 })); hide.rotation.x = -Math.PI / 2; hide.position.set(1.45, .006, .45); scene.add(hide);
  const trunk = box(.5, .42, .7, mat(woodPlanks(24, 24, { pw: 6, len: 24, seed: 71, nails: false, cols: ['#2a1e12', '#3e2c1a', '#544028', '#6a5434'] }))); trunk.position.set(1.4, 0, .45); scene.add(trunk);
  const barrelM = new THREE.MeshStandardMaterial({ color: '#141416', roughness: .45, metalness: .3 });
  for (const [x, z] of [[W2 - .35, 2.6], [W2 - .35, -1.2]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.27, .27, .85, 16).translate(0, .425, 0), barrelM); b.position.set(x, 0, z); b.castShadow = b.receiveShadow = true; scene.add(b);
    for (const y of [.28, .58]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.272, .012, 4, 16), barrelM); r.rotation.x = Math.PI / 2; r.position.set(x, y, z); scene.add(r); } }
  const stool = new THREE.Group(); stool.position.set(1.6, 0, 2.6); { const s = new THREE.Mesh(new THREE.BoxGeometry(.32, .04, .32).translate(0, .62, 0), woodM); stool.add(s); for (const [a, b] of [[-.13, -.13], [.13, -.13], [-.13, .13], [.13, .13]]) stool.add(new THREE.Mesh(new THREE.BoxGeometry(.04, .62, .04).translate(a, .31, b), woodM)); } scene.add(stool);

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

  const hero = makeChar('trab'), LAGZ = makeChar('lagzilla', { scale: .66 }), LU = makeChar('lucas');
  scene.add(hero.root, LAGZ.root, LU.root);
  const fill = new THREE.PointLight('#b8c4f0', 1.4, 5, 2); scene.add(fill);
  const hemi = new THREE.HemisphereLight('#4a3a4a', '#0a0608', .75); scene.add(hemi);

  const CAM = {
    shop: { p: track([[0, [.4, 1.75, 3.2]], [2, [.2, 1.65, -.2]]]), l: track([[0, [-.3, 1.1, -2.0]], [2, [0, 1.0, -8.0]]]), fov: 56 },
    barber: { p: track([[0, [1.9, 2.6, 6.6]], [5.33, [1.7, 2.55, 4.4]], [10.67, [1.1, 2.4, 1.9]]]), l: track([[0, [-.7, .9, -.6]], [5.33, [-.4, 1.0, -2.6]], [10.67, [0, 1.0, -5.2]]]), fov: 50 },
    corridor: { p: track([[0, [.3, 2.5, -2.4]], [10.67, [.2, 2.2, -5.4]]]), l: track([[0, [0, .9, -8.0]], [10.67, [0, .95, -9.0]]]), fov: 34 },
    start: { p: track([[0, [.45, 2.3, -5.6]], [5.2, [.4, 1.95, -6.5]], [8, [.38, 1.6, -7.4]]]), l: track([[0, [.05, 1.0, -9.0]], [5.2, [.15, 1.0, -9.0]], [8, [.3, 1.0, -9.0]]]), fov: 34 },
    secret: { p: track([[0, [.25, 2.0, -6.0]], [5.33, [.5, 2.15, .4]]]), l: track([[0, [0, .8, -9.0]], [5.33, [0, .8, -8.6]]]), fov: 36 },
  };
  function update(t, shot, cam, post) {
    const lt = t - shot.a, id = shot.id === 'shop' ? 'barber' : shot.id, C = shot.id === 'shop' ? CAM.shop : CAM[id];
    cam.up.set(0, 1, 0); cam.position.set(...C.p(lt)); cam.lookAt(...C.l(lt)); cam.fov = C.fov; cam.updateProjectionMatrix();
    hero.root.visible = LAGZ.root.visible = false;
    // the heartbeat pulse of the door (72 bpm double beat), stronger as he gets closer
    const hb = t => { const p = (t * 1.2) % 1; return Math.exp(-p * 9) + .6 * Math.exp(-Math.max(0, p - .22) * 9) * (p > .22); };
    let pulse = .35 + .65 * hb(t), open = 0, near = 0;
    LU.root.visible = false;
    if (id === 'barber') {   // he crosses the closed shop; Lucas, sweeping up, waves; the door at the end of the corridor glows
      const k = seg(t, 18.5, 20.5), z = lerp(1.3, -3.9, k), x = lerp(.3, 0, k);
      hero.root.visible = true; hero.root.position.set(x, 0, z); hero.frame(['backW0', 'back', 'backW1', 'back'][Math.floor(t * 7) % 4]); hero.face(cam);
      LU.root.visible = true; LU.root.position.set(-.85, 0, -2.1); LU.frame(Math.floor(t * 3.4) % 2 ? 'waveH0' : 'waveH1'); LU.face(cam);
      near = .5; post.dof.focus = cam.position.distanceTo(hero.root.position.clone().setY(1)); post.dof.aper = 240; post.dof.maxCoc = 18;
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
    for (const L of lamps) { const f = flick(t * .3, L.pend.position.z); L.L.intensity = 3.2 * f * (id === 'barber' ? 1 : .35); L.pend.material.emissiveIntensity = 0; L.g.material.opacity = .9 * f; }
    motes.userData.update(t); sparks.userData.update(t); sparks.visible = id === 'start' || id === 'secret';
    const subj = id === 'secret' ? LAGZ : hero; fill.position.copy(subj.root.position).add(new THREE.Vector3(.2, 1.6, 1.4)); fill.intensity = id === 'barber' ? 1.2 : 1.6;
    hemi.intensity = id === 'barber' ? .8 : .7;
    post.bloom.strength = id === 'secret' ? .45 : .6 + .3 * near; post.bloom.threshold = id === 'secret' ? .85 : .72;
    return { cold: .5 };
  }
  return { scene, update, hero };
}
let _d; function darkM() { return _d ??= new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: .8 }); }
let _w; function mats_wood() { return _w ??= mat(woodPlanks(48, 48, { pw: 48, len: 96, seed: 63, nails: false, cols: ['#1a100a', '#2a1a10', '#3c2618', '#4e3420'] })); }
