// Set 1 — a Portuguese town at blue hour, in light rain: white houses with terracotta roofs, a calçada pavement,
// windows lighting up one by one; the founder walks to an empty shop with a "for rent" sign.
import * as THREE from 'three';
import { PX, ramp, hex, h2, fbm, cobbles, plaster, shingles, texOf, glow, blob } from './px.js';
import { mat, mesh, box, house, mats } from './kit.js';
import { sky, particles, rain, flick } from './fx.js';
import { makeChar } from './chars.js';
import { track, seg, ss, eio, clamp, lerp } from '/core/lib.js';
import { T } from './story.js';

// Portuguese pavement: white limestone setts with a black basalt wave
function calcada(w, h) {
  const P = new PX(w, h), W = ramp(['#4e4c4a', '#8a8780', '#b7b2a6', '#d6d1c4', '#ece8dc']), K = ramp(['#0a0a0e', '#17171d', '#26262e', '#3a3a44']);
  P.fill((x, y) => {
    const cx = Math.floor(x / 3), cy = Math.floor(y / 3), xx = x % 3, yy = y % 3, id = h2(cx, cy, 4);
    const wave = Math.sin((cx * 3) / w * Math.PI * 2) * h * .07 + h * .5, dark = Math.abs(cy * 3 - wave) < h * .045;
    let v = .55 + id * .35; if (xx === 0 || yy === 0) v = .08;
    return (dark ? K : W)(v, x, y);
  });
  return P.done();
}
function sign(text) {   // tiny "ALUGA-SE" card (drawn at pixel size)
  const c = document.createElement('canvas'); c.width = 40; c.height = 14; const g = c.getContext('2d');
  g.fillStyle = '#efe9d8'; g.fillRect(0, 0, 40, 14); g.fillStyle = '#c0261f'; g.font = 'bold 9px monospace'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, 20, 7.5);
  const t = texOf(c); return new THREE.Mesh(new THREE.PlaneGeometry(.9, .32), new THREE.MeshStandardMaterial({ map: t, roughness: .8, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: .25 }));
}

let shopPole, shopGlass, shopX = 4.6, doorGlow;
export function buildCity() {
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2('#1c2a4a', .022);
  const SK = sky({ top: '#0b1430', mid: '#1f3463', hor: '#5a6f9e', moonI: 0 }); scene.add(SK.mesh);
  const moon = new THREE.DirectionalLight('#8ea6e6', .9); moon.position.set(-14, 24, 10); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 }); moon.shadow.bias = -.0008;
  scene.add(moon, new THREE.HemisphereLight('#4c62a0', '#141420', 1.25));

  // ground: sidewalk (calçada) + street (dark setts) + the square in front
  const side = mat(calcada(96, 96)), road = mat(cobbles(96, 96, { cell: 6, seed: 4, cols: ['#121218', '#22222c', '#33343f', '#464857', '#5d6072'] }), { rough: .55 });
  scene.add(mesh(new THREE.BoxGeometry(40, .2, 2.6).translate(0, -.1, -1.4), side));
  scene.add(mesh(new THREE.BoxGeometry(40, .2, 4.2).translate(0, -.16, 2.0), road));
  scene.add(mesh(new THREE.BoxGeometry(40, .2, 14).translate(0, -.1, 11), side));
  // kerb
  scene.add(box(40, .1, .14, mats().beam, { cast: false }).translateZ(-.1).translateY(-.05));

  // houses: white plaster with ochre/blue trims, terracotta roofs
  const wallW = mat(plaster(96, 96, { seed: 21, wall: ['#9aa0a8', '#c3c6c8', '#dddcd6', '#f0eee6'], beam: ['#6d5a2a', '#a8892e', '#d6b546'], beams: [{ t: 'h', y: 0 }, { t: 'h', y: 93 }] }));
  const wallB = mat(plaster(96, 96, { seed: 23, wall: ['#7d8ea8', '#a5b4c8', '#c6d0de', '#e2e8ef'], beam: ['#1d2c5a', '#2a427e', '#3b5ba8'], beams: [{ t: 'h', y: 0 }, { t: 'v', x: 0 }] }));
  const wallY = mat(plaster(96, 96, { seed: 25, wall: ['#a68a4c', '#c8aa62', '#e0c47a', '#f0daa0'], beam: ['#4a4a52', '#6a6a76', '#8e8e9a'], beams: [{ t: 'h', y: 0 }] }));
  const terra = mat(shingles(96, 96, { seed: 7, cols: ['#3a1810', '#6a2a18', '#94401f', '#b65a2c', '#cf7a44'] }));
  const H = [
    { x: -13, w: 4.4, h: 5.2, wall: wallY }, { x: -8.6, w: 4.2, h: 6.2, wall: wallW }, { x: -4.2, w: 4.4, h: 5.4, wall: wallB },
    { x: .2, w: 4.2, h: 6.4, wall: wallW }, { x: 4.6, w: 4.4, h: 5.6, wall: wallW, shop: 1 }, { x: 9.0, w: 4.2, h: 6.0, wall: wallY }, { x: 13.4, w: 4.4, h: 5.2, wall: wallB },
  ];
  const wins = [];
  H.forEach((o, i) => {
    const up = o.h * .72, lo = o.h * .3;
    const g = house({ x: o.x, z: -5.3, w: o.w, d: 5, h: o.h, wall: o.wall, roof: terra, rh: 1.4, chimney: i % 2 === 0, ownWin: true, door: o.shop ? null : (i % 2 ? -1.2 : 1.2),
      windows: o.shop ? [] : [[i % 2 ? .6 : -.6, lo + .1], [i % 2 ? 1.6 : -1.6, lo + .1]], upper: [[-1.2, up], [0, up], [1.2, up]] });
    scene.add(g); g.userData.windows.forEach((q, j) => wins.push({ q, i, j, on: .35 + h2(i, j, 3) * 5.4 }));
    if (o.shop) {   // Barba Negra as it is: black fascia with white letters + logo, small left window, glass door, pole, big right window, stone base, barrels outside
      const glass = new THREE.MeshStandardMaterial({ color: '#0d1626', roughness: .15, metalness: .4, emissive: '#1b2e52', emissiveIntensity: .25 });
      const FZ = -2.78, dx = -.55;
      const stoneM = new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: .6 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, .45, .1).translate(o.x, .225, FZ + .03), stoneM); scene.add(base);
      for (const [x, w, y0] of [[-1.6, 1.0, .45], [1.25, 1.75, .45]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.85 - y0 + .45), glass); p.position.set(o.x + x, y0 + (1.85 - y0 + .45) / 2, FZ); scene.add(p); const f = box(w + .06, .05, .08, mats().beam, { cast: false }); f.position.set(o.x + x, y0, FZ + .02); scene.add(f); }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 2.15), glass); door.position.set(o.x + dx, 1.075, FZ); scene.add(door);
      for (const x of [dx - .47, dx + .47]) { const j = box(.06, 2.2, .08, mats().beam, { cast: false }); j.position.set(o.x + x, 0, FZ + .02); scene.add(j); }
      for (const x of [-2.15, .0, 2.15]) { const pil = new THREE.Mesh(new THREE.BoxGeometry(x === 0 ? .55 : .12, 2.3, .14).translate(o.x + (x === 0 ? .2 : x), 1.15, FZ + .05), stoneM); scene.add(pil); }
      // fascia: BARBA NEGRA in white serif, the logo at the left, BAR(BEARIA) underneath
      const lg = new Image(); lg.src = 'refs/logo-barba-negra-px.png';
      const bc = document.createElement('canvas'); bc.width = 176; bc.height = 24; const bg = bc.getContext('2d');
      const drawBoard = () => { bg.fillStyle = '#0b0b0d'; bg.fillRect(0, 0, 176, 24); if (lg.complete && lg.width) bg.drawImage(lg, 14, 1, 17, 22); bg.fillStyle = '#f2f0ea'; bg.font = '13px Georgia, serif'; bg.textBaseline = 'top'; bg.fillText('BARBA NEGRA', 46, 2); bg.font = '6px Georgia, serif'; bg.fillText('BAR(BEARIA)', 128, 16); bt.needsUpdate = true; };
      const bt = texOf(bc); lg.onload = drawBoard; drawBoard();
      const board = new THREE.Mesh(new THREE.BoxGeometry(4.5, .62, .14), [mats().beam, mats().beam, mats().beam, mats().beam, new THREE.MeshStandardMaterial({ map: bt, emissive: '#ffffff', emissiveMap: bt, emissiveIntensity: .5 }), mats().beam]); board.position.set(o.x, 2.62, FZ + .12); scene.add(board);
      const pc = document.createElement('canvas'); pc.width = 8; pc.height = 32; const pg = pc.getContext('2d'); for (let y = 0; y < 32; y++) for (let x = 0; x < 8; x++) { pg.fillStyle = ['#e8e2d6', '#c0261f', '#2a4ab0'][((x + y) >> 2) % 3]; pg.fillRect(x, y, 1, 1); }
      const ptx = texOf(pc); ptx.wrapS = ptx.wrapT = THREE.RepeatWrapping; shopPole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .6, 12), new THREE.MeshStandardMaterial({ map: ptx, emissive: '#ffffff', emissiveMap: ptx, emissiveIntensity: .45 })); shopPole.position.set(o.x + .2, 1.75, FZ + .22); scene.add(shopPole);
      for (const y of [1.42, 2.08]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .07, 12), new THREE.MeshStandardMaterial({ color: '#1a1a1e', metalness: .6, roughness: .4 })); cap.position.set(o.x + .2, y, FZ + .22); scene.add(cap); }
      const barrelM = new THREE.MeshStandardMaterial({ color: '#131315', roughness: .4, metalness: .35 });
      for (const x of [-1.75, .35, 2.0]) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .8, 14).translate(0, .4, 0), barrelM); br.position.set(o.x + x, 0, -2.42); br.castShadow = br.receiveShadow = true; scene.add(br); }
      for (const x of [.9, 1.35]) { const st = new THREE.Group(); st.position.set(o.x + x, 0, -2.45); st.add(new THREE.Mesh(new THREE.BoxGeometry(.28, .04, .28).translate(0, .5, 0), barrelM)); for (const [a, c] of [[-.11, -.11], [.11, -.11], [-.11, .11], [.11, .11]]) st.add(new THREE.Mesh(new THREE.BoxGeometry(.035, .5, .035).translate(a, .25, c), barrelM)); st.traverse(m => m.castShadow = true); scene.add(st); }
      shopGlass = glass; shopX = o.x + dx;
      doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(.12, 2.0), new THREE.MeshBasicMaterial({ color: '#4ff0ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); doorGlow.position.set(o.x + dx + .4, 1.05, FZ + .01); scene.add(doorGlow);
    }
  });
  // lamp posts (warm) + street trees
  const lamps = [];
  const postM = new THREE.MeshStandardMaterial({ color: '#1a1a22', roughness: .6, metalness: .5 });
  for (const x of [-10.5, -2, 6.5]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 3.6, 8).translate(0, 1.8, 0), postM); p.position.set(x, 0, -.35); p.castShadow = true; scene.add(p);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.32, .36, .32), new THREE.MeshStandardMaterial({ color: '#2a2210', emissive: '#ffb860', emissiveIntensity: 2.2 })); head.position.set(x, 3.75, -.35); scene.add(head);
    const L = new THREE.PointLight('#ffae5a', 6, 9, 1.7); L.position.set(x, 3.4, .1); scene.add(L);
    const gl = glow('#ffb870', 1.6, 1.1); gl.position.set(x, 3.75, -.25); scene.add(gl); lamps.push({ L, gl, x });
  }
  lamps[1].L.castShadow = true; lamps[1].L.shadow.mapSize.set(512, 512); lamps[1].L.shadow.bias = -.004;
  lamps[2].L.castShadow = true; lamps[2].L.shadow.mapSize.set(512, 512); lamps[2].L.shadow.bias = -.004;
  // trees in the square: pixel canopy billboards
  const tree = (() => { const P = new PX(48, 64), G = ramp(['#0b1a18', '#132a26', '#1d3d34', '#2a5444', '#3c6d55'], .4), Bk = ramp(['#1a120e', '#2e2016', '#45301f']);
    P.fill((x, y) => { const dx = (x - 24) / 22, dy = (y - 26) / 24, r = dx * dx + dy * dy + (fbm(x * .2, y * .2, 3) - .5) * .5; if (r < 1) return G(.75 - dy * .3 - dx * .2 + (fbm(x * .4, y * .4, 5) - .5) * .5, x, y); if (x >= 22 && x <= 26 && y > 40) return Bk(.5 + (x === 22 ? -.3 : 0), x, y); return null; });
    P.outline(.25); return texOf(P.done()); })();
  const treeM = new THREE.MeshLambertMaterial({ map: tree, alphaTest: .5, side: THREE.DoubleSide });
  const trees = [];
  for (const [x, z] of [[-12, 6], [-6.5, 7.5], [1, 6.2], [7.5, 7.8], [12, 6.2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 4).translate(0, 2, 0), treeM); m.position.set(x, 0, z); m.castShadow = true; scene.add(m); trees.push(m); }
  // benches + a small fountain basin in the square
  const stone = mat(plaster(48, 48, { seed: 31, wall: ['#5a5852', '#7c7a72', '#9c998e', '#bdb9ac'] }));
  const basin = mesh(new THREE.CylinderGeometry(1.4, 1.5, .5, 20).translate(0, .25, 0), stone); basin.position.set(-3.5, 0, 9); scene.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), new THREE.MeshStandardMaterial({ color: '#16284a', roughness: .1, metalness: .6 })); water.rotation.x = -Math.PI / 2; water.position.set(-3.5, .45, 9); scene.add(water);

  const hero = makeChar('hero'); hero.root.scale.setScalar(1); scene.add(hero.root);
  const fill = new THREE.PointLight('#9fb4ec', 2.2, 6, 2); scene.add(fill);
  const R = rain(1400, [-22, 0, -4, 22, 14, 14], { speed: 18, len: .7, opacity: .32 }); scene.add(R);
  const splash = particles(160, (i, t, o) => { const k = Math.floor(t * 8 + i * .37), ph = (t * 8 + i * .37) % 1; o.x = -14 + h2(i, k, 2) * 28; o.z = -2.6 + h2(i, k, 5) * 9; o.y = .04 + ph * .08; o.a = (1 - ph) * .5; o.s = .035; o.r = .7; o.g = .8; o.b = 1; }, { soft: 1 });
  scene.add(splash);

  // founder path: walks the sidewalk from the left to the shop door
  const walkX = t => t < 14.2 ? lerp(-11, 6.7, seg(t, 0, 14.2)) : lerp(6.7, 4.55, ss(seg(t, 18.6, 20.8)));
  const coldGlow = new THREE.PointLight('#3ae8ff', 0, 7, 1.4); coldGlow.position.set(shopX + .4, 1.3, -2.2); scene.add(coldGlow);
  const coldG = glow('#5ff0ff', 1.6, 0); coldG.position.set(shopX + .44, 1.1, -2.6); scene.add(coldG);
  const camW = { p: track([[0, [-3, 26, 30]], [6, [-8, 12, 15]], [10.67, [-5.6, 6.2, 6.4]]]), l: track([[0, [-3, 2, -4]], [6, [-7.2, 1.2, -2]], [10.67, [-1.8, 1.0, -1.9]]]) };

  function update(t, shot, cam, post) {
    // windows pop on one by one (on eighth notes)
    for (const w of wins) { const k = clamp((t - Math.round(w.on / (BE8)) * BE8) / .06); w.q.material.emissiveIntensity = 2.4 * (1 - k * .85) * (.9 + .1 * flick(t * .2, w.i + w.j)); w.q.material.color.setScalar(1 - .7 * k); }
    for (const L of lamps) { const f = flick(t * .4, L.x); L.L.intensity = 6 * f; L.gl.material.opacity = .9 * f; }
    const x = walkX(t), walking = t < 14.2 || (t > 18.6 && t < 20.8), back = t >= T.turn;
    hero.root.position.set(x, 0, -1.55);
    const st = Math.floor(t * 7) % 4;
    hero.frame(walking ? ['w0', 'w1', 'w2', 'w3'][st] : t < T.turn ? 'idle0' : t < 18.6 ? (Math.floor(t * 1.2) % 2 ? 'lookBack' : 'idle0') : 'idle0');
    hero.face(cam, back); fill.position.set(x + .4, 1.7, 1.2);
    R.userData.update(t, [-3.5, 0]); splash.userData.update(t);
    // the impossible sound: a cold light wakes up inside the barbershop
    const g = ss(seg(t, T.glow, T.glow + .6)) * (.75 + .25 * Math.sin(t * 7.5) ** 2);
    coldGlow.intensity = 6 * g; coldG.material.opacity = .9 * g; doorGlow.material.opacity = .85 * g; shopGlass.emissive.set('#1b2e52').lerp(new THREE.Color('#1fa8c8'), g * .6);
    shopPole.material.map.offset.y = -t * .35;
    if (shot.id === 'cityWide') { const lt = eio(seg(t, 0, 10.67)) * 10.67; cam.position.set(...camW.p(lt)); cam.lookAt(...camW.l(lt)); cam.fov = 32; }
    else { // lateral track that stops with him, then drifts round toward the light
      const xs = Math.min(x, 6.7), d = ss(seg(t, 15.2, 21.3));
      cam.position.set(lerp(xs - 1.6, 7.6, d), lerp(5.6, 4.4, d), lerp(6.6, 5.0, d)); cam.lookAt(lerp(xs + .8, shopX + .2, d), 1.0, lerp(-1.8, -2.3, d)); cam.fov = 34;
    }
    cam.updateProjectionMatrix();
    for (const tr of trees) tr.rotation.y = Math.atan2(cam.position.x - tr.position.x, cam.position.z - tr.position.z);
    post.dof.focus = cam.position.distanceTo(hero.root.position.clone().setY(.9)); post.dof.aper = shot.id === 'cityWide' ? 420 : 380; post.dof.maxCoc = 18;
    post.bloom.strength = .7; post.bloom.threshold = .7;
  }
  return { scene, update, hero };
}
const BE8 = 60 / 72 / 2;   // an eighth note
